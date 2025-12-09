/**
 * Push Notification Service
 *
 * Handles sending push notifications to users' devices using the Web Push Protocol.
 * Integrates with the web-push library and VAPID keys for authentication.
 */

import webpush from "web-push";
import { env } from "~/env";
import { getPushSubscriptionsByUser } from "~/server/queries/push-subscription";
import { deletePushSubscriptionByEndpoint } from "~/server/queries/push-subscription";

// Initialize VAPID details
if (env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT) {
  try {
    webpush.setVapidDetails(
      env.VAPID_SUBJECT,
      env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
      env.VAPID_PRIVATE_KEY,
    );
  } catch (error) {
    console.error(
      "Error setting VAPID details. VAPID_SUBJECT must be a valid URL (https://example.com) or email (mailto:email@example.com). Current value:",
      env.VAPID_SUBJECT,
    );
    throw error;
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    url?: string;
    actionUrl?: string;
    notificationId?: string;
    [key: string]: unknown;
  };
  tag?: string;
  requireInteraction?: boolean;
  vibrate?: number[];
  actions?: Array<{ action: string; title: string }>;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Send a push notification to a single subscription
 * Handles expired subscriptions (410 errors) by removing them from the database
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushNotificationPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!env.VAPID_PRIVATE_KEY || !env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      console.warn("VAPID keys not configured, skipping push notification");
      return { success: false, error: "VAPID keys not configured" };
    }

    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
    );

    return { success: true };
  } catch (error) {
    const err = error instanceof Error
      ? error as Error & { statusCode?: number }
      : { message: "Unknown error", statusCode: undefined };

    // Handle expired/invalid subscriptions (410 Gone)
    if ((error as { statusCode?: number }).statusCode === 410) {
      console.log("Subscription expired, removing from database:", subscription.endpoint);
      try {
        await deletePushSubscriptionByEndpoint(subscription.endpoint);
      } catch (deleteError) {
        console.error("Error deleting expired subscription:", deleteError);
      }
      return { success: false, error: "Subscription expired" };
    }

    // Handle other errors
    console.error("Error sending push notification:", err);
    return {
      success: false,
      error: err.message ?? "Unknown error sending push notification",
    };
  }
}

/**
 * Send a push notification to all devices subscribed by a user
 * Returns the number of successful sends and any errors encountered
 */
export async function sendPushToUser(
  userId: string,
  accountId: bigint,
  payload: PushNotificationPayload,
): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}> {
  try {
    // Get all active subscriptions for this user
    const subscriptions = await getPushSubscriptionsByUser(userId, accountId);

    if (subscriptions.length === 0) {
      return { success: true, sent: 0, failed: 0, errors: [] };
    }

    // Send to all subscriptions in parallel
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload,
        ),
      ),
    );

    // Count successes and failures
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value.success) {
        sent++;
      } else {
        failed++;
        const errorMsg =
          result.status === "rejected"
            ? (result.reason as Error)?.message ?? "Unknown error"
            : result.value.error ?? "Unknown error";
        errors.push(
          `Subscription ${index + 1} (${subscriptions[index]?.endpoint?.substring(0, 50)}...): ${errorMsg}`,
        );
      }
    });

    return {
      success: sent > 0,
      sent,
      failed,
      errors,
    };
  } catch (error) {
    console.error("Error sending push to user:", error);
    return {
      success: false,
      sent: 0,
      failed: 0,
      errors: [
        error instanceof Error ? error.message : "Unknown error fetching subscriptions",
      ],
    };
  }
}

