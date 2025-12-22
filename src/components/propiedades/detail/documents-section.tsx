"use client";

import { useState, useCallback, useEffect } from "react";
import { DocumentsPage } from "./documents-page";
import { Button } from "~/components/ui/button";
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

interface DocumentsSectionProps {
  listing: {
    listingId: bigint;
    propertyId: bigint;
    referenceNumber?: string | null;
    street?: string | null;
    city?: string | null;
  };
  folderType:
    | "documentacion-inicial"
    | "documentacion-legal"
    | "certificados"
    | "impuestos-pagos"
    | "contratos"
    | "hipoteca"
    | "visitas"
    | "planos"
    | "otros";
}

export function DocumentsSection({
  listing,
  folderType,
}: DocumentsSectionProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDocumentsUploaded = useCallback((_newDocuments: Document[]) => {
    // Trigger a refresh of the documents list
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Map folder types for API calls
  const folderTypeMap = {
    "documentacion-inicial": "initial-docs",
    "documentacion-legal": "legal-docs",
    certificados: "certificados",
    "impuestos-pagos": "impuestos-pagos",
    contratos: "contratos",
    hipoteca: "hipoteca",
    visitas: "visitas",
    planos: "planos",
    otros: "others",
  } as const;

  const handleFileUpload = () => {
    if (!isUploading) {
      document.getElementById("documents-file-input")?.click();
    }
  };

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (!files || files.length === 0) return;

      setIsUploading(true);

      try {
        const apiFolderType = folderTypeMap[folderType];

        // Upload all files
        const uploadPromises = Array.from(files).map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folderType", apiFolderType);

          const response = await fetch(
            `/api/properties/${listing.listingId}/documents`,
            {
              method: "POST",
              body: formData,
            },
          );

          if (!response.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          return response.json() as Promise<Document>;
        });

        const uploadedDocuments = await Promise.all(uploadPromises);
        handleDocumentsUploaded(uploadedDocuments);
        toast.success(
          `${uploadedDocuments.length} documento(s) subido(s) correctamente`,
        );
      } catch (error) {
        console.error("Error uploading files:", error);
        toast.error("Error al subir los archivos");
      } finally {
        setIsUploading(false);
      }
    },
    [folderType, listing.listingId, handleDocumentsUploaded],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      void handleFiles(files);
    }
  };

  // Full-screen drag-and-drop detection
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.types.includes("Files")) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDragOver(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDragOver(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        void handleFiles(files);
      }
    };

    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, [handleFiles]);

  return (
    <>
      {/* Full-screen drop overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm">
          <div className="rounded-2xl border-4 border-dashed border-blue-400 bg-white/90 px-16 py-12 text-center shadow-2xl">
            <Upload className="mx-auto mb-4 h-16 w-16 text-blue-500" />
            <p className="text-xl font-semibold text-blue-700">
              Suelta los archivos aquí
            </p>
            <p className="mt-2 text-sm text-blue-500">
              para subirlos a esta carpeta
            </p>
          </div>
        </div>
      )}

      <div className="rounded-lg">
        <DocumentsPage
          listing={listing}
          folderType={folderType}
          key={refreshKey} // Force re-render when documents are uploaded
        />
      </div>

      {/* Button right below documents - always visible */}
      <div className="sticky bottom-0 z-10 flex justify-end py-4">
        <Button
          onClick={handleFileUpload}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Subir Documentos
            </>
          )}
        </Button>

        {/* Hidden file input */}
        <input
          type="file"
          multiple
          className="hidden"
          id="documents-file-input"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>
    </>
  );
}
