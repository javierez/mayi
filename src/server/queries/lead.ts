"use server";

import { db } from "../db";
import {
  listingContacts,
  contacts,
  listings,
  properties,
  appointments,
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
  asc,
  sql,
  inArray,
} from "drizzle-orm";
import type { Lead } from "../../lib/data";
import { getCurrentUserAccountId } from "../../lib/dal";

// Wrapper functions that automatically get accountId from current session
export async function createLeadWithAuth(
  data: Omit<Lead, "listingContactId" | "createdAt" | "updatedAt">,
) {
  const accountId = await getCurrentUserAccountId();
  return createLead(data, accountId);
}

export async function getLeadByIdWithAuth(listingContactId: number) {
  const accountId = await getCurrentUserAccountId();
  return getLeadById(listingContactId, accountId);
}

export async function getLeadsByContactIdWithAuth(contactId: number) {
  const accountId = await getCurrentUserAccountId();
  return getLeadsByContactId(contactId, accountId);
}

export async function getLeadByListingAndContactWithAuth(
  listingId: number,
  contactId: number,
) {
  const accountId = await getCurrentUserAccountId();
  return getLeadByListingAndContact(listingId, contactId, accountId);
}

export async function ensureLeadExistsWithAuth(
  listingId: number,
  contactId: number,
) {
  const accountId = await getCurrentUserAccountId();
  return ensureLeadExists(listingId, contactId, accountId);
}

export async function updateLeadWithAuth(
  listingContactId: number,
  data: Omit<Partial<Lead>, "listingContactId">,
) {
  const accountId = await getCurrentUserAccountId();
  return updateLead(listingContactId, data, accountId);
}

export async function deleteLeadWithAuth(listingContactId: number) {
  const accountId = await getCurrentUserAccountId();
  return deleteLead(listingContactId, accountId);
}

export async function listLeadsWithAuth(
  page = 1,
  limit = 10,
  search?: string,
  badgeStatusFilters?: string[],
  sourceFilters?: string[],
  agentFilters?: string[],
  isActiveFilter?: boolean,
) {
  const accountId = await getCurrentUserAccountId();
  // Always use the detailed query to include listing and owner information
  return listLeadsWithDetails(
    page,
    limit,
    accountId,
    search,
    badgeStatusFilters,
    sourceFilters,
    agentFilters,
    isActiveFilter,
  );
}

// Create a new lead
export async function createLead(
  data: Omit<Lead, "listingContactId" | "createdAt" | "updatedAt">,
  accountId: number,
) {
  try {
    // Verify the contact belongs to this account
    const [contact] = await db
      .select({ contactId: contacts.contactId })
      .from(contacts)
      .where(
        and(
          eq(contacts.contactId, data.contactId),
          eq(contacts.accountId, BigInt(accountId)),
          eq(contacts.isActive, true),
        ),
      );

    if (!contact) {
      throw new Error("Contact not found or access denied");
    }

    const leadData = {
      contactId: data.contactId,
      listingId: data.listingId,
      contactType: "buyer" as const,
      prospectId: data.prospectId,
      source: data.source,
      status: data.status,
      isActive: true,
    };

    const [result] = await db
      .insert(listingContacts)
      .values(leadData)
      .$returningId();
    if (!result) throw new Error("Failed to create lead");
    const [newLead] = await db
      .select()
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContacts.listingContactId, BigInt(result.listingContactId)),
          eq(contacts.accountId, BigInt(accountId)),
          eq(listingContacts.contactType, "buyer"),
        ),
      );
    return newLead;
  } catch (error) {
    console.error("Error creating lead:", error);
    throw error;
  }
}

// Get lead by ID
export async function getLeadById(listingContactId: number, accountId: number) {
  try {
    const [lead] = await db
      .select()
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContacts.listingContactId, BigInt(listingContactId)),
          eq(contacts.accountId, BigInt(accountId)),
          eq(listingContacts.contactType, "buyer"),
        ),
      );
    return lead;
  } catch (error) {
    console.error("Error fetching lead:", error);
    throw error;
  }
}

// Get leads by contact ID
export async function getLeadsByContactId(
  contactId: number,
  accountId: number,
) {
  try {
    // Verify the contact belongs to this account
    const [contact] = await db
      .select({ contactId: contacts.contactId })
      .from(contacts)
      .where(
        and(
          eq(contacts.contactId, BigInt(contactId)),
          eq(contacts.accountId, BigInt(accountId)),
          eq(contacts.isActive, true),
        ),
      );

    if (!contact) {
      throw new Error("Contact not found or access denied");
    }

    const contactLeads = await db
      .select()
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContacts.contactId, BigInt(contactId)),
          eq(contacts.accountId, BigInt(accountId)),
          eq(listingContacts.contactType, "buyer"),
        ),
      );
    return contactLeads;
  } catch (error) {
    console.error("Error fetching leads by contact:", error);
    throw error;
  }
}

