"use server";

import { nanoid } from "nanoid";
import { s3Client } from "~/server/s3";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "~/server/db";
import { accounts, websiteProperties } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import type { BrandAsset } from "~/types/brand";
import { getDynamicBucketName } from "~/lib/s3-bucket";

// Type for account preferences that include branding data
interface AccountPreferences {
  logoTransparent?: string | null;
  logoTransparentS3Key?: string | null;
  logoTransparentImageKey?: string | null;
  colorPalette?: string[] | null;
  brandingUpdatedAt?: string | null;
  [key: string]: unknown; // Allow other preference fields
}

/**
 * Upload brand asset (logo) to S3 with specific folder structure
 * Follows the pattern from uploadImageToS3 but for branding assets
 */
async function uploadBrandAssetToS3(
  file: Blob,
  accountId: string,
  fileType: "original" | "transparent",
  originalFileName: string,
): Promise<{ imageUrl: string; s3key: string; imageKey: string }> {
  try {
    if (!file) {
      throw new Error("No file provided");
    }

    if (!accountId) {
      throw new Error("No account ID provided");
    }

    // Generate file extension based on type
    const timestamp = Date.now();
    const fileExtension =
      fileType === "transparent" ? "png" : getFileExtension(originalFileName);

    // Create the S3 key following the required structure:
    // inmobiliariaacropolis/[accountId]/branding/logo_[type]_[timestamp].[ext]
    // Get dynamic bucket name
    const bucketName = await getDynamicBucketName();

    const imageKey = `branding/logo_${fileType}_${timestamp}_${nanoid(6)}.${fileExtension}`;
    const s3key = `s3://${bucketName}/${imageKey}`;

    // Convert Blob to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: imageKey,
        Body: buffer,
        ContentType:
          file.type ||
          (fileType === "transparent" ? "image/png" : "image/jpeg"),
      }),
    );

    // Return the image URL and keys
    const imageUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
    return {
      imageUrl,
      s3key,
      imageKey,
    };
  } catch (error) {
    console.error("Error uploading brand asset to S3:", error);
    throw error;
  }
}

/**
 * Main function to upload brand assets (original and transparent logos)
 * Updates the account record with logo URLs and color palette
 */
export async function uploadBrandAsset(
  originalFile: Blob,
  transparentFile: Blob,
  accountId: string,
  colorPalette: string[],
  originalFileName: string,
): Promise<BrandAsset> {
  try {
    // 1. Upload original logo to S3
    const originalUpload = await uploadBrandAssetToS3(
      originalFile,
      accountId,
      "original",
      originalFileName,
    );

    // 2. Upload transparent logo to S3
    const transparentUpload = await uploadBrandAssetToS3(
      transparentFile,
      accountId,
      "transparent",
      originalFileName,
    );

    // 3. Update account record in database
    const now = new Date();
    await db
      .update(accounts)
      .set({
        logo: originalUpload.imageUrl,
        // Keep color palette in preferences for now
        preferences: {
          colorPalette: colorPalette,
          brandingUpdatedAt: now.toISOString(),
        },
        updatedAt: now,
      })
      .where(eq(accounts.accountId, BigInt(accountId)));

    // 4. Update or create website config record
    const [existingConfig] = await db
      .select()
      .from(websiteProperties)
      .where(eq(websiteProperties.accountId, BigInt(accountId)));

    if (existingConfig) {
      await db
        .update(websiteProperties)
        .set({
          logo: transparentUpload.imageUrl,
          updatedAt: now,
        })
        .where(eq(websiteProperties.accountId, BigInt(accountId)));
    } else {
      // Create new website config with logo
      await db.insert(websiteProperties).values({
        accountId: BigInt(accountId),
        logo: transparentUpload.imageUrl,
        logotype: "",
        favicon: "",
        socialLinks: JSON.stringify({}),
        seoProps: JSON.stringify({}),
        heroProps: JSON.stringify({}),
        featuredProps: JSON.stringify({}),
        aboutProps: JSON.stringify({}),
        propertiesProps: JSON.stringify({}),
        testimonialProps: JSON.stringify({}),
        contactProps: JSON.stringify({}),
        footerProps: JSON.stringify({}),
        headProps: JSON.stringify({}),
      });
    }

    // 5. Fetch updated account to verify
    const [updatedAccount] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.accountId, BigInt(accountId)));

    if (!updatedAccount) {
      throw new Error("Failed to fetch updated account");
    }

    // 6. Return the brand asset information
    const brandAsset: BrandAsset = {
      id: nanoid(),
      accountId: accountId,
      logoOriginalUrl: originalUpload.imageUrl,
      logoTransparentUrl: transparentUpload.imageUrl,
      colorPalette: colorPalette,
      fileName: originalFileName,
      fileSize: originalFile.size,
      uploadedAt: now,
      updatedAt: now,
    };

    return brandAsset;
  } catch (error) {
    console.error("Error uploading brand asset:", error);
    throw error;
  }
}

