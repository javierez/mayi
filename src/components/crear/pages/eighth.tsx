import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import {
  ChevronLeft,
  ChevronRight,
  Layout,
  Wine,
  Ruler,
  BedDouble,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formFormatters } from "~/lib/utils";
import { useFormContext } from "../form-context";

interface EighthPageProps {
  listingId?: string;
  onNext: () => void;
  onBack?: () => void;
}

export default function EighthPage({ onNext, onBack }: EighthPageProps) {
  const { state, updateFormData } = useFormContext();

  // Get current form data from context (following first.tsx pattern)
  const formData = {
    hasTerrace: state.formData.hasTerrace ?? false,
    terraceSize: state.formData.terraceSize ?? 0,
    balconyCount: state.formData.balconyCount ?? 0,
    galleryCount: state.formData.galleryCount ?? 0,
    wineCellar: state.formData.wineCellar ?? false,
    wineCellarSize: state.formData.wineCellarSize ?? 0,
    livingRoomSize: state.formData.livingRoomSize ?? 0,
    builtInWardrobes: state.formData.builtInWardrobes ?? false,
  };

  // Update form data helper (following first.tsx pattern)
  const updateField = (field: string, value: unknown) => {
    updateFormData({ [field]: value });
  };

  // Handle property type-specific logic
  useEffect(() => {
    // For garage properties, skip this page entirely
    if (state.formData.propertyType === "garaje") {
      onNext();
      return;
    }
  }, [state.formData.propertyType, onNext]);

  const handleNext = () => {
    // Add validation like first.tsx
    // Note: All fields are optional for this page, so no required field validation needed

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
          Zonas y Espacios Complementarios
        </h2>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {/* Outdoor Spaces */}
        <div className="space-y-4 rounded-lg p-4 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-600">
              Espacios exteriores
            </h4>
            <Layout className="h-4 w-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terrace"
                checked={formData.hasTerrace}
                onCheckedChange={(checked) =>
                  updateField("hasTerrace", !!checked)
                }
              />
              <Label htmlFor="terrace" className="text-sm">
                Terraza
              </Label>
            </div>
            {formData.hasTerrace && (
              <div className="ml-6 space-y-1.5">
                <Label htmlFor="terraceSize" className="text-sm">
                  Tamaño terraza (m²)
                </Label>
                <input
                  id="terraceSize"
                  type="number"
                  value={formFormatters.formatNumberDisplay(
                    formData.terraceSize,
                  )}
                  onChange={formFormatters.handleNumberInput((value) =>
                    updateField("terraceSize", value),
                  )}
                  className="h-8 w-full rounded border border-0 border-gray-300 px-2 text-gray-700 shadow-md"
                  min="0"
                  step="1"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="balconyCount" className="text-sm">
                Nº balcones
              </Label>
              <input
                id="balconyCount"
                type="number"
                value={formFormatters.formatNumberDisplay(
                  formData.balconyCount,
                )}
                onChange={formFormatters.handleNumberInput((value) =>
                  updateField("balconyCount", value),
                )}
                className="h-8 w-full rounded border border-0 border-gray-300 px-2 text-gray-700 shadow-md"
                min="0"
                step="1"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="galleryCount" className="text-sm">
                Nº galerías
              </Label>
              <input
                id="galleryCount"
                type="number"
                value={formFormatters.formatNumberDisplay(
                  formData.galleryCount,
                )}
                onChange={formFormatters.handleNumberInput((value) =>
                  updateField("galleryCount", value),
                )}
                className="h-8 w-full rounded border border-0 border-gray-300 px-2 text-gray-700 shadow-md"
                min="0"
                step="1"
              />
            </div>
          </div>
        </div>

        {/* Storage Spaces */}
        <div className="space-y-4 rounded-lg p-4 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-600">
              Almacenamiento
            </h4>
            <Wine className="h-4 w-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="wineCellar"
                checked={formData.wineCellar}
                onCheckedChange={(checked) =>
                  updateField("wineCellar", !!checked)
                }
              />
              <Label htmlFor="wineCellar" className="text-sm">
                Bodega
              </Label>
            </div>
            {formData.wineCellar && (
              <div className="ml-6 space-y-1.5">
                <Label htmlFor="wineCellarSize" className="text-sm">
                  Tamaño bodega (m²)
                </Label>
                <input
                  id="wineCellarSize"
                  type="number"
                  value={formFormatters.formatNumberDisplay(
                    formData.wineCellarSize,
                  )}
                  onChange={formFormatters.handleNumberInput((value) =>
                    updateField("wineCellarSize", value),
                  )}
                  className="h-8 w-full rounded border border-0 border-gray-300 px-2 text-gray-700 shadow-md"
                  min="0"
                  step="1"
                />
              </div>
            )}
          </div>
        </div>

        {/* Room Sizes */}
        <div className="space-y-4 rounded-lg p-4 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-600">Dimensiones</h4>
            <Ruler className="h-4 w-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="livingRoomSize" className="text-sm">
                Tamaño salón (m²)
              </Label>
              <input
                id="livingRoomSize"
                type="number"
                value={formFormatters.formatNumberDisplay(
                  formData.livingRoomSize,
                )}
                onChange={formFormatters.handleNumberInput((value) =>
                  updateField("livingRoomSize", value),
                )}
                className="h-8 w-full rounded border border-0 border-gray-300 px-2 text-gray-700 shadow-md"
                min="0"
                step="1"
              />
            </div>
          </div>
        </div>

        {/* Built-in Features */}
        <div className="space-y-4 rounded-lg p-4 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-600">Empotrados</h4>
            <BedDouble className="h-4 w-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="builtInWardrobes"
                checked={formData.builtInWardrobes}
                onCheckedChange={(checked) =>
                  updateField("builtInWardrobes", !!checked)
                }
              />
              <Label htmlFor="builtInWardrobes" className="text-sm">
                Armarios empotrados
              </Label>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {/* Removed saveError state and its usage */}
      </AnimatePresence>

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
