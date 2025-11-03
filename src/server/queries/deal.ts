"use server";

import { db } from "../db";
import {
  deals,
  listings,
  properties,
  listingContacts,
  contacts,
  dealParticipants,
  users,
} from "../db/schema";
import {
  eq,
  and,
  like,
  or,
  aliasedTable,
  countDistinct,
  desc,
  inArray,
  gte,
  lte,
  between,
} from "drizzle-orm";
import type { Deal } from "../../lib/data";
import { getCurrentUserAccountId } from "../../lib/dal";

// Wrapper functions that automatically get accountId from current session
export async function createDealWithAuth(
  data: Omit<Deal, "dealId" | "createdAt" | "updatedAt">,
) {
  const accountId = await getCurrentUserAccountId();
  return createDeal(data, accountId);
}

export async function getDealByIdWithAuth(dealId: number) {
  const accountId = await getCurrentUserAccountId();
  return getDealById(dealId, accountId);
}

export async function getDealsByStatusWithAuth(status: Deal["status"]) {
  const accountId = await getCurrentUserAccountId();
  return getDealsByStatus(status, accountId);
}

export async function updateDealWithAuth(
  dealId: number,
  data: Omit<Partial<Deal>, "dealId">,
) {
  const accountId = await getCurrentUserAccountId();
  return updateDeal(dealId, data, accountId);
}

export async function deleteDealWithAuth(dealId: number) {
  const accountId = await getCurrentUserAccountId();
  return deleteDeal(dealId, accountId);
}

export async function listDealsWithAuth(page = 1, limit = 10) {
  const accountId = await getCurrentUserAccountId();
  return listDeals(page, limit, accountId);
}

export async function getDealByListingAndContactWithAuth(
  listingId: number,
  contactId: number,
) {
  const accountId = await getCurrentUserAccountId();
  return getDealByListingAndContact(listingId, contactId, accountId);
}

export async function getActiveDealForListingWithAuth(listingId: number) {
  const accountId = await getCurrentUserAccountId();
  return getActiveDealForListing(listingId, accountId);
}

// Create a new deal
export async function createDeal(
  data: Omit<Deal, "dealId" | "createdAt" | "updatedAt">,
  accountId: number,
) {
  try {
    // Verify the listing belongs to this account
    const [listing] = await db
      .select({ listingId: listings.listingId })
      .from(listings)
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(listings.listingId, data.listingId),
          eq(properties.accountId, BigInt(accountId)),
          eq(listings.isActive, true),
        ),
      );

    if (!listing) {
      throw new Error("Listing not found or access denied");
    }

    const [result] = await db.insert(deals).values(data).$returningId();
    if (!result) throw new Error("Failed to create deal");
    const [newDeal] = await db
      .select()
      .from(deals)
      .innerJoin(listings, eq(deals.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(deals.dealId, BigInt(result.dealId)),
          eq(properties.accountId, BigInt(accountId)),
        ),
      );
    return newDeal;
  } catch (error) {
    console.error("Error creating deal:", error);
    throw error;
  }
}

// Get deal by ID
export async function getDealById(dealId: number, accountId: number) {
  try {
    const [deal] = await db
      .select()
      .from(deals)
      .innerJoin(listings, eq(deals.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(deals.dealId, BigInt(dealId)),
          eq(properties.accountId, BigInt(accountId)),
        ),
      );
    return deal;
  } catch (error) {
    console.error("Error fetching deal:", error);
    throw error;
  }
}

// Get deals by status
export async function getDealsByStatus(
  status: Deal["status"],
  accountId: number,
) {
  try {
    const statusDeals = await db
      .select()
      .from(deals)
      .innerJoin(listings, eq(deals.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(deals.status, status),
          eq(properties.accountId, BigInt(accountId)),
        ),
      );
    return statusDeals;
  } catch (error) {
    console.error("Error fetching deals by status:", error);
    throw error;
  }
}

