"use client";

import { useState, useRef, useEffect } from "react";
import { Mic } from "lucide-react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

interface PushToTalkWhisperButtonProps {
  onTranscript: (text: string) => void;
  language?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Click-to-record microphone button using OpenAI Whisper (GPT-4o transcription)
 * Click once to start recording, click again to stop
 * Processes complete audio file after recording stops (batch transcription)
 * Maximum recording duration: 5 minutes
 *
 * @example
 * ```tsx
 * <PushToTalkWhisperButton
 *   onTranscript={(text) => {
 *     setDescription(prev => prev ? `${prev} ${text}` : text);
 *   }}
 *   language="es"
 * />
 * ```
 */
/**
 * Detect if running on iOS Safari
 */
function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

/**
 * Get the best supported audio MIME type for MediaRecorder
 * Prioritizes formats that OpenAI Whisper supports well:
 * - Safari/iOS: audio/mp4 (AAC codec)
 * - Chrome/Edge: audio/webm;codecs=opus
 * - Firefox: audio/webm;codecs=opus or audio/ogg;codecs=opus
 */
function getSupportedMimeType(): { mimeType: string; extension: string } {
  // iOS Safari specific handling - isTypeSupported may not work correctly
  // iOS Safari natively produces MP4/AAC audio
  if (isIOSSafari()) {
    console.log("iOS Safari detected, using audio/mp4");
    // Try mp4 first, then let browser decide with empty string
    if (typeof MediaRecorder !== "undefined") {
      // On iOS Safari, even if isTypeSupported returns false for audio/mp4,
      // the MediaRecorder still produces mp4/aac audio
      const testTypes = ["audio/mp4", "audio/aac", "audio/mpeg", ""];
      for (const mimeType of testTypes) {
        try {
          if (mimeType === "" || MediaRecorder.isTypeSupported(mimeType)) {
            console.log("iOS Safari: selected MIME type:", mimeType || "(browser default)");
            return { mimeType, extension: "mp4" };
          }
        } catch {
          // Some browsers throw on isTypeSupported
        }
      }
    }
    // iOS Safari fallback - use empty mimeType but mp4 extension
    // The browser will use its native format (mp4/aac)
    return { mimeType: "", extension: "mp4" };
  }

  // Prioritized list of MIME types (most compatible with OpenAI Whisper first)
  const mimeTypes = [
    { mimeType: "audio/mp4", extension: "mp4" }, // Safari - best compatibility
    { mimeType: "audio/webm;codecs=opus", extension: "webm" }, // Chrome/Firefox
    { mimeType: "audio/webm", extension: "webm" }, // Chrome fallback
    { mimeType: "audio/ogg;codecs=opus", extension: "ogg" }, // Firefox fallback
    { mimeType: "audio/ogg", extension: "ogg" }, // Firefox fallback
  ];

  for (const { mimeType, extension } of mimeTypes) {
    try {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        console.log("Selected audio MIME type:", mimeType);
        return { mimeType, extension };
      }
    } catch {
      // Some browsers throw on isTypeSupported for certain types
    }
  }

  // Ultimate fallback - let browser decide
  console.warn("No preferred MIME type supported, using browser default");
  return { mimeType: "", extension: "webm" };
}

