"use client";

import { useState, useEffect, useCallback } from "react";
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
  User,
  Building2,
  AlertCircle,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Input } from "~/components/ui/input";
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
import type { InboxAttachment, ThreadContext } from "./inbox-types";
import { DNIValidationModal, type DNIAnalysisData } from "./dni-validation-modal";

// Types for entity selection
interface ContactSearchResult {
  contactId: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

interface ListingSearchResult {
  listingId: number;
  referenceNumber: string | null;
  title: string | null;
  city: string | null;
  listingType: string | null;
}

interface AttachmentActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: InboxAttachment | null;
  messageId: string;
  threadContext?: ThreadContext;
  senderContactId?: number;
  onDownload: (attachment: InboxAttachment) => void;
}

type ModalStep = "actions" | "entity-select" | "folder-select" | "type-select" | "saving";

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
  senderContactId,
  onDownload,
}: AttachmentActionModalProps) {
  // Use threadContext.contactId if available, otherwise fallback to senderContactId
  const effectiveContactId = threadContext?.contactId ? Number(threadContext.contactId) : senderContactId;

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

  // Entity selection state
  const [selectedContact, setSelectedContact] = useState<ContactSearchResult | null>(null);
  const [selectedListing, setSelectedListing] = useState<ListingSearchResult | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [listingSearch, setListingSearch] = useState("");
  const [contactResults, setContactResults] = useState<ContactSearchResult[]>([]);
  const [listingResults, setListingResults] = useState<ListingSearchResult[]>([]);
  const [isSearchingContacts, setIsSearchingContacts] = useState(false);
  const [isSearchingListings, setIsSearchingListings] = useState(false);

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
      // Reset entity selection
      setSelectedContact(null);
      setSelectedListing(null);
      setContactSearch("");
      setListingSearch("");
      setContactResults([]);
      setListingResults([]);
    }
  }, [isOpen, attachment]);

  // Pre-populate entity selection from thread context
  useEffect(() => {
    if (isOpen && step === "entity-select") {
      // Pre-select contact from thread context or sender
      if (effectiveContactId && !selectedContact) {
        // Fetch contact details
        fetch(`/api/contacts/search?contactId=${effectiveContactId}`)
          .then((res) => res.json())
          .then((data: { contacts: ContactSearchResult[] }) => {
            if (data.contacts[0]) {
              setSelectedContact(data.contacts[0]);
            }
          })
          .catch(console.error);
      }
      // Pre-select listing from thread context
      if (threadContext?.listing?.listingId && !selectedListing) {
        setSelectedListing({
          listingId: Number(threadContext.listing.listingId),
          referenceNumber: threadContext.listing.referenceNumber ?? null,
          title: threadContext.listing.title ?? null,
          city: threadContext.listing.city ?? null,
          listingType: null,
        });
      }
    }
  }, [isOpen, step, effectiveContactId, threadContext, selectedContact, selectedListing]);

  // Search contacts with debounce
  const searchContacts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setContactResults([]);
      return;
    }
    setIsSearchingContacts(true);
    try {
      const res = await fetch(`/api/contacts/search?search=${encodeURIComponent(query)}&limit=5`);
      const data = (await res.json()) as { contacts: ContactSearchResult[] };
      setContactResults(data.contacts);
    } catch (err) {
      console.error("Error searching contacts:", err);
    } finally {
      setIsSearchingContacts(false);
    }
  }, []);

  // Search listings with debounce
  const searchListings = useCallback(async (query: string) => {
    if (!query.trim()) {
      setListingResults([]);
      return;
    }
    setIsSearchingListings(true);
    try {
      const res = await fetch(`/api/listings/search?search=${encodeURIComponent(query)}&limit=5`);
      const data = (await res.json()) as { listings: ListingSearchResult[] };
      setListingResults(data.listings);
    } catch (err) {
      console.error("Error searching listings:", err);
    } finally {
      setIsSearchingListings(false);
    }
  }, []);

  // Debounced search effects
  useEffect(() => {
    const timer = setTimeout(() => {
      void searchContacts(contactSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [contactSearch, searchContacts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void searchListings(listingSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [listingSearch, searchListings]);

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
    setStep("entity-select");
  };

  const handleEntityContinue = () => {
    // Validate at least one entity is selected
    if (!selectedContact && !selectedListing) {
      setError("Selecciona al menos un contacto o una propiedad");
      return;
    }
    setError(null);
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
          contactId: selectedContact?.contactId?.toString(),
          listingId: selectedListing?.listingId?.toString(),
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
    if (step === "entity-select") {
      setStep("actions");
      setError(null);
    } else if (step === "folder-select") {
      setStep("entity-select");
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
            {(step === "entity-select" || step === "folder-select" || step === "type-select") && (
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
            {step === "entity-select" && "Asignar documento"}
            {step === "folder-select" && "Seleccionar carpeta"}
            {step === "type-select" && "Seleccionar tipo"}
            {step === "saving" && "Guardando..."}
          </DialogTitle>
          <DialogDescription>
            {step === "actions" && "Elige qué hacer con este archivo"}
            {step === "entity-select" && "Selecciona a qué contacto o propiedad asignar el documento"}
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

        {/* Entity Selection Step */}
        {step === "entity-select" && (
          <div className="space-y-4 py-2">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Contact Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Contacto
              </label>
              {selectedContact ? (
                <div className="flex items-center justify-between rounded-lg border border-primary/10 bg-primary/5 p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {[selectedContact.firstName, selectedContact.lastName].filter(Boolean).join(" ")}
                      </p>
                      {selectedContact.email && (
                        <p className="text-xs text-muted-foreground">{selectedContact.email}</p>
                      )}
                    </div>
                    {(Boolean(effectiveContactId) || Boolean(threadContext?.contactId)) && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Recomendado
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setSelectedContact(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar contacto..."
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      className="pl-9"
                    />
                    {isSearchingContacts && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {contactResults.length > 0 && (
                    <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border p-1">
                      {contactResults.map((contact) => (
                        <button
                          key={contact.contactId}
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-muted"
                          onClick={() => {
                            setSelectedContact(contact);
                            setContactSearch("");
                            setContactResults([]);
                          }}
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm">
                              {[contact.firstName, contact.lastName].filter(Boolean).join(" ")}
                            </p>
                            {contact.email && (
                              <p className="text-xs text-muted-foreground">{contact.email}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Listing Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Propiedad
              </label>
              {selectedListing ? (
                <div className="flex items-center justify-between rounded-lg border border-primary/10 bg-primary/5 p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {selectedListing.referenceNumber ?? `#${selectedListing.listingId}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedListing.title ?? selectedListing.city ?? "Sin dirección"}
                      </p>
                    </div>
                    {threadContext?.listing?.listingId && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Recomendado
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setSelectedListing(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar propiedad por referencia o dirección..."
                      value={listingSearch}
                      onChange={(e) => setListingSearch(e.target.value)}
                      className="pl-9"
                    />
                    {isSearchingListings && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {listingResults.length > 0 && (
                    <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border p-1">
                      {listingResults.map((listing) => (
                        <button
                          key={listing.listingId}
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-muted"
                          onClick={() => {
                            setSelectedListing(listing);
                            setListingSearch("");
                            setListingResults([]);
                          }}
                        >
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm">
                              {listing.referenceNumber ?? `#${listing.listingId}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {listing.title ?? listing.city ?? "Sin dirección"}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Continue Button */}
            <Button
              className="w-full"
              onClick={handleEntityContinue}
              disabled={!selectedContact && !selectedListing}
            >
              Continuar
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
                      className="cursor-pointer transition-all duration-200 hover:border-primary/40 hover:bg-muted/30"
                      onClick={() => handleFolderSelect(folder)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <FolderIcon className="h-5 w-5 fill-current text-gray-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {folder.name}
                            </h4>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {folder.description}
                            </p>
                          </div>
                          {isSuggested && (
                            <span className="flex-shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              Recomendado
                            </span>
                          )}
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

            <ScrollArea className={cn(
              "pr-4",
              selectedFolder?.id === "documentacion-inicial" ? "h-[220px]" : "h-[280px]"
            )}>
              <div className="grid grid-cols-1 gap-2">
                {availableTypes.map((docType) => {
                  const isSuggested = typeSuggestion?.suggestedDocumentTag === docType.id && typeSuggestion.confidence > 0.5;
                  return (
                    <Card
                      key={docType.id}
                      className="cursor-pointer transition-all duration-200 hover:border-primary/40 hover:bg-muted/30"
                      onClick={() => handleTypeSelect(docType)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <FileText className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {docType.name}
                            </h4>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {docType.description}
                            </p>
                          </div>
                          {isSuggested && (
                            <span className="flex-shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              Recomendado
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Analyze Document Toggle - Only show for DNI/NIE folder */}
            {selectedFolder?.id === "documentacion-inicial" && (
              <div className="mt-4 rounded-xl bg-primary/5 p-3">
                <div className="flex w-full items-center rounded-xl border border-border/60 bg-background p-1">
                  <button
                    type="button"
                    onClick={() => setAnalyzeDocument(false)}
                    className={cn(
                      "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                      !analyzeDocument
                        ? "bg-muted text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    No analizar
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalyzeDocument(true)}
                    className={cn(
                      "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                      analyzeDocument
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Analizar DNI/NIE
                  </button>
                </div>
              </div>
            )}
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
        suggestedContactId={selectedContact?.contactId}
        onConfirm={handleConfirmDNIData}
      />
    )}
  </>
  );
}
