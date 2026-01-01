"use server";

import {
  uploadImageToS3,
  uploadVideoToS3,
  uploadDocumentToS3,
  renameS3Folder,
  generatePresignedUploadUrl,
  generateDocumentKey,
  generateImageKey,
  generateVideoKey,
  getS3PublicUrl,
} from "~/lib/s3";
import {
  createPropertyImage,
  getPropertyImageById,
  updatePropertyImage,
} from "~/server/queries/property_images";
import {
  createDocument,
  getDocumentById,
  updateDocumentOrders,
} from "~/server/queries/document";
import type { PropertyImage, Document } from "~/lib/data";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getDynamicBucketName } from "~/lib/s3-bucket";
import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { propertyImages, documents } from "~/server/db/schema";
import { s3Client } from "~/server/s3";
import { getSecureSession } from "~/lib/dal";

export async function uploadPropertyImage(
  file: File,
  propertyId: bigint,
  referenceNumber: string,
  imageOrder: number,
): Promise<PropertyImage> {
  try {
    // 1. Upload to S3
    const { imageUrl, s3key, imageKey } = await uploadImageToS3(
      file,
      referenceNumber,
      imageOrder,
    );

    // 2. Create record in database
    const result = await createPropertyImage({
      propertyId,
      referenceNumber,
      imageUrl,
      isActive: true,
      imageKey,
      s3key,
      imageOrder,
    });

    if (!result) {
      throw new Error("Failed to create property image record");
    }

    // 3. Fetch the complete image record
    const propertyImage = await getPropertyImageById(result.propertyImageId);
    if (!propertyImage) {
      throw new Error("Failed to fetch created property image");
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
    console.error("Error uploading property image:", error);
    throw error;
  }
}

export async function uploadPropertyVideo(
  file: File,
  propertyId: bigint,
  referenceNumber: string,
  videoOrder: number,
): Promise<PropertyImage> {
  try {
    // 1. Upload to S3
    const { videoUrl, s3key, videoKey } = await uploadVideoToS3(
      file,
      referenceNumber,
      videoOrder,
    );

    // 2. Create record in database with imageTag = 'video'
    const result = await createPropertyImage({
      propertyId,
      referenceNumber,
      imageUrl: videoUrl, // Store video URL in imageUrl field
      isActive: true,
      imageKey: videoKey,
      s3key,
      imageOrder: 99, // Non-image media always goes to order 99
      imageTag: "video", // This is the key difference
    });

    if (!result) {
      throw new Error("Failed to create property video record");
    }

    // 3. Fetch the complete video record
    const propertyVideo = await getPropertyImageById(result.propertyImageId);
    if (!propertyVideo) {
      throw new Error("Failed to fetch created property video");
    }

    // Convert to PropertyImage type, ensuring all required fields are present
    const typedPropertyVideo: PropertyImage = {
      propertyImageId: propertyVideo.propertyImageId,
      propertyId: propertyVideo.propertyId,
      referenceNumber: propertyVideo.referenceNumber,
      imageUrl: propertyVideo.imageUrl,
      isActive: propertyVideo.isActive ?? true,
      createdAt: propertyVideo.createdAt,
      updatedAt: propertyVideo.updatedAt,
      imageKey: propertyVideo.imageKey,
      s3key: propertyVideo.s3key,
      imageOrder: propertyVideo.imageOrder,
      imageTag: propertyVideo.imageTag ?? undefined,
    };

    return typedPropertyVideo;
  } catch (error) {
    console.error("Error uploading property video:", error);
    throw error;
  }
}

export async function deletePropertyImage(
  imageKey: string,
  propertyId: bigint,
) {
  "use server";

  try {
    // Get dynamic bucket name
    const bucketName = await getDynamicBucketName();

    // Delete from S3
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: imageKey,
      }),
    );

    // Delete from database
    await db
      .delete(propertyImages)
      .where(
        and(
          eq(propertyImages.propertyId, propertyId),
          eq(propertyImages.imageKey, imageKey),
        ),
      );

    return { success: true };
  } catch (error) {
    console.error("Error deleting image:", error);
    throw new Error("Failed to delete image");
  }
}

