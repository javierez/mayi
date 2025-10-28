"use server";

import type {
  ExtractedFieldResult,
  DatabaseSaveResult,
} from "~/types/textract-enhanced";
import { updateProperty } from "./properties";
import { updateListing } from "./listing";
import { findOrCreateLocation } from "./locations";
import { createContact, findContactBySimilarName } from "./contact";
import { retrieveCadastralData } from "../cadastral/retrieve_cadastral";
import { generatePropertyTitle } from "~/lib/property-title";
import { getCurrentUser } from "~/lib/dal";
import { autoCompleteAddress } from "~/lib/address-autocomplete";
import type { Property, Listing } from "~/lib/data";
import { createPropertyTasksAsync } from "~/server/actions/property-tasks";

type DbProperty = Omit<Property, "builtInWardrobes"> & {
  builtInWardrobes?: boolean;
};

/**
 * Database Persistence Layer for Textract Extracted Data
 * Saves extracted property and listing data with confidence filtering
 */

// Field Priority Configuration for Combined Method
// These fields are protected when property has cadastral data
const CADASTRAL_PROTECTED_FIELDS = [
  "cadastralReference",
  "squareMeter",
  "yearBuilt",
  "street",
  "propertyType",
  "builtSurfaceArea",
  "postalCode",
  "latitude",
  "longitude",
  "neighborhoodId",
  "addressDetails",
] as const;

/**
 * Check if a field is protected from OCR updates in combined method
 * Protected fields are those that have authoritative cadastral data
 */
function isFieldProtected(fieldName: string): boolean {
  return (CADASTRAL_PROTECTED_FIELDS as readonly string[]).includes(fieldName);
}

/**
 * Check if property was created using cadastral data
 * This helps determine if field protection should be applied
 */
function hasCadastralData(propertyData: unknown): boolean {
  if (!propertyData || typeof propertyData !== "object") return false;
  const data = propertyData as Record<string, unknown>;
  return !!(
    data.cadastralReference &&
    typeof data.cadastralReference === "string" &&
    data.cadastralReference.trim() !== ""
  );
}

