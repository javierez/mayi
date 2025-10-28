"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "~/lib/utils";
import { Upload, Check, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

// Document stored in database after upload
interface UploadedDocument {
  docId: string;
  filename: string;
  fileType: string;
  fileUrl: string;
  documentKey: string;
  propertyId?: string;
  listingId?: string;
  referenceNumber?: string;
}

interface FileUploadProps {
  onFileUpload?: (files: File[]) => Promise<void>;
  className?: string;
  listingId?: string;
}

export function FileUpload({
  onFileUpload,
  className,
  listingId,
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<
    UploadedDocument[]
  >([]);
  const [createdPropertyId, setCreatedPropertyId] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProcessButton, setShowProcessButton] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [overallUploadProgress, setOverallUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileUpload = useCallback(
    async (files: File[]) => {
      // Phase 1: Upload to existing property (original behavior)
      const uploadFilesToExistingProperty = async (files: UploadedFile[]) => {
        for (const uploadedFile of files) {
          try {
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.id === uploadedFile.id
                  ? { ...f, status: "uploading", progress: 50 }
                  : f,
              ),
            );

            const formData = new FormData();
            formData.append("file", uploadedFile.file);
            formData.append("listingId", listingId!.toString());

            const response = await fetch("/api/documents/upload", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              throw new Error(`Upload failed: ${response.statusText}`);
            }

            const result = (await response.json()) as { url: string };

            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.id === uploadedFile.id
                  ? { ...f, status: "success", progress: 100, url: result.url }
                  : f,
              ),
            );
          } catch (error) {
            console.error("Upload error:", error);
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.id === uploadedFile.id
                  ? { ...f, status: "error", progress: 0 }
                  : f,
              ),
            );
          }
        }
      };

      // Add files to state
      const newFiles: UploadedFile[] = files.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        file,
        progress: 0,
        status: "pending",
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);
      setIsUploading(true);
      setOverallUploadProgress(0);

      try {
        // If we have a listingId, upload directly to existing property
        if (listingId) {
          await uploadFilesToExistingProperty(newFiles);
        } else {
          // Phase 1: Create property and upload to final location
          await uploadFilesWithPropertyCreation(newFiles);
          // Call the provided callback if any
          await onFileUpload?.(files);
        }
      } finally {
        setIsUploading(false);
        setOverallUploadProgress(0);
      }
    },
    [listingId, onFileUpload],
  );

  // Phase 1: Create property and upload files (ficha de encargo)
  const uploadFilesWithPropertyCreation = async (files: UploadedFile[]) => {
    try {
      for (let i = 0; i < files.length; i++) {
        const uploadedFile = files[i];
        if (!uploadedFile) continue;
        try {
          // Update overall progress
          setOverallUploadProgress(((i + 0.1) / files.length) * 100);

          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id
                ? { ...f, status: "uploading", progress: 30 }
                : f,
            ),
          );

          const formData = new FormData();
          formData.append("file", uploadedFile.file);

          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id ? { ...f, progress: 60 } : f,
            ),
          );

          const response = await fetch("/api/documents/ficha-encargo", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorData = (await response.json()) as { error?: string };
            throw new Error(errorData.error ?? "Upload failed");
          }

          const result = (await response.json()) as {
            document: {
              docId: string;
              filename: string;
              fileType: string;
              fileUrl: string;
              documentKey: string;
              propertyId?: string;
              listingId?: string;
            };
            propertyId: string;
            listingId: string;
            referenceNumber: string;
          };

          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id
                ? { ...f, status: "success", progress: 100 }
                : f,
            ),
          );

          // Store property info from first upload
          if (i === 0) {
            setCreatedPropertyId(result.propertyId);
          }

          // Add to uploaded documents list
          setUploadedDocuments((prev) => [
            ...prev,
            {
              docId: result.document.docId,
              filename: result.document.filename,
              fileType: result.document.fileType,
              fileUrl: result.document.fileUrl,
              documentKey: result.document.documentKey,
              propertyId: result.propertyId,
            },
          ]);

          // Update overall progress
          setOverallUploadProgress(((i + 1) / files.length) * 100);

          toast.success(`${uploadedFile.file.name} subido correctamente`);
        } catch (error) {
          console.error("Upload error:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Error al subir el archivo";
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id
                ? {
                    ...f,
                    status: "error",
                    progress: 0,
                    error: errorMessage,
                  }
                : f,
            ),
          );
          toast.error(
            `Error al subir ${uploadedFile.file.name}: ${errorMessage}`,
          );
        }
      }

      // Show process button after successful uploads (check uploadedFiles state)
      setTimeout(() => {
        setUploadedFiles((currentFiles) => {
          const hasSuccessfulUploads = currentFiles.some(
            (f) => f.status === "success",
          );
          if (hasSuccessfulUploads) {
            setShowProcessButton(true);
          }
          return currentFiles;
        });
      }, 100);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Error al subir los documentos");
    }
  };

  // Phase 2: Process documents with OCR
  const processDocuments = async () => {
    try {
      setIsProcessing(true);

      const response = await fetch("/api/documents/ficha-encargo/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId: createdPropertyId,
          documentIds: uploadedDocuments.map((doc) => doc.docId),
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Processing failed");
      }

      await response.json();

      toast.success(
        `¡OCR iniciado correctamente! Los datos se guardarán automáticamente cuando estén listos.`,
      );

      // Navigate to properties list
      router.push("/propiedades");
    } catch (error) {
      console.error("Processing error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al procesar los documentos";

      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter((file) => {
        const validTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/jpeg",
          "image/png",
        ];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type)) {
          toast.error(`${file.name}: Tipo de archivo no soportado`);
          return false;
        }

        if (file.size > maxSize) {
          toast.error(`${file.name}: Archivo demasiado grande (máx. 10MB)`);
          return false;
        }

        return true;
      });

      if (validFiles.length > 0) {
        void handleFileUpload(validFiles);
      }
    },
    [handleFileUpload],
  );

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      void handleFileUpload(files);
    }
    // Reset input value to allow re-selecting the same file
    e.target.value = "";
  };

  return (
    <div
      className={cn(
        "rounded-2xl bg-gradient-to-br from-amber-50/50 to-rose-50/50 p-8 shadow-lg",
        className,
      )}
    >
      <div className="grid gap-8 lg:grid-cols-3">
        <FileUploadDescription />
        <div className="space-y-4 lg:col-span-2">
          <FileUploadArea
            onFileSelect={handleFileSelect}
            isDragOver={isDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            uploadedFiles={uploadedFiles}
            isUploading={isUploading}
            uploadProgress={overallUploadProgress}
          />

          {/* Process Button - positioned under the FileUploadArea in right column */}
          {!listingId && showProcessButton && (
            <div className="flex justify-end">
              <button
                onClick={processDocuments}
                disabled={isProcessing}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-6 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-amber-500 hover:to-rose-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                {isProcessing
                  ? "Procesando..."
                  : "Procesar Documentos y Crear Propiedad"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}

function FileUploadDescription() {
  const features = [
    "Sistema Inteligente",
    "Extracción automática",
    "Múltiples formatos",
    "Procesamiento rápido",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-2xl font-bold text-gray-900">
          Ficha de Encargo
        </h3>
        <p className="leading-relaxed text-gray-600">
          Si tienes la ficha de encargo, cargala y deja que la IA extraiga la
          información automáticamente.
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">
          Características principales
        </h4>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface FileUploadAreaProps {
  onFileSelect: () => void;
  isDragOver: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  uploadedFiles: UploadedFile[];
  isUploading: boolean;
  uploadProgress: number;
}

function FileUploadArea({
  onFileSelect,
  isDragOver,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  uploadedFiles,
  isUploading,
  uploadProgress,
}: FileUploadAreaProps) {
  // Determine current state
  const isEmpty = uploadedFiles.length === 0 && !isUploading;
  const hasFiles = uploadedFiles.length > 0 && !isUploading;
  return (
    <div className="lg:col-span-2">
      <div
        className={cn(
          "h-80 rounded-xl bg-white shadow-sm transition-all", // Fixed height to match empty state
          hasFiles
            ? "border border-gray-200"
            : "cursor-pointer border-2 border-dashed",
          isDragOver && isEmpty
            ? "scale-105 border-amber-400 bg-amber-50"
            : isEmpty
              ? "border-gray-300 hover:border-amber-300"
              : "border-gray-200",
        )}
        onDragEnter={isEmpty ? onDragEnter : undefined}
        onDragLeave={isEmpty ? onDragLeave : undefined}
        onDragOver={isEmpty ? onDragOver : undefined}
        onDrop={isEmpty ? onDrop : undefined}
        onClick={isEmpty ? onFileSelect : undefined}
      >
        {/* State 1: Empty - Initial Upload Area */}
        {isEmpty && (
          <div className="p-8">
            <div className="flex flex-col items-center justify-center">
              <Upload
                className={cn(
                  "mb-4 h-16 w-16 transition-colors",
                  isDragOver ? "text-amber-500" : "text-gray-400",
                )}
              />
              <p className="mb-2 text-lg font-medium text-gray-700">
                {isDragOver
                  ? "Suelta los archivos aquí"
                  : "Arrastra tus documentos aquí"}
              </p>
              <p className="mb-6 text-sm text-gray-500">
                o haz clic para seleccionar archivos
              </p>
              <button
                className="rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-6 py-3 font-medium text-white shadow-lg transition-all hover:scale-105 hover:from-amber-500 hover:to-rose-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileSelect();
                }}
              >
                Seleccionar Archivos
              </button>
            </div>
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Formatos aceptados: PDF, DOC, DOCX, JPG, PNG
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Tamaño máximo: 10MB por archivo
              </p>
            </div>
          </div>
        )}

        {/* State 2: Uploading - Loading State */}
        {isUploading && (
          <div className="p-8">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="mb-4 h-16 w-16 animate-spin text-amber-500" />
              <p className="mb-2 text-lg font-medium text-gray-700">
                Subiendo documentos...
              </p>
              <p className="mb-6 text-sm text-gray-500">
                Por favor espera mientras se procesan tus archivos
              </p>

              {/* Progress Bar */}
              <div className="w-full max-w-md">
                <div className="mb-2 flex justify-between text-sm text-gray-600">
                  <span>Progreso</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-200">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* State 3: Files Uploaded - Full Preview */}
        {hasFiles && (
          <div className="h-full p-8">
            <EnhancedFilePreviewGrid files={uploadedFiles} />
          </div>
        )}
      </div>
    </div>
  );
}

interface FilePreviewGridProps {
  files: UploadedFile[];
}

function EnhancedFilePreviewGrid({ files }: FilePreviewGridProps) {
  const successfulFiles = files.filter((f) => f.status === "success");

  const renderFilePreview = (file: UploadedFile) => {
    const fileType = file.file.type;

    if (fileType.startsWith("image/")) {
      // For images, fit to horizontal width and allow vertical scrolling
      const previewUrl = URL.createObjectURL(file.file);
      return (
        <div className="relative h-full w-full overflow-y-auto overflow-x-hidden rounded-xl border-2 border-amber-200 bg-white shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={file.file.name}
            className="h-auto w-full object-cover"
          />
          {/* Success indicator overlay - fixed position */}
          <div className="absolute right-4 top-4 z-10">
            <div className="rounded-full bg-green-500 p-2 shadow-lg">
              <Check className="h-4 w-4 text-white" />
            </div>
          </div>
          {/* File name overlay - fixed at bottom */}
          <div className="absolute bottom-0 left-0 right-4 z-10 bg-gradient-to-t from-black/60 to-transparent p-3">
            <p className="truncate text-sm font-medium text-white">
              {file.file.name}
            </p>
            <div className="mt-1 flex items-center text-xs text-green-300">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              <span>Subido</span>
            </div>
          </div>
        </div>
      );
    } else {
      // For documents (PDF, Word, etc.), show large document preview
      const getDocumentIcon = () => {
        if (fileType === "application/pdf") {
          return <FileText className="h-24 w-24 text-red-600" />;
        } else if (fileType.includes("word") || fileType.includes("document")) {
          return <FileText className="h-24 w-24 text-blue-600" />;
        } else {
          return <FileText className="h-24 w-24 text-gray-600" />;
        }
      };

      const getBackgroundGradient = () => {
        if (fileType === "application/pdf") {
          return "from-red-100 to-rose-100";
        } else if (fileType.includes("word") || fileType.includes("document")) {
          return "from-blue-100 to-indigo-100";
        } else {
          return "from-gray-100 to-slate-100";
        }
      };

      return (
        <div
          className={`relative flex h-full w-full flex-col items-center justify-center rounded-xl bg-gradient-to-br ${getBackgroundGradient()} overflow-hidden border-2 border-amber-200 p-6 shadow-lg`}
        >
          {getDocumentIcon()}

          {/* Success indicator overlay */}
          <div className="absolute right-4 top-4">
            <div className="rounded-full bg-green-500 p-2 shadow-lg">
              <Check className="h-4 w-4 text-white" />
            </div>
          </div>

          {/* File info */}
          <div className="mt-3 text-center">
            <p className="max-w-full truncate text-sm font-semibold text-gray-900">
              {file.file.name}
            </p>
            <div className="mt-1 flex items-center justify-center text-xs text-green-600">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              <span>Subido</span>
            </div>
          </div>
        </div>
      );
    }
  };

  if (successfulFiles.length === 0) {
    return null;
  }

  return (
    <div className="h-full w-full">
      {successfulFiles.length === 1 ? (
        // Single file - use full available space with scroll
        <div className="h-full w-full">
          {renderFilePreview(successfulFiles[0]!)}
        </div>
      ) : (
        // Multiple files - grid layout with individual scroll areas
        <div
          className={`grid h-full gap-2 ${
            successfulFiles.length === 2
              ? "grid-cols-2"
              : successfulFiles.length === 3
                ? "grid-cols-3"
                : "grid-cols-2"
          }`}
        >
          {successfulFiles.map((file) => (
            <div key={file.id} className="h-full min-h-0 w-full">
              {renderFilePreview(file)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
