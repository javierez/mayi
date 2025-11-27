"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type {
  RenovationStatus,
  PropertyImage,
} from "~/types/gemini";
import { createDataUrl } from "~/lib/image-utils";

interface UseImageRender3dProps {
  propertyId: string;
  onSuccess?: (render3dImage: PropertyImage) => void;
  onComparisonReady?: () => void;
  onError?: (error: string) => void;
}

interface UseImageRender3dReturn {
  status: RenovationStatus;
  error: string | null;
  render3dPropertyImage: PropertyImage | null;
  originalImageUrl: string | null;
  render3dImageUrl: string | null;
  render3dMetadata: {
    referenceNumber: string;
    currentImageOrder: string;
  } | null;
  render3d: (
    imageUrl: string,
    referenceNumber: string,
    currentImageOrder: number,
  ) => Promise<void>;
  saveRender3d: () => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for managing image 3D rendering with Gemini API
 * Handles the synchronous render 3D flow: API call -> immediate result -> save workflow
 */
export function useImageRender3d({
  propertyId,
  onSuccess,
  onComparisonReady,
  onError,
}: UseImageRender3dProps): UseImageRender3dReturn {
  const [status, setStatus] = useState<RenovationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [render3dPropertyImage, setRender3dPropertyImage] =
    useState<PropertyImage | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [render3dImageUrl, setRender3dImageUrl] = useState<string | null>(
    null,
  );
  const [render3dMetadata, setRender3dMetadata] = useState<{
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

  const render3d = useCallback(
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
        setRender3dImageUrl(null);
        setRender3dPropertyImage(null);

        console.log("Starting Gemini 3D render:", {
          imageUrl: imageUrl.substring(0, 100) + "...",
          referenceNumber,
          currentImageOrder,
        });

        // Call Gemini API (synchronous - no polling needed)
        const render3dResponse = await fetch(
          `/api/properties/${propertyId}/gemini-render-3d`,
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

        if (!render3dResponse.ok) {
          const errorData = (await render3dResponse.json()) as {
            error?: string;
            required?: number;
            available?: number;
            deficit?: number;
          };

          // Handle insufficient tokens
          if (render3dResponse.status === 402) {
            throw new Error(
              `Tokens insuficientes. Necesitas ${errorData.required ?? 150} tokens, tienes ${errorData.available ?? 0}.`,
            );
          }

          throw new Error(errorData.error ?? "Failed to render 3D");
        }

        const render3dData = (await render3dResponse.json()) as {
          success: boolean;
          status: string;
          render3dImageBase64?: string;
          referenceNumber: string;
          currentImageOrder: number;
          error?: string;
        };

        if (!isMounted) return;

        if (render3dData.success && render3dData.render3dImageBase64) {
          // Convert base64 to data URL for display
          const dataUrl = createDataUrl(render3dData.render3dImageBase64);
          setRender3dImageUrl(dataUrl);

          // Store metadata for saving later
          setRender3dMetadata({
            referenceNumber: render3dData.referenceNumber,
            currentImageOrder: render3dData.currentImageOrder.toString(),
          });

          setStatus("success");

          // Call comparison ready callback to show the slider
          if (onComparisonReady) {
            onComparisonReady();
          }

          toast.success("¡Render 3D completado! Usa el slider para comparar.");
        } else {
          throw new Error(
            render3dData.error ?? "No 3D rendered image generated",
          );
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "3D render failed";

        setStatus("error");
        setError(errorMessage);

        if (onError) {
          onError(errorMessage);
        }

        toast.error("Error al generar el render 3D");

        console.error("3D render error:", error);
      }
    },
    [propertyId, onComparisonReady, onError, isMounted],
  );

  const saveRender3d = useCallback(async () => {
    if (!isMounted) {
      return;
    }

    if (!render3dImageUrl || !render3dMetadata) {
      toast.error("No hay imagen 3D para guardar");
      return;
    }

    try {
      setStatus("processing"); // Show loading state during save

      // Extract base64 from data URL
      const base64Data = render3dImageUrl.replace(
        /^data:image\/[a-zA-Z]+;base64,/,
        "",
      );

      console.log("Saving 3D render image:", {
        referenceNumber: render3dMetadata.referenceNumber,
        currentImageOrder: render3dMetadata.currentImageOrder,
        imageDataLength: base64Data.length,
      });

      const saveResponse = await fetch(
        `/api/properties/${propertyId}/save-render-3d`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            render3dImageBase64: base64Data,
            referenceNumber: render3dMetadata.referenceNumber,
            currentImageOrder: render3dMetadata.currentImageOrder,
          }),
        },
      );

      if (!saveResponse.ok) {
        const errorData = (await saveResponse.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to save 3D render image");
      }

      const saveData = (await saveResponse.json()) as {
        success: boolean;
        propertyImage: PropertyImage;
        message: string;
      };

      // Update state with the saved property image
      setRender3dPropertyImage(saveData.propertyImage);
      setStatus("success");

      // Now call the success callback with the actual saved image
      if (onSuccess) {
        onSuccess(saveData.propertyImage);
      }

      toast.success("¡Imagen 3D guardada correctamente!");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save 3D render image";
      setError(errorMessage);
      setStatus("error");

      if (onError) {
        onError(errorMessage);
      }

      toast.error("Error al guardar la imagen 3D");

      console.error("Save 3D render error:", error);
    }
  }, [
    propertyId,
    render3dImageUrl,
    render3dMetadata,
    onSuccess,
    onError,
    isMounted,
  ]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setRender3dPropertyImage(null);
    setOriginalImageUrl(null);
    setRender3dImageUrl(null);
    setRender3dMetadata(null);
  }, []);

  return {
    status,
    error,
    render3dPropertyImage,
    originalImageUrl,
    render3dImageUrl,
    render3dMetadata,
    render3d,
    saveRender3d,
    reset,
  };
}
