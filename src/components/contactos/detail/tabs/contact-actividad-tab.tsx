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
  getContactActivityByListing,
  getContactActivityByListingAsOwner,
  getContactVisitsSummaryAsBuyer,
  getContactVisitsSummaryAsOwner,
  getContactRelatedContactsForBuyerListings,
  getContactRelatedContactsAsOwner,
} from "~/server/queries/activity";
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
import { ContactDetailSheet } from "~/components/contactos/contact-detail-sheet";
import { Card } from "~/components/ui/card";
import { Building, Home } from "lucide-react";
import type {
  ContactVisitWithDetails,
  ContactRelatedContact,
  ContactSheetData,
} from "~/types/activity";
import { cn } from "~/lib/utils";

interface ContactActividadTabProps {
  contactId: bigint;
}

interface ListingInfo {
  // Listing fields
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

  // Property fields
  referenceNumber: string | null;
  title: string | null;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: string | null;
  squareMeter: number | null;
  street: string | null;
  addressDetails: string | null;
  postalCode: string | null;
  latitude: string | null;
  longitude: string | null;

  // Location fields
  city: string | null;
  province: string | null;
  municipality: string | null;
  neighborhood: string | null;

  // Image fields
  imageUrl: string | null;
  s3key: string | null;
  imageUrl2: string | null;
  s3key2: string | null;
}

interface ListingActivityGroup {
  listing: ListingInfo;
  visits: ContactVisitWithDetails[];
  contacts: ContactRelatedContact[];
  activeView: "visits" | "contacts" | null;
}

