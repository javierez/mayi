"use client";

import React, { useState } from "react";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { ChevronDown, Loader, Search, CheckCircle } from "lucide-react";
import {
  STREET_TYPE_VALUES,
  STREET_TYPE_LABELS,
  ACCESS_TYPE_VALUES,
  ACCESS_TYPE_LABELS,
} from "~/lib/constants/street-type";
import Image from "next/image";
import { toast } from "sonner";
import { ModernSaveIndicator } from "../common/modern-save-indicator";
import {
  AddressAutocomplete,
  type LocationData,
} from "../address-autocomplete";
import {
  NeighborhoodAutocomplete,
  type NeighborhoodResult,
} from "../neighborhood-autocomplete";
import { CadastralSelectionModal } from "../cadastral-selection-modal";
import { CadastralActionModal } from "../cadastral-action-modal";
import { CadastralCorrectionsModal } from "../cadastral-corrections-modal";
import type { PropertyListing } from "~/types/property-listing";
import type { SaveState } from "~/types/save-state";
import { getNeighborhoodFromCoordinates } from "~/server/googlemaps/retrieve_geo";
import {
  retrieveCadastralData,
  searchCadastralParcelsWithDistance,
  expandParcelToUnits,
  compareCadastralData,
  type CadastralComparisonResult,
  type CadastralSearchResult,
  type CadastralParcel,
} from "~/server/cadastral/retrieve_cadastral";

interface LocationCardProps {
  listing: PropertyListing;
  city: string;
  province: string;
  municipality: string;
  streetType: string;
  propertyType: string;
  collapsedSections: Record<string, boolean>;
  saveState: SaveState;
  canEdit?: boolean;
  onToggleSection: (section: string) => void;
  onSave: () => Promise<void>;
  onUpdateModule: (hasChanges: boolean) => void;
  setCity: (value: string) => void;
  setProvince: (value: string) => void;
  setMunicipality: (value: string) => void;
  setStreetType: (value: string) => void;
  setIsMapsPopupOpen: (value: boolean) => void;
  getCardStyles: (moduleName: string) => string;
  // Callbacks for property details fields (builtSurfaceArea, yearBuilt)
  setBuiltSurfaceArea?: (value: number) => void;
  setYearBuilt?: (value: number) => void;
  onPropertyDetailsChange?: () => void;
  // Solar/Land Infrastructure - distance to urban center
  nearestLocationKm?: number | null;
  setNearestLocationKm?: (value: number | null) => void;
}

