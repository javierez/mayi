"use client";

import { useState, useEffect } from "react";
import { VisitsKPICard } from "./visits-kpi-card";
import { ContactsKPICard } from "./contacts-kpi-card";
import { ExpandableSection } from "./expandable-section";
import {
  AppointmentCard,
  type AppointmentData,
} from "~/components/appointments/appointment-card";
import { CompactContactCard } from "./compact-contact-card";
import { EmptyState } from "./empty-states";
import type {
  ActivityTabContentProps,
  ContactSheetData,
  ContactWithDetails,
  OwnerContact,
} from "~/types/activity";
import { getListingOwnerContact } from "~/server/queries/activity";
import { Button } from "~/components/ui/button";
import { Filter, Check, ChevronDown, X, CalendarPlus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  canEditCalendar,
  canDeleteCalendar,
  canEditContacts,
} from "~/app/actions/permissions/check-permissions";
import { useRouter } from "next/navigation";
import AppointmentModal, {
  useAppointmentModal,
} from "~/components/appointments/appointment-modal";
import { AppointmentDetailSheet } from "~/components/appointments/appointment-detail-sheet";
import { ContactDetailSheet } from "~/components/contactos/contact-detail-sheet";
import { updateOfferStatusAction } from "~/server/actions/listing-contacts";
import { toast } from "sonner";
import {
  Loader,
  FileText,
  ThumbsUp,
  Mail,
  Phone,
  MessageCircle,
} from "lucide-react";
import { OfferComparisonCard } from "~/components/offer-comparison-card";
import { AppointmentTimeline } from "~/components/appointment-timeline";
import { getDealIdAction } from "~/server/actions/arras";
import { navigateToPage } from "~/lib/navigation";

type ActiveView = "visits" | "contacts" | null;
type VisitStatus =
  | "Completed"
  | "Scheduled"
  | "Cancelled"
  | "Rescheduled"
  | "NoShow";

const STATUS_LABELS: Record<VisitStatus, string> = {
  Completed: "Completado",
  Scheduled: "Programado",
  Cancelled: "Cancelado",
  Rescheduled: "Reprogramado",
  NoShow: "No asistió",
};

const TYPE_LABELS: Record<string, string> = {
  Visita: "Visita",
  Reunión: "Reunión",
  Firma: "Firma",
  Cierre: "Cierre",
  Viaje: "Viaje",
};

const CONTACT_FLAG_LABELS: Record<string, string> = {
  hasUpcomingVisit: "Visita Pendiente",
  hasMissedVisit: "Visita Perdida",
  hasCancelledVisit: "Visita Cancelada",
  hasCompletedVisit: "Visita Completada",
  offerAccepted: "Oferta Aceptada",
  offerRejected: "Oferta Rechazada",
  hasOffer: "Oferta Pendiente",
  noVisits: "Sin Visitas",
};

// Enhanced card component for accepted offer contact
interface AcceptedOfferCardProps {
  contact: ContactWithDetails;
  listingId: bigint;
  listingPrice: string;
  ownerContact: OwnerContact | null;
  onUpdate: () => void | Promise<void>;
  permissions: {
    canEditContacts: boolean;
  };
}

