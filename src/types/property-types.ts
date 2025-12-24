/**
 * Property Types Configuration
 *
 * Defines which fields are applicable for each property type based on the form cards analysis.
 * This helps generate accurate property descriptions by only including relevant fields.
 */

import type { PropertyListing } from "./property-listing";

// Base property types supported by the system
export type PropertyType = "piso" | "casa" | "local" | "solar" | "garaje";

// Property subtypes for each main type
export interface PropertySubtypes {
  piso:
    | "Tríplex"
    | "Dúplex"
    | "Ático"
    | "Estudio"
    | "Loft"
    | "Piso"
    | "Apartamento"
    | "Bajo";
  casa:
    | "Casa"
    | "Casa adosada"
    | "Casa pareada"
    | "Chalet"
    | "Casa rústica"
    | "Bungalow";
  local: "Local Comercial" | "Residencial" | "Otros" | "Mixto residencial" | "Oficinas" | "Hotel";
  solar: "Suelo residencial" | "Suelo industrial" | "Suelo rústico";
  // Garage subtypes use Idealista's featuresGarageCapacityType values
  // These map to Fotocasa: motorcycle→Moto, two_cars_and_more→Doble, others→Individual
  garaje:
    | "motorcycle"
    | "car_compact"
    | "car_sedan"
    | "car_and_motorcycle"
    | "two_cars_and_more";
}

// Core fields applicable to all property types
export interface CorePropertyFields {
  // Basic identification
  propertyId?: number | string;
  listingId?: number | string;
  agentId?: string;

  // Basic property info
  propertyType: PropertyType;
  propertySubtype?: string;
  listingType?: string;
  price?: number | string;
  cadastralReference?: string;

  // Status flags
  isBankOwned?: boolean;
  isFeatured?: boolean;
  newConstruction?: boolean;
  publishToWebsite?: boolean;

  // Location (all properties have location)
  street?: string;
  addressDetails?: string;
  postalCode?: string;
  neighborhood?: string;
  city?: string;
  province?: string;
  municipality?: string;
  latitude?: number;
  longitude?: number;

  // Content
  description?: string;
  shortDescription?: string;

  // Agent information
  agent?: {
    id: string;
    name: string;
  };
}

// Fields specific to garage properties (minimal set for description generation)
export interface GaragePropertyFields extends CorePropertyFields {
  propertyType: "garaje";

  // Garage features
  garageType?: string; // → featuresParkingPlaceCovered
  securityDoor?: boolean; // → featuresParkingAutomaticDoor (repurposed)
  hasElevator?: boolean; // → featuresLiftAvailable

  // Security
  alarm?: boolean; // → featuresSecurityAlarm
  securityGuard?: boolean; // → featuresSecurityPersonnel

  // Occupation
  occupationStatus?: "free" | "tenanted" | "bare_ownership" | "illegally_occupied"; // → featuresCurrentOccupation
}

// Fields specific to solar (land) properties
export interface SolarPropertyFields extends CorePropertyFields {
  propertyType: "solar";

  // Solar-specific measurements
  squareMeter?: number; // Total land area
  builtSurfaceArea?: number; // Buildable area

  // No construction year for undeveloped land
  // No conservation status for land
  // No building floors for land

  // Orientation and characteristics
  orientation?: string;
  bright?: boolean;

  // Views (land can have views)
  views?: boolean;
  mountainViews?: boolean;
  seaViews?: boolean;
  beachfront?: boolean;

  // Location benefits
  nearbyPublicTransport?: boolean;

  // Note: Most other features don't apply to undeveloped solar properties
  // as indicated by the conditional rendering in the card components
}

// Fields for residential properties (piso, casa)
export interface ResidentialPropertyFields extends CorePropertyFields {
  propertyType: "piso" | "casa";

  // Dimensions and layout
  bedrooms?: number;
  bathrooms?: number;
  squareMeter?: number;
  builtSurfaceArea?: number;

