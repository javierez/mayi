"use server";

import { db } from "../db";
import {
  listings,
  properties,
  locations,
  propertyImages,
  users,
  listingContacts,
  contacts,
  accounts,
  websiteProperties,
  documents,
  deals,
} from "../db/schema";
import { eq, and, ne, sql, gte } from "drizzle-orm";
import type { Listing } from "../../lib/data";
import { getCurrentUserAccountId } from "../../lib/dal";
import { getCurrentListingOwners } from "./contact";
import { logListingCreated, logFichaCompleted } from "./log-activity";
import { calculateCompletion } from "~/lib/properties/completion-tracker";
import {
  cleanupPortalAdsForListing,
  cleanupPortalAdsForMultipleListings,
  triggerIdealistaExportForAccount,
} from "~/server/portals/cleanup";

// Wrapper functions that automatically get accountId from current session
// These maintain backward compatibility while adding account filtering

export async function getListingByIdWithAuth(listingId: number) {
  const accountId = await getCurrentUserAccountId();
  return getListingById(listingId, accountId);
}

export async function listListingsWithAuth(
  page = 1,
  limit = 10,
  filters?: Parameters<typeof listListings>[3],
  view?: "grid" | "table" | "map",
) {
  const accountId = await getCurrentUserAccountId();
  return listListings(accountId, page, limit, filters, view);
}

export async function listListingsCompactWithAuth(
  filters?: Parameters<typeof listListingsCompact>[1],
) {
  const accountId = await getCurrentUserAccountId();
  return listListingsCompact(accountId, filters);
}

export async function listListingsForContactWithAuth(contactId: bigint, searchQuery?: string) {
  const accountId = await getCurrentUserAccountId();
  return listListingsForContact(accountId, contactId, searchQuery);
}

export async function listContactsForListingWithAuth(listingId: bigint, searchQuery?: string) {
  const accountId = await getCurrentUserAccountId();
  return listContactsForListing(accountId, listingId, searchQuery);
}

export async function getListingCompactByIdWithAuth(listingId: bigint) {
  const accountId = await getCurrentUserAccountId();
  return getListingCompactById(listingId, accountId);
}

export async function getAllAgentsWithAuth() {
  const accountId = await getCurrentUserAccountId();
  return getAllAgents(accountId);
}

export async function getAccountWebsiteWithAuth() {
  const accountId = await getCurrentUserAccountId();
  return getAccountWebsite(accountId);
}

export async function getRecentlyUpdatedListingsWithAuth() {
  const accountId = await getCurrentUserAccountId();
  return getRecentlyUpdatedListings(accountId);
}

export async function getRecentContactsForGalleryWithAuth() {
  const accountId = await getCurrentUserAccountId();
  return getRecentContactsForGallery(accountId);
}

export async function updateListingWithAuth(
  listingId: number,
  data: Parameters<typeof updateListing>[2],
) {
  const accountId = await getCurrentUserAccountId();
  return updateListing(listingId, accountId, data);
}

export async function toggleListingKeysWithAuth(listingId: number) {
  const accountId = await getCurrentUserAccountId();

  try {
    // First get the current hasKeys value
    const currentListing = await getListingById(listingId, accountId);
    if (!currentListing) {
      throw new Error("Listing not found");
    }

    // Toggle the hasKeys value
    const newHasKeysValue = !currentListing.hasKeys;

    // Update the listing
    const updatedListing = await updateListing(listingId, accountId, {
      hasKeys: newHasKeysValue,
    });

    return {
      hasKeys: newHasKeysValue,
      listing: updatedListing,
    };
  } catch (error) {
    console.error("Error toggling listing keys:", error);
    throw error;
  }
}

export async function toggleListingPublishToWebsiteWithAuth(listingId: number) {
  const accountId = await getCurrentUserAccountId();

  try {
    // First get the current publishToWebsite value
    const currentListing = await getListingById(listingId, accountId);
    if (!currentListing) {
      throw new Error("Listing not found");
    }

    // Toggle the publishToWebsite value
    const newPublishToWebsiteValue = !currentListing.publishToWebsite;

    // Update the listing
    const updatedListing = await updateListing(listingId, accountId, {
      publishToWebsite: newPublishToWebsiteValue,
    });

    return {
      publishToWebsite: newPublishToWebsiteValue,
      listing: updatedListing,
    };
  } catch (error) {
    console.error("Error toggling listing publishToWebsite:", error);
    throw error;
  }
}

export async function getListingDetailsWithAuth(listingId: number) {
  const accountId = await getCurrentUserAccountId();

  try {
    // Fetch directly from database without caching
    const listingDetails = await getListingDetails(listingId, accountId);

    return listingDetails;
  } catch (error) {
    console.error(`Error in getListingDetailsWithAuth:`, error);
    throw error;
  }
}

export async function getDraftListingsWithAuth() {
  const accountId = await getCurrentUserAccountId();
  return getDraftListings(accountId);
}

export async function deleteDraftListingWithAuth(listingId: number) {
  const accountId = await getCurrentUserAccountId();
  return deleteDraftListing(listingId, accountId);
}

// Duplicate listing_contacts from source listing to target listing
export async function duplicateListingContacts(
  sourceListingId: number,
  targetListingId: number,
) {
  try {
    // Get all listing_contacts from the source listing
    const sourceContacts = await db
      .select()
      .from(listingContacts)
      .where(
        and(
          eq(listingContacts.listingId, BigInt(sourceListingId)),
          eq(listingContacts.isActive, true),
        ),
      );

    if (sourceContacts.length === 0) {
      console.log("No listing contacts found to duplicate");
      return [];
    }

    // Create new listing_contacts for the target listing
    const newContactsData = sourceContacts.map((contact) => ({
      listingId: BigInt(targetListingId),
      contactId: contact.contactId,
      contactType: contact.contactType,
      prospectId: contact.prospectId,
      source: contact.source,
      status: contact.status,
      isActive: true,
    }));

    // Insert the new listing_contacts
    const results = await db
      .insert(listingContacts)
      .values(newContactsData)
      .returning();

    console.log(
      `Duplicated ${results.length} listing contacts from listing ${sourceListingId} to ${targetListingId}`,
    );
    return results;
  } catch (error) {
    console.error("Error duplicating listing contacts:", error);
    throw error;
  }
}

// Create a new listing
export async function createListing(
  data: Omit<Listing, "listingId" | "createdAt" | "updatedAt"> & {
    fcLocationVisibility?: number;
    fcPriceVisibility?: boolean;
  },
) {
  try {
    const accountId = await getCurrentUserAccountId();
    const [result] = await db
      .insert(listings)
      .values({
        accountId: BigInt(accountId),
        propertyId: data.propertyId,
        agentId: data.agentId,
        listingType: data.listingType,
        price: data.price,
        status: data.status,
        isFeatured: data.isFeatured,
        isBankOwned: data.isBankOwned,
        publishToWebsite: data.publishToWebsite,
        visibilityMode: data.visibilityMode,
        isFurnished: data.isFurnished,
        furnitureQuality: data.furnitureQuality,
        optionalGarage: data.optionalGarage,
        optionalGaragePrice: data.optionalGaragePrice,
        optionalStorageRoom: data.optionalStorageRoom,
        optionalStorageRoomPrice: data.optionalStorageRoomPrice,
        hasKeys: data.hasKeys,
        studentFriendly: data.studentFriendly,
        petsAllowed: data.petsAllowed,
        appliancesIncluded: data.appliancesIncluded,
        internet: data.internet,
        oven: data.oven,
        microwave: data.microwave,
        washingMachine: data.washingMachine,
        secadora: data.secadora,
        fridge: data.fridge,
        tv: data.tv,
        stoneware: data.stoneware,
        fotocasa: data.fotocasa,
        fcLocationVisibility: data.fcLocationVisibility ?? 1,
        fcPriceVisibility: data.fcPriceVisibility ?? false,
        idealista: data.idealista,
        habitaclia: data.habitaclia,
        pisoscom: data.pisoscom,
        yaencontre: data.yaencontre,
        milanuncios: data.milanuncios,
        isActive: true,
        viewCount: 0,
        inquiryCount: 0,
      })
      .returning();
    if (!result) throw new Error("Failed to create listing");
    const [newListing] = await db
      .select()
      .from(listings)
      .where(
        and(
          eq(listings.listingId, BigInt(result.listingId)),
          eq(listings.accountId, BigInt(accountId)),
        ),
      );

    // Log the listing creation activity (Alta stage - 10%)
    if (newListing) {
      await logListingCreated({
        listingId: BigInt(result.listingId),
        userId: data.agentId,
        propertyId: Number(data.propertyId),
        listingType: data.listingType,
        initialStatus: data.status ?? "Draft",
        source: "manual",
      });
    }

    return newListing;
  } catch (error) {
    console.error("Error creating listing:", error);
    throw error;
  }
}

// Get listing by ID
export async function getListingById(listingId: number, accountId: number) {
  try {
    const [listing] = await db
      .select()
      .from(listings)
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
          eq(listings.isActive, true),
        ),
      );
    return listing;
  } catch (error) {
    console.error("Error fetching listing:", error);
    throw error;
  }
}

// Get listings by property ID
export async function getListingsByPropertyId(
  propertyId: number,
  accountId: number,
) {
  try {
    const propertyListings = await db
      .select()
      .from(listings)
      .where(
        and(
          eq(listings.propertyId, BigInt(propertyId)),
          eq(listings.accountId, BigInt(accountId)),
          eq(listings.isActive, true),
        ),
      );
    return propertyListings;
  } catch (error) {
    console.error("Error fetching property listings:", error);
    throw error;
  }
}

// Get listings by agent ID
export async function getListingsByAgentId(agentId: string, accountId: number) {
  try {
    const agentListings = await db
      .select()
      .from(listings)
      .where(
        and(
          eq(listings.agentId, agentId),
          eq(listings.accountId, BigInt(accountId)),
          eq(listings.isActive, true),
        ),
      );
    return agentListings;
  } catch (error) {
    console.error("Error fetching agent listings:", error);
    throw error;
  }
}

