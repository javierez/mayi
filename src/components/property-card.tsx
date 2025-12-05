"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import {
  Bed,
  Bath,
  SquareIcon as SquareFoot,
  MapPin,
  User,
  X,
  Share2,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { formatPrice } from "~/lib/utils";
import { formatListingType } from "./contactos/contact-config";
import type { ListingOverview } from "~/types/listing";
import { PropertyImagePlaceholder } from "./propiedades/PropertyImagePlaceholder";
import { SharePropertyModal } from "./propiedades/share-property-modal";
import { getSquareMeter } from "~/lib/properties/area-utils";

type Listing = {
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
  publishToWebsite?: boolean;

  // Property fields
  referenceNumber: string | null;
  title: string | null;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: string | null;
  squareMeter: number | null;
  builtSurfaceArea: number | null;
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
};

interface PropertyCardProps {
  listing: Listing | ListingOverview;
  accountWebsite?: string | null;
  // Context-specific props for contact management
  showDeleteButton?: boolean;
  contactId?: bigint;
  contactType?: "buyer" | "owner";
  onRemove?: (listingId: bigint) => Promise<void>;
  isRemoving?: boolean;
  onPublishToggled?: () => void;
}

export const PropertyCard = React.memo(function PropertyCard({
  listing,
  accountWebsite,
  showDeleteButton = false,
  contactId: _contactId,
  contactType: _contactType,
  onRemove,
  isRemoving = false,
  onPublishToggled,
}: PropertyCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [image2Loaded, setImage2Loaded] = useState(false);
  const [isDeleteButtonHovered, setIsDeleteButtonHovered] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const getPropertyTypeLabel = (type: string | null) => {
    switch (type) {
      case "piso":
        return "Piso";
      case "casa":
        return "Casa";
      case "local":
        return "Local";
      case "solar":
        return "Solar";
      case "garaje":
        return "Garaje";
      default:
        return type;
    }
  };

  // Get primary image with proper fallback
  const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    // Exclude YouTube videos
    if (url.includes("youtube.com") || url.includes("youtu.be")) return false;
    // Exclude video files
    if (/\.(mp4|mov|avi|webm|mkv|flv|wmv)(\?|$)/i.exec(url)) return false;
    // Exclude URLs with /videos/ path
    if (url.includes("/videos/")) return false;
    return true;
  };
  const [imageSrc, setImageSrc] = useState(
    isValidImageUrl(listing.imageUrl) ? listing.imageUrl : null,
  );
  const [imageSrc2, setImageSrc2] = useState(
    isValidImageUrl(listing.imageUrl2) ? listing.imageUrl2 : null,
  );

  const onImageError = () => {
    setImageSrc(null);
  };

  const onImage2Error = () => {
    setImageSrc2(null);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShareModalOpen(true);
  };

  const handleRemoveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onRemove) {
      await onRemove(listing.listingId);
    }
  };

  return (
    <Link
      href={`/propiedades/${listing.listingId.toString()}`}
      className="block"
    >
      <Card
        className="group overflow-hidden transition-all hover:shadow-lg"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <div className="relative h-full w-full">
            {/* Show placeholder if no valid images are available */}
            {!isValidImageUrl(listing.imageUrl) &&
            !isValidImageUrl(listing.imageUrl2) ? (
              <PropertyImagePlaceholder
                propertyType={listing.propertyType}
                className="h-full w-full"
              />
            ) : (
              <>
                {/* Skeleton overlay while images load */}
                {(!imageLoaded || !image2Loaded) && (
                  <Skeleton className="absolute inset-0 z-10" />
                )}

                {/* First Image */}
                {isValidImageUrl(listing.imageUrl) && imageSrc && (
                  <Image
                    src={imageSrc}
                    alt={listing.title ?? "Property image"}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={cn(
                      "object-cover transition-opacity duration-300",
                      isHovered && image2Loaded && listing.imageUrl2
                        ? "opacity-0"
                        : "opacity-100",
                      listing.status === "Sold" || listing.status === "Vendido"
                        ? "grayscale"
                        : "",
                    )}
                    loading="lazy"
                    onLoad={() => setImageLoaded(true)}
                    onError={onImageError}
                    quality={85}
                  />
                )}

                {/* Second Image */}
                {isValidImageUrl(listing.imageUrl2) && imageSrc2 && (
                  <Image
                    src={imageSrc2}
                    alt={listing.title ?? "Property image"}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={cn(
                      "object-cover transition-opacity duration-300",
                      isHovered && image2Loaded ? "opacity-100" : "opacity-0",
                      listing.status === "Sold" || listing.status === "Vendido"
                        ? "grayscale"
                        : "",
                    )}
                    loading="lazy"
                    onLoad={() => setImage2Loaded(true)}
                    onError={onImage2Error}
                    quality={85}
                  />
                )}
              </>
            )}
          </div>
          {/* Top Left - Property Type */}
          <Badge
            variant="outline"
            className="absolute left-2 top-2 z-10 bg-white/80 text-sm"
          >
            {getPropertyTypeLabel(listing.propertyType)}
          </Badge>

          {/* Top Right - Status */}
          <Badge className="absolute right-2 top-2 z-10 text-sm">
            {formatListingType(listing.listingType)}
          </Badge>

          {/* Delete Button - Top Center (when in contact context) */}
          {showDeleteButton && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute left-1/2 top-2 z-30 h-10 w-10 -translate-x-1/2 rounded-full transition-all duration-200",
                "!bg-red-600 !text-white backdrop-blur-sm",
                "opacity-0 group-hover:opacity-100",
                "!hover:bg-red-800 hover:scale-110 hover:shadow-lg",
                isDeleteButtonHovered && "scale-110 !bg-red-800 shadow-lg",
                isRemoving && "pointer-events-none opacity-50",
              )}
              onClick={handleRemoveClick}
              onMouseEnter={() => setIsDeleteButtonHovered(true)}
              onMouseLeave={() => setIsDeleteButtonHovered(false)}
              disabled={isRemoving}
              title="Quitar de contacto"
            >
              <X className="h-5 w-5 text-white" />
            </Button>
          )}

          {/* Bottom Center - Reference Number */}
          <div className="absolute bottom-1 left-1/2 z-10 -translate-x-1/2">
            <span className="text-[10px] font-semibold tracking-widest text-white/90">
              {listing.referenceNumber ?? ""}
            </span>
          </div>

          {/* Bottom Right - Bank Owned */}
          {listing.isBankOwned && (
            <Badge
              variant="secondary"
              className="absolute bottom-2 right-2 z-10 bg-amber-500 text-sm text-white"
            >
              Piso de Banco
            </Badge>
          )}
        </div>

        <CardContent className="p-3">
          <div className="mb-1 flex items-start justify-between">
            <div>
              <h3 className="line-clamp-1 text-base font-semibold">
                {listing.street}
              </h3>
            </div>
            <p className="text-base font-bold">
              {formatPrice(listing.price)}€
              {["Rent", "RentWithOption", "RoomSharing"].includes(
                listing.listingType,
              )
                ? "/mes"
                : ""}
            </p>
          </div>

          <div className="mb-2 flex items-center text-muted-foreground">
            <MapPin className="mr-1 h-3.5 w-3.5" />
            <p className="line-clamp-1 text-xs">
              {listing.city}, {listing.province}
            </p>
          </div>

          <div className="flex justify-between text-xs">
            {listing.propertyType !== "solar" &&
              listing.propertyType !== "garaje" &&
              listing.propertyType !== "local" && (
                <>
                  <div className="flex items-center">
                    <Bed className="mr-1 h-3.5 w-3.5" />
                    <span>
                      {listing.bedrooms}{" "}
                      {listing.bedrooms === 1 ? "Hab" : "Habs"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="mr-1 h-3.5 w-3.5" />
                    <span>
                      {Math.floor(Number(listing.bathrooms))}{" "}
                      {Math.floor(Number(listing.bathrooms)) === 1
                        ? "Baño"
                        : "Baños"}
                    </span>
                  </div>
                </>
              )}
            <div className="flex items-center">
              <SquareFoot className="mr-1 h-3.5 w-3.5" />
              <span>{getSquareMeter(listing) ?? "-"} m²</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="relative border-t border-border/40 p-3 pt-2">
          <div className="agent-info flex cursor-pointer items-center gap-1.5 transition-all">
            <User className="h-3 w-3 text-muted-foreground/80 transition-all group-hover:scale-110 group-hover:text-primary" />
            <p className="text-xs font-light text-muted-foreground/80 transition-all group-hover:font-bold group-hover:text-primary group-hover:underline">
              {listing.agentName ?? ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="group absolute bottom-1 right-1 mr-2 h-8 w-8 text-muted-foreground/80 hover:bg-transparent hover:text-primary"
            onClick={handleShareClick}
            title="Compartir propiedad"
          >
            <Share2 className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
          </Button>
        </CardFooter>
      </Card>

      {/* Share Modal */}
      <SharePropertyModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        property={listing}
        accountWebsite={accountWebsite}
        onPublishToggled={onPublishToggled}
      />
    </Link>
  );
});
