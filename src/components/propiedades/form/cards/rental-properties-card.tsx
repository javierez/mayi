"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { ChevronDown, Loader2, Lightbulb } from "lucide-react";
import { ModernSaveIndicator } from "../common/modern-save-indicator";
import {
  createListing,
  duplicateListingContacts,
} from "~/server/queries/listing";
import type { SaveState } from "~/types/save-state";
import { navigateToPage } from "~/lib/navigation";

interface RentalPropertiesCardProps {
  listingType: string;
  propertyType: string;
  internet: boolean;
  studentFriendly: boolean;
  petsAllowed: boolean;
  appliancesIncluded: boolean;
  duplicateForRent: boolean;
  rentalPrice: number;
  collapsedSections: Record<string, boolean>;
  saveState: SaveState;
  canEdit?: boolean;
  // Listing data for duplication
  propertyId: number | string | undefined;
  listingId: number | string | undefined;
  agentId: string | undefined;
  isFurnished: boolean;
  furnitureQuality: string;
  optionalGaragePrice: number;
  optionalStorageRoomPrice: number;
  onToggleSection: (section: string) => void;
  onSave: () => Promise<void>;
  onUpdateModule: (hasChanges: boolean) => void;
  setInternet: (value: boolean) => void;
  setStudentFriendly: (value: boolean) => void;
  setPetsAllowed: (value: boolean) => void;
  setAppliancesIncluded: (value: boolean) => void;
  setDuplicateForRent: (value: boolean) => void;
  setRentalPrice: (value: number) => void;
  getCardStyles: (moduleName: string) => string;
}

