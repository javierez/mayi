"use client";

import React, { useState, useRef, useReducer, useCallback } from "react";
import Image from "next/image";
import {
  Plus,
  Trash2,
  Download,
  CheckSquare2,
  Square,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import {
  ACCEPTED_IMAGE_TYPES,
  processImageFiles,
} from "~/lib/image-utils";
import { toast } from "sonner";
import type { PropertyImage } from "~/lib/data";
import {
  uploadPropertyImage,
  deletePropertyImage,
  updateImageOrders,
  togglePropertyImageVisibility,
} from "~/app/actions/upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ImageViewer } from "~/components/ui/image-viewer";

interface ImageGalleryProps {
  images: PropertyImage[];
  title: string;
  propertyId: bigint;
  referenceNumber: string;
  onImageUploaded?: (image: PropertyImage) => void;
  onImageDeleted?: (imageKey: string) => void;
  onImagesReordered?: (images: PropertyImage[]) => void;
  canEdit?: boolean; // Permission flag to control upload/delete actions
}

export function ImageGallery({
  images: initialImages,
  title,
  propertyId,
  referenceNumber,
  onImageUploaded,
  onImageDeleted,
  onImagesReordered,
  canEdit = true, // Default to true for backward compatibility
}: ImageGalleryProps) {
  const [images, setImages] = useState<PropertyImage[]>(initialImages);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);
  const [expandedImage, setExpandedImage] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState<Set<number>>(
    new Set(),
  );

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingImages, setPendingImages] = useState<PropertyImage[]>([]);

  // State for managing image sources with fallbacks
  const [imageSources, setImageSources] = useState<Record<number, string>>({});

  // Use ref for image loaded state to avoid excessive re-renders
  const imageLoadedRef = useRef<Record<number, boolean>>({});
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  // Sync images state and image sources when initialImages prop changes (e.g., when switching tabs)
  React.useEffect(() => {
    setImages(initialImages);

    // Build image sources at the same time to avoid double render
    const sources: Record<number, string> = {};
    initialImages.forEach((image, index) => {
      if (image.imageUrl) {
        sources[index] = image.imageUrl;
      }
    });
    setImageSources(sources);

    // Reset loaded state when images change
    imageLoadedRef.current = {};
  }, [initialImages]);

  const handleImageError = (index: number) => {
    console.log("Image failed to load:", imageSources[index]);
  };

  const handleImageLoad = useCallback((index: number) => {
    imageLoadedRef.current[index] = true;
    // Only force update every 10 images or on the last image to batch updates
    const loadedCount = Object.keys(imageLoadedRef.current).length;
    if (loadedCount === images.length || loadedCount % 10 === 0) {
      forceUpdate();
    }
  }, [images.length]);

  const handleDownload = async (imageUrl: string, fileName: string) => {
    setIsDownloading(true);

    try {
      // Extract file extension from URL or default to jpg
      const urlExtension = imageUrl.split(".").pop()?.toLowerCase();
      const validExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
      const extension = validExtensions.includes(urlExtension ?? "")
        ? urlExtension
        : "jpg";

      // Ensure filename has proper extension
      const finalFileName = fileName.endsWith(`.${extension}`)
        ? fileName
        : `${fileName}.${extension}`;

      // Create a temporary link element for download
      const a = document.createElement("a");
      a.href = imageUrl;
      a.download = finalFileName;
      a.style.display = "none";

      // Append to body, click, and remove
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Small delay to ensure download starts
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error("Error downloading image:", error);
      // TODO: Show error toast
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBulkDownload = async () => {
    const selectedImagesList = Array.from(selectedImages);
    for (const index of selectedImagesList) {
      const image = images[index];
      if (image) {
        // Get the file extension from the URL
        const extension = image.imageUrl.split(".").pop() ?? "jpg";
        await handleDownload(
          image.imageUrl,
          `property-image-${index + 1}.${extension}`,
        );
      }
    }
  };

  const handleBulkDelete = async () => {
    const selectedImagesList = Array.from(selectedImages);
    const imagesToDelete = selectedImagesList
      .map((index) => images[index])
      .filter((img): img is PropertyImage => img !== undefined);

    // Optimistic update: immediately remove from UI
    const newImages = images.filter((_, i) => !selectedImages.has(i));
    setImages(newImages);

    // Clear selection and exit select mode immediately
    setSelectedImages(new Set());
    setIsSelectMode(false);

    setIsDeleting(true);
    try {
      for (const image of imagesToDelete) {
        await deletePropertyImage(image.imageKey, propertyId);
        // Notify parent component of each successful deletion
        onImageDeleted?.(image.imageKey);
      }
    } catch (error) {
      console.error("Error deleting images:", error);
      // Revert optimistic update on error
      setImages(images);
      // imageSources will be automatically updated by the useEffect when images changes
      // TODO: Show error toast
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleImageSelection = (index: number) => {
    setSelectedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if any files need HEIC conversion
    const hasHeicFiles = Array.from(files).some(
      (file) =>
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif"),
    );

    if (hasHeicFiles) {
      setIsConverting(true);
    }

    try {
      // Process files to convert any HEIC images to JPEG
      const { files: processedFiles, failedFiles } = await processImageFiles(
        Array.from(files),
      );

      // Show toast for failed conversions
      if (failedFiles.length > 0) {
        const failedList = failedFiles.join(", ");
        toast.error(
          `No se pudieron convertir ${failedFiles.length} archivo(s) HEIC: ${failedList}. Intenta convertirlos manualmente a JPG.`,
          { duration: 6000 },
        );
      }

      setIsConverting(false);

      // If no files were successfully processed, exit early
      if (processedFiles.length === 0) {
        return;
      }

      setIsUploading(true);

      const uploadPromises = processedFiles.map(async (file, index) => {
        const fileId = `${file.name}-${Date.now()}-${index}`;
        setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const currentProgress = prev[fileId] ?? 0;
            if (currentProgress >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return { ...prev, [fileId]: currentProgress + 10 };
          });
        }, 200);

        try {
          // Calculate the next image order based on existing images
          const maxImageOrder =
            images.length > 0
              ? Math.max(...images.map((img) => img.imageOrder ?? 0))
              : 0;
          const nextImageOrder = maxImageOrder + index + 1;

          const newImage = await uploadPropertyImage(
            file,
            propertyId,
            referenceNumber,
            nextImageOrder,
          );

          clearInterval(progressInterval);
          setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));

          // Small delay to show 100% before hiding
          await new Promise((resolve) => setTimeout(resolve, 500));
          return newImage;
        } catch (error) {
          clearInterval(progressInterval);
          throw error;
        }
      });

      const newImages = await Promise.all(uploadPromises);
      const validImages = newImages.filter(
        (image): image is PropertyImage => image !== undefined,
      );
      setImages((prev) => [...prev, ...validImages]);

      // Add new images to imageSources state
      validImages.forEach((image, index) => {
        const newIndex = images.length + index;
        if (image.imageUrl) {
          setImageSources((prev) => ({
            ...prev,
            [newIndex]: image.imageUrl,
          }));
        }
      });

      // Call the callback for each uploaded image
      validImages.forEach((image: PropertyImage) => {
        onImageUploaded?.(image);
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      // TODO: Show error toast
    } finally {
      setIsConverting(false);
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageToRemove = images[index];
    if (!imageToRemove) return;

    // Optimistic update: immediately remove from UI
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setImageToDelete(null);

    setIsDeleting(true);
    try {
      await deletePropertyImage(imageToRemove.imageKey, propertyId);
      // Notify parent component of successful deletion
      onImageDeleted?.(imageToRemove.imageKey);
    } catch (error) {
      console.error("Error deleting image:", error);
      // Revert optimistic update on error
      setImages(images);
      // imageSources will be automatically updated by the useEffect when images changes
      // TODO: Show error toast
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleVisibility = async (index: number) => {
    const image = images[index];
    if (!image) return;

    const newActiveStatus = !image.isActive;

    // Add to loading set
    setIsTogglingVisibility((prev) => new Set([...prev, index]));

    // Optimistic update
    setImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, isActive: newActiveStatus } : img,
      ),
    );

    try {
      await togglePropertyImageVisibility(
        image.propertyImageId,
        newActiveStatus,
      );
    } catch (error) {
      console.error("Error toggling image visibility:", error);
      // Revert optimistic update
      setImages((prev) =>
        prev.map((img, i) =>
          i === index ? { ...img, isActive: !newActiveStatus } : img,
        ),
      );
      // TODO: Show error toast
    } finally {
      // Remove from loading set
      setIsTogglingVisibility((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isSelectMode) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());

    // Add visual feedback to the dragged element
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === dropIndex) {
      return;
    }

    // Create a new array with reordered images
    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];

    if (!draggedImage) return;

    // Remove the dragged image and insert it at the new position
    newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    // Update the local state immediately for better UX
    setImages(newImages);
    setPendingImages(newImages);
    setHasUnsavedChanges(true);

    // Update the imageSources state to match the new order
    const newImageSources: Record<number, string> = {};
    newImages.forEach((image, index) => {
      if (image.imageUrl) {
        newImageSources[index] = image.imageUrl;
      }
    });
    setImageSources(newImageSources);

    setDraggedIndex(null);
  };

  const handleSaveOrder = async () => {
    if (!hasUnsavedChanges || pendingImages.length === 0) return;

    setIsUpdatingOrder(true);

    try {
      // Prepare the updates for the database
      const updates = pendingImages.map((image, index) => ({
        propertyImageId: image.propertyImageId,
        imageOrder: index + 1, // 1-based indexing
      }));

      // Update the database
      await updateImageOrders(updates);

      // Notify parent component of successful reordering
      onImagesReordered?.(pendingImages);

      setHasUnsavedChanges(false);
      setPendingImages([]);
    } catch (error) {
      console.error("Error updating image order:", error);
      // Revert the local state if the database update failed
      setImages(initialImages);
      setHasUnsavedChanges(false);
      setPendingImages([]);
      // TODO: Show error toast
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const handleCancelOrder = () => {
    setImages(initialImages);
    setHasUnsavedChanges(false);
    setPendingImages([]);

    // Reset imageSources to original order
    const originalImageSources: Record<number, string> = {};
    initialImages.forEach((image, index) => {
      if (image.imageUrl) {
        originalImageSources[index] = image.imageUrl;
      }
    });
    setImageSources(originalImageSources);
  };

  return (
    <div className="space-y-4">
      {/* Help text for drag and drop */}
      {images.length > 1 && (
        <div className="flex flex-col gap-3">
          {!hasUnsavedChanges && (
            <p className="flex h-10 items-center justify-center text-center text-sm text-gray-500">
              Arrastra y suelta las imágenes para reordenarlas
            </p>
          )}
          {hasUnsavedChanges && (
            <div className="flex h-10 items-center justify-end transition-all duration-200">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelOrder}
                  className="h-7 text-xs text-gray-600 hover:bg-white/80"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveOrder}
                  disabled={isUpdatingOrder}
                  className="h-7 bg-gray-700 text-xs text-white hover:bg-gray-800"
                >
                  {isUpdatingOrder ? "Guardando..." : "Guardar orden"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {images.map((image, idx) => (
          <div
            key={image.imageKey}
            className={cn(
              "group relative overflow-hidden rounded-lg border bg-muted transition-all duration-200",
              isSelectMode && "cursor-pointer",
              selectedImages.has(idx) && "ring-2 ring-primary/50",
              dragOverIndex === idx && "scale-105 ring-2 ring-blue-400",
              draggedIndex === idx && "scale-95 opacity-50",
              !isSelectMode && "cursor-move",
            )}
            draggable={!isSelectMode && !isUpdatingOrder}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, idx)}
            onClick={() => {
              if (isSelectMode) {
                toggleImageSelection(idx);
              } else {
                setExpandedImage(idx);
              }
            }}
          >
            {imageSources[idx] && (
              <Image
                src={imageSources[idx]}
                alt={title ?? `Property image ${idx + 1}`}
                width={300}
                height={200}
                className={cn(
                  "h-40 w-full object-cover transition-opacity duration-200",
                  !image.isActive && "opacity-50",
                )}
                onError={() => handleImageError(idx)}
                onLoad={() => handleImageLoad(idx)}
              />
            )}

            {isSelectMode ? (
              <div className="absolute left-2 top-2 rounded-full bg-white/80 p-1">
                {selectedImages.has(idx) ? (
                  <CheckSquare2 className="h-4 w-4 text-primary" />
                ) : (
                  <Square className="h-4 w-4 text-gray-400" />
                )}
              </div>
            ) : (
              <>
                {canEdit && (
                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded-full bg-black/40 p-1.5 text-white transition-all duration-200 hover:bg-red-500 md:opacity-0 md:group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageToDelete(idx);
                    }}
                    disabled={isDeleting}
                    aria-label="Eliminar imagen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  className="absolute bottom-2 left-2 rounded-full bg-black/40 p-1.5 text-white transition-all duration-200 hover:bg-black/60 disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (imageSources[idx]) {
                      void handleDownload(
                        imageSources[idx],
                        `property-image-${idx + 1}.jpg`,
                      );
                    }
                  }}
                  disabled={isDownloading}
                  aria-label="Descargar imagen"
                >
                  {isDownloading ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                </button>
                {canEdit && (
                  <button
                    type="button"
                    className="absolute bottom-2 right-2 rounded-full bg-black/40 p-1.5 text-white transition-all duration-200 hover:bg-black/60 disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleToggleVisibility(idx);
                    }}
                    disabled={isTogglingVisibility.has(idx)}
                    aria-label={
                      image.isActive ? "Ocultar imagen" : "Mostrar imagen"
                    }
                  >
                    {isTogglingVisibility.has(idx) ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : image.isActive ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </>
            )}

            {/* Loading overlay for order updates */}
            {isUpdatingOrder && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>
        ))}
        {canEdit && (
          <label
            className={cn(
              "group relative flex h-40 w-full min-w-[120px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-200 bg-white transition-all duration-200 hover:bg-gray-50",
              (isUploading || isConverting) && "cursor-not-allowed opacity-50",
            )}
          >
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading || isConverting}
            />
            {isConverting ? (
              <div className="flex flex-col items-center justify-center px-4">
                <div className="mb-2 h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                <span className="text-xs font-medium text-gray-500">
                  Convirtiendo...
                </span>
              </div>
            ) : isUploading ? (
              <div className="w-full space-y-2 px-4">
                {Object.entries(uploadProgress).map(([fileId, progress]) => (
                  <div key={fileId} className="space-y-1">
                    <div className="h-0.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full bg-gray-400 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <Plus className="mb-1 h-5 w-5 text-gray-400 transition-colors duration-200 group-hover:text-gray-500" />
                <span className="text-sm font-medium text-gray-400 transition-colors duration-200 group-hover:text-gray-500">
                  Añadir imágenes
                </span>
              </>
            )}
          </label>
        )}
      </div>

      {/* Selection Controls - Moved to bottom */}
      {canEdit && !hasUnsavedChanges && (
        <div className="mt-4 flex items-center space-x-2">
          {isSelectMode ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedImages(new Set());
                  setIsSelectMode(false);
                }}
                className="text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                Cancelar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkDownload}
                disabled={selectedImages.size === 0 || isDeleting}
                className="text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <Download className="mr-1.5 h-4 w-4" />
                Descargar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedImages.size === 0 || isDeleting}
                className="text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Eliminar
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSelectMode(true)}
              className="text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <CheckSquare2 className="mr-1.5 h-4 w-4" />
              Seleccionar
            </Button>
          )}
        </div>
      )}

      <Dialog
        open={imageToDelete !== null}
        onOpenChange={() => setImageToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar imagen?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. La imagen se eliminará
              permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImageToDelete(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                imageToDelete !== null && handleRemoveImage(imageToDelete)
              }
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageViewer
        images={Object.values(imageSources)}
        initialIndex={expandedImage ?? 0}
        isOpen={expandedImage !== null}
        onClose={() => setExpandedImage(null)}
        title={title}
      />
    </div>
  );
}
