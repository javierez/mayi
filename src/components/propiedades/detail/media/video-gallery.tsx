"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Maximize2,
  X,
  Download,
  CheckSquare2,
  Square,
  Eye,
  EyeOff,
  Play,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { PropertyImage } from "~/lib/data";
import {
  uploadPropertyVideo,
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
import { YouTubeLinkManager } from "./youtube-link-manager";
import { toast } from "sonner";

interface VideoGalleryProps {
  videos: PropertyImage[];
  youtubeLinks: PropertyImage[];
  title: string;
  propertyId: bigint;
  referenceNumber: string;
  onVideoUploaded?: (video: PropertyImage) => void;
  onYouTubeLinkAdded?: (link: PropertyImage) => void;
  canEdit?: boolean; // Permission flag to control upload/delete actions
}

export function VideoGallery({
  videos: initialVideos,
  youtubeLinks,
  title: _title,
  propertyId,
  referenceNumber,
  onVideoUploaded,
  onYouTubeLinkAdded,
  canEdit = true, // Default to true for backward compatibility
}: VideoGalleryProps) {
  const [videos, setVideos] = useState<PropertyImage[]>(initialVideos);
  const [videoToDelete, setVideoToDelete] = useState<number | null>(null);
  const [expandedVideo, setExpandedVideo] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<number>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState<Set<number>>(
    new Set(),
  );

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingVideos, setPendingVideos] = useState<PropertyImage[]>([]);

  // State for managing video sources with fallbacks
  const [videoSources, setVideoSources] = useState<Record<number, string>>({});
  const [videoLoaded, setVideoLoaded] = useState<Record<number, boolean>>({});

  // Initialize video sources
  React.useEffect(() => {
    const sources: Record<number, string> = {};
    initialVideos.forEach((video, index) => {
      if (video.imageUrl) {
        sources[index] = video.imageUrl;
      }
    });
    setVideoSources(sources);
  }, [initialVideos]);

  const handleVideoError = (index: number) => {
    console.log("Video failed to load:", videoSources[index]);
  };

  const handleVideoLoad = (index: number) => {
    setVideoLoaded((prev) => ({
      ...prev,
      [index]: true,
    }));
  };

  const handleDownload = async (videoUrl: string, fileName: string) => {
    setIsDownloading(true);

    try {
      // Extract file extension from URL or default to mp4
      const urlExtension = videoUrl.split(".").pop()?.toLowerCase();
      const validExtensions = ["mp4", "mov", "avi", "webm", "mkv"];
      const extension = validExtensions.includes(urlExtension ?? "")
        ? urlExtension
        : "mp4";

      // Ensure filename has proper extension
      const finalFileName = fileName.endsWith(`.${extension}`)
        ? fileName
        : `${fileName}.${extension}`;

      // Create a temporary link element for download
      const a = document.createElement("a");
      a.href = videoUrl;
      a.download = finalFileName;
      a.style.display = "none";

      // Append to body, click, and remove
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Small delay to ensure download starts
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error("Error downloading video:", error);
      // TODO: Show error toast
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBulkDownload = async () => {
    const selectedVideosList = Array.from(selectedVideos);
    for (const index of selectedVideosList) {
      const video = videos[index];
      if (video) {
        // Get the file extension from the URL
        const extension = video.imageUrl.split(".").pop() ?? "mp4";
        await handleDownload(
          video.imageUrl,
          `property-video-${index + 1}.${extension}`,
        );
      }
    }
  };

  const handleBulkDelete = async () => {
    const selectedVideosList = Array.from(selectedVideos);
    setIsDeleting(true);
    try {
      for (const index of selectedVideosList) {
        const video = videos[index];
        if (video) {
          await deletePropertyImage(video.imageKey, propertyId);
        }
      }
      setVideos(videos.filter((_, i) => !selectedVideos.has(i)));
    } catch (error) {
      console.error("Error deleting videos:", error);
      // TODO: Show error toast
    } finally {
      setIsDeleting(false);
      setSelectedVideos(new Set());
      setIsSelectMode(false);
    }
  };

  const toggleVideoSelection = (index: number) => {
    setSelectedVideos((prev) => {
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

    // Check file sizes (10MB limit per file due to Next.js Server Actions limit)
    const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
    const oversizedFiles = Array.from(files).filter(
      (file) => file.size > maxFileSize,
    );

    if (oversizedFiles.length > 0) {
      toast.error(
        `Los siguientes archivos exceden el límite de 10MB:\n${oversizedFiles.map((f) => `${f.name} (${Math.round(f.size / 1024 / 1024)}MB)`).join("\n")}\n\nPor favor, comprime los vídeos antes de subirlos.`,
        { duration: 8000 }
      );
      // Reset the input
      e.target.value = "";
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
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
          // Calculate the next video order based on existing videos
          const maxVideoOrder =
            videos.length > 0
              ? Math.max(...videos.map((vid) => vid.imageOrder ?? 0))
              : 0;
          const nextVideoOrder = maxVideoOrder + index + 1;

          const newVideo = await uploadPropertyVideo(
            file,
            propertyId,
            referenceNumber,
            nextVideoOrder,
          );

          clearInterval(progressInterval);
          setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));

          // Small delay to show 100% before hiding
          await new Promise((resolve) => setTimeout(resolve, 500));
          return newVideo;
        } catch (error) {
          clearInterval(progressInterval);
          setUploadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
          throw error;
        }
      });

      const newVideos = await Promise.all(uploadPromises);
      const validVideos = newVideos.filter(
        (video): video is PropertyImage => video !== undefined,
      );
      setVideos((prev) => [...prev, ...validVideos]);

      // Add new videos to videoSources state
      validVideos.forEach((video, index) => {
        const newIndex = videos.length + index;
        if (video.imageUrl) {
          setVideoSources((prev) => ({
            ...prev,
            [newIndex]: video.imageUrl,
          }));
        }
      });

      // Call the callback for each uploaded video
      validVideos.forEach((video: PropertyImage) => {
        onVideoUploaded?.(video);
      });
    } catch (error) {
      console.error("Error uploading videos:", error);

      // Check if it's a body size limit error
      if (error && typeof error === "object" && "statusCode" in error && error.statusCode === 413) {
        toast.error(
          "Error al subir vídeo: El archivo excede el límite de 10MB para la carga directa. Por favor, utiliza un archivo más pequeño o comprime el vídeo.",
          { duration: 6000 }
        );
      } else if (error instanceof Error && error.message.includes("10mb limit")) {
        toast.error(
          "Error al subir vídeo: El archivo excede el límite de 10MB para la carga directa. Por favor, utiliza un archivo más pequeño o comprime el vídeo.",
          { duration: 6000 }
        );
      } else {
        toast.error("Error al subir los vídeos. Por favor, inténtalo de nuevo.");
      }
    } finally {
      setIsUploading(false);
      setUploadProgress({});
      // Reset the file input
      const fileInput = document.querySelector('input[type="file"][accept="video/*"]');
      if (fileInput) {
        (fileInput as HTMLInputElement).value = "";
      }
    }
  };

  const handleRemoveVideo = async (index: number) => {
    const videoToRemove = videos[index];
    if (!videoToRemove) return;

    setIsDeleting(true);
    try {
      await deletePropertyImage(videoToRemove.imageKey, propertyId);
      setVideos(videos.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error deleting video:", error);
      // TODO: Show error toast
    } finally {
      setIsDeleting(false);
      setVideoToDelete(null);
    }
  };

  const handleToggleVisibility = async (index: number) => {
    const video = videos[index];
    if (!video) return;

    const newActiveStatus = !video.isActive;

    // Add to loading set
    setIsTogglingVisibility((prev) => new Set([...prev, index]));

    // Optimistic update
    setVideos((prev) =>
      prev.map((vid, i) =>
        i === index ? { ...vid, isActive: newActiveStatus } : vid,
      ),
    );

    try {
      await togglePropertyImageVisibility(
        video.propertyImageId,
        newActiveStatus,
      );
    } catch (error) {
      console.error("Error toggling video visibility:", error);
      // Revert optimistic update
      setVideos((prev) =>
        prev.map((vid, i) =>
          i === index ? { ...vid, isActive: !newActiveStatus } : vid,
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

    // Create a new array with reordered videos
    const newVideos = [...videos];
    const draggedVideo = newVideos[draggedIndex];

    if (!draggedVideo) return;

    // Remove the dragged video and insert it at the new position
    newVideos.splice(draggedIndex, 1);
    newVideos.splice(dropIndex, 0, draggedVideo);

    // Update the local state immediately for better UX
    setVideos(newVideos);
    setPendingVideos(newVideos);
    setHasUnsavedChanges(true);

    // Update the videoSources state to match the new order
    const newVideoSources: Record<number, string> = {};
    newVideos.forEach((video, index) => {
      if (video.imageUrl) {
        newVideoSources[index] = video.imageUrl;
      }
    });
    setVideoSources(newVideoSources);

    setDraggedIndex(null);
  };

  const handleSaveOrder = async () => {
    if (!hasUnsavedChanges || pendingVideos.length === 0) return;

    setIsUpdatingOrder(true);

    try {
      // Prepare the updates for the database
      const updates = pendingVideos.map((video, index) => ({
        propertyImageId: video.propertyImageId,
        imageOrder: index + 1, // 1-based indexing
      }));

      // Update the database
      await updateImageOrders(updates);

      setHasUnsavedChanges(false);
      setPendingVideos([]);
    } catch (error) {
      console.error("Error updating video order:", error);
      // Revert the local state if the database update failed
      setVideos(initialVideos);
      setHasUnsavedChanges(false);
      setPendingVideos([]);
      // TODO: Show error toast
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const handleCancelOrder = () => {
    setVideos(initialVideos);
    setHasUnsavedChanges(false);
    setPendingVideos([]);

    // Reset videoSources to original order
    const originalVideoSources: Record<number, string> = {};
    initialVideos.forEach((video, index) => {
      if (video.imageUrl) {
        originalVideoSources[index] = video.imageUrl;
      }
    });
    setVideoSources(originalVideoSources);
  };

  return (
    <div className="space-y-4">
      {/* Help text for drag and drop */}
      {videos.length > 1 && (
        <p className="text-center text-sm text-gray-500">
          Arrastra y suelta los vídeos para reordenarlos
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {videos.map((video, idx) => (
          <div
            key={video.propertyImageId.toString()}
            className={cn(
              "group relative overflow-hidden rounded-lg border bg-muted transition-all duration-200",
              isSelectMode && "cursor-pointer",
              selectedVideos.has(idx) && "ring-2 ring-primary/50",
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
            onClick={() => isSelectMode && toggleVideoSelection(idx)}
          >
            {videoSources[idx] && (
              <div className="relative">
                <video
                  src={videoSources[idx]}
                  className={cn(
                    "h-40 w-full object-cover transition-opacity duration-200",
                    !video.isActive && "opacity-50",
                  )}
                  onError={() => handleVideoError(idx)}
                  onLoadedData={() => handleVideoLoad(idx)}
                  preload="metadata"
                  muted
                />
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Play className="h-12 w-12 text-white opacity-80" />
                </div>
              </div>
            )}
            {!videoLoaded[idx] && (
              <div className="absolute inset-0 animate-pulse bg-muted" />
            )}

            {isSelectMode ? (
              <div className="absolute left-2 top-2 rounded-full bg-white/80 p-1">
                {selectedVideos.has(idx) ? (
                  <CheckSquare2 className="h-4 w-4 text-primary" />
                ) : (
                  <Square className="h-4 w-4 text-gray-400" />
                )}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="absolute left-2 top-2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-all duration-200 hover:bg-black/60 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedVideo(idx);
                  }}
                  aria-label="Expandir vídeo"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
                {canEdit && (
                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-all duration-200 hover:bg-red-500 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setVideoToDelete(idx);
                    }}
                    disabled={isDeleting}
                    aria-label="Eliminar vídeo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  className="absolute bottom-2 left-2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-all duration-200 hover:bg-black/60 disabled:opacity-50 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (videoSources[idx]) {
                      void handleDownload(
                        videoSources[idx],
                        `property-video-${idx + 1}.mp4`,
                      );
                    }
                  }}
                  disabled={isDownloading}
                  aria-label="Descargar vídeo"
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
                    className="absolute bottom-2 right-2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-all duration-200 hover:bg-black/60 disabled:opacity-50 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleToggleVisibility(idx);
                    }}
                    disabled={isTogglingVisibility.has(idx)}
                    aria-label={
                      video.isActive ? "Ocultar vídeo" : "Mostrar vídeo"
                    }
                  >
                    {isTogglingVisibility.has(idx) ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : video.isActive ? (
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
              isUploading && "cursor-not-allowed opacity-50",
            )}
          >
            <input
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {isUploading ? (
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
                  Añadir vídeos
                </span>
                <span className="text-xs text-gray-400">
                  (máx. 10MB por archivo)
                </span>
              </>
            )}
          </label>
        )}
      </div>

      {/* Selection Controls - Moved to bottom */}
      {canEdit && (
        <div className="mt-4 flex items-center space-x-2">
          {isSelectMode ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedVideos(new Set());
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
                disabled={selectedVideos.size === 0 || isDeleting}
                className="text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <Download className="mr-1.5 h-4 w-4" />
                Descargar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedVideos.size === 0 || isDeleting}
                className="text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Eliminar
              </Button>
            </>
          ) : hasUnsavedChanges ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelOrder}
                className="text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                Cancelar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveOrder}
                disabled={isUpdatingOrder}
                className="text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                {isUpdatingOrder ? "Guardando..." : "Guardar"}
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
        open={videoToDelete !== null}
        onOpenChange={() => setVideoToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar vídeo?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El vídeo se eliminará
              permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVideoToDelete(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                videoToDelete !== null && handleRemoveVideo(videoToDelete)
              }
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={expandedVideo !== null}
        onOpenChange={() => setExpandedVideo(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-[90vw] border-none bg-transparent p-0 shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Vista ampliada del vídeo</DialogTitle>
            <DialogDescription>
              Vídeo ampliado de la propiedad. Presione ESC o el botón de cerrar
              para salir.
            </DialogDescription>
          </DialogHeader>
          {expandedVideo !== null &&
            videos[expandedVideo] &&
            videoSources[expandedVideo] && (
              <div className="relative">
                <video
                  src={videoSources[expandedVideo]}
                  className="h-auto max-h-[90vh] w-full rounded-lg object-contain"
                  controls
                  onError={() => handleVideoError(expandedVideo)}
                  onLoadedData={() => handleVideoLoad(expandedVideo)}
                  autoPlay
                />
                <button
                  type="button"
                  className="absolute right-4 top-4 rounded-full bg-white p-2.5 text-gray-800 shadow-lg transition-all hover:scale-110 hover:bg-gray-100"
                  onClick={() => setExpandedVideo(null)}
                  aria-label="Cerrar vista ampliada"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            )}
        </DialogContent>
      </Dialog>

      {/* YouTube Links Section */}
      <YouTubeLinkManager
        youtubeLinks={youtubeLinks}
        propertyId={propertyId}
        referenceNumber={referenceNumber}
        onYouTubeLinkAdded={onYouTubeLinkAdded}
        canEdit={canEdit}
      />
    </div>
  );
}
