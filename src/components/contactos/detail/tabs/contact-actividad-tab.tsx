"use client";

import { useState, useEffect } from "react";
import { canDeleteAllTasks } from "~/app/actions/permissions/check-permissions";
import { Card } from "~/components/ui/card";
import { GeneralActivityTimeline } from "~/components/contactos/general-activity-timeline";
import { getAllListingContactActivityByContactIdWithAuth } from "~/server/queries/listing-contact-activity";
import { getContactActivityByContactIdWithAuth } from "~/server/queries/contact-activity";
import { deleteListingContactActivityAction } from "~/server/actions/listing-contact-activity";
import type { ListingContactActivityWithUser } from "~/server/queries/listing-contact-activity";
import type { ContactActivityWithUser } from "~/server/queries/contact-activity";
import { toast } from "sonner";

interface ContactActividadTabProps {
  contactId: bigint;
}

/**
 * ContactActividadTab - Activity timeline for a contact
 *
 * Shows a chronological timeline of all activities related to a contact,
 * including both listing-contact activities and direct contact activities.
 */
export function ContactActividadTab({ contactId }: ContactActividadTabProps) {
  // Activities state
  const [listingActivities, setListingActivities] = useState<ListingContactActivityWithUser[]>([]);
  const [contactActivities, setContactActivities] = useState<ContactActivityWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Permission states
  const [hasDeleteAllPermission, setHasDeleteAllPermission] = useState(false);

  // Fetch permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const deleteAllPerm = await canDeleteAllTasks();
        setHasDeleteAllPermission(deleteAllPerm);
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    };
    void fetchPermissions();
  }, []);

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      try {
        const [listingActivitiesData, contactActivitiesData] = await Promise.all([
          getAllListingContactActivityByContactIdWithAuth(contactId),
          getContactActivityByContactIdWithAuth(contactId),
        ]);
        setListingActivities(listingActivitiesData);
        setContactActivities(contactActivitiesData);
      } catch (error) {
        console.error("Error fetching activities:", error);
        setListingActivities([]);
        setContactActivities([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchActivities();
  }, [contactId]);

  // Refresh activities handler
  const handleRefreshActivities = async () => {
    setIsLoading(true);
    try {
      const [listingActivitiesData, contactActivitiesData] = await Promise.all([
        getAllListingContactActivityByContactIdWithAuth(contactId),
        getContactActivityByContactIdWithAuth(contactId),
      ]);
      setListingActivities(listingActivitiesData);
      setContactActivities(contactActivitiesData);
    } catch (error) {
      console.error("Error refreshing activities:", error);
      toast.error("Error al actualizar las actividades");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete activity handler
  const handleDeleteActivity = async (
    activityId: bigint,
    activityType: "listing" | "contact",
  ) => {
    let result;

    if (activityType === "listing") {
      result = await deleteListingContactActivityAction(activityId);
    } else {
      const { deleteContactActivityAction } = await import(
        "~/server/actions/contact-activity"
      );
      result = await deleteContactActivityAction(activityId);
    }

    if (result.success) {
      await handleRefreshActivities();
    } else {
      throw new Error(result.error ?? "Error al eliminar la actividad");
    }
  };

  return (
    <Card className="p-6">
      <GeneralActivityTimeline
        listingActivities={listingActivities}
        contactActivities={contactActivities}
        loading={isLoading}
        contactId={BigInt(contactId)}
        onDelete={handleDeleteActivity}
        canDeleteAll={hasDeleteAllPermission}
        onActivityAdded={handleRefreshActivities}
      />
    </Card>
  );
}
