"use server";
import { db } from "~/server/db";
import { eq, and, sql } from "drizzle-orm";
import {
  prospects,
  contacts,
  prospectListingMatches,
  listings,
  properties,
  locations,
  propertyImages,
} from "~/server/db/schema";
import { createProspectHistory } from "~/server/queries/prospect-history";
import { getCurrentUserAccountId } from "~/lib/dal";

// Wrapper functions that automatically get accountId from current session
export async function createProspectWithAuth(input: CreateProspectInput) {
  const accountId = await getCurrentUserAccountId();
  return createProspect(input, accountId);
}

export async function getProspectWithAuth(id: bigint) {
  const accountId = await getCurrentUserAccountId();
  return getProspect(id, accountId);
}

export async function getAllProspectsWithAuth() {
  const accountId = await getCurrentUserAccountId();
  return getAllProspects(accountId);
}

export async function updateProspectWithAuth(
  id: bigint,
  input: UpdateProspectInput,
) {
  const accountId = await getCurrentUserAccountId();
  return updateProspect(id, input, accountId);
}

export async function deleteProspectWithAuth(id: bigint) {
  const accountId = await getCurrentUserAccountId();
  return deleteProspect(id, accountId);
}

export async function getProspectsByStatusWithAuth(status: string) {
  const accountId = await getCurrentUserAccountId();
  return getProspectsByStatus(status, accountId);
}

export async function getProspectsByPropertyTypeWithAuth(propertyType: string) {
  const accountId = await getCurrentUserAccountId();
  return getProspectsByPropertyType(propertyType, accountId);
}

export async function getProspectsByContactWithAuth(contactId: bigint) {
  const accountId = await getCurrentUserAccountId();
  return getProspectsByContact(contactId, accountId);
}

export type CreateProspectInput = {
  contactId: bigint;
  status: string;
  prospectType?: "search" | "listing"; // Defaults to "search" in database
  listingType?: string;
  propertyType?: string;
  minPrice?: string;
  maxPrice?: string;
  preferredCities?: string[]; // City names: ["León", "Alicante"]
  preferredAreas?: Array<{ name: string }>; // Neighborhood names: [{name: "Moisés de León"}]
  minBedrooms?: number;
  minBathrooms?: number;
  minSquareMeters?: number;
  maxSquareMeters?: number;
  moveInBy?: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extras?: Record<string, any>;
  urgencyLevel?: number;
  fundingReady?: boolean;
  notesInternal?: string;
};

export type UpdateProspectInput = Partial<CreateProspectInput> & {
  changedBy?: string; // Changed to string for BetterAuth compatibility
  changeReason?: string;
};

// Create a new prospect
export async function createProspect(
  input: CreateProspectInput,
  accountId: number,
) {
  // Verify the contact belongs to this account
  const [contact] = await db
    .select({ contactId: contacts.contactId })
    .from(contacts)
    .where(
      and(
        eq(contacts.contactId, input.contactId),
        eq(contacts.accountId, BigInt(accountId)),
        eq(contacts.isActive, true),
      ),
    );

  if (!contact) {
    throw new Error("Contact not found or access denied");
  }

  await db.insert(prospects).values(input);

  // Get the created prospect
  const [created] = await db
    .select({
      prospects: {
        id: prospects.id,
        contactId: prospects.contactId,
        status: prospects.status,
        listingType: prospects.listingType,
        propertyType: prospects.propertyType,
        minPrice: prospects.minPrice,
        maxPrice: prospects.maxPrice,
        preferredCities: prospects.preferredCities,
        preferredAreas: prospects.preferredAreas,
        minBedrooms: prospects.minBedrooms,
        minBathrooms: prospects.minBathrooms,
        minSquareMeters: prospects.minSquareMeters,
        maxSquareMeters: prospects.maxSquareMeters,
        moveInBy: prospects.moveInBy,
        extras: prospects.extras,
        urgencyLevel: prospects.urgencyLevel,
        fundingReady: prospects.fundingReady,
        notesInternal: prospects.notesInternal,
        createdAt: prospects.createdAt,
        updatedAt: prospects.updatedAt,
      },
      contacts: {
        contactId: contacts.contactId,
        accountId: contacts.accountId,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone,
        additionalInfo: contacts.additionalInfo,
        orgId: contacts.orgId,
        isActive: contacts.isActive,
        createdAt: contacts.createdAt,
        updatedAt: contacts.updatedAt,
      },
    })
    .from(prospects)
    .innerJoin(contacts, eq(prospects.contactId, contacts.contactId))
    .where(
      and(
        eq(prospects.contactId, input.contactId),
        eq(contacts.accountId, BigInt(accountId)),
      ),
    )
    .orderBy(prospects.createdAt)
    .limit(1);

  return created;
}

