import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/dal";
import { getGmailClient } from "~/lib/google-gmail";
import { uploadDocument } from "~/app/actions/upload";
import { db } from "~/server/db";
import { listings, documents, properties } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";

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
  // Address fields (separated)
  address?: string;
  street?: string;
  addressDetails?: string;
  city?: string;
  postalCode?: string;
  province?: string;
}

// Prompt for extracting DNI/NIE data
const DNI_EXTRACTION_PROMPT = `You are an expert document analyzer specializing in Spanish identity documents (DNI and NIE).

Analyze this document (it can be an image or PDF scan of a DNI/NIE) and extract the following information if visible:
- Full name (nombre completo) - first name and surnames as they appear on the document
- Document number (número de DNI or NIE)
- Date of birth (fecha de nacimiento)
- Expiry date (fecha de caducidad/validez)
- Address (domicilio/dirección) if visible - extract the components separately:
  - Street with number (calle y número)
  - Address details like floor, door (piso, puerta)
  - City (ciudad/localidad)
  - Postal code (código postal)
  - Province (provincia)

IMPORTANT RULES:
1. Return ONLY valid JSON, no other text or explanation
2. Use null for any field you cannot clearly read or that is not present
3. Format dates as DD/MM/YYYY
4. The document number should include the letter at the end (e.g., "12345678A" for DNI or "X1234567A" for NIE)
5. For NIE, the first character is X, Y, or Z followed by 7 digits and a letter
6. For DNI, it's 8 digits followed by a letter
7. Be very careful with OCR accuracy - only include data you are confident about
8. If the document is upside down or rotated, still try to read it correctly
9. For names, use proper capitalization (e.g., "Juan García López" not "JUAN GARCIA LOPEZ")
10. For address, parse it into components. Example: "C/ Gran Vía 28, 3º B, 28013 Madrid" should be split into street="C/ Gran Vía 28", addressDetails="3º B", postalCode="28013", city="Madrid"

Return a JSON object with this exact structure:
{
  "fullName": "string or null",
  "documentNumber": "string or null",
  "birthDate": "string or null",
  "expiryDate": "string or null",
  "street": "string or null",
  "addressDetails": "string or null",
  "city": "string or null",
  "postalCode": "string or null",
  "province": "string or null"
}`;

/**
 * Analyze a DNI/NIE document using Gemini Vision
 */
async function analyzeDNIDocument(
  documentBase64: string,
  mimeType: string
): Promise<DNIAnalysisResult | null> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_GEMINI_API_KEY not configured");
    return null;
  }

  try {
    const genAI = new GoogleGenAI({ apiKey });

    // Clean base64 string (remove data URL prefix if present)
    const cleanBase64 = documentBase64.replace(/^data:[^;]+;base64,/, "");

    // Prepare content with prompt and document
    const contents = [
      { text: DNI_EXTRACTION_PROMPT },
      {
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      },
    ];

    const isPdf = mimeType === "application/pdf";
    console.log(`🔍 Analyzing DNI/NIE ${isPdf ? "PDF" : "image"} with Gemini 2.0 Flash...`);

    // Call Gemini API
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents,
      config: {
        temperature: 0.1,
        maxOutputTokens: 1000,
      },
    });

    // Extract text response
    const textContent = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.text
    )?.text;

    if (!textContent) {
      console.error("No text response from Gemini");
      return null;
    }

    console.log("📄 Gemini raw response:", textContent);

    // Parse JSON response
    const jsonRegex = /\{[\s\S]*\}/;
    const jsonMatch = jsonRegex.exec(textContent);
    if (!jsonMatch) {
      console.error("No JSON found in Gemini response");
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

    // Helper to extract string or undefined
    const getString = (value: unknown): string | undefined => {
      if (typeof value === "string" && value !== "null" && value.trim()) {
        return value.trim();
      }
      return undefined;
    };

    // Convert null strings to undefined
    const street = getString(parsed.street);
    const addressDetails = getString(parsed.addressDetails);
    const city = getString(parsed.city);
    const postalCode = getString(parsed.postalCode);
    const province = getString(parsed.province);

    // Build full address from components
    const addressParts = [
      street,
      addressDetails,
      [postalCode, city].filter(Boolean).join(" "),
      province,
    ].filter(Boolean);
    const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : undefined;

    const result: DNIAnalysisResult = {
      fullName: getString(parsed.fullName),
      documentNumber: getString(parsed.documentNumber),
      birthDate: getString(parsed.birthDate),
      expiryDate: getString(parsed.expiryDate),
      address: fullAddress,
      street,
      addressDetails,
      city,
      postalCode,
      province,
    };

    console.log("✅ DNI/NIE analysis result:", result);
    return result;
  } catch (error) {
    console.error("Error analyzing DNI document:", error);
    return null;
  }
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
      console.log("📄 Analyzing DNI/NIE document...");
      const analysisResult = await analyzeDNIDocument(base64, mimeType);
      if (analysisResult) {
        analysis = analysisResult;
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
