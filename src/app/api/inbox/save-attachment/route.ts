import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/dal";
import { getGmailClient } from "~/lib/google-gmail";
import { uploadDocument } from "~/app/actions/upload";
import { db } from "~/server/db";
import { listings, documents, properties } from "~/server/db/schema";
import { eq } from "drizzle-orm";

interface SaveAttachmentRequest {
  messageId: string;
  attachmentId: string;
  filename: string;
  folderType: string;
  documentTag: string;
  contactId?: string;
  listingId?: string;
  analyzeDocument?: boolean;
}

interface DNIAnalysisResult {
  fullName?: string;
  documentNumber?: string;
  birthDate?: string;
  expiryDate?: string;
  address?: string;
}

// Valid folder types for upload
type UploadFolderType =
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
  | "arras";

// Map folder IDs to upload folder types (supports both propiedades and contactos)
const FOLDER_TYPE_MAP: Record<string, UploadFolderType> = {
  // Propiedades folder types
  "documentacion-inicial": "initial-docs",
  "documentacion-legal": "legal-docs",
  "certificados": "certificados",
  "impuestos-pagos": "impuestos-pagos",
  "contratos": "contratos",
  "hipoteca": "hipoteca",
  "planos": "planos",
  "visitas": "visitas",
  "otros": "others",
  // Contactos-specific folder types (map to existing valid types)
  "certificado-energetico": "certificados",
  "escrituras": "legal-docs",
  "carteles": "carteles",
  "documentos-personales": "initial-docs",
};

/**
 * Get the next document order for a given reference
 */
async function getNextDocumentOrder(): Promise<number> {
  const existingDocs = await db
    .select({ documentOrder: documents.documentOrder })
    .from(documents)
    .where(eq(documents.isActive, true))
    .orderBy(documents.documentOrder);

  // Find documents with valid order
  const matchingDocs = existingDocs.filter(doc =>
    doc.documentOrder !== null
  );

  if (matchingDocs.length === 0) return 1;

  const maxOrder = Math.max(...matchingDocs.map(d => d.documentOrder));
  return maxOrder + 1;
}

/**
 * POST /api/inbox/save-attachment
 * Save a Gmail attachment to the documents system
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = (await request.json()) as SaveAttachmentRequest;
    const { messageId, attachmentId, filename, folderType, documentTag, contactId, listingId, analyzeDocument } = body;

    // Validate required fields
    if (!messageId || !attachmentId || !filename || !folderType || !documentTag) {
      return NextResponse.json(
        { error: "Campos requeridos: messageId, attachmentId, filename, folderType, documentTag" },
        { status: 400 }
      );
    }

    // Get Gmail client
    const gmail = await getGmailClient(user.id);
    if (!gmail) {
      return NextResponse.json(
        { error: "Gmail no conectado" },
        { status: 400 }
      );
    }

    // Fetch the attachment data from Gmail API
    const response = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId,
      id: attachmentId,
    });

    const attachmentData = response.data.data;
    if (!attachmentData) {
      return NextResponse.json(
        { error: "Adjunto no encontrado" },
        { status: 404 }
      );
    }

    // Decode base64url to binary
    const base64 = attachmentData.replace(/-/g, "+").replace(/_/g, "/");
    const binaryData = Buffer.from(base64, "base64");

    // Determine the MIME type from filename
    const mimeType = getMimeType(filename);

    // Create a File object from the binary data
    const file = new File([binaryData], filename, { type: mimeType });

    // Determine reference number
    let referenceNumber: string;
    let propertyId: bigint | undefined;
    let parsedListingId: bigint | undefined;
    let parsedContactId: bigint | undefined;

    if (listingId) {
      // Get the listing's property and its reference number
      parsedListingId = BigInt(listingId);
      const [result] = await db
        .select({
          referenceNumber: properties.referenceNumber,
          propertyId: listings.propertyId
        })
        .from(listings)
        .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
        .where(eq(listings.listingId, parsedListingId));

      if (result?.referenceNumber) {
        referenceNumber = result.referenceNumber;
        propertyId = result.propertyId ?? undefined;
      } else {
        // Fallback to LISTING_{id} if no reference number
        referenceNumber = `LISTING_${listingId}`;
      }
    } else if (contactId) {
      parsedContactId = BigInt(contactId);
      referenceNumber = `CONTACT_${contactId}`;
    } else {
      // No association - use a timestamp-based reference
      referenceNumber = `INBOX_${Date.now()}`;
    }

    if (contactId) {
      parsedContactId = BigInt(contactId);
    }

    // Get next document order
    const documentOrder = await getNextDocumentOrder();

    // Map the folder type
    const uploadFolderType = FOLDER_TYPE_MAP[folderType] ?? "others";

    // Upload the document
    const document = await uploadDocument(
      file,
      user.id,
      referenceNumber,
      documentOrder,
      documentTag,
      parsedContactId,
      parsedListingId,
      undefined, // listingContactId
      undefined, // dealId
      undefined, // appointmentId
      propertyId,
      uploadFolderType
    );

    // Analyze document if requested (for DNI/NIE)
    let analysis: DNIAnalysisResult | undefined;
    if (analyzeDocument && documentTag === "documentacion-inicial") {
      try {
        console.log("📄 Analyzing DNI/NIE document...");

        // Call the analyze-document API
        const analyzeResponse = await fetch(
          new URL("/api/inbox/analyze-document", request.url).toString(),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              documentBase64: base64,
              mimeType,
              filename,
            }),
          }
        );

        if (analyzeResponse.ok) {
          const analyzeResult = (await analyzeResponse.json()) as {
            success: boolean;
            analysis?: DNIAnalysisResult;
          };

          if (analyzeResult.success && analyzeResult.analysis) {
            analysis = analyzeResult.analysis;
            console.log("✅ DNI/NIE analysis completed:", analysis);
          }
        } else {
          console.error("Failed to analyze document:", await analyzeResponse.text());
        }
      } catch (analyzeError) {
        console.error("Error analyzing document:", analyzeError);
        // Don't fail the entire save if analysis fails
      }
    }

    return NextResponse.json({
      success: true,
      document: {
        docId: document.docId.toString(),
        filename: document.filename,
        fileUrl: document.fileUrl,
        documentTag: document.documentTag,
        folderType: uploadFolderType,
      },
      analysis,
    });
  } catch (error) {
    console.error("Error saving attachment:", error);
    return NextResponse.json(
      { error: "Error al guardar el adjunto" },
      { status: 500 }
    );
  }
}

/**
 * Get MIME type from filename extension
 */
function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  const mimeTypes: Record<string, string> = {
    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    csv: "text/csv",
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    // Archives
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    "7z": "application/x-7z-compressed",
    // Other
    json: "application/json",
    xml: "application/xml",
    html: "text/html",
  };

  return mimeTypes[ext] ?? "application/octet-stream";
}
