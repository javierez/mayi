"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  FileText,
  Download,
  Calendar,
  MoreVertical,
  FolderIcon,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { DocumentsPageSkeleton } from "./skeletons";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { deleteDocumentAction } from "~/app/actions/upload";
import { toast } from "sonner";

interface Document {
  docId: bigint;
  filename: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: Date;
  documentKey: string;
}

interface DocumentsPageProps {
  listing: {
    listingId: bigint;
    propertyId: bigint;
    referenceNumber?: string | null;
    street?: string | null;
    city?: string | null;
  };
  folderType: "documentacion-inicial" | "visitas" | "otros" | "planos";
}

export function DocumentsPage({ listing, folderType }: DocumentsPageProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Map folder types for API calls
  const folderTypeMap = {
    "documentacion-inicial": "initial-docs",
    visitas: "visitas",
    otros: "others",
    planos: "planos",
  } as const;

  const apiFolderType = folderTypeMap[folderType];

  // Fetch documents on component mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/properties/${listing.listingId}/documents?folderType=${apiFolderType}`,
        );
        if (response.ok) {
          const docs = (await response.json()) as Document[];
          setDocuments(docs);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDocuments();
  }, [listing.listingId, apiFolderType]);

  const handleDownload = (document: Document) => {
    // Open the document URL in a new tab for download
    window.open(document.fileUrl, "_blank");
  };

  const handleDeleteClick = (document: Document) => {
    setDocumentToDelete(document);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteDocumentAction(
        documentToDelete.docId,
        documentToDelete.documentKey,
        listing.propertyId,
      );

      if (result.success) {
        // Remove document from local state
        setDocuments((prev) =>
          prev.filter((doc) => doc.docId !== documentToDelete.docId),
        );
        toast.success("Documento eliminado correctamente");
      } else {
        toast.error(result.error ?? "Error al eliminar el documento");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Error al eliminar el documento");
    } finally {
      setIsDeleting(false);
      setDocumentToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getFileTypeDisplay = (mimeType: string) => {
    const typeMap: Record<string, string> = {
      "application/pdf": "PDF",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "DOCX",
      "application/msword": "DOC",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "XLSX",
      "application/vnd.ms-excel": "XLS",
      "image/jpeg": "JPEG",
      "image/jpg": "JPG",
      "image/png": "PNG",
      "text/plain": "TXT",
      "application/zip": "ZIP",
    };

    return (
      typeMap[mimeType.toLowerCase()] ??
      mimeType.split("/").pop()?.toUpperCase() ??
      "FILE"
    );
  };

  const getFileIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("pdf")) {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else if (
      lowerType.includes("excel") ||
      lowerType.includes("xlsx") ||
      lowerType.includes("sheet")
    ) {
      return <FileText className="h-8 w-8 text-green-500" />;
    } else if (lowerType.includes("word") || lowerType.includes("doc")) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    } else {
      return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      {/* Documents list - clean, no titles */}
      <div className="space-y-3">
        {isLoading ? (
          <DocumentsPageSkeleton />
        ) : (
          <>
            {documents.map((document) => (
              <Card
                key={document.docId.toString()}
                className="transition-shadow hover:shadow-sm"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getFileIcon(document.fileType)}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {document.filename}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{getFileTypeDisplay(document.fileType)}</span>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(document.uploadedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDownload(document)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Descargar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteClick(document)}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {documents.length === 0 && !isLoading && (
              <div className="py-12 text-center">
                <FolderIcon className="mx-auto mb-4 h-12 w-12 fill-current text-gray-400" />
                <p className="text-gray-500">
                  No hay documentos en esta carpeta
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  Usa el botón de &quot;Subir Documentos&quot; para agregar
                  archivos
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Eliminar documento"
        description={`¿Estás seguro de que quieres eliminar "${documentToDelete?.filename}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteConfirm}
        confirmText={isDeleting ? "Eliminando..." : "Eliminar"}
        cancelText="Cancelar"
        confirmVariant="destructive"
      />
    </div>
  );
}
