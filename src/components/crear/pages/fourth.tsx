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
import {
  ChevronLeft,
  ChevronRight,
  Building,
  Car,
  Package,
  Thermometer,
  Wind,
  Sofa,
} from "lucide-react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useFormContext } from "../form-context";

interface FourthPageProps {
  listingId: string;
  onNext: () => void;
  onBack?: () => void;
  onBackToSecond?: () => void;
}

const heatingOptions = [
  { id: 1, label: "Gas natural" },
  { id: 2, label: "Eléctrico" },
  { id: 3, label: "Gasóleo" },
  { id: 4, label: "Butano" },
  { id: 5, label: "Propano" },
  { id: 6, label: "Solar" },
];

const airConditioningOptions = [
  { value: "central", label: "Central" },
  { value: "split", label: "Split" },
  { value: "portatil", label: "Portátil" },
  { value: "conductos", label: "Conductos" },
  { value: "cassette", label: "Cassette" },
  { value: "ventana", label: "Ventana" },
];

const furnitureQualityOptions = [
  { value: "basic", label: "Básico", color: "bg-gray-500" },
  { value: "standard", label: "Estándar", color: "bg-gray-600" },
  { value: "high", label: "Alta", color: "bg-gray-700" },
  { value: "luxury", label: "Lujo", color: "bg-gray-900" },
];

