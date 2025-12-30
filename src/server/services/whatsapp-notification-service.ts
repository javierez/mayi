/**
 * WhatsApp Notification Service
 *
 * Handles sending WhatsApp notifications based on MailSettings configuration.
 * This service is called asynchronously after notification creation.
 *
 * Uses the smsEnabled field from NotificationOption for WhatsApp settings.
 * Uses "sms" as the delivery channel in the database.
 */

import { getUserById } from "~/server/queries/users";
import { updateNotificationDeliveryStatus } from "~/server/queries/notification";
import type { Notification } from "~/types/notifications";
import {
  getEmailSettingsForAccount,
  isQuietHours,
  shouldBypassQuietHours,
} from "./email-config-helpers";
import { shouldSendWhatsAppForNotification } from "./whatsapp-config-helpers";
import { routeToWhatsAppTemplate } from "./whatsapp-template-router";
import { sendWhatsAppTemplate, isWhatsAppConfigured } from "./whatsapp-service";

/**
 * Determine if a WhatsApp notification should be sent
 */
async function shouldSendWhatsAppNotification(
  notification: Notification,
  userPhone: string | null,
  settings: Awaited<ReturnType<typeof getEmailSettingsForAccount>>,
): Promise<{ shouldSend: boolean; reason?: string }> {
  // 0. Check if WhatsApp is configured
  if (!isWhatsAppConfigured()) {
    return { shouldSend: false, reason: "WhatsApp not configured (missing TWILIO_WHATSAPP_NUMBER)" };
  }

  // 1. User must have phone number
  if (!userPhone) {
    return { shouldSend: false, reason: "User has no phone number" };
  }

  // 2. Don't send if WhatsApp already sent (uses "sms" channel)
  if (notification.isDelivered && notification.deliveryChannel === "sms") {
    return { shouldSend: false, reason: "WhatsApp already delivered" };
  }

  // 3. Check if WhatsApp (smsEnabled) is enabled for this notification type in settings
  const isEnabledInSettings = shouldSendWhatsAppForNotification(notification, settings);
  if (!isEnabledInSettings) {
    return { shouldSend: false, reason: "WhatsApp disabled in settings for this notification type" };
  }

  // 4. Check quiet hours (unless notification should bypass)
  if (!shouldBypassQuietHours(notification)) {
    if (isQuietHours(settings)) {
      return { shouldSend: false, reason: "Quiet hours active" };
    }
  }

  return { shouldSend: true };
}

/**
 * Send WhatsApp notification
 */
async function sendWhatsAppNotification(
  notification: Notification,
  userPhone: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Route to template
    const templateRoute = routeToWhatsAppTemplate(notification);
    if (!templateRoute) {
      return {
        success: false,
        error: `No WhatsApp template for notification type: ${notification.type}`,
      };
    }

    // Send WhatsApp message
    const result = await sendWhatsAppTemplate(
      userPhone,
      templateRoute.templateSid,
      templateRoute.variables,
    );

    if (result.success) {
      // Update notification delivery status (use "sms" channel for WhatsApp)
      await updateNotificationDeliveryStatus(
        notification.notificationId,
        "sms",
        true,
        null,
      );

      console.log(
        `[WhatsApp] Notification sent successfully: ${notification.notificationId} (${notification.type})`,
      );
    } else {
      // Update notification with error
      await updateNotificationDeliveryStatus(
        notification.notificationId,
        "sms",
        false,
        result.error ?? "Unknown WhatsApp error",
      ).catch((updateError) => {
        console.error("[WhatsApp] Failed to update delivery status:", updateError);
      });
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.error("[WhatsApp] Error sending notification:", error);

    // Update notification with error
    await updateNotificationDeliveryStatus(
      notification.notificationId,
      "sms",
      false,
      errorMessage,
    ).catch((updateError) => {
      console.error("[WhatsApp] Failed to update delivery status:", updateError);
    });

    return { success: false, error: errorMessage };
  }
}

/**
 * Main entry point: Send WhatsApp notification if needed
 * This function is called asynchronously after notification creation
 */
export async function sendNotificationWhatsAppIfNeeded(
  notification: Notification,
  accountId: bigint,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if notification has a user ID
    if (!notification.userId) {
      return { success: false, error: "Notification has no user ID" };
    }

    // Get user phone
    const user = await getUserById(notification.userId);
    const userPhone = user?.phone ?? null;

    // Get settings for account
    const settings = await getEmailSettingsForAccount(accountId);

    // Check if WhatsApp should be sent
    const { shouldSend, reason } = await shouldSendWhatsAppNotification(
      notification,
      userPhone,
      settings,
    );

    if (!shouldSend) {
      console.log(
        `[WhatsApp] Skipping notification ${notification.notificationId} (${notification.type}): ${reason}`,
      );
      return { success: false, error: reason };
    }

    // Send the WhatsApp notification
    console.log(
      `[WhatsApp] Sending notification ${notification.notificationId} (${notification.type}) to ${userPhone}`,
    );
    return await sendWhatsAppNotification(notification, userPhone!);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[WhatsApp] Error in sendNotificationWhatsAppIfNeeded:", error);
    return { success: false, error: errorMessage };
  }
}
