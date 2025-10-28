import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { processDocumentInBackgroundEnhanced } from "~/server/ocr/ocr-initial-form";
import { getDocumentById } from "~/server/queries/document";
import { getSecureSession } from "~/lib/dal";

// Phase 2: Trigger OCR processing for uploaded documents
export async function POST(request: NextRequest) {
  try {
    console.log(
      "🔍 Starting Phase 2: Triggering OCR processing for ficha de encargo documents...",
    );

    // Get current user session
    const session = await getSecureSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      propertyId: string;
      documentIds: string[];
    };
    const { propertyId, documentIds } = body;

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 },
      );
    }

    if (
      !documentIds ||
      !Array.isArray(documentIds) ||
      documentIds.length === 0
    ) {
      return NextResponse.json(
        { error: "Document IDs are required" },
        { status: 400 },
      );
    }

    console.log(
      `🔍 Processing ${documentIds.length} documents for property: ${propertyId}`,
    );

    // Trigger OCR processing for each document (same as crear workflow)
    for (const docId of documentIds) {
      try {
        const document = await getDocumentById(Number(docId));

        if (document) {
          console.log(`🎯 Triggering OCR for document: ${document.filename}`);

          // Use the same enhanced OCR processing as crear workflow
          // This runs in background and automatically saves results to database
          void processDocumentInBackgroundEnhanced(document.documentKey).catch(
            (error) => {
              console.error(
                `❌ OCR processing failed for ${document.documentKey}:`,
                error,
              );
              // Don't throw here - OCR failures shouldn't break the response
            },
          );

          console.log(`✅ OCR processing started for: ${document.filename}`);
        } else {
          console.warn(`⚠️ Document not found with ID: ${docId}`);
        }
      } catch (docError) {
        console.error("❌ Error processing document:", docId, docError);
        // Continue with other documents if one fails
      }
    }

    console.log("🚀 All OCR processing jobs have been queued in background");

    return NextResponse.json({
      success: true,
      data: {
        propertyId: propertyId,
        documentsProcessed: documentIds.length,
        processingStatus: "started",
      },
      message: `OCR processing started for ${documentIds.length} documents. Results will be automatically saved to the property when ready.`,
    });
  } catch (error) {
    console.error("❌ Error in ficha de encargo Phase 2:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to trigger OCR processing",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