export default function FourthPage({
  onNext,
  onBack,
  onBackToSecond,
}: FourthPageProps) {
  const { state, updateFormData } = useFormContext();
  const searchParams = useSearchParams();
  const method = searchParams?.get("method");

  const propertyType = state.formData.propertyType ?? "";

  // Get current form data from context - matches CompleteFormData interface
  const formData = {
    hasElevator: state.formData.hasElevator ?? false,
    hasGarage: state.formData.hasGarage ?? false,
    hasStorageRoom: state.formData.hasStorageRoom ?? false,
    heating: state.formData.heating ?? "",
    airConditioning: Array.isArray(state.formData.airConditioning)
      ? state.formData.airConditioning
      : [],
    isFurnished: state.formData.isFurnished ?? false,
    furnitureQuality: state.formData.furnitureQuality ?? "",
  };

  // Update form data helper
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
    // All fields are optional on this page, so no validation needed
    // Navigate immediately - no saves, completely instant!
    onNext();
  };

  const handleBack = () => {
    // If method is manual, third page was skipped, so go directly to second page
    if (method === "manual" && onBackToSecond) {
      onBackToSecond();
    } else if (onBack) {
      onBack();
    }
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
          Servicios y equipamiento
        </h2>
      </motion.div>

      <motion.div
        className="space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {/* Elevator - Hide for garage properties */}
        {propertyType !== "garaje" && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => updateField("hasElevator", !formData.hasElevator)}
            className={`relative w-full overflow-hidden rounded-lg p-3 transition-all duration-200 ${
              formData.hasElevator
                ? "border border-gray-900 bg-gray-900 text-white shadow-sm"
                : "bg-white text-gray-700 shadow-md"
            } `}
          >
            <motion.div
              className="absolute inset-0 bg-gray-800"
              initial={{ scale: 0, opacity: 0 }}
              animate={
                formData.hasElevator
                  ? { scale: 1, opacity: 1 }
                  : { scale: 0, opacity: 0 }
              }
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{ borderRadius: "inherit" }}
            />
            <div className="relative z-10 flex items-center space-x-3">
              <Building className="h-4 w-4" />
              <span className="text-sm font-medium">Ascensor</span>
            </div>
            {formData.hasElevator && (
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
        )}

        {/* Garage */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {propertyType === "garaje" ? (
            // For garage properties, show static header
            <div className="w-full rounded-lg border border-gray-900 bg-gray-900 p-3 text-white shadow-sm">
              <div className="flex items-center space-x-3">
                <Car className="h-4 w-4" />
                <span className="text-sm font-medium">Garaje</span>
              </div>
            </div>
          ) : (
            // For other properties, show toggle button
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => updateField("hasGarage", !formData.hasGarage)}
              className={`relative w-full overflow-hidden rounded-lg p-3 transition-all duration-200 ${
                formData.hasGarage
                  ? "border border-gray-900 bg-gray-900 text-white shadow-sm"
                  : "bg-white text-gray-700 shadow-md"
              } `}
            >
              <motion.div
                className="absolute inset-0 bg-gray-800"
                initial={{ scale: 0, opacity: 0 }}
                animate={
                  formData.hasGarage
                    ? { scale: 1, opacity: 1 }
                    : { scale: 0, opacity: 0 }
                }
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ borderRadius: "inherit" }}
              />
              <div className="relative z-10 flex items-center space-x-3">
                <Car className="h-4 w-4" />
                <span className="text-sm font-medium">Garaje</span>
              </div>
              {formData.hasGarage && (
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
          )}
        </motion.div>

        {/* Storage Room - Hide for garage properties */}
        {propertyType !== "garaje" && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              updateField("hasStorageRoom", !formData.hasStorageRoom)
            }
            className={`relative w-full overflow-hidden rounded-lg p-3 transition-all duration-200 ${
              formData.hasStorageRoom
                ? "border border-gray-900 bg-gray-900 text-white shadow-sm"
                : "bg-white text-gray-700 shadow-md"
            } `}
          >
            <motion.div
              className="absolute inset-0 bg-gray-800"
              initial={{ scale: 0, opacity: 0 }}
              animate={
                formData.hasStorageRoom
                  ? { scale: 1, opacity: 1 }
                  : { scale: 0, opacity: 0 }
              }
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{ borderRadius: "inherit" }}
            />
            <div className="relative z-10 flex items-center space-x-3">
              <Package className="h-4 w-4" />
              <span className="text-sm font-medium">Trastero</span>
            </div>
            {formData.hasStorageRoom && (
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
        )}

        {/* Heating - Hide for garage properties */}
        {propertyType !== "garaje" && (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const newValue = !formData.heating;
                updateField("heating", newValue ? "Gas natural" : "");
              }}
              className={`relative w-full overflow-hidden rounded-lg p-3 transition-all duration-200 ${
                formData.heating
                  ? "border border-gray-900 bg-gray-900 text-white shadow-sm"
                  : "bg-white text-gray-700 shadow-md"
              } `}
            >
              <motion.div
                className="absolute inset-0 bg-gray-800"
                initial={{ scale: 0, opacity: 0 }}
                animate={
                  formData.heating
                    ? { scale: 1, opacity: 1 }
                    : { scale: 0, opacity: 0 }
                }
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ borderRadius: "inherit" }}
              />
              <div className="relative z-10 flex items-center space-x-3">
                <Thermometer className="h-4 w-4" />
                <span className="text-sm font-medium">Calefacción</span>
              </div>
              {formData.heating && (
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

            {formData.heating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="ml-6 space-y-3 border-l-2 pl-4"
              >
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600">
                    Tipo de calefacción
                  </Label>
                  <Select
                    value={formData.heating}
                    onValueChange={(value) => updateField("heating", value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Seleccionar tipo de calefacción" />
                    </SelectTrigger>
                    <SelectContent>
                      {heatingOptions.map((option) => (
                        <SelectItem key={option.id} value={option.label}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Air Conditioning - Hide for garage properties */}
        {propertyType !== "garaje" && (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const hasAC = formData.airConditioning.length > 0;
                updateField("airConditioning", hasAC ? [] : ["central"]);
              }}
              className={`relative w-full overflow-hidden rounded-lg p-3 transition-all duration-200 ${
                formData.airConditioning.length > 0
                  ? "border border-gray-900 bg-gray-900 text-white shadow-sm"
                  : "bg-white text-gray-700 shadow-md"
              } `}
            >
              <motion.div
                className="absolute inset-0 bg-gray-800"
                initial={{ scale: 0, opacity: 0 }}
                animate={
                  formData.airConditioning.length > 0
                    ? { scale: 1, opacity: 1 }
                    : { scale: 0, opacity: 0 }
                }
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ borderRadius: "inherit" }}
              />
              <div className="relative z-10 flex items-center space-x-3">
                <Wind className="h-4 w-4" />
                <span className="text-sm font-medium">Aire acondicionado</span>
              </div>
              {formData.airConditioning.length > 0 && (
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

            {formData.airConditioning.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="ml-6 space-y-3 border-l-2 pl-4"
              >
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600">
                    Tipo
                  </Label>
                  <Select
                    value={formData.airConditioning[0] ?? ""}
                    onValueChange={(value) =>
                      updateField("airConditioning", [value])
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {airConditioningOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Furnished - Hide for garage properties */}
        {propertyType !== "garaje" && (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const newValue = !formData.isFurnished;
                updateField("isFurnished", newValue);
                if (!newValue) {
                  updateField("furnitureQuality", "");
                }
              }}
              className={`relative w-full overflow-hidden rounded-lg p-3 transition-all duration-200 ${
                formData.isFurnished
                  ? "border border-gray-900 bg-gray-900 text-white shadow-sm"
                  : "bg-white text-gray-700 shadow-md"
              } `}
            >
              <motion.div
                className="absolute inset-0 bg-gray-800"
                initial={{ scale: 0, opacity: 0 }}
                animate={
                  formData.isFurnished
                    ? { scale: 1, opacity: 1 }
                    : { scale: 0, opacity: 0 }
                }
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ borderRadius: "inherit" }}
              />
              <div className="relative z-10 flex items-center space-x-3">
                <Sofa className="h-4 w-4" />
                <span className="text-sm font-medium">Amueblado</span>
              </div>
              {formData.isFurnished && (
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

            {formData.isFurnished && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="ml-6 space-y-3 border-l-2 pl-4"
              >
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600">
                    Calidad
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {furnitureQualityOptions.map((option) => (
                      <motion.button
                        key={option.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          updateField("furnitureQuality", option.value)
                        }
                        className={`relative w-full overflow-hidden rounded-md p-2 text-xs transition-all duration-200 ${
                          formData.furnitureQuality === option.value
                            ? "border border-gray-900 bg-gray-900 text-white shadow-sm"
                            : "bg-white text-gray-700 shadow-md"
                        } `}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gray-800"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={
                            formData.furnitureQuality === option.value
                              ? { scale: 1, opacity: 1 }
                              : { scale: 0, opacity: 0 }
                          }
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          style={{ borderRadius: "inherit" }}
                        />
                        <span className="relative z-10">{option.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
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
            onClick={handleBack}
            disabled={!onBack && !onBackToSecond}
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
