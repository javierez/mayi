"use server";

import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  language: string;
  duration?: number;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
    confidence?: number;
  }>;
}

/**
 * Transcribe audio using OpenAI Whisper API
 * Optimized for Spanish real estate terminology
 */
export async function transcribeAudio(
  audioUrl: string,
  options: {
    language?: string;
    prompt?: string;
    temperature?: number;
  } = {},
): Promise<TranscriptionResult> {
  try {
    console.log(`🎤 [TRANSCRIPTION] Starting transcription for: ${audioUrl}`);

    // Fetch the audio file from S3
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(
        `Failed to fetch audio from S3: ${audioResponse.statusText}`,
      );
    }

    // Extract file extension from URL and determine MIME type
    const urlExtension = audioUrl.split(".").pop()?.split("?")[0] ?? "webm";
    const extensionToMimeType: Record<string, string> = {
      webm: "audio/webm",
      wav: "audio/wav",
      mp3: "audio/mp3",
      ogg: "audio/ogg",
      mp4: "audio/mp4",
      m4a: "audio/m4a",
      aac: "audio/aac",
    };
    const mimeType = extensionToMimeType[urlExtension] ?? "audio/webm";

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioFile = new File([audioBuffer], `recording.${urlExtension}`, {
      type: mimeType,
    });

    // Configure transcription with Spanish real estate context
    const transcriptionOptions: OpenAI.Audio.Transcriptions.TranscriptionCreateParams =
      {
        file: audioFile,
        model: "whisper-1",
        language: options.language ?? "es", // Spanish by default
        response_format: "verbose_json", // Get detailed response with timestamps
        temperature: options.temperature ?? 0.1, // Low temperature for accuracy
        // Provide context prompt for better Spanish real estate terminology recognition
        prompt:
          options.prompt ??
          "Esta es una descripción de una propiedad inmobiliaria en español. " +
            "Incluye información sobre: precio, ubicación, metros cuadrados, habitaciones, baños, " +
            "características como ascensor, garaje, trastero, orientación, estado de conservación, " +
            "calefacción, aire acondicionado, terraza, jardín, piscina, y otros detalles de la vivienda.",
      };

    console.log(`🎤 [TRANSCRIPTION] Calling OpenAI Whisper API...`);

    const transcription =
      await openai.audio.transcriptions.create(transcriptionOptions);

    // Extract the main transcript text
    const transcript = transcription.text ?? "";

    // Calculate overall confidence from segments if available
    let confidence = 85; // Default confidence for Whisper
    const transcriptionAny = transcription as unknown as {
      segments?: Array<{
        text?: string;
        start?: number;
        end?: number;
        avg_logprob?: number;
      }>;
      language?: string;
      duration?: number;
    };
    if (transcriptionAny.segments && Array.isArray(transcriptionAny.segments)) {
      const segmentConfidences = transcriptionAny.segments
        .map((seg) => (seg.avg_logprob ? Math.exp(seg.avg_logprob) * 100 : 85))
        .filter((conf: number) => conf > 0);

      if (segmentConfidences.length > 0) {
        confidence =
          segmentConfidences.reduce(
            (sum: number, conf: number) => sum + conf,
            0,
          ) / segmentConfidences.length;
      }
    }

    // Extract segments for detailed analysis if available
    const segments =
      transcriptionAny.segments && Array.isArray(transcriptionAny.segments)
        ? transcriptionAny.segments.map((seg) => ({
            text: seg.text ?? "",
            start: seg.start ?? 0,
            end: seg.end ?? 0,
            confidence: seg.avg_logprob
              ? Math.exp(seg.avg_logprob) * 100
              : undefined,
          }))
        : undefined;

    const result: TranscriptionResult = {
      transcript: transcript.trim(),
      confidence: Math.round(confidence),
      language: transcriptionAny.language ?? "es",
      duration: transcriptionAny.duration,
      segments,
    };

    console.log(`✅ [TRANSCRIPTION] Transcription completed:`);
    console.log(`   - Text length: ${result.transcript.length} characters`);
    console.log(`   - Confidence: ${result.confidence}%`);
    console.log(`   - Language: ${result.language}`);
    console.log(`   - Duration: ${result.duration ?? "unknown"}s`);
    console.log(`   - Segments: ${result.segments?.length ?? 0}`);

    // Log the full transcript
    console.log(`\n📝 [TRANSCRIPTION] Full transcript:`);
    console.log(`=====================================`);
    console.log(result.transcript);
    console.log(`=====================================\n`);

    // Validate transcript quality
    if (!result.transcript || result.transcript.length < 10) {
      console.warn(
        `⚠️ [TRANSCRIPTION] Transcripción muy corta: ${result.transcript.length} caracteres`,
      );
      // Devolver resultado con transcripción vacía pero con indicador de error
      return {
        ...result,
        transcript: "", // Transcripción vacía para indicar que no hay contenido válido
        confidence: 0,
        error:
          "Transcripción muy corta o vacía. Por favor, graba de nuevo con más claridad.",
      } as TranscriptionResult & { error?: string };
    }

    if (result.confidence < 50) {
      console.warn(`⚠️ [TRANSCRIPTION] Confianza baja: ${result.confidence}%`);
    }

    return result;
  } catch (error) {
    console.error("❌ [TRANSCRIPTION] Error al transcribir audio:", error);

    let errorMessage =
      "Error al transcribir el audio. Por favor, intenta de nuevo.";

    if (error instanceof Error) {
      // Mensajes de error amigables en español
      if (error.message.includes("fetch")) {
        errorMessage =
          "Error al descargar el audio. Por favor, intenta de nuevo.";
      } else if (error.message.includes("audio")) {
        errorMessage = "Formato de audio no válido. Por favor, graba de nuevo.";
      } else if (error.message.includes("API")) {
        errorMessage =
          "Error del servicio de transcripción. Por favor, intenta más tarde.";
      }
    }

    // Devolver resultado con error en lugar de lanzar excepción
    return {
      transcript: "",
      confidence: 0,
      language: "es",
      error: errorMessage,
    } as TranscriptionResult & { error?: string };
  }
}

