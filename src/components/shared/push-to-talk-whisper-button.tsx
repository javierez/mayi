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

  const MAX_RECORDING_DURATION = 300000; // 300 seconds (5 minutes)

  const startRecording = async () => {
    if (disabled || isRecording || isProcessing) return;

    try {
      // Reset state
      audioChunksRef.current = [];

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create MediaRecorder (browser will choose best format)
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Store mimeType now, before recorder is stopped and ref is nullified
      mimeTypeRef.current = mediaRecorder.mimeType || "audio/webm";

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

      // Use stored mimeType (saved before recorder was stopped)
      const mimeType = mimeTypeRef.current;

      // Create blob with the actual mimeType
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      if (audioBlob.size < 100) {
        toast.error("Audio demasiado corto");
        return;
      }

      // Determine file extension from mime type
      // iOS uses mp4/m4a, Android/Desktop Chrome use webm, Firefox uses ogg
      let extension = "webm";
      if (mimeType.includes("mp4") || mimeType.includes("m4a") || mimeType.includes("aac")) {
        extension = "mp4";
      } else if (mimeType.includes("ogg")) {
        extension = "ogg";
      } else if (mimeType.includes("wav")) {
        extension = "wav";
      }

      console.log("Audio recording info:", {
        mimeType,
        extension,
        blobSize: audioBlob.size,
        chunksCount: audioChunksRef.current.length,
      });

      // Create form data
      const formData = new FormData();
      formData.append("file", audioBlob, `recording.${extension}`);
      formData.append("model", "gpt-4o-transcribe");
      formData.append("language", language);
      formData.append("response_format", "json");

      // Send to API
      const response = await fetch("/api/whisper/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${error}`);
      }

      const data = await response.json() as { text?: string };

      if (data.text && typeof data.text === "string") {
        onTranscript(data.text);
        toast.success("Audio transcrito correctamente");
      } else {
        toast.error("No se pudo transcribir el audio");
      }
    } catch (error) {
      console.error("Processing error:", error);
      toast.error("Error al procesar el audio");
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
