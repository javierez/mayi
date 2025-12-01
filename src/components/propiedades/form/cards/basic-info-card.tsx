import React, { useState, useEffect } from "react";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import { cn, formFormatters } from "~/lib/utils";
import { Building2, ChevronDown } from "lucide-react";
import { ModernSaveIndicator } from "../common/modern-save-indicator";
import type { PropertyListing } from "~/types/property-listing";
import type { SaveState } from "~/types/save-state";

interface BasicInfoCardProps {
  listing: PropertyListing;
  propertyType: string;
  hasPropertyTypeChanged: boolean;
  listingTypes: string[];
  isBankOwned: boolean;
  newConstruction: boolean;
  collapsedSections: Record<string, boolean>;
  saveState: SaveState;
  currentTitle?: string;
  allowedUse: number;
  canEdit?: boolean;
  // New rental/sale specific fields
  rentalType?: "residential" | "seasonal" | "short_term";
  shortTermLicense?: string;
  occupationStatus?: "free" | "tenanted" | "bare_ownership" | "illegally_occupied";
  onToggleSection: (section: string) => void;
  onSave: () => Promise<void>;
  onUpdateModule: (hasChanges: boolean) => void;
  onToggleListingType: (type: string) => void;
  onHandleSecondaryListingType: (
    type: "RentWithOption" | "RoomSharing" | "Transfer",
  ) => void;
  onPropertyTypeChange: (newType: string) => Promise<void>;
  onTitleChange?: (newTitle: string) => void;
  setAllowedUse: (value: number) => void;
  setIsBankOwned: (value: boolean) => void;
  setNewConstruction: (value: boolean) => void;
  setRentalType?: (value: "residential" | "seasonal" | "short_term" | undefined) => void;
  setShortTermLicense?: (value: string) => void;
  setOccupationStatus?: (value: "free" | "tenanted" | "bare_ownership" | "illegally_occupied" | undefined) => void;
  getCardStyles: (moduleName: string) => string;
}

