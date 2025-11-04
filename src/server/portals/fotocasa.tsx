"use server";

import { getListingDetailsWithAuth, updateListing } from "../queries/listing";
import {
  getPropertyImages,
  getPropertyVideos,
  getPropertyYouTubeLinks,
  getPropertyVirtualTours,
} from "../queries/property_images";
import {
  getAccountWatermarkConfig,
  getAccountIdForListing,
  getAccountFotocasaApiKey,
} from "../queries/accounts";
import {
  processAndUploadWatermarkedImages,
  cleanupWatermarkedImages,
} from "../utils/watermarked-upload";
import { getPropertyDocuments } from "../queries/document";
import { POSITION_MAPPING } from "~/types/watermark";
import type { WatermarkConfig } from "~/types/watermark";
import {
  logPayloadBuild,
  logPublishRequest,
  logUpdateRequest,
  logDeleteRequest,
} from "../utils/fotocasa-logger";
import { env } from "~/env";

// Types
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ListingDetails {
  propertyId?: bigint;
  referenceNumber?: string;
  postalCode?: string;
  addressDetails?: string;
  longitude?: number;
  latitude?: number;
  street?: string;
  squareMeter?: number;
  title?: string;
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  isFurnished?: boolean;
  hasElevator?: boolean;
  homeAutomation?: boolean;
  internet?: boolean;
  gym?: boolean;
  sportsArea?: boolean;
  childrenArea?: boolean;
  suiteBathroom?: boolean;
  airConditioning?: boolean;
  heating?: boolean;
  oven?: boolean;
  microwave?: boolean;
  fridge?: boolean;
  tv?: boolean;
  stoneware?: boolean;
  petsAllowed?: boolean;
  nearbyPublicTransport?: boolean;
  securityDoor?: boolean;
  alarm?: boolean;
  privatePool?: boolean;
  communityPool?: boolean;
  hasGarage?: boolean;
  jacuzzi?: boolean;
  fireplace?: boolean;
  tennisCourt?: boolean;
  laundryRoom?: boolean;
  builtInWardrobes?: boolean;
  hasStorageRoom?: boolean;
  garden?: boolean;
  furnishedKitchen?: boolean;
  orientation?: string;
  conservationStatus?: string;
  agent?: { email?: string; phone?: string } | null;
  listingType?: string;
  price?: number;
  listingId?: number;
  propertyType?: string;
  propertySubtype?: string;
  appliancesIncluded?: boolean;
  yearBuilt?: number;
  washingMachine?: boolean;
  secadora?: boolean;
  [key: string]: unknown;
}

// Fotocasa API Types
interface FotocasaProperty {
  ExternalId: string;
  AgencyReference: string;
  TypeId: number;
  SubTypeId: number;
  ContactTypeId: number;
  PropertyAddress: PropertyAddress[];
  PropertyDocument?: PropertyDocument[];
  PropertyFeature: PropertyFeature[];
  PropertyContactInfo: PropertyContactInfo[];
  PropertyPublications?: PropertyPublication[];
  PropertyTransaction: PropertyTransaction[];
}

interface PropertyAddress {
  ZipCode?: string;
  FloorId?: number;
  x: number;
  y: number;
  VisibilityModeId: number;
  Street?: string;
  Number?: string;
}

interface PropertyDocument {
  TypeId: number; // 1=Image, 8=Video (max 100MB), 31=External video link (YouTube/Vimeo), 23=Blueprint, 7=Virtual tour
  Url: string;
  SortingId: number;
}

interface PropertyFeature {
  FeatureId: number;
  DecimalValue?: number;
  BoolValue?: boolean;
  DateValue?: string;
  TextValue?: string;
}

interface PropertyContactInfo {
  TypeId: number;
  Value: string;
}

interface PropertyPublication {
  PublicationId: number;
  PublicationTypeId: number;
}

interface PropertyTransaction {
  TransactionTypeId: number;
  Price: number;
  ShowPrice?: boolean;
}

// Property type mapping (from our schema to Fotocasa)
const PROPERTY_TYPE_MAPPING: Record<string, number> = {
  piso: 1, // Flat
  casa: 2, // House
  local: 3, // Commercial store
  oficina: 4, // Office
  edificio: 5, // Building
  solar: 6, // Land
  industrial: 7, // Industrial building
  garaje: 8, // Garage
  trastero: 12, // Storage room
};

// Property subtype mapping (matching Fotocasa documentation)
const PROPERTY_SUBTYPE_MAPPING: Record<string, number> = {
  // Flat subtypes
  Tríplex: 2,
  Dúplex: 3,
  Ático: 5,
  Estudio: 6,
  Loft: 7,
  Piso: 9,
  Apartamento: 10,
  Bajo: 11,

  // House subtypes
  Casa: 13,
  "Casa adosada": 17,
  "Casa pareada": 19,
  Chalet: 20,
  "Casa rústica": 24,
  Bungalow: 27,

  // Building subtypes
  Residencial: 48,
  Otros: 49,
  "Mixto residencial": 50,
  Oficinas: 51,
  Hotel: 72,

  // Land subtypes
  "Suelo residencial": 56,
  "Suelo industrial": 60,
  "Suelo rústico": 91,

  // Garage subtypes
  Moto: 68,
  Doble: 69,
  Individual: 70,
};

// Transaction type mapping
const TRANSACTION_TYPE_MAPPING: Record<string, number> = {
  Sale: 1, // Buy
  Rent: 3, // Rent
  Transfer: 4, // Transfer
  RoomSharing: 7, // Share
  RentWithOption: 9, // Rent with buy option
};

// Orientation mapping (Spanish to Fotocasa IDs)
const ORIENTATION_MAPPING: Record<string, number> = {
  noreste: 1, // North east
  oeste: 2, // West
  norte: 3, // North
  suroeste: 4, // South west
  este: 5, // East
  sureste: 6, // South east
  noroeste: 7, // North west
  sur: 8, // South
};

