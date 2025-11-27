"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import { User } from "lucide-react";
import { formatPrice } from "~/lib/utils";
import { formatListingType } from "~/components/contactos/contact-config";
import { PropertyImagePlaceholder } from "./PropertyImagePlaceholder";

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

interface GalleryPropertyCardProps {
  listing: GalleryListing;
  isSelected?: boolean;
  onClick?: (listingId: string) => void;
}

export const GalleryPropertyCard = React.memo(function GalleryPropertyCard({
  listing,
  isSelected = false,
  onClick,
}: GalleryPropertyCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [image2Loaded, setImage2Loaded] = useState(false);

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

  const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    if (url.includes("youtube.com") || url.includes("youtu.be")) return false;
    if (/\.(mp4|mov|avi|webm|mkv|flv|wmv)(\?|$)/i.exec(url)) return false;
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

  const handleClick = () => {
    onClick?.(listing.listingId.toString());
  };

  return (
    <div
      className="block flex-shrink-0 cursor-pointer"
      onClick={handleClick}
    >
      <Card
        className={cn(
          "group w-48 overflow-hidden transition-all hover:shadow-lg",
          isSelected && "ring-2 ring-primary ring-offset-2",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-[3/2] overflow-hidden">
          <div className="relative h-full w-full">
            {!isValidImageUrl(listing.imageUrl) &&
            !isValidImageUrl(listing.imageUrl2) ? (
              <PropertyImagePlaceholder
                propertyType={listing.propertyType}
                className="h-full w-full"
              />
            ) : (
              <>
                {(!imageLoaded || !image2Loaded) && (
                  <Skeleton className="absolute inset-0 z-10" />
                )}

                {isValidImageUrl(listing.imageUrl) && imageSrc && (
                  <Image
                    src={imageSrc}
                    alt={listing.street ?? "Property image"}
                    fill
                    sizes="192px"
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
                    quality={75}
                  />
                )}

                {isValidImageUrl(listing.imageUrl2) && imageSrc2 && (
                  <Image
                    src={imageSrc2}
                    alt={listing.street ?? "Property image"}
                    fill
                    sizes="192px"
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
                    quality={75}
                  />
                )}
              </>
            )}
          </div>

          {/* Top Left - Property Type */}
          <Badge
            variant="outline"
            className="absolute left-1.5 top-1.5 z-10 bg-white/80 px-1.5 py-0 text-[10px]"
          >
            {getPropertyTypeLabel(listing.propertyType)}
          </Badge>

          {/* Top Right - Listing Type */}
          <Badge className="absolute right-1.5 top-1.5 z-10 px-1.5 py-0 text-[10px]">
            {formatListingType(listing.listingType)}
          </Badge>

          {/* Bottom Center - Reference Number */}
          <div className="absolute bottom-0.5 left-1/2 z-10 -translate-x-1/2">
            <span className="text-[8px] font-semibold tracking-widest text-white/90">
              {listing.referenceNumber ?? ""}
            </span>
          </div>

          {/* Bottom Right - Bank Owned */}
          {listing.isBankOwned && (
            <Badge
              variant="secondary"
              className="absolute bottom-1.5 right-1.5 z-10 bg-amber-500 px-1.5 py-0 text-[10px] text-white"
            >
              Banco
            </Badge>
          )}
        </div>

        <CardContent className="p-2">
          <div className="flex items-start justify-between gap-1">
            <h3 className="line-clamp-1 flex-1 text-xs font-medium">
              {listing.street}
            </h3>
            <p className="whitespace-nowrap text-xs font-bold">
              {formatPrice(listing.price)}€
              {["Rent", "RentWithOption", "RoomSharing"].includes(
                listing.listingType,
              )
                ? "/m"
                : ""}
            </p>
          </div>
        </CardContent>

        <CardFooter className="border-t border-border/40 p-2 pt-1.5">
          <div className="flex items-center gap-1">
            <User className="h-2.5 w-2.5 text-muted-foreground/80" />
            <p className="line-clamp-1 text-[10px] text-muted-foreground/80">
              {listing.agentName ?? ""}
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
});