// Get a prospect by ID
export async function getProspect(id: bigint, accountId: number) {
  const [prospect] = await db
    .select({
      prospects: {
        id: prospects.id,
        contactId: prospects.contactId,
        status: prospects.status,
        listingType: prospects.listingType,
        propertyType: prospects.propertyType,
        minPrice: prospects.minPrice,
        maxPrice: prospects.maxPrice,
        preferredCities: prospects.preferredCities,
        preferredAreas: prospects.preferredAreas,
        minBedrooms: prospects.minBedrooms,
        minBathrooms: prospects.minBathrooms,
        minSquareMeters: prospects.minSquareMeters,
        maxSquareMeters: prospects.maxSquareMeters,
        moveInBy: prospects.moveInBy,
        extras: prospects.extras,
        urgencyLevel: prospects.urgencyLevel,
        fundingReady: prospects.fundingReady,
        notesInternal: prospects.notesInternal,
        createdAt: prospects.createdAt,
        updatedAt: prospects.updatedAt,
      },
      contacts: {
        contactId: contacts.contactId,
        accountId: contacts.accountId,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone,
        additionalInfo: contacts.additionalInfo,
        orgId: contacts.orgId,
        isActive: contacts.isActive,
        createdAt: contacts.createdAt,
        updatedAt: contacts.updatedAt,
      },
    })
    .from(prospects)
    .innerJoin(contacts, eq(prospects.contactId, contacts.contactId))
    .where(
      and(eq(prospects.id, id), eq(contacts.accountId, BigInt(accountId))),
    );
  return prospect;
}

// Get all prospects
export async function getAllProspects(accountId: number) {
  return await db
    .select({
      prospects: {
        id: prospects.id,
        contactId: prospects.contactId,
        status: prospects.status,
        listingType: prospects.listingType,
        propertyType: prospects.propertyType,
        minPrice: prospects.minPrice,
        maxPrice: prospects.maxPrice,
        preferredCities: prospects.preferredCities,
        preferredAreas: prospects.preferredAreas,
        minBedrooms: prospects.minBedrooms,
        minBathrooms: prospects.minBathrooms,
        minSquareMeters: prospects.minSquareMeters,
        maxSquareMeters: prospects.maxSquareMeters,
        moveInBy: prospects.moveInBy,
        extras: prospects.extras,
        urgencyLevel: prospects.urgencyLevel,
        fundingReady: prospects.fundingReady,
        notesInternal: prospects.notesInternal,
        createdAt: prospects.createdAt,
        updatedAt: prospects.updatedAt,
      },
      contacts: {
        contactId: contacts.contactId,
        accountId: contacts.accountId,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone,
        additionalInfo: contacts.additionalInfo,
        orgId: contacts.orgId,
        isActive: contacts.isActive,
        createdAt: contacts.createdAt,
        updatedAt: contacts.updatedAt,
      },
      matchCounts: sql<{
        high: number;
        medium: number;
        low: number;
        total: number;
      } | null>`
        (SELECT json_build_object(
          'high', COALESCE(COUNT(CASE WHEN ${prospectListingMatches.confidenceLevel} = 'high' THEN 1 END), 0)::int,
          'medium', COALESCE(COUNT(CASE WHEN ${prospectListingMatches.confidenceLevel} = 'medium' THEN 1 END), 0)::int,
          'low', COALESCE(COUNT(CASE WHEN ${prospectListingMatches.confidenceLevel} = 'low' THEN 1 END), 0)::int,
          'total', COALESCE(COUNT(*), 0)::int
        )
        FROM ${prospectListingMatches}
        WHERE ${prospectListingMatches.prospectId} = ${prospects.id}
          AND ${prospectListingMatches.isStale} = false
          AND ${prospectListingMatches.matchStatus} = 'new'
          AND ${prospectListingMatches.accountId} = ${BigInt(accountId)})
      `,
    })
    .from(prospects)
    .innerJoin(contacts, eq(prospects.contactId, contacts.contactId))
    .where(eq(contacts.accountId, BigInt(accountId)));
}

// Update a prospect
export async function updateProspect(
  id: bigint,
  input: UpdateProspectInput,
  accountId: number,
) {
  const currentProspect = await getProspect(id, accountId);
  if (!currentProspect) {
    throw new Error("Prospect not found or access denied");
  }

  // If status is changing, create a history entry
  if (
    input.status &&
    input.status !== currentProspect.prospects.status &&
    input.changedBy
  ) {
    await createProspectHistory({
      prospectId: id,
      previousStatus: currentProspect.prospects.status,
      newStatus: input.status,
      changedBy: input.changedBy,
      changeReason: input.changeReason,
    });
  }

  await db
    .update(prospects)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(prospects.id, id));

  // Get the updated prospect
  return await getProspect(id, accountId);
}

