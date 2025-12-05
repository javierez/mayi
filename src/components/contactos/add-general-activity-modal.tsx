"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { toast } from "sonner";
import {
  Loader,
  Mail,
  MessageSquare,
  Phone,
  UserCheck,
  MoreHorizontal,
  ArrowLeft,
  Search,
  X,
} from "lucide-react";
import { PushToTalkWhisperButton } from "~/components/shared/push-to-talk-whisper-button";
import { NotesAiButtons, type TransformationType } from "~/components/shared/notes-ai-buttons";
import { NotesTransformationPreviewModal } from "~/components/shared/notes-transformation-preview-modal";
import { TaskSelectionModal } from "~/components/shared/task-selection-modal";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { createListingContactActivityAction } from "~/server/actions/listing-contact-activity";
import {
  createContactActivityAction,
  findListingContactIdAction,
  createListingContactRelationshipAction,
} from "~/server/actions/contact-activity";
import { listListingsCompactWithAuth, listListingsForContactWithAuth } from "~/server/queries/listing";
import type { ListingContactActivityAction } from "~/lib/constants/listing-contact-activity-actions";
import { matchesSearch } from "~/lib/search-utils";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Badge } from "~/components/ui/badge";
import { summarizeNotes, extractTasksFromNotes, type ExtractedTask } from "~/server/openai/notes-transformer";
import { createTaskAction } from "~/app/actions/create-task";

interface AddGeneralActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: bigint;
  onSuccess?: () => void;
}

type ActivityType = "mail" | "whatsapp" | "call" | "visit" | "otros";

interface Listing {
  listingId: bigint;
  title: string | null;
  referenceNumber: string | null;
  price: string;
  listingType: string;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: string | null;
  squareMeter: number | null;
  city: string | null;
  agentName: string | null;
  imageUrl: string | null;
  contactType?: "owner" | "buyer" | null;
}

const ACTIVITY_TYPES: Array<{
  type: ActivityType;
  label: string;
  action: ListingContactActivityAction;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { type: "mail", label: "Email", action: "email_sent", icon: Mail },
  { type: "whatsapp", label: "WhatsApp", action: "whatsapp_sent", icon: MessageSquare },
  { type: "call", label: "Llamada", action: "call_logged", icon: Phone },
  { type: "visit", label: "Visita en Persona", action: "viewing_completed", icon: UserCheck },
  { type: "otros", label: "Otros", action: "notes_added", icon: MoreHorizontal },
];