// Get lead by listing and contact
export async function getLeadByListingAndContact(
  listingId: number,
  contactId: number,
  accountId: number,
) {
  try {
    const [lead] = await db
      .select()
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContacts.listingId, BigInt(listingId)),
          eq(listingContacts.contactId, BigInt(contactId)),
          eq(contacts.accountId, BigInt(accountId)),
          eq(listingContacts.contactType, "buyer"),
        ),
      );

    return lead ?? null;
  } catch (error) {
    console.error("Error fetching lead by listing and contact:", error);
    throw error;
  }
}

// Ensure lead exists, create if it doesn't
export async function ensureLeadExists(
  listingId: number,
  contactId: number,
  accountId: number,
) {
  try {
    // First check if lead already exists
    const existingLead = await getLeadByListingAndContact(
      listingId,
      contactId,
      accountId,
    );

    if (existingLead) {
      return existingLead;
    }

    // If no lead exists, create one
    const leadData = {
      contactId: BigInt(contactId),
      listingId: BigInt(listingId),
      contactType: "buyer" as const,
      status: "Cita Pendiente",
      source: "Task",
      isActive: true,
    };

    const [result] = await db
      .insert(listingContacts)
      .values(leadData)
      .$returningId();

    if (!result) throw new Error("Failed to create lead");

    const [newLead] = await db
      .select()
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContacts.listingContactId, BigInt(result.listingContactId)),
          eq(contacts.accountId, BigInt(accountId)),
          eq(listingContacts.contactType, "buyer"),
        ),
      );

    return newLead;
  } catch (error) {
    console.error("Error ensuring lead exists:", error);
    throw error;
  }
}

// Update lead
export async function updateLead(
  listingContactId: number,
  data: Omit<Partial<Lead>, "listingContactId">,
  accountId: number,
) {
  try {
    // Verify the lead belongs to this account
    const [existingLead] = await db
      .select({ listingContactId: listingContacts.listingContactId })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContacts.listingContactId, BigInt(listingContactId)),
          eq(contacts.accountId, BigInt(accountId)),
          eq(listingContacts.contactType, "buyer"),
        ),
      );

    if (!existingLead) {
      throw new Error("Lead not found or access denied");
    }

    await db
      .update(listingContacts)
      .set(data)
      .where(eq(listingContacts.listingContactId, BigInt(listingContactId)));
    const [updatedLead] = await db
      .select()
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContacts.listingContactId, BigInt(listingContactId)),
          eq(contacts.accountId, BigInt(accountId)),
          eq(listingContacts.contactType, "buyer"),
        ),
      );
    return updatedLead;
  } catch (error) {
    console.error("Error updating lead:", error);
    throw error;
  }
}

// Delete lead
export async function deleteLead(listingContactId: number, accountId: number) {
  try {
    // Verify the lead belongs to this account
    const [existingLead] = await db
      .select({ listingContactId: listingContacts.listingContactId })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContacts.listingContactId, BigInt(listingContactId)),
          eq(contacts.accountId, BigInt(accountId)),
          eq(listingContacts.contactType, "buyer"),
        ),
      );

    if (!existingLead) {
      throw new Error("Lead not found or access denied");
    }

    await db
      .delete(listingContacts)
      .where(eq(listingContacts.listingContactId, BigInt(listingContactId)));
    return { success: true };
  } catch (error) {
    console.error("Error deleting lead:", error);
    throw error;
  }
}

// List all leads (with pagination)
export async function listLeads(page = 1, limit = 10, accountId: number) {
  try {
    const offset = (page - 1) * limit;
    const allLeads = await db
      .select()
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(contacts.accountId, BigInt(accountId)),
          eq(listingContacts.contactType, "buyer"),
        ),
      )
      .limit(limit)
      .offset(offset);
    return allLeads;
  } catch (error) {
    console.error("Error listing leads:", error);
    throw error;
  }
}

