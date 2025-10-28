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
import { ChevronLeft, ChevronRight, Square, Wind } from "lucide-react";
import { motion } from "framer-motion";
import { useFormContext } from "../form-context";

interface NinethPageProps {
  listingId: string;
  onNext: () => void;
  onBack?: () => void;
}

interface NinethPageFormData {
  mainFloorType: string;
  shutterType: string;
  carpentryType: string;
  windowType: string;
}

export default function NinethPage({ onNext, onBack }: NinethPageProps) {
  const { state, updateFormData } = useFormContext();

  // Get current form data from context
  const formData = {
    mainFloorType: state.formData.mainFloorType ?? "",
    shutterType: state.formData.shutterType ?? "",
    carpentryType: state.formData.carpentryType ?? "",
    windowType: state.formData.windowType ?? "",
  };

  // Update form data helper
  const updateField = (field: keyof NinethPageFormData, value: string) => {
    updateFormData({ [field]: value });
  };

  // Handle property type-specific logic
  useEffect(() => {
    // For solar and garage properties, skip this page entirely
    if (
      state.formData.propertyType === "solar" ||
      state.formData.propertyType === "garaje"
    ) {
      onNext();
      return;
    }
  }, [state.formData.propertyType, onNext]);

  const handleNext = () => {
    // Validate required fields (if any are required in the future)
    // Currently all fields are optional for materials and finishes

    // Navigate IMMEDIATELY - no saves, completely instant!
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
          Materiales y Acabados
        </h2>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {/* Windows and Doors */}
        <div className="space-y-4 rounded-lg p-4 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-600">
              Ventanas y puertas
            </h4>
            <Wind className="h-4 w-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="windowType" className="text-sm">
                Tipo de ventana
              </Label>
              <Select
                value={formData.windowType}
                onValueChange={(value) => updateField("windowType", value)}
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
                value={formData.carpentryType}
                onValueChange={(value) => updateField("carpentryType", value)}
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
                value={formData.shutterType}
                onValueChange={(value) => updateField("shutterType", value)}
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

        {/* Flooring */}
        <div className="space-y-4 rounded-lg p-4 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-600">Suelos</h4>
            <Square className="h-4 w-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="mainFloorType" className="text-sm">
                Tipo de suelo
              </Label>
              <Select
                value={formData.mainFloorType}
                onValueChange={(value) => updateField("mainFloorType", value)}
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
                  <SelectItem value="microcemento">Microcemento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
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