// Save extracted data to database with confidence filtering
export async function saveExtractedDataToDatabase(
  propertyId: number,
  listingId: number,
  accountId: number,
  extractedFields: ExtractedFieldResult[],
  confidenceThreshold = 80,
): Promise<DatabaseSaveResult> {
  const result: DatabaseSaveResult = {
    success: false,
    propertyUpdated: false,
    listingUpdated: false,
    propertyErrors: [],
    listingErrors: [],
    fieldsProcessed: extractedFields.length,
    fieldsSaved: 0,
    confidenceThreshold,
  };

  try {
    // Get current user for agent assignment
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error("❌ [DATABASE] Usuario no autenticado");
      result.listingErrors.push("Usuario no autenticado");
      return result;
    }

    // Filter fields by confidence threshold
    const highConfidenceFields = extractedFields.filter(
      (field) => field.confidence >= confidenceThreshold,
    );

    if (highConfidenceFields.length === 0) {
      console.log(
        `⚠️ [DATABASE] No fields meet confidence threshold. Skipping database save.`,
      );
      result.success = true; // Not an error, just no data to save
      return result;
    }

    // Separate property, listing and contact fields
    const propertyFields = highConfidenceFields.filter(
      (field) => field.dbTable === "properties",
    );
    const listingFields = highConfidenceFields.filter(
      (field) => field.dbTable === "listings",
    );
    const contactFields = highConfidenceFields.filter(
      (field) => field.dbTable === "contacts",
    );

    // Extract location fields for special handling
    const extractedLocationData = {
      city: "",
      province: "",
      municipality: "",
    };

    // Get current property data to check for cadastral data (for field protection)
    let currentProperty: unknown = null;
    try {
      const { db } = await import("../db");
      const { properties } = await import("../db/schema");
      const { eq } = await import("drizzle-orm");

      const [property] = await db
        .select()
        .from(properties)
        .where(eq(properties.propertyId, BigInt(propertyId)))
        .limit(1);
      currentProperty = property;
    } catch {
      // Could not fetch property data for field protection check
    }

    const hasExistingCadastralData = hasCadastralData(currentProperty);

    // Build property update data
    const propertyUpdateData: Partial<
      Omit<
        DbProperty,
        "propertyId" | "createdAt" | "updatedAt" | "referenceNumber"
      >
    > = {};
    if (propertyFields.length > 0) {
      for (const field of propertyFields) {
        try {
          // Handle location fields specially - don't save to properties table
          if (field.dbColumn === "extractedCity") {
            extractedLocationData.city = String(field.value);
            continue;
          }
          if (field.dbColumn === "extractedProvince") {
            extractedLocationData.province = String(field.value);
            continue;
          }
          if (field.dbColumn === "extractedMunicipality") {
            extractedLocationData.municipality = String(field.value);
            continue;
          }

          // COMBINED METHOD: Field protection logic
          if (hasExistingCadastralData && isFieldProtected(field.dbColumn)) {
            continue; // Skip protected fields when property has cadastral data
          }

          // Type-safe assignment with proper conversion for regular fields
          const key = field.dbColumn;

          // Define valid property fields from the database schema
          const validPropertyFields = [
            "title",
            "description",
            "propertyType",
            "propertySubtype",
            "bedrooms",
            "bathrooms",
            "squareMeter",
            "yearBuilt",
            "cadastralReference",
            "builtSurfaceArea",
            "conservationStatus",
            "street",
            "addressDetails",
            "postalCode",
            "neighborhoodId",
            "latitude",
            "longitude",
            "energyCertification",
            "energyCertificateStatus",
            "energyConsumptionScale",
            "energyConsumptionValue",
            "emissionsScale",
            "emissionsValue",
            "hasHeating",
            "heatingType",
            "hasElevator",
            "hasGarage",
            "hasStorageRoom",
            "garageType",
            "garageSpaces",
            "garageInBuilding",
            "elevatorToGarage",
            "garageNumber",
            "pantry",
            "terrace",
            "terraceSize",
            "buildingFloors",
            "builtInWardrobes",
            "mainFloorType",
            "shutterType",
            "carpentryType",
            "orientation",
            "airConditioningType",
            "windowType",
            "exterior",
            "bright",
            "views",
            "mountainViews",
            "seaViews",
            "beachfront",
            "jacuzzi",
            "hydromassage",
            "garden",
            "pool",
            "homeAutomation",
            "musicSystem",
            "laundryRoom",
            "coveredClothesline",
            "fireplace",
          ];

          if (validPropertyFields.includes(key)) {
            (propertyUpdateData as Record<string, unknown>)[key] = field.value;
            console.log(
              `✅ [DATABASE] Property field prepared: ${key} = ${String(field.value)} (${field.confidence.toFixed(1)}% confidence)`,
            );
          } else {
            console.warn(
              `⚠️ [DATABASE] Unknown property field skipped: ${key}`,
            );
          }
        } catch (error) {
          const errorMsg = `Failed to prepare property field ${field.dbColumn}: ${String(error)}`;
          console.error(`❌ [DATABASE] ${errorMsg}`);
          result.propertyErrors.push(errorMsg);
        }
      }
    }

    // Build listing update data
    const listingUpdateData: Record<string, unknown> = {};
    if (listingFields.length > 0) {
      for (const field of listingFields) {
        try {
          // Type-safe assignment with proper conversion
          const key = field.dbColumn;
          listingUpdateData[key] = field.value;

          console.log(
            `✅ [DATABASE] Listing field prepared: ${field.dbColumn} = ${String(field.value)} (${field.confidence.toFixed(1)}% confidence)`,
          );
        } catch (error) {
          const errorMsg = `Failed to prepare listing field ${field.dbColumn}: ${String(error)}`;
          console.error(`❌ [DATABASE] ${errorMsg}`);
          result.listingErrors.push(errorMsg);
        }
      }
    }

    // Set the agent_id to the current user when we have listing data to update
    // This ensures the listing is always associated with an agent
    if (listingFields.length > 0) {
      listingUpdateData.agentId = currentUser.id;
    }

    // Auto-complete address before saving if we have street data but no cadastral reference
    if (Object.keys(propertyUpdateData).length > 0) {
      const streetValue = propertyUpdateData.street!;
      const hasAddressInfo =
        streetValue && streetValue !== "Dirección a completar";
      const hasCadastralRef =
        propertyUpdateData.cadastralReference &&
        String(propertyUpdateData.cadastralReference).trim() !== "";

      // Only auto-complete if we have street info but no cadastral reference
      if (hasAddressInfo && !hasCadastralRef) {
        console.log(
          `🌍 [DATABASE] Auto-completing address before save: ${streetValue}`,
        );

        try {
          // Build city from extracted location data if available
          const cityToUse =
            extractedLocationData.city ??
            extractedLocationData.municipality ??
            undefined;

          const addressResult = await autoCompleteAddress(
            streetValue,
            cityToUse,
          );

          if (addressResult.success) {
            console.log(`✅ [DATABASE] Address auto-completion successful`);

            // Update property data with enriched address info
            if (addressResult.street)
              propertyUpdateData.street = addressResult.street;
            if (addressResult.addressDetails)
              propertyUpdateData.addressDetails = addressResult.addressDetails;
            if (addressResult.postalCode)
              propertyUpdateData.postalCode = addressResult.postalCode;
            if (addressResult.latitude)
              propertyUpdateData.latitude = String(addressResult.latitude);
            if (addressResult.longitude)
              propertyUpdateData.longitude = String(addressResult.longitude);

            // Create location if we have complete location data
            if (
              addressResult.city &&
              addressResult.province &&
              addressResult.municipality
            ) {
              try {
                const neighborhoodId = await findOrCreateLocation({
                  city: addressResult.city,
                  province: addressResult.province,
                  municipality: addressResult.municipality,
                  neighborhood: addressResult.neighborhood ?? "Unknown",
                });
                propertyUpdateData.neighborhoodId = BigInt(neighborhoodId);
                console.log(
                  `🏛️ [DATABASE] Location created/found with neighborhoodId: ${neighborhoodId}`,
                );
              } catch (locationError) {
                console.error(
                  `❌ [DATABASE] Failed to create/find location: ${String(locationError)}`,
                );
              }
            }

            console.log(`   └─ Street: ${addressResult.street}`);
            console.log(`   └─ City: ${addressResult.city}`);
            console.log(`   └─ Province: ${addressResult.province}`);
            console.log(`   └─ Postal Code: ${addressResult.postalCode}`);
            console.log(`   └─ Neighborhood: ${addressResult.neighborhood}`);
            if (addressResult.latitude && addressResult.longitude) {
              console.log(
                `   └─ Coordinates: ${addressResult.latitude}, ${addressResult.longitude}`,
              );
            }
          } else {
            console.warn(
              `⚠️ [DATABASE] Address auto-completion failed: ${addressResult.error}`,
            );
          }
        } catch (error) {
          console.error(
            `❌ [DATABASE] Error during address auto-completion: ${String(error)}`,
          );
          // Don't fail the entire operation if address completion fails
        }
      }
    }

    // Generate title if we have property data but no existing title
    if (
      Object.keys(propertyUpdateData).length > 0 &&
      !propertyUpdateData.title
    ) {
      const propertyType = propertyUpdateData.propertyType! ?? "piso";
      const street = propertyUpdateData.street! ?? "";

      // Try to get neighborhood from the enriched address data
      const neighborhood = "";
      if (propertyUpdateData.neighborhoodId) {
        // In a real scenario, you might want to fetch the neighborhood name from the database
        // For now, we'll use empty string and let the address be the main identifier
      }

      // Auto-generate title using the standard function with enriched data
      const generatedTitle = generatePropertyTitle(
        propertyType,
        street,
        neighborhood,
      );
      propertyUpdateData.title = generatedTitle;

      console.log(`🏷️ [DATABASE] Generated title: ${generatedTitle}`);
    }

    // Update property if we have property data
    if (Object.keys(propertyUpdateData).length > 0) {
      try {
        console.log(
          `🔄 [DATABASE] Updating property ${propertyId} with ${Object.keys(propertyUpdateData).length} fields...`,
        );

        await updateProperty(propertyId, propertyUpdateData);

        result.propertyUpdated = true;
        result.fieldsSaved += Object.keys(propertyUpdateData).length;
        console.log(
          `✅ [DATABASE] Property ${propertyId} updated successfully`,
        );

        // Log detailed field updates
        Object.entries(propertyUpdateData).forEach(([key, value]) => {
          const field = propertyFields.find((f) => f.dbColumn === key);
          console.log(
            `   └─ ${key}: ${String(value)} (source: ${field?.extractionSource}, confidence: ${field?.confidence.toFixed(1)}%)`,
          );
        });

        // Check if cadastral reference was extracted and use cadastral service
        const cadastralRefValue = propertyUpdateData.cadastralReference;
        const hasCadastralRef =
          cadastralRefValue && cadastralRefValue.trim() !== "";

        if (hasCadastralRef) {
          console.log(
            `🏛️ [DATABASE] Cadastral reference detected, retrieving cadastral data...`,
          );
          try {
            const cadastralRef = cadastralRefValue.trim();
            console.log(
              `🔍 [DATABASE] Retrieving cadastral data for: ${cadastralRef}`,
            );

            const cadastralData = await retrieveCadastralData(cadastralRef);

            if (cadastralData) {
              // First, create or find the location in the locations table
              let neighborhoodId: number | undefined;
              if (
                cadastralData.city &&
                cadastralData.province &&
                cadastralData.municipality &&
                cadastralData.neighborhood
              ) {
                try {
                  neighborhoodId = await findOrCreateLocation({
                    city: cadastralData.city,
                    province: cadastralData.province,
                    municipality: cadastralData.municipality,
                    neighborhood: cadastralData.neighborhood,
                  });
                  console.log(
                    `🏛️ [DATABASE] Location created/found with neighborhoodId: ${neighborhoodId}`,
                  );
                } catch (locationError) {
                  console.error(
                    `❌ [DATABASE] Failed to create/find location: ${String(locationError)}`,
                  );
                }
              }

              const cadastralUpdateData: Record<string, unknown> = {
                street: cadastralData.street,
                addressDetails: cadastralData.addressDetails,
                squareMeter: cadastralData.squareMeter,
                builtSurfaceArea: cadastralData.builtSurfaceArea,
                yearBuilt: cadastralData.yearBuilt,
                propertyType: cadastralData.propertyType,
                postalCode: cadastralData.postalCode,
              };

              if (cadastralData.latitude) {
                cadastralUpdateData.latitude = parseFloat(
                  cadastralData.latitude,
                );
              }
              if (cadastralData.longitude) {
                cadastralUpdateData.longitude = parseFloat(
                  cadastralData.longitude,
                );
              }
              if (neighborhoodId) {
                cadastralUpdateData.neighborhoodId = BigInt(neighborhoodId);
              }

              // Generate title from cadastral data
              const cadastralTitle = generatePropertyTitle(
                cadastralData.propertyType ?? "piso",
                cadastralData.street ?? "",
                cadastralData.neighborhood ?? "",
              );
              cadastralUpdateData.title = cadastralTitle;

              console.log(
                `🏷️ [DATABASE] Generated title from cadastral data: ${cadastralTitle}`,
              );

              await updateProperty(
                propertyId,
                cadastralUpdateData as Omit<
                  Partial<DbProperty>,
                  "propertyId" | "createdAt" | "updatedAt" | "referenceNumber"
                >,
              );

              console.log(
                `✅ [DATABASE] Cadastral data retrieved and property updated with comprehensive data`,
              );
              console.log(`   └─ Address: ${cadastralData.street}`);
              console.log(`   └─ Property Type: ${cadastralData.propertyType}`);
              console.log(`   └─ Surface: ${cadastralData.squareMeter}m²`);
              console.log(`   └─ Year Built: ${cadastralData.yearBuilt}`);
              if (cadastralData.latitude && cadastralData.longitude) {
                console.log(
                  `   └─ Coordinates: ${cadastralData.latitude}, ${cadastralData.longitude}`,
                );
              }
              if (cadastralData.neighborhood) {
                console.log(
                  `   └─ Neighborhood: ${cadastralData.neighborhood}`,
                );
              }
            } else {
              console.warn(
                `⚠️ [DATABASE] Cadastral data retrieval failed for: ${cadastralRef}`,
              );
            }
          } catch (cadastralError) {
            console.error(
              `❌ [DATABASE] Cadastral retrieval error: ${String(cadastralError)}`,
            );
            // Don't fail the entire operation if cadastral retrieval fails
          }
        } else {
          // Address auto-completion was already handled synchronously above before the initial save
          console.log(
            `ℹ️ [DATABASE] Address completion was handled synchronously before save`,
          );
        }
      } catch (error) {
        const errorMsg = `Failed to update property ${propertyId}: ${String(error)}`;
        console.error(`❌ [DATABASE] ${errorMsg}`);
        result.propertyErrors.push(errorMsg);
      }
    } else {
      console.log(`ℹ️ [DATABASE] No property fields to update`);
    }

    // Update listing if we have listing data OR ensure agent_id is set
    if (Object.keys(listingUpdateData).length > 0) {
      try {
        console.log(
          `🔄 [DATABASE] Updating listing ${listingId} with ${Object.keys(listingUpdateData).length} fields...`,
        );

        await updateListing(
          listingId,
          accountId,
          listingUpdateData as Omit<
            Partial<Listing>,
            "listingId" | "createdAt" | "updatedAt"
          >,
        );

        result.listingUpdated = true;
        result.fieldsSaved += Object.keys(listingUpdateData).length;
        console.log(`✅ [DATABASE] Listing ${listingId} updated successfully`);

        // Log detailed field updates
        Object.entries(listingUpdateData).forEach(([key, value]) => {
          const field = listingFields.find((f) => f.dbColumn === key);
          if (key === "agentId") {
            console.log(
              `   └─ ${key}: ${String(value)} (source: current user)`,
            );
          } else {
            console.log(
              `   └─ ${key}: ${String(value)} (source: ${field?.extractionSource}, confidence: ${field?.confidence.toFixed(1)}%)`,
            );
          }
        });
      } catch (error) {
        const errorMsg = `Failed to update listing ${listingId}: ${String(error)}`;
        console.error(`❌ [DATABASE] ${errorMsg}`);
        result.listingErrors.push(errorMsg);
      }
    } else {
      // Even if no listing fields were extracted, ensure agent_id is set
      try {
        console.log(
          `🔄 [DATABASE] Setting agent ID for listing ${listingId}...`,
        );

        await updateListing(listingId, accountId, {
          agentId: currentUser.id,
        } as Omit<Partial<Listing>, "listingId" | "createdAt" | "updatedAt">);

        result.listingUpdated = true;
        result.fieldsSaved += 1; // Count agent_id as a saved field
        console.log(
          `✅ [DATABASE] Listing ${listingId} agent ID set successfully`,
        );
        console.log(`   └─ agentId: ${currentUser.id} (source: current user)`);
      } catch (error) {
        const errorMsg = `Failed to set agent ID for listing ${listingId}: ${String(error)}`;
        console.error(`❌ [DATABASE] ${errorMsg}`);
        result.listingErrors.push(errorMsg);
      }
    }

    // Process contact fields if we have contact data
    let contactCreated = false;
    if (contactFields.length > 0) {
      try {
        console.log(
          `👤 [DATABASE] Processing contact fields: ${contactFields.length} fields found`,
        );

        // Build contact data object
        const contactData: {
          firstName?: string;
          lastName?: string;
          email?: string;
          phone?: string;
        } = {};

        for (const field of contactFields) {
          if (
            field.dbColumn === "firstName" ||
            field.dbColumn === "lastName" ||
            field.dbColumn === "email" ||
            field.dbColumn === "phone"
          ) {
            contactData[field.dbColumn] = String(field.value);
            console.log(
              `✅ [DATABASE] Contact field prepared: ${field.dbColumn} = ${String(field.value)} (${field.confidence.toFixed(1)}% confidence)`,
            );
          }
        }

        // Check if we have at least a name to create a contact
        if (contactData.firstName || contactData.lastName) {
          const firstName = contactData.firstName ?? "Propietario";
          const lastName = contactData.lastName ?? "";

          console.log(
            `🔍 [DATABASE] Checking for similar contacts: "${firstName} ${lastName}"`,
          );

          // Check for similar existing contacts
          const similarContact = await findContactBySimilarName(
            firstName,
            lastName,
            accountId,
            0.8, // 80% similarity threshold
          );

          if (similarContact) {
            console.log(
              `⚠️ [DATABASE] Found similar contact (${(similarContact.similarity * 100).toFixed(1)}% similarity): ${similarContact.contact.firstName} ${similarContact.contact.lastName}`,
            );

            // Link existing contact to this listing as an owner
            const existingContactId = Number(similarContact.contact.contactId);
            const linkResult = await linkContactToListing(
              existingContactId,
              listingId,
              "owner",
              accountId,
            );

            if (linkResult.success) {
              result.fieldsSaved += contactFields.length; // Count contact fields as processed
              console.log(
                `✅ [DATABASE] Existing contact linked to listing: contact ${existingContactId} ↔ listing ${listingId}`,
              );

              // Log detailed field updates
              contactFields.forEach((field) => {
                console.log(
                  `   └─ ${field.dbColumn}: ${String(field.value)} (matched existing contact, confidence: ${field.confidence.toFixed(1)}%)`,
                );
              });
            } else {
              console.error(
                `❌ [DATABASE] Failed to link existing contact: ${linkResult.error}`,
              );
              result.propertyErrors.push(
                `Failed to link existing contact: ${linkResult.error}`,
              );
            }
          } else {
            // Create new contact
            console.log(
              `👤 [DATABASE] Creating new contact: "${firstName} ${lastName}"`,
            );

            const newContact = await createContact({
              firstName,
              lastName: lastName ?? "",
              email: contactData.email ?? undefined,
              phone: contactData.phone ?? undefined,
              additionalInfo: {
                demandType: `OCR Extracted - ${new Date().toISOString()}`,
              },
              isActive: true,
            });

            if (newContact && "contactId" in newContact) {
              contactCreated = true;
              result.fieldsSaved += contactFields.length;
              console.log(
                `✅ [DATABASE] Contact created successfully: ID ${newContact.contactId}`,
              );

              // Link new contact to this listing as an owner
              const newContactId = Number(newContact.contactId);
              const linkResult = await linkContactToListing(
                newContactId,
                listingId,
                "owner",
                accountId,
              );

              if (linkResult.success) {
                console.log(
                  `✅ [DATABASE] New contact linked to listing: contact ${newContactId} ↔ listing ${listingId}`,
                );
              } else {
                console.error(
                  `❌ [DATABASE] Failed to link new contact: ${linkResult.error}`,
                );
                result.propertyErrors.push(
                  `Failed to link new contact: ${linkResult.error}`,
                );
              }

              // Log detailed field updates
              contactFields.forEach((field) => {
                console.log(
                  `   └─ ${field.dbColumn}: ${String(field.value)} (source: ${field.extractionSource}, confidence: ${field.confidence.toFixed(1)}%)`,
                );
              });
            }
          }
        } else {
          console.log(
            `⚠️ [DATABASE] Insufficient contact data to create contact (no name found)`,
          );
        }
      } catch (error) {
        const errorMsg = `Failed to process contact data: ${String(error)}`;
        console.error(`❌ [DATABASE] ${errorMsg}`);
        // Add contact errors to result if we had that field
        result.propertyErrors.push(errorMsg); // Using propertyErrors for now
      }
    } else {
      console.log(`ℹ️ [DATABASE] No contact fields to process`);
    }

    // Determine overall success
    const hasErrors =
      result.propertyErrors.length > 0 || result.listingErrors.length > 0;
    const hasUpdates =
      result.propertyUpdated || result.listingUpdated || contactCreated;

    result.success =
      !hasErrors && (hasUpdates || highConfidenceFields.length === 0);

    // Create default tasks when OCR processing is completed successfully
    if (result.success && (result.propertyUpdated || result.listingUpdated)) {
      console.log("=== CREATING DEFAULT TASKS ===");
      console.log("Agent ID:", currentUser.id);
      console.log("Listing ID:", listingId);

      // Create tasks asynchronously (don't wait for completion)
      await createPropertyTasksAsync({
        userId: currentUser.id,
        listingId: BigInt(listingId),
      });
    }

    console.log(`🎯 [DATABASE] Save operation completed:`);
    console.log(`   - Success: ${result.success}`);
    console.log(`   - Property updated: ${result.propertyUpdated}`);
    console.log(`   - Listing updated: ${result.listingUpdated}`);
    console.log(`   - Contact created: ${contactCreated}`);
    console.log(
      `   - Contact-listing relationship: ${contactFields.length > 0 ? "Processed" : "None"}`,
    );
    console.log(
      `   - Fields saved: ${result.fieldsSaved}/${result.fieldsProcessed}`,
    );
    console.log(`   - Property errors: ${result.propertyErrors.length}`);
    console.log(`   - Listing errors: ${result.listingErrors.length}`);

    if (result.propertyErrors.length > 0) {
      console.error(`❌ [DATABASE] Property errors:`, result.propertyErrors);
    }
    if (result.listingErrors.length > 0) {
      console.error(`❌ [DATABASE] Listing errors:`, result.listingErrors);
    }

    return result;
  } catch (error) {
    console.error(`❌ [DATABASE] Critical error during save operation:`, error);

    result.success = false;
    result.propertyErrors.push(`Critical error: ${String(error)}`);
    result.listingErrors.push(`Critical error: ${String(error)}`);

    return result;
  }
}

