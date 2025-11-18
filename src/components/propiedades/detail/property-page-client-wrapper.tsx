"use client";

import { useState, useCallback, useEffect } from "react";
import { PropertyTabs } from "./property-tabs";
import type { PropertyImage } from "~/lib/data";
import type { PropertyListing } from "~/types/property-listing";

interface PropertyTabsWrapperProps {
  listing: {
    listingId: bigint;
    propertyId: bigint;
    propertyType?: string | null;
    street?: string | null;
    city?: string | null;
    province?: string | null;
    postalCode?: string | null;
    referenceNumber?: string | null;
    price: string;
    listingType: string;
    isBankOwned?: boolean | null;
    isFeatured?: boolean | null;
    neighborhood?: string | null;
    title?: string | null;
    fotocasa?: boolean | null;
    idealista?: boolean | null;
    habitaclia?: boolean | null;
    milanuncios?: boolean | null;
    fotocasaProps?: unknown;
    idealistaProps?: unknown;
    habitacliaProps?: unknown;
    milanunciosProps?: unknown;
    energyCertification?: string | null;
    agentId?: string | null;
  };
  images: PropertyImage[];
  videos: PropertyImage[];
  youtubeLinks: PropertyImage[];
  virtualTours: PropertyImage[];
  energyCertificate?: {
    docId: bigint;
    documentKey: string;
    fileUrl: string;
  } | null;
  convertedListing?: PropertyListing;
  canEdit?: boolean;
}

export function PropertyTabsClientWrapper(props: PropertyTabsWrapperProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Create a stable callback that can be called from the modal
  const handleTasksRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Expose the refresh function globally so the modal can access it
  // This is a workaround since the modal is rendered outside this component tree
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as { refreshPropertyTasks?: () => void }).refreshPropertyTasks =
        handleTasksRefresh;
    }

    // Cleanup on unmount
    return () => {
      if (typeof window !== "undefined") {
        delete (window as { refreshPropertyTasks?: () => void })
          .refreshPropertyTasks;
      }
    };
  }, [handleTasksRefresh]);

  return <PropertyTabs {...props} tasksRefreshTrigger={refreshTrigger} />;
}
