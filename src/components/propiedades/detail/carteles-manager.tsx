"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { FileText, Upload, Trash2, Eye, Plus, X } from "lucide-react";
import { cn } from "~/lib/utils";
import { toast } from "sonner";
import { uploadCartelAction, deleteDocumentAction } from "~/app/actions/upload";

// Dynamically import PdfPreview to avoid SSR issues with react-pdf
const PdfPreview = dynamic(
  () => import("./cartel/pdf-preview").then((mod) => ({ default: mod.PdfPreview })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600"></div>
      </div>
    ),
  }
);

interface Cartel {
  docId: bigint;
  filename: string;
  fileUrl: string;
  documentKey: string;
  uploadedAt: Date;
}

interface CartelesManagerProps {
  propertyId: bigint;
  listingId: bigint;
  referenceNumber: string;
  className?: string;
  carteles?: Cartel[];
  loading?: boolean;
  onRefreshCarteles?: () => void;
  hasImages?: boolean;
}

export function CartelesManager({
  propertyId,
  listingId,
  referenceNumber,
  className = "",
  carteles = [],
  loading = false,
  onRefreshCarteles,
  hasImages = true,
}: CartelesManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [cartelToDelete, setCartelToDelete] = useState<Cartel | null>(null);

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      // Validate file type
      if (file.type !== "application/pdf") {
        toast.error(`${file.name} no es un archivo PDF válido`);
        return null;
      }

      try {
        // Use server action (10MB limit instead of 4.5MB API route limit)
        const result = await uploadCartelAction(
          file,
          listingId,
          propertyId,
          referenceNumber,
        );

        toast.success(`${file.name} subido correctamente`);
        return {
          docId: result.docId,
          filename: result.filename,
          fileUrl: result.fileUrl,
          documentKey: result.documentKey,
          uploadedAt: result.uploadedAt,
        } satisfies Cartel;
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        toast.error(`Error al subir ${file.name}`);
        return null;
      }
    });

    try {
      await Promise.all(uploadPromises);
      onRefreshCarteles?.(); // Refresh the list
    } catch (error) {
      console.error("Error during upload:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (cartel: Cartel) => {
    setCartelToDelete(cartel);
  };

  const handleDeleteConfirm = async () => {
    if (!cartelToDelete) return;

    try {
      // Use server action for delete
      const result = await deleteDocumentAction(
        cartelToDelete.docId,
        cartelToDelete.documentKey,
        propertyId,
      );

      if (!result.success) {
        throw new Error(result.error ?? "Failed to delete cartel");
      }

      toast.success(`${cartelToDelete.filename} eliminado correctamente`);
      onRefreshCarteles?.(); // Refresh the list
    } catch (error) {
      console.error("Error deleting cartel:", error);
      toast.error("Error al eliminar el cartel");
    } finally {
      setCartelToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setCartelToDelete(null);
  };

  const handleDownload = (cartel: Cartel) => {
    window.open(cartel.fileUrl, "_blank");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files) {
      void handleFileUpload(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      void handleFileUpload(files);
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array<undefined>(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="h-16 w-16 rounded bg-gray-200"></div>
                  <div className="h-4 w-24 rounded bg-gray-200"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 w-16 rounded bg-gray-200"></div>
                    <div className="h-8 w-16 rounded bg-gray-200"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h3 className="text-xl font-semibold text-gray-900">Carteles</h3>
      </div>

      {/* Carteles Grid */}
      {carteles.length === 0 ? (
        <div className="py-2 text-center">
          <div className="mx-auto mb-1 flex h-24 w-24 items-center justify-center rounded-full bg-gray-50">
            <FileText className="h-10 w-10 text-gray-300" />
          </div>
          <h3 className="mb-1 text-lg font-medium text-gray-900">
            No hay carteles
          </h3>
          <p className="mx-auto max-w-sm text-sm text-gray-500">
            Sube archivos PDF para comenzar a gestionar los carteles de esta
            propiedad
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {carteles.map((cartel) => (
            <Card
              key={cartel.docId.toString()}
              className="group relative overflow-hidden border-0 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <CardContent className="p-0">
                {/* PDF Preview Area - Flexible height to accommodate both portrait and landscape */}
                <div className="relative h-80 overflow-hidden rounded-t-lg border-b bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="absolute inset-0 p-4">
                    {/* PDF Preview using react-pdf - No scrollbars! */}
                    <div className="relative h-full w-full transition-all duration-300 group-hover:opacity-30">
                      <PdfPreview fileUrl={cartel.fileUrl} className="h-full w-full" scale={1.0} />
                    </div>
                    {/* Subtle overlay for better visual integration */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/20 transition-all duration-300 group-hover:to-white/10" />
                  </div>

                  {/* Action buttons overlay */}
                  <div className="absolute right-3 top-3 flex translate-y-2 transform space-x-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDownload(cartel)}
                      className="h-8 w-8 border-0 bg-white/90 p-0 shadow-sm backdrop-blur-sm hover:bg-white"
                    >
                      <Eye className="h-3.5 w-3.5 text-gray-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDeleteClick(cartel)}
                      className="h-8 w-8 border-0 bg-white/90 p-0 shadow-sm backdrop-blur-sm hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-gray-600 hover:text-red-600" />
                    </Button>
                  </div>
                </div>

                {/* File Info */}
                <div className="space-y-2 p-4">
                  <div className="min-h-[2.5rem]">
                    <h4
                      className="line-clamp-2 text-sm font-medium leading-tight text-gray-900"
                      title={cartel.filename}
                    >
                      {cartel.filename.replace(".pdf", "")}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {new Date(cartel.uploadedAt).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center space-x-1">
                      <FileText className="h-3 w-3" />
                      <span>PDF</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() =>
            hasImages && (window.location.href = `/propiedades/${listingId}/cartel-editor`)
          }
          disabled={!hasImages}
          className={cn(
            "group relative overflow-hidden rounded-lg px-6 py-2.5 font-medium shadow-lg transition-all duration-300",
            hasImages
              ? "bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:scale-105 hover:from-amber-500 hover:to-rose-500 hover:shadow-xl active:scale-95"
              : "cursor-not-allowed bg-gradient-to-r from-gray-300 to-gray-400 text-gray-100 opacity-50"
          )}
          title={!hasImages ? "Sube imágenes primero para crear un cartel" : undefined}
        >
          Editor de Carteles
          {hasImages && (
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          )}
        </button>
        <Button
          variant="outline"
          onClick={() => setShowUpload(!showUpload)}
          className={cn(
            "border-gray-300 px-6 py-2.5 font-medium transition-all duration-300 hover:border-gray-400",
            showUpload && "border-gray-400 bg-gray-50",
          )}
        >
          {showUpload ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Subir Carteles
            </>
          )}
        </Button>
      </div>

      {/* Upload Area - Collapsible */}
      {showUpload && (
        <div
          className={cn(
            "animate-in fade-in-0 slide-in-from-top-2 relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300",
            dragOver
              ? "scale-[1.02] border-blue-400 bg-blue-50 shadow-md"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
            uploading && "pointer-events-none opacity-50",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="cartel-upload"
            className="absolute inset-0 cursor-pointer opacity-0"
            multiple
            accept="application/pdf"
            onChange={handleFileInputChange}
            disabled={uploading}
          />
          <div className="flex flex-col items-center space-y-4">
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full transition-colors duration-300",
                dragOver ? "bg-blue-100" : "bg-gray-100",
              )}
            >
              <Upload
                className={cn(
                  "h-8 w-8 transition-colors duration-300",
                  dragOver
                    ? "text-blue-500"
                    : uploading
                      ? "animate-pulse text-gray-400"
                      : "text-gray-500",
                )}
              />
            </div>
            <div className="space-y-1">
              <p className="text-base font-medium text-gray-900">
                {uploading
                  ? "Subiendo carteles..."
                  : dragOver
                    ? "Suelta los archivos aquí"
                    : "Subir carteles PDF"}
              </p>
              <p className="text-sm text-gray-500">
                {uploading
                  ? "Por favor espera..."
                  : "Arrastra archivos o haz clic para seleccionar"}
              </p>
              <p className="text-xs text-gray-400">
                Solo archivos PDF • Múltiples archivos permitidos
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={!!cartelToDelete} onOpenChange={handleDeleteCancel}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar{" "}
              <strong>{cartelToDelete?.filename}</strong>? Esta acción no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
