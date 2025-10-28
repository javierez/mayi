"use client";

import { useState } from "react";
import { cn } from "~/lib/utils";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Document {
  docId: bigint;
  filename: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: Date;
  documentKey: string;
}

interface DocumentUploadCardProps {
  listingId: bigint;
  folderType: "documentacion-inicial" | "visitas" | "otros" | "planos";
  onDocumentsUploaded: (documents: Document[]) => void;
  className?: string;
}

export function DocumentUploadCard({
  listingId,
  folderType,
  onDocumentsUploaded,
  className,
}: DocumentUploadCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map folder types for API calls
  const folderTypeMap = {
    "documentacion-inicial": "initial-docs",
    visitas: "visitas",
    otros: "others",
    planos: "planos",
  } as const;

  const apiFolderType = folderTypeMap[folderType];

  const handleFiles = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      // Upload all files
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folderType", apiFolderType);

        const response = await fetch(`/api/properties/${listingId}/documents`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        return response.json() as Promise<Document>;
      });

      const uploadedDocuments = await Promise.all(uploadPromises);
      onDocumentsUploaded(uploadedDocuments);
      toast.success(
        `${uploadedDocuments.length} documento(s) subido(s) correctamente`,
      );
    } catch (error) {
      console.error("Error uploading files:", error);
      setError("Error al subir los archivos. Por favor, inténtalo de nuevo.");
      toast.error("Error al subir los archivos");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      void handleFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files) {
      void handleFiles(files);
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      document.getElementById("file-upload")?.click();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "flex h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 p-6 transition-all duration-200 hover:bg-gray-100/50",
          isDragOver && "border-blue-400 bg-blue-50/50",
          isUploading && "cursor-not-allowed border-gray-400 bg-gray-100/50",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {/* Upload icon and text */}
        <div className="text-center">
          <Upload
            className={cn(
              "mx-auto mb-3 transition-all duration-200",
              isUploading
                ? "h-8 w-8 animate-pulse text-gray-500"
                : isDragOver
                  ? "h-10 w-10 text-blue-500"
                  : "h-8 w-8 text-gray-400",
            )}
          />

          {isUploading ? (
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Subiendo...</span>
            </div>
          ) : (
            <>
              <p className="mb-1 text-sm text-gray-600">
                {isDragOver
                  ? "Suelta los archivos aquí"
                  : "Arrastra archivos aquí"}
              </p>
              <p className="text-xs text-gray-500">
                o haz clic para seleccionar
              </p>
            </>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="mt-3 max-w-xs text-center text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          multiple
          className="hidden"
          id="file-upload"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
      </div>
    </div>
  );
}
