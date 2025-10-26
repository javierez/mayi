"use client";

import { useState, useEffect } from "react";
import { VisitsKPICard } from "./visits-kpi-card";
import { ContactsKPICard } from "./contacts-kpi-card";
import { ExpandableSection } from "./expandable-section";
import { AppointmentCard, type AppointmentData } from "~/components/appointments/appointment-card";
import { CompactContactCard } from "./compact-contact-card";
import { EmptyState } from "./empty-states";
import type { ActivityTabContentProps, ContactSheetData, ContactWithDetails, OwnerContact } from "~/types/activity";
import { getListingOwnerContact } from "~/server/queries/activity";
import { Button } from "~/components/ui/button";
import { Filter, Check, ChevronDown, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { canEditCalendar, canDeleteCalendar, canEditContacts } from "~/app/actions/permissions/check-permissions";
import { useRouter } from "next/navigation";
import AppointmentModal, { useAppointmentModal } from "~/components/appointments/appointment-modal";
import { AppointmentDetailSheet } from "~/components/appointments/appointment-detail-sheet";
import { ContactDetailSheet } from "~/components/contactos/contact-detail-sheet";

type ActiveView = "visits" | "contacts" | null;
type VisitStatus = "Completed" | "Scheduled" | "Cancelled" | "Rescheduled" | "NoShow";

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

export function ActivityTabContent({
  visits,
  contacts,
  listingId,
  listingPrice,
  onRefresh,
}: ActivityTabContentProps) {
  const router = useRouter();

  const [activeView, setActiveView] = useState<ActiveView>("visits");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactSheetData | null>(null);
  const [ownerContact, setOwnerContact] = useState<OwnerContact | null>(null);

  // Local state for contacts to enable optimistic updates
  const [localContacts, setLocalContacts] = useState<ContactWithDetails[]>(contacts);
  const [selectedStatuses, setSelectedStatuses] = useState<Set<VisitStatus>>(
    new Set(["Completed", "Scheduled", "Cancelled", "Rescheduled", "NoShow"])
  );
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(["Visita", "Reunión", "Firma", "Cierre", "Viaje"])
  );
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    status: true,
    type: true,
    contactStatus: true,
  });

  // Permission states
  const [hasEditCalendarPermission, setHasEditCalendarPermission] = useState<boolean>(false);
  const [hasDeleteCalendarPermission, setHasDeleteCalendarPermission] = useState<boolean>(false);
  const [hasEditContactsPermission, setHasEditContactsPermission] = useState<boolean>(false);

  // Appointment modal state
  const {
    isOpen: isModalOpen,
    openModal,
    closeModal,
    initialData: modalInitialData,
  } = useAppointmentModal();
  const [editMode, setEditMode] = useState<"create" | "edit">("create");
  const [editingAppointmentId, setEditingAppointmentId] = useState<bigint | null>(null);

  // Contact filters - using badge flags instead of status
  const [selectedContactFlags, setSelectedContactFlags] = useState<Set<string>>(
    new Set(["hasUpcomingVisit", "hasMissedVisit", "hasCancelledVisit", "hasCompletedVisit", "offerAccepted", "offerRejected", "hasOffer", "noVisits"])
  );

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
        const [editCalendarPerm, deleteCalendarPerm, editContactsPerm] = await Promise.all([
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
  const filteredVisits = visits.filter((v) =>
    selectedStatuses.has(v.status as VisitStatus) && selectedTypes.has(v.type ?? "")
  );

  // Group visits by category
  const urgentVisits = filteredVisits.filter(
    (v) => v.status === "NoShow" || v.status === "Rescheduled"
  ).sort((a, b) => {
    // Most recent first for urgent items
    return new Date(b.datetimeStart).getTime() - new Date(a.datetimeStart).getTime();
  });

  const activeVisits = filteredVisits.filter(
    (v) => v.status === "Scheduled"
  ).sort((a, b) => {
    // Soonest first for upcoming visits
    return new Date(a.datetimeStart).getTime() - new Date(b.datetimeStart).getTime();
  });

  const completedVisits = filteredVisits.filter(
    (v) => v.status === "Completed"
  ).sort((a, b) => {
    // Most recent first for completed
    return new Date(b.datetimeStart).getTime() - new Date(a.datetimeStart).getTime();
  });

  const cancelledVisits = filteredVisits.filter(
    (v) => v.status === "Cancelled"
  ).sort((a, b) => {
    // Most recent first for cancelled
    return new Date(b.datetimeStart).getTime() - new Date(a.datetimeStart).getTime();
  });

  // KPI counts (unfiltered - show total counts)
  const allCompletedVisits = visits.filter((v) => v.status === "Completed");
  const allScheduledVisits = visits.filter((v) => v.status === "Scheduled");
  const allCancelledVisits = visits.filter((v) => v.status === "Cancelled");

  // Filter contacts by badge flags
  const filteredContacts = localContacts.filter((c) => {
    // Determine which flag applies to this contact (using same logic as badge in contact-detail-sheet)
    let contactFlag: string;

    if (c.hasUpcomingVisit) {
      contactFlag = "hasUpcomingVisit";
    } else if (c.offerAccepted === true) {
      contactFlag = "offerAccepted";
    } else if (c.offerAccepted === false) {
      contactFlag = "offerRejected";
    } else if (c.hasOffer) {
      contactFlag = "hasOffer";
    } else if (c.hasMissedVisit && !c.hasCancelledVisit) {
      contactFlag = "hasMissedVisit";
    } else if (c.hasCancelledVisit) {
      contactFlag = "hasCancelledVisit";
    } else if (c.hasCompletedVisit) {
      contactFlag = "hasCompletedVisit";
    } else {
      // No visits at all
      contactFlag = "noVisits";
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
    if (a.hasUpcomingVisit !== b.hasUpcomingVisit) return a.hasUpcomingVisit ? -1 : 1;

    // 5. ATTENTION: Has missed visit (needs immediate follow-up)
    if (a.hasMissedVisit !== b.hasMissedVisit) return a.hasMissedVisit ? -1 : 1;

    // 6. ATTENTION: Has cancelled visit (needs rescheduling)
    if (a.hasCancelledVisit !== b.hasCancelledVisit) return a.hasCancelledVisit ? -1 : 1;

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
    (c) => c.hasCompletedVisit || c.hasOffer || c.offerAccepted === true || c.offerAccepted === false
  );

  // Contacts without visits (Sin Actividad): hasCancelledVisit OR hasMissedVisit OR (no visits at all)
  const contactsWithoutVisits = localContacts.filter(
    (c) => !c.hasUpcomingVisit && !c.hasCompletedVisit && !c.hasOffer && c.offerAccepted === null
  );

  // New contacts with same sorting
  const newContacts = sortedContacts.filter((c) => c.isNew);

  // Check if any offer is accepted in the list (for ghosted effect)
  const hasAcceptedOffer = sortedContacts.some((c) => c.offerAccepted === true);

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
    setSelectedStatuses(new Set(["Completed", "Scheduled", "Cancelled", "Rescheduled", "NoShow"]));
    setSelectedTypes(new Set(["Visita", "Reunión", "Firma", "Cierre", "Viaje"]));
  };

  const clearContactFilters = () => {
    setSelectedContactFlags(new Set(["hasUpcomingVisit", "hasMissedVisit", "hasCancelledVisit", "hasCompletedVisit", "offerAccepted", "offerRejected", "hasOffer", "noVisits"]));
  };

  const activeFilterCount =
    (5 - selectedStatuses.size) + (5 - selectedTypes.size); // Count deselected items

  const activeContactFilterCount =
    (8 - selectedContactFlags.size); // Count deselected items (8 total flags now)

  // Get unique types from visits
  const availableTypes = Array.from(new Set(visits.map((v) => v.type).filter((t): t is string => t !== null)));

  // All available contact flags (static list)
  const availableContactFlags = ["hasUpcomingVisit", "hasMissedVisit", "hasCancelledVisit", "hasCompletedVisit", "offerAccepted", "offerRejected", "hasOffer", "noVisits"];

  // Handle opening modal for editing
  const handleEditAppointment = (
    appointmentId: bigint,
    initialData: Partial<Record<string, unknown>>,
  ) => {
    setEditMode("edit");
    setEditingAppointmentId(appointmentId);
    openModal(initialData);
  };

  return (
    <div className="space-y-6">
      {/* KPI Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <VisitsKPICard
          completedCount={allCompletedVisits.length}
          scheduledCount={allScheduledVisits.length}
          cancelledCount={allCancelledVisits.length}
          totalCount={visits.length}
          isActive={activeView === "visits"}
          onClick={handleVisitsClick}
          listingId={listingId}
        />
        <ContactsKPICard
          contactsWithVisitsCount={contactsWithVisits.length}
          contactsWithoutVisitsCount={contactsWithoutVisits.length}
          contactsInOfferStageCount={contactsInOfferStage.length}
          totalContactsCount={localContacts.length}
          isActive={activeView === "contacts"}
          onClick={handleContactsClick}
          listingId={listingId}
        />
      </div>

      {/* Visits Content - shown when visits card is active */}
      {activeView === "visits" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Filter Button */}
          <div className="flex justify-end">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 relative">
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
                            {(Object.entries(STATUS_LABELS) as [VisitStatus, string][]).map(
                              ([status, label]) => (
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
                              )
                            )}
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
                                <span className="text-sm">{TYPE_LABELS[type] ?? type}</span>
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

          <div className="space-y-6">
            {/* No visits at all */}
            {filteredVisits.length === 0 && (
              <EmptyState type="completed-visits" />
            )}

            {/* 🔴 Urgent/Action Required Section */}
            {urgentVisits.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-2 w-2 rounded-full bg-rose-500" />
                  <h3 className="text-sm font-semibold text-rose-700 uppercase tracking-wide">
                    Requieren Atención ({urgentVisits.length})
                  </h3>
                </div>
                <div className="space-y-3 pl-4">
                  {urgentVisits.map((visit) => {
                    const appointmentData: AppointmentData = {
                      appointmentId: visit.appointmentId,
                      type: visit.type ?? "",
                      status: (visit.status ?? "Completed") as "Completed" | "Scheduled" | "Cancelled" | "Rescheduled" | "NoShow",
                      datetimeStart: visit.datetimeStart,
                      datetimeEnd: visit.datetimeEnd,
                      tripTimeMinutes: visit.tripTimeMinutes ?? undefined,
                      notes: visit.notes ?? undefined,
                      contactId: visit.contactId ?? undefined,
                      contactName: `${visit.contactFirstName ?? ""} ${visit.contactLastName ?? ""}`.trim(),
                      propertyAddress: undefined,
                      agentName: visit.agentName ?? undefined,
                      isOptimistic: false,
                    };

                    return (
                      <AppointmentCard
                        key={visit.appointmentId.toString()}
                        appointment={appointmentData}
                        onClick={(appointment) => {
                          console.log("🔍 [Activity] Appointment clicked:", appointment.appointmentId.toString());
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
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                    Próximas Visitas ({activeVisits.length})
                  </h3>
                </div>
                <div className="space-y-3 pl-4">
                  {activeVisits.map((visit) => {
                    const appointmentData: AppointmentData = {
                      appointmentId: visit.appointmentId,
                      type: visit.type ?? "",
                      status: (visit.status ?? "Completed") as "Completed" | "Scheduled" | "Cancelled" | "Rescheduled" | "NoShow",
                      datetimeStart: visit.datetimeStart,
                      datetimeEnd: visit.datetimeEnd,
                      tripTimeMinutes: visit.tripTimeMinutes ?? undefined,
                      notes: visit.notes ?? undefined,
                      contactId: visit.contactId ?? undefined,
                      contactName: `${visit.contactFirstName ?? ""} ${visit.contactLastName ?? ""}`.trim(),
                      propertyAddress: undefined,
                      agentName: visit.agentName ?? undefined,
                      isOptimistic: false,
                    };

                    return (
                      <AppointmentCard
                        key={visit.appointmentId.toString()}
                        appointment={appointmentData}
                        onClick={(appointment) => {
                          console.log("🔍 [Activity] Appointment clicked:", appointment.appointmentId.toString());
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
                      status: (visit.status ?? "Completed") as "Completed" | "Scheduled" | "Cancelled" | "Rescheduled" | "NoShow",
                      datetimeStart: visit.datetimeStart,
                      datetimeEnd: visit.datetimeEnd,
                      tripTimeMinutes: visit.tripTimeMinutes ?? undefined,
                      notes: visit.notes ?? undefined,
                      contactId: visit.contactId ?? undefined,
                      contactName: `${visit.contactFirstName ?? ""} ${visit.contactLastName ?? ""}`.trim(),
                      propertyAddress: undefined,
                      agentName: visit.agentName ?? undefined,
                      isOptimistic: false,
                    };

                    return (
                      <AppointmentCard
                        key={visit.appointmentId.toString()}
                        appointment={appointmentData}
                        onClick={(appointment) => {
                          console.log("🔍 [Activity] Appointment clicked:", appointment.appointmentId.toString());
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
                      status: (visit.status ?? "Completed") as "Completed" | "Scheduled" | "Cancelled" | "Rescheduled" | "NoShow",
                      datetimeStart: visit.datetimeStart,
                      datetimeEnd: visit.datetimeEnd,
                      tripTimeMinutes: visit.tripTimeMinutes ?? undefined,
                      notes: visit.notes ?? undefined,
                      contactId: visit.contactId ?? undefined,
                      contactName: `${visit.contactFirstName ?? ""} ${visit.contactLastName ?? ""}`.trim(),
                      propertyAddress: undefined,
                      agentName: visit.agentName ?? undefined,
                      isOptimistic: false,
                    };

                    return (
                      <AppointmentCard
                        key={visit.appointmentId.toString()}
                        appointment={appointmentData}
                        onClick={(appointment) => {
                          console.log("🔍 [Activity] Appointment clicked:", appointment.appointmentId.toString());
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
        </div>
      )}

      {/* Contacts Content - shown when contacts card is active */}
      {activeView === "contacts" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Contact Filter Button */}
          <div className="flex justify-end">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 relative">
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
                                <span className="text-sm">{CONTACT_FLAG_LABELS[flag]}</span>
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

          <div className="space-y-6">
            {/* No contacts at all */}
            {filteredContacts.length === 0 && (
              <EmptyState type="new-contacts" />
            )}

            {/* New Contacts Section */}
            {newContacts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                    Nuevos Contactos ({newContacts.length})
                  </h3>
                </div>
                <div className="space-y-3">
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
                      contactType: contact.contactType as "buyer" | "owner" | "viewer",
                    }}
                    hasUpcomingVisit={contact.hasUpcomingVisit}
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
                <div className="space-y-3">
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
                        contactType: contact.contactType as "buyer" | "owner" | "viewer",
                      }}
                      hasUpcomingVisit={contact.hasUpcomingVisit}
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
    </div>
  );
}