/**
 * Delete brand assets from S3 and database
 */
export async function deleteBrandAsset(
  accountId: string,
): Promise<{ success: boolean }> {
  try {
    // 1. Get current account data to find S3 keys
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.accountId, BigInt(accountId)));

    if (!account) {
      throw new Error("Account not found");
    }

    const preferences = account.preferences as AccountPreferences;

    // Get dynamic bucket name for delete operations
    const bucketName = await getDynamicBucketName();

    // 2. Get website config to find transparent logo
    const [websiteConfig] = await db
      .select()
      .from(websiteProperties)
      .where(eq(websiteProperties.accountId, BigInt(accountId)));

    // 3. Delete files from S3 if they exist
    const deletePromises: Promise<unknown>[] = [];

    // Delete original logo (extract key from URL)
    if (account.logo) {
      const originalKey = extractS3KeyFromUrl(account.logo);
      if (originalKey) {
        deletePromises.push(
          s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: originalKey,
            }),
          ),
        );
      }
    }

    // Delete transparent logo from website config
    if (websiteConfig?.logo) {
      const transparentKey = extractS3KeyFromUrl(websiteConfig.logo);
      if (transparentKey) {
        deletePromises.push(
          s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: transparentKey,
            }),
          ),
        );
      }
    }

    // Execute all deletions
    await Promise.all(deletePromises);

    // 4. Update database to remove brand data
    // Keep other preferences but remove brand-related ones
    const cleanedPreferences = { ...preferences };
    delete cleanedPreferences.logoTransparent;
    delete cleanedPreferences.logoTransparentS3Key;
    delete cleanedPreferences.logoTransparentImageKey;
    delete cleanedPreferences.colorPalette;
    delete cleanedPreferences.brandingUpdatedAt;

    await db
      .update(accounts)
      .set({
        logo: null,
        preferences: cleanedPreferences,
        updatedAt: new Date(),
      })
      .where(eq(accounts.accountId, BigInt(accountId)));

    // 5. Update website config to clear logo
    if (websiteConfig) {
      await db
        .update(websiteProperties)
        .set({
          logo: "",
          updatedAt: new Date(),
        })
        .where(eq(websiteProperties.accountId, BigInt(accountId)));
    }

    console.log("Brand asset deleted successfully");
    return { success: true };
  } catch (error) {
    console.error("Error deleting brand asset:", error);
    throw new Error("Failed to delete brand asset");
  }
}

/**
 * Get brand asset information for an account
 */
export async function getBrandAsset(
  accountId: string,
): Promise<BrandAsset | null> {
  try {
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.accountId, BigInt(accountId)));

    if (!account?.logo) {
      return null;
    }

    // Get logo transparent from website_config table
    const [websiteConfig] = await db
      .select()
      .from(websiteProperties)
      .where(eq(websiteProperties.accountId, BigInt(accountId)));

    const preferences = account.preferences as AccountPreferences;

    return {
      id: nanoid(),
      accountId: accountId,
      logoOriginalUrl: account.logo,
      logoTransparentUrl: websiteConfig?.logo ?? "",
      colorPalette: preferences?.colorPalette ?? [],
      fileName: "logo", // We don't store original filename, so use generic
      fileSize: 0, // Not stored in current schema
      uploadedAt: new Date(preferences?.brandingUpdatedAt ?? account.createdAt),
      updatedAt: account.updatedAt,
    };
  } catch (error) {
    console.error("Error getting brand asset:", error);
    throw error;
  }
}

/**
 * Update color palette for an account
 * This allows users to adjust extracted colors to be more appealing
 */
export async function updateColorPalette(
  accountId: string,
  newColorPalette: string[],
): Promise<{ success: boolean; colorPalette: string[] }> {
  try {
    console.log("Updating color palette for account:", accountId);

    // 1. Get current account data
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.accountId, BigInt(accountId)));

    if (!account) {
      throw new Error("Account not found");
    }

    const currentPreferences =
      (account.preferences as AccountPreferences) ?? {};

    // 2. Update preferences with new color palette
    const updatedPreferences: AccountPreferences = {
      ...currentPreferences,
      colorPalette: newColorPalette,
      brandingUpdatedAt: new Date().toISOString(),
    };

    // 3. Update database
    await db
      .update(accounts)
      .set({
        preferences: updatedPreferences,
        updatedAt: new Date(),
      })
      .where(eq(accounts.accountId, BigInt(accountId)));

    console.log("Color palette updated successfully");
    return {
      success: true,
      colorPalette: newColorPalette,
    };
  } catch (error) {
    console.error("Error updating color palette:", error);
    throw new Error("Failed to update color palette");
  }
}

// Helper functions
function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1]! : "jpg";
}

function extractS3KeyFromUrl(url: string): string | null {
  try {
    // Extract key from S3 URL format: https://bucket.s3.region.amazonaws.com/key
    const urlParts = url.split(".com/");
    return urlParts.length > 1 ? (urlParts[1] ?? null) : null;
  } catch {
    return null;
  }
}
