"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Share2,
  Save,
  Loader2,
  FolderIcon,
  ArrowLeft,
  Check,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  File,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { Switch } from "~/components/ui/switch";
import type { InboxAttachment, ThreadContext } from "./inbox-types";
import { DNIValidationModal, type DNIAnalysisData } from "./dni-validation-modal";

interface AttachmentActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: InboxAttachment | null;
  messageId: string;
  threadContext?: ThreadContext;
  onDownload: (attachment: InboxAttachment) => void;
}

type ModalStep = "actions" | "folder-select" | "type-select" | "saving";

interface DocumentFolder {
  id: string;
  name: string;
  description: string;
  folderType: string;
}

interface DocumentType {
  id: string;
  name: string;
  description: string;
}

interface FolderSuggestionResult {
  suggestedFolder: string;
  suggestedFolderName: string;
  suggestedFolderType: string;
  suggestedDocumentTag: string;
  confidence: number;
}

interface TypeSuggestionResult {
  suggestedDocumentTag: string;
  suggestedDocumentTagName: string;
  confidence: number;
}

const DOCUMENT_FOLDERS: DocumentFolder[] = [
  {
    id: "documentacion-inicial",
    name: "Inicial",
    description: "DNI/NIE, hoja de encargo, valoración",
    folderType: "initial-docs",
  },
  {
    id: "documentacion-legal",
    name: "Documentación Legal",
    description: "Escritura, Nota Simple, Catastro",
    folderType: "legal-docs",
  },
  {
    id: "certificados",
    name: "Certificados",
    description: "CEE, Cédula habitabilidad, ITE",
    folderType: "certificados",
  },
  {
    id: "impuestos-pagos",
    name: "Impuestos y Pagos",
    description: "IBI, ITP, Plusvalía Municipal",
    folderType: "impuestos-pagos",
  },
  {
    id: "contratos",
    name: "Contratos",
    description: "Arras, Escritura de compraventa",
    folderType: "contratos",
  },
  {
    id: "hipoteca",
    name: "Hipoteca",
    description: "Deuda pendiente, cancelación registral",
    folderType: "hipoteca",
  },
  {
    id: "planos",
    name: "Planos",
    description: "Planos de la propiedad",
    folderType: "planos",
  },
  {
    id: "visitas",
    name: "Visitas",
    description: "Reportes de visitas",
    folderType: "visitas",
  },
  {
    id: "otros",
    name: "Otros",
    description: "Otros documentos",
    folderType: "others",
  },
];

// Document types available for each folder
const DOCUMENT_TYPES_BY_FOLDER: Record<string, DocumentType[]> = {
  "documentacion-inicial": [
    { id: "documentacion-inicial", name: "DNI/NIE", description: "Documentos de identificación, valoración" },
    { id: "hoja-encargo", name: "Hoja de Encargo", description: "Contrato de encargo firmado" },
  ],
  "documentacion-legal": [
    { id: "documentacion-legal", name: "Documentación Legal", description: "Nota simple, escritura" },
  ],
  certificados: [
    { id: "certificados", name: "Certificado General", description: "Certificados varios" },
    { id: "energy_certificate", name: "Certificado Energético (CEE)", description: "Certificado de eficiencia" },
    { id: "cedula-habitabilidad", name: "Cédula de Habitabilidad", description: "Licencia de ocupación" },
    { id: "ite", name: "ITE", description: "Inspección técnica del edificio" },
  ],
  "impuestos-pagos": [
    { id: "impuestos-pagos", name: "Impuesto General", description: "Impuestos varios" },
    { id: "ibi", name: "IBI", description: "Impuesto sobre bienes inmuebles" },
    { id: "itp", name: "ITP", description: "Impuesto de transmisiones" },
    { id: "plusvalia", name: "Plusvalía", description: "Plusvalía municipal" },
  ],
  contratos: [
    { id: "contratos", name: "Contrato General", description: "Contratos varios" },
    { id: "contrato-arras", name: "Contrato de Arras", description: "Señal/arras" },
    { id: "contrato-alquiler", name: "Contrato de Alquiler", description: "Arrendamiento" },
  ],
  hipoteca: [
    { id: "hipoteca", name: "Hipoteca", description: "Documentación hipotecaria" },
    { id: "cancelacion-registral", name: "Cancelación Registral", description: "Cancelación de hipoteca" },
  ],
  planos: [
    { id: "planos", name: "Planos", description: "Planos de la propiedad" },
  ],
  visitas: [
    { id: "visitas", name: "Reporte de Visita", description: "Informe de visita" },
  ],
  otros: [
    { id: "otros", name: "Otro Documento", description: "Documentos varios" },
  ],
  "documentos-personales": [
    { id: "documentos-personales", name: "Documento Personal", description: "DNI, NIE, pasaporte" },
  ],
  escrituras: [
    { id: "escrituras", name: "Escritura", description: "Escrituras y notas simples" },
  ],
  carteles: [
    { id: "carteles", name: "Cartel", description: "Carteles de la propiedad" },
  ],
  "certificado-energetico": [
    { id: "energy_certificate", name: "Certificado Energético", description: "CEE" },
  ],
};

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) {
    return FileImage;
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return FileSpreadsheet;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return FileArchive;
  }
  if (["pdf", "doc", "docx", "txt", "rtf"].includes(ext)) {
    return FileText;
  }
  return File;
}

