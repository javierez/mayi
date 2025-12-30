"use client";

import { useState, useCallback, useEffect } from "react";
import { DocumentsPage } from "./documents-page";
import { Button } from "~/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadPropertyDocumentPresigned } from "~/lib/presigned-upload";

interface Document {
  docId: bigint;
  filename: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: Date;
  documentKey: string;
}

type FolderType =
  | "documentacion-inicial"
  | "documentacion-legal"
  | "certificados"
  | "impuestos-pagos"
  | "contratos"
  | "hipoteca"
  | "visitas"
  | "planos"
  | "otros";

interface DocumentsSectionProps {
  listing: {
    listingId: bigint;
    propertyId: bigint;
    referenceNumber?: string | null;
    street?: string | null;
    city?: string | null;
  };
  folderType: FolderType;
}

// Static folder type mapping - defined outside component to avoid recreating
const FOLDER_TYPE_MAP: Record<FolderType, string> = {
  "documentacion-inicial": "initial-docs",
  "documentacion-legal": "legal-docs",
  certificados: "certificados",
  "impuestos-pagos": "impuestos-pagos",
  contratos: "contratos",
  hipoteca: "hipoteca",
  visitas: "visitas",
  planos: "planos",
  otros: "others",
};

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
        const apiFolderType = FOLDER_TYPE_MAP[folderType];

        // Upload all files using presigned URLs (bypasses Vercel's 4.5MB limit)
        const uploadPromises = Array.from(files).map(async (file) => {
          console.log("[DocumentsSection] Uploading file:", file.name, "Size:", (file.size / 1024 / 1024).toFixed(2), "MB");
          const result = await uploadPropertyDocumentPresigned(
            file,
            listing.listingId,
            listing.propertyId,
            listing.referenceNumber ?? `TEMP_${listing.listingId}`,
            apiFolderType,
          );

          // Return document with bigint values for internal state
          return {
            docId: result.docId,
            filename: result.filename,
            fileType: result.fileType,
            fileUrl: result.fileUrl,
            uploadedAt: result.uploadedAt,
            documentKey: result.documentKey,
          } satisfies Document;
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
    [folderType, listing, handleDocumentsUploaded],
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-[2px]">
          <div className="rounded-lg border border-dashed border-gray-300 bg-white/80 px-12 py-8 text-center">
            <Upload className="mx-auto mb-3 h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-500">Soltar archivos</p>
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
