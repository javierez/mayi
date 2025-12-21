"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { type AppointmentData } from "~/components/appointments/appointment-card";
import { CompactPropertyCard } from "~/components/propiedades/compact-property-card";
import { AppointmentTimeline } from "~/components/appointment-timeline";
import { getContactVisitsSummaryAsBuyer } from "~/server/queries/activity";
import {
  canEditCalendar,
  canDeleteCalendar,
  canEditContacts,
} from "~/app/actions/permissions/check-permissions";
import {
  getBuyerListingsWithAuth,
  removeListingContactRelationshipWithAuth,
  deactivateListingContactWithAuth,
} from "~/server/queries/contact";
import { toast } from "sonner";
import type { PropertyListing } from "~/types/property-listing";
import AppointmentModal, {
  useAppointmentModal,
} from "~/components/appointments/appointment-modal";
import { AppointmentDetailSheet } from "~/components/appointments/appointment-detail-sheet";
import { Card } from "~/components/ui/card";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Home,
  Plus,
  ThumbsUp,
  ThumbsDown,
  CalendarPlus,
  FileText,
  X,
  Loader,
  Check,
} from "lucide-react";
import type { ContactVisitWithDetails } from "~/types/activity";
import { cn } from "~/lib/utils";
import { OfferComparisonCard } from "~/components/offer-comparison-card";
import {
  updateOfferStatusAction,
  addOfferToListingContactAction,
} from "~/server/actions/listing-contacts";
import { getDealIdAction } from "~/server/actions/arras";
import { navigateToPage } from "~/lib/navigation";

interface ContactInteresesTabProps {
  contactId: bigint;
}

