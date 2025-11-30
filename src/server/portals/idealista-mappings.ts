// ============================================
// IDEALISTA PORTAL INTEGRATION - TYPE & FEATURE MAPPINGS
// ============================================

// ============================================
// COUNTRY & LANGUAGE CONSTANTS
// ============================================

/**
 * Idealista country codes - MUST use full names
 */
export const IDEALISTA_COUNTRIES = {
  es: "Spain",
  pt: "Portugal",
  it: "Italy",
} as const;

export type IdealistaCountry = "Spain" | "Italy" | "Portugal";

/**
 * Idealista description languages - MUST use full names
 */
export const DESCRIPTION_LANGUAGES = {
  es: "spanish",
  ca: "catalan",
  en: "english",
  de: "german",
  fr: "french",
  it: "italian",
  pt: "portuguese",
  ru: "russian",
  zh: "chinese",
  fi: "finnish",
  nl: "dutch",
  pl: "polish",
  ro: "romanian",
  sv: "swedish",
  da: "danish",
  no: "norway",
  el: "greek",
  uk: "ukrainian",
} as const;

export type IdealistaDescriptionLanguage =
  | "spanish"
  | "catalan"
  | "english"
  | "german"
  | "french"
  | "italian"
  | "portuguese"
  | "russian"
  | "chinese"
  | "finnish"
  | "dutch"
  | "polish"
  | "romanian"
  | "swedish"
  | "danish"
  | "norway"
  | "greek"
  | "ukrainian";

// ============================================
// ADDRESS VISIBILITY MAPPING
// ============================================

/**
 * Maps fcLocationVisibility (shared with Fotocasa) to Idealista address visibility
 * Fotocasa uses: 1=Exact, 2=Street, 3=Zone
 * Idealista uses: "full", "street", "hidden"
 */
export type IdealistaAddressVisibility = "full" | "street" | "hidden";

export function mapAddressVisibility(
  fcLocationVisibility: number | null | undefined,
): IdealistaAddressVisibility {
  switch (fcLocationVisibility) {
    case 1:
      return "full"; // Exact location
    case 2:
      return "street"; // Street level
    case 3:
      return "hidden"; // Zone only
    default:
      return "street"; // Default to street level for safety
  }
}

// ============================================
// PROPERTY TYPE MAPPINGS
// ============================================

/**
 * Vesta property types to Idealista featuresType mapping
 * Source: idealista/homes.json, premises.json, land.json, etc.
 */
export const PROPERTY_TYPE_MAPPING: Record<string, string> = {
  // Housing types (homes.json)
  piso: "flat",
  casa: "house",
  chalet: "house_independent",

  // Commercial types (premises.json)
  local: "premises_commercial",
  "local comercial": "premises_commercial",
  nave: "premises_industrial",

  // Office types (offices.json)
  oficina: "office",

  // Land types (land.json)
  solar: "land_urban",
  terreno: "land",
  finca: "land_countrybuildable",

  // Garage types (garage.json)
  garaje: "garage",
  parking: "garage",

  // Storage types (storage.json)
  trastero: "storage",

  // Building type (building.json)
  edificio: "building",
};

/**
 * Vesta property subtypes to Idealista featuresType
 * More specific mappings based on propertySubtype
 */
export const PROPERTY_SUBTYPE_MAPPING: Record<string, string> = {
  // Flat subtypes
  Piso: "flat",
  Apartamento: "flat",
  Ático: "flat", // Set featuresPenthouse: true
  Dúplex: "flat", // Set featuresDuplex: true
  Estudio: "flat", // Set featuresStudio: true
  Bajo: "flat",
  Loft: "flat",

  // House subtypes
  Casa: "house",
  "Casa adosada": "house_terraced",
  "Casa pareada": "house_semidetached",
  Chalet: "house_independent",
  "Chalet independiente": "house_independent",
  Villa: "house_villa", // Italy only
  "Casa rústica": "rustic_house",
  "Finca rústica": "rustic",
  Bungalow: "house",

  // Spain-specific rustic types
  Masía: "rustic_masia",
  Cortijo: "rustic_cortijo",
  "Casa de pueblo": "rustic_village",
  Palacio: "rustic_palace",
  Castillo: "rustic_castle",
  Torre: "rustic_torre",
  Caserón: "rustic_caseron",
  Terrera: "rustic_terrera",
  "Casa rural": "rustic_rural",

  // Land subtypes
  "Suelo urbano": "land_urban",
  "Suelo residencial": "land_urban",
  "Suelo industrial": "land_urban",
  "Suelo rústico": "land_countrynonbuildable",
  "Suelo urbanizable": "land_countrybuildable",

  // Premises subtypes
  "Local comercial": "premises_commercial",
  "Nave industrial": "premises_industrial",
  Local: "premises",

  // Room rental
  Habitación: "room_shared_flat",
};

