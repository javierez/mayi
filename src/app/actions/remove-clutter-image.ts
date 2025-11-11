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
 * Upload decluttered image to S3 and create database record
 * Follows the same pattern as renovated images but for remove clutter
 */
export async function uploadRemoveClutterImageToS3(
  declutteredImageBase64: string,
  propertyId: bigint,
  referenceNumber: string,
  imageOrder: number,
  originImageId?: bigint,
): Promise<PropertyImage> {
  try {
    console.log("🔄 Starting uploadRemoveClutterImageToS3:", {
      base64Length: declutteredImageBase64.length,
      propertyId: propertyId.toString(),
      referenceNumber,
      imageOrder,
      originImageId: originImageId?.toString() ?? "undefined",
    });

    // 1. Convert base64 to buffer
    console.log("📊 Converting base64 to buffer...");
    const imageBuffer = base64ToBuffer(declutteredImageBase64);
    console.log("✅ Buffer created, size:", imageBuffer.length);

    // 2. Generate the S3 key for the decluttered image
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
    const imageTag = "ai_remove_clutter";
    console.log("🏷️ Image tag:", imageTag);

    // 6. Create database record with ai_remove_clutter tag
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
      imageTag, // Mark as AI remove clutter
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
      throw new Error("Failed to create remove clutter property image record");
    }

    // 7. Fetch the complete image record
    const propertyImage = await getPropertyImageById(result.propertyImageId);
    if (!propertyImage) {
      throw new Error("Failed to fetch created remove clutter property image");
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

    console.log("Successfully uploaded remove clutter image:", {
      propertyImageId: typedPropertyImage.propertyImageId.toString(),
      imageUrl: typedPropertyImage.imageUrl,
      imageTag: typedPropertyImage.imageTag,
    });

    return typedPropertyImage;
  } catch (error) {
    console.error("❌ CRITICAL ERROR in uploadRemoveClutterImageToS3:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack",
      propertyId: propertyId?.toString(),
      referenceNumber,
      imageOrder,
      originImageId: originImageId?.toString(),
    });
    throw new Error(
      `Failed to upload remove clutter image: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