  // Construction details
  yearBuilt?: number;
  lastRenovationYear?: string;
  buildingFloors?: number;
  conservationStatus?: number;

  // Basic features
  hasElevator?: boolean;

  // Garage and storage
  hasGarage?: boolean;
  garageType?: string;
  garageSpaces?: number;
  garageInBuilding?: boolean;
  garageNumber?: string;
  optionalGaragePrice?: number;
  hasStorageRoom?: boolean;
  storageRoomSize?: number;
  storageRoomNumber?: string;
  optionalStorageRoomPrice?: number;

  // Utilities
  hasHeating?: boolean;
  heatingType?: string;
  hotWaterType?: string;
  airConditioningType?: string;

  // Furnishing
  isFurnished?: boolean;
  furnitureQuality?: string;

  // Orientation and characteristics
  exterior?: boolean;
  orientation?: string;
  bright?: boolean;

  // Building characteristics
  disabledAccessible?: boolean;
  vpo?: boolean;

  // Security features
  videoIntercom?: boolean;
  conciergeService?: boolean;
  securityGuard?: boolean;
  satelliteDish?: boolean;
  doubleGlazing?: boolean;
  alarm?: boolean;
  securityDoor?: boolean;

  // Kitchen features
  kitchenType?: string;
  openKitchen?: boolean;
  frenchKitchen?: boolean;
  furnishedKitchen?: boolean;
  pantry?: boolean;

  // Outdoor spaces
  terrace?: boolean;
  terraceSize?: number;
  wineCellar?: boolean;
  wineCellarSize?: number;
  livingRoomSize?: number;
  balconyCount?: number;
  galleryCount?: number;
  builtInWardrobes?: boolean | string;

  // Materials and finishes
  mainFloorType?: string;
  shutterType?: string;
  carpentryType?: string;
  windowType?: string;

  // Views
  views?: boolean;
  mountainViews?: boolean;
  seaViews?: boolean;
  beachfront?: boolean;

  // Premium features
  jacuzzi?: boolean;
  hydromassage?: boolean;
  garden?: boolean;
  pool?: boolean;
  communityPool?: boolean;
  privatePool?: boolean;
  homeAutomation?: boolean;
  musicSystem?: boolean;
  laundryRoom?: boolean;
  coveredClothesline?: boolean;
  fireplace?: boolean;
  gym?: boolean;
  sportsArea?: boolean;
  childrenArea?: boolean;
  suiteBathroom?: boolean;
  tennisCourt?: boolean;

  // Location features
  nearbyPublicTransport?: boolean;

  // Rental-specific features
  studentFriendly?: boolean;
  petsAllowed?: boolean;
  appliancesIncluded?: boolean;
  internet?: boolean;

  // Appliances (when furnished)
  oven?: boolean;
  microwave?: boolean;
  washingMachine?: boolean;
  fridge?: boolean;
  tv?: boolean;
  stoneware?: boolean;
}

// Fields for commercial properties (local)
export interface CommercialPropertyFields extends CorePropertyFields {
  propertyType: "local";

  // Dimensions (uses bedrooms as "estancias" - rooms)
  bedrooms?: number; // Shown as "Estancias" for locals
  bathrooms?: number;
  squareMeter?: number;
  builtSurfaceArea?: number;

  // Construction details
  yearBuilt?: number;
  lastRenovationYear?: string;
  buildingFloors?: number;
  conservationStatus?: number;

  // Basic features
  hasElevator?: boolean;

  // Garage and storage
  hasGarage?: boolean;
  garageType?: string;
  garageSpaces?: number;
  garageInBuilding?: boolean;
  garageNumber?: string;
  optionalGaragePrice?: number;
  hasStorageRoom?: boolean;
  storageRoomSize?: number;
  storageRoomNumber?: string;
  optionalStorageRoomPrice?: number;

  // Utilities
  hasHeating?: boolean;
  heatingType?: string;
  hotWaterType?: string;
  airConditioningType?: string;

