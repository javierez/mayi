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
import type { RenovationType } from "~/types/gemini";

/**
 * Upload renovated image to S3 and create database record
 * Follows the same pattern as enhanced images but for Gemini-renovated images
 */
export async function uploadRenovatedImageToS3(
  renovatedImageBase64: string,
  propertyId: bigint,
  referenceNumber: string,
  imageOrder: number,
  renovationType?: RenovationType,
  originImageId?: bigint,
): Promise<PropertyImage> {
  try {
    console.log("🔄 Starting uploadRenovatedImageToS3:", {
      base64Length: renovatedImageBase64.length,
      propertyId: propertyId.toString(),
      referenceNumber,
      imageOrder,
      renovationType,
      originImageId: originImageId?.toString() ?? "undefined",
    });

    // 1. Convert base64 to buffer
    console.log("📊 Converting base64 to buffer...");
    const imageBuffer = base64ToBuffer(renovatedImageBase64);
    console.log("✅ Buffer created, size:", imageBuffer.length);

    // 2. Generate the S3 key for the renovated image
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

    // 5. Create image tag with renovation type
    const imageTag = renovationType
      ? `ai_renovated_${renovationType}`
      : "ai_renovated";
    console.log("🏷️ Image tag:", imageTag);

    // 6. Create database record with ai_renovated tag
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
      imageTag, // Mark as AI renovated with type for future reference
      ...(originImageId !== undefined && { originImageId }),
    };

    console.log("📝 Image data to insert:", {
      ...imageData,
      propertyId: imageData.propertyId.toString(),
      originImageId: imageData.originImageId?.toString() ?? "not provided",
    });

    const result = await createPropertyImage(imageData);
    console.log("✅ Database record created:", result ? "success" : "failed");

    if (!result) {
      console.error("❌ Database insert returned null/undefined");
      throw new Error("Failed to create renovated property image record");
    }

    // 7. Fetch the complete image record
    const propertyImage = await getPropertyImageById(result.propertyImageId);
    if (!propertyImage) {
      throw new Error("Failed to fetch created renovated property image");
    }

    // Convert to PropertyImage type, ensuring all required fields are present
    const typedPropertyImage: PropertyImage = {
      propertyImageId: propertyImage.propertyImageId,
      propertyId: propertyImage.propertyId,
      referenceNumber: propertyImage.referenceNumber,
      imageUrl: propertyImage.imageUrl,
      isActive: propertyImage.isActive ?? true,
      createdAt: propertyImage.createdAt,
      updatedAt: propertyImage.updatedAt,
      imageKey: propertyImage.imageKey,
      s3key: propertyImage.s3key,
      imageOrder: propertyImage.imageOrder,
      imageTag: propertyImage.imageTag ?? undefined,
      originImageId: propertyImage.originImageId ?? undefined,
    };

    console.log("Successfully uploaded renovated image:", {
      propertyImageId: typedPropertyImage.propertyImageId.toString(),
      imageUrl: typedPropertyImage.imageUrl,
      imageTag: typedPropertyImage.imageTag,
      renovationType,
    });

    return typedPropertyImage;
  } catch (error) {
    console.error("❌ CRITICAL ERROR in uploadRenovatedImageToS3:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack",
      propertyId: propertyId?.toString(),
      referenceNumber,
      imageOrder,
      renovationType,
      originImageId: originImageId?.toString(),
    });
    throw new Error(
      `Failed to upload renovated image: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Create a renovated property image record from a Buffer
 * Alternative method for when we have the renovated image as raw buffer data
 */
export async function createRenovatedPropertyImageFromBuffer(
  buffer: Buffer,
  propertyId: bigint,
  referenceNumber: string,
  imageOrder: number,
  renovationType?: RenovationType,
  originImageId?: bigint,
): Promise<PropertyImage> {
  try {
    // 1. Generate the S3 key for the renovated image
    const fileExtension = "jpg"; // Default to JPEG for Gemini images
    const imageKey = generateRenovatedImageFilename(
      referenceNumber,
      imageOrder,
      nanoid(6),
      fileExtension,
    );

    // Get dynamic bucket name
    const bucketName = await getDynamicBucketName();
    const s3key = `s3://${bucketName}/${imageKey}`;

    // 2. Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: imageKey,
        Body: buffer,
        ContentType: "image/jpeg",
      }),
    );

    // 3. Generate the public URL
    const imageUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;

    // 4. Create image tag with renovation type
    const imageTag = renovationType
      ? `ai_renovated_${renovationType}`
      : "ai_renovated";

    // 5. Create database record with ai_renovated tag
    console.log("🚀 Creating renovated property image database record:", {
      propertyId: propertyId.toString(),
      referenceNumber,
      imageUrl,
      imageKey,
      s3key,
      imageOrder,
      imageTag,
      renovationType: renovationType ?? "generic",
    });

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
      imageTag, // Mark as AI renovated
      ...(originImageId !== undefined && { originImageId }),
    };

    const result = await createPropertyImage(imageData);

    console.log(
      "✅ Database record created:",
      result
        ? {
            propertyImageId: result.propertyImageId.toString(),
            success: true,
          }
        : { success: false },
    );

    if (!result) {
      console.error("❌ Failed to create renovated property image record");
      throw new Error("Failed to create renovated property image record");
    }

    // 6. Fetch the complete image record
    console.log(
      "📖 Fetching complete image record with ID:",
      result.propertyImageId.toString(),
    );
    const propertyImage = await getPropertyImageById(result.propertyImageId);

    console.log(
      "📋 Fetched property image:",
      propertyImage
        ? {
            propertyImageId: propertyImage.propertyImageId.toString(),
            propertyId: propertyImage.propertyId.toString(),
            referenceNumber: propertyImage.referenceNumber,
            imageUrl: propertyImage.imageUrl,
            imageOrder: propertyImage.imageOrder,
            imageTag: propertyImage.imageTag,
          }
        : { found: false },
    );

    if (!propertyImage) {
      console.error("❌ Failed to fetch created renovated property image");
      throw new Error("Failed to fetch created renovated property image");
    }

    // Convert to PropertyImage type
    const typedPropertyImage: PropertyImage = {
      propertyImageId: propertyImage.propertyImageId,
      propertyId: propertyImage.propertyId,
      referenceNumber: propertyImage.referenceNumber,
      imageUrl: propertyImage.imageUrl,
      isActive: propertyImage.isActive ?? true,
      createdAt: propertyImage.createdAt,
      updatedAt: propertyImage.updatedAt,
      imageKey: propertyImage.imageKey,
      s3key: propertyImage.s3key,
      imageOrder: propertyImage.imageOrder,
      imageTag: propertyImage.imageTag ?? undefined,
      originImageId: propertyImage.originImageId ?? undefined,
    };

    return typedPropertyImage;
  } catch (error) {
    console.error(
      "Error creating renovated property image from buffer:",
      error,
    );
    throw new Error(
      `Failed to create renovated property image: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