function formatFileSize(size?: string): string {
  if (!size) return "";
  return size;
}

export function AttachmentActionModal({
  isOpen,
  onClose,
  attachment,
  messageId,
  threadContext,
  onDownload,
}: AttachmentActionModalProps) {
  const [step, setStep] = useState<ModalStep>("actions");
  const [selectedFolder, setSelectedFolder] = useState<DocumentFolder | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [folderSuggestion, setFolderSuggestion] = useState<FolderSuggestionResult | null>(null);
  const [typeSuggestion, setTypeSuggestion] = useState<TypeSuggestionResult | null>(null);
  const [isLoadingFolderSuggestion, setIsLoadingFolderSuggestion] = useState(false);
  const [isLoadingTypeSuggestion, setIsLoadingTypeSuggestion] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzeDocument, setAnalyzeDocument] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DNIAnalysisData | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && attachment) {
      setStep("actions");
      setSelectedFolder(null);
      setSelectedType(null);
      setFolderSuggestion(null);
      setTypeSuggestion(null);
      setError(null);
      setIsSaving(false);
      setAnalyzeDocument(false);
      setAnalysisResult(null);
      setShowValidationModal(false);
    }
  }, [isOpen, attachment]);

  // Fetch folder suggestion when entering folder select step
  useEffect(() => {
    if (step === "folder-select" && attachment && !folderSuggestion) {
      const fetchSuggestion = async () => {
        setIsLoadingFolderSuggestion(true);
        try {
          const response = await fetch("/api/inbox/suggest-document-type", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: attachment.name }),
          });
          if (response.ok) {
            const data = (await response.json()) as FolderSuggestionResult;
            setFolderSuggestion(data);
          }
        } catch (err) {
          console.error("Error fetching folder suggestion:", err);
        } finally {
          setIsLoadingFolderSuggestion(false);
        }
      };
      void fetchSuggestion();
    }
  }, [step, attachment, folderSuggestion]);

  // Fetch type suggestion when entering type select step
  useEffect(() => {
    if (step === "type-select" && attachment && selectedFolder && !typeSuggestion) {
      const fetchTypeSuggestion = async () => {
        setIsLoadingTypeSuggestion(true);
        try {
          const response = await fetch("/api/inbox/suggest-document-tag", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: attachment.name,
              folderId: selectedFolder.id,
            }),
          });
          if (response.ok) {
            const data = (await response.json()) as TypeSuggestionResult;
            setTypeSuggestion(data);
          }
        } catch (err) {
          console.error("Error fetching type suggestion:", err);
        } finally {
          setIsLoadingTypeSuggestion(false);
        }
      };
      void fetchTypeSuggestion();
    }
  }, [step, attachment, selectedFolder, typeSuggestion]);

  const handleSaveClick = () => {
    setStep("folder-select");
  };

  const handleFolderSelect = (folder: DocumentFolder) => {
    setSelectedFolder(folder);
    setTypeSuggestion(null); // Reset type suggestion for new folder
    setStep("type-select");
  };

  const handleTypeSelect = async (docType: DocumentType) => {
    if (!attachment || !selectedFolder) return;

    setSelectedType(docType);
    setStep("saving");
    setIsSaving(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // Determine if we should analyze - only for DNI/NIE type
      const shouldAnalyze = analyzeDocument && docType.id === "documentacion-inicial";

      const response = await fetch("/api/inbox/save-attachment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          attachmentId: attachment.attachmentId,
          filename: attachment.name,
          folderType: selectedFolder.id,
          documentTag: docType.id,
          contactId: threadContext?.contactId?.toString(),
          listingId: threadContext?.listing?.listingId?.toString(),
          analyzeDocument: shouldAnalyze,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Error al guardar");
      }

      const result = (await response.json()) as {
        success: boolean;
        document: { docId: string; filename: string; fileUrl: string };
        analysis?: {
          fullName?: string;
          documentNumber?: string;
          birthDate?: string;
          expiryDate?: string;
          address?: string;
        };
      };

      // If analysis returned data, show validation modal
      if (result.analysis) {
        setAnalysisResult(result.analysis);
        toast.success("Documento guardado", {
          description: "Datos extraídos del DNI/NIE. Revisa y confirma.",
        });
        // Show the validation modal
        setShowValidationModal(true);
      } else {
        // No analysis - just show success and close
        toast.success("Documento guardado correctamente", {
          description: `${docType.name} en ${selectedFolder.name}`,
        });
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al guardar el documento";
      setError(errorMessage);
      toast.error("Error al guardar", {
        description: errorMessage,
      });
      setStep("type-select");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (step === "folder-select") {
      setStep("actions");
      setFolderSuggestion(null);
    } else if (step === "type-select") {
      setStep("folder-select");
      setTypeSuggestion(null);
    }
  };

  const handleDownloadClick = () => {
    if (attachment) {
      onDownload(attachment);
      onClose();
    }
  };

  const handleConfirmDNIData = async (contactId: number, data: DNIAnalysisData) => {
    const response = await fetch(`/api/contacts/${contactId}/update-dni`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { error?: string };
      throw new Error(errorData.error ?? "Error al guardar los datos");
    }
  };

  const handleValidationModalClose = () => {
    setShowValidationModal(false);
    onClose();
  };

  if (!attachment) return null;

  const FileIcon = getFileIcon(attachment.name);
  const availableTypes = selectedFolder ? (DOCUMENT_TYPES_BY_FOLDER[selectedFolder.id] ?? []) : [];

  return (
  <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {(step === "folder-select" || step === "type-select") && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {step === "actions" && "Acciones del adjunto"}
            {step === "folder-select" && "Seleccionar carpeta"}
            {step === "type-select" && "Seleccionar tipo"}
            {step === "saving" && "Guardando..."}
          </DialogTitle>
          <DialogDescription>
            {step === "actions" && "Elige qué hacer con este archivo"}
            {step === "folder-select" && "Selecciona dónde guardar el documento"}
            {step === "type-select" && `Tipo de documento en ${selectedFolder?.name}`}
          </DialogDescription>
        </DialogHeader>

        {/* File Info Summary */}
        {step === "actions" && (
          <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <FileIcon className="h-5 w-5 text-gray-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {attachment.name}
                </p>
                {attachment.size && (
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.size)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions Step - 2x2 Grid like share-arras-pdf-modal */}
        {step === "actions" && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="flex h-20 flex-col items-center justify-center gap-2"
              onClick={handleDownloadClick}
            >
              <Download className="h-5 w-5" />
              <span className="text-xs">Descargar</span>
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex h-20 flex-col items-center justify-center gap-2 opacity-50"
                    disabled
                  >
                    <Share2 className="h-5 w-5" />
                    <span className="text-xs">Compartir</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Próximamente</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="outline"
              className="col-span-2 flex h-20 flex-col items-center justify-center gap-2"
              onClick={handleSaveClick}
            >
              <Save className="h-5 w-5" />
              <span className="text-xs">Guardar en documentos</span>
            </Button>
          </div>
        )}

        {/* Folder Selection Step */}
        {step === "folder-select" && (
          <div className="py-2">
            {isLoadingFolderSuggestion && (
              <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analizando documento...
              </div>
            )}

            {error && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <ScrollArea className="h-[320px] pr-4">
              <div className="grid grid-cols-1 gap-2">
                {DOCUMENT_FOLDERS.map((folder) => {
                  const isSuggested = folderSuggestion?.suggestedFolder === folder.id && folderSuggestion.confidence > 0.5;
                  return (
                    <Card
                      key={folder.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:border-primary/40 hover:bg-muted/30",
                        isSuggested && "border-primary border-2 bg-primary/10 shadow-sm ring-2 ring-primary/20"
                      )}
                      onClick={() => handleFolderSelect(folder)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <FolderIcon className={cn(
                              "h-5 w-5 fill-current",
                              isSuggested ? "text-primary" : "text-gray-600"
                            )} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className={cn(
                                "text-sm font-medium",
                                isSuggested ? "text-primary" : "text-gray-900"
                              )}>
                                {folder.name}
                              </h4>
                              {isSuggested && (
                                <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                                  Recomendado
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {folder.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Type Selection Step */}
        {step === "type-select" && (
          <div className="py-2">
            {isLoadingTypeSuggestion && (
              <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analizando documento...
              </div>
            )}

            {error && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Analyze Document Toggle - Only show for DNI/NIE folder */}
            {selectedFolder?.id === "documentacion-inicial" && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Analizar documento</p>
                  <p className="text-xs text-muted-foreground">Extraer datos del DNI/NIE con IA</p>
                </div>
                <Switch
                  checked={analyzeDocument}
                  onCheckedChange={setAnalyzeDocument}
                />
              </div>
            )}

            <ScrollArea className="h-[280px] pr-4">
              <div className="grid grid-cols-1 gap-2">
                {availableTypes.map((docType) => {
                  const isSuggested = typeSuggestion?.suggestedDocumentTag === docType.id && typeSuggestion.confidence > 0.5;
                  return (
                    <Card
                      key={docType.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:border-primary/40 hover:bg-muted/30",
                        isSuggested && "border-primary border-2 bg-primary/10 shadow-sm ring-2 ring-primary/20"
                      )}
                      onClick={() => handleTypeSelect(docType)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <FileText className={cn(
                              "h-5 w-5",
                              isSuggested ? "text-primary" : "text-gray-600"
                            )} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className={cn(
                                "text-sm font-medium",
                                isSuggested ? "text-primary" : "text-gray-900"
                              )}>
                                {docType.name}
                              </h4>
                              {isSuggested && (
                                <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                                  Recomendado
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {docType.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Saving Step */}
        {step === "saving" && (
          <div className="flex flex-col items-center justify-center py-8">
            {isSaving ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">
                  {analyzeDocument && selectedType?.id === "documentacion-inicial"
                    ? "Guardando y analizando documento..."
                    : `Guardando ${selectedType?.name} en ${selectedFolder?.name}...`}
                </p>
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <p className="mt-4 text-sm font-medium text-green-600">
                  Documento guardado correctamente
                </p>

                {/* Show analysis results if available */}
                {analysisResult && (
                  <div className="mt-4 w-full rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
                      Datos extraídos del DNI/NIE
                    </p>
                    <div className="space-y-1 text-sm">
                      {analysisResult.fullName && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Nombre:</span>
                          <span className="font-medium">{analysisResult.fullName}</span>
                        </div>
                      )}
                      {analysisResult.documentNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">DNI/NIE:</span>
                          <span className="font-medium">{analysisResult.documentNumber}</span>
                        </div>
                      )}
                      {analysisResult.birthDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Nacimiento:</span>
                          <span className="font-medium">{analysisResult.birthDate}</span>
                        </div>
                      )}
                      {analysisResult.expiryDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Caducidad:</span>
                          <span className="font-medium">{analysisResult.expiryDate}</span>
                        </div>
                      )}
                      {analysisResult.address && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Dirección:</span>
                          <span className="font-medium">{analysisResult.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* DNI Validation Modal */}
    {analysisResult && (
      <DNIValidationModal
        isOpen={showValidationModal}
        onClose={handleValidationModalClose}
        analysisData={analysisResult}
        suggestedContactId={threadContext?.contactId ? Number(threadContext.contactId) : undefined}
        onConfirm={handleConfirmDNIData}
      />
    )}
  </>
  );
}