export async function buildFotocasaPayload(
  listingId: number,
  visibilityMode = 1,
  hidePrice = false,
): Promise<{ payload: FotocasaProperty; watermarkedKeys: string[] }> {
  try {
    // Get listing details and property images
    const listing = await getListingDetailsWithAuth(listingId);
    const images = await getPropertyImages(BigInt(listing.propertyId));

    // NEW: Get account watermark configuration and process images if needed
    const accountId = await getAccountIdForListing(listingId);
    let processedImages = images;

    if (accountId) {
      try {
        const watermarkConfig = await getAccountWatermarkConfig(accountId);

        console.log("Processing Fotocasa images with watermarking:", {
          listingId,
          accountId: accountId.toString(),
          watermarkEnabled: watermarkConfig.watermarkEnabled,
          hasLogo: !!watermarkConfig.logoTransparent,
          imageCount: images.length,
        });

        // Process images with watermarking if enabled
        if (
          watermarkConfig.watermarkEnabled &&
          watermarkConfig.logoTransparent &&
          images.length > 0
        ) {
          // Convert account watermark settings to WatermarkConfig
          const watermarkConfigForProcessing: WatermarkConfig = {
            enabled: watermarkConfig.watermarkEnabled,
            logoUrl: watermarkConfig.logoTransparent,
            position:
              POSITION_MAPPING[watermarkConfig.watermarkPosition ?? "center"] ??
              "center",
            size: 40, // 40% of image width
          };

          const imageProcessingInput = images.map((img) => ({
            imageUrl: img.imageUrl,
            imageOrder: img.imageOrder,
          }));

          // Upload watermarked images to S3 and get their URLs
          const watermarkResults = await processAndUploadWatermarkedImages(
            imageProcessingInput,
            watermarkConfigForProcessing,
            listing.referenceNumber ?? listingId.toString(),
          );

          // Store watermarked keys for cleanup later
          const watermarkedKeys: string[] = [];

          // Map results back to original image format, preserving all original data
          processedImages = images.map((originalImage) => {
            const processedResult = watermarkResults.find(
              (result) => result.imageOrder === originalImage.imageOrder,
            );

            if (processedResult?.watermarked) {
              console.log(
                `Using watermarked version for image order ${originalImage.imageOrder}`,
              );

              // Track watermarked keys for cleanup
              if (processedResult.watermarkedKey) {
                watermarkedKeys.push(processedResult.watermarkedKey);
              }

              return {
                ...originalImage,
                imageUrl: processedResult.imageUrl, // Use S3 watermarked URL
              };
            } else {
              // Log but continue with original image (graceful fallback)
              if (processedResult?.error) {
                console.warn(
                  `Watermarking failed for image ${originalImage.imageUrl}:`,
                  processedResult.error,
                );
              }
              return originalImage;
            }
          });

          // Store watermarked keys in the listing object for later cleanup
          (
            listing as typeof listing & { _watermarkedKeys?: string[] }
          )._watermarkedKeys = watermarkedKeys;

          const watermarkedCount = processedImages.filter(
            (img, index) => watermarkResults[index]?.watermarked,
          ).length;

          console.log(
            `Fotocasa watermarking completed: ${watermarkedCount}/${images.length} images uploaded to S3`,
          );
        } else {
          console.log(
            "Watermarking disabled or no logo available, using original images",
          );
        }
      } catch (watermarkError) {
        // CRITICAL: Never fail Fotocasa upload due to watermarking issues
        console.error(
          "Error during watermark processing, using original images:",
          watermarkError,
        );
        processedImages = images; // Fallback to original images
      }
    } else {
      console.warn(
        `Could not find account for listing ${listingId}, skipping watermarking`,
      );
    }

    // Fetch additional media types for Fotocasa
    const videos = await getPropertyVideos(BigInt(listing.propertyId), true);
    const youtubeLinks = await getPropertyYouTubeLinks(
      BigInt(listing.propertyId),
      true,
    );
    const virtualTours = await getPropertyVirtualTours(
      BigInt(listing.propertyId),
      true,
    );
    const blueprints = await getPropertyDocuments(
      BigInt(listing.propertyId),
      "blueprint",
      true,
    );

    console.log("Fetched additional media for Fotocasa:", {
      videosCount: videos.length,
      youtubeLinksCount: youtubeLinks.length,
      virtualToursCount: virtualTours.length,
      blueprintsCount: blueprints.length,
    });

    // Extract floor number from addressDetails (get second number if exists)
    const getFloorId = (addressDetails: string | null): number | undefined => {
      if (!addressDetails) return undefined;

      // Floor mapping according to Fotocasa specification
      const floorMapping: Record<string, number> = {
        basement: 1,
        sotano: 1,
        ground: 3,
        "ground floor": 3,
        "planta baja": 3,
        mezzanine: 4,
        entresuelo: 4,
        first: 6,
        primera: 6,
        "1st": 6,
        second: 7,
        segunda: 7,
        "2nd": 7,
        third: 8,
        tercera: 8,
        "3rd": 8,
        fourth: 9,
        cuarta: 9,
        "4th": 9,
        fifth: 10,
        quinta: 10,
        "5th": 10,
        sixth: 11,
        sexta: 11,
        "6th": 11,
        seventh: 12,
        septima: 12,
        "7th": 12,
        eighth: 13,
        octava: 13,
        "8th": 13,
        ninth: 14,
        novena: 14,
        "9th": 14,
        tenth: 15,
        decima: 15,
        "10th": 15,
        penthouse: 22,
        atico: 22,
        other: 31,
      };

      // Convert to lowercase for case-insensitive matching
      const lowerAddress = addressDetails.toLowerCase();

      // Try to match floor descriptions
      for (const [floorDesc, floorId] of Object.entries(floorMapping)) {
        if (lowerAddress.includes(floorDesc)) {
          return floorId;
        }
      }

      // If no specific floor description found, try to extract number and map it
      const numbers = addressDetails.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        const floorNumber = parseInt(numbers[0]);

        // Map numeric floors to IDs
        if (floorNumber === 0) return 3; // Ground floor
        if (floorNumber === 1) return 6; // First
        if (floorNumber === 2) return 7; // Second
        if (floorNumber === 3) return 8; // Third
        if (floorNumber === 4) return 9; // Fourth
        if (floorNumber === 5) return 10; // Fifth
        if (floorNumber === 6) return 11; // Sixth
        if (floorNumber === 7) return 12; // Seventh
        if (floorNumber === 8) return 13; // Eighth
        if (floorNumber === 9) return 14; // Ninth
        if (floorNumber === 10) return 15; // Tenth
        if (floorNumber > 10) return 16; // Tenth upwards
      }

      return undefined;
    };

    // Extract street name (text before first comma)
    const getStreetName = (street: string | null): string | undefined => {
      if (!street) return undefined;
      return street.split(",")[0]?.trim();
    };

    // Extract street number (first number after comma)
    const getStreetNumber = (
      street: string | null,
      addressDetails: string | null,
    ): string | undefined => {
      const fullAddress = `${street ?? ""} ${addressDetails ?? ""}`.trim();
      const numbers = fullAddress.match(/\d+/g);
      return numbers && numbers.length > 0 ? numbers[0] : undefined;
    };

    // Build PropertyAddress
    const propertyAddress: PropertyAddress[] = [
      {
        ZipCode: listing.postalCode ?? undefined,
        FloorId: getFloorId(listing.addressDetails ?? null),
        x: listing.longitude ? parseFloat(listing.longitude.toString()) : 0,
        y: listing.latitude ? parseFloat(listing.latitude.toString()) : 0,
        VisibilityModeId: visibilityMode, // 1=Exact, 2=Street, 3=Zone
        Street: getStreetName(listing.street ?? null),
        Number: getStreetNumber(
          listing.street ?? null,
          listing.addressDetails ?? null,
        ),
      },
    ];

    // Build PropertyFeatures
    const propertyFeatures: PropertyFeature[] = [];

    // Surface (FeatureId: 1) - use appropriate field based on property type with fallback
    // For "local" properties, prefer builtSurfaceArea, otherwise use squareMeter
    // For other properties, prefer squareMeter, otherwise use builtSurfaceArea
    const surfaceValue =
      listing.propertyType === "local"
        ? (listing.builtSurfaceArea ?? listing.squareMeter)
        : (listing.squareMeter ?? listing.builtSurfaceArea);

    if (surfaceValue) {
      propertyFeatures.push({
        FeatureId: 1,
        DecimalValue: Number(surfaceValue),
      });
    }

    // Title (FeatureId: 2)
    if (listing.title) {
      propertyFeatures.push({
        FeatureId: 2,
        TextValue: listing.title,
      });
    }

    // Description (FeatureId: 3)
    if (listing.description) {
      propertyFeatures.push({
        FeatureId: 3,
        TextValue: listing.description,
      });
    }

    // Bedrooms (FeatureId: 11)
    if (listing.bedrooms) {
      propertyFeatures.push({
        FeatureId: 11,
        DecimalValue: listing.bedrooms,
      });
    }

    // Bathrooms (FeatureId: 12)
    if (listing.bathrooms) {
      propertyFeatures.push({
        FeatureId: 12,
        DecimalValue: parseFloat(listing.bathrooms.toString()),
      });
    }

    // Is Furnished (FeatureId: 30)
    if (listing.isFurnished !== null) {
      propertyFeatures.push({
        FeatureId: 30,
        BoolValue: listing.isFurnished ?? false,
      });
    }

    // Elevator (FeatureId: 22)
    if (listing.hasElevator !== null) {
      propertyFeatures.push({
        FeatureId: 22,
        BoolValue: listing.hasElevator ?? false,
      });
    }

    // Home Automation (FeatureId: 142)
    if (
      "homeAutomation" in listing &&
      typeof (listing as Record<string, unknown>).homeAutomation === "boolean"
    ) {
      propertyFeatures.push({
        FeatureId: 142,
        BoolValue: (listing as Record<string, unknown>)
          .homeAutomation as boolean,
      });
    }

    // Internet (FeatureId: 286)
    if (listing.internet !== null) {
      propertyFeatures.push({
        FeatureId: 286,
        BoolValue: listing.internet ?? false,
      });
    }

    // Gym (FeatureId: 309)
    if (listing.gym !== null) {
      propertyFeatures.push({
        FeatureId: 309,
        BoolValue: listing.gym ?? false,
      });
    }

    // Sports Area (FeatureId: 302)
    if (listing.sportsArea !== null) {
      propertyFeatures.push({
        FeatureId: 302,
        BoolValue: listing.sportsArea ?? false,
      });
    }

    // Children Area (FeatureId: 303)
    if (listing.childrenArea !== null) {
      propertyFeatures.push({
        FeatureId: 303,
        BoolValue: listing.childrenArea ?? false,
      });
    }

    // Community Area (FeatureId: 301)
    if (listing.communityArea !== null) {
      propertyFeatures.push({
        FeatureId: 301,
        BoolValue: listing.communityArea ?? false,
      });
    }

    // Suite Bathroom (FeatureId: 260)
    if (listing.suiteBathroom !== null) {
      propertyFeatures.push({
        FeatureId: 260,
        BoolValue: listing.suiteBathroom ?? false,
      });
    }

    // Appliances Included (FeatureId: 259)
    if (listing.appliancesIncluded !== null) {
      propertyFeatures.push({
        FeatureId: 259,
        BoolValue: listing.appliancesIncluded ?? false,
      });
    }

    // Year Built (FeatureId: 231)
    if (listing.yearBuilt) {
      propertyFeatures.push({
        FeatureId: 231,
        DecimalValue: listing.yearBuilt,
      });
    }

    // Individual appliances
    if (listing.oven !== null) {
      propertyFeatures.push({
        FeatureId: 288,
        BoolValue: listing.oven ?? false,
      });
    }
    if (listing.washingMachine !== null) {
      propertyFeatures.push({
        FeatureId: 293,
        BoolValue: listing.washingMachine ?? false,
      });
    }
    // Dryer/Secadora (FeatureId: 315)
    if (listing.secadora !== null) {
      propertyFeatures.push({
        FeatureId: 315,
        BoolValue: listing.secadora ?? false,
      });
    }
    if (listing.microwave !== null) {
      propertyFeatures.push({
        FeatureId: 287,
        BoolValue: listing.microwave ?? false,
      });
    }
    if (listing.fridge !== null) {
      propertyFeatures.push({
        FeatureId: 292,
        BoolValue: listing.fridge ?? false,
      });
    }
    if (listing.tv !== null) {
      propertyFeatures.push({ FeatureId: 291, BoolValue: listing.tv ?? false });
    }
    // Dishwasher/Lavavajillas (FeatureId: 316)
    if (listing.stoneware !== null) {
      propertyFeatures.push({
        FeatureId: 316,
        BoolValue: listing.stoneware ?? false,
      });
    }

    // Pets Allowed (FeatureId: 313)
    if (listing.petsAllowed !== null) {
      propertyFeatures.push({
        FeatureId: 313,
        BoolValue: listing.petsAllowed ?? false,
      });
    }

    // Nearby Public Transport (FeatureId: 176)
    if (listing.nearbyPublicTransport !== null) {
      propertyFeatures.push({
        FeatureId: 176,
        BoolValue: listing.nearbyPublicTransport ?? false,
      });
    }

    // Security Door (FeatureId: 294)
    if (
      "securityDoor" in listing &&
      typeof (listing as Record<string, unknown>).securityDoor === "boolean"
    ) {
      propertyFeatures.push({
        FeatureId: 294,
        BoolValue: (listing as Record<string, unknown>).securityDoor as boolean,
      });
    }

    // Alarm (FeatureId: 235)
    if (
      "alarm" in listing &&
      typeof (listing as Record<string, unknown>).alarm === "boolean"
    ) {
      propertyFeatures.push({
        FeatureId: 235,
        BoolValue: (listing as Record<string, unknown>).alarm as boolean,
      });
    }

    // Private Pool (FeatureId: 25)
    if (
      "privatePool" in listing &&
      typeof (listing as Record<string, unknown>).privatePool === "boolean"
    ) {
      propertyFeatures.push({
        FeatureId: 25,
        BoolValue: (listing as Record<string, unknown>).privatePool as boolean,
      });
    }

    // Community Pool (FeatureId: 300)
    if (
      "communityPool" in listing &&
      typeof (listing as Record<string, unknown>).communityPool === "boolean"
    ) {
      propertyFeatures.push({
        FeatureId: 300,
        BoolValue: (listing as Record<string, unknown>)
          .communityPool as boolean,
      });
    }

    // Parking/Garage (FeatureId: 23)
    if (listing.hasGarage !== null) {
      propertyFeatures.push({
        FeatureId: 23,
        BoolValue: listing.hasGarage ?? false,
      });
    }

    // Jacuzzi (FeatureId: 274)
    if (listing.jacuzzi !== null) {
      propertyFeatures.push({
        FeatureId: 274,
        BoolValue: listing.jacuzzi ?? false,
      });
    }

    // Fireplace/Chimenea (FeatureId: 311)
    if (listing.fireplace !== null) {
      propertyFeatures.push({
        FeatureId: 311,
        BoolValue: listing.fireplace ?? false,
      });
    }

    // Tennis Court (FeatureId: 310)
    if (listing.tennisCourt !== null) {
      propertyFeatures.push({
        FeatureId: 310,
        BoolValue: listing.tennisCourt ?? false,
      });
    }

    // Laundry Room (FeatureId: 257)
    if ("hasLaundryRoom" in listing && listing.hasLaundryRoom !== null) {
      propertyFeatures.push({
        FeatureId: 257,
        BoolValue: listing.hasLaundryRoom ?? false,
      });
    }

    // Built-in Wardrobes (FeatureId: 258)
    if (listing.builtInWardrobes) {
      propertyFeatures.push({
        FeatureId: 258,
        BoolValue: true,
      });
    }

    // Storage Room (FeatureId: 24)
    if (listing.hasStorageRoom !== null) {
      propertyFeatures.push({
        FeatureId: 24,
        BoolValue: listing.hasStorageRoom ?? false,
      });
    }

    // Private Garden (FeatureId: 298) - using garden field
    if (listing.garden !== null) {
      propertyFeatures.push({
        FeatureId: 298,
        BoolValue: listing.garden ?? false,
      });
    }

    // Equipped Kitchen (FeatureId: 314)
    if (listing.furnishedKitchen !== null) {
      propertyFeatures.push({
        FeatureId: 314,
        BoolValue: listing.furnishedKitchen ?? false,
      });
    }

    // Orientation (FeatureId: 28)
    if (listing.orientation) {
      const orientationId =
        ORIENTATION_MAPPING[listing.orientation.toLowerCase()];
      if (orientationId) {
        propertyFeatures.push({
          FeatureId: 28,
          DecimalValue: orientationId,
        });
      }
    }

    // --- QUICK WIN ADDITIONS ---

    // Terrace (FeatureId: 27)
    if (
      "terrace" in listing &&
      typeof (listing as Record<string, unknown>).terrace === "boolean"
    ) {
      propertyFeatures.push({
        FeatureId: 27,
        BoolValue: (listing as Record<string, unknown>).terrace as boolean,
      });
    }

    // Terrace surface (FeatureId: 62)
    if (
      "terraceSize" in listing &&
      (listing as Record<string, unknown>).terraceSize
    ) {
      propertyFeatures.push({
        FeatureId: 62,
        DecimalValue: Number((listing as Record<string, unknown>).terraceSize),
      });
    }

    // Has heating (FeatureId: 29)
    if (
      "hasHeating" in listing &&
      typeof (listing as Record<string, unknown>).hasHeating === "boolean"
    ) {
      propertyFeatures.push({
        FeatureId: 29,
        BoolValue: (listing as Record<string, unknown>).hasHeating as boolean,
      });
    }

    // Sauna (FeatureId: 277)
    if (listing.sauna !== null) {
      propertyFeatures.push({
        FeatureId: 277,
        BoolValue: listing.sauna ?? false,
      });
    }

    // Loading Area/Zona de carga (FeatureId: 204)
    if (listing.loadingArea !== null) {
      propertyFeatures.push({
        FeatureId: 204,
        BoolValue: listing.loadingArea ?? false,
      });
    }

    // Patio/Yard (FeatureId: 263)
    if (listing.patio !== null) {
      propertyFeatures.push({
        FeatureId: 263,
        BoolValue: listing.patio ?? false,
      });
    }

    // Balcony (FeatureId: 297) - convert balconyCount to boolean
    if (
      "balconyCount" in listing &&
      (listing as Record<string, unknown>).balconyCount !== null
    ) {
      const balconyCount = Number(
        (listing as Record<string, unknown>).balconyCount,
      );
      propertyFeatures.push({
        FeatureId: 297,
        BoolValue: balconyCount > 0,
      });
    }

    // Land area (FeatureId: 69) - only for solar/land properties
    if (listing.propertyType === "solar" && listing.builtSurfaceArea) {
      propertyFeatures.push({
        FeatureId: 69,
        DecimalValue: Number(listing.builtSurfaceArea),
      });
    }

    // Allowed Use (FeatureId: 21) - only for solar/land properties
    if (listing.propertyType === "solar" && listing.allowedUse != null) {
      const allowedUseValue = Number(listing.allowedUse);
      // Only add if it's a valid allowed use value (1, 2, 3, 4, 8, 9)
      if ([1, 2, 3, 4, 8, 9].includes(allowedUseValue)) {
        propertyFeatures.push({
          FeatureId: 21,
          DecimalValue: allowedUseValue,
        });
      }
    }

    // Air conditioner (FeatureId: 254) - convert airConditioningType to boolean
    if ("airConditioningType" in listing) {
      const airCondType = (listing as Record<string, unknown>)
        .airConditioningType;
      // Convert airCondType to boolean - it's considered true if it's not null/undefined and has a non-empty string value
      const hasAirConditioning =
        airCondType !== null &&
        airCondType !== undefined &&
        (typeof airCondType === "string"
          ? airCondType.trim() !== ""
          : Boolean(airCondType));
      propertyFeatures.push({
        FeatureId: 254,
        BoolValue: hasAirConditioning,
      });
    }

    // Surveillance system/Alarm (FeatureId: 272) - using alarm field
    if (
      "alarm" in listing &&
      typeof (listing as Record<string, unknown>).alarm === "boolean"
    ) {
      propertyFeatures.push({
        FeatureId: 272,
        BoolValue: (listing as Record<string, unknown>).alarm as boolean,
      });
    }

    // Office kitchen (FeatureId: 289) - using furnishedKitchen as proxy
    if (listing.furnishedKitchen !== null) {
      propertyFeatures.push({
        FeatureId: 289,
        BoolValue: listing.furnishedKitchen ?? false,
      });
    }

    // Parquet (FeatureId: 290) - check if mainFloorType is parquet
    if (
      "mainFloorType" in listing &&
      (listing as Record<string, unknown>).mainFloorType
    ) {
      const floorType = String(
        (listing as Record<string, unknown>).mainFloorType,
      ).toLowerCase();
      propertyFeatures.push({
        FeatureId: 290,
        BoolValue: floorType === "parquet",
      });
    }

    // --- ADDITIONAL PROPERTY FIELDS (Conservation, Energy Certificate, etc.) ---
    // Type assertion for optional fields that may not be in the base listing type
    const listingWithEnergy = listing as typeof listing & {
      conservationStatus?: string | number;
      energyConsumptionScale?: string;
      emissionsScale?: string;
      energyConsumptionValue?: number;
      emissionsValue?: number;
      energyCertificateStatus?: string;
      heatingType?: string | number;
      hotWaterType?: string | number;
    };

    // Conservation Status (FeatureId: 249)
    // Values: 1=Good, 2=Pretty good, 3=Almost new, 4=Needs renovation, 6=Renovated
    if (listingWithEnergy.conservationStatus != null) {
      const conservationValue = Number(listingWithEnergy.conservationStatus);
      // Only add if it's a valid conservation status value (1, 2, 3, 4, or 6)
      if ([1, 2, 3, 4, 6].includes(conservationValue)) {
        propertyFeatures.push({
          FeatureId: 249,
          DecimalValue: conservationValue,
        });
      }
    }

    // Consumption efficiency scale (FeatureId: 323)
    if (listingWithEnergy.energyConsumptionScale) {
      const scaleMap = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7 };
      const scaleKey = String(
        listingWithEnergy.energyConsumptionScale,
      ).toUpperCase() as keyof typeof scaleMap;
      const scaleValue = scaleMap[scaleKey];
      if (scaleValue) {
        propertyFeatures.push({ FeatureId: 323, DecimalValue: scaleValue });
      }
    }
    // Emissions efficiency scale (FeatureId: 324)
    if (listingWithEnergy.emissionsScale) {
      const scaleMap = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7 };
      const scaleKey =
        listingWithEnergy.emissionsScale.toUpperCase() as keyof typeof scaleMap;
      const scaleValue = scaleMap[scaleKey];
      if (scaleValue) {
        propertyFeatures.push({ FeatureId: 324, DecimalValue: scaleValue });
      }
    }
    // Consumption efficiency value (FeatureId: 325)
    if (listingWithEnergy.energyConsumptionValue != null) {
      propertyFeatures.push({
        FeatureId: 325,
        DecimalValue: Number(listingWithEnergy.energyConsumptionValue),
      });
    }
    // Emissions efficiency value (FeatureId: 326)
    if (listingWithEnergy.emissionsValue != null) {
      propertyFeatures.push({
        FeatureId: 326,
        DecimalValue: Number(listingWithEnergy.emissionsValue),
      });
    }
    // Energy certificate status (FeatureId: 327)
    if (listingWithEnergy.energyCertificateStatus) {
      const statusMap = { available: 1, en_tramite: 2, exento: 3, uploaded: 1 };
      const statusKey =
        listingWithEnergy.energyCertificateStatus.toLowerCase() as keyof typeof statusMap;
      const statusValue = statusMap[statusKey];
      if (statusValue) {
        propertyFeatures.push({ FeatureId: 327, DecimalValue: statusValue });
      }
    }

    // --- HEATING & HOT WATER FIELDS (Fotocasa) ---
    // Heating (FeatureId: 320)
    // Map Spanish heating types to Fotocasa IDs
    const heatingTypeMapping: Record<string, number> = {
      "gas natural": 1,
      eléctrico: 2,
      electrico: 2, // Handle both with and without accent
      gasóleo: 3,
      gasoleo: 3,
      butano: 4,
      propano: 5,
      solar: 6,
    };

    if (listingWithEnergy.heatingType) {
      // Try to parse as number first (in case it's already stored as ID)
      let heatingId: number | undefined;

      if (!isNaN(Number(listingWithEnergy.heatingType))) {
        heatingId = Number(listingWithEnergy.heatingType);
      } else {
        // Map Spanish string to ID
        const heatingKey = String(listingWithEnergy.heatingType).toLowerCase();
        heatingId = heatingTypeMapping[heatingKey];
      }

      // Only add if it's a valid heating type ID (1-6)
      if (heatingId && heatingId >= 1 && heatingId <= 6) {
        propertyFeatures.push({ FeatureId: 320, DecimalValue: heatingId });
      }
    }
    // Hot water (FeatureId: 321)
    // Uses same mapping as heating (same energy sources)
    if (listingWithEnergy.hotWaterType) {
      // Try to parse as number first (in case it's already stored as ID)
      let hotWaterId: number | undefined;

      if (!isNaN(Number(listingWithEnergy.hotWaterType))) {
        hotWaterId = Number(listingWithEnergy.hotWaterType);
      } else {
        // Map Spanish string to ID using same mapping as heating
        const hotWaterKey = String(
          listingWithEnergy.hotWaterType,
        ).toLowerCase();
        hotWaterId = heatingTypeMapping[hotWaterKey];
      }

      // Only add if it's a valid hot water type ID (1-6)
      if (hotWaterId && hotWaterId >= 1 && hotWaterId <= 6) {
        propertyFeatures.push({ FeatureId: 321, DecimalValue: hotWaterId });
      }
    }

    // Build PropertyDocument (images) - use processed images (watermarked if applicable)
    const imageDocuments: PropertyDocument[] = processedImages
      .filter((image) => image.isActive) // Only include active images
      .sort((a, b) => (a.imageOrder || 0) - (b.imageOrder || 0)) // Ensure proper order
      .map((image) => ({
        TypeId: 1, // Image type
        Url: image.imageUrl, // This now contains watermarked URL if watermarking was applied
        SortingId: image.imageOrder ?? 1, // Use actual order set by user in gallery
      }));

    // Build video documents (TypeId: 8) - max 100MB per Fotocasa requirements
    const videoDocuments: PropertyDocument[] = videos
      .filter((video) => video.isActive)
      .sort((a, b) => (a.imageOrder || 0) - (b.imageOrder || 0))
      .map((video, index) => ({
        TypeId: 8, // Video type
        Url: video.imageUrl, // S3 video URL
        SortingId: imageDocuments.length + index + 1,
      }));

    // Build YouTube link documents (TypeId: 31)
    const youtubeDocuments: PropertyDocument[] = youtubeLinks
      .filter((link) => link.isActive)
      .sort((a, b) => (a.imageOrder || 0) - (b.imageOrder || 0))
      .map((link, index) => ({
        TypeId: 31, // External video link (YouTube, Vimeo)
        Url: link.imageUrl, // YouTube URL
        SortingId: imageDocuments.length + videoDocuments.length + index + 1,
      }));

    // Build virtual tour documents (TypeId: 7)
    const virtualTourDocuments: PropertyDocument[] = virtualTours
      .filter((tour) => tour.isActive)
      .sort((a, b) => (a.imageOrder || 0) - (b.imageOrder || 0))
      .map((tour, index) => ({
        TypeId: 7, // Virtual tour
        Url: tour.imageUrl, // Matterport/Kuula/etc URL
        SortingId:
          imageDocuments.length +
          videoDocuments.length +
          youtubeDocuments.length +
          index +
          1,
      }));

    // Build blueprint documents (TypeId: 23)
    const blueprintDocuments: PropertyDocument[] = blueprints
      .filter((blueprint) => blueprint.isActive)
      .sort((a, b) => (a.documentOrder || 0) - (b.documentOrder || 0))
      .map((blueprint, index) => ({
        TypeId: 23, // Blueprint
        Url: blueprint.fileUrl, // S3 PDF/image URL
        SortingId:
          imageDocuments.length +
          videoDocuments.length +
          youtubeDocuments.length +
          virtualTourDocuments.length +
          index +
          1,
      }));

    // Combine all media types into single PropertyDocument array
    const propertyDocuments: PropertyDocument[] = [
      ...imageDocuments,
      ...videoDocuments,
      ...youtubeDocuments,
      ...virtualTourDocuments,
      ...blueprintDocuments,
    ];

    console.log("Fotocasa PropertyDocument summary:", {
      images: imageDocuments.length,
      videos: videoDocuments.length,
      youtubeLinks: youtubeDocuments.length,
      virtualTours: virtualTourDocuments.length,
      blueprints: blueprintDocuments.length,
      total: propertyDocuments.length,
    });

    // Build PropertyContactInfo (hardcoded for now - should come from agent/owner data)
    const propertyContactInfo: PropertyContactInfo[] = [
      {
        TypeId: 1, // Email
        Value: listing.agent?.email ?? "demo@adevinta.com",
      },
      {
        TypeId: 2, // Phone
        Value: listing.agent?.phone ?? "942862711",
      },
    ];

    // Build PropertyTransaction
    const propertyTransaction: PropertyTransaction[] = [
      {
        TransactionTypeId:
          TRANSACTION_TYPE_MAPPING[listing.listingType ?? "Sale"] ?? 1,
        Price: parseFloat((listing.price ?? 0).toString()),
        ShowPrice: !hidePrice, // ShowPrice is true when hidePrice is false
      },
    ];

    // Build the complete payload
    const fotocasaPayload: FotocasaProperty = {
      ExternalId: (listing.listingId ?? 0).toString(),
      AgencyReference:
        listing.referenceNumber ?? (listing.listingId ?? 0).toString(),
      TypeId: PROPERTY_TYPE_MAPPING[listing.propertyType ?? "piso"] ?? 1,
      SubTypeId:
        PROPERTY_SUBTYPE_MAPPING[listing.propertySubtype ?? "Piso"] ?? 9, // Default to Flat (9) if no subtype
      ContactTypeId: 3, // Agency contact (hardcoded for now)
      PropertyAddress: propertyAddress,
      PropertyDocument:
        propertyDocuments.length > 0 ? propertyDocuments : undefined,
      PropertyFeature: propertyFeatures,
      PropertyContactInfo: propertyContactInfo,
      PropertyTransaction: propertyTransaction,
      PropertyPublications: [
        {
          PublicationId: 31, // Fotocasa publication ID
          PublicationTypeId: 2,
        },
      ],
    };

    // Get watermarkedKeys from the tracking variable
    const watermarkedKeys =
      (listing as typeof listing & { _watermarkedKeys?: string[] })
        ._watermarkedKeys ?? [];

    // Log the built payload
    await logPayloadBuild(listingId, fotocasaPayload, watermarkedKeys.length);

    return {
      payload: fotocasaPayload,
      watermarkedKeys,
    };
  } catch (error) {
    console.error("Error building Fotocasa payload:", error);
    throw error;
  }
}

