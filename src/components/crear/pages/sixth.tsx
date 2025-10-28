import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Building2,
  CookingPot,
} from "lucide-react";
import { motion } from "framer-motion";
import { useFormContext } from "../form-context";

interface SixthPageProps {
  listingId: string;
  onNext: () => void;
  onBack?: () => void;
}

const kitchenTypeOptions = [
  { value: "gas", label: "Gas" },
  { value: "induccion", label: "Inducción" },
  { value: "vitroceramica", label: "Vitrocerámica" },
  { value: "carbon", label: "Carbón" },
  { value: "electrico", label: "Eléctrico" },
  { value: "mixto", label: "Mixto" },
];

export default function SixthPage({ onNext, onBack }: SixthPageProps) {
  const { state, updateFormData } = useFormContext();

  const propertyType = state.formData.propertyType ?? "";

  // Get current form data from context (following first.tsx pattern)
  const formData = {
    securitySystem: state.formData.securitySystem ?? false,
    accessibility: state.formData.accessibility ?? false,
    doorman: state.formData.doorman ?? false,
    designerKitchen: state.formData.designerKitchen ?? false,
    kitchenMaterial: state.formData.kitchenMaterial ?? "",
    // Additional fields now properly typed in CompleteFormData
    videoIntercom: state.formData.videoIntercom ?? false,
    securityGuard: state.formData.securityGuard ?? false,
    vpo: state.formData.vpo ?? false,
    satelliteDish: state.formData.satelliteDish ?? false,
    doubleGlazing: state.formData.doubleGlazing ?? false,
    openKitchen: state.formData.openKitchen ?? false,
    frenchKitchen: state.formData.frenchKitchen ?? false,
    pantry: state.formData.pantry ?? false,
  };

  // Update form data helper (following first.tsx pattern)
  const updateField = (field: string, value: unknown) => {
    updateFormData({ [field]: value });
  };

  // Handle property type-specific logic
  useEffect(() => {
    // For solar properties, skip this page entirely
    if (propertyType === "solar") {
      onNext();
      return;
    }
  }, [propertyType, onNext]);

  const handleNext = () => {
    // Navigate immediately - no saves, completely instant!
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      <motion.div
        className="space-y-1"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-gray-900">
          Características adicionales
        </h2>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {/* Security Features */}
        <div className="space-y-4 rounded-lg p-4 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-600">Seguridad</h4>
            <Shield className="h-4 w-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="securitySystem"
                checked={formData.securitySystem}
                onCheckedChange={(checked) =>
                  updateField("securitySystem", !!checked)
                }
              />
              <Label htmlFor="securitySystem" className="text-sm">
                Puerta blindada
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="videoIntercom"
                checked={formData.videoIntercom}
                onCheckedChange={(checked) =>
                  updateField("videoIntercom", !!checked)
                }
              />
              <Label htmlFor="videoIntercom" className="text-sm">
                Videoportero
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="securityGuard"
                checked={formData.securityGuard}
                onCheckedChange={(checked) =>
                  updateField("securityGuard", !!checked)
                }
              />
              <Label htmlFor="securityGuard" className="text-sm">
                Vigilante
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="doorman"
                checked={formData.doorman}
                onCheckedChange={(checked) => updateField("doorman", !!checked)}
              />
              <Label htmlFor="doorman" className="text-sm">
                Conserjería
              </Label>
            </div>
          </div>
        </div>

        {/* Building Features */}
        <div className="space-y-4 rounded-lg p-4 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-600">
              Características del edificio
            </h4>
            <Building2 className="h-4 w-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="vpo"
                checked={formData.vpo}
                onCheckedChange={(checked) => updateField("vpo", !!checked)}
              />
              <Label htmlFor="vpo" className="text-sm">
                VPO
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="accessibility"
                checked={formData.accessibility}
                onCheckedChange={(checked) =>
                  updateField("accessibility", !!checked)
                }
              />
              <Label htmlFor="accessibility" className="text-sm">
                Accesible
              </Label>
            </div>
            {propertyType !== "garaje" && (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="satelliteDish"
                    checked={formData.satelliteDish}
                    onCheckedChange={(checked) =>
                      updateField("satelliteDish", !!checked)
                    }
                  />
                  <Label htmlFor="satelliteDish" className="text-sm">
                    Antena
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="doubleGlazing"
                    checked={formData.doubleGlazing}
                    onCheckedChange={(checked) =>
                      updateField("doubleGlazing", !!checked)
                    }
                  />
                  <Label htmlFor="doubleGlazing" className="text-sm">
                    Doble acristalamiento
                  </Label>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Kitchen Features - Hide for garage properties */}
        {propertyType !== "garaje" && (
          <div className="space-y-4 rounded-lg p-4 shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-medium text-gray-600">Cocina</h4>
              <CookingPot className="h-4 w-4 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="kitchenType" className="text-sm">
                  Tipo de cocina
                </Label>
                <Select
                  value={formData.kitchenMaterial}
                  onValueChange={(value) =>
                    updateField("kitchenMaterial", value)
                  }
                >
                  <SelectTrigger className="h-8 text-gray-500">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {kitchenTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="openKitchen"
                  checked={formData.openKitchen}
                  onCheckedChange={(checked) =>
                    updateField("openKitchen", !!checked)
                  }
                />
                <Label htmlFor="openKitchen" className="text-sm">
                  Cocina abierta
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="frenchKitchen"
                  checked={formData.frenchKitchen}
                  onCheckedChange={(checked) =>
                    updateField("frenchKitchen", !!checked)
                  }
                />
                <Label htmlFor="frenchKitchen" className="text-sm">
                  Cocina francesa
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="designerKitchen"
                  checked={formData.designerKitchen}
                  onCheckedChange={(checked) =>
                    updateField("designerKitchen", !!checked)
                  }
                />
                <Label htmlFor="designerKitchen" className="text-sm">
                  Cocina amueblada
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pantry"
                  checked={formData.pantry}
                  onCheckedChange={(checked) =>
                    updateField("pantry", !!checked)
                  }
                />
                <Label htmlFor="pantry" className="text-sm">
                  Despensa
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Utilities - Hide for garage properties */}
      </motion.div>

      <motion.div
        className="flex justify-between border-t pt-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={!onBack}
            className="flex items-center space-x-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Anterior</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleNext}
            className="flex items-center space-x-1 bg-gray-900 hover:bg-gray-800"
          >
            <span>Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
