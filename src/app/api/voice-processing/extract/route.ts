import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { extractPropertyDataFromVoice } from "~/server/transcription/voice-field-extractor";
import { getSecureSession } from "~/lib/dal";
import type { TranscriptionResult } from "~/server/transcription/transcription-service";

export async function POST(request: NextRequest) {
  try {
    console.log("🧠 [EXTRACT-API] Starting data extraction...");

    // Check authentication
    const session = await getSecureSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 },
      );
    }

    // Parse request body
    const body = (await request.json()) as {
      transcriptionResult?: TranscriptionResult;
      referenceNumber?: string;
    };
    const { transcriptionResult, referenceNumber } = body;

    if (!transcriptionResult?.transcript) {
      return NextResponse.json(
        { error: "Resultado de transcripción requerido" },
        { status: 400 },
      );
    }

    console.log(
      `🧠 [EXTRACT-API] Extracting data from transcript: ${transcriptionResult.transcript.length} characters`,
    );

    // Extract property data from transcript
    const extractionResult = await extractPropertyDataFromVoice(
      transcriptionResult,
      referenceNumber,
    );

    console.log("✅ [EXTRACT-API] Data extraction completed successfully");
    console.log(
      `📊 [EXTRACT-API] Extracted ${extractionResult.extractedFields.length} fields`,
    );

    return NextResponse.json({
      success: true,
      ...extractionResult,
      stats: {
        totalFields: extractionResult.extractedFields.length,
        propertyFields: extractionResult.extractedFields.filter(
          (f) => f.dbTable === "properties",
        ).length,
        listingFields: extractionResult.extractedFields.filter(
          (f) => f.dbTable === "listings",
        ).length,
        averageConfidence:
          extractionResult.extractedFields.length > 0
            ? extractionResult.extractedFields.reduce(
                (sum, f) => sum + f.confidence,
                0,
              ) / extractionResult.extractedFields.length
            : 0,
        sources: {
          gpt4: extractionResult.extractedFields.filter(
            (f) => f.extractionSource === "gpt4",
          ).length,
          voicePattern: extractionResult.extractedFields.filter(
            (f) => f.extractionSource === "voice_pattern",
          ).length,
          regex: extractionResult.extractedFields.filter(
            (f) => f.extractionSource === "regex",
          ).length,
        },
      },
    });
  } catch (error) {
    console.error("❌ [EXTRACT-API] Data extraction error:", error);

    let errorMessage = "Error al extraer los datos de la propiedad";

    if (error instanceof Error) {
      if (error.message.includes("API")) {
        errorMessage = "Error del servicio de inteligencia artificial";
      } else if (error.message.includes("parse")) {
        errorMessage = "Error al procesar la información extraída";
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
