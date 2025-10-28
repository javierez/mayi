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
import { cn } from "~/lib/utils";
import { ChevronDown } from "lucide-react";
import { ModernSaveIndicator } from "../common/modern-save-indicator";
import type { SaveState } from "~/types/save-state";

type ModuleName =
  | "basicInfo"
  | "propertyDetails"
  | "location"
  | "features"
  | "description"
  | "contactInfo"
  | "orientation"
  | "additionalCharacteristics"
  | "premiumFeatures"
  | "additionalSpaces"
  | "materials"
  | "rentalProperties";

interface MaterialsCardProps {
  mainFloorType: string;
  shutterType: string;
  carpentryType: string;
  windowType: string;
  propertyType: string;
  showMaterials: boolean;
  saveState: SaveState;
  canEdit?: boolean;
  onSave: () => Promise<void>;
  onUpdateModule: (hasChanges: boolean) => void;
  setMainFloorType: (value: string) => void;
  setShutterType: (value: string) => void;
  setCarpentryType: (value: string) => void;
  setWindowType: (value: string) => void;
  setShowMaterials: (value: boolean) => void;
  getCardStyles: (moduleName: ModuleName) => string;
}

export function MaterialsCard({
  mainFloorType,
  shutterType,
  carpentryType,
  windowType,
  propertyType,
  showMaterials,
  saveState,
  canEdit = true,
  onSave,
  onUpdateModule,
  setMainFloorType,
  setShutterType,
  setCarpentryType,
  setWindowType,
  setShowMaterials,
  getCardStyles,
}: MaterialsCardProps) {
  return (
    <Card
      className={cn(
        "relative p-4 transition-all duration-500 ease-out",
        getCardStyles("materials"),
      )}
    >
      <ModernSaveIndicator state={saveState} onSave={onSave} />
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowMaterials(!showMaterials)}
          className="group flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              MATERIALES Y ACABADOS
            </h3>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              showMaterials && "rotate-180",
            )}
          />
        </button>
      </div>
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          showMaterials
            ? "mt-4 grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          {(propertyType === "garaje" || propertyType === "solar") && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 rounded-full bg-muted p-3">
                <svg
                  className="h-6 w-6 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {propertyType === "garaje"
                  ? "No aplicable para garajes"
                  : "No aplicable para solares"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Los materiales y acabados no se aplican a este tipo de propiedad
              </p>
            </div>
          )}
          {propertyType !== "garaje" && propertyType !== "solar" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-3">
                {/* Windows and Doors */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    Ventanas y puertas
                  </h4>
                  <div className="space-y-1.5">
                    <Label htmlFor="windowType" className="text-sm">
                      Tipo de ventana
                    </Label>
                    <Select
                      value={windowType || undefined}
                      onValueChange={(value) => {
                        setWindowType(value);
                        onUpdateModule(true);
                      }}
                      disabled={!canEdit}
                    >
                      <SelectTrigger className="h-8 text-gray-500">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aluminio">Aluminio</SelectItem>
                        <SelectItem value="pvc">PVC</SelectItem>
                        <SelectItem value="madera">Madera</SelectItem>
                        <SelectItem value="climalit">Climalit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="carpentryType" className="text-sm">
                      Tipo de carpintería
                    </Label>
                    <Select
                      value={carpentryType || undefined}
                      onValueChange={(value) => {
                        setCarpentryType(value);
                        onUpdateModule(true);
                      }}
                      disabled={!canEdit}
                    >
                      <SelectTrigger className="h-8 text-gray-500">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aluminio">Aluminio</SelectItem>
                        <SelectItem value="pvc">PVC</SelectItem>
                        <SelectItem value="madera">Madera</SelectItem>
                        <SelectItem value="hierro">Hierro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="shutterType" className="text-sm">
                      Tipo de persiana
                    </Label>
                    <Select
                      value={shutterType || undefined}
                      onValueChange={(value) => {
                        setShutterType(value);
                        onUpdateModule(true);
                      }}
                      disabled={!canEdit}
                    >
                      <SelectTrigger className="h-8 text-gray-500">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="electrico">Eléctrica</SelectItem>
                        <SelectItem value="automatica">Automática</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* Flooring */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    Suelos
                  </h4>
                  <div className="space-y-1.5">
                    <Label htmlFor="mainFloorType" className="text-sm">
                      Tipo de suelo
                    </Label>
                    <Select
                      value={mainFloorType || undefined}
                      onValueChange={(value) => {
                        setMainFloorType(value);
                        onUpdateModule(true);
                      }}
                      disabled={!canEdit}
                    >
                      <SelectTrigger className="h-8 text-gray-500">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parquet">Parquet</SelectItem>
                        <SelectItem value="marmol">Mármol</SelectItem>
                        <SelectItem value="gres">Gres</SelectItem>
                        <SelectItem value="moqueta">Moqueta</SelectItem>
                        <SelectItem value="hidraulico">Hidráulico</SelectItem>
                        <SelectItem value="microcemento">
                          Microcemento
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
