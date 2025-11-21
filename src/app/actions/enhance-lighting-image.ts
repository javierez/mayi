"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import { s3Client } from "~/server/s3";
import {
  createPropertyImage,
  getPropertyImageById,
} from "~/server/queries/property_images";
import type { PropertyImage } from "~/lib/data";
import {
  base64ToBuffer,
  generateRenovatedImageFilename,
} from "~/lib/image-utils";
import { getDynamicBucketName } from "~/lib/s3-bucket";

/**
 * Upload lighting-enhanced image to S3 and create database record
 * Follows the same pattern as renovated images but for lighting enhancement
 */
export async function uploadEnhancedLightingImageToS3(
  enhancedImageBase64: string,
  propertyId: bigint,
  referenceNumber: string,
  imageOrder: number,
  originImageId?: bigint,
): Promise<PropertyImage> {
  try {
    console.log("🔄 Starting uploadEnhancedLightingImageToS3:", {
      base64Length: enhancedImageBase64.length,
      propertyId: propertyId.toString(),
      referenceNumber,
      imageOrder,
      originImageId: originImageId?.toString() ?? "undefined",
    });

    // 1. Convert base64 to buffer
    console.log("📊 Converting base64 to buffer...");
    const imageBuffer = base64ToBuffer(enhancedImageBase64);
    console.log("✅ Buffer created, size:", imageBuffer.length);

    // 2. Generate the S3 key for the enhanced lighting image
    console.log("🔑 Generating S3 key...");
    const fileExtension = "jpg"; // Gemini typically returns JPEG
    const imageKey = generateRenovatedImageFilename(
      referenceNumber,
      imageOrder,
      nanoid(6),
      fileExtension,
    );
    console.log("✅ S3 key generated:", imageKey);

    // Get dynamic bucket name
    console.log("🪣 Getting bucket name...");
    const bucketName = await getDynamicBucketName();
    const s3key = `s3://${bucketName}/${imageKey}`;
    console.log("✅ Bucket info:", { bucketName, s3key });

    // 3. Upload to S3
    console.log("📤 Uploading to S3...");
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: imageKey,
        Body: imageBuffer,
        ContentType: "image/jpeg",
      }),
    );
    console.log("✅ Successfully uploaded to S3");

    // 4. Generate the public URL
    const imageUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
    console.log("🔗 Public URL generated:", imageUrl);

    // 5. Create image tag
    const imageTag = "ai_enhance_lighting";
    console.log("🏷️ Image tag:", imageTag);

    // 6. Create database record with ai_enhance_lighting tag
    console.log("💾 Creating database record...");
    const imageData: Omit<
      PropertyImage,
      "propertyImageId" | "createdAt" | "updatedAt"
    > = {
      propertyId,
      referenceNumber,
      imageUrl,
      isActive: true,
      imageKey,
      s3key,
      imageOrder,
      imageTag, // Mark as AI enhanced lighting
      ...(originImageId !== undefined && { originImageId }),
    };

    console.log("📝 Image data to insert:", {
      ...imageData,
      propertyId: imageData.propertyId.toString(),
      originImageId: imageData.originImageId?.toString() ?? "not provided",
    });

    const newImage = await createPropertyImage(imageData);
    console.log("✅ Database record created:", newImage ? "success" : "failed");

    if (!newImage) {
      console.error("❌ Database insert returned null/undefined");
      throw new Error("Failed to create enhanced lighting property image record");
    }

    console.log("✅ Database record details:", {
      propertyImageId: newImage.propertyImageId.toString(),
      imageTag: newImage.imageTag,
    });

    // 7. Verify the image was created
    console.log("🔍 Verifying created image...");
    const verifiedImage = await getPropertyImageById(newImage.propertyImageId);
    if (!verifiedImage) {
      throw new Error("Failed to verify created lighting-enhanced image");
    }
    console.log("✅ Image verified");

    console.log("🎉 uploadEnhancedLightingImageToS3 completed successfully");
    return {
      ...verifiedImage,
      isActive: verifiedImage.isActive ?? true,
    } as PropertyImage;
  } catch (error) {
    console.error("❌ ERROR in uploadEnhancedLightingImageToS3:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
      context: {
        propertyId: propertyId?.toString() ?? "undefined",
        referenceNumber,
        imageOrder,
        originImageId: originImageId?.toString() ?? "undefined",
      },
    });

    throw new Error(
      `Failed to upload lighting-enhanced image: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
