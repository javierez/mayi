import React from "react";
import { Card } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { cn } from "~/lib/utils";
import { ChevronDown } from "lucide-react";
import { ModernSaveIndicator } from "../common/modern-save-indicator";
import type { SaveState } from "~/types/save-state";

interface OrientationCardProps {
  isExterior: boolean;
  isBright: boolean;
  hasEscaparate: boolean;
  orientation: string;
  propertyType: string;
  collapsedSections: Record<string, boolean>;
  saveState: SaveState;
  canEdit?: boolean;
  onToggleSection: (section: string) => void;
  onSave: () => Promise<void>;
  onUpdateModule: (hasChanges: boolean) => void;
  setIsExterior: (value: boolean) => void;
  setIsBright: (value: boolean) => void;
  setHasEscaparate: (value: boolean) => void;
  setOrientation: (value: string) => void;
  getCardStyles: (moduleName: string) => string;
}

export function OrientationCard({
  isExterior,
  isBright,
  hasEscaparate,
  orientation,
  propertyType,
  collapsedSections,
  saveState,
  canEdit = true,
  onToggleSection,
  onSave,
  onUpdateModule,
  setIsExterior,
  setIsBright,
  setHasEscaparate,
  setOrientation,
  getCardStyles,
}: OrientationCardProps) {
  return (
    <Card
      className={cn(
        "relative p-4 transition-all duration-500 ease-out",
        getCardStyles("orientation"),
      )}
    >
      <ModernSaveIndicator state={saveState} onSave={onSave} />
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onToggleSection("orientation")}
          className="group flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              ORIENTACIÓN Y EXPOSICIÓN
            </h3>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              collapsedSections.orientation && "rotate-180",
            )}
          />
        </button>
      </div>
      <div
        className={cn(
          "space-y-3 overflow-hidden transition-all duration-200",
          collapsedSections.orientation ? "max-h-0" : "max-h-[500px]",
        )}
      >
        {propertyType !== "solar" && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isExterior"
              checked={isExterior}
              onCheckedChange={(checked) => {
                setIsExterior(checked as boolean);
                onUpdateModule(true);
              }}
              disabled={!canEdit}
            />
            <Label htmlFor="isExterior" className="text-sm">
              Exterior
            </Label>
          </div>
        )}
        {propertyType !== "garaje" && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isBright"
              checked={isBright}
              onCheckedChange={(checked) => {
                setIsBright(checked as boolean);
                onUpdateModule(true);
              }}
              disabled={!canEdit}
            />
            <Label htmlFor="isBright" className="text-sm">
              Luminoso
            </Label>
          </div>
        )}
        {propertyType === "local" && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasEscaparate"
              checked={hasEscaparate}
              onCheckedChange={(checked) => {
                setHasEscaparate(checked as boolean);
                onUpdateModule(true);
              }}
              disabled={!canEdit}
            />
            <Label htmlFor="hasEscaparate" className="text-sm">
              Escaparate
            </Label>
          </div>
        )}
        {propertyType !== "garaje" && (
          <div className="space-y-1.5">
            <Label htmlFor="orientation" className="text-sm">
              Orientación
            </Label>
            <Select
              value={orientation}
              onValueChange={(value) => {
                setOrientation(value);
                onUpdateModule(true);
              }}
              disabled={!canEdit}
            >
              <SelectTrigger className="h-8 text-gray-500">
                <SelectValue placeholder="Seleccionar orientación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="norte">Norte</SelectItem>
                <SelectItem value="sur">Sur</SelectItem>
                <SelectItem value="este">Este</SelectItem>
                <SelectItem value="oeste">Oeste</SelectItem>
                <SelectItem value="noreste">Noreste</SelectItem>
                <SelectItem value="noroeste">Noroeste</SelectItem>
                <SelectItem value="sureste">Sureste</SelectItem>
                <SelectItem value="suroeste">Suroeste</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </Card>
  );
}