/**
 * Special property flags based on subtype
 */
export function getPropertyFlags(
  subtype: string | null,
): Record<string, boolean> {
  if (!subtype) return {};

  const flags: Record<string, boolean> = {};
  const lower = subtype.toLowerCase();

  if (lower.includes("ático") || lower.includes("penthouse")) {
    flags.featuresPenthouse = true;
  }
  if (lower.includes("dúplex") || lower.includes("duplex")) {
    flags.featuresDuplex = true;
  }
  if (lower.includes("estudio") || lower.includes("studio")) {
    flags.featuresStudio = true;
  }

  return flags;
}

// ============================================
// OPERATION TYPE MAPPING
// ============================================

/**
 * Vesta listingType to Idealista operationType
 * Source: idealista/rules.json enumOperationType
 */
export const OPERATION_TYPE_MAPPING: Record<
  string,
  "sale" | "rent" | "rentToOwn"
> = {
  Sale: "sale",
  Rent: "rent",
  RentWithOption: "rentToOwn",
  // Note: Transfer and RoomSharing don't have direct Idealista equivalents
};

// ============================================
// CONSERVATION STATUS MAPPING
// ============================================

/**
 * Vesta conservationStatus to Idealista featuresConservation
 * Source: idealista/features.json featuresConservation
 *
 * Vesta values (smallint):
 * 1='Bueno' | 2='Muy bueno' | 3='Como nuevo' | 4='A reformar' | 6='Reformado'
 *
 * Idealista values (string enum):
 * "new" | "good" | "toRestore" | "fully_reformed"
 *
 * NOTES:
 * - "new" only for NEW DEVELOPMENT properties, not secondhand
 * - "fully_reformed" only for ITALY (for Casa.it integration)
 * - "new_development_in_construction" and "new_development_finished" only for Italy
 */
export const CONSERVATION_STATUS_MAPPING: Record<number, string> = {
  1: "good", // Bueno → good
  2: "good", // Muy bueno → good
  3: "good", // Como nuevo → good (can't use "new" for secondhand)
  4: "toRestore", // A reformar → toRestore
  6: "good", // Reformado → good (can't use "fully_reformed" for Spain)
};

// ============================================
// ENERGY CERTIFICATE RATING MAPPING
// ============================================

/**
 * Idealista energy certificate ratings
 * Source: idealista/features.json featuresEnergyCertificateRating
 */
export const ENERGY_RATING_VALUES = [
  "A",
  "A+",
  "A1",
  "A2",
  "A3",
  "A4",
  "B",
  "B-",
  "C",
  "D",
  "E",
  "F",
  "G",
  "exempt",
  "inProcess",
  "unknown",
] as const;

export type IdealistaEnergyRating = (typeof ENERGY_RATING_VALUES)[number];

/**
 * Vesta energyConsumptionScale to Idealista featuresEnergyCertificateRating
 */
export const ENERGY_RATING_MAPPING: Record<string, IdealistaEnergyRating> = {
  "A+": "A+",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  E: "E",
  F: "F",
  G: "G",
};

/**
 * Vesta energyCertificateStatus to Idealista featuresEnergyCertificateRating
 */
export const ENERGY_STATUS_MAPPING: Record<string, IdealistaEnergyRating> = {
  disponible: "A", // Will use actual scale if available
  en_tramite: "inProcess",
  pendiente: "unknown",
  no_indicado: "unknown",
  exento: "exempt",
};

// ============================================
// HEATING TYPE MAPPING
// ============================================

/**
 * Idealista heating types
 * Source: idealista/features.json featuresHeatingType
 */
