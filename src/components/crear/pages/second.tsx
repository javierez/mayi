import React, { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { ChevronLeft, ChevronRight, DoorOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useFormContext } from "../form-context";
import { formFormatters } from "~/lib/utils";
// import FormSkeleton from "./form-skeleton"; // Removed - using single loading state
import { RoomSelector } from "./elements/room_selector";
import { YearSlider } from "./elements/year_slider";
import { FloatingLabelInput } from "~/components/ui/floating-label-input";
import { cn } from "~/lib/utils";
import { CONSERVATION_STATUS_LABELS } from "~/lib/constants/conservation-status";

interface SecondPageProps {
  listingId?: string;
  onNext: () => void;
  onBack?: () => void;
}

// Removed SecondPageFormData interface - using direct global state reading like first.tsx

export default function SecondPage({ onNext, onBack }: SecondPageProps) {
  const { state, updateFormData } = useFormContext();

  // Get current form data from context (direct reading like first.tsx)
  const formData = {
    bedrooms: state.formData.bedrooms ?? 2,
    bathrooms: state.formData.bathrooms ?? 1,
    totalSurface: state.formData.totalSurface ?? 0,
    usefulSurface: state.formData.usefulSurface ?? 0,
    buildYear: state.formData.buildYear ?? (state.formData.buildYearUnknown ? null : 1980),
    buildYearUnknown: state.formData.buildYearUnknown ?? false,
    renovationYear: state.formData.renovationYear ?? (state.formData.renovationYearUnknown ? null : 0),
    renovationYearUnknown: state.formData.renovationYearUnknown ?? false,
    totalFloors: state.formData.totalFloors ?? 0,
    conservationStatus: state.formData.conservationStatus ?? 3,
    isDiafano: state.formData.isDiafano ?? false,
    hasEscaparate: state.formData.hasEscaparate ?? false,
  };

  const propertyType = state.formData?.propertyType ?? "";

  // Initialize default values in form context on mount (only if not already set)
  useEffect(() => {
    const defaults: Record<string, number | boolean> = {};

    // Only set defaults for non-solar and non-garaje properties
    if (propertyType !== "solar" && propertyType !== "garaje") {
      if (
        state.formData.bedrooms === undefined ||
        state.formData.bedrooms === null
      ) {
        defaults.bedrooms = 2;
      }
      if (
        state.formData.bathrooms === undefined ||
        state.formData.bathrooms === null
      ) {
        defaults.bathrooms = 1;
      }
    }

    // Set conservation status default for all property types if not set
    if (
      state.formData.conservationStatus === undefined ||
      state.formData.conservationStatus === null
    ) {
      defaults.conservationStatus = 3;
    }

    // Set build year default for non-solar properties if not set
    if (propertyType !== "solar") {
      // Only set default build year if buildYearUnknown is not checked
      if (
        !state.formData.buildYearUnknown &&
        (state.formData.buildYear === undefined ||
          state.formData.buildYear === null ||
          state.formData.buildYear === 0)
      ) {
        defaults.buildYear = 1980;
      }
      // Set buildYearUnknown default if not set
      if (
        state.formData.buildYearUnknown === undefined ||
        state.formData.buildYearUnknown === null
      ) {
        defaults.buildYearUnknown = false;
      }
    }

    // Only update if we have defaults to set
    if (Object.keys(defaults).length > 0) {
      updateFormData(defaults);
    }
  }, [
    propertyType,
    state.formData.bedrooms,
    state.formData.bathrooms,
    state.formData.conservationStatus,
    state.formData.buildYear,
    state.formData.buildYearUnknown,
    updateFormData,
  ]);

  // Update form data helper (direct like first.tsx)
  const updateField = (
    field: keyof typeof formData,
    value: string | number | boolean,
  ) => {
    updateFormData({ [field]: value });
  };

  const handleEventInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateField(field, parseInt(e.target.value) || 0);
    };

  // Custom handlers for FloatingLabelInput (string-based onChange)
  const handleTotalSurfaceChange = (value: string) => {
    const numericValue = formFormatters.getNumericArea(value);
    updateField("totalSurface", parseInt(numericValue) || 0);
  };

  const handleUsefulSurfaceChange = (value: string) => {
    const numericValue = formFormatters.getNumericArea(value);
    updateField("usefulSurface", parseInt(numericValue) || 0);
  };

  const handleNext = () => {
    // Validate required fields based on property type
    if (propertyType === "solar") {
      // For solar, surface is optional - no validation needed
    } else if (propertyType === "garaje") {
      // For garage, year built is optional if "don't know" is checked
      if (
        !formData.buildYearUnknown &&
        (formData.buildYear === null ||
          formData.buildYear === undefined ||
          formData.buildYear === 0)
      ) {
        alert("Por favor, introduce el año de construcción o marca 'No lo sé'.");
        return;
      }
    } else {
      // For other property types (piso, casa, local), validate all required fields
      if (!formData.bedrooms || formData.bedrooms === 0) {
        const fieldName =
          propertyType === "local" ? "espacios" : "habitaciones";
        alert(`Por favor, introduce el número de ${fieldName}.`);
        return;
      }

      // Bathrooms required for piso/casa, optional (can be 0) for local
      if (propertyType !== "local" && (!formData.bathrooms || formData.bathrooms === 0)) {
        alert("Por favor, introduce el número de baños.");
        return;
      }

      // Surface fields (totalSurface and usefulSurface) are optional - users can leave them empty

      // Year built is optional if "don't know" is checked
      if (
        !formData.buildYearUnknown &&
        (formData.buildYear === null ||
          formData.buildYear === undefined ||
          formData.buildYear === 0)
      ) {
        alert("Por favor, introduce el año de construcción o marca 'No lo sé'.");
        return;
      }
    }

    // Navigate immediately - no saves, completely instant!
    onNext();
  };

  // Main form already handles loading state with spinner
  // No skeleton needed here

  return (
    <div className="space-y-6">
      {/* Bedrooms and Bathrooms - Only show for piso, casa, local, garage */}
      {propertyType !== "solar" && propertyType !== "garaje" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <RoomSelector
              type="bedrooms"
              value={formData.bedrooms}
              onChange={(val) => updateField("bedrooms", val)}
              label={propertyType === "local" ? "Espacios" : "Habitaciones"}
              customIcon={propertyType === "local" ? DoorOpen : undefined}
            />
          </div>

          <div className="space-y-2">
            <RoomSelector
              type="bathrooms"
              value={formData.bathrooms}
              onChange={(val) => updateField("bathrooms", val)}
              label="Baños"
            />
          </div>
        </div>
      )}

      {/* Diáfano checkbox - Only show for local property type */}
      {propertyType === "local" && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isDiafano"
            checked={formData.isDiafano}
            onCheckedChange={(checked) =>
              updateField("isDiafano", checked as boolean)
            }
          />
          <Label htmlFor="isDiafano" className="text-sm">
            Local Diáfano
          </Label>
        </div>
      )}

      {/* Escaparate checkbox - Only show for local property type */}
      {propertyType === "local" && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasEscaparate"
            checked={formData.hasEscaparate}
            onCheckedChange={(checked) =>
              updateField("hasEscaparate", checked as boolean)
            }
          />
          <Label htmlFor="hasEscaparate" className="text-sm">
            Escaparate
          </Label>
        </div>
      )}

      {/* Superficie construida - Show for all property types */}
      <div className="space-y-2">
        <FloatingLabelInput
          id="totalSurface"
          value={
            formData.totalSurface
              ? formFormatters.formatAreaInput(formData.totalSurface.toString())
              : ""
          }
          onChange={handleTotalSurfaceChange}
          placeholder={
            propertyType === "garaje"
              ? "Medidas en metros cuadrados"
              : "Superficie construida (m²)"
          }
          type="text"
          className="h-10 placeholder:text-gray-400"
        />
      </div>

      {/* Superficie útil - Only show for piso, casa, local */}
      {propertyType !== "solar" && propertyType !== "garaje" && (
        <div className="space-y-2">
          <FloatingLabelInput
            id="usefulSurface"
            value={
              formData.usefulSurface
                ? formFormatters.formatAreaInput(
                    formData.usefulSurface.toString(),
                  )
                : ""
            }
            onChange={handleUsefulSurfaceChange}
            placeholder="Superficie útil (m²)"
            type="text"
            className="h-10 placeholder:text-gray-400"
          />
        </div>
      )}

      {/* Year Built - Show for all property types except solar */}
      {propertyType !== "solar" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              Año de Construcción
            </h3>
            <label className="flex cursor-pointer items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.buildYearUnknown}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  // Clear build year when "don't know" is checked
                  if (isChecked) {
                    updateFormData({ buildYearUnknown: true, buildYear: null });
                  } else {
                    // Set default when unchecked
                    updateFormData({ buildYearUnknown: false, buildYear: 1980 });
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-xs text-gray-600">No lo sé</span>
            </label>
          </div>
          {!formData.buildYearUnknown && (
            <YearSlider
              label=""
              value={formData.buildYear ?? 1980}
              onChange={(val) => updateField("buildYear", val)}
              min={1900}
              max={new Date().getFullYear()}
              placeholder="Año de construcción"
            />
          )}
        </div>
      )}

      {/* Conservation Status - Show for all property types except solar and garaje */}
      {propertyType !== "solar" && propertyType !== "garaje" && (
        <>
          {/* Conservation Status - Show for all property types */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">
              Estado de Conservación
            </h3>
            {/* Desktop: Single row with animation */}
            <div className="relative hidden h-10 rounded-lg bg-gray-100 p-1 sm:block">
              <motion.div
                className="absolute left-1 top-1 h-8 w-[calc(20%-2px)] rounded-md bg-white shadow-sm"
                animate={{
                  x:
                    formData.conservationStatus === 6
                      ? 0
                      : formData.conservationStatus === 3
                        ? "100%"
                        : formData.conservationStatus === 2
                          ? "200%"
                          : formData.conservationStatus === 1
                            ? "300%"
                            : "400%",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <div className="relative flex h-full">
                <button
                  onClick={() => updateField("conservationStatus", 6)}
                  className={cn(
                    "relative z-10 flex-1 rounded-md text-xs font-medium transition-colors duration-200",
                    formData.conservationStatus === 6
                      ? "text-gray-900"
                      : "text-gray-600",
                  )}
                >
                  {CONSERVATION_STATUS_LABELS[6]}
                </button>
                <button
                  onClick={() => updateField("conservationStatus", 3)}
                  className={cn(
                    "relative z-10 flex-1 rounded-md text-xs font-medium transition-colors duration-200",
                    formData.conservationStatus === 3
                      ? "text-gray-900"
                      : "text-gray-600",
                  )}
                >
                  {CONSERVATION_STATUS_LABELS[3]}
                </button>
                <button
                  onClick={() => updateField("conservationStatus", 2)}
                  className={cn(
                    "relative z-10 flex-1 rounded-md text-xs font-medium transition-colors duration-200",
                    formData.conservationStatus === 2
                      ? "text-gray-900"
                      : "text-gray-600",
                  )}
                >
                  {CONSERVATION_STATUS_LABELS[2]}
                </button>
                <button
                  onClick={() => updateField("conservationStatus", 1)}
                  className={cn(
                    "relative z-10 flex-1 rounded-md text-xs font-medium transition-colors duration-200",
                    formData.conservationStatus === 1
                      ? "text-gray-900"
                      : "text-gray-600",
                  )}
                >
                  {CONSERVATION_STATUS_LABELS[1]}
                </button>
                <button
                  onClick={() => updateField("conservationStatus", 4)}
                  className={cn(
                    "relative z-10 flex-1 rounded-md text-xs font-medium transition-colors duration-200",
                    formData.conservationStatus === 4
                      ? "text-gray-900"
                      : "text-gray-600",
                  )}
                >
                  {CONSERVATION_STATUS_LABELS[4]}
                </button>
              </div>
            </div>
            {/* Mobile: Grid layout without animation */}
            <div className="grid grid-cols-2 gap-2 sm:hidden">
              <button
                onClick={() => updateField("conservationStatus", 6)}
                className={cn(
                  "h-10 rounded-lg text-xs font-medium transition-all duration-200",
                  formData.conservationStatus === 6
                    ? "bg-white text-gray-900 shadow-md"
                    : "bg-gray-100 text-gray-600",
                )}
              >
                {CONSERVATION_STATUS_LABELS[6]}
              </button>
              <button
                onClick={() => updateField("conservationStatus", 3)}
                className={cn(
                  "h-10 rounded-lg text-xs font-medium transition-all duration-200",
                  formData.conservationStatus === 3
                    ? "bg-white text-gray-900 shadow-md"
                    : "bg-gray-100 text-gray-600",
                )}
              >
                {CONSERVATION_STATUS_LABELS[3]}
              </button>
              <button
                onClick={() => updateField("conservationStatus", 2)}
                className={cn(
                  "h-10 rounded-lg text-xs font-medium transition-all duration-200",
                  formData.conservationStatus === 2
                    ? "bg-white text-gray-900 shadow-md"
                    : "bg-gray-100 text-gray-600",
                )}
              >
                {CONSERVATION_STATUS_LABELS[2]}
              </button>
              <button
                onClick={() => updateField("conservationStatus", 1)}
                className={cn(
                  "h-10 rounded-lg text-xs font-medium transition-all duration-200",
                  formData.conservationStatus === 1
                    ? "bg-white text-gray-900 shadow-md"
                    : "bg-gray-100 text-gray-600",
                )}
              >
                {CONSERVATION_STATUS_LABELS[1]}
              </button>
              <button
                onClick={() => updateField("conservationStatus", 4)}
                className={cn(
                  "col-span-2 h-10 rounded-lg text-xs font-medium transition-all duration-200",
                  formData.conservationStatus === 4
                    ? "bg-white text-gray-900 shadow-md"
                    : "bg-gray-100 text-gray-600",
                )}
              >
                {CONSERVATION_STATUS_LABELS[4]}
              </button>
            </div>
          </div>

          {/* Renovation Year - Show only when conservation status is "Reformado" (6) */}
          {formData.conservationStatus === 6 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">
                  Año de Reforma
                </h3>
                <label className="flex cursor-pointer items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.renovationYearUnknown}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      // Clear renovation year when "don't know" is checked
                      if (isChecked) {
                        updateFormData({
                          renovationYearUnknown: true,
                          renovationYear: null,
                        });
                      } else {
                        // Set default when unchecked
                        updateFormData({
                          renovationYearUnknown: false,
                          renovationYear: 2015,
                        });
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <span className="text-xs text-gray-600">No lo sé</span>
                </label>
              </div>
              {!formData.renovationYearUnknown && (
                <YearSlider
                  label=""
                  value={formData.renovationYear ?? 2015}
                  onChange={(val) => updateField("renovationYear", val)}
                  min={1900}
                  max={new Date().getFullYear()}
                  placeholder="Año de última reforma"
                />
              )}
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="totalFloors"
              className="text-xs font-medium text-gray-600"
            >
              Plantas del Edificio
            </label>
            <Input
              id="totalFloors"
              value={formData.totalFloors?.toString() || ""}
              onChange={handleEventInputChange("totalFloors")}
              placeholder="Número de plantas"
              type="number"
              min="0"
              step="1"
              className="h-10 border-0 shadow-md placeholder:text-gray-400"
            />
          </div>
        </>
      )}

      {/* Save Error Notification */}
      {/* Removed saveError state and notification as per new_code */}

      {/* Navigation Buttons */}
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
    </div>
  );
}