// Update listing
export async function updateListing(
  listingId: number,
  accountId: number,
  data: Omit<Partial<Listing>, "listingId" | "createdAt" | "updatedAt">,
) {
  try {
    // Check if price is being updated to log the change
    let shouldLogPriceChange = false;
    let oldPrice: number | undefined;
    let listingCreatedAt: Date | undefined;

    if (data.price !== undefined) {
      // Fetch current listing to compare price
      const [listing] = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.listingId, BigInt(listingId)),
            eq(listings.accountId, BigInt(accountId)),
            eq(listings.isActive, true),
          ),
        );

      if (listing) {
        oldPrice = Number(listing.price);
        listingCreatedAt = listing.createdAt;
        const newPrice = Number(data.price);

        // Only log if price actually changed AND it's not the initial price setting (from 0)
        shouldLogPriceChange = oldPrice !== newPrice && oldPrice !== 0;
      }
    }

    // Perform the update
    await db
      .update(listings)
      .set(data)
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
          eq(listings.isActive, true),
        ),
      );

    const [updatedListing] = await db
      .select()
      .from(listings)
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
        ),
      );

    // Log price change if applicable
    if (shouldLogPriceChange && oldPrice !== undefined) {
      try {
        // Import getCurrentUser to get userId for logging
        const { getCurrentUser } = await import("~/lib/dal");
        const { logPriceChanged } = await import("~/server/queries/log-activity");

        const currentUser = await getCurrentUser();
        const newPrice = Number(data.price);

        // Calculate days active (optional enhancement)
        const daysActive = listingCreatedAt
          ? Math.floor(
              (Date.now() - listingCreatedAt.getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : undefined;

        await logPriceChanged({
          listingId: BigInt(listingId),
          userId: currentUser.id,
          oldPrice,
          newPrice,
          daysActive,
        });
      } catch (logError) {
        // Don't fail the update if logging fails
        console.error("Failed to log price change:", logError);
      }
    }

    // Check for ficha completion (Ficha Completa stage - 24%)
    // Only check if fichaCompletedAt is null (not yet completed)
    if (updatedListing && !updatedListing.fichaCompletedAt) {
      try {
        // Fetch property and location data for completion check
        const [propertyData] = await db
          .select({
            propertyType: properties.propertyType,
            street: properties.street,
            postalCode: properties.postalCode,
            squareMeter: properties.squareMeter,
            bedrooms: properties.bedrooms,
            bathrooms: properties.bathrooms,
            neighborhoodId: properties.neighborhoodId,
          })
          .from(properties)
          .where(eq(properties.propertyId, updatedListing.propertyId));

        // Get location data
        let city: string | null = null;
        let province: string | null = null;
        if (propertyData?.neighborhoodId) {
          const [locationData] = await db
            .select({
              city: locations.city,
              province: locations.province,
            })
            .from(locations)
            .where(eq(locations.neighborhoodId, propertyData.neighborhoodId));
          if (locationData) {
            city = locationData.city;
            province = locationData.province;
          }
        }

        // Get image count
        const [imageResult] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(propertyImages)
          .where(
            and(
              eq(propertyImages.propertyId, updatedListing.propertyId),
              eq(propertyImages.isActive, true),
            ),
          );
        const imageCount = imageResult?.count ?? 0;

        // Build combined data object for completion check
        const combinedData: Record<string, unknown> = {
          listingId: updatedListing.listingId,
          price: updatedListing.price,
          listingType: updatedListing.listingType,
          description: updatedListing.description,
          propertyType: propertyData?.propertyType,
          street: propertyData?.street,
          city,
          province,
          postalCode: propertyData?.postalCode,
          squareMeter: propertyData?.squareMeter,
          bedrooms: propertyData?.bedrooms,
          bathrooms: propertyData?.bathrooms,
          imageCount,
        };

        // Calculate completion
        const completion = calculateCompletion(combinedData);

        // If all mandatory fields are complete, log the activity
        if (completion.canPublishToPortals) {
          const { getCurrentUser } = await import("~/lib/dal");
          const currentUser = await getCurrentUser();
          const completedFields = completion.mandatory.completed.map((f) => f.id);

          // Log the ficha completion activity
          await logFichaCompleted({
            listingId: BigInt(listingId),
            userId: currentUser.id,
            completedFields,
            triggerField: Object.keys(data)[0], // First field that was updated
          });

          // Update the listing with fichaCompletedAt timestamp
          await db
            .update(listings)
            .set({ fichaCompletedAt: new Date() })
            .where(eq(listings.listingId, BigInt(listingId)));
        }
      } catch (completionError) {
        // Don't fail the update if completion check fails
        console.error("Failed to check ficha completion:", completionError);
      }
    }

    return updatedListing;
  } catch (error) {
    console.error("Error updating listing:", error);
    throw error;
  }
}

// Soft delete listing (set isActive to false)
export async function softDeleteListing(listingId: number, accountId: number) {
  try {
    await db
      .update(listings)
      .set({ isActive: false })
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
        ),
      );
    return { success: true };
  } catch (error) {
    console.error("Error soft deleting listing:", error);
    throw error;
  }
}

// Hard delete listing (remove from database)
export async function deleteListing(listingId: number, accountId: number) {
  try {
    await db
      .delete(listings)
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
        ),
      );
    return { success: true };
  } catch (error) {
    console.error("Error deleting listing:", error);
    throw error;
  }
}

