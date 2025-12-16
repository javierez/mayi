"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { VisitsKPICard } from "~/components/propiedades/detail/activity/visits-kpi-card";
import { ContactsKPICard } from "~/components/propiedades/detail/activity/contacts-kpi-card";
import {
  AppointmentCard,
  type AppointmentData,
} from "~/components/appointments/appointment-card";
import { CompactContactCard } from "~/components/propiedades/detail/activity/compact-contact-card";
import { CompactPropertyCard } from "~/components/propiedades/compact-property-card";
import { EmptyState } from "~/components/propiedades/detail/activity/empty-states";
import { ExpandableSection } from "~/components/propiedades/detail/activity/expandable-section";
import {
  getContactActivityByListingAsOwner,
  getContactVisitsSummaryAsOwner,
  getContactRelatedContactsAsOwner,
} from "~/server/queries/activity";
import {
  canEditCalendar,
  canDeleteCalendar,
  canEditContacts,
} from "~/app/actions/permissions/check-permissions";
import { Card } from "~/components/ui/card";
import { Building } from "lucide-react";
import type {
  ContactVisitWithDetails,
  ContactRelatedContact,
  ContactSheetData,
} from "~/types/activity";
import { cn } from "~/lib/utils";
import AppointmentModal, {
  useAppointmentModal,
} from "~/components/appointments/appointment-modal";
import { AppointmentDetailSheet } from "~/components/appointments/appointment-detail-sheet";
import { ContactDetailSheet } from "~/components/contactos/contact-detail-sheet";

interface ContactPropiedadesTabProps {
  contactId: bigint;
}

interface ListingInfo {
  listingId: bigint;
  propertyId: bigint;
  price: string;
  status: string;
  listingType: string;
  isActive: boolean | null;
  isFeatured: boolean | null;
  isBankOwned: boolean | null;
  viewCount: number | null;
  inquiryCount: number | null;
  agentName: string | null;
  referenceNumber: string | null;
  title: string | null;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: string | null;
  squareMeter: number | null;
  builtSurfaceArea: number | null;
  street: string | null;
  addressDetails: string | null;
  postalCode: string | null;
  latitude: string | null;
  longitude: string | null;
  city: string | null;
  province: string | null;
  municipality: string | null;
  neighborhood: string | null;
  imageUrl: string | null;
  s3key: string | null;
  imageUrl2: string | null;
  s3key2: string | null;
}

