"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  MapPin,
  Cloud,
  Plus,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  MapPinned,
  Quote,
  MessageCircle,
  Camera,
  Upload,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { cn } from "~/lib/utils";
import type { Day, MemoryWithUser } from "~/types/memoria";
import { AddMemoryModal } from "./AddMemoryModal";
import {
  getMemoriaPhotoPresignedUrl,
  getMemoriaVideoPresignedUrl,
  createPhotoMemoryAfterUpload,
  createVideoMemoryAfterUpload,
} from "~/server/actions/memoria/memories";

interface DayDetailProps {
  date: string;
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

export function DayDetail({ date, day, initialMemories }: DayDetailProps) {
  const router = useRouter();
  const [memories, setMemories] = useState(initialMemories);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState<{
    type: "photo" | "video";
    filename: string;
    status: "uploading" | "success" | "error";
    message?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleMemoryClick = (memoryId: string) => {
    router.push(`/memoria/recuerdo/${memoryId}`);
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

  const handleFileSelect = (type: "photo" | "video") => {
    if (type === "photo") {
      fileInputRef.current?.click();
    } else {
      videoInputRef.current?.click();
    }
  };

  const uploadFileToS3 = async (file: File, presignedUrl: string): Promise<void> => {
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "photo" | "video") => {
    const files = e.target.files;
    if (!files?.length) return;

    const file = files[0];
    if (!file) return;

    // Reset input first
    e.target.value = "";

    setUploadProgress({
      type,
      filename: file.name,
      status: "uploading",
    });

    startTransition(async () => {
      try {
        // Get presigned URL
        const presignedResult = type === "photo"
          ? await getMemoriaPhotoPresignedUrl(date, file.name, file.type)
          : await getMemoriaVideoPresignedUrl(date, file.name, file.type);

        if (!presignedResult.success || !presignedResult.data) {
          throw new Error(presignedResult.error ?? "Error al obtener URL de subida");
        }

        const { uploadUrl, s3Key, fileUrl } = presignedResult.data;

        // Upload to S3
        await uploadFileToS3(file, uploadUrl);

        // Create memory record
        const memoryResult = type === "photo"
          ? await createPhotoMemoryAfterUpload({
              date,
              url: fileUrl,
              s3Key,
              mimeType: file.type,
              fileSize: file.size,
            })
          : await createVideoMemoryAfterUpload({
              date,
              url: fileUrl,
              s3Key,
              mimeType: file.type,
              fileSize: file.size,
            });

        if (!memoryResult.success) {
          throw new Error(memoryResult.error ?? "Error al guardar el recuerdo");
        }

        setUploadProgress({
          type,
          filename: file.name,
          status: "success",
          message: "Subido correctamente",
        });

        // Refresh data after short delay
        setTimeout(() => {
          router.refresh();
          setUploadProgress(null);
        }, 1500);
      } catch (error) {
        console.error("Upload error:", error);
        setUploadProgress({
          type,
          filename: file.name,
          status: "error",
          message: error instanceof Error ? error.message : "Error al subir el archivo",
        });

        // Clear error after delay
        setTimeout(() => setUploadProgress(null), 3000);
      }
    });
  };

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-lg space-y-4">
        {/* Day Header */}
        {day && (day.title ?? day.location ?? day.mood) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-white p-4 shadow-sm"
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

        {/* Content Placeholders - Always visible for quick adding */}
        <div className="space-y-3">
          {/* Photo/Video Upload Area */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-xl border-2 border-dashed p-4 transition-colors",
              uploadProgress?.status === "uploading"
                ? "border-slate-400 bg-slate-100"
                : uploadProgress?.status === "success"
                  ? "border-green-300 bg-green-50"
                  : uploadProgress?.status === "error"
                    ? "border-red-300 bg-red-50"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            {uploadProgress ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                  {uploadProgress.status === "uploading" && (
                    <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                  )}
                  {uploadProgress.status === "success" && (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                  {uploadProgress.status === "error" && (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {uploadProgress.filename}
                  </p>
                  <p className={cn(
                    "text-xs",
                    uploadProgress.status === "uploading" && "text-slate-500",
                    uploadProgress.status === "success" && "text-green-600",
                    uploadProgress.status === "error" && "text-red-600",
                  )}>
                    {uploadProgress.status === "uploading" && "Subiendo..."}
                    {uploadProgress.status === "success" && uploadProgress.message}
                    {uploadProgress.status === "error" && uploadProgress.message}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                    <Camera className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Fotos y Videos</p>
                    <p className="text-xs text-gray-400">Haz clic para subir</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFileSelect("photo")}
                    disabled={isPending}
                    className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-all hover:shadow disabled:opacity-50"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    Foto
                  </button>
                  <button
                    onClick={() => handleFileSelect("video")}
                    disabled={isPending}
                    className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-all hover:shadow disabled:opacity-50"
                  >
                    <Video className="h-3.5 w-3.5" />
                    Video
                  </button>
                </div>
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, "photo")}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, "video")}
            />
          </motion.div>

          {/* Quick Add Cards */}
          <div className="grid grid-cols-2 gap-3">
            <QuickAddCard
              icon={FileText}
              label="Nota"
              description="Escribe un pensamiento"
              onClick={() => openAddModal("note")}
            />
            <QuickAddCard
              icon={Quote}
              label="Frase"
              description="Algo memorable"
              onClick={() => openAddModal("quote")}
            />
            <QuickAddCard
              icon={Music}
              label="Canción"
              description="Nuestra música"
              onClick={() => openAddModal("song")}
            />
            <QuickAddCard
              icon={MapPinned}
              label="Lugar"
              description="Un sitio especial"
              onClick={() => openAddModal("location")}
            />
          </div>
        </div>

        {/* Existing Memories */}
        {memories.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Recuerdos del día
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {memories.map((memory, index) => (
                <MemoryCard
                  key={memory.id.toString()}
                  memory={memory}
                  index={index}
                  onClick={() => handleMemoryClick(memory.id.toString())}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

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
    </div>
  );
}

function QuickAddCard({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-start gap-3 rounded-xl bg-white p-3 text-left shadow-sm transition-all hover:shadow"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 transition-colors group-hover:bg-slate-200">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400 truncate">{description}</p>
      </div>
      <Plus className="h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-500" />
    </button>
  );
}

function MemoryCard({
  memory,
  index,
  onClick,
}: {
  memory: MemoryWithUser;
  index: number;
  onClick: () => void;
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
        return memory.thumbnailUrl ? (
          <>
            <Image
              src={memory.thumbnailUrl}
              alt={memory.caption ?? "Video"}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 200px"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50">
                <Video className="h-5 w-5 text-white" />
              </div>
            </div>
          </>
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
        return (
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
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="group relative aspect-square overflow-hidden rounded-xl shadow-sm transition-all hover:shadow-md"
    >
      {getMemoryPreview()}

      {/* Overlay with interaction info */}
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

      {/* Private indicator */}
      {memory.isPrivate && (
        <div className="absolute right-1 top-1 rounded-full bg-black/50 p-1">
          <span className="text-xs">🔒</span>
        </div>
      )}
    </motion.button>
  );
}

