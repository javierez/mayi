"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type {
  RenovationStatus,
  PropertyImage,
} from "~/types/gemini";
import { createDataUrl } from "~/lib/image-utils";

interface UseImageBlurFacesProps {
  propertyId: string;
  onSuccess?: (blurredImage: PropertyImage) => void;
  onComparisonReady?: () => void;
  onError?: (error: string) => void;
}

interface UseImageBlurFacesReturn {
  status: RenovationStatus;
  error: string | null;
  blurredPropertyImage: PropertyImage | null;
  originalImageUrl: string | null;
  blurredImageUrl: string | null;
  blurMetadata: {
    referenceNumber: string;
    currentImageOrder: string;
  } | null;
  blurFaces: (
    imageUrl: string,
    referenceNumber: string,
    currentImageOrder: number,
  ) => Promise<void>;
  saveBlurred: () => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for managing image blur faces with Gemini API
 * Handles the synchronous blur faces flow: API call -> immediate result -> save workflow
 */
export function useImageBlurFaces({
  propertyId,
  onSuccess,
  onComparisonReady,
  onError,
}: UseImageBlurFacesProps): UseImageBlurFacesReturn {
  const [status, setStatus] = useState<RenovationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [blurredPropertyImage, setBlurredPropertyImage] =
    useState<PropertyImage | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [blurredImageUrl, setBlurredImageUrl] = useState<string | null>(
    null,
  );
  const [blurMetadata, setBlurMetadata] = useState<{
    referenceNumber: string;
    currentImageOrder: string;
  } | null>(null);

  // Mount/unmount management
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  const blurFaces = useCallback(
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
        setError(null);
        setOriginalImageUrl(imageUrl);
        setBlurredImageUrl(null);
        setBlurredPropertyImage(null);

        console.log("Starting Gemini blur faces:", {
          imageUrl: imageUrl.substring(0, 100) + "...",
          referenceNumber,
          currentImageOrder,
        });

        // Call Gemini API (synchronous - no polling needed)
        const blurResponse = await fetch(
          `/api/properties/${propertyId}/gemini-blur-faces`,
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

        if (!blurResponse.ok) {
          const errorData = (await blurResponse.json()) as {
            error?: string;
            required?: number;
            available?: number;
            deficit?: number;
          };

          // Handle insufficient tokens
          if (blurResponse.status === 402) {
            throw new Error(
              `Tokens insuficientes. Necesitas ${errorData.required ?? 100} tokens, tienes ${errorData.available ?? 0}.`,
            );
          }

          throw new Error(errorData.error ?? "Failed to blur faces");
        }

        const blurData = (await blurResponse.json()) as {
          success: boolean;
          status: string;
          blurredImageBase64?: string;
          referenceNumber: string;
          currentImageOrder: number;
          error?: string;
        };

        if (!isMounted) return;

        if (blurData.success && blurData.blurredImageBase64) {
          // Convert base64 to data URL for display
          const dataUrl = createDataUrl(blurData.blurredImageBase64);
          setBlurredImageUrl(dataUrl);

          // Store metadata for saving later
          setBlurMetadata({
            referenceNumber: blurData.referenceNumber,
            currentImageOrder: blurData.currentImageOrder.toString(),
          });

          setStatus("success");

          // Call comparison ready callback to show the slider
          if (onComparisonReady) {
            onComparisonReady();
          }

          toast.success("¡Caras desenfocadas! Usa el slider para comparar.");
        } else {
          throw new Error(
            blurData.error ?? "No blurred image generated",
          );
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "Blur faces failed";

        setStatus("error");
        setError(errorMessage);

        if (onError) {
          onError(errorMessage);
        }

        toast.error("Error al desenfocar las caras");

        console.error("Blur faces error:", error);
      }
    },
    [propertyId, onComparisonReady, onError, isMounted],
  );

  const saveBlurred = useCallback(async () => {
    if (!isMounted) {
      return;
    }

    if (!blurredImageUrl || !blurMetadata) {
      toast.error("No hay imagen con caras desenfocadas para guardar");
      return;
    }

    try {
      setStatus("processing"); // Show loading state during save

      // Extract base64 from data URL
      const base64Data = blurredImageUrl.replace(
        /^data:image\/[a-zA-Z]+;base64,/,
        "",
      );

      console.log("Saving blurred faces image:", {
        referenceNumber: blurMetadata.referenceNumber,
        currentImageOrder: blurMetadata.currentImageOrder,
        imageDataLength: base64Data.length,
      });

      const saveResponse = await fetch(
        `/api/properties/${propertyId}/save-blur-faces`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blurredImageBase64: base64Data,
            referenceNumber: blurMetadata.referenceNumber,
            currentImageOrder: blurMetadata.currentImageOrder,
          }),
        },
      );

      if (!saveResponse.ok) {
        const errorData = (await saveResponse.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to save blurred faces image");
      }

      const saveData = (await saveResponse.json()) as {
        success: boolean;
        propertyImage: PropertyImage;
        message: string;
      };

      // Update state with the saved property image
      setBlurredPropertyImage(saveData.propertyImage);
      setStatus("success");

      // Now call the success callback with the actual saved image
      if (onSuccess) {
        onSuccess(saveData.propertyImage);
      }

      toast.success("¡Imagen con caras desenfocadas guardada correctamente!");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save blurred faces image";
      setError(errorMessage);
      setStatus("error");

      if (onError) {
        onError(errorMessage);
      }

      toast.error("Error al guardar la imagen con caras desenfocadas");

      console.error("Save blur faces error:", error);
    }
  }, [
    propertyId,
    blurredImageUrl,
    blurMetadata,
    onSuccess,
    onError,
    isMounted,
  ]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setBlurredPropertyImage(null);
    setOriginalImageUrl(null);
    setBlurredImageUrl(null);
    setBlurMetadata(null);
  }, []);

  return {
    status,
    error,
    blurredPropertyImage,
    originalImageUrl,
    blurredImageUrl,
    blurMetadata,
    blurFaces,
    saveBlurred,
    reset,
  };
}




