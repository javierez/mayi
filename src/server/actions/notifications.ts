"use server";

import { getCurrentUserAccountId } from "~/lib/dal";
import {
  getNotificationsWithAuth,
  getUnreadCountWithAuth,
  markAsReadWithAuth,
  markAllAsReadWithAuth,
  dismissNotificationWithAuth,
} from "~/server/queries/notification";
import type {
  NotificationWithUser,
} from "~/types/notifications";

/**
 * Server action to get paginated notifications for the current user
 */
export async function getNotificationsAction(
  limit = 20,
  offset = 0,
): Promise<{
  success: boolean;
  data?: NotificationWithUser[];
  error?: string;
}> {
  try {
    await getCurrentUserAccountId(); // Security check

    const notifications = await getNotificationsWithAuth(limit, offset);

    return {
      success: true,
      data: notifications,
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al obtener las notificaciones",
    };
  }
}

/**
 * Server action to get unread notification count
 */
export async function getUnreadCountAction(): Promise<{
  success: boolean;
  data?: number;
  error?: string;
}> {
  try {
    await getCurrentUserAccountId(); // Security check

    const count = await getUnreadCountWithAuth();

    return {
      success: true,
      data: count,
    };
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al obtener el conteo de notificaciones",
      data: 0,
    };
  }
}

/**
 * Server action to mark a notification as read
 */
export async function markAsReadAction(
  notificationId: bigint,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await getCurrentUserAccountId(); // Security check

    const result = await markAsReadWithAuth(notificationId);

    if (!result) {
      return {
        success: false,
        error: "No se pudo marcar la notificación como leída",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al marcar la notificación como leída",
    };
  }
}

/**
 * Server action to mark all notifications as read
 */
export async function markAllAsReadAction(): Promise<{
  success: boolean;
  data?: number;
  error?: string;
}> {
  try {
    await getCurrentUserAccountId(); // Security check

    const count = await markAllAsReadWithAuth();

    return {
      success: true,
      data: count,
    };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al marcar todas las notificaciones como leídas",
    };
  }
}

/**
 * Server action to dismiss a notification
 */
export async function dismissNotificationAction(
  notificationId: bigint,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await getCurrentUserAccountId(); // Security check

    const result = await dismissNotificationWithAuth(notificationId);

    if (!result) {
      return {
        success: false,
        error: "No se pudo descartar la notificación",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error dismissing notification:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al descartar la notificación",
    };
  }
}