// List all listings (with pagination and optional filters)
export async function listListings(
  accountId: number,
  page = 1,
  limit = 10,
  filters?: {
    status?:
      | "En Venta"
      | "En Alquiler"
      | "Vendido"
      | "Alquilado"
      | "Descartado"
      | "Draft";
    listingType?: "Sale" | "Rent";
    agentId?: string[];
    ownerId?: string;
    propertyId?: number;
    isActive?: boolean;
    isFeatured?: boolean;
    isBankOwned?: boolean;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string[];
    propertySubtype?: string[];
    bedrooms?: number;
    minBathrooms?: number;
    maxBathrooms?: number;
    minSquareMeter?: number;
    maxSquareMeter?: number;
    city?: string;
    province?: string;
    municipality?: string;
    neighborhood?: string;
    hasGarage?: boolean;
    hasElevator?: boolean;
    hasStorageRoom?: boolean;
    brandNew?: boolean;
    needsRenovation?: boolean;
    searchQuery?: string;
  },
  view?: "grid" | "table" | "map",
) {
  try {
    const offset = (page - 1) * limit;

    // Build the where conditions array
    const whereConditions = [];
    if (filters) {
      if (
        filters.status &&
        Array.isArray(filters.status) &&
        filters.status.length > 0
      ) {
        // Properly format the status values for SQL IN clause
        const statusList = filters.status.map((s) => `'${s}'`).join(",");
        whereConditions.push(
          sql`${listings.status} IN (${sql.raw(statusList)})`,
        );
      }
      if (
        filters.listingType &&
        Array.isArray(filters.listingType) &&
        filters.listingType.length > 0
      ) {
        // Properly format the listing types for SQL IN clause
        const typeList = filters.listingType.map((t) => `'${t}'`).join(",");
        whereConditions.push(
          sql`${listings.listingType} IN (${sql.raw(typeList)})`,
        );
      }
      if (filters.agentId && filters.agentId.length > 0) {
        // Properly format the agent IDs for SQL IN clause
        const agentList = filters.agentId.map((id) => `'${id}'`).join(",");
        whereConditions.push(
          sql`${listings.agentId} IN (${sql.raw(agentList)})`,
        );
      }
      if (filters.ownerId) {
        // Filter by owner contact ID using exact match
        whereConditions.push(
          sql`owner_contact.contact_id = ${BigInt(filters.ownerId)}`,
        );
      }
      if (filters.propertyId) {
        whereConditions.push(
          eq(listings.propertyId, BigInt(filters.propertyId)),
        );
      }
      if (filters.isActive !== undefined) {
        whereConditions.push(eq(listings.isActive, filters.isActive));
      }
      if (filters.isFeatured !== undefined) {
        whereConditions.push(eq(listings.isFeatured, filters.isFeatured));
      }
      if (filters.isBankOwned !== undefined) {
        whereConditions.push(eq(listings.isBankOwned, filters.isBankOwned));
      }
      if (filters.minPrice) {
        whereConditions.push(
          sql`CAST(${listings.price} AS DECIMAL) >= ${filters.minPrice}`,
        );
      }
      if (filters.maxPrice) {
        whereConditions.push(
          sql`CAST(${listings.price} AS DECIMAL) <= ${filters.maxPrice}`,
        );
      }
      if (filters.propertyType && filters.propertyType.length > 0) {
        // Properly format the property types for SQL IN clause
        const propTypeList = filters.propertyType
          .map((t) => `'${t}'`)
          .join(",");
        whereConditions.push(
          sql`${properties.propertyType} IN (${sql.raw(propTypeList)})`,
        );
      }
      if (filters.propertySubtype && filters.propertySubtype.length > 0) {
        // Properly format the property subtypes for SQL IN clause
        const subTypeList = filters.propertySubtype
          .map((t) => `'${t}'`)
          .join(",");
        whereConditions.push(
          sql`${properties.propertySubtype} IN (${sql.raw(subTypeList)})`,
        );
      }
      if (filters.bedrooms) {
        whereConditions.push(
          sql`${properties.bedrooms} >= ${filters.bedrooms}`,
        );
      }
      if (filters.minBathrooms) {
        whereConditions.push(
          sql`CAST(${properties.bathrooms} AS DECIMAL) >= ${filters.minBathrooms}`,
        );
      }
      if (filters.maxBathrooms) {
        whereConditions.push(
          sql`CAST(${properties.bathrooms} AS DECIMAL) <= ${filters.maxBathrooms}`,
        );
      }
      if (filters.minSquareMeter) {
        whereConditions.push(
          sql`${properties.squareMeter} >= ${filters.minSquareMeter}`,
        );
      }
      if (filters.maxSquareMeter) {
        whereConditions.push(
          sql`${properties.squareMeter} <= ${filters.maxSquareMeter}`,
        );
      }
      if (filters.city) {
        whereConditions.push(eq(locations.city, filters.city));
      }
      if (filters.province) {
        whereConditions.push(eq(locations.province, filters.province));
      }
      if (filters.municipality) {
        whereConditions.push(eq(locations.municipality, filters.municipality));
      }
      if (filters.neighborhood) {
        whereConditions.push(eq(locations.neighborhood, filters.neighborhood));
      }
      if (filters.hasGarage !== undefined) {
        whereConditions.push(eq(properties.hasGarage, filters.hasGarage));
      }
      if (filters.hasElevator !== undefined) {
        whereConditions.push(eq(properties.hasElevator, filters.hasElevator));
      }
      if (filters.hasStorageRoom !== undefined) {
        whereConditions.push(
          eq(properties.hasStorageRoom, filters.hasStorageRoom),
        );
      }
      if (filters.brandNew !== undefined) {
        whereConditions.push(eq(properties.brandNew, filters.brandNew));
      }
      if (filters.needsRenovation !== undefined) {
        whereConditions.push(
          eq(properties.needsRenovation, filters.needsRenovation),
        );
      }
      if (filters.searchQuery) {
        whereConditions.push(
          sql`(
            ${properties.title} LIKE ${`%${filters.searchQuery}%`} OR
            ${properties.referenceNumber} LIKE ${`%${filters.searchQuery}%`} OR
            ${properties.street} LIKE ${`%${filters.searchQuery}%`} OR
            ${locations.city} LIKE ${`%${filters.searchQuery}%`} OR
            ${locations.province} LIKE ${`%${filters.searchQuery}%`}
          )`,
        );
      }
    } else {
      // By default, only show active listings
      whereConditions.push(eq(listings.isActive, true));
    }

    // Default status filter: if no status filter is explicitly provided, show only En Venta and En Alquiler
    if (!filters?.status) {
      whereConditions.push(
        sql`${listings.status} IN ('En Venta', 'En Alquiler')`,
      );
    }

    // Always filter for non-Draft status listings and account
    whereConditions.push(ne(listings.status, "Draft"));
    whereConditions.push(eq(listings.accountId, BigInt(accountId)));

    // Optimized query based on view type with JOINs instead of subqueries
    const query =
      view === "table"
        ? db.select({
            // Table view: optimized fields
            listingId: listings.listingId,
            agentName: users.name,
            price: listings.price,
            listingType: listings.listingType,
            status: listings.status,
            publishToWebsite: listings.publishToWebsite,
            fotocasa: listings.fotocasa,
            idealista: listings.idealista,
            referenceNumber: properties.referenceNumber,
            title: properties.title,
            propertyType: properties.propertyType,
            bedrooms: properties.bedrooms,
            bathrooms: properties.bathrooms,
            squareMeter: properties.squareMeter,
            builtSurfaceArea: properties.builtSurfaceArea,
            city: locations.city,
            imageUrl: sql<string>`img1.image_url`,
            ownerId: sql<bigint | null>`owner_contact.contact_id`,
            ownerName: sql<string>`CONCAT(owner_contact.first_name, ' ', owner_contact.last_name)`,
            ownerPhone: sql<string | null>`owner_contact.phone`,
            ownerEmail: sql<string | null>`owner_contact.email`,
          })
        : view === "map"
          ? db.select({
              // Map view: optimized fields with coordinates
              listingId: listings.listingId,
              propertyId: listings.propertyId,
              agentName: users.name,
              price: listings.price,
              listingType: listings.listingType,
              status: listings.status,
              publishToWebsite: listings.publishToWebsite,
              referenceNumber: properties.referenceNumber,
              title: properties.title,
              propertyType: properties.propertyType,
              bedrooms: properties.bedrooms,
              bathrooms: properties.bathrooms,
              squareMeter: properties.squareMeter,
              builtSurfaceArea: properties.builtSurfaceArea,
              city: locations.city,
              latitude: properties.latitude,
              longitude: properties.longitude,
              imageUrl: sql<string>`img1.image_url`,
            })
          : db.select({
              // Grid view: optimized fields
              listingId: listings.listingId,
              propertyId: listings.propertyId,
              agentName: users.name,
              price: listings.price,
              listingType: listings.listingType,
              status: listings.status,
              isBankOwned: listings.isBankOwned,
              publishToWebsite: listings.publishToWebsite,
              referenceNumber: properties.referenceNumber,
              propertyType: properties.propertyType,
              bedrooms: properties.bedrooms,
              bathrooms: properties.bathrooms,
              squareMeter: properties.squareMeter,
              builtSurfaceArea: properties.builtSurfaceArea,
              street: properties.street,
              city: locations.city,
              province: locations.province,
              imageUrl: sql<string>`img1.image_url`,
              imageUrl2: sql<string>`img2.image_url`,
            });

    const baseQuery = query
      .from(listings)
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .leftJoin(users, eq(listings.agentId, users.id))
      .leftJoin(
        sql`(
          SELECT
            property_id,
            image_url,
            ROW_NUMBER() OVER (PARTITION BY property_id ORDER BY image_order ASC) as rn
          FROM property_images
          WHERE is_active = true
            AND (image_tag IS NULL OR image_tag NOT IN ('video', 'youtube', 'tour'))
        ) img1`,
        sql`img1.property_id = ${properties.propertyId} AND img1.rn = 1`,
      )
      .leftJoin(
        sql`(
          SELECT
            property_id,
            image_url,
            ROW_NUMBER() OVER (PARTITION BY property_id ORDER BY image_order ASC) as rn
          FROM property_images
          WHERE is_active = true
            AND (image_tag IS NULL OR image_tag NOT IN ('video', 'youtube', 'tour'))
        ) img2`,
        sql`img2.property_id = ${properties.propertyId} AND img2.rn = 2`,
      )
      .leftJoin(
        sql`(
          SELECT 
            lc.listing_id,
            c.contact_id,
            c.first_name,
            c.last_name,
            c.phone,
            c.email,
            ROW_NUMBER() OVER (PARTITION BY lc.listing_id ORDER BY lc.created_at ASC) as rn
          FROM listing_contacts lc
          JOIN contacts c ON lc.contact_id = c.contact_id
          WHERE lc.contact_type = 'owner' AND lc.is_active = true AND c.is_active = true
        ) owner_contact`,
        sql`owner_contact.listing_id = ${listings.listingId} AND owner_contact.rn = 1`,
      );

    // Get total count for pagination (include owner JOIN if owner filter is active)
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(listings)
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .leftJoin(users, eq(listings.agentId, users.id));

    // Add owner JOIN to count query if filtering by owner
    const countQueryWithOwner = filters?.ownerId
      ? countQuery.leftJoin(
          sql`(
            SELECT
              lc.listing_id,
              c.contact_id,
              ROW_NUMBER() OVER (PARTITION BY lc.listing_id ORDER BY lc.created_at ASC) as rn
            FROM listing_contacts lc
            JOIN contacts c ON lc.contact_id = c.contact_id
            WHERE lc.contact_type = 'owner' AND lc.is_active = true AND c.is_active = true
          ) owner_contact`,
          sql`owner_contact.listing_id = ${listings.listingId} AND owner_contact.rn = 1`,
        )
      : countQuery;

    const countResult = await countQueryWithOwner.where(
      whereConditions.length > 0 ? and(...whereConditions) : undefined,
    );

    const count = countResult[0]?.count ?? 0;

    // If no results found, return empty result set
    if (count === 0) {
      console.log("No listings found with current filters");
      return {
        listings: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: page,
      };
    }

    // Apply all where conditions at once
    const filteredQuery =
      whereConditions.length > 0
        ? baseQuery.where(and(...whereConditions))
        : baseQuery;

    // Apply pagination and sorting
    const allListings = await filteredQuery
      .orderBy(sql`${properties.updatedAt} DESC`)
      .limit(limit)
      .offset(offset);

    return {
      listings: allListings,
      totalCount: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error listing listings:", error);
    // Return empty result set on error
    return {
      listings: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
    };
  }
}

// Compact version of listListings for contact form - returns only essential fields
export async function listListingsCompact(
  accountId: number,
  filters?: {
    status?:
      | "En Venta"
      | "En Alquiler"
      | "Vendido"
      | "Alquilado"
      | "Descartado"
      | "Draft";
    listingType?: "Sale" | "Rent";
    propertyType?: string[];
    searchQuery?: string;
    page?: number;
    limit?: number;
  },
) {
  try {
    // Build the where conditions array
    const whereConditions = [];

    if (filters) {
      if (
        filters.status &&
        Array.isArray(filters.status) &&
        filters.status.length > 0
      ) {
        // Properly format the status values for SQL IN clause
        const statusList = filters.status.map((s) => `'${s}'`).join(",");
        whereConditions.push(
          sql`${listings.status} IN (${sql.raw(statusList)})`,
        );
      }
      if (
        filters.listingType &&
        Array.isArray(filters.listingType) &&
        filters.listingType.length > 0
      ) {
        // Properly format the listing types for SQL IN clause
        const typeList = filters.listingType.map((t) => `'${t}'`).join(",");
        whereConditions.push(
          sql`${listings.listingType} IN (${sql.raw(typeList)})`,
        );
      }
      if (filters.propertyType && filters.propertyType.length > 0) {
        // Properly format the property types for SQL IN clause
        const propTypeList = filters.propertyType
          .map((t) => `'${t}'`)
          .join(",");
        whereConditions.push(
          sql`${properties.propertyType} IN (${sql.raw(propTypeList)})`,
        );
      }
      if (filters.searchQuery) {
        whereConditions.push(
          sql`(
            ${properties.title} LIKE ${`%${filters.searchQuery}%`} OR
            ${properties.referenceNumber} LIKE ${`%${filters.searchQuery}%`} OR
            ${properties.street} LIKE ${`%${filters.searchQuery}%`} OR
            ${locations.city} LIKE ${`%${filters.searchQuery}%`} OR
            ${locations.province} LIKE ${`%${filters.searchQuery}%`}
          )`,
        );
      }
    }

    // Always show active listings only for this account, excluding Draft, Sold, and Rented
    whereConditions.push(eq(listings.isActive, true));
    whereConditions.push(
      sql`${listings.status} NOT IN ('Draft', 'Sold', 'Rented')`,
    );
    whereConditions.push(eq(listings.accountId, BigInt(accountId)));

    // Create the compact query with only essential fields
    const query = db
      .select({
        listingId: listings.listingId,
        title: properties.title,
        referenceNumber: properties.referenceNumber,
        price: listings.price,
        listingType: listings.listingType,
        propertyType: properties.propertyType,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        squareMeter: properties.squareMeter,
        builtSurfaceArea: properties.builtSurfaceArea,
        city: locations.city,
        agentName: users.name,
        isOwned: sql<boolean>`CASE WHEN ${listingContacts.contactId} IS NOT NULL THEN true ELSE false END`,
        imageUrl: propertyImages.imageUrl,
      })
      .from(listings)
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .leftJoin(users, eq(listings.agentId, users.id))
      .leftJoin(
        listingContacts,
        and(
          eq(listingContacts.listingId, listings.listingId),
          eq(listingContacts.contactType, "owner"),
          eq(listingContacts.isActive, true),
        ),
      )
      .leftJoin(
        propertyImages,
        and(
          eq(propertyImages.propertyId, properties.propertyId),
          eq(propertyImages.isActive, true),
          eq(propertyImages.imageOrder, 1),
          // Only get actual images, not videos, YouTube links, or virtual tours
          sql`(${propertyImages.imageTag} IS NULL OR ${propertyImages.imageTag} NOT IN ('video', 'youtube', 'tour'))`,
        ),
      );

    // Apply where conditions
    const filteredQuery =
      whereConditions.length > 0 ? query.where(and(...whereConditions)) : query;

    // Apply pagination if provided
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 100; // Default to 100 if not specified
    const offset = (page - 1) * limit;

    // Get all listings ordered by featured first, then by creation date
    const compactListings = await filteredQuery
      .orderBy(sql`${listings.isFeatured} DESC, ${listings.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    return compactListings;
  } catch (error) {
    console.error("Error listing compact listings:", error);
    return [];
  }
}

// Get listings updated in the last 24 hours for the gallery in historial page
export async function getRecentlyUpdatedListings(accountId: number) {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentListings = await db
      .select({
        listingId: listings.listingId,
        propertyId: listings.propertyId,
        price: listings.price,
        status: listings.status,
        listingType: listings.listingType,
        isBankOwned: listings.isBankOwned,
        referenceNumber: properties.referenceNumber,
        propertyType: properties.propertyType,
        street: properties.street,
        city: locations.city,
        province: locations.province,
        agentName: users.name,
        imageUrl: sql<string>`img1.image_url`,
        imageUrl2: sql<string>`img2.image_url`,
      })
      .from(listings)
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .leftJoin(users, eq(listings.agentId, users.id))
      .leftJoin(
        sql`(
          SELECT
            property_id,
            image_url,
            ROW_NUMBER() OVER (PARTITION BY property_id ORDER BY image_order ASC) as rn
          FROM property_images
          WHERE is_active = true
            AND (image_tag IS NULL OR image_tag NOT IN ('video', 'youtube', 'tour'))
        ) img1`,
        sql`img1.property_id = ${properties.propertyId} AND img1.rn = 1`,
      )
      .leftJoin(
        sql`(
          SELECT
            property_id,
            image_url,
            ROW_NUMBER() OVER (PARTITION BY property_id ORDER BY image_order ASC) as rn
          FROM property_images
          WHERE is_active = true
            AND (image_tag IS NULL OR image_tag NOT IN ('video', 'youtube', 'tour'))
        ) img2`,
        sql`img2.property_id = ${properties.propertyId} AND img2.rn = 2`,
      )
      .where(
        and(
          eq(listings.accountId, BigInt(accountId)),
          eq(listings.isActive, true),
          sql`${listings.status} NOT IN ('Draft')`,
          gte(properties.updatedAt, twentyFourHoursAgo),
        ),
      )
      .orderBy(sql`${properties.updatedAt} DESC`);

    return recentListings;
  } catch (error) {
    console.error("Error getting recently updated listings:", error);
    return [];
  }
}

// Get contacts (owners/buyers) for recently updated listings - deduplicated
export async function getRecentContactsForGallery(accountId: number) {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get all contacts linked to recently updated listings
    const recentContacts = await db
      .select({
        contactId: contacts.contactId,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        contactType: listingContacts.contactType,
        listingId: listings.listingId,
        referenceNumber: properties.referenceNumber,
        updatedAt: listingContacts.updatedAt,
      })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .innerJoin(listings, eq(listingContacts.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(listings.accountId, BigInt(accountId)),
          eq(listings.isActive, true),
          eq(listingContacts.isActive, true),
          eq(contacts.isActive, true),
          sql`${listingContacts.contactType} IN ('owner', 'buyer')`,
          sql`${listings.status} NOT IN ('Draft')`,
          gte(properties.updatedAt, twentyFourHoursAgo),
        ),
      )
      .orderBy(sql`${listingContacts.updatedAt} DESC`);

    // Deduplicate contacts and aggregate their roles
    const contactMap = new Map<
      string,
      {
        contactId: bigint;
        firstName: string;
        lastName: string;
        roles: Array<{
          role: "owner" | "buyer";
          listingId: bigint;
          referenceNumber: string | null;
        }>;
        updatedAt: Date;
      }
    >();

    for (const row of recentContacts) {
      const key = row.contactId.toString();
      const existing = contactMap.get(key);

      if (existing) {
        // Add role if not already present for this listing
        const roleExists = existing.roles.some(
          (r) => r.listingId === row.listingId && r.role === row.contactType,
        );
        if (!roleExists) {
          existing.roles.push({
            role: row.contactType as "owner" | "buyer",
            listingId: row.listingId,
            referenceNumber: row.referenceNumber,
          });
        }
        // Update to most recent timestamp
        if (row.updatedAt > existing.updatedAt) {
          existing.updatedAt = row.updatedAt;
        }
      } else {
        contactMap.set(key, {
          contactId: row.contactId,
          firstName: row.firstName,
          lastName: row.lastName,
          roles: [
            {
              role: row.contactType as "owner" | "buyer",
              listingId: row.listingId,
              referenceNumber: row.referenceNumber,
            },
          ],
          updatedAt: row.updatedAt,
        });
      }
    }

    // Convert to array and sort by most recent updatedAt
    return Array.from(contactMap.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  } catch (error) {
    console.error("Error getting recent contacts for gallery:", error);
    return [];
  }
}

// Search gallery items (listings, contacts, agents) by search term
export async function searchGalleryItems(searchTerm: string) {
  const accountId = await getCurrentUserAccountId();
  const normalizedSearch = searchTerm.toLowerCase().trim();

  if (!normalizedSearch) {
    return { listings: [], contacts: [], agents: [] };
  }

  const searchPattern = `%${normalizedSearch}%`;

  try {
    // Search listings (by street, city, referenceNumber, agentName)
    const matchingListings = await db
      .select({
        listingId: listings.listingId,
        propertyId: listings.propertyId,
        price: listings.price,
        status: listings.status,
        listingType: listings.listingType,
        isBankOwned: listings.isBankOwned,
        referenceNumber: properties.referenceNumber,
        propertyType: properties.propertyType,
        street: properties.street,
        city: locations.city,
        province: locations.province,
        agentName: users.name,
        imageUrl: sql<string>`img1.image_url`,
        imageUrl2: sql<string>`img2.image_url`,
      })
      .from(listings)
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .leftJoin(users, eq(listings.agentId, users.id))
      .leftJoin(
        sql`(
          SELECT
            property_id,
            image_url,
            ROW_NUMBER() OVER (PARTITION BY property_id ORDER BY image_order ASC) as rn
          FROM property_images
          WHERE is_active = true
            AND (image_tag IS NULL OR image_tag NOT IN ('video', 'youtube', 'tour'))
        ) img1`,
        sql`img1.property_id = ${properties.propertyId} AND img1.rn = 1`,
      )
      .leftJoin(
        sql`(
          SELECT
            property_id,
            image_url,
            ROW_NUMBER() OVER (PARTITION BY property_id ORDER BY image_order ASC) as rn
          FROM property_images
          WHERE is_active = true
            AND (image_tag IS NULL OR image_tag NOT IN ('video', 'youtube', 'tour'))
        ) img2`,
        sql`img2.property_id = ${properties.propertyId} AND img2.rn = 2`,
      )
      .where(
        and(
          eq(listings.accountId, BigInt(accountId)),
          eq(listings.isActive, true),
          sql`${listings.status} NOT IN ('Draft')`,
          sql`(
            LOWER(${properties.street}) LIKE ${searchPattern} OR
            LOWER(${locations.city}) LIKE ${searchPattern} OR
            LOWER(${properties.referenceNumber}) LIKE ${searchPattern} OR
            LOWER(${users.name}) LIKE ${searchPattern}
          )`,
        ),
      )
      .limit(20);

    // Search contacts (by firstName, lastName)
    const matchingContactsRaw = await db
      .select({
        contactId: contacts.contactId,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        contactType: listingContacts.contactType,
        listingId: listings.listingId,
        referenceNumber: properties.referenceNumber,
        updatedAt: listingContacts.updatedAt,
      })
      .from(contacts)
      .leftJoin(listingContacts, eq(contacts.contactId, listingContacts.contactId))
      .leftJoin(listings, eq(listingContacts.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(contacts.accountId, BigInt(accountId)),
          eq(contacts.isActive, true),
          sql`(
            LOWER(${contacts.firstName}) LIKE ${searchPattern} OR
            LOWER(${contacts.lastName}) LIKE ${searchPattern} OR
            LOWER(CONCAT(${contacts.firstName}, ' ', ${contacts.lastName})) LIKE ${searchPattern}
          )`,
        ),
      )
      .limit(50);

    // Deduplicate contacts and aggregate roles (same logic as getRecentContactsForGallery)
    const contactMap = new Map<
      string,
      {
        contactId: bigint;
        firstName: string;
        lastName: string;
        roles: Array<{
          role: "owner" | "buyer";
          listingId: bigint;
          referenceNumber: string | null;
        }>;
        updatedAt: Date;
      }
    >();

    for (const row of matchingContactsRaw) {
      const key = row.contactId.toString();
      const existing = contactMap.get(key);

      if (existing) {
        if (row.listingId && row.contactType) {
          const roleExists = existing.roles.some(
            (r) => r.listingId === row.listingId && r.role === row.contactType,
          );
          if (!roleExists && (row.contactType === "owner" || row.contactType === "buyer")) {
            existing.roles.push({
              role: row.contactType,
              listingId: row.listingId,
              referenceNumber: row.referenceNumber,
            });
          }
        }
        if (row.updatedAt && row.updatedAt > existing.updatedAt) {
          existing.updatedAt = row.updatedAt;
        }
      } else {
        const roles: Array<{
          role: "owner" | "buyer";
          listingId: bigint;
          referenceNumber: string | null;
        }> = [];
        if (row.listingId && row.contactType && (row.contactType === "owner" || row.contactType === "buyer")) {
          roles.push({
            role: row.contactType,
            listingId: row.listingId,
            referenceNumber: row.referenceNumber,
          });
        }
        contactMap.set(key, {
          contactId: row.contactId,
          firstName: row.firstName,
          lastName: row.lastName,
          roles,
          updatedAt: row.updatedAt ?? new Date(),
        });
      }
    }

    const matchingContacts = Array.from(contactMap.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 20);

    // Search agents (by name, firstName, lastName)
    const matchingAgents = await db
      .select({
        userId: users.id,
        name: users.name,
        firstName: users.firstName,
        lastName: users.lastName,
        image: users.image,
        updatedAt: users.lastLogin,
      })
      .from(users)
      .where(
        and(
          eq(users.accountId, BigInt(accountId)),
          eq(users.isActive, true),
          sql`(
            LOWER(${users.name}) LIKE ${searchPattern} OR
            LOWER(${users.firstName}) LIKE ${searchPattern} OR
            LOWER(${users.lastName}) LIKE ${searchPattern}
          )`,
        ),
      )
      .limit(10);

    return {
      listings: matchingListings,
      contacts: matchingContacts,
      agents: matchingAgents.map((agent) => ({
        userId: agent.userId,
        name: agent.name,
        firstName: agent.firstName,
        lastName: agent.lastName,
        image: agent.image,
        updatedAt: agent.updatedAt ?? new Date(),
      })),
    };
  } catch (error) {
    console.error("Error searching gallery items:", error);
    return { listings: [], contacts: [], agents: [] };
  }
}

// Get listings associated with a specific contact (as owner or buyer)
export async function listListingsForContact(
  accountId: number,
  contactId: bigint,
  searchQuery?: string,
) {
  try {
    // Build the where conditions array
    const whereConditions = [];

    // Always show active listings only for this account, excluding Draft, Sold, and Rented
    whereConditions.push(eq(listings.isActive, true));
    whereConditions.push(
      sql`${listings.status} NOT IN ('Draft', 'Sold', 'Rented')`,
    );
    whereConditions.push(eq(listings.accountId, BigInt(accountId)));

    // Add search query filter if provided
    if (searchQuery?.trim()) {
      whereConditions.push(
        sql`(
          ${properties.title} LIKE ${`%${searchQuery}%`} OR
          ${properties.referenceNumber} LIKE ${`%${searchQuery}%`} OR
          ${properties.street} LIKE ${`%${searchQuery}%`} OR
          ${locations.city} LIKE ${`%${searchQuery}%`} OR
          ${locations.province} LIKE ${`%${searchQuery}%`}
        )`,
      );
    }

    // Create the compact query with contact relationship info
    const query = db
      .select({
        listingId: listings.listingId,
        title: properties.title,
        referenceNumber: properties.referenceNumber,
        price: listings.price,
        listingType: listings.listingType,
        propertyType: properties.propertyType,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        squareMeter: properties.squareMeter,
        city: locations.city,
        agentName: users.name,
        imageUrl: propertyImages.imageUrl,
        contactType: sql<"owner" | "buyer" | null>`CASE
          WHEN ${listingContacts.contactType} = 'owner' THEN 'owner'
          WHEN ${listingContacts.contactType} = 'buyer' THEN 'buyer'
          ELSE NULL
        END`,
      })
      .from(listings)
      .innerJoin(
        listingContacts,
        and(
          eq(listingContacts.listingId, listings.listingId),
          eq(listingContacts.contactId, contactId),
          eq(listingContacts.isActive, true),
        ),
      )
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .leftJoin(users, eq(listings.agentId, users.id))
      .leftJoin(
        propertyImages,
        and(
          eq(propertyImages.propertyId, properties.propertyId),
          eq(propertyImages.isActive, true),
          eq(propertyImages.imageOrder, 1),
          // Only get actual images, not videos, YouTube links, or virtual tours
          sql`(${propertyImages.imageTag} IS NULL OR ${propertyImages.imageTag} NOT IN ('video', 'youtube', 'tour'))`,
        ),
      );

    // Apply where conditions
    const filteredQuery =
      whereConditions.length > 0 ? query.where(and(...whereConditions)) : query;

    // Get all listings ordered by contact type (owner first, then buyer), then by creation date
    const contactListings = await filteredQuery.orderBy(
      sql`CASE
        WHEN ${listingContacts.contactType} = 'owner' THEN 1
        WHEN ${listingContacts.contactType} = 'buyer' THEN 2
        ELSE 3
      END`,
      sql`${listings.createdAt} DESC`,
    );

    return contactListings;
  } catch (error) {
    console.error("Error listing contact listings:", error);
    return [];
  }
}

// Get contacts associated with a specific listing (as owner or buyer)
export async function listContactsForListing(
  accountId: number,
  listingId: bigint,
  searchQuery?: string,
) {
  try {
    // Build the where conditions array
    const whereConditions = [];

    // Always show active contacts only for this account
    whereConditions.push(eq(contacts.isActive, true));
    whereConditions.push(eq(contacts.accountId, BigInt(accountId)));

    // Add search query filter if provided
    if (searchQuery?.trim()) {
      whereConditions.push(
        sql`(
          ${contacts.firstName} LIKE ${`%${searchQuery}%`} OR
          ${contacts.lastName} LIKE ${`%${searchQuery}%`} OR
          ${contacts.email} LIKE ${`%${searchQuery}%`} OR
          ${contacts.phone} LIKE ${`%${searchQuery}%`}
        )`,
      );
    }

    // Create the compact query with listing relationship info
    const query = db
      .select({
        contactId: contacts.contactId,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone,
        contactType: sql<"owner" | "buyer" | null>`CASE
          WHEN ${listingContacts.contactType} = 'owner' THEN 'owner'
          WHEN ${listingContacts.contactType} = 'buyer' THEN 'buyer'
          ELSE NULL
        END`,
      })
      .from(contacts)
      .innerJoin(
        listingContacts,
        and(
          eq(listingContacts.contactId, contacts.contactId),
          eq(listingContacts.listingId, listingId),
          eq(listingContacts.isActive, true),
        ),
      );

    // Apply where conditions
    const filteredQuery =
      whereConditions.length > 0 ? query.where(and(...whereConditions)) : query;

    // Get all contacts ordered by contact type (owner first, then buyer)
    const listingContacts$ = await filteredQuery.orderBy(
      sql`CASE
        WHEN ${listingContacts.contactType} = 'owner' THEN 1
        WHEN ${listingContacts.contactType} = 'buyer' THEN 2
        ELSE 3
      END`,
      sql`${contacts.createdAt} DESC`,
    );

    return listingContacts$;
  } catch (error) {
    console.error("Error listing listing contacts:", error);
    return [];
  }
}

// Get a single listing in compact format by ID
export async function getListingCompactById(
  listingId: bigint,
  accountId: number,
) {
  try {
    // Create the compact query with only essential fields - same as listListingsCompact
    const listing = await db
      .select({
        listingId: listings.listingId,
        title: properties.title,
        referenceNumber: properties.referenceNumber,
        price: listings.price,
        listingType: listings.listingType,
        propertyType: properties.propertyType,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        squareMeter: properties.squareMeter,
        builtSurfaceArea: properties.builtSurfaceArea,
        city: locations.city,
        agentName: users.name,
        isOwned: sql<boolean>`CASE WHEN ${listingContacts.contactId} IS NOT NULL THEN true ELSE false END`,
        imageUrl: propertyImages.imageUrl,
      })
      .from(listings)
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .leftJoin(users, eq(listings.agentId, users.id))
      .leftJoin(
        listingContacts,
        and(
          eq(listingContacts.listingId, listings.listingId),
          eq(listingContacts.contactType, "owner"),
          eq(listingContacts.isActive, true),
        ),
      )
      .leftJoin(
        propertyImages,
        and(
          eq(propertyImages.propertyId, properties.propertyId),
          eq(propertyImages.isActive, true),
          eq(propertyImages.imageOrder, 1),
          // Only get actual images, not videos, YouTube links, or virtual tours
          sql`(${propertyImages.imageTag} IS NULL OR ${propertyImages.imageTag} NOT IN ('video', 'youtube', 'tour'))`,
        ),
      )
      .where(
        and(
          eq(listings.listingId, listingId),
          eq(listings.accountId, BigInt(accountId)),
          eq(listings.isActive, true),
          sql`${listings.status} NOT IN ('Draft', 'Sold', 'Rented')`,
        ),
      )
      .limit(1);

    return listing[0] ?? null;
  } catch (error) {
    console.error("Error fetching compact listing by ID:", error);
    return null;
  }
}

// Get all active agents for an account
export async function getAllAgents(accountId: number) {
  try {
    const agents = await db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(users)
      .where(
        and(eq(users.accountId, BigInt(accountId)), eq(users.isActive, true)),
      )
      .orderBy(users.name);

    return agents;
  } catch (error) {
    console.error("Error fetching agents:", error);
    throw error;
  }
}

export async function getAccountWebsite(accountId: number) {
  try {
    const account = await db
      .select({
        website: accounts.website,
      })
      .from(accounts)
      .where(eq(accounts.accountId, BigInt(accountId)))
      .limit(1);

    return account[0]?.website ?? null;
  } catch (error) {
    console.error("Error fetching account website:", error);
    throw error;
  }
}

// Get detailed listing information including all related data
// This query is optimized for the property characteristics form
export async function getListingDetails(listingId: number, accountId: number) {
  console.log("🔍 getListingDetails called with:", {
    listingId,
    listingIdType: typeof listingId,
    listingIdBigInt: BigInt(listingId),
    accountId,
  });

  try {
    const query = db
      .select({
        // Listing fields - All needed for form
        listingId: listings.listingId,
        propertyId: listings.propertyId,
        agentId: listings.agentId,
        listingType: listings.listingType,
        price: listings.price,
        status: listings.status,
        isFurnished: listings.isFurnished,
        furnitureQuality: listings.furnitureQuality,
        optionalGarage: listings.optionalGarage,
        optionalGaragePrice: listings.optionalGaragePrice,
        optionalStorageRoom: listings.optionalStorageRoom,
        optionalStorageRoomPrice: listings.optionalStorageRoomPrice,
        hasKeys: listings.hasKeys,
        hasCartel: listings.hasCartel,
        enEscaparate: listings.enEscaparate,
        encargo: listings.encargo,
        studentFriendly: listings.studentFriendly,
        petsAllowed: listings.petsAllowed,
        appliancesIncluded: listings.appliancesIncluded,
        internet: listings.internet,
        oven: listings.oven,
        microwave: listings.microwave,
        washingMachine: listings.washingMachine,
        secadora: listings.secadora,
        fridge: listings.fridge,
        tv: listings.tv,
        stoneware: listings.stoneware,
        fotocasa: listings.fotocasa,
        fcLocationVisibility: listings.fcLocationVisibility,
        fcPriceVisibility: listings.fcPriceVisibility,
        idealista: listings.idealista,
        idCoordinatesPrecision: listings.idCoordinatesPrecision,
        rentalType: listings.rentalType,
        shortTermLicense: listings.shortTermLicense,
        occupationStatus: listings.occupationStatus,
        priceReferenceIndex: listings.priceReferenceIndex,
        habitaclia: listings.habitaclia,
        pisoscom: listings.pisoscom,
        yaencontre: listings.yaencontre,
        milanuncios: listings.milanuncios,
        isFeatured: listings.isFeatured,
        isBankOwned: listings.isBankOwned,
        publishToWebsite: listings.publishToWebsite,
        visibilityMode: listings.visibilityMode,
        isActive: listings.isActive,
        viewCount: listings.viewCount,
        inquiryCount: listings.inquiryCount,
        createdAt: listings.createdAt,
        updatedAt: listings.updatedAt,

        // Listing descriptions - From listings table
        description: listings.description,
        shortDescription: listings.shortDescription,

        // Property fields - All needed for comprehensive form
        referenceNumber: properties.referenceNumber,
        title: properties.title,
        propertyType: properties.propertyType,
        propertySubtype: properties.propertySubtype,
        formPosition: properties.formPosition,

        // Details from second page - Map form fields to database fields
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        totalSurface: properties.squareMeter, // Form uses totalSurface, DB has squareMeter
        usefulSurface: properties.builtSurfaceArea, // Form uses usefulSurface, DB has builtSurfaceArea
        plotSurface: sql<number>`NULL`, // Not in properties table yet
        floor: sql<string>`NULL`, // Not in properties table yet
        totalFloors: properties.buildingFloors, // Form uses totalFloors, DB has buildingFloors
        buildYear: properties.yearBuilt, // Form uses buildYear, DB has yearBuilt
        condition: properties.conservationStatus, // Form uses condition, DB has conservationStatus
        energyCertificate: properties.energyConsumptionScale, // Form uses energyCertificate, DB has energyConsumptionScale
        emissions: properties.emissionsScale, // Form uses emissions, DB has emissionsScale
        cadastralReference: properties.cadastralReference,

        // Address from third page - Map form fields to database fields
        address: properties.street, // Form uses address, DB has street
        city: locations.city,
        province: locations.province,
        municipality: locations.municipality,
        postalCode: properties.postalCode,
        neighborhood: locations.neighborhood,
        latitude: properties.latitude,
        longitude: properties.longitude,

        // Equipment from fourth page - Map form fields to database fields
        heating: properties.heatingType, // Form uses heating, DB has heatingType
        airConditioning: properties.airConditioningType, // Form uses airConditioning, DB has airConditioningType
        hasElevator: properties.hasElevator,
        hasGarage: properties.hasGarage,
        hasStorageRoom: properties.hasStorageRoom,
        hasGarden: properties.garden, // Form uses hasGarden, DB has garden
        hasSwimmingPool: sql<boolean>`(${properties.pool} OR ${properties.communityPool} OR ${properties.privatePool})`, // Form uses hasSwimmingPool, DB has multiple pool fields
        hasTerrace: properties.terrace, // Form uses hasTerrace, DB has terrace
        hasBalcony: sql<boolean>`(${properties.balconyCount} > 0)`, // Form uses hasBalcony, DB has balconyCount

        // Orientation from fifth page
        orientation: properties.orientation,
        views: properties.views,
        luminosity: properties.bright, // Form uses luminosity, DB has bright

        // Additional from sixth page - Map form fields to database fields
        accessibility: properties.disabledAccessible, // Form uses accessibility, DB has disabledAccessible
        securitySystem: sql<boolean>`(${properties.alarm} OR ${properties.securityDoor})`, // Form uses securitySystem, DB has multiple security fields
        doorman: properties.conciergeService, // Form uses doorman, DB has conciergeService
        builtInWardrobes: properties.builtInWardrobes,

        // Luxury from seventh page - Map form fields to database fields
        designerKitchen: properties.furnishedKitchen, // Form uses designerKitchen, DB has furnishedKitchen
        smartHome: properties.homeAutomation, // Form uses smartHome, DB has homeAutomation

        // Spaces from eighth page - Map form fields to database fields
        hasAttic: sql<boolean>`NULL`, // Not in properties table
        hasBasement: sql<boolean>`NULL`, // Not in properties table
        hasLaundryRoom: properties.laundryRoom, // Form uses hasLaundryRoom, DB has laundryRoom
        hasOffice: sql<boolean>`NULL`, // Not in properties table
        hasDressingRoom: sql<boolean>`NULL`, // Not in properties table

        // Materials from ninth page - Map form fields to database fields
        mainFloorType: properties.mainFloorType, // Database has mainFloorType column
        wallMaterial: sql<string>`NULL`, // Not in properties table
        kitchenMaterial: properties.kitchenType, // Form uses kitchenMaterial, DB has kitchenType
        bathroomMaterial: sql<string>`NULL`, // Not in properties table

        // Description from description page
        highlights: sql<string>`NULL`, // Not in properties table

        // Legacy fields for backward compatibility
        yearBuilt: properties.yearBuilt,
        squareMeter: properties.squareMeter,
        builtSurfaceArea: properties.builtSurfaceArea,
        street: properties.street,
        addressDetails: properties.addressDetails,
        neighborhoodId: properties.neighborhoodId,
        conservationStatus: properties.conservationStatus, // Added for Fotocasa FeatureId 249
        energyCertification: properties.energyCertification,
        energyCertificateStatus: properties.energyCertificateStatus,
        energyConsumptionScale: properties.energyConsumptionScale,
        energyConsumptionValue: properties.energyConsumptionValue,
        emissionsScale: properties.emissionsScale,
        emissionsValue: properties.emissionsValue,
        hasHeating: properties.hasHeating,
        heatingType: properties.heatingType, // For Fotocasa FeatureId 320
        garageType: properties.garageType,
        garageSpaces: properties.garageSpaces,
        garageInBuilding: properties.garageInBuilding,
        elevatorToGarage: properties.elevatorToGarage,
        garageNumber: properties.garageNumber,
        vpo: properties.vpo,
        videoIntercom: properties.videoIntercom,
        conciergeService: properties.conciergeService,
        securityGuard: properties.securityGuard,
        satelliteDish: properties.satelliteDish,
        doubleGlazing: properties.doubleGlazing,
        alarm: properties.alarm,
        securityDoor: properties.securityDoor,
        kitchenType: properties.kitchenType,
        disabledAccessible: properties.disabledAccessible,
        brandNew: properties.brandNew,
        newConstruction: properties.newConstruction,
        underConstruction: properties.underConstruction,
        needsRenovation: properties.needsRenovation,
        lastRenovationYear: properties.lastRenovationYear,
        hotWaterType: properties.hotWaterType,
        openKitchen: properties.openKitchen,
        frenchKitchen: properties.frenchKitchen,
        furnishedKitchen: properties.furnishedKitchen,
        pantry: properties.pantry,
        storageRoomSize: properties.storageRoomSize,
        storageRoomNumber: properties.storageRoomNumber,
        terrace: properties.terrace,
        terraceSize: properties.terraceSize,
        wineCellar: properties.wineCellar,
        wineCellarSize: properties.wineCellarSize,
        livingRoomSize: properties.livingRoomSize,
        balconyCount: properties.balconyCount,
        galleryCount: properties.galleryCount,
        buildingFloors: properties.buildingFloors,
        shutterType: properties.shutterType,
        carpentryType: properties.carpentryType,
        airConditioningType: properties.airConditioningType,
        windowType: properties.windowType,
        exterior: properties.exterior,
        bright: properties.bright,
        mountainViews: properties.mountainViews,
        seaViews: properties.seaViews,
        beachfront: properties.beachfront,
        jacuzzi: properties.jacuzzi,
        hydromassage: properties.hydromassage,
        garden: properties.garden,
        pool: properties.pool,
        homeAutomation: properties.homeAutomation,
        musicSystem: properties.musicSystem,
        laundryRoom: properties.laundryRoom,
        coveredClothesline: properties.coveredClothesline,
        fireplace: properties.fireplace,
        sauna: properties.sauna, // For Fotocasa FeatureId 277
        loadingArea: properties.loadingArea, // For Fotocasa FeatureId 204
        patio: properties.patio, // For Fotocasa FeatureId 263
        allowedUse: properties.allowedUse, // For Fotocasa FeatureId 21 (solar only)
        isDiafano: properties.isDiafano, // For local property type - open-plan
        hasEscaparate: properties.hasEscaparate, // For local property type - shop window
        streetType: properties.streetType, // For local property type - traffic intensity
        electricityType: properties.electricityType,
        electricityStatus: properties.electricityStatus,
        plumbingType: properties.plumbingType,
        plumbingStatus: properties.plumbingStatus,
        gym: properties.gym,
        sportsArea: properties.sportsArea,
        childrenArea: properties.childrenArea,
        suiteBathroom: properties.suiteBathroom,
        nearbyPublicTransport: properties.nearbyPublicTransport,
        communityPool: properties.communityPool,
        privatePool: properties.privatePool,
        tennisCourt: properties.tennisCourt,
        communityArea: properties.communityArea, // For Fotocasa FeatureId 301

        // Agent information - optimized to only needed fields
        agent: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          image: users.image,
        },

        // Offer accepted status - check if ANY listing_contact has offer_accepted = true
        offerAccepted: sql<boolean>`EXISTS(
          SELECT 1 FROM listing_contacts
          WHERE listing_contacts.listing_id = ${listings.listingId}
            AND listing_contacts.offer_accepted = true
            AND listing_contacts.is_active = true
        )`,

        // Has visits (scheduled or completed) - check if there are any visit appointments
        // This indicates the property is actively being shown (either has upcoming visits or has been shown)
        hasScheduledVisits: sql<boolean>`EXISTS(
          SELECT 1 FROM appointments
          WHERE appointments.listing_id = ${listings.listingId}
            AND (
              (appointments.status = 'Scheduled' AND appointments.datetime_start > NOW())
              OR appointments.status = 'Completed'
            )
            AND (appointments.type = 'Visita' OR appointments.type IS NULL)
            AND appointments.is_active = true
        )`,

        // Image count - count active property images (excluding videos, youtube, tours)
        imageCount: sql<number>`(
          SELECT COUNT(*)
          FROM property_images
          WHERE property_images.property_id = ${properties.propertyId}
            AND property_images.is_active = true
            AND (property_images.image_tag IS NULL OR property_images.image_tag NOT IN ('video', 'youtube', 'tour'))
        )`,

        // Deal fields for progress tracking - fetched from leftJoin below
        dealId: deals.dealId,
        dealStatus: deals.status,
        dealArrasDate: deals.arrasDate,
        dealArrasSigningDate: deals.arrasSigningDate,
        dealExpectedDeedDate: deals.expectedDeedDate,
        dealActualDeedDate: deals.actualDeedDate,
        dealCloseDate: deals.closeDate,
        dealKeyHandoverDate: deals.keyHandoverDate,
      })
      .from(listings)
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .leftJoin(users, eq(listings.agentId, users.id))
      .leftJoin(deals, eq(deals.listingId, listings.listingId))
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
          eq(listings.isActive, true),
        ),
      );

    // Log the SQL query for debugging
    console.log("📝 SQL Query:", query.toSQL());

    const [listingDetails] = await query;

    if (!listingDetails) {
      throw new Error("Listing not found");
    }

    console.log("📊 Raw query result - deal fields:", {
      dealId: listingDetails.dealId,
      dealIdType: typeof listingDetails.dealId,
      dealStatus: listingDetails.dealStatus,
      dealArrasDate: listingDetails.dealArrasDate,
      dealActualDeedDate: listingDetails.dealActualDeedDate,
      dealCloseDate: listingDetails.dealCloseDate,
      listingIdFromResult: listingDetails.listingId,
      listingIdFromResultType: typeof listingDetails.listingId,
      allDealFields: {
        dealId: listingDetails.dealId,
        dealStatus: listingDetails.dealStatus,
        dealArrasDate: listingDetails.dealArrasDate,
        dealArrasSigningDate: listingDetails.dealArrasSigningDate,
        dealExpectedDeedDate: listingDetails.dealExpectedDeedDate,
        dealActualDeedDate: listingDetails.dealActualDeedDate,
        dealCloseDate: listingDetails.dealCloseDate,
        dealKeyHandoverDate: listingDetails.dealKeyHandoverDate,
      },
    });

    // Fetch owners for this listing
    const owners = await getCurrentListingOwners(listingId, accountId);

    // Transform deal fields into a deal object (or null if no deal exists)
    const deal = listingDetails.dealId
      ? {
          dealId: listingDetails.dealId,
          listingId: listingDetails.listingId,
          status: listingDetails.dealStatus,
          arrasDate: listingDetails.dealArrasDate,
          arrasSigningDate: listingDetails.dealArrasSigningDate,
          expectedDeedDate: listingDetails.dealExpectedDeedDate,
          actualDeedDate: listingDetails.dealActualDeedDate,
          closeDate: listingDetails.dealCloseDate,
          keyHandoverDate: listingDetails.dealKeyHandoverDate,
        }
      : null;

    // Create a clean listing object without deal fields (deal fields are now in the deal object)
    const {
      dealId: omitDealId,
      dealStatus: omitDealStatus,
      dealArrasDate: omitDealArrasDate,
      dealArrasSigningDate: omitDealArrasSigningDate,
      dealExpectedDeedDate: omitDealExpectedDeedDate,
      dealActualDeedDate: omitDealActualDeedDate,
      dealCloseDate: omitDealCloseDate,
      dealKeyHandoverDate: omitDealKeyHandoverDate,
      ...restListingDetails
    } = listingDetails;

    // Explicitly void the omitted variables to satisfy linter
    void omitDealId;
    void omitDealStatus;
    void omitDealArrasDate;
    void omitDealArrasSigningDate;
    void omitDealExpectedDeedDate;
    void omitDealActualDeedDate;
    void omitDealCloseDate;
    void omitDealKeyHandoverDate;

    // Return listing details with owners array and deal object
    return {
      ...restListingDetails,
      owners,
      deal,
    };
  } catch (error) {
    console.error("Error fetching listing details:", error);
    throw error;
  }
}

// Create a default listing for a newly created property
export async function createDefaultListing(propertyId: number) {
  try {
    const accountId = await getCurrentUserAccountId();
    const listingData = {
      accountId: BigInt(accountId),
      propertyId: BigInt(propertyId),
      agentId: "1", // Default agent ID
      listingType: "Sale" as const,
      price: "0", // Default price as string (decimal type)
      status: "Draft" as const, // Set as draft when created - will be activated when form is completed
      // All other fields will be null/undefined by default
    };

    const [result] = await db
      .insert(listings)
      .values(listingData)
      .returning();
    if (!result) throw new Error("Failed to create default listing");

    const [newListing] = await db
      .select()
      .from(listings)
      .where(eq(listings.listingId, BigInt(result.listingId)));

    // Log the listing creation activity (Alta stage - 10%)
    if (newListing) {
      await logListingCreated({
        listingId: BigInt(result.listingId),
        userId: listingData.agentId,
        propertyId: propertyId,
        listingType: listingData.listingType,
        initialStatus: listingData.status,
        source: "manual",
      });
    }

    return newListing;
  } catch (error) {
    console.error("Error creating default listing:", error);
    throw error;
  }
}

// Get draft listings with property and location information
export async function getDraftListings(accountId: number) {
  try {
    const draftListings = await db
      .select({
        listingId: listings.listingId,
        street: properties.street,
        city: locations.city,
        title: properties.title,
      })
      .from(listings)
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .where(
        and(
          eq(listings.status, "Draft"),
          eq(listings.accountId, BigInt(accountId)),
          eq(listings.isActive, true),
        ),
      )
      .orderBy(listings.createdAt);

    return draftListings;
  } catch (error) {
    console.error("Error fetching draft listings:", error);
    throw error;
  }
}

// Delete a draft listing
export async function deleteDraftListing(listingId: number, accountId: number) {
  try {
    // First verify it's actually a draft and belongs to this account
    const [draft] = await db
      .select()
      .from(listings)
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
          eq(listings.status, "Draft"),
          eq(listings.isActive, true),
        ),
      );

    if (!draft) {
      throw new Error("Draft listing not found or not a draft");
    }

    // Delete the draft listing
    await db
      .delete(listings)
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
        ),
      );

    return { success: true, message: "Borrador eliminado correctamente" };
  } catch (error) {
    console.error("Error deleting draft listing:", error);
    throw error;
  }
}

// Discard listing - sets status to "Descartado", keeps all data intact
export async function discardListingWithAuth(listingId: number) {
  const accountId = await getCurrentUserAccountId();
  return discardListing(listingId, accountId);
}

export async function discardListing(listingId: number, accountId: number) {
  try {
    // First verify the listing belongs to this account and get portal status
    const [listing] = await db
      .select({
        listingId: listings.listingId,
        accountId: listings.accountId,
        fotocasa: listings.fotocasa,
        idealista: listings.idealista,
      })
      .from(listings)
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
        ),
      );

    if (!listing) {
      throw new Error("Listing not found or access denied");
    }

    // PORTAL CLEANUP: Unpublish from portals when discarding
    // Fotocasa is blocking, Idealista is non-blocking
    console.log(`🗑️ [Discard Listing] Starting portal cleanup for listing ${listingId}...`);

    const { fotocasaResult, needsIdealistaExport } = await cleanupPortalAdsForListing(listingId);

    console.log(`📊 [Discard Listing] Portal cleanup results:`, {
      fotocasa: fotocasaResult,
      needsIdealistaExport,
    });

    // Update the listing status to "Descartado" and set portal flags to false
    await db
      .update(listings)
      .set({
        status: "Descartado",
        // Also disable portal publishing when discarding
        fotocasa: false,
        idealista: false,
      })
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
        ),
      );

    // PORTAL CLEANUP: Trigger Idealista export AFTER database update (non-blocking)
    // The new export will NOT include this listing since idealista is now false
    if (needsIdealistaExport) {
      console.log(`📤 [Discard Listing] Triggering Idealista export for account ${accountId}...`);
      // Fire and forget - don't await, non-blocking
      triggerIdealistaExportForAccount(accountId).catch((error) => {
        console.error(`⚠️ [Discard Listing] Idealista export failed (non-blocking):`, error);
      });
    }

    return {
      success: true,
      message:
        "Anuncio descartado correctamente. Puedes reactivarlo más tarde si es necesario.",
    };
  } catch (error) {
    console.error("Error discarding listing:", error);
    throw error;
  }
}

// Recover listing - sets status back to active based on listing type
export async function recoverListingWithAuth(listingId: number) {
  const accountId = await getCurrentUserAccountId();
  return recoverListing(listingId, accountId);
}

export async function recoverListing(listingId: number, accountId: number) {
  try {
    // First verify the listing belongs to this account and get its type
    const [listing] = await db
      .select()
      .from(listings)
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
        ),
      );

    if (!listing) {
      throw new Error("Listing not found or access denied");
    }

    // Determine the appropriate active status based on listing type
    let newStatus: string;
    const listingType = listing.listingType;

    if (
      listingType === "Rent" ||
      listingType === "RentWithOption" ||
      listingType === "RoomSharing"
    ) {
      newStatus = "En Alquiler";
    } else if (listingType === "Sale" || listingType === "Transfer") {
      newStatus = "En Venta";
    } else {
      // Fallback - use En Venta as default
      newStatus = "En Venta";
    }

    // Update the listing status to the appropriate active status
    await db
      .update(listings)
      .set({ status: newStatus })
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
        ),
      );

    return {
      success: true,
      message: `Anuncio recuperado correctamente. Estado cambiado a "${newStatus}".`,
    };
  } catch (error) {
    console.error("Error recovering listing:", error);
    throw error;
  }
}

// Delete listing only - deletes listing and associated contacts, keeps property intact
export async function deleteListingWithAuth(listingId: number) {
  const accountId = await getCurrentUserAccountId();
  return deleteListingOnly(listingId, accountId);
}

export async function deleteListingOnly(listingId: number, accountId: number) {
  try {
    // First verify the listing belongs to this account
    const [listing] = await db
      .select()
      .from(listings)
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
        ),
      );

    if (!listing) {
      throw new Error("Listing not found or access denied");
    }

    // PORTAL CLEANUP: Clean up portal ads BEFORE deleting from database
    // Fotocasa deletion is blocking (throws if fails)
    // Idealista just tracks if export is needed
    console.log(`🗑️ [Delete Listing] Starting portal cleanup for listing ${listingId}...`);

    const { fotocasaResult, needsIdealistaExport } = await cleanupPortalAdsForListing(listingId);

    console.log(`📊 [Delete Listing] Portal cleanup results:`, {
      fotocasa: fotocasaResult,
      needsIdealistaExport,
    });

    // 1. Delete listing_contacts for this listing
    await db
      .delete(listingContacts)
      .where(eq(listingContacts.listingId, BigInt(listingId)));

    // 2. Delete the listing itself
    await db
      .delete(listings)
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
        ),
      );

    // PORTAL CLEANUP: Trigger Idealista export AFTER database deletion (non-blocking)
    // The new export will NOT include the deleted listing
    if (needsIdealistaExport) {
      console.log(`📤 [Delete Listing] Triggering Idealista export for account ${accountId}...`);
      // Fire and forget - don't await, non-blocking
      triggerIdealistaExportForAccount(accountId).catch((error) => {
        console.error(`⚠️ [Delete Listing] Idealista export failed (non-blocking):`, error);
      });
    }

    return {
      success: true,
      message:
        "Anuncio eliminado correctamente. La propiedad se mantiene intacta.",
    };
  } catch (error) {
    console.error("Error deleting listing:", error);
    throw error;
  }
}

// Complete property deletion - deletes property and all related data
export async function deletePropertyWithAuth(propertyId: number) {
  const accountId = await getCurrentUserAccountId();
  return deleteProperty(propertyId, accountId);
}

export async function deleteProperty(propertyId: number, accountId: number) {
  try {
    // First verify the property belongs to this account
    const [property] = await db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.propertyId, BigInt(propertyId)),
          eq(properties.accountId, BigInt(accountId)),
        ),
      );

    if (!property) {
      throw new Error("Property not found or access denied");
    }

    // Get all listings for this property FIRST (need this for portal cleanup)
    const propertyListings = await db
      .select({ listingId: listings.listingId })
      .from(listings)
      .where(
        and(
          eq(listings.propertyId, BigInt(propertyId)),
          eq(listings.accountId, BigInt(accountId)),
        ),
      );

    // PORTAL CLEANUP: Clean up portal ads BEFORE deleting from database
    // This must happen before any database modifications
    let needsIdealistaExport = false;

    if (propertyListings.length > 0) {
      const listingIds = propertyListings.map((l) => l.listingId);
      console.log(`🗑️ [Delete Property] Starting portal cleanup for ${listingIds.length} listings...`);

      // Clean up all listings' portal ads (Fotocasa is blocking)
      const portalCleanup = await cleanupPortalAdsForMultipleListings(listingIds, accountId);

      console.log(`📊 [Delete Property] Portal cleanup results:`, {
        fotocasaResults: Object.fromEntries(portalCleanup.fotocasaResults),
        needsIdealistaExport: portalCleanup.needsIdealistaExport,
      });

      needsIdealistaExport = portalCleanup.needsIdealistaExport;
    }

    // S3 CLEANUP: Delete all S3 files (images, videos, documents, etc.)
    let s3CleanupResult = {
      deletedCount: 0,
      deletedFiles: [] as string[],
    };

    if (property.referenceNumber) {
      try {
        const { deletePropertyS3Folder } = await import("~/lib/s3");
        const result = await deletePropertyS3Folder(property.referenceNumber);
        s3CleanupResult = {
          deletedCount: result.deletedCount,
          deletedFiles: result.deletedFiles,
        };
        console.log(
          `Deleted ${result.deletedCount} S3 files for property ${property.referenceNumber}`,
        );
      } catch (s3Error) {
        console.error("Error deleting S3 files:", s3Error);
        // Log the error but continue with database cleanup
        // This prevents partial deletion if S3 fails
      }
    }

    // Start transaction-like cleanup (SingleStore doesn't support full transactions)

    // 1. Delete listing_contacts for all listings of this property
    if (propertyListings.length > 0) {
      const listingIds = propertyListings.map((l) => l.listingId);

      for (const listingId of listingIds) {
        await db
          .delete(listingContacts)
          .where(eq(listingContacts.listingId, listingId));
      }
    }

    // 2. Delete all documents associated with this property
    await db
      .delete(documents)
      .where(eq(documents.propertyId, BigInt(propertyId)));

    // 3. Delete all property_images for this property
    await db
      .delete(propertyImages)
      .where(eq(propertyImages.propertyId, BigInt(propertyId)));

    // 4. Delete all listings for this property
    await db
      .delete(listings)
      .where(
        and(
          eq(listings.propertyId, BigInt(propertyId)),
          eq(listings.accountId, BigInt(accountId)),
        ),
      );

    // 5. Finally delete the property itself
    await db
      .delete(properties)
      .where(
        and(
          eq(properties.propertyId, BigInt(propertyId)),
          eq(properties.accountId, BigInt(accountId)),
        ),
      );

    // PORTAL CLEANUP: Trigger Idealista export AFTER database deletion (non-blocking)
    // The new export will NOT include the deleted listings
    if (needsIdealistaExport) {
      console.log(`📤 [Delete Property] Triggering Idealista export for account ${accountId}...`);
      // Fire and forget - don't await, non-blocking
      triggerIdealistaExportForAccount(accountId).catch((error) => {
        console.error(`⚠️ [Delete Property] Idealista export failed (non-blocking):`, error);
      });
    }

    return {
      success: true,
      message:
        "Propiedad y todos sus datos relacionados eliminados correctamente",
      deletedListings: propertyListings.length,
      deletedS3Files: s3CleanupResult.deletedCount,
    };
  } catch (error) {
    console.error("Error deleting property:", error);
    throw error;
  }
}

// Lightweight query for PropertyBreadcrumb component
export async function getListingBreadcrumbData(listingId: number) {
  const accountId = await getCurrentUserAccountId();

  try {
    const [breadcrumbData] = await db
      .select({
        propertyType: properties.propertyType,
        street: properties.street,
        referenceNumber: properties.referenceNumber,
      })
      .from(listings)
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
          eq(listings.isActive, true),
        ),
      );

    if (!breadcrumbData) {
      throw new Error("Listing not found");
    }

    return breadcrumbData;
  } catch (error) {
    console.error("Error fetching listing breadcrumb data:", error);
    throw error;
  }
}

// Ultra-lightweight query for PropertyHeader component - only fields actually used
export async function getListingHeaderData(listingId: number) {
  const accountId = await getCurrentUserAccountId();

  try {
    const [headerData] = await db
      .select({
        // Fields actually displayed in PropertyHeader + listingId for breadcrumb
        title: properties.title,
        propertyId: listings.propertyId,
        listingId: listings.listingId,
        street: properties.street,
        city: locations.city,
        province: locations.province,
        postalCode: properties.postalCode,
        price: listings.price,
        listingType: listings.listingType,
        status: listings.status,
        isBankOwned: listings.isBankOwned,
      })
      .from(listings)
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
          eq(listings.isActive, true),
        ),
      );

    if (!headerData) {
      throw new Error("Listing not found");
    }

    return headerData;
  } catch (error) {
    console.error("Error fetching listing header data:", error);
    throw error;
  }
}

// Optimized query for PropertyTabs component - only fields needed by tabs
export async function getListingTabsData(listingId: number) {
  const accountId = await getCurrentUserAccountId();

  try {
    const [tabsData] = await db
      .select({
        listingId: listings.listingId,
        propertyId: listings.propertyId,
        propertyType: properties.propertyType,
        street: properties.street,
        city: locations.city,
        province: locations.province,
        postalCode: properties.postalCode,
        referenceNumber: properties.referenceNumber,
        price: listings.price,
        listingType: listings.listingType,
        isBankOwned: listings.isBankOwned,
        isFeatured: listings.isFeatured,
        neighborhood: locations.neighborhood,
        title: properties.title,
        fotocasa: listings.fotocasa,
        fcLocationVisibility: listings.fcLocationVisibility,
        fcPriceVisibility: listings.fcPriceVisibility,
        idealista: listings.idealista,
        idCoordinatesPrecision: listings.idCoordinatesPrecision,
        rentalType: listings.rentalType,
        shortTermLicense: listings.shortTermLicense,
        occupationStatus: listings.occupationStatus,
        priceReferenceIndex: listings.priceReferenceIndex,
        habitaclia: listings.habitaclia,
        milanuncios: listings.milanuncios,
        publishToWebsite: listings.publishToWebsite,
        hasCartel: listings.hasCartel,
        enEscaparate: listings.enEscaparate,
        fotocasaProps: listings.fotocasaProps,
        idealistaProps: listings.idealistaProps,
        habitacliaProps: listings.habitacliaProps,
        milanunciosProps: listings.milanunciosProps,
        energyCertification: properties.energyCertification,
        agentId: listings.agentId,
      })
      .from(listings)
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
          eq(listings.isActive, true),
        ),
      );

    if (!tabsData) {
      throw new Error("Listing not found");
    }

    return tabsData;
  } catch (error) {
    console.error("Error fetching listing tabs data:", error);
    throw error;
  }
}

// Ultra-lightweight query for DocumentsPage component - only fields needed for document management
export async function getListingDocumentsData(listingId: number) {
  const accountId = await getCurrentUserAccountId();

  try {
    const [documentsData] = await db
      .select({
        listingId: listings.listingId,
        propertyId: listings.propertyId,
        referenceNumber: properties.referenceNumber,
        street: properties.street,
        city: locations.city,
      })
      .from(listings)
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
          eq(listings.isActive, true),
        ),
      );

    if (!documentsData) {
      throw new Error("Listing not found");
    }

    return documentsData;
  } catch (error) {
    console.error("Error fetching listing documents data:", error);
    throw error;
  }
}

// Ultra-lightweight query for CartelEditor component - only listing type and property type needed
export async function getListingCartelData(listingId: number) {
  const accountId = await getCurrentUserAccountId();
  console.log("📊 [getListingCartelData] Starting fetch for:", {
    listingId,
    accountId,
  });

  try {
    const [cartelData] = await db
      .select({
        listingType: listings.listingType,
        propertyType: properties.propertyType,
        city: locations.city,
        neighborhood: locations.neighborhood,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        squareMeter: properties.squareMeter,
        contactProps: websiteProperties.contactProps,
        watermarkProps: websiteProperties.watermarkProps,
        logoUrl: websiteProperties.logo,
        website: accounts.website,
        preferences: accounts.preferences,
      })
      .from(listings)
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .leftJoin(accounts, eq(listings.accountId, accounts.accountId))
      .leftJoin(
        websiteProperties,
        eq(accounts.accountId, websiteProperties.accountId),
      )
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
          eq(listings.isActive, true),
        ),
      );

    console.log("📊 [getListingCartelData] Raw query result:", {
      hasCartelData: !!cartelData,
      contactPropsRaw: cartelData?.contactProps,
      contactPropsType: typeof cartelData?.contactProps,
      contactPropsLength: cartelData?.contactProps?.length,
      contactPropsFirstChars: cartelData?.contactProps?.substring?.(0, 100),
      website: cartelData?.website,
    });

    if (!cartelData) {
      throw new Error("Listing not found");
    }

    return cartelData;
  } catch (error) {
    console.error("Error fetching listing cartel data:", error);
    throw error;
  }
}

// Lightweight query for Guardar Cartel functionality - only essential IDs and reference
export async function getListingCartelSaveData(listingId: number) {
  const accountId = await getCurrentUserAccountId();

  try {
    const [cartelSaveData] = await db
      .select({
        listingId: listings.listingId,
        propertyId: listings.propertyId,
        referenceNumber: properties.referenceNumber,
      })
      .from(listings)
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
          eq(listings.isActive, true),
        ),
      );

    if (!cartelSaveData) {
      throw new Error("Listing not found");
    }

    return cartelSaveData;
  } catch (error) {
    console.error("Error fetching listing cartel save data:", error);
    throw error;
  }
}

// Get listing contacts by listingId - returns contactId and name for pre-populating forms
export async function getListingContactsByIdWithAuth(listingId: number) {
  const accountId = await getCurrentUserAccountId();

  try {
    const contactsData = await db
      .select({
        contactId: listingContacts.contactId,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
      })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContacts.listingId, BigInt(listingId)),
          eq(listingContacts.isActive, true),
          eq(contacts.isActive, true),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      );

    return contactsData;
  } catch (error) {
    console.error(
      "❌ [getListingContactsByIdWithAuth] Error fetching listing contacts:",
      error,
    );
    throw error;
  }
}
