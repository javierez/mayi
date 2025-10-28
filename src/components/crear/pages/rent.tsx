import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import {
  ChevronLeft,
  GraduationCap,
  PawPrint,
  Zap,
  Car,
  Package,
} from "lucide-react";
import { motion } from "framer-motion";
import { formFormatters } from "~/lib/utils";
import { cn } from "~/lib/utils";
import { Input } from "~/components/ui/input";
import { useFormContext } from "../form-context";
import FinalizationPopup from "../finalization-popup";

interface RentPageProps {
  listingId?: string;
  onNext?: () => void;
  onBack?: () => void;
}

interface RentPageFormData {
  hasKeys: boolean;
  studentFriendly: boolean;
  petsAllowed: boolean;
  appliancesIncluded: boolean;
  isFurnished: boolean;
  furnitureQuality: string;
  optionalGaragePrice: number;
  optionalStorageRoomPrice: number;
  rentalPrice: number;
  duplicateForRent: boolean;
  internet: boolean;
}

const initialFormData: RentPageFormData = {
  hasKeys: false,
  studentFriendly: false,
  petsAllowed: false,
  appliancesIncluded: false,
  isFurnished: false,
  furnitureQuality: "",
  optionalGaragePrice: 0,
  optionalStorageRoomPrice: 0,
  rentalPrice: 0,
  duplicateForRent: false,
  internet: false,
};

