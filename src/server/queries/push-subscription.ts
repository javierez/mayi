"use server";

import { db } from "~/server/db";
import { pushSubscriptions } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUserAccountId, getSecureSession } from "~/lib/dal";

export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}

/**
 * Create a new push subscription for the current user
 */
export async function createPushSubscription(
  subscription: PushSubscriptionData,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[PushSubscription] 📥 Creating push subscription...");
    const session = await getSecureSession();
    if (!session?.user) {
      console.log("[PushSubscription] ❌ Unauthorized: No session found");
      return { success: false, error: "Unauthorized: No session found" };
    }

    const accountIdNum = await getCurrentUserAccountId();
    const accountId = BigInt(accountIdNum);
    const userId = session.user.id;

    console.log("[PushSubscription] 🔍 Checking for existing subscription:", {
      userId,
      accountId: accountId.toString(),
      endpoint: subscription.endpoint.substring(0, 50) + "...",
    });

    // Check if subscription with this endpoint already exists
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.endpoint, subscription.endpoint),
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.accountId, accountId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing subscription
      console.log("[PushSubscription] 🔄 Updating existing subscription:", {
        subscriptionId: existing[0]!.subscriptionId.toString(),
      });
      await db
        .update(pushSubscriptions)
        .set({
          p256dh: subscription.p256dh,
          auth: subscription.auth,
          userAgent: subscription.userAgent ?? null,
          updatedAt: new Date(),
          isActive: true,
        })
        .where(eq(pushSubscriptions.subscriptionId, existing[0]!.subscriptionId));

      console.log("[PushSubscription] ✅ Subscription updated successfully");
      return { success: true };
    }

    // Create new subscription
    console.log("[PushSubscription] ➕ Creating new subscription...");
    const result = await db.insert(pushSubscriptions).values({
      userId,
      accountId,
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth,
      userAgent: subscription.userAgent ?? null,
    });

    console.log("[PushSubscription] ✅ New subscription created successfully");
    return { success: true };
  } catch (error) {
    console.error("[PushSubscription] ❌ Error creating push subscription:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get all active push subscriptions for a user
 * Used by push service to send notifications to all user's devices
 */
export async function getPushSubscriptionsByUser(
  userId: string,
  accountId: bigint,
): Promise<
  Array<{
    subscriptionId: bigint;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent: string | null;
  }>
> {
  const results = await db
    .select({
      subscriptionId: pushSubscriptions.subscriptionId,
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
      userAgent: pushSubscriptions.userAgent,
    })
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.accountId, accountId),
        eq(pushSubscriptions.isActive, true),
      ),
    );

  return results;
}

/**
 * Delete a push subscription by subscription ID
 * Requires authentication to ensure user can only delete their own subscriptions
 */
export async function deletePushSubscription(
  subscriptionId: bigint,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[PushSubscription] 🗑️ Deleting push subscription:", {
      subscriptionId: subscriptionId.toString(),
    });
    
    const session = await getSecureSession();
    if (!session?.user) {
      console.log("[PushSubscription] ❌ Unauthorized: No session found");
      return { success: false, error: "Unauthorized: No session found" };
    }

    const accountIdNum = await getCurrentUserAccountId();
    const accountId = BigInt(accountIdNum);
    const userId = session.user.id;

    // Verify subscription belongs to current user
    console.log("[PushSubscription] 🔍 Verifying subscription ownership...");
    const subscription = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.subscriptionId, subscriptionId))
      .limit(1);

    if (subscription.length === 0) {
      console.log("[PushSubscription] ❌ Subscription not found");
      return { success: false, error: "Subscription not found" };
    }

    if (
      subscription[0]!.userId !== userId ||
      subscription[0]!.accountId !== accountId
    ) {
      console.log("[PushSubscription] ❌ Unauthorized: Subscription belongs to another user");
      return { success: false, error: "Unauthorized: Subscription belongs to another user" };
    }

    // Soft delete by setting isActive to false
    console.log("[PushSubscription] 🔄 Soft deleting subscription...");
    await db
      .update(pushSubscriptions)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(pushSubscriptions.subscriptionId, subscriptionId));

    console.log("[PushSubscription] ✅ Subscription deleted successfully");
    return { success: true };
  } catch (error) {
    console.error("[PushSubscription] ❌ Error deleting push subscription:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete a push subscription by endpoint
 * Used when a subscription expires (410 error from push service)
 * No authentication required as this is called internally by the push service
 */
export async function deletePushSubscriptionByEndpoint(
  endpoint: string,
): Promise<void> {
  await db
    .update(pushSubscriptions)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(pushSubscriptions.endpoint, endpoint));
}

/**
 * Check if a specific endpoint is subscribed for the current user
 * Used to verify if the current browser/device is subscribed
 */
export async function checkEndpointSubscription(
  endpoint: string,
): Promise<{
  success: boolean;
  isSubscribed: boolean;
  subscriptionId?: bigint;
  error?: string;
}> {
  try {
    console.log("[PushSubscription] 🔍 Checking endpoint subscription:", {
      endpoint: endpoint.substring(0, 50) + "...",
    });
    
    const session = await getSecureSession();
    if (!session?.user) {
      console.log("[PushSubscription] ❌ Unauthorized: No session found");
      return {
        success: false,
        isSubscribed: false,
        error: "Unauthorized: No session found",
      };
    }

    const accountIdNum = await getCurrentUserAccountId();
    const accountId = BigInt(accountIdNum);
    const userId = session.user.id;

    console.log("[PushSubscription] 🔍 Querying database:", {
      userId,
      accountId: accountId.toString(),
    });

    const existing = await db
      .select({
        subscriptionId: pushSubscriptions.subscriptionId,
      })
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.endpoint, endpoint),
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.accountId, accountId),
          eq(pushSubscriptions.isActive, true),
        ),
      )
      .limit(1);

    const result = {
      success: true,
      isSubscribed: existing.length > 0,
      subscriptionId: existing[0]?.subscriptionId,
    };

    console.log("[PushSubscription] 📊 Endpoint check result:", {
      isSubscribed: result.isSubscribed,
      subscriptionId: result.subscriptionId?.toString(),
    });

    return result;
  } catch (error) {
    console.error("[PushSubscription] ❌ Error checking endpoint subscription:", error);
    return {
      success: false,
      isSubscribed: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get push subscription status for the current user
 * Returns whether the user has any active subscriptions
 */
export async function getPushSubscriptionStatus(): Promise<{
  success: boolean;
  isSubscribed: boolean;
  subscriptionCount: number;
  error?: string;
}> {
  try {
    const session = await getSecureSession();
    if (!session?.user) {
      return {
        success: false,
        isSubscribed: false,
        subscriptionCount: 0,
        error: "Unauthorized: No session found",
      };
    }

    const accountIdNum = await getCurrentUserAccountId();
    const accountId = BigInt(accountIdNum);
    const userId = session.user.id;

    const subscriptions = await getPushSubscriptionsByUser(userId, accountId);

    return {
      success: true,
      isSubscribed: subscriptions.length > 0,
      subscriptionCount: subscriptions.length,
    };
  } catch (error) {
    console.error("Error getting push subscription status:", error);
    return {
      success: false,
      isSubscribed: false,
      subscriptionCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

