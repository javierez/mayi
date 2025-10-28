/**
 * Enhanced Property Data Types for AWS Textract
 * Comprehensive mapping to all database schema fields for properties and listings tables
 */

// Enhanced interface covering ALL database schema fields
export interface EnhancedExtractedPropertyData {
  // Basic Information
  title?: string;
  description?: string;
  propertyType?: string;
  propertySubtype?: string;

  // Property Specifications
  bedrooms?: number;
  bathrooms?: number;
  squareMeter?: number;
  yearBuilt?: number;
  cadastralReference?: string;
  builtSurfaceArea?: number;
  conservationStatus?: number; // 1=Good, 2=Pretty good, 3=Almost new, 4=Needs renovation, 6=Renovated

  // Location Information
  street?: string;
  addressDetails?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;

  // Energy and Heating
  energyCertificateStatus?: string; // 'uploaded', 'en_tramite', 'exento'
  energyConsumptionScale?: string; // A-G
  energyConsumptionValue?: number; // kWh/m² año
  emissionsScale?: string; // A-G
  emissionsValue?: number; // kg CO2/m² año
  hasHeating?: boolean;
  heatingType?: string;

  // Basic Amenities
  hasElevator?: boolean;
  hasGarage?: boolean;
  hasStorageRoom?: boolean;

  // Property Features (Garage)
  garageType?: string;
  garageSpaces?: number;
  garageInBuilding?: boolean;
  elevatorToGarage?: boolean;
  garageNumber?: string;

  // Community and Recreational Amenities
  gym?: boolean;
  sportsArea?: boolean;
  childrenArea?: boolean;
  suiteBathroom?: boolean;
  nearbyPublicTransport?: boolean;
  communityPool?: boolean;
  privatePool?: boolean;
  tennisCourt?: boolean;

  // Property Characteristics
  disabledAccessible?: boolean;
  vpo?: boolean;
  videoIntercom?: boolean;
  conciergeService?: boolean;
  securityGuard?: boolean;
  satelliteDish?: boolean;
  doubleGlazing?: boolean;
  alarm?: boolean;
  securityDoor?: boolean;

  // Property Condition
  brandNew?: boolean;
  newConstruction?: boolean;
  underConstruction?: boolean;
  needsRenovation?: boolean;
  lastRenovationYear?: number;

  // Kitchen Features
  kitchenType?: string;
  hotWaterType?: string;
  openKitchen?: boolean;
  frenchKitchen?: boolean;
  furnishedKitchen?: boolean;
  pantry?: boolean;

  // Storage and Additional Spaces
  storageRoomSize?: number;
  storageRoomNumber?: string;
  terrace?: boolean;
  terraceSize?: number;
  wineCellar?: boolean;
  wineCellarSize?: number;
  livingRoomSize?: number;
  balconyCount?: number;
  galleryCount?: number;
  buildingFloors?: number;

  // Interior Features
  builtInWardrobes?: string;
  mainFloorType?: string;
  shutterType?: string;
  carpentryType?: string;
  orientation?: string;
  airConditioningType?: string;
  windowType?: string;

  // Views and Location Features
  exterior?: boolean;
  bright?: boolean;
  views?: boolean;
  mountainViews?: boolean;
  seaViews?: boolean;
  beachfront?: boolean;

  // Luxury Amenities
  jacuzzi?: boolean;
  hydromassage?: boolean;
  garden?: boolean;
  pool?: boolean;
  homeAutomation?: boolean;
  musicSystem?: boolean;
  laundryRoom?: boolean;
  coveredClothesline?: boolean;
  fireplace?: boolean;
}

// Enhanced interface for listing-specific data
export interface EnhancedExtractedListingData {
  // Listing Details
  listingType?: string; // "Sale" or "Rent"
  price?: number;
  isFurnished?: boolean;
  furnitureQuality?: string;
  hasKeys?: boolean;
  studentFriendly?: boolean;
  petsAllowed?: boolean;
  appliancesIncluded?: boolean;

  // Appliances and Amenities
  internet?: boolean;
  oven?: boolean;
  microwave?: boolean;
  washingMachine?: boolean;
  fridge?: boolean;
  tv?: boolean;
  stoneware?: boolean;

  // Optional Features
  optionalGarage?: boolean;
  optionalGaragePrice?: number;
  optionalStorageRoom?: boolean;
  optionalStorageRoomPrice?: number;
}

// Combined interface for all extracted data
export interface CompleteExtractedData {
  property: EnhancedExtractedPropertyData;
  listing: EnhancedExtractedListingData;
  contact: EnhancedExtractedContactData;
}

// Interface for individual field results with confidence and metadata
export interface ExtractedFieldResult {
  dbColumn: string;
  dbTable: "properties" | "listings" | "contacts";
  value: string | number | boolean;
  originalText: string;
  confidence: number;
  extractionSource:
    | "form"
    | "table"
    | "query"
    | "regex"
    | "text"
    | "gpt4"
    | "gpt4_function_calling"
    | "gpt4_ocr"
    | "voice_pattern";
  fieldType: "string" | "number" | "boolean" | "decimal";
  matched_alias?: string; // Which Spanish term was matched
}

// Interface for processing results
export interface ProcessingResult {
  documentKey: string;
  processingStartTime: Date;
  processingEndTime: Date;
  fileType: string;
  ocrConfidence: number;
  fieldsExtracted: number;
  fieldsAboveThreshold: number;
  fieldsSaved: number;
  propertyFieldsSaved: number;
  listingFieldsSaved: number;
  errors: string[];
  warnings: string[];
  extractedFields: ExtractedFieldResult[];
}

// Interface for database save results
export interface DatabaseSaveResult {
  success: boolean;
  propertyUpdated: boolean;
  listingUpdated: boolean;
  propertyErrors: string[];
  listingErrors: string[];
  fieldsProcessed: number;
  fieldsSaved: number;
  confidenceThreshold: number;
}

// Enhanced interface for extracted contact data
export interface EnhancedExtractedContactData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

// Type definitions for field validation
export type FieldValidator = (value: string) => boolean;
export type FieldConverter = (value: string) => string | number | boolean;

// Interface for field mapping configuration
export interface FieldMapping {
  dbColumn: string;
  dbTable: "properties" | "listings" | "contacts";
  aliases: string[];
  dataType: "string" | "number" | "boolean" | "decimal";
  validation?: FieldValidator;
  converter?: FieldConverter;
  examples?: string[]; // Example values to help with matching
  category?: string; // Group related fields together
}

// Logging interface for structured monitoring
export interface TextractProcessingLog {
  documentKey: string;
  processingStartTime: Date;
  processingEndTime: Date;
  fileType: string;
  fileSize?: number;
  ocrConfidence: number;
  fieldsExtracted: number;
  fieldsAboveThreshold: number;
  fieldsSaved: number;
  propertyFieldsSaved: number;
  listingFieldsSaved: number;
  errors: string[];
  warnings: string[];
  performanceMetrics: {
    ocrDuration: number;
    extractionDuration: number;
    databaseDuration: number;
    totalDuration: number;
  };
  extractionDetails: {
    formFieldsDetected: number;
    textBlocksProcessed: number;
    confidenceScores: number[];
    averageConfidence: number;
  };
}
