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
  local: "Residencial" | "Otros" | "Mixto residencial" | "Oficinas" | "Hotel";
  solar: "Suelo residencial" | "Suelo industrial" | "Suelo rústico";
  garaje: "Moto" | "Doble" | "Individual";
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

// Fields specific to garage properties
export interface GaragePropertyFields extends CorePropertyFields {
  propertyType: "garaje";

  // Garage-specific measurements (uses builtSurfaceArea instead of squareMeter)
  builtSurfaceArea?: number;

  // Construction details (limited for garages)
  yearBuilt?: number;
  conservationStatus?: number;

  // Garage-specific features
  hasGarage?: boolean; // Can still have additional garage spaces
  garageType?: string;
  garageSpaces?: number;
  garageInBuilding?: boolean;
  garageNumber?: string;
  optionalGaragePrice?: number;

  // Basic building features that apply to garages
  hasElevator?: boolean;

  // Security features (applicable to garages)
  videoIntercom?: boolean;
  conciergeService?: boolean;
  securityGuard?: boolean;
  alarm?: boolean;
  securityDoor?: boolean;

  // Building characteristics
  disabledAccessible?: boolean;
  vpo?: boolean;
  satelliteDish?: boolean;

  // Orientation (only exterior applies)
  exterior?: boolean;

  // Rental-specific (if applicable)
  internet?: boolean;
  studentFriendly?: boolean;
  petsAllowed?: boolean;
  appliancesIncluded?: boolean;
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
  const relevantFields: Partial<PropertyListing> = {
    propertyId: listing.propertyId,
    listingId: listing.listingId,
    propertyType: listing.propertyType,
    propertySubtype: listing.propertySubtype,
    listingType: listing.listingType,
    price: listing.price,
    cadastralReference: listing.cadastralReference,
    isBankOwned: listing.isBankOwned,
    isFeatured: listing.isFeatured,
    newConstruction: listing.newConstruction,
    publishToWebsite: listing.publishToWebsite,
    // Location fields (all properties)
    street: listing.street,
    addressDetails: listing.addressDetails,
    postalCode: listing.postalCode,
    neighborhood: listing.neighborhood,
    city: listing.city,
    province: listing.province,
    municipality: listing.municipality,
    // Content
    description: listing.description,
    shortDescription: listing.shortDescription,
    agent: listing.agent,
  };

  // Add property-type specific fields
  if (isGarageProperty(propertyType)) {
    // Garage properties - very limited fields
    Object.assign(relevantFields, {
      builtSurfaceArea: listing.builtSurfaceArea,
      yearBuilt: listing.yearBuilt,
      conservationStatus: listing.conservationStatus,
      hasElevator: listing.hasElevator,
      hasGarage: listing.hasGarage,
      garageType: listing.garageType,
      garageSpaces: listing.garageSpaces,
      garageInBuilding: listing.garageInBuilding,
      garageNumber: listing.garageNumber,
      optionalGaragePrice: listing.optionalGaragePrice,
      // Security features
      videoIntercom: listing.videoIntercom,
      conciergeService: listing.conciergeService,
      securityGuard: listing.securityGuard,
      alarm: listing.alarm,
      securityDoor: listing.securityDoor,
      // Building characteristics
      disabledAccessible: listing.disabledAccessible,
      vpo: listing.vpo,
      satelliteDish: listing.satelliteDish,
      // Basic characteristics
      exterior: listing.exterior,
      // Rental features (if applicable)
      internet: listing.internet,
      studentFriendly: listing.studentFriendly,
      petsAllowed: listing.petsAllowed,
      appliancesIncluded: listing.appliancesIncluded,
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

  return relevantFields;
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
    local: ["Residencial", "Otros", "Mixto residencial", "Oficinas", "Hotel"],
    solar: ["Suelo residencial", "Suelo industrial", "Suelo rústico"],
    garaje: ["Moto", "Doble", "Individual"],
  };

  return subtypes[propertyType] || [];
}
