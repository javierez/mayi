import {
  S3Client,
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { getDynamicBucketName } from "~/lib/s3-bucket";

// Validate required environment variables
const requiredEnvVars = {
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
};

// Check if any required environment variables are missing
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required AWS environment variables: ${missingEnvVars.join(", ")}`,
  );
}

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Export S3 client for use in other modules
export { s3Client };

export async function uploadImageToS3(
  file: File,
  referenceNumber: string,
  imageOrder: number,
): Promise<{ imageUrl: string; s3key: string; imageKey: string }> {
  try {
    if (!file) {
      throw new Error("No file provided");
    }

    if (!referenceNumber) {
      throw new Error("No reference number provided");
    }

    // Get dynamic bucket name based on current user's account
    const bucketName = await getDynamicBucketName();

    // Generate a unique filename
    const fileExtension = file.name.split(".").pop();
    if (!fileExtension) {
      throw new Error("Could not determine file extension");
    }

    // Create the S3 key following the existing structure:
    // bucket/referenceNumber/images/image_filename
    const imageKey = `${referenceNumber}/images/image_${imageOrder}_${nanoid(6)}.${fileExtension}`;
    const s3key = `s3://${bucketName}/${imageKey}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: imageKey,
        Body: buffer,
        ContentType: file.type,
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
    console.error("Error uploading to S3:", error);
    throw error;
  }
}

export async function uploadVideoToS3(
  file: File,
  referenceNumber: string,
  videoOrder: number,
): Promise<{ videoUrl: string; s3key: string; videoKey: string }> {
  try {
    if (!file) {
      throw new Error("No file provided");
    }

    if (!referenceNumber) {
      throw new Error("No reference number provided");
    }

    // Get dynamic bucket name based on current user's account
    const bucketName = await getDynamicBucketName();

    // Generate a unique filename
    const fileExtension = file.name.split(".").pop();
    if (!fileExtension) {
      throw new Error("Could not determine file extension");
    }

    // Create the S3 key following the existing structure:
    // bucket/referenceNumber/videos/video_filename
    const videoKey = `${referenceNumber}/videos/video_${videoOrder}_${nanoid(6)}.${fileExtension}`;
    const s3key = `s3://${bucketName}/${videoKey}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: videoKey,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    // Return the video URL and keys
    const videoUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${videoKey}`;
    return {
      videoUrl,
      s3key,
      videoKey,
    };
  } catch (error) {
    console.error("Error uploading video to S3:", error);
    throw error;
  }
}

export async function uploadDocumentToS3(
  file: File,
  referenceNumber: string,
  documentOrder: number,
  documentTag?: string,
  folderType?:
    | "initial-docs"
    | "legal-docs"
    | "certificados"
    | "impuestos-pagos"
    | "contratos"
    | "hipoteca"
    | "visitas"
    | "planos"
    | "others"
    | "carteles"
    | "arras"
    | "documentos-personales",
): Promise<{
  fileUrl: string;
  s3key: string;
  documentKey: string;
  filename: string;
  fileType: string;
  documentTag?: string;
  documentOrder: number;
  folderType?: string;
}> {
  try {
    if (!file) {
      throw new Error("No file provided");
    }
    if (!referenceNumber) {
      throw new Error("No reference number provided");
    }

    // Get dynamic bucket name based on current user's account
    const bucketName = await getDynamicBucketName();

    // Get file extension
    const fileExtension = file.name.split(".").pop();
    if (!fileExtension) {
      throw new Error("Could not determine file extension");
    }

    // Create the S3 key with descriptive naming based on document tag and folder type
    let documentKey: string;
    if (documentTag === "energy_certificate") {
      documentKey = `${referenceNumber}/documents/certificado_energetico_${nanoid(6)}.${fileExtension}`;
    } else if (documentTag === "ficha_propiedad") {
      documentKey = `${referenceNumber}/documents/ficha_propiedad_${nanoid(6)}.${fileExtension}`;
    } else if (folderType) {
      // New folder structure for property documents
      documentKey = `${referenceNumber}/documents/${folderType}/${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}_${nanoid(6)}.${fileExtension}`;
    } else {
      documentKey = `${referenceNumber}/documents/document_${documentOrder}_${nanoid(6)}.${fileExtension}`;
    }
    const s3key = `s3://${bucketName}/${documentKey}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: documentKey,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    // Build the public S3 URL
    const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${documentKey}`;

    return {
      fileUrl,
      s3key,
      documentKey,
      filename: file.name,
      fileType: file.type,
      documentTag,
      documentOrder,
      folderType,
    };
  } catch (error) {
    console.error("Error uploading document to S3:", error);
    throw error;
  }
}

export async function renameS3Folder(
  tempReferenceNumber: string,
  newReferenceNumber: string,
): Promise<
  Array<{
    oldKey: string;
    newKey: string;
    newUrl: string;
    newS3key: string;
  }>
