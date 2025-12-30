/**
 * Client-side utility for uploading files using presigned S3 URLs.
 * This bypasses Vercel's 4.5MB serverless function limit by uploading directly to S3.
 */

import {
  getContactDocumentPresignedUrl,
  saveContactDocument,
  getPropertyDocumentPresignedUrl,
  savePropertyDocument,
  createPropertyAndGetPresignedUrl,
  saveFichaEncargoDocument,
} from "~/app/actions/upload";
import type { Document } from "~/lib/data";

/**
 * Upload a file directly to S3 using a presigned URL.
 * Returns the HTTP status code.
 */
async function uploadToS3(file: File, presignedUrl: string): Promise<void> {
  console.log("[presignedUpload] Uploading to S3:", file.name, "Size:", (file.size / 1024 / 1024).toFixed(2), "MB");

  const response = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!response.ok) {
    throw new Error(`S3 upload failed: ${response.status} ${response.statusText}`);
  }

  console.log("[presignedUpload] S3 upload successful");
}

/**
 * Upload a contact document using presigned URL.
 * 1. Gets presigned URL from server
 * 2. Uploads directly to S3 (bypasses Vercel)
 * 3. Saves document record to database
 */
export async function uploadContactDocumentPresigned(
  file: File,
  contactId: bigint,
  folderType: "documentos-personales" | "contratos",
): Promise<Document> {
  console.log("[uploadContactDocumentPresigned] Starting presigned upload for:", file.name);

  // Step 1: Get presigned URL
  const { uploadUrl, documentKey, fileUrl } = await getContactDocumentPresignedUrl(
    file.name,
    file.type,
    contactId,
    folderType,
  );

  // Step 2: Upload directly to S3
  await uploadToS3(file, uploadUrl);

  // Step 3: Save document record to database
  const document = await saveContactDocument(
    file.name,
    file.type,
    fileUrl,
    documentKey,
    contactId,
    folderType,
  );

  console.log("[uploadContactDocumentPresigned] Complete, docId:", document.docId.toString());

  return document;
}

/**
 * Upload a property document using presigned URL.
 */
export async function uploadPropertyDocumentPresigned(
  file: File,
  listingId: bigint,
  propertyId: bigint,
  referenceNumber: string,
  folderType: string,
): Promise<Document> {
  console.log("[uploadPropertyDocumentPresigned] Starting presigned upload for:", file.name);

  // Step 1: Get presigned URL
  const { uploadUrl, documentKey, fileUrl } = await getPropertyDocumentPresignedUrl(
    file.name,
    file.type,
    referenceNumber,
    folderType,
  );

  // Step 2: Upload directly to S3
  await uploadToS3(file, uploadUrl);

  // Step 3: Save document record to database
  const document = await savePropertyDocument(
    file.name,
    file.type,
    fileUrl,
    documentKey,
    listingId,
    propertyId,
    folderType,
  );

  console.log("[uploadPropertyDocumentPresigned] Complete, docId:", document.docId.toString());

  return document;
}

/**
 * Upload a ficha de encargo document using presigned URL.
 * This creates a new property first, then uploads the document.
 */
export async function uploadFichaEncargoPresigned(
  file: File,
): Promise<{
  document: Document;
  propertyId: string;
  listingId: string;
  referenceNumber: string;
}> {
  console.log("[uploadFichaEncargoPresigned] Starting presigned upload for:", file.name);

  // Step 1: Create property and get presigned URL
  const { uploadUrl, documentKey, fileUrl, propertyId, listingId, referenceNumber } =
    await createPropertyAndGetPresignedUrl(file.name, file.type);

  console.log("[uploadFichaEncargoPresigned] Property created:", referenceNumber);

  // Step 2: Upload directly to S3
  await uploadToS3(file, uploadUrl);

  // Step 3: Save document record to database
  const document = await saveFichaEncargoDocument(
    file.name,
    file.type,
    fileUrl,
    documentKey,
    listingId,
    propertyId,
  );

  console.log("[uploadFichaEncargoPresigned] Complete, docId:", document.docId.toString());

  return {
    document,
    propertyId,
    listingId,
    referenceNumber,
  };
}
