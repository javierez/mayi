"use server";

import { db } from "~/server/db";
import { listingActivity, users } from "~/server/db/schema";
import { eq, desc, and } from "drizzle-orm";
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
): Promise<ListingActivityRecord[]> {
  try {
    const accountId = await getCurrentUserAccountId();

    // Fetch all listing activities with user information
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
      .leftJoin(users, eq(listingActivity.userId, users.id))
      .where(eq(listingActivity.listingId, BigInt(listingId)))
      .orderBy(desc(listingActivity.createdAt));

    // Transform to match our interface
    return activities.map((activity) => ({
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
  } catch (error) {
    console.error("Error fetching listing history:", error);
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
    const accountId = await getCurrentUserAccountId();

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