> {
  try {
    if (!tempReferenceNumber || !newReferenceNumber) {
      throw new Error("Both temporary and new reference numbers are required");
    }

    // Get dynamic bucket name based on current user's account
    const bucket = await getDynamicBucketName();
    const results: Array<{
      oldKey: string;
      newKey: string;
      newUrl: string;
      newS3key: string;
    }> = [];

    // List all objects in the temporary folder
    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: `${tempReferenceNumber}/`,
    });

    const listedObjects = await s3Client.send(listCommand);

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      console.log(
        `No objects found in temporary folder: ${tempReferenceNumber}`,
      );
      return results;
    }

    // Copy each object to the new location
    for (const object of listedObjects.Contents) {
      if (!object.Key) continue;

      // Create the new key by replacing the temp reference with the new one
      const newKey = object.Key.replace(
        `${tempReferenceNumber}/`,
        `${newReferenceNumber}/`,
      );

      // Copy the object to the new location
      const copyCommand = new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${object.Key}`,
        Key: newKey,
      });

      await s3Client.send(copyCommand);

      // Delete the original object
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucket,
        Key: object.Key,
      });

      await s3Client.send(deleteCommand);

      // Generate the new URL and S3 key
      const newUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${newKey}`;
      const newS3key = `s3://${bucket}/${newKey}`;

      results.push({
        oldKey: object.Key,
        newKey,
        newUrl,
        newS3key,
      });

      console.log(`Moved ${object.Key} to ${newKey}`);
    }

    console.log(
      `Successfully renamed folder from ${tempReferenceNumber} to ${newReferenceNumber}`,
    );
    return results;
  } catch (error) {
    console.error("Error renaming S3 folder:", error);
    throw error;
  }
}

/**
 * Delete all files in a property's S3 folder (images, videos, documents, etc.)
 * This should be called before deleting a property from the database to clean up storage
 */
export async function deletePropertyS3Folder(
  referenceNumber: string,
): Promise<{
  success: boolean;
  deletedCount: number;
  deletedFiles: string[];
}> {
  try {
    if (!referenceNumber) {
      throw new Error("Reference number is required");
    }

    // Get dynamic bucket name based on current user's account
    const bucket = await getDynamicBucketName();
    const deletedFiles: string[] = [];

    // List all objects in the property folder
    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: `${referenceNumber}/`,
    });

    const listedObjects = await s3Client.send(listCommand);

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      console.log(
        `No S3 objects found for property folder: ${referenceNumber}`,
      );
      return {
        success: true,
        deletedCount: 0,
        deletedFiles: [],
      };
    }

    // Delete each object
    for (const object of listedObjects.Contents) {
      if (!object.Key) continue;

      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucket,
        Key: object.Key,
      });

      await s3Client.send(deleteCommand);
      deletedFiles.push(object.Key);
      console.log(`Deleted S3 object: ${object.Key}`);
    }

    console.log(
      `Successfully deleted ${deletedFiles.length} files from S3 for property: ${referenceNumber}`,
    );

    return {
      success: true,
      deletedCount: deletedFiles.length,
      deletedFiles,
    };
  } catch (error) {
    console.error("Error deleting property S3 folder:", error);
    throw error;
  }
}

/**
 * Generate a presigned URL for direct S3 upload from the client.
 * This bypasses Vercel's 4.5MB request limit by uploading directly to S3.
 *
 * @param key - The S3 key where the file will be uploaded
 * @param contentType - The MIME type of the file
 * @param expiresIn - URL expiration time in seconds (default: 300 = 5 minutes)
 * @returns Presigned URL for PUT request
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300,
): Promise<{ uploadUrl: string; bucket: string }> {
  const bucket = await getDynamicBucketName();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  return { uploadUrl, bucket };
}

/**
 * Generate the document key for S3 storage
 */
export function generateDocumentKey(
  referenceNumber: string,
  folderType: string,
  filename: string,
): string {
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueId = nanoid(8);
  return `${referenceNumber}/documents/${folderType}/${uniqueId}-${sanitizedFilename}`;
}

/**
 * Get the public URL for an S3 object
 */
export async function getS3PublicUrl(key: string): Promise<string> {
  const bucket = await getDynamicBucketName();
  return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * Generate the image key for S3 storage
 */
export function generateImageKey(
  referenceNumber: string,
  imageOrder: number,
  filename: string,
): string {
  const fileExtension = filename.split(".").pop() ?? "jpg";
  const uniqueId = nanoid(6);
  return `${referenceNumber}/images/image_${imageOrder}_${uniqueId}.${fileExtension}`;
}

/**
 * Generate the video key for S3 storage
 */
export function generateVideoKey(
  referenceNumber: string,
  videoOrder: number,
  filename: string,
): string {
  const fileExtension = filename.split(".").pop() ?? "mp4";
  const uniqueId = nanoid(6);
  return `${referenceNumber}/videos/video_${videoOrder}_${uniqueId}.${fileExtension}`;
}

// =============================================================================
// MEMORIA-SPECIFIC S3 FUNCTIONS
// Uses a fixed bucket for the Memoria app (no accountId required)
// =============================================================================

const MEMORIA_BUCKET = process.env.AWS_S3_MEMORIA_BUCKET ?? process.env.AWS_S3_BUCKET ?? "mayi";

/**
 * Generate a presigned URL for Memoria uploads (doesn't require accountId)
 */
export async function generateMemoriaPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300,
): Promise<{ uploadUrl: string; bucket: string }> {
  const command = new PutObjectCommand({
    Bucket: MEMORIA_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  return { uploadUrl, bucket: MEMORIA_BUCKET };
}

/**
 * Get the public URL for a Memoria S3 object
 */
export function getMemoriaS3PublicUrl(key: string): string {
  return `https://${MEMORIA_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * Generate a presigned URL for reading a Memoria S3 object
 * Use this when the bucket doesn't have public read access
 * @param key - The S3 key of the object
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 */
export async function generateMemoriaPresignedReadUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: MEMORIA_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate presigned read URLs for multiple Memoria S3 objects
 * More efficient than calling generateMemoriaPresignedReadUrl for each key
 */
export async function generateMemoriaPresignedReadUrls(
  keys: string[],
  expiresIn = 3600,
): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();

  await Promise.all(
    keys.map(async (key) => {
      const command = new GetObjectCommand({
        Bucket: MEMORIA_BUCKET,
        Key: key,
      });
      const url = await getSignedUrl(s3Client, command, { expiresIn });
      urlMap.set(key, url);
    })
  );

  return urlMap;
}
