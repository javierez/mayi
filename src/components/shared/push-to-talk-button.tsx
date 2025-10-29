"use client";

import { useState, useRef, useEffect } from "react";
import { Mic } from "lucide-react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

interface PushToTalkButtonProps {
  onTranscript: (text: string) => void;
  language?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Push-to-talk microphone button for real-time voice transcription
 * Records audio only while the button is held down
 * Streams transcription in real-time using Deepgram WebSocket API
 *
 * @example
 * ```tsx
 * <PushToTalkButton
 *   onTranscript={(text) => {
 *     setDescription(prev => prev ? `${prev} ${text}` : text);
 *   }}
 *   language="es"
 * />
 * ```
 */
export function PushToTalkButton({
  onTranscript,
  language = "es",
  disabled = false,
  className,
}: PushToTalkButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const accumulatedTranscriptRef = useRef<string>("");
  const recordingStartTimeRef = useRef<number>(0);

  const MAX_RECORDING_DURATION = 120000; // 120 seconds (2 minutes)

  const startRecording = async () => {
    if (disabled || isRecording) return;

    try {
      // Get API key from environment
      const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;

      if (!apiKey) {
        toast.error("Deepgram API key no configurada");
        return;
      }

      // Request microphone access first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create WebSocket connection to Deepgram
      const wsUrl = `wss://api.deepgram.com/v1/listen?model=nova-3&language=${language}&smart_format=true&punctuate=true&interim_results=true`;
      const socket = new WebSocket(wsUrl, ["token", apiKey]);

      socketRef.current = socket;
      accumulatedTranscriptRef.current = "";
      recordingStartTimeRef.current = Date.now();

      // WebSocket opened
      socket.onopen = () => {
        console.log("Deepgram WebSocket connection opened");

        // Create MediaRecorder to stream audio to Deepgram
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm",
        });

        mediaRecorderRef.current = mediaRecorder;

        // Send audio data to Deepgram as it's recorded
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        };

        // Start recording with small time slices for real-time streaming
        mediaRecorder.start(250); // Send data every 250ms
        setIsRecording(true);

        // Optional: Haptic feedback on mobile
        if ("vibrate" in navigator) {
          navigator.vibrate(50);
        }
      };

      // Handle transcription results in real-time
      socket.onmessage = (message) => {
        const data = JSON.parse(message.data);
        const transcript = data.channel?.alternatives?.[0]?.transcript ?? "";

        if (transcript && transcript.length > 0) {
          if (data.is_final) {
            // Final result - append to accumulated transcript
            accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? " " : "") + transcript;
            // Update the form field in real-time
            onTranscript(accumulatedTranscriptRef.current);
          } else {
            // Interim result - show what's being said right now
            const fullText = accumulatedTranscriptRef.current + (accumulatedTranscriptRef.current ? " " : "") + transcript;
            onTranscript(fullText);
          }
        }
      };

      socket.onclose = () => {
        console.log("Deepgram WebSocket connection closed");
      };

      socket.onerror = (error) => {
        console.error("Deepgram WebSocket error:", error);
        toast.error("Error en la conexión de transcripción");
      };

      // Auto-stop after max duration
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
          toast.warning("Grabación detenida: duración máxima alcanzada (2 min)");
        }
      }, MAX_RECORDING_DURATION);

    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error(
        "Error al acceder al micrófono. Por favor, permite el acceso.",
      );
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    // Stop all audio tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Close WebSocket connection
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      // Send close message to Deepgram
      socketRef.current.send(JSON.stringify({ type: "CloseStream" }));
      socketRef.current.close();
      socketRef.current = null;
    }

    setIsRecording(false);

    // Optional: Haptic feedback on mobile
    if ("vibrate" in navigator) {
      navigator.vibrate(30);
    }

    // Show success message if we got any transcript
    if (accumulatedTranscriptRef.current) {
      toast.success("Audio transcrito correctamente");
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    void startRecording();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    stopRecording();
  };

  const handleMouseLeave = () => {
    // Stop recording if user drags away (safety feature)
    if (isRecording) {
      stopRecording();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    void startRecording();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    stopRecording();
  };

  const handleTouchCancel = () => {
    // Stop recording if touch is interrupted (e.g., notification, call)
    if (isRecording) {
      stopRecording();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Recording state with subtle gray pulsating effect
  if (isRecording) {
    return (
      <div
        className={cn("absolute right-2 top-2", className)}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {/* Outer subtle pulse ring */}
        <div className="absolute inset-0 -m-1 animate-pulse rounded-full bg-gray-200/30" />

        {/* Main button with subtle shadow */}
        <button
          type="button"
          className="relative z-10 animate-pulse rounded-full bg-white p-2 shadow-md ring-2 ring-gray-300/40"
          title="Grabando... Suelta para detener"
        >
          <Mic className="h-4 w-4 text-gray-700" />
        </button>
      </div>
    );
  }

  // Idle state
  return (
    <div className={cn("absolute right-2 top-2", className)}>
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        disabled={disabled}
        className={cn(
          "rounded-full p-2 text-gray-400 transition-all hover:text-gray-600 active:scale-95",
          disabled && "cursor-not-allowed opacity-50",
        )}
        title="Mantén presionado para grabar"
      >
        <Mic className="h-4 w-4" />
      </button>
    </div>
  );
}
