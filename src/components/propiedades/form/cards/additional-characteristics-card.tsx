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

interface AdditionalCharacteristicsCardProps {
  disabledAccessible: boolean;
  vpo: boolean;
  videoIntercom: boolean;
  conciergeService: boolean;
  securityGuard: boolean;
  satelliteDish: boolean;
  doubleGlazing: boolean;
  alarm: boolean;
  securityDoor: boolean;
  kitchenType: string;
  openKitchen: boolean;
  frenchKitchen: boolean;
  furnishedKitchen: boolean;
  pantry: boolean;
  propertyType: string;
  showAdditionalCharacteristics: boolean;
  saveState: SaveState;
  canEdit?: boolean;
  onSave: () => Promise<void>;
  onUpdateModule: (hasChanges: boolean) => void;
  setDisabledAccessible: (value: boolean) => void;
  setVpo: (value: boolean) => void;
  setVideoIntercom: (value: boolean) => void;
  setConciergeService: (value: boolean) => void;
  setSecurityGuard: (value: boolean) => void;
  setSatelliteDish: (value: boolean) => void;
  setDoubleGlazing: (value: boolean) => void;
  setAlarm: (value: boolean) => void;
  setSecurityDoor: (value: boolean) => void;
  setKitchenType: (value: string) => void;
  setOpenKitchen: (value: boolean) => void;
  setFrenchKitchen: (value: boolean) => void;
  setFurnishedKitchen: (value: boolean) => void;
  setPantry: (value: boolean) => void;
  setShowAdditionalCharacteristics: (value: boolean) => void;
  getCardStyles: (moduleName: ModuleName) => string;
}