export const HEATING_TYPE_VALUES = [
  "centralGas",
  "centralFuelOil",
  "centralOther",
  "individualGas",
  "individualPropaneButane",
  "individualElectric",
  "individualAirConditioningHeatPump",
  "individualOther",
  "noHeating",
] as const;

export type IdealistaHeatingType = (typeof HEATING_TYPE_VALUES)[number];

/**
 * Vesta heatingType to Idealista featuresHeatingType
 */
export const HEATING_TYPE_MAPPING: Record<string, IdealistaHeatingType> = {
  "gas natural": "centralGas",
  "Gas natural": "centralGas",
  "gas ciudad": "centralGas",
  "calefacción central": "centralOther",
  "Calefacción central": "centralOther",
  central: "centralOther",
  gasoil: "centralFuelOil",
  gasóleo: "centralFuelOil",
  eléctrica: "individualElectric",
  Eléctrica: "individualElectric",
  electrico: "individualElectric",
  "radiadores eléctricos": "individualElectric",
  gas: "individualGas",
  "gas individual": "individualGas",
  propano: "individualPropaneButane",
  butano: "individualPropaneButane",
  "bomba de calor": "individualAirConditioningHeatPump",
  aerotermia: "individualAirConditioningHeatPump",
  "suelo radiante": "individualOther",
  "sin calefacción": "noHeating",
  "no tiene": "noHeating",
};

// ============================================
// ORIENTATION MAPPING
// ============================================

/**
 * Vesta orientation to Idealista orientation booleans
 * Idealista uses separate boolean flags for each direction
 */
export function mapOrientation(orientation: string | null): {
  featuresOrientationNorth?: boolean;
  featuresOrientationSouth?: boolean;
  featuresOrientationEast?: boolean;
  featuresOrientationWest?: boolean;
} {
  if (!orientation) return {};

  const lower = orientation.toLowerCase();
  const result: Record<string, boolean> = {};

  if (lower.includes("norte") || lower.includes("north") || lower === "n") {
    result.featuresOrientationNorth = true;
  }
  if (lower.includes("sur") || lower.includes("south") || lower === "s") {
    result.featuresOrientationSouth = true;
  }
  if (lower.includes("este") || lower.includes("east") || lower === "e") {
    result.featuresOrientationEast = true;
  }
  if (
    lower.includes("oeste") ||
    lower.includes("west") ||
    lower === "o" ||
    lower === "w"
  ) {
    result.featuresOrientationWest = true;
  }

  return result;
}

// ============================================
// ADDRESS VISIBILITY MAPPING
// ============================================

/**
 * Idealista coordinates precision
 */
export type IdealistaCoordinatesPrecision = "exact" | "moved";

/**
 * Idealista property visibility options
 * Source: idealista/rules.json enumPropertyVisibility
 */
export type IdealistaPropertyVisibility = "idealista" | "microsite" | "private";

// ============================================
// IMAGE LABEL MAPPING
// ============================================

/**
 * Complete Idealista image labels
 * Source: idealista/images.json
 *
 * NOTE: Field is called "imageLabel", NOT "imageTag"!
 */
export const IDEALISTA_IMAGE_LABELS = [
  "appraisalplan",
  "archive",
  "atmosphere",
  "balcony",
  "basement",
  "bathroom",
  "bedroom",
  "buildingwork",
  "cellar",
  "communalareas",
  "corridor",
  "details",
  "dining_room",
  "energycertificate",
  "facade",
  "garage",
  "garden",
  "gateway",
  "hall",
  "kitchen",
  "land",
  "lifts",
  "living",
  "loft",
  "mates",
  "meeting_room",
  "office",
  "open_plan",
  "patio",
  "penthouse",
  "plan",
  "pool",
  "porch",
  "pressphoto",
  "reception",
  "room",
  "shop_window",
  "staircase",
  "storage",
  "storage_space",
  "studio",
  "surroundings",
  "terrace",
  "unknown",
  "views",
  "waitingroom",
  "walk_in_wardrobe",
] as const;

export type IdealistaImageLabel = (typeof IDEALISTA_IMAGE_LABELS)[number];

/**
 * Vesta image tags to Idealista imageLabel
 */
