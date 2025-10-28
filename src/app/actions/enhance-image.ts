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
  downloadImageAsBuffer,
  generateEnhancedImageFilename,
  getFileExtensionFromUrl,
} from "~/lib/image-utils";
import { getDynamicBucketName } from "~/lib/s3-bucket";

/**
 * Upload enhanced image to S3 and create database record
 * Follows the same pattern as uploadPropertyImage but for enhanced images
 */
export async function uploadEnhancedImageToS3(
  enhancedImageUrl: string,
  propertyId: bigint,
  referenceNumber: string,
  imageOrder: number,
  originImageId?: bigint,
): Promise<PropertyImage> {
  try {
    // 1. Download the enhanced image from Freepik's CDN
    const imageBuffer = await downloadImageAsBuffer(enhancedImageUrl);

    // 2. Generate the S3 key for the enhanced image
    const fileExtension = getFileExtensionFromUrl(enhancedImageUrl);
    const imageKey = generateEnhancedImageFilename(
      referenceNumber,
      imageOrder,
      nanoid(6),
      fileExtension,
    );

    // Get dynamic bucket name
    const bucketName = await getDynamicBucketName();
    const s3key = `s3://${bucketName}/${imageKey}`;

    // 3. Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: imageKey,
        Body: imageBuffer,
        ContentType: `image/${fileExtension === "jpg" ? "jpeg" : fileExtension}`,
      }),
    );

    // 4. Generate the public URL
    const imageUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;

    // 5. Create database record with ai_enhanced tag
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
      imageTag: "ai_enhanced", // Mark as AI enhanced for future reference
      ...(originImageId !== undefined && { originImageId }),
    };

    const result = await createPropertyImage(imageData);

    if (!result) {
      throw new Error("Failed to create enhanced property image record");
    }

    // 6. Fetch the complete image record
    const propertyImage = await getPropertyImageById(result.propertyImageId);
    if (!propertyImage) {
      throw new Error("Failed to fetch created enhanced property image");
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
    };

    return typedPropertyImage;
  } catch (error) {
    console.error("Error uploading enhanced image to S3:", error);
    throw new Error(
      `Failed to upload enhanced image: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Create an enhanced property image record from a File object
 * Used when we have the enhanced image as a File (alternative to URL-based upload)
 */
export async function createEnhancedPropertyImageFromFile(
  file: File,
  propertyId: bigint,
  referenceNumber: string,
  imageOrder: number,
  originImageId?: bigint,
): Promise<PropertyImage> {
  try {
    // 1. Generate the S3 key for the enhanced image
    const fileExtension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const imageKey = generateEnhancedImageFilename(
      referenceNumber,
      imageOrder,
      nanoid(6),
      fileExtension,
    );

    // Get dynamic bucket name
    const bucketName = await getDynamicBucketName();
    const s3key = `s3://${bucketName}/${imageKey}`;

    // 2. Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: imageKey,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    // 4. Generate the public URL
    const imageUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;

    // 5. Create database record with ai_enhanced tag
    console.log("🚀 Creating enhanced property image database record:", {
      propertyId: propertyId.toString(),
      referenceNumber,
      imageUrl,
      imageKey,
      s3key,
      imageOrder,
      imageTag: "ai_enhanced",
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
      imageTag: "ai_enhanced", // Mark as AI enhanced
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
      console.error("❌ Failed to create enhanced property image record");
      throw new Error("Failed to create enhanced property image record");
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
      console.error("❌ Failed to fetch created enhanced property image");
      throw new Error("Failed to fetch created enhanced property image");
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
    };

    return typedPropertyImage;
  } catch (error) {
    console.error("Error creating enhanced property image from file:", error);
    throw new Error(
      `Failed to create enhanced property image: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