// Enhanced function with complete joins and filtering
export async function listLeadsWithDetails(
  page = 1,
  limit = 10,
  accountId: number,
  search?: string,
  badgeStatusFilters?: string[],
  sourceFilters?: string[],
  agentFilters?: string[],
  isActiveFilter?: boolean,
) {
  try {
    const offset = (page - 1) * limit;

    // Create aliases for owner tables to avoid naming conflicts
    const ownerListingContacts = aliasedTable(
      listingContacts,
      "ownerListingContacts",
    );
    const ownerContacts = aliasedTable(contacts, "ownerContacts");

    // Build where conditions
    const whereConditions = [eq(contacts.accountId, BigInt(accountId))];

    // Add isActive filter - default to true if not explicitly provided
    if (isActiveFilter !== undefined) {
      whereConditions.push(eq(listingContacts.isActive, isActiveFilter));
    } else {
      // Default: show only active leads
      whereConditions.push(eq(listingContacts.isActive, true));
    }

    // Add search condition
    if (search) {
      const searchCondition = or(
        // Contact fields
        like(contacts.firstName, `%${search}%`),
        like(contacts.lastName, `%${search}%`),
        like(contacts.email, `%${search}%`),
        // Owner fields
        like(ownerContacts.firstName, `%${search}%`),
        like(ownerContacts.lastName, `%${search}%`),
        // Property title
        like(properties.title, `%${search}%`),
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    // Add source filters
    if (sourceFilters && sourceFilters.length > 0) {
      const sourceConditions = sourceFilters.map((source) =>
        eq(listingContacts.source, source),
      );
      if (sourceConditions.length > 0) {
        const sourceCondition =
          sourceConditions.length === 1
            ? sourceConditions[0]!
            : or(...sourceConditions);
        if (sourceCondition) {
          whereConditions.push(sourceCondition);
        }
      }
    }

    // Add agent filters
    if (agentFilters && agentFilters.length > 0) {
      whereConditions.push(inArray(listings.agentId, agentFilters));
    }

    // Main query with all joins
    const allLeads = await db
      .select({
        // Lead data
        listingContactId: listingContacts.listingContactId,
        contactId: listingContacts.contactId,
        listingId: listingContacts.listingId,
        prospectId: listingContacts.prospectId,
        source: listingContacts.source,
        status: listingContacts.status,
        offer: listingContacts.offer,
        offerAccepted: listingContacts.offerAccepted,
        createdAt: listingContacts.createdAt,
        updatedAt: listingContacts.updatedAt,
        isActive: listingContacts.isActive,

        // Contact data (lead contact)
        contact: {
          contactId: contacts.contactId,
          firstName: contacts.firstName,
          lastName: contacts.lastName,
          email: contacts.email,
          phone: contacts.phone,
        },

        // Listing data (optional)
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
        },

        // Owner data (optional, from junction table)
        owner: {
          contactId: ownerContacts.contactId,
          firstName: ownerContacts.firstName,
          lastName: ownerContacts.lastName,
          email: ownerContacts.email,
          phone: ownerContacts.phone,
        },

        // Agent data (optional, from users table)
        agent: {
          id: users.id,
          name: users.name,
        },
      })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .leftJoin(listings, eq(listingContacts.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
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
      .where(and(eq(listingContacts.contactType, "buyer"), ...whereConditions))
      .orderBy(desc(listingContacts.createdAt), asc(listingContacts.status))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination (count distinct to handle duplicates)
    const totalResults = await db
      .select({ count: countDistinct(listingContacts.listingContactId) })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .leftJoin(listings, eq(listingContacts.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      // Add same owner joins to maintain consistency
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
      // Add same agent join to maintain consistency
      .leftJoin(users, eq(listings.agentId, users.id))
      .where(and(eq(listingContacts.contactType, "buyer"), ...whereConditions));

    const totalCount =
      totalResults[0] && "count" in totalResults[0]
        ? Number((totalResults[0] as { count: unknown }).count)
        : 0;

    // Deduplicate results by listingContactId in case of duplicate rows from joins
    const uniqueLeads = allLeads.reduce((acc, lead) => {
      const key = String((lead as Record<string, unknown>).listingContactId);
      if (!acc.has(key)) {
        acc.set(key, lead);
      }
      return acc;
    }, new Map());

    const deduplicatedLeads = Array.from(uniqueLeads.values());

    // Get visit counts for each contact-listing pair
    const contactListingPairs = deduplicatedLeads
      .filter((lead) => {
        // Access listingId from the lead structure
        const leadObj = lead as {
          contactId: bigint | null;
          listingId: bigint | null;
        };
        return leadObj.contactId !== null && leadObj.listingId !== null;
      })
      .map((lead) => {
        const leadObj = lead as { contactId: bigint; listingId: bigint };
        return {
          contactId: leadObj.contactId,
          listingId: leadObj.listingId,
        };
      });

    let visitCounts: Array<{
      contactId: bigint;
      listingId: bigint;
      totalVisits: number;
      upcomingVisits: number;
      missedVisits: number;
      completedVisits: number;
      cancelledVisits: number;
    }> = [];

    if (contactListingPairs.length > 0) {
      const contactIds = [
        ...new Set(contactListingPairs.map((p) => p.contactId)),
      ];
      const listingIds = [
        ...new Set(contactListingPairs.map((p) => p.listingId)),
      ];

      console.log(
        `🔍 [Leads] Checking appointments for ${contactIds.length} contacts and ${listingIds.length} listings`,
      );

      const visitCountResults = await db
        .select({
          contactId: appointments.contactId,
          listingId: appointments.listingId,
          totalVisits: sql<number>`COUNT(*)`.as("totalVisits"),
          upcomingVisits:
            sql<number>`SUM(CASE WHEN ${appointments.datetimeStart} > NOW() AND ${appointments.status} = 'Scheduled' THEN 1 ELSE 0 END)`.as(
              "upcomingVisits",
            ),
          missedVisits:
            sql<number>`SUM(CASE WHEN (${appointments.datetimeStart} < NOW() AND ${appointments.status} = 'Scheduled') OR ${appointments.status} = 'NoShow' THEN 1 ELSE 0 END)`.as(
              "missedVisits",
            ),
          completedVisits:
            sql<number>`SUM(CASE WHEN ${appointments.status} = 'Completed' THEN 1 ELSE 0 END)`.as(
              "completedVisits",
            ),
          cancelledVisits:
            sql<number>`SUM(CASE WHEN ${appointments.status} = 'Cancelled' THEN 1 ELSE 0 END)`.as(
              "cancelledVisits",
            ),
        })
        .from(appointments)
        .where(
          and(
            inArray(appointments.contactId, contactIds),
            inArray(appointments.listingId, listingIds),
            eq(appointments.isActive, true),
          ),
        )
        .groupBy(appointments.contactId, appointments.listingId);

      console.log(
        `📊 [Leads] Found ${visitCountResults.length} appointment records`,
      );

      visitCounts = visitCountResults
        .filter(
          (
            v,
          ): v is {
            contactId: bigint;
            listingId: bigint;
            totalVisits: number;
            upcomingVisits: number;
            missedVisits: number;
            completedVisits: number;
            cancelledVisits: number;
          } => v.contactId !== null && v.listingId !== null,
        )
        .map((v) => ({
          contactId: v.contactId,
          listingId: v.listingId,
          totalVisits: Number(v.totalVisits),
          upcomingVisits: Number(v.upcomingVisits),
          missedVisits: Number(v.missedVisits),
          completedVisits: Number(v.completedVisits),
          cancelledVisits: Number(v.cancelledVisits),
        }));
    }

    const visitMap = new Map(
      visitCounts.map((v) => [
        `${v.contactId.toString()}-${v.listingId.toString()}`,
        v,
      ]),
    );

    console.log(`🗺️ [Leads] Visit map has ${visitMap.size} entries`);

    // Merge visit data with leads
    const leadsWithVisits = deduplicatedLeads.map((lead) => {
      const leadObj = lead as {
        contactId: bigint | null;
        listingId: bigint | null;
        offer?: string | null;
      };
      const key = `${leadObj.contactId?.toString() ?? ""}-${leadObj.listingId?.toString() ?? ""}`;
      const visitStats = visitMap.get(key);

      if (visitStats) {
        console.log(
          `✅ [Leads] Found visit stats for lead ${key}:`,
          visitStats,
        );
      }
      const hasUpcomingVisit = (visitStats?.upcomingVisits ?? 0) > 0;
      const hasMissedVisit = (visitStats?.missedVisits ?? 0) > 0;
      const hasCompletedVisit = (visitStats?.completedVisits ?? 0) > 0;
      const hasCancelledVisit = (visitStats?.cancelledVisits ?? 0) > 0;
      const hasOffer = leadObj.offer !== null && leadObj.offer !== undefined;

      return {
        ...(lead as Record<string, unknown>),
        visitCount: visitStats?.totalVisits ?? 0,
        hasUpcomingVisit,
        hasMissedVisit,
        hasCompletedVisit,
        hasCancelledVisit,
        hasOffer,
      };
    });

    // Filter by badge status if provided
    let filteredLeads = leadsWithVisits;
    if (badgeStatusFilters && badgeStatusFilters.length > 0) {
      filteredLeads = leadsWithVisits.filter((lead) => {
        const leadObj = lead as {
          hasUpcomingVisit?: boolean;
          offerAccepted?: boolean | null;
          hasOffer?: boolean;
          hasCancelledVisit?: boolean;
          hasMissedVisit?: boolean;
          hasCompletedVisit?: boolean;
        };

        return badgeStatusFilters.some((filter) => {
          switch (filter) {
            case "hasUpcomingVisit":
              return leadObj.hasUpcomingVisit === true;
            case "offerAccepted":
              return leadObj.offerAccepted === true;
            case "offerRejected":
              return leadObj.offerAccepted === false;
            case "offerPending":
              return (
                leadObj.hasOffer === true && leadObj.offerAccepted === null
              );
            case "hasCancelledVisit":
              return (
                leadObj.hasCancelledVisit === true &&
                !leadObj.hasUpcomingVisit &&
                !leadObj.hasOffer
              );
            case "hasMissedVisit":
              return (
                leadObj.hasMissedVisit === true &&
                !leadObj.hasUpcomingVisit &&
                !leadObj.hasCancelledVisit &&
                !leadObj.hasOffer
              );
            case "hasCompletedVisit":
              return (
                leadObj.hasCompletedVisit === true &&
                !leadObj.hasOffer &&
                !leadObj.hasUpcomingVisit &&
                !leadObj.hasMissedVisit &&
                !leadObj.hasCancelledVisit
              );
            case "noVisits":
              return (
                !leadObj.hasUpcomingVisit &&
                !leadObj.hasMissedVisit &&
                !leadObj.hasCompletedVisit &&
                !leadObj.hasCancelledVisit &&
                !leadObj.hasOffer &&
                leadObj.offerAccepted === null
              );
            default:
              return false;
          }
        });
      });
    }

    // Sort by priority (same as activity tab)
    const sortedLeads = filteredLeads.sort((a, b) => {
      const aLead = a as Record<string, unknown> & {
        offerAccepted?: boolean | null;
        hasOffer?: boolean;
        hasUpcomingVisit?: boolean;
        hasMissedVisit?: boolean;
        hasCancelledVisit?: boolean;
        visitCount?: number;
        createdAt?: Date;
      };
      const bLead = b as Record<string, unknown> & {
        offerAccepted?: boolean | null;
        hasOffer?: boolean;
        hasUpcomingVisit?: boolean;
        hasMissedVisit?: boolean;
        hasCancelledVisit?: boolean;
        visitCount?: number;
        createdAt?: Date;
      };

      // 1. HIGHEST: Offer accepted (deal closing - highest priority)
      const aOfferAccepted = aLead.offerAccepted === true;
      const bOfferAccepted = bLead.offerAccepted === true;
      if (aOfferAccepted !== bOfferAccepted) return aOfferAccepted ? -1 : 1;

      // 2. HIGH: Has pending offer (potential deal in progress)
      const aHasPendingOffer = aLead.hasOffer && aLead.offerAccepted === null;
      const bHasPendingOffer = bLead.hasOffer && bLead.offerAccepted === null;
      if (aHasPendingOffer !== bHasPendingOffer)
        return aHasPendingOffer ? -1 : 1;

      // 3. IMPORTANT: Offer rejected (needs follow-up or re-engagement)
      const aOfferRejected = aLead.offerAccepted === false;
      const bOfferRejected = bLead.offerAccepted === false;
      if (aOfferRejected !== bOfferRejected) return aOfferRejected ? -1 : 1;

      // 4. URGENT: Has upcoming visit (scheduled, needs preparation)
      if (aLead.hasUpcomingVisit !== bLead.hasUpcomingVisit)
        return aLead.hasUpcomingVisit ? -1 : 1;

      // 5. ATTENTION: Has missed visit (needs immediate follow-up)
      if (aLead.hasMissedVisit !== bLead.hasMissedVisit)
        return aLead.hasMissedVisit ? -1 : 1;

      // 6. ATTENTION: Has cancelled visit (needs rescheduling)
      if (aLead.hasCancelledVisit !== bLead.hasCancelledVisit)
        return aLead.hasCancelledVisit ? -1 : 1;

      // 7. ENGAGEMENT: Visit count (more visits = warmer lead)
      if (aLead.visitCount !== bLead.visitCount)
        return (bLead.visitCount ?? 0) - (aLead.visitCount ?? 0);

      // 8. RECENCY: Most recent first (fresher leads)
      return (
        (bLead.createdAt?.getTime() ?? 0) - (aLead.createdAt?.getTime() ?? 0)
      );
    });

    // Use filtered count if badge filters are applied
    const finalCount =
      badgeStatusFilters && badgeStatusFilters.length > 0
        ? sortedLeads.length
        : totalCount;

    return {
      leads: sortedLeads,
      total: finalCount,
      page,
      totalPages: Math.ceil(finalCount / limit),
    };
  } catch (error) {
    console.error("Error listing leads with details:", error);
    throw error;
  }
}
