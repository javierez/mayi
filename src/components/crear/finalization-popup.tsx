import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2, XCircle, RefreshCw } from "lucide-react";
import { Button } from "~/components/ui/button";
import { createListing } from "~/server/queries/listing";
import { FormSaveService } from "./save-service";
import type { CompleteFormData, ListingDetails } from "./form-context";

interface RentFormData {
  studentFriendly: boolean;
  petsAllowed: boolean;
  appliancesIncluded: boolean;
  internet: boolean;
  optionalGaragePrice: number;
  optionalStorageRoomPrice: number;
  rentalPrice: number;
  duplicateForRent: boolean;
  isFurnished: boolean;
  furnitureQuality: string;
}

interface FinalizationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  listingDetails?: ListingDetails | null; // Made optional for new architecture
  formData: RentFormData; // This is specifically for rent data
  completeFormData: CompleteFormData; // This is the full form data
  isSaleListing: boolean;
}

type PopupState = "loading" | "success" | "error";

export default function FinalizationPopup({
  isOpen,
  onClose,
  listingDetails,
  formData,
  completeFormData,
  isSaleListing,
}: FinalizationPopupProps) {
  const router = useRouter();
  const [state, setState] = useState<PopupState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Start finalization process when popup opens
  useEffect(() => {
    if (isOpen) {
      setState("loading");
      setErrorMessage("");
      void saveAndFinalize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Transaction-safe final save function
  const saveAndFinalize = async () => {
    try {
      // Brief delay to allow any background operations to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get IDs from listingDetails (legacy) or completeFormData (new architecture)
      const propertyId =
        listingDetails?.propertyId ?? completeFormData.propertyId;
      const listingId = listingDetails?.listingId ?? completeFormData.listingId;
      const agentId = listingDetails?.agentId ?? completeFormData.agentId;

      if (!propertyId || !listingId) {
        throw new Error("Missing property or listing ID");
      }

      // Save all form data and mark as completed
      const listingIdString = String(
        typeof listingId === "number" || typeof listingId === "string"
          ? listingId
          : "",
      );
      const saveResult = await FormSaveService.saveAllFormData(
        listingIdString,
        completeFormData,
        listingDetails ?? {
          propertyId:
            typeof propertyId === "string"
              ? parseInt(propertyId, 10)
              : (propertyId as number | undefined),
          listingType: completeFormData.listingType,
          agentId,
          propertyType: completeFormData.propertyType,
        },
        { markAsCompleted: true },
      );

      if (!saveResult.success) {
        throw new Error(saveResult.error ?? "Error saving form data");
      }

      // Step 3: Create rental listing if requested (non-blocking)
      if (isSaleListing && formData.duplicateForRent && agentId && propertyId) {
        const rentListingData = {
          propertyId: BigInt(propertyId),
          listingType: "Rent" as const,
          price: formData.rentalPrice.toString(),
          agentId: agentId?.toString() ?? "",
          studentFriendly: formData.studentFriendly,
          petsAllowed: formData.petsAllowed,
          appliancesIncluded: formData.appliancesIncluded,
          internet: formData.internet,
          optionalGaragePrice: formData.optionalGaragePrice.toString(),
          optionalStorageRoomPrice:
            formData.optionalStorageRoomPrice.toString(),
          hasKeys: false,
          optionalStorageRoom: false,
          status: "En Alquiler" as const,
          isActive: true,
          isFeatured: false,
          isBankOwned: false,
          publishToWebsite: false,
          visibilityMode: 1,
          isFurnished: formData.isFurnished,
          furnitureQuality: formData.furnitureQuality,
          viewCount: 0,
          inquiryCount: 0,
        };

        // Fire and forget - don't block success for rental creation
        void createListing(rentListingData).catch((error) => {
          console.error("Error creating rental listing:", error);
          // This won't block the success flow
        });
      }

      // Show success state
      setState("success");

      // Auto-redirect after 2 seconds
      setTimeout(() => {
        const idString = String(
          typeof listingId === "number" || typeof listingId === "string"
            ? listingId
            : "",
        );
        router.push(`/propiedades/${idString}?new=true`);
      }, 2000);
    } catch (error) {
      console.error("Error in saveAndFinalize:", error);
      setState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Error al finalizar el proceso. Por favor, inténtalo de nuevo.",
      );
    }
  };

  const handleRetry = () => {
    setState("loading");
    setErrorMessage("");
    void saveAndFinalize();
  };

  const handleClose = () => {
    if (state !== "loading") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={handleClose}
        />

        {/* Popup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        >
          {/* Loading State */}
          {state === "loading" && (
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Finalizando proceso
              </h3>
              <p className="text-sm text-gray-600">
                Espera, estamos revisando que todo esté bien
              </p>
            </div>
          )}

          {/* Success State */}
          {state === "success" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="mb-4 flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                ¡Proceso completado!
              </h3>
              <p className="text-sm text-gray-600">
                El inmueble ha sido creado correctamente
              </p>
              <div className="mt-4">
                <div className="mx-auto h-1 w-32 rounded-full bg-gray-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2 }}
                    className="h-full rounded-full bg-green-500"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Redirigiendo en 2 segundos...
                </p>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {state === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="mb-4 flex justify-center">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Error en el proceso
              </h3>
              <p className="mb-4 text-sm text-gray-600">{errorMessage}</p>
              <div className="flex space-x-3">
                <Button
                  onClick={handleRetry}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reintentar</span>
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cerrar
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
