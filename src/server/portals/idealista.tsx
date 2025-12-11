"use server";

import { db } from "~/server/db";
import { listings, properties } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getListingDetailsWithAuth, updateListing } from "../queries/listing";
import { getPropertyImages } from "../queries/property_images";
import {
  getAccountWatermarkConfig,
  getAccountIdForListing,
} from "../queries/accounts";
import {
  processAndUploadWatermarkedImages,
  cleanupAllWatermarkedImagesForReference,
} from "../utils/watermarked-upload";
import { POSITION_MAPPING } from "~/types/watermark";
import type { WatermarkConfig } from "~/types/watermark";
import { getCurrentUser } from "~/lib/dal";
import { s3Client } from "~/lib/s3";
import { getDynamicBucketName } from "~/lib/s3-bucket";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import {
  PROPERTY_TYPE_MAPPING,
  PROPERTY_SUBTYPE_MAPPING,
  getPropertyFlags,
  OPERATION_TYPE_MAPPING,
  CONSERVATION_STATUS_MAPPING,
  ENERGY_RATING_MAPPING,
  ENERGY_STATUS_MAPPING,
  HEATING_TYPE_MAPPING,
  mapOrientation,
  mapImageLabel,
  detectVirtualTourProvider,
  isCataloniaProperty,
  validateCataloniaRental,
  mapAddressVisibility,
  getPropertyCategory,
  isHousingType,
  isLandType,
  isRoomType,
  filterFeaturesByCategory,
  type IdealistaAddressVisibility,
  type IdealistaCoordinatesPrecision,
  type IdealistaCountry,
  type IdealistaDescriptionLanguage,
} from "./idealista-mappings";
import { getSquareMeter, getBuiltSurfaceArea } from "~/lib/properties/area-utils";

// ============================================
// S3 STORAGE
// ============================================

/**
 * Upload Idealista JSON export to S3
 * Stored at: {bucket}/idealista/{customerCode}.json
 * Per Idealista requirements, filename must contain the customerCode
 */
async function uploadIdealistaJsonToS3(
  jsonContent: string,
  customerCode: string,
): Promise<{
  success: boolean;
  s3Url?: string;
  s3Key?: string;
  error?: string;
}> {
  try {
    const bucketName = await getDynamicBucketName();

    // Filename must contain customerCode per Idealista requirements
    const s3Key = `idealista/${customerCode}.json`;

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: jsonContent,
        ContentType: "application/json",
      }),
    );

    const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    return {
      success: true,
      s3Url,
      s3Key,
    };
  } catch (error) {
    console.error("Error uploading Idealista JSON to S3:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown S3 error",
    };
  }
}

// ============================================
// TYPE DEFINITIONS
// ============================================

interface IdealistaCustomer {
  customerCode: string;
  customerCountry: IdealistaCountry;
  customerReference?: string;
  customerSendDate?: string;
  customerContact?: IdealistaContact;
  customerProperties: IdealistaProperty[];
}

interface IdealistaProperty {
  propertyCode: string;
  propertyReference?: string;
  propertyVisibility?: "idealista" | "microsite" | "private";
  propertyUrl?: string;
  propertyOperation: IdealistaOperation; // SINGULAR, not array!
  propertyAddress: IdealistaAddress;
  propertyFeatures: IdealistaFeatures;
  propertyDescriptions?: IdealistaDescription[];
  propertyImages?: IdealistaImage[];
  propertyVideos?: IdealistaVideo[];
  propertyVirtualTours?: IdealistaVirtualTours;
  propertyContact?: IdealistaContact;
}

interface IdealistaAddress {
  addressVisibility?: IdealistaAddressVisibility;
  addressStreetName?: string;
  addressStreetNumber?: string;
  addressBlock?: string;
  addressStair?: string;
  addressFloor?: string;
  addressDoor?: string;
  addressUrbanization?: string;
  addressPostalCode?: string;
  addressNsiCode?: string;
  addressTown?: string;
  addressCountry: IdealistaCountry; // "Spain", not "es"!
  addressCoordinatesPrecision?: IdealistaCoordinatesPrecision;
  addressCoordinatesLatitude?: number;
  addressCoordinatesLongitude?: number;
}

interface IdealistaOperation {
  operationType: "sale" | "rent" | "rentToOwn";
  operationPrice: number;
  operationPriceCommunity?: number;
  operationPriceParking?: number;
  operationDepositMonths?: number; // For rentals
  operationPriceTransfer?: number; // For commercial transfers
}

