"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import type { EnhancementStatus, PropertyImage } from "~/types/freepik";

interface UseImageEnhancementProps {
  propertyId: string;
  onSuccess?: (enhancedImage: PropertyImage) => void;
  onComparisonReady?: () => void;
  onError?: (error: string) => void;
}

interface UseImageEnhancementReturn {
  status: EnhancementStatus;
  progress: number;
  error: string | null;
  enhancedPropertyImage: PropertyImage | null;
  originalImageUrl: string | null;
  enhancedImageUrl: string | null;
  enhancementMetadata: {
    referenceNumber: string;
    currentImageOrder: string;
  } | null;
  enhance: (
    imageUrl: string,
    referenceNumber: string,
    currentImageOrder: number,
  ) => Promise<void>;
  saveEnhanced: () => Promise<void>;
  reset: () => void;
  cancel: () => void;
}

/**
 * Custom hook for managing image enhancement with Freepik API
 * Handles the full flow: API call, polling, S3 upload, and database creation
 */
export function useImageEnhancement({
  propertyId,
  onSuccess,
  onComparisonReady,
  onError,
}: UseImageEnhancementProps): UseImageEnhancementReturn {
  const [status, setStatus] = useState<EnhancementStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [enhancedPropertyImage, setEnhancedPropertyImage] =
    useState<PropertyImage | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null);
  const [enhancementMetadata, setEnhancementMetadata] = useState<{
    referenceNumber: string;
    currentImageOrder: string;
  } | null>(null);

  // Refs for cleanup
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Use state instead of ref to track mount status - more reliable in React dev mode
  const [isMounted, setIsMounted] = useState(true);

  // Mount/unmount management
  useEffect(() => {
    setIsMounted(true);

    return () => {
      setIsMounted(false);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const enhance = useCallback(
    async (
      imageUrl: string,
      referenceNumber: string,
      currentImageOrder: number,
    ) => {
      if (!isMounted) {
        return;
      }

      try {
        setStatus("processing");
        setProgress(0);
        setError(null);
        setOriginalImageUrl(imageUrl);
        setEnhancedImageUrl(null);
        setEnhancedPropertyImage(null);

        // 1. Start enhancement
        const startResponse = await fetch(
          `/api/properties/${propertyId}/freepik-enhance`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageUrl,
              referenceNumber,
              currentImageOrder,
            }),
          },
        );

        if (!startResponse.ok) {
          const errorData = (await startResponse.json()) as { error?: string };
          throw new Error(errorData.error ?? "Failed to start enhancement");
        }

        const { taskId } = (await startResponse.json()) as { taskId: string };

        // 2. Set up polling for status updates
        let pollAttempts = 0;
        const maxPollAttempts = 60; // 2 minutes with 2-second intervals

        const pollStatus = async () => {
          if (!isMounted) {
            clearPolling();
            return;
          }

          try {
            pollAttempts++;

            const statusResponse = await fetch(
              `/api/properties/${propertyId}/freepik-enhance?taskId=${taskId}&referenceNumber=${referenceNumber}&currentImageOrder=${currentImageOrder}`,
            );

            if (!statusResponse.ok) {
              throw new Error("Failed to check enhancement status");
            }

            const statusData = (await statusResponse.json()) as {
              status: string;
              progress?: number;
              propertyImage?: PropertyImage;
              enhancedImageUrl?: string;
              referenceNumber?: string;
              currentImageOrder?: string;
              error?: string;
            };

            if (!isMounted) return;

            if (statusData.status === "SUCCESS") {
              clearPolling();
              setStatus("success");
              setProgress(100);

              // Store enhanced image URL and metadata for later saving
              if (statusData.enhancedImageUrl) {
                setEnhancedImageUrl(statusData.enhancedImageUrl);
              }
              if (statusData.referenceNumber && statusData.currentImageOrder) {
                setEnhancementMetadata({
                  referenceNumber: statusData.referenceNumber,
                  currentImageOrder: statusData.currentImageOrder,
                });
              }

              // Call comparison ready callback to show the slider
              if (onComparisonReady) {
                onComparisonReady();
              }

              toast.success("¡Mejora completada! Usa el slider para comparar.");
            } else if (statusData.status === "FAILED") {
              clearPolling();
              const errorMsg = statusData.error ?? "Enhancement failed";
              setStatus("error");
              setError(errorMsg);

              if (onError) {
                onError(errorMsg);
              }

              toast.error("Error al mejorar la imagen");
            } else if (statusData.status === "IN_PROGRESS") {
              // Update progress with a mix of real progress and time-based estimation
              const realProgress = statusData.progress ?? 0;
              const timeProgress = Math.min(pollAttempts * 2, 90); // 2% per attempt, cap at 90%
              const combinedProgress = Math.max(realProgress, timeProgress);

              setProgress(combinedProgress);

              // Continue polling if we haven't exceeded max attempts
              if (pollAttempts >= maxPollAttempts) {
                clearPolling();
                setStatus("error");
                setError("Enhancement timed out");
                toast.error(
                  "La mejora de imagen está tardando más de lo esperado",
                );
              }
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_error) {
            if (!isMounted) return;

            // If we've tried many times, give up
            if (pollAttempts >= 5) {
              clearPolling();
              setStatus("error");
              setError("Failed to check enhancement status");
              toast.error("Error al verificar el progreso");
            }
            // Otherwise, continue polling (network issues might be temporary)
          }
        };

        // Start polling
        pollIntervalRef.current = setInterval(() => {
          void pollStatus();
        }, 2000);

        // Also run initial status check immediately
        setTimeout(() => {
          void pollStatus();
        }, 500);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "Enhancement failed";

        setStatus("error");
        setError(errorMessage);

        if (onError) {
          onError(errorMessage);
        }

        toast.error("Error al iniciar la mejora de imagen");
      }
    },
    [propertyId, onComparisonReady, onError, clearPolling, isMounted],
  );

  const saveEnhanced = useCallback(async () => {
    if (!isMounted) {
      return;
    }

    if (!enhancedImageUrl || !enhancementMetadata) {
      toast.error("No hay imagen mejorada para guardar");
      return;
    }

    try {
      setStatus("processing"); // Show loading state during save

      const saveResponse = await fetch(
        `/api/properties/${propertyId}/save-enhanced`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enhancedImageUrl: enhancedImageUrl,
            referenceNumber: enhancementMetadata.referenceNumber,
            currentImageOrder: enhancementMetadata.currentImageOrder,
          }),
        },
      );

      if (!saveResponse.ok) {
        const errorData = (await saveResponse.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to save enhanced image");
      }

      const saveData = (await saveResponse.json()) as {
        success: boolean;
        propertyImage: PropertyImage;
        message: string;
      };

      // Update state with the saved property image
      setEnhancedPropertyImage(saveData.propertyImage);
      setStatus("success");

      // Now call the success callback with the actual saved image
      if (onSuccess) {
        onSuccess(saveData.propertyImage);
      }

      toast.success("¡Imagen mejorada guardada correctamente!");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save enhanced image";
      setError(errorMessage);
      setStatus("error");

      if (onError) {
        onError(errorMessage);
      }

      toast.error("Error al guardar la imagen mejorada");
    }
  }, [
    propertyId,
    enhancedImageUrl,
    enhancementMetadata,
    onSuccess,
    onError,
    isMounted,
  ]);

  const cancel = useCallback(() => {
    clearPolling();
    setStatus("idle");
    setProgress(0);
    setError(null);
  }, [clearPolling]);

  const reset = useCallback(() => {
    clearPolling();
    setStatus("idle");
    setProgress(0);
    setError(null);
    setEnhancedPropertyImage(null);
    setOriginalImageUrl(null);
    setEnhancedImageUrl(null);
    setEnhancementMetadata(null);
  }, [clearPolling]);

  return {
    status,
    progress,
    error,
    enhancedPropertyImage,
    originalImageUrl,
    enhancedImageUrl,
    enhancementMetadata,
    enhance,
    saveEnhanced,
    reset,
    cancel,
  };
}