export const IMAGE_LABEL_MAPPING: Record<string, IdealistaImageLabel> = {
  // Spanish to Idealista
  salon: "living",
  salón: "living",
  living: "living",
  comedor: "dining_room",
  habitacion: "bedroom",
  habitación: "bedroom",
  dormitorio: "bedroom",
  cocina: "kitchen",
  bano: "bathroom",
  baño: "bathroom",
  aseo: "bathroom",
  terraza: "terrace",
  balcon: "balcony",
  balcón: "balcony",
  exterior: "facade",
  fachada: "facade",
  jardin: "garden",
  jardín: "garden",
  piscina: "pool",
  garaje: "garage",
  parking: "garage",
  plano: "plan",
  vistas: "views",
  vista: "views",
  entrada: "hall",
  recibidor: "hall",
  pasillo: "corridor",
  escalera: "staircase",
  ascensor: "lifts",
  zonas_comunes: "communalareas",
  trastero: "storage",
  sotano: "basement",
  sótano: "basement",
  bodega: "cellar",
  atico: "penthouse",
  ático: "penthouse",
  despacho: "office",
  oficina: "office",
  patio: "patio",
  porche: "porch",
  certificado_energetico: "energycertificate",
  detalles: "details",
  ambiente: "atmosphere",
  alrededores: "surroundings",
  vestidor: "walk_in_wardrobe",
  loft: "loft",
  estudio: "studio",
  recepcion: "reception",
  recepción: "reception",
  sala_reuniones: "meeting_room",
  escaparate: "shop_window",
  terreno: "land",
  archivo: "archive",
  obra: "buildingwork",
  portal: "gateway",
  sala_espera: "waitingroom",

  // English fallbacks
  livingroom: "living",
  bedroom: "bedroom",
  kitchen: "kitchen",
  bathroom: "bathroom",
  terrace: "terrace",
  garden: "garden",
  pool: "pool",
  garage: "garage",
  blueprint: "plan",
  floorplan: "plan",
  views: "views",
  facade: "facade",
  hall: "hall",
  corridor: "corridor",
  storage: "storage",
  basement: "basement",
  office: "office",
  details: "details",
};

/**
 * Map Vesta image tag to Idealista label with fallback
 */
export function mapImageLabel(
  tag: string | null | undefined,
): IdealistaImageLabel {
  if (!tag) return "unknown";
  const lower = tag.toLowerCase().replace(/\s+/g, "_");
  return IMAGE_LABEL_MAPPING[lower] ?? "unknown";
}

// ============================================
// VIRTUAL TOUR TYPES
// ============================================

/**
 * Idealista 3D virtual tour types (Matterport, etc.)
 * Source: idealista/instructions.md
 */
export const VIRTUAL_TOUR_3D_TYPES = ["matterport", "vistaplayer3d"] as const;

/**
 * Other virtual tour types
 */
export const VIRTUAL_TOUR_TYPES = [
  "immoviewer",
  "spectando",
  "floorplanner",
  "realisti_co",
  "goldmark",
  "floorfy",
  "fastout",
  "panotour",
  "everpano",
  "toursvirtuales360",
  "keepeyeonball",
  "inmovilla",
  "abitarepn",
  "pano2vr",
  "plushglobalmedia",
  "vizor.io",
  "nodalview",
  "gothru",
  "guru360",
  "creotour",
  "habiteo",
  "vitrio",
  "plug-in.studio",
  "ppgstudios",
  "360forcurious",
  "roundme",
  "virtualitour",
  "sircase",
  "divein.studio",
  "casagest24",
  "spherical",
  "gizmo-3d",
  "kuula",
  "emporda360",
  "vista360",
  "clicktours",
  "espaciosvirtuales.es",
  "cloudpano",
  "bizionar",
  "casatour",
  "casa360.net",
  "marzipano",
  "iguide",
  "realtourvision",
  "matterport360",
] as const;

// ============================================
// VIRTUAL TOUR DETECTION
// ============================================

interface VirtualTourDetection {
  is3D: boolean;
  type: string | null;
  supported: boolean;
}

const VIRTUAL_TOUR_3D_PATTERNS: Record<string, RegExp> = {
  matterport: /matterport\.com|my\.matterport/i,
  vistaplayer3d: /vistaplayer3d\.com/i,
};