export function ContactPropiedadesTab({ contactId }: ContactPropiedadesTabProps) {
  const router = useRouter();

  const [listings, setListings] = useState<ListingInfo[]>([]);
  const [visits, setVisits] = useState<ContactVisitWithDetails[]>([]);
  const [relatedContacts, setRelatedContacts] = useState<ContactRelatedContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactSheetData | null>(null);
  const [activeViews, setActiveViews] = useState<Record<string, "visits" | "contacts" | null>>({});
  const [expandedListings, setExpandedListings] = useState<Record<string, boolean>>({});

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

  // Modal state for creating new appointments from KPI cards
  const [isCreateAppointmentModalOpen, setIsCreateAppointmentModalOpen] = useState(false);
  const [createAppointmentListingId, setCreateAppointmentListingId] = useState<bigint | null>(null);

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

  // Fetch activity data for owner properties
  const fetchActivityData = useCallback(async () => {
    try {
      const [listingsData, visitsData, contactsData] = await Promise.all([
        getContactActivityByListingAsOwner(contactId),
        getContactVisitsSummaryAsOwner(contactId),
        getContactRelatedContactsAsOwner(contactId),
      ]);
      setListings(listingsData);
      setVisits(visitsData);
      setRelatedContacts(contactsData);
    } catch (error) {
      console.error("Error fetching owner activity data:", error);
      setListings([]);
      setVisits([]);
      setRelatedContacts([]);
    }
  }, [contactId]);

  useEffect(() => {
    setIsLoading(true);
    void fetchActivityData().finally(() => setIsLoading(false));
  }, [fetchActivityData]);

  // Handle view toggle for a specific listing
  const handleViewToggle = (listingId: bigint, view: "visits" | "contacts") => {
    const listingIdStr = listingId.toString();
    setActiveViews((prev) => ({
      ...prev,
      [listingIdStr]: prev[listingIdStr] === view ? null : view,
    }));
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse p-6">
            <div className="h-20 rounded-lg bg-gray-200"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Building className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="mb-2 text-lg font-semibold">Sin propiedades</h3>
          <p className="text-muted-foreground">
            Este contacto no tiene propiedades registradas.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => {
        const listingIdStr = listing.listingId.toString();
        const isExpanded = expandedListings[listingIdStr] ?? false;
        const activeView = activeViews[listingIdStr] ?? null;

        // Filter visits and contacts for this listing
        const listingVisits = visits.filter(
          (v) => v.listingId?.toString() === listingIdStr,
        );
        const listingContacts = relatedContacts.filter(
          (c) => c.listingId?.toString() === listingIdStr,
        );

        // Calculate KPI counts
        const completedVisits = listingVisits.filter((v) => v.status === "Completed");
        const scheduledVisits = listingVisits.filter((v) => v.status === "Scheduled");
        const cancelledVisits = listingVisits.filter((v) => v.status === "Cancelled");

        // Contact metrics
        const contactsWithVisits = listingContacts.filter((c) => c.hasUpcomingVisit);
        const contactsInOfferStage = listingContacts.filter(
          (c) => c.hasCompletedVisit || c.hasOffer || c.offerAccepted === true || c.offerAccepted === false,
        );
        const contactsWithoutVisits = listingContacts.filter(
          (c) => !c.hasUpcomingVisit && !c.hasCompletedVisit && !c.hasOffer && c.offerAccepted === null,
        );
        const hasAcceptedOffer = listingContacts.some((c) => c.offerAccepted === true);

        return (
          <Card key={listingIdStr} className={cn("overflow-hidden", isExpanded && "shadow-none")}>
            <CompactPropertyCard
              listing={{
                listingId: listing.listingId,
                propertyId: listing.propertyId,
                price: listing.price,
                listingType: listing.listingType,
                propertyType: listing.propertyType,
                bedrooms: listing.bedrooms,
                bathrooms: listing.bathrooms,
                squareMeter: listing.squareMeter,
                builtSurfaceArea: listing.builtSurfaceArea ?? null,
                street: listing.street,
                city: listing.city,
                referenceNumber: listing.referenceNumber,
                title: listing.title,
                imageUrl: listing.imageUrl,
              }}
              isExpanded={isExpanded}
              onToggle={() => toggleListing(listing.listingId)}
            />

            {isExpanded && (
              <div className="space-y-6 border-t border-gray-200 bg-gray-50 p-4">
                {/* KPI Navigation Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <VisitsKPICard
                    completedCount={completedVisits.length}
                    scheduledCount={scheduledVisits.length}
                    cancelledCount={cancelledVisits.length}
                    totalCount={listingVisits.length}
                    isActive={activeView === "visits"}
                    onClick={() => handleViewToggle(listing.listingId, "visits")}
                    listingId={listing.listingId}
                    onScheduleVisit={() => handleScheduleVisitForListing(listing.listingId)}
                  />
                  <ContactsKPICard
                    contactsWithVisitsCount={contactsWithVisits.length}
                    contactsWithoutVisitsCount={contactsWithoutVisits.length}
                    contactsInOfferStageCount={contactsInOfferStage.length}
                    totalContactsCount={listingContacts.length}
                    isActive={activeView === "contacts"}
                    onClick={() => handleViewToggle(listing.listingId, "contacts")}
                    listingId={listing.listingId}
                    onContactCreated={fetchActivityData}
                  />
                </div>

                {/* Visits Content */}
                {activeView === "visits" && (
                  <VisitsContent
                    listingVisits={listingVisits}
                    listingId={listing.listingId}
                    onAppointmentClick={setSelectedAppointment}
                  />
                )}

                {/* Contacts Content */}
                {activeView === "contacts" && (
                  <ContactsContent
                    listingContacts={listingContacts}
                    listingId={listing.listingId}
                    hasAcceptedOffer={hasAcceptedOffer}
                    onContactClick={setSelectedContact}
                  />
                )}
              </div>
            )}
          </Card>
        );
      })}

      {/* Contact Detail Sheet */}
      <ContactDetailSheet
        contact={selectedContact}
        isOpen={selectedContact !== null}
        onClose={() => setSelectedContact(null)}
        onUpdate={() => {
          router.refresh();
          void fetchActivityData();
        }}
        listingId={selectedContact?.contact.contactId ?? BigInt(0)}
        listingPrice="0"
        ownerContact={null}
        permissions={{ canEditContacts: hasEditContactsPermission }}
      />

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
        }}
        mode="create"
        onSuccess={handleAppointmentCreateSuccess}
      />
    </div>
  );
}

