"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { ImageStudioGallery } from "./image-studio-gallery";
import { ImageStudioTools } from "./image-studio-tools";
import { useImageEnhancement } from "~/hooks/use-image-enhancement";
import { useImageRenovation } from "~/hooks/use-image-renovation";
import type { PropertyImage } from "~/lib/data";
import { toast } from "sonner";
import { ProcessingOverlay } from "./processing-overlay";
import { EnhancementSummary } from "./enhancement-summary";
import { EnhancementNotificationButton } from "./enhancement-notification-button";

interface ImageStudioClientWrapperProps {
  images: PropertyImage[];
  title: string;
}

export function ImageStudioClientWrapper({
  images,
  title,
}: ImageStudioClientWrapperProps) {
  const params = useParams();
  const propertyId = params.id as string;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [allImages, setAllImages] = useState<PropertyImage[]>(images);
  const [isComparisonVisible, setIsComparisonVisible] = useState(false);
  const [isRenovationComparison, setIsRenovationComparison] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Auto-open modal on page load
  useEffect(() => {
    setIsNotificationOpen(true);
  }, []);

  // Get the currently selected image
  const selectedImage = allImages[selectedIndex];

  // Image enhancement hook
  const {
    status: enhancementStatus,
    progress: enhancementProgress,
    error: enhancementError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    originalImageUrl: _originalImageUrl,
    enhancedImageUrl,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    enhancedPropertyImage: _enhancedPropertyImage,
    enhancementMetadata,
    enhance,
    saveEnhanced,
    reset: resetEnhancement,
  } = useImageEnhancement({
    propertyId,
    onSuccess: (newImage) => {
      console.log("🎉 Enhancement success - adding new image to gallery:", {
        newImageId: newImage.propertyImageId.toString(),
        imageOrder: newImage.imageOrder,
        currentImagesCount: allImages.length,
      });

      // Add the new image to the gallery (this happens after user confirms save)
      setAllImages((currentImages) => {
        const newImages = [...currentImages, newImage];
        const sortedImages = newImages.sort(
          (a, b) => a.imageOrder - b.imageOrder,
        );
        console.log(
          "📸 Updated gallery images:",
          sortedImages.map((img) => ({
            id: img.propertyImageId.toString(),
            order: img.imageOrder,
            tag: img.imageTag,
          })),
        );
        return sortedImages;
      });

      // Hide comparison slider and reset
      setIsComparisonVisible(false);
      resetEnhancement();

      console.log(
        "✅ Enhancement complete - mini gallery should now be visible",
      );
    },
    onComparisonReady: () => {
      // Show comparison slider when enhancement completes
      setIsComparisonVisible(true);
    },
    onError: (error) => {
      console.error("Enhancement failed:", error);
      toast.error("Error al mejorar la imagen");
    },
  });

  // Image renovation hook
  const {
    status: renovationStatus,
    renovatedImageUrl,
    renovationMetadata,
    renovate,
    saveRenovated,
    reset: resetRenovation,
  } = useImageRenovation({
    propertyId,
    onSuccess: (newImage) => {
      console.log("🎉 Renovation success - adding new image to gallery:", {
        newImageId: newImage.propertyImageId.toString(),
        imageOrder: newImage.imageOrder,
        currentImagesCount: allImages.length,
      });

      // Add the new renovated image to the gallery
      setAllImages((currentImages) => {
        const newImages = [...currentImages, newImage];
        const sortedImages = newImages.sort(
          (a, b) => a.imageOrder - b.imageOrder,
        );
        console.log(
          "📸 Updated gallery images:",
          sortedImages.map((img) => ({
            id: img.propertyImageId.toString(),
            order: img.imageOrder,
            tag: img.imageTag,
          })),
        );
        return sortedImages;
      });

      // Hide comparison slider and reset
      setIsComparisonVisible(false);
      setIsRenovationComparison(false);
      resetRenovation();

      console.log(
        "✅ Renovation complete - mini gallery should now be visible",
      );
    },
    onComparisonReady: () => {
      // Show comparison slider when renovation completes
      setIsComparisonVisible(true);
      setIsRenovationComparison(true);
    },
    onError: (error) => {
      console.error("Renovation failed:", error);
      toast.error("Error al renovar la imagen");
    },
  });

  // Handle enhancement request from tools
  const handleEnhanceImage = useCallback(async () => {
    if (!selectedImage) {
      toast.error("No hay imagen seleccionada");
      return;
    }

    if (enhancementStatus === "processing") {
      toast.warning("Ya hay una mejora en progreso");
      return;
    }

    try {
      await enhance(
        selectedImage.imageUrl,
        selectedImage.referenceNumber,
        selectedImage.imageOrder,
      );
    } catch (error) {
      console.error("Failed to start enhancement:", error);
      toast.error("Error al iniciar la mejora de imagen");
    }
  }, [selectedImage, enhancementStatus, enhance]);

  // Handle renovation request from tools
  const handleRenovateImage = useCallback(async () => {
    if (!selectedImage) {
      toast.error("No hay imagen seleccionada");
      return;
    }

    if (renovationStatus === "processing") {
      toast.warning("Ya hay una renovación en progreso");
      return;
    }

    try {
      await renovate(
        selectedImage.imageUrl,
        selectedImage.referenceNumber,
        selectedImage.imageOrder,
      );
    } catch (error) {
      console.error("Failed to start renovation:", error);
      toast.error("Error al iniciar la renovación de imagen");
    }
  }, [selectedImage, renovationStatus, renovate]);

  // Handle saving the enhanced image
  const handleSaveEnhanced = useCallback(async () => {
    if (!enhancedImageUrl || !enhancementMetadata) {
      toast.error("No hay imagen mejorada para guardar");
      return;
    }

    try {
      await saveEnhanced();
    } catch (error) {
      console.error("Save enhanced image failed:", error);
    }
  }, [enhancedImageUrl, enhancementMetadata, saveEnhanced]);

  // Handle saving the renovated image
  const handleSaveRenovated = useCallback(async () => {
    if (!renovatedImageUrl || !renovationMetadata) {
      toast.error("No hay imagen renovada para guardar");
      return;
    }

    try {
      await saveRenovated();
    } catch (error) {
      console.error("Save renovated image failed:", error);
    }
  }, [renovatedImageUrl, renovationMetadata, saveRenovated]);

  // Handle discarding the enhanced image
  const handleDiscardEnhanced = useCallback(() => {
    // Hide comparison and reset all enhancement state
    setIsComparisonVisible(false);
    resetEnhancement();

    // Since we're using defer storage pattern:
    // - The enhanced image was never saved to S3 or database
    // - Only the temporary Freepik URL existed
    // - Discarding simply clears the temporary state
    // - No cleanup needed, no waste generated!
    toast.success("Imagen mejorada descartada");
  }, [resetEnhancement]);

  // Handle discarding the renovated image
  const handleDiscardRenovated = useCallback(() => {
    // Hide comparison and reset all renovation state
    setIsComparisonVisible(false);
    setIsRenovationComparison(false);
    resetRenovation();

    // Similar to enhancement, renovation images are only saved on user confirmation
    // Discarding simply clears the temporary state
    toast.success("Imagen renovada descartada");
  }, [resetRenovation]);

  // Determine if AI is processing
  const isProcessing =
    enhancementStatus === "processing" || renovationStatus === "processing";
  const processingType =
    renovationStatus === "processing" ? "renovación" : "mejora";

  // Debug mini gallery visibility
  const shouldShowMiniGallery =
    enhancementStatus !== "processing" &&
    renovationStatus !== "processing" &&
    !isComparisonVisible;
  console.log("🔍 Mini gallery visibility check:", {
    enhancementStatus,
    renovationStatus,
    isComparisonVisible,
    shouldShow: shouldShowMiniGallery,
    imagesCount: allImages.length,
  });

  return (
    <>
      {/* Enhancement Summary Card */}
      <EnhancementSummary
        images={allImages}
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      {/* Floating Enhancement Notification Button */}
      {shouldShowMiniGallery && (
        <div className="fixed bottom-8 right-8 z-50">
          <EnhancementNotificationButton
            images={allImages}
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          />
        </div>
      )}

      <div className="space-y-16">
        {/* Image Selection (thumbnails only) - Hidden when AI is processing or during comparison */}
        {shouldShowMiniGallery && (
          <section className="animate-in slide-in-from-bottom-8 delay-300 duration-700">
            <ImageStudioGallery
              images={allImages}
              title={title}
              showOnlyThumbnails={true}
              selectedIndex={selectedIndex}
              onImageSelect={setSelectedIndex}
            />
          </section>
        )}

        {/* Tools Section */}
        <ImageStudioTools
          onEnhanceImage={handleEnhanceImage}
          enhancementStatus={enhancementStatus}
          _enhancementProgress={enhancementProgress}
          _enhancementError={enhancementError}
          selectedImage={selectedImage}
          isComparisonVisible={isComparisonVisible}
          onRenovateImage={handleRenovateImage}
          renovationStatus={renovationStatus}
        />

        {/* Results Section (big image) */}
        <section
          className="animate-in slide-in-from-bottom-8 delay-500 duration-700"
          id="main-image-section"
        >
          <ImageStudioGallery
            images={allImages}
            title={title}
            showOnlyMainImage={true}
            selectedIndex={selectedIndex}
            onImageSelect={setSelectedIndex}
            isComparisonMode={isComparisonVisible}
            enhancedImageUrl={
              isRenovationComparison
                ? (renovatedImageUrl ?? "")
                : (enhancedImageUrl ?? "")
            }
            enhancementStatus={
              isRenovationComparison ? renovationStatus : enhancementStatus
            }
            onSave={
              isRenovationComparison ? handleSaveRenovated : handleSaveEnhanced
            }
            onDiscard={
              isRenovationComparison
                ? handleDiscardRenovated
                : handleDiscardEnhanced
            }
          />
        </section>
      </div>

      {/* AI Processing Overlay */}
      <ProcessingOverlay
        isVisible={isProcessing}
        processingType={processingType}
      />
    </>
  );
}
