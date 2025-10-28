"use client";

import React, { useState, useCallback } from "react";
import { FileText, X, Check, ExternalLink } from "lucide-react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { FloatingLabelInput } from "~/components/ui/floating-label-input";
import { ModernSaveIndicator } from "~/components/propiedades/form/common/modern-save-indicator";
import { cn } from "~/lib/utils";
import { updateProperty } from "~/server/queries/properties";
import { uploadDocument, deleteDocument } from "~/app/actions/upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

type SaveState = "idle" | "modified" | "saving" | "saved" | "error";

interface EnergyCertificatePageProps {
  energyRating?: string | null;
  uploadedFile?: string | null;
  uploadedDocument?: {
    docId: bigint;
    documentKey: string;
    fileUrl: string;
  } | null;
  className?: string;
  propertyId?: bigint;
  userId?: string;
  listingId?: bigint;
  referenceNumber?: string;
  // New props for database fields
  energyCertificateStatus?: string | null;
  energyConsumptionScale?: string | null;
  energyConsumptionValue?: number | null;
  emissionsScale?: string | null;
  emissionsValue?: number | null;
}

export function EnergyCertificatePage({
  uploadedFile,
  uploadedDocument,
  className = "",
  propertyId,
  userId,
  referenceNumber,
  energyCertificateStatus,
  energyConsumptionScale,
  energyConsumptionValue,
  emissionsScale,
  emissionsValue,
}: EnergyCertificatePageProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [uploadedDocumentUrl, setUploadedDocumentUrl] = useState<string | null>(
    uploadedFile ?? uploadedDocument?.fileUrl ?? null,
  );
  const [currentDocument, setCurrentDocument] = useState(uploadedDocument);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // New state for energy certificate fields
  const [certificateStatus, setCertificateStatus] = useState(
    energyCertificateStatus ??
      (uploadedDocumentUrl ? "uploaded" : "en_tramite"),
  );
  const [consumptionScale, setConsumptionScale] = useState(
    energyConsumptionScale,
  );
  const [consumptionValue, setConsumptionValue] = useState(
    energyConsumptionValue?.toString() ?? "",
  );
  const [emissionScale, setEmissionScale] = useState(emissionsScale);
  const [emissionValue, setEmissionValue] = useState(
    emissionsValue?.toString() ?? "",
  );
  const [pendingConsumptionScale, setPendingConsumptionScale] = useState<
    string | null
  >(null);
  const [pendingEmissionScale, setPendingEmissionScale] = useState<
    string | null
  >(null);
  const hasUploadedCertificate = !!uploadedDocumentUrl;

  const getEnergyRatingColor = (
    rating: string | null | undefined,
    isActive = false,
  ) => {
    if (!rating) return "bg-gray-300";

    const baseColors = {
      A: isActive ? "bg-green-500" : "bg-green-500/25",
      B: isActive ? "bg-green-400" : "bg-green-400/25",
      C: isActive ? "bg-yellow-400" : "bg-yellow-400/25",
      D: isActive ? "bg-yellow-500" : "bg-yellow-500/25",
      E: isActive ? "bg-orange-400" : "bg-orange-400/25",
      F: isActive ? "bg-orange-500" : "bg-orange-500/25",
      G: isActive ? "bg-red-500" : "bg-red-500/25",
    };

    return (
      baseColors[rating.toUpperCase() as keyof typeof baseColors] ||
      "bg-gray-300"
    );
  };

  const getArrowWidth = (rating: string) => {
    const widths = {
      A: "w-32",
      B: "w-36",
      C: "w-40",
      D: "w-44",
      E: "w-48",
      F: "w-52",
      G: "w-56",
    };
    return widths[rating as keyof typeof widths] || "w-40";
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const pdfFile = files.find((file) => file.type === "application/pdf");

      if (pdfFile && userId && referenceNumber) {
        setIsUploading(true);
        setUploadProgress(0);

        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 200);

        try {
          const uploadedDocument = await uploadDocument(
            pdfFile,
            userId,
            referenceNumber,
            1,
            "energy_certificate",
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            propertyId,
          );

          clearInterval(progressInterval);
          setUploadProgress(100);
          setUploadedDocumentUrl(uploadedDocument.fileUrl);
          setCurrentDocument({
            docId: uploadedDocument.docId,
            documentKey: uploadedDocument.documentKey,
            fileUrl: uploadedDocument.fileUrl,
          });
          setCertificateStatus("uploaded");
          setSaveState("modified");

          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
          }, 500);
        } catch (error) {
          clearInterval(progressInterval);
          console.error("Error uploading energy certificate:", error);
          setIsUploading(false);
          setUploadProgress(0);
        }
      }
    },
    [userId, referenceNumber, propertyId],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (
        file &&
        file.type === "application/pdf" &&
        userId &&
        referenceNumber
      ) {
        setIsUploading(true);
        setUploadProgress(0);

        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 200);

        try {
          const uploadedDocument = await uploadDocument(
            file,
            userId,
            referenceNumber,
            1,
            "energy_certificate",
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            propertyId,
          );

          clearInterval(progressInterval);
          setUploadProgress(100);
          setUploadedDocumentUrl(uploadedDocument.fileUrl);
          setCurrentDocument({
            docId: uploadedDocument.docId,
            documentKey: uploadedDocument.documentKey,
            fileUrl: uploadedDocument.fileUrl,
          });
          setCertificateStatus("uploaded");
          setSaveState("modified");

          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
          }, 500);
        } catch (error) {
          clearInterval(progressInterval);
          console.error("Error uploading energy certificate:", error);
          setIsUploading(false);
          setUploadProgress(0);
        }
      }
    },
    [userId, referenceNumber, propertyId],
  );

  const handleConsumptionScaleClick = (rating: string) => {
    if (rating !== consumptionScale) {
      setPendingConsumptionScale(rating);
      setSaveState("modified");
    }
  };

  const handleEmissionScaleClick = (rating: string) => {
    if (rating !== emissionScale) {
      setPendingEmissionScale(rating);
      setSaveState("modified");
    }
  };

  const handleConsumptionValueChange = (value: string) => {
    setConsumptionValue(value);
    setSaveState("modified");
  };

  const handleEmissionValueChange = (value: string) => {
    setEmissionValue(value);
    setSaveState("modified");
  };

  const handleStatusChange = (status: string) => {
    setCertificateStatus(status);
    setSaveState("modified");
  };

  const handleSave = async () => {
    if (!propertyId) return;
    setSaveState("saving");
    try {
      const updateData: Record<string, unknown> = {
        energyCertificateStatus: certificateStatus,
      };
      if (pendingConsumptionScale) {
        updateData.energyConsumptionScale = pendingConsumptionScale;
      }
      if (pendingEmissionScale) {
        updateData.emissionsScale = pendingEmissionScale;
      }
      if (consumptionValue) {
        updateData.energyConsumptionValue = parseFloat(consumptionValue);
      }
      if (emissionValue) {
        updateData.emissionsValue = parseFloat(emissionValue);
      }
      await updateProperty(Number(propertyId), updateData);
      if (pendingConsumptionScale) {
        setConsumptionScale(pendingConsumptionScale);
        setPendingConsumptionScale(null);
      }
      if (pendingEmissionScale) {
        setEmissionScale(pendingEmissionScale);
        setPendingEmissionScale(null);
      }
      setSaveState("saved");
      setTimeout(() => {
        setSaveState("idle");
      }, 2000);
    } catch (error) {
      console.error("Error saving energy certificate data:", error);
      setSaveState("error");
      setTimeout(() => {
        setSaveState("modified");
      }, 3000);
    }
  };

  const getCardStyles = () => {
    switch (saveState) {
      case "modified":
        return "ring-2 ring-yellow-500/20 shadow-lg shadow-yellow-500/10 border-yellow-500/20";
      case "saving":
        return "ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/10 border-amber-500/20";
      case "saved":
        return "ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10 border-emerald-500/20";
      case "error":
        return "ring-2 ring-red-500/20 shadow-lg shadow-red-500/10 border-red-500/20";
      default:
        return "";
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card
        className={cn(
          "relative border-0 bg-transparent p-6 shadow-none transition-all duration-500 ease-out",
          getCardStyles(),
          className,
        )}
      >
        <ModernSaveIndicator state={saveState} onSave={handleSave} />

        {/* Top Row: File Upload/Preview - Centered */}
        <div className="mb-8 flex justify-center">
          <div className="w-full max-w-md">
            <div
              className={`transition-colors ${
                hasUploadedCertificate
                  ? "border-0"
                  : `rounded-lg border-2 border-dashed ${
                      isDragOver
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`
              } flex min-h-[300px] items-center justify-center`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {isUploading ? (
                <div className="flex h-full w-full flex-col items-center justify-center px-4">
                  <div className="w-full space-y-2">
                    <div className="h-0.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full bg-gray-400 transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Subiendo certificado...
                  </p>
                </div>
              ) : hasUploadedCertificate ? (
                <div className="group relative h-[420px] min-h-[420px] w-full overflow-hidden rounded-lg">
                  <iframe
                    src={uploadedDocumentUrl}
                    className="h-full w-full border-0"
                    title="Energy Certificate Preview"
                    onError={() => console.log("Iframe load error")}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-black/5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <div className="pointer-events-auto absolute bottom-3 right-3 flex gap-2">
                      <button
                        onClick={() =>
                          window.open(uploadedDocumentUrl, "_blank")
                        }
                        className="rounded-full bg-white/80 p-2.5 text-gray-700 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-white"
                        title="Abrir en nueva pestaña"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteDialog(true)}
                        className="rounded-full bg-white/80 p-2.5 text-red-600 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-red-50"
                        title="Eliminar certificado"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="pointer-events-auto absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-lg backdrop-blur-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        Certificado subido
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="group flex h-full w-full flex-1 cursor-pointer flex-col items-center justify-center">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="energy-certificate-upload"
                  />
                  <FileText className="mb-3 h-8 w-8 text-gray-400 transition-colors duration-200 group-hover:text-gray-500" />
                  <span className="mb-2 text-center text-sm font-medium text-gray-400 transition-colors duration-200 group-hover:text-gray-500">
                    Subir certificado PDF
                  </span>
                  <p className="px-4 text-center text-xs text-gray-400">
                    Arrastra el archivo aquí o haz clic para seleccionar
                  </p>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Status Buttons - Show only if no certificate uploaded */}
        {!hasUploadedCertificate && (
          <div className="mb-8 flex justify-center gap-4">
            <Button
              variant={
                certificateStatus === "en_tramite" ? "default" : "outline"
              }
              onClick={() => handleStatusChange("en_tramite")}
            >
              En trámite
            </Button>
            <Button
              variant={certificateStatus === "exento" ? "default" : "outline"}
              onClick={() => handleStatusChange("exento")}
            >
              Exento
            </Button>
          </div>
        )}

        {/* Energy Scales and Values - Show only if certificate uploaded */}
        {hasUploadedCertificate && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Energy Consumption */}
            <div className="space-y-4">
              <h4 className="text-md text-center font-semibold">
                Eficiencia de Consumo
              </h4>
              <div className="rounded-lg bg-white p-4">
                <div className="space-y-1">
                  {["A", "B", "C", "D", "E", "F", "G"].map((rating) => {
                    const displayRating =
                      pendingConsumptionScale ?? consumptionScale;
                    const isCurrentRating =
                      displayRating?.toUpperCase() === rating;
                    const isActive = displayRating ? isCurrentRating : false;
                    const backgroundColor = getEnergyRatingColor(
                      rating,
                      isActive,
                    );
                    const arrowWidth = getArrowWidth(rating);

                    return (
                      <div key={rating} className="relative flex">
                        <button
                          onClick={() => handleConsumptionScaleClick(rating)}
                          className={`flex h-8 items-center justify-start px-3 text-sm font-bold text-white ${backgroundColor} ${isCurrentRating ? "ring-2 ring-blue-500 ring-offset-2" : ""} ${rating === "A" ? "rounded-tl-lg" : ""} ${rating === "G" ? "rounded-bl-lg" : ""} ${arrowWidth} cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md`}
                          style={{
                            clipPath:
                              "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)",
                          }}
                        >
                          <span className="text-white">{rating}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <FloatingLabelInput
                id="consumptionValue"
                value={consumptionValue}
                onChange={handleConsumptionValueChange}
                placeholder="Valor (kWh/m² año)"
                type="number"
                required
              />
            </div>

            {/* Energy Emissions */}
            <div className="space-y-4">
              <h4 className="text-md text-center font-semibold">
                Eficiencia de Emisiones
              </h4>
              <div className="rounded-lg bg-white p-4">
                <div className="space-y-1">
                  {["A", "B", "C", "D", "E", "F", "G"].map((rating) => {
                    const displayRating = pendingEmissionScale ?? emissionScale;
                    const isCurrentRating =
                      displayRating?.toUpperCase() === rating;
                    const isActive = displayRating ? isCurrentRating : false;
                    const backgroundColor = getEnergyRatingColor(
                      rating,
                      isActive,
                    );
                    const arrowWidth = getArrowWidth(rating);

                    return (
                      <div key={rating} className="relative flex">
                        <button
                          onClick={() => handleEmissionScaleClick(rating)}
                          className={`flex h-8 items-center justify-start px-3 text-sm font-bold text-white ${backgroundColor} ${isCurrentRating ? "ring-2 ring-blue-500 ring-offset-2" : ""} ${rating === "A" ? "rounded-tl-lg" : ""} ${rating === "G" ? "rounded-bl-lg" : ""} ${arrowWidth} cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md`}
                          style={{
                            clipPath:
                              "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)",
                          }}
                        >
                          <span className="text-white">{rating}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <FloatingLabelInput
                id="emissionValue"
                value={emissionValue}
                onChange={handleEmissionValueChange}
                placeholder="Valor (kg CO₂/m² año)"
                type="number"
                required
              />
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar certificado energético?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. El certificado energético se
                eliminará permanentemente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!currentDocument) {
                    setUploadedDocumentUrl(null);
                    setShowDeleteDialog(false);
                    return;
                  }

                  setIsDeleting(true);
                  try {
                    await deleteDocument(
                      currentDocument.documentKey,
                      currentDocument.docId,
                    );
                    setUploadedDocumentUrl(null);
                    setCurrentDocument(null);
                    setCertificateStatus("en_tramite");
                    setSaveState("modified");
                    setShowDeleteDialog(false);
                  } catch (error) {
                    console.error("Error deleting document:", error);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
}
