"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { GalleryPropertyCard } from "./gallery-property-card";
import { X } from "lucide-react";

interface GalleryListing {
  listingId: bigint;
  propertyId: bigint;
  price: string;
  status: string;
  listingType: string;
  isBankOwned: boolean | null;
  referenceNumber: string | null;
  propertyType: string | null;
  street: string | null;
  city: string | null;
  province: string | null;
  agentName: string | null;
  imageUrl: string | null;
  imageUrl2: string | null;
}

interface RecentPropertiesGalleryProps {
  listings: GalleryListing[];
}

export function RecentPropertiesGallery({
  listings,
}: RecentPropertiesGalleryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedListingId = searchParams.get("listingId");

  const handleCardClick = useCallback(
    (listingId: string) => {
      const params = new URLSearchParams(searchParams.toString());

      // Toggle selection - if same card clicked, remove filter
      if (selectedListingId === listingId) {
        params.delete("listingId");
      } else {
        params.set("listingId", listingId);
        params.set("page", "1"); // Reset to first page when filtering
      }

      router.push(`/historial?${params.toString()}`);
    },
    [router, searchParams, selectedListingId],
  );

  const handleClearFilter = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("listingId");
    router.push(`/historial?${params.toString()}`);
  }, [router, searchParams]);

  if (listings.length === 0) {
    return null;
  }

  // Find selected listing for display
  const selectedListing = selectedListingId
    ? listings.find((l) => l.listingId.toString() === selectedListingId)
    : null;

  // When filtering, only show the selected card
  const displayListings = selectedListingId && selectedListing
    ? [selectedListing]
    : listings;

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <div />
        {selectedListingId && (
          <button
            onClick={handleClearFilter}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
            <span>Quitar filtro</span>
          </button>
        )}
      </div>
      <div className="scrollbar-hide -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex gap-3 py-1">
          {displayListings.map((listing) => (
            <GalleryPropertyCard
              key={listing.listingId.toString()}
              listing={listing}
              isSelected={selectedListingId === listing.listingId.toString()}
              onClick={handleCardClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