export function ContactActividadTab({ contactId }: ContactActividadTabProps) {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<"propiedades" | "intereses">(
    "propiedades",
  );
  const [listings, setListings] = useState<ListingInfo[]>([]);
  const [visits, setVisits] = useState<ContactVisitWithDetails[]>([]);
  const [relatedContacts, setRelatedContacts] = useState<
    ContactRelatedContact[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentData | null>(null);
  const [selectedContact, setSelectedContact] =
    useState<ContactSheetData | null>(null);
  const [activeViews, setActiveViews] = useState<
    Record<string, "visits" | "contacts" | null>
  >({});
  const [expandedListings, setExpandedListings] = useState<
    Record<string, boolean>
  >({});

  // Intereses (buyer listings) state
  const [interesesListings, setInteresesListings] = useState<PropertyListing[]>(
    [],
  );
  const [isLoadingIntereses, setIsLoadingIntereses] = useState(false);

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

  // Fetch permissions
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
        console.error(
          "❌ [Contact Activity] Error fetching permissions:",
          error,
        );
      }
    };

    void fetchPermissions();
  }, []);

  // Fetch activity data based on selected role
  const fetchActivityData = useCallback(async () => {
    try {
      let listingsData, visitsData, contactsData;

      // Use selectedRole to determine which queries to run
      if (selectedRole === "propiedades") {
        // For "Propiedades" (owner role), fetch owner-specific data
        [listingsData, visitsData, contactsData] = await Promise.all([
          getContactActivityByListingAsOwner(contactId),
          getContactVisitsSummaryAsOwner(contactId),
          getContactRelatedContactsAsOwner(contactId),
        ]);
      } else {
        // For "Intereses" (buyer role), fetch buyer-specific data
        [listingsData, visitsData, contactsData] = await Promise.all([
          getContactActivityByListing(contactId),
          getContactVisitsSummaryAsBuyer(contactId),
          getContactRelatedContactsForBuyerListings(contactId),
        ]);
      }

      setListings(listingsData);
      setVisits(visitsData);
      setRelatedContacts(contactsData);
    } catch (error) {
      console.error("Error fetching contact activity data:", error);
      setListings([]);
      setVisits([]);
      setRelatedContacts([]);
    }
  }, [contactId, selectedRole]);

  useEffect(() => {
    setIsLoading(true);
    void fetchActivityData().finally(() => setIsLoading(false));
  }, [contactId, selectedRole, fetchActivityData]);

  // Fetch buyer listings for "Intereses" tab
  useEffect(() => {
    if (selectedRole === "intereses") {
      const fetchBuyerListings = async () => {
        setIsLoadingIntereses(true);
        try {
          const buyerListings = await getBuyerListingsWithAuth(
            Number(contactId),
          );
          setInteresesListings(buyerListings as unknown as PropertyListing[]);
        } catch (error) {
          console.error("Error fetching buyer listings:", error);
          setInteresesListings([]);
        } finally {
          setIsLoadingIntereses(false);
        }
      };

      void fetchBuyerListings();
    }
  }, [contactId, selectedRole]);

  // Group visits and contacts by listing
  const listingGroups: ListingActivityGroup[] = listings.map((listing) => {
    const listingVisits = visits.filter(
      (v) => v.listingId?.toString() === listing.listingId.toString(),
    );
    const listingContacts = relatedContacts.filter(
      (c) => c.listingId?.toString() === listing.listingId.toString(),
    );

    return {
      listing,
      visits: listingVisits,
      contacts: listingContacts,
      activeView: activeViews[listing.listingId.toString()] ?? null,
    };
  });

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

  // Handle listing card toggle
  const toggleListing = (listingId: bigint) => {
    const listingIdStr = listingId.toString();
    setExpandedListings((prev) => ({
      ...prev,
      [listingIdStr]: !prev[listingIdStr],
    }));
  };

  // Handle delete interest (remove listing-contact relationship)
  const handleDeleteInterest = async (listingId: bigint) => {
    try {
      await removeListingContactRelationshipWithAuth(
        Number(contactId),
        Number(listingId),
        "buyer",
      );

      // Optimistically update the UI by removing the listing from the array
      setInteresesListings((prev) =>
        prev.filter(
          (listing) => listing.listingId?.toString() !== listingId.toString(),
        ),
      );

      toast.success("Interés eliminado correctamente");
    } catch (error) {
      console.error("Error deleting interest:", error);
      toast.error("Error al eliminar el interés");
    }
  };

  // Handle deactivate interest (set is_active to false)
  const handleDeactivateInterest = async (listingId: bigint) => {
    try {
      await deactivateListingContactWithAuth(
        Number(contactId),
        Number(listingId),
        "buyer",
      );

      // Optimistically update the UI by updating the listing's isActive status
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Role Toggle - visible during loading */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg bg-gray-50 p-1">
            <button
              onClick={() => setSelectedRole("propiedades")}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-all duration-200",
                selectedRole === "propiedades"
                  ? "bg-white text-gray-900 shadow-md"
                  : "text-gray-600 hover:text-gray-900",
              )}
            >
              <Building className="mr-2 inline-block h-4 w-4" />
              Propiedades
            </button>
            <button
              onClick={() => setSelectedRole("intereses")}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-all duration-200",
                selectedRole === "intereses"
                  ? "bg-white text-gray-900 shadow-md"
                  : "text-gray-600 hover:text-gray-900",
              )}
            >
              <Home className="mr-2 inline-block h-4 w-4" />
              Intereses
            </button>
          </div>
        </div>

        {/* Loading skeleton cards */}
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse p-6">
            <div className="h-20 rounded-lg bg-gray-200"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Role Toggle - Always visible */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg bg-gray-50 p-1">
          <button
            onClick={() => setSelectedRole("propiedades")}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-all duration-200",
              selectedRole === "propiedades"
                ? "bg-white text-gray-900 shadow-md"
                : "text-gray-600 hover:text-gray-900",
            )}
          >
            <Building className="mr-2 inline-block h-4 w-4" />
            Propiedades
          </button>
          <button
            onClick={() => setSelectedRole("intereses")}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-all duration-200",
              selectedRole === "intereses"
                ? "bg-white text-gray-900 shadow-md"
                : "text-gray-600 hover:text-gray-900",
            )}
          >
            <Home className="mr-2 inline-block h-4 w-4" />
            Intereses
          </button>
        </div>
      </div>

      {/* Content based on selected role */}
      {selectedRole === "propiedades" ? (
        listings.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Building className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <h3 className="mb-2 text-lg font-semibold">Sin propiedades</h3>
              <p className="text-muted-foreground">
                Este contacto no tiene propiedades registradas.
              </p>
            </div>
          </Card>
        ) : (
          <>
            {listingGroups.map((group) => {
              const {
                listing,
                visits: listingVisits,
                contacts: listingContacts,
                activeView,
              } = group;

              // Calculate KPI counts for this listing
              const completedVisits = listingVisits.filter(
                (v) => v.status === "Completed",
              );
              const scheduledVisits = listingVisits.filter(
                (v) => v.status === "Scheduled",
              );
              const cancelledVisits = listingVisits.filter(
                (v) => v.status === "Cancelled",
              );

              // Calculate KPI metrics based on badge states
              // Contacts with visits (En visita): hasUpcomingVisit
              const contactsWithVisits = listingContacts.filter(
                (c) => c.hasUpcomingVisit,
              );

              // Contacts in offer stage (Negociación): hasCompletedVisit OR hasOffer OR offerAccepted OR offerRejected
              const contactsInOfferStage = listingContacts.filter(
                (c) =>
                  c.hasCompletedVisit ||
                  c.hasOffer ||
                  c.offerAccepted === true ||
                  c.offerAccepted === false,
              );

              // Contacts without visits (Visita pendiente): no upcoming visit, no completed visit, no offer
              const contactsWithoutVisits = listingContacts.filter(
                (c) =>
                  !c.hasUpcomingVisit &&
                  !c.hasCompletedVisit &&
                  !c.hasOffer &&
                  c.offerAccepted === null,
              );

              // Check if any offer is accepted in this listing (for ghosted effect)
              const hasAcceptedOffer = listingContacts.some(
                (c) => c.offerAccepted === true,
              );

              const listingIdStr = listing.listingId.toString();
              const isExpanded = expandedListings[listingIdStr] ?? false;

              return (
                <Card
                  key={listingIdStr}
                  className={cn("overflow-hidden", isExpanded && "shadow-none")}
                >
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
                      street: listing.street,
                      city: listing.city,
                      referenceNumber: listing.referenceNumber,
                      title: listing.title,
                      imageUrl: listing.imageUrl,
                    }}
                    isExpanded={isExpanded}
                    onToggle={() => toggleListing(listing.listingId)}
                  />

                  {/* Expanded Content */}
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
                          onClick={() =>
                            handleViewToggle(listing.listingId, "visits")
                          }
                          listingId={listing.listingId}
                        />
                        <ContactsKPICard
                          contactsWithVisitsCount={contactsWithVisits.length}
                          contactsWithoutVisitsCount={
                            contactsWithoutVisits.length
                          }
                          contactsInOfferStageCount={
                            contactsInOfferStage.length
                          }
                          totalContactsCount={listingContacts.length}
                          isActive={activeView === "contacts"}
                          onClick={() =>
                            handleViewToggle(listing.listingId, "contacts")
                          }
                          listingId={listing.listingId}
                        />
                      </div>

                      {/* Visits Content - Grouped by Status */}
                      {activeView === "visits" &&
                        (() => {
                          // Group visits by status
                          const urgentVisits = listingVisits
                            .filter(
                              (v) =>
                                v.status === "NoShow" ||
                                v.status === "Rescheduled",
                            )
                            .sort((a, b) => {
                              // Most recent first for urgent items
                              return (
                                new Date(b.datetimeStart).getTime() -
                                new Date(a.datetimeStart).getTime()
                              );
                            });

                          const activeVisits = listingVisits
                            .filter((v) => v.status === "Scheduled")
                            .sort((a, b) => {
                              // Soonest first for upcoming visits
                              return (
                                new Date(a.datetimeStart).getTime() -
                                new Date(b.datetimeStart).getTime()
                              );
                            });

                          const completedVisits = listingVisits
                            .filter((v) => v.status === "Completed")
                            .sort((a, b) => {
                              // Most recent first for completed
                              return (
                                new Date(b.datetimeStart).getTime() -
                                new Date(a.datetimeStart).getTime()
                              );
                            });

                          const cancelledVisits = listingVisits
                            .filter((v) => v.status === "Cancelled")
                            .sort((a, b) => {
                              // Most recent first for cancelled
                              return (
                                new Date(b.datetimeStart).getTime() -
                                new Date(a.datetimeStart).getTime()
                              );
                            });

                          return (
                            <div className="animate-in fade-in space-y-4 duration-300">
                              {listingVisits.length === 0 ? (
                                <EmptyState type="completed-visits" />
                              ) : (
                                <div className="space-y-6">
                                  {/* 🔴 Urgent/Action Required Section */}
                                  {urgentVisits.length > 0 && (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2 px-1">
                                        <div className="h-2 w-2 rounded-full bg-rose-500" />
                                        <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-700">
                                          Requieren Atención (
                                          {urgentVisits.length})
                                        </h3>
                                      </div>
                                      <div className="space-y-3 pl-4">
                                        {urgentVisits.map((visit) => {
                                          const appointmentData: AppointmentData =
                                            {
                                              appointmentId:
                                                visit.appointmentId,
                                              type: visit.type ?? "",
                                              status: (visit.status ??
                                                "Completed") as
                                                | "Completed"
                                                | "Scheduled"
                                                | "Cancelled"
                                                | "Rescheduled"
                                                | "NoShow",
                                              datetimeStart:
                                                visit.datetimeStart,
                                              datetimeEnd: visit.datetimeEnd,
                                              tripTimeMinutes:
                                                visit.tripTimeMinutes ??
                                                undefined,
                                              notes: visit.notes ?? undefined,
                                              contactId:
                                                visit.contactId ?? undefined,
                                              contactName:
                                                `${visit.contactFirstName ?? ""} ${visit.contactLastName ?? ""}`.trim(),
                                              propertyAddress: undefined,
                                              agentName:
                                                visit.agentName ?? undefined,
                                              isOptimistic: false,
                                            };

                                          return (
                                            <AppointmentCard
                                              key={visit.appointmentId.toString()}
                                              appointment={appointmentData}
                                              onClick={(appointment) =>
                                                setSelectedAppointment(
                                                  appointment,
                                                )
                                              }
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
                                          Próximas Visitas (
                                          {activeVisits.length})
                                        </h3>
                                      </div>
                                      <div className="space-y-3">
                                        {activeVisits.map((visit) => {
                                          const appointmentData: AppointmentData =
                                            {
                                              appointmentId:
                                                visit.appointmentId,
                                              type: visit.type ?? "",
                                              status: (visit.status ??
                                                "Completed") as
                                                | "Completed"
                                                | "Scheduled"
                                                | "Cancelled"
                                                | "Rescheduled"
                                                | "NoShow",
                                              datetimeStart:
                                                visit.datetimeStart,
                                              datetimeEnd: visit.datetimeEnd,
                                              tripTimeMinutes:
                                                visit.tripTimeMinutes ??
                                                undefined,
                                              notes: visit.notes ?? undefined,
                                              contactId:
                                                visit.contactId ?? undefined,
                                              contactName:
                                                `${visit.contactFirstName ?? ""} ${visit.contactLastName ?? ""}`.trim(),
                                              propertyAddress: undefined,
                                              agentName:
                                                visit.agentName ?? undefined,
                                              isOptimistic: false,
                                            };

                                          return (
                                            <AppointmentCard
                                              key={visit.appointmentId.toString()}
                                              appointment={appointmentData}
                                              onClick={(appointment) =>
                                                setSelectedAppointment(
                                                  appointment,
                                                )
                                              }
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
                                      storageKey={`contact-activity-propiedades-completed-${listing.listingId}`}
                                    >
                                      <div className="space-y-3">
                                        {completedVisits.map((visit) => {
                                          const appointmentData: AppointmentData =
                                            {
                                              appointmentId:
                                                visit.appointmentId,
                                              type: visit.type ?? "",
                                              status: (visit.status ??
                                                "Completed") as
                                                | "Completed"
                                                | "Scheduled"
                                                | "Cancelled"
                                                | "Rescheduled"
                                                | "NoShow",
                                              datetimeStart:
                                                visit.datetimeStart,
                                              datetimeEnd: visit.datetimeEnd,
                                              tripTimeMinutes:
                                                visit.tripTimeMinutes ??
                                                undefined,
                                              notes: visit.notes ?? undefined,
                                              contactId:
                                                visit.contactId ?? undefined,
                                              contactName:
                                                `${visit.contactFirstName ?? ""} ${visit.contactLastName ?? ""}`.trim(),
                                              propertyAddress: undefined,
                                              agentName:
                                                visit.agentName ?? undefined,
                                              isOptimistic: false,
                                            };

                                          return (
                                            <AppointmentCard
                                              key={visit.appointmentId.toString()}
                                              appointment={appointmentData}
                                              onClick={(appointment) =>
                                                setSelectedAppointment(
                                                  appointment,
                                                )
                                              }
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
                                      storageKey={`contact-activity-propiedades-cancelled-${listing.listingId}`}
                                    >
                                      <div className="space-y-3">
                                        {cancelledVisits.map((visit) => {
                                          const appointmentData: AppointmentData =
                                            {
                                              appointmentId:
                                                visit.appointmentId,
                                              type: visit.type ?? "",
                                              status: (visit.status ??
                                                "Completed") as
                                                | "Completed"
                                                | "Scheduled"
                                                | "Cancelled"
                                                | "Rescheduled"
                                                | "NoShow",
                                              datetimeStart:
                                                visit.datetimeStart,
                                              datetimeEnd: visit.datetimeEnd,
                                              tripTimeMinutes:
                                                visit.tripTimeMinutes ??
                                                undefined,
                                              notes: visit.notes ?? undefined,
                                              contactId:
                                                visit.contactId ?? undefined,
                                              contactName:
                                                `${visit.contactFirstName ?? ""} ${visit.contactLastName ?? ""}`.trim(),
                                              propertyAddress: undefined,
                                              agentName:
                                                visit.agentName ?? undefined,
                                              isOptimistic: false,
                                            };

                                          return (
                                            <AppointmentCard
                                              key={visit.appointmentId.toString()}
                                              appointment={appointmentData}
                                              onClick={(appointment) =>
                                                setSelectedAppointment(
                                                  appointment,
                                                )
                                              }
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
                          );
                        })()}

                      {/* Contacts Content */}
                      {activeView === "contacts" && (
                        <div className="animate-in fade-in space-y-4 duration-300">
                          {listingContacts.length === 0 ? (
                            <EmptyState type="new-contacts" />
                          ) : (
                            <div className="space-y-3">
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
                                    contactType: contact.contactType as
                                      | "buyer"
                                      | "owner"
                                      | "viewer",
                                  }}
                                  hasUpcomingVisit={contact.hasUpcomingVisit}
                                  hasMissedVisit={contact.hasMissedVisit}
                                  hasCompletedVisit={contact.hasCompletedVisit}
                                  hasCancelledVisit={contact.hasCancelledVisit}
                                  hasOffer={contact.hasOffer}
                                  offer={contact.offer}
                                  offerAccepted={contact.offerAccepted}
                                  visitCount={contact.visitCount}
                                  listingId={listing.listingId}
                                  onContactClick={setSelectedContact}
                                  hasAcceptedOfferInList={hasAcceptedOffer}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </>
        )
      ) : (
        // Intereses section with compact property cards
        <>
          {isLoadingIntereses ? (
            // Loading skeleton for compact cards
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
          ) : interesesListings.length > 0 ? (
            // Compact property cards list - Sort active listings first, inactive at bottom
            <div className="space-y-3">
              {interesesListings
                .sort((a, b) => {
                  const aActive =
                    (a as Record<string, unknown>).listingContactIsActive ??
                    true;
                  const bActive =
                    (b as Record<string, unknown>).listingContactIsActive ??
                    true;
                  // Sort active (true) before inactive (false)
                  if (aActive === bActive) return 0;
                  return aActive ? -1 : 1;
                })
                .map((listing) => {
                  const listingContactId = (listing as Record<string, unknown>)
                    .listingContactId as bigint | undefined;
                  const listingContactIdStr =
                    listingContactId?.toString() ?? "unknown";
                  const listingIdStr =
                    listing.listingId?.toString() ?? "unknown";
                  const isExpanded = expandedListings[listingIdStr] ?? false;
                  const isActive =
                    (listing as Record<string, unknown>)
                      .listingContactIsActive ?? true;

                  // Convert PropertyListing (from getBuyerListingsWithAuth) to CompactPropertyCard props
                  const listingForCard = {
                    listingId:
                      typeof listing.listingId === "bigint"
                        ? listing.listingId
                        : BigInt(listing.listingId ?? 0),
                    propertyId:
                      typeof listing.propertyId === "bigint"
                        ? listing.propertyId
                        : BigInt(listing.propertyId ?? 0),
                    price: listing.price?.toString() ?? "0",
                    listingType: listing.listingType ?? "",
                    propertyType: listing.propertyType ?? null,
                    bedrooms: listing.bedrooms ?? null,
                    bathrooms: listing.bathrooms
                      ? String(listing.bathrooms)
                      : null,
                    squareMeter: listing.squareMeter ?? null,
                    street: listing.street ?? null,
                    city: listing.city ?? null,
                    referenceNumber:
                      ((listing as Record<string, unknown>).referenceNumber as
                        | string
                        | null) ?? null,
                    title: listing.title ?? listing.street ?? null,
                    imageUrl:
                      ((listing as Record<string, unknown>).imageUrl as
                        | string
                        | null) ?? null,
                    isActive: isActive as boolean,
                  };

                  // Filter visits for this specific listing and current contact
                  const listingVisits = visits.filter(
                    (v) =>
                      v.listingId?.toString() ===
                      listingForCard.listingId.toString(),
                  );

                  return (
                    <Card
                      key={listingContactIdStr}
                      className={cn(
                        "overflow-hidden",
                        isExpanded && "shadow-none",
                      )}
                    >
                      <CompactPropertyCard
                        listing={listingForCard}
                        isExpanded={isExpanded}
                        onToggle={() => toggleListing(listingForCard.listingId)}
                        showActionButtons={true}
                        listingContactId={listingContactId}
                        canDelete={hasEditContactsPermission}
                        canDeactivate={hasEditContactsPermission}
                        onDelete={handleDeleteInterest}
                        onDeactivate={handleDeactivateInterest}
                      />

                      {/* Expanded Content - Grouped Visit Cards */}
                      {isExpanded &&
                        (() => {
                          // Group visits by status
                          const urgentVisits = listingVisits
                            .filter(
                              (v) =>
                                v.status === "NoShow" ||
                                v.status === "Rescheduled",
                            )
                            .sort((a, b) => {
                              // Most recent first for urgent items
                              return (
                                new Date(b.datetimeStart).getTime() -
                                new Date(a.datetimeStart).getTime()
                              );
                            });

                          const activeVisits = listingVisits
                            .filter((v) => v.status === "Scheduled")
                            .sort((a, b) => {
                              // Soonest first for upcoming visits
                              return (
                                new Date(a.datetimeStart).getTime() -
                                new Date(b.datetimeStart).getTime()
                              );
                            });

                          const completedVisits = listingVisits
                            .filter((v) => v.status === "Completed")
                            .sort((a, b) => {
                              // Most recent first for completed
                              return (
                                new Date(b.datetimeStart).getTime() -
                                new Date(a.datetimeStart).getTime()
                              );
                            });

                          const cancelledVisits = listingVisits
                            .filter((v) => v.status === "Cancelled")
                            .sort((a, b) => {
                              // Most recent first for cancelled
                              return (
                                new Date(b.datetimeStart).getTime() -
                                new Date(a.datetimeStart).getTime()
                              );
                            });

                          return (
                            <div className="space-y-4 border-t border-gray-200 bg-gray-50 p-4">
                              {listingVisits.length === 0 ? (
                                <EmptyState type="completed-visits" />
                              ) : (
                                <div className="space-y-6">
                                  {/* 🔴 Urgent/Action Required Section */}
                                  {urgentVisits.length > 0 && (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2 px-1">
                                        <div className="h-2 w-2 rounded-full bg-rose-500" />
                                        <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-700">
                                          Requieren Atención (
                                          {urgentVisits.length})
                                        </h3>
                                      </div>
                                      <div className="space-y-3 pl-4">
                                        {urgentVisits.map((visit) => {
                                          const appointmentData: AppointmentData =
                                            {
                                              appointmentId:
                                                visit.appointmentId,
                                              type: visit.type ?? "",
                                              status: (visit.status ??
                                                "Completed") as
                                                | "Completed"
                                                | "Scheduled"
                                                | "Cancelled"
                                                | "Rescheduled"
                                                | "NoShow",
                                              datetimeStart:
                                                visit.datetimeStart,
                                              datetimeEnd: visit.datetimeEnd,
                                              tripTimeMinutes:
                                                visit.tripTimeMinutes ??
                                                undefined,
                                              notes: visit.notes ?? undefined,
                                              contactId:
                                                visit.contactId ?? undefined,
                                              contactName:
                                                `${visit.contactFirstName ?? ""} ${visit.contactLastName ?? ""}`.trim(),
                                              propertyAddress: undefined,
                                              agentName:
                                                visit.agentName ?? undefined,
                                              isOptimistic: false,
                                            };

                                          return (
                                            <AppointmentCard
                                              key={visit.appointmentId.toString()}
                                              appointment={appointmentData}
                                              onClick={(appointment) =>
                                                setSelectedAppointment(
                                                  appointment,
                                                )
                                              }
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
                                          Próximas Visitas (
                                          {activeVisits.length})
                                        </h3>
                                      </div>
                                      <div className="space-y-3">
                                        {activeVisits.map((visit) => {
                                          const appointmentData: AppointmentData =
                                            {
                                              appointmentId:
                                                visit.appointmentId,
                                              type: visit.type ?? "",
                                              status: (visit.status ??
                                                "Completed") as
                                                | "Completed"
                                                | "Scheduled"
                                                | "Cancelled"
                                                | "Rescheduled"
                                                | "NoShow",
                                              datetimeStart:
                                                visit.datetimeStart,
                                              datetimeEnd: visit.datetimeEnd,
                                              tripTimeMinutes:
                                                visit.tripTimeMinutes ??
                                                undefined,
                                              notes: visit.notes ?? undefined,
                                              contactId:
                                                visit.contactId ?? undefined,
                                              contactName:
                                                `${visit.contactFirstName ?? ""} ${visit.contactLastName ?? ""}`.trim(),
                                              propertyAddress: undefined,
                                              agentName:
                                                visit.agentName ?? undefined,
                                              isOptimistic: false,
                                            };

                                          return (
                                            <AppointmentCard
                                              key={visit.appointmentId.toString()}
                                              appointment={appointmentData}
                                              onClick={(appointment) =>
                                                setSelectedAppointment(
                                                  appointment,
                                                )
                                              }
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
                                      storageKey={`contact-activity-completed-${listingForCard.listingId}`}
                                    >
                                      <div className="space-y-3">
                                        {completedVisits.map((visit) => {
                                          const appointmentData: AppointmentData =
                                            {
                                              appointmentId:
                                                visit.appointmentId,
                                              type: visit.type ?? "",
                                              status: (visit.status ??
                                                "Completed") as
                                                | "Completed"
                                                | "Scheduled"
                                                | "Cancelled"
                                                | "Rescheduled"
                                                | "NoShow",
                                              datetimeStart:
                                                visit.datetimeStart,
                                              datetimeEnd: visit.datetimeEnd,
                                              tripTimeMinutes:
                                                visit.tripTimeMinutes ??
                                                undefined,
                                              notes: visit.notes ?? undefined,
                                              contactId:
                                                visit.contactId ?? undefined,
                                              contactName:
                                                `${visit.contactFirstName ?? ""} ${visit.contactLastName ?? ""}`.trim(),
                                              propertyAddress: undefined,
                                              agentName:
                                                visit.agentName ?? undefined,
                                              isOptimistic: false,
                                            };

                                          return (
                                            <AppointmentCard
                                              key={visit.appointmentId.toString()}
                                              appointment={appointmentData}
                                              onClick={(appointment) =>
                                                setSelectedAppointment(
                                                  appointment,
                                                )
                                              }
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
                                      storageKey={`contact-activity-cancelled-${listingForCard.listingId}`}
                                    >
                                      <div className="space-y-3">
                                        {cancelledVisits.map((visit) => {
                                          const appointmentData: AppointmentData =
                                            {
                                              appointmentId:
                                                visit.appointmentId,
                                              type: visit.type ?? "",
                                              status: (visit.status ??
                                                "Completed") as
                                                | "Completed"
                                                | "Scheduled"
                                                | "Cancelled"
                                                | "Rescheduled"
                                                | "NoShow",
                                              datetimeStart:
                                                visit.datetimeStart,
                                              datetimeEnd: visit.datetimeEnd,
                                              tripTimeMinutes:
                                                visit.tripTimeMinutes ??
                                                undefined,
                                              notes: visit.notes ?? undefined,
                                              contactId:
                                                visit.contactId ?? undefined,
                                              contactName:
                                                `${visit.contactFirstName ?? ""} ${visit.contactLastName ?? ""}`.trim(),
                                              propertyAddress: undefined,
                                              agentName:
                                                visit.agentName ?? undefined,
                                              isOptimistic: false,
                                            };

                                          return (
                                            <AppointmentCard
                                              key={visit.appointmentId.toString()}
                                              appointment={appointmentData}
                                              onClick={(appointment) =>
                                                setSelectedAppointment(
                                                  appointment,
                                                )
                                              }
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
                          );
                        })()}
                    </Card>
                  );
                })}
            </div>
          ) : (
            // Empty state for "Intereses"
            <Card className="p-12">
              <div className="text-center">
                <Home className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <h3 className="mb-2 text-lg font-semibold">
                  Sin intereses registrados
                </h3>
                <p className="text-muted-foreground">
                  Este contacto no tiene intereses de búsqueda registrados.
                </p>
              </div>
            </Card>
          )}
        </>
      )}

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
        permissions={{
          canEditContacts: hasEditContactsPermission,
        }}
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
        context={{
          listingId: undefined,
          contactId: contactId,
        }}
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
    </div>
  );
}