// Sub-component for visits content
function VisitsContent({
  listingVisits,
  listingId,
  onAppointmentClick,
}: {
  listingVisits: ContactVisitWithDetails[];
  listingId: bigint;
  onAppointmentClick: (appointment: AppointmentData) => void;
}) {
  const urgentVisits = listingVisits
    .filter((v) => v.status === "NoShow" || v.status === "Rescheduled")
    .sort((a, b) => new Date(b.datetimeStart).getTime() - new Date(a.datetimeStart).getTime());

  const activeVisits = listingVisits
    .filter((v) => v.status === "Scheduled")
    .sort((a, b) => new Date(a.datetimeStart).getTime() - new Date(b.datetimeStart).getTime());

  const completedVisits = listingVisits
    .filter((v) => v.status === "Completed")
    .sort((a, b) => new Date(b.datetimeStart).getTime() - new Date(a.datetimeStart).getTime());

  const cancelledVisits = listingVisits
    .filter((v) => v.status === "Cancelled")
    .sort((a, b) => new Date(b.datetimeStart).getTime() - new Date(a.datetimeStart).getTime());

  const mapToAppointmentData = (visit: ContactVisitWithDetails): AppointmentData => ({
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
  });

  if (listingVisits.length === 0) {
    return <EmptyState type="completed-visits" />;
  }

  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      {urgentVisits.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="h-2 w-2 rounded-full bg-rose-500" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-700">
              Requieren Atención ({urgentVisits.length})
            </h3>
          </div>
          <div className="space-y-3 pl-4">
            {urgentVisits.map((visit) => (
              <AppointmentCard
                key={visit.appointmentId.toString()}
                appointment={mapToAppointmentData(visit)}
                onClick={onAppointmentClick}
                navigateToVisit={false}
              />
            ))}
          </div>
        </div>
      )}

      {activeVisits.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Próximas Visitas ({activeVisits.length})
            </h3>
          </div>
          <div className="space-y-3">
            {activeVisits.map((visit) => (
              <AppointmentCard
                key={visit.appointmentId.toString()}
                appointment={mapToAppointmentData(visit)}
                onClick={onAppointmentClick}
                navigateToVisit={false}
              />
            ))}
          </div>
        </div>
      )}

      {completedVisits.length > 0 && (
        <ExpandableSection
          title="Completadas"
          count={completedVisits.length}
          defaultExpanded={false}
          storageKey={`contact-propiedades-completed-${listingId}`}
        >
          <div className="space-y-3">
            {completedVisits.map((visit) => (
              <AppointmentCard
                key={visit.appointmentId.toString()}
                appointment={mapToAppointmentData(visit)}
                onClick={onAppointmentClick}
                navigateToVisit={false}
              />
            ))}
          </div>
        </ExpandableSection>
      )}

      {cancelledVisits.length > 0 && (
        <ExpandableSection
          title="Canceladas"
          count={cancelledVisits.length}
          defaultExpanded={false}
          storageKey={`contact-propiedades-cancelled-${listingId}`}
        >
          <div className="space-y-3">
            {cancelledVisits.map((visit) => (
              <AppointmentCard
                key={visit.appointmentId.toString()}
                appointment={mapToAppointmentData(visit)}
                onClick={onAppointmentClick}
                navigateToVisit={false}
              />
            ))}
          </div>
        </ExpandableSection>
      )}
    </div>
  );
}

// Sub-component for contacts content
function ContactsContent({
  listingContacts,
  listingId,
  hasAcceptedOffer,
  onContactClick,
}: {
  listingContacts: ContactRelatedContact[];
  listingId: bigint;
  hasAcceptedOffer: boolean;
  onContactClick: (contact: ContactSheetData) => void;
}) {
  if (listingContacts.length === 0) {
    return <EmptyState type="new-contacts" />;
  }

  return (
    <div className="animate-in fade-in space-y-3 duration-300">
      {listingContacts.map((contact) => (
        <CompactContactCard
          key={contact.listingContactId.toString()}
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
          onContactClick={onContactClick}
          hasAcceptedOfferInList={hasAcceptedOffer}
        />
      ))}
    </div>
  );
}