export async function updateImageOrders(
  updates: Array<{ propertyImageId: bigint; imageOrder: number }>,
): Promise<void> {
  try {
    // Update each image's order in the database
    await Promise.all(
      updates.map(({ propertyImageId, imageOrder }) =>
        updatePropertyImage(propertyImageId, { imageOrder }),
      ),
    );
  } catch (error) {
    console.error("Error updating image orders:", error);
    throw error;
  }
}

export async function togglePropertyImageVisibility(
  propertyImageId: bigint,
  isActive: boolean,
): Promise<void> {
  try {
    await updatePropertyImage(propertyImageId, { isActive });
  } catch (error) {
    console.error("Error toggling image visibility:", error);
    throw error;
  }
}

export async function addYouTubeLink(
  youtubeUrl: string,
  propertyId: bigint,
  referenceNumber: string,
): Promise<PropertyImage> {
  try {
    // Validate YouTube URL format
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    if (!youtubeRegex.test(youtubeUrl)) {
      throw new Error("Invalid YouTube URL format");
    }

    // Normalize the URL to standard format
    let videoId = "";
    if (youtubeUrl.includes("youtu.be/")) {
      videoId = youtubeUrl.split("youtu.be/")[1]?.split("?")[0] ?? "";
    } else if (youtubeUrl.includes("watch?v=")) {
      videoId = youtubeUrl.split("watch?v=")[1]?.split("&")[0] ?? "";
    } else if (youtubeUrl.includes("embed/")) {
      videoId = youtubeUrl.split("embed/")[1]?.split("?")[0] ?? "";
    }

    if (!videoId) {
      throw new Error("Could not extract video ID from YouTube URL");
    }

    // Create standard YouTube URL
    const standardYouTubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Create record in database with imageTag = 'youtube'
    const result = await createPropertyImage({
      propertyId,
      referenceNumber,
      imageUrl: standardYouTubeUrl,
      isActive: true,
      imageKey: `youtube_${videoId}`, // Use video ID as key
      s3key: `youtube://${videoId}`, // Special S3 key to indicate YouTube
      imageOrder: 99, // Non-image media always goes to order 99
      imageTag: "youtube",
    });

    if (!result) {
      throw new Error("Failed to create YouTube link record");
    }

    // Fetch the complete YouTube link record
    const youtubeLink = await getPropertyImageById(result.propertyImageId);
    if (!youtubeLink) {
      throw new Error("Failed to fetch created YouTube link");
    }

    // Convert to PropertyImage type
    const typedYouTubeLink: PropertyImage = {
      propertyImageId: youtubeLink.propertyImageId,
      propertyId: youtubeLink.propertyId,
      referenceNumber: youtubeLink.referenceNumber,
      imageUrl: youtubeLink.imageUrl,
      isActive: youtubeLink.isActive ?? true,
      createdAt: youtubeLink.createdAt,
      updatedAt: youtubeLink.updatedAt,
      imageKey: youtubeLink.imageKey,
      s3key: youtubeLink.s3key,
      imageOrder: youtubeLink.imageOrder,
      imageTag: youtubeLink.imageTag ?? undefined,
    };

    return typedYouTubeLink;
  } catch (error) {
    console.error("Error adding YouTube link:", error);
    throw error;
  }
}

