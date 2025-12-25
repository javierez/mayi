import React, { useState, useEffect, useRef } from "react";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { ChevronDown } from "lucide-react";
import { ModernSaveIndicator } from "../common/modern-save-indicator";
import type { PropertyListing } from "~/types/property-listing";
import type { SaveState } from "~/types/save-state";
import { CONSERVATION_STATUS_LABELS } from "~/lib/constants/conservation-status";
import {
  PREMISES_UBICATION_VALUES,
  PREMISES_UBICATION_LABELS,
} from "~/lib/constants/premises-ubication";

type ModuleName = "propertyDetails";

interface PropertyDetailsCardProps {
  listing: PropertyListing;
  propertyType: string;
  lastRenovationYear: string;
  buildingFloors: number;
  collapsedSections: Record<string, boolean>;
  saveState: SaveState;
  canEdit?: boolean;
  onToggleSection: (section: string) => void;
  onSave: () => Promise<void>;
  onUpdateModule: (hasChanges: boolean) => void;
  setLastRenovationYear: (value: string) => void;
  setBuildingFloors: (value: number) => void;
  getCardStyles: (moduleName: ModuleName) => string;
  // Optional controlled values from cadastral corrections
  builtSurfaceArea?: number;
  yearBuilt?: number;
  // Finca fields - specific to 'casa' property type
  finca: boolean;
  superficieFinca: number | null;
  setFinca: (value: boolean) => void;
  setSuperficieFinca: (value: number | null) => void;
  // Local (commercial) property specific fields
  ubication?: string | null;
  setUbication?: (value: string | null) => void;
}

