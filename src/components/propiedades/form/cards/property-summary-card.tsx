"use client";

import { useRouter } from "next/navigation";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Bed,
  Bath,
  Square,
  Users,
  Briefcase,
  Key,
  Globe,
  Loader2,
  DoorOpen,
  Pencil
} from "lucide-react";

import type { PropertyListing } from "~/types/property-listing";
import { navigateToPage } from "~/lib/navigation";

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
  hasKeys: boolean;
  keysLoading: boolean;
  publishToWebsite: boolean;
  websiteLoading: boolean;
  canEdit?: boolean;
  onToggleKeys: () => void;
  onToggleWebsite: () => void;
  onEditOwner?: () => void;
}

export function PropertySummaryCard({
  listing,
  propertyType,
  selectedOwnerIds,
  owners,
  selectedAgentId,
  agents,
  hasKeys,
  keysLoading,
  publishToWebsite,
  websiteLoading,
  canEdit = true,
  onToggleKeys,
  onToggleWebsite,
  onEditOwner,
}: PropertySummaryCardProps) {
  const router = useRouter();
  const isGarageOrSolar = propertyType === "garaje" || propertyType === "solar";
  const shouldShowBedsAndBaths = !isGarageOrSolar;
  const isLocal = propertyType === "local";
  const rawAreaValue = isGarageOrSolar ? listing.builtSurfaceArea : listing.squareMeter;
  const areaValue = propertyType === "solar" && rawAreaValue != null
    ? Math.round(rawAreaValue)
    : rawAreaValue;

  // Format area with thousand separators (e.g., 1000 -> "1.000")
  const formatAreaDisplay = (value: number | null | undefined): string => {
    if (value == null) return '-';
    const numValue = Math.round(value);
    return numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleOwnerClick = () => {
    if (selectedOwnerIds.length > 0) {
      const ownerId = selectedOwnerIds[0];
      navigateToPage(`/contactos/${ownerId}`, router);
    }
  };
  
  return (
    <Card className="col-span-full bg-gradient-to-br from-amber-50/50 to-rose-50/50 border-gradient-to-r border-amber-200/30 shadow-lg mb-2 md:mb-3">
      <div className="p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          {/* Property Metrics - First row on mobile, left on desktop */}
          <div className="flex items-center justify-center md:justify-start gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            {/* Bedrooms - only show for non-garage/solar properties */}
            {shouldShowBedsAndBaths && (
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-gradient-to-r from-amber-200 to-rose-200">
                  {isLocal ? (
                    <DoorOpen className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-amber-800" />
                  ) : (
                    <Bed className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-amber-800" />
                  )}
                </div>
                <p className="text-sm sm:text-base md:text-lg font-bold text-gray-900">
                  {listing.bedrooms ?? '-'}
                </p>
              </div>
            )}

            {/* Bathrooms - only show for non-garage/solar properties */}
            {shouldShowBedsAndBaths && (
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-gradient-to-r from-amber-200 to-rose-200">
                  <Bath className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-amber-800" />
                </div>
                <p className="text-sm sm:text-base md:text-lg font-bold text-gray-900">
                  {listing.bathrooms ? Math.round(listing.bathrooms) : '-'}
                </p>
              </div>
            )}

            {/* Area - use buildSurfaceArea for garage/solar, squareMeter for others */}
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-gradient-to-r from-amber-200 to-rose-200">
                <Square className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-amber-800" />
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-sm sm:text-base md:text-lg font-bold text-gray-900">
                  {formatAreaDisplay(areaValue)}
                </p>
                {areaValue != null && (
                  <p className="text-xs text-gray-500">m²</p>
                )}
              </div>
            </div>
          </div>

          {/* Second row on mobile: Owner/Agent group and Toggle buttons group with space between */}
          <div className="flex items-center justify-between md:justify-center md:gap-4">
            {/* Owner and Agent - grouped together */}
            <div className="flex items-center gap-2 sm:gap-3 ml-2 md:ml-0">
              {/* Owner */}
              <div className="group/owner relative flex items-center gap-1.5 sm:gap-2 bg-white/70 rounded-lg px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 shadow-sm min-w-0">
                <button
                  onClick={handleOwnerClick}
                  className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-amber-200 to-rose-200 transition-transform duration-200 hover:scale-125 cursor-pointer"
                  title="Ver propietario"
                >
                  <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-800" />
                </button>
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-16 sm:max-w-20 md:max-w-32 lg:max-w-40">
                  {selectedOwnerIds.length > 0
                    ? owners.find(o => o.id.toString() === selectedOwnerIds[0])?.name ?? 'Sin asignar'
                    : 'Sin asignar'}
                </p>
                {onEditOwner && canEdit && (
                  <button
                    onClick={onEditOwner}
                    className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/60 text-white shadow-md opacity-0 group-hover/owner:opacity-100 transition-opacity duration-200 hover:bg-amber-500/70"
                    title="Editar propietario"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Agent */}
              <div className="group/agent relative flex items-center gap-1.5 sm:gap-2 bg-white/70 rounded-lg px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 shadow-sm min-w-0">
                <div className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-amber-200 to-rose-200">
                  <Briefcase className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-800" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-16 sm:max-w-20 md:max-w-32 lg:max-w-40">
                  {selectedAgentId
                    ? agents.find(a => a.id === selectedAgentId)?.name ?? 'Sin asignar'
                    : 'Sin asignar'}
                </p>
                {onEditOwner && canEdit && (
                  <button
                    onClick={onEditOwner}
                    className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/60 text-white shadow-md opacity-0 group-hover/agent:opacity-100 transition-opacity duration-200 hover:bg-amber-500/70"
                    title="Editar agente"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Toggle buttons - grouped together */}
            <div className="flex items-center gap-2 sm:gap-3 mr-6 md:mr-0">
              {/* Keys toggle button */}
              <Button
                onClick={onToggleKeys}
                disabled={!canEdit || keysLoading}
                size="sm"
                variant="ghost"
                className={`w-7 h-7 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full p-0 transition-all duration-200 flex-shrink-0 ${
                  hasKeys
                    ? "bg-white hover:bg-gray-50 text-black shadow-xl scale-105"
                    : "bg-transparent hover:bg-gray-50 text-gray-400 shadow-sm"
                }`}
                title={hasKeys ? "Tenemos las llaves" : "No tenemos las llaves"}
              >
                {keysLoading ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <Key className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>

              {/* Website toggle button */}
              <Button
                onClick={onToggleWebsite}
                disabled={!canEdit || websiteLoading}
                size="sm"
                variant="ghost"
                className={`w-7 h-7 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full p-0 transition-all duration-200 flex-shrink-0 ${
                  publishToWebsite
                    ? "bg-white hover:bg-gray-50 text-black shadow-xl scale-105"
                    : "bg-transparent hover:bg-gray-50 text-gray-400 shadow-sm"
                }`}
                title={publishToWebsite ? "Publicar en web" : "No publicar en web"}
              >
                {websiteLoading ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}