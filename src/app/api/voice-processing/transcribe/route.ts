import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { transcribeRealEstateAudio } from "~/server/transcription/transcription-service";
import { getSecureSession } from "~/lib/dal";

export async function POST(request: NextRequest) {
  try {
    console.log("🎤 [TRANSCRIBE-API] Starting transcription...");

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
      audioUrl?: string;
      referenceNumber?: string;
    };
    const { audioUrl, referenceNumber } = body;

    if (!audioUrl) {
      return NextResponse.json(
        { error: "URL de audio requerida" },
        { status: 400 },
      );
    }

    console.log(`🎤 [TRANSCRIBE-API] Transcribing audio: ${audioUrl}`);

    // Transcribe audio using OpenAI Whisper
    const transcriptionResult = await transcribeRealEstateAudio(
      audioUrl,
      referenceNumber,
    );

    console.log("✅ [TRANSCRIBE-API] Transcription completed successfully");
    console.log(
      `📝 [TRANSCRIBE-API] Transcript length: ${transcriptionResult.transcript.length} characters`,
    );

    return NextResponse.json({
      success: true,
      ...transcriptionResult,
    });
  } catch (error) {
    console.error("❌ [TRANSCRIBE-API] Transcription error:", error);

    let errorMessage = "Error al transcribir el audio";

    if (error instanceof Error) {
      if (error.message.includes("fetch")) {
        errorMessage = "Error al descargar el audio desde el almacenamiento";
      } else if (error.message.includes("API")) {
        errorMessage = "Error del servicio de transcripción";
      } else if (error.message.includes("format")) {
        errorMessage = "Formato de audio no compatible";
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