export default function RentPage({ listingId, onBack }: RentPageProps) {
  const { state, updateFormData } = useFormContext();
  const [showFinalizationPopup, setShowFinalizationPopup] =
    useState<boolean>(false);

  const propertyType = state.formData.propertyType ?? "";
  const isSaleListing = state.formData.listingType === "Sale";

  // Get current form data from context with fallbacks (following first.tsx pattern)
  const formData = {
    hasKeys: state.formData.hasKeys ?? initialFormData.hasKeys,
    studentFriendly:
      state.formData.studentFriendly ?? initialFormData.studentFriendly,
    petsAllowed: state.formData.petsAllowed ?? initialFormData.petsAllowed,
    appliancesIncluded:
      state.formData.appliancesIncluded ?? initialFormData.appliancesIncluded,
    isFurnished: state.formData.isFurnished ?? initialFormData.isFurnished,
    furnitureQuality:
      state.formData.furnitureQuality ?? initialFormData.furnitureQuality,
    optionalGaragePrice:
      state.formData.optionalGaragePrice ?? initialFormData.optionalGaragePrice,
    optionalStorageRoomPrice:
      state.formData.optionalStorageRoomPrice ??
      initialFormData.optionalStorageRoomPrice,
    rentalPrice: state.formData.rentalPrice ?? initialFormData.rentalPrice,
    duplicateForRent:
      state.formData.duplicateForRent ?? initialFormData.duplicateForRent,
    internet: state.formData.internet ?? initialFormData.internet,
  };

  // Update form data helper (following first.tsx pattern)
  const updateField = (field: keyof RentPageFormData, value: unknown) => {
    updateFormData({ [field]: value });
  };

  // Handle price input with formatting for garage and storage room
  const handleGaragePriceChange = formFormatters.handleNumericPriceInputChange(
    (value) => updateField("optionalGaragePrice", value),
  );

  const handleStorageRoomPriceChange =
    formFormatters.handleNumericPriceInputChange((value) =>
      updateField("optionalStorageRoomPrice", value),
    );

  const handleRentalPriceChange = formFormatters.handleNumericPriceInputChange(
    (value) => updateField("rentalPrice", value),
  );

  const handleNext = () => {
    // Validate rental price if creating rental listing
    if (
      isSaleListing &&
      formData.duplicateForRent &&
      formData.rentalPrice <= 0
    ) {
      alert("Por favor, introduce el precio del alquiler.");
      return;
    }

    // Show finalization popup instead of immediate navigation
    setShowFinalizationPopup(true);
  };

  const handleClosePopup = () => {
    setShowFinalizationPopup(false);
  };

  // If it's a sale listing, show the Apple-like UI
  if (isSaleListing) {
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
            ¿También para alquiler?
          </h2>
        </motion.div>

        <motion.div
          className="flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="relative h-12 w-full max-w-sm rounded-lg bg-gray-100 p-1">
            <motion.div
              className="absolute left-1 top-1 h-10 w-[calc(50%-2px)] rounded-md bg-gradient-to-r from-blue-400 to-yellow-300 shadow-sm"
              animate={{
                x: formData.duplicateForRent ? "calc(100% - 5px)" : 0,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <div className="relative flex h-full">
              <button
                type="button"
                onClick={() => updateField("duplicateForRent", false)}
                className={cn(
                  "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                  !formData.duplicateForRent ? "text-white" : "text-gray-400",
                )}
              >
                Solo Venta
              </button>
              <button
                type="button"
                onClick={() => updateField("duplicateForRent", true)}
                className={cn(
                  "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                  formData.duplicateForRent ? "text-white" : "text-gray-400",
                )}
              >
                También Alquiler
              </button>
            </div>
          </div>
        </motion.div>

        {/* Show rental characteristics when toggle is set to "También Alquiler" */}
        {formData.duplicateForRent && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            {/* Rental Price - Mandatory */}
            <div className="rounded-lg border-2 bg-blue-50 p-4 shadow-md">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">
                  Precio del Alquiler
                </h4>
              </div>
              <Input
                type="text"
                value={formFormatters.formatPriceInput(formData.rentalPrice)}
                onChange={handleRentalPriceChange}
                placeholder="0 €"
                className="h-10 border-0 bg-white text-sm shadow-md"
              />
            </div>

            {/* Garage Price - Hide for solar and garage properties */}
            {propertyType !== "solar" &&
              propertyType !== "garaje" &&
              Boolean(state.formData.hasGarage) && (
                <div className="rounded-lg p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-medium text-gray-600">
                      Garaje (€/mes)
                    </h4>
                    <Car className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    value={formFormatters.formatPriceInput(
                      formData.optionalGaragePrice,
                    )}
                    onChange={handleGaragePriceChange}
                    placeholder="0 €"
                    className="h-8 border-0 text-xs shadow-md"
                  />
                </div>
              )}

            {/* Storage Room Price - Hide for solar and garage properties */}
            {propertyType !== "solar" &&
              propertyType !== "garaje" &&
              Boolean(state.formData.hasStorageRoom) && (
                <div className="rounded-lg p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-medium text-gray-600">
                      Trastero (€/mes)
                    </h4>
                    <Package className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    value={formFormatters.formatPriceInput(
                      formData.optionalStorageRoomPrice,
                    )}
                    onChange={handleStorageRoomPriceChange}
                    placeholder="0 €"
                    className="h-8 border-0 text-xs shadow-md"
                  />
                </div>
              )}

            {/* Rental Characteristics - Hide for solar and garage properties */}
            {propertyType !== "solar" && propertyType !== "garaje" && (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Student Friendly - Hide for local properties */}
                  {propertyType !== "local" && (
                    <div className="space-y-4 rounded-lg p-4 shadow-md">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-xs font-medium text-gray-600">
                          Estudiantes
                        </h4>
                        <GraduationCap className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="studentFriendly"
                          checked={formData.studentFriendly}
                          onCheckedChange={(checked) =>
                            updateField("studentFriendly", !!checked)
                          }
                        />
                        <Label htmlFor="studentFriendly" className="text-sm">
                          Admite estudiantes
                        </Label>
                      </div>
                    </div>
                  )}

                  {/* Pets Allowed - Hide for local properties */}
                  {propertyType !== "local" && (
                    <div className="space-y-4 rounded-lg p-4 shadow-md">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-xs font-medium text-gray-600">
                          Mascotas
                        </h4>
                        <PawPrint className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="petsAllowed"
                          checked={formData.petsAllowed}
                          onCheckedChange={(checked) =>
                            updateField("petsAllowed", !!checked)
                          }
                        />
                        <Label htmlFor="petsAllowed" className="text-sm">
                          Admite mascotas
                        </Label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Appliances Included - Show for all property types except solar and garage */}
                <div className="space-y-4 rounded-lg p-4 shadow-md">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-medium text-gray-600">
                      Electrodomésticos
                    </h4>
                    <Zap className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="appliancesIncluded"
                        checked={formData.appliancesIncluded}
                        onCheckedChange={(checked) =>
                          updateField("appliancesIncluded", !!checked)
                        }
                      />
                      <Label htmlFor="appliancesIncluded" className="text-sm">
                        Incluye electrodomésticos
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="internet"
                        checked={formData.internet}
                        onCheckedChange={(checked) =>
                          updateField("internet", !!checked)
                        }
                      />
                      <Label htmlFor="internet" className="text-sm">
                        Incluye internet
                      </Label>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

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
              <span>Finalizar</span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Finalization Popup */}
        <FinalizationPopup
          isOpen={showFinalizationPopup}
          onClose={handleClosePopup}
          listingDetails={{
            listingId: listingId ?? state.formData.listingId,
            propertyId:
              typeof state.formData.propertyId === "string"
                ? parseInt(state.formData.propertyId, 10)
                : state.formData.propertyId,
            agentId: state.formData.agentId,
            listingType: state.formData.listingType,
            propertyType: state.formData.propertyType,
          }}
          formData={formData}
          completeFormData={state.formData}
          isSaleListing={isSaleListing}
        />
      </motion.div>
    );
  }

  // If it's a rent listing, show the rental characteristics
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
          Propiedades del Alquiler
        </h2>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {/* Rental Characteristics - Hide for solar and garage properties */}
        {propertyType !== "solar" && propertyType !== "garaje" && (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Student Friendly - Hide for local properties */}
              {propertyType !== "local" && (
                <div className="space-y-4 rounded-lg p-4 shadow-md">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-medium text-gray-600">
                      Estudiantes
                    </h4>
                    <GraduationCap className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="studentFriendly"
                      checked={formData.studentFriendly}
                      onCheckedChange={(checked) =>
                        updateField("studentFriendly", !!checked)
                      }
                    />
                    <Label htmlFor="studentFriendly" className="text-sm">
                      Admite estudiantes
                    </Label>
                  </div>
                </div>
              )}

              {/* Pets Allowed - Hide for local properties */}
              {propertyType !== "local" && (
                <div className="space-y-4 rounded-lg p-4 shadow-md">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-medium text-gray-600">
                      Mascotas
                    </h4>
                    <PawPrint className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="petsAllowed"
                      checked={formData.petsAllowed}
                      onCheckedChange={(checked) =>
                        updateField("petsAllowed", !!checked)
                      }
                    />
                    <Label htmlFor="petsAllowed" className="text-sm">
                      Admite mascotas
                    </Label>
                  </div>
                </div>
              )}
            </div>

            {/* Appliances Included - Show for all property types except solar and garage */}
            <div className="space-y-4 rounded-lg p-4 shadow-md">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-medium text-gray-600">
                  Electrodomésticos
                </h4>
                <Zap className="h-4 w-4 text-gray-400" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="appliancesIncluded"
                    checked={formData.appliancesIncluded}
                    onCheckedChange={(checked) =>
                      updateField("appliancesIncluded", !!checked)
                    }
                  />
                  <Label htmlFor="appliancesIncluded" className="text-sm">
                    Incluye electrodomésticos
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="internet"
                    checked={formData.internet}
                    onCheckedChange={(checked) =>
                      updateField("internet", !!checked)
                    }
                  />
                  <Label htmlFor="internet" className="text-sm">
                    Incluye internet
                  </Label>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Removed saveError state and AnimatePresence notification */}

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
            <span>Finalizar</span>
          </Button>
        </motion.div>
      </motion.div>

      {/* Finalization Popup */}
      <FinalizationPopup
        isOpen={showFinalizationPopup}
        onClose={handleClosePopup}
        listingDetails={{
          listingId: listingId ?? state.formData.listingId,
          propertyId:
            typeof state.formData.propertyId === "string"
              ? parseInt(state.formData.propertyId, 10)
              : state.formData.propertyId,
          agentId: state.formData.agentId,
          listingType: state.formData.listingType,
          propertyType: state.formData.propertyType,
        }}
        formData={formData}
        completeFormData={state.formData}
        isSaleListing={isSaleListing}
      />
    </motion.div>
  );
}