export function AddGeneralActivityModal({
  open,
  onOpenChange,
  contactId,
  onSuccess,
}: AddGeneralActivityModalProps) {
  const [step, setStep] = useState<"select" | "listing" | "notes">("select");
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const [action, setAction] = useState<ListingContactActivityAction | "">("");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingSearchQuery, setListingSearchQuery] = useState("");
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [notes, setNotes] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [deadlineHours, setDeadlineHours] = useState(48);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI transformation state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [transformedContent, setTransformedContent] = useState("");
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);
  const [showTaskSelectionModal, setShowTaskSelectionModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingType, setProcessingType] = useState<TransformationType | null>(null);

  // Confirmation dialog state for creating listing-contact relationship
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingListingId, setPendingListingId] = useState<bigint | null>(null);

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      setStep("select");
      setSelectedType(null);
      setAction("");
      setSelectedListing(null);
      setListings([]);
      setListingSearchQuery("");
      setNotes("");
      setIsPending(false);
      setDeadlineHours(48);
      // Reset AI transformation state
      setShowPreviewModal(false);
      setTransformedContent("");
      setExtractedTasks([]);
      setShowTaskSelectionModal(false);
      setIsProcessing(false);
      setProcessingType(null);
      // Reset confirmation dialog state
      setShowConfirmDialog(false);
      setPendingListingId(null);
    }
  }, [open]);

  // Fetch listings when on listing step
  useEffect(() => {
    if (step !== "listing" || !open) return;

    const fetchListings = async () => {
      setIsLoadingListings(true);
      try {
        // First try to fetch listings related to this contact
        const contactListings = await listListingsForContactWithAuth(contactId, undefined);

        // If no contact-related listings, fall back to general listings
        if (contactListings.length === 0) {
          const listingsData = await listListingsCompactWithAuth({
            page: 1,
            limit: 20,
          });
          setListings(listingsData);
        } else {
          setListings(contactListings);
        }
      } catch (error) {
        console.error("Error fetching listings:", error);
        setListings([]);
      } finally {
        setIsLoadingListings(false);
      }
  };

    void fetchListings();
  }, [step, open, contactId]);

  // Search listings when query changes
  useEffect(() => {
    if (step !== "listing" || !open || listingSearchQuery.length === 0) return;

    const searchListings = async () => {
      setIsLoadingListings(true);
      try {
        // When searching, search across all listings (not just contact-related)
        const listingsData = await listListingsCompactWithAuth({
          searchQuery: listingSearchQuery.trim(),
        });
        setListings(listingsData);
      } catch (error) {
        console.error("Error searching listings:", error);
        setListings([]);
      } finally {
        setIsLoadingListings(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      void searchListings();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [listingSearchQuery, step, open]);

  const handleActivityTypeSelect = (type: ActivityType) => {
    const activityConfig = ACTIVITY_TYPES.find((a) => a.type === type);
    if (activityConfig) {
      setSelectedType(type);
      setAction(activityConfig.action);
      setStep("listing");
    }
  };

  const handleListingSelect = (listing: Listing) => {
    setSelectedListing(listing);
  };

  const handleClearListing = () => {
    setSelectedListing(null);
  };

  const handleBack = () => {
    if (step === "notes") {
      setStep("listing");
    } else if (step === "listing") {
      setStep("select");
    }
  };

  const handleContinueFromListing = () => {
    setStep("notes");
  };

  const handleSubmit = async () => {
    if (!action) {
      toast.error("Por favor, selecciona un tipo de acción");
      return;
    }

    if (!notes.trim()) {
      toast.error("Por favor, describe las notas");
      return;
    }

    if (!contactId) {
      toast.error("Error: ID de contacto no disponible");
      return;
    }

    setIsSubmitting(true);

    try {
      if (selectedListing) {
        // Create listing contact activity
        // First, find the listing_contact_id
        const listingContactResult = await findListingContactIdAction(
          contactId,
          selectedListing.listingId,
        );

        if (!listingContactResult.success || !listingContactResult.listingContactId) {
          // Check if the relationship was not found
          if (listingContactResult.notFound) {
            // Show confirmation dialog to create the relationship
            setPendingListingId(selectedListing.listingId);
            setShowConfirmDialog(true);
            setIsSubmitting(false);
            return;
          }

          // Other errors
          toast.error(
            listingContactResult.error ??
              "Error al buscar la relación entre el contacto y la propiedad",
          );
          setIsSubmitting(false);
          return;
        }

        const result = await createListingContactActivityAction({
          listingContactId: listingContactResult.listingContactId.toString(),
          action,
          notes: notes.trim(),
          topic: undefined,
          details: {
            isPending,
            deadlineHours: isPending ? deadlineHours : undefined,
            activityType: selectedType ?? undefined,
          },
        });

        if (result.success) {
          toast.success("Actividad registrada correctamente");
          onOpenChange(false);
          if (onSuccess) {
            onSuccess();
          }
        } else {
          toast.error(result.error ?? "Error al registrar la actividad");
        }
      } else {
        // Create contact activity
        const result = await createContactActivityAction({
          contactId: contactId.toString(),
          action,
          notes: notes.trim(),
          topic: undefined,
          details: {
            isPending,
            deadlineHours: isPending ? deadlineHours : undefined,
            activityType: selectedType ?? undefined,
          },
        });

        if (result.success) {
          toast.success("Actividad registrada correctamente");
          onOpenChange(false);
          if (onSuccess) {
            onSuccess();
          }
        } else {
          toast.error(result.error ?? "Error al registrar la actividad");
        }
      }
    } catch (error) {
      console.error("Error submitting activity:", error);
      toast.error("Error al registrar la actividad");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCreateRelationship = async () => {
    if (!pendingListingId) return;

    setIsSubmitting(true);
    setShowConfirmDialog(false);

    try {
      // Create the relationship
      const createResult = await createListingContactRelationshipAction(
        contactId,
        pendingListingId,
      );

      if (!createResult.success || !createResult.listingContactId) {
        toast.error(
          createResult.error ?? "Error al crear la relación",
        );
        setPendingListingId(null);
        setIsSubmitting(false);
        return;
      }

      // Now create the activity with the new relationship
      const result = await createListingContactActivityAction({
        listingContactId: createResult.listingContactId.toString(),
        action,
        notes: notes.trim(),
        topic: undefined,
        details: {
          isPending,
          deadlineHours: isPending ? deadlineHours : undefined,
          activityType: selectedType ?? undefined,
        },
      });

      if (result.success) {
        toast.success("Relación creada y actividad registrada correctamente");
        setPendingListingId(null);
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.error ?? "Error al registrar la actividad");
      }
    } catch (error) {
      console.error("Error creating relationship and activity:", error);
      toast.error("Error al crear la relación y registrar la actividad");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelCreateRelationship = () => {
    setPendingListingId(null);
    setShowConfirmDialog(false);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
  };

  const handleVoiceTranscript = (text: string) => {
    setNotes((prev) => (prev ? `${prev} ${text}` : text));
  };

  // AI transformation handlers
  const handleAITransform = async (type: TransformationType) => {
    if (!notes.trim()) {
      toast.error("Las notas no pueden estar vacías");
      return;
    }

    setIsProcessing(true);
    setProcessingType(type);

    try {
      if (type === "summarize") {
        const result = await summarizeNotes(notes);
        if (result.success && result.content) {
          setTransformedContent(result.content);
          setShowPreviewModal(true);
        } else {
          toast.error(result.error ?? "Error al resumir las notas");
        }
      } else if (type === "tasks") {
        const result = await extractTasksFromNotes(notes);
        if (result.success && result.tasks && result.tasks.length > 0) {
          setExtractedTasks(result.tasks);
          setShowTaskSelectionModal(true);
        } else if (result.success && result.tasks && result.tasks.length === 0) {
          toast.info("No se encontraron tareas accionables en las notas");
        } else {
          toast.error(result.error ?? "Error al extraer tareas");
        }
      }
    } catch (error) {
      console.error("Error in AI transformation:", error);
      toast.error("Error al procesar las notas");
    } finally {
      setIsProcessing(false);
      setProcessingType(null);
    }
  };

  const handleConfirmTransformation = async () => {
    // Replace notes with transformed content (for summarize)
    setNotes(transformedContent);
    toast.success("Notas actualizadas correctamente");
    setShowPreviewModal(false);
  };

  const handleConfirmTaskSelection = async (selectedTasks: ExtractedTask[]) => {
    if (!contactId) {
      toast.error("No se puede crear tareas sin un contacto");
      return;
    }

    try {
      // Get listingContactId if there's a selected listing
      let listingContactId: bigint | undefined;
      if (selectedListing) {
        const listingContactResult = await findListingContactIdAction(
          contactId,
          selectedListing.listingId,
        );
        if (listingContactResult.success && listingContactResult.listingContactId) {
          listingContactId = listingContactResult.listingContactId;
        }
      }

      let createdCount = 0;
      for (const task of selectedTasks) {
        const taskResult = await createTaskAction({
          title: task.title,
          description: task.description,
          contactId,
          urgency: task.urgency,
          category: task.category,
          suggestedDueDays: task.suggestedDueDays,
          listingId: selectedListing?.listingId,
          listingContactId,
        });
        if (taskResult.success) {
          createdCount++;
        }
      }
      toast.success(
        `${createdCount} tarea${createdCount !== 1 ? "s" : ""} creada${createdCount !== 1 ? "s" : ""} correctamente`,
      );
      setShowTaskSelectionModal(false);
    } catch (error) {
      console.error("Error creating tasks:", error);
      toast.error("Error al crear las tareas");
    }
  };

  const selectedActivityConfig = selectedType
    ? ACTIVITY_TYPES.find((a) => a.type === selectedType)
    : null;

  // Filter listings based on search query
  const filteredListings = listings.filter((listing) => {
    if (selectedListing && listing.listingId.toString() === selectedListing.listingId.toString()) {
      return false;
    }

    if (listingSearchQuery.length === 0) {
      return true;
    }

    // Use normalized search for case-insensitive and accent-insensitive matching
    return (
      matchesSearch(listing.title, listingSearchQuery) ||
      matchesSearch(listing.referenceNumber, listingSearchQuery) ||
      matchesSearch(listing.city, listingSearchQuery)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === "select"
              ? "Agregar Actividad"
              : step === "listing"
                ? "Seleccionar Propiedad (Opcional)"
                : selectedActivityConfig?.label}
          </DialogTitle>
          <DialogDescription>
            {step === "select"
              ? "Selecciona el tipo de actividad que deseas registrar"
              : step === "listing"
                ? "Selecciona una propiedad para asociar la actividad, o continúa sin seleccionar"
                : "Registra los detalles de la actividad"}
          </DialogDescription>
        </DialogHeader>

        {step === "select" ? (
          /* Step 1: Activity Type Selection */
          <div className="grid grid-cols-2 gap-3 py-4">
            {ACTIVITY_TYPES.map((activityType) => {
              const Icon = activityType.icon;
              return (
                <Button
                  key={activityType.type}
                  variant="outline"
                  className="flex h-24 flex-col items-center justify-center gap-2"
                  onClick={() => handleActivityTypeSelect(activityType.type)}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm">{activityType.label}</span>
                </Button>
              );
            })}
          </div>
        ) : step === "listing" ? (
          /* Step 2: Listing Selection (Optional) */
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="listing-search">Buscar propiedad</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="listing-search"
                  value={listingSearchQuery}
                  onChange={(e) => setListingSearchQuery(e.target.value)}
                  placeholder="Buscar propiedades..."
                  className="h-9 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {selectedListing && (
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1">
                    {selectedListing.imageUrl && (
                      <Image
                        src={selectedListing.imageUrl}
                        alt={selectedListing.title ?? "Property"}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium truncate">
                          {selectedListing.title ?? "Sin título"}
                        </div>
                        {selectedListing.contactType === "owner" && (
                          <Badge variant="secondary" className="shrink-0 text-xs ml-auto">
                            En Propiedad
                          </Badge>
                        )}
                        {selectedListing.contactType === "buyer" && (
                          <Badge className="shrink-0 text-xs ml-auto bg-amber-500 hover:bg-amber-600">
                            Interés
                          </Badge>
                        )}
                      </div>
                      {selectedListing.referenceNumber && (
                        <div className="text-xs text-muted-foreground">
                          Ref: {selectedListing.referenceNumber}
                        </div>
                      )}
                      {selectedListing.city && (
                        <div className="text-xs text-muted-foreground">
                          {selectedListing.city}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearListing}
                    className="h-6 w-6 shrink-0 p-0"
                    title="Quitar propiedad"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            <ScrollArea className="h-[300px]">
              {isLoadingListings ? (
                <div className="flex items-center justify-center py-6">
                  <Loader className="h-5 w-5 animate-spin" />
                </div>
              ) : filteredListings.length === 0 && listingSearchQuery.length > 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No se encontraron propiedades
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredListings.map((listing, index) => (
                    <div
                      key={`${listing.listingId.toString()}-${index}`}
                      className="cursor-pointer rounded-lg border border-gray-100/50 bg-gray-50/30 p-2 transition-all hover:border-gray-200 hover:bg-gray-100/60 hover:shadow-sm"
                      onClick={() => handleListingSelect(listing)}
                    >
                      <div className="flex items-start gap-2">
                        {listing.imageUrl && (
                          <Image
                            src={listing.imageUrl}
                            alt={listing.title ?? "Property"}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded object-cover shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="text-sm font-medium text-gray-600 truncate">
                              {listing.title ?? "Sin título"}
                            </div>
                            {listing.contactType === "owner" && (
                              <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0 ml-auto">
                                En Propiedad
                              </Badge>
                            )}
                            {listing.contactType === "buyer" && (
                              <Badge className="shrink-0 text-[10px] px-1.5 py-0 ml-auto bg-amber-500 hover:bg-amber-600">
                                Interés
                              </Badge>
                            )}
                          </div>
                          {listing.referenceNumber && (
                            <div className="text-xs text-gray-400">
                              Ref: {listing.referenceNumber}
                            </div>
                          )}
                          {listing.city && (
                            <div className="text-xs text-gray-400">
                              {listing.city}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          /* Step 3: Notes Form */
          <div className="space-y-4">
            {/* Notes Input with Voice */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="notes">Notas</Label>
                <div className="flex items-center gap-1.5">
                  <NotesAiButtons
                    notes={notes}
                    isPending={isPending}
                    onTransform={handleAITransform}
                    disabled={isSubmitting}
                    isProcessing={isProcessing}
                    processingType={processingType}
                  />
                  <PushToTalkWhisperButton
                    onTranscript={handleVoiceTranscript}
                    language="es"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <Textarea
                id="notes"
                placeholder="Describe la actividad o mantén presionado el micrófono para grabar..."
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                rows={6}
                className="custom-scrollbar"
              />
            </div>

            {/* Pending Toggle */}
            <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
              <Switch
                id="pending"
                checked={isPending}
                onCheckedChange={setIsPending}
                className="data-[state=checked]:bg-amber-500"
              />
              <Label
                htmlFor="pending"
                className="cursor-pointer text-xs font-normal text-gray-600 hover:text-gray-900"
              >
                Marcar como pendiente
              </Label>
              {isPending && (
                <>
                  <span className="text-xs font-normal text-gray-600">en</span>
                  <input
                    id="deadlineHours"
                    type="number"
                    min="1"
                    value={deadlineHours === 0 ? "" : deadlineHours}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setDeadlineHours(0);
                      } else {
                        const num = parseInt(val);
                        if (!isNaN(num) && num >= 1) {
                          setDeadlineHours(num);
                        }
                      }
                    }}
                    onBlur={() => {
                      if (deadlineHours === 0) {
                        setDeadlineHours(48);
                      }
                    }}
                    className="h-7 w-16 rounded border border-input bg-background px-2 text-xs text-center"
                    placeholder="48"
                  />
                  <span className="text-xs font-normal text-gray-600">horas</span>
                </>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {step !== "select" && (
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isSubmitting}
              className="mr-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Atrás
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          {step === "listing" && (
            <Button onClick={handleContinueFromListing} disabled={isSubmitting}>
              Continuar
            </Button>
          )}
          {step === "notes" && (
            <Button onClick={handleSubmit} disabled={isSubmitting || !notes.trim()}>
              {isSubmitting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* AI Transformation Preview Modal */}
      <NotesTransformationPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
        title="Resumir notas"
        description="Revisa el resumen antes de aplicar los cambios"
        originalContent={notes}
        transformedContent={transformedContent}
        onConfirm={handleConfirmTransformation}
        isLoading={isProcessing && processingType === "summarize"}
      />
      <TaskSelectionModal
        open={showTaskSelectionModal}
        onOpenChange={setShowTaskSelectionModal}
        tasks={extractedTasks}
        onConfirm={handleConfirmTaskSelection}
        isLoading={isProcessing && processingType === "tasks"}
      />

      {/* Confirmation dialog for creating listing-contact relationship */}
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Crear relación con la propiedad"
        description="No se ha encontrado relación entre el contacto y la propiedad. ¿Deseas crearla?"
        confirmText="Sí, crear relación"
        cancelText="Cancelar"
        confirmVariant="default"
        onConfirm={handleConfirmCreateRelationship}
        onCancel={handleCancelCreateRelationship}
      />
    </Dialog>
  );
}