export async function addVirtualTourLink(
  tourUrl: string,
  propertyId: bigint,
  referenceNumber: string,
): Promise<PropertyImage> {
  try {
    // Validate virtual tour URL format
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(tourUrl)) {
      throw new Error(
        "Invalid URL format. Please provide a valid virtual tour URL.",
      );
    }

    // Common virtual tour platforms validation
    // const _supportedPlatforms = [
    //   'matterport.com',
    //   'kuula.co',
    //   '360cities.net',
    //   'roundme.com',
    //   'pano2vr.com',
    //   'vrpano.com',
    //   'momento360.com',
    // ];

    let tourId = "";
    let platform = "generic";

    // Extract tour ID based on platform
    try {
      const url = new URL(tourUrl);
      const hostname = url.hostname.replace("www.", "");

      if (hostname.includes("matterport.com")) {
        platform = "matterport";
        const match = /m=([^&]+)/.exec(tourUrl);
        tourId = match?.[1] ?? Date.now().toString();
      } else if (hostname.includes("kuula.co")) {
        platform = "kuula";
        const pathParts = url.pathname.split("/");
        tourId = pathParts[pathParts.length - 1] ?? Date.now().toString();
      } else {
        // Generic platform - use hash of URL
        platform = "generic";
        tourId = Buffer.from(tourUrl).toString("base64").slice(0, 10);
      }
    } catch {
      // Fallback to generic if URL parsing fails
      tourId = Date.now().toString();
    }

    // Create record in database with imageTag = 'tour'
    const result = await createPropertyImage({
      propertyId,
      referenceNumber,
      imageUrl: tourUrl,
      isActive: true,
      imageKey: `tour_${platform}_${tourId}`,
      s3key: `tour://${platform}/${tourId}`,
      imageOrder: 99, // Non-image media always goes to order 99
      imageTag: "tour",
    });

    if (!result) {
      throw new Error("Failed to create virtual tour record");
    }

    // Fetch the complete virtual tour record
    const virtualTour = await getPropertyImageById(result.propertyImageId);
    if (!virtualTour) {
      throw new Error("Failed to fetch created virtual tour");
    }

    // Convert to PropertyImage type
    const typedVirtualTour: PropertyImage = {
      propertyImageId: virtualTour.propertyImageId,
      propertyId: virtualTour.propertyId,
      referenceNumber: virtualTour.referenceNumber,
      imageUrl: virtualTour.imageUrl,
      isActive: virtualTour.isActive ?? true,
      createdAt: virtualTour.createdAt,
      updatedAt: virtualTour.updatedAt,
      imageKey: virtualTour.imageKey,
      s3key: virtualTour.s3key,
      imageOrder: virtualTour.imageOrder,
      imageTag: virtualTour.imageTag ?? undefined,
    };

    return typedVirtualTour;
  } catch (error) {
    console.error("Error adding virtual tour link:", error);
    throw error;
  }
}

export async function uploadDocument(
  file: File,
  userId: string, // Changed to string for BetterAuth compatibility
  referenceNumber: string,
  documentOrder: number,
  documentTag?: string,
  contactId?: bigint,
  listingId?: bigint,
  listingContactId?: bigint,
  dealId?: bigint,
  appointmentId?: bigint,
  propertyId?: bigint,
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
  documentHash?: string,
  documentTimestamp?: Date,
): Promise<Document> {
  try {
    console.log(`📤 Starting document upload:`, {
      filename: file.name,
      size: file.size,
      type: file.type,
      userId,
      referenceNumber,
      documentOrder,
      documentTag,
      folderType,
      appointmentId: appointmentId?.toString(),
      listingId: listingId?.toString(),
    });

    // 1. Upload to S3
    const { fileUrl, s3key, documentKey, filename, fileType } =
      await uploadDocumentToS3(
        file,
        referenceNumber,
        documentOrder,
        documentTag,
        folderType,
      );

    console.log(`☁️ S3 upload completed:`, {
      fileUrl,
      s3key,
      documentKey,
      filename,
      fileType,
    });

    // 2. Create record in database
    const result = await createDocument({
      filename,
      fileType,
      fileUrl,
      userId,
      contactId: contactId ?? undefined,
      listingId: listingId ?? undefined,
      listingContactId: listingContactId ?? undefined,
      dealId: dealId ?? undefined,
      appointmentId: appointmentId ?? undefined,
      propertyId: propertyId,
      documentKey,
      s3key,
      documentTag,
      documentOrder,
      isActive: true,
      documentHash: documentHash ?? undefined,
      documentTimestamp: documentTimestamp ?? undefined,
    });

    if (!result) {
      throw new Error("Failed to create document record");
    }

    console.log(`💾 Document record created:`, {
      docId: result.docId?.toString(),
      filename: filename,
    });

    // 3. Fetch the complete document record
    const document = await getDocumentById(Number(result.docId));
    if (!document) {
      throw new Error("Failed to fetch created document");
    }

    console.log(`✅ Document upload complete:`, {
      docId: document.docId?.toString(),
      documentKey: document.documentKey,
      fileUrl: document.fileUrl,
    });

    // Convert to Document type, ensuring all required fields are present
    const typedDocument: Document = {
      docId: document.docId,
      filename: document.filename,
      fileType: document.fileType,
      fileUrl: document.fileUrl,
      userId: document.userId,
      contactId: document.contactId ?? undefined,
      uploadedAt: document.uploadedAt,
      listingId: document.listingId ?? undefined,
      listingContactId: document.listingContactId ?? undefined,
      dealId: document.dealId ?? undefined,
      appointmentId: document.appointmentId ?? undefined,
      propertyId: document.propertyId ?? undefined,
      documentKey: document.documentKey,
      s3key: document.s3key,
      documentTag: document.documentTag ?? undefined,
      documentOrder: document.documentOrder,
      isActive: document.isActive ?? true,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      documentHash: document.documentHash ?? undefined,
      documentTimestamp: document.documentTimestamp ?? undefined,
    };

    return typedDocument;
  } catch (error) {
    console.error("Error uploading document:", error);
    throw error;
  }
}

