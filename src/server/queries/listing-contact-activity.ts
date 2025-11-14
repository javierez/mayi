"use server";

import { db } from "../db";
import { listingContactActivity, users, listingContacts, contacts, listings, properties } from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getCurrentUserAccountId } from "../../lib/dal";

// Type for listing contact activity with user info
export interface ListingContactActivityWithUser {
  id: bigint;
  listingContactId: bigint;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
    initials: string;
  };
  property: {
    title: string | null;
    referenceNumber: string | null;
  } | null;
  listingContact: {
    contactType: string | null;
  };
}

/**
 * Get all listing contact activities for a specific listing contact
 * Includes user information for avatar display
 */
export async function getListingContactActivityByListingContactIdWithAuth(
  listingContactId: bigint,
): Promise<ListingContactActivityWithUser[]> {
  try {
    const accountId = await getCurrentUserAccountId();

    const activities = await db
      .select({
        id: listingContactActivity.id,
        listingContactId: listingContactActivity.listingContactId,
        userId: listingContactActivity.userId,
        action: listingContactActivity.action,
        details: listingContactActivity.details,
        createdAt: listingContactActivity.createdAt,
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`CONCAT(
            COALESCE(LEFT(${users.firstName}, 1), ''),
            COALESCE(LEFT(${users.lastName}, 1), '')
          )`,
        },
        property: {
          title: properties.title,
          referenceNumber: properties.referenceNumber,
        },
        listingContact: {
          contactType: listingContacts.contactType,
        },
      })
      .from(listingContactActivity)
      .innerJoin(users, eq(listingContactActivity.userId, users.id))
      .innerJoin(
        listingContacts,
        eq(listingContactActivity.listingContactId, listingContacts.listingContactId),
      )
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .leftJoin(listings, eq(listingContacts.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(listingContactActivity.listingContactId, listingContactId),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      )
      .orderBy(desc(listingContactActivity.createdAt));

    return activities.map((activity) => ({
      ...activity,
      details: activity.details as Record<string, unknown>,
    }));
  } catch (error) {
    console.error("Error fetching listing contact activity:", error);
    throw error;
  }
}

/**
 * Get all listing contact activities for a specific contact across all listings
 * Includes user information for avatar display
 */
export async function getAllListingContactActivityByContactIdWithAuth(
  contactId: bigint,
): Promise<ListingContactActivityWithUser[]> {
  try {
    const accountId = await getCurrentUserAccountId();

    const activities = await db
      .select({
        id: listingContactActivity.id,
        listingContactId: listingContactActivity.listingContactId,
        userId: listingContactActivity.userId,
        action: listingContactActivity.action,
        details: listingContactActivity.details,
        createdAt: listingContactActivity.createdAt,
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`CONCAT(
            COALESCE(LEFT(${users.firstName}, 1), ''),
            COALESCE(LEFT(${users.lastName}, 1), '')
          )`,
        },
        property: {
          title: properties.title,
          referenceNumber: properties.referenceNumber,
        },
        listingContact: {
          contactType: listingContacts.contactType,
        },
      })
      .from(listingContactActivity)
      .innerJoin(users, eq(listingContactActivity.userId, users.id))
      .innerJoin(
        listingContacts,
        eq(listingContactActivity.listingContactId, listingContacts.listingContactId),
      )
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .leftJoin(listings, eq(listingContacts.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(listingContacts.contactId, contactId),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      )
      .orderBy(desc(listingContactActivity.createdAt));

    return activities.map((activity) => ({
      ...activity,
      details: activity.details as Record<string, unknown>,
    }));
  } catch (error) {
    console.error("Error fetching all listing contact activity for contact:", error);
    throw error;
  }
}

/**
 * Fetch all listing contact activity records across all listings and contacts for the current account
 * Ordered by most recent first
 * Normalized to match listing activity structure
 */
export async function getAllListingContactActivityHistory(
  page = 1,
  pageSize = 50,
): Promise<{
  activities: Array<ListingContactActivityWithUser & {
    activityType: 'listing_contact';
    contactName: string;
    contactId: bigint;
    listingId: bigint | null;
  }>;
  totalCount: number;
  totalPages: number;
}> {
  try {
    const accountId = await getCurrentUserAccountId();

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(listingContactActivity)
      .innerJoin(
        listingContacts,
        eq(listingContactActivity.listingContactId, listingContacts.listingContactId),
      )
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(eq(contacts.accountId, BigInt(accountId)));

    const totalCount = countResult?.count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Fetch paginated activities with user, contact, and property information
    const activities = await db
      .select({
        id: listingContactActivity.id,
        listingContactId: listingContactActivity.listingContactId,
        userId: listingContactActivity.userId,
        action: listingContactActivity.action,
        details: listingContactActivity.details,
        createdAt: listingContactActivity.createdAt,
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`CONCAT(
            COALESCE(LEFT(${users.firstName}, 1), ''),
            COALESCE(LEFT(${users.lastName}, 1), '')
          )`,
        },
        contactId: contacts.contactId,
        contactFirstName: contacts.firstName,
        contactLastName: contacts.lastName,
        listingId: listings.listingId,
        property: {
          title: properties.title,
          referenceNumber: properties.referenceNumber,
        },
        listingContact: {
          contactType: listingContacts.contactType,
        },
      })
      .from(listingContactActivity)
      .innerJoin(users, eq(listingContactActivity.userId, users.id))
      .innerJoin(
        listingContacts,
        eq(listingContactActivity.listingContactId, listingContacts.listingContactId),
      )
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .leftJoin(listings, eq(listingContacts.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(eq(contacts.accountId, BigInt(accountId)))
      .orderBy(desc(listingContactActivity.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Transform to match our interface
    const activityRecords = activities.map((activity) => ({
      id: activity.id,
      listingContactId: activity.listingContactId,
      userId: activity.userId,
      action: activity.action,
      details: activity.details as Record<string, unknown>,
      createdAt: activity.createdAt,
      user: activity.user,
      property: activity.property,
      listingContact: activity.listingContact,
      activityType: 'listing_contact' as const,
      contactName: `${activity.contactFirstName} ${activity.contactLastName}`.trim(),
      contactId: activity.contactId,
      listingId: activity.listingId,
    }));

    return {
      activities: activityRecords,
      totalCount,
      totalPages,
    };
  } catch (error) {
    console.error("Error fetching all listing contact activity history:", error);
    throw error;
  }
}