// Link contact to listing via listing_contacts table
async function linkContactToListing(
  contactId: number,
  listingId: number,
  contactType: "owner" | "buyer" | "viewer",
  _accountId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(
      `🔗 [DATABASE] Creating contact-listing relationship: contact ${contactId} → listing ${listingId} (${contactType})`,
    );

    // Dynamic imports to avoid circular dependencies
    const { db } = await import("../db");
    const { listingContacts } = await import("../db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Check if relationship already exists
    const [existingRelation] = await db
      .select({ listingContactId: listingContacts.listingContactId })
      .from(listingContacts)
      .where(
        and(
          eq(listingContacts.contactId, BigInt(contactId)),
          eq(listingContacts.listingId, BigInt(listingId)),
          eq(listingContacts.contactType, contactType),
          eq(listingContacts.isActive, true),
        ),
      );

    if (existingRelation) {
      console.log(
        `ℹ️ [DATABASE] Contact-listing relationship already exists: contact ${contactId} ↔ listing ${listingId} (${contactType})`,
      );
      return { success: true };
    }

    // Create the new relationship
    await db.insert(listingContacts).values({
      listingId: BigInt(listingId),
      contactId: BigInt(contactId),
      contactType: contactType,
      isActive: true,
    });

    console.log(
      `✅ [DATABASE] Contact-listing relationship created successfully: contact ${contactId} ↔ listing ${listingId} (${contactType})`,
    );
    return { success: true };
  } catch (error) {
    const errorMsg = `Failed to link contact ${contactId} to listing ${listingId}: ${String(error)}`;
    console.error(`❌ [DATABASE] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

// Get property and listing IDs from document context
export async function getPropertyAndListingIds(documentKey: string): Promise<{
  propertyId?: number;
  listingId?: number;
  accountId?: number;
} | null> {
  console.log(
    `🔍 [DATABASE] Extracting property/listing IDs from document key: ${documentKey}`,
  );

  try {
    // Extract reference number from document key
    // Expected format: VESTA20240000001/documents/ficha_propiedad/...
    const match = /(VESTA\d+)\/documents/.exec(documentKey);
    if (!match) {
      console.warn(
        `⚠️ [DATABASE] Could not extract reference number from document key: ${documentKey}`,
      );
      return null;
    }

    const referenceNumber = match[1];
    if (!referenceNumber) {
      console.warn(
        `⚠️ [DATABASE] Could not extract reference number from match: ${documentKey}`,
      );
      return null;
    }

    console.log(`📋 [DATABASE] Extracted reference number: ${referenceNumber}`);

    // Import here to avoid circular dependencies
    const { db } = await import("../db");
    const { properties, listings } = await import("../db/schema");
    const { eq } = await import("drizzle-orm");

    // Find property by reference number
    const [property] = await db
      .select({ propertyId: properties.propertyId })
      .from(properties)
      .where(eq(properties.referenceNumber, referenceNumber))
      .limit(1);

    if (!property) {
      console.warn(
        `⚠️ [DATABASE] No property found with reference number: ${referenceNumber}`,
      );
      return null;
    }

    const propertyId = Number(property.propertyId);
    console.log(`✅ [DATABASE] Found property ID: ${propertyId}`);

    // Find listing for this property
    const [listing] = await db
      .select({ listingId: listings.listingId, accountId: listings.accountId })
      .from(listings)
      .where(eq(listings.propertyId, property.propertyId))
      .limit(1);

    const listingId = listing ? Number(listing.listingId) : undefined;
    const accountId = listing ? Number(listing.accountId) : undefined;
    if (listingId) {
      console.log(
        `✅ [DATABASE] Found listing ID: ${listingId}, account ID: ${accountId}`,
      );
    } else {
      console.warn(
        `⚠️ [DATABASE] No listing found for property ID: ${propertyId}`,
      );
    }

    return {
      propertyId,
      listingId,
      accountId,
    };
  } catch (error) {
    console.error(
      `❌ [DATABASE] Error extracting property/listing IDs:`,
      error,
    );
    return null;
  }
}

// Validate extracted data before saving
export async function validateExtractedData(
  extractedFields: ExtractedFieldResult[],
): Promise<{
  valid: ExtractedFieldResult[];
  invalid: Array<{ field: ExtractedFieldResult; reason: string }>;
}> {
  console.log(
    `🔍 [DATABASE] Validating ${extractedFields.length} extracted fields...`,
  );

  const valid: ExtractedFieldResult[] = [];
  const invalid: Array<{ field: ExtractedFieldResult; reason: string }> = [];

  for (const field of extractedFields) {
    try {
      // Basic validation checks
      if (!field.dbColumn || !field.dbTable) {
        invalid.push({ field, reason: "Missing database column or table" });
        continue;
      }

      if (field.confidence < 0 || field.confidence > 100) {
        invalid.push({ field, reason: "Invalid confidence score" });
        continue;
      }

      if (field.value === null || field.value === undefined) {
        invalid.push({ field, reason: "Null or undefined value" });
        continue;
      }

      // Type validation
      switch (field.fieldType) {
        case "number":
          if (typeof field.value !== "number" || isNaN(field.value)) {
            invalid.push({ field, reason: "Invalid number value" });
            continue;
          }
          break;
        case "boolean":
          if (typeof field.value !== "boolean") {
            invalid.push({ field, reason: "Invalid boolean value" });
            continue;
          }
          break;
        case "string":
          if (typeof field.value !== "string" || field.value.trim() === "") {
            invalid.push({ field, reason: "Invalid or empty string value" });
            continue;
          }
          break;
        case "decimal":
          if (typeof field.value !== "number" || isNaN(field.value)) {
            invalid.push({ field, reason: "Invalid decimal value" });
            continue;
          }
          break;
      }

      // Value range validation for specific fields
      if (
        field.dbColumn === "bedrooms" &&
        typeof field.value === "number" &&
        (field.value < 0 || field.value > 10)
      ) {
        invalid.push({
          field,
          reason: "Bedroom count out of valid range (0-10)",
        });
        continue;
      }

      if (
        field.dbColumn === "bathrooms" &&
        typeof field.value === "number" &&
        (field.value < 0 || field.value > 10)
      ) {
        invalid.push({
          field,
          reason: "Bathroom count out of valid range (0-10)",
        });
        continue;
      }

      if (
        field.dbColumn === "yearBuilt" &&
        typeof field.value === "number" &&
        (field.value < 1800 || field.value > new Date().getFullYear() + 5)
      ) {
        invalid.push({ field, reason: "Year built out of valid range" });
        continue;
      }

      if (
        field.dbColumn === "price" &&
        typeof field.value === "number" &&
        field.value <= 0
      ) {
        invalid.push({ field, reason: "Price must be positive" });
        continue;
      }

      // If we get here, the field is valid
      valid.push(field);
    } catch (error) {
      invalid.push({ field, reason: `Validation error: ${String(error)}` });
    }
  }

  console.log(
    `✅ [DATABASE] Validation completed: ${valid.length} valid, ${invalid.length} invalid fields`,
  );

  if (invalid.length > 0) {
    console.warn(
      `⚠️ [DATABASE] Invalid fields:`,
      invalid.map((i) => `${i.field.dbColumn}: ${i.reason}`),
    );
  }

  return { valid, invalid };
}

// Create audit log entry for database updates
export async function createAuditLog(
  documentKey: string,
  propertyId?: number,
  listingId?: number,
  fieldsUpdated?: ExtractedFieldResult[],
  saveResult?: DatabaseSaveResult,
): Promise<void> {
  console.log(`📝 [DATABASE] Creating audit log entry...`);

  try {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      documentKey,
      propertyId,
      listingId,
      fieldsUpdated: fieldsUpdated?.length ?? 0,
      fieldsSaved: saveResult?.fieldsSaved ?? 0,
      success: saveResult?.success ?? false,
      propertyUpdated: saveResult?.propertyUpdated ?? false,
      listingUpdated: saveResult?.listingUpdated ?? false,
      errors: [
        ...(saveResult?.propertyErrors ?? []),
        ...(saveResult?.listingErrors ?? []),
      ],
      fieldDetails: fieldsUpdated?.map((field) => ({
        column: field.dbColumn,
        table: field.dbTable,
        value: field.value,
        confidence: field.confidence,
        source: field.extractionSource,
      })),
    };

    console.log(
      `📄 [DATABASE] Audit log entry:`,
      JSON.stringify(auditEntry, null, 2),
    );

    // In a production environment, you would save this to an audit table
    // For now, we'll just log it for debugging purposes
  } catch (error) {
    console.error(`❌ [DATABASE] Failed to create audit log:`, error);
  }
}
