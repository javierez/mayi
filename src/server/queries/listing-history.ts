"use server";

import { db } from "~/server/db";
import { listingActivity, users, listings, properties } from "~/server/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { getCurrentUserAccountId } from "~/lib/dal";
import type { ListingActivityAction } from "~/lib/constants/listing-activity-actions";

export interface ListingActivityRecord {
  id: bigint;
  listingId: bigint;
  userId: string;
  action: ListingActivityAction;
  details: Record<string, unknown>;
  createdAt: Date;
  user: {
    name: string;
    email: string;
  } | null;
}

/**
 * Fetch all activity records for a specific listing
 * Ordered by most recent first
 */
export async function getListingHistory(
  listingId: number,
  page: number = 1,
  pageSize: number = 50,
): Promise<{
  activities: ListingActivityRecord[];
  totalCount: number;
  totalPages: number;
}> {
  try {
    await getCurrentUserAccountId();

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(listingActivity)
      .where(eq(listingActivity.listingId, BigInt(listingId)));

    const totalCount = countResult?.count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Fetch paginated listing activities with user information
    // Note: Using BINARY comparison to avoid collation mismatch between
    // listing_activity.user_id (utf8mb4_unicode_ci) and users.id (utf8mb4_general_ci)
    const activities = await db
      .select({
        id: listingActivity.id,
        listingId: listingActivity.listingId,
        userId: listingActivity.userId,
        action: listingActivity.action,
        details: listingActivity.details,
        createdAt: listingActivity.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(listingActivity)
      .leftJoin(users, sql`BINARY ${listingActivity.userId} = BINARY ${users.id}`)
      .where(eq(listingActivity.listingId, BigInt(listingId)))
      .orderBy(desc(listingActivity.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Transform to match our interface
    const activityRecords = activities.map((activity) => ({
      id: activity.id,
      listingId: activity.listingId,
      userId: activity.userId,
      action: activity.action as ListingActivityAction,
      details: activity.details as Record<string, unknown>,
      createdAt: activity.createdAt,
      user: activity.userName
        ? {
            name: activity.userName,
            email: activity.userEmail ?? "",
          }
        : null,
    }));

    return {
      activities: activityRecords,
      totalCount,
      totalPages,
    };
  } catch (error) {
    console.error("Error fetching listing history:", error);
    throw error;
  }
}

/**
 * Fetch all activity records across all listings for the current account
 * Ordered by most recent first
 */
export async function getAllListingsHistory(
  page: number = 1,
  pageSize: number = 50,
): Promise<{
  activities: Array<ListingActivityRecord & { listingTitle: string; referenceNumber: string | null }>;
  totalCount: number;
  totalPages: number;
}> {
  try {
    const accountId = await getCurrentUserAccountId();

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(listingActivity)
      .innerJoin(listings, eq(listingActivity.listingId, listings.listingId))
      .where(eq(listings.accountId, accountId));

    const totalCount = countResult?.count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Fetch paginated activities with user, listing, and property information
    const activities = await db
      .select({
        id: listingActivity.id,
        listingId: listingActivity.listingId,
        userId: listingActivity.userId,
        action: listingActivity.action,
        details: listingActivity.details,
        createdAt: listingActivity.createdAt,
        userName: users.name,
        userEmail: users.email,
        listingTitle: properties.title,
        referenceNumber: properties.referenceNumber,
      })
      .from(listingActivity)
      .innerJoin(listings, eq(listingActivity.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(users, sql`BINARY ${listingActivity.userId} = BINARY ${users.id}`)
      .where(eq(listings.accountId, accountId))
      .orderBy(desc(listingActivity.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Transform to match our interface
    const activityRecords = activities.map((activity) => ({
      id: activity.id,
      listingId: activity.listingId,
      userId: activity.userId,
      action: activity.action as ListingActivityAction,
      details: activity.details as Record<string, unknown>,
      createdAt: activity.createdAt,
      user: activity.userName
        ? {
            name: activity.userName,
            email: activity.userEmail ?? "",
          }
        : null,
      listingTitle: activity.listingTitle ?? `Propiedad #${activity.listingId}`,
      referenceNumber: activity.referenceNumber,
    }));

    return {
      activities: activityRecords,
      totalCount,
      totalPages,
    };
  } catch (error) {
    console.error("Error fetching all listings history:", error);
    throw error;
  }
}

/**
 * Fetch all price change activities for a specific listing
 * Used for price history chart
 */
export async function getListingPriceHistory(
  listingId: number,
): Promise<Array<{
  date: Date;
  price: number;
  percentChange: number;
  changeType: "reduction" | "increase" | "correction";
  updatedBy: string;
}>> {
  try {
    await getCurrentUserAccountId();

    const activities = await db
      .select({
        details: listingActivity.details,
        createdAt: listingActivity.createdAt,
      })
      .from(listingActivity)
      .where(
        and(
          eq(listingActivity.listingId, BigInt(listingId)),
          eq(listingActivity.action, "price_changed"),
        ),
      )
      .orderBy(listingActivity.createdAt);

    return activities.map((activity) => {
      const details = activity.details as {
        newValue: number;
        percentChange: number;
        changeType: "reduction" | "increase" | "correction";
        updatedBy: string;
      };

      return {
        date: activity.createdAt,
        price: details.newValue,
        percentChange: details.percentChange,
        changeType: details.changeType,
        updatedBy: details.updatedBy,
      };
    });
  } catch (error) {
    console.error("Error fetching price history:", error);
    throw error;
  }
}
