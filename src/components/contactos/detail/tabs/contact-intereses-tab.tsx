"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AppointmentCard,
  type AppointmentData,
} from "~/components/appointments/appointment-card";
import { CompactPropertyCard } from "~/components/propiedades/compact-property-card";
import { EmptyState } from "~/components/propiedades/detail/activity/empty-states";
import { ExpandableSection } from "~/components/propiedades/detail/activity/expandable-section";
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
import { Home } from "lucide-react";
import type { ContactVisitWithDetails } from "~/types/activity";
import { cn } from "~/lib/utils";

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
      await removeListingContactRelationshipWithAuth(Number(contactId), Number(listingId), "buyer");
      setInteresesListings((prev) =>
        prev.filter((listing) => listing.listingId?.toString() !== listingId.toString()),
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

            {/* Expanded Content - Grouped Visit Cards */}
            {isExpanded && (
              <VisitsContent
                listingVisits={listingVisits}
                listingId={listingId}
                onAppointmentClick={setSelectedAppointment}
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
    contactName: `${visit.contactFirstName ?? ""} ${visit.contactLastName ?? ""}`.trim(),
    propertyAddress: undefined,
    agentName: visit.agentName ?? undefined,
    isOptimistic: false,
  });

  if (listingVisits.length === 0) {
    return (
      <div className="border-t border-gray-200 bg-gray-50 p-4">
        <EmptyState type="completed-visits" />
      </div>
    );
  }

  return (
    <div className="space-y-4 border-t border-gray-200 bg-gray-50 p-4">
      <div className="space-y-6">
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
            storageKey={`contact-intereses-completed-${listingId}`}
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
            storageKey={`contact-intereses-cancelled-${listingId}`}
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
    </div>
  );
}