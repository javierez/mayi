"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "~/lib/utils";
import { toast } from "sonner";
import {
  Mic,
  Pause,
  Play,
  Square,
  RotateCcw,
  Send,
  Upload,
  Headphones,
  Brain,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

/**
 * Detect if running on iOS Safari
 */
function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari =
    ua.includes("Safari") &&
    !["Chrome", "CriOS", "FxiOS", "EdgiOS"].some((browser) =>
      ua.includes(browser),
    );
  return isIOS && isSafari;
}

/**
 * Get the best supported audio MIME type for MediaRecorder
 * Prioritizes formats that OpenAI Whisper supports well
 */
function getSupportedMimeType(): { mimeType: string; extension: string } {
  // iOS Safari specific handling
  if (isIOSSafari()) {
    console.log("iOS Safari detected, using audio/mp4");
    if (typeof MediaRecorder !== "undefined") {
      const testTypes = ["audio/mp4", "audio/aac", "audio/mpeg", ""];
      for (const mimeType of testTypes) {
        try {
          if (mimeType === "" || MediaRecorder.isTypeSupported(mimeType)) {
            console.log(
              "iOS Safari: selected MIME type:",
              mimeType || "(browser default)",
            );
            return { mimeType, extension: "mp4" };
          }
        } catch {
          // Some browsers throw on isTypeSupported
        }
      }
    }
    return { mimeType: "", extension: "mp4" };
  }

  // Prioritized list of MIME types (most compatible with OpenAI Whisper first)
  const mimeTypes = [
    { mimeType: "audio/mp4", extension: "mp4" },
    { mimeType: "audio/webm;codecs=opus", extension: "webm" },
    { mimeType: "audio/webm", extension: "webm" },
    { mimeType: "audio/ogg;codecs=opus", extension: "ogg" },
    { mimeType: "audio/ogg", extension: "ogg" },
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
import type {
  EnhancedExtractedPropertyData,
  ExtractedFieldResult,
} from "~/types/textract-enhanced";
import { VoiceFieldValidationModal } from "~/components/forms/voice";

interface VoiceRecordingEnhancedProps {
  onProcessingComplete: (extractedData: EnhancedExtractedPropertyData) => void;
  onRetryRecording?: () => void;
  onManualEntry?: () => void;
  referenceNumber?: string;
  className?: string;
}

type ProcessingStep =
  | "idle"
  | "uploading"
  | "transcribing"
  | "extracting"
  | "complete"
  | "error";

interface ProcessingState {
  step: ProcessingStep;
  progress: number;
  message: string;
  error?: string;
}

const PROCESSING_STEPS: Record<
  ProcessingStep,
  { icon: React.ElementType; color: string; label: string }
> = {
  idle: { icon: Mic, color: "text-amber-600", label: "Listo para grabar" },
  uploading: { icon: Upload, color: "text-amber-600", label: "Subiendo audio" },
  transcribing: {
    icon: Headphones,
    color: "text-rose-500",
    label: "Transcribiendo",
  },
  extracting: {
    icon: Brain,
    color: "text-amber-500",
    label: "Extrayendo datos",
  },
  complete: {
    icon: CheckCircle2,
    color: "text-green-500",
    label: "Completado",
  },
  error: { icon: AlertCircle, color: "text-red-500", label: "Error" },
};

export function VoiceRecordingEnhanced({
  onProcessingComplete,
  onRetryRecording: _onRetryRecording,
  onManualEntry,
  referenceNumber = "temp",
  className,
}: VoiceRecordingEnhancedProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [, setAudioLevel] = useState(0);
  const [, setFrequencyData] = useState<number[]>(
    new Array(40).fill(0),
  );
  const waveAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    step: "idle",
    progress: 0,
    message: "",
  });
  const [, setExtractedData] = useState<EnhancedExtractedPropertyData | null>(
    null,
  );
  const [extractedFields, setExtractedFields] = useState<
    ExtractedFieldResult[]
  >([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mimeTypeRef = useRef<string>("audio/webm");
  const extensionRef = useRef<string>("webm");

  const MAX_RECORDING_DURATION = 300; // 5 minutes in seconds

  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const suggestionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const recordingSuggestions = [
    "¿Cuál es la dirección completa?",
    "¿Cuántas habitaciones y baños tiene?",
    "¿Cuál es el precio de venta o alquiler?",
    "¿Cuántos metros cuadrados tiene?",
    "¿Tiene garaje o trastero?",
    "¿Qué orientación tiene?",
    "¿En qué estado de conservación está?",
    "¿Tiene ascensor el edificio?",
    "¿Qué tipo de calefacción tiene?",
  ];

  // Get 3 suggestions starting from current index
  const getVisibleSuggestions = () => {
    const suggestions = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentSuggestionIndex + i) % recordingSuggestions.length;
      suggestions.push(recordingSuggestions[index]);
    }
    return suggestions;
  };

  // Simulated waveform animation that mimics natural speech patterns
  const simulateWaveform = () => {
    if (!isRecording || isPaused) return;

    const newFrequencyData = Array.from({ length: 40 }, (_, i) => {
      // Create natural speech-like patterns with varying intensities
      const baseIntensity = Math.sin(Date.now() * 0.001 + i * 0.3) * 30 + 40;
      const speechVariation = Math.sin(Date.now() * 0.003 + i * 0.1) * 20;
      const randomNoise = (Math.random() - 0.5) * 15;

      // Create occasional "speech bursts" for more realism
      const burstChance = Math.sin(Date.now() * 0.0008) > 0.7 ? 25 : 0;

      // Different frequency ranges have different intensities (like human speech)
      const frequencyMultiplier = i < 10 ? 0.8 : i < 25 ? 1.2 : 0.9;

      let height =
        (baseIntensity + speechVariation + randomNoise + burstChance) *
        frequencyMultiplier;

      // Ensure realistic bounds
      height = Math.max(8, Math.min(height, 85));

      return height;
    });

    setFrequencyData(newFrequencyData);

    // Calculate average for audio level and pulse effects
    const avgLevel =
      newFrequencyData.reduce((sum, val) => sum + val, 0) /
      newFrequencyData.length;
    setAudioLevel(avgLevel / 85); // Normalize to 0-1
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get the best supported MIME type for this browser
      const { mimeType: supportedMimeType, extension } = getSupportedMimeType();
      mimeTypeRef.current = supportedMimeType || "audio/webm";
      extensionRef.current = extension;

      // Create MediaRecorder with detected MIME type
      const mediaRecorderOptions: MediaRecorderOptions = {};
      if (supportedMimeType) {
        mediaRecorderOptions.mimeType = supportedMimeType;
      }

      const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Start simulated waveform animation
      waveAnimationRef.current = setInterval(simulateWaveform, 50); // 20fps animation

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        // Use the detected MIME type for the blob
        const detectedMimeType =
          mediaRecorder.mimeType || mimeTypeRef.current || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, {
          type: detectedMimeType,
        });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());

        // Stop animation
        if (waveAnimationRef.current) {
          clearInterval(waveAnimationRef.current);
        }
        setAudioLevel(0);
        setFrequencyData(new Array(40).fill(8)); // Set to minimum height
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setProcessingState({ step: "idle", progress: 0, message: "" });

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Start suggestion rotation
      setCurrentSuggestionIndex(0);
      suggestionTimerRef.current = setInterval(() => {
        setCurrentSuggestionIndex(
          (prev) => (prev + 1) % recordingSuggestions.length,
        );
      }, 6000);

      // Haptic feedback on mobile
      if ("vibrate" in navigator) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error(
        "No se pudo acceder al micrófono. Por favor, verifica los permisos.",
      );
    }
  };

  const pauseRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);

      // Stop animation
      if (waveAnimationRef.current) {
        clearInterval(waveAnimationRef.current);
      }
      setFrequencyData(new Array(40).fill(8)); // Set to minimum height
      setAudioLevel(0);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (suggestionTimerRef.current) {
        clearInterval(suggestionTimerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused"
    ) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Restart animation
      waveAnimationRef.current = setInterval(simulateWaveform, 50);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Restart suggestion rotation
      suggestionTimerRef.current = setInterval(() => {
        setCurrentSuggestionIndex(
          (prev) => (prev + 1) % recordingSuggestions.length,
        );
      }, 6000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      // Stop animation
      if (waveAnimationRef.current) {
        clearInterval(waveAnimationRef.current);
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (suggestionTimerRef.current) {
        clearInterval(suggestionTimerRef.current);
        suggestionTimerRef.current = null;
      }
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setIsRecording(false);
    setIsPaused(false);
    setCurrentSuggestionIndex(0);
    setProcessingState({ step: "idle", progress: 0, message: "" });
    setExtractedData(null);
    setAudioLevel(0);
    setFrequencyData(new Array(40).fill(8)); // Set to minimum height

    // Clear all timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (suggestionTimerRef.current) {
      clearInterval(suggestionTimerRef.current);
      suggestionTimerRef.current = null;
    }
    if (waveAnimationRef.current) {
      clearInterval(waveAnimationRef.current);
      waveAnimationRef.current = null;
    }
  };

  const processRecording = async () => {
    if (!audioBlob) return;

    try {
      // Step 1: Upload audio
      setProcessingState({
        step: "uploading",
        progress: 25,
        message: "Subiendo grabación de audio...",
      });

      const formData = new FormData();
      formData.append("audio", audioBlob, `recording.${extensionRef.current}`);
      formData.append("referenceNumber", referenceNumber);

      const processResponse = await fetch("/api/voice-processing/process", {
        method: "POST",
        body: formData,
      });

      // Primero obtener el resultado JSON
      const result = (await processResponse.json()) as {
        propertyData?: EnhancedExtractedPropertyData;
        extractedFields?: ExtractedFieldResult[];
        error?: string;
        errorStep?: string;
        details?: string;
      };

      // Verificar si la respuesta no es OK o si hay un error en el resultado
      if (!processResponse.ok || result.error) {
        const errorMessage = result.error ?? "Error al procesar el audio";
        const errorDetails = result.details ?? "";

        console.error("Error del servidor:", errorMessage, errorDetails);

        // Mostrar error específico según el paso donde falló
        let userMessage = errorMessage;
        if (result.errorStep === "transcription") {
          userMessage = "No se pudo transcribir el audio. " + errorMessage;
        } else if (result.errorStep === "upload") {
          userMessage = "Error al subir el archivo. " + errorMessage;
        } else if (result.errorStep === "extraction") {
          userMessage = "Error al extraer los datos. " + errorMessage;
        }

        setProcessingState({
          step: "error",
          progress: 0,
          message: userMessage,
          error: errorDetails || errorMessage,
        });

        // No lanzar error, simplemente retornar para que el usuario pueda reintentar
        return;
      }

      // Update states as we receive progress
      setProcessingState({
        step: "transcribing",
        progress: 50,
        message: "Transcribiendo audio a texto...",
      });

      setProcessingState({
        step: "extracting",
        progress: 75,
        message: "Extrayendo información de la propiedad...",
      });

      setProcessingState({
        step: "complete",
        progress: 100,
        message: "¡Procesamiento completado!",
      });

      if (result.propertyData && result.extractedFields) {
        setExtractedData(result.propertyData);
        setExtractedFields(result.extractedFields);
        // Show validation modal instead of directly calling callback
        setShowValidationModal(true);
      }

      // Auto-reset after showing success
      setTimeout(() => {
        resetRecording();
      }, 3000);
    } catch (error) {
      console.error("Error processing recording:", error);
      setProcessingState({
        step: "error",
        progress: 0,
        message: "Error al procesar la grabación. Por favor, intenta de nuevo.",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Modal handlers
  const handleModalConfirm = (confirmedData: EnhancedExtractedPropertyData) => {
    setShowValidationModal(false);
    onProcessingComplete(confirmedData);

    // Auto-reset after confirmation
    setTimeout(() => {
      resetRecording();
    }, 1000);
  };

  const handleModalClose = () => {
    setShowValidationModal(false);
    resetRecording();
  };

  // Max recording duration warning and auto-stop
  useEffect(() => {
    if (isRecording && !isPaused && recordingTime >= MAX_RECORDING_DURATION) {
      stopRecording();
      toast.warning("Duración máxima alcanzada (5 minutos). Grabación detenida.");
    } else if (
      isRecording &&
      !isPaused &&
      recordingTime === MAX_RECORDING_DURATION - 30
    ) {
      // 30 second warning
      toast.info("Quedan 30 segundos de grabación");
    }
  }, [recordingTime, isRecording, isPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (suggestionTimerRef.current) {
        clearInterval(suggestionTimerRef.current);
      }
      if (waveAnimationRef.current) {
        clearInterval(waveAnimationRef.current);
      }
    };
  }, []);

  const isProcessing =
    processingState.step !== "idle" &&
    processingState.step !== "error" &&
    processingState.step !== "complete";
  const StepIcon = PROCESSING_STEPS[processingState.step].icon;

  return (
    <div className={cn("w-full max-w-md", className)}>
      <div className="py-8">
        <div className="text-center">
          {/* Processing Status Icon - only shown when processing */}
          {isProcessing && (
            <div className="mb-6">
              <StepIcon
                className={cn(
                  "mx-auto h-10 w-10 transition-all duration-300",
                  PROCESSING_STEPS[processingState.step].color,
                  processingState.step !== "complete" &&
                    processingState.step !== "error" &&
                    "animate-pulse",
                )}
              />
            </div>
          )}

          {/* Timer or Processing Status */}
          {isProcessing || processingState.step === "error" ? (
            <div className="mb-6">
              <p
                className={cn(
                  "mb-3 text-lg font-medium",
                  processingState.step === "error"
                    ? "text-red-600"
                    : "text-gray-700",
                )}
              >
                {PROCESSING_STEPS[processingState.step].label}
              </p>
              {processingState.step !== "error" && (
                <div className="mx-auto mb-3 h-1 w-48 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-400 transition-all duration-500"
                    style={{ width: `${processingState.progress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6 font-mono text-3xl tracking-widest text-gray-600">
              {formatTime(recordingTime)}
            </div>
          )}

          {/* Minimal Status Message - only when not recording */}
          {!isProcessing && !isRecording && (
            <p className="mb-6 text-sm text-gray-400">
              {audioBlob ? "Listo para procesar" : "Toca para grabar"}
            </p>
          )}

          {/* Control Buttons */}
          {!isProcessing && (
            <div className="flex items-center justify-center gap-3">
              {!isRecording && !audioBlob && (
                <button
                  onClick={startRecording}
                  className="rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-4 text-white shadow-lg transition-all hover:scale-105 hover:from-amber-500 hover:to-rose-500"
                >
                  <Mic className="h-6 w-6" />
                </button>
              )}

              {isRecording && !isPaused && (
                <>
                  <button
                    onClick={pauseRecording}
                    className="rounded-full bg-gray-100 p-4 text-gray-500 transition-all hover:bg-gray-200 hover:text-gray-700"
                  >
                    <Pause className="h-6 w-6" />
                  </button>
                  <button
                    onClick={stopRecording}
                    className="rounded-full bg-gray-100 p-4 text-gray-500 transition-all hover:bg-gray-200 hover:text-gray-700"
                  >
                    <Square className="h-6 w-6" />
                  </button>
                </>
              )}

              {isRecording && isPaused && (
                <>
                  <button
                    onClick={resumeRecording}
                    className="rounded-full bg-gray-100 p-4 text-gray-500 transition-all hover:bg-gray-200 hover:text-gray-700"
                  >
                    <Play className="h-6 w-6" />
                  </button>
                  <button
                    onClick={stopRecording}
                    className="rounded-full bg-gray-100 p-4 text-gray-500 transition-all hover:bg-gray-200 hover:text-gray-700"
                  >
                    <Square className="h-6 w-6" />
                  </button>
                </>
              )}

              {audioBlob && !isRecording && (
                <>
                  <button
                    onClick={resetRecording}
                    className="rounded-full bg-gray-100 p-4 text-gray-700 transition-all hover:bg-gray-200"
                  >
                    <RotateCcw className="h-6 w-6" />
                  </button>
                  <button
                    onClick={processRecording}
                    className="rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-4 text-white shadow-lg transition-all hover:scale-105 hover:from-amber-500 hover:to-rose-500"
                  >
                    <Send className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Recording tips - below buttons */}
          {isRecording && !isPaused && (
            <ul className="mt-8 space-y-2 text-left text-sm">
              {getVisibleSuggestions().map((suggestion, i) => (
                <li
                  key={`${currentSuggestionIndex}-${i}`}
                  className={cn(
                    "flex items-center gap-2 text-gray-400",
                    "animate-in fade-in slide-in-from-top-1 duration-300 ease-out fill-mode-both",
                  )}
                  style={{
                    opacity: 1 - i * 0.2,
                    animationDelay: `${i * 100}ms`,
                  }}
                >
                  <span
                    className="h-1 w-1 flex-shrink-0 rounded-full bg-gray-300"
                    style={{ opacity: 1 - i * 0.25 }}
                  />
                  {suggestion}
                </li>
              ))}
            </ul>
          )}

          {/* Retry button for errors */}
          {processingState.step === "error" && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={resetRecording}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 px-5 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
              >
                <RotateCcw className="h-4 w-4" />
                Reintentar
              </button>
              {onManualEntry && (
                <button
                  onClick={onManualEntry}
                  className="rounded-full px-5 py-2 text-sm font-medium text-gray-500 transition-all hover:text-gray-700"
                >
                  Entrada manual
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Voice Field Validation Modal */}
      <VoiceFieldValidationModal
        isOpen={showValidationModal}
        onClose={handleModalClose}
        extractedFields={extractedFields}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
}
