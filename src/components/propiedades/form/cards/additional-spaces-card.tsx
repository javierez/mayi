import React from "react";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { cn } from "~/lib/utils";
import { ChevronDown } from "lucide-react";
import { ModernSaveIndicator } from "../common/modern-save-indicator";
import type { SaveState } from "~/types/save-state";

interface AdditionalSpacesCardProps {
  terrace: boolean;
  terraceSize: number | null;
  wineCellar: boolean;
  wineCellarSize: number | null;
  livingRoomSize: number | null;
  balconyCount: number | null;
  galleryCount: number | null;
  builtInWardrobes: boolean;
  propertyType: string;
  collapsedSections: Record<string, boolean>;
  saveState: SaveState;
  canEdit?: boolean;
  onToggleSection: (section: string) => void;
  onSave: () => Promise<void>;
  onUpdateModule: (hasChanges: boolean) => void;
  setTerrace: (value: boolean) => void;
  setTerraceSize: (value: number | null) => void;
  setWineCellar: (value: boolean) => void;
  setWineCellarSize: (value: number | null) => void;
  setLivingRoomSize: (value: number | null) => void;
  setBalconyCount: (value: number | null) => void;
  setGalleryCount: (value: number | null) => void;
  setBuiltInWardrobes: (value: boolean) => void;
  getCardStyles: (moduleName: string) => string;
}

export function AdditionalSpacesCard({
  terrace,
  terraceSize,
  wineCellar,
  wineCellarSize,
  livingRoomSize,
  balconyCount,
  galleryCount,
  builtInWardrobes,
  propertyType,
  collapsedSections,
  saveState,
  canEdit = true,
  onToggleSection,
  onSave,
  onUpdateModule,
  setTerrace,
  setTerraceSize,
  setWineCellar,
  setWineCellarSize,
  setLivingRoomSize,
  setBalconyCount,
  setGalleryCount,
  setBuiltInWardrobes,
  getCardStyles,
}: AdditionalSpacesCardProps) {
  return (
    <Card
      className={cn(
        "relative p-4 transition-all duration-500 ease-out",
        getCardStyles("additionalSpaces"),
      )}
    >
      <ModernSaveIndicator state={saveState} onSave={onSave} />
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onToggleSection("additionalSpaces")}
          className="group flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              ZONAS Y ESPACIOS COMPLEMENTARIOS
            </h3>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              collapsedSections.additionalSpaces && "rotate-180",
            )}
          />
        </button>
      </div>
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          collapsedSections.additionalSpaces
            ? "grid-rows-[0fr] opacity-0"
            : "mt-4 grid-rows-[1fr] opacity-100",
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {propertyType === "garaje"
                  ? "No aplicable para garajes"
                  : "No aplicable para solares"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Las zonas y espacios complementarios no se aplican a este tipo
                de propiedad
              </p>
            </div>
          )}
          {propertyType !== "garaje" && propertyType !== "solar" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-3">
                {/* Outdoor Spaces */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    Espacios exteriores
                  </h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terrace"
                      checked={terrace}
                      onCheckedChange={(checked) => {
                        setTerrace(checked as boolean);
                        onUpdateModule(true);
                      }}
                      disabled={!canEdit}
                    />
                    <Label htmlFor="terrace" className="text-sm">
                      Terraza
                    </Label>
                  </div>
                  {terrace && (
                    <div className="ml-6 space-y-1.5">
                      <Label htmlFor="terraceSize" className="text-sm">
                        Tamaño (m²)
                      </Label>
                      <Input
                        id="terraceSize"
                        type="number"
                        value={terraceSize ?? ""}
                        placeholder="-"
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? null
                              : parseInt(e.target.value);
                          setTerraceSize(isNaN(value!) ? null : value);
                          onUpdateModule(true);
                        }}
                        className="h-8 text-gray-500"
                        min="0"
                        step="1"
                        disabled={!canEdit}
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="balconyCount" className="text-sm">
                      Nº balcones
                    </Label>
                    <Input
                      id="balconyCount"
                      type="number"
                      value={balconyCount ?? ""}
                      placeholder="-"
                      onChange={(e) => {
                        const value =
                          e.target.value === ""
                            ? null
                            : parseInt(e.target.value);
                        setBalconyCount(isNaN(value!) ? null : value);
                        onUpdateModule(true);
                      }}
                      className="h-8 text-gray-500"
                      min="0"
                      step="1"
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="galleryCount" className="text-sm">
                      Nº galerías
                    </Label>
                    <Input
                      id="galleryCount"
                      type="number"
                      value={galleryCount ?? ""}
                      placeholder="-"
                      onChange={(e) => {
                        const value =
                          e.target.value === ""
                            ? null
                            : parseInt(e.target.value);
                        setGalleryCount(isNaN(value!) ? null : value);
                        onUpdateModule(true);
                      }}
                      className="h-8 text-gray-500"
                      min="0"
                      step="1"
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                {/* Storage Spaces */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    Almacenamiento
                  </h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="wineCellar"
                      checked={wineCellar}
                      onCheckedChange={(checked) => {
                        setWineCellar(checked as boolean);
                        onUpdateModule(true);
                      }}
                      disabled={!canEdit}
                    />
                    <Label htmlFor="wineCellar" className="text-sm">
                      Bodega
                    </Label>
                  </div>
                  {wineCellar && (
                    <div className="ml-6 space-y-1.5">
                      <Label htmlFor="wineCellarSize" className="text-sm">
                        Tamaño (m²)
                      </Label>
                      <Input
                        id="wineCellarSize"
                        type="number"
                        value={wineCellarSize ?? ""}
                        placeholder="-"
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? null
                              : parseInt(e.target.value);
                          setWineCellarSize(isNaN(value!) ? null : value);
                          onUpdateModule(true);
                        }}
                        className="h-8 text-gray-500"
                        min="0"
                        step="1"
                        disabled={!canEdit}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {/* Room Sizes */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    Dimensiones
                  </h4>
                  <div className="space-y-1.5">
                    <Label htmlFor="livingRoomSize" className="text-sm">
                      Tamaño salón (m²)
                    </Label>
                    <Input
                      id="livingRoomSize"
                      type="number"
                      value={livingRoomSize ?? ""}
                      placeholder="-"
                      onChange={(e) => {
                        const value =
                          e.target.value === ""
                            ? null
                            : parseInt(e.target.value);
                        setLivingRoomSize(isNaN(value!) ? null : value);
                        onUpdateModule(true);
                      }}
                      className="h-8 text-gray-500"
                      min="0"
                      step="1"
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                {/* Built-in Features */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    Empotrados
                  </h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="builtInWardrobes"
                      checked={builtInWardrobes}
                      onCheckedChange={(checked) => {
                        setBuiltInWardrobes(!!checked);
                        onUpdateModule(true);
                      }}
                      disabled={!canEdit}
                    />
                    <Label htmlFor="builtInWardrobes" className="text-sm">
                      Armarios empotrados
                    </Label>
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
