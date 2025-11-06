"use server";

import { nanoid } from "nanoid";
import { s3Client } from "~/server/s3";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "~/server/db";
import { websiteProperties } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { getDynamicBucketName } from "~/lib/s3-bucket";

/**
 * Upload hero background image to S3
 */
export async function uploadHeroImage(
  file: Blob,
  accountId: string,
  originalFileName: string,
): Promise<{ imageUrl: string }> {
  try {
    if (!file) {
      throw new Error("No file provided");
    }

    if (!accountId) {
      throw new Error("No account ID provided");
    }

    // Get dynamic bucket name
    const bucketName = await getDynamicBucketName();

    // Delete old hero image from S3 before uploading new one
    const [oldImageConfig] = await db
      .select()
      .from(websiteProperties)
      .where(eq(websiteProperties.accountId, BigInt(accountId)));

    if (oldImageConfig) {
      interface HeroProps {
        backgroundImage?: string;
        backgroundVideo?: string;
        backgroundType?: "image" | "video";
        [key: string]: unknown;
      }

      let existingHeroProps: HeroProps = {};
      try {
        existingHeroProps = JSON.parse(oldImageConfig.heroProps ?? "{}") as HeroProps;
      } catch (e) {
        console.error("Error parsing hero props:", e);
      }

      // Delete old background image if exists
      if (existingHeroProps.backgroundImage) {
        const urlParts = existingHeroProps.backgroundImage.split(".com/");
        const oldS3Key = urlParts.length > 1 ? urlParts[1] : null;

        if (oldS3Key) {
          console.log("Deleting old hero background image from S3:", oldS3Key);
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: oldS3Key,
            }),
          );
        }
      }
    }

    // Generate file extension
    const fileExtension = originalFileName.split(".").pop() ?? "jpg";
    const timestamp = Date.now();

    // Create the S3 key for hero image
    const imageKey = `hero/background_${timestamp}_${nanoid(6)}.${fileExtension}`;

    // Convert Blob to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: imageKey,
        Body: buffer,
        ContentType: file.type || "image/jpeg",
      }),
    );

    // Generate the image URL
    const imageUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;

    // Update website config with new hero image
    const [existingConfig] = await db
      .select()
      .from(websiteProperties)
      .where(eq(websiteProperties.accountId, BigInt(accountId)));

    if (existingConfig) {
      // Parse existing hero props and update backgroundImage
      interface HeroProps {
        backgroundImage?: string;
        backgroundVideo?: string;
        backgroundType?: "image" | "video";
        [key: string]: unknown;
      }

      let heroProps: HeroProps = {};
      try {
        heroProps = JSON.parse(existingConfig.heroProps ?? "{}") as HeroProps;
      } catch (e) {
        console.error("Error parsing hero props:", e);
      }

      const updatedHeroProps: HeroProps = {
        ...heroProps,
        backgroundImage: imageUrl,
        backgroundType: "image",
      };

      await db
        .update(websiteProperties)
        .set({
          heroProps: JSON.stringify(updatedHeroProps),
          updatedAt: new Date(),
        })
        .where(eq(websiteProperties.accountId, BigInt(accountId)));
    }

    return { imageUrl };
  } catch (error) {
    console.error("Error uploading hero image:", error);
    throw error;
  }
}

/**
 * Upload hero background video to S3
 */
