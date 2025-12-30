/**
 * WhatsApp Configuration Helpers
 *
 * Helper functions for checking MailSettings configuration
 * and determining if WhatsApp notifications should be sent.
 *
 * Uses the existing smsEnabled field from NotificationOption.
 * Reuses quiet hours logic from email-config-helpers.
 */

import type { MailSettings } from "~/components/admin/account/mail-configuration/types";
import type { Notification } from "~/types/notifications";

// Re-export shared helpers from email config
export {
  isQuietHours,
  shouldBypassQuietHours,
  getEmailSettingsForAccount,
  shouldIncludeTaskByUrgency,
} from "./email-config-helpers";

/**
 * Check if WhatsApp should be sent for a notification based on settings
 * Uses the smsEnabled field in NotificationOption
 */
export function shouldSendWhatsAppForNotification(
  notification: Notification,
  settings: MailSettings,
): boolean {
  const notificationType = notification.type;

  // Task notifications
  if (notification.category === "tasks") {
    // Task events
    if (notificationType === "task_assigned") {
      if (!settings.tasks.events.taskAssigned.smsEnabled) {
        return false;
      }

      // Check if urgency level filtering is configured
      const urgencyLevels = settings.tasks.events.taskAssigned.urgencyLevels;

      if (urgencyLevels !== undefined) {
        if (urgencyLevels.length === 0) {
          return false;
        }

        const metadata = notification.metadata as { urgency?: number };
        const taskUrgency = metadata.urgency;

        if (taskUrgency === undefined || taskUrgency === null) {
          return true;
        }

        return urgencyLevels.includes(taskUrgency);
      }

      return true;
    }

    if (notificationType === "task_completed") {
      if (!settings.tasks.events.taskCompleted.smsEnabled) {
        return false;
      }

      const urgencyLevels = settings.tasks.events.taskCompleted.urgencyLevels;

      if (urgencyLevels !== undefined) {
        if (urgencyLevels.length === 0) {
          return false;
        }

        const metadata = notification.metadata as { urgency?: number };
        const taskUrgency = metadata.urgency;

        if (taskUrgency === undefined || taskUrgency === null) {
          return true;
        }

        return urgencyLevels.includes(taskUrgency);
      }

      return true;
    }

    if (notificationType === "task_reassigned") {
      if (!settings.tasks.events.taskReassigned.smsEnabled) {
        return false;
      }

      const urgencyLevels = settings.tasks.events.taskReassigned.urgencyLevels;

      if (urgencyLevels !== undefined) {
        if (urgencyLevels.length === 0) {
          return false;
        }

        const metadata = notification.metadata as { urgency?: number };
        const taskUrgency = metadata.urgency;

        if (taskUrgency === undefined || taskUrgency === null) {
          return false;
        }

        return urgencyLevels.includes(taskUrgency);
      }

      return true;
    }

    // Task overdue
    if (notificationType === "task_overdue") {
      if (!settings.tasks.overdue.notifyWhenOverdue.smsEnabled) {
        return false;
      }

      const metadata = notification.metadata as { urgency?: number };
      const taskUrgency = metadata.urgency;
      const urgencyLevels = settings.tasks.overdue.notifyWhenOverdue.urgencyLevels;

      // If urgencyLevels not configured, send for all
      if (urgencyLevels === undefined || urgencyLevels === null) {
        return true;
      }

      if (urgencyLevels.length === 0) {
        return false;
      }

      if (taskUrgency === undefined || taskUrgency === null) {
        return false;
      }

      return urgencyLevels.includes(taskUrgency);
    }

    // Task reminders (due soon)
    if (notificationType === "task_due_soon") {
      const metadata = notification.metadata as {
        timeframe?: string;
        urgency?: number;
      };
      const timeframe = metadata.timeframe;
      const urgency = metadata.urgency ?? 1;

      // Determine urgency category
      let category: "critical" | "urgent" | "other";
      if (urgency === 5) {
        category = "critical";
      } else if (urgency === 3 || urgency === 4) {
        category = "urgent";
      } else {
        category = "other";
      }

      const categorySettings = settings.tasks[category];

      // Map timeframe to setting
      if (timeframe === "1_week" || timeframe === "1 week") {
        return categorySettings.dueIn1Week.smsEnabled;
      }
      if (timeframe === "48h" || timeframe === "48 hours") {
        return categorySettings.dueIn48h.smsEnabled;
      }
      if (timeframe === "24h" || timeframe === "1_day" || timeframe === "1 day") {
        return categorySettings.dueIn24h.smsEnabled;
      }
      if (timeframe === "12h" || timeframe === "12 hours") {
        return categorySettings.dueIn12h.smsEnabled;
      }
      if (timeframe === "2h" || timeframe === "2 hours") {
        return categorySettings.dueIn2h.smsEnabled;
      }
      if (timeframe === "1h" || timeframe === "1 hour") {
        return categorySettings.dueIn1h.smsEnabled;
      }

      return false;
    }
  }

  // Appointment notifications
  if (notification.category === "appointments") {
    // Appointment events
    if (notificationType === "appointment_scheduled") {
      return settings.appointments.events.appointmentScheduled.smsEnabled;
    }
    if (notificationType === "appointment_rescheduled") {
      return settings.appointments.events.appointmentRescheduled.smsEnabled;
    }
    if (notificationType === "appointment_cancelled") {
      return settings.appointments.events.appointmentCancelled.smsEnabled;
    }

    // Appointment reminders
    if (notificationType === "appointment_reminder") {
      const metadata = notification.metadata as {
        reminderType?: string;
        appointmentType?: string;
      };
      const reminderType = metadata.reminderType;
      const appointmentType = (metadata.appointmentType ?? "visita").toLowerCase();

      // Get appointment type settings
      const appointmentSettings =
        settings.appointments[appointmentType as keyof typeof settings.appointments];
      if (!appointmentSettings || !("notify24h" in appointmentSettings)) {
        return false;
      }

      // Map reminder type to setting
      if (reminderType === "24h" || reminderType === "1_day" || reminderType === "1 day") {
        return appointmentSettings.notify24h.smsEnabled;
      }
      if (reminderType === "12h" || reminderType === "12 hours") {
        return appointmentSettings.notify12h.smsEnabled;
      }
      if (reminderType === "1h" || reminderType === "1 hour") {
        return appointmentSettings.notify1h.smsEnabled;
      }
      if (reminderType === "30min" || reminderType === "30_min" || reminderType === "30 minutes") {
        return appointmentSettings.notify30min.smsEnabled;
      }
      if (reminderType === "travel_time" || reminderType === "travel") {
        return appointmentSettings.notifyTravelTime.smsEnabled;
      }

      return false;
    }
  }

  // Default: don't send if not explicitly configured
  // Note: Customer notifications are not supported for WhatsApp yet (internal only)
  return false;
}
