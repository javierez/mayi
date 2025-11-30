"use client";

import React from "react";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { Home, Search } from "lucide-react";
import { getContactCardColor } from "~/components/contactos/table-components/color/contact-colors";

interface ContactRole {
  role: "owner" | "buyer";
  listingId: bigint;
  referenceNumber: string | null;
}

interface GalleryContact {
  contactId: bigint;
  firstName: string;
  lastName: string;
  roles: ContactRole[];
  updatedAt: Date;
}

interface GalleryContactCardProps {
  contact: GalleryContact;
  isSelected?: boolean;
  onClick?: (contactId: string) => void;
}

export const GalleryContactCard = React.memo(function GalleryContactCard({
  contact,
  isSelected = false,
  onClick,
}: GalleryContactCardProps) {
  const handleClick = () => {
    onClick?.(contact.contactId.toString());
  };

  // Get initials
  const initials = `${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}`.toUpperCase();

  // Determine role types present
  const hasOwner = contact.roles.some((r) => r.role === "owner");
  const hasBuyer = contact.roles.some((r) => r.role === "buyer");

  // Get color style from Vesta palette
  const colorStyle = getContactCardColor({
    isOwner: hasOwner,
    isBuyer: hasBuyer,
  });

  // Get unique reference numbers (max 3)
  const referenceNumbers = [
    ...new Set(
      contact.roles
        .map((r) => r.referenceNumber)
        .filter((ref): ref is string => ref !== null),
    ),
  ].slice(0, 3);

  return (
    <div className="block flex-shrink-0 cursor-pointer" onClick={handleClick}>
      <Card
        className={cn(
          "group w-48 overflow-hidden transition-all hover:shadow-lg",
          isSelected && "ring-2 ring-primary ring-offset-2",
        )}
      >
        {/* Top color area - same aspect ratio as property image */}
        <div
          className="relative flex aspect-[3/2] items-center justify-center"
          style={colorStyle}
        >
          {/* Avatar with initials */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-lg font-semibold text-gray-700 shadow-sm">
            {initials}
          </div>

          {/* Role badges - positioned like property type badge */}
          <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
            {hasOwner && (
              <Badge
                variant="outline"
                className="flex items-center gap-0.5 border-white/50 bg-white/80 px-1.5 py-0 text-[10px]"
                style={{ color: "rgba(149,113,79,1)" }}
              >
                <Home className="h-2.5 w-2.5" />
                Propietario
              </Badge>
            )}
            {hasBuyer && (
              <Badge
                variant="outline"
                className="flex items-center gap-0.5 border-white/50 bg-white/80 px-1.5 py-0 text-[10px]"
                style={{ color: "rgba(140,145,108,1)" }}
              >
                <Search className="h-2.5 w-2.5" />
                Comprador
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-2">
          <div className="flex items-start justify-between gap-1">
            <h3 className="line-clamp-1 flex-1 text-xs font-medium">
              {contact.firstName} {contact.lastName}
            </h3>
          </div>
        </CardContent>

        <CardFooter className="border-t border-border/40 p-2 pt-1.5">
          <p className="line-clamp-1 text-[10px] text-muted-foreground/80">
            {referenceNumbers.length > 0
              ? referenceNumbers.join(" · ")
              : "Sin referencia"}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
});