// Delete a prospect
export async function deleteProspect(id: bigint, accountId: number) {
  // Verify the prospect belongs to this account
  const prospect = await getProspect(id, accountId);
  if (!prospect) {
    throw new Error("Prospect not found or access denied");
  }

  await db.delete(prospects).where(eq(prospects.id, id));
  return prospect;
}

// Get prospects by status
export async function getProspectsByStatus(status: string, accountId: number) {
  return await db
    .select({
      prospects: {
        id: prospects.id,
        contactId: prospects.contactId,
        status: prospects.status,
        listingType: prospects.listingType,
        propertyType: prospects.propertyType,
        minPrice: prospects.minPrice,
        maxPrice: prospects.maxPrice,
        preferredCities: prospects.preferredCities,
        preferredAreas: prospects.preferredAreas,
        minBedrooms: prospects.minBedrooms,
        minBathrooms: prospects.minBathrooms,
        minSquareMeters: prospects.minSquareMeters,
        maxSquareMeters: prospects.maxSquareMeters,
        moveInBy: prospects.moveInBy,
        extras: prospects.extras,
        urgencyLevel: prospects.urgencyLevel,
        fundingReady: prospects.fundingReady,
        notesInternal: prospects.notesInternal,
        createdAt: prospects.createdAt,
        updatedAt: prospects.updatedAt,
      },
      contacts: {
        contactId: contacts.contactId,
        accountId: contacts.accountId,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone,
        additionalInfo: contacts.additionalInfo,
        orgId: contacts.orgId,
        isActive: contacts.isActive,
        createdAt: contacts.createdAt,
        updatedAt: contacts.updatedAt,
      },
    })
    .from(prospects)
    .innerJoin(contacts, eq(prospects.contactId, contacts.contactId))
    .where(
      and(
        eq(prospects.status, status),
        eq(contacts.accountId, BigInt(accountId)),
      ),
    );
}

// Get prospects by property type
export async function getProspectsByPropertyType(
  propertyType: string,
  accountId: number,
) {
  return await db
    .select({
      prospects: {
        id: prospects.id,
        contactId: prospects.contactId,
        status: prospects.status,
        listingType: prospects.listingType,
        propertyType: prospects.propertyType,
        minPrice: prospects.minPrice,
        maxPrice: prospects.maxPrice,
        preferredCities: prospects.preferredCities,
        preferredAreas: prospects.preferredAreas,
        minBedrooms: prospects.minBedrooms,
        minBathrooms: prospects.minBathrooms,
        minSquareMeters: prospects.minSquareMeters,
        maxSquareMeters: prospects.maxSquareMeters,
        moveInBy: prospects.moveInBy,
        extras: prospects.extras,
        urgencyLevel: prospects.urgencyLevel,
        fundingReady: prospects.fundingReady,
        notesInternal: prospects.notesInternal,
        createdAt: prospects.createdAt,
        updatedAt: prospects.updatedAt,
      },
      contacts: {
        contactId: contacts.contactId,
        accountId: contacts.accountId,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone,
        additionalInfo: contacts.additionalInfo,
        orgId: contacts.orgId,
        isActive: contacts.isActive,
        createdAt: contacts.createdAt,
        updatedAt: contacts.updatedAt,
      },
    })
    .from(prospects)
    .innerJoin(contacts, eq(prospects.contactId, contacts.contactId))
    .where(
      and(
        eq(prospects.propertyType, propertyType),
        eq(contacts.accountId, BigInt(accountId)),
      ),
    );
}

// Get prospects by contact
export async function getProspectsByContact(
  contactId: bigint,
  accountId: number,
) {
  // Verify the contact belongs to this account
  const [contact] = await db
    .select({ contactId: contacts.contactId })
    .from(contacts)
    .where(
      and(
        eq(contacts.contactId, contactId),
        eq(contacts.accountId, BigInt(accountId)),
        eq(contacts.isActive, true),
      ),
    );

  if (!contact) {
    throw new Error("Contact not found or access denied");
  }

  return await db
    .select({
      prospects: {
        id: prospects.id,
        contactId: prospects.contactId,
        status: prospects.status,
        listingType: prospects.listingType,
        propertyType: prospects.propertyType,
        minPrice: prospects.minPrice,
        maxPrice: prospects.maxPrice,
        preferredCities: prospects.preferredCities,
        preferredAreas: prospects.preferredAreas,
        minBedrooms: prospects.minBedrooms,
        minBathrooms: prospects.minBathrooms,
        minSquareMeters: prospects.minSquareMeters,
        maxSquareMeters: prospects.maxSquareMeters,
        moveInBy: prospects.moveInBy,
        extras: prospects.extras,
        urgencyLevel: prospects.urgencyLevel,
        fundingReady: prospects.fundingReady,
        notesInternal: prospects.notesInternal,
        createdAt: prospects.createdAt,
        updatedAt: prospects.updatedAt,
      },
      contacts: {
        contactId: contacts.contactId,
        accountId: contacts.accountId,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone,
        additionalInfo: contacts.additionalInfo,
        orgId: contacts.orgId,
        isActive: contacts.isActive,
        createdAt: contacts.createdAt,
        updatedAt: contacts.updatedAt,
      },
    })
    .from(prospects)
    .innerJoin(contacts, eq(prospects.contactId, contacts.contactId))
    .where(
      and(
        eq(prospects.contactId, contactId),
        eq(contacts.accountId, BigInt(accountId)),
      ),
    );
}

