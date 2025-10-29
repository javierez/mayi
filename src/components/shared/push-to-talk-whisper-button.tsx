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
 * Push-to-talk microphone button using OpenAI Whisper (GPT-4o transcription)
 * Records audio only while the button is held down
 * Processes complete audio file after recording stops (batch transcription)
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

  const MAX_RECORDING_DURATION = 120000; // 120 seconds (2 minutes)

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

      // Optional: Haptic feedback on mobile
      if ("vibrate" in navigator) {
        navigator.vibrate(50);
      }

      // Auto-stop after max duration
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          stopRecording();
          toast.warning("Grabación detenida: duración máxima alcanzada (2 min)");
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

      // Get the actual mimeType from MediaRecorder
      const mimeType = mediaRecorderRef.current?.mimeType ?? "audio/webm";

      // Create blob with the actual mimeType
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      if (audioBlob.size < 100) {
        toast.error("Audio demasiado corto");
        return;
      }

      // Determine file extension from mime type
      let extension = "webm";
      if (mimeType.includes("mp4")) extension = "mp4";
      else if (mimeType.includes("ogg")) extension = "ogg";
      else if (mimeType.includes("wav")) extension = "wav";

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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isRecording && !isProcessing) {
      void startRecording();
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRecording) {
      stopRecording();
    }
  };

  const handleMouseLeave = () => {
    // Stop recording if user drags away (safety feature)
    if (isRecording) {
      stopRecording();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isRecording && !isProcessing) {
      void startRecording();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRecording) {
      stopRecording();
    }
  };

  const handleTouchCancel = () => {
    // Stop recording if touch is interrupted (e.g., notification, call)
    if (isRecording) {
      stopRecording();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click events to avoid toggle behavior
    e.preventDefault();
    e.stopPropagation();
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
      <div className={cn("absolute right-2 top-2", className)}>
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
      <div
        className={cn("absolute right-2 top-2", className)}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <button
          type="button"
          className="relative rounded-full bg-red-500/10 p-1.5 transition-all"
          title="Grabando... Suelta para detener"
        >
          <Mic className="h-3.5 w-3.5 animate-pulse text-red-600" />
        </button>
      </div>
    );
  }

  // Idle state - ready to record
  return (
    <div className={cn("absolute right-2 top-2", className)}>
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "group relative rounded-full bg-transparent p-1.5 transition-all hover:bg-gray-100",
          disabled && "cursor-not-allowed opacity-50",
        )}
        title="Mantén presionado para grabar"
      >
        <Mic className="h-3.5 w-3.5 text-gray-400 transition-colors group-hover:text-gray-600" />
      </button>
    </div>
  );
}
