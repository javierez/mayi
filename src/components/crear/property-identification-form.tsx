"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card } from "~/components/ui/card";
import { FloatingLabelInput } from "~/components/ui/floating-label-input";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Loader,
  Upload,
  FileText,
  X,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createPropertyFromCadastral,
  createPropertyFromLocation,
  createPropertyFromCombined,
} from "~/server/queries/properties";
import {
  uploadDocument,
  deleteDocument,
  renameDocumentFolder,
} from "~/app/actions/upload";
import { isHeicFile, convertHeicToJpeg } from "~/lib/image-utils";
import { processDocumentInBackgroundEnhanced } from "~/server/ocr/ocr-initial-form";
import { useSession } from "~/lib/auth-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { FC } from "react";

// Base form data interface
interface BaseFormData {
  // Initial questions
  cadastralReference: string;

  // Location
  street: string;
  addressDetails: string;
  postalCode: string;
  city: string;
  province: string;
  municipality: string;
  neighborhood: string;
  latitude: string;
  longitude: string;

  // Property Specifications
  squareMeter: string;
  builtSurfaceArea: string;
  yearBuilt: string;
  propertyType: string;
}

const initialFormData: BaseFormData = {
  cadastralReference: "",
  street: "",
  addressDetails: "",
  postalCode: "",
  city: "",
  province: "",
  municipality: "",
  neighborhood: "",
  latitude: "",
  longitude: "",
  squareMeter: "",
  builtSurfaceArea: "",
  yearBuilt: "",
  propertyType: "piso",
};

// Step definitions
interface Step {
  id: string;
  title: string;
  propertyTypes?: string[];
}

// Simplified steps - only initial and location
const simplifiedSteps: Step[] = [
  { id: "initial", title: "Información Inicial" },
  { id: "location", title: "Dirección" },
];

// Step configuration mapping - all property types now use the same simplified steps
const stepConfigurations = {
  piso: simplifiedSteps,
  casa: simplifiedSteps,
  garaje: simplifiedSteps,
  local: simplifiedSteps,
  solar: simplifiedSteps,
};

type PropertyType = keyof typeof stepConfigurations;

