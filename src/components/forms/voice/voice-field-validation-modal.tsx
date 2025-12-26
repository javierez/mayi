"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Loader2, Plus, User, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import type {
  ExtractedFieldResult,
  EnhancedExtractedPropertyData,
} from "~/types/textract-enhanced";
import { saveVoiceProperty } from "~/server/queries/forms/voice/save-voice-property";
import { searchContactsForFormWithAuth } from "~/server/queries/contact";
import { QuickContactModal } from "~/components/contactos/quick-contact-modal";
import {
  AddressAutocomplete,
  type LocationData,
} from "~/components/propiedades/form/address-autocomplete";
import { getNeighborhoodFromCoordinates } from "~/server/googlemaps/retrieve_geo";

// Location-related fields that will be grouped in the address section
const LOCATION_FIELDS = [
  "street",
  "addressDetails",
  "postalCode",
  "extractedCity",
  "extractedProvince",
  "latitude",
  "longitude",
  "neighborhood",
  "municipality",
];

// Type definitions for contact selection
interface Contact {
  id: number;
  name: string;
}

interface NewContact {
  contactId: number | string;
  firstName: string;
  lastName: string;
}

// Spanish field labels mapping
const FIELD_LABELS: Record<string, string> = {
  // Basic Information
  title: "Título",
  description: "Descripción",
  propertyType: "Tipo de Propiedad",
  propertySubtype: "Subtipo",

  // Specifications
  bedrooms: "Dormitorios",
  bathrooms: "Baños",
  squareMeter: "Metros Cuadrados",
  yearBuilt: "Año de Construcción",
  builtSurfaceArea: "Superficie Construida",
  conservationStatus: "Estado de Conservación",
  buildingFloors: "Plantas del Edificio",

  // Location
  street: "Dirección",
  addressDetails: "Detalles de Dirección",
  postalCode: "Código Postal",
  extractedCity: "Ciudad",
  extractedProvince: "Provincia",
  cadastralReference: "Referencia Catastral",
  streetType: "Tipo de Calle",

  // Energy & Heating
  energyConsumptionScale: "Certificado Energético",
  energyConsumptionValue: "Consumo Energético",
  emissionsScale: "Escala de Emisiones",
  emissionsValue: "Valor de Emisiones",
  hasHeating: "Calefacción",
  heatingType: "Tipo de Calefacción",
  airConditioningType: "Aire Acondicionado",

  // Basic Amenities
  hasElevator: "Ascensor",
  hasGarage: "Garaje",
  hasStorageRoom: "Trastero",
  garageType: "Tipo de Garaje",
  garageSpaces: "Plazas de Garaje",
  garageInBuilding: "Garaje en Edificio",
  elevatorToGarage: "Ascensor a Garaje",
  garageNumber: "Número de Plaza",
  storageRoomNumber: "Número de Trastero",
  storageRoomSize: "Tamaño Trastero",

  // Features
  terrace: "Terraza",
  terraceSize: "Tamaño Terraza",
  pool: "Piscina",
  garden: "Jardín",
  gym: "Gimnasio",
  communityPool: "Piscina Comunitaria",
  privatePool: "Piscina Privada",
  sportsArea: "Zona Deportiva",
  childrenArea: "Zona Infantil",
  tennisCourt: "Pista de Tenis",
  nearbyPublicTransport: "Transporte Público Cercano",

  // Property Characteristics
  furnished: "Amueblado",
  brandNew: "Nuevo",
  needsRenovation: "Necesita Reforma",
  newConstruction: "Obra Nueva",
  underConstruction: "En Construcción",
  lastRenovationYear: "Año Última Reforma",
  disabledAccessible: "Accesible",
  vpo: "VPO",
  videoIntercom: "Videoportero",
  conciergeService: "Portero",
  securityGuard: "Vigilancia",
  alarm: "Alarma",
  securityDoor: "Puerta Blindada",
  doubleGlazing: "Doble Acristalamiento",

  // Views & Location
  exterior: "Exterior",
  bright: "Luminoso",
  views: "Vistas",
  mountainViews: "Vistas Montaña",
  seaViews: "Vistas Mar",
  beachfront: "Primera Línea de Playa",
  orientation: "Orientación",

  // Interior Spaces
  sauna: "Sauna",
  patio: "Patio",
  suiteBathroom: "Baño en Suite",
  communityArea: "Zona Comunitaria",
  satelliteDish: "Antena Parabólica",
  wineCellar: "Bodega",
  wineCellarSize: "Tamaño Bodega",
  livingRoomSize: "Tamaño Salón",
  balconyCount: "Balcones",
  galleryCount: "Galerías",
  builtInWardrobes: "Armarios Empotrados",
  mainFloorType: "Tipo de Suelo",
  shutterType: "Tipo de Persiana",
  carpentryType: "Tipo de Carpintería",
  windowType: "Tipo de Ventana",

  // Kitchen
  kitchenType: "Tipo de Cocina",
  hotWaterType: "Tipo Agua Caliente",
  openKitchen: "Cocina Americana",
  frenchKitchen: "Cocina Francesa",
  furnishedKitchen: "Cocina Amueblada",
  pantry: "Despensa",

  // Luxury Amenities
  jacuzzi: "Jacuzzi",
  hydromassage: "Hidromasaje",
  homeAutomation: "Domótica",
  musicSystem: "Sistema de Música",
  laundryRoom: "Lavadero",
  coveredClothesline: "Tendedero Cubierto",
  fireplace: "Chimenea",

  // Appliances
  oven: "Horno",
  microwave: "Microondas",
  washingMachine: "Lavadora",
  fridge: "Frigorífico",
  tv: "Televisión",
  dishwasher: "Lavavajillas",
  stoneware: "Vajilla",
  appliancesIncluded: "Electrodomésticos Incluidos",
  secadora: "Secadora",

  // Expenses & Taxes
  ibi: "IBI",
  garbageTax: "Tasa de Basuras",
  communityFees: "Cuota Comunidad",
  derrama: "Derrama",
  vadoPermanente: "Vado Permanente",
  electricityEstimate: "Estimación Luz",
  gasEstimate: "Estimación Gas",
  waterEstimate: "Estimación Agua",
  centralHeatingFee: "Cuota Calefacción Central",
  internetEstimate: "Estimación Internet",
  homeInsurance: "Seguro Hogar",

  // Listing Details
  price: "Precio",
  listingType: "Tipo de Operación",
  isFurnished: "Amueblado",
  furnitureQuality: "Calidad Mobiliario",
  optionalGarage: "Garaje Opcional",
  optionalGaragePrice: "Precio Garaje Opcional",
  optionalStorageRoom: "Trastero Opcional",
  optionalStorageRoomPrice: "Precio Trastero Opcional",
  hasKeys: "Con Llaves",
  petsAllowed: "Mascotas Permitidas",
  studentFriendly: "Para Estudiantes",
  internet: "Internet",
  isBankOwned: "Propiedad de Banco",
  encargo: "Encargo Firmado",

  // Rental Details
  rentalType: "Tipo de Alquiler",
  securityDeposit: "Fianza",
  additionalGuarantee: "Garantía Adicional",
  bankGuaranteeRequired: "Aval Bancario Requerido",
  managementFees: "Gastos de Gestión",
  nonPaymentInsurance: "Seguro de Impago",
  nonPaymentInsuranceAmount: "Coste Seguro Impago",
  occupationStatus: "Estado de Ocupación",
  priceReferenceIndex: "Índice de Referencia",
  shortTermLicense: "Licencia Turística",

  // Commercial/Industrial
  isDiafano: "Diáfano",
  hasEscaparate: "Escaparate",
  locatedAtCorner: "En Esquina",
  ubication: "Ubicación Local",
  facadeArea: "Metros de Fachada",
  windowsNumber: "Número Escaparates",
  bridgeCrane: "Puente Grúa",
  smokeExtraction: "Extracción de Humos",
  loadingArea: "Zona de Carga",
  allowedUse: "Uso Permitido",

  // Land/Finca
  finca: "Finca",
  superficieFinca: "Superficie Finca",
  hasRoadAccess: "Acceso por Carretera",
  hasSewerage: "Alcantarillado",
  hasSidewalk: "Acera",
  hasStreetLighting: "Alumbrado Público",

  // Infrastructure
  electricityType: "Tipo Instalación Eléctrica",
  electricityStatus: "Estado Instalación Eléctrica",
  plumbingType: "Tipo Fontanería",
  plumbingStatus: "Estado Fontanería",
};