  // Orientation and characteristics
  exterior?: boolean;
  orientation?: string;
  bright?: boolean;

  // Building characteristics
  disabledAccessible?: boolean;
  vpo?: boolean;

  // Security features
  videoIntercom?: boolean;
  conciergeService?: boolean;
  securityGuard?: boolean;
  satelliteDish?: boolean;
  doubleGlazing?: boolean;
  alarm?: boolean;
  securityDoor?: boolean;

  // Kitchen features (for some commercial spaces)
  kitchenType?: string;
  openKitchen?: boolean;
  frenchKitchen?: boolean;
  furnishedKitchen?: boolean;
  pantry?: boolean;

  // Outdoor spaces
  terrace?: boolean;
  terraceSize?: number;
  wineCellar?: boolean;
  wineCellarSize?: number;
  livingRoomSize?: number;
  balconyCount?: number;
  galleryCount?: number;
  builtInWardrobes?: boolean | string;

  // Materials and finishes
  mainFloorType?: string;
  shutterType?: string;
  carpentryType?: string;
  windowType?: string;

  // Views
  views?: boolean;
  mountainViews?: boolean;
  seaViews?: boolean;
  beachfront?: boolean;

  // Premium features
  jacuzzi?: boolean;
  hydromassage?: boolean;
  garden?: boolean;
  pool?: boolean;
  communityPool?: boolean;
  privatePool?: boolean;
  homeAutomation?: boolean;
  musicSystem?: boolean;
  laundryRoom?: boolean;
  coveredClothesline?: boolean;
  fireplace?: boolean;
  gym?: boolean;
  sportsArea?: boolean;
  childrenArea?: boolean;
  suiteBathroom?: boolean;
  tennisCourt?: boolean;

  // Location features
  nearbyPublicTransport?: boolean;

  // Rental-specific features (limited for commercial)
  internet?: boolean;
  appliancesIncluded?: boolean;

  // Note: studentFriendly and petsAllowed are not applicable for commercial properties
}

// Union type for all property types
export type TypedPropertyListing =
  | GaragePropertyFields
  | SolarPropertyFields
  | ResidentialPropertyFields
  | CommercialPropertyFields;

// Utility functions to help with property type checking and field filtering

/**
 * Checks if a property type is residential (piso or casa)
 */
export function isResidentialProperty(
  propertyType: string,
): propertyType is "piso" | "casa" {
  return propertyType === "piso" || propertyType === "casa";
}

/**
 * Checks if a property type is commercial (local)
 */
export function isCommercialProperty(
  propertyType: string,
): propertyType is "local" {
  return propertyType === "local";
}

/**
 * Checks if a property type is a garage
 */
export function isGarageProperty(
  propertyType: string,
): propertyType is "garaje" {
  return propertyType === "garaje";
}

/**
 * Checks if a property type is solar (land)
 */
export function isSolarProperty(propertyType: string): propertyType is "solar" {
  return propertyType === "solar";
}

/**
 * Gets the relevant fields for a specific property type
 * This function helps filter out irrelevant fields when generating descriptions
 */
