"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { ImageStudioGallery } from "./image-studio-gallery";
import { ImageStudioTools } from "./image-studio-tools";
import { useImageEnhancement } from "~/hooks/use-image-enhancement";
import { useImageRenovation } from "~/hooks/use-image-renovation";
import { useImageBlurFaces } from "~/hooks/use-image-blur-faces";
import { useImageRemoveClutter } from "~/hooks/use-image-remove-clutter";
import { useImageEnhanceLighting } from "~/hooks/use-image-enhance-lighting";
import { useImageRender3d } from "~/hooks/use-image-render-3d";
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
  const [comparisonType, setComparisonType] = useState<
    | "enhancement"
    | "renovation"
    | "blur-faces"
    | "remove-clutter"
    | "enhance-lighting"
    | "render-3d"
    | null
  >(null);
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
    reviewStatus,
    reviewRenovation,
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
      setComparisonType(null);
      resetRenovation();

      console.log(
        "✅ Renovation complete - mini gallery should now be visible",
      );
    },
    onComparisonReady: () => {
      // Show comparison slider when renovation completes
      setIsComparisonVisible(true);
      setComparisonType("renovation");
    },
    onError: (error) => {
      console.error("Renovation failed:", error);
      toast.error("Error al renovar la imagen");
    },
  });

  // Image blur faces hook
  const {
    status: blurFacesStatus,
    blurredImageUrl,
    blurMetadata,
    blurFaces,
    saveBlurred,
    reset: resetBlurFaces,
  } = useImageBlurFaces({
    propertyId,
    onSuccess: (newImage) => {
      console.log("🎉 Blur faces success - adding new image to gallery:", {
        newImageId: newImage.propertyImageId.toString(),
        imageOrder: newImage.imageOrder,
        currentImagesCount: allImages.length,
      });

      // Add the new blurred image to the gallery
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
      setComparisonType(null);
      resetBlurFaces();

      console.log(
        "✅ Blur faces complete - mini gallery should now be visible",
      );
    },
    onComparisonReady: () => {
      // Show comparison slider when blur faces completes
      setIsComparisonVisible(true);
      setComparisonType("blur-faces");
    },
    onError: (error) => {
      console.error("Blur faces failed:", error);
      toast.error("Error al desenfocar las caras");
    },
  });

  // Image remove clutter hook
  const {
    status: removeClutterStatus,
    declutteredImageUrl,
    removeClutterMetadata,
    removeClutter,
    saveDecluttered,
    reset: resetRemoveClutter,
  } = useImageRemoveClutter({
    propertyId,
    onSuccess: (newImage) => {
      console.log("🎉 Remove clutter success - adding new image to gallery:", {
        newImageId: newImage.propertyImageId.toString(),
        imageOrder: newImage.imageOrder,
        currentImagesCount: allImages.length,
      });

      // Add the new decluttered image to the gallery
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
      setComparisonType(null);
      resetRemoveClutter();

      console.log(
        "✅ Remove clutter complete - mini gallery should now be visible",
      );
    },
    onComparisonReady: () => {
      // Show comparison slider when remove clutter completes
      setIsComparisonVisible(true);
      setComparisonType("remove-clutter");
    },
    onError: (error) => {
      console.error("Remove clutter failed:", error);
      toast.error("Error al eliminar el desorden");
    },
  });

  // Image enhance lighting hook
  const {
    status: enhanceLightingStatus,
    enhancedImageUrl: lightingEnhancedImageUrl,
    enhanceMetadata: lightingMetadata,
    enhanceLighting,
    saveEnhanced: saveLightingEnhanced,
    reset: resetEnhanceLighting,
  } = useImageEnhanceLighting({
    propertyId,
    onSuccess: (newImage) => {
      console.log("🎉 Lighting enhancement success - adding new image to gallery:", {
        newImageId: newImage.propertyImageId.toString(),
        imageOrder: newImage.imageOrder,
        currentImagesCount: allImages.length,
      });

      // Add the new lighting-enhanced image to the gallery
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
      setComparisonType(null);
      resetEnhanceLighting();

      console.log(
        "✅ Lighting enhancement complete - mini gallery should now be visible",
      );
    },
    onComparisonReady: () => {
      // Show comparison slider when lighting enhancement completes
      setIsComparisonVisible(true);
      setComparisonType("enhance-lighting");
    },
    onError: (error) => {
      console.error("Lighting enhancement failed:", error);
      toast.error("Error al mejorar la iluminación");
    },
  });

  // Image render 3D hook
  const {
    status: render3dStatus,
    render3dImageUrl,
    render3dMetadata,
    render3d,
    saveRender3d,
    reset: resetRender3d,
  } = useImageRender3d({
    propertyId,
    onSuccess: (newImage) => {
      console.log("🎉 3D render success - adding new image to gallery:", {
        newImageId: newImage.propertyImageId.toString(),
        imageOrder: newImage.imageOrder,
        currentImagesCount: allImages.length,
      });

      // Add the new 3D rendered image to the gallery
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
      setComparisonType(null);
      resetRender3d();

      console.log(
        "✅ 3D render complete - mini gallery should now be visible",
      );
    },
    onComparisonReady: () => {
      // Show comparison slider when 3D render completes
      setIsComparisonVisible(true);
      setComparisonType("render-3d");
    },
    onError: (error) => {
      console.error("3D render failed:", error);
      toast.error("Error al generar el render 3D");
    },
  });

  // Handle review request
  const handleReviewRenovation = useCallback(
    async (reviewText: string) => {
      if (!renovatedImageUrl || !renovationMetadata) {
        toast.error("No hay imagen renovada para revisar");
        return;
      }

      try {
        await reviewRenovation(reviewText);
        // The hook updates renovatedImageUrl automatically, so the comparison view will update
        console.log("✅ Review completed - image updated in comparison view");
      } catch (error) {
        console.error("Review failed:", error);
        // Error is already handled by the hook with toast
      }
    },
    [renovatedImageUrl, renovationMetadata, reviewRenovation],
  );

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

  // Handle blur faces request from tools
  const handleBlurFaces = useCallback(async () => {
    if (!selectedImage) {
      toast.error("No hay imagen seleccionada");
      return;
    }

    if (blurFacesStatus === "processing") {
      toast.warning("Ya hay un desenfoque de caras en progreso");
      return;
    }

    try {
      await blurFaces(
        selectedImage.imageUrl,
        selectedImage.referenceNumber,
        selectedImage.imageOrder,
      );
    } catch (error) {
      console.error("Failed to start blur faces:", error);
      toast.error("Error al iniciar el desenfoque de caras");
    }
  }, [selectedImage, blurFacesStatus, blurFaces]);

  // Handle remove clutter request from tools
  const handleRemoveClutter = useCallback(async () => {
    if (!selectedImage) {
      toast.error("No hay imagen seleccionada");
      return;
    }

    if (removeClutterStatus === "processing") {
      toast.warning("Ya hay una eliminación de desorden en progreso");
      return;
    }

    try {
      await removeClutter(
        selectedImage.imageUrl,
        selectedImage.referenceNumber,
        selectedImage.imageOrder,
      );
    } catch (error) {
      console.error("Failed to start remove clutter:", error);
      toast.error("Error al iniciar la eliminación de desorden");
    }
  }, [selectedImage, removeClutterStatus, removeClutter]);

  // Handle lighting enhancement request from tools
  const handleEnhanceLighting = useCallback(async () => {
    if (!selectedImage) {
      toast.error("No hay imagen seleccionada");
      return;
    }

    if (enhanceLightingStatus === "processing") {
      toast.warning("Ya hay una mejora de iluminación en progreso");
      return;
    }

    try {
      await enhanceLighting(
        selectedImage.imageUrl,
        selectedImage.referenceNumber,
        selectedImage.imageOrder,
      );
    } catch (error) {
      console.error("Failed to start lighting enhancement:", error);
      toast.error("Error al iniciar la mejora de iluminación");
    }
  }, [selectedImage, enhanceLightingStatus, enhanceLighting]);

  // Handle 3D render request from tools
  const handleRender3d = useCallback(async () => {
    if (!selectedImage) {
      toast.error("No hay imagen seleccionada");
      return;
    }

    if (render3dStatus === "processing") {
      toast.warning("Ya hay un render 3D en progreso");
      return;
    }

    try {
      await render3d(
        selectedImage.imageUrl,
        selectedImage.referenceNumber,
        selectedImage.imageOrder,
      );
    } catch (error) {
      console.error("Failed to start 3D render:", error);
      toast.error("Error al iniciar el render 3D");
    }
  }, [selectedImage, render3dStatus, render3d]);

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
    setComparisonType(null);
    resetRenovation();

    // Similar to enhancement, renovation images are only saved on user confirmation
    // Discarding simply clears the temporary state
    toast.success("Imagen renovada descartada");
  }, [resetRenovation]);

  // Handle saving the blurred faces image
  const handleSaveBlurred = useCallback(async () => {
    if (!blurredImageUrl || !blurMetadata) {
      toast.error("No hay imagen con caras desenfocadas para guardar");
      return;
    }

    try {
      await saveBlurred();
    } catch (error) {
      console.error("Save blurred faces image failed:", error);
    }
  }, [blurredImageUrl, blurMetadata, saveBlurred]);

  // Handle saving the decluttered image
  const handleSaveDecluttered = useCallback(async () => {
    if (!declutteredImageUrl || !removeClutterMetadata) {
      toast.error("No hay imagen sin desorden para guardar");
      return;
    }

    try {
      await saveDecluttered();
    } catch (error) {
      console.error("Save decluttered image failed:", error);
    }
  }, [declutteredImageUrl, removeClutterMetadata, saveDecluttered]);

  // Handle discarding the blurred faces image
  const handleDiscardBlurred = useCallback(() => {
    // Hide comparison and reset all blur faces state
    setIsComparisonVisible(false);
    setComparisonType(null);
    resetBlurFaces();

    // Discarding simply clears the temporary state
    toast.success("Imagen con caras desenfocadas descartada");
  }, [resetBlurFaces]);

  // Handle discarding the decluttered image
  const handleDiscardDecluttered = useCallback(() => {
    // Hide comparison and reset all remove clutter state
    setIsComparisonVisible(false);
    setComparisonType(null);
    resetRemoveClutter();

    // Discarding simply clears the temporary state
    toast.success("Imagen sin desorden descartada");
  }, [resetRemoveClutter]);

  // Handle saving the lighting-enhanced image
  const handleSaveLightingEnhanced = useCallback(async () => {
    if (!lightingEnhancedImageUrl || !lightingMetadata) {
      toast.error("No hay imagen con iluminación mejorada para guardar");
      return;
    }

    try {
      await saveLightingEnhanced();
    } catch (error) {
      console.error("Save lighting-enhanced image failed:", error);
    }
  }, [lightingEnhancedImageUrl, lightingMetadata, saveLightingEnhanced]);

  // Handle discarding the lighting-enhanced image
  const handleDiscardLightingEnhanced = useCallback(() => {
    // Hide comparison and reset all lighting enhancement state
    setIsComparisonVisible(false);
    setComparisonType(null);
    resetEnhanceLighting();

    // Discarding simply clears the temporary state
    toast.success("Imagen con iluminación mejorada descartada");
  }, [resetEnhanceLighting]);

  // Handle saving the 3D rendered image
  const handleSaveRender3d = useCallback(async () => {
    if (!render3dImageUrl || !render3dMetadata) {
      toast.error("No hay imagen 3D para guardar");
      return;
    }

    try {
      await saveRender3d();
    } catch (error) {
      console.error("Save 3D render image failed:", error);
    }
  }, [render3dImageUrl, render3dMetadata, saveRender3d]);

  // Handle discarding the 3D rendered image
  const handleDiscardRender3d = useCallback(() => {
    // Hide comparison and reset all 3D render state
    setIsComparisonVisible(false);
    setComparisonType(null);
    resetRender3d();

    // Discarding simply clears the temporary state
    toast.success("Imagen 3D descartada");
  }, [resetRender3d]);

  // Determine if AI is processing
  const isProcessing =
    enhancementStatus === "processing" ||
    renovationStatus === "processing" ||
    blurFacesStatus === "processing" ||
    removeClutterStatus === "processing" ||
    enhanceLightingStatus === "processing" ||
    render3dStatus === "processing";
  const processingType =
    renovationStatus === "processing"
      ? "renovación"
      : blurFacesStatus === "processing"
        ? "desenfoque de caras"
        : removeClutterStatus === "processing"
          ? "eliminación de desorden"
          : enhanceLightingStatus === "processing"
            ? "mejora de iluminación"
            : render3dStatus === "processing"
              ? "render 3D"
              : "mejora";

  // Debug mini gallery visibility
  const shouldShowMiniGallery =
    enhancementStatus !== "processing" &&
    renovationStatus !== "processing" &&
    blurFacesStatus !== "processing" &&
    removeClutterStatus !== "processing" &&
    enhanceLightingStatus !== "processing" &&
    render3dStatus !== "processing" &&
    !isComparisonVisible;
  console.log("🔍 Mini gallery visibility check:", {
    enhancementStatus,
    renovationStatus,
    blurFacesStatus,
    removeClutterStatus,
    render3dStatus,
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

      <div className="space-y-12">
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
          _enhancementStatus={enhancementStatus}
          _enhancementProgress={enhancementProgress}
          _enhancementError={enhancementError}
          selectedImage={selectedImage}
          _isComparisonVisible={isComparisonVisible}
          onRenovateImage={handleRenovateImage}
          _renovationStatus={renovationStatus}
          onBlurFaces={handleBlurFaces}
          _blurFacesStatus={blurFacesStatus}
          onRemoveClutter={handleRemoveClutter}
          _removeClutterStatus={removeClutterStatus}
          onEnhanceLighting={handleEnhanceLighting}
          _enhanceLightingStatus={enhanceLightingStatus}
          onRender3d={handleRender3d}
          _render3dStatus={render3dStatus}
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
              comparisonType === "renovation"
                ? (renovatedImageUrl ?? "")
                : comparisonType === "blur-faces"
                  ? (blurredImageUrl ?? "")
                  : comparisonType === "remove-clutter"
                    ? (declutteredImageUrl ?? "")
                    : comparisonType === "enhance-lighting"
                      ? (lightingEnhancedImageUrl ?? "")
                      : comparisonType === "render-3d"
                        ? (render3dImageUrl ?? "")
                        : (enhancedImageUrl ?? "")
            }
            enhancementStatus={
              comparisonType === "renovation"
                ? renovationStatus
                : comparisonType === "blur-faces"
                  ? blurFacesStatus
                  : comparisonType === "remove-clutter"
                    ? removeClutterStatus
                    : comparisonType === "enhance-lighting"
                      ? enhanceLightingStatus
                      : comparisonType === "render-3d"
                        ? render3dStatus
                        : enhancementStatus
            }
            onSave={
              comparisonType === "renovation"
                ? handleSaveRenovated
                : comparisonType === "blur-faces"
                  ? handleSaveBlurred
                  : comparisonType === "remove-clutter"
                    ? handleSaveDecluttered
                    : comparisonType === "enhance-lighting"
                      ? handleSaveLightingEnhanced
                      : comparisonType === "render-3d"
                        ? handleSaveRender3d
                        : handleSaveEnhanced
            }
            onDiscard={
              comparisonType === "renovation"
                ? handleDiscardRenovated
                : comparisonType === "blur-faces"
                  ? handleDiscardBlurred
                  : comparisonType === "remove-clutter"
                    ? handleDiscardDecluttered
                    : comparisonType === "enhance-lighting"
                      ? handleDiscardLightingEnhanced
                      : comparisonType === "render-3d"
                        ? handleDiscardRender3d
                        : handleDiscardEnhanced
            }
            isRenovationComparison={comparisonType === "renovation"}
            onReview={comparisonType === "renovation" ? handleReviewRenovation : undefined}
            reviewStatus={reviewStatus}
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