interface VoiceFieldValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedFields: ExtractedFieldResult[];
  onConfirm: (confirmedData: EnhancedExtractedPropertyData) => void;
}

export function VoiceFieldValidationModal({
  isOpen,
  onClose,
  extractedFields,
  onConfirm,
}: VoiceFieldValidationModalProps) {
  // Initialize all fields as checked
  const [checkedFields, setCheckedFields] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Contact selection state
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [showContactPopup, setShowContactPopup] = useState(false);

  // Address autocomplete state
  const [addressValue, setAddressValue] = useState("");
  const [locationData, setLocationData] = useState<{
    street?: string;
    addressDetails?: string; // Floor, door letter (e.g., "3º B")
    postalCode?: string;
    city?: string;
    province?: string;
    neighborhood?: string;
    latitude?: number;
    longitude?: number;
  }>({});
  const [isLoadingNeighborhood, setIsLoadingNeighborhood] = useState(false);

  // Initialize checked fields when modal opens or fields change
  useEffect(() => {
    if (isOpen && extractedFields.length > 0) {
      const allFieldIds = extractedFields.map(
        (field) => `${field.dbTable}.${field.dbColumn}`,
      );
      setCheckedFields(new Set(allFieldIds));
    }
  }, [isOpen, extractedFields]);

  // Initialize address from extracted fields when modal opens
  useEffect(() => {
    if (isOpen && extractedFields.length > 0) {
      const streetField = extractedFields.find((f) => f.dbColumn === "street");
      const addressDetailsField = extractedFields.find((f) => f.dbColumn === "addressDetails");
      const postalCodeField = extractedFields.find((f) => f.dbColumn === "postalCode");
      const cityField = extractedFields.find((f) => f.dbColumn === "extractedCity");
      const provinceField = extractedFields.find((f) => f.dbColumn === "extractedProvince");
      const neighborhoodField = extractedFields.find((f) => f.dbColumn === "neighborhood");
      const latField = extractedFields.find((f) => f.dbColumn === "latitude");
      const lngField = extractedFields.find((f) => f.dbColumn === "longitude");

      const street = streetField?.value as string | undefined;
      if (street) {
        setAddressValue(street);
      }

      setLocationData({
        street: street,
        addressDetails: addressDetailsField?.value as string | undefined,
        postalCode: postalCodeField?.value as string | undefined,
        city: cityField?.value as string | undefined,
        province: provinceField?.value as string | undefined,
        neighborhood: neighborhoodField?.value as string | undefined,
        latitude: latField?.value as number | undefined,
        longitude: lngField?.value as number | undefined,
      });
    }
  }, [isOpen, extractedFields]);

  // Handle Google Places autocomplete selection
  const handleLocationSelected = async (data: LocationData) => {
    console.log("📍 [VoiceValidation] Google Places location selected:", data);

    // Parse street with number
    const streetWithNumber =
      data.addressComponents.streetNumber && data.addressComponents.route
        ? `${data.addressComponents.route} ${data.addressComponents.streetNumber}`
        : data.addressComponents.route ?? addressValue;

    setAddressValue(streetWithNumber);

    // Get neighborhood from Nominatim if not available from Google
    let neighborhood = data.addressComponents.sublocality;
    if (!neighborhood) {
      console.log("🔄 [VoiceValidation] Fetching neighborhood from Nominatim...");
      setIsLoadingNeighborhood(true);
      try {
        const nominatimNeighborhood = await getNeighborhoodFromCoordinates(
          data.lat,
          data.lng,
        );
        if (nominatimNeighborhood) {
          console.log("✅ [VoiceValidation] Neighborhood from Nominatim:", nominatimNeighborhood);
          neighborhood = nominatimNeighborhood;
        }
      } catch (error) {
        console.error("❌ [VoiceValidation] Error fetching neighborhood:", error);
      } finally {
        setIsLoadingNeighborhood(false);
      }
    }

    // Update location data (including addressDetails/subpremise for floor/door)
    const newLocationData = {
      street: streetWithNumber,
      addressDetails: data.addressComponents.subpremise ?? locationData.addressDetails,
      postalCode: data.addressComponents.postalCode ?? locationData.postalCode,
      city: data.addressComponents.locality ?? locationData.city,
      province: data.addressComponents.administrativeAreaLevel1 ?? locationData.province,
      neighborhood: neighborhood ?? locationData.neighborhood,
      latitude: data.lat,
      longitude: data.lng,
    };
    setLocationData(newLocationData);

    toast.success("Dirección actualizada desde Google Maps");
  };

  // Debounced contact search
  const performContactSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await searchContactsForFormWithAuth(query, 6);
      setSearchResults(
        results.map((contact) => ({
          id: Number(contact.id),
          name: contact.name,
        })),
      );
    } catch (error) {
      console.error("Error searching contacts:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input with debouncing
  const handleContactSearchChange = useCallback(
    (value: string) => {
      setContactSearch(value);

      // Clear existing timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Set new timeout for debounced search
      const timeout = setTimeout(() => {
        void performContactSearch(value);
      }, 300);

      setSearchTimeout(timeout);
    },
    [searchTimeout, performContactSearch],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Helper function to toggle contact selection
  const toggleContact = (contactId: string) => {
    if (selectedContactIds.includes(contactId)) {
      setSelectedContactIds(
        selectedContactIds.filter((id) => id !== contactId),
      );
    } else {
      setSelectedContactIds([...selectedContactIds, contactId]);
    }
  };

  const handleContactCreated = (contact: unknown) => {
    console.log("New contact created:", contact);

    // Type guard to check if contact has the expected properties
    const isValidContact = (obj: unknown): obj is NewContact => {
      return (
        typeof obj === "object" &&
        obj !== null &&
        "contactId" in obj &&
        "firstName" in obj &&
        "lastName" in obj
      );
    };

    // Immediately add the new contact to search results for instant UI update
    if (isValidContact(contact)) {
      const newContactForList: Contact = {
        id: Number(contact.contactId),
        name: `${contact.firstName} ${contact.lastName}`,
      };

      setSearchResults((prev) => [newContactForList, ...prev].slice(0, 6));

      // Auto-select the new contact
      setSelectedContactIds([
        ...selectedContactIds,
        contact.contactId.toString(),
      ]);
    }
  };

  // Format field value for display
  const formatFieldValue = (field: ExtractedFieldResult) => {
    if (typeof field.value === "boolean") {
      return field.value ? "Sí" : "No";
    }

    if (field.dbColumn === "price" && typeof field.value === "number") {
      return field.value.toLocaleString("es-ES", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
      });
    }

    if (
      (field.dbColumn === "squareMeter" ||
        field.dbColumn === "builtSurfaceArea") &&
      typeof field.value === "number"
    ) {
      return `${field.value} m²`;
    }

    if (field.dbColumn === "bedrooms" && typeof field.value === "number") {
      return `${field.value} dormitorio${field.value !== 1 ? "s" : ""}`;
    }

    if (field.dbColumn === "bathrooms" && typeof field.value === "number") {
      return `${field.value} baño${field.value !== 1 ? "s" : ""}`;
    }

    if (field.dbColumn === "yearBuilt" && typeof field.value === "number") {
      return `Año ${field.value}`;
    }

    if (field.dbColumn === "listingType" && typeof field.value === "string") {
      const typeMap: Record<string, string> = {
        Sale: "Venta",
        Rent: "Alquiler",
        RentWithOption: "Alquiler con Opción",
        Transfer: "Traspaso",
        RoomSharing: "Compartir Habitación",
      };
      return typeMap[field.value] ?? field.value;
    }

    if (field.dbColumn === "propertyType" && typeof field.value === "string") {
      const typeMap: Record<string, string> = {
        piso: "Piso",
        casa: "Casa",
        chalet: "Chalet",
        apartamento: "Apartamento",
        local: "Local",
        garaje: "Garaje",
        estudio: "Estudio",
        loft: "Loft",
        dúplex: "Dúplex",
        ático: "Ático",
      };
      return typeMap[field.value] ?? field.value;
    }

    if (
      field.dbColumn === "energyConsumptionScale" &&
      typeof field.value === "string"
    ) {
      return `Certificado ${field.value}`;
    }

    if (
      field.dbColumn === "conservationStatus" &&
      typeof field.value === "number"
    ) {
      const statusMap: Record<number, string> = {
        1: "Excelente",
        2: "Bueno",
        3: "Regular",
        4: "Malo",
        6: "Obra Nueva",
      };
      return statusMap[field.value] ?? field.value.toString();
    }

    if (field.dbColumn === "orientation" && typeof field.value === "string") {
      const orientationMap: Record<string, string> = {
        norte: "Norte",
        sur: "Sur",
        este: "Este",
        oeste: "Oeste",
        noreste: "Noreste",
        noroeste: "Noroeste",
        sureste: "Sureste",
        suroeste: "Suroeste",
      };
      return orientationMap[field.value] ?? field.value;
    }

    if (field.dbColumn === "streetType" && typeof field.value === "string") {
      const streetTypeMap: Record<string, string> = {
        muy_transitada: "Muy Transitada",
        transitada: "Transitada",
        moderada: "Moderada",
        poco_transitada: "Poco Transitada",
      };
      return streetTypeMap[field.value] ?? field.value;
    }

    if (field.dbColumn === "heatingType" && typeof field.value === "string") {
      const heatingMap: Record<string, string> = {
        individual: "Individual",
        centralizado: "Centralizado",
        gas: "Gas",
        eléctrico: "Eléctrico",
        electrico: "Eléctrico",
        no: "Sin Calefacción",
      };
      return heatingMap[field.value] ?? field.value;
    }

    if (field.dbColumn === "airConditioningType" && typeof field.value === "string") {
      const acMap: Record<string, string> = {
        individual: "Individual",
        centralizado: "Centralizado",
        no: "Sin Aire Acondicionado",
      };
      return acMap[field.value] ?? field.value;
    }

    if (field.dbColumn === "furnitureQuality" && typeof field.value === "string") {
      const qualityMap: Record<string, string> = {
        basic: "Básico",
        standard: "Estándar",
        high: "Alta Calidad",
        luxury: "Lujo",
      };
      return qualityMap[field.value] ?? field.value;
    }

    if (field.dbColumn === "rentalType" && typeof field.value === "string") {
      const rentalMap: Record<string, string> = {
        residential: "Larga Temporada",
        seasonal: "Temporada",
        short_term: "Corta Estancia",
      };
      return rentalMap[field.value] ?? field.value;
    }

    if (field.dbColumn === "occupationStatus" && typeof field.value === "string") {
      const occupationMap: Record<string, string> = {
        free: "Libre",
        tenanted: "Alquilado",
        bare_ownership: "Nuda Propiedad",
        illegally_occupied: "Ocupado Ilegalmente",
      };
      return occupationMap[field.value] ?? field.value;
    }

    if (field.dbColumn === "ubication" && typeof field.value === "string") {
      const ubicationMap: Record<string, string> = {
        on_top_floor: "Última Planta",
        shopping: "Centro Comercial",
        street: "A Pie de Calle",
        mezzanine: "Entreplanta",
        belowGround: "Sótano",
        other: "Otro",
      };
      return ubicationMap[field.value] ?? field.value;
    }

    if (field.dbColumn === "kitchenType" && typeof field.value === "string") {
      const kitchenMap: Record<string, string> = {
        gas: "Gas",
        induccion: "Inducción",
        vitroceramica: "Vitrocerámica",
        carbon: "Carbón",
        electrico: "Eléctrico",
        mixto: "Mixto",
      };
      return kitchenMap[field.value] ?? field.value;
    }

    if (field.dbColumn === "electricityType" && typeof field.value === "string") {
      const elecMap: Record<string, string> = {
        monofasica: "Monofásica",
        trifasica: "Trifásica",
        mixta: "Mixta",
      };
      return elecMap[field.value] ?? field.value;
    }

    if (
      (field.dbColumn === "electricityStatus" || field.dbColumn === "plumbingStatus") &&
      typeof field.value === "string"
    ) {
      const statusMap: Record<string, string> = {
        nuevo: "Nuevo",
        buen_estado: "Buen Estado",
        funcional: "Funcional",
        necesita_actualizacion: "Necesita Actualización",
        necesita_reparacion: "Necesita Reparación",
        tiene_fugas: "Tiene Fugas",
      };
      return statusMap[field.value] ?? field.value;
    }

    if (field.dbColumn === "plumbingType" && typeof field.value === "string") {
      const plumbingMap: Record<string, string> = {
        cobre: "Cobre",
        pvc: "PVC",
        multicapa: "Multicapa",
        galvanizado: "Galvanizado",
        mixto: "Mixto",
      };
      return plumbingMap[field.value] ?? field.value;
    }

    // Format currency fields
    if (
      (field.dbColumn === "ibi" ||
        field.dbColumn === "garbageTax" ||
        field.dbColumn === "communityFees" ||
        field.dbColumn === "derrama" ||
        field.dbColumn === "securityDeposit" ||
        field.dbColumn === "additionalGuarantee" ||
        field.dbColumn === "optionalGaragePrice" ||
        field.dbColumn === "optionalStorageRoomPrice") &&
      typeof field.value === "number"
    ) {
      return field.value.toLocaleString("es-ES", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
      });
    }

    // Format size fields
    if (
      (field.dbColumn === "terraceSize" ||
        field.dbColumn === "storageRoomSize" ||
        field.dbColumn === "wineCellarSize" ||
        field.dbColumn === "livingRoomSize" ||
        field.dbColumn === "superficieFinca" ||
        field.dbColumn === "facadeArea") &&
      typeof field.value === "number"
    ) {
      return `${field.value} m²`;
    }

    return String(field.value);
  };

  // Handle checkbox toggle
  const handleCheckboxChange = (fieldId: string, checked: boolean) => {
    setCheckedFields((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(fieldId);
      } else {
        newSet.delete(fieldId);
      }
      return newSet;
    });
  };

  // Build final data object with only checked fields + address autocomplete data
  const buildConfirmedData = (): EnhancedExtractedPropertyData => {
    const data: EnhancedExtractedPropertyData = {};

    // Add non-location fields from extracted data
    extractedFields.forEach((field) => {
      const fieldId = `${field.dbTable}.${field.dbColumn}`;
      if (
        checkedFields.has(fieldId) &&
        field.dbTable === "properties" &&
        !LOCATION_FIELDS.includes(field.dbColumn)
      ) {
        (data as Record<string, unknown>)[field.dbColumn] = field.value;
      }
    });

    // Add location data from address autocomplete (always include if available)
    if (locationData.street) {
      data.street = locationData.street;
    }
    if (locationData.postalCode) {
      data.postalCode = locationData.postalCode;
    }
    if (locationData.latitude !== undefined) {
      data.latitude = locationData.latitude;
    }
    if (locationData.longitude !== undefined) {
      data.longitude = locationData.longitude;
    }

    return data;
  };

  // Build fields to save including location data from address autocomplete
  const buildFieldsToSave = (): ExtractedFieldResult[] => {
    // Filter non-location fields that are checked
    const nonLocationFields = extractedFields.filter((field) => {
      const fieldId = `${field.dbTable}.${field.dbColumn}`;
      return (
        checkedFields.has(fieldId) && !LOCATION_FIELDS.includes(field.dbColumn)
      );
    });

    // Create location field results from address autocomplete data
    const locationFields: ExtractedFieldResult[] = [];

    if (locationData.street) {
      locationFields.push({
        dbColumn: "street",
        dbTable: "properties",
        value: locationData.street,
        originalText: locationData.street,
        confidence: 100,
        extractionSource: "nominatim_geocoding",
        fieldType: "string",
      });
    }

    if (locationData.addressDetails) {
      locationFields.push({
        dbColumn: "addressDetails",
        dbTable: "properties",
        value: locationData.addressDetails,
        originalText: locationData.addressDetails,
        confidence: 100,
        extractionSource: "nominatim_geocoding",
        fieldType: "string",
      });
    }

    if (locationData.postalCode) {
      locationFields.push({
        dbColumn: "postalCode",
        dbTable: "properties",
        value: locationData.postalCode,
        originalText: locationData.postalCode,
        confidence: 100,
        extractionSource: "nominatim_geocoding",
        fieldType: "string",
      });
    }

    if (locationData.city) {
      locationFields.push({
        dbColumn: "extractedCity",
        dbTable: "properties",
        value: locationData.city,
        originalText: locationData.city,
        confidence: 100,
        extractionSource: "nominatim_geocoding",
        fieldType: "string",
      });
    }

    if (locationData.province) {
      locationFields.push({
        dbColumn: "extractedProvince",
        dbTable: "properties",
        value: locationData.province,
        originalText: locationData.province,
        confidence: 100,
        extractionSource: "nominatim_geocoding",
        fieldType: "string",
      });
    }

    if (locationData.neighborhood) {
      locationFields.push({
        dbColumn: "neighborhood",
        dbTable: "properties",
        value: locationData.neighborhood,
        originalText: locationData.neighborhood,
        confidence: 100,
        extractionSource: "nominatim_geocoding",
        fieldType: "string",
      });
    }

    if (locationData.latitude !== undefined) {
      locationFields.push({
        dbColumn: "latitude",
        dbTable: "properties",
        value: locationData.latitude,
        originalText: String(locationData.latitude),
        confidence: 100,
        extractionSource: "nominatim_geocoding",
        fieldType: "decimal",
      });
    }

    if (locationData.longitude !== undefined) {
      locationFields.push({
        dbColumn: "longitude",
        dbTable: "properties",
        value: locationData.longitude,
        originalText: String(locationData.longitude),
        confidence: 100,
        extractionSource: "nominatim_geocoding",
        fieldType: "decimal",
      });
    }

    return [...nonLocationFields, ...locationFields];
  };

  // Handle confirm and create property
  const handleConfirm = async () => {
    setIsLoading(true);

    try {
      // Validate contact selection
      if (selectedContactIds.length === 0) {
        toast.error("Por favor, selecciona al menos un contacto.");
        setIsLoading(false);
        return;
      }

      // Build fields to save (non-location fields + address autocomplete data)
      const fieldsToSave = buildFieldsToSave();

      // Save property with voice data and contact IDs
      const result = await saveVoiceProperty(fieldsToSave, selectedContactIds);

      if (result.success && result.propertyId) {
        toast.success("Propiedad creada exitosamente");

        // Call the original onConfirm for compatibility
        const confirmedData = buildConfirmedData();
        onConfirm(confirmedData);

        // Redirect to property detail page
        if (result.listingId) {
          router.push(`/propiedades/${result.listingId}`);
        } else {
          router.push("/propiedades");
        }
      } else {
        toast.error(result.error ?? "Error al crear la propiedad");
      }
    } catch (error) {
      console.error("Error creating property:", error);
      toast.error("Error al crear la propiedad");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-lg font-medium">
            Campos identificados
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto">
          {/* Contact Selection Section */}
        <div className="space-y-3 border-b pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium text-gray-900">Contactos</h3>
            <Button
              variant="outline"
              size="sm"
              className="flex h-8 items-center space-x-2"
              onClick={() => setShowContactPopup(true)}
            >
              <Plus className="h-3 w-3" />
              <span>Agregar</span>
            </Button>
          </div>

          {/* Contact Search */}
          <Input
            placeholder="Escribe para buscar contactos..."
            value={contactSearch}
            onChange={(e) => handleContactSearchChange(e.target.value)}
            className="h-10 border-0 shadow-md"
          />

          {/* Contact List */}
          <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg p-2 shadow-md">
            {isSearching ? (
              <p className="py-3 text-center text-sm text-gray-500">
                Buscando contactos...
              </p>
            ) : searchResults.length === 0 && contactSearch.trim() ? (
              <p className="py-3 text-center text-sm text-gray-500">
                No se encontraron contactos
              </p>
            ) : searchResults.length === 0 ? (
              <p className="py-3 text-center text-sm text-gray-500">
                Escribe para buscar contactos
              </p>
            ) : (
              searchResults.map((contact: Contact) => (
                <div
                  key={contact.id}
                  className={cn(
                    "flex cursor-pointer items-center space-x-2 rounded-md p-2 transition-colors",
                    selectedContactIds.includes(contact.id.toString())
                      ? "bg-gray-100"
                      : "hover:bg-gray-50",
                  )}
                  onClick={() => toggleContact(contact.id.toString())}
                >
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">{contact.name}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Address Section with Google Places Autocomplete */}
        <div className="space-y-3 border-b pb-4">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <h3 className="text-md font-medium text-gray-900">Dirección</h3>
            {isLoadingNeighborhood && (
              <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
            )}
          </div>

          {/* Address Autocomplete */}
          <AddressAutocomplete
            value={addressValue}
            onChange={(value) => {
              setAddressValue(value);
              setLocationData((prev) => ({ ...prev, street: value }));
            }}
            onLocationSelected={handleLocationSelected}
            placeholder="Buscar dirección..."
            className="h-10 border border-gray-200 shadow-md"
          />

          {/* Floor/Door Input */}
          <Input
            placeholder="Piso, puerta (ej: 3º B)"
            value={locationData.addressDetails ?? ""}
            onChange={(e) =>
              setLocationData((prev) => ({
                ...prev,
                addressDetails: e.target.value,
              }))
            }
            className="h-10 border border-gray-200 shadow-md"
          />

          {/* Location Data Display */}
          {(locationData.postalCode ??
            locationData.city ??
            locationData.province ??
            locationData.neighborhood) && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {locationData.postalCode && (
                <div className="rounded-md bg-gray-50 px-3 py-2">
                  <span className="text-xs text-gray-500">Código Postal</span>
                  <p className="font-medium text-gray-900">
                    {locationData.postalCode}
                  </p>
                </div>
              )}
              {locationData.city && (
                <div className="rounded-md bg-gray-50 px-3 py-2">
                  <span className="text-xs text-gray-500">Ciudad</span>
                  <p className="font-medium text-gray-900">
                    {locationData.city}
                  </p>
                </div>
              )}
              {locationData.province && (
                <div className="rounded-md bg-gray-50 px-3 py-2">
                  <span className="text-xs text-gray-500">Provincia</span>
                  <p className="font-medium text-gray-900">
                    {locationData.province}
                  </p>
                </div>
              )}
              {locationData.neighborhood && (
                <div className="rounded-md bg-gray-50 px-3 py-2">
                  <span className="text-xs text-gray-500">Barrio</span>
                  <p className="font-medium text-gray-900">
                    {locationData.neighborhood}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Coordinates indicator */}
          {locationData.latitude !== undefined &&
            locationData.longitude !== undefined && (
              <div className="flex items-center space-x-1 text-xs text-green-600">
                <Check className="h-3 w-3" />
                <span>Coordenadas identificadas</span>
              </div>
            )}
        </div>

        {/* Fields Checklist (excluding location fields) */}
        <div className="py-4">
          {extractedFields.filter((f) => !LOCATION_FIELDS.includes(f.dbColumn))
            .length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No se encontraron campos adicionales
            </div>
          ) : (
            <div className="space-y-2">
              {extractedFields
                .filter((field) => !LOCATION_FIELDS.includes(field.dbColumn))
                .map((field) => {
                  const fieldId = `${field.dbTable}.${field.dbColumn}`;
                  const isChecked = checkedFields.has(fieldId);

                  return (
                    <div
                      key={fieldId}
                      className="flex items-center space-x-3 rounded-lg bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100"
                    >
                      <Checkbox
                        id={fieldId}
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(fieldId, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={fieldId}
                        className="flex flex-1 cursor-pointer items-center justify-between"
                      >
                        <span className="text-sm font-normal text-gray-600">
                          {FIELD_LABELS[field.dbColumn] ?? field.dbColumn}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatFieldValue(field)}
                        </span>
                      </Label>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
        </div>

        <DialogFooter className="shrink-0 border-t pt-4">
          <Button
            onClick={handleConfirm}
            disabled={checkedFields.size === 0 || isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Crear Propiedad
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Contact Creation Popup */}
      <QuickContactModal
        open={showContactPopup}
        onOpenChange={setShowContactPopup}
        onSuccess={handleContactCreated}
      />
    </Dialog>
  );
}