/**
 * Enhanced transcription with post-processing for Spanish real estate
 */
export async function transcribeRealEstateAudio(
  audioUrl: string,
  referenceNumber?: string,
): Promise<TranscriptionResult> {
  console.log(
    `🏠 [REAL-ESTATE-TRANSCRIPTION] Starting real estate transcription for ref: ${referenceNumber}`,
  );

  // Use specialized prompt for real estate
  const realEstatePrompt =
    "Transcripción de una descripción detallada de una propiedad inmobiliaria en España. " +
    "La descripción puede incluir: precio en euros, dirección completa, metros cuadrados (m² o m2), " +
    "número de dormitorios y baños, plantas del edificio, características como ascensor, " +
    "garaje o parking, trastero, balcón, terraza, jardín, piscina, orientación (norte, sur, este, oeste), " +
    "estado de conservación, tipo de calefacción, aire acondicionado, cocina equipada, " +
    "certificado energético, año de construcción, y detalles de la zona y transporte público.";

  const result = await transcribeAudio(audioUrl, {
    language: "es",
    prompt: realEstatePrompt,
    temperature: 0.05, // Very low for maximum accuracy
  });

  // Post-process the transcript for real estate specifics
  const enhancedTranscript = postProcessRealEstateTranscript(result.transcript);

  // Log the enhanced transcript if it's different
  if (enhancedTranscript !== result.transcript) {
    console.log(`\n🏠 [REAL-ESTATE-TRANSCRIPTION] Post-processed transcript:`);
    console.log(`=====================================`);
    console.log(enhancedTranscript);
    console.log(`=====================================\n`);
  }

  return {
    ...result,
    transcript: enhancedTranscript,
  };
}

/**
 * Post-process transcript to standardize Spanish real estate terminology
 */
function postProcessRealEstateTranscript(transcript: string): string {
  let processed = transcript;

  // Standardize common real estate terms
  const termReplacements: Record<string, string> = {
    // Numbers and measurements
    "metros cuadrados": "m²",
    "metro cuadrado": "m²",
    metros: "m²",
    m2: "m²",
    "m 2": "m²",

    // Property types
    apartamento: "piso",
    flat: "piso",
    department: "piso",

    // Features
    parking: "garaje",
    aparcamiento: "garaje",
    cochera: "garaje",
    "plaza de garaje": "garaje",

    // Rooms
    cuartos: "habitaciones",
    dormitorios: "habitaciones",
    dorm: "habitaciones",
    hab: "habitaciones",

    aseos: "baños",
    servicios: "baños",
    wc: "baños",

    // Features
    "aire acondicionado": "aire acondicionado",
    "a/c": "aire acondicionado",
    aa: "aire acondicionado",

    // Conditions
    "buen estado": "buen estado",
    "buena conservación": "buen estado",
    "para reformar": "a reformar",
    "necesita reforma": "a reformar",

    // Orientations
    "hacia el norte": "orientación norte",
    "hacia el sur": "orientación sur",
    "hacia el este": "orientación este",
    "hacia el oeste": "orientación oeste",
  };

  // Apply replacements
  for (const [search, replace] of Object.entries(termReplacements)) {
    const regex = new RegExp(search, "gi");
    processed = processed.replace(regex, replace);
  }

  // Standardize euro amounts
  processed = processed.replace(
    /(\d+(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*euros?/gi,
    "$1€",
  );
  processed = processed.replace(
    /(\d+(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*eur/gi,
    "$1€",
  );

  // Standardize square meters
  processed = processed.replace(
    /(\d+(?:[.,]\d+)?)\s*metros?\s*cuadrados?/gi,
    "$1 m²",
  );
  processed = processed.replace(/(\d+(?:[.,]\d+)?)\s*m2/gi, "$1 m²");

  // Clean up extra spaces
  processed = processed.replace(/\s+/g, " ").trim();

  return processed;
}