interface IdealistaFeatures {
  featuresType: string;
  featuresAreaConstructed?: number;
  featuresAreaUsable?: number;
  featuresAreaPlot?: number;
  featuresBathroomNumber?: number;
  featuresBedroomNumber?: number;
  featuresRooms?: number;
  featuresBuiltYear?: number;
  // ... many more feature fields
  [key: string]: unknown;
}

interface IdealistaDescription {
  descriptionLanguage: IdealistaDescriptionLanguage; // "spanish", not "es"!
  descriptionText: string;
}

interface IdealistaImage {
  imageUrl: string;
  imageOrder: number;
  imageLabel?: string; // "imageLabel", not "imageTag"!
}

interface IdealistaVideo {
  videoUrl: string;
  videoOrder: number;
}

interface IdealistaVirtualTours {
  virtualTour3D?: {
    virtualTour3DType: "matterport" | "vistaplayer3d";
    virtualTourUrl: string;
  };
  virtualTour?: {
    virtualTourType: string;
    virtualTourUrl: string;
  };
}

interface IdealistaContact {
  contactName?: string;
  contactEmail?: string;
  contactPrimaryPhonePrefix?: string;
  contactPrimaryPhoneNumber?: string;
  contactSecondaryPhonePrefix?: string;
  contactSecondaryPhoneNumber?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format date for Idealista (YYYY/MM/DD HH:MM:SS)
 */
function formatIdealistaDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Extract street number from address
 */
function extractStreetNumber(
  street: string | null,
  addressDetails: string | null,
): string | undefined {
  const fullAddress = `${street ?? ""} ${addressDetails ?? ""}`.trim();
  const match = /,?\s*(\d+[A-Za-z]?)\s*[,\-]?/.exec(fullAddress);
  return match?.[1];
}

/**
 * Extract floor from address details
 * Returns only numeric floors without leading zeros per Idealista requirements
 */
function extractFloor(addressDetails: string | null): string | undefined {
  if (!addressDetails) return undefined;

  // Match floor number patterns like "1º", "2ª piso", "planta 3", etc.
  const floorMatch = /(\d+)[ºª]?\s*(piso|planta|º)?/i.exec(addressDetails);

  if (floorMatch?.[1]) {
    // Return number without leading zeros (e.g., "01" -> "1")
    return String(parseInt(floorMatch[1], 10));
  }

  return undefined;
}

/**
 * Extract door from address details
 */
function extractDoor(addressDetails: string | null): string | undefined {
  if (!addressDetails) return undefined;
  const doorMatch = /(?:puerta|pta\.?|letra)\s*([A-Za-z0-9]+)/i.exec(
    addressDetails,
  );
  return doorMatch?.[1];
}

/**
 * Parse Spanish address to separate street name from street number
 * Handles formats like: "Calle Mayor 15", "Av. Principal, 23", "Plaza Santa María nº 1"
 */
function parseSpanishAddress(street: string | null): {
  streetName: string | undefined;
  streetNumber: string | undefined;
} {
  if (!street) return { streetName: undefined, streetNumber: undefined };

  const trimmed = street.trim();

  // Pattern: "Street Name 123" or "Street Name, 123" or "Street Name nº 123"
  // The number can optionally have a letter suffix (e.g., "15A")
  const match = /^(.+?)\s*[,\s]\s*(n[ºo°]?\s*)?(\d+[A-Za-z]?)$/i.exec(trimmed);

  if (match?.[1] && match[3]) {
    return {
      streetName: match[1].replace(/,\s*$/, "").trim(),
      streetNumber: match[3],
    };
  }

  // No number found - return original street name
  return { streetName: trimmed, streetNumber: undefined };
}

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Build Idealista property payload for a single listing
 */
export async function buildIdealistaPropertyPayload(
  listingId: number,
  options?: {
    addressVisibility?: IdealistaAddressVisibility;
    coordinatesPrecision?: IdealistaCoordinatesPrecision;
  },
): Promise<IdealistaProperty> {
  const listingData = await getListingDetailsWithAuth(listingId);

  // Cast to extended type to access Idealista-specific fields
  // Note: Address visibility uses fcLocationVisibility (shared with Fotocasa)
  const listing = listingData as typeof listingData & {
    idCoordinatesPrecision?: string | null;
    rentalType?: string | null;
    shortTermLicense?: string | null;
    occupationStatus?: string | null;
    priceReferenceIndex?: string | null;
    communityFees?: number | null;
    depositMonths?: number | null;
    usableArea?: number | null;
    plotArea?: number | null;
    rooms?: number | null;
    balconyCount?: number | null; // DB has balconyCount, not balcony boolean
    accessibleAccess?: boolean | null;
    accessibleUse?: boolean | null;
    exterior?: boolean | null; // DB has exterior boolean for windows location
    virtualTourUrl?: string | null;
    externalUrl?: string | null;
    videos?: Array<{ url: string }> | null;
  };

  // Get and process images with watermarking (only active images for portal export)
  const images = await getPropertyImages(BigInt(listing.propertyId), true);
  const accountId = await getAccountIdForListing(listingId);
  let processedImages = images;

  if (accountId) {
    try {
      const watermarkConfig = await getAccountWatermarkConfig(accountId);

      if (
        watermarkConfig.watermarkEnabled &&
        watermarkConfig.logoTransparent &&
        images.length > 0
      ) {
        const watermarkConfigForProcessing: WatermarkConfig = {
          enabled: watermarkConfig.watermarkEnabled,
          logoUrl: watermarkConfig.logoTransparent,
          position:
            POSITION_MAPPING[watermarkConfig.watermarkPosition ?? "center"] ??
            "center",
          size: 40,
        };

        const imageProcessingInput = images.map((img) => ({
          imageUrl: img.imageUrl,
          imageOrder: img.imageOrder,
        }));

        const watermarkResults = await processAndUploadWatermarkedImages(
          imageProcessingInput,
          watermarkConfigForProcessing,
          listing.referenceNumber ?? listingId.toString(),
        );

        processedImages = images.map((originalImage) => {
          const processedResult = watermarkResults.find(
            (result) => result.imageOrder === originalImage.imageOrder,
          );

          if (processedResult?.watermarked) {
            return {
              ...originalImage,
              imageUrl: processedResult.imageUrl,
            };
          }
          return originalImage;
        });
      }
    } catch (watermarkError) {
      console.error(
        "Error during watermark processing for Idealista, using original images:",
        watermarkError,
      );
      processedImages = images;
    }
  }

  // Determine property type and flags
  const propertyType = listing.propertySubtype
    ? (PROPERTY_SUBTYPE_MAPPING[listing.propertySubtype] ??
      PROPERTY_TYPE_MAPPING[listing.propertyType ?? "piso"])
    : PROPERTY_TYPE_MAPPING[listing.propertyType ?? "piso"];

  const propertyFlags = getPropertyFlags(listing.propertySubtype ?? null);

  // Get visibility settings from database or options
  // Address visibility is shared with Fotocasa via fcLocationVisibility
  const addressVisibility: IdealistaAddressVisibility =
    options?.addressVisibility ?? mapAddressVisibility(listing.fcLocationVisibility);

  const coordinatesPrecision: IdealistaCoordinatesPrecision =
    options?.coordinatesPrecision ??
    (listing.idCoordinatesPrecision as IdealistaCoordinatesPrecision) ??
    "exact";

  // Parse street to separate name from number
  const parsedAddress = parseSpanishAddress(listing.street ?? null);

  // Build address - Use FULL country name!
  const propertyAddress: IdealistaAddress = {
    addressVisibility,
    addressStreetName: parsedAddress.streetName,
    addressStreetNumber:
      parsedAddress.streetNumber ??
      extractStreetNumber(listing.street ?? null, listing.addressDetails ?? null),
    addressFloor: extractFloor(listing.addressDetails ?? null),
    addressDoor: extractDoor(listing.addressDetails ?? null),
    addressPostalCode: listing.postalCode ?? undefined,
    addressTown: listing.city ?? undefined,
    addressCountry: "Spain", // MUST be "Spain", NOT "es"
    addressCoordinatesPrecision: coordinatesPrecision,
    addressCoordinatesLatitude: listing.latitude
      ? Number(listing.latitude)
      : undefined,
    addressCoordinatesLongitude: listing.longitude
      ? Number(listing.longitude)
      : undefined,
  };

  // Build operation - SINGULAR object, not array!
  const operationType =
    OPERATION_TYPE_MAPPING[listing.listingType ?? "Sale"] ?? "sale";
  const propertyOperation: IdealistaOperation = {
    operationType,
    operationPrice: Math.round(Number(listing.price ?? 0)),
    // operationPriceCommunity only for SALE in Spain/Portugal per Idealista spec
    ...(operationType === "sale" && listing.communityFees
      ? { operationPriceCommunity: Math.round(Number(listing.communityFees)) }
      : {}),
    ...(operationType === "rent" && listing.depositMonths
      ? { operationDepositMonths: listing.depositMonths }
      : {}),
  };

  // Build features
  // Area fallback logic: use bidirectional fallback for area values
  const areaConstructed = getSquareMeter(listing) ?? undefined;
  const areaUsable = getBuiltSurfaceArea(listing) ?? undefined;

  const propertyFeatures: IdealistaFeatures = {
    featuresType: propertyType ?? "flat",
    featuresAreaConstructed: areaConstructed,
    featuresAreaUsable: areaUsable,
    featuresAreaPlot: listing.plotArea ?? undefined,
    // Schema: integer1to99 (min 1) - ensure at least 1 if bathrooms exist
    featuresBathroomNumber: listing.bathrooms
      ? Math.max(1, Math.round(Number(listing.bathrooms)))
      : undefined,
    featuresBedroomNumber: listing.bedrooms ?? undefined,
    featuresRooms: listing.rooms ?? undefined,

    // Property type flags
    ...propertyFlags,

    // Boolean features
    featuresLiftAvailable: listing.hasElevator ?? undefined,
    featuresParkingAvailable: listing.hasGarage ?? undefined,
    featuresStorage: listing.hasStorageRoom ?? undefined,
    featuresGarden: listing.garden ?? undefined,
    featuresPool:
      listing.pool ?? listing.communityPool ?? listing.privatePool ?? undefined,
    featuresTerrace: listing.terrace ?? undefined,
    // Balcony: DB has balconyCount (smallint), convert to boolean
    featuresBalcony:
      listing.balconyCount !== null && listing.balconyCount !== undefined
        ? listing.balconyCount > 0
        : undefined,
    featuresWardrobes: listing.builtInWardrobes ?? undefined,
    featuresChimney: listing.fireplace ?? undefined,
    featuresConditionedAir: listing.airConditioningType
      ? Boolean(listing.airConditioningType)
      : undefined,
    featuresAllowPets: listing.petsAllowed ?? undefined,
    featuresHandicapAdaptedAccess: listing.accessibleAccess ?? undefined,
    featuresHandicapAdaptedUse: listing.accessibleUse ?? undefined,

    // Conservation status
    ...(listing.conservationStatus && {
      featuresConservation:
        CONSERVATION_STATUS_MAPPING[listing.conservationStatus],
    }),

    // Energy certificate
    ...(listing.energyConsumptionScale && {
      featuresEnergyCertificateRating:
        ENERGY_RATING_MAPPING[listing.energyConsumptionScale] ??
        ENERGY_STATUS_MAPPING[listing.energyCertificateStatus ?? ""] ??
        "unknown",
    }),
    ...(listing.emissionsScale && {
      featuresEnergyCertificateEmissionsRating: listing.emissionsScale,
    }),
    ...(listing.energyConsumptionValue && {
      featuresEnergyCertificatePerformance: Number(
        listing.energyConsumptionValue,
      ),
    }),
    ...(listing.emissionsValue && {
      featuresEnergyCertificateEmissionsValue: Number(listing.emissionsValue),
    }),

    // Heating
    ...(listing.heatingType && {
      featuresHeatingType: HEATING_TYPE_MAPPING[listing.heatingType],
    }),

    // Orientation
    ...mapOrientation(listing.orientation ?? null),

    // Year built (must be 4 digits: 1000-2999)
    ...(listing.yearBuilt &&
      listing.yearBuilt >= 1000 &&
      listing.yearBuilt <= 2999 && {
        featuresBuiltYear: listing.yearBuilt,
      }),

    // Furnished (only for rent)
    ...(operationType === "rent" &&
      listing.isFurnished !== null && {
        featuresEquippedKitchen:
          listing.furnishedKitchen ?? listing.isFurnished,
        ...(listing.isFurnished && { featuresEquippedWithFurniture: true }),
      }),

    // Windows location (only for Spain) - DB has 'exterior' boolean field
    // exterior: true → "exterior", exterior: false → "interior"
    ...(listing.exterior !== null &&
      listing.exterior !== undefined && {
        featuresWindowsLocation: listing.exterior ? "exterior" : "interior",
      }),

    // Current occupation (only for sale, housing types)
    ...(operationType === "sale" &&
      listing.occupationStatus && {
        featuresCurrentOccupation: listing.occupationStatus,
      }),

    // Price reference index (mandatory for Catalonia rentals)
    // Schema: number1to99 (min 1, max 99)
    ...(operationType === "rent" &&
      listing.priceReferenceIndex && {
        featuresPriceReferenceIndex: Math.min(
          99,
          Math.max(1, Math.round(Number(listing.priceReferenceIndex))),
        ),
      }),

    // Rental type (mutually exclusive)
    ...(operationType === "rent" &&
      listing.rentalType === "residential" && {
        featuresResidential: true,
      }),
    ...(operationType === "rent" &&
      listing.rentalType === "seasonal" && {
        featuresSeasonalRental: true,
      }),
    ...(operationType === "rent" &&
      listing.rentalType === "short_term" && {
        featuresShortTerm: true,
        ...(listing.shortTermLicense && {
          featuresShortTermLicense: listing.shortTermLicense,
        }),
      }),
  };

  // Build descriptions - Use FULL language name!
  // IMPORTANT: If no description, omit the field entirely (don't send empty array)
  const propertyDescriptions: IdealistaDescription[] | undefined =
    listing.description
      ? [
          {
            descriptionLanguage: "spanish", // MUST be "spanish", NOT "es"
            descriptionText: listing.description.substring(0, 4000), // Max 4000 chars
          },
        ]
      : undefined;

  // Build images - Use "imageLabel", NOT "imageTag"!
  // Schema: imagesUrlFormat max ~400 chars (pattern: ^(https?://.{1,392})$)
  const MAX_IMAGE_URL_LENGTH = 400;
  const propertyImages: IdealistaImage[] = processedImages
    .filter((img) => img.isActive && img.imageUrl.length <= MAX_IMAGE_URL_LENGTH)
    .sort((a, b) => (a.imageOrder ?? 0) - (b.imageOrder ?? 0))
    .slice(0, 200) // Max 200 images
    .map((img, index) => ({
      imageUrl: img.imageUrl,
      imageOrder: index + 1,
      imageLabel: mapImageLabel(img.imageTag), // Use "imageLabel"!
    }));

  // Build videos (if available)
  const propertyVideos: IdealistaVideo[] | undefined = listing.videos?.length
    ? listing.videos.slice(0, 6).map((video, index) => ({
        // Max 6 videos
        videoUrl: video.url,
        videoOrder: index + 1,
      }))
    : undefined;

  // Build virtual tours (if available)
  let propertyVirtualTours: IdealistaVirtualTours | undefined;
  if (listing.virtualTourUrl) {
    const tourDetection = detectVirtualTourProvider(listing.virtualTourUrl);
    if (tourDetection.supported) {
      if (tourDetection.is3D && tourDetection.type) {
        propertyVirtualTours = {
          virtualTour3D: {
            virtualTour3DType: tourDetection.type as
              | "matterport"
              | "vistaplayer3d",
            virtualTourUrl: listing.virtualTourUrl,
          },
        };
      } else if (tourDetection.type) {
        propertyVirtualTours = {
          virtualTour: {
            virtualTourType: tourDetection.type,
            virtualTourUrl: listing.virtualTourUrl,
          },
        };
      }
    }
  }

  // Build contact
  const propertyContact: IdealistaContact = {
    contactEmail: listing.agent?.email ?? undefined,
    contactPrimaryPhoneNumber:
      listing.agent?.phone?.replace(/\D/g, "").slice(0, 12) ?? undefined,
    contactPrimaryPhonePrefix: "34",
  };

  // Filter features by property category to remove invalid fields
  // per Idealista's additionalProperties: false in schemas
  const propertyCategory = getPropertyCategory(propertyType);
  const filteredFeatures = filterFeaturesByCategory(
    propertyFeatures as Record<string, unknown>,
    propertyCategory,
  ) as IdealistaFeatures;

  return {
    propertyCode: listingId.toString(), // Always unique ID for Idealista
    propertyReference: listing.referenceNumber ?? undefined, // Agency's internal reference
    propertyVisibility: "idealista",
    propertyUrl: listing.externalUrl ?? undefined,
    propertyOperation, // Singular object
    propertyAddress,
    propertyFeatures: filteredFeatures,
    // Only include propertyDescriptions if there are descriptions (min 1 item required)
    ...(propertyDescriptions && { propertyDescriptions }),
    propertyImages,
    ...(propertyVideos && { propertyVideos }),
    ...(propertyVirtualTours && { propertyVirtualTours }),
    propertyContact,
  };
}

/**
 * Build complete Idealista export file for an account
 */
export async function buildIdealistaExportFile(
  accountId: number,
  customerCode: string,
  options?: {
    customerReference?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
  },
): Promise<IdealistaCustomer> {
  // Note: Customer code validation removed - will be validated on FTP upload
  // Idealista customer codes typically start with "ilc" followed by alphanumeric chars

  // Get all listings enabled for Idealista
  const idealistaListings = await db
    .select({ listingId: listings.listingId })
    .from(listings)
    .where(
      and(
        eq(listings.accountId, BigInt(accountId)),
        eq(listings.idealista, true),
        eq(listings.isActive, true),
      ),
    );

  // Build property payloads for each listing
  const customerProperties: IdealistaProperty[] = [];

  for (const { listingId } of idealistaListings) {
    try {
      const property = await buildIdealistaPropertyPayload(Number(listingId));
      customerProperties.push(property);
    } catch (error) {
      console.error(
        `Error building Idealista payload for listing ${listingId}:`,
        error,
      );
      // Continue with other listings
    }
  }

  // Build customer contact if provided
  const customerContact: IdealistaContact | undefined =
    options?.contactEmail ?? options?.contactPhone
      ? {
          contactName: options?.contactName,
          contactEmail: options?.contactEmail,
          contactPrimaryPhonePrefix: "34",
          contactPrimaryPhoneNumber: options?.contactPhone
            ?.replace(/\D/g, "")
            .slice(0, 12),
        }
      : undefined;

  return {
    customerCode,
    customerCountry: "Spain", // MUST be "Spain"
    customerReference: options?.customerReference,
    customerSendDate: formatIdealistaDate(new Date()),
    ...(customerContact && { customerContact }),
    customerProperties,
  };
}

/**
 * Toggle Idealista publication for a listing
 */
export async function toggleIdealistaListing(
  listingId: number,
  enabled: boolean,
  options?: {
    addressVisibility?: IdealistaAddressVisibility;
    coordinatesPrecision?: IdealistaCoordinatesPrecision;
    rentalType?: "residential" | "seasonal" | "short_term";
    shortTermLicense?: string;
    occupationStatus?: string;
    priceReferenceIndex?: number;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const accountId = await getAccountIdForListing(listingId);
    if (!accountId) {
      throw new Error(`No account found for listing ${listingId}`);
    }

    // Get listing details to validate Catalonia rentals
    if (enabled && options?.priceReferenceIndex === undefined) {
      const listing = await getListingDetailsWithAuth(listingId);
      const operationType =
        OPERATION_TYPE_MAPPING[listing.listingType ?? "Sale"] ?? "sale";

      // Validate Catalonia rental requirements
      const cataloniaValidation = validateCataloniaRental(
        listing.postalCode ?? null,
        operationType,
        options?.priceReferenceIndex ?? null,
      );

      if (!cataloniaValidation.valid) {
        return {
          success: false,
          error: cataloniaValidation.error,
        };
      }

      // Validate short-term license requirement
      if (
        operationType === "rent" &&
        options?.rentalType === "short_term" &&
        !options?.shortTermLicense
      ) {
        return {
          success: false,
          error:
            "La licencia turística es obligatoria para alquileres vacacionales",
        };
      }
    }

    // Update listing with Idealista settings
    // Note: Address visibility is managed via fcLocationVisibility (shared with Fotocasa)
    await updateListing(listingId, Number(accountId), {
      idealista: enabled,
      idCoordinatesPrecision: options?.coordinatesPrecision ?? "exact",
      ...(options?.rentalType && { rentalType: options.rentalType }),
      ...(options?.shortTermLicense && {
        shortTermLicense: options.shortTermLicense,
      }),
      ...(options?.occupationStatus && {
        occupationStatus: options.occupationStatus,
      }),
      ...(options?.priceReferenceIndex !== undefined && {
        priceReferenceIndex: options.priceReferenceIndex.toString(),
      }),
    });

    // Log activity
    try {
      const currentUser = await getCurrentUser();
      // Activity logging will be handled by the log-activity.ts file
      console.log(
        `User ${currentUser.id} ${enabled ? "enabled" : "disabled"} Idealista for listing ${listingId}`,
      );
    } catch (activityError) {
      console.error("Error logging Idealista toggle activity:", activityError);
    }

    return { success: true };
  } catch (error) {
    console.error("Error toggling Idealista listing:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Export all Idealista-enabled listings to JSON and save to S3
 */
export async function exportToIdealista(
  accountId: number,
  customerCode: string,
  options?: {
    customerReference?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
  },
): Promise<{
  success: boolean;
  jsonContent?: string;
  propertyCount?: number;
  s3Url?: string;
  s3Key?: string;
  error?: string;
}> {
  // Track reference numbers for cleanup
  const referenceNumbers: string[] = [];

  try {
    const exportData = await buildIdealistaExportFile(
      accountId,
      customerCode,
      options,
    );
    const jsonContent = JSON.stringify(exportData, null, 2);

    // Collect reference numbers from exported properties for cleanup
    for (const property of exportData.customerProperties) {
      if (property.propertyCode) {
        referenceNumbers.push(property.propertyCode);
      }
    }

    // Save to S3 - filename must contain customerCode per Idealista requirements
    const s3Result = await uploadIdealistaJsonToS3(jsonContent, customerCode);
    if (!s3Result.success) {
      console.error("Failed to save Idealista JSON to S3:", s3Result.error);
      // Continue anyway - S3 save is not critical
    }

    // Log activity
    try {
      const currentUser = await getCurrentUser();
      console.log(
        `User ${currentUser.id} exported ${exportData.customerProperties.length} properties to Idealista for account ${accountId}`,
        s3Result.success ? `(saved to ${s3Result.s3Key})` : "(S3 save failed)",
      );
    } catch (activityError) {
      console.error("Error logging Idealista export activity:", activityError);
    }

    // Clean up temporary watermarked images after successful export
    if (referenceNumbers.length > 0) {
      console.log(
        `Cleaning up temporary watermarked images for ${referenceNumbers.length} properties...`,
      );
      await cleanupWatermarkedImagesForReferences(referenceNumbers);
    }

    return {
      success: true,
      jsonContent,
      propertyCount: exportData.customerProperties.length,
      s3Url: s3Result.s3Url,
      s3Key: s3Result.s3Key,
    };
  } catch (error) {
    console.error("Error exporting to Idealista:", error);

    // Still attempt cleanup on error to avoid orphaned temp files
    if (referenceNumbers.length > 0) {
      console.log(
        `Cleaning up temporary watermarked images after export error...`,
      );
      await cleanupWatermarkedImagesForReferences(referenceNumbers).catch(
        (cleanupError) =>
          console.error("Failed to cleanup watermarked images:", cleanupError),
      );
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Clean up watermarked images for multiple reference numbers
 */
async function cleanupWatermarkedImagesForReferences(
  referenceNumbers: string[],
): Promise<void> {
  const cleanupPromises = referenceNumbers.map(async (refNum) => {
    try {
      const result = await cleanupAllWatermarkedImagesForReference(refNum);
      if (result.success) {
        console.log(`Cleaned up watermarked images for ${refNum}: ${result.message}`);
      } else {
        console.warn(`Failed to cleanup watermarked images for ${refNum}: ${result.message}`);
      }
    } catch (error) {
      console.error(`Error cleaning up watermarked images for ${refNum}:`, error);
    }
  });

  await Promise.all(cleanupPromises);
}

/**
 * Get all listings enabled for Idealista export
 */
export async function getIdealistaEnabledListings(accountId: number): Promise<{
  success: boolean;
  listings?: Array<{ listingId: bigint; referenceNumber: string | null }>;
  count?: number;
  error?: string;
}> {
  try {
    const idealistaListings = await db
      .select({
        listingId: listings.listingId,
        referenceNumber: properties.referenceNumber,
      })
      .from(listings)
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(listings.accountId, BigInt(accountId)),
          eq(listings.idealista, true),
          eq(listings.isActive, true),
        ),
      );

    return {
      success: true,
      listings: idealistaListings.map((l) => ({
        listingId: l.listingId,
        referenceNumber: l.referenceNumber,
      })),
      count: idealistaListings.length,
    };
  } catch (error) {
    console.error("Error getting Idealista enabled listings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Validate a listing for Idealista publication
 * Different property types have different required fields per Idealista schema
 */
export async function validateListingForIdealista(listingId: number): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const listing = await getListingDetailsWithAuth(listingId);

    // Determine property type and category
    const propertyType =
      PROPERTY_SUBTYPE_MAPPING[listing.propertySubtype ?? ""] ??
      PROPERTY_TYPE_MAPPING[listing.propertyType ?? "piso"];
    const propertyCategory = getPropertyCategory(propertyType);

    // Required fields validation - ALL types need price
    if (!listing.price || Number(listing.price) <= 0) {
      errors.push("El precio es obligatorio");
    }

    // Surface validation - depends on property category
    if (isLandType(propertyType)) {
      // LAND requires PLOT area, NOT constructed area
      if (!listing.plotSurface) {
        errors.push(
          "La superficie de parcela es obligatoria para terrenos (featuresAreaPlot)",
        );
      }
    } else {
      // All other types require constructed area
      if (!listing.totalSurface && !listing.plotSurface) {
        errors.push("La superficie construida es obligatoria");
      }
    }

    // Housing type validations (flat, house, rustic)
    if (isHousingType(propertyType)) {
      if (!listing.bathrooms || Number(listing.bathrooms) <= 0) {
        errors.push("El número de baños es obligatorio para viviendas");
      }

      if (!listing.bedrooms) {
        // Check for studio exception
        const flags = getPropertyFlags(listing.propertySubtype ?? null);
        if (!flags.featuresStudio) {
          errors.push(
            "El número de dormitorios es obligatorio (excepto estudios)",
          );
        }
      }
    }

    // Room rental validations - MANY required fields!
    if (isRoomType(propertyType)) {
      // Required for room rentals per room.json schema
      if (!listing.bathrooms || Number(listing.bathrooms) <= 0) {
        errors.push(
          "El número de baños es obligatorio para alquiler de habitaciones",
        );
      }
      if (!listing.bedrooms) {
        errors.push(
          "El número de habitaciones es obligatorio para alquiler de habitaciones",
        );
      }
      // Note: Many other room-specific fields are required but may not be in Vesta schema
      // featuresTenantNumber, featuresSmokingAllowed, featuresMinTenantAge, featuresMaxTenantAge,
      // featuresCouplesAllowed, featuresBedType, featuresMinimalStay, featuresWindowView,
      // featuresOwnerLiving, featuresAvailableFrom
      warnings.push(
        "Alquiler de habitaciones requiere campos adicionales específicos en Idealista",
      );
    }

    // Address validation
    if (!listing.postalCode && !listing.latitude) {
      errors.push(
        "Se requiere código postal o coordenadas para la ubicación",
      );
    }

    // Rental-specific validations (only for housing types)
    const operationType =
      OPERATION_TYPE_MAPPING[listing.listingType ?? "Sale"] ?? "sale";

    if (operationType === "rent" && isHousingType(propertyType)) {
      // Catalonia price reference index
      if (isCataloniaProperty(listing.postalCode ?? null)) {
        if (!listing.priceReferenceIndex) {
          errors.push(
            "El Índice de Referencia de Precios es obligatorio para alquileres en Cataluña",
          );
        }
      }

      // Short-term license
      if (
        listing.rentalType === "short_term" &&
        !listing.shortTermLicense
      ) {
        errors.push(
          "La licencia turística es obligatoria para alquileres vacacionales",
        );
      }
    }

    // Warnings (non-blocking)
    if (!listing.description) {
      warnings.push("Se recomienda añadir una descripción");
    }

    const images = await getPropertyImages(BigInt(listing.propertyId), true);
    if (images.length === 0) {
      warnings.push("Se recomienda añadir al menos una imagen");
    }

    // Energy certificate warning (not for land/garage/storage)
    if (
      !listing.energyConsumptionScale &&
      !["land", "garage", "storage"].includes(propertyCategory)
    ) {
      warnings.push("Se recomienda indicar la calificación energética");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    console.error("Error validating listing for Idealista:", error);
    return {
      valid: false,
      errors: [
        error instanceof Error
          ? error.message
          : "Error al validar el inmueble",
      ],
      warnings: [],
    };
  }
}
