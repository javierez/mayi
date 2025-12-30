"use server";

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { createHash } from "crypto";
import { addWatermark, downloadImageBuffer } from "~/lib/watermark";
import type { WatermarkConfig, WatermarkManifest } from "~/types/watermark";
import { getDynamicBucketName } from "~/lib/s3-bucket";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Upload a watermarked image to S3 for temporary use
 * Uses a special naming pattern to identify watermarked images
 */
export async function uploadWatermarkedImageToS3(
  originalImageUrl: string,
  watermarkConfig: WatermarkConfig,
  referenceNumber: string,
  imageOrder: number,
): Promise<{
  watermarkedUrl: string;
  watermarkedKey: string;
  success: boolean;
  error?: string;
}> {
  try {
    // Download the original image
    const imageDownload = await downloadImageBuffer(originalImageUrl);
    if (!imageDownload.success || !imageDownload.buffer) {
      return {
        success: false,
        watermarkedUrl: originalImageUrl,
        watermarkedKey: "",
        error: `Failed to download original image: ${imageDownload.error}`,
      };
    }

    // Apply watermark
    const watermarkResult = await addWatermark(
      imageDownload.buffer,
      watermarkConfig.logoUrl,
      watermarkConfig.position,
      watermarkConfig.size,
      watermarkConfig.opacity,
    );

    if (!watermarkResult.success || !watermarkResult.imageBuffer) {
      return {
        success: false,
        watermarkedUrl: originalImageUrl,
        watermarkedKey: "",
        error: `Failed to apply watermark: ${watermarkResult.error}`,
      };
    }

    // Create S3 key with watermarked identifier
    // Pattern: referenceNumber/watermarked/image_order.jpg (deterministic for overwrite)
    const watermarkedKey = `${referenceNumber}/watermarked/image_${imageOrder}.jpg`;

    // Get dynamic bucket name
    const bucketName = await getDynamicBucketName();

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: watermarkedKey,
        Body: watermarkResult.imageBuffer,
        ContentType: "image/jpeg",
        Metadata: {
          "original-url": originalImageUrl,
          watermarked: "true",
          temporary: "true",
        },
      }),
    );

    // Generate the public URL
    const watermarkedUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${watermarkedKey}`;

    console.log(`Uploaded watermarked image to S3: ${watermarkedKey}`);

    return {
      success: true,
      watermarkedUrl,
      watermarkedKey,
    };
  } catch (error) {
    console.error("Error uploading watermarked image to S3:", error);
    return {
      success: false,
      watermarkedUrl: originalImageUrl,
      watermarkedKey: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Process multiple images with watermarking and S3 upload
 * Returns S3 URLs for watermarked images
 */
export async function processAndUploadWatermarkedImages(
  images: Array<{ imageUrl: string; imageOrder?: number }>,
  watermarkConfig: WatermarkConfig,
  referenceNumber: string,
): Promise<
  Array<{
    imageUrl: string;
    watermarked: boolean;
    watermarkedKey?: string;
    error?: string;
    imageOrder?: number;
  }>
> {
  if (!watermarkConfig.enabled || !watermarkConfig.logoUrl) {
    // Return original images if watermarking is disabled
    return images.map((img) => ({ ...img, watermarked: false }));
  }

  console.log(
    `Processing and uploading ${images.length} watermarked images to S3`,
  );

  const results = await Promise.all(
    images.map(async (image) => {
      const result = await uploadWatermarkedImageToS3(
        image.imageUrl,
        watermarkConfig,
        referenceNumber,
        image.imageOrder ?? 1,
      );

      if (result.success) {
        return {
          imageUrl: result.watermarkedUrl, // Use the S3 URL
          watermarked: true,
          watermarkedKey: result.watermarkedKey,
          imageOrder: image.imageOrder,
        };
      } else {
        console.warn(
          `Failed to watermark image ${image.imageUrl}:`,
          result.error,
        );
        return {
          imageUrl: image.imageUrl, // Fallback to original
          watermarked: false,
          error: result.error,
          imageOrder: image.imageOrder,
        };
      }
    }),
  );

  const successCount = results.filter((r) => r.watermarked).length;
  console.log(
    `Watermarking completed: ${successCount}/${images.length} images uploaded to S3`,
  );

  return results;
}

/**
 * Clean up temporary watermarked images from S3
 * Should be called after successful Fotocasa upload
 */
export async function cleanupWatermarkedImages(
  watermarkedKeys: string[],
): Promise<{ success: boolean; deletedCount: number; errors: string[] }> {
  if (watermarkedKeys.length === 0) {
    return { success: true, deletedCount: 0, errors: [] };
  }

  console.log(
    `Cleaning up ${watermarkedKeys.length} temporary watermarked images from S3`,
  );

  const errors: string[] = [];
  let deletedCount = 0;

  // Get dynamic bucket name
  const bucketName = await getDynamicBucketName();

  // Delete each watermarked image
  await Promise.all(
    watermarkedKeys.map(async (key) => {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
          }),
        );
        deletedCount++;
        console.log(`Deleted watermarked image: ${key}`);
      } catch (error) {
        const errorMessage = `Failed to delete ${key}: ${error instanceof Error ? error.message : "Unknown error"}`;
        console.error(errorMessage);
        errors.push(errorMessage);
      }
    }),
  );

  return {
    success: errors.length === 0,
    deletedCount,
    errors,
  };
}

/**
 * Clean up all watermarked images for a reference number
 * Useful for cleanup after errors or cancellations
 */
export async function cleanupAllWatermarkedImagesForReference(
  referenceNumber: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // List all objects in the watermarked folder
    const { ListObjectsV2Command } = await import("@aws-sdk/client-s3");

    // Get dynamic bucket name
    const bucketName = await getDynamicBucketName();

    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: `${referenceNumber}/watermarked/`,
    });

    const listedObjects = await s3Client.send(listCommand);

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      return {
        success: true,
        message: "No watermarked images found to clean up",
      };
    }

    // Delete all watermarked images
    const keys = listedObjects.Contents.map((obj) => obj.Key).filter(
      (key): key is string => key !== undefined,
    );

    const result = await cleanupWatermarkedImages(keys);

    return {
      success: result.success,
      message: `Cleaned up ${result.deletedCount} watermarked images`,
    };
  } catch (error) {
    console.error("Error cleaning up watermarked images:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to clean up watermarked images",
    };
  }
}

// ============================================
// MANIFEST-BASED CACHING
// ============================================

/**
 * Generate a hash of watermark config for change detection
 */
function hashWatermarkConfig(config: WatermarkConfig): string {
  const configString = JSON.stringify({
    logoUrl: config.logoUrl,
    position: config.position,
    size: config.size ?? 30,
    opacity: config.opacity ?? 0.8,
  });
  return createHash("md5").update(configString).digest("hex");
}

/**
 * Build the watermarked image URL from reference number and order
 */
function buildWatermarkedUrl(
  bucketName: string,
  referenceNumber: string,
  imageOrder: number,
): string {
  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${referenceNumber}/watermarked/image_${imageOrder}.jpg`;
}

