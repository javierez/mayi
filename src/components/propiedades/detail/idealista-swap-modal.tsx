"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Loader2, X, Check } from "lucide-react";
import { cn } from "~/lib/utils";

interface IdealistaListing {
  listingId: bigint;
  referenceNumber: string | null;
  title: string | null;
  city: string | null;
  price: string;
  propertyType: string | null;
  imageUrl: string | null;
}

interface IdealistaSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (listingIdToDeactivate: string) => void;
  currentListingId: string;
  enabledListings: IdealistaListing[];
  maxSlots: number;
  isLoading?: boolean;
}

export function IdealistaSwapModal({
  isOpen,
  onClose,
  onConfirm,
  currentListingId,
  enabledListings,
  maxSlots,
  isLoading = false,
}: IdealistaSwapModalProps) {
  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    null,
  );

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedListingId(null);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (selectedListingId) {
      onConfirm(selectedListingId);
    }
  };

  const handleCardClick = (listingId: string) => {
    // Toggle selection - clicking same card deselects it
    setSelectedListingId((prev) => (prev === listingId ? null : listingId));
  };

  // Filter out the current listing from the swap options
  const swappableListings = enabledListings.filter(
    (listing) => listing.listingId.toString() !== currentListingId,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] sm:max-w-[500px] flex flex-col overflow-hidden [&>button]:hidden">
        <DialogHeader className="space-y-0 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Límite de huecos alcanzado
              </DialogTitle>
              <DialogDescription className="mt-1.5">
                Tienes {maxSlots}/{maxSlots} huecos activos en Idealista.
                Selecciona una propiedad para desactivar.
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-2 py-2">
            {swappableListings.length === 0 ? (
              <p className="text-center text-gray-500 py-6">
                No hay propiedades disponibles para intercambiar.
              </p>
            ) : (
              swappableListings.map((listing) => {
                const listingIdStr = listing.listingId.toString();
                const isSelected = selectedListingId === listingIdStr;

                return (
                  <div
                    key={listingIdStr}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all",
                      isSelected
                        ? "border-gray-200 bg-gray-50 opacity-50"
                        : "border-gray-200 bg-white hover:bg-gray-50 shadow-sm",
                    )}
                    onClick={() => handleCardClick(listingIdStr)}
                  >
                    {/* Property Image */}
                    {listing.imageUrl ? (
                      <Image
                        src={listing.imageUrl}
                        alt={listing.title ?? "Propiedad"}
                        width={48}
                        height={48}
                        className={cn(
                          "h-12 w-12 rounded object-cover",
                          isSelected && "grayscale",
                        )}
                      />
                    ) : (
                      <div
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-xs font-medium text-gray-400",
                          isSelected && "bg-gray-200",
                        )}
                      >
                        IMG
                      </div>
                    )}

                    {/* Property Details */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "text-sm font-medium truncate",
                          isSelected
                            ? "text-gray-400 line-through"
                            : "text-gray-900",
                        )}
                      >
                        {listing.title ?? "Sin título"}
                      </div>
                      {listing.referenceNumber && (
                        <div className="text-xs text-muted-foreground">
                          Ref: {listing.referenceNumber}
                        </div>
                      )}
                      {listing.city && (
                        <div className="text-xs text-muted-foreground">
                          {listing.city}
                        </div>
                      )}
                    </div>

                    {/* Status Icon */}
                    {!isSelected && (
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedListingId || isLoading}
            variant="outline"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Intercambiando...
              </>
            ) : (
              "Confirmar intercambio"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
