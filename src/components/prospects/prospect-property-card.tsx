"use client";

import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Bed, Bath, Square, MapPin } from "lucide-react";
import { cn } from "~/lib/utils";
import Image from "next/image";

interface ProspectPropertyCardProps {
  listingId: bigint;
  price?: string | null;
  propertyType?: string | null;
  bedrooms?: number | null;
  bathrooms?: string | null;
  squareMeter?: number | null;
  street?: string | null;
  city?: string | null;
  imageUrl?: string | null;
  listingType?: string;
  isExternal: boolean;
  matchQuality: "high" | "medium" | "low";
  onClick?: () => void;
}

const MATCH_QUALITY_CONFIG = {
  high: {
    label: "Excelente",
    className: "bg-emerald-100 text-emerald-700",
  },
  medium: {
    label: "Buena",
    className: "bg-blue-100 text-blue-700",
  },
  low: {
    label: "Aceptable",
    className: "bg-gray-100 text-gray-700",
  },
};

export function ProspectPropertyCard({
  listingId,
  price,
  propertyType,
  bedrooms,
  bathrooms,
  squareMeter,
  street,
  city,
  imageUrl,
  listingType,
  isExternal,
  matchQuality,
  onClick,
}: ProspectPropertyCardProps) {
  const matchConfig = MATCH_QUALITY_CONFIG[matchQuality];

  // Format price
  const formatPrice = (price?: string | null) => {
    if (!price) return "Precio no disponible";
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return "Precio no disponible";

    if (listingType === "Sale") {
      return `${Math.round(numPrice / 1000)}k €`;
    }
    return `${numPrice.toLocaleString("es-ES")} €/mes`;
  };

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all hover:shadow-md",
        onClick && "cursor-pointer",
      )}
      onClick={onClick}
    >
      <div className="flex gap-3 p-3">
        {/* Image Section - Blurred for external */}
        <div className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-md">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={street ?? "Property"}
              fill
              className={cn(
                "object-cover",
                isExternal && "blur-sm",
              )}
            />
          ) : (
            <div className={cn(
              "flex h-full w-full items-center justify-center bg-gray-200",
              isExternal && "blur-sm"
            )}>
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Match Quality Badge */}
          <div className="flex items-center justify-between gap-2">
            <Badge className={cn("text-[10px]", matchConfig.className)}>
              {matchConfig.label}
            </Badge>
          </div>

          {/* Property Details - NOT Blurred */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {bedrooms !== null && bedrooms !== undefined && (
              <div className="flex items-center gap-1 text-gray-600">
                <Bed className="h-3.5 w-3.5" />
                <span className="text-xs">{bedrooms}</span>
              </div>
            )}
            {bathrooms && (
              <div className="flex items-center gap-1 text-gray-600">
                <Bath className="h-3.5 w-3.5" />
                <span className="text-xs">{bathrooms}</span>
              </div>
            )}
            {squareMeter && (
              <div className="flex items-center gap-1 text-gray-600">
                <Square className="h-3.5 w-3.5" />
                <span className="text-xs">{squareMeter}m²</span>
              </div>
            )}
          </div>

          {/* Price and Location - Blurred for external */}
          <div className={cn("space-y-1", isExternal && "blur-sm")}>
            <div className="text-sm font-semibold text-gray-900">
              {formatPrice(price)}
            </div>
            {(street ?? city) && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {street ?? city}
                  {street && city && `, ${city}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
