"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type {
  RenovationStatus,
  PropertyImage,
  RenovationType,
} from "~/types/gemini";
import { createDataUrl } from "~/lib/image-utils";

interface UseImageRenovationProps {
  propertyId: string;
  onSuccess?: (renovatedImage: PropertyImage) => void;
  onComparisonReady?: () => void;
  onError?: (error: string) => void;
}

interface UseImageRenovationReturn {
  status: RenovationStatus;
  error: string | null;
  renovatedPropertyImage: PropertyImage | null;
  originalImageUrl: string | null;
  renovatedImageUrl: string | null;
  renovationMetadata: {
    referenceNumber: string;
    currentImageOrder: string;
    renovationType?: RenovationType;
  } | null;
  renovate: (
    imageUrl: string,
    referenceNumber: string,
    currentImageOrder: number,
    renovationType?: RenovationType,
  ) => Promise<void>;
  saveRenovated: () => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for managing image renovation with Gemini API
 * Handles the synchronous renovation flow: API call -> immediate result -> save workflow
 */
export function useImageRenovation({
  propertyId,
  onSuccess,
  onComparisonReady,
  onError,
}: UseImageRenovationProps): UseImageRenovationReturn {
  const [status, setStatus] = useState<RenovationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [renovatedPropertyImage, setRenovatedPropertyImage] =
    useState<PropertyImage | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [renovatedImageUrl, setRenovatedImageUrl] = useState<string | null>(
    null,
  );
  const [renovationMetadata, setRenovationMetadata] = useState<{
    referenceNumber: string;
    currentImageOrder: string;
    renovationType?: RenovationType;
  } | null>(null);

  // Mount/unmount management
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  const renovate = useCallback(
    async (
      imageUrl: string,
      referenceNumber: string,
      currentImageOrder: number,
      renovationType?: RenovationType,
    ) => {
      if (!isMounted) {
        return;
      }

      try {
        setStatus("processing");
        setError(null);
        setOriginalImageUrl(imageUrl);
        setRenovatedImageUrl(null);
        setRenovatedPropertyImage(null);

        console.log("Starting Gemini renovation:", {
          imageUrl: imageUrl.substring(0, 100) + "...",
          referenceNumber,
          currentImageOrder,
          renovationType,
        });

        // Call Gemini API (synchronous - no polling needed)
        const renovationResponse = await fetch(
          `/api/properties/${propertyId}/gemini-renovate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageUrl,
              referenceNumber,
              currentImageOrder,
              renovationType,
            }),
          },
        );

        if (!renovationResponse.ok) {
          const errorData = (await renovationResponse.json()) as {
            error?: string;
          };
          throw new Error(errorData.error ?? "Failed to renovate image");
        }

        const renovationData = (await renovationResponse.json()) as {
          success: boolean;
          status: string;
          renovatedImageBase64?: string;
          referenceNumber: string;
          currentImageOrder: number;
          renovationType?: RenovationType;
          detectedRoomType?: RenovationType;
          error?: string;
        };

        if (!isMounted) return;

        if (renovationData.success && renovationData.renovatedImageBase64) {
          // Log the detected room type
          if (renovationData.detectedRoomType) {
            console.log("🏠 Room auto-detected:", renovationData.detectedRoomType);
          }

          // Convert base64 to data URL for display
          const dataUrl = createDataUrl(renovationData.renovatedImageBase64);
          setRenovatedImageUrl(dataUrl);

          // Store metadata for saving later
          setRenovationMetadata({
            referenceNumber: renovationData.referenceNumber,
            currentImageOrder: renovationData.currentImageOrder.toString(),
            renovationType: renovationData.renovationType,
          });

          setStatus("success");

          // Call comparison ready callback to show the slider
          if (onComparisonReady) {
            onComparisonReady();
          }

          // Show toast with detected room type if available
          const roomTypeLabel = renovationData.detectedRoomType
            ? ` (${renovationData.detectedRoomType.replace("_", " ")})`
            : "";
          toast.success(
            `¡Renovación completada${roomTypeLabel}! Usa el slider para comparar.`,
          );
        } else {
          throw new Error(
            renovationData.error ?? "No renovated image generated",
          );
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "Renovation failed";

        setStatus("error");
        setError(errorMessage);

        if (onError) {
          onError(errorMessage);
        }

        toast.error("Error al renovar la imagen");

        console.error("Renovation error:", error);
      }
    },
    [propertyId, onComparisonReady, onError, isMounted],
  );

  const saveRenovated = useCallback(async () => {
    if (!isMounted) {
      return;
    }

    if (!renovatedImageUrl || !renovationMetadata) {
      toast.error("No hay imagen renovada para guardar");
      return;
    }

    try {
      setStatus("processing"); // Show loading state during save

      // Extract base64 from data URL
      const base64Data = renovatedImageUrl.replace(
        /^data:image\/[a-zA-Z]+;base64,/,
        "",
      );

      console.log("Saving renovated image:", {
        referenceNumber: renovationMetadata.referenceNumber,
        currentImageOrder: renovationMetadata.currentImageOrder,
        renovationType: renovationMetadata.renovationType,
        imageDataLength: base64Data.length,
      });

      const saveResponse = await fetch(
        `/api/properties/${propertyId}/save-renovated`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            renovatedImageBase64: base64Data,
            referenceNumber: renovationMetadata.referenceNumber,
            currentImageOrder: renovationMetadata.currentImageOrder,
            renovationType: renovationMetadata.renovationType,
          }),
        },
      );

      if (!saveResponse.ok) {
        const errorData = (await saveResponse.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to save renovated image");
      }

      const saveData = (await saveResponse.json()) as {
        success: boolean;
        propertyImage: PropertyImage;
        message: string;
      };

      // Update state with the saved property image
      setRenovatedPropertyImage(saveData.propertyImage);
      setStatus("success");

      // Now call the success callback with the actual saved image
      if (onSuccess) {
        onSuccess(saveData.propertyImage);
      }

      toast.success("¡Imagen renovada guardada correctamente!");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save renovated image";
      setError(errorMessage);
      setStatus("error");

      if (onError) {
        onError(errorMessage);
      }

      toast.error("Error al guardar la imagen renovada");

      console.error("Save renovation error:", error);
    }
  }, [
    propertyId,
    renovatedImageUrl,
    renovationMetadata,
    onSuccess,
    onError,
    isMounted,
  ]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setRenovatedPropertyImage(null);
    setOriginalImageUrl(null);
    setRenovatedImageUrl(null);
    setRenovationMetadata(null);
  }, []);

  return {
    status,
    error,
    renovatedPropertyImage,
    originalImageUrl,
    renovatedImageUrl,
    renovationMetadata,
    renovate,
    saveRenovated,
    reset,
  };
}