export function PushToTalkWhisperButton({
  onTranscript,
  language = "es",
  disabled = false,
  className,
}: PushToTalkWhisperButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingToastIdRef = useRef<string | number | undefined>(undefined);
  const mimeTypeRef = useRef<string>("audio/webm");
  const extensionRef = useRef<string>("webm");
  const isIOSRef = useRef<boolean>(false);

  const MAX_RECORDING_DURATION = 300000; // 300 seconds (5 minutes)

  const startRecording = async () => {
    if (disabled || isRecording || isProcessing) return;

    try {
      // Reset state
      audioChunksRef.current = [];

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Get the best supported MIME type for this browser
      const isIOS = isIOSSafari();
      isIOSRef.current = isIOS;
      const { mimeType: supportedMimeType, extension } = getSupportedMimeType();

      // Create MediaRecorder with explicit MIME type if supported
      const mediaRecorderOptions: MediaRecorderOptions = {};
      if (supportedMimeType) {
        mediaRecorderOptions.mimeType = supportedMimeType;
      }

      const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);
      mediaRecorderRef.current = mediaRecorder;

      // Store mimeType and extension now, before recorder is stopped
      // On iOS Safari, always use mp4 extension regardless of what mimeType reports
      // because iOS Safari may incorrectly report audio/webm but produce mp4/aac
      if (isIOS) {
        mimeTypeRef.current = "audio/mp4";
        extensionRef.current = "mp4";
        console.log("iOS Safari: forcing mp4 format");
      } else {
        mimeTypeRef.current = mediaRecorder.mimeType || supportedMimeType || "audio/webm";
        extensionRef.current = extension;
      }

      // Collect audio data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop - process audio
      mediaRecorder.onstop = async () => {
        await processAudio();
      };

      // Start recording with timeslice
      mediaRecorder.start(1000);
      setIsRecording(true);

      // Show persistent recording toast
      const toastId = toast.loading("Grabando audio...", {
        duration: Infinity,
      });
      recordingToastIdRef.current = toastId;

      // Optional: Haptic feedback on mobile
      if ("vibrate" in navigator) {
        navigator.vibrate(50);
      }

      // Auto-stop after max duration
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          stopRecording();
          toast.warning("Grabación detenida: duración máxima alcanzada (5 min)");
        }
      }, MAX_RECORDING_DURATION);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Error al acceder al micrófono. Por favor, permite el acceso.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    // Stop all audio tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);

    // Dismiss the recording toast
    if (recordingToastIdRef.current !== undefined) {
      toast.dismiss(recordingToastIdRef.current);
      recordingToastIdRef.current = undefined;
    }

    // Optional: Haptic feedback on mobile
    if ("vibrate" in navigator) {
      navigator.vibrate(30);
    }
  };

  const processAudio = async () => {
    if (audioChunksRef.current.length === 0) {
      toast.error("No se grabó audio");
      return;
    }

    try {
      setIsProcessing(true);

      // Use stored mimeType and extension (saved before recorder was stopped)
      let mimeType = mimeTypeRef.current;
      let extension = extensionRef.current;

      // Create blob with the actual mimeType
      let audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      if (audioBlob.size < 100) {
        toast.error("Audio demasiado corto");
        return;
      }

      // Detect actual format from magic bytes (first 12 bytes)
      // This helps identify the real format regardless of what mimeType says
      try {
        const header = await audioBlob.slice(0, 12).arrayBuffer();
        const bytes = new Uint8Array(header);

        // Check for common audio format signatures
        const isMp4 = bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70; // "ftyp"
        const isWebm = bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3; // EBML header
        const isOgg = bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53; // "OggS"

        console.log("Audio magic bytes:", Array.from(bytes.slice(0, 12)).map(b => b.toString(16).padStart(2, '0')).join(' '));
        console.log("Format detection:", { isMp4, isWebm, isOgg });

        // If format doesn't match what we think it is, correct it
        if (isMp4 && extension !== "mp4") {
          console.log("Correcting format: detected MP4, was", extension);
          extension = "mp4";
          mimeType = "audio/mp4";
          audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp4" });
        } else if (isWebm && extension !== "webm") {
          console.log("Correcting format: detected WebM, was", extension);
          extension = "webm";
          mimeType = "audio/webm";
          audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        } else if (isOgg && extension !== "ogg") {
          console.log("Correcting format: detected OGG, was", extension);
          extension = "ogg";
          mimeType = "audio/ogg";
          audioBlob = new Blob(audioChunksRef.current, { type: "audio/ogg" });
        }
      } catch (e) {
        console.warn("Could not detect audio format from magic bytes:", e);
      }

      console.log("Audio recording info:", {
        mimeType,
        extension,
        blobSize: audioBlob.size,
        chunksCount: audioChunksRef.current.length,
        isIOS: isIOSRef.current,
      });

      // Create form data
      const formData = new FormData();
      formData.append("file", audioBlob, `recording.${extension}`);
      formData.append("model", "gpt-4o-transcribe");
      formData.append("language", language);
      formData.append("response_format", "json");

      // Send to API with timeout for mobile networks
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      let response: Response;
      try {
        response = await fetch("/api/whisper/transcribe", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        // Handle network-specific errors
        if (fetchError instanceof Error) {
          if (fetchError.name === "AbortError") {
            toast.error("Tiempo de espera agotado. Verifica tu conexión e intenta de nuevo.");
            return;
          }
          if (fetchError.message.includes("network") || fetchError.message.includes("fetch")) {
            toast.error("Error de conexión. Verifica que tienes internet.");
            return;
          }
        }
        throw fetchError;
      }
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Parse error response for more specific messages
        let errorMessage = "Error del servidor";
        try {
          const errorData = await response.json() as { error?: string; type?: string };
          if (errorData.error) {
            // Map common API errors to user-friendly messages
            if (errorData.error.includes("audio") || errorData.error.includes("format")) {
              errorMessage = "Formato de audio no compatible. Intenta grabar de nuevo.";
            } else if (errorData.error.includes("size") || errorData.error.includes("large")) {
              errorMessage = "Audio demasiado largo. Intenta con una grabación más corta.";
            } else if (errorData.error.includes("rate") || errorData.error.includes("limit")) {
              errorMessage = "Demasiadas solicitudes. Espera unos segundos.";
            } else if (errorData.type === "invalid_request_error") {
              errorMessage = "Error en la solicitud. Intenta grabar de nuevo.";
            } else {
              errorMessage = errorData.error;
            }
          }
        } catch {
          // If JSON parsing fails, use status-based message
          if (response.status === 413) {
            errorMessage = "Audio demasiado largo. Intenta con una grabación más corta.";
          } else if (response.status === 429) {
            errorMessage = "Demasiadas solicitudes. Espera unos segundos.";
          } else if (response.status >= 500) {
            errorMessage = "Error del servidor. Intenta de nuevo en unos segundos.";
          }
        }
        console.error("API error:", { status: response.status, message: errorMessage });
        toast.error(errorMessage);
        return;
      }

      const data = await response.json() as { text?: string };

      if (data.text && typeof data.text === "string") {
        onTranscript(data.text);
        toast.success("Audio transcrito correctamente");
      } else {
        toast.error("No se detectó audio claro. Intenta hablar más cerca del micrófono.");
      }
    } catch (error) {
      console.error("Processing error:", error);
      // Provide more specific error messages based on error type
      if (error instanceof TypeError) {
        toast.error("Error de conexión. Verifica tu internet e intenta de nuevo.");
      } else if (error instanceof Error && error.message.includes("API")) {
        toast.error("Error del servicio de transcripción. Intenta de nuevo.");
      } else {
        toast.error("Error al procesar el audio. Intenta grabar de nuevo.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isProcessing) return;

    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      // Cleanup stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Processing state (transcribing)
  if (isProcessing) {
    return (
      <div className={cn("", className)}>
        <button
          type="button"
          className="relative rounded-full bg-blue-500/10 p-1.5 transition-all"
          title="Procesando..."
        >
          <Mic className="h-3.5 w-3.5 animate-pulse text-blue-600" />
        </button>
      </div>
    );
  }

  // Recording state
  if (isRecording) {
    return (
      <div className={cn("", className)}>
        <button
          type="button"
          onClick={handleClick}
          className="relative rounded-full bg-red-500/20 p-1.5 transition-all shadow-md ring-2 ring-red-500/50"
          title="Grabando... Haz clic para detener"
        >
          <Mic className="h-3.5 w-3.5 animate-pulse text-red-600" />
        </button>
      </div>
    );
  }

  // Idle state - ready to record
  return (
    <div className={cn("", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "group relative rounded-full bg-white/60 backdrop-blur-sm p-1.5 transition-all hover:bg-gray-100/80",
          disabled && "cursor-not-allowed opacity-50",
        )}
        title="Haz clic para grabar"
      >
        <Mic className="h-3.5 w-3.5 text-gray-400 transition-colors group-hover:text-gray-600" />
      </button>
    </div>
  );
}
