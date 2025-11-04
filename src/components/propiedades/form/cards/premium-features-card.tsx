"use client";

import React from "react";
import { Card } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { cn } from "~/lib/utils";
import { ChevronDown } from "lucide-react";
import { ModernSaveIndicator } from "../common/modern-save-indicator";
import type { SaveState } from "~/types/save-state";

interface PremiumFeaturesCardProps {
  propertyType: string;
  views: boolean;
  mountainViews: boolean;
  seaViews: boolean;
  beachfront: boolean;
  jacuzzi: boolean;
  hydromassage: boolean;
  garden: boolean;
  pool: boolean;
  homeAutomation: boolean;
  musicSystem: boolean;
  laundryRoom: boolean;
  coveredClothesline: boolean;
  fireplace: boolean;
  sauna: boolean;
  patio: boolean;
  gym: boolean;
  sportsArea: boolean;
  childrenArea: boolean;
  suiteBathroom: boolean;
  nearbyPublicTransport: boolean;
  communityPool: boolean;
  privatePool: boolean;
  tennisCourt: boolean;
  communityArea: boolean;
  collapsedSections: Record<string, boolean>;
  saveState: SaveState;
  canEdit?: boolean;
  onToggleSection: (section: string) => void;
  onSave: () => Promise<void>;
  onUpdateModule: (hasChanges: boolean) => void;
  setViews: (value: boolean) => void;
  setMountainViews: (value: boolean) => void;
  setSeaViews: (value: boolean) => void;
  setBeachfront: (value: boolean) => void;
  setJacuzzi: (value: boolean) => void;
  setHydromassage: (value: boolean) => void;
  setGarden: (value: boolean) => void;
  setPool: (value: boolean) => void;
  setHomeAutomation: (value: boolean) => void;
  setMusicSystem: (value: boolean) => void;
  setLaundryRoom: (value: boolean) => void;
  setCoveredClothesline: (value: boolean) => void;
  setFireplace: (value: boolean) => void;
  setSauna: (value: boolean) => void;
  setPatio: (value: boolean) => void;
  setGym: (value: boolean) => void;
  setSportsArea: (value: boolean) => void;
  setChildrenArea: (value: boolean) => void;
  setSuiteBathroom: (value: boolean) => void;
  setNearbyPublicTransport: (value: boolean) => void;
  setCommunityPool: (value: boolean) => void;
  setPrivatePool: (value: boolean) => void;
  setTennisCourt: (value: boolean) => void;
  setCommunityArea: (value: boolean) => void;
  getCardStyles: (moduleName: "premiumFeatures") => string;
}

