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
  } | null;
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

/**
 * Fetch all contact activity records across all contacts for the current account
 * Ordered by most recent first
 * Normalized to match listing activity structure
 */
export async function getAllContactActivityHistory(
  page = 1,
  pageSize = 50,
): Promise<{
  activities: Array<ContactActivityWithUser & { 
    activityType: 'contact';
    contactName: string;
    contactId: bigint;
  }>;
  totalCount: number;
  totalPages: number;
}> {
  try {
    const accountId = await getCurrentUserAccountId();

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contactActivity)
      .innerJoin(contacts, eq(contactActivity.contactId, contacts.contactId))
      .where(eq(contacts.accountId, BigInt(accountId)));

    const totalCount = countResult?.count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Fetch paginated activities with user and contact information
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
        contactFirstName: contacts.firstName,
        contactLastName: contacts.lastName,
      })
      .from(contactActivity)
      .innerJoin(contacts, eq(contactActivity.contactId, contacts.contactId))
      .leftJoin(users, eq(contactActivity.userId, users.id))
      .where(eq(contacts.accountId, BigInt(accountId)))
      .orderBy(desc(contactActivity.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Transform to match our interface
    const activityRecords = activities.map((activity) => ({
      id: activity.id,
      contactId: activity.contactId,
      userId: activity.userId,
      action: activity.action,
      details: activity.details as Record<string, unknown>,
      createdAt: activity.createdAt,
      user: activity.user?.id ? activity.user : null,
      activityType: 'contact' as const,
      contactName: `${activity.contactFirstName} ${activity.contactLastName}`.trim(),
    })) as Array<ContactActivityWithUser & { activityType: 'contact'; contactName: string; contactId: bigint }>;

    return {
      activities: activityRecords,
      totalCount,
      totalPages,
    };
  } catch (error) {
    console.error("Error fetching all contact activity history:", error);
    throw error;
  }
}

