"use client";

import { useState, useRef } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { transcribeAudio } from "~/server/actions/transcription";
import { toast } from "sonner";

interface AudioTranscriptionButtonProps {
  onTranscript: (text: string) => void;
  language?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
}

/**
 * Reusable audio transcription button component
 * Records audio from the user's microphone and transcribes it using Deepgram Nova-3
 *
 * @example
 * ```tsx
 * <AudioTranscriptionButton
 *   onTranscript={(text) => form.setValue("description", text)}
 *   language="es"
 * />
 * ```
 */
export function AudioTranscriptionButton({
  onTranscript,
  language = "es",
  variant = "ghost",
  size = "icon",
  disabled = false,
}: AudioTranscriptionButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Collect audio data chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());

        // Create audio blob from chunks
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

        // Transcribe the audio
        await transcribeRecording(audioBlob);
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Grabación iniciada");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error(
        "Error al acceder al micrófono. Por favor, permite el acceso.",
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.info("Grabación detenida, transcribiendo...");
    }
  };

  const transcribeRecording = async (audioBlob: Blob) => {
    setIsTranscribing(true);

    try {
      // Convert blob to buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Call server action to transcribe
      const result = await transcribeAudio(buffer, {
        language,
        model: "nova-3",
        smartFormat: true,
        punctuate: true,
      });

      if (result.success && result.transcript) {
        onTranscript(result.transcript);
        toast.success("Audio transcrito correctamente");
      } else {
        toast.error(result.error ?? "Error al transcribir el audio");
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
      toast.error("Error al transcribir el audio");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || isTranscribing}
      title={isRecording ? "Detener grabación" : "Grabar audio"}
    >
      {isTranscribing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <Square className="h-4 w-4 fill-red-500 text-red-500" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