const VIRTUAL_TOUR_PATTERNS: Record<string, RegExp> = {
  floorfy: /floorfy\.(com|es)/i,
  nodalview: /nodalview\.com/i,
  kuula: /kuula\.co/i,
  cloudpano: /cloudpano\.com/i,
  roundme: /roundme\.com/i,
  iguide: /youriguide\.com/i,
  immoviewer: /immoviewer\.com/i,
  floorplanner: /floorplanner\.com/i,
  everpano: /everpano\.com/i,
  vizor: /vizor\.io/i,
  gothru: /gothru\.co/i,
  virtualitour: /virtualitour\.it/i,
  marzipano: /marzipano\.net/i,
  spectando: /spectando\.com/i,
  habiteo: /habiteo\.com/i,
  realisti_co: /realisti\.co/i,
  panotour: /panotour\./i,
  guru360: /guru360\./i,
  sircase: /sircase\./i,
  spherical: /spherical\./i,
  emporda360: /emporda360\./i,
  vista360: /vista360\./i,
  clicktours: /clicktours\./i,
  casa360: /casa360\.net/i,
  casatour: /casatour\./i,
  bizionar: /bizionar\./i,
  realtourvision: /realtourvision\.com/i,
};

/**
 * Detect virtual tour provider from URL
 */
export function detectVirtualTourProvider(url: string): VirtualTourDetection {
  // Check 3D tours first (higher priority)
  for (const [type, pattern] of Object.entries(VIRTUAL_TOUR_3D_PATTERNS)) {
    if (pattern.test(url)) {
      return { is3D: true, type, supported: true };
    }
  }

  // Check standard virtual tours
  for (const [type, pattern] of Object.entries(VIRTUAL_TOUR_PATTERNS)) {
    if (pattern.test(url)) {
      return { is3D: false, type, supported: true };
    }
  }

  // Unsupported platforms
  if (/youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com/i.test(url)) {
    return { is3D: false, type: null, supported: false };
  }

  // Unknown provider - still try to use it
  return { is3D: false, type: null, supported: true };
}

// ============================================
// CURRENT OCCUPATION MAPPING
// ============================================

/**
 * Property occupation status
 * Source: idealista/features.json featuresCurrentOccupation
 *
 * Only for flat, house, country house in Spain/Portugal
 * Only for SALE operation
 */
export const CURRENT_OCCUPATION_VALUES = [
  "free", // Libre
  "tenanted", // Alquilado
  "bare_ownership", // Nuda propiedad (Spain & Italy only)
  "illegally_occupied", // Ocupado ilegalmente (Spain only)
  "not_free", // No libre (Italy only)
] as const;

export type IdealistaCurrentOccupation =
  (typeof CURRENT_OCCUPATION_VALUES)[number];

// ============================================
// CATALONIA DETECTION
// ============================================

/**
 * Detect if a property is in Catalonia based on postal code
 *
 * Catalonia postal codes:
 * - 08XXX: Barcelona province
 * - 17XXX: Girona province
 * - 25XXX: Lleida province
 * - 43XXX: Tarragona province
 *
 * IMPORTANT: For rentals in Catalonia, the Price Reference Index
 * (featuresPriceReferenceIndex) is MANDATORY per Idealista requirements.
 */
export function isCataloniaProperty(
  postalCode: string | null | undefined,
): boolean {
  if (!postalCode) return false;

  // Normalize: remove spaces and ensure 5 digits
  const normalized = postalCode.replace(/\s/g, "").padStart(5, "0");

  // Catalonia postal code prefixes
  const cataloniaPrefixes = ["08", "17", "25", "43"];
  const prefix = normalized.substring(0, 2);

  return cataloniaPrefixes.includes(prefix);
}

/**
 * Validate that Catalonia rentals have price reference index
 */