const PropertyIdentificationForm: FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<BaseFormData>(initialFormData);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [showCadastralTooltip, setShowCadastralTooltip] = useState(false);
  const [showUploadTooltip, setShowUploadTooltip] = useState(false);
  const [isCreatingProperty, setIsCreatingProperty] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // File upload state
  const [uploadedDocuments, setUploadedDocuments] = useState<
    Array<{
      docId: bigint;
      documentKey: string;
      fileUrl: string;
      filename: string;
      fileType: string;
    }>
  >([]);
  // Add state to track the temporary reference number
  const [tempReferenceNumber, setTempReferenceNumber] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{
    docId: bigint;
    documentKey: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".tooltip-container")) {
        setShowCadastralTooltip(false);
        setShowUploadTooltip(false);
      }
    };

    if (showCadastralTooltip || showUploadTooltip) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCadastralTooltip, showUploadTooltip]);

  // Get current steps based on property type
  const currentSteps = useMemo(() => {
    const propertyType = formData.propertyType as PropertyType;
    return stepConfigurations[propertyType] || simplifiedSteps;
  }, [formData.propertyType]);

  const updateFormData = (field: keyof BaseFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (field: keyof BaseFormData) => (value: string) => {
    updateFormData(field, value);
  };

  const handleEventInputChange =
    (field: keyof BaseFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      updateFormData(field, e.target.value);
    };

  // Client-side function that calls the server action for cadastral reference
  const handleCreatePropertyFromCadastral = async (
    cadastralReference: string,
  ) => {
    try {
      setIsCreatingProperty(true);
      // Call the server action
      const newProperty = await createPropertyFromCadastral(cadastralReference);
      console.log("Property created from cadastral:", newProperty);

      // Rename S3 folder if we have uploaded documents
      if (
        uploadedDocuments.length > 0 &&
        tempReferenceNumber &&
        newProperty.referenceNumber
      ) {
        try {
          const documentIds = uploadedDocuments.map((doc) => doc.docId);
          const renamedDocuments = await renameDocumentFolder(
            tempReferenceNumber,
            newProperty.referenceNumber,
            documentIds,
          );

          // Update the uploadedDocuments state with new URLs
          setUploadedDocuments((prev) =>
            prev.map((doc) => {
              const renamed = renamedDocuments.find(
                (r) => r.docId === doc.docId,
              );
              if (renamed) {
                return {
                  ...doc,
                  documentKey: renamed.newDocumentKey,
                  fileUrl: renamed.newUrl,
                };
              }
              return doc;
            }),
          );

          console.log(
            `Successfully renamed ${renamedDocuments.length} documents`,
          );

          // Now trigger OCR processing for each renamed document
          // This runs after property creation when documents can be properly linked
          for (const renamedDoc of renamedDocuments) {
            void processDocumentInBackgroundEnhanced(
              renamedDoc.newDocumentKey,
            ).catch((error) => {
              console.error(
                `Enhanced background OCR processing failed for ${renamedDoc.newDocumentKey}:`,
                error,
              );
              // Don't show this error to the user since it's background processing
            });
          }
        } catch (renameError) {
          console.error("Error renaming S3 folder:", renameError);
          // Continue with property creation even if renaming fails
        }
      }

      // Automatically populate form fields with cadastral data
      if (newProperty) {
        setFormData((prev) => ({
          ...prev,
          // Location fields
          street: newProperty.street ?? "",
          addressDetails: newProperty.addressDetails ?? "",
          postalCode: newProperty.postalCode ?? "",
          city: newProperty.city ?? "", // Now populated from geocoding data
          province: newProperty.province ?? "", // Now populated from geocoding data
          municipality: newProperty.municipality ?? "", // Now populated from geocoding data
          neighborhood: newProperty.neighborhood ?? "", // Now populated from geocoding data
          latitude: newProperty.latitude?.toString() ?? "",
          longitude: newProperty.longitude?.toString() ?? "",
          // Property specifications
          squareMeter: newProperty.squareMeter?.toString() ?? "",
          builtSurfaceArea: newProperty.builtSurfaceArea?.toString() ?? "",
          yearBuilt: newProperty.yearBuilt?.toString() ?? "",
          propertyType: newProperty.propertyType ?? "piso",
        }));
      }

      return newProperty; // Return the property data for redirection
    } catch (error) {
      console.error("Error creating property:", error);
      alert("Error al crear la propiedad. Por favor, inténtalo de nuevo.");
      throw error; // Re-throw the error so the calling function can handle it
    } finally {
      setIsCreatingProperty(false);
    }
  };

  // Client-side function that calls the server action for uploaded documents (no validation)
  const handleCreatePropertyFromDocuments = async () => {
    try {
      setIsCreatingProperty(true);

      // Create property with minimal placeholder data - no validation needed
      // OCR will extract real address later
      const placeholderLocationData = {
        street: "Dirección a completar", // Will be updated by OCR
        addressDetails: "",
        postalCode: "",
        city: "",
        province: "",
        municipality: "",
        neighborhood: "",
        latitude: "",
        longitude: "",
      };

      // Call the server action directly without Nominatim validation
      const newProperty = await createPropertyFromLocation(
        placeholderLocationData,
      );
      console.log("Property created from documents:", newProperty);

      // Rename S3 folder if we have uploaded documents
      if (
        uploadedDocuments.length > 0 &&
        tempReferenceNumber &&
        newProperty.referenceNumber
      ) {
        try {
          const documentIds = uploadedDocuments.map((doc) => doc.docId);
          const renamedDocuments = await renameDocumentFolder(
            tempReferenceNumber,
            newProperty.referenceNumber,
            documentIds,
          );

          // Update the uploadedDocuments state with new URLs
          setUploadedDocuments((prev) =>
            prev.map((doc) => {
              const renamed = renamedDocuments.find(
                (r) => r.docId === doc.docId,
              );
              if (renamed) {
                return {
                  ...doc,
                  documentKey: renamed.newDocumentKey,
                  fileUrl: renamed.newUrl,
                };
              }
              return doc;
            }),
          );

          console.log(
            `Successfully renamed ${renamedDocuments.length} documents`,
          );

          // Now trigger OCR processing for each renamed document
          for (const renamedDoc of renamedDocuments) {
            void processDocumentInBackgroundEnhanced(
              renamedDoc.newDocumentKey,
            ).catch((error) => {
              console.error(
                `Enhanced background OCR processing failed for ${renamedDoc.newDocumentKey}:`,
                error,
              );
            });
          }
        } catch (error) {
          console.error("Error during document renaming/OCR:", error);
        }
      }

      return newProperty; // Return the property data for redirection
    } catch (error) {
      console.error("Error creating property from documents:", error);
      alert("Error al crear la propiedad. Por favor, inténtalo de nuevo.");
      throw error; // Re-throw the error so the calling function can handle it
    } finally {
      setIsCreatingProperty(false);
    }
  };

  // Client-side function that calls the server action for manual location data
  const handleCreatePropertyFromLocation = async (locationData: {
    street: string;
    addressDetails?: string;
    postalCode: string;
    city?: string;
    province?: string;
    municipality?: string;
    neighborhood?: string;
  }) => {
    try {
      setIsCreatingProperty(true);

      // First, validate address using Nominatim with just street and city
      const addressString = [locationData.street, locationData.city]
        .filter(Boolean)
        .join(", ");

      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1&countrycodes=es&addressdetails=1`;

      const response = await fetch(nominatimUrl);
      const nominatimResults = (await response.json()) as Array<{
        address?: {
          postcode?: string;
          city?: string;
          town?: string;
          state?: string;
          suburb?: string;
        };
        lat?: string;
        lon?: string;
      }>;

      if (nominatimResults.length === 0) {
        alert(
          "La dirección introducida no se ha encontrado. Por favor, verifica que la dirección y ciudad sean correctos.",
        );
        return null;
      }

      const result = nominatimResults[0];
      if (!result) {
        alert(
          "La dirección introducida no se ha encontrado. Por favor, verifica que la dirección y ciudad sean correctos.",
        );
        return null;
      }

      console.log("Nominatim validation successful:", result);

      // Auto-fill missing fields with Nominatim data
      const enrichedLocationData = {
        ...locationData,
        postalCode: locationData.postalCode ?? result.address?.postcode ?? "",
        city:
          locationData.city ??
          result.address?.city ??
          result.address?.town ??
          "",
        province:
          locationData.province ??
          (result.address?.state
            ? translateComunidad(result.address.state)
            : ""),
        municipality:
          locationData.municipality ??
          result.address?.city ??
          result.address?.town ??
          "",
        neighborhood: locationData.neighborhood ?? result.address?.suburb ?? "",
        latitude: result.lat ?? "",
        longitude: result.lon ?? "",
      };

      // Update form data with enriched information
      setFormData((prev) => ({
        ...prev,
        postalCode: enrichedLocationData.postalCode,
        city: enrichedLocationData.city,
        province: enrichedLocationData.province,
        municipality: enrichedLocationData.municipality,
        neighborhood: enrichedLocationData.neighborhood,
        latitude: enrichedLocationData.latitude,
        longitude: enrichedLocationData.longitude,
      }));

      // Call the server action with enriched data
      const newProperty =
        await createPropertyFromLocation(enrichedLocationData);
      console.log("Property created from location:", newProperty);

      return newProperty; // Return the property data for redirection
    } catch (error) {
      console.error("Error creating property:", error);
      alert("Error al crear la propiedad. Por favor, inténtalo de nuevo.");
      throw error; // Re-throw the error so the calling function can handle it
    } finally {
      setIsCreatingProperty(false);
    }
  };

  // Client-side function that calls the server action for combined method (cadastral + documents)
  const handleCreatePropertyFromCombined = async () => {
    try {
      setIsCreatingProperty(true);

      // Call the server action for combined method
      const newProperty = await createPropertyFromCombined(
        formData.cadastralReference.trim(),
        uploadedDocuments,
        tempReferenceNumber,
      );

      return newProperty; // Return the property data for redirection
    } catch (error) {
      console.error("Error creating property from combined method:", error);
      alert("Error al crear la propiedad. Por favor, inténtalo de nuevo.");
      throw error; // Re-throw the error so the calling function can handle it
    } finally {
      setIsCreatingProperty(false);
    }
  };

  const nextStep = async () => {
    // COMBINED METHOD: If we have both cadastral reference AND documents, use combined method
    if (
      currentStep === 0 &&
      formData.cadastralReference.trim() &&
      uploadedDocuments.length > 0
    ) {
      try {
        const newProperty = await handleCreatePropertyFromCombined();

        if (newProperty?.listingId) {
          setIsNavigating(true);
          router.push(
            `/propiedades/crear/${newProperty.listingId}?method=combined`,
          );
          return;
        }
      } catch (error) {
        console.error("Error creating property from combined method:", error);
        alert("Error al crear la propiedad. Por favor, inténtalo de nuevo.");
        return;
      }
    }

    // If we're on the initial step and cadastral reference is filled, create property and redirect
    if (currentStep === 0 && formData.cadastralReference.trim()) {
      try {
        const newProperty = await handleCreatePropertyFromCadastral(
          formData.cadastralReference.trim(),
        );

        if (newProperty?.listingId) {
          setIsNavigating(true);
          router.push(
            `/propiedades/crear/${newProperty.listingId}?method=catastro`,
          );
          return;
        }
      } catch (error) {
        console.error("Error creating property from cadastral:", error);
        alert("Error al crear la propiedad. Por favor, inténtalo de nuevo.");
        return;
      }
    }

    // If we're on the initial step and documents are uploaded, create property and redirect
    if (currentStep === 0 && uploadedDocuments.length > 0) {
      try {
        // Create property from uploaded documents (no validation needed)
        const newProperty = await handleCreatePropertyFromDocuments();

        if (newProperty?.listingId) {
          setIsNavigating(true);
          router.push(
            `/propiedades/crear/${newProperty.listingId}?method=upload`,
          );
          return;
        }
      } catch (error) {
        console.error("Error creating property from upload:", error);
        alert("Error al crear la propiedad. Por favor, inténtalo de nuevo.");
        return;
      }
    }

    // If we're on the location step, validate and create property
    if (currentStep === 1) {
      if (!formData.street.trim()) {
        alert("Por favor, introduce la dirección de la propiedad.");
        return;
      }

      try {
        const newProperty = await handleCreatePropertyFromLocation({
          street: formData.street.trim(),
          addressDetails: formData.addressDetails.trim(),
          postalCode: formData.postalCode.trim(),
          city: formData.city.trim(),
          province: formData.province.trim(),
          municipality: formData.municipality.trim(),
          neighborhood: formData.neighborhood.trim(),
        });

        // If Nominatim validation failed, newProperty will be null
        if (!newProperty) {
          return; // Don't proceed with redirect
        }

        if (newProperty?.listingId) {
          setIsNavigating(true);
          router.push(
            `/propiedades/crear/${newProperty.listingId}?method=manual`,
          );
          return;
        }
      } catch (error) {
        console.error("Error creating property from location:", error);
        return;
      }
    }

    // If we're on step 0 without cadastral reference and no documents, go to next step
    if (currentStep === 0) {
      setDirection("forward");
      setCurrentStep(1);
    }
  };

  const autoCompleteAddress = async () => {
    if (!formData.street.trim()) {
      alert("Por favor, introduce al menos la dirección de la propiedad.");
      return;
    }

    try {
      setIsCreatingProperty(true);

      // Use Nominatim to auto-complete missing fields
      const addressString = [formData.street.trim(), formData.city.trim()]
        .filter(Boolean)
        .join(", ");

      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1&countrycodes=es&addressdetails=1`;

      const response = await fetch(nominatimUrl);
      const nominatimResults = (await response.json()) as Array<{
        address?: {
          postcode?: string;
          city?: string;
          town?: string;
          state?: string;
          suburb?: string;
        };
        lat?: string;
        lon?: string;
      }>;

      if (nominatimResults.length === 0) {
        alert(
          "No se pudo encontrar la dirección. Por favor, verifica que la dirección sea correcta.",
        );
        return;
      }

      const result = nominatimResults[0];
      if (!result) {
        alert(
          "No se pudo encontrar la dirección. Por favor, verifica que la dirección sea correcta.",
        );
        return;
      }

      console.log("Nominatim auto-completion successful:", result);

      // Update form data with Nominatim results
      setFormData((prev) => ({
        ...prev,
        postalCode: result.address?.postcode ?? prev.postalCode ?? "",
        city: result.address?.city ?? result.address?.town ?? prev.city ?? "",
        province: result.address?.state
          ? translateComunidad(result.address.state)
          : (prev.province ?? ""),
        municipality:
          result.address?.city ??
          result.address?.town ??
          prev.municipality ??
          "",
        neighborhood: result.address?.suburb ?? prev.neighborhood ?? "",
        latitude: result.lat ?? "",
        longitude: result.lon ?? "",
      }));
    } catch (error) {
      console.error("Error auto-completing address:", error);
      alert(
        "Error al autocompletar la dirección. Por favor, inténtalo de nuevo.",
      );
    } finally {
      setIsCreatingProperty(false);
    }
  };

  // Check if all location fields are filled
  const areAllLocationFieldsFilled = () => {
    return (
      formData.street.trim() &&
      formData.postalCode.trim() &&
      formData.city.trim() &&
      formData.province.trim() &&
      formData.municipality.trim()
    );
  };

  const handleFileUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setUploadProgress(0);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      try {
        // Generate a temporary reference number if we don't have one yet
        let currentTempRef = tempReferenceNumber;
        if (!currentTempRef) {
          currentTempRef = `temp_${Date.now()}`;
          setTempReferenceNumber(currentTempRef);
        }

        const userId = session?.user?.id;
        if (!userId) {
          throw new Error("Usuario no autenticado");
        }

        const uploadedDocument = await uploadDocument(
          file,
          userId,
          currentTempRef,
          uploadedDocuments.length + 1,
          "ficha_propiedad",
        );

        clearInterval(progressInterval);
        setUploadProgress(100);

        setUploadedDocuments((prev) => [
          ...prev,
          {
            docId: uploadedDocument.docId,
            documentKey: uploadedDocument.documentKey,
            fileUrl: uploadedDocument.fileUrl,
            filename: uploadedDocument.filename,
            fileType: uploadedDocument.fileType,
          },
        ]);

        // Note: OCR processing will be triggered after property creation
        // This ensures the property exists before OCR tries to find it by reference number

        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      } catch (error) {
        clearInterval(progressInterval);
        console.error("Error uploading document:", error);
        setIsUploading(false);
        setUploadProgress(0);
        alert("Error al subir el archivo. Por favor, inténtalo de nuevo.");
      }
    },
    [tempReferenceNumber, uploadedDocuments.length, session?.user?.id],
  );

  // File upload handlers
  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      const files: File[] = Array.from(e.dataTransfer.files);

      for (const file of files) {
        if (file.type === "application/pdf" || file.type.startsWith("image/")) {
          await handleFileUpload(file);
        }
      }
    },
    [handleFileUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        for (let file of Array.from(files)) {
          // Check if it's an image (including HEIC) or PDF
          const isImage = file.type.startsWith("image/") || isHeicFile(file);
          const isPdf = file.type === "application/pdf";

          if (isPdf || isImage) {
            // Convert HEIC to JPEG if needed
            if (isImage && isHeicFile(file)) {
              try {
                setIsConverting(true);
                file = await convertHeicToJpeg(file);
              } catch (err) {
                console.error("Error converting HEIC:", err);
                setIsConverting(false);
                continue; // Skip this file if conversion fails
              } finally {
                setIsConverting(false);
              }
            }
            await handleFileUpload(file);
          }
        }
      }
      // Reset the input value so the same file can be selected again
      e.target.value = "";
    },
    [handleFileUpload],
  );

  const handleDeleteDocument = async (docId: bigint, documentKey: string) => {
    setDocumentToDelete({ docId, documentKey });
    setShowDeleteDialog(true);
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDocument(
        documentToDelete.documentKey,
        documentToDelete.docId,
      );
      setUploadedDocuments((prev) =>
        prev.filter((doc) => doc.docId !== documentToDelete.docId),
      );
      setShowDeleteDialog(false);
      setDocumentToDelete(null);
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Error al eliminar el archivo. Por favor, inténtalo de nuevo.");
    } finally {
      setIsDeleting(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setDirection("backward");
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Get property type display name
  // Helper function to translate autonomous communities from English to Spanish
  const translateComunidad = (englishName: string) => {
    const translations: Record<string, string> = {
      Andalusia: "Andalucía",
      Aragon: "Aragón",
      Asturias: "Asturias",
      "Balearic Islands": "Islas Baleares",
      "Basque Country": "País Vasco",
      "Canary Islands": "Islas Canarias",
      Cantabria: "Cantabria",
      "Castile and León": "Castilla y León",
      "Castile-La Mancha": "Castilla-La Mancha",
      Catalonia: "Cataluña",
      Ceuta: "Ceuta",
      "Community of Madrid": "Comunidad de Madrid",
      Extremadura: "Extremadura",
      Galicia: "Galicia",
      "La Rioja": "La Rioja",
      Melilla: "Melilla",
      Murcia: "Murcia",
      Navarre: "Navarra",
      Valencia: "Comunidad Valenciana",
      "Valencian Community": "Comunidad Valenciana",
    };
    return translations[englishName] ?? englishName;
  };

  const getPropertyTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      piso: "Piso",
      casa: "Casa",
      garaje: "Garaje",
      local: "Local",
      solar: "Solar",
    };
    return types[type] ?? type;
  };

  const renderStepContent = () => {
    const step = currentSteps[currentStep];
    const propertyType = formData.propertyType as PropertyType;

    if (!step) {
      return <div>Step not found</div>;
    }

    switch (step.id) {
      case "initial":
        return (
          <div className="space-y-8">
            {/* Referencia Catastral Section */}
            <div className="space-y-4">
              <div className="mb-4 flex items-center space-x-3">
                <h3 className="text-md font-medium text-gray-900">
                  Referencia Catastral
                </h3>
                <div className="tooltip-container relative">
                  <button
                    className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
                    onClick={() =>
                      setShowCadastralTooltip(!showCadastralTooltip)
                    }
                  >
                    <Info className="h-3 w-3" />
                  </button>
                  {showCadastralTooltip && (
                    <div className="absolute left-0 top-8 z-10 w-64 rounded-lg bg-gray-600 p-3 text-sm text-white shadow-lg">
                      <p>
                        Rellenar las fichas lleva{" "}
                        <span className="font-bold text-orange-300">
                          30 minutos
                        </span>{" "}
                        de media. Ahorra 4 minutos introduciendo la referencia
                        catastral
                      </p>
                      <div className="absolute -top-1 left-3 h-2 w-2 rotate-45 transform bg-gray-600"></div>
                    </div>
                  )}
                </div>
              </div>
              <Input
                id="cadastralReference"
                value={formData.cadastralReference}
                onChange={handleEventInputChange("cadastralReference")}
                placeholder="Referencia Catastral"
                className="h-12 text-sm"
              />
            </div>

            {/* Ficha de Propiedad Section */}
            <div className="space-y-4">
              <div className="mb-4 flex items-center space-x-3">
                <h3 className="text-md font-medium text-gray-900">
                  Ficha de Propiedad
                </h3>
                <div className="tooltip-container relative">
                  <button
                    className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
                    onClick={() => setShowUploadTooltip(!showUploadTooltip)}
                  >
                    <Info className="h-3 w-3" />
                  </button>
                  {showUploadTooltip && (
                    <div className="absolute left-0 top-8 z-10 w-72 rounded-lg bg-gray-600 p-3 text-sm text-white shadow-lg">
                      <p>
                        Ahorra hasta{" "}
                        <span className="font-bold text-orange-300">
                          15 minutos
                        </span>{" "}
                        si tienes una foto de la ficha o el documento completado
                        en PDF
                      </p>
                      <div className="absolute -top-1 left-3 h-2 w-2 rotate-45 transform bg-gray-600"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Area or Document Preview */}
              {uploadedDocuments.length === 0 && !isUploading && !isConverting ? (
                <div
                  className={`flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                    isDragOver
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                  } group cursor-pointer`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() =>
                    document.getElementById("fichaPropiedadInput")?.click()
                  }
                >
                  <div className="space-y-3 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm transition-transform group-hover:scale-105">
                      <Upload className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Subir documentos o tomar foto
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, JPG, PNG, HEIC o usar cámara
                      </p>
                    </div>
                  </div>
                </div>
              ) : isConverting ? (
                <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-gray-200 p-6">
                  <div className="w-full max-w-md space-y-4">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                    </div>
                    <p className="text-center text-sm text-gray-600">
                      Convirtiendo imagen...
                    </p>
                  </div>
                </div>
              ) : isUploading ? (
                <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-gray-200 p-6">
                  <div className="w-full max-w-md space-y-4">
                    <div className="w-full space-y-2">
                      <div className="h-0.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full bg-gray-400 transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-center text-sm text-gray-600">
                      Subiendo archivo...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {uploadedDocuments.map((document, index) => (
                    <div
                      key={document.docId.toString()}
                      className="overflow-hidden rounded-lg border border-gray-200"
                    >
                      {document.fileType === "application/pdf" ? (
                        <div className="group relative h-[300px]">
                          <iframe
                            src={document.fileUrl}
                            className="h-full w-full border-0"
                            title={`Document Preview ${index + 1}`}
                          />
                          <div className="pointer-events-none absolute inset-0 bg-black/5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <div className="pointer-events-auto absolute bottom-3 right-3 flex gap-2">
                              <button
                                onClick={() =>
                                  window.open(document.fileUrl, "_blank")
                                }
                                className="rounded-full bg-white/80 p-2.5 text-gray-700 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-white"
                                title="Abrir en nueva pestaña"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteDocument(
                                    document.docId,
                                    document.documentKey,
                                  )
                                }
                                className="rounded-full bg-white/80 p-2.5 text-red-600 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-red-50"
                                title="Eliminar documento"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="pointer-events-auto absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-lg backdrop-blur-sm">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-700">
                                {document.filename}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="group relative">
                          <div className="max-h-96 overflow-y-auto">
                            <Image
                              src={document.fileUrl}
                              alt={`Document ${index + 1}`}
                              width={800}
                              height={600}
                              className="h-auto w-full bg-gray-50 object-cover"
                            />
                          </div>
                          <div className="pointer-events-none absolute inset-0 bg-black/5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <div className="pointer-events-auto absolute bottom-3 right-3 flex gap-2">
                              <button
                                onClick={() =>
                                  window.open(document.fileUrl, "_blank")
                                }
                                className="rounded-full bg-white/80 p-2.5 text-gray-700 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-white"
                                title="Abrir en nueva pestaña"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteDocument(
                                    document.docId,
                                    document.documentKey,
                                  )
                                }
                                className="rounded-full bg-white/80 p-2.5 text-red-600 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-red-50"
                                title="Eliminar documento"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="pointer-events-auto absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-lg backdrop-blur-sm">
                              <FileText className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700">
                                {document.filename}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add more files button - DISABLED */}
                </div>
              )}

              <input
                id="fichaPropiedadInput"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>
        );

      case "location":
        return (
          <div>
            <FloatingLabelInput
              id="street"
              value={formData.street}
              onChange={handleInputChange("street")}
              placeholder="Dirección"
            />
            <FloatingLabelInput
              id="addressDetails"
              value={formData.addressDetails}
              onChange={handleInputChange("addressDetails")}
              placeholder="Piso, puerta, otro"
            />
            <FloatingLabelInput
              id="postalCode"
              value={formData.postalCode}
              onChange={handleInputChange("postalCode")}
              placeholder="Código Postal"
            />
            <FloatingLabelInput
              id="city"
              value={formData.city}
              onChange={handleInputChange("city")}
              placeholder="Ciudad"
            />
            <FloatingLabelInput
              id="province"
              value={formData.province}
              onChange={handleInputChange("province")}
              placeholder="Comunidad"
            />
            <FloatingLabelInput
              id="municipality"
              value={formData.municipality}
              onChange={handleInputChange("municipality")}
              placeholder="Municipio"
            />
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Contenido específico para {getPropertyTypeDisplay(propertyType)} -{" "}
              {step.id}
            </p>
            <div className="rounded-lg border bg-gray-50 p-4">
              <p className="text-sm">
                Este paso contendría campos específicos para el tipo de
                propiedad seleccionado.
              </p>
            </div>
          </div>
        );
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-2xl">
          <Card className="p-6">
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin" />
              <span className="ml-2">Cargando...</span>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-2xl">
          <Card className="p-6">
            <div className="py-8 text-center">
              <p>Debes iniciar sesión para crear una propiedad</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-2xl">
        <Card className="p-6">
          <div className="mb-4">
            <h1 className="mb-6 text-center text-xl font-semibold text-gray-900">
              ALTA NUEVO INMUEBLE
            </h1>
          </div>

          <div className="mb-6">
            {currentSteps[currentStep]?.id !== "initial" && (
              <h2 className="text-md mb-4 font-medium text-gray-900">
                {currentSteps[currentStep]?.title ?? "Step"}
              </h2>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: direction === "forward" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction === "forward" ? -20 : 20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-between border-t pt-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0 || isCreatingProperty || isNavigating}
              className="flex h-8 items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </Button>

            {currentStep === 1 && !areAllLocationFieldsFilled() ? (
              <Button
                onClick={autoCompleteAddress}
                disabled={
                  isCreatingProperty || isNavigating || !formData.street.trim()
                }
                className="flex h-8 items-center space-x-2"
              >
                {isCreatingProperty || isNavigating ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Autocompletando...</span>
                  </>
                ) : (
                  <>
                    <span>Autocompletar</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={isCreatingProperty || isNavigating}
                className="flex h-8 items-center space-x-2"
              >
                {isCreatingProperty || isNavigating ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>
                      {isNavigating
                        ? "Redirigiendo..."
                        : "Creando propiedad..."}
                    </span>
                  </>
                ) : (
                  <>
                    <span>Siguiente</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar documento?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. El documento se eliminará
                permanentemente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteDocument}
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PropertyIdentificationForm;