/**
 * Read watermark manifest from S3
 * Returns null if manifest doesn't exist or is invalid
 */
async function readWatermarkManifest(
  referenceNumber: string,
): Promise<WatermarkManifest | null> {
  try {
    const bucketName = await getDynamicBucketName();
    const manifestKey = `${referenceNumber}/watermarked/manifest.json`;

    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: manifestKey,
      }),
    );

    if (!response.Body) {
      return null;
    }

    const bodyString = await response.Body.transformToString();
    const manifest = JSON.parse(bodyString) as WatermarkManifest;

    // Basic validation
    if (!manifest.watermarkConfigHash || !Array.isArray(manifest.images)) {
      console.warn(`Invalid manifest for ${referenceNumber}, will rebuild`);
      return null;
    }

    return manifest;
  } catch (error) {
    // NoSuchKey is expected for new listings
    if ((error as { name?: string }).name === "NoSuchKey") {
      return null;
    }
    console.warn(`Failed to read manifest for ${referenceNumber}:`, error);
    return null;
  }
}

/**
 * Write watermark manifest to S3
 */
async function writeWatermarkManifest(
  referenceNumber: string,
  manifest: WatermarkManifest,
): Promise<void> {
  try {
    const bucketName = await getDynamicBucketName();
    const manifestKey = `${referenceNumber}/watermarked/manifest.json`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: manifestKey,
        Body: JSON.stringify(manifest, null, 2),
        ContentType: "application/json",
      }),
    );

    console.log(`Wrote watermark manifest for ${referenceNumber}`);
  } catch (error) {
    console.error(`Failed to write manifest for ${referenceNumber}:`, error);
    // Non-fatal - caching will just not work for this listing
  }
}

