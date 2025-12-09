"use server";

import { getCurrentUserAccountId } from "~/lib/dal";
import {
  createPushSubscription,
  deletePushSubscription,
  getPushSubscriptionStatus,
  checkEndpointSubscription,
} from "~/server/queries/push-subscription";
import type { PushSubscriptionData } from "~/server/queries/push-subscription";

/**
 * Server action to subscribe to push notifications
 */
export async function subscribePushAction(
  subscription: PushSubscriptionData,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log("[PushSubscription] 📥 subscribePushAction called");
    await getCurrentUserAccountId(); // Security check

    const result = await createPushSubscription(subscription);

    if (!result.success) {
      console.log("[PushSubscription] ❌ subscribePushAction failed:", result.error);
      return {
        success: false,
        error: result.error ?? "No se pudo suscribir a las notificaciones push",
      };
    }

    console.log("[PushSubscription] ✅ subscribePushAction succeeded");
    return {
      success: true,
    };
  } catch (error) {
    console.error("[PushSubscription] ❌ Error in subscribePushAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al suscribirse a las notificaciones push",
    };
  }
}

/**
 * Server action to unsubscribe from push notifications
 */
export async function unsubscribePushAction(
  subscriptionId: bigint,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log("[PushSubscription] 🗑️ unsubscribePushAction called:", {
      subscriptionId: subscriptionId.toString(),
    });
    await getCurrentUserAccountId(); // Security check

    const result = await deletePushSubscription(subscriptionId);

    if (!result.success) {
      console.log("[PushSubscription] ❌ unsubscribePushAction failed:", result.error);
      return {
        success: false,
        error: result.error ?? "No se pudo cancelar la suscripción push",
      };
    }

    console.log("[PushSubscription] ✅ unsubscribePushAction succeeded");
    return {
      success: true,
    };
  } catch (error) {
    console.error("[PushSubscription] ❌ Error in unsubscribePushAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al cancelar la suscripción push",
    };
  }
}

/**
 * Server action to check if a specific endpoint is subscribed
 * Used to verify if the current browser/device is subscribed
 */
export async function checkEndpointSubscriptionAction(
  endpoint: string,
): Promise<{
  success: boolean;
  isSubscribed?: boolean;
  subscriptionId?: bigint;
  error?: string;
}> {
  try {
    console.log("[PushSubscription] 🔍 checkEndpointSubscriptionAction called:", {
      endpoint: endpoint.substring(0, 50) + "...",
    });
    await getCurrentUserAccountId(); // Security check

    const result = await checkEndpointSubscription(endpoint);

    if (!result.success) {
      console.log("[PushSubscription] ❌ checkEndpointSubscriptionAction failed:", result.error);
      return {
        success: false,
        error: result.error ?? "No se pudo verificar la suscripción",
      };
    }

    console.log("[PushSubscription] ✅ checkEndpointSubscriptionAction result:", {
      isSubscribed: result.isSubscribed,
      subscriptionId: result.subscriptionId?.toString(),
    });

    return {
      success: true,
      isSubscribed: result.isSubscribed,
      subscriptionId: result.subscriptionId,
    };
  } catch (error) {
    console.error("[PushSubscription] ❌ Error in checkEndpointSubscriptionAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al verificar la suscripción",
    };
  }
}

/**
 * Server action to get push subscription status
 */
export async function getPushSubscriptionStatusAction(): Promise<{
  success: boolean;
  isSubscribed?: boolean;
  subscriptionCount?: number;
  error?: string;
}> {
  try {
    await getCurrentUserAccountId(); // Security check

    const result = await getPushSubscriptionStatus();

    if (!result.success) {
      return {
        success: false,
        error: result.error ?? "No se pudo obtener el estado de la suscripción",
      };
    }

    return {
      success: true,
      isSubscribed: result.isSubscribed,
      subscriptionCount: result.subscriptionCount,
    };
  } catch (error) {
    console.error("Error getting push subscription status:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al obtener el estado de la suscripción",
    };
  }
}