export function BasicInfoCard({
  listing,
  propertyType,
  hasPropertyTypeChanged: _hasPropertyTypeChanged,
  listingTypes,
  isBankOwned,
  newConstruction,
  collapsedSections,
  saveState,
  currentTitle,
  allowedUse,
  canEdit = true,
  rentalType,
  shortTermLicense,
  occupationStatus,
  onToggleSection,
  onSave,
  onUpdateModule,
  onToggleListingType,
  onHandleSecondaryListingType,
  onPropertyTypeChange,
  onTitleChange,
  setAllowedUse,
  setIsBankOwned,
  setNewConstruction,
  setRentalType,
  setShortTermLicense,
  setOccupationStatus,
  getCardStyles,
}: BasicInfoCardProps) {
  const currentListingType = listingTypes[0] ?? "";

  // Local state for the displayed (formatted) price
  const [displayPrice, setDisplayPrice] = useState(() =>
    formFormatters.formatPriceInput(
      listing.price ? parseFloat(listing.price.toString()) : 0,
    ),
  );

  // Sync display price when listing.price changes externally
  useEffect(() => {
    setDisplayPrice(
      formFormatters.formatPriceInput(
        listing.price ? parseFloat(listing.price.toString()) : 0,
      ),
    );
  }, [listing.price]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Update display immediately with user input (allows typing)
    setDisplayPrice(inputValue);

    // Parse and save the numeric value (preserving decimals)
    const numeric = formFormatters.getNumericPrice(inputValue);
    listing.price = parseFloat(numeric) || 0;
    onUpdateModule(true);
  };

  const handlePriceBlur = () => {
    // Reformat on blur to ensure proper formatting (preserving decimals)
    const formattedPrice = formFormatters.formatPriceInput(
      listing.price ? parseFloat(listing.price.toString()) : 0,
    );
    setDisplayPrice(formattedPrice);
  };

  return (
    <Card
      className={cn(
        "relative p-4 transition-all duration-500 ease-out",
        getCardStyles("basicInfo"),
      )}
    >
      <ModernSaveIndicator state={saveState} onSave={onSave} />
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onToggleSection("basicInfo")}
          className="group flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              RESUMEN DEL INMUEBLE
            </h3>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              collapsedSections.basicInfo && "rotate-180",
            )}
          />
        </button>
      </div>
      <div
        className={cn(
          "space-y-3 overflow-hidden transition-all duration-200",
          collapsedSections.basicInfo ? "max-h-0" : "max-h-[2000px]",
        )}
      >
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-sm">
            Título
          </Label>
          <Input
            id="title"
            value={currentTitle ?? ""}
            onChange={(e) => {
              onTitleChange?.(e.target.value);
              onUpdateModule(true);
            }}
            className="h-8 text-gray-500"
            placeholder="Título de la propiedad"
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm">Tipo de Anuncio</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={
                ["Sale", "Transfer"].includes(currentListingType)
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() => {
                onToggleListingType("Sale");
                onUpdateModule(true);
              }}
              className="flex-1"
              disabled={!canEdit}
            >
              Venta
            </Button>
            <Button
              type="button"
              variant={
                ["Rent", "RentWithOption", "RoomSharing"].includes(
                  currentListingType,
                )
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() => {
                onToggleListingType("Rent");
                onUpdateModule(true);
              }}
              className="flex-1"
              disabled={!canEdit}
            >
              Alquiler
            </Button>
          </div>
        </div>

        {/* Secondary checkboxes, vertical for rent types */}
        {["Rent", "RentWithOption", "RoomSharing"].includes(
          currentListingType,
        ) && (
          <div className="ml-2 flex flex-col items-start gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="roomSharingProperty"
                checked={currentListingType === "RoomSharing"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onHandleSecondaryListingType("RoomSharing");
                  } else {
                    onToggleListingType("Rent");
                  }
                }}
                disabled={!canEdit}
              />
              <Label
                htmlFor="roomSharingProperty"
                className="cursor-pointer select-none text-xs text-gray-700"
              >
                Compartir habitación
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="rentWithOptionProperty"
                checked={currentListingType === "RentWithOption"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onHandleSecondaryListingType("RentWithOption");
                  } else {
                    onToggleListingType("Rent");
                  }
                }}
                disabled={!canEdit}
              />
              <Label
                htmlFor="rentWithOptionProperty"
                className="cursor-pointer select-none text-xs text-gray-700"
              >
                Alquiler con opción a compra
              </Label>
            </div>
          </div>
        )}

        {/* Rental Type - Only shown for rent listings */}
        {["Rent", "RentWithOption", "RoomSharing"].includes(currentListingType) && (
          <div className="space-y-1.5">
            <Label className="text-sm">Tipo de Alquiler</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={rentalType === "residential" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setRentalType?.(rentalType === "residential" ? undefined : "residential");
                  onUpdateModule(true);
                }}
                className="flex-1"
                disabled={!canEdit}
              >
                Residencial
              </Button>
              <Button
                type="button"
                variant={rentalType === "seasonal" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setRentalType?.(rentalType === "seasonal" ? undefined : "seasonal");
                  onUpdateModule(true);
                }}
                className="flex-1"
                disabled={!canEdit}
              >
                Temporada
              </Button>
              <Button
                type="button"
                variant={rentalType === "short_term" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setRentalType?.(rentalType === "short_term" ? undefined : "short_term");
                  onUpdateModule(true);
                }}
                className="flex-1"
                disabled={!canEdit}
              >
                Vacacional
              </Button>
            </div>
          </div>
        )}

        {/* Short Term License - Shown for seasonal and short_term rental types */}
        {(rentalType === "seasonal" || rentalType === "short_term") && (
          <div className="space-y-1.5">
            <Label htmlFor="shortTermLicense" className="text-sm">
              Licencia turística
            </Label>
            <Input
              id="shortTermLicense"
              value={shortTermLicense ?? ""}
              onChange={(e) => {
                setShortTermLicense?.(e.target.value);
                onUpdateModule(true);
              }}
              className="h-8 text-gray-500"
              placeholder="Ej: VT-12345-A"
              disabled={!canEdit}
            />
          </div>
        )}

        {["Sale", "Transfer"].includes(currentListingType) && (
          <div className="ml-2 flex flex-row items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="transferProperty"
                checked={currentListingType === "Transfer"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onHandleSecondaryListingType("Transfer");
                  } else {
                    onToggleListingType("Sale");
                  }
                }}
                disabled={!canEdit}
              />
              <Label
                htmlFor="transferProperty"
                className="cursor-pointer select-none text-xs text-gray-700"
              >
                Transferencia
              </Label>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="propertyType" className="text-sm">
            Tipo de Propiedad
          </Label>
          <Select
            value={propertyType}
            onValueChange={async (value) => {
              await onPropertyTypeChange(value);
              onUpdateModule(true);
            }}
            disabled={!canEdit}
          >
            <SelectTrigger className="h-8 text-gray-500">
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="piso">Piso</SelectItem>
              <SelectItem value="casa">Casa</SelectItem>
              <SelectItem value="local">Local</SelectItem>
              <SelectItem value="solar">Solar</SelectItem>
              <SelectItem value="garaje">Garaje</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="propertySubtype" className="text-sm">
            Subtipo de Propiedad
          </Label>
          <Select
            value={
              listing.propertySubtype ??
              (propertyType === "piso"
                ? "Piso"
                : propertyType === "casa"
                  ? "Casa"
                  : propertyType === "local"
                    ? "Otros"
                    : propertyType === "solar"
                      ? "Suelo residencial"
                      : propertyType === "garaje"
                        ? "Individual"
                        : "")
            }
            onValueChange={(value) => {
              if (listing.propertySubtype !== undefined) {
                listing.propertySubtype = value;
              }
              onUpdateModule(true);
            }}
            disabled={!canEdit}
          >
            <SelectTrigger className="h-8 text-gray-500">
              <SelectValue placeholder="Seleccionar subtipo" />
            </SelectTrigger>
            <SelectContent>
              {propertyType === "piso" && (
                <>
                  <SelectItem value="Tríplex">Tríplex</SelectItem>
                  <SelectItem value="Dúplex">Dúplex</SelectItem>
                  <SelectItem value="Ático">Ático</SelectItem>
                  <SelectItem value="Estudio">Estudio</SelectItem>
                  <SelectItem value="Loft">Loft</SelectItem>
                  <SelectItem value="Piso">Piso</SelectItem>
                  <SelectItem value="Apartamento">Apartamento</SelectItem>
                  <SelectItem value="Bajo">Bajo</SelectItem>
                </>
              )}
              {propertyType === "casa" && (
                <>
                  <SelectItem value="Casa">Casa</SelectItem>
                  <SelectItem value="Casa adosada">Casa adosada</SelectItem>
                  <SelectItem value="Casa pareada">Casa pareada</SelectItem>
                  <SelectItem value="Chalet">Chalet</SelectItem>
                  <SelectItem value="Casa rústica">Casa rústica</SelectItem>
                  <SelectItem value="Bungalow">Bungalow</SelectItem>
                </>
              )}
              {propertyType === "local" && (
                <>
                  <SelectItem value="Residencial">Residencial</SelectItem>
                  <SelectItem value="Otros">Otros</SelectItem>
                  <SelectItem value="Mixto residencial">
                    Mixto residencial
                  </SelectItem>
                  <SelectItem value="Oficinas">Oficinas</SelectItem>
                  <SelectItem value="Hotel">Hotel</SelectItem>
                </>
              )}
              {propertyType === "solar" && (
                <>
                  <SelectItem value="Suelo residencial">
                    Suelo residencial
                  </SelectItem>
                  <SelectItem value="Suelo industrial">
                    Suelo industrial
                  </SelectItem>
                  <SelectItem value="Suelo rústico">Suelo rústico</SelectItem>
                </>
              )}
              {propertyType === "garaje" && (
                <>
                  <SelectItem value="Moto">Moto</SelectItem>
                  <SelectItem value="Doble">Doble</SelectItem>
                  <SelectItem value="Individual">Individual</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {propertyType === "solar" && (
          <div className="space-y-1.5">
            <Label htmlFor="allowedUse" className="text-sm">
              Uso permitido
            </Label>
            <Select
              value={allowedUse?.toString() ?? ""}
              onValueChange={(value) => {
                setAllowedUse(Number(value));
                onUpdateModule(true);
              }}
              disabled={!canEdit}
            >
              <SelectTrigger className="h-8 text-gray-500">
                <SelectValue placeholder="Seleccionar uso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Agrícola</SelectItem>
                <SelectItem value="2">Comercial</SelectItem>
                <SelectItem value="3">Servicios</SelectItem>
                <SelectItem value="4">Industrial</SelectItem>
                <SelectItem value="8">Residencial plurifamiliar</SelectItem>
                <SelectItem value="9">Residencial unifamiliar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="price" className="text-sm">
            Precio (€)
          </Label>
          <Input
            id="price"
            type="text"
            value={displayPrice}
            className="h-8 text-gray-500"
            onChange={handlePriceChange}
            onBlur={handlePriceBlur}
            placeholder="0"
            disabled={!canEdit}
          />
        </div>

        <div className="my-2 border-t border-border" />

        <div className="flex items-center gap-2">
          <Button
            variant={isBankOwned ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setIsBankOwned(!isBankOwned);
              onUpdateModule(true);
            }}
            disabled={!canEdit}
          >
            <Building2 className="mr-1 h-3.5 w-3.5" />
            {propertyType === "piso"
              ? "Piso de banco"
              : propertyType === "casa"
                ? "Casa de banco"
                : propertyType === "local"
                  ? "Local de banco"
                  : propertyType === "garaje"
                    ? "Garaje de banco"
                    : propertyType === "solar"
                      ? "Solar de banco"
                      : "Propiedad de banco"}
          </Button>
          <Button
            variant={newConstruction ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setNewConstruction(!newConstruction);
              onUpdateModule(true);
            }}
            disabled={!canEdit}
          >
            <Building2 className="mr-1 h-3.5 w-3.5" />
            Obra nueva
          </Button>
        </div>

        {/* Occupation Status - Only shown for sale listings */}
        {["Sale", "Transfer"].includes(currentListingType) && (
          <div className="space-y-1.5">
            <Label className="text-sm">Estado de ocupación</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={occupationStatus === "free" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setOccupationStatus?.(occupationStatus === "free" ? undefined : "free");
                  onUpdateModule(true);
                }}
                disabled={!canEdit}
              >
                Libre
              </Button>
              <Button
                type="button"
                variant={occupationStatus === "tenanted" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setOccupationStatus?.(occupationStatus === "tenanted" ? undefined : "tenanted");
                  onUpdateModule(true);
                }}
                disabled={!canEdit}
              >
                Alquilado
              </Button>
              <Button
                type="button"
                variant={occupationStatus === "bare_ownership" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setOccupationStatus?.(occupationStatus === "bare_ownership" ? undefined : "bare_ownership");
                  onUpdateModule(true);
                }}
                disabled={!canEdit}
              >
                Nuda propiedad
              </Button>
              <Button
                type="button"
                variant={occupationStatus === "illegally_occupied" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setOccupationStatus?.(occupationStatus === "illegally_occupied" ? undefined : "illegally_occupied");
                  onUpdateModule(true);
                }}
                disabled={!canEdit}
              >
                Ocupado
              </Button>
            </div>
          </div>
        )}

        <div className="my-2 border-t border-border" />
      </div>
    </Card>
  );
}