export function getRelevantFields(
  listing: PropertyListing,
): Partial<PropertyListing> {
  if (!listing.propertyType) return listing;

  const propertyType = listing.propertyType;

  // Start with core fields that apply to all properties
  // Note: propertyId and listingId are excluded - they're internal IDs with no meaning to the AI
  const relevantFields: Partial<PropertyListing> = {
    propertyType: listing.propertyType,
    propertySubtype: listing.propertySubtype,
    listingType: listing.listingType,
    price: listing.price,
    isBankOwned: listing.isBankOwned,
    newConstruction: listing.newConstruction,
    // Location fields (all properties)
    street: listing.street,
    postalCode: listing.postalCode,
    neighborhood: listing.neighborhood,
    city: listing.city,
    province: listing.province,
    municipality: listing.municipality,
    // Note: description/shortDescription excluded - we're generating new ones
    // Note: agent is intentionally excluded from AI prompts
  };

  // Add property-type specific fields
  if (isGarageProperty(propertyType)) {
    // Garage properties - minimal fields for description generation
    Object.assign(relevantFields, {
      garageType: listing.garageType, // featuresParkingPlaceCovered
      securityDoor: listing.securityDoor, // featuresParkingAutomaticDoor
      hasElevator: listing.hasElevator, // featuresLiftAvailable
      alarm: listing.alarm, // featuresSecurityAlarm
      securityGuard: listing.securityGuard, // featuresSecurityPersonnel
      occupationStatus: listing.occupationStatus, // featuresCurrentOccupation
    });
  } else if (isSolarProperty(propertyType)) {
    // Solar properties - land-specific fields only
    Object.assign(relevantFields, {
      squareMeter: listing.squareMeter,
      builtSurfaceArea: listing.builtSurfaceArea,
      // Orientation and characteristics
      orientation: listing.orientation,
      bright: listing.bright,
      // Views
      views: listing.views,
      mountainViews: listing.mountainViews,
      seaViews: listing.seaViews,
      beachfront: listing.beachfront,
      // Location
      nearbyPublicTransport: listing.nearbyPublicTransport,
    });
  } else if (
    isResidentialProperty(propertyType) ||
    isCommercialProperty(propertyType)
  ) {
    // Residential and Commercial properties - most comprehensive
    Object.assign(relevantFields, {
      // Dimensions
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      squareMeter: listing.squareMeter,
      builtSurfaceArea: listing.builtSurfaceArea,
      // Construction
      yearBuilt: listing.yearBuilt,
      lastRenovationYear: listing.lastRenovationYear,
      buildingFloors: listing.buildingFloors,
      conservationStatus: listing.conservationStatus,
      // Features
      hasElevator: listing.hasElevator,
      // Garage and storage
      hasGarage: listing.hasGarage,
      garageType: listing.garageType,
      garageSpaces: listing.garageSpaces,
      garageInBuilding: listing.garageInBuilding,
      garageNumber: listing.garageNumber,
      optionalGaragePrice: listing.optionalGaragePrice,
      hasStorageRoom: listing.hasStorageRoom,
      storageRoomSize: listing.storageRoomSize,
      storageRoomNumber: listing.storageRoomNumber,
      optionalStorageRoomPrice: listing.optionalStorageRoomPrice,
      // Utilities
      hasHeating: listing.hasHeating,
      heatingType: listing.heatingType,
      hotWaterType: listing.hotWaterType,
      airConditioningType: listing.airConditioningType,
      // Furnishing
      isFurnished: listing.isFurnished,
      furnitureQuality: listing.furnitureQuality,
      // Orientation
      exterior: listing.exterior,
      orientation: listing.orientation,
      bright: listing.bright,
      // Building characteristics
      disabledAccessible: listing.disabledAccessible,
      vpo: listing.vpo,
      // Security
      videoIntercom: listing.videoIntercom,
      conciergeService: listing.conciergeService,
      securityGuard: listing.securityGuard,
      satelliteDish: listing.satelliteDish,
      doubleGlazing: listing.doubleGlazing,
      alarm: listing.alarm,
      securityDoor: listing.securityDoor,
      // Kitchen
      kitchenType: listing.kitchenType,
      openKitchen: listing.openKitchen,
      frenchKitchen: listing.frenchKitchen,
      furnishedKitchen: listing.furnishedKitchen,
      pantry: listing.pantry,
      // Spaces
      terrace: listing.terrace,
      terraceSize: listing.terraceSize,
      wineCellar: listing.wineCellar,
      wineCellarSize: listing.wineCellarSize,
      livingRoomSize: listing.livingRoomSize,
      balconyCount: listing.balconyCount,
      galleryCount: listing.galleryCount,
      builtInWardrobes: listing.builtInWardrobes,
      // Materials
      mainFloorType: listing.mainFloorType,
      shutterType: listing.shutterType,
      carpentryType: listing.carpentryType,
      windowType: listing.windowType,
      // Views
      views: listing.views,
      mountainViews: listing.mountainViews,
      seaViews: listing.seaViews,
      beachfront: listing.beachfront,
      // Premium features
      jacuzzi: listing.jacuzzi,
      hydromassage: listing.hydromassage,
      garden: listing.garden,
      pool: listing.pool,
      communityPool: listing.communityPool,
      privatePool: listing.privatePool,
      homeAutomation: listing.homeAutomation,
      musicSystem: listing.musicSystem,
      laundryRoom: listing.laundryRoom,
      coveredClothesline: listing.coveredClothesline,
      fireplace: listing.fireplace,
      gym: listing.gym,
      sportsArea: listing.sportsArea,
      childrenArea: listing.childrenArea,
      suiteBathroom: listing.suiteBathroom,
      tennisCourt: listing.tennisCourt,
      // Location
      nearbyPublicTransport: listing.nearbyPublicTransport,
      // Rental features
      internet: listing.internet,
      appliancesIncluded: listing.appliancesIncluded,
    });

    // Add residential-specific rental features (not for commercial)
    if (isResidentialProperty(propertyType)) {
      Object.assign(relevantFields, {
        studentFriendly: listing.studentFriendly,
        petsAllowed: listing.petsAllowed,
        // Appliances
        oven: listing.oven,
        microwave: listing.microwave,
        washingMachine: listing.washingMachine,
        fridge: listing.fridge,
        tv: listing.tv,
        stoneware: listing.stoneware,
      });
    }
  }

  // Remove undefined, null, and empty string values (but keep false - it's informative)
  const cleanedFields = Object.fromEntries(
    Object.entries(relevantFields).filter(
      ([_, value]) => value !== undefined && value !== null && value !== "",
    ),
  );

  return cleanedFields;
}