export function PropertyDetailsCard({
  listing,
  propertyType,
  lastRenovationYear,
  buildingFloors,
  collapsedSections,
  saveState,
  canEdit = true,
  onToggleSection,
  onSave,
  onUpdateModule,
  setLastRenovationYear,
  setBuildingFloors,
  getCardStyles,
  builtSurfaceArea: controlledBuiltSurfaceArea,
  yearBuilt: controlledYearBuilt,
  finca,
  superficieFinca,
  setFinca,
  setSuperficieFinca,
  ubication,
  setUbication,
}: PropertyDetailsCardProps) {
  // Format area with thousand separators
  const formatArea = (value: number | null | undefined): string => {
    if (value == null || value === 0) return "";
    const numValue = Math.round(value);
    return numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Parse formatted area back to number (returns null for empty/invalid values)
  const parseArea = (value: string): number | null => {
    const numeric = value.replace(/\./g, "").trim();
    if (numeric === "") return null;
    const parsed = parseInt(numeric);
    return isNaN(parsed) ? null : parsed;
  };

  // Local state for formatted surface values
  const [squareMeterDisplay, setSquareMeterDisplay] = useState(
    formatArea(listing.squareMeter),
  );
  const [builtSurfaceDisplay, setBuiltSurfaceDisplay] = useState(
    formatArea(
      listing.builtSurfaceArea ? Math.round(listing.builtSurfaceArea) : null,
    ),
  );
  // Local state for yearBuilt to make it controllable
  const [yearBuiltDisplay, setYearBuiltDisplay] = useState<string>(
    listing.yearBuilt?.toString() ?? "",
  );

  // Track the last controlled value to detect external changes
  const lastControlledBuiltSurfaceRef = useRef(controlledBuiltSurfaceArea);

  // Update display only when controlled value changes from parent (cadastral)
  useEffect(() => {
    // Only update if the controlled value actually changed from outside
    if (
      controlledBuiltSurfaceArea !== undefined &&
      controlledBuiltSurfaceArea !== lastControlledBuiltSurfaceRef.current
    ) {
      setBuiltSurfaceDisplay(
        formatArea(Math.round(controlledBuiltSurfaceArea)),
      );
      lastControlledBuiltSurfaceRef.current = controlledBuiltSurfaceArea;
    }
  }, [controlledBuiltSurfaceArea]);

  // Update yearBuilt when controlled value changes
  useEffect(() => {
    const yearValue = controlledYearBuilt ?? listing.yearBuilt;
    setYearBuiltDisplay(yearValue?.toString() ?? "");
  }, [listing.yearBuilt, controlledYearBuilt]);

  const handleSquareMeterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSquareMeterDisplay(value);
    const numeric = parseArea(value);
    listing.squareMeter = numeric ?? undefined;
    onUpdateModule(true);
  };

  const handleBuiltSurfaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBuiltSurfaceDisplay(value);
    const numeric = parseArea(value);
    listing.builtSurfaceArea = numeric ?? undefined;
    onUpdateModule(true);
  };

  const handleSquareMeterBlur = () => {
    // Reformat on blur to ensure consistent formatting
    setSquareMeterDisplay(formatArea(listing.squareMeter));
  };

  const handleBuiltSurfaceBlur = () => {
    // Reformat on blur to ensure consistent formatting
    setBuiltSurfaceDisplay(
      formatArea(
        listing.builtSurfaceArea ? Math.round(listing.builtSurfaceArea) : null,
      ),
    );
  };

  return (
    <Card
      className={cn(
        "relative p-4 transition-all duration-500 ease-out",
        getCardStyles("propertyDetails"),
      )}
    >
      <ModernSaveIndicator state={saveState} onSave={onSave} />
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onToggleSection("propertyDetails")}
          className="group flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              DISTRIBUCIÓN Y SUPERFICIE
            </h3>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              collapsedSections.propertyDetails && "rotate-180",
            )}
          />
        </button>
      </div>
      <div
        className={cn(
          "space-y-3 overflow-hidden transition-all duration-200",
          collapsedSections.propertyDetails ? "max-h-0" : "max-h-[2000px]",
        )}
      >
        {propertyType !== "garaje" && propertyType !== "solar" && (
          <div className="space-y-1.5">
            <Label htmlFor="bedrooms" className="text-sm">
              {propertyType === "local" ? "Estancias" : "Habitaciones"}
            </Label>
            <Input
              id="bedrooms"
              type="number"
              defaultValue={listing.bedrooms?.toString() ?? ""}
              className="h-8 text-gray-500"
              onChange={() => onUpdateModule(true)}
              disabled={!canEdit}
            />
          </div>
        )}
        {propertyType !== "garaje" && propertyType !== "solar" && (
          <div className="space-y-1.5">
            <Label htmlFor="bathrooms" className="text-sm">
              Baños
            </Label>
            <Input
              id="bathrooms"
              type="number"
              defaultValue={
                listing.bathrooms ? Math.round(listing.bathrooms) : undefined
              }
              className="h-8 text-gray-500"
              min="0"
              step="1"
              onChange={() => onUpdateModule(true)}
              disabled={!canEdit}
            />
          </div>
        )}
        {propertyType === "local" && (
          <>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDiafano"
                checked={listing.isDiafano ?? false}
                onCheckedChange={(checked) => {
                  listing.isDiafano = checked as boolean;
                  onUpdateModule(true);
                }}
                disabled={!canEdit}
              />
              <Label htmlFor="isDiafano" className="text-sm">
                Local Diáfano
              </Label>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ubication" className="text-sm">
                Ubicación del local
              </Label>
              <Select
                value={ubication ?? ""}
                onValueChange={(value) => {
                  setUbication?.(value || null);
                  onUpdateModule(true);
                }}
                disabled={!canEdit}
              >
                <SelectTrigger className="h-8 text-gray-500">
                  <SelectValue placeholder="Seleccionar ubicación" />
                </SelectTrigger>
                <SelectContent>
                  {PREMISES_UBICATION_VALUES.map((ubi) => (
                    <SelectItem key={ubi} value={ubi}>
                      {PREMISES_UBICATION_LABELS[ubi]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="squareMeter" className="text-sm">
              {propertyType === "garaje"
                ? "Medidas (m²)"
                : propertyType === "solar"
                  ? "Edificable (m²)"
                  : "Superficie útil (m²)"}
            </Label>
            <Input
              id="squareMeter"
              type="text"
              value={squareMeterDisplay}
              className="h-8 text-gray-500"
              onChange={handleSquareMeterChange}
              onBlur={handleSquareMeterBlur}
              placeholder="-"
              disabled={!canEdit}
            />
          </div>
          {propertyType !== "garaje" && (
            <div className="space-y-1.5">
              <Label htmlFor="builtSurfaceArea" className="text-sm">
                {propertyType === "solar"
                  ? "Superficie de parcela (m²)"
                  : "Construida (m²)"}
              </Label>
              <Input
                id="builtSurfaceArea"
                type="text"
                value={builtSurfaceDisplay}
                className="h-8 text-gray-500"
                onChange={handleBuiltSurfaceChange}
                onBlur={handleBuiltSurfaceBlur}
                placeholder="-"
                disabled={!canEdit}
              />
            </div>
          )}
        </div>
        {propertyType !== "solar" && (
          <div className="space-y-1.5">
            <Label htmlFor="yearBuilt" className="text-sm">
              Año de Construcción
            </Label>
            <Input
              id="yearBuilt"
              type="number"
              value={yearBuiltDisplay}
              onChange={(e) => {
                setYearBuiltDisplay(e.target.value);
                onUpdateModule(true);
              }}
              className="h-8 text-gray-500"
              disabled={!canEdit}
            />
          </div>
        )}
        {propertyType !== "garaje" && propertyType !== "solar" && (
          <div className="space-y-1.5">
            <Label htmlFor="lastRenovationYear" className="text-sm">
              Año última reforma
            </Label>
            <Input
              id="lastRenovationYear"
              type="number"
              value={lastRenovationYear}
              onChange={(e) => {
                setLastRenovationYear(e.target.value);
                onUpdateModule(true);
              }}
              className="h-8 text-gray-500"
              min="1900"
              max={new Date().getFullYear()}
              disabled={!canEdit}
            />
          </div>
        )}
        {propertyType !== "garaje" && (
          <div className="space-y-1.5">
            <Label htmlFor="buildingFloors" className="text-sm">
              {propertyType === "solar"
                ? "Plantas edificables"
                : "Plantas edificio"}
            </Label>
            <Input
              id="buildingFloors"
              type="number"
              value={buildingFloors ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setBuildingFloors(value === "" ? 0 : parseInt(value) || 0);
                onUpdateModule(true);
              }}
              className="h-8 text-gray-500"
              min="1"
              step="1"
              disabled={!canEdit}
            />
          </div>
        )}
        {propertyType !== "solar" && (
          <div className="space-y-1.5">
            <Label htmlFor="conservationStatus" className="text-sm">
              Estado de conservación
            </Label>
            <Select
              value={listing.conservationStatus?.toString() ?? "1"}
              onValueChange={(value) => {
                listing.conservationStatus = parseInt(value);
                onUpdateModule(true);
              }}
              disabled={!canEdit}
            >
              <SelectTrigger className="h-8 text-gray-500">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">
                  {CONSERVATION_STATUS_LABELS[1]}
                </SelectItem>
                <SelectItem value="2">
                  {CONSERVATION_STATUS_LABELS[2]}
                </SelectItem>
                <SelectItem value="3">
                  {CONSERVATION_STATUS_LABELS[3]}
                </SelectItem>
                <SelectItem value="4">
                  {CONSERVATION_STATUS_LABELS[4]}
                </SelectItem>
                <SelectItem value="6">
                  {CONSERVATION_STATUS_LABELS[6]}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {/* Finca fields - only for 'casa' property type */}
        {propertyType === "casa" && (
          <>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="finca"
                checked={finca}
                onCheckedChange={(checked) => {
                  setFinca(checked as boolean);
                  if (!checked) {
                    setSuperficieFinca(null); // Clear surface when finca is unchecked
                  }
                  onUpdateModule(true);
                }}
                disabled={!canEdit}
              />
              <Label htmlFor="finca" className="text-sm">
                Finca
              </Label>
            </div>
            {finca && (
              <div className="ml-6 space-y-1.5">
                <Label htmlFor="superficieFinca" className="text-sm">
                  Superficie Finca (m²)
                </Label>
                <Input
                  id="superficieFinca"
                  type="number"
                  value={superficieFinca ?? ""}
                  placeholder="0"
                  onChange={(e) => {
                    const value =
                      e.target.value === "" ? null : parseFloat(e.target.value);
                    setSuperficieFinca(
                      value !== null && isNaN(value) ? null : value,
                    );
                    onUpdateModule(true);
                  }}
                  className="h-8 text-gray-500"
                  min="0"
                  step="0.01"
                  disabled={!canEdit}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
