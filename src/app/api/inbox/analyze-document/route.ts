import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

// Response schema for DNI/NIE analysis
const DNIAnalysisSchema = z.object({
  fullName: z.string().optional(),
  documentNumber: z.string().optional(),
  birthDate: z.string().optional(),
  expiryDate: z.string().optional(),
  address: z.string().optional(),
});

export type DNIAnalysisResult = z.infer<typeof DNIAnalysisSchema>;

// Prompt for extracting DNI/NIE data
const DNI_EXTRACTION_PROMPT = `You are an expert document analyzer specializing in Spanish identity documents (DNI and NIE).

Analyze this document (it can be an image or PDF scan of a DNI/NIE) and extract the following information if visible:
- Full name (nombre completo) - first name and surnames as they appear on the document
- Document number (número de DNI or NIE)
- Date of birth (fecha de nacimiento)
- Expiry date (fecha de caducidad/validez)
- Address (domicilio/dirección) if visible

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

Return a JSON object with this exact structure:
{
  "fullName": "string or null",
  "documentNumber": "string or null",
  "birthDate": "string or null",
  "expiryDate": "string or null",
  "address": "string or null"
}`;

// Supported MIME types for document analysis
const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
];

const SUPPORTED_PDF_TYPE = "application/pdf";

interface AnalyzeDocumentRequest {
  documentBase64: string;
  mimeType: string;
  filename?: string;
}

/**
 * Determine MIME type from filename extension
 */
function getMimeTypeFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    pdf: "application/pdf",
  };
  return mimeTypes[ext] ?? "application/octet-stream";
}

/**
 * Check if the MIME type is supported for document analysis
 */
function isSupportedMimeType(mimeType: string): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(mimeType) || mimeType === SUPPORTED_PDF_TYPE;
}

/**
 * POST /api/inbox/analyze-document
 * Analyze a DNI/NIE document using Gemini Vision
 * Supports both image files (jpg, png, etc.) and PDF documents
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnalyzeDocumentRequest;
    let { documentBase64, mimeType, filename } = body;

    if (!documentBase64) {
      return NextResponse.json(
        { error: "documentBase64 es requerido" },
        { status: 400 }
      );
    }

    // If mimeType not provided, try to detect from filename
    if (!mimeType && filename) {
      mimeType = getMimeTypeFromFilename(filename);
    }

    // Default to image/jpeg if still not determined
    if (!mimeType) {
      mimeType = "image/jpeg";
    }

    // Validate MIME type
    if (!isSupportedMimeType(mimeType)) {
      return NextResponse.json(
        {
          error: `Formato no soportado: ${mimeType}. Formatos soportados: imágenes (jpg, png, gif, webp, bmp) y PDF.`
        },
        { status: 400 }
      );
    }

    // Validate API key
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_GEMINI_API_KEY not configured");
      return NextResponse.json(
        { error: "API de análisis no configurada" },
        { status: 500 }
      );
    }

    // Initialize Gemini client
    const genAI = new GoogleGenAI({ apiKey });

    // Clean base64 string (remove data URL prefix if present)
    const cleanBase64 = documentBase64.replace(
      /^data:[^;]+;base64,/,
      ""
    );

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

    const isPdf = mimeType === SUPPORTED_PDF_TYPE;
    console.log(`🔍 Analyzing DNI/NIE ${isPdf ? "PDF" : "image"} with Gemini...`, {
      mimeType,
      filename,
      dataLength: cleanBase64.length,
    });

    // Call Gemini API - use a model that supports PDFs
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-05-20",
      contents,
      config: {
        temperature: 0.1, // Low temperature for accurate extraction
        maxOutputTokens: 1000,
      },
    });

    // Extract text response
    const textContent = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.text
    )?.text;

    if (!textContent) {
      console.error("No text response from Gemini");
      return NextResponse.json(
        { error: "No se pudo analizar el documento" },
        { status: 500 }
      );
    }

    console.log("📄 Gemini raw response:", textContent);

    // Parse JSON response
    let analysisResult: DNIAnalysisResult;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

      // Convert null strings to undefined and validate
      const cleanedResult: DNIAnalysisResult = {
        fullName: typeof parsed.fullName === "string" && parsed.fullName !== "null"
          ? parsed.fullName
          : undefined,
        documentNumber: typeof parsed.documentNumber === "string" && parsed.documentNumber !== "null"
          ? parsed.documentNumber
          : undefined,
        birthDate: typeof parsed.birthDate === "string" && parsed.birthDate !== "null"
          ? parsed.birthDate
          : undefined,
        expiryDate: typeof parsed.expiryDate === "string" && parsed.expiryDate !== "null"
          ? parsed.expiryDate
          : undefined,
        address: typeof parsed.address === "string" && parsed.address !== "null"
          ? parsed.address
          : undefined,
      };

      analysisResult = DNIAnalysisSchema.parse(cleanedResult);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      return NextResponse.json(
        { error: "Error al procesar los datos del documento" },
        { status: 500 }
      );
    }

    console.log("✅ DNI/NIE analysis result:", analysisResult);

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
    });
  } catch (error) {
    console.error("Error analyzing document:", error);
    return NextResponse.json(
      { error: "Error al analizar el documento" },
      { status: 500 }
    );
  }
}