export async function uploadHeroVideo(
  file: Blob,
  accountId: string,
  originalFileName: string,
): Promise<{ videoUrl: string }> {
  try {
    if (!file) {
      throw new Error("No file provided");
    }

    if (!accountId) {
      throw new Error("No account ID provided");
    }

    // Get dynamic bucket name
    const bucketName = await getDynamicBucketName();

    // Delete old hero video from S3 before uploading new one
    const [oldVideoConfig] = await db
      .select()
      .from(websiteProperties)
      .where(eq(websiteProperties.accountId, BigInt(accountId)));

    if (oldVideoConfig) {
      interface HeroProps {
        backgroundImage?: string;
        backgroundVideo?: string;
        backgroundType?: "image" | "video";
        [key: string]: unknown;
      }

      let existingHeroProps: HeroProps = {};
      try {
        existingHeroProps = JSON.parse(oldVideoConfig.heroProps ?? "{}") as HeroProps;
      } catch (e) {
        console.error("Error parsing hero props:", e);
      }

      // Delete old background video if exists
      if (existingHeroProps.backgroundVideo) {
        const urlParts = existingHeroProps.backgroundVideo.split(".com/");
        const oldS3Key = urlParts.length > 1 ? urlParts[1] : null;

        if (oldS3Key) {
          console.log("Deleting old hero background video from S3:", oldS3Key);
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: oldS3Key,
            }),
          );
        }
      }
    }

    // Generate file extension
    const fileExtension = originalFileName.split(".").pop() ?? "mp4";
    const timestamp = Date.now();

    // Create the S3 key for hero video
    const videoKey = `hero/background_${timestamp}_${nanoid(6)}.${fileExtension}`;

    // Convert Blob to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: videoKey,
        Body: buffer,
        ContentType: file.type || "video/mp4",
      }),
    );

    // Generate the video URL
    const videoUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${videoKey}`;

    // Update website config with new hero video
    const [existingConfig] = await db
      .select()
      .from(websiteProperties)
      .where(eq(websiteProperties.accountId, BigInt(accountId)));

    if (existingConfig) {
      // Parse existing hero props and update backgroundVideo
      interface HeroProps {
        backgroundImage?: string;
        backgroundVideo?: string;
        backgroundType?: "image" | "video";
        [key: string]: unknown;
      }

      let heroProps: HeroProps = {};
      try {
        heroProps = JSON.parse(existingConfig.heroProps ?? "{}") as HeroProps;
      } catch (e) {
        console.error("Error parsing hero props:", e);
      }

      const updatedHeroProps: HeroProps = {
        ...heroProps,
        backgroundVideo: videoUrl,
        backgroundType: "video",
      };

      await db
        .update(websiteProperties)
        .set({
          heroProps: JSON.stringify(updatedHeroProps),
          updatedAt: new Date(),
        })
        .where(eq(websiteProperties.accountId, BigInt(accountId)));
    }

    return { videoUrl };
  } catch (error) {
    console.error("Error uploading hero video:", error);
    throw error;
  }
}

/**
 * Delete hero background image from S3
 */
export async function deleteHeroImage(
  accountId: string,
): Promise<{ success: boolean }> {
  try {
    // Get current config to find image URL
    const [config] = await db
      .select()
      .from(websiteProperties)
      .where(eq(websiteProperties.accountId, BigInt(accountId)));

    if (!config) {
      throw new Error("Website config not found");
    }

    // Parse hero props to get background image
    interface HeroProps {
      backgroundImage?: string;
      backgroundVideo?: string;
      backgroundType?: "image" | "video";
      [key: string]: unknown;
    }

    let heroProps: HeroProps = {};
    try {
      heroProps = JSON.parse(config.heroProps ?? "{}") as HeroProps;
    } catch (e) {
      console.error("Error parsing hero props:", e);
    }

    if (heroProps.backgroundImage) {
      // Get dynamic bucket name
      const bucketName = await getDynamicBucketName();

      // Extract S3 key from URL
      const urlParts = heroProps.backgroundImage.split(".com/");
      const s3Key = urlParts.length > 1 ? urlParts[1] : null;

      // Delete from S3 if key exists
      if (s3Key) {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
          }),
        );
      }

      // Update database to remove background image
      const updatedHeroProps: HeroProps = { ...heroProps };
      delete updatedHeroProps.backgroundImage;
      if (updatedHeroProps.backgroundType === "image") {
        delete updatedHeroProps.backgroundType;
      }

      await db
        .update(websiteProperties)
        .set({
          heroProps: JSON.stringify(updatedHeroProps),
          updatedAt: new Date(),
        })
        .where(eq(websiteProperties.accountId, BigInt(accountId)));
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting hero image:", error);
    throw new Error("Failed to delete hero image");
  }
}

/**
 * Delete hero background video from S3
 */
export async function deleteHeroVideo(
  accountId: string,
): Promise<{ success: boolean }> {
  try {
    // Get current config to find video URL
    const [config] = await db
      .select()
      .from(websiteProperties)
      .where(eq(websiteProperties.accountId, BigInt(accountId)));

    if (!config) {
      throw new Error("Website config not found");
    }

    // Parse hero props to get background video
    interface HeroProps {
      backgroundImage?: string;
      backgroundVideo?: string;
      backgroundType?: "image" | "video";
      [key: string]: unknown;
    }

    let heroProps: HeroProps = {};
    try {
      heroProps = JSON.parse(config.heroProps ?? "{}") as HeroProps;
    } catch (e) {
      console.error("Error parsing hero props:", e);
    }

    if (heroProps.backgroundVideo) {
      // Get dynamic bucket name
      const bucketName = await getDynamicBucketName();

      // Extract S3 key from URL
      const urlParts = heroProps.backgroundVideo.split(".com/");
      const s3Key = urlParts.length > 1 ? urlParts[1] : null;

      // Delete from S3 if key exists
      if (s3Key) {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
          }),
        );
      }

      // Update database to remove background video
      const updatedHeroProps: HeroProps = { ...heroProps };
      delete updatedHeroProps.backgroundVideo;
      if (updatedHeroProps.backgroundType === "video") {
        delete updatedHeroProps.backgroundType;
      }

      await db
        .update(websiteProperties)
        .set({
          heroProps: JSON.stringify(updatedHeroProps),
          updatedAt: new Date(),
        })
        .where(eq(websiteProperties.accountId, BigInt(accountId)));
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting hero video:", error);
    throw new Error("Failed to delete hero video");
  }
}