// Get prospect with all its matches (internal and external)
export async function getProspectWithMatchesWithAuth(prospectId: bigint) {
  console.log("🔍 [getProspectWithMatchesWithAuth] Starting query for prospectId:", prospectId.toString());
  const accountId = await getCurrentUserAccountId();
  console.log("👤 [getProspectWithMatchesWithAuth] AccountId:", accountId);

  // Get prospect details with contact
  const prospectData = await db
    .select({
      prospect: prospects,
      contact: contacts,
    })
    .from(prospects)
    .innerJoin(contacts, eq(prospects.contactId, contacts.contactId))
    .where(
      and(
        eq(prospects.id, prospectId),
        eq(contacts.accountId, BigInt(accountId)),
      ),
    )
    .limit(1);

  console.log("📋 [getProspectWithMatchesWithAuth] Prospect data found:", prospectData.length);

  if (prospectData.length === 0) {
    console.error("❌ [getProspectWithMatchesWithAuth] Prospect not found or unauthorized");
    throw new Error("Prospect not found or unauthorized");
  }

  // Get all matches for this prospect
  const matchesData = await db
    .select({
      // Match metadata
      matchData: prospectListingMatches,

      // Listing data
      listingData: listings,

      // Property data
      propertyData: properties,

      // Location data (can be null due to leftJoin)
      locationData: locations,

      // Image data (can be null due to leftJoin)
      imageUrl: propertyImages.imageUrl,
    })
    .from(prospectListingMatches)
    .innerJoin(
      listings,
      eq(prospectListingMatches.listingId, listings.listingId),
    )
    .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
    .leftJoin(
      locations,
      eq(properties.neighborhoodId, locations.neighborhoodId),
    )
    .leftJoin(
      propertyImages,
      and(
        eq(propertyImages.propertyId, properties.propertyId),
        eq(propertyImages.isActive, true),
        eq(propertyImages.imageOrder, 1),
        sql`(${propertyImages.imageTag} IS NULL OR ${propertyImages.imageTag} NOT IN ('video', 'youtube', 'tour'))`,
      ),
    )
    .where(
      and(
        eq(prospectListingMatches.prospectId, prospectId),
        eq(prospectListingMatches.accountId, BigInt(accountId)),
        eq(prospectListingMatches.isStale, false),
        eq(prospectListingMatches.matchStatus, "new"),
      ),
    );

  console.log("🎯 [getProspectWithMatchesWithAuth] Matches found:", matchesData.length);
  console.log("📊 [getProspectWithMatchesWithAuth] Sample match:", matchesData[0]);

  // Transform matches data to expected format
  const transformedMatches = matchesData.map((match) => ({
    matchId: match.matchData.id,
    matchType: match.matchData.matchType,
    priceMatch: match.matchData.priceMatchScore ?? null,
    isCrossAccount: match.matchData.isCrossAccount,
    toleranceReasons: match.matchData.toleranceReasons,
    listingId: match.listingData.listingId,
    listingAccountId: match.listingData.accountId,
    price: match.listingData.price,
    listingType: match.listingData.listingType,
    propertyId: match.propertyData.propertyId,
    propertyType: match.propertyData.propertyType,
    bedrooms: match.propertyData.bedrooms,
    bathrooms: match.propertyData.bathrooms,
    squareMeter: match.propertyData.squareMeter,
    street: match.propertyData.street,
    imageUrl: match.imageUrl ?? null,
    city: match.locationData?.city ?? null,
    neighborhood: match.locationData?.neighborhood ?? null,
  }));

  const firstProspect = prospectData[0];
  if (!firstProspect) {
    throw new Error("Prospect data not found");
  }

  const result = {
    prospect: firstProspect.prospect,
    contact: firstProspect.contact,
    matches: transformedMatches,
  };

  console.log("✅ [getProspectWithMatchesWithAuth] Returning result:", {
    prospectId: result.prospect.id.toString(),
    contactId: result.contact.contactId.toString(),
    matchesCount: result.matches.length,
  });

  return result;
}