/**
 * Gets the display name for a property type in Spanish
 */
export function getPropertyTypeDisplayName(propertyType: PropertyType): string {
  const displayNames: Record<PropertyType, string> = {
    piso: "Piso",
    casa: "Casa",
    local: "Local",
    solar: "Solar",
    garaje: "Garaje",
  };

  return displayNames[propertyType] || propertyType;
}

/**
 * Display names for garage subtypes (Idealista values → Spanish labels)
 */
export const GARAGE_SUBTYPE_DISPLAY_NAMES: Record<string, string> = {
  motorcycle: "Moto",
  car_compact: "Coche pequeño",
  car_sedan: "Coche normal",
  car_and_motorcycle: "Coche y moto",
  two_cars_and_more: "Dos coches o más",
};

/**
 * Gets the display name for a garage subtype
 */
export function getGarageSubtypeDisplayName(subtype: string): string {
  return GARAGE_SUBTYPE_DISPLAY_NAMES[subtype] ?? subtype;
}

/**
 * Gets the available subtypes for a property type
 */
export function getPropertySubtypes(propertyType: PropertyType): string[] {
  const subtypes: Record<PropertyType, string[]> = {
    piso: [
      "Tríplex",
      "Dúplex",
      "Ático",
      "Estudio",
      "Loft",
      "Piso",
      "Apartamento",
      "Bajo",
    ],
    casa: [
      "Casa",
      "Casa adosada",
      "Casa pareada",
      "Chalet",
      "Casa rústica",
      "Bungalow",
    ],
    local: ["Local Comercial", "Residencial", "Otros", "Mixto residencial", "Oficinas", "Hotel"],
    solar: ["Suelo residencial", "Suelo industrial", "Suelo rústico"],
    // Garage subtypes use Idealista's featuresGarageCapacityType values
    garaje: ["motorcycle", "car_compact", "car_sedan", "car_and_motorcycle", "two_cars_and_more"],
  };

  return subtypes[propertyType] || [];
}
