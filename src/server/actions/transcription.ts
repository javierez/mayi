"use server";

import { createClient } from "@deepgram/sdk";
import { env } from "~/env";

export interface TranscriptionResult {
  success: boolean;
  transcript?: string;
  language?: string;
  error?: string;
}

/**
 * Transcribes audio using Deepgram Nova-3 model
 *
 * @param audioFile - Audio file as Buffer or base64 string
 * @param options - Optional transcription options
 * @returns TranscriptionResult with transcript or error
 *
 * @example
 * ```typescript
 * const audioBuffer = await file.arrayBuffer();
 * const result = await transcribeAudio(Buffer.from(audioBuffer), {
 *   language: "es",
 *   model: "nova-3"
 * });
 *
 * if (result.success) {
 *   console.log(result.transcript);
 * }
 * ```
 */
export async function transcribeAudio(
  audioFile: Buffer | string,
  options?: {
    language?: string;
    model?: string;
    smartFormat?: boolean;
    punctuate?: boolean;
    diarize?: boolean;
  },
): Promise<TranscriptionResult> {
  try {
    // Convert base64 string to Buffer if needed
    const buffer =
      typeof audioFile === "string"
        ? Buffer.from(audioFile, "base64")
        : audioFile;

    // Validate input
    if (!buffer || buffer.length === 0) {
      return {
        success: false,
        error: "Archivo de audio vacío o inválido",
      };
    }

    // Initialize Deepgram client
    const deepgram = createClient(env.DEEPGRAM_API_KEY);

    // Set up transcription options with defaults
    const transcriptionOptions = {
      model: options?.model ?? "nova-3",
      language: options?.language ?? "es", // Default to Spanish
      smart_format: options?.smartFormat ?? true,
      punctuate: options?.punctuate ?? true,
      diarize: options?.diarize ?? false,
    };

    console.log("Starting transcription with options:", transcriptionOptions);

    // Transcribe the audio file
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      transcriptionOptions,
    );

    if (error) {
      console.error("Deepgram transcription error:", error);
      return {
        success: false,
        error: "Error al transcribir el audio",
      };
    }

    // Extract transcript from result
    const transcript =
      result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    const detectedLanguage = result?.results?.channels?.[0]?.detected_language;

    if (!transcript) {
      return {
        success: false,
        error: "No se pudo extraer la transcripción del audio",
      };
    }

    console.log("Transcription successful:", {
      length: transcript.length,
      language: detectedLanguage,
    });

    return {
      success: true,
      transcript: transcript.trim(),
      language: detectedLanguage,
    };
  } catch (error) {
    console.error("Error in transcribeAudio:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error interno al transcribir el audio",
    };
  }
}

/**
 * Transcribes audio from a URL using Deepgram Nova-3 model
 * Useful for transcribing audio already uploaded to cloud storage
 *
 * @param audioUrl - Public URL of the audio file
 * @param options - Optional transcription options
 * @returns TranscriptionResult with transcript or error
 *
 * @example
 * ```typescript
 * const result = await transcribeAudioUrl(
 *   "https://example.com/audio.mp3",
 *   { language: "es" }
 * );
 * ```
 */
export async function transcribeAudioUrl(
  audioUrl: string,
  options?: {
    language?: string;
    model?: string;
    smartFormat?: boolean;
    punctuate?: boolean;
    diarize?: boolean;
  },
): Promise<TranscriptionResult> {
  try {
    // Validate URL
    if (!audioUrl?.startsWith("http")) {
      return {
        success: false,
        error: "URL de audio inválida",
      };
    }

    // Initialize Deepgram client
    const deepgram = createClient(env.DEEPGRAM_API_KEY);

    // Set up transcription options with defaults
    const transcriptionOptions = {
      model: options?.model ?? "nova-3",
      language: options?.language ?? "es",
      smart_format: options?.smartFormat ?? true,
      punctuate: options?.punctuate ?? true,
      diarize: options?.diarize ?? false,
    };

    console.log(
      "Starting URL transcription with options:",
      transcriptionOptions,
    );

    // Transcribe from URL
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      { url: audioUrl },
      transcriptionOptions,
    );

    if (error) {
      console.error("Deepgram URL transcription error:", error);
      return {
        success: false,
        error: "Error al transcribir el audio desde la URL",
      };
    }

    // Extract transcript from result
    const transcript =
      result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    const detectedLanguage = result?.results?.channels?.[0]?.detected_language;

    if (!transcript) {
      return {
        success: false,
        error: "No se pudo extraer la transcripción del audio",
      };
    }

    console.log("URL transcription successful:", {
      length: transcript.length,
      language: detectedLanguage,
    });

    return {
      success: true,
      transcript: transcript.trim(),
      language: detectedLanguage,
    };
  } catch (error) {
    console.error("Error in transcribeAudioUrl:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error interno al transcribir el audio desde URL",
    };
  }
}