/**
 * Compare current images with manifest to check if they match
 */
function imagesMatch(
  currentImages: Array<{ imageUrl: string; imageOrder: number }>,
  manifest: WatermarkManifest,
): boolean {
  if (currentImages.length !== manifest.images.length) {
    return false;
  }

  // Sort both by order for comparison
  const sortedCurrent = [...currentImages].sort(
    (a, b) => a.imageOrder - b.imageOrder,
  );
  const sortedManifest = [...manifest.images].sort(
    (a, b) => a.order - b.order,
  );

  for (let i = 0; i < sortedCurrent.length; i++) {
    const current = sortedCurrent[i];
    const cached = sortedManifest[i];
    if (
      !current ||
      !cached ||
      current.imageOrder !== cached.order ||
      current.imageUrl !== cached.originalUrl
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Process watermarked images with caching
 * Reuses existing watermarked images if nothing has changed
 */
export async function processWatermarkedImagesWithCache(
  images: Array<{ imageUrl: string; imageOrder: number }>,
  watermarkConfig: WatermarkConfig,
  referenceNumber: string,
): Promise<
  Array<{
    imageUrl: string;
    watermarked: boolean;
    watermarkedKey?: string;
    error?: string;
    imageOrder: number;
  }>
> {
  // If watermarking disabled, return originals
  if (!watermarkConfig.enabled || !watermarkConfig.logoUrl) {
    return images.map((img) => ({
      imageUrl: img.imageUrl,
      watermarked: false,
      imageOrder: img.imageOrder,
    }));
  }

  const configHash = hashWatermarkConfig(watermarkConfig);
  const manifest = await readWatermarkManifest(referenceNumber);
  const bucketName = await getDynamicBucketName();

  // Check if we can reuse existing watermarked images
  if (manifest && manifest.watermarkConfigHash === configHash) {
    if (imagesMatch(images, manifest)) {
      console.log(
        `Reusing cached watermarked images for ${referenceNumber} (${images.length} images)`,
      );
      return images.map((img) => ({
        imageUrl: buildWatermarkedUrl(bucketName, referenceNumber, img.imageOrder),
        watermarked: true,
        watermarkedKey: `${referenceNumber}/watermarked/image_${img.imageOrder}.jpg`,
        imageOrder: img.imageOrder,
      }));
    }
    console.log(
      `Images changed for ${referenceNumber}, rebuilding watermarks`,
    );
  } else if (manifest) {
    console.log(
      `Watermark config changed for ${referenceNumber}, rebuilding watermarks`,
    );
  }

  // Clean up existing watermarked images before rebuilding
  await cleanupAllWatermarkedImagesForReference(referenceNumber);

  // Process fresh watermarks
  const results = await processAndUploadWatermarkedImages(
    images,
    watermarkConfig,
    referenceNumber,
  );

  // Write new manifest
  await writeWatermarkManifest(referenceNumber, {
    watermarkConfigHash: configHash,
    createdAt: new Date().toISOString(),
    images: images.map((img) => ({
      order: img.imageOrder,
      originalUrl: img.imageUrl,
    })),
  });

  return results.map((r) => ({
    imageUrl: r.imageUrl,
    watermarked: r.watermarked,
    watermarkedKey: r.watermarkedKey,
    error: r.error,
    imageOrder: r.imageOrder ?? 1,
  }));
}
