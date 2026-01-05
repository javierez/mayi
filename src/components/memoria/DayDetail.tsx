"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  MapPin,
  Cloud,
  Plus,
  Video,
  FileText,
  Music,
  MapPinned,
  Quote,
  MessageCircle,
  Camera,
  Loader2,
  ChevronLeft,
  Star,
  MoreHorizontal,
  ImageIcon,
  Check,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "~/lib/utils";
import { convertHeicToJpeg, isHeicFile } from "~/lib/image-utils";
import { compressVideo, shouldCompressVideo } from "~/lib/video-compress";
import type { Day, MemoryWithUser, SongMemory } from "~/types/memoria";
import { AddMemoryModal } from "./AddMemoryModal";
import { SpotifySongCard } from "./SpotifySongCard";
import {
  getMemoriaPhotoPresignedUrl,
  getMemoriaVideoPresignedUrl,
  getMemoriaThumbnailPresignedUrl,
  createPhotoMemoryAfterUpload,
  createVideoMemoryAfterUpload,
  deleteMemoryAction,
} from "~/server/actions/memoria/memories";
import { updateDayRatingAction, setCoverMemoryAction } from "~/server/actions/memoria/days";

interface DayDetailProps {
  date: string;
  displayDate?: string;
  day: Day | null;
  initialMemories: MemoryWithUser[];
}

const MOOD_ICONS: Record<string, string> = {
  happy: "😊",
  romantic: "💕",
  adventurous: "🌟",
  relaxed: "😌",
  emotional: "🥹",
  funny: "😂",
  special: "✨",
  cozy: "🏠",
};