// Update deal
export async function updateDeal(
  dealId: number,
  data: Omit<Partial<Deal>, "dealId">,
  accountId: number,
) {
  try {
    // Verify the deal belongs to this account
    const [existingDeal] = await db
      .select({ dealId: deals.dealId })
      .from(deals)
      .innerJoin(listings, eq(deals.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(deals.dealId, BigInt(dealId)),
          eq(properties.accountId, BigInt(accountId)),
        ),
      );

    if (!existingDeal) {
      throw new Error("Deal not found or access denied");
    }

    await db
      .update(deals)
      .set(data)
      .where(eq(deals.dealId, BigInt(dealId)));
    const [updatedDeal] = await db
      .select()
      .from(deals)
      .innerJoin(listings, eq(deals.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(deals.dealId, BigInt(dealId)),
          eq(properties.accountId, BigInt(accountId)),
        ),
      );
    return updatedDeal;
  } catch (error) {
    console.error("Error updating deal:", error);
    throw error;
  }
}

// Delete deal
export async function deleteDeal(dealId: number, accountId: number) {
  try {
    // Verify the deal belongs to this account
    const [existingDeal] = await db
      .select({ dealId: deals.dealId })
      .from(deals)
      .innerJoin(listings, eq(deals.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(deals.dealId, BigInt(dealId)),
          eq(properties.accountId, BigInt(accountId)),
        ),
      );

    if (!existingDeal) {
      throw new Error("Deal not found or access denied");
    }

    await db.delete(deals).where(eq(deals.dealId, BigInt(dealId)));
    return { success: true };
  } catch (error) {
    console.error("Error deleting deal:", error);
    throw error;
  }
}