export function RentalPropertiesCard({
  listingType,
  propertyType,
  internet,
  studentFriendly,
  petsAllowed,
  appliancesIncluded,
  duplicateForRent,
  rentalPrice,
  collapsedSections,
  saveState,
  canEdit = true,
  // Listing data for duplication
  propertyId,
  listingId,
  agentId,
  isFurnished,
  furnitureQuality,
  optionalGaragePrice,
  optionalStorageRoomPrice,
  onToggleSection,
  onSave,
  onUpdateModule,
  setInternet,
  setStudentFriendly,
  setPetsAllowed,
  setAppliancesIncluded,
  setDuplicateForRent,
  setRentalPrice,
  getCardStyles,
}: RentalPropertiesCardProps) {
  const router = useRouter();
  const isSale = listingType === "Sale" || listingType === "Transfer";
  const isRent = !isSale;

  // State for duplication process
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [duplicationError, setDuplicationError] = useState<string | null>(null);

  // Check if rental data is configured but duplicate not created yet
  const isRentalConfigured = duplicateForRent && rentalPrice > 0;
  const shouldShowHint = isSale && isRentalConfigured;

  // Handle rental duplication (similar to FinalizationPopup)
  const handleApplyDuplication = async () => {
    if (!propertyId || !agentId) {
      setDuplicationError("Missing property or agent information");
      return;
    }

    if (!rentalPrice || rentalPrice <= 0) {
      setDuplicationError("Please set a valid rental price");
      return;
    }

    setIsDuplicating(true);
    setDuplicationError(null);

    try {
      const rentListingData = {
        propertyId: BigInt(propertyId),
        listingType: "Rent" as const,
        price: rentalPrice.toString(),
        agentId: agentId.toString(),
        studentFriendly,
        petsAllowed,
        appliancesIncluded,
        internet,
        optionalGaragePrice: optionalGaragePrice.toString(),
        optionalStorageRoomPrice: optionalStorageRoomPrice.toString(),
        hasKeys: false,
        optionalStorageRoom: false,
        status: "En Alquiler" as const,
        isActive: true,
        isFeatured: false,
        isBankOwned: false,
        publishToWebsite: false,
        visibilityMode: 1,
        isFurnished,
        furnitureQuality,
        viewCount: 0,
        inquiryCount: 0,
      };

      const newListing = await createListing(rentListingData);

      if (newListing?.listingId) {
        // Duplicate listing_contacts from the original listing to the new rental listing
        if (listingId) {
          await duplicateListingContacts(
            Number(listingId),
            Number(newListing.listingId),
          );
        }

        // Open new rental listing
        navigateToPage(`/propiedades/${newListing.listingId}`, router);
      }
    } catch (error) {
      console.error("Error creating rental listing:", error);
      setDuplicationError(
        error instanceof Error
          ? error.message
          : "Error al crear el duplicado para alquiler",
      );
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <Card
      className={cn(
        "relative p-4 transition-all duration-500 ease-out",
        getCardStyles("rentalProperties"),
      )}
    >
      {/* Only show save indicator for rental listings */}
      {isRent && <ModernSaveIndicator state={saveState} onSave={onSave} />}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onToggleSection("rentalProperties")}
          className="group flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              {isSale ? "ALQUILER" : "PROPIEDADES DEL ALQUILER"}
            </h3>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              collapsedSections.rentalProperties && "rotate-180",
            )}
          />
        </button>
      </div>
      <div
        className={cn(
          "space-y-3 overflow-hidden transition-all duration-200",
          collapsedSections.rentalProperties ? "max-h-0" : "max-h-[1000px]",
        )}
      >
        {/* For Sale listings, show the toggle to duplicate for rent */}
        {isSale && (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative h-11 w-full max-w-md rounded-xl bg-gray-200 p-1 shadow-inner">
              <div
                className={cn(
                  "duration-400 absolute left-1 top-1 h-9 w-[calc(50%-2px)] rounded-lg bg-gradient-to-r from-gray-700 to-gray-900 shadow-md transition-all ease-out",
                  duplicateForRent && "translate-x-[calc(100%-4px)]",
                )}
              />
              <div className="relative flex h-full">
                <button
                  type="button"
                  onClick={() => {
                    setDuplicateForRent(false);
                    onUpdateModule(true);
                  }}
                  className={cn(
                    "relative z-10 flex-1 rounded-lg text-sm font-semibold transition-all duration-200",
                    !duplicateForRent
                      ? "text-white drop-shadow-sm"
                      : "text-slate-600 hover:text-slate-800",
                  )}
                >
                  Solo Venta
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDuplicateForRent(true);
                    onUpdateModule(true);
                  }}
                  className={cn(
                    "relative z-10 flex-1 rounded-lg text-sm font-semibold transition-all duration-200",
                    duplicateForRent
                      ? "text-white drop-shadow-sm"
                      : "text-slate-600 hover:text-slate-800",
                  )}
                >
                  También Alquiler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show rental properties when enabled */}
        {(isRent || (isSale && duplicateForRent)) && (
          <div className="space-y-6">
            {/* Rental Price - Only show for Sale listings creating a rental duplicate */}
            {isSale && duplicateForRent && (
              <div className="rounded-lg bg-blue-50 p-4 shadow-lg">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">
                    Precio del Alquiler
                  </h4>
                </div>
                <Input
                  type="number"
                  value={rentalPrice || ""}
                  onChange={(e) => {
                    const value = Number(e.target.value) || 0;
                    setRentalPrice(value);
                    onUpdateModule(true);
                  }}
                  placeholder="0 €"
                  className="h-10 border-0 bg-white text-sm shadow-md"
                  min="0"
                  step="1"
                  disabled={!canEdit}
                />
              </div>
            )}

            {/* Rental characteristics - Hide for solar and garage properties */}
            {propertyType !== "solar" && propertyType !== "garaje" && (
              <div className="space-y-3">
                <div className="flex flex-col items-start gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="internet"
                      checked={internet}
                      onCheckedChange={(checked) => {
                        setInternet(checked as boolean);
                        onUpdateModule(true);
                      }}
                      disabled={!canEdit}
                    />
                    <Label htmlFor="internet" className="text-sm">
                      Internet
                    </Label>
                  </div>

                  {/* Student Friendly - Hide for local properties */}
                  {propertyType !== "local" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="studentFriendly"
                        checked={studentFriendly}
                        onCheckedChange={(checked) => {
                          setStudentFriendly(checked as boolean);
                          onUpdateModule(true);
                        }}
                        disabled={!canEdit}
                      />
                      <Label htmlFor="studentFriendly" className="text-sm">
                        Admite estudiantes
                      </Label>
                    </div>
                  )}

                  {/* Pets Allowed - Hide for local properties */}
                  {propertyType !== "local" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="petsAllowed"
                        checked={petsAllowed}
                        onCheckedChange={(checked) => {
                          setPetsAllowed(checked as boolean);
                          onUpdateModule(true);
                        }}
                        disabled={!canEdit}
                      />
                      <Label htmlFor="petsAllowed" className="text-sm">
                        Admite mascotas
                      </Label>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="appliancesIncluded"
                      checked={appliancesIncluded}
                      onCheckedChange={(checked) => {
                        setAppliancesIncluded(checked as boolean);
                        onUpdateModule(true);
                      }}
                      disabled={!canEdit}
                    />
                    <Label htmlFor="appliancesIncluded" className="text-sm">
                      Incluye electrodomésticos
                    </Label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Apply button for sale listings */}
        {isSale && duplicateForRent && (
          <div className="flex flex-col items-center justify-center border-t border-border pt-4">
            {duplicationError && (
              <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {duplicationError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={handleApplyDuplication}
                disabled={
                  !canEdit || isDuplicating || !rentalPrice || rentalPrice <= 0
                }
                className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-6 py-2.5 font-medium text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-amber-500 hover:to-rose-500 hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                {isDuplicating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando duplicado...
                  </>
                ) : (
                  <>
                    Crear duplicado para alquiler
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  </>
                )}
              </Button>

              {/* Simple lightbulb icon with tooltip */}
              {shouldShowHint && (
                <div className="group/hint relative">
                  <Lightbulb className="h-5 w-5 animate-pulse cursor-help text-amber-500" />
                  <div className="pointer-events-none absolute -right-4 bottom-full z-50 mb-2 w-72 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 opacity-0 shadow-lg transition-all duration-200 group-hover/hint:pointer-events-auto group-hover/hint:opacity-100">
                    <div className="absolute -bottom-1 right-8 h-2 w-2 rotate-45 border-b border-r border-amber-200 bg-amber-50"></div>
                    <strong className="mb-1 block">💡 Recomendación</strong>
                    <span className="text-justify leading-relaxed">
                      Configura todos los datos del inmueble antes de crear el
                      duplicado para alquiler. Así tendrás toda la información
                      completa en ambos anuncios.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