export function validateCataloniaRental(
  postalCode: string | null | undefined,
  operationType: string,
  priceReferenceIndex: number | null | undefined,
): { valid: boolean; error?: string } {
  if (!isCataloniaProperty(postalCode)) {
    return { valid: true };
  }

  if (operationType !== "rent") {
    return { valid: true };
  }

  if (!priceReferenceIndex || priceReferenceIndex <= 0) {
    return {
      valid: false,
      error:
        "El Índice de Referencia de Precios es obligatorio para alquileres en Cataluña",
    };
  }

  if (priceReferenceIndex < 0.01 || priceReferenceIndex > 10000) {
    return {
      valid: false,
      error:
        "El Índice de Referencia de Precios debe estar entre 0.01 y 10000",
    };
  }

  return { valid: true };
}

// ============================================
// GARDEN TYPE MAPPING
// ============================================

export type IdealistaGardenType = "private" | "community";

// ============================================
// ENERGY CERTIFICATE LAW & TYPE
// ============================================

export type IdealistaEnergyCertificateLaw = "law2007" | "law2013";
export type IdealistaEnergyCertificateType = "project" | "completed" | "both";

// ============================================
// PROPERTY TYPE CATEGORIES
// ============================================

/**
 * Property type categories for validation rules
 * Each category has different required fields per Idealista schema
 */
export type IdealistaPropertyCategory =
  | "housing" // flat, house, rustic - requires bathrooms, bedrooms/rooms
  | "garage" // garage - only type + area
  | "office" // office - only type + area
  | "premises" // premises, premises_commercial, premises_industrial
  | "land" // land types - requires PLOT area, NOT constructed
  | "storage" // storage - only type + area
  | "building" // building - only type + area
  | "room"; // room_shared_flat, room_shared_chalet - MANY required fields

/**
 * Housing types (flat, house, rustic variants)
 * Require: featuresType, featuresAreaConstructed, featuresBathroomNumber, (featuresRooms OR featuresBedroomNumber)
 */
const HOUSING_TYPES = new Set([
  "flat",
  "house",
  "house_andar_moradia",
  "house_independent",
  "house_semidetached",
  "house_terraced",
  "house_villa",
  "rustic",
  "rustic_house",
  "rustic_village",
  "rustic_castle",
  "rustic_palace",
  "rustic_baita",
  "rustic_rural",
  "rustic_casalecascina",
  "rustic_caseron",
  "rustic_cortijo",
  "rustic_masia",
  "rustic_masseria",
  "rustic_moinho",
  "rustic_montealentejano",
  "rustic_quinta",
  "rustic_solar",
  "rustic_terrera",
  "rustic_torre",
  "rustic_trullo",
]);

/**
 * Land types - require PLOT area, not constructed area
 * Require: featuresType, featuresAreaPlot
 */
const LAND_TYPES = new Set([
  "land",
  "land_urban",
  "land_countrybuildable",
  "land_countrynonbuildable",
]);

/**
 * Room rental types - have MANY required fields
 * Require: featuresType, featuresAreaConstructed, featuresTenantNumber, featuresRooms,
 * featuresBathroomNumber, featuresSmokingAllowed, featuresAllowPets, featuresMinTenantAge,
 * featuresMaxTenantAge, featuresCouplesAllowed, featuresLiftAvailable, featuresBedType,
 * featuresMinimalStay, featuresWindowView, featuresOwnerLiving, featuresAvailableFrom
 */
const ROOM_TYPES = new Set(["room_shared_flat", "room_shared_chalet"]);

/**
 * Garage types
 * Require: featuresType, featuresAreaConstructed
 */
const GARAGE_TYPES = new Set(["garage"]);

/**
 * Office types
 * Require: featuresType, featuresAreaConstructed
 */
const OFFICE_TYPES = new Set(["office"]);

/**
 * Premises types (commercial/industrial)
 * Require: featuresType, featuresAreaConstructed
 */
const PREMISES_TYPES = new Set([
  "premises",
  "premises_commercial",
  "premises_industrial",
]);

/**
 * Storage types
 * Require: featuresType, featuresAreaConstructed
 */
const STORAGE_TYPES = new Set(["storage"]);

/**
 * Building types
 * Require: featuresType, featuresAreaConstructed
 */
const BUILDING_TYPES = new Set(["building"]);

/**
 * Get the category of a property type for validation rules
 */