// Get deal by listing and contact
export async function getDealByListingAndContact(
  listingId: number,
  contactId: number,
  accountId: number,
) {
  try {
    const [deal] = await db
      .select({
        dealId: deals.dealId,
        listingId: deals.listingId,
        listingContactId: deals.listingContactId,
        status: deals.status,
        closeDate: deals.closeDate,
        createdAt: deals.createdAt,
        updatedAt: deals.updatedAt,
      })
      .from(deals)
      .innerJoin(listings, eq(deals.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        listingContacts,
        eq(deals.listingContactId, listingContacts.listingContactId),
      )
      .where(
        and(
          eq(deals.listingId, BigInt(listingId)),
          eq(listingContacts.contactId, BigInt(contactId)),
          eq(properties.accountId, BigInt(accountId)),
        ),
      );

    return deal ?? null;
  } catch (error) {
    console.error("Error fetching deal by listing and contact:", error);
    throw error;
  }
}

// Get active deal for a listing (for progress tracking)
export async function getActiveDealForListing(
  listingId: number,
  accountId: number,
) {
  try {
    // Get the most recent non-cancelled deal for this listing
    // Priority: 1) Ongoing deals (not cancelled/lost), 2) Most recent
    const [deal] = await db
      .select({
        dealId: deals.dealId,
        listingId: deals.listingId,
        status: deals.status,
        arrasDate: deals.arrasDate,
        arrasSigningDate: deals.arrasSigningDate,
        expectedDeedDate: deals.expectedDeedDate,
        actualDeedDate: deals.actualDeedDate,
        closeDate: deals.closeDate,
        keyHandoverDate: deals.keyHandoverDate,
      })
      .from(deals)
      .innerJoin(listings, eq(deals.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(deals.listingId, BigInt(listingId)),
          eq(properties.accountId, BigInt(accountId)),
        ),
      )
      .orderBy(desc(deals.createdAt))
      .limit(1);

    return deal ?? null;
  } catch (error) {
    console.error("Error fetching active deal for listing:", error);
    throw error;
  }
}

// List all deals (with pagination)
export async function listDeals(page = 1, limit = 10, accountId: number) {
  try {
    const offset = (page - 1) * limit;
    const allDeals = await db
      .select()
      .from(deals)
      .innerJoin(listings, eq(deals.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(eq(properties.accountId, BigInt(accountId)))
      .limit(limit)
      .offset(offset);
    return allDeals;
  } catch (error) {
    console.error("Error listing deals:", error);
    throw error;
  }
}

// Enhanced function with complete joins and filtering
export async function listDealsWithDetails(
  page = 1,
  limit = 10,
  accountId: number,
  search?: string,
  statusFilters?: string[],
  agentFilters?: string[],
  closeDateFrom?: Date,
  closeDateTo?: Date,
  minAmount?: number,
  maxAmount?: number,
) {
  try {
    const offset = (page - 1) * limit;

    // Create aliases for owner and buyer tables to avoid naming conflicts
    const buyerListingContacts = aliasedTable(
      listingContacts,
      "buyerListingContacts",
    );
    const buyerContacts = aliasedTable(contacts, "buyerContacts");
    const ownerListingContacts = aliasedTable(
      listingContacts,
      "ownerListingContacts",
    );
    const ownerContacts = aliasedTable(contacts, "ownerContacts");

    // Build where conditions
    const whereConditions = [eq(properties.accountId, BigInt(accountId))];

    // Add search condition
    if (search) {
      const searchCondition = or(
        // Buyer contact fields
        like(buyerContacts.firstName, `%${search}%`),
        like(buyerContacts.lastName, `%${search}%`),
        like(buyerContacts.email, `%${search}%`),
        // Owner fields
        like(ownerContacts.firstName, `%${search}%`),
        like(ownerContacts.lastName, `%${search}%`),
        // Property fields
        like(properties.title, `%${search}%`),
        like(properties.referenceNumber, `%${search}%`),
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    // Add status filters
    if (statusFilters && statusFilters.length > 0) {
      const statusConditions = statusFilters.map((status) =>
        eq(deals.status, status),
      );
      if (statusConditions.length > 0) {
        const statusCondition =
          statusConditions.length === 1
            ? statusConditions[0]!
            : or(...statusConditions);
        if (statusCondition) {
          whereConditions.push(statusCondition);
        }
      }
    }

    // Add agent filters
    if (agentFilters && agentFilters.length > 0) {
      whereConditions.push(inArray(listings.agentId, agentFilters));
    }

    // Add close date range filters
    if (closeDateFrom && closeDateTo) {
      whereConditions.push(between(deals.closeDate, closeDateFrom, closeDateTo));
    } else if (closeDateFrom) {
      whereConditions.push(gte(deals.closeDate, closeDateFrom));
    } else if (closeDateTo) {
      whereConditions.push(lte(deals.closeDate, closeDateTo));
    }

    // Add final price range filters
    if (minAmount !== undefined && maxAmount !== undefined) {
      whereConditions.push(between(deals.finalPrice, minAmount.toString(), maxAmount.toString()));
    } else if (minAmount !== undefined) {
      whereConditions.push(gte(deals.finalPrice, minAmount.toString()));
    } else if (maxAmount !== undefined) {
      whereConditions.push(lte(deals.finalPrice, maxAmount.toString()));
    }

    // Main query with all joins
    const allDeals = await db
      .select({
        // Deal data
        dealId: deals.dealId,
        listingId: deals.listingId,
        listingContactId: deals.listingContactId,
        status: deals.status,
        closeDate: deals.closeDate,
        finalPrice: deals.finalPrice,
        commissionPercentage: deals.commissionPercentage,
        commissionAmount: deals.commissionAmount,
        arrasAmount: deals.arrasAmount,
        createdAt: deals.createdAt,
        updatedAt: deals.updatedAt,

        // Listing/Property data
        listing: {
          listingId: listings.listingId,
          referenceNumber: properties.referenceNumber,
          title: properties.title,
          street: properties.street,
          price: listings.price,
          listingType: listings.listingType,
          propertyType: properties.propertyType,
          bedrooms: properties.bedrooms,
          squareMeter: properties.squareMeter,
          neighborhood: properties.neighborhoodId,
        },

        // Buyer data (optional, from listing_contacts junction table)
        buyer: {
          contactId: buyerContacts.contactId,
          firstName: buyerContacts.firstName,
          lastName: buyerContacts.lastName,
          email: buyerContacts.email,
          phone: buyerContacts.phone,
        },

        // Owner data (optional, from listing_contacts junction table)
        owner: {
          contactId: ownerContacts.contactId,
          firstName: ownerContacts.firstName,
          lastName: ownerContacts.lastName,
          email: ownerContacts.email,
          phone: ownerContacts.phone,
        },

        // Agent data (from users table)
        agent: {
          id: users.id,
          name: users.name,
        },
      })
      .from(deals)
      .innerJoin(listings, eq(deals.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      // Join buyer data via listing_contacts with contactType="buyer"
      .leftJoin(
        buyerListingContacts,
        eq(deals.listingContactId, buyerListingContacts.listingContactId),
      )
      .leftJoin(
        buyerContacts,
        eq(buyerListingContacts.contactId, buyerContacts.contactId),
      )
      // Join owner data via listing_contacts with contactType="owner"
      .leftJoin(
        ownerListingContacts,
        and(
          eq(listings.listingId, ownerListingContacts.listingId),
          eq(ownerListingContacts.contactType, "owner"),
        ),
      )
      .leftJoin(
        ownerContacts,
        eq(ownerListingContacts.contactId, ownerContacts.contactId),
      )
      // Join agent data via listings.agentId
      .leftJoin(users, eq(listings.agentId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(deals.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalResults = await db
      .select({ count: countDistinct(deals.dealId) })
      .from(deals)
      .innerJoin(listings, eq(deals.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      // Add same joins to maintain consistency
      .leftJoin(
        buyerListingContacts,
        eq(deals.listingContactId, buyerListingContacts.listingContactId),
      )
      .leftJoin(
        buyerContacts,
        eq(buyerListingContacts.contactId, buyerContacts.contactId),
      )
      .leftJoin(
        ownerListingContacts,
        and(
          eq(listings.listingId, ownerListingContacts.listingId),
          eq(ownerListingContacts.contactType, "owner"),
        ),
      )
      .leftJoin(
        ownerContacts,
        eq(ownerListingContacts.contactId, ownerContacts.contactId),
      )
      .leftJoin(users, eq(listings.agentId, users.id))
      .where(and(...whereConditions));

    const totalCount =
      totalResults[0] && "count" in totalResults[0]
        ? Number((totalResults[0] as { count: unknown }).count)
        : 0;

    // Deduplicate results by dealId in case of duplicate rows from joins
    const uniqueDeals = allDeals.reduce((acc, deal) => {
      const key = String((deal as Record<string, unknown>).dealId);
      if (!acc.has(key)) {
        acc.set(key, deal);
      }
      return acc;
    }, new Map());

    const deduplicatedDeals = Array.from(uniqueDeals.values());

    // Get participants for each deal
    const dealIds = deduplicatedDeals.map(
      (deal) => (deal as { dealId: bigint }).dealId,
    );

    let participantsData: Array<{
      dealId: bigint;
      contactId: bigint;
      role: string;
      firstName: string;
      lastName: string;
    }> = [];

    if (dealIds.length > 0) {
      participantsData = await db
        .select({
          dealId: dealParticipants.dealId,
          contactId: dealParticipants.contactId,
          role: dealParticipants.role,
          firstName: contacts.firstName,
          lastName: contacts.lastName,
        })
        .from(dealParticipants)
        .innerJoin(
          contacts,
          eq(dealParticipants.contactId, contacts.contactId),
        )
        .where(inArray(dealParticipants.dealId, dealIds));
    }

    // Group participants by dealId
    const participantsMap = new Map<
      string,
      Array<{
        contactId: bigint;
        firstName: string;
        lastName: string;
        role: string;
      }>
    >();

    participantsData.forEach((p) => {
      const key = p.dealId.toString();
      if (!participantsMap.has(key)) {
        participantsMap.set(key, []);
      }
      participantsMap.get(key)!.push({
        contactId: p.contactId,
        firstName: p.firstName,
        lastName: p.lastName,
        role: p.role,
      });
    });

    // Merge participants with deals
    const dealsWithParticipants = deduplicatedDeals.map((deal) => {
      const dealObj = deal as { dealId: bigint };
      const participants = participantsMap.get(dealObj.dealId.toString()) ?? [];

      return {
        ...(deal as Record<string, unknown>),
        participants,
      };
    });

    return {
      deals: dealsWithParticipants,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    console.error("Error listing deals with details:", error);
    throw error;
  }
}

// Wrapper for listDealsWithDetails that gets accountId from session
export async function listDealsWithDetailsAuth(
  page = 1,
  limit = 10,
  search?: string,
  statusFilters?: string[],
  agentFilters?: string[],
  closeDateFrom?: Date,
  closeDateTo?: Date,
  minAmount?: number,
  maxAmount?: number,
) {
  const accountId = await getCurrentUserAccountId();
  return listDealsWithDetails(
    page,
    limit,
    accountId,
    search,
    statusFilters,
    agentFilters,
    closeDateFrom,
    closeDateTo,
    minAmount,
    maxAmount,
  );
}
