import React from "react";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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
  | "rentalProperties"
  | "propertyExpenses"
  | "rentalTerms";

interface PropertyExpensesCardProps {
  // Taxes
  ibi: number | null;
  garbageTax: number | null;
  vadoPermanente: number | null;
  // Community
  communityFees: number | null;
  derrama: number | null;
  // Utilities
  electricityEstimate: number | null;
  gasEstimate: number | null;
  waterEstimate: number | null;
  centralHeatingFee: number | null;
  internetEstimate: number | null;
  // Insurance
  homeInsurance: number | null;
  // Card state
  propertyType: string;
  collapsedSections: Record<string, boolean>;
  saveState: SaveState;
  canEdit?: boolean;
  // Callbacks
  onToggleSection: (section: string) => void;
  onSave: () => Promise<void>;
  onUpdateModule: (hasChanges: boolean) => void;
  // Setters
  setIbi: (value: number | null) => void;
  setGarbageTax: (value: number | null) => void;
  setVadoPermanente: (value: number | null) => void;
  setCommunityFees: (value: number | null) => void;
  setDerrama: (value: number | null) => void;
  setElectricityEstimate: (value: number | null) => void;
  setGasEstimate: (value: number | null) => void;
  setWaterEstimate: (value: number | null) => void;
  setCentralHeatingFee: (value: number | null) => void;
  setInternetEstimate: (value: number | null) => void;
  setHomeInsurance: (value: number | null) => void;
  getCardStyles: (moduleName: ModuleName) => string;
}

export function PropertyExpensesCard({
  ibi,
  garbageTax,
  vadoPermanente,
  communityFees,
  derrama,
  electricityEstimate,
  gasEstimate,
  waterEstimate,
  centralHeatingFee,
  internetEstimate,
  homeInsurance,
  propertyType,
  collapsedSections,
  saveState,
  canEdit = true,
  onToggleSection,
  onSave,
  onUpdateModule,
  setIbi,
  setGarbageTax,
  setVadoPermanente,
  setCommunityFees,
  setDerrama,
  setElectricityEstimate,
  setGasEstimate,
  setWaterEstimate,
  setCentralHeatingFee,
  setInternetEstimate,
  setHomeInsurance,
  getCardStyles,
}: PropertyExpensesCardProps) {
  const isCollapsed = collapsedSections.propertyExpenses;

  // Helper to handle numeric input changes
  const handleNumericChange = (
    value: string,
    setter: (value: number | null) => void,
  ) => {
    const numValue = value === "" ? null : parseFloat(value);
    setter(numValue);
    onUpdateModule(true);
  };

  // Show simplified view for garaje and solar types
  const isSimplifiedType = propertyType === "garaje" || propertyType === "solar";

  return (
    <Card
      className={cn(
        "relative p-4 transition-all duration-500 ease-out",
        getCardStyles("propertyExpenses"),
      )}
    >
      <ModernSaveIndicator state={saveState} onSave={onSave} />
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onToggleSection("propertyExpenses")}
          className="group flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              GASTOS E IMPUESTOS
            </h3>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              !isCollapsed && "rotate-180",
            )}
          />
        </button>
      </div>
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          !isCollapsed
            ? "mt-4 grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          {/* Impuestos y Tasas Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">
                Impuestos y tasas
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ibi" className="text-sm">
                    IBI (€/año)
                  </Label>
                  <Input
                    id="ibi"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={ibi ?? ""}
                    onChange={(e) => handleNumericChange(e.target.value, setIbi)}
                    disabled={!canEdit}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="garbageTax" className="text-sm">
                    Tasa de Basuras (€/año)
                  </Label>
                  <Input
                    id="garbageTax"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={garbageTax ?? ""}
                    onChange={(e) =>
                      handleNumericChange(e.target.value, setGarbageTax)
                    }
                    disabled={!canEdit}
                    className="h-8"
                  />
                </div>
                {propertyType === "garaje" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="vadoPermanente" className="text-sm">
                      Vado Permanente (€/año)
                    </Label>
                    <Input
                      id="vadoPermanente"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={vadoPermanente ?? ""}
                      onChange={(e) =>
                        handleNumericChange(e.target.value, setVadoPermanente)
                      }
                      disabled={!canEdit}
                      className="h-8"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Community Fees Section - Hide for solar */}
            {propertyType !== "solar" && (
              <div className="space-y-2 border-t pt-4">
                <h4 className="text-xs font-medium text-muted-foreground">
                  Comunidad
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="communityFees" className="text-sm">
                      Gastos de Comunidad (€/mes)
                    </Label>
                    <Input
                      id="communityFees"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={communityFees ?? ""}
                      onChange={(e) =>
                        handleNumericChange(e.target.value, setCommunityFees)
                      }
                      disabled={!canEdit}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="derrama" className="text-sm">
                      Derrama (€)
                    </Label>
                    <Input
                      id="derrama"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={derrama ?? ""}
                      onChange={(e) =>
                        handleNumericChange(e.target.value, setDerrama)
                      }
                      disabled={!canEdit}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Utility Estimates Section - Hide for garaje and solar */}
            {!isSimplifiedType && (
              <div className="space-y-2 border-t pt-4">
                <h4 className="text-xs font-medium text-muted-foreground">
                  Suministros estimados
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="electricityEstimate" className="text-sm">
                      Electricidad (€/mes)
                    </Label>
                    <Input
                      id="electricityEstimate"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={electricityEstimate ?? ""}
                      onChange={(e) =>
                        handleNumericChange(e.target.value, setElectricityEstimate)
                      }
                      disabled={!canEdit}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gasEstimate" className="text-sm">
                      Gas (€/mes)
                    </Label>
                    <Input
                      id="gasEstimate"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={gasEstimate ?? ""}
                      onChange={(e) =>
                        handleNumericChange(e.target.value, setGasEstimate)
                      }
                      disabled={!canEdit}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="waterEstimate" className="text-sm">
                      Agua (€/mes)
                    </Label>
                    <Input
                      id="waterEstimate"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={waterEstimate ?? ""}
                      onChange={(e) =>
                        handleNumericChange(e.target.value, setWaterEstimate)
                      }
                      disabled={!canEdit}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="centralHeatingFee" className="text-sm">
                      Calefacción Central (€/mes)
                    </Label>
                    <Input
                      id="centralHeatingFee"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={centralHeatingFee ?? ""}
                      onChange={(e) =>
                        handleNumericChange(e.target.value, setCentralHeatingFee)
                      }
                      disabled={!canEdit}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="internetEstimate" className="text-sm">
                      Internet (€/mes)
                    </Label>
                    <Input
                      id="internetEstimate"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={internetEstimate ?? ""}
                      onChange={(e) =>
                        handleNumericChange(e.target.value, setInternetEstimate)
                      }
                      disabled={!canEdit}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Insurance Section - Hide for solar */}
            {propertyType !== "solar" && (
              <div className="space-y-2 border-t pt-4">
                <h4 className="text-xs font-medium text-muted-foreground">
                  Seguros
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="homeInsurance" className="text-sm">
                      Seguro del Hogar (€/año)
                    </Label>
                    <Input
                      id="homeInsurance"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={homeInsurance ?? ""}
                      onChange={(e) =>
                        handleNumericChange(e.target.value, setHomeInsurance)
                      }
                      disabled={!canEdit}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
