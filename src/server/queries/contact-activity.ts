"use server";

import { db } from "../db";
import { contactActivity, users, contacts } from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getCurrentUserAccountId } from "../../lib/dal";

// Type for contact activity with user info
export interface ContactActivityWithUser {
  id: bigint;
  contactId: bigint;
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
}

/**
 * Get all contact activities for a specific contact
 * Includes user information for avatar display
 */
export async function getContactActivityByContactIdWithAuth(
  contactId: bigint,
): Promise<ContactActivityWithUser[]> {
  try {
    const accountId = await getCurrentUserAccountId();

    const activities = await db
      .select({
        id: contactActivity.id,
        contactId: contactActivity.contactId,
        userId: contactActivity.userId,
        action: contactActivity.action,
        details: contactActivity.details,
        createdAt: contactActivity.createdAt,
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
      })
      .from(contactActivity)
      .innerJoin(users, eq(contactActivity.userId, users.id))
      .innerJoin(contacts, eq(contactActivity.contactId, contacts.contactId))
      .where(
        and(
          eq(contactActivity.contactId, contactId),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      )
      .orderBy(desc(contactActivity.createdAt));

    return activities.map((activity) => ({
      ...activity,
      details: activity.details as Record<string, unknown>,
    }));
  } catch (error) {
    console.error("Error fetching contact activity:", error);
    throw error;
  }
}

