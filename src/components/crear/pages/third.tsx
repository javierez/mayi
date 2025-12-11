import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { FloatingLabelInput } from "~/components/ui/floating-label-input";
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
  Loader,
  Search,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  STREET_TYPE_VALUES,
  STREET_TYPE_LABELS,
} from "~/lib/constants/street-type";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  retrieveCadastralData,
  searchCadastralParcelsWithDistance,
  expandParcelToUnits,
  compareCadastralData,
  type CadastralComparisonResult,
  type CadastralSearchResult,
  type CadastralParcel,
} from "~/server/cadastral/retrieve_cadastral";
import { toast } from "sonner";
// import FormSkeleton from "./form-skeleton"; // Removed - using single loading state
import { useFormContext } from "../form-context";
import { generatePropertyTitle } from "~/lib/property-title";
import {
  AddressAutocomplete,
  type LocationData,
} from "~/components/propiedades/form/address-autocomplete";
import { CadastralSelectionModal } from "~/components/propiedades/form/cadastral-selection-modal";
import { getNeighborhoodFromCoordinates } from "~/server/googlemaps/retrieve_geo";

interface ThirdPageProps {
  listingId: string;
  onNext: () => void;
  onBack?: () => void;
  nextButtonText?: string;
}

export default function ThirdPage({
  onNext,
  onBack,
  nextButtonText = "Siguiente",
}: ThirdPageProps) {
  const { state, updateFormData } = useFormContext();
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [isCadastralLoading, setIsCadastralLoading] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [potentialParcels, setPotentialParcels] = useState<CadastralParcel[]>(
    [],
  );
  const [isSearching, setIsSearching] = useState(false);
  const searchParams = useSearchParams();
  const method = searchParams?.get("method");

  // Coordinate state for cadastral search (obtained from Google Maps or Nominatim autocomplete)
  const [latitude, setLatitude] = useState<number | null>(
    state.formData.latitude
      ? typeof state.formData.latitude === "number"
        ? state.formData.latitude
        : parseFloat(state.formData.latitude)
      : null,
  );
  const [longitude, setLongitude] = useState<number | null>(
    state.formData.longitude
      ? typeof state.formData.longitude === "number"
        ? state.formData.longitude
        : parseFloat(state.formData.longitude)
      : null,
  );

  // Cadastral validation state
  const [cadastralDiscrepancies, setCadastralDiscrepancies] =
    useState<CadastralComparisonResult | null>(null);
  const [cadastralValidationStatus, setCadastralValidationStatus] = useState<
    "none" | "validating" | "valid" | "invalid"
  >("none");

  // Get current form data from context (following first.tsx pattern)
  const formData = {
    cadastralReference: state.formData.cadastralReference ?? "",
    address: state.formData.address ?? "",
    addressDetails: state.formData.addressDetails ?? "",
    postalCode: state.formData.postalCode ?? "",
    city: state.formData.city ?? "",
    province: state.formData.province ?? "",
    municipality: state.formData.municipality ?? "",
    neighborhood: state.formData.neighborhood ?? "",
    streetType: state.formData.streetType ?? "",
  };

  const propertyType = state.formData?.propertyType ?? "";

  // Address value state for AddressAutocomplete
  const [addressValue, setAddressValue] = useState(formData.address);

  // Helper to get discrepancy for a specific field
  const getFieldDiscrepancy = (fieldName: string) => {
    return cadastralDiscrepancies?.differences.find(
      (diff) => diff.field === fieldName,
    );
  };

  // Apply suggestion for a specific field
  const applyFieldSuggestion = (fieldName: string, suggestedValue: string) => {
    console.log(
      `✅ [ThirdPage] Applying suggestion for ${fieldName}:`,
      suggestedValue,
    );

    switch (fieldName) {
      case "street":
        setAddressValue(suggestedValue);
        updateField("address", suggestedValue);
        break;
      case "postalCode":
        updateField("postalCode", suggestedValue);
        break;
      case "city":
        updateField("city", suggestedValue);
        break;
      case "province":
        updateField("province", suggestedValue);
        break;
    }

    // Remove the applied discrepancy from the list
    if (cadastralDiscrepancies) {
      const remainingDifferences = cadastralDiscrepancies.differences.filter(
        (diff) => diff.field !== fieldName,
      );

      if (remainingDifferences.length === 0) {
        // All discrepancies resolved
        setCadastralDiscrepancies(null);
        setCadastralValidationStatus("valid");
      } else {
        // Update with remaining discrepancies
        setCadastralDiscrepancies({
          hasDiscrepancies: true,
          differences: remainingDifferences,
        });
      }
    }

    toast.success("Sugerencia aplicada correctamente.");
  };

  // Check if method is manual - if so, skip this page
  useEffect(() => {
    if (method === "manual") {
      // Skip this page and go directly to next
      onNext();
    }
  }, [method, onNext]);

  // No useEffect needed - data comes from form context

  // Update form data helper (following first.tsx pattern)
  const updateField = (field: string, value: string) => {
    updateFormData({ [field]: value });
  };

  const handleInputChange = (field: string) => (value: string) => {
    updateField(field, value);
  };

  // Handle Google Places autocomplete selection
  const handleLocationSelected = async (data: LocationData) => {
    console.log("📍 [ThirdPage] Google Places location selected:", data);

    // Store coordinates for cadastral search
    setLatitude(data.lat);
    setLongitude(data.lng);
    console.log("📍 [ThirdPage] Coordinates stored:", {
      lat: data.lat,
      lng: data.lng,
    });

    // Parse the street with number from address components
    const streetWithNumber =
      data.addressComponents.streetNumber && data.addressComponents.route
        ? `${data.addressComponents.route} ${data.addressComponents.streetNumber}`
        : data.addressComponents.route || addressValue;

    // Update address value state
    setAddressValue(streetWithNumber);

    // Update form fields
    const updatedData = {
      address: streetWithNumber,
      addressDetails: formData.addressDetails,
      postalCode: data.addressComponents.postalCode || formData.postalCode,
      city: data.addressComponents.locality || formData.city,
      province:
        data.addressComponents.administrativeAreaLevel1 || formData.province,
      municipality:
        data.addressComponents.administrativeAreaLevel2 ||
        data.addressComponents.locality ||
        formData.municipality,
      neighborhood: data.addressComponents.sublocality || formData.neighborhood,
    };

    // Update neighborhood from coordinates if sublocality not available
    if (!data.addressComponents.sublocality) {
      console.log("🔄 [ThirdPage] Fetching neighborhood from Nominatim...");
      const neighborhood = await getNeighborhoodFromCoordinates(
        data.lat,
        data.lng,
      );
      if (neighborhood) {
        console.log(
          "✅ [ThirdPage] Neighborhood from Nominatim:",
          neighborhood,
        );
        updatedData.neighborhood = neighborhood;
      } else {
        console.log("⚠️ [ThirdPage] No neighborhood found from Nominatim");
      }
    }

    // Update form context
    updateFormData({
      ...updatedData,
      latitude: data.lat.toString(),
      longitude: data.lng.toString(),
    });

    // Generate and update title
    const generatedTitle = generatePropertyTitle(
      state.formData?.propertyType ?? "piso",
      updatedData.address,
      updatedData.neighborhood,
    );
    updateFormData({ title: generatedTitle });

    toast.success("Dirección autocompletada. Los datos se han actualizado.");
  };

  // Search for cadastral parcels by coordinates (two-step flow)
  const searchCadastralReferences = async () => {
    console.log("🔍 [ThirdPage] ========================================");
    console.log("🔍 [ThirdPage] STARTING CADASTRAL PARCEL SEARCH");
    console.log("🔍 [ThirdPage] ========================================");

    console.log("📋 [ThirdPage] Current coordinates for search:", {
      latitude,
      longitude,
    });

    // Check if we have coordinates
    if (latitude === null || longitude === null) {
      console.log("⚠️ [ThirdPage] Missing coordinates for search");
      toast.error(
        "Por favor, usa el autocompletado de Google Maps o Nominatim para obtener coordenadas precisas.",
      );
      return;
    }

    setIsSearching(true);
    setIsSearchModalOpen(true);

    try {
      const searchParams = {
        latitude,
        longitude,
      };

      console.log(
        "📡 [ThirdPage] Calling searchCadastralParcelsWithDistance with params:",
        searchParams,
      );

      const parcels = await searchCadastralParcelsWithDistance(searchParams);

      console.log("📊 [ThirdPage] Parcels found:", parcels);
      setPotentialParcels(parcels);

      console.log("✅ [ThirdPage] ========================================");
      console.log("✅ [ThirdPage] PARCEL SEARCH COMPLETED SUCCESSFULLY");
      console.log("✅ [ThirdPage] ========================================");
      console.log(`✅ [ThirdPage] Found ${parcels.length} parcels`);

      if (parcels.length === 0) {
        toast.info(
          "No se encontraron parcelas catastrales en estas coordenadas.",
          {
            description:
              "El Catastro no encontró propiedades en un radio de 50 metros.",
          },
        );
      }
    } catch (error) {
      console.error("❌ [ThirdPage] ========================================");
      console.error("❌ [ThirdPage] PARCEL SEARCH FAILED WITH ERROR");
      console.error("❌ [ThirdPage] ========================================");
      console.error("❌ [ThirdPage] Search error:", error);
      toast.error(
        "Error al buscar parcelas catastrales. Inténtalo de nuevo.",
      );
      setPotentialParcels([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle parcel expansion (called by modal when user selects a parcel)
  const handleExpandParcel = async (
    parcel: CadastralParcel,
  ): Promise<CadastralSearchResult[]> => {
    console.log("🔍 [ThirdPage] Expanding parcel:", parcel.cadastralReference);
    try {
      const units = await expandParcelToUnits(parcel.cadastralReference);
      console.log(`✅ [ThirdPage] Expanded to ${units.length} units`);
      return units;
    } catch (error) {
      console.error("❌ [ThirdPage] Error expanding parcel:", error);
      toast.error("Error al cargar las unidades de la parcela.");
      return [];
    }
  };

  // Handle cadastral reference selection from modal
  const handleCadastralReferenceSelect = (
    selectedRef: CadastralSearchResult,
  ) => {
    console.log("✅ [ThirdPage] Selected cadastral reference:", selectedRef);

    // Update cadastral reference, addressDetails, AND property characteristics
    const updatedData = {
      cadastralReference: selectedRef.cadastralReference,
      addressDetails: selectedRef.addressDetails,
      // Apply cadastral surface and year data automatically
      totalSurface: selectedRef.builtSurfaceArea,
      usefulSurface: selectedRef.builtSurfaceArea,
      buildYear: selectedRef.yearBuilt,
    };

    // DO NOT update: address, postalCode, city, province, municipality, neighborhood
    // These should remain as they are (user entered via Google Places)

    updateFormData(updatedData);
    setIsSearchModalOpen(false);

    toast.success("Referencia catastral y datos del inmueble actualizados.");
  };

  // Function to validate cadastral reference format
  const isValidCadastralReference = (reference: string): boolean => {
    // Spanish cadastral reference format: 20 characters
    // Example: 1234567CS1234S0001AB
    const cadastralPattern =
      /^[0-9]{7}[A-Z]{2}[0-9]{4}[A-Z]{1}[0-9]{4}[A-Z]{2}$/;
    return cadastralPattern.test(reference.replace(/\s/g, ""));
  };

  // Function to handle cadastral lookup
  const handleCadastralLookup = async () => {
    const reference = formData.cadastralReference.trim();

    // Check if we have all key info (street, city, postal code)
    const hasKeyInfo =
      addressValue.trim() && formData.city.trim() && formData.postalCode.trim();

    if (hasKeyInfo) {
      // If we have all key info, do comparison
      await validateCadastralReference(reference);
    } else {
      // If missing key info, fill up the values
      await fillCadastralData(reference);
    }
  };

  // Function to validate and compare cadastral data
  const validateCadastralReference = async (cadastralRef: string) => {
    console.log("🔍 [ThirdPage] ========================================");
    console.log("🔍 [ThirdPage] STARTING CADASTRAL VALIDATION");
    console.log("🔍 [ThirdPage] ========================================");
    console.log("📋 [ThirdPage] Input cadastral reference:", cadastralRef);

    if (!cadastralRef.trim()) {
      console.log(
        "⚠️ [ThirdPage] Empty cadastral reference, clearing validation",
      );
      setCadastralDiscrepancies(null);
      setCadastralValidationStatus("none");
      return;
    }

    setIsCadastralLoading(true);
    setCadastralValidationStatus("validating");

    try {
      // Get current form data for comparison
      const currentData = {
        street: addressValue,
        postalCode: formData.postalCode,
        city: formData.city,
        province: formData.province,
      };

      console.log("📋 [ThirdPage] Current form data to compare:", currentData);

      // Fetch official cadastral data
      console.log("📡 [ThirdPage] Calling retrieveCadastralData...");
      const cadastralData = await retrieveCadastralData(cadastralRef);

      if (!cadastralData) {
        console.log("❌ [ThirdPage] No cadastral data found for reference");
        setCadastralValidationStatus("invalid");
        setCadastralDiscrepancies(null);
        return;
      }

      console.log("📊 [ThirdPage] Retrieved cadastral data:", cadastralData);

      // Compare data
      console.log("🔍 [ThirdPage] Calling compareCadastralData...");
      const comparison = await compareCadastralData(currentData, cadastralData);

      console.log("📊 [ThirdPage] Comparison result:", comparison);

      setCadastralDiscrepancies(comparison);
      setCadastralValidationStatus(
        comparison.hasDiscrepancies ? "invalid" : "valid",
      );

      console.log("✅ [ThirdPage] ========================================");
      console.log("✅ [ThirdPage] VALIDATION COMPLETED SUCCESSFULLY");
      console.log("✅ [ThirdPage] ========================================");
      console.log(
        "✅ [ThirdPage] Final validation status:",
        comparison.hasDiscrepancies ? "invalid" : "valid",
      );
    } catch (error) {
      console.error("❌ [ThirdPage] ========================================");
      console.error("❌ [ThirdPage] VALIDATION FAILED WITH ERROR");
      console.error("❌ [ThirdPage] ========================================");
      console.error("❌ [ThirdPage] Validation error:", error);
      setCadastralValidationStatus("invalid");
      setCadastralDiscrepancies(null);
    } finally {
      setIsCadastralLoading(false);
    }
  };

  // Function to fill missing cadastral data
  const fillCadastralData = async (cadastralRef: string) => {
    const reference = cadastralRef.trim();

    console.log("=== CADASTRAL FILL DATA INITIATED ===");
    console.log("Input Reference:", reference);
    console.log("Current Form State Before Fill:", {
      address: addressValue,
      city: formData.city,
      province: formData.province,
      postalCode: formData.postalCode,
    });

    if (!reference) {
      console.warn("❌ Validation Failed: Empty cadastral reference");
      toast.error("Referencia catastral requerida", {
        description: "Por favor, introduce una referencia catastral válida",
      });
      return;
    }

    if (!isValidCadastralReference(reference)) {
      console.warn("❌ Validation Failed: Invalid cadastral reference format");
      console.log("Expected Pattern: 1234567CS1234S0001AB (20 characters)");
      console.log("Received:", reference);
      toast.error("Formato inválido", {
        description:
          "La referencia catastral debe tener 20 caracteres (ej: 1234567CS1234S0001AB)",
      });
      return;
    }

    console.log("✅ Validation Passed: Cadastral reference format is valid");

    try {
      setIsCadastralLoading(true);
      console.log("🔄 Starting cadastral API lookup...");

      // Call the real Spanish Cadastre API
      console.log("📡 Querying Spanish Cadastre API for reference:", reference);
      console.log(
        "API Endpoint: https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/Consulta_DNPRC",
      );

      const cadastralData = await retrieveCadastralData(reference);

      if (!cadastralData) {
        console.warn("❌ No cadastral data found for reference:", reference);
        toast.error("Referencia no encontrada", {
          description:
            "No se encontraron datos para esta referencia catastral. Verifica que sea correcta.",
        });
        return;
      }

      console.log("✅ Cadastral API Response Received Successfully!");
      console.log("📋 DETAILED CADASTRAL DATA:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🏠 PROPERTY IDENTIFICATION:");
      console.log("   Cadastral Reference:", reference);
      console.log("   Property Type:", cadastralData.propertyType);
      console.log("");
      console.log("📍 LOCATION DATA:");
      console.log("   Street:", cadastralData.street);
      console.log("   Address Details:", cadastralData.addressDetails);
      console.log("   Postal Code:", cadastralData.postalCode);
      console.log("   City:", cadastralData.city ?? "N/A");
      console.log("   Province:", cadastralData.province ?? "N/A");
      console.log("   Municipality:", cadastralData.municipality);
      console.log("   Neighborhood:", cadastralData.neighborhood);
      console.log("");
      console.log("🌍 GEOGRAPHIC COORDINATES:");
      console.log("   Latitude:", cadastralData.latitude ?? "N/A");
      console.log("   Longitude:", cadastralData.longitude ?? "N/A");
      console.log("");
      console.log("📐 PROPERTY DIMENSIONS:");
      console.log("   Total Surface:", cadastralData.squareMeter, "m²");
      console.log("   Built Surface:", cadastralData.builtSurfaceArea, "m²");
      console.log("   Year Built:", cadastralData.yearBuilt);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      // Update all form data with cadastral information
      console.log("🔄 Updating Form Context with Cadastral Data...");

      const formUpdateData = {
        // Visible address fields
        address: cadastralData.street,
        addressDetails: cadastralData.addressDetails,
        postalCode: cadastralData.postalCode,
        city: cadastralData.city ?? "",
        province: cadastralData.province ?? "",
        municipality: cadastralData.municipality,
        neighborhood: cadastralData.neighborhood,

        // Hidden fields stored in context - mapped to form field names
        latitude: cadastralData.latitude ?? "",
        longitude: cadastralData.longitude ?? "",

        // Map cadastral fields to form field names used by other pages
        buildYear: cadastralData.yearBuilt, // second page expects buildYear
        totalSurface: cadastralData.squareMeter, // second page expects totalSurface
        usefulSurface: cadastralData.builtSurfaceArea, // second page expects usefulSurface
        propertyType: cadastralData.propertyType,
      };

      console.log("📝 FORM UPDATE PAYLOAD:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("👁️  VISIBLE FIELDS (will appear in UI):");
      console.log("   address:", formUpdateData.address);
      console.log("   addressDetails:", formUpdateData.addressDetails);
      console.log("   postalCode:", formUpdateData.postalCode);
      console.log("   city:", formUpdateData.city);
      console.log("   province:", formUpdateData.province);
      console.log("   municipality:", formUpdateData.municipality);
      console.log("   neighborhood:", formUpdateData.neighborhood);
      console.log("");
      console.log(
        "🔒 HIDDEN FIELDS (stored in context, mapped to form field names):",
      );
      console.log("   latitude:", formUpdateData.latitude);
      console.log("   longitude:", formUpdateData.longitude);
      console.log(
        "   buildYear:",
        formUpdateData.buildYear,
        "(mapped from yearBuilt)",
      );
      console.log(
        "   totalSurface:",
        formUpdateData.totalSurface,
        "(mapped from squareMeter)",
      );
      console.log(
        "   usefulSurface:",
        formUpdateData.usefulSurface,
        "(mapped from builtSurfaceArea)",
      );
      console.log("   propertyType:", formUpdateData.propertyType);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      // Update address value state
      setAddressValue(formUpdateData.address);

      updateFormData(formUpdateData);
      console.log("✅ Form Context Updated Successfully");

      console.log("🎉 CADASTRAL FILL DATA COMPLETED SUCCESSFULLY!");
      console.log(
        "💡 Note: Property title will be generated when clicking 'Siguiente'",
      );
      console.log("=== END CADASTRAL FILL DATA ===");

      toast.success("Datos catastrales cargados", {
        description:
          "La información del inmueble se ha completado automáticamente",
        duration: 4000,
      });
    } catch (error) {
      console.error("❌ CADASTRAL FILL DATA FAILED!");
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("🚨 Error Details:");
      console.error("   Reference:", reference);
      console.error(
        "   Error Type:",
        error instanceof Error ? error.constructor.name : typeof error,
      );
      console.error(
        "   Error Message:",
        error instanceof Error ? error.message : String(error),
      );
      console.error(
        "   Stack Trace:",
        error instanceof Error ? error.stack : "N/A",
      );
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("=== END CADASTRAL FILL DATA (WITH ERROR) ===");
      toast.error("Error al consultar el catastro", {
        description: "No se pudo conectar con el servicio. Inténtalo de nuevo.",
      });
    } finally {
      console.log("🔄 Resetting loading state...");
      setIsCadastralLoading(false);
      console.log("✅ Loading state reset complete");
    }
  };

  const autoCompleteAddress = async () => {
    if (!addressValue.trim()) {
      alert("Por favor, introduce al menos la dirección de la propiedad.");
      return;
    }

    try {
      setIsUpdatingAddress(true);

      // Parse the address to separate street+number from details
      const addressInput = addressValue.trim();
      const addressRegex = /^(.+?)(\d+)(.*)$/;
      const addressMatch = addressRegex.exec(addressInput);

      let streetWithNumber = addressInput;
      let parsedDetails = formData.addressDetails;
      let searchAddress = addressInput;

      if (addressMatch?.[1] && addressMatch[2]) {
        const streetName = addressMatch[1].trim(); // "Calle Gran Vía"
        const streetNumber = addressMatch[2]; // "123"
        const detailsPart = addressMatch[3]?.trim() ?? ""; // ", 4º B" or "4º B"

        streetWithNumber = `${streetName} ${streetNumber}`;
        searchAddress = streetWithNumber;

        // Clean up separators from details (remove leading commas, slashes, dashes, spaces)
        if (detailsPart) {
          parsedDetails = detailsPart.replace(/^[,\s\-\/]+/, "").trim();
        }
      }

      // Use Nominatim to auto-complete missing fields
      const addressString = [searchAddress, formData.city.trim()]
        .filter(Boolean)
        .join(", ");

      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1&countrycodes=es&addressdetails=1`;

      const response = await fetch(nominatimUrl);
      const nominatimResults = (await response.json()) as Array<{
        lat?: string;
        lon?: string;
        address?: {
          road?: string;
          house_number?: string;
          postcode?: string;
          city?: string;
          town?: string;
          state?: string;
          suburb?: string;
          quarter?: string;
        };
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

      // Store coordinates from Nominatim for cadastral search
      if (result.lat && result.lon) {
        const parsedLat = parseFloat(result.lat);
        const parsedLon = parseFloat(result.lon);
        setLatitude(parsedLat);
        setLongitude(parsedLon);
        console.log("📍 [ThirdPage] Coordinates from Nominatim stored:", {
          lat: parsedLat,
          lng: parsedLon,
        });
      }

      // Update form context directly with auto-completed data
      // Preserve street+number in address, put parsed details in addressDetails
      const updatedData = {
        address: streetWithNumber,
        addressDetails: parsedDetails,
        postalCode: result.address?.postcode ?? formData.postalCode,
        city: result.address?.city ?? result.address?.town ?? formData.city,
        province: result.address?.state ?? formData.province,
        municipality:
          result.address?.city ?? result.address?.town ?? formData.municipality,
        neighborhood:
          result.address?.suburb ??
          result.address?.quarter ??
          formData.neighborhood,
        latitude: result.lat ?? "",
        longitude: result.lon ?? "",
      };

      // Update address value state
      setAddressValue(streetWithNumber);

      updateFormData(updatedData);

      // Generate and save title after address is updated
      const generatedTitle = generatePropertyTitle(
        state.formData?.propertyType ?? "piso",
        updatedData.address ?? "",
        updatedData.neighborhood ?? "",
      );
      updateFormData({ title: generatedTitle });
    } catch (error) {
      console.error("Error auto-completing address:", error);
      alert(
        "Error al autocompletar la dirección. Por favor, inténtalo de nuevo.",
      );
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  const handleNext = () => {
    // Validate required fields
    if (!addressValue.trim()) {
      alert("Por favor, introduce la calle.");
      return;
    }

    if (!formData.postalCode.trim()) {
      alert("Por favor, introduce el código postal.");
      return;
    }

    // Generate and save title before navigating
    const generatedTitle = generatePropertyTitle(
      state.formData?.propertyType ?? "piso",
      addressValue ?? "",
      formData.neighborhood ?? "",
    );
    updateFormData({ title: generatedTitle });

    // Navigate IMMEDIATELY - no saves, completely instant!
    onNext();
  };

  // No save function needed - using local state approach

  // If method is manual, don't render anything (page will be skipped)
  if (method === "manual") {
    return null;
  }

  // Show loading only if form state is not ready
  // Main form already handles loading state with spinner
  // No skeleton needed here

  // Check if form is mostly empty (missing key fields)
  const isFormEmpty =
    !addressValue.trim() && !formData.city.trim() && !formData.postalCode.trim();

  // Determine which hint to show
  const showCatastroHint =
    formData.cadastralReference.trim() && isFormEmpty;
  const showSearchHint =
    !formData.cadastralReference.trim() &&
    latitude !== null &&
    longitude !== null;

  return (
    <div className="space-y-4">
      <h2 className="text-md mb-4 font-medium text-gray-900">Dirección</h2>

      {/* Catastro hint banner - shown at top */}
      {showCatastroHint && (
        <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <Image
              src="https://vesta-configuration-files.s3.amazonaws.com/logos/logo-catastro.png"
              alt="Catastro"
              width={14}
              height={14}
              className="object-contain"
            />
            <span>
              Haz clic en el logo del catastro para completar el formulario con
              los datos del catastro
            </span>
          </div>
        </div>
      )}

      <div className="relative -mt-6">
        <FloatingLabelInput
          id="cadastralReference"
          value={formData.cadastralReference}
          onChange={handleInputChange("cadastralReference")}
          placeholder="Referencia Catastral"
          className={
            cadastralValidationStatus === "invalid" && cadastralDiscrepancies
              ? "border-amber-500 pr-20 focus:border-amber-500"
              : cadastralValidationStatus === "valid"
                ? "border-green-500 pr-20 focus:border-green-500"
                : "pr-20"
          }
          onBlur={(e) => {
            const value = e.target.value.trim();
            if (value) {
              void validateCadastralReference(value);
            } else {
              setCadastralDiscrepancies(null);
              setCadastralValidationStatus("none");
            }
          }}
        />

        {/* Loading spinner centered in input */}
        {cadastralValidationStatus === "validating" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/50">
            <Loader className="h-5 w-5 animate-spin text-blue-500" />
          </div>
        )}

        {/* Success indicator */}
        {cadastralValidationStatus === "valid" && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
        )}

        {/* Conditional button: Search (lupa) when empty and has coordinates, Catastro logo when filled */}
        {!formData.cadastralReference.trim() &&
        latitude !== null &&
        longitude !== null ? (
          /* Search button for cadastral references (when field is empty but has coordinates) */
          <button
            type="button"
            onClick={searchCadastralReferences}
            disabled={isSearching}
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded bg-background hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
            title="Buscar referencias catastrales por coordenadas"
          >
            {isSearching ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </button>
        ) : formData.cadastralReference.trim() ? (
          /* Catastro icon button for direct lookup (when field has content) */
          <button
            type="button"
            onClick={handleCadastralLookup}
            disabled={isCadastralLoading}
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded bg-background hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
            title="Conectar con Catastro"
          >
            <Image
              src="https://vesta-configuration-files.s3.amazonaws.com/logos/logo-catastro.png"
              alt="Catastro"
              width={16}
              height={16}
              className={`object-contain transition-opacity duration-200 ${isCadastralLoading ? "animate-pulse opacity-50" : "opacity-100"}`}
            />
          </button>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <div className="relative">
          <AddressAutocomplete
            value={addressValue}
            onChange={(value) => {
              setAddressValue(value);
              updateField("address", value);
            }}
            onLocationSelected={handleLocationSelected}
            placeholder="Calle"
            className="h-10 border border-gray-200 shadow-md transition-all duration-200"
          />
          {getFieldDiscrepancy("street") && (
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
          )}
          {/* Hidden input to maintain compatibility with form context */}
          <input type="hidden" id="address" value={addressValue} readOnly />
        </div>
        {/* Field-level warning */}
        {getFieldDiscrepancy("street") && (
          <div className="flex items-center gap-2 rounded border border-amber-200/50 bg-amber-50/50 px-2 py-1 text-xs">
            <span className="flex-1 text-amber-900">
              <span className="font-medium">
                {getFieldDiscrepancy("street")!.suggested}
              </span>
            </span>
            <button
              type="button"
              className="rounded border border-amber-400/50 bg-white px-1.5 py-0.5 text-[10px] text-amber-700 transition-colors hover:bg-amber-50"
              onClick={() =>
                applyFieldSuggestion(
                  "street",
                  getFieldDiscrepancy("street")!.suggested,
                )
              }
            >
              Aplicar
            </button>
          </div>
        )}
      </div>
      <FloatingLabelInput
        id="addressDetails"
        value={formData.addressDetails}
        onChange={handleInputChange("addressDetails")}
        placeholder="Piso, puerta, otro"
      />
      <div className="space-y-1.5">
        <div className="relative">
          <FloatingLabelInput
            id="postalCode"
            value={formData.postalCode}
            onChange={handleInputChange("postalCode")}
            placeholder="Código Postal"
            className={
              getFieldDiscrepancy("postalCode")
                ? "border-amber-500 pr-8 focus:border-amber-500"
                : ""
            }
          />
          {getFieldDiscrepancy("postalCode") && (
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
          )}
        </div>
        {/* Field-level warning */}
        {getFieldDiscrepancy("postalCode") && (
          <div className="flex items-center gap-2 rounded border border-amber-200/50 bg-amber-50/50 px-2 py-1 text-xs">
            <span className="flex-1 text-amber-900">
              <span className="font-medium">
                {getFieldDiscrepancy("postalCode")!.suggested}
              </span>
            </span>
            <button
              type="button"
              className="rounded border border-amber-400/50 bg-white px-1.5 py-0.5 text-[10px] text-amber-700 transition-colors hover:bg-amber-50"
              onClick={() =>
                applyFieldSuggestion(
                  "postalCode",
                  getFieldDiscrepancy("postalCode")!.suggested,
                )
              }
            >
              Aplicar
            </button>
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <div className="relative">
          <FloatingLabelInput
            id="city"
            value={formData.city}
            onChange={handleInputChange("city")}
            placeholder="Ciudad"
            className={
              getFieldDiscrepancy("city")
                ? "border-amber-500 pr-8 focus:border-amber-500"
                : ""
            }
          />
          {getFieldDiscrepancy("city") && (
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
          )}
        </div>
        {/* Field-level warning */}
        {getFieldDiscrepancy("city") && (
          <div className="flex items-center gap-2 rounded border border-amber-200/50 bg-amber-50/50 px-2 py-1 text-xs">
            <span className="flex-1 text-amber-900">
              <span className="font-medium">
                {getFieldDiscrepancy("city")!.suggested}
              </span>
            </span>
            <button
              type="button"
              className="rounded border border-amber-400/50 bg-white px-1.5 py-0.5 text-[10px] text-amber-700 transition-colors hover:bg-amber-50"
              onClick={() =>
                applyFieldSuggestion(
                  "city",
                  getFieldDiscrepancy("city")!.suggested,
                )
              }
            >
              Aplicar
            </button>
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <div className="relative">
          <FloatingLabelInput
            id="province"
            value={formData.province}
            onChange={handleInputChange("province")}
            placeholder="Comunidad"
            className={
              getFieldDiscrepancy("province")
                ? "border-amber-500 pr-8 focus:border-amber-500"
                : ""
            }
          />
          {getFieldDiscrepancy("province") && (
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
          )}
        </div>
        {/* Field-level warning */}
        {getFieldDiscrepancy("province") && (
          <div className="flex items-center gap-2 rounded border border-amber-200/50 bg-amber-50/50 px-2 py-1 text-xs">
            <span className="flex-1 text-amber-900">
              <span className="font-medium">
                {getFieldDiscrepancy("province")!.suggested}
              </span>
            </span>
            <button
              type="button"
              className="rounded border border-amber-400/50 bg-white px-1.5 py-0.5 text-[10px] text-amber-700 transition-colors hover:bg-amber-50"
              onClick={() =>
                applyFieldSuggestion(
                  "province",
                  getFieldDiscrepancy("province")!.suggested,
                )
              }
            >
              Aplicar
            </button>
          </div>
        )}
      </div>
      <FloatingLabelInput
        id="municipality"
        value={formData.municipality}
        onChange={handleInputChange("municipality")}
        placeholder="Municipio"
      />
      <div className="relative">
        <FloatingLabelInput
          id="neighborhood"
          value={formData.neighborhood}
          onChange={handleInputChange("neighborhood")}
          placeholder="Barrio"
        />
        <button
          type="button"
          onClick={autoCompleteAddress}
          disabled={isUpdatingAddress}
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded bg-background hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
          title="Actualizar dirección"
        >
          {isUpdatingAddress ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Street Type - Only show for local property type */}
      {propertyType === "local" && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">
            Tipo de Calle
          </label>
          <Select
            value={formData.streetType}
            onValueChange={(value) => updateField("streetType", value)}
          >
            <SelectTrigger className="h-10 border border-gray-200 shadow-md">
              <SelectValue placeholder="Seleccionar tipo de calle" />
            </SelectTrigger>
            <SelectContent>
              {STREET_TYPE_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {STREET_TYPE_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Hidden input fields for coordinates */}
      <input type="hidden" id="latitude" value={latitude ?? ""} readOnly />
      <input type="hidden" id="longitude" value={longitude ?? ""} readOnly />

      {/* Search hint banner - shown at bottom before navigation */}
      {showSearchHint && (
        <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            <span>
              Sube y haz clic en la lupa del campo de referencia catastral para
              buscar la referencia catastral de tu propiedad.
            </span>
          </div>
        </div>
      )}

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
            <span>{nextButtonText}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Cadastral Selection Modal (two-step: parcels → units) */}
      <CadastralSelectionModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        parcels={potentialParcels}
        isLoading={isSearching}
        onSelect={handleCadastralReferenceSelect}
        onExpandParcel={handleExpandParcel}
      />
    </div>
  );
}
