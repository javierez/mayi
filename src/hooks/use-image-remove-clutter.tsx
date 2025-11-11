"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type {
  RenovationStatus,
  PropertyImage,
} from "~/types/gemini";
import { createDataUrl } from "~/lib/image-utils";

interface UseImageRemoveClutterProps {
  propertyId: string;
  onSuccess?: (declutteredImage: PropertyImage) => void;
  onComparisonReady?: () => void;
  onError?: (error: string) => void;
}

interface UseImageRemoveClutterReturn {
  status: RenovationStatus;
  error: string | null;
  declutteredPropertyImage: PropertyImage | null;
  originalImageUrl: string | null;
  declutteredImageUrl: string | null;
  removeClutterMetadata: {
    referenceNumber: string;
    currentImageOrder: string;
  } | null;
  removeClutter: (
    imageUrl: string,
    referenceNumber: string,
    currentImageOrder: number,
  ) => Promise<void>;
  saveDecluttered: () => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for managing image remove clutter with Gemini API
 * Handles the synchronous remove clutter flow: API call -> immediate result -> save workflow
 */
export function useImageRemoveClutter({
  propertyId,
  onSuccess,
  onComparisonReady,
  onError,
}: UseImageRemoveClutterProps): UseImageRemoveClutterReturn {
  const [status, setStatus] = useState<RenovationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [declutteredPropertyImage, setDeclutteredPropertyImage] =
    useState<PropertyImage | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [declutteredImageUrl, setDeclutteredImageUrl] = useState<string | null>(
    null,
  );
  const [removeClutterMetadata, setRemoveClutterMetadata] = useState<{
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

  const removeClutter = useCallback(
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
        setDeclutteredImageUrl(null);
        setDeclutteredPropertyImage(null);

        console.log("Starting Gemini remove clutter:", {
          imageUrl: imageUrl.substring(0, 100) + "...",
          referenceNumber,
          currentImageOrder,
        });

        // Call Gemini API (synchronous - no polling needed)
        const removeClutterResponse = await fetch(
          `/api/properties/${propertyId}/gemini-remove-clutter`,
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

        if (!removeClutterResponse.ok) {
          const errorData = (await removeClutterResponse.json()) as {
            error?: string;
            required?: number;
            available?: number;
            deficit?: number;
          };

          // Handle insufficient tokens
          if (removeClutterResponse.status === 402) {
            throw new Error(
              `Tokens insuficientes. Necesitas ${errorData.required ?? 100} tokens, tienes ${errorData.available ?? 0}.`,
            );
          }

          throw new Error(errorData.error ?? "Failed to remove clutter");
        }

        const removeClutterData = (await removeClutterResponse.json()) as {
          success: boolean;
          status: string;
          declutteredImageBase64?: string;
          referenceNumber: string;
          currentImageOrder: number;
          error?: string;
        };

        if (!isMounted) return;

        if (removeClutterData.success && removeClutterData.declutteredImageBase64) {
          // Convert base64 to data URL for display
          const dataUrl = createDataUrl(removeClutterData.declutteredImageBase64);
          setDeclutteredImageUrl(dataUrl);

          // Store metadata for saving later
          setRemoveClutterMetadata({
            referenceNumber: removeClutterData.referenceNumber,
            currentImageOrder: removeClutterData.currentImageOrder.toString(),
          });

          setStatus("success");

          // Call comparison ready callback to show the slider
          if (onComparisonReady) {
            onComparisonReady();
          }

          toast.success("¡Desorden eliminado! Usa el slider para comparar.");
        } else {
          throw new Error(
            removeClutterData.error ?? "No decluttered image generated",
          );
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "Remove clutter failed";

        setStatus("error");
        setError(errorMessage);

        if (onError) {
          onError(errorMessage);
        }

        toast.error("Error al eliminar el desorden");

        console.error("Remove clutter error:", error);
      }
    },
    [propertyId, onComparisonReady, onError, isMounted],
  );

  const saveDecluttered = useCallback(async () => {
    if (!isMounted) {
      return;
    }

    if (!declutteredImageUrl || !removeClutterMetadata) {
      toast.error("No hay imagen sin desorden para guardar");
      return;
    }

    try {
      setStatus("processing"); // Show loading state during save

      // Extract base64 from data URL
      const base64Data = declutteredImageUrl.replace(
        /^data:image\/[a-zA-Z]+;base64,/,
        "",
      );

      console.log("Saving decluttered image:", {
        referenceNumber: removeClutterMetadata.referenceNumber,
        currentImageOrder: removeClutterMetadata.currentImageOrder,
        imageDataLength: base64Data.length,
      });

      const saveResponse = await fetch(
        `/api/properties/${propertyId}/save-remove-clutter`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            declutteredImageBase64: base64Data,
            referenceNumber: removeClutterMetadata.referenceNumber,
            currentImageOrder: removeClutterMetadata.currentImageOrder,
          }),
        },
      );

      if (!saveResponse.ok) {
        const errorData = (await saveResponse.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to save decluttered image");
      }

      const saveData = (await saveResponse.json()) as {
        success: boolean;
        propertyImage: PropertyImage;
        message: string;
      };

      // Update state with the saved property image
      setDeclutteredPropertyImage(saveData.propertyImage);
      setStatus("success");

      // Now call the success callback with the actual saved image
      if (onSuccess) {
        onSuccess(saveData.propertyImage);
      }

      toast.success("¡Imagen sin desorden guardada correctamente!");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save decluttered image";
      setError(errorMessage);
      setStatus("error");

      if (onError) {
        onError(errorMessage);
      }

      toast.error("Error al guardar la imagen sin desorden");

      console.error("Save remove clutter error:", error);
    }
  }, [
    propertyId,
    declutteredImageUrl,
    removeClutterMetadata,
    onSuccess,
    onError,
    isMounted,
  ]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setDeclutteredPropertyImage(null);
    setOriginalImageUrl(null);
    setDeclutteredImageUrl(null);
    setRemoveClutterMetadata(null);
  }, []);

  return {
    status,
    error,
    declutteredPropertyImage,
    originalImageUrl,
    declutteredImageUrl,
    removeClutterMetadata,
    removeClutter,
    saveDecluttered,
    reset,
  };
}