function AcceptedOfferCard({
  contact,
  listingId,
  listingPrice,
  ownerContact,
  onUpdate,
  permissions,
}: AcceptedOfferCardProps) {
  const router = useRouter();
  const [isUpdatingOffer, setIsUpdatingOffer] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  const contactName = `${contact.firstName} ${contact.lastName ?? ""}`.trim();

  // Handle opening appointment modal for "Programar Firma"
  const handleScheduleFirma = () => {
    setIsAppointmentModalOpen(true);
  };

  // Handle appointment success
  const handleAppointmentSuccess = async () => {
    await onUpdate();
  };

  // Handle accepting or rejecting an offer
  const handleUpdateOfferStatus = async (accepted: boolean | null) => {
    setIsUpdatingOffer(true);

    try {
      const result = await updateOfferStatusAction(
        contact.listingContactId,
        accepted,
        listingId,
        contact.contactId,
      );

      if (result.success) {
        const message =
          accepted === null
            ? "Decisión revocada correctamente"
            : accepted
              ? "Oferta aceptada correctamente"
              : "Oferta rechazada";
        toast.success(message);

        // Refresh the contact data after successful update
        if (onUpdate) {
          await onUpdate();
        }
      } else {
        toast.error(
          result.error ?? "Error al actualizar el estado de la oferta",
        );
      }
    } catch (error) {
      console.error("Error updating offer status:", error);
      toast.error("Error al actualizar el estado de la oferta");
    } finally {
      setIsUpdatingOffer(false);
    }
  };

  if (!contact.offer) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-lg border bg-white p-3 transition-all hover:shadow-md sm:space-y-4 sm:p-4">
      {/* Header with name and badge */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="min-w-0 truncate text-base font-semibold text-gray-900 sm:text-lg">{contactName}</h3>
        <Badge className="w-fit shrink-0 bg-green-100 text-xs text-green-800">
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" />
            Oferta Aceptada
          </span>
        </Badge>
      </div>

      {/* Buyer Contact Information */}
      <div className="space-y-1.5 border-b pb-3 sm:pb-4">
        {contact.email && (
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => window.open(`mailto:${contact.email}`, "_blank")}
              className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gray-900"
              title="Enviar email"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate underline decoration-dotted underline-offset-2 hover:decoration-solid">
                {contact.email}
              </span>
            </button>
          </div>
        )}

        {contact.phone && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.open(`tel:${contact.phone}`, "_blank")}
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gray-900"
              title="Llamar"
            >
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span className="underline decoration-dotted underline-offset-2 hover:decoration-solid">
                {contact.phone}
              </span>
            </button>
            <button
              onClick={() => {
                const cleanPhone = (contact.phone ?? "").replace(/\D/g, "");
                window.open(`https://wa.me/${cleanPhone}`, "_blank");
              }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-green-600"
              title="Enviar WhatsApp"
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">WhatsApp</span>
            </button>
          </div>
        )}
      </div>

      {/* Offer Comparison with Bars */}
      <div className="border-b pb-3 sm:pb-4">
        <OfferComparisonCard
          offer={contact.offer}
          listingPrice={listingPrice}
        />
      </div>

      {/* Action Buttons */}
      {permissions.canEditContacts && (
        <div className="space-y-2 border-b pb-3 sm:pb-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            onClick={handleScheduleFirma}
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Programar Firma
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            onClick={async () => {
              const result = await getDealIdAction(
                Number(listingId),
                Number(contact.listingContactId),
              );
              if (result.success && result.dealId) {
                navigateToPage(
                  `/propiedades/${listingId}/contrato-arras/${result.dealId}`,
                  router,
                );
              } else {
                toast.error(result.error ?? "No se pudo obtener el deal");
              }
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Generar Contrato Arras
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            onClick={() => {
              if (
                confirm(
                  "¿Estás seguro de que deseas revocar la aceptación de esta oferta?",
                )
              ) {
                void handleUpdateOfferStatus(null);
              }
            }}
            disabled={isUpdatingOffer}
          >
            {isUpdatingOffer ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <X className="mr-2 h-4 w-4" />
            )}
            Revocar Decisión
          </Button>
        </div>
      )}

      {/* Owner Contact Section */}
      {ownerContact && (
        <div className="space-y-1.5">
          <p className="truncate text-sm font-medium text-gray-900">
            {ownerContact.firstName} {ownerContact.lastName ?? ""}
          </p>

          {ownerContact.email && (
            <div className="flex min-w-0 items-center gap-2">
              <button
                onClick={() =>
                  window.open(`mailto:${ownerContact.email}`, "_blank")
                }
                className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gray-900"
                title="Enviar email"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate underline decoration-dotted underline-offset-2 hover:decoration-solid">
                  {ownerContact.email}
                </span>
              </button>
            </div>
          )}

          {ownerContact.phone && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() =>
                  window.open(`tel:${ownerContact.phone}`, "_blank")
                }
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gray-900"
                title="Llamar"
              >
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="underline decoration-dotted underline-offset-2 hover:decoration-solid">
                  {ownerContact.phone}
                </span>
              </button>
              <button
                onClick={() => {
                  const cleanPhone = (ownerContact.phone ?? "").replace(
                    /\D/g,
                    "",
                  );
                  window.open(`https://wa.me/${cleanPhone}`, "_blank");
                }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-green-600"
                title="Enviar WhatsApp"
              >
                <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs">WhatsApp</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Appointment Modal for Firma */}
      <AppointmentModal
        open={isAppointmentModalOpen}
        onOpenChange={setIsAppointmentModalOpen}
        initialData={{
          listingId,
          contactId: contact.contactId,
          appointmentType: "Firma",
        }}
        mode="create"
        onSuccess={handleAppointmentSuccess}
      />
    </div>
  );
}

export function ActivityTabContent({
  visits,
  contacts,
  listingId,
  listingPrice,
  onRefresh,
}: ActivityTabContentProps) {
  const router = useRouter();

  const [activeView, setActiveView] = useState<ActiveView>("visits");
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentData | null>(null);
  const [selectedContact, setSelectedContact] =
    useState<ContactSheetData | null>(null);
  const [ownerContact, setOwnerContact] = useState<OwnerContact | null>(null);

  // Local state for contacts to enable optimistic updates
  const [localContacts, setLocalContacts] =
    useState<ContactWithDetails[]>(contacts);
  const [selectedStatuses, setSelectedStatuses] = useState<Set<VisitStatus>>(
    new Set(["Completed", "Scheduled", "Cancelled", "Rescheduled", "NoShow"]),
  );
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(["Visita", "Reunión", "Firma", "Cierre", "Viaje"]),
  );
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    status: true,
    type: true,
    contactStatus: true,
  });

  // Permission states
  const [hasEditCalendarPermission, setHasEditCalendarPermission] =
    useState<boolean>(false);
  const [hasDeleteCalendarPermission, setHasDeleteCalendarPermission] =
    useState<boolean>(false);
  const [hasEditContactsPermission, setHasEditContactsPermission] =
    useState<boolean>(false);

  // Appointment modal state
  const {
    isOpen: isModalOpen,
    openModal,
    closeModal,
    initialData: modalInitialData,
  } = useAppointmentModal();
  const [editMode, setEditMode] = useState<"create" | "edit">("create");
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    bigint | null
  >(null);

  // Modal state for creating new appointments
  const [isCreateAppointmentModalOpen, setIsCreateAppointmentModalOpen] = useState(false);
  const [createAppointmentInitialData, setCreateAppointmentInitialData] = useState<{
    listingId?: bigint;
    appointmentType?: "Visita" | "Reunión" | "Firma" | "Cierre" | "Viaje";
  }>({});

  // Contact filters - using badge flags instead of status
  const [selectedContactFlags, setSelectedContactFlags] = useState<Set<string>>(
    new Set([
      "hasUpcomingVisit",
      "hasMissedVisit",
      "hasCancelledVisit",
      "hasCompletedVisit",
      "offerAccepted",
      "offerRejected",
      "hasOffer",
      "noVisits",
    ]),
  );

  // Contact view mode - switch between accepted offer view and all contacts
  const [contactViewMode, setContactViewMode] = useState<"accepted" | "all">(
    "all",
  );

  // Visit view mode - switch between all visits and timeline view for accepted offer
  const [visitViewMode, setVisitViewMode] = useState<"all" | "timeline">("all");

  // Sync local contacts with prop changes
  useEffect(() => {
    setLocalContacts(contacts);
  }, [contacts]);

  // Handler to refresh contacts after updates (offer status, deactivation, etc.)
  const handleContactUpdate = async () => {
    // Trigger a router refresh to get updated contact data from server
    router.refresh();

    // Also refetch the activity data from the parent component
    if (onRefresh) {
      await onRefresh();
    }
  };

  // Fetch user permissions on component mount
  useEffect(() => {
    const fetchPermissions = async () => {
      console.log("🔐 [Activity] Fetching permissions...");
      try {
        const [editCalendarPerm, deleteCalendarPerm, editContactsPerm] =
          await Promise.all([
            canEditCalendar(),
            canDeleteCalendar(),
            canEditContacts(),
          ]);
        console.log("🔐 [Activity] Permissions fetched:", {
          editCalendar: editCalendarPerm,
          deleteCalendar: deleteCalendarPerm,
          editContacts: editContactsPerm,
        });
        setHasEditCalendarPermission(editCalendarPerm);
        setHasDeleteCalendarPermission(deleteCalendarPerm);
        setHasEditContactsPermission(editContactsPerm);
      } catch (error) {
        console.error("❌ [Activity] Error fetching permissions:", error);
        setHasEditCalendarPermission(false);
        setHasDeleteCalendarPermission(false);
        setHasEditContactsPermission(false);
      }
    };

    void fetchPermissions();
  }, []); // Run once on mount

  // Fetch owner contact when component mounts
  useEffect(() => {
    const fetchOwnerContact = async () => {
      try {
        const owner = await getListingOwnerContact(listingId);
        setOwnerContact(owner);
      } catch (error) {
        console.error("Error fetching owner contact:", error);
        setOwnerContact(null);
      }
    };

    void fetchOwnerContact();
  }, [listingId]);

  // Filter visits based on selected statuses and types
  const filteredVisits = visits.filter(
    (v) =>
      selectedStatuses.has(v.status as VisitStatus) &&
      selectedTypes.has(v.type ?? ""),
  );

  // Group visits by category
  const urgentVisits = filteredVisits
    .filter((v) => v.status === "NoShow" || v.status === "Rescheduled")
    .sort((a, b) => {
      // Most recent first for urgent items
      return (
        new Date(b.datetimeStart).getTime() -
        new Date(a.datetimeStart).getTime()
      );
    });

  const activeVisits = filteredVisits
    .filter((v) => v.status === "Scheduled")
    .sort((a, b) => {
      // Soonest first for upcoming visits
      return (
        new Date(a.datetimeStart).getTime() -
        new Date(b.datetimeStart).getTime()
      );
    });

  const completedVisits = filteredVisits
    .filter((v) => v.status === "Completed")
    .sort((a, b) => {
      // Most recent first for completed
      return (
        new Date(b.datetimeStart).getTime() -
        new Date(a.datetimeStart).getTime()
      );
    });

  const cancelledVisits = filteredVisits
    .filter((v) => v.status === "Cancelled")
    .sort((a, b) => {
      // Most recent first for cancelled
      return (
        new Date(b.datetimeStart).getTime() -
        new Date(a.datetimeStart).getTime()
      );
    });

  // KPI counts (unfiltered - show total counts)
  const allCompletedVisits = visits.filter((v) => v.status === "Completed");
  const allScheduledVisits = visits.filter((v) => v.status === "Scheduled");
  const allCancelledVisits = visits.filter((v) => v.status === "Cancelled");

  // Filter contacts by badge flags
  const filteredContacts = localContacts.filter((c) => {
    // Determine which flag applies to this contact (using same logic as badge in contact-detail-sheet)
    let contactFlag: string;

    const contactName = `${c.firstName} ${c.lastName ?? ""}`.trim();

    // Log all flags for this contact
    console.log(`🏷️ [Contact Label] ${contactName} - All flags:`, {
      hasUpcomingVisit: c.hasUpcomingVisit,
      offerAccepted: c.offerAccepted,
      hasOffer: c.hasOffer,
      offer: c.offer,
      hasMissedVisit: c.hasMissedVisit,
      hasCancelledVisit: c.hasCancelledVisit,
      hasCompletedVisit: c.hasCompletedVisit,
      visitCount: c.visitCount,
    });

    if (c.hasUpcomingVisit) {
      contactFlag = "hasUpcomingVisit";
      console.log(`   ✅ Assigned: hasUpcomingVisit (1st priority - upcoming visit scheduled)`);
    } else if (c.offerAccepted === true) {
      contactFlag = "offerAccepted";
      console.log(`   ✅ Assigned: offerAccepted (2nd priority - deal closing)`);
    } else if (c.offerAccepted === false) {
      contactFlag = "offerRejected";
      console.log(`   ✅ Assigned: offerRejected (3rd priority - needs follow-up)`);
    } else if (c.hasOffer) {
      contactFlag = "hasOffer";
      console.log(`   ✅ Assigned: hasOffer (4th priority - pending offer, offerAccepted=${c.offerAccepted})`);
    } else if (c.hasMissedVisit && !c.hasCancelledVisit) {
      contactFlag = "hasMissedVisit";
      console.log(`   ✅ Assigned: hasMissedVisit (5th priority - no-show without cancellation)`);
    } else if (c.hasCancelledVisit) {
      contactFlag = "hasCancelledVisit";
      console.log(`   ✅ Assigned: hasCancelledVisit (6th priority - needs rescheduling)`);
    } else if (c.hasCompletedVisit) {
      contactFlag = "hasCompletedVisit";
      console.log(`   ✅ Assigned: hasCompletedVisit (7th priority - warm lead)`);
    } else {
      // No visits at all
      contactFlag = "noVisits";
      console.log(`   ✅ Assigned: noVisits (default/fallback - cold lead)`);
    }

    return selectedContactFlags.has(contactFlag);
  });

  // Sorting logic for contacts - Sales funnel priority
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    // 1. HIGHEST: Offer accepted (deal closing - highest priority)
    const aOfferAccepted = a.offerAccepted === true;
    const bOfferAccepted = b.offerAccepted === true;
    if (aOfferAccepted !== bOfferAccepted) return aOfferAccepted ? -1 : 1;

    // 2. HIGH: Has pending offer (potential deal in progress)
    const aHasPendingOffer = a.hasOffer && a.offerAccepted === null;
    const bHasPendingOffer = b.hasOffer && b.offerAccepted === null;
    if (aHasPendingOffer !== bHasPendingOffer) return aHasPendingOffer ? -1 : 1;

    // 3. IMPORTANT: Offer rejected (needs follow-up or re-engagement)
    const aOfferRejected = a.offerAccepted === false;
    const bOfferRejected = b.offerAccepted === false;
    if (aOfferRejected !== bOfferRejected) return aOfferRejected ? -1 : 1;

    // 4. URGENT: Has upcoming visit (scheduled, needs preparation)
    if (a.hasUpcomingVisit !== b.hasUpcomingVisit)
      return a.hasUpcomingVisit ? -1 : 1;

    // 5. ATTENTION: Has missed visit (needs immediate follow-up)
    if (a.hasMissedVisit !== b.hasMissedVisit) return a.hasMissedVisit ? -1 : 1;

    // 6. ATTENTION: Has cancelled visit (needs rescheduling)
    if (a.hasCancelledVisit !== b.hasCancelledVisit)
      return a.hasCancelledVisit ? -1 : 1;

    // 7. ENGAGEMENT: Visit count (more visits = warmer lead)
    if (a.visitCount !== b.visitCount) return b.visitCount - a.visitCount;

    // 8. RECENCY: Most recent first (fresher leads)
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  // Calculate KPI metrics based on badge states
  // Contacts with visits (Pendiente): hasUpcomingVisit
  const contactsWithVisits = localContacts.filter((c) => c.hasUpcomingVisit);

  // Contacts in offer stage (En Negociación): hasCompletedVisit OR hasOffer OR offerAccepted OR offerRejected
  const contactsInOfferStage = localContacts.filter(
    (c) =>
      c.hasCompletedVisit ||
      c.hasOffer ||
      c.offerAccepted === true ||
      c.offerAccepted === false,
  );

  // Contacts without visits (Sin Actividad): hasCancelledVisit OR hasMissedVisit OR (no visits at all)
  const contactsWithoutVisits = localContacts.filter(
    (c) =>
      !c.hasUpcomingVisit &&
      !c.hasCompletedVisit &&
      !c.hasOffer &&
      c.offerAccepted === null,
  );

  // New contacts with same sorting
  const newContacts = sortedContacts.filter((c) => c.isNew);

  // Check if any offer is accepted in the list (for ghosted effect)
  const hasAcceptedOffer = sortedContacts.some((c) => c.offerAccepted === true);

  // Find the contact with accepted offer (there will only be one)
  const acceptedOfferContact = sortedContacts.find(
    (c) => c.offerAccepted === true,
  );

  // Set default view mode based on whether there's an accepted offer
  useEffect(() => {
    if (hasAcceptedOffer) {
      setContactViewMode("accepted");
      setVisitViewMode("timeline"); // Default to timeline view when there's an accepted offer
    } else {
      setContactViewMode("all");
      setVisitViewMode("all");
    }
  }, [hasAcceptedOffer]);

  // Filter visits for accepted offer contact timeline
  const acceptedOfferVisits = acceptedOfferContact
    ? visits
        .filter(
          (v) =>
            v.contactId?.toString() ===
            acceptedOfferContact.contactId.toString(),
        )
        .sort(
          (a, b) =>
            new Date(a.datetimeStart).getTime() -
            new Date(b.datetimeStart).getTime(),
        ) // Chronological order
    : [];

  const handleVisitsClick = () => {
    setActiveView(activeView === "visits" ? null : "visits");
  };

  const handleContactsClick = () => {
    setActiveView(activeView === "contacts" ? null : "contacts");
  };

  const toggleStatus = (status: VisitStatus) => {
    const newStatuses = new Set(selectedStatuses);
    if (newStatuses.has(status)) {
      newStatuses.delete(status);
    } else {
      newStatuses.add(status);
    }
    setSelectedStatuses(newStatuses);
  };

  const toggleType = (type: string) => {
    const newTypes = new Set(selectedTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setSelectedTypes(newTypes);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const toggleContactFlag = (flag: string) => {
    const newFlags = new Set(selectedContactFlags);
    if (newFlags.has(flag)) {
      newFlags.delete(flag);
    } else {
      newFlags.add(flag);
    }
    setSelectedContactFlags(newFlags);
  };

  const clearFilters = () => {
    setSelectedStatuses(
      new Set(["Completed", "Scheduled", "Cancelled", "Rescheduled", "NoShow"]),
    );
    setSelectedTypes(
      new Set(["Visita", "Reunión", "Firma", "Cierre", "Viaje"]),
    );
  };

  const clearContactFilters = () => {
    setSelectedContactFlags(
      new Set([
        "hasUpcomingVisit",
        "hasMissedVisit",
        "hasCancelledVisit",
        "hasCompletedVisit",
        "offerAccepted",
        "offerRejected",
        "hasOffer",
        "noVisits",
      ]),
    );
  };

  const activeFilterCount =
    5 - selectedStatuses.size + (5 - selectedTypes.size); // Count deselected items

  const activeContactFilterCount = 8 - selectedContactFlags.size; // Count deselected items (8 total flags now)

  // Get unique types from visits
  const availableTypes = Array.from(
    new Set(visits.map((v) => v.type).filter((t): t is string => t !== null)),
  );

  // All available contact flags (static list)
  const availableContactFlags = [
    "hasUpcomingVisit",
    "hasMissedVisit",
    "hasCancelledVisit",
    "hasCompletedVisit",
    "offerAccepted",
    "offerRejected",
    "hasOffer",
    "noVisits",
  ];

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
  const handleScheduleVisit = () => {
    setCreateAppointmentInitialData({
      listingId,
      appointmentType: "Visita",
    });
    setIsCreateAppointmentModalOpen(true);
  };

  // Handle appointment creation success
  const handleAppointmentCreateSuccess = async () => {
    // Refresh the page data
    router.refresh();
    if (onRefresh) {
      await onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Navigation Cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:gap-4 md:grid-cols-2">
        <VisitsKPICard
          completedCount={allCompletedVisits.length}
          scheduledCount={allScheduledVisits.length}
          cancelledCount={allCancelledVisits.length}
          totalCount={visits.length}
          isActive={activeView === "visits"}
          onClick={handleVisitsClick}
          listingId={listingId}
          onScheduleVisit={handleScheduleVisit}
        />
        <ContactsKPICard
          contactsWithVisitsCount={contactsWithVisits.length}
          contactsWithoutVisitsCount={contactsWithoutVisits.length}
          contactsInOfferStageCount={contactsInOfferStage.length}
          totalContactsCount={localContacts.length}
          isActive={activeView === "contacts"}
          onClick={handleContactsClick}
          listingId={listingId}
          onContactCreated={handleContactUpdate}
        />
      </div>

      {/* Visits Content - shown when visits card is active */}
      {activeView === "visits" && (
        <div className="animate-in fade-in space-y-4 duration-300">
          {/* Toggle between all visits and timeline view */}
          {hasAcceptedOffer && acceptedOfferContact && (
            <div className="mb-4 flex items-center gap-1 overflow-x-auto border-b border-gray-200 sm:gap-2">
              <button
                onClick={() => setVisitViewMode("all")}
                className={`whitespace-nowrap border-b-2 px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                  visitViewMode === "all"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Todas las Visitas
              </button>
              <button
                onClick={() => setVisitViewMode("timeline")}
                className={`whitespace-nowrap border-b-2 px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                  visitViewMode === "timeline"
                    ? "border-green-600 text-green-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Oferta Aceptada
              </button>
            </div>
          )}

          {/* Filter Button - Only show in "all" visits view */}
          {visitViewMode === "all" && (
            <div className="flex justify-end">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="relative h-8">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                    {activeFilterCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 rounded-sm px-1 font-normal"
                      >
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-0">
                  <div className="flex flex-col">
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-6 p-4">
                        {/* Status Filter Category */}
                        <div className="space-y-2">
                          <div
                            className="flex cursor-pointer items-center justify-between"
                            onClick={() => toggleCategory("status")}
                          >
                            <h5 className="text-sm font-medium text-muted-foreground">
                              Estado
                            </h5>
                            <ChevronDown
                              className={`h-4 w-4 text-muted-foreground transition-transform ${expandedCategories.status ? "rotate-180 transform" : ""}`}
                            />
                          </div>
                          {expandedCategories.status && (
                            <div className="space-y-1">
                              {(
                                Object.entries(STATUS_LABELS) as [
                                  VisitStatus,
                                  string,
                                ][]
                              ).map(([status, label]) => (
                                <div
                                  key={status}
                                  className="flex cursor-pointer items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent"
                                  onClick={() => toggleStatus(status)}
                                >
                                  <div
                                    className={`flex h-4 w-4 items-center justify-center rounded border ${selectedStatuses.has(status) ? "border-primary bg-primary" : "border-input"}`}
                                  >
                                    {selectedStatuses.has(status) && (
                                      <Check className="h-3 w-3 text-primary-foreground" />
                                    )}
                                  </div>
                                  <span className="text-sm">{label}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Type Filter Category */}
                        <div className="space-y-2">
                          <div
                            className="flex cursor-pointer items-center justify-between"
                            onClick={() => toggleCategory("type")}
                          >
                            <h5 className="text-sm font-medium text-muted-foreground">
                              Tipo
                            </h5>
                            <ChevronDown
                              className={`h-4 w-4 text-muted-foreground transition-transform ${expandedCategories.type ? "rotate-180 transform" : ""}`}
                            />
                          </div>
                          {expandedCategories.type && (
                            <div className="space-y-1">
                              {availableTypes.map((type) => (
                                <div
                                  key={type}
                                  className="flex cursor-pointer items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent"
                                  onClick={() => toggleType(type)}
                                >
                                  <div
                                    className={`flex h-4 w-4 items-center justify-center rounded border ${selectedTypes.has(type) ? "border-primary bg-primary" : "border-input"}`}
                                  >
                                    {selectedTypes.has(type) && (
                                      <Check className="h-3 w-3 text-primary-foreground" />
                                    )}
                                  </div>
                                  <span className="text-sm">
                                    {TYPE_LABELS[type] ?? type}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                    {activeFilterCount > 0 && (
                      <div className="border-t p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="h-7 w-full text-xs"
                        >
                          <X className="mr-1.5 h-3.5 w-3.5" />
                          Borrar filtros
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Timeline view for accepted offer */}
          {visitViewMode === "timeline" && acceptedOfferContact && (
            <div>
              <div className="mb-4">
                <h3 className="mb-1 text-sm font-medium text-gray-900">
                  Historial de {acceptedOfferContact.firstName}{" "}
                  {acceptedOfferContact.lastName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {acceptedOfferVisits.length}{" "}
                  {acceptedOfferVisits.length === 1 ? "visita" : "visitas"}{" "}
                  registradas
                </p>
              </div>
              <AppointmentTimeline appointments={acceptedOfferVisits} />
            </div>
          )}

          {/* All visits view */}
          {visitViewMode === "all" && (
            <div className="space-y-6">
              {/* No visits at all */}
              {filteredVisits.length === 0 && (
                <EmptyState type="completed-visits" />
              )}

              {/* 🔴 Urgent/Action Required Section */}
              {urgentVisits.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-700">
                      Requieren Atención ({urgentVisits.length})
                    </h3>
                  </div>
                  <div className="space-y-3 pl-4">
                    {urgentVisits.map((visit) => {
                      const appointmentData: AppointmentData = {
                        appointmentId: visit.appointmentId,
                        type: visit.type ?? "",
                        status: (visit.status ?? "Completed") as
                          | "Completed"
                          | "Scheduled"
                          | "Cancelled"
                          | "Rescheduled"
                          | "NoShow",
                        datetimeStart: visit.datetimeStart,
                        datetimeEnd: visit.datetimeEnd,
                        tripTimeMinutes: visit.tripTimeMinutes ?? undefined,
                        notes: visit.notes ?? undefined,
                        contactId: visit.contactId ?? undefined,
                        contactName:
                          `${visit.contactFirstName ?? ""} ${visit.contactLastName ?? ""}`.trim(),
                        propertyAddress: undefined,
                        agentName: visit.agentName ?? undefined,
                        isOptimistic: false,
                      };

                      return (
                        <AppointmentCard
                          key={visit.appointmentId.toString()}
                          appointment={appointmentData}
                          onClick={(appointment) => {
                            console.log(
                              "🔍 [Activity] Appointment clicked:",
                              appointment.appointmentId.toString(),
                            );
                            setSelectedAppointment(appointment);
                          }}
                          navigateToVisit={false}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 🟢 Active/Upcoming Visits Section */}
              {activeVisits.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                      Próximas Visitas ({activeVisits.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {activeVisits.map((visit) => {
                      const appointmentData: AppointmentData = {
                        appointmentId: visit.appointmentId,
                        type: visit.type ?? "",
                        status: (visit.status ?? "Completed") as
                          | "Completed"
                          | "Scheduled"
                          | "Cancelled"
                          | "Rescheduled"
                          | "NoShow",
                        datetimeStart: visit.datetimeStart,
                        datetimeEnd: visit.datetimeEnd,
                        tripTimeMinutes: visit.tripTimeMinutes ?? undefined,
                        notes: visit.notes ?? undefined,
                        contactId: visit.contactId ?? undefined,
                        contactName:
                          `${visit.contactFirstName ?? ""} ${visit.contactLastName ?? ""}`.trim(),
                        propertyAddress: undefined,
                        agentName: visit.agentName ?? undefined,
                        isOptimistic: false,
                      };

                      return (
                        <AppointmentCard
                          key={visit.appointmentId.toString()}
                          appointment={appointmentData}
                          onClick={(appointment) => {
                            console.log(
                              "🔍 [Activity] Appointment clicked:",
                              appointment.appointmentId.toString(),
                            );
                            setSelectedAppointment(appointment);
                          }}
                          navigateToVisit={false}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ✓ Completed Visits Section - Collapsible */}
              {completedVisits.length > 0 && (
                <ExpandableSection
                  title="Completadas"
                  count={completedVisits.length}
                  defaultExpanded={false}
                  storageKey={`activity-completed-visits-${listingId}`}
                >
                  <div className="space-y-3">
                    {completedVisits.map((visit) => {
                      const appointmentData: AppointmentData = {
                        appointmentId: visit.appointmentId,
                        type: visit.type ?? "",
                        status: (visit.status ?? "Completed") as
                          | "Completed"
                          | "Scheduled"
                          | "Cancelled"
                          | "Rescheduled"
                          | "NoShow",
                        datetimeStart: visit.datetimeStart,
                        datetimeEnd: visit.datetimeEnd,
                        tripTimeMinutes: visit.tripTimeMinutes ?? undefined,
                        notes: visit.notes ?? undefined,
                        contactId: visit.contactId ?? undefined,
                        contactName:
                          `${visit.contactFirstName ?? ""} ${visit.contactLastName ?? ""}`.trim(),
                        propertyAddress: undefined,
                        agentName: visit.agentName ?? undefined,
                        isOptimistic: false,
                      };

                      return (
                        <AppointmentCard
                          key={visit.appointmentId.toString()}
                          appointment={appointmentData}
                          onClick={(appointment) => {
                            console.log(
                              "🔍 [Activity] Appointment clicked:",
                              appointment.appointmentId.toString(),
                            );
                            setSelectedAppointment(appointment);
                          }}
                          navigateToVisit={false}
                        />
                      );
                    })}
                  </div>
                </ExpandableSection>
              )}

              {/* ✕ Cancelled Visits Section - Collapsible */}
              {cancelledVisits.length > 0 && (
                <ExpandableSection
                  title="Canceladas"
                  count={cancelledVisits.length}
                  defaultExpanded={false}
                  storageKey={`activity-cancelled-visits-${listingId}`}
                >
                  <div className="space-y-3">
                    {cancelledVisits.map((visit) => {
                      const appointmentData: AppointmentData = {
                        appointmentId: visit.appointmentId,
                        type: visit.type ?? "",
                        status: (visit.status ?? "Completed") as
                          | "Completed"
                          | "Scheduled"
                          | "Cancelled"
                          | "Rescheduled"
                          | "NoShow",
                        datetimeStart: visit.datetimeStart,
                        datetimeEnd: visit.datetimeEnd,
                        tripTimeMinutes: visit.tripTimeMinutes ?? undefined,
                        notes: visit.notes ?? undefined,
                        contactId: visit.contactId ?? undefined,
                        contactName:
                          `${visit.contactFirstName ?? ""} ${visit.contactLastName ?? ""}`.trim(),
                        propertyAddress: undefined,
                        agentName: visit.agentName ?? undefined,
                        isOptimistic: false,
                      };

                      return (
                        <AppointmentCard
                          key={visit.appointmentId.toString()}
                          appointment={appointmentData}
                          onClick={(appointment) => {
                            console.log(
                              "🔍 [Activity] Appointment clicked:",
                              appointment.appointmentId.toString(),
                            );
                            setSelectedAppointment(appointment);
                          }}
                          navigateToVisit={false}
                        />
                      );
                    })}
                  </div>
                </ExpandableSection>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contacts Content - shown when contacts card is active */}
      {activeView === "contacts" && (
        <div className="animate-in fade-in space-y-4 duration-300">
          {/* Tab Toggle - Only show when there's an accepted offer */}
          {hasAcceptedOffer && (
            <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 sm:gap-2">
              <button
                onClick={() => setContactViewMode("accepted")}
                className={`whitespace-nowrap border-b-2 px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                  contactViewMode === "accepted"
                    ? "border-green-600 text-green-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Oferta Aceptada
              </button>
              <button
                onClick={() => setContactViewMode("all")}
                className={`whitespace-nowrap border-b-2 px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                  contactViewMode === "all"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Todos los Contactos
              </button>
            </div>
          )}

          {/* Contact Filter Button - Only show in "all" view */}
          {contactViewMode === "all" && (
            <div className="flex justify-end">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="relative h-8">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                    {activeContactFilterCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 rounded-sm px-1 font-normal"
                      >
                        {activeContactFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-0">
                  <div className="flex flex-col">
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-6 p-4">
                        {/* Contact Badge Filters */}
                        <div className="space-y-2">
                          <div
                            className="flex cursor-pointer items-center justify-between"
                            onClick={() => toggleCategory("contactStatus")}
                          >
                            <h5 className="text-sm font-medium text-muted-foreground">
                              Estado de Visita
                            </h5>
                            <ChevronDown
                              className={`h-4 w-4 text-muted-foreground transition-transform ${expandedCategories.contactStatus ? "rotate-180 transform" : ""}`}
                            />
                          </div>
                          {expandedCategories.contactStatus && (
                            <div className="space-y-1">
                              {availableContactFlags.map((flag) => (
                                <div
                                  key={flag}
                                  className="flex cursor-pointer items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent"
                                  onClick={() => toggleContactFlag(flag)}
                                >
                                  <div
                                    className={`flex h-4 w-4 items-center justify-center rounded border ${selectedContactFlags.has(flag) ? "border-primary bg-primary" : "border-input"}`}
                                  >
                                    {selectedContactFlags.has(flag) && (
                                      <Check className="h-3 w-3 text-primary-foreground" />
                                    )}
                                  </div>
                                  <span className="text-sm">
                                    {CONTACT_FLAG_LABELS[flag]}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                    {activeContactFilterCount > 0 && (
                      <div className="border-t p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearContactFilters}
                          className="h-7 w-full text-xs"
                        >
                          <X className="mr-1.5 h-3.5 w-3.5" />
                          Borrar filtros
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Accepted Offer View */}
          {contactViewMode === "accepted" && acceptedOfferContact && (
            <AcceptedOfferCard
              contact={acceptedOfferContact}
              listingId={listingId}
              listingPrice={listingPrice}
              ownerContact={ownerContact}
              onUpdate={handleContactUpdate}
              permissions={{
                canEditContacts: hasEditContactsPermission,
              }}
            />
          )}

          {/* All Contacts View */}
          {contactViewMode === "all" && (
            <div className="space-y-6">
              {/* No contacts at all */}
              {filteredContacts.length === 0 && (
                <EmptyState type="new-contacts" />
              )}

              {/* New Contacts Section */}
              {newContacts.length > 0 && (
                <div className="space-y-2">
                  {newContacts.map((contact) => (
                    <CompactContactCard
                      key={contact.contactId.toString()}
                      listingContactId={contact.listingContactId}
                      contact={{
                        contactId: contact.contactId,
                        firstName: contact.firstName,
                        lastName: contact.lastName,
                        email: contact.email,
                        phone: contact.phone,
                        createdAt: contact.createdAt,
                      }}
                      listingContact={{
                        source: contact.source,
                        status: contact.status,
                        contactType: contact.contactType as
                          | "buyer"
                          | "owner"
                          | "viewer",
                      }}
                      hasUpcomingVisit={contact.hasUpcomingVisit}
                      upcomingAppointmentId={contact.upcomingAppointmentId}
                      missedAppointmentId={contact.missedAppointmentId}
                      hasMissedVisit={contact.hasMissedVisit}
                      hasCompletedVisit={contact.hasCompletedVisit}
                      hasCancelledVisit={contact.hasCancelledVisit}
                      hasOffer={contact.hasOffer}
                      offer={contact.offer}
                      offerAccepted={contact.offerAccepted}
                      visitCount={contact.visitCount}
                      listingId={listingId}
                      onContactClick={setSelectedContact}
                      hasAcceptedOfferInList={hasAcceptedOffer}
                    />
                  ))}
                </div>
              )}

              {/* All Contacts Section */}
              {sortedContacts.length > newContacts.length && (
                <ExpandableSection
                  title="Todos los Contactos"
                  count={sortedContacts.length}
                  defaultExpanded={false}
                  storageKey={`activity-all-contacts-${listingId}`}
                >
                  <div className="space-y-2">
                    {sortedContacts.map((contact) => (
                      <CompactContactCard
                        key={contact.contactId.toString()}
                        listingContactId={contact.listingContactId}
                        contact={{
                          contactId: contact.contactId,
                          firstName: contact.firstName,
                          lastName: contact.lastName,
                          email: contact.email,
                          phone: contact.phone,
                          createdAt: contact.createdAt,
                        }}
                        listingContact={{
                          source: contact.source,
                          status: contact.status,
                          contactType: contact.contactType as
                            | "buyer"
                            | "owner"
                            | "viewer",
                        }}
                        hasUpcomingVisit={contact.hasUpcomingVisit}
                        upcomingAppointmentId={contact.upcomingAppointmentId}
                        missedAppointmentId={contact.missedAppointmentId}
                        hasMissedVisit={contact.hasMissedVisit}
                        hasCompletedVisit={contact.hasCompletedVisit}
                        hasCancelledVisit={contact.hasCancelledVisit}
                        hasOffer={contact.hasOffer}
                        offer={contact.offer}
                        offerAccepted={contact.offerAccepted}
                        visitCount={contact.visitCount}
                        listingId={listingId}
                        onContactClick={setSelectedContact}
                        hasAcceptedOfferInList={hasAcceptedOffer}
                      />
                    ))}
                  </div>
                </ExpandableSection>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contact Detail Sheet */}
      <ContactDetailSheet
        contact={selectedContact}
        isOpen={selectedContact !== null}
        onClose={() => setSelectedContact(null)}
        onUpdate={handleContactUpdate}
        listingId={listingId}
        listingPrice={listingPrice}
        ownerContact={ownerContact}
        permissions={{
          canEditContacts: hasEditContactsPermission,
        }}
      />

      {/* Appointment Detail Sheet */}
      <AppointmentDetailSheet
        appointment={selectedAppointment}
        isOpen={selectedAppointment !== null}
        onClose={() => setSelectedAppointment(null)}
        onUpdate={async () => {
          router.refresh();
          if (onRefresh) {
            await onRefresh();
          }
        }}
        onEdit={handleEditAppointment}
        permissions={{
          canEdit: hasEditCalendarPermission,
          canDelete: hasDeleteCalendarPermission,
        }}
        context={{
          listingId: listingId,
        }}
      />

      {/* Appointment Modal for editing */}
      <AppointmentModal
        open={isModalOpen}
        onOpenChange={closeModal}
        initialData={modalInitialData}
        mode={editMode}
        appointmentId={editingAppointmentId ?? undefined}
        onSuccess={() => {
          // Trigger a page refresh to get updated data
          router.refresh();
        }}
        // No optimistic updates for activity tab - undefined means modal won't use optimistic updates
        addOptimisticEvent={undefined}
        removeOptimisticEvent={undefined}
        updateOptimisticEvent={undefined}
      />

      {/* Appointment Modal for creating new appointments */}
      <AppointmentModal
        open={isCreateAppointmentModalOpen}
        onOpenChange={setIsCreateAppointmentModalOpen}
        initialData={createAppointmentInitialData}
        mode="create"
        onSuccess={handleAppointmentCreateSuccess}
      />
    </div>
  );
}