export function DayDetail({ date, displayDate, day, initialMemories }: DayDetailProps) {
  const router = useRouter();
  const [memories, setMemories] = useState(initialMemories);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploadQueue, setUploadQueue] = useState<{
    type: "photo" | "video";
    filename: string;
    status: "pending" | "uploading" | "success" | "error";
    message?: string;
    progress?: number; // 0-100 percentage
  }[]>([]);
  const [rating, setRating] = useState<number | null>(day?.rating ?? null);
  const [isUpdatingRating, setIsUpdatingRating] = useState(false);
  const [fullscreenMedia, setFullscreenMedia] = useState<MemoryWithUser | null>(null);

  // Sync memories state when initialMemories prop changes (after router.refresh())
  useEffect(() => {
    setMemories(initialMemories);
  }, [initialMemories]);

  const handleRatingChange = async (newRating: number) => {
    // Toggle off if clicking the same rating
    const finalRating = rating === newRating ? null : newRating;
    setRating(finalRating);
    setIsUpdatingRating(true);

    const result = await updateDayRatingAction(date, finalRating);
    if (!result.success) {
      // Revert on error
      setRating(day?.rating ?? null);
    }
    setIsUpdatingRating(false);
  };

  const handleSetCover = async (memoryId: string) => {
    if (!day) return;
    const result = await setCoverMemoryAction(day.id.toString(), memoryId);
    if (result.success) {
      router.refresh();
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    const result = await deleteMemoryAction(memoryId);
    if (result.success) {
      // Remove from local state immediately for better UX
      setMemories((prev) => prev.filter((m) => m.id.toString() !== memoryId));
      router.refresh();
    }
  };

  const handleMemoryAdded = () => {
    router.refresh();
    setShowAddModal(false);
    setSelectedType(null);
  };

  const openAddModal = (type?: string) => {
    setSelectedType(type ?? null);
    setShowAddModal(true);
  };

  const uploadFileToS3 = async (
    file: File | Blob,
    presignedUrl: string,
    contentType?: string,
    onProgress?: (progress: number) => void
  ): Promise<void> => {
    const fileSize = file.size;
    const fileName = file instanceof File ? file.name : "blob";
    const fileType = contentType ?? (file instanceof File ? file.type : "application/octet-stream");

    console.log("[Upload] Starting S3 upload:", {
      fileName,
      fileSize: `${(fileSize / 1024 / 1024).toFixed(2)} MB`,
      fileType,
      presignedUrl: presignedUrl.substring(0, 100) + "...",
    });

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          console.log(`[Upload] Progress: ${percentComplete}% (${event.loaded}/${event.total} bytes)`);
          if (onProgress) {
            onProgress(percentComplete);
          }
        }
      });

      xhr.addEventListener("load", () => {
        console.log("[Upload] XHR load event:", {
          status: xhr.status,
          statusText: xhr.statusText,
          response: xhr.responseText?.substring(0, 200),
        });
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log("[Upload] Success!");
          resolve();
        } else {
          console.error("[Upload] Failed with status:", xhr.status, xhr.responseText);
          reject(new Error(`Upload failed: ${xhr.status} - ${xhr.responseText}`));
        }
      });

      xhr.addEventListener("error", (event) => {
        console.error("[Upload] Network error:", event);
        reject(new Error("Upload failed: Network error"));
      });

      xhr.addEventListener("abort", () => {
        console.warn("[Upload] Aborted");
        reject(new Error("Upload cancelled"));
      });

      xhr.addEventListener("timeout", () => {
        console.error("[Upload] Timeout");
        reject(new Error("Upload timeout"));
      });

      console.log("[Upload] Opening XHR PUT request...");
      xhr.open("PUT", presignedUrl);
      xhr.setRequestHeader("Content-Type", fileType);

      console.log("[Upload] Sending file...");
      xhr.send(file);
    });
  };

  // Generate thumbnail from video file
  const generateVideoThumbnail = (videoFile: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        // Seek to 1 second or 10% of video, whichever is smaller
        video.currentTime = Math.min(1, video.duration * 0.1);
      };

      video.onseeked = () => {
        // Set canvas size to video dimensions (max 1280px width for thumbnail)
        const maxWidth = 1280;
        const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;

        // Draw video frame to canvas
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to generate thumbnail"));
            }
            // Clean up
            URL.revokeObjectURL(video.src);
          },
          "image/jpeg",
          0.85
        );
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error("Failed to load video for thumbnail"));
      };

      video.src = URL.createObjectURL(videoFile);
      video.load();
    });
  };

  // Extract metadata from image/video file
  const extractMetadata = async (
    file: File,
    type: "photo" | "video"
  ): Promise<{
    latitude?: number;
    longitude?: number;
    takenAt?: string;
    deviceInfo?: string;
    duration?: number;
  }> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const endpoint =
        type === "photo" ? "/api/extract-metadata" : "/api/extract-video-metadata";

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          return {
            latitude: result.data.latitude,
            longitude: result.data.longitude,
            takenAt: result.data.takenAt,
            deviceInfo: result.data.deviceInfo,
            duration: result.data.duration,
          };
        }
      }
    } catch (error) {
      console.warn("Failed to extract metadata:", error);
    }
    return {};
  };

  // Upload a single file (used by the queue processor)
  const uploadSingleFile = async (
    originalFile: File,
    type: "photo" | "video",
    index: number
  ): Promise<void> => {
    console.log("[UploadFlow] Starting upload for:", {
      fileName: originalFile.name,
      fileType: originalFile.type,
      fileSize: `${(originalFile.size / 1024 / 1024).toFixed(2)} MB`,
      type,
      index,
    });

    let file: File = originalFile;

    const updateFileStatus = (
      status: "pending" | "uploading" | "success" | "error",
      message?: string,
      progress?: number
    ) => {
      console.log("[UploadFlow] Status update:", { index, status, message, progress });
      setUploadQueue((prev) =>
        prev.map((item, i) => (i === index ? { ...item, status, message, progress } : item))
      );
    };

    const updateProgress = (progress: number) => {
      setUploadQueue((prev) =>
        prev.map((item, i) => (i === index ? { ...item, progress } : item))
      );
    };

    try {
      // Extract metadata from ORIGINAL file BEFORE any conversion
      console.log("[UploadFlow] Extracting metadata...");
      updateFileStatus("uploading", "Extrayendo metadatos...");
      const metadata = await extractMetadata(originalFile, type);
      console.log("[UploadFlow] Metadata extracted:", metadata);

      // Convert HEIC to JPEG if needed (for photos only)
      if (type === "photo" && isHeicFile(originalFile)) {
        updateFileStatus("uploading", "Convirtiendo HEIC...");
        file = await convertHeicToJpeg(originalFile);
      }

      // Compress video if needed
      if (type === "video" && (await shouldCompressVideo(originalFile))) {
        updateFileStatus("uploading", "Comprimiendo vídeo...");
        file = await compressVideo(originalFile, (progress) => {
          updateFileStatus(
            "uploading",
            progress.stage + (progress.percent ? ` (${progress.percent}%)` : "")
          );
        });
      }

      // Get presigned URL
      console.log("[UploadFlow] Getting presigned URL for:", { date, fileName: file.name, fileType: file.type });
      const presignedResult =
        type === "photo"
          ? await getMemoriaPhotoPresignedUrl(date, file.name, file.type)
          : await getMemoriaVideoPresignedUrl(date, file.name, file.type);

      console.log("[UploadFlow] Presigned URL result:", {
        success: presignedResult.success,
        error: presignedResult.error,
        hasData: !!presignedResult.data,
      });

      if (!presignedResult.success || !presignedResult.data) {
        throw new Error(presignedResult.error ?? "Error al obtener URL de subida");
      }

      const { uploadUrl, s3Key, fileUrl } = presignedResult.data;
      console.log("[UploadFlow] Got presigned URL, s3Key:", s3Key);

      // Upload to S3
      console.log("[UploadFlow] Starting S3 upload...");
      updateFileStatus("uploading", "Subiendo...", 0);
      await uploadFileToS3(file, uploadUrl, undefined, updateProgress);
      console.log("[UploadFlow] S3 upload complete!");

      // For videos, generate and upload thumbnail
      let thumbnailUrl: string | undefined;
      if (type === "video") {
        try {
          updateFileStatus("uploading", "Generando miniatura...", 100);
          const thumbnailBlob = await generateVideoThumbnail(file);
          const thumbnailPresigned = await getMemoriaThumbnailPresignedUrl(date, file.name);
          if (thumbnailPresigned.success && thumbnailPresigned.data) {
            await uploadFileToS3(thumbnailBlob, thumbnailPresigned.data.uploadUrl, "image/jpeg");
            thumbnailUrl = thumbnailPresigned.data.fileUrl;
          }
        } catch (thumbError) {
          console.warn("Failed to generate thumbnail:", thumbError);
        }
      }

      // Create memory record with metadata
      updateFileStatus("uploading", "Guardando...", 100);
      const memoryResult =
        type === "photo"
          ? await createPhotoMemoryAfterUpload({
              date,
              url: fileUrl,
              s3Key,
              mimeType: file.type,
              fileSize: file.size,
              latitude: metadata.latitude,
              longitude: metadata.longitude,
              takenAt: metadata.takenAt,
              deviceInfo: metadata.deviceInfo,
            })
          : await createVideoMemoryAfterUpload({
              date,
              url: fileUrl,
              s3Key,
              mimeType: file.type,
              fileSize: file.size,
              thumbnailUrl,
              duration: metadata.duration,
              latitude: metadata.latitude,
              longitude: metadata.longitude,
              takenAt: metadata.takenAt,
            });

      console.log("[UploadFlow] Memory result:", { success: memoryResult.success, error: memoryResult.error });
      if (!memoryResult.success) {
        throw new Error(memoryResult.error ?? "Error al guardar el recuerdo");
      }

      console.log("[UploadFlow] Upload complete!");
      updateFileStatus("success", "Subido");
    } catch (error) {
      console.error("[UploadFlow] Upload error:", error);
      updateFileStatus("error", error instanceof Error ? error.message : "Error");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "photo" | "video") => {
    console.log("[FileChange] File input changed, type:", type);
    const files = e.target.files;
    console.log("[FileChange] Files selected:", files?.length ?? 0);
    if (!files?.length) {
      console.log("[FileChange] No files selected, returning");
      return;
    }

    // Convert FileList to array BEFORE resetting input (resetting clears the FileList)
    const fileArray = Array.from(files);
    console.log("[FileChange] Processing files:", fileArray.map(f => ({ name: f.name, size: f.size, type: f.type })));

    // Reset input after copying files
    e.target.value = "";

    // Add all files to queue
    const newQueueItems = fileArray.map((file) => ({
      type,
      filename: file.name,
      status: "pending" as const,
    }));

    console.log("[FileChange] Adding to queue:", newQueueItems);
    setUploadQueue((prev) => [...prev, ...newQueueItems]);

    // Get the starting index for these files in the queue
    const startIndex = uploadQueue.length;
    console.log("[FileChange] Start index:", startIndex);

    // Process files sequentially to avoid overwhelming the browser
    console.log("[FileChange] Starting transition for upload...");
    startTransition(async () => {
      console.log("[FileChange] Inside transition, processing files...");
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        if (file) {
          console.log("[FileChange] Uploading file", i, "of", fileArray.length, "-", file.name);
          await uploadSingleFile(file, type, startIndex + i);
        }
      }

      // Refresh after all uploads complete
      router.refresh();

      // Clear completed items after a delay
      setTimeout(() => {
        setUploadQueue((prev) => prev.filter((item) => item.status !== "success"));
      }, 2000);
    });
  };

  // Separate memories by type for different display styles
  const mediaMemories = memories.filter((m) => m.type === "photo" || m.type === "video");
  const noteMemories = memories.filter((m) => m.type === "note");
  const quoteMemories = memories.filter((m) => m.type === "quote");
  const songMemories = memories.filter((m) => m.type === "song") as (MemoryWithUser & SongMemory)[];
  const locationMemories = memories.filter((m) => m.type === "location");

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-2 pb-24 pt-4">
      {/* Date Header with Back Button */}
      <div className="mb-4 flex items-center gap-3 px-1">
        <Link
          href="/memoria"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm active:scale-95"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-medium text-gray-800">
            {displayDate ?? date}
          </h1>
        </div>
      </div>

      {/* Day Header */}
      {day && (day.title ?? day.location ?? day.mood) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-1 mb-4 rounded-2xl bg-white p-4 shadow-sm"
        >
          {day.title && (
            <h2 className="text-lg font-medium text-gray-800">{day.title}</h2>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            {day.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                {day.location}
              </span>
            )}
            {day.weather && day.temperature !== null && (
              <span className="flex items-center gap-1">
                <Cloud className="h-3.5 w-3.5 text-gray-400" />
                {day.temperature}°C
              </span>
            )}
            {day.mood && (
              <span className="flex items-center gap-1">
                <span>{MOOD_ICONS[day.mood] ?? "😊"}</span>
                <span className="capitalize">{day.mood}</span>
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Pinterest-style Masonry Grid for Photos & Videos */}
      {mediaMemories.length > 0 && (
        <PinterestGrid
          memories={mediaMemories}
          coverMemoryId={day?.coverMemoryId}
          onSetCover={handleSetCover}
          onDelete={handleDeleteMemory}
          onMediaClick={setFullscreenMedia}
        />
      )}

      {/* Notes - displayed as caption-style text blocks */}
      {noteMemories.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-1 mt-4 space-y-2"
        >
          {noteMemories.map((memory, index) => (
            <motion.div
              key={memory.id.toString()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative w-full rounded-2xl bg-white p-4 text-left shadow-sm"
            >
              <CardMenu
                onDelete={() => handleDeleteMemory(memory.id.toString())}
                variant="light"
              />
              {memory.caption && (
                <p className="mb-1 text-xs font-medium text-gray-400">
                  {memory.caption}
                </p>
              )}
              <p className="text-sm text-gray-700">{memory.content}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {memory.user?.firstName}
                </span>
                {memory.isPrivate && <span className="text-xs">🔒</span>}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Quotes - displayed as styled quote blocks */}
      {quoteMemories.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-4 mt-6 space-y-4"
        >
          {quoteMemories.map((memory, index) => (
            <motion.div
              key={memory.id.toString()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative border-l-2 border-gray-300 pl-4"
            >
              <CardMenu
                onDelete={() => handleDeleteMemory(memory.id.toString())}
                variant="light"
              />
              <p className="text-base italic text-gray-600">
                &ldquo;{memory.content}&rdquo;
              </p>
              {memory.caption && (
                <p className="mt-2 text-sm text-gray-400">— {memory.caption}</p>
              )}
              {memory.isPrivate && (
                <span className="absolute right-0 top-0 text-xs">🔒</span>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Songs - displayed with Spotify card */}
      {songMemories.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-1 mt-4 space-y-3"
        >
          {songMemories.map((memory, index) => (
            <SpotifySongCard
              key={memory.id.toString()}
              songData={memory.songData}
              caption={memory.caption}
              index={index}
              onDelete={() => handleDeleteMemory(memory.id.toString())}
            />
          ))}
        </motion.div>
      )}

      {/* Locations - compact horizontal list */}
      {locationMemories.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-1 mt-4"
        >
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {locationMemories.map((memory, index) => (
              <LocationChip
                key={memory.id.toString()}
                memory={memory}
                index={index}
                onDelete={() => handleDeleteMemory(memory.id.toString())}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {memories.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Camera className="mb-4 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-400">
            No hay recuerdos todavía
          </p>
          <p className="mt-1 text-xs text-gray-300">
            Añade fotos, vídeos o notas abajo
          </p>
        </motion.div>
      )}

      {/* Day Rating */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-1 mt-6 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm"
      >
        <span className="text-xs font-medium text-gray-400">Valoración</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRatingChange(star)}
              disabled={isUpdatingRating}
              className="p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
            >
              <Star
                className={cn(
                  "h-5 w-5 transition-colors",
                  rating && star <= rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-300"
                )}
              />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Upload Queue Progress */}
      {uploadQueue.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-1 mt-4 space-y-2"
        >
          <p className="text-xs font-medium text-gray-500">
            Subiendo {uploadQueue.filter((u) => u.status !== "success").length} archivo(s)...
          </p>
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl bg-white p-3 shadow-sm">
            {uploadQueue.map((item, index) => (
              <div
                key={`${item.filename}-${index}`}
                className="space-y-1"
              >
                <div className="flex items-center gap-2 text-xs">
                  {item.status === "uploading" && (
                    <Loader2 className="h-3 w-3 flex-shrink-0 animate-spin text-gray-400" />
                  )}
                  {item.status === "pending" && (
                    <div className="h-3 w-3 flex-shrink-0 rounded-full bg-gray-300" />
                  )}
                  {item.status === "success" && (
                    <Check className="h-3 w-3 flex-shrink-0 text-green-500" />
                  )}
                  {item.status === "error" && (
                    <div className="h-3 w-3 flex-shrink-0 rounded-full bg-red-500" />
                  )}
                  <span className="flex-1 truncate text-gray-600">{item.filename}</span>
                  {item.status === "uploading" && item.progress !== undefined && (
                    <span className="flex-shrink-0 font-medium text-gray-500">
                      {item.progress}%
                    </span>
                  )}
                  {item.status === "error" && (
                    <span className="flex-shrink-0 text-red-500">{item.message}</span>
                  )}
                </div>
                {/* Progress bar */}
                {item.status === "uploading" && (
                  <div className="relative h-1 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gray-400 transition-all duration-300"
                      style={{ width: `${item.progress ?? 0}%` }}
                    />
                  </div>
                )}
                {/* Status message */}
                {item.message && item.status === "uploading" && (
                  <p className="text-[10px] text-gray-400">{item.message}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Placeholders at Bottom - Bento Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-1 mt-6 grid grid-cols-2 gap-2"
      >
        {/* Row 1: Fotos (small), Vídeos (tall, spans 2 rows) */}
        <label
          className={cn(
            "relative flex aspect-square cursor-pointer items-center justify-center rounded-2xl transition-colors",
            uploadQueue.some((u) => u.type === "photo" && u.status === "uploading")
              ? "bg-slate-300"
              : "bg-slate-200/80 hover:bg-slate-300/80"
          )}
        >
          <span className="absolute left-3 top-3 text-[11px] font-medium text-gray-400">Fotos</span>
          {uploadQueue.some((u) => u.type === "photo" && u.status === "uploading") ? (
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          ) : (
            <Plus className="h-6 w-6 text-slate-400" />
          )}
          <input
            type="file"
            accept="image/*,.heic,.heif"
            className="hidden"
            multiple
            disabled={isPending}
            onChange={(e) => {
              console.log("📸 PHOTO INPUT CHANGED", e.target.files);
              handleFileChange(e, "photo");
            }}
          />
        </label>

        <label
          className={cn(
            "relative row-span-2 flex cursor-pointer items-center justify-center rounded-2xl transition-colors",
            uploadQueue.some((u) => u.type === "video" && u.status === "uploading")
              ? "bg-slate-300"
              : "bg-slate-200/80 hover:bg-slate-300/80"
          )}
        >
          <span className="absolute left-3 top-3 text-[11px] font-medium text-gray-400">Vídeos</span>
          {uploadQueue.some((u) => u.type === "video" && u.status === "uploading") ? (
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          ) : (
            <Plus className="h-6 w-6 text-slate-400" />
          )}
          <input
            type="file"
            accept="video/*"
            className="hidden"
            multiple
            disabled={isPending}
            onChange={(e) => {
              console.log("🎬 VIDEO INPUT CHANGED", e.target.files);
              handleFileChange(e, "video");
            }}
          />
        </label>

        {/* Row 2: Nota */}
        <button
          onClick={() => openAddModal("note")}
          className="relative flex aspect-square items-center justify-center rounded-2xl bg-slate-200/80 transition-colors hover:bg-slate-300/80"
        >
          <span className="absolute left-3 top-3 text-[11px] font-medium text-gray-400">Nota</span>
          <Plus className="h-6 w-6 text-slate-400" />
        </button>

        {/* Row 3: Frase, Canción */}
        <button
          onClick={() => openAddModal("quote")}
          className="relative flex aspect-square items-center justify-center rounded-2xl bg-slate-200/80 transition-colors hover:bg-slate-300/80"
        >
          <span className="absolute left-3 top-3 text-[11px] font-medium text-gray-400">Frase</span>
          <Plus className="h-6 w-6 text-slate-400" />
        </button>

        <button
          onClick={() => openAddModal("song")}
          className="relative flex aspect-square items-center justify-center rounded-2xl bg-slate-200/80 transition-colors hover:bg-slate-300/80"
        >
          <span className="absolute left-3 top-3 text-[11px] font-medium text-gray-400">Canción</span>
          <Plus className="h-6 w-6 text-slate-400" />
        </button>

        {/* Row 4: Lugar (spans full width) */}
        <button
          onClick={() => openAddModal("location")}
          className="relative col-span-2 flex h-16 items-center justify-center rounded-2xl bg-slate-200/80 transition-colors hover:bg-slate-300/80"
        >
          <span className="absolute left-3 top-3 text-[11px] font-medium text-gray-400">Lugar</span>
          <Plus className="h-6 w-6 text-slate-400" />
        </button>
      </motion.div>

      {/* Add Memory Modal */}
      <AddMemoryModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedType(null);
        }}
        date={date}
        initialType={selectedType}
        onSuccess={handleMemoryAdded}
      />

      {/* Fullscreen Media Viewer */}
      <FullscreenMediaViewer
        memory={fullscreenMedia}
        onClose={() => setFullscreenMedia(null)}
      />
    </div>
  );
}

// Pinterest-style Masonry Grid Component
function PinterestGrid({
  memories,
  coverMemoryId,
  onSetCover,
  onDelete,
  onMediaClick,
}: {
  memories: MemoryWithUser[];
  coverMemoryId?: bigint | null;
  onSetCover: (memoryId: string) => void;
  onDelete: (memoryId: string) => void;
  onMediaClick: (memory: MemoryWithUser) => void;
}) {
  // Split memories into two columns for masonry effect
  const leftColumn: MemoryWithUser[] = [];
  const rightColumn: MemoryWithUser[] = [];

  memories.forEach((memory, index) => {
    if (index % 2 === 0) {
      leftColumn.push(memory);
    } else {
      rightColumn.push(memory);
    }
  });

  return (
    <div className="flex gap-2 px-1">
      {/* Left Column */}
      <div className="flex flex-1 flex-col gap-2">
        {leftColumn.map((memory, index) => (
          <PinterestCard
            key={memory.id.toString()}
            memory={memory}
            index={index * 2}
            isCover={coverMemoryId?.toString() === memory.id.toString()}
            onSetCover={() => onSetCover(memory.id.toString())}
            onDelete={() => onDelete(memory.id.toString())}
            onClick={() => onMediaClick(memory)}
          />
        ))}
      </div>
      {/* Right Column */}
      <div className="flex flex-1 flex-col gap-2">
        {rightColumn.map((memory, index) => (
          <PinterestCard
            key={memory.id.toString()}
            memory={memory}
            index={index * 2 + 1}
            isCover={coverMemoryId?.toString() === memory.id.toString()}
            onSetCover={() => onSetCover(memory.id.toString())}
            onDelete={() => onDelete(memory.id.toString())}
            onClick={() => onMediaClick(memory)}
          />
        ))}
      </div>
    </div>
  );
}

// Pinterest-style Card with varying heights (supports photos and videos)
function PinterestCard({
  memory,
  index,
  isCover,
  onSetCover,
  onDelete,
  onClick,
}: {
  memory: MemoryWithUser;
  index: number;
  isCover?: boolean;
  onSetCover: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cast to access media properties
  const mediaMemory = memory as { url: string; thumbnailUrl?: string | null };
  const isVideo = memory.type === "video";

  // Generate random-ish aspect ratio based on memory id for variety
  useEffect(() => {
    // Use memory id to generate a pseudo-random but consistent aspect ratio
    const idNum = parseInt(memory.id.toString().slice(-4), 16) || index;
    const ratios = [0.75, 0.85, 1, 1.15, 1.3, 1.5]; // Various aspect ratios
    const ratio = ratios[idNum % ratios.length] ?? 1;
    setAspectRatio(ratio);
  }, [memory.id, index]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleSetCover = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSetCover();
    setShowMenu(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setShowMenu(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative w-full cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm active:scale-[0.98]"
      style={{ aspectRatio: aspectRatio }}
      onClick={onClick}
    >
      {isVideo ? (
        <video
          src={mediaMemory.url}
          poster={mediaMemory.thumbnailUrl ?? undefined}
          className={cn(
            "h-full w-full object-cover",
            mediaLoaded ? "opacity-100" : "opacity-0"
          )}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onLoadedData={(e) => {
            setMediaLoaded(true);
            const video = e.currentTarget;
            video.play().catch(() => {});
          }}
        />
      ) : (
        <Image
          src={mediaMemory.thumbnailUrl ?? mediaMemory.url}
          alt={memory.caption ?? "Foto"}
          fill
          className={cn(
            "object-cover",
            mediaLoaded ? "opacity-100" : "opacity-0"
          )}
          sizes="(max-width: 640px) 50vw, 200px"
          onLoad={() => setMediaLoaded(true)}
        />
      )}

      {/* Loading placeholder */}
      {!mediaLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}

      {/* Three-dot menu - subtle */}
      <div ref={menuRef} className="absolute right-1 top-1 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-black/25"
        >
          <MoreHorizontal className="h-3 w-3 text-white/80" />
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <div
            className="absolute right-0 top-7 min-w-[140px] overflow-hidden rounded-lg bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleSetCover}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100"
            >
              <ImageIcon className="h-4 w-4" />
              <span>Usar de portada</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              <span>Eliminar</span>
            </button>
          </div>
        )}
      </div>

      {/* Overlay with interaction info (only shown on hover or if there's info) */}
      {(memory.reactionsCount > 0 || memory.commentsCount > 0) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex items-center gap-2">
            {memory.reactionsCount > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-white/90">
                <span className="text-[10px]">✨</span>
                {memory.reactionsCount}
              </span>
            )}
            {memory.commentsCount > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-white/90">
                <MessageCircle className="h-3 w-3" />
                {memory.commentsCount}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Private indicator - moved to left when menu is on right */}
      {memory.isPrivate && (
        <div className="absolute left-2 top-2 rounded-full bg-black/50 p-1">
          <span className="text-xs">🔒</span>
        </div>
      )}
    </motion.div>
  );
}

// Reusable card menu component for delete functionality
function CardMenu({
  onDelete,
  variant = "dark",
}: {
  onDelete: () => void;
  variant?: "dark" | "light";
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setShowMenu(false);
  };

  return (
    <div ref={menuRef} className="absolute right-1 top-1 z-10">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full",
          variant === "dark" ? "bg-black/25" : "bg-gray-300/60"
        )}
      >
        <MoreHorizontal className={cn("h-3 w-3", variant === "dark" ? "text-white/80" : "text-gray-500/80")} />
      </button>

      {showMenu && (
        <div
          className="absolute right-0 top-7 min-w-[120px] overflow-hidden rounded-lg bg-white shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleDelete}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>Eliminar</span>
          </button>
        </div>
      )}
    </div>
  );
}

function MemoryCard({
  memory,
  index,
  onDelete,
}: {
  memory: MemoryWithUser;
  index: number;
  onDelete: () => void;
}) {
  const getMemoryPreview = () => {
    switch (memory.type) {
      case "photo":
        return (
          <Image
            src={memory.thumbnailUrl ?? memory.url}
            alt={memory.caption ?? "Foto"}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 200px"
          />
        );
      case "video":
        return memory.url ? (
          <video
            src={memory.url}
            poster={memory.thumbnailUrl ?? undefined}
            className="h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onLoadedData={(e) => {
              const video = e.currentTarget;
              video.play().catch(() => {});
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-200">
            <Video className="h-6 w-6 text-slate-500" />
          </div>
        );
      case "note":
        return (
          <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 p-3">
            <FileText className="mb-2 h-5 w-5 text-slate-500" />
            <p className="line-clamp-3 text-center text-xs text-gray-600">
              {memory.content}
            </p>
          </div>
        );
      case "song":
        return (
          <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 p-3">
            <Music className="mb-2 h-5 w-5 text-slate-500" />
            <p className="line-clamp-2 text-center text-xs font-medium text-gray-700">
              {memory.songData?.title}
            </p>
            <p className="text-center text-xs text-gray-500">
              {memory.songData?.artist}
            </p>
          </div>
        );
      case "location":
        return memory.locationData?.photoUrl ? (
          // Show actual place photo with name overlay
          <div className="relative h-full w-full">
            <Image
              src={memory.locationData.photoUrl}
              alt={memory.locationData.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 200px"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="line-clamp-2 text-xs font-medium text-white">
                {memory.locationData.name}
              </p>
            </div>
          </div>
        ) : (
          // Fallback: just name when no photo
          <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 p-3">
            <MapPinned className="mb-2 h-5 w-5 text-slate-500" />
            <p className="line-clamp-2 text-center text-xs font-medium text-gray-700">
              {memory.locationData?.name}
            </p>
          </div>
        );
      case "quote":
        return (
          <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 p-3">
            <Quote className="mb-2 h-5 w-5 text-slate-500" />
            <p className="line-clamp-3 text-center text-xs italic text-gray-600">
              &ldquo;{memory.content}&rdquo;
            </p>
          </div>
        );
      default:
        return (
          <div className="flex h-full w-full items-center justify-center bg-slate-100">
            <Camera className="h-6 w-6 text-slate-400" />
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="group relative aspect-square overflow-hidden rounded-xl shadow-sm"
    >
      {getMemoryPreview()}

      {/* Three-dot menu */}
      <CardMenu onDelete={onDelete} variant="dark" />

      {/* Overlay with interaction info - hide for locations (they have their own overlay) */}
      {memory.type !== "location" && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {memory.reactionsCount > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-white/90">
                  <span className="text-[10px]">✨</span>
                  {memory.reactionsCount}
                </span>
              )}
              {memory.commentsCount > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-white/90">
                  <MessageCircle className="h-3 w-3" />
                  {memory.commentsCount}
                </span>
              )}
            </div>
            {memory.user && (
              <span className="text-xs text-white/70">
                {memory.user.firstName}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Private indicator */}
      {memory.isPrivate && (
        <div className="absolute left-1 top-1 rounded-full bg-black/50 p-1">
          <span className="text-xs">🔒</span>
        </div>
      )}
    </motion.div>
  );
}

// Compact location chip component
function LocationChip({
  memory,
  index,
  onDelete,
}: {
  memory: MemoryWithUser;
  index: number;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cast to access locationData (this component only receives location memories)
  const locationData = (memory as { locationData?: { name: string; photoUrl?: string; lat?: number; lng?: number; googlePlaceId?: string } }).locationData;

  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  // Open location in Google Maps
  const handleOpenMaps = () => {
    if (!locationData) return;

    let url: string;
    if (locationData.googlePlaceId) {
      // Use place_id for more accurate location
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationData.name)}&query_place_id=${locationData.googlePlaceId}`;
    } else if (locationData.lat && locationData.lng) {
      // Fallback to coordinates
      url = `https://www.google.com/maps/search/?api=1&query=${locationData.lat},${locationData.lng}`;
    } else {
      // Fallback to name search
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationData.name)}`;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      onClick={handleOpenMaps}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpenMaps();
        }
      }}
      className="group relative flex shrink-0 cursor-pointer items-center gap-3 rounded-2xl bg-white py-2.5 pl-2.5 pr-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
    >
      {/* Photo or icon */}
      {locationData?.photoUrl ? (
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
          <Image
            src={locationData.photoUrl}
            alt={locationData.name}
            fill
            className="object-cover"
            sizes="44px"
          />
        </div>
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <MapPinned className="h-5 w-5 text-slate-400" />
        </div>
      )}

      {/* Location name */}
      <span className="max-w-[180px] truncate text-sm font-medium text-gray-700">
        {locationData?.name}
      </span>

      {/* Delete menu on long press / right click */}
      <div ref={menuRef} className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="ml-1 flex h-5 w-5 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
        >
          <MoreHorizontal className="h-4 w-4 text-gray-400" />
        </button>

        {showMenu && (
          <div
            className="absolute right-0 top-7 z-20 min-w-[110px] overflow-hidden rounded-lg bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              <span>Eliminar</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Fullscreen Media Viewer Component
function FullscreenMediaViewer({
  memory,
  onClose,
}: {
  memory: MemoryWithUser | null;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Close on escape key
  useEffect(() => {
    if (!memory) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    // Prevent body scroll when fullscreen is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [memory, onClose]);

  if (!memory) return null;

  const mediaMemory = memory as { url: string; thumbnailUrl?: string | null };
  const isVideo = memory.type === "video";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {/* Media content */}
      <div
        className="relative flex h-full w-full items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            ref={videoRef}
            src={mediaMemory.url}
            className="max-h-full max-w-full rounded-lg"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <Image
            src={mediaMemory.url}
            alt={memory.caption ?? "Foto"}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        )}
      </div>

      {/* Caption */}
      {memory.caption && (
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="mx-auto max-w-lg rounded-lg bg-black/50 px-4 py-2 text-sm text-white/90">
            {memory.caption}
          </p>
        </div>
      )}
    </motion.div>
  );
}
