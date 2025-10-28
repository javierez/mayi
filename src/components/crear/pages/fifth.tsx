import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { CompassRose } from "../rosa";
import { useFormContext } from "../form-context";

interface FifthPageProps {
  listingId: string;
  onNext: () => void;
  onBack?: () => void;
}

// Form data interface for fifth page (matching database schema)
interface FifthPageFormData {
  exterior: boolean;
  bright: boolean;
  orientation: string;
}

export default function FifthPage({ onNext, onBack }: FifthPageProps) {
  const { state, updateFormData } = useFormContext();

  // Get current form data from context (like first.tsx pattern)
  const formData = {
    exterior: state.formData.exterior ?? false,
    bright: state.formData.bright ?? false,
    orientation: state.formData.orientation ?? "",
  };

  // Update form data helper (like first.tsx pattern)
  const updateField = (
    field: keyof FifthPageFormData,
    value: boolean | string,
  ) => {
    updateFormData({ [field]: value });
  };

  // Handle property type-specific logic
  useEffect(() => {
    const propertyType = state.formData.propertyType;
    // For solar and garage properties, skip this page entirely
    if (propertyType === "solar" || propertyType === "garaje") {
      onNext();
      return;
    }
  }, [state.formData.propertyType, onNext]);

  const handleNext = () => {
    // Navigate immediately - no saves, completely instant! (like first.tsx)
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-4"
    >
      <motion.div
        className="space-y-1"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-gray-900">
          Orientación y exposición
        </h2>
      </motion.div>

      <motion.div
        className="space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {/* Exterior */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => updateField("exterior", !formData.exterior)}
          className={`relative w-full overflow-hidden rounded-lg p-3 transition-all duration-200 ${
            formData.exterior
              ? "border border-gray-900 bg-gray-900 text-white shadow-sm"
              : "bg-white text-gray-700 shadow-md"
          } `}
        >
          <motion.div
            className="absolute inset-0 bg-gray-800"
            initial={{ scale: 0, opacity: 0 }}
            animate={
              formData.exterior
                ? { scale: 1, opacity: 1 }
                : { scale: 0, opacity: 0 }
            }
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ borderRadius: "inherit" }}
          />
          <div className="relative z-10 flex items-center space-x-3">
            <span className="text-sm font-medium">Exterior</span>
          </div>
          {formData.exterior && (
            <span className="absolute right-2 top-3.5 z-20 flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 bg-white/90">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M3 6.5L5.2 8.5L9 4.5"
                  stroke="#222"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          )}
        </motion.button>

        {/* Bright */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => updateField("bright", !formData.bright)}
          className={`relative w-full overflow-hidden rounded-lg p-3 transition-all duration-200 ${
            formData.bright
              ? "border border-gray-900 bg-gray-900 text-white shadow-sm"
              : "bg-white text-gray-700 shadow-md"
          } `}
        >
          <motion.div
            className="absolute inset-0 bg-gray-800"
            initial={{ scale: 0, opacity: 0 }}
            animate={
              formData.bright
                ? { scale: 1, opacity: 1 }
                : { scale: 0, opacity: 0 }
            }
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ borderRadius: "inherit" }}
          />
          <div className="relative z-10 flex items-center space-x-3">
            <span className="text-sm font-medium">Luminoso</span>
          </div>
          {formData.bright && (
            <span className="absolute right-2 top-3.5 z-20 flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 bg-white/90">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M3 6.5L5.2 8.5L9 4.5"
                  stroke="#222"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          )}
        </motion.button>

        {/* Orientation */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700">
            Orientación
          </Label>
          <CompassRose
            value={formData.orientation}
            onChange={(value) => updateField("orientation", value)}
          />
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