export function getPropertyCategory(
  idealistaType: string | null | undefined,
): IdealistaPropertyCategory {
  if (!idealistaType) return "housing"; // Default to housing

  if (HOUSING_TYPES.has(idealistaType)) return "housing";
  if (LAND_TYPES.has(idealistaType)) return "land";
  if (ROOM_TYPES.has(idealistaType)) return "room";
  if (GARAGE_TYPES.has(idealistaType)) return "garage";
  if (OFFICE_TYPES.has(idealistaType)) return "office";
  if (PREMISES_TYPES.has(idealistaType)) return "premises";
  if (STORAGE_TYPES.has(idealistaType)) return "storage";
  if (BUILDING_TYPES.has(idealistaType)) return "building";

  return "housing"; // Default fallback
}

/**
 * Check if property type is a housing type (requires bathrooms/bedrooms)
 */
export function isHousingType(idealistaType: string | null | undefined): boolean {
  return getPropertyCategory(idealistaType) === "housing";
}

/**
 * Check if property type is a land type (requires plot area, NOT constructed)
 */
export function isLandType(idealistaType: string | null | undefined): boolean {
  return getPropertyCategory(idealistaType) === "land";
}

/**
 * Check if property type is a room rental (has many required fields)
 */
export function isRoomType(idealistaType: string | null | undefined): boolean {
  return getPropertyCategory(idealistaType) === "room";
}

/**
 * Fields that should NOT be sent for specific property categories
 * per Idealista's additionalProperties: false in schemas
 */
export const EXCLUDED_FIELDS_BY_CATEGORY: Record<
  IdealistaPropertyCategory,
  Set<string>
