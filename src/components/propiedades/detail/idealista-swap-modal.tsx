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
import { Loader2, Home, MapPin } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";

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

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
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

  // Filter out the current listing from the swap options
  const swappableListings = enabledListings.filter(
    (listing) => listing.listingId.toString() !== currentListingId,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] max-w-lg">
        <DialogHeader>
          <DialogTitle>Límite de anuncios alcanzado</DialogTitle>
          <DialogDescription>
            Has alcanzado el límite de {maxSlots} anuncios disponibles en
            Idealista. Selecciona una propiedad para desactivar y reemplazar con
            la nueva.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="py-4">
            {swappableListings.length === 0 ? (
              <p className="text-center text-gray-500">
                No hay propiedades disponibles para intercambiar.
              </p>
            ) : (
              <RadioGroup
                value={selectedListingId ?? ""}
                onValueChange={setSelectedListingId}
                className="space-y-3"
              >
                {swappableListings.map((listing) => {
                  const isSelected =
                    selectedListingId === listing.listingId.toString();
                  return (
                    <div
                      key={listing.listingId.toString()}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        isSelected
                          ? "border-primary/40 bg-primary/5"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() =>
                        setSelectedListingId(listing.listingId.toString())
                      }
                    >
                      <RadioGroupItem
                        value={listing.listingId.toString()}
                        id={listing.listingId.toString()}
                        className="mt-3"
                      />

                      {/* Property Image */}
                      {listing.imageUrl ? (
                        <Image
                          src={listing.imageUrl}
                          alt={listing.title ?? "Propiedad"}
                          width={64}
                          height={64}
                          className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-gray-100">
                          <Home className="h-6 w-6 text-gray-400" />
                        </div>
                      )}

                      {/* Property Details */}
                      <Label
                        htmlFor={listing.listingId.toString()}
                        className="min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="space-y-1">
                          {/* Title */}
                          <p className="truncate text-sm font-medium">
                            {listing.title ?? "Sin título"}
                          </p>

                          {/* Reference Number */}
                          {listing.referenceNumber && (
                            <p className="text-xs text-muted-foreground">
                              Ref: {listing.referenceNumber}
                            </p>
                          )}

                          {/* Property Type & City */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{listing.propertyType ?? "Propiedad"}</span>
                            {listing.city && (
                              <>
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{listing.city}</span>
                              </>
                            )}
                          </div>

                          {/* Price */}
                          <p className="text-sm font-semibold text-green-600">
                            {formatPrice(Number(listing.price))}€
                          </p>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedListingId || isLoading}
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