export function LocationCard({
  listing,
  city,
  province,
  municipality,
  streetType,
  propertyType,
  collapsedSections,
  saveState,
  canEdit = true,
  onToggleSection,
  onSave,
  onUpdateModule,
  setCity,
  setProvince,
  setMunicipality,
  setStreetType,
  setIsMapsPopupOpen,
  getCardStyles,
  setBuiltSurfaceArea,
  setYearBuilt,
  onPropertyDetailsChange,
  nearestLocationKm,
  setNearestLocationKm,
}: LocationCardProps) {
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [streetValue, setStreetValue] = useState(listing.street ?? "");
  const [neighborhoodValue, setNeighborhoodValue] = useState(
    listing.neighborhood ?? "",
  );
  const [postalCodeValue, setPostalCodeValue] = useState(
    listing.postalCode ?? "",
  );

  // Coordinate state for cadastral search (obtained from Google Maps or Nominatim autocomplete, or loaded from database)
  const [latitude, setLatitude] = useState<number | null>(
    listing.latitude ? parseFloat(listing.latitude) : null,
  );
  const [longitude, setLongitude] = useState<number | null>(
    listing.longitude ? parseFloat(listing.longitude) : null,
  );

  // Cadastral validation state
  const [cadastralDiscrepancies, setCadastralDiscrepancies] =
    useState<CadastralComparisonResult | null>(null);
  const [cadastralValidationStatus, setCadastralValidationStatus] = useState<
    "none" | "validating" | "valid" | "invalid"
  >("none");

  // Cadastral search state (now uses parcels for two-step flow)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [potentialParcels, setPotentialParcels] = useState<CadastralParcel[]>(
    [],
  );
  const [isSearching, setIsSearching] = useState(false);
  const [isCadastralLoading, setIsCadastralLoading] = useState(false);

  // Cadastral action modal state
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  // Cadastral corrections modal state
  const [isCorrectionsModalOpen, setIsCorrectionsModalOpen] = useState(false);

  // Controlled state for cadastral reference input
  const [cadastralReferenceValue, setCadastralReferenceValue] = useState(
    listing.cadastralReference ?? "",
  );

  // Log component load/render data
  console.log("🏠 [LocationCard] Component loaded with data:", {
    street: listing.street,
    addressDetails: listing.addressDetails,
    postalCode: listing.postalCode,
    neighborhoodId: listing.neighborhoodId,
    neighborhood: listing.neighborhood,
    city: city,
    province: province,
    municipality: municipality,
  });

  // Handle opening cadastral map
  const handleOpenCadastralMap = async () => {
    const cadastralRef = cadastralReferenceValue.trim();
    if (cadastralRef) {
      try {
        await navigator.clipboard.writeText(cadastralRef);
        toast.success("Referencia catastral copiada al portapapeles");
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        toast.error("Error al copiar la referencia");
      }

      const catastroMapUrl =
        "https://www1.sedecatastro.gob.es/Cartografia/mapa.aspx?buscar=S";
      window.open(catastroMapUrl, "_blank", "noopener,noreferrer");
      console.log("🌐 Opening Catastro map:", catastroMapUrl);
    }
  };

  // Handle cadastral reference button click - always show modal, never auto-fill
  const handleCadastralLookup = async () => {
    const reference = cadastralReferenceValue.trim();
    // Always validate and show modal - user decides what to apply
    await validateCadastralReference(reference);
  };

  // Validate cadastral reference against current form data
  const validateCadastralReference = async (cadastralRef: string) => {
    console.log("🔍 [LocationCard] ========================================");
    console.log("🔍 [LocationCard] STARTING CADASTRAL VALIDATION");
    console.log("🔍 [LocationCard] ========================================");
    console.log("📋 [LocationCard] Input cadastral reference:", cadastralRef);

    if (!cadastralRef.trim()) {
      console.log(
        "⚠️ [LocationCard] Empty cadastral reference, clearing validation",
      );
      setCadastralDiscrepancies(null);
      setCadastralValidationStatus("none");
      return;
    }

    setIsCadastralLoading(true);
    setCadastralValidationStatus("validating");

    try {
      // Get current form data including property details
      const currentData = {
        street: streetValue,
        postalCode: postalCodeValue,
        city: city,
        province: province,
        builtSurfaceArea: listing.builtSurfaceArea
          ? Math.round(listing.builtSurfaceArea)
          : undefined,
        yearBuilt: listing.yearBuilt ?? undefined,
      };

      console.log(
        "📋 [LocationCard] Current form data to compare:",
        currentData,
      );

      // Fetch official cadastral data
      console.log("📡 [LocationCard] Calling retrieveCadastralData...");
      const cadastralData = await retrieveCadastralData(cadastralRef);

      if (!cadastralData) {
        console.log("❌ [LocationCard] No cadastral data found for reference");
        setCadastralValidationStatus("invalid");
        setCadastralDiscrepancies(null);
        return;
      }

      console.log("📊 [LocationCard] Retrieved cadastral data:", cadastralData);

      // Compare data
      console.log("🔍 [LocationCard] Calling compareCadastralData...");
      const comparison = await compareCadastralData(currentData, cadastralData);

      console.log("📊 [LocationCard] Comparison result:", comparison);

      setCadastralDiscrepancies(comparison);
      setCadastralValidationStatus(
        comparison.hasDiscrepancies ? "invalid" : "valid",
      );

      // Open corrections modal if discrepancies found
      if (comparison.hasDiscrepancies) {
        setIsCorrectionsModalOpen(true);
      }

      console.log("✅ [LocationCard] ========================================");
      console.log("✅ [LocationCard] VALIDATION COMPLETED SUCCESSFULLY");
      console.log("✅ [LocationCard] ========================================");
      console.log(
        "✅ [LocationCard] Final validation status:",
        comparison.hasDiscrepancies ? "invalid" : "valid",
      );
    } catch (error) {
      console.error(
        "❌ [LocationCard] ========================================",
      );
      console.error("❌ [LocationCard] VALIDATION FAILED WITH ERROR");
      console.error(
        "❌ [LocationCard] ========================================",
      );
      console.error("❌ [LocationCard] Validation error:", error);
      setCadastralValidationStatus("invalid");
      setCadastralDiscrepancies(null);
    } finally {
      setIsCadastralLoading(false);
    }
  };

  // Search for cadastral parcels by coordinates (two-step flow)
  const searchCadastralReferences = async () => {
    console.log("🔍 [LocationCard] ========================================");
    console.log("🔍 [LocationCard] STARTING CADASTRAL PARCEL SEARCH");
    console.log("🔍 [LocationCard] ========================================");

    console.log("📋 [LocationCard] Current coordinates for search:", {
      latitude,
      longitude,
    });

    // Check if we have coordinates
    if (latitude === null || longitude === null) {
      console.log("⚠️ [LocationCard] Missing coordinates for search");
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
        "📡 [LocationCard] Calling searchCadastralParcelsWithDistance with params:",
        searchParams,
      );

      const parcels = await searchCadastralParcelsWithDistance(searchParams);

      console.log("📊 [LocationCard] Parcels found:", parcels);
      setPotentialParcels(parcels);

      console.log("✅ [LocationCard] ========================================");
      console.log("✅ [LocationCard] PARCEL SEARCH COMPLETED SUCCESSFULLY");
      console.log("✅ [LocationCard] ========================================");
      console.log(`✅ [LocationCard] Found ${parcels.length} parcels`);

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
      console.error(
        "❌ [LocationCard] ========================================",
      );
      console.error("❌ [LocationCard] PARCEL SEARCH FAILED WITH ERROR");
      console.error(
        "❌ [LocationCard] ========================================",
      );
      console.error("❌ [LocationCard] Search error:", error);
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
    console.log("🔍 [LocationCard] Expanding parcel:", parcel.cadastralReference);
    try {
      const units = await expandParcelToUnits(parcel.cadastralReference);
      console.log(`✅ [LocationCard] Expanded to ${units.length} units`);
      return units;
    } catch (error) {
      console.error("❌ [LocationCard] Error expanding parcel:", error);
      toast.error("Error al cargar las unidades de la parcela.");
      return [];
    }
  };

  // Handle cadastral reference selection from modal
  const handleCadastralReferenceSelect = (
    selectedRef: CadastralSearchResult,
  ) => {
    console.log("✅ [LocationCard] Selected cadastral reference:", selectedRef);

    // Update ONLY cadastral reference state
    setCadastralReferenceValue(selectedRef.cadastralReference);

    // Update ONLY cadastral reference field
    const cadastralInput = document.getElementById(
      "cadastralReference",
    ) as HTMLInputElement;
    if (cadastralInput) {
      cadastralInput.value = selectedRef.cadastralReference;
    }

    // Update ONLY addressDetails field (floor, door, etc.)
    const addressDetailsInput = document.getElementById(
      "addressDetails",
    ) as HTMLInputElement;
    if (addressDetailsInput && selectedRef.addressDetails) {
      addressDetailsInput.value = selectedRef.addressDetails;
    }

    // DO NOT update any other fields (street, postalCode, city, province, municipality, neighborhood)
    // These should remain as they are

    // Mark as having changes
    onUpdateModule(true);

    // Close modal
    setIsSearchModalOpen(false);

    toast.success("Referencia catastral y detalles de dirección actualizados.");
  };

  // Apply suggestion for a specific field
  const applyFieldSuggestion = (fieldName: string, suggestedValue: string) => {
    console.log(
      `✅ [LocationCard] Applying suggestion for ${fieldName}:`,
      suggestedValue,
    );

    let isPropertyDetailsField = false;

    switch (fieldName) {
      case "street":
        setStreetValue(suggestedValue);
        break;
      case "postalCode":
        setPostalCodeValue(suggestedValue);
        break;
      case "city":
        setCity(suggestedValue);
        break;
      case "province":
        setProvince(suggestedValue);
        break;
      case "builtSurfaceArea": {
        // Extract numeric value from "85 m²" format
        const numericValue = parseInt(suggestedValue.replace(/[^\d]/g, ""), 10);
        if (!isNaN(numericValue)) {
          // Update listing directly
          listing.builtSurfaceArea = numericValue;
          // Call callback if provided
          setBuiltSurfaceArea?.(numericValue);
          isPropertyDetailsField = true;
        }
        break;
      }
      case "yearBuilt": {
        const yearValue = parseInt(suggestedValue, 10);
        if (!isNaN(yearValue)) {
          // Update listing directly
          listing.yearBuilt = yearValue;
          // Call callback if provided
          setYearBuilt?.(yearValue);
          isPropertyDetailsField = true;
        }
        break;
      }
    }

    // Remove the applied discrepancy from the list
    if (cadastralDiscrepancies) {
      const remainingDifferences = cadastralDiscrepancies.differences.filter(
        (diff) => diff.field !== fieldName,
      );

      if (remainingDifferences.length === 0) {
        // All discrepancies resolved - close modal
        setCadastralDiscrepancies(null);
        setCadastralValidationStatus("valid");
        setIsCorrectionsModalOpen(false);
      } else {
        // Update with remaining discrepancies
        setCadastralDiscrepancies({
          hasDiscrepancies: true,
          differences: remainingDifferences,
        });
      }
    }

    // Mark as having changes
    onUpdateModule(true);

    // Also mark property details as changed if applicable
    if (isPropertyDetailsField) {
      onPropertyDetailsChange?.();
    }

    toast.success("Sugerencia aplicada correctamente.");
  };

  // Apply all cadastral suggestions at once
  const applyAllSuggestions = () => {
    if (!cadastralDiscrepancies) return;

    console.log("✅ [LocationCard] Applying all cadastral suggestions");

    let hasPropertyDetailsChanges = false;

    for (const diff of cadastralDiscrepancies.differences) {
      switch (diff.field) {
        case "street":
          setStreetValue(diff.suggested);
          break;
        case "postalCode":
          setPostalCodeValue(diff.suggested);
          break;
        case "city":
          setCity(diff.suggested);
          break;
        case "province":
          setProvince(diff.suggested);
          break;
        case "builtSurfaceArea": {
          // Extract numeric value from "85 m²" format
          const numericValue = parseInt(
            diff.suggested.replace(/[^\d]/g, ""),
            10,
          );
          if (!isNaN(numericValue)) {
            listing.builtSurfaceArea = numericValue;
            setBuiltSurfaceArea?.(numericValue);
            hasPropertyDetailsChanges = true;
          }
          break;
        }
        case "yearBuilt": {
          const yearValue = parseInt(diff.suggested, 10);
          if (!isNaN(yearValue)) {
            listing.yearBuilt = yearValue;
            setYearBuilt?.(yearValue);
            hasPropertyDetailsChanges = true;
          }
          break;
        }
      }
    }

    // Clear discrepancies and set as valid
    setCadastralDiscrepancies(null);
    setCadastralValidationStatus("valid");

    // Mark as having changes
    onUpdateModule(true);

    // Also mark property details as changed if applicable
    if (hasPropertyDetailsChanges) {
      onPropertyDetailsChange?.();
    }

    toast.success("Todas las sugerencias aplicadas correctamente.");
  };

  // Wrap the onSave function with logging
  const handleSave = async () => {
    console.log("💾 [LocationCard] Save button clicked!");
    console.log("📋 [LocationCard] Current form values before save:", {
      street: streetValue,
      addressDetails: typeof window !== "undefined"
        ? (document.getElementById("addressDetails") as HTMLInputElement)?.value
        : "",
      postalCode: postalCodeValue,
      neighborhood: neighborhoodValue,
      city: city,
      province: province,
      municipality: municipality,
    });

    console.log("⏳ [LocationCard] Calling parent onSave function...");
    await onSave();
    console.log("✅ [LocationCard] Parent onSave function completed!");
  };

  // Handle Google Places autocomplete selection
  const handleLocationSelected = async (data: LocationData) => {
    console.log("📍 [LocationCard] ========================================");
    console.log("📍 [LocationCard] GOOGLE PLACES AUTOCOMPLETE TRIGGERED");
    console.log("📍 [LocationCard] ========================================");
    console.log("📍 [LocationCard] Full data received:", data);
    console.log("📍 [LocationCard] Address components:", data.addressComponents);
    console.log("📍 [LocationCard] Coordinates:", { lat: data.lat, lng: data.lng });

    // Log current state BEFORE updates
    console.log("📍 [LocationCard] Current state BEFORE update:", {
      city: city,
      province: province,
      municipality: municipality,
      streetValue: streetValue,
      postalCodeValue: postalCodeValue,
      neighborhoodValue: neighborhoodValue,
    });

    // Store coordinates for cadastral search
    setLatitude(data.lat);
    setLongitude(data.lng);
    console.log("📍 [LocationCard] Coordinates stored:", {
      lat: data.lat,
      lng: data.lng,
    });

    // Parse the street with number from address components
    const streetWithNumber =
      data.addressComponents.streetNumber && data.addressComponents.route
        ? `${data.addressComponents.route} ${data.addressComponents.streetNumber}`
        : data.addressComponents.route ?? streetValue;

    // Update street value state
    console.log("📍 [LocationCard] Setting street to:", streetWithNumber);
    setStreetValue(streetWithNumber);

    // Update postal code if available
    if (data.addressComponents.postalCode) {
      console.log("📍 [LocationCard] Setting postalCode to:", data.addressComponents.postalCode);
      setPostalCodeValue(data.addressComponents.postalCode);
    } else {
      console.log("⚠️ [LocationCard] No postalCode in address components");
    }

    // Update neighborhood value from Google Maps if available, otherwise fetch from Nominatim
    if (data.addressComponents.sublocality) {
      console.log("📍 [LocationCard] Setting neighborhood to (from Google):", data.addressComponents.sublocality);
      setNeighborhoodValue(data.addressComponents.sublocality);
    } else {
      // Fetch neighborhood from Nominatim using coordinates
      console.log("🔄 [LocationCard] No sublocality from Google, fetching neighborhood from Nominatim...");
      const neighborhood = await getNeighborhoodFromCoordinates(
        data.lat,
        data.lng,
      );
      if (neighborhood) {
        console.log(
          "✅ [LocationCard] Neighborhood from Nominatim:",
          neighborhood,
        );
        setNeighborhoodValue(neighborhood);
      } else {
        console.log("⚠️ [LocationCard] No neighborhood found from Nominatim");
      }
    }

    // Update state variables for city, province, municipality
    console.log("📍 [LocationCard] Checking city/province/municipality from address components:");
    console.log("📍 [LocationCard] - locality:", data.addressComponents.locality);
    console.log("📍 [LocationCard] - administrativeAreaLevel1:", data.addressComponents.administrativeAreaLevel1);
    console.log("📍 [LocationCard] - administrativeAreaLevel2:", data.addressComponents.administrativeAreaLevel2);

    if (data.addressComponents.locality) {
      console.log("📍 [LocationCard] Setting city to:", data.addressComponents.locality);
      setCity(data.addressComponents.locality);
    } else {
      console.log("⚠️ [LocationCard] NO LOCALITY - city will NOT be updated!");
    }

    if (data.addressComponents.administrativeAreaLevel1) {
      console.log("📍 [LocationCard] Setting province to:", data.addressComponents.administrativeAreaLevel1);
      setProvince(data.addressComponents.administrativeAreaLevel1);
    } else {
      console.log("⚠️ [LocationCard] NO administrativeAreaLevel1 - province will NOT be updated!");
    }

    if (
      data.addressComponents.administrativeAreaLevel2 ??
      data.addressComponents.locality
    ) {
      const municipalityValue = data.addressComponents.administrativeAreaLevel2 ?? data.addressComponents.locality;
      console.log("📍 [LocationCard] Setting municipality to:", municipalityValue);
      setMunicipality(municipalityValue);
    } else {
      console.log("⚠️ [LocationCard] NO administrativeAreaLevel2 or locality - municipality will NOT be updated!");
    }

    // Mark the module as having changes
    onUpdateModule(true);

    console.log("📍 [LocationCard] ========================================");
    console.log("📍 [LocationCard] GOOGLE PLACES UPDATE COMPLETE");
    console.log("📍 [LocationCard] ========================================");

    toast.success("Dirección autocompletada. Guarda para aplicar los cambios.");
  };

  const autoCompleteAddress = async () => {
    // Get current street value from the input
    const addressDetailsInput = document.getElementById(
      "addressDetails",
    ) as HTMLInputElement;
    const currentStreetValue = streetValue.trim();

    if (!currentStreetValue) {
      alert("Por favor, introduce al menos la dirección de la propiedad.");
      return;
    }

    try {
      setIsUpdatingAddress(true);

      // Parse the address to separate street+number from details
      const addressRegex = /^(.+?)(\d+)(.*)$/;
      const addressMatch = addressRegex.exec(currentStreetValue);

      let streetWithNumber = currentStreetValue;
      let parsedDetails = addressDetailsInput?.value ?? "";
      let searchAddress = currentStreetValue;

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
      const addressString = [searchAddress, city.trim()]
        .filter(Boolean)
        .join(", ");

      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1&countrycodes=es&addressdetails=1&accept-language=es`;

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
        console.log("📍 [LocationCard] Coordinates from Nominatim stored:", {
          lat: parsedLat,
          lng: parsedLon,
        });
      }

      // Update street value state
      setStreetValue(streetWithNumber);

      // Update form fields with auto-completed data
      if (addressDetailsInput) {
        addressDetailsInput.value = parsedDetails;
      }

      if (result.address?.postcode) {
        setPostalCodeValue(result.address.postcode);
      }

      // Update neighborhood value
      const updatedNeighborhood =
        result.address?.suburb ?? result.address?.quarter ?? "";
      setNeighborhoodValue(updatedNeighborhood);

      // Get the updated location values
      const updatedCity = result.address?.city ?? result.address?.town ?? city;
      const updatedProvince = result.address?.state ?? province;
      const updatedMunicipality =
        result.address?.city ?? result.address?.town ?? municipality;

      // Update state variables for city, province, municipality
      setCity(updatedCity);
      setProvince(updatedProvince);
      setMunicipality(updatedMunicipality);

      // Log the auto-completed data
      console.log("📍 Auto-complete done! Fields populated:");
      console.log("   City:", updatedCity);
      console.log("   Province:", updatedProvince);
      console.log("   Municipality:", updatedMunicipality);
      console.log("   Neighborhood:", neighborhoodValue);

      // Mark the module as having changes so the save will trigger
      onUpdateModule(true);

      toast.success("Campos autocompletados. Guarda para aplicar los cambios.");
    } catch (error) {
      console.error("Error auto-completing address:", error);
      alert(
        "Error al autocompletar la dirección. Por favor, inténtalo de nuevo.",
      );
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  return (
    <Card
      className={cn(
        "relative p-4 transition-all duration-500 ease-out",
        getCardStyles("location"),
      )}
    >
      <ModernSaveIndicator state={saveState} onSave={handleSave} />
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onToggleSection("location")}
          className="group flex flex-1 items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              DIRECCIÓN DEL INMUEBLE
            </h3>
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsMapsPopupOpen(true);
              }}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-background hover:bg-accent hover:text-accent-foreground"
            >
              <Image
                src="https://vesta-configuration-files.s3.amazonaws.com/logos/googlemapsicon.png"
                alt="Google Maps"
                width={14}
                height={14}
                className="object-contain"
              />
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                window.open(
                  "https://www1.sedecatastro.gob.es/Cartografia/mapa.aspx?buscar=S",
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-background hover:bg-accent hover:text-accent-foreground"
              title="Abrir mapa de Catastro"
            >
              <Image
                src="https://vesta-configuration-files.s3.amazonaws.com/logos/logo-catastro.png"
                alt="Catastro"
                width={14}
                height={14}
                className="object-contain"
              />
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              collapsedSections.location && "rotate-180",
            )}
          />
        </button>
      </div>
      <div
        className={cn(
          "space-y-3 overflow-hidden transition-all duration-200",
          collapsedSections.location ? "max-h-0" : "max-h-[2000px]",
        )}
      >
        <div className="space-y-1.5">
          <Label htmlFor="street" className="text-sm">
            Calle
          </Label>
          <AddressAutocomplete
            value={streetValue}
            onChange={(value) => {
              setStreetValue(value);
              onUpdateModule(true);
            }}
            onLocationSelected={handleLocationSelected}
            placeholder="Buscar dirección..."
            disabled={!canEdit}
          />
          {/* Hidden input to maintain compatibility with parent form's DOM reading */}
          <input type="hidden" id="street" value={streetValue} readOnly />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="addressDetails" className="text-sm">
            Detalles de la dirección
          </Label>
          <Input
            id="addressDetails"
            defaultValue={listing.addressDetails}
            className="h-8 text-gray-500"
            placeholder="Piso, puerta, escalera, etc."
            onChange={() => onUpdateModule(true)}
            disabled={!canEdit}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="postalCode" className="text-sm">
              Código Postal
            </Label>
            <Input
              id="postalCode"
              value={postalCodeValue}
              onChange={(e) => {
                setPostalCodeValue(e.target.value);
                onUpdateModule(true);
              }}
              className="h-8 text-gray-500"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="neighborhood" className="text-sm">
              Barrio
            </Label>
            <div className="relative">
              <NeighborhoodAutocomplete
                value={neighborhoodValue}
                onChange={(value) => {
                  setNeighborhoodValue(value);
                  onUpdateModule(true);
                }}
                onNeighborhoodSelected={(result: NeighborhoodResult) => {
                  console.log("📍 [LocationCard] Neighborhood selected from DB:", result);
                  // Auto-fill city, municipality, and province from the selected neighborhood
                  setCity(result.city);
                  setMunicipality(result.municipality);
                  setProvince(result.province);
                  onUpdateModule(true);
                  toast.success(
                    `Barrio "${result.neighborhood}" seleccionado. Ciudad, municipio y provincia actualizados.`,
                  );
                }}
                placeholder="Buscar barrio..."
                className="pr-10"
                disabled={!canEdit}
              />
              {/* Hidden input to maintain compatibility with parent form's DOM reading */}
              <input type="hidden" id="neighborhood" value={neighborhoodValue} readOnly />
              <button
                type="button"
                onClick={autoCompleteAddress}
                disabled={!canEdit || isUpdatingAddress}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md bg-background hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
                title="Autocompletar desde Nominatim"
              >
                {isUpdatingAddress ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-sm">
              Ciudad
            </Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                onUpdateModule(true);
              }}
              className="h-8 text-gray-500"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="municipality" className="text-sm">
              Municipio
            </Label>
            <Input
              id="municipality"
              value={municipality}
              onChange={(e) => {
                setMunicipality(e.target.value);
                onUpdateModule(true);
              }}
              className="h-8 text-gray-500"
              disabled={!canEdit}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="province" className="text-sm">
            Provincia
          </Label>
          <Input
            id="province"
            value={province}
            onChange={(e) => {
              setProvince(e.target.value);
              onUpdateModule(true);
            }}
            className="h-8 text-gray-500"
            disabled={!canEdit}
          />
        </div>

        {/* Street Type (local) or Access Type (solar) */}
        {(propertyType === "local" || propertyType === "solar") && (
          <div className="space-y-1.5">
            <Label htmlFor="streetType" className="text-sm">
              {propertyType === "solar" ? "Tipo de acceso" : "Tipo de Calle"}
            </Label>
            <Select
              value={streetType}
              onValueChange={(value) => {
                setStreetType(value);
                onUpdateModule(true);
              }}
              disabled={!canEdit}
            >
              <SelectTrigger className="h-8 text-gray-500">
                <SelectValue
                  placeholder={
                    propertyType === "solar"
                      ? "Seleccionar tipo de acceso"
                      : "Seleccionar tipo de calle"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {propertyType === "solar"
                  ? ACCESS_TYPE_VALUES.map((value) => (
                      <SelectItem key={value} value={value} className="text-xs">
                        {ACCESS_TYPE_LABELS[value]}
                      </SelectItem>
                    ))
                  : STREET_TYPE_VALUES.map((value) => (
                      <SelectItem key={value} value={value} className="text-xs">
                        {STREET_TYPE_LABELS[value]}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Distance to urban center - only for solar */}
        {propertyType === "solar" && (
          <div className="space-y-1.5">
            <Label htmlFor="nearestLocationKm" className="text-sm">
              Distancia al núcleo urbano (km)
            </Label>
            <Input
              id="nearestLocationKm"
              type="number"
              value={nearestLocationKm ?? ""}
              onChange={(e) => {
                const value =
                  e.target.value === "" ? null : parseFloat(e.target.value);
                setNearestLocationKm?.(
                  value !== null && isNaN(value) ? null : value,
                );
                onUpdateModule(true);
              }}
              className="h-8 text-gray-500"
              min="0"
              step="0.1"
              placeholder="0"
              disabled={!canEdit}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="cadastralReference" className="text-sm">
            Referencia Catastral
          </Label>
          <div className="relative">
            <Input
              id="cadastralReference"
              type="text"
              value={cadastralReferenceValue}
              onChange={(e) => {
                setCadastralReferenceValue(e.target.value);
                onUpdateModule(true);
              }}
              className={cn(
                "h-8 pr-20 text-gray-500",
                cadastralValidationStatus === "invalid" &&
                  cadastralDiscrepancies &&
                  "border-amber-500 focus:border-amber-500",
                cadastralValidationStatus === "valid" &&
                  "border-green-500 focus:border-green-500",
              )}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value) {
                  void validateCadastralReference(value);
                } else {
                  setCadastralDiscrepancies(null);
                  setCadastralValidationStatus("none");
                }
              }}
              disabled={!canEdit}
            />

            {/* Loading spinner centered in input */}
            {cadastralValidationStatus === "validating" && (
              <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/50">
                <Loader className="h-5 w-5 animate-spin text-blue-500" />
              </div>
            )}

            {/* Success indicator */}
            {cadastralValidationStatus === "valid" && (
              <div className="absolute right-8 top-1/2 -translate-y-1/2">
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            )}

            {/* Conditional button: Search (lupa) when empty and has coordinates, Catastro logo when filled */}
            {!cadastralReferenceValue.trim() &&
            latitude !== null &&
            longitude !== null ? (
              /* Search button for cadastral references (when field is empty but has coordinates) */
              <button
                type="button"
                onClick={searchCadastralReferences}
                disabled={!canEdit || isSearching}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded bg-background hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
                title="Buscar referencias catastrales por coordenadas"
              >
                {isSearching ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </button>
            ) : cadastralReferenceValue.trim() ? (
              /* Single Catastro button that opens action modal */
              <button
                type="button"
                onClick={() => setIsActionModalOpen(true)}
                disabled={!canEdit || isCadastralLoading}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded bg-background hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
                title="Opciones de Catastro"
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
        </div>

        {/* Hidden input fields for coordinates */}
        <input type="hidden" id="latitude" value={latitude ?? ""} readOnly />
        <input type="hidden" id="longitude" value={longitude ?? ""} readOnly />
      </div>

      {/* Cadastral Selection Modal (two-step: parcels → units) */}
      <CadastralSelectionModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        parcels={potentialParcels}
        isLoading={isSearching}
        onSelect={handleCadastralReferenceSelect}
        onExpandParcel={handleExpandParcel}
      />

      {/* Cadastral Action Modal */}
      <CadastralActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onValidateData={handleCadastralLookup}
        onOpenCadastralMap={handleOpenCadastralMap}
        cadastralReference={cadastralReferenceValue}
      />

      {/* Cadastral Corrections Modal */}
      <CadastralCorrectionsModal
        isOpen={isCorrectionsModalOpen}
        onClose={() => setIsCorrectionsModalOpen(false)}
        discrepancies={cadastralDiscrepancies?.differences ?? []}
        onApplyField={applyFieldSuggestion}
        onApplyAll={applyAllSuggestions}
      />
    </Card>
  );
}