export async function deleteDocument(documentKey: string, docId: bigint) {
  "use server";

  try {
    // Get dynamic bucket name
    const bucketName = await getDynamicBucketName();

    // Delete from S3
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: documentKey,
      }),
    );

    // Delete from database
    await db.delete(documents).where(eq(documents.docId, docId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting document:", error);
    throw new Error("Failed to delete document");
  }
}

export async function deleteDocumentAction(
  docId: bigint,
  documentKey: string,
  propertyId?: bigint,
) {
  "use server";

  try {
    // Use optimized DAL function for session retrieval
    const session = await getSecureSession();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Usuario no autenticado",
      };
    }

    // Call the existing deleteDocument function
    await deleteDocument(documentKey, docId);

    // Revalidate the property page if propertyId is provided
    if (propertyId) {
      const { revalidatePath } = await import("next/cache");
      revalidatePath(`/propiedades/${propertyId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteDocumentAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al eliminar el documento",
    };
  }
}

export async function updateDocumentOrdersAction(
  updates: Array<{ docId: bigint; documentOrder: number }>,
): Promise<void> {
  try {
    // Update each document's order in the database
    await updateDocumentOrders(updates);
  } catch (error) {
    console.error("Error updating document orders:", error);
    throw error;
  }
}

export async function renameDocumentFolder(
  tempReferenceNumber: string,
  newReferenceNumber: string,
  _documentIds: bigint[], // Renamed to _documentIds to indicate it's intentionally unused
): Promise<
  Array<{
    docId: bigint;
    newUrl: string;
    newDocumentKey: string;
    newS3key: string;
  }>
> {
  try {
    // 1. Rename the folder in S3
    const renamedFiles = await renameS3Folder(
      tempReferenceNumber,
      newReferenceNumber,
    );

    if (renamedFiles.length === 0) {
      console.log("No files to rename");
      return [];
    }

    // 2. Update database records with new URLs and keys
    const results: Array<{
      docId: bigint;
      newUrl: string;
      newDocumentKey: string;
      newS3key: string;
    }> = [];

    for (const renamedFile of renamedFiles) {
      // Find the corresponding document in the database by matching the old key
      const [document] = await db
        .select()
        .from(documents)
        .where(
          and(
            eq(documents.documentKey, renamedFile.oldKey),
            eq(documents.isActive, true),
          ),
        );

      if (document) {
        // Update the document record with new URLs and keys
        await db
          .update(documents)
          .set({
            fileUrl: renamedFile.newUrl,
            documentKey: renamedFile.newKey,
            s3key: renamedFile.newS3key,
            updatedAt: new Date(),
          })
          .where(eq(documents.docId, document.docId));

        results.push({
          docId: document.docId,
          newUrl: renamedFile.newUrl,
          newDocumentKey: renamedFile.newKey,
          newS3key: renamedFile.newS3key,
        });

        console.log(
          `Updated document ${document.docId} with new URL: ${renamedFile.newUrl}`,
        );
      }
    }

    console.log(
      `Successfully renamed folder and updated ${results.length} documents`,
    );
    return results;
  } catch (error) {
    console.error("Error renaming document folder:", error);
    throw error;
  }
}

export async function uploadContactDocument(
  file: File,
  contactId: bigint,
  folderType: "documentos-personales" | "contratos",
): Promise<Document> {
  "use server";

  console.log("[uploadContactDocument] Server action called - file:", file.name, "size:", (file.size / 1024 / 1024).toFixed(2), "MB");

  const session = await getSecureSession();
  if (!session?.user?.id) {
    console.log("[uploadContactDocument] No session found");
    throw new Error("Usuario no autenticado");
  }
  console.log("[uploadContactDocument] Session found, user:", session.user.id);

  // Map folder type to document tag
  const documentTagMap: Record<string, string> = {
    "documentos-personales": "documentos-personales",
    contratos: "contrato-arras",
  };

  const documentTag = documentTagMap[folderType] ?? folderType;

  // Generate a reference number for the contact
  const referenceNumber = `CONTACT_${contactId.toString()}`;

  const document = await uploadDocument(
    file,
    session.user.id,
    referenceNumber,
    1, // documentOrder
    documentTag,
    contactId,
    undefined, // listingId
    undefined, // listingContactId
    undefined, // dealId
    undefined, // appointmentId
    undefined, // propertyId
    folderType,
  );

  return document;
}

export async function uploadPropertyDocumentAction(
  file: File,
  listingId: bigint,
  propertyId: bigint,
  referenceNumber: string,
  folderType:
    | "initial-docs"
    | "legal-docs"
    | "certificados"
    | "impuestos-pagos"
    | "contratos"
    | "hipoteca"
    | "visitas"
    | "planos"
    | "others"
    | "carteles",
): Promise<Document> {
  "use server";

  const session = await getSecureSession();
  if (!session?.user?.id) {
    throw new Error("Usuario no autenticado");
  }

  // Map folder types to document tags for database storage
  const documentTagMap: Record<string, string> = {
    "initial-docs": "documentacion-inicial",
    "legal-docs": "documentacion-legal",
    certificados: "certificados",
    "impuestos-pagos": "impuestos-pagos",
    contratos: "contratos",
    hipoteca: "hipoteca",
    visitas: "visitas",
    planos: "planos",
    others: "otros",
    carteles: "carteles",
  };

  const documentTag = documentTagMap[folderType] ?? folderType;

  const document = await uploadDocument(
    file,
    session.user.id,
    referenceNumber,
    1, // documentOrder
    documentTag,
    undefined, // contactId
    listingId,
    undefined, // listingContactId
    undefined, // dealId
    undefined, // appointmentId
    propertyId,
    folderType,
  );

  return document;
}

export async function uploadCartelAction(
  file: File,
  listingId: bigint,
  propertyId: bigint,
  referenceNumber: string,
): Promise<Document> {
  "use server";

  const session = await getSecureSession();
  if (!session?.user?.id) {
    throw new Error("Usuario no autenticado");
  }

  // Validate file type - only PDFs for carteles
  if (file.type !== "application/pdf") {
    throw new Error("Solo se permiten archivos PDF para carteles");
  }

  const document = await uploadDocument(
    file,
    session.user.id,
    referenceNumber,
    1, // documentOrder
    "carteles", // documentTag
    undefined, // contactId
    listingId,
    undefined, // listingContactId
    undefined, // dealId
    undefined, // appointmentId
    propertyId,
    "carteles", // folderType
  );

  return document;
}

export async function uploadFichaEncargoAction(file: File): Promise<{
  document: Document;
  propertyId: string;
  listingId: string;
  referenceNumber: string;
}> {
  "use server";

  // Import here to avoid circular dependency
  const { createMinimalPropertyWithListing } = await import(
    "~/server/queries/properties"
  );

  const session = await getSecureSession();
  if (!session?.user?.id) {
    throw new Error("Usuario no autenticado");
  }

  // Validate file type
  const validTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
  ];

  if (!validTypes.includes(file.type)) {
    throw new Error(
      "Tipo de archivo no válido. Solo se permiten PDF, DOC, DOCX, JPG y PNG.",
    );
  }

  // Step 1: Create minimal property and listing
  const propertyResult = await createMinimalPropertyWithListing();
  const { propertyId, listingId, referenceNumber } = propertyResult;

  // Step 2: Upload document to final property location
  const document = await uploadDocument(
    file,
    session.user.id,
    referenceNumber,
    1, // documentOrder
    "ficha-encargo", // documentTag
    undefined, // contactId
    BigInt(listingId),
    undefined, // listingContactId
    undefined, // dealId
    undefined, // appointmentId
    BigInt(propertyId),
    "initial-docs", // folderType
  );

  return {
    document,
    propertyId: propertyId.toString(),
    listingId: listingId.toString(),
    referenceNumber,
  };
}

// ============================================================================
// PRESIGNED URL UPLOAD FUNCTIONS
// These bypass Vercel's 4.5MB limit by uploading directly to S3
// ============================================================================

export type PresignedUploadResult = {
  uploadUrl: string;
  documentKey: string;
  fileUrl: string;
};

/**
 * Get a presigned URL for uploading a document directly to S3.
 * This bypasses Vercel's 4.5MB serverless function limit.
 */
export async function getPresignedDocumentUploadUrl(
  filename: string,
  contentType: string,
  referenceNumber: string,
  folderType: string,
): Promise<PresignedUploadResult> {
  "use server";

  const session = await getSecureSession();
  if (!session?.user?.id) {
    throw new Error("Usuario no autenticado");
  }

  // Generate the S3 key for this document
  const documentKey = generateDocumentKey(referenceNumber, folderType, filename);

  // Get presigned URL for direct upload
  const { uploadUrl } = await generatePresignedUploadUrl(documentKey, contentType);

  // Get the public URL that will be valid after upload
  const fileUrl = await getS3PublicUrl(documentKey);

  console.log("[getPresignedDocumentUploadUrl] Generated presigned URL for:", filename);

  return {
    uploadUrl,
    documentKey,
    fileUrl,
  };
}

/**
 * Save a document record to the database after successful S3 upload.
 * Call this after the client has uploaded directly to S3.
 */
export async function saveUploadedDocument(
  filename: string,
  fileType: string,
  fileUrl: string,
  documentKey: string,
  documentTag: string,
  _folderType: string, // Kept for API compatibility, not stored in DB
  contactId?: bigint,
  listingId?: bigint,
  propertyId?: bigint,
): Promise<Document> {
  "use server";

  const session = await getSecureSession();
  if (!session?.user?.id) {
    throw new Error("Usuario no autenticado");
  }

  console.log("[saveUploadedDocument] Saving document record:", filename);

  // Insert document record into database
  const [insertedDocument] = await db
    .insert(documents)
    .values({
      filename,
      fileType,
      fileUrl,
      documentKey,
      s3key: documentKey, // s3key same as documentKey
      documentTag,
      userId: session.user.id,
      contactId: contactId ?? null,
      listingId: listingId ?? null,
      propertyId: propertyId ?? null,
      documentOrder: 1,
      uploadedAt: new Date(),
    })
    .returning();

  if (!insertedDocument) {
    throw new Error("Error al guardar el documento");
  }

  console.log("[saveUploadedDocument] Document saved with ID:", insertedDocument.docId.toString());

  // Convert null values to undefined to match Document type
  return {
    ...insertedDocument,
    contactId: insertedDocument.contactId ?? undefined,
    listingId: insertedDocument.listingId ?? undefined,
    propertyId: insertedDocument.propertyId ?? undefined,
    listingContactId: insertedDocument.listingContactId ?? undefined,
    dealId: insertedDocument.dealId ?? undefined,
    appointmentId: insertedDocument.appointmentId ?? undefined,
    prospectId: insertedDocument.prospectId ?? undefined,
    documentTag: insertedDocument.documentTag ?? undefined,
    documentHash: insertedDocument.documentHash ?? undefined,
    documentTimestamp: insertedDocument.documentTimestamp ?? undefined,
    isActive: insertedDocument.isActive ?? true,
  };
}

/**
 * Combined presigned upload for contact documents.
 * Returns presigned URL and saves document after upload confirmation.
 */
export async function getContactDocumentPresignedUrl(
  filename: string,
  contentType: string,
  contactId: bigint,
  folderType: "documentos-personales" | "contratos",
): Promise<PresignedUploadResult> {
  "use server";

  const referenceNumber = `contacts/${contactId.toString()}`;
  return getPresignedDocumentUploadUrl(filename, contentType, referenceNumber, folderType);
}

/**
 * Save contact document after presigned upload.
 */
export async function saveContactDocument(
  filename: string,
  fileType: string,
  fileUrl: string,
  documentKey: string,
  contactId: bigint,
  folderType: "documentos-personales" | "contratos",
): Promise<Document> {
  "use server";

  const documentTagMap: Record<string, string> = {
    "documentos-personales": "documentos-personales",
    contratos: "contrato-arras",
  };

  const documentTag = documentTagMap[folderType] ?? folderType;

  return saveUploadedDocument(
    filename,
    fileType,
    fileUrl,
    documentKey,
    documentTag,
    folderType,
    contactId,
    undefined,
    undefined,
  );
}

/**
 * Get presigned URL for property document upload.
 */
export async function getPropertyDocumentPresignedUrl(
  filename: string,
  contentType: string,
  referenceNumber: string,
  folderType: string,
): Promise<PresignedUploadResult> {
  "use server";

  return getPresignedDocumentUploadUrl(filename, contentType, referenceNumber, folderType);
}

/**
 * Save property document after presigned upload.
 */
export async function savePropertyDocument(
  filename: string,
  fileType: string,
  fileUrl: string,
  documentKey: string,
  listingId: bigint,
  propertyId: bigint,
  folderType: string,
): Promise<Document> {
  "use server";

  const documentTagMap: Record<string, string> = {
    "initial-docs": "documentacion-inicial",
    "legal-docs": "documentacion-legal",
    certificados: "certificados",
    "impuestos-pagos": "impuestos-pagos",
    contratos: "contratos",
    hipoteca: "hipoteca",
    visitas: "visitas",
    planos: "planos",
    others: "otros",
    carteles: "carteles",
  };

  const documentTag = documentTagMap[folderType] ?? folderType;

  return saveUploadedDocument(
    filename,
    fileType,
    fileUrl,
    documentKey,
    documentTag,
    folderType,
    undefined,
    listingId,
    propertyId,
  );
}

/**
 * Create a property and get presigned URL for ficha de encargo upload.
 * This creates the property first, then returns the presigned URL.
 */
export async function createPropertyAndGetPresignedUrl(
  filename: string,
  contentType: string,
): Promise<{
  uploadUrl: string;
  documentKey: string;
  fileUrl: string;
  propertyId: string;
  listingId: string;
  referenceNumber: string;
}> {
  "use server";

  const { createMinimalPropertyWithListing } = await import(
    "~/server/queries/properties"
  );

  const session = await getSecureSession();
  if (!session?.user?.id) {
    throw new Error("Usuario no autenticado");
  }

  console.log("[createPropertyAndGetPresignedUrl] Creating property for ficha de encargo...");

  // Step 1: Create property
  const propertyResult = await createMinimalPropertyWithListing();
  const { propertyId, listingId, referenceNumber } = propertyResult;

  console.log("[createPropertyAndGetPresignedUrl] Property created:", referenceNumber);

  // Step 2: Get presigned URL
  const result = await getPresignedDocumentUploadUrl(
    filename,
    contentType,
    referenceNumber,
    "initial-docs",
  );

  return {
    ...result,
    propertyId: propertyId.toString(),
    listingId: listingId.toString(),
    referenceNumber,
  };
}

/**
 * Save ficha de encargo document after presigned upload.
 */
export async function saveFichaEncargoDocument(
  filename: string,
  fileType: string,
  fileUrl: string,
  documentKey: string,
  listingId: string,
  propertyId: string,
): Promise<Document> {
  "use server";

  return saveUploadedDocument(
    filename,
    fileType,
    fileUrl,
    documentKey,
    "ficha-encargo",
    "initial-docs",
    undefined,
    BigInt(listingId),
    BigInt(propertyId),
  );
}

// ============================================================================
// PRESIGNED URL UPLOADS FOR IMAGES AND VIDEOS
// ============================================================================

interface PresignedImageUploadResult {
  uploadUrl: string;
  imageKey: string;
  imageUrl: string;
}

interface PresignedVideoUploadResult {
  uploadUrl: string;
  videoKey: string;
  videoUrl: string;
}

/**
 * Get presigned URL for property image upload.
 * Client uploads directly to S3, bypassing Vercel's 4.5MB limit.
 */
export async function getPropertyImagePresignedUrl(
  filename: string,
  contentType: string,
  referenceNumber: string,
  imageOrder: number,
): Promise<PresignedImageUploadResult> {
  "use server";

  const session = await getSecureSession();
  if (!session?.user?.id) {
    throw new Error("Usuario no autenticado");
  }

  // Generate the S3 key for the image
  const imageKey = generateImageKey(referenceNumber, imageOrder, filename);

  // Get presigned URL for upload
  const { uploadUrl } = await generatePresignedUploadUrl(imageKey, contentType);

  // Get the public URL for the image
  const imageUrl = await getS3PublicUrl(imageKey);

  console.log("[getPropertyImagePresignedUrl] Generated presigned URL for:", filename);

  return { uploadUrl, imageKey, imageUrl };
}

/**
 * Save property image record after presigned upload.
 */
export async function savePropertyImageRecord(
  propertyId: bigint,
  referenceNumber: string,
  imageUrl: string,
  imageKey: string,
  imageOrder: number,
): Promise<PropertyImage> {
  "use server";

  const session = await getSecureSession();
  if (!session?.user?.id) {
    throw new Error("Usuario no autenticado");
  }

  console.log("[savePropertyImageRecord] Saving image record:", imageKey);

  // Get bucket name for s3key
  const bucketName = await getDynamicBucketName();
  const s3key = `s3://${bucketName}/${imageKey}`;

  // Create the property image record
  const result = await createPropertyImage({
    propertyId,
    referenceNumber,
    imageUrl,
    isActive: true,
    imageKey,
    s3key,
    imageOrder,
  });

  if (!result) {
    throw new Error("Error al guardar la imagen");
  }

  // Fetch the complete image record
  const propertyImage = await getPropertyImageById(result.propertyImageId);

  if (!propertyImage) {
    throw new Error("Error al obtener la imagen guardada");
  }

  console.log("[savePropertyImageRecord] Image saved with ID:", propertyImage.propertyImageId.toString());

  // Convert null values to match PropertyImage type
  return {
    ...propertyImage,
    isActive: propertyImage.isActive ?? true,
    imageTag: propertyImage.imageTag ?? undefined,
    originImageId: propertyImage.originImageId ?? undefined,
  };
}

/**
 * Get presigned URL for property video upload.
 * Client uploads directly to S3, bypassing Vercel's 4.5MB limit.
 */
export async function getPropertyVideoPresignedUrl(
  filename: string,
  contentType: string,
  referenceNumber: string,
  videoOrder: number,
): Promise<PresignedVideoUploadResult> {
  "use server";

  const session = await getSecureSession();
  if (!session?.user?.id) {
    throw new Error("Usuario no autenticado");
  }

  // Generate the S3 key for the video
  const videoKey = generateVideoKey(referenceNumber, videoOrder, filename);

  // Get presigned URL for upload
  const { uploadUrl } = await generatePresignedUploadUrl(videoKey, contentType);

  // Get the public URL for the video
  const videoUrl = await getS3PublicUrl(videoKey);

  console.log("[getPropertyVideoPresignedUrl] Generated presigned URL for:", filename);

  return { uploadUrl, videoKey, videoUrl };
}

/**
 * Save property video record after presigned upload.
 * Videos are stored in the property_images table with isVideo=true.
 */
export async function savePropertyVideoRecord(
  propertyId: bigint,
  referenceNumber: string,
  videoUrl: string,
  videoKey: string,
  _videoOrder: number,
): Promise<PropertyImage> {
  "use server";

  const session = await getSecureSession();
  if (!session?.user?.id) {
    throw new Error("Usuario no autenticado");
  }

  console.log("[savePropertyVideoRecord] Saving video record:", videoKey);

  // Get bucket name for s3key
  const bucketName = await getDynamicBucketName();
  const s3key = `s3://${bucketName}/${videoKey}`;

  // Create the property image record (videos use same table with imageTag='video')
  const result = await createPropertyImage({
    propertyId,
    referenceNumber,
    imageUrl: videoUrl,
    isActive: true,
    imageKey: videoKey,
    s3key,
    imageOrder: 99, // Non-image media always goes to order 99
    imageTag: "video", // This marks it as a video
  });

  if (!result) {
    throw new Error("Error al guardar el vídeo");
  }

  // Fetch the complete record
  const propertyVideo = await getPropertyImageById(result.propertyImageId);

  if (!propertyVideo) {
    throw new Error("Error al obtener el vídeo guardado");
  }

  console.log("[savePropertyVideoRecord] Video saved with ID:", propertyVideo.propertyImageId.toString());

  // Convert null values to match PropertyImage type
  return {
    ...propertyVideo,
    isActive: propertyVideo.isActive ?? true,
    imageTag: propertyVideo.imageTag ?? undefined,
    originImageId: propertyVideo.originImageId ?? undefined,
  };
}