export function PremiumFeaturesCard({
  propertyType,
  views,
  mountainViews,
  seaViews,
  beachfront,
  jacuzzi,
  hydromassage,
  garden,
  pool,
  homeAutomation,
  musicSystem,
  laundryRoom,
  coveredClothesline,
  fireplace,
  sauna,
  patio,
  gym,
  sportsArea,
  childrenArea,
  suiteBathroom,
  nearbyPublicTransport,
  communityPool,
  privatePool,
  tennisCourt,
  communityArea,
  collapsedSections,
  saveState,
  canEdit = true,
  onToggleSection,
  onSave,
  onUpdateModule,
  setViews,
  setMountainViews,
  setSeaViews,
  setBeachfront,
  setJacuzzi,
  setHydromassage,
  setGarden,
  setPool,
  setHomeAutomation,
  setMusicSystem,
  setLaundryRoom,
  setCoveredClothesline,
  setFireplace,
  setSauna,
  setPatio,
  setGym,
  setSportsArea,
  setChildrenArea,
  setSuiteBathroom,
  setNearbyPublicTransport,
  setCommunityPool,
  setPrivatePool,
  setTennisCourt,
  setCommunityArea,
  getCardStyles,
}: PremiumFeaturesCardProps) {
  return (
    <Card
      className={cn(
        "relative p-4 transition-all duration-500 ease-out",
        getCardStyles("premiumFeatures"),
      )}
    >
      <ModernSaveIndicator state={saveState} onSave={onSave} />
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onToggleSection("premiumFeatures")}
          className="group flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              EXTRAS DE LUJO Y CONFORT
            </h3>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              collapsedSections.premiumFeatures && "rotate-180",
            )}
          />
        </button>
      </div>
      <div
        className={cn(
          "space-y-3 overflow-hidden transition-all duration-200",
          collapsedSections.premiumFeatures ? "max-h-0" : "max-h-[5000px]",
        )}
      >
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
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {propertyType === "garaje"
                ? "No aplicable para garajes"
                : "No aplicable para solares"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Los extras de lujo y confort no se aplican a este tipo de
              propiedad
            </p>
          </div>
        )}
        {propertyType !== "garaje" && propertyType !== "solar" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-3">
              {/* Views */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">
                  Vistas
                </h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="views"
                    checked={views}
                    onCheckedChange={(checked) => {
                      setViews(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="views" className="text-sm">
                    Vistas
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mountainViews"
                    checked={mountainViews}
                    onCheckedChange={(checked) => {
                      setMountainViews(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="mountainViews" className="text-sm">
                    Vistas montaña
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="seaViews"
                    checked={seaViews}
                    onCheckedChange={(checked) => {
                      setSeaViews(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="seaViews" className="text-sm">
                    Vistas mar
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="beachfront"
                    checked={beachfront}
                    onCheckedChange={(checked) => {
                      setBeachfront(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="beachfront" className="text-sm">
                    Primera línea
                  </Label>
                </div>
              </div>

              {/* Wellness */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">
                  Bienestar
                </h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="jacuzzi"
                    checked={jacuzzi}
                    onCheckedChange={(checked) => {
                      setJacuzzi(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="jacuzzi" className="text-sm">
                    Jacuzzi
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hydromassage"
                    checked={hydromassage}
                    onCheckedChange={(checked) => {
                      setHydromassage(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="hydromassage" className="text-sm">
                    Hidromasaje
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fireplace"
                    checked={fireplace}
                    onCheckedChange={(checked) => {
                      setFireplace(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="fireplace" className="text-sm">
                    Chimenea
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sauna"
                    checked={sauna}
                    onCheckedChange={(checked) => {
                      console.log("Sauna checkbox changed:", checked);
                      setSauna(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="sauna" className="text-sm">
                    Sauna
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="suiteBathroom"
                    checked={suiteBathroom}
                    onCheckedChange={(checked) => {
                      setSuiteBathroom(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="suiteBathroom" className="text-sm">
                    Baño en suite
                  </Label>
                </div>
              </div>

              {/* Smart Home */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">
                  Domótica
                </h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="homeAutomation"
                    checked={homeAutomation}
                    onCheckedChange={(checked) => {
                      setHomeAutomation(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="homeAutomation" className="text-sm">
                    Domótica
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="musicSystem"
                    checked={musicSystem}
                    onCheckedChange={(checked) => {
                      setMusicSystem(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="musicSystem" className="text-sm">
                    Sistema de música
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Outdoor Features */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">
                  Exterior
                </h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="garden"
                    checked={garden}
                    onCheckedChange={(checked) => {
                      setGarden(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="garden" className="text-sm">
                    Jardín
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="patio"
                    checked={patio}
                    onCheckedChange={(checked) => {
                      setPatio(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="patio" className="text-sm">
                    Patio
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pool"
                    checked={pool}
                    onCheckedChange={(checked) => {
                      setPool(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="pool" className="text-sm">
                    Piscina
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="privatePool"
                    checked={privatePool}
                    onCheckedChange={(checked) => {
                      setPrivatePool(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="privatePool" className="text-sm">
                    Piscina privada
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="communityPool"
                    checked={communityPool}
                    onCheckedChange={(checked) => {
                      setCommunityPool(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="communityPool" className="text-sm">
                    Piscina comunitaria
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tennisCourt"
                    checked={tennisCourt}
                    onCheckedChange={(checked) => {
                      setTennisCourt(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="tennisCourt" className="text-sm">
                    Pista de tenis
                  </Label>
                </div>
              </div>

              {/* Community Amenities */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">
                  Comunitarios
                </h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gym"
                    checked={gym}
                    onCheckedChange={(checked) => {
                      setGym(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="gym" className="text-sm">
                    Gimnasio
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sportsArea"
                    checked={sportsArea}
                    onCheckedChange={(checked) => {
                      setSportsArea(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="sportsArea" className="text-sm">
                    Zona deportiva
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="childrenArea"
                    checked={childrenArea}
                    onCheckedChange={(checked) => {
                      setChildrenArea(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="childrenArea" className="text-sm">
                    Zona infantil
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="communityArea"
                    checked={communityArea}
                    onCheckedChange={(checked) => {
                      setCommunityArea(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="communityArea" className="text-sm">
                    Zona comunitaria
                  </Label>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">
                  Ubicación
                </h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="nearbyPublicTransport"
                    checked={nearbyPublicTransport}
                    onCheckedChange={(checked) => {
                      setNearbyPublicTransport(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="nearbyPublicTransport" className="text-sm">
                    Transporte público cercano
                  </Label>
                </div>
              </div>

              {/* Utility Rooms */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">
                  Estancias
                </h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="laundryRoom"
                    checked={laundryRoom}
                    onCheckedChange={(checked) => {
                      setLaundryRoom(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="laundryRoom" className="text-sm">
                    Lavadero
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="coveredClothesline"
                    checked={coveredClothesline}
                    onCheckedChange={(checked) => {
                      setCoveredClothesline(checked as boolean);
                      onUpdateModule(true);
                    }}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="coveredClothesline" className="text-sm">
                    Tendedero cubierto
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
