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

