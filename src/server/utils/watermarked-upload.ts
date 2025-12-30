"use server";

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { addWatermark, downloadImageBuffer } from "~/lib/watermark";
import type { WatermarkConfig } from "~/types/watermark";
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