// Server action to be called when confirming Fotocasa portal
export async function publishToFotocasa(
  listingId: number,
  visibilityMode = 1,
  hidePrice = false,
): Promise<{
  success: boolean;
  payload?: FotocasaProperty;
  error?: string;
  response?: unknown;
}> {
  try {
    // Get account ID for the listing
    const accountId = await getAccountIdForListing(listingId);
    if (!accountId) {
      throw new Error(`No account found for listing ${listingId}`);
    }

    // Get account-specific API key
    const apiKey = await getAccountFotocasaApiKey(accountId);
    if (!apiKey) {
      throw new Error(
        `No Fotocasa API key configured for account ${accountId}. Please configure the API key in portal settings.`,
      );
    }
    const FOTOCASA_API_KEY = apiKey;

    // Build the payload
    const { payload, watermarkedKeys } = await buildFotocasaPayload(
      listingId,
      visibilityMode,
      hidePrice,
    );

    // Log the payload for debugging
    console.log("Fotocasa POST Payload:", JSON.stringify(payload, null, 2));

    // Prepare request headers
    const requestHeaders = {
      "Content-Type": "application/json",
      "Api-Key": FOTOCASA_API_KEY,
      "X-Source": env.FOTOCASA_ID,
    };

    // Log headers for debugging
    console.log("=== FOTOCASA API HEADERS ===");
    console.log("Api-Key:", FOTOCASA_API_KEY);
    console.log("X-Source (Account ID from env):", env.FOTOCASA_ID);
    console.log("===========================");

    // Make the API call to Fotocasa
    const response = await fetch(
      "https://imports.gw.fotocasa.pro/api/property",
      {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(payload),
      },
    );

    const responseData = (await response.json()) as unknown;

    // Extract response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Log the response for debugging
    console.log("Fotocasa POST API Response:", responseData);

    // Check if the request was successful
    const isSuccess =
      response.ok &&
      (responseData as { StatusCode?: number }).StatusCode === 201;

    if (isSuccess) {
      // Log successful request
      await logPublishRequest(
        listingId,
        payload,
        responseData,
        true,
        undefined,
        requestHeaders,
        responseHeaders,
      );

      // Update database to set fotocasa = true ONLY on successful API response
      try {
        await updateListing(listingId, Number(accountId), { fotocasa: true });
        console.log(
          `Successfully updated database: listings.fotocasa = true for listing ${listingId}`,
        );
      } catch (dbError) {
        console.error(
          "Error updating database after successful Fotocasa publish:",
          dbError,
        );
        // Log but don't fail the operation - the ad is already published on Fotocasa
      }

      // Clean up watermarked images after successful upload
      if (watermarkedKeys.length > 0) {
        try {
          const cleanupResult = await cleanupWatermarkedImages(watermarkedKeys);
          console.log(
            `Cleanup completed: ${cleanupResult.deletedCount} watermarked images removed`,
          );
          if (!cleanupResult.success) {
            console.warn(
              "Some watermarked images could not be cleaned up:",
              cleanupResult.errors,
            );
          }
        } catch (cleanupError) {
          // Don't fail the main operation due to cleanup issues
          console.error(
            "Error during watermarked image cleanup:",
            cleanupError,
          );
        }
      }

      return {
        success: true,
        payload,
        response: responseData,
      };
    } else {
      const errorMessage =
        (responseData as { Message?: string }).Message ??
        `HTTP ${response.status}: ${response.statusText}`;

      // Log failed request
      await logPublishRequest(
        listingId,
        payload,
        responseData,
        false,
        errorMessage,
        requestHeaders,
        responseHeaders,
      );

      return {
        success: false,
        error: errorMessage,
        response: responseData,
      };
    }
  } catch (error) {
    console.error("Error publishing to Fotocasa:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Log the exception
    await logPublishRequest(
      listingId,
      undefined,
      undefined,
      false,
      errorMessage,
    );

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Server action to update existing listing on Fotocasa
export async function updateFotocasa(
  listingId: number,
  visibilityMode = 1,
  hidePrice = false,
): Promise<{
  success: boolean;
  payload?: FotocasaProperty;
  error?: string;
  response?: unknown;
}> {
  try {
    // Get account ID for the listing
    const accountId = await getAccountIdForListing(listingId);
    if (!accountId) {
      throw new Error(`No account found for listing ${listingId}`);
    }

    // Get account-specific API key
    const apiKey = await getAccountFotocasaApiKey(accountId);
    if (!apiKey) {
      throw new Error(
        `No Fotocasa API key configured for account ${accountId}. Please configure the API key in portal settings.`,
      );
    }
    const FOTOCASA_API_KEY = apiKey;

    // Build the payload (same as create operation)
    const { payload, watermarkedKeys } = await buildFotocasaPayload(
      listingId,
      visibilityMode,
      hidePrice,
    );

    // Log the payload for debugging
    console.log(
      "Fotocasa PUT Update Payload:",
      JSON.stringify(payload, null, 2),
    );
    console.log(`Updating listing ${listingId} on Fotocasa`);

    // Prepare request headers
    const requestHeaders = {
      "Content-Type": "application/json",
      "Api-Key": FOTOCASA_API_KEY,
      "X-Source": env.FOTOCASA_ID,
    };

    // Log headers for debugging
    console.log("=== FOTOCASA API HEADERS (PUT) ===");
    console.log("Api-Key:", FOTOCASA_API_KEY);
    console.log("X-Source (Account ID from env):", env.FOTOCASA_ID);
    console.log("==================================");

    // Make the PUT API call to Fotocasa
    // According to Fotocasa API docs: PUT api/property (no URI parameters)
    const response = await fetch(
      "https://imports.gw.fotocasa.pro/api/property",
      {
        method: "PUT",
        headers: requestHeaders,
        body: JSON.stringify(payload),
      },
    );

    const responseData = (await response.json()) as unknown;

    // Extract response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Log the response for debugging
    console.log("Fotocasa PUT Update API Response:", responseData);

    // Check if the request was successful
    const isSuccess =
      response.ok &&
      (responseData as { StatusCode?: number }).StatusCode === 200;

    if (isSuccess) {
      // Log successful update
      await logUpdateRequest(
        listingId,
        payload,
        responseData,
        true,
        undefined,
        requestHeaders,
        responseHeaders,
      );

      // Ensure database is set to fotocasa = true after successful update
      // (It should already be true, but this ensures consistency)
      try {
        await updateListing(listingId, Number(accountId), { fotocasa: true });
        console.log(
          `Successfully confirmed database: listings.fotocasa = true for listing ${listingId}`,
        );
      } catch (dbError) {
        console.error(
          "Error confirming database after successful Fotocasa update:",
          dbError,
        );
        // Log but don't fail the operation - the ad is already updated on Fotocasa
      }

      // Clean up watermarked images after successful update
      if (watermarkedKeys.length > 0) {
        try {
          const cleanupResult = await cleanupWatermarkedImages(watermarkedKeys);
          console.log(
            `Cleanup completed: ${cleanupResult.deletedCount} watermarked images removed`,
          );
          if (!cleanupResult.success) {
            console.warn(
              "Some watermarked images could not be cleaned up:",
              cleanupResult.errors,
            );
          }
        } catch (cleanupError) {
          // Don't fail the main operation due to cleanup issues
          console.error(
            "Error during watermarked image cleanup:",
            cleanupError,
          );
        }
      }

      return {
        success: true,
        payload,
        response: responseData,
      };
    } else {
      const errorMessage =
        (responseData as { Message?: string }).Message ??
        `HTTP ${response.status}: ${response.statusText}`;

      // Log failed update
      await logUpdateRequest(
        listingId,
        payload,
        responseData,
        false,
        errorMessage,
        requestHeaders,
        responseHeaders,
      );

      return {
        success: false,
        error: errorMessage,
        response: responseData,
      };
    }
  } catch (error) {
    console.error("Error updating on Fotocasa:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Log the exception
    await logUpdateRequest(
      listingId,
      undefined,
      undefined,
      false,
      errorMessage,
    );

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Server action to delete listing from Fotocasa
export async function deleteFromFotocasa(
  listingId: number,
): Promise<{ success: boolean; error?: string; response?: unknown }> {
  try {
    // Get account ID for the listing
    const accountId = await getAccountIdForListing(listingId);
    if (!accountId) {
      throw new Error(`No account found for listing ${listingId}`);
    }

    // Get account-specific API key
    const apiKey = await getAccountFotocasaApiKey(accountId);
    if (!apiKey) {
      throw new Error(
        `No Fotocasa API key configured for account ${accountId}. Please configure the API key in portal settings.`,
      );
    }
    const FOTOCASA_API_KEY = apiKey;

    // Convert listingId to base64 encoded string
    const externalId = listingId.toString();
    const base64ExternalId = Buffer.from(externalId).toString("base64");

    console.log(
      `Deleting listing ${listingId} from Fotocasa (base64: ${base64ExternalId})`,
    );

    // Prepare request headers
    const requestHeaders = {
      "Api-Key": FOTOCASA_API_KEY,
      "X-Source": env.FOTOCASA_ID,
    };

    // Log headers for debugging
    console.log("=== FOTOCASA API HEADERS (DELETE) ===");
    console.log("Api-Key:", FOTOCASA_API_KEY);
    console.log("X-Source (Account ID from env):", env.FOTOCASA_ID);
    console.log("=====================================");

    // Make the DELETE API call to Fotocasa
    const response = await fetch(
      `https://imports.gw.fotocasa.pro/api/v2/property/${base64ExternalId}`,
      {
        method: "DELETE",
        headers: requestHeaders,
      },
    );

    // Extract response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Log the response for debugging
    console.log("Fotocasa DELETE API Response status:", response.status);

    // Check if the request was successful
    if (response.ok) {
      console.log("Successfully deleted from Fotocasa");

      // Log successful deletion
      await logDeleteRequest(
        listingId,
        base64ExternalId,
        { status: response.status },
        true,
        undefined,
        requestHeaders,
        responseHeaders,
      );

      // Update database to set fotocasa = false ONLY on successful API response
      try {
        await updateListing(listingId, Number(accountId), { fotocasa: false });
        console.log(
          `Successfully updated database: listings.fotocasa = false for listing ${listingId}`,
        );
      } catch (dbError) {
        console.error(
          "Error updating database after successful Fotocasa delete:",
          dbError,
        );
        // Log but don't fail the operation - the ad is already deleted from Fotocasa
      }

      return {
        success: true,
        response: { status: response.status },
      };
    } else {
      // Try to get response body for error details
      let responseData: unknown;
      try {
        responseData = await response.json();
      } catch {
        responseData = {
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      console.error("Failed to delete from Fotocasa:", responseData);

      const errorMessage =
        (responseData as { Message?: string; message?: string }).Message ??
        (responseData as { message?: string }).message ??
        `HTTP ${response.status}: ${response.statusText}`;

      // Log failed deletion
      await logDeleteRequest(
        listingId,
        base64ExternalId,
        responseData,
        false,
        errorMessage,
        requestHeaders,
        responseHeaders,
      );

      return {
        success: false,
        error: errorMessage,
        response: responseData,
      };
    }
  } catch (error) {
    console.error("Error deleting from Fotocasa:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Log the exception
    await logDeleteRequest(listingId, "", undefined, false, errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}
