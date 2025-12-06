import React from "react";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
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

interface RentalTermsCardProps {
  // Deposit & Guarantees
  securityDeposit: number | null;
  additionalGuarantee: number | null;
  bankGuaranteeRequired: boolean;
  // Management & Insurance
  managementFees: number | null;
  nonPaymentInsurance: boolean;
  nonPaymentInsuranceAmount: number | null;
  // Card state
  listingType: string;
  collapsedSections: Record<string, boolean>;
  saveState: SaveState;
  canEdit?: boolean;
  // Callbacks
  onToggleSection: (section: string) => void;
  onSave: () => Promise<void>;
  onUpdateModule: (hasChanges: boolean) => void;
  // Setters
  setSecurityDeposit: (value: number | null) => void;
  setAdditionalGuarantee: (value: number | null) => void;
  setBankGuaranteeRequired: (value: boolean) => void;
  setManagementFees: (value: number | null) => void;
  setNonPaymentInsurance: (value: boolean) => void;
  setNonPaymentInsuranceAmount: (value: number | null) => void;
  getCardStyles: (moduleName: ModuleName) => string;
}

export function RentalTermsCard({
  securityDeposit,
  additionalGuarantee,
  bankGuaranteeRequired,
  managementFees,
  nonPaymentInsurance,
  nonPaymentInsuranceAmount,
  listingType,
  collapsedSections,
  saveState,
  canEdit = true,
  onToggleSection,
  onSave,
  onUpdateModule,
  setSecurityDeposit,
  setAdditionalGuarantee,
  setBankGuaranteeRequired,
  setManagementFees,
  setNonPaymentInsurance,
  setNonPaymentInsuranceAmount,
  getCardStyles,
}: RentalTermsCardProps) {
  const isCollapsed = collapsedSections.rentalTerms;

  // Only show for rental listings
  const isRentalListing =
    listingType === "Rent" ||
    listingType === "RentWithOption" ||
    listingType === "RoomSharing";

  // Helper to handle numeric input changes
  const handleNumericChange = (
    value: string,
    setter: (value: number | null) => void,
  ) => {
    const numValue = value === "" ? null : parseFloat(value);
    setter(numValue);
    onUpdateModule(true);
  };

  // Don't render if not a rental listing
  if (!isRentalListing) {
    return null;
  }

  return (
    <Card
      className={cn(
        "relative p-4 transition-all duration-500 ease-out",
        getCardStyles("rentalTerms"),
      )}
    >
      <ModernSaveIndicator state={saveState} onSave={onSave} />
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onToggleSection("rentalTerms")}
          className="group flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              CONDICIONES DE ALQUILER
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
          <div className="space-y-4">
            {/* Fianza y Garantías Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">
                Fianza y garantías
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="securityDeposit" className="text-sm">
                    Fianza (€)
                  </Label>
                  <Input
                    id="securityDeposit"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={securityDeposit ?? ""}
                    onChange={(e) =>
                      handleNumericChange(e.target.value, setSecurityDeposit)
                    }
                    disabled={!canEdit}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="additionalGuarantee" className="text-sm">
                    Garantía adicional (€)
                  </Label>
                  <Input
                    id="additionalGuarantee"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={additionalGuarantee ?? ""}
                    onChange={(e) =>
                      handleNumericChange(e.target.value, setAdditionalGuarantee)
                    }
                    disabled={!canEdit}
                    className="h-8"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  id="bankGuaranteeRequired"
                  checked={bankGuaranteeRequired}
                  onCheckedChange={(checked) => {
                    setBankGuaranteeRequired(checked);
                    onUpdateModule(true);
                  }}
                  disabled={!canEdit}
                />
                <Label
                  htmlFor="bankGuaranteeRequired"
                  className="cursor-pointer text-sm"
                >
                  Aval bancario requerido
                </Label>
              </div>
            </div>

            {/* Gestión y Seguros Section */}
            <div className="space-y-2 border-t pt-4">
              <h4 className="text-xs font-medium text-muted-foreground">
                Gestión y seguros
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="managementFees" className="text-sm">
                    Honorarios de gestión (€/mes)
                  </Label>
                  <Input
                    id="managementFees"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={managementFees ?? ""}
                    onChange={(e) =>
                      handleNumericChange(e.target.value, setManagementFees)
                    }
                    disabled={!canEdit}
                    className="h-8"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  id="nonPaymentInsurance"
                  checked={nonPaymentInsurance}
                  onCheckedChange={(checked) => {
                    setNonPaymentInsurance(checked);
                    onUpdateModule(true);
                  }}
                  disabled={!canEdit}
                />
                <Label
                  htmlFor="nonPaymentInsurance"
                  className="cursor-pointer text-sm"
                >
                  Seguro de impago
                </Label>
              </div>
              {nonPaymentInsurance && (
                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="nonPaymentInsuranceAmount" className="text-sm">
                      Coste del seguro (€/año)
                    </Label>
                    <Input
                      id="nonPaymentInsuranceAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={nonPaymentInsuranceAmount ?? ""}
                      onChange={(e) =>
                        handleNumericChange(e.target.value, setNonPaymentInsuranceAmount)
                      }
                      disabled={!canEdit}
                      className="h-8"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
