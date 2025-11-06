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
  ChevronDown,
  ChevronRight,
  Upload,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { DocumentsPageSkeleton } from "~/components/propiedades/detail/skeletons";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { deleteDocumentAction } from "~/app/actions/upload";
import { toast } from "sonner";
import { generatePropertyTitle } from "~/lib/property-title";

interface Document {
  docId: string;
  filename: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: Date | string;
  documentKey: string;
  listingId: string | null;
  propertyId: string | null;
  // Listing info for grouping
  listingTitle: string | null;
  listingStreet: string | null;
  listingPropertyType: string | null;
  listingCity: string | null;
  listingReferenceNumber: string | null;
}

interface ContactDocumentsPageProps {
  contactId: bigint;
  folderType:
    | "documentacion-inicial"
    | "visitas"
    | "otros"
    | "planos"
    | "certificado-energetico"
    | "escrituras"
    | "carteles"
    | "documentos-personales";
  initialDocuments?: Document[]; // Optional initial documents from server
}

export function ContactDocumentsPage({
  contactId,
  folderType,
  initialDocuments,
}: ContactDocumentsPageProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments ?? []);
  const [isLoading, setIsLoading] = useState(!initialDocuments);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Track which listing groups are expanded (default: all closed)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Map folder types for API calls
  const folderTypeMap = {
    "documentacion-inicial": "initial-docs",
    visitas: "visitas",
    otros: "others",
    planos: "planos",
    "certificado-energetico": "certificado-energetico",
    escrituras: "escrituras",
    carteles: "carteles",
    "documentos-personales": "documentos-personales",
  } as const;

  const apiFolderType = folderTypeMap[folderType];
  const isPersonalDocuments = folderType === "documentos-personales";

  // Handler functions
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
        BigInt(documentToDelete.docId),
        documentToDelete.documentKey,
        documentToDelete.propertyId ? BigInt(documentToDelete.propertyId) : undefined,
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

  // Helper functions
  const formatDate = (date: Date | string) => {
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

  // Fetch documents on component mount (only if not provided as initial data)
  useEffect(() => {
    if (initialDocuments) {
      // Documents already provided from server, skip fetching
      return;
    }

    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/contacts/${contactId.toString()}/documents?folderType=${apiFolderType}`,
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
  }, [contactId, apiFolderType, initialDocuments]);

  // Upload handler for personal documents
  const handleFileUpload = () => {
    if (!isUploading) {
      document.getElementById("contact-documents-file-input")?.click();
    }
  };

  const handleFiles = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      // Upload all files
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folderType", "documentos-personales");

        const response = await fetch(
          `/api/contacts/${contactId.toString()}/documents`,
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
      
      // Add new documents to the list
      setDocuments((prev) => [...uploadedDocuments, ...prev]);
      toast.success(
        `${uploadedDocuments.length} documento(s) subido(s) correctamente`,
      );
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Error al subir los archivos");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      void handleFiles(files);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  // For personal documents, don't group by listing - show all documents directly
  if (isPersonalDocuments) {
    return (
      <div className="relative">
        <div className="space-y-3 pb-20">
          {isLoading ? (
            <DocumentsPageSkeleton />
          ) : (
            <>
              {documents.map((document) => (
                <Card
                  key={document.docId}
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
                    No hay documentos personales
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    Los documentos personales se mostrarán aquí cuando se suban
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sticky button at bottom - always visible */}
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
            id="contact-documents-file-input"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>

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

  // Group documents by listingId
  const groupedDocuments = documents.reduce(
    (acc, doc) => {
      const listingId = doc.listingId ?? "general";
      acc[listingId] ??= {
        listingId: doc.listingId,
        listingTitle: doc.listingTitle,
        listingStreet: doc.listingStreet,
          listingPropertyType: doc.listingPropertyType,
          listingCity: doc.listingCity,
          listingReferenceNumber: doc.listingReferenceNumber,
          documents: [],
        };
      acc[listingId].documents.push(doc);
      return acc;
    },
    {} as Record<
      string,
      {
        listingId: string | null;
        listingTitle: string | null;
        listingStreet: string | null;
        listingPropertyType: string | null;
        listingCity: string | null;
        listingReferenceNumber: string | null;
        documents: Document[];
      }
    >,
  );

  // Sort groups: "general" first, then by listing title
  const sortedGroups = Object.entries(groupedDocuments).sort((a, b) => {
    if (a[0] === "general") return -1;
    if (b[0] === "general") return 1;
    const titleA = a[1].listingTitle ?? "";
    const titleB = b[1].listingTitle ?? "";
    return titleA.localeCompare(titleB);
  });

  return (
    <div className="relative">
      {/* Documents list grouped by listing */}
      <div className="space-y-2">
        {isLoading ? (
          <DocumentsPageSkeleton />
        ) : (
          <>
            {sortedGroups.length === 0 ? (
              <div className="py-12 text-center">
                <FolderIcon className="mx-auto mb-4 h-12 w-12 fill-current text-gray-400" />
                <p className="text-gray-500">
                  No hay documentos en esta carpeta
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  Los documentos se mostrarán aquí cuando se suban a las
                  propiedades de este contacto
                </p>
              </div>
            ) : (
              sortedGroups.map(([groupId, group]) => {
                // Generate listing title
                const listingTitle =
                  groupId === "general"
                    ? "General"
                    : group.listingTitle ??
                      generatePropertyTitle(
                        group.listingPropertyType ?? "",
                        group.listingStreet ?? "",
                        group.listingCity ?? undefined,
                      );

                const isExpanded = expandedGroups.has(groupId);
                const documentCount = group.documents.length;

                const toggleGroup = (open: boolean) => {
                  setExpandedGroups((prev) => {
                    const next = new Set(prev);
                    if (open) {
                      next.add(groupId);
                    } else {
                      next.delete(groupId);
                    }
                    return next;
                  });
                };

                return (
                  <Collapsible
                    key={groupId}
                    open={isExpanded}
                    onOpenChange={toggleGroup}
                  >
                    <Card className="border shadow-none">
                      <CollapsibleTrigger className="w-full">
                        <CardContent className="flex items-start sm:items-center justify-between gap-2 py-2 px-2.5 md:px-3 hover:bg-muted/50 transition-colors min-w-0">
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <div className="flex-shrink-0 mt-0.5">
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <div className="text-left min-w-0 flex-1">
                              <h4 className="text-sm font-medium text-gray-900 break-words">
                                {listingTitle}
                              </h4>
                              {group.listingReferenceNumber && (
                                <p className="text-xs text-muted-foreground whitespace-normal break-words mt-0.5 font-mono">
                                  Ref: {group.listingReferenceNumber}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                            <div className="flex items-center gap-1 font-mono">
                              <div className="text-[10px] font-medium tabular-nums text-gray-400">
                                {documentCount}
                              </div>
                              <div className="text-[10px] text-gray-400 hidden sm:block">
                                {documentCount === 1 ? "doc" : "docs"}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <CardContent className="space-y-3 border-t bg-muted/10 p-2.5 md:p-3">
                          {group.documents.map((document) => (
                            <Card
                              key={document.docId}
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
                                        <span>
                                          {getFileTypeDisplay(document.fileType)}
                                        </span>
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
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })
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