export function ContactInteresesTab({ contactId }: ContactInteresesTabProps) {
  const router = useRouter();

  const [visits, setVisits] = useState<ContactVisitWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null);
  const [expandedListings, setExpandedListings] = useState<Record<string, boolean>>({});

  // Intereses (buyer listings) state
  const [interesesListings, setInteresesListings] = useState<PropertyListing[]>([]);

  // Permission states
  const [hasEditCalendarPermission, setHasEditCalendarPermission] = useState(false);
  const [hasDeleteCalendarPermission, setHasDeleteCalendarPermission] = useState(false);
  const [hasEditContactsPermission, setHasEditContactsPermission] = useState(false);

  // Appointment modal state
  const {
    isOpen: isModalOpen,
    openModal,
    closeModal,
    initialData: modalInitialData,
  } = useAppointmentModal();
  const [editMode, setEditMode] = useState<"create" | "edit">("create");
  const [editingAppointmentId, setEditingAppointmentId] = useState<bigint | null>(null);

  // Modal state for creating new appointments from listing
  const [isCreateAppointmentModalOpen, setIsCreateAppointmentModalOpen] = useState(false);
  const [createAppointmentListingId, setCreateAppointmentListingId] = useState<bigint | null>(null);

  // Delete confirmation modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<{
    listingId: bigint;
    address: string;
  } | null>(null);

  // Offer operation states - track per listing
  const [updatingOfferListingId, setUpdatingOfferListingId] = useState<string | null>(null);
  const [submittingOfferListingId, setSubmittingOfferListingId] = useState<string | null>(null);

  // Fetch permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const [editCalendarPerm, deleteCalendarPerm, editContactsPerm] = await Promise.all([
          canEditCalendar(),
          canDeleteCalendar(),
          canEditContacts(),
        ]);
        setHasEditCalendarPermission(editCalendarPerm);
        setHasDeleteCalendarPermission(deleteCalendarPerm);
        setHasEditContactsPermission(editContactsPerm);
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    };
    void fetchPermissions();
  }, []);

  // Fetch activity data for buyer interests
  const fetchActivityData = useCallback(async () => {
    try {
      const visitsData = await getContactVisitsSummaryAsBuyer(contactId);
      setVisits(visitsData);
    } catch (error) {
      console.error("Error fetching buyer activity data:", error);
      setVisits([]);
    }
  }, [contactId]);

  // Fetch buyer listings
  const fetchBuyerListings = useCallback(async () => {
    try {
      const buyerListings = await getBuyerListingsWithAuth(Number(contactId));
      setInteresesListings(buyerListings as unknown as PropertyListing[]);
    } catch (error) {
      console.error("Error fetching buyer listings:", error);
      setInteresesListings([]);
    }
  }, [contactId]);

  useEffect(() => {
    setIsLoading(true);
    void Promise.all([fetchActivityData(), fetchBuyerListings()]).finally(() =>
      setIsLoading(false),
    );
  }, [fetchActivityData, fetchBuyerListings]);

  // Handle opening modal for editing
  const handleEditAppointment = (
    appointmentId: bigint,
    initialData: Partial<Record<string, unknown>>,
  ) => {
    setEditMode("edit");
    setEditingAppointmentId(appointmentId);
    openModal(initialData);
  };

  // Handle opening modal for creating new appointments
  const handleScheduleVisitForListing = (listingId: bigint) => {
    setCreateAppointmentListingId(listingId);
    setIsCreateAppointmentModalOpen(true);
  };

  // Handle appointment creation success
  const handleAppointmentCreateSuccess = async () => {
    router.refresh();
    await fetchActivityData();
  };

  // Handle listing card toggle
  const toggleListing = (listingId: bigint) => {
    const listingIdStr = listingId.toString();
    setExpandedListings((prev) => ({
      ...prev,
      [listingIdStr]: !prev[listingIdStr],
    }));
  };

  // Handle delete interest - show confirmation modal
  const handleDeleteInterest = (listingId: bigint) => {
    // Find the listing to get its address for the confirmation message
    const listing = interesesListings.find(
      (l) => l.listingId?.toString() === listingId.toString()
    );
    const address = [listing?.street, listing?.city].filter(Boolean).join(", ") || "Sin dirección";
    
    setListingToDelete({ listingId, address });
    setDeleteConfirmOpen(true);
  };

  // Confirm delete interest (actually remove listing-contact relationship)
  const confirmDeleteInterest = async () => {
    if (!listingToDelete) return;
    
    try {
      await removeListingContactRelationshipWithAuth(
        Number(contactId),
        Number(listingToDelete.listingId),
        "buyer"
      );
      setInteresesListings((prev) =>
        prev.filter(
          (listing) => listing.listingId?.toString() !== listingToDelete.listingId.toString()
        ),
      );
      toast.success("Interés eliminado correctamente");
    } catch (error) {
      console.error("Error deleting interest:", error);
      toast.error("Error al eliminar el interés");
    } finally {
      setListingToDelete(null);
    }
  };

  // Handle deactivate interest (set is_active to false)
  const handleDeactivateInterest = async (listingId: bigint) => {
    try {
      await deactivateListingContactWithAuth(Number(contactId), Number(listingId), "buyer");
      setInteresesListings(
        (prev) =>
          prev.map((listing) =>
            listing.listingId?.toString() === listingId.toString()
              ? { ...listing, listingContactIsActive: false }
              : listing,
          ) as unknown as PropertyListing[],
      );
      toast.success("Interés desactivado correctamente");
    } catch (error) {
      console.error("Error deactivating interest:", error);
      toast.error("Error al desactivar el interés");
    }
  };

  // Handle updating offer status (accept/reject/cancel)
  const handleUpdateOfferStatus = async (
    listingContactId: bigint,
    listingId: bigint,
    accepted: boolean | null,
  ) => {
    const listingIdStr = listingId.toString();
    setUpdatingOfferListingId(listingIdStr);

    try {
      const result = await updateOfferStatusAction(
        listingContactId,
        accepted,
        listingId,
        contactId,
      );

      if (result.success) {
        const message =
          accepted === null
            ? "Oferta cancelada correctamente"
            : accepted
              ? "Oferta aceptada correctamente"
              : "Oferta rechazada";
        toast.success(message);

        // Update local state
        setInteresesListings((prev) =>
          prev.map((listing) =>
            listing.listingId?.toString() === listingIdStr
              ? { ...listing, offerAccepted: accepted }
              : listing,
          ) as unknown as PropertyListing[],
        );
      } else {
        toast.error(result.error ?? "Error al actualizar el estado de la oferta");
      }
    } catch (error) {
      console.error("Error updating offer status:", error);
      toast.error("Error al actualizar el estado de la oferta");
    } finally {
      setUpdatingOfferListingId(null);
    }
  };

  // Handle adding an offer
  const handleAddOffer = async (
    listingContactId: bigint,
    listingId: bigint,
    amount: number,
  ) => {
    const listingIdStr = listingId.toString();
    setSubmittingOfferListingId(listingIdStr);

    try {
      const result = await addOfferToListingContactAction(
        listingContactId,
        amount,
        listingId,
        contactId,
      );

      if (result.success) {
        toast.success("Oferta registrada correctamente");

        // Update local state
        setInteresesListings((prev) =>
          prev.map((listing) =>
            listing.listingId?.toString() === listingIdStr
              ? { ...listing, offer: amount, offerAccepted: null }
              : listing,
          ) as unknown as PropertyListing[],
        );
      } else {
        toast.error(result.error ?? "Error al registrar la oferta");
      }
    } catch (error) {
      console.error("Error adding offer:", error);
      toast.error("Error al registrar la oferta");
    } finally {
      setSubmittingOfferListingId(null);
    }
  };

  // Handle navigating to arras contract
  const handleNavigateToArrasContract = async (listingId: bigint, listingContactId: bigint) => {
    try {
      const result = await getDealIdAction(Number(listingId), Number(listingContactId));
      if (result.success && result.dealId) {
        navigateToPage(`/propiedades/${listingId}/contrato-arras/${result.dealId}`, router);
      } else {
        toast.error(result.error ?? "No se pudo obtener el deal");
      }
    } catch (error) {
      console.error("Error getting deal ID:", error);
      toast.error("Error al obtener el contrato");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse p-3">
            <div className="flex gap-3">
              <div className="h-16 w-20 rounded-md bg-gray-200"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                <div className="h-3 w-1/2 rounded bg-gray-200"></div>
                <div className="h-3 w-2/3 rounded bg-gray-200"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (interesesListings.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Home className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="mb-2 text-lg font-semibold">Sin intereses registrados</h3>
          <p className="text-muted-foreground">
            Este contacto no tiene intereses de búsqueda registrados.
          </p>
        </div>
      </Card>
    );
  }

  // Sort active listings first, inactive at bottom
  const sortedListings = [...interesesListings].sort((a, b) => {
    const aActive = (a as Record<string, unknown>).listingContactIsActive ?? true;
    const bActive = (b as Record<string, unknown>).listingContactIsActive ?? true;
    if (aActive === bActive) return 0;
    return aActive ? -1 : 1;
  });

  return (
    <div className="space-y-3">
      {sortedListings.map((listing) => {
        const listingContactId = (listing as Record<string, unknown>).listingContactId as
          | bigint
          | undefined;
        const listingContactIdStr = listingContactId?.toString() ?? "unknown";
        const listingId =
          typeof listing.listingId === "bigint"
            ? listing.listingId
            : BigInt(listing.listingId ?? 0);
        const listingIdStr = listingId.toString();
        const isExpanded = expandedListings[listingIdStr] ?? false;
        const isActive = (listing as Record<string, unknown>).listingContactIsActive ?? true;

        // Extract offer information
        const offer = (listing as Record<string, unknown>).offer as number | null | undefined;
        const offerAccepted = (listing as Record<string, unknown>).offerAccepted as boolean | null | undefined;
        const hasOffer = offer != null && offer > 0;
        const listingPrice = listing.price?.toString() ?? "0";

        // Convert PropertyListing to CompactPropertyCard props
        const listingForCard = {
          listingId,
          propertyId:
            typeof listing.propertyId === "bigint"
              ? listing.propertyId
              : BigInt(listing.propertyId ?? 0),
          price: listing.price?.toString() ?? "0",
          listingType: listing.listingType ?? "",
          propertyType: listing.propertyType ?? null,
          bedrooms: listing.bedrooms ?? null,
          bathrooms: listing.bathrooms ? String(listing.bathrooms) : null,
          squareMeter: listing.squareMeter ?? null,
          builtSurfaceArea: listing.builtSurfaceArea ?? null,
          street: listing.street ?? null,
          city: listing.city ?? null,
          referenceNumber:
            ((listing as Record<string, unknown>).referenceNumber as string | null) ?? null,
          title: listing.title ?? listing.street ?? null,
          imageUrl: ((listing as Record<string, unknown>).imageUrl as string | null) ?? null,
          isActive: isActive as boolean,
        };

        // Filter visits for this specific listing
        const listingVisits = visits.filter(
          (v) => v.listingId?.toString() === listingIdStr,
        );

        return (
          <Card
            key={listingContactIdStr}
            className={cn("overflow-hidden", isExpanded && "shadow-none")}
          >
            <CompactPropertyCard
              listing={listingForCard}
              isExpanded={isExpanded}
              onToggle={() => toggleListing(listingId)}
              showActionButtons={true}
              listingContactId={listingContactId}
              canDelete={hasEditContactsPermission}
              canDeactivate={hasEditContactsPermission}
              onDelete={handleDeleteInterest}
              onDeactivate={handleDeactivateInterest}
            />

            {/* Expanded Content - Offer Info + Action Buttons + Grouped Visit Cards */}
            {isExpanded && listingContactId && (
              <VisitsContent
                listingVisits={listingVisits}
                listingId={listingId}
                listingContactId={listingContactId}
                onAppointmentClick={setSelectedAppointment}
                onScheduleVisit={() => handleScheduleVisitForListing(listingId)}
                canEditCalendar={hasEditCalendarPermission}
                canEditContacts={hasEditContactsPermission}
                // Offer props
                offer={offer ?? null}
                offerAccepted={offerAccepted ?? null}
                hasOffer={hasOffer}
                listingPrice={listingPrice}
                // Offer handlers
                onUpdateOfferStatus={(accepted) =>
                  handleUpdateOfferStatus(listingContactId, listingId, accepted)
                }
                onAddOffer={(amount) => handleAddOffer(listingContactId, listingId, amount)}
                onNavigateToArras={() => handleNavigateToArrasContract(listingId, listingContactId)}
                onScheduleFirma={() => {
                  setCreateAppointmentListingId(listingId);
                  setIsCreateAppointmentModalOpen(true);
                }}
                isUpdatingOffer={updatingOfferListingId === listingIdStr}
                isSubmittingOffer={submittingOfferListingId === listingIdStr}
              />
            )}
          </Card>
        );
      })}

      {/* Appointment Detail Sheet */}
      <AppointmentDetailSheet
        appointment={selectedAppointment}
        isOpen={selectedAppointment !== null}
        onClose={() => setSelectedAppointment(null)}
        onUpdate={() => {
          router.refresh();
          void fetchActivityData();
        }}
        onEdit={handleEditAppointment}
        permissions={{
          canEdit: hasEditCalendarPermission,
          canDelete: hasDeleteCalendarPermission,
        }}
        context={{ listingId: undefined, contactId: contactId }}
      />

      {/* Appointment Modal for editing */}
      <AppointmentModal
        open={isModalOpen}
        onOpenChange={closeModal}
        initialData={modalInitialData}
        mode={editMode}
        appointmentId={editingAppointmentId ?? undefined}
        onSuccess={() => router.refresh()}
        addOptimisticEvent={undefined}
        removeOptimisticEvent={undefined}
        updateOptimisticEvent={undefined}
      />

      {/* Appointment Modal for creating new appointments */}
      <AppointmentModal
        open={isCreateAppointmentModalOpen}
        onOpenChange={setIsCreateAppointmentModalOpen}
        initialData={{
          listingId: createAppointmentListingId ?? undefined,
          appointmentType: "Visita",
          contactId: contactId,
        }}
        mode="create"
        onSuccess={handleAppointmentCreateSuccess}
      />

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Eliminar interés"
        description={`¿Estás seguro de que quieres eliminar el interés en "${listingToDelete?.address}"? Esta acción no se puede deshacer.`}
        onConfirm={confirmDeleteInterest}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmVariant="destructive"
      />
    </div>
  );
}

