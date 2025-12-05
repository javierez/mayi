"use client";

import { useRouter } from "next/navigation";
import { Card } from "~/components/ui/card";
import {
  Bed,
  Bath,
  Square,
  Users,
  Briefcase,
  DoorOpen,
  Pencil,
} from "lucide-react";

import type { PropertyListing } from "~/types/property-listing";
import { navigateToPage } from "~/lib/navigation";
import { getSquareMeter } from "~/lib/properties/area-utils";

interface Agent {
  id: string;
  name: string;
}

interface Owner {
  id: number;
  name: string;
}

interface PropertySummaryCardProps {
  listing: PropertyListing;
  propertyType: string;
  selectedOwnerIds: string[];
  owners: Owner[];
  selectedAgentId: string;
  agents: Agent[];
  canEdit?: boolean;
  onEditOwner?: () => void;
}

export function PropertySummaryCard({
  listing,
  propertyType,
  selectedOwnerIds,
  owners,
  selectedAgentId,
  agents,
  canEdit = true,
  onEditOwner,
}: PropertySummaryCardProps) {
  const router = useRouter();
  const isGarageOrSolar = propertyType === "garaje" || propertyType === "solar";
  const shouldShowBedsAndBaths = !isGarageOrSolar;
  const isLocal = propertyType === "local";
  
  // Use bidirectional fallback for area values
  const rawAreaValue = getSquareMeter(listing);

  const areaValue =
    propertyType === "solar" && rawAreaValue != null
      ? Math.round(rawAreaValue)
      : rawAreaValue;

  // Format area with thousand separators (e.g., 1000 -> "1.000")
  const formatAreaDisplay = (value: number | null | undefined): string => {
    if (value == null) return "-";
    const numValue = Math.round(value);
    return numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleOwnerClick = () => {
    const ownerId =
      listing.owners?.[0]?.id ??
      (selectedOwnerIds.length > 0 ? selectedOwnerIds[0] : null);
    if (ownerId) {
      navigateToPage(`/contactos/${ownerId}`, router);
    }
  };

  return (
    <Card className="border-gradient-to-r col-span-full mb-2 border-amber-200/30 bg-gradient-to-br from-amber-50/50 to-rose-50/50 shadow-lg md:mb-3">
      <div className="p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          {/* Property Metrics - First row on mobile, left on desktop */}
          <div className="flex items-center justify-center gap-4 sm:gap-5 md:justify-start md:gap-6 lg:gap-8">
            {/* Bedrooms - only show for non-garage/solar properties */}
            {shouldShowBedsAndBaths && (
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-amber-200 to-rose-200 sm:h-9 sm:w-9 md:h-10 md:w-10">
                  {isLocal ? (
                    <DoorOpen className="sm:h-4.5 sm:w-4.5 h-4 w-4 text-amber-800 md:h-5 md:w-5" />
                  ) : (
                    <Bed className="sm:h-4.5 sm:w-4.5 h-4 w-4 text-amber-800 md:h-5 md:w-5" />
                  )}
                </div>
                <p className="text-sm font-bold text-gray-900 sm:text-base md:text-lg">
                  {listing.bedrooms ?? "-"}
                </p>
              </div>
            )}

            {/* Bathrooms - only show for non-garage/solar properties */}
            {shouldShowBedsAndBaths && (
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-amber-200 to-rose-200 sm:h-9 sm:w-9 md:h-10 md:w-10">
                  <Bath className="sm:h-4.5 sm:w-4.5 h-4 w-4 text-amber-800 md:h-5 md:w-5" />
                </div>
                <p className="text-sm font-bold text-gray-900 sm:text-base md:text-lg">
                  {listing.bathrooms ? Math.round(listing.bathrooms) : "-"}
                </p>
              </div>
            )}

            {/* Area - use fallback pattern (squareMeter ?? builtSurfaceArea) for all property types */}
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-amber-200 to-rose-200 sm:h-9 sm:w-9 md:h-10 md:w-10">
                <Square className="sm:h-4.5 sm:w-4.5 h-4 w-4 text-amber-800 md:h-5 md:w-5" />
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-sm font-bold text-gray-900 sm:text-base md:text-lg">
                  {formatAreaDisplay(areaValue)}
                </p>
                {areaValue != null && (
                  <p className="text-xs text-gray-500">m²</p>
                )}
              </div>
            </div>
          </div>

          {/* Second row on mobile: Owner/Agent group */}
          <div className="flex items-center justify-center gap-4">
            {/* Owner and Agent - grouped together */}
            <div className="ml-2 flex items-center gap-2 sm:gap-3 md:ml-0">
              {/* Owner */}
              <div className="group/owner relative flex min-w-0 items-center gap-1.5 rounded-lg bg-white/70 px-2 py-1.5 shadow-sm sm:gap-2 sm:px-2.5 sm:py-2 md:px-3">
                <button
                  onClick={handleOwnerClick}
                  className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-amber-200 to-rose-200 transition-transform duration-200 hover:scale-125 sm:h-6 sm:w-6"
                  title="Ver propietario"
                >
                  <Users className="h-2.5 w-2.5 text-amber-800 sm:h-3 sm:w-3" />
                </button>
                <p className="max-w-16 truncate text-[10px] font-medium text-gray-900 sm:max-w-20 sm:text-xs md:max-w-32 md:text-sm lg:max-w-40">
                  {listing.owners?.[0]?.name ??
                    (selectedOwnerIds.length > 0
                      ? (owners.find(
                          (o) => o.id.toString() === selectedOwnerIds[0],
                        )?.name ?? "Sin asignar")
                      : "Sin asignar")}
                </p>
                {onEditOwner && canEdit && (
                  <button
                    onClick={onEditOwner}
                    className="absolute -right-2 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/60 text-white opacity-0 shadow-md transition-opacity duration-200 hover:bg-amber-500/70 group-hover/owner:opacity-100"
                    title="Editar propietario"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Agent */}
              <div className="group/agent relative flex min-w-0 items-center gap-1.5 rounded-lg bg-white/70 px-2 py-1.5 shadow-sm sm:gap-2 sm:px-2.5 sm:py-2 md:px-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-amber-200 to-rose-200 sm:h-6 sm:w-6">
                  <Briefcase className="h-2.5 w-2.5 text-amber-800 sm:h-3 sm:w-3" />
                </div>
                <p className="max-w-16 truncate text-[10px] font-medium text-gray-900 sm:max-w-20 sm:text-xs md:max-w-32 md:text-sm lg:max-w-40">
                  {listing.agent?.name ??
                    (selectedAgentId
                      ? (agents.find((a) => a.id === selectedAgentId)?.name ??
                        "Sin asignar")
                      : "Sin asignar")}
                </p>
                {onEditOwner && canEdit && (
                  <button
                    onClick={onEditOwner}
                    className="absolute -right-2 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/60 text-white opacity-0 shadow-md transition-opacity duration-200 hover:bg-amber-500/70 group-hover/agent:opacity-100"
                    title="Editar agente"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