> = {
  housing: new Set(), // Housing accepts most fields
  garage: new Set([
    "featuresBathroomNumber",
    "featuresBedroomNumber",
    "featuresRooms",
    "featuresAreaUsable",
    "featuresAreaPlot",
    "featuresBalcony",
    "featuresGarden",
    "featuresPool",
    "featuresTerrace",
    "featuresWardrobes",
    "featuresChimney",
    "featuresConservation",
    "featuresEnergyCertificateRating",
    "featuresEnergyCertificatePerformance",
    "featuresEnergyCertificateEmissionsRating",
    "featuresEnergyCertificateEmissionsValue",
    "featuresHeatingType",
    "featuresOrientationNorth",
    "featuresOrientationSouth",
    "featuresOrientationEast",
    "featuresOrientationWest",
    "featuresBuiltYear",
    "featuresEquippedKitchen",
    "featuresEquippedWithFurniture",
    "featuresWindowsLocation",
    "featuresAllowPets",
    "featuresPriceReferenceIndex",
    "featuresResidential",
    "featuresSeasonalRental",
    "featuresShortTerm",
    "featuresShortTermLicense",
  ]),
  office: new Set([
    "featuresBedroomNumber",
    "featuresRooms",
    "featuresAreaPlot",
    "featuresBalcony",
    "featuresGarden",
    "featuresPool",
    "featuresTerrace",
    "featuresWardrobes",
    "featuresChimney",
    "featuresAllowPets",
    "featuresPriceReferenceIndex",
    "featuresResidential",
    "featuresSeasonalRental",
    "featuresShortTerm",
    "featuresShortTermLicense",
  ]),
  premises: new Set([
    "featuresBedroomNumber",
    "featuresAreaPlot",
    "featuresBalcony",
    "featuresPool",
    "featuresTerrace",
    "featuresWardrobes",
    "featuresChimney",
    "featuresLiftAvailable",
    "featuresAllowPets",
    "featuresOrientationNorth",
    "featuresOrientationSouth",
    "featuresOrientationEast",
    "featuresOrientationWest",
    "featuresPriceReferenceIndex",
    "featuresResidential",
    "featuresSeasonalRental",
    "featuresShortTerm",
    "featuresShortTermLicense",
  ]),
  land: new Set([
    "featuresAreaConstructed", // Land uses featuresAreaPlot instead!
    "featuresAreaUsable",
    "featuresBathroomNumber",
    "featuresBedroomNumber",
    "featuresRooms",
    "featuresBalcony",
    "featuresGarden",
    "featuresPool",
    "featuresTerrace",
    "featuresWardrobes",
    "featuresChimney",
    "featuresLiftAvailable",
    "featuresParkingAvailable",
    "featuresStorage",
    "featuresConditionedAir",
    "featuresAllowPets",
    "featuresConservation",
    "featuresEnergyCertificateRating",
    "featuresEnergyCertificatePerformance",
    "featuresEnergyCertificateEmissionsRating",
    "featuresEnergyCertificateEmissionsValue",
    "featuresHeatingType",
    "featuresOrientationNorth",
    "featuresOrientationSouth",
    "featuresOrientationEast",
    "featuresOrientationWest",
    "featuresBuiltYear",
    "featuresEquippedKitchen",
    "featuresEquippedWithFurniture",
    "featuresWindowsLocation",
    "featuresPriceReferenceIndex",
    "featuresResidential",
    "featuresSeasonalRental",
    "featuresShortTerm",
    "featuresShortTermLicense",
  ]),
  storage: new Set([
    "featuresAreaUsable",
    "featuresAreaPlot",
    "featuresBathroomNumber",
    "featuresBedroomNumber",
    "featuresRooms",
    "featuresBalcony",
    "featuresGarden",
    "featuresPool",
    "featuresTerrace",
    "featuresWardrobes",
    "featuresChimney",
    "featuresLiftAvailable",
    "featuresParkingAvailable",
    "featuresConditionedAir",
    "featuresAllowPets",
    "featuresConservation",
    "featuresEnergyCertificateRating",
    "featuresEnergyCertificatePerformance",
    "featuresEnergyCertificateEmissionsRating",
    "featuresEnergyCertificateEmissionsValue",
    "featuresHeatingType",
    "featuresOrientationNorth",
    "featuresOrientationSouth",
    "featuresOrientationEast",
    "featuresOrientationWest",
    "featuresBuiltYear",
    "featuresEquippedKitchen",
    "featuresEquippedWithFurniture",
    "featuresWindowsLocation",
    "featuresPriceReferenceIndex",
    "featuresResidential",
    "featuresSeasonalRental",
    "featuresShortTerm",
    "featuresShortTermLicense",
  ]),
  building: new Set([
    "featuresAreaUsable",
    "featuresAreaPlot",
    "featuresBathroomNumber",
    "featuresBedroomNumber",
    "featuresRooms",
    "featuresBalcony",
    "featuresPool",
    "featuresTerrace",
    "featuresWardrobes",
    "featuresChimney",
    "featuresLiftAvailable",
    "featuresParkingAvailable",
    "featuresConditionedAir",
    "featuresAllowPets",
    "featuresHeatingType",
    "featuresOrientationNorth",
    "featuresOrientationSouth",
    "featuresOrientationEast",
    "featuresOrientationWest",
    "featuresEquippedKitchen",
    "featuresEquippedWithFurniture",
    "featuresWindowsLocation",
    "featuresPriceReferenceIndex",
    "featuresResidential",
    "featuresSeasonalRental",
    "featuresShortTerm",
    "featuresShortTermLicense",
  ]),
  room: new Set([
    "featuresAreaPlot",
    "featuresBedroomNumber", // Rooms use featuresRooms
    "featuresConservation",
    "featuresEnergyCertificateRating",
    "featuresEnergyCertificatePerformance",
    "featuresEnergyCertificateEmissionsRating",
    "featuresEnergyCertificateEmissionsValue",
    "featuresBuiltYear",
    "featuresWardrobes",
    "featuresChimney",
    "featuresParkingAvailable",
    "featuresStorage",
    "featuresBalcony",
    "featuresHandicapAdaptedAccess",
    "featuresHandicapAdaptedUse",
    "featuresPriceReferenceIndex",
    "featuresResidential",
    "featuresSeasonalRental",
    "featuresShortTerm",
    "featuresShortTermLicense",
    "featuresCurrentOccupation",
  ]),
};

/**
 * Filter out fields that are not allowed for a property category
 */
export function filterFeaturesByCategory(
  features: Record<string, unknown>,
  category: IdealistaPropertyCategory,
): Record<string, unknown> {
  const excludedFields = EXCLUDED_FIELDS_BY_CATEGORY[category];
  const filtered: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(features)) {
    if (!excludedFields.has(key) && value !== undefined) {
      filtered[key] = value;
    }
  }

  return filtered;
}
