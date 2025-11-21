"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { RenovationStatus, PropertyImage } from "~/types/gemini";
import { createDataUrl } from "~/lib/image-utils";

interface UseImageEnhanceLightingProps {
  propertyId: string;
  onSuccess?: (enhancedImage: PropertyImage) => void;
  onComparisonReady?: () => void;
  onError?: (error: string) => void;
}

interface UseImageEnhanceLightingReturn {
  status: RenovationStatus;
  error: string | null;
  enhancedPropertyImage: PropertyImage | null;
  originalImageUrl: string | null;
  enhancedImageUrl: string | null;
  enhanceMetadata: {
    referenceNumber: string;
    currentImageOrder: string;
  } | null;
  enhanceLighting: (
    imageUrl: string,
    referenceNumber: string,
    currentImageOrder: number,
  ) => Promise<void>;
  saveEnhanced: () => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for managing lighting enhancement with Gemini API
 * Handles the synchronous enhancement flow: API call -> immediate result -> save workflow
 */
export function useImageEnhanceLighting({
  propertyId,
  onSuccess,
  onComparisonReady,
  onError,
}: UseImageEnhanceLightingProps): UseImageEnhanceLightingReturn {
  const [status, setStatus] = useState<RenovationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [enhancedPropertyImage, setEnhancedPropertyImage] =
    useState<PropertyImage | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null);
  const [enhanceMetadata, setEnhanceMetadata] = useState<{
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

  const enhanceLighting = useCallback(
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
        setEnhancedImageUrl(null);
        setEnhancedPropertyImage(null);

        console.log("Starting Gemini lighting enhancement:", {
          imageUrl: imageUrl.substring(0, 100) + "...",
          referenceNumber,
          currentImageOrder,
        });

        // Call Gemini API (synchronous - no polling needed)
        const enhanceResponse = await fetch(
          `/api/properties/${propertyId}/gemini-enhance-lighting`,
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

        if (!enhanceResponse.ok) {
          const errorData = (await enhanceResponse.json()) as {
            error?: string;
            required?: number;
            available?: number;
            deficit?: number;
          };

          // Handle insufficient tokens
          if (enhanceResponse.status === 402) {
            throw new Error(
              `Tokens insuficientes. Necesitas ${errorData.required ?? 170} tokens, tienes ${errorData.available ?? 0}.`,
            );
          }

          throw new Error(errorData.error ?? "Failed to enhance lighting");
        }

        const enhanceData = (await enhanceResponse.json()) as {
          success: boolean;
          status: string;
          enhancedImageBase64?: string;
          referenceNumber: string;
          currentImageOrder: number;
          error?: string;
        };

        if (!isMounted) return;

        if (enhanceData.success && enhanceData.enhancedImageBase64) {
          // Convert base64 to data URL for display
          const dataUrl = createDataUrl(enhanceData.enhancedImageBase64);
          setEnhancedImageUrl(dataUrl);

          // Store metadata for saving later
          setEnhanceMetadata({
            referenceNumber: enhanceData.referenceNumber,
            currentImageOrder: enhanceData.currentImageOrder.toString(),
          });

          setStatus("success");

          // Call comparison ready callback to show the slider
          if (onComparisonReady) {
            onComparisonReady();
          }

          toast.success("¡Iluminación mejorada! Usa el slider para comparar.");
        } else {
          throw new Error(
            enhanceData.error ?? "No enhanced image generated",
          );
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "Lighting enhancement failed";

        setStatus("error");
        setError(errorMessage);

        if (onError) {
          onError(errorMessage);
        }

        toast.error("Error al mejorar la iluminación");

        console.error("Lighting enhancement error:", error);
      }
    },
    [propertyId, onComparisonReady, onError, isMounted],
  );

  const saveEnhanced = useCallback(async () => {
    if (!isMounted) {
      return;
    }

    if (!enhancedImageUrl || !enhanceMetadata) {
      toast.error("No hay imagen con iluminación mejorada para guardar");
      return;
    }

    try {
      setStatus("processing"); // Show loading state during save

      // Extract base64 from data URL
      const base64Data = enhancedImageUrl.replace(
        /^data:image\/[a-zA-Z]+;base64,/,
        "",
      );

      console.log("Saving enhanced lighting image:", {
        propertyId,
        referenceNumber: enhanceMetadata.referenceNumber,
        currentImageOrder: enhanceMetadata.currentImageOrder,
      });

      // Save the enhanced image to S3 and database
      const saveResponse = await fetch(
        `/api/properties/${propertyId}/save-enhanced-lighting`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enhancedImageBase64: base64Data,
            referenceNumber: enhanceMetadata.referenceNumber,
            currentImageOrder: enhanceMetadata.currentImageOrder,
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

      if (!isMounted) return;

      setEnhancedPropertyImage(saveData.propertyImage);
      setStatus("success");

      if (onSuccess) {
        onSuccess(saveData.propertyImage);
      }

      toast.success("¡Imagen con mejor iluminación guardada!");

      console.log("Enhanced lighting image saved successfully:", {
        propertyImageId: saveData.propertyImage.propertyImageId,
        imageTag: saveData.propertyImage.imageTag,
      });
    } catch (error) {
      if (!isMounted) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Failed to save enhanced image";

      setError(errorMessage);
      setStatus("error");

      if (onError) {
        onError(errorMessage);
      }

      toast.error("Error al guardar la imagen");

      console.error("Save enhanced lighting image error:", error);
    }
  }, [propertyId, enhancedImageUrl, enhanceMetadata, onSuccess, onError, isMounted]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setEnhancedPropertyImage(null);
    setOriginalImageUrl(null);
    setEnhancedImageUrl(null);
    setEnhanceMetadata(null);
  }, []);

  return {
    status,
    error,
    enhancedPropertyImage,
    originalImageUrl,
    enhancedImageUrl,
    enhanceMetadata,
    enhanceLighting,
    saveEnhanced,
    reset,
  };
}
