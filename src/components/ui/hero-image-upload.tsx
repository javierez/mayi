"use client";

import { useState, useCallback } from "react";
import { Upload, Image as ImageIcon, Video } from "lucide-react";
import { cn } from "~/lib/utils";

interface HeroMediaUploadProps {
  onUpload: (file: File, type: "image" | "video") => Promise<void>;
  isUploading?: boolean;
  className?: string;
  acceptVideo?: boolean;
}

export function HeroImageUpload({
  onUpload,
  isUploading = false,
  className,
  acceptVideo = true,
}: HeroMediaUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): "image" | "video" | null => {
      if (file.type.startsWith("image/")) {
        return "image";
      }
      if (acceptVideo && file.type.startsWith("video/")) {
        return "video";
      }
      return null;
    },
    [acceptVideo],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      setError(null);

      if (e.dataTransfer.files?.[0]) {
        const file = e.dataTransfer.files[0];
        const fileType = validateFile(file);
        if (!fileType) {
          setError(
            acceptVideo
              ? "Por favor selecciona un archivo de imagen o video válido"
              : "Por favor selecciona un archivo de imagen válido",
          );
          return;
        }
        await onUpload(file, fileType);
      }
    },
    [onUpload, acceptVideo, validateFile],
  );

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      setError(null);

      if (e.target.files?.[0]) {
        const file = e.target.files[0];
        const fileType = validateFile(file);
        if (!fileType) {
          setError(
            acceptVideo
              ? "Por favor selecciona un archivo de imagen o video válido"
              : "Por favor selecciona un archivo de imagen válido",
          );
          return;
        }
        await onUpload(file, fileType);
      }
    },
    [onUpload, acceptVideo, validateFile],
  );

  const acceptTypes = acceptVideo ? "image/*,video/*" : "image/*";

  return (
    <div className={cn("w-full", className)}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400",
          isUploading && "pointer-events-none opacity-50",
        )}
      >
        <input
          type="file"
          accept={acceptTypes}
          onChange={handleChange}
          disabled={isUploading}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        />

        <div className="flex flex-col items-center justify-center text-center">
          {isUploading ? (
            <>
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-primary" />
              <p className="text-sm font-medium text-gray-700">
                Subiendo archivo...
              </p>
            </>
          ) : (
            <>
              <div className="mb-4 flex gap-2">
                <div className="rounded-full bg-gray-100 p-3">
                  {isDragActive ? (
                    <Upload className="h-6 w-6 text-primary" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                {acceptVideo && (
                  <div className="rounded-full bg-gray-100 p-3">
                    <Video className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
              <p className="mb-2 text-sm font-medium text-gray-700">
                {isDragActive
                  ? acceptVideo
                    ? "Suelta la imagen o video aquí"
                    : "Suelta la imagen aquí"
                  : acceptVideo
                    ? "Arrastra una imagen o video, o haz clic para seleccionar"
                    : "Arrastra una imagen o haz clic para seleccionar"}
              </p>
              <p className="text-xs text-gray-500">
                {acceptVideo
                  ? "JPG, PNG, WebP o MP4 (máximo 50MB para videos)"
                  : "JPG, PNG o WebP (máximo 10MB)"}
              </p>
            </>
          )}
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// For backwards compatibility
export { HeroImageUpload as HeroMediaUpload };
