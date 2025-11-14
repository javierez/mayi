"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Building,
  ChevronDown,
  ChevronUp,
  MapPin,
  Home,
  FileText,
  Bed,
  Bath,
  Maximize,
  Trash2,
  EyeOff,
} from "lucide-react";
import {
  formatListingType,
  getPropertyTypeLabel,
} from "~/components/contactos/contact-config";
import { PropertyImagePlaceholder } from "./PropertyImagePlaceholder";
import { Button } from "~/components/ui/button";

interface CompactPropertyCardProps {
  listing: {
    listingId: bigint;
    propertyId: bigint;
    price: string;
    listingType: string;
    propertyType: string | null;
    bedrooms: number | null;
    bathrooms: string | null;
    squareMeter: number | null;
    builtSurfaceArea: number | null;
    street: string | null;
    city: string | null;
    referenceNumber: string | null;
    title: string | null;
    imageUrl: string | null;
    isActive?: boolean;
  };
  isExpanded: boolean;
  onToggle: () => void;
  showActionButtons?: boolean;
  listingContactId?: bigint;
  canDelete?: boolean;
  canDeactivate?: boolean;
  onDelete?: (listingId: bigint) => void;
  onDeactivate?: (listingId: bigint) => void;
}

export function CompactPropertyCard({
  listing,
  isExpanded,
  onToggle,
  showActionButtons = false,
  listingContactId: _listingContactId,
  canDelete = false,
  canDeactivate = false,
  onDelete,
  onDeactivate,
}: CompactPropertyCardProps) {
  // Format location
  const location =
    [listing.street, listing.city].filter(Boolean).join(", ") ||
    "Sin dirección";

  // Format price without decimals
  const formattedPrice = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parseFloat(listing.price));

  const isActive = listing.isActive ?? true;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(listing.listingId);
    }
  };

  const handleDeactivate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeactivate) {
      onDeactivate(listing.listingId);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  return (
    <div
      className="group relative cursor-pointer transition-colors hover:bg-muted/30"
      onClick={onToggle}
    >
      <div className="flex gap-3 p-3">
        {/* Property Image - Reduced size */}
        <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
          {listing.imageUrl ? (
            <Image
              src={listing.imageUrl}
              alt={listing.title ?? location}
              fill
              className={`object-cover ${!isActive ? "grayscale" : ""}`}
              sizes="80px"
            />
          ) : (
            <PropertyImagePlaceholder
              propertyType={listing.propertyType}
              className="h-full w-full rounded-md"
            />
          )}
        </div>

        {/* Property Details */}
        <div className="min-w-0 flex-1 text-left">
          {/* Title/Location */}
          <div className="mb-1 flex items-start gap-1.5">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <Link
              href={`/propiedades/${listing.listingId.toString()}`}
              className="truncate text-sm font-medium uppercase leading-tight tracking-wide hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {location}
            </Link>
          </div>

          {/* Property Info */}
          <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Home className="h-3 w-3" />
              <span>{getPropertyTypeLabel(listing.propertyType)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Building className="h-3 w-3" />
              <span>{formatListingType(listing.listingType)}</span>
            </div>
            {listing.bedrooms != null && (
              <div className="flex items-center gap-1">
                <Bed className="h-3 w-3" />
                <span>{listing.bedrooms}</span>
              </div>
            )}
            {listing.bathrooms != null && (
              <div className="flex items-center gap-1">
                <Bath className="h-3 w-3" />
                <span>{Math.floor(Number(listing.bathrooms))}</span>
              </div>
            )}
            {(listing.squareMeter ?? listing.builtSurfaceArea) != null && (
              <div className="flex items-center gap-1">
                <Maximize className="h-3 w-3" />
                <span>{(listing.squareMeter ?? listing.builtSurfaceArea)}m²</span>
              </div>
            )}
          </div>

          {/* Reference */}
          {listing.referenceNumber && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>{listing.referenceNumber}</span>
            </div>
          )}
        </div>

        {/* Price and Action Buttons */}
        <div className="flex flex-shrink-0 flex-col items-end justify-between">
          <p className="text-base font-semibold">{formattedPrice}€</p>

          {/* Action Buttons - Bottom right corner, shown on hover */}
          {showActionButtons && (
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {canDeactivate && isActive && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeactivate}
                  className="h-6 w-6 hover:bg-muted"
                  title="Desactivar interés"
                >
                  <EyeOff className="h-3 w-3 text-muted-foreground" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="h-6 w-6 hover:bg-muted"
                  title="Eliminar interés"
                >
                  <Trash2 className="h-3 w-3 text-red-600" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggle}
                className="h-6 w-6 hover:bg-muted"
                title={isExpanded ? "Contraer" : "Expandir"}
              >
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