// Offer input mini component
function OfferInputCard({
  label,
  onSubmit,
  isSubmitting,
}: {
  label: string;
  onSubmit: (amount: number) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [inputValue, setInputValue] = useState("");
  const [rawValue, setRawValue] = useState<number>(0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, "");
    const numberValue = numericValue === "" ? 0 : parseInt(numericValue, 10);
    setRawValue(numberValue);
    if (numericValue === "") {
      setInputValue("");
    } else {
      setInputValue(formatCurrency(numberValue));
    }
  };

  const handleSubmit = async () => {
    if (rawValue <= 0) {
      toast.error("Por favor, ingresa una oferta válida");
      return;
    }
    await onSubmit(rawValue);
    setInputValue("");
    setRawValue(0);
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-900">{label}</h4>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="0 €"
          value={inputValue}
          onChange={handleInputChange}
          disabled={isSubmitting}
          className="h-9 min-w-0 flex-1 border-gray-200 bg-white"
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isSubmitting || rawValue <= 0}
          className="h-9 w-9 shrink-0 p-0"
        >
          {isSubmitting ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

// Sub-component for visits content with offer info and actions
function VisitsContent({
  listingVisits,
  listingId: _listingId,
  listingContactId: _listingContactId,
  onAppointmentClick: _onAppointmentClick,
  onScheduleVisit,
  canEditCalendar,
  canEditContacts,
  // Offer props
  offer,
  offerAccepted,
  hasOffer,
  listingPrice,
  // Offer handlers
  onUpdateOfferStatus,
  onAddOffer,
  onNavigateToArras,
  onScheduleFirma,
  isUpdatingOffer,
  isSubmittingOffer,
}: {
  listingVisits: ContactVisitWithDetails[];
  listingId: bigint;
  listingContactId: bigint;
  onAppointmentClick: (appointment: AppointmentData) => void;
  onScheduleVisit: () => void;
  canEditCalendar: boolean;
  canEditContacts: boolean;
  // Offer props
  offer: number | null;
  offerAccepted: boolean | null;
  hasOffer: boolean;
  listingPrice: string;
  // Offer handlers
  onUpdateOfferStatus: (accepted: boolean | null) => Promise<void>;
  onAddOffer: (amount: number) => Promise<void>;
  onNavigateToArras: () => Promise<void>;
  onScheduleFirma: () => void;
  isUpdatingOffer: boolean;
  isSubmittingOffer: boolean;
}) {
  // Sort visits: most recent first
  const sortedVisits = [...listingVisits].sort(
    (a, b) => new Date(b.datetimeStart).getTime() - new Date(a.datetimeStart).getTime(),
  );

  // Convert to timeline format
  const timelineAppointments = sortedVisits.map((visit) => ({
    appointmentId: visit.appointmentId,
    type: visit.type,
    status: visit.status,
    datetimeStart: visit.datetimeStart,
    datetimeEnd: visit.datetimeEnd,
    notes: visit.notes,
  }));

  // Render offer section based on state
  const renderOfferSection = () => {
    // Offer Accepted - show comparison + action buttons
    if (offerAccepted === true && offer) {
      return (
        <div className="space-y-3">
          <OfferComparisonCard offer={offer} listingPrice={listingPrice} />
          {canEditContacts && (
            <div className="space-y-2 border-t pt-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                onClick={onScheduleFirma}
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                Programar Firma
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => void onNavigateToArras()}
              >
                <FileText className="mr-2 h-4 w-4" />
                Generar Contrato Arras
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => {
                  if (confirm("¿Estás seguro de que deseas cancelar esta oferta?")) {
                    void onUpdateOfferStatus(null);
                  }
                }}
                disabled={isUpdatingOffer}
              >
                {isUpdatingOffer ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                Cancelar oferta
              </Button>
            </div>
          )}
        </div>
      );
    }

    // Offer Rejected - show comparison + new offer input + cancel
    if (offerAccepted === false && offer) {
      return (
        <div className="space-y-3">
          <OfferComparisonCard offer={offer} listingPrice={listingPrice} />
          {canEditContacts && (
            <div className="space-y-3 border-t pt-3">
              <OfferInputCard
                label="Nueva Oferta"
                onSubmit={onAddOffer}
                isSubmitting={isSubmittingOffer}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => {
                  if (confirm("¿Estás seguro de que deseas cancelar esta oferta?")) {
                    void onUpdateOfferStatus(null);
                  }
                }}
                disabled={isUpdatingOffer}
              >
                {isUpdatingOffer ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                Cancelar oferta
              </Button>
            </div>
          )}
        </div>
      );
    }

    // Offer Pending (not accepted/rejected) - show comparison + accept/reject buttons
    if (hasOffer && offer) {
      return (
        <div className="space-y-3">
          <OfferComparisonCard offer={offer} listingPrice={listingPrice} />
          {canEditContacts && (
            <div className="flex items-center gap-2 border-t pt-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 min-w-0 flex-1 justify-center gap-2 text-gray-700 shadow-sm transition-all hover:bg-gray-100 hover:text-gray-900 hover:shadow-md"
                onClick={() => void onUpdateOfferStatus(true)}
                disabled={isUpdatingOffer}
              >
                {isUpdatingOffer ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <ThumbsUp className="h-4 w-4" />
                )}
                Aceptar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 min-w-0 flex-1 justify-center gap-2 text-gray-700 shadow-sm transition-all hover:bg-gray-100 hover:text-gray-900 hover:shadow-md"
                onClick={() => void onUpdateOfferStatus(false)}
                disabled={isUpdatingOffer}
              >
                {isUpdatingOffer ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <ThumbsDown className="h-4 w-4" />
                )}
                Rechazar
              </Button>
            </div>
          )}
        </div>
      );
    }

    // No offer - show offer input
    if (canEditContacts) {
      return (
        <OfferInputCard
          label="Registrar Oferta"
          onSubmit={onAddOffer}
          isSubmitting={isSubmittingOffer}
        />
      );
    }

    return null;
  };

  return (
    <div className="space-y-4 border-t border-gray-200 bg-gray-50 p-4">
      {/* Offer Section */}
      {renderOfferSection()}

      {/* Historial header with Add Visit Button */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <h4 className="text-sm font-semibold text-gray-900">Historial de Visitas</h4>
        {canEditCalendar && (
          <Button
            onClick={onScheduleVisit}
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-gray-900"
          >
            <Plus className="h-3.5 w-3.5" />
            Añadir
          </Button>
        )}
      </div>

      {/* Visit History Timeline */}
      <AppointmentTimeline appointments={timelineAppointments} />
    </div>
  );
}