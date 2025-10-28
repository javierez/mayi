"use client";

import React, { useState } from "react";
// import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Card, CardFooter } from "~/components/ui/card";
// import { Button } from "~/components/ui/button";
// import { Skeleton } from "~/components/ui/skeleton";
import {
  Bed,
  Bath,
  Square as SquareIcon,
  // MapPin,
  User,
  X,
  // Mail,
  CheckCircle,
  AlertCircle,
  Euro,
  Link as LinkIcon,
  Share2,
} from "lucide-react";
import type { ProspectMatch, MatchAction } from "~/types/connection-matches";
import { navigateToPage } from "~/lib/navigation";
// import { PropertyImagePlaceholder } from "~/components/propiedades/PropertyImagePlaceholder";

interface MatchCardProps {
  match: ProspectMatch;
  onAction?: (action: MatchAction, match: ProspectMatch) => Promise<void>;
  showActions?: boolean;
}

export const MatchCard = React.memo(function MatchCard({
  match,
  onAction,
  showActions = true,
}: MatchCardProps) {
  const router = useRouter();
  // const [imageLoaded, setImageLoaded] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<MatchAction | null>(
    null,
  );

  const { listing, matchType, isCrossAccount, canContact, hasExistingLead } =
    match;

  // Extract contact ID for use in footer link
  const contactId = match.prospect.contacts.contactId;

  // Debug logs
  console.log('🔍 MatchCard - Full listing object:', listing);
  console.log('🏠 MatchCard - Properties object:', listing.properties);
  console.log('📝 MatchCard - Property title:', listing.properties.title);
  console.log('🏷️ MatchCard - Property type:', listing.properties.propertyType);

  // const defaultPlaceholder = "";
  // const imageSrc = defaultPlaceholder; // TODO: Add imageUrl when available in ListingWithDetails type

  const getListingTypeLabel = (type: string) => {
    switch (type) {
      case "Sale":
        return "Venta";
      case "Rent":
        return "Alquiler";
      case "RentWithOption":
        return "Alquiler";
      default:
        return type;
    }
  };

  const getMatchTypeBadge = () => {
    // Show lead status if lead exists
    if (hasExistingLead) {
      return (
        <Badge className="bg-transparent border-0 p-1 h-5 w-5" title="Lead Creado">
          <CheckCircle className="h-3 w-3 text-blue-700" />
        </Badge>
      );
    }

    // Otherwise show match type
    if (matchType === "strict") {
      return (
        <Badge className="bg-transparent border-0 p-1 h-5 w-5" title="Coincidencia Exacta">
          <CheckCircle className="h-3 w-3 text-green-700" />
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-transparent border-0 p-1 h-5 w-5" title="Coincidencia Aproximada">
          <AlertCircle className="h-3 w-3 text-orange-700" />
        </Badge>
      );
    }
  };

  const handleAction = async (action: MatchAction) => {
    if (!onAction) return;

    setIsActionLoading(action);
    try {
      await onAction(action, match);
    } finally {
      setIsActionLoading(null);
    }
  };

  const truncateName = (firstName: string, lastName: string, maxLength = 14) => {
    const fullName = `${firstName} ${lastName}`;
    if (fullName.length <= maxLength) {
      return fullName;
    }
    return `${fullName.substring(0, maxLength - 1)}…`;
  };

  const truncateTitle = (text: string, maxLength = 35) => {
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.substring(0, maxLength - 1)}…`;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if user can contact and not clicking on action buttons
    if (canContact && !(e.target as HTMLElement).closest('button')) {
      navigateToPage(`/propiedades/${listing.listings.id.toString()}`, router);
    }
  };

  const renderContent = () => (
    <Card
      className={`overflow-hidden shadow-md transition-all hover:shadow-lg relative cursor-pointer ${
        hasExistingLead
          ? "opacity-50 border-2 border-green-200 bg-green-50/30 hover:opacity-70"
          : "border-0"
      }`}
      onClick={handleCardClick}
    >
      {/* Lead Created Band - Left Side */}
      {hasExistingLead && (
        <div className="absolute top-0 left-0 bottom-0 w-8 bg-green-600 z-20" />
      )}

      {/* Match Type Badge - Top Right Corner */}
      <div className="absolute top-1 right-1 z-10">
        {!hasExistingLead && getMatchTypeBadge()}
      </div>

      {/* Centered Content */}
      <div className="p-2 text-center">
        {/* First Row - Property Title (Highest Importance) */}
        <div className="mt-2 mb-4">
          <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">
            {truncateTitle(`${getListingTypeLabel(listing.listings.listingType)} de ${listing.properties.title ?? "Propiedad sin título"}`)}
          </h3>
        </div>
        
        {/* Second Row - Cross-account indicator only */}
        {isCrossAccount && (
          <div className="flex items-center justify-center gap-2 mb-1">
            <Badge variant="secondary" className="bg-blue-500 text-xs text-white px-1 py-0">
              Externa
            </Badge>
          </div>
        )}

        {/* Properties Box */}
        <div className="group relative mx-auto w-4/5 rounded-md bg-gradient-to-br from-slate-50 to-gray-100 p-1 shadow-sm mb-2">
          <div className="grid grid-cols-2 gap-0 text-xs">
            {/* Price */}
            <div className="flex items-center justify-center gap-0.5 text-gray-700">
              <Euro className="h-3 w-3" />
              <span>
                {listing.listings.listingType === "Sale"
                  ? `${Math.round(parseFloat(listing.listings.price) / 1000)}k`
                  : parseFloat(listing.listings.price).toLocaleString()}
              </span>
            </div>

            {/* Bedrooms */}
            {listing.properties.propertyType !== "garaje" &&
              listing.properties.propertyType !== "local" && (
                <div className="flex items-center justify-center gap-0.5 text-gray-700">
                  <Bed className="h-3 w-3" />
                  <span>{listing.properties.bedrooms ?? "-"}</span>
                </div>
              )}
            
            {/* For garaje/local, show a dash for bedrooms */}
            {(listing.properties.propertyType === "garaje" ||
              listing.properties.propertyType === "local") && (
              <div className="flex items-center justify-center gap-0.5 text-gray-400">
                <Bed className="h-3 w-3" />
                <span>-</span>
              </div>
            )}

            {/* Bathrooms */}
            {listing.properties.propertyType !== "garaje" &&
              listing.properties.propertyType !== "local" && (
                <div className="flex items-center justify-center gap-0.5 text-gray-700">
                  <Bath className="h-3 w-3" />
                  <span>
                    {listing.properties.bathrooms
                      ? Math.floor(Number(listing.properties.bathrooms))
                      : "-"}
                  </span>
                </div>
              )}
            
            {/* For garaje/local, show a dash for bathrooms */}
            {(listing.properties.propertyType === "garaje" ||
              listing.properties.propertyType === "local") && (
              <div className="flex items-center justify-center gap-0.5 text-gray-400">
                <Bath className="h-3 w-3" />
                <span>-</span>
              </div>
            )}

            {/* Square meters */}
            <div className="flex items-center justify-center gap-0.5 text-gray-700">
              <SquareIcon className="h-3 w-3" />
              <span>{listing.properties.squareMeter ?? "-"}m²</span>
            </div>
          </div>
          
          {/* Hover Action Buttons - Overlay on Properties Box */}
          {showActions && (
            <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/20 backdrop-blur-sm opacity-0 transition-all duration-300 group-hover:opacity-100 rounded-md">
              {!hasExistingLead ? (
                <>
                  {/* Create Lead Button */}
                  <button
                    className="h-8 w-8 rounded-full bg-white/95 hover:bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void handleAction("create-lead");
                    }}
                    disabled={isActionLoading !== null}
                    title="Crear Lead"
                  >
                    <LinkIcon className="h-3.5 w-3.5 text-gray-600" />
                  </button>

                  {/* Share Button */}
                  <button
                    className="h-8 w-8 rounded-full bg-white/95 hover:bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void handleAction("share");
                    }}
                    disabled={isActionLoading !== null}
                    title="Compartir propiedad"
                  >
                    <Share2 className="h-3.5 w-3.5 text-gray-600" />
                  </button>
                </>
              ) : (
                /* Dismiss/Remove Lead Button (shown when lead exists) */
                <button
                  className="h-8 w-8 rounded-full bg-red-100 border-red-200 hover:bg-red-200 border shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void handleAction("dismiss");
                  }}
                  disabled={isActionLoading !== null}
                  title="Eliminar Lead"
                >
                  <X className="h-3.5 w-3.5 text-red-600" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer with Owner Contact */}
      <CardFooter className="border-t border-border/40 p-2 pt-1.5">
        <div className="flex w-full items-center justify-end">
          {/* Property Owner Contact */}
          {listing.ownerContact && contactId ? (
            <Link
              href={`/contactos/${contactId.toString()}`}
              className="flex items-center gap-1 text-xs text-muted-foreground/80 hover:text-primary transition-colors hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <User className="h-3 w-3" />
              <span>
                {truncateName(listing.ownerContact.firstName, listing.ownerContact.lastName)}
              </span>
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground/80">
              {isCrossAccount && !canContact
                ? "Contacto disponible tras solicitud"
                : "Sin contacto"}
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );

  return renderContent();
});
