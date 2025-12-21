"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VisitsKPICard } from "./visits-kpi-card";
import { ContactsKPICard } from "./contacts-kpi-card";
import { VisitsSection, type VisitData } from "./visits-section";
import { ContactsSection } from "./contacts-section";
import type { AppointmentData } from "~/components/appointments/appointment-card";
import type {
  ActivityTabContentProps,
  ContactSheetData,
  ContactWithDetails,
  OwnerContact,
} from "~/types/activity";
import { getListingOwnerContact } from "~/server/queries/activity";
import {
  canEditCalendar,
  canDeleteCalendar,
  canEditContacts,
} from "~/app/actions/permissions/check-permissions";
import AppointmentModal, {
  useAppointmentModal,
} from "~/components/appointments/appointment-modal";
import { AppointmentDetailSheet } from "~/components/appointments/appointment-detail-sheet";
import { ContactDetailSheet } from "~/components/contactos/contact-detail-sheet";

type ActiveView = "visits" | "contacts" | null;

export function ActivityTabContent({
  visits,
  contacts,
  listingId,
  listingPrice,
  onRefresh,
}: ActivityTabContentProps) {
  const router = useRouter();

  const [activeView, setActiveView] = useState<ActiveView>("contacts");
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentData | null>(null);
  const [selectedContact, setSelectedContact] =
    useState<ContactSheetData | null>(null);
  const [ownerContact, setOwnerContact] = useState<OwnerContact | null>(null);

  // Local state for contacts to enable optimistic updates
  const [localContacts, setLocalContacts] =
    useState<ContactWithDetails[]>(contacts);

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
  const [isCreateAppointmentModalOpen, setIsCreateAppointmentModalOpen] =
    useState(false);
  const [createAppointmentInitialData, setCreateAppointmentInitialData] =
    useState<{
      listingId?: bigint;
      appointmentType?: "Visita" | "Reunión" | "Firma" | "Cierre" | "Viaje";
    }>({});

  // Sync local contacts with prop changes
  useEffect(() => {
    setLocalContacts(contacts);
  }, [contacts]);

  // Handler to refresh contacts after updates
  const handleContactUpdate = async () => {
    router.refresh();
    if (onRefresh) {
      await onRefresh();
    }
  };

  // Fetch user permissions on component mount
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const [editCalendarPerm, deleteCalendarPerm, editContactsPerm] =
          await Promise.all([
            canEditCalendar(),
            canDeleteCalendar(),
            canEditContacts(),
          ]);
        setHasEditCalendarPermission(editCalendarPerm);
        setHasDeleteCalendarPermission(deleteCalendarPerm);
        setHasEditContactsPermission(editContactsPerm);
      } catch (error) {
        console.error("Error fetching permissions:", error);
        setHasEditCalendarPermission(false);
        setHasDeleteCalendarPermission(false);
        setHasEditContactsPermission(false);
      }
    };

    void fetchPermissions();
  }, []);

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

  // KPI counts (unfiltered - show total counts)
  const allCompletedVisits = visits.filter((v) => v.status === "Completed");
  const allScheduledVisits = visits.filter((v) => v.status === "Scheduled");
  const allCancelledVisits = visits.filter((v) => v.status === "Cancelled");

  // Calculate KPI metrics based on badge states
  const contactsWithVisits = localContacts.filter((c) => c.hasUpcomingVisit);
  const contactsInOfferStage = localContacts.filter(
    (c) =>
      c.hasCompletedVisit ||
      c.hasOffer ||
      c.offerAccepted === true ||
      c.offerAccepted === false,
  );
  const contactsWithoutVisits = localContacts.filter(
    (c) =>
      !c.hasUpcomingVisit &&
      !c.hasCompletedVisit &&
      !c.hasOffer &&
      c.offerAccepted === null,
  );

  const handleVisitsClick = () => {
    setActiveView(activeView === "visits" ? null : "visits");
  };

  const handleContactsClick = () => {
    setActiveView(activeView === "contacts" ? null : "contacts");
  };

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
    router.refresh();
    if (onRefresh) {
      await onRefresh();
    }
  };

  // Convert visits to VisitData format
  const visitData: VisitData[] = visits.map((v) => ({
    appointmentId: v.appointmentId,
    type: v.type,
    status: v.status,
    datetimeStart: v.datetimeStart,
    datetimeEnd: v.datetimeEnd,
    tripTimeMinutes: v.tripTimeMinutes,
    notes: v.notes,
    contactId: v.contactId,
    contactFirstName: v.contactFirstName,
    contactLastName: v.contactLastName,
    agentName: v.agentName,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Navigation Cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:gap-4 md:grid-cols-2">
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
      </div>

      {/* Visits Content */}
      {activeView === "visits" && (
        <VisitsSection
          visits={visitData}
          listingId={listingId}
          onAppointmentClick={setSelectedAppointment}
        />
      )}

      {/* Contacts Content */}
      {activeView === "contacts" && (
        <ContactsSection
          contacts={localContacts}
          visits={visitData}
          listingId={listingId}
          listingPrice={listingPrice}
          ownerContact={ownerContact}
          hasEditContactsPermission={hasEditContactsPermission}
          onContactClick={setSelectedContact}
          onUpdate={handleContactUpdate}
        />
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
          router.refresh();
        }}
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