export function AdditionalCharacteristicsCard({
  disabledAccessible,
  vpo,
  videoIntercom,
  conciergeService,
  securityGuard,
  satelliteDish,
  doubleGlazing,
  alarm,
  securityDoor,
  kitchenType,
  openKitchen,
  frenchKitchen,
  furnishedKitchen,
  pantry,
  propertyType,
  showAdditionalCharacteristics,
  saveState,
  canEdit = true,
  onSave,
  onUpdateModule,
  setDisabledAccessible,
  setVpo,
  setVideoIntercom,
  setConciergeService,
  setSecurityGuard,
  setSatelliteDish,
  setDoubleGlazing,
  setAlarm,
  setSecurityDoor,
  setKitchenType,
  setOpenKitchen,
  setFrenchKitchen,
  setFurnishedKitchen,
  setPantry,
  setShowAdditionalCharacteristics,
  getCardStyles,
}: AdditionalCharacteristicsCardProps) {
  return (
    <Card
      className={cn(
        "relative p-4 transition-all duration-500 ease-out",
        getCardStyles("additionalCharacteristics"),
      )}
    >
      <ModernSaveIndicator state={saveState} onSave={onSave} />
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            setShowAdditionalCharacteristics(!showAdditionalCharacteristics)
          }
          className="group flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              CARACTERÍSTICAS ADICIONALES
            </h3>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              showAdditionalCharacteristics && "rotate-180",
            )}
          />
        </button>
      </div>
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          showAdditionalCharacteristics
            ? "mt-4 grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          {propertyType === "solar" && (
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
                No aplicable para solares
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Las características adicionales no se aplican a este tipo de
                propiedad
              </p>
            </div>
          )}
          {propertyType !== "solar" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {propertyType !== "solar" && (
                <div className="space-y-3">
                  {/* Security Features */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Seguridad
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="securityDoor"
                        checked={securityDoor}
                        onCheckedChange={(checked) => {
                          setSecurityDoor(checked as boolean);
                          onUpdateModule(true);
                        }}
                        disabled={!canEdit}
                      />
                      <Label htmlFor="securityDoor" className="text-sm">
                        Puerta blindada
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="alarm"
                        checked={alarm}
                        onCheckedChange={(checked) => {
                          setAlarm(checked as boolean);
                          onUpdateModule(true);
                        }}
                        disabled={!canEdit}
                      />
                      <Label htmlFor="alarm" className="text-sm">
                        Alarma
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="videoIntercom"
                        checked={videoIntercom}
                        onCheckedChange={(checked) => {
                          setVideoIntercom(checked as boolean);
                          onUpdateModule(true);
                        }}
                        disabled={!canEdit}
                      />
                      <Label htmlFor="videoIntercom" className="text-sm">
                        Videoportero
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="securityGuard"
                        checked={securityGuard}
                        onCheckedChange={(checked) => {
                          setSecurityGuard(checked as boolean);
                          onUpdateModule(true);
                        }}
                        disabled={!canEdit}
                      />
                      <Label htmlFor="securityGuard" className="text-sm">
                        Vigilante
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="conciergeService"
                        checked={conciergeService}
                        onCheckedChange={(checked) => {
                          setConciergeService(checked as boolean);
                          onUpdateModule(true);
                        }}
                        disabled={!canEdit}
                      />
                      <Label htmlFor="conciergeService" className="text-sm">
                        Conserjería
                      </Label>
                    </div>
                  </div>

                  {/* Building Features */}
                  {propertyType !== "garaje" && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground">
                        Características del edificio
                      </h4>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="vpo"
                          checked={vpo}
                          onCheckedChange={(checked) => {
                            setVpo(checked as boolean);
                            onUpdateModule(true);
                          }}
                          disabled={!canEdit}
                        />
                        <Label htmlFor="vpo" className="text-sm">
                          VPO
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="disabledAccessible"
                          checked={disabledAccessible}
                          onCheckedChange={(checked) => {
                            setDisabledAccessible(checked as boolean);
                            onUpdateModule(true);
                          }}
                          disabled={!canEdit}
                        />
                        <Label htmlFor="disabledAccessible" className="text-sm">
                          Accesible
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="satelliteDish"
                          checked={satelliteDish}
                          onCheckedChange={(checked) => {
                            setSatelliteDish(checked as boolean);
                            onUpdateModule(true);
                          }}
                          disabled={!canEdit}
                        />
                        <Label htmlFor="satelliteDish" className="text-sm">
                          Antena
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="doubleGlazing"
                          checked={doubleGlazing}
                          onCheckedChange={(checked) => {
                            setDoubleGlazing(checked as boolean);
                            onUpdateModule(true);
                          }}
                          disabled={!canEdit}
                        />
                        <Label htmlFor="doubleGlazing" className="text-sm">
                          Doble acristalamiento
                        </Label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {propertyType !== "garaje" && propertyType !== "solar" && (
                <div className="space-y-3">
                  {/* Kitchen Features */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Cocina
                    </h4>
                    <div className="space-y-1.5">
                      <Label htmlFor="kitchenType" className="text-sm">
                        Tipo de cocina
                      </Label>
                      <Select
                        value={kitchenType}
                        onValueChange={(value) => {
                          setKitchenType(value);
                          onUpdateModule(true);
                        }}
                        disabled={!canEdit}
                      >
                        <SelectTrigger className="h-8 text-gray-500">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gas">Gas</SelectItem>
                          <SelectItem value="induccion">Inducción</SelectItem>
                          <SelectItem value="vitroceramica">
                            Vitrocerámica
                          </SelectItem>
                          <SelectItem value="carbon">Carbón</SelectItem>
                          <SelectItem value="electrico">Eléctrico</SelectItem>
                          <SelectItem value="mixto">Mixto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="openKitchen"
                        checked={openKitchen}
                        onCheckedChange={(checked) => {
                          setOpenKitchen(checked as boolean);
                          onUpdateModule(true);
                        }}
                        disabled={!canEdit}
                      />
                      <Label htmlFor="openKitchen" className="text-sm">
                        Cocina abierta
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="frenchKitchen"
                        checked={frenchKitchen}
                        onCheckedChange={(checked) => {
                          setFrenchKitchen(checked as boolean);
                          onUpdateModule(true);
                        }}
                        disabled={!canEdit}
                      />
                      <Label htmlFor="frenchKitchen" className="text-sm">
                        Cocina francesa
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="furnishedKitchen"
                        checked={furnishedKitchen}
                        onCheckedChange={(checked) => {
                          setFurnishedKitchen(checked as boolean);
                          onUpdateModule(true);
                        }}
                        disabled={!canEdit}
                      />
                      <Label htmlFor="furnishedKitchen" className="text-sm">
                        Cocina amueblada
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pantry"
                        checked={pantry}
                        onCheckedChange={(checked) => {
                          setPantry(checked as boolean);
                          onUpdateModule(true);
                        }}
                        disabled={!canEdit}
                      />
                      <Label htmlFor="pantry" className="text-sm">
                        Despensa
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
