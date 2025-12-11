/**
 * Email Notification Service
 *
 * Handles sending email notifications based on MailSettings configuration.
 * This service is called asynchronously after notification creation.
 */

import { sendEmail } from "~/lib/email";
import { getUserById } from "~/server/queries/users";
import { updateNotificationDeliveryStatus } from "~/server/queries/notification";
import type { Notification } from "~/types/notifications";
import {
  getEmailSettingsForAccount,
  shouldSendEmailForNotification,
  isQuietHours,
  shouldBypassQuietHours,
} from "./email-config-helpers";
import { routeToTemplate } from "./email-template-router";

/**
 * Determine if an email notification should be sent
 */
async function shouldSendEmailNotification(
  notification: Notification,
  userEmail: string | null,
  accountId: bigint,
  settings: Awaited<ReturnType<typeof getEmailSettingsForAccount>>,
): Promise<boolean> {
  // 1. User must have email
  if (!userEmail) {
    return false;
  }

  // 2. Don't send if email already sent
  if (notification.isDelivered && notification.deliveryChannel === "email") {
    return false;
  }

  // 3. Check if email is enabled for this notification type in settings
  const isEnabledInSettings = shouldSendEmailForNotification(notification, settings);
  if (!isEnabledInSettings) {
    return false;
  }

  // 4. Check quiet hours (unless notification should bypass)
  if (!shouldBypassQuietHours(notification)) {
    if (isQuietHours(settings)) {
      return false;
    }
  }

  return true;
}

/**
 * Generate email content based on notification type
 */
function generateNotificationEmail(
  notification: Notification,
  settings: Awaited<ReturnType<typeof getEmailSettingsForAccount>>,
): { subject: string; html: string; text: string } {
  return routeToTemplate(notification, settings);
}

/**
 * Send email notification
 */
async function sendNotificationEmail(
  notification: Notification,
  userEmail: string,
  accountId: bigint,
  settings: Awaited<ReturnType<typeof getEmailSettingsForAccount>>,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate email content
    const { subject, html, text } = generateNotificationEmail(notification, settings);

    // Send email
    await sendEmail({
      to: userEmail,
      subject,
      html,
      text,
    });

    // Update notification delivery status
    await updateNotificationDeliveryStatus(
      notification.notificationId,
      "email",
      true,
      null, // no error
    );

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Update notification with error
    await updateNotificationDeliveryStatus(
      notification.notificationId,
      "email",
      false,
      errorMessage,
    ).catch((updateError) => {
      // Log but don't throw - we've already failed
      console.error("Failed to update notification delivery status:", updateError);
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Main entry point: Send email notification if needed
 * This function is called asynchronously after notification creation
 */
export async function sendNotificationEmailIfNeeded(
  notification: Notification,
  accountId: bigint,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if notification has a user ID
    if (!notification.userId) {
      return { success: false, error: "Notification has no user ID" };
    }

    // Get user email
    const user = await getUserById(notification.userId);
    const userEmail = user?.email ?? null;

    // Get email settings for account
    const settings = await getEmailSettingsForAccount(accountId);

    // Check if email should be sent
    const shouldSend = await shouldSendEmailNotification(
      notification,
      userEmail,
      accountId,
      settings,
    );

    if (!shouldSend) {
      return { success: false, error: "Email not needed for this notification" };
    }

    // Send email (userEmail is guaranteed non-null by shouldSendEmailNotification check)
    return await sendNotificationEmail(notification, userEmail!, accountId, settings);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error in sendNotificationEmailIfNeeded:", error);

    // Try to update notification with error
    try {
      await updateNotificationDeliveryStatus(
        notification.notificationId,
        "email",
        false,
        errorMessage,
      );
    } catch (updateError) {
      console.error("Failed to update notification delivery status:", updateError);
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

