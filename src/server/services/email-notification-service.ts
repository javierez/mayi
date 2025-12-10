/**
 * Email Notification Service
 *
 * Handles sending email notifications for high-priority notifications.
 * This service is called asynchronously after notification creation.
 */

import { sendEmail } from "~/lib/email";
import { getUserById } from "~/server/queries/users";
import { updateNotificationDeliveryStatus } from "~/server/queries/notification";
import type { Notification } from "~/types/notifications";
import { generateTaskNotificationEmail } from "~/templates/emails/task-notification";
import { generateAppointmentNotificationEmail } from "~/templates/emails/appointment-notification";
import { generateNotificationEmailBase } from "~/templates/emails/notification-base";

/**
 * Determine if an email notification should be sent
 */
async function shouldSendEmailNotification(
  notification: Notification,
  userEmail: string | null,
): Promise<boolean> {
  // 1. User must have email
  if (!userEmail) {
    return false;
  }

  // 2. Don't send if email already sent
  if (notification.isDelivered && notification.deliveryChannel === "email") {
    return false;
  }

  // 3. Check notification priority - send for high/urgent
  const isHighPriority =
    notification.priority === "high" || notification.priority === "urgent";

  // 4. Check notification type - always send for these types
  const alwaysSendTypes = ["task_overdue", "appointment_reminder"];
  const shouldSendByType = alwaysSendTypes.includes(notification.type);

  return isHighPriority || shouldSendByType;
}

/**
 * Generate email content based on notification type
 */
function generateNotificationEmail(
  notification: Notification,
): { subject: string; html: string; text: string } {
  // Route to appropriate template generator based on category
  if (notification.category === "tasks") {
    return generateTaskNotificationEmail(notification);
  }

  if (notification.category === "appointments") {
    return generateAppointmentNotificationEmail(notification);
  }

  // Fallback to base template for other categories
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
  const actionUrl = notification.actionUrl
    ? `${baseUrl}${notification.actionUrl}`
    : null;

  const { html, text } = generateNotificationEmailBase(
    notification.title,
    notification.message,
    actionUrl,
    "Ver detalles",
  );

  return {
    subject: notification.title,
    html,
    text,
  };
}

/**
 * Send email notification
 */
async function sendNotificationEmail(
  notification: Notification,
  userEmail: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate email content
    const { subject, html, text } = generateNotificationEmail(notification);

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
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if notification has a user ID
    if (!notification.userId) {
      return { success: false, error: "Notification has no user ID" };
    }

    // Get user email
    const user = await getUserById(notification.userId);
    const userEmail = user?.email ?? null;

    // Check if email should be sent
    const shouldSend = await shouldSendEmailNotification(
      notification,
      userEmail,
    );

    if (!shouldSend) {
      return { success: false, error: "Email not needed for this notification" };
    }

    // Send email (userEmail is guaranteed non-null by shouldSendEmailNotification check)
    return await sendNotificationEmail(notification, userEmail!);
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

