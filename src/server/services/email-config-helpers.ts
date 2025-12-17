/**
 * Email Configuration Helpers
 *
 * Helper functions for checking MailSettings configuration
 * and determining if emails should be sent for various notification types.
 */

import { getNotificationSettings } from "~/server/queries/notification-settings";
import type { MailSettings } from "~/components/admin/account/mail-configuration/types";
import type { Notification } from "~/types/notifications";

/**
 * Get email settings for an account (with caching consideration)
 */
export async function getEmailSettingsForAccount(
  accountId: bigint,
): Promise<MailSettings> {
  return await getNotificationSettings(accountId);
}

/**
 * Account email sender configuration for customer-facing emails
 */
export interface AccountEmailSenderConfig {
  displayName: string;
  replyToEmail: string | null;
}

/**
 * Get email sender configuration for an account
 * Uses account.name for display name and account.email for reply-to
 */
export async function getAccountEmailSenderConfig(
  accountId: bigint,
): Promise<AccountEmailSenderConfig> {
  const { getAccountById } = await import("~/server/queries/accounts");
  const account = await getAccountById(accountId);

  return {
    displayName: account?.name ?? "Vesta CRM",
    replyToEmail: account?.email ?? null,
  };
}

/**
 * Account branding configuration for customer-facing emails
 */
export interface AccountBrandingConfig {
  displayName: string;
  replyToEmail: string | null;
  logoUrl: string | null;
}

/**
 * Get branding configuration for an account (for customer-facing emails)
 * Includes logo from website_config table
 */
export async function getAccountBrandingConfig(
  accountId: bigint,
): Promise<AccountBrandingConfig> {
  const { db } = await import("~/server/db");
  const { accounts, websiteProperties } = await import("~/server/db/schema");
  const { eq } = await import("drizzle-orm");

  // Get account name and email
  const accountResult = await db
    .select({
      name: accounts.name,
      email: accounts.email,
    })
    .from(accounts)
    .where(eq(accounts.accountId, accountId))
    .limit(1);

  // Get logo from websiteProperties
  const logoResult = await db
    .select({ logo: websiteProperties.logo })
    .from(websiteProperties)
    .where(eq(websiteProperties.accountId, accountId))
    .limit(1);

  const account = accountResult[0];
  const websiteConfig = logoResult[0];

  return {
    displayName: account?.name ?? "Vesta CRM",
    replyToEmail: account?.email ?? null,
    logoUrl: websiteConfig?.logo ?? null,
  };
}

/**
 * Check if current time is within quiet hours
 */
export function isQuietHours(settings: MailSettings, now: Date = new Date()): boolean {
  const quietHours = settings.quietHours;
  
  if (!quietHours.enabled) {
    return false;
  }

  // Get current day name
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const currentDay = dayNames[now.getDay()];
  
  // Check if quiet hours apply to current day
  if (!quietHours.days[currentDay as keyof typeof quietHours.days]) {
    return false;
  }

  // Parse start and end times
  const startParts = quietHours.startTime.split(":").map(Number);
  const endParts = quietHours.endTime.split(":").map(Number);
  const startHour = startParts[0] ?? 0;
  const startMin = startParts[1] ?? 0;
  const endHour = endParts[0] ?? 0;
  const endMin = endParts[1] ?? 0;

  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMin;
  const startTimeMinutes = startHour * 60 + startMin;
  const endTimeMinutes = endHour * 60 + endMin;

  // Handle quiet hours that span midnight (e.g., 22:00 to 08:00)
  if (startTimeMinutes > endTimeMinutes) {
    // Quiet hours span midnight
    return currentTimeMinutes >= startTimeMinutes || currentTimeMinutes < endTimeMinutes;
  } else {
    // Quiet hours within same day
    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes;
  }
}

/**
 * Check if email should be sent for a notification based on settings
 */
export function shouldSendEmailForNotification(
  notification: Notification,
  settings: MailSettings,
): boolean {
  // Check if notification type is enabled in settings
  const notificationType = notification.type;
  
  // Task notifications
  if (notification.category === "tasks") {
    // Task events
    if (notificationType === "task_assigned") {
      // Check if email is enabled
      if (!settings.tasks.events.taskAssigned.emailEnabled) {
        return false;
      }
      
      // Check if urgency level filtering is configured
      const urgencyLevels = settings.tasks.events.taskAssigned.urgencyLevels;
      
      // If urgencyLevels is explicitly set (array exists), use it for filtering
      if (urgencyLevels !== undefined) {
        // If empty array, user explicitly deselected all - don't send
        if (urgencyLevels.length === 0) {
          return false;
        }
        
        // Get task urgency from metadata
        const metadata = notification.metadata as { urgency?: number };
        const taskUrgency = metadata.urgency;
        
        // If task has no urgency, don't send
        if (taskUrgency === undefined || taskUrgency === null) {
          return false;
        }
        
        // Only send if task urgency is in the configured urgency levels
        return urgencyLevels.includes(taskUrgency);
      }
      
      // If urgencyLevels is undefined (not configured), send for all (backward compatibility)
      return true;
    }
    if (notificationType === "task_completed") {
      // Check if email is enabled
      if (!settings.tasks.events.taskCompleted.emailEnabled) {
        return false;
      }
      
      // Check if urgency level filtering is configured
      const urgencyLevels = settings.tasks.events.taskCompleted.urgencyLevels;
      
      // If urgencyLevels is explicitly set (array exists), use it for filtering
      if (urgencyLevels !== undefined) {
        // If empty array, user explicitly deselected all - don't send
        if (urgencyLevels.length === 0) {
          return false;
        }
        
        // Get task urgency from metadata
        const metadata = notification.metadata as { urgency?: number };
        const taskUrgency = metadata.urgency;
        
        // If task has no urgency, don't send
        if (taskUrgency === undefined || taskUrgency === null) {
          return false;
        }
        
        // Only send if task urgency is in the configured urgency levels
        return urgencyLevels.includes(taskUrgency);
      }
      
      // If urgencyLevels is undefined (not configured), send for all (backward compatibility)
      return true;
    }
    if (notificationType === "task_reassigned") {
      // Check if email is enabled
      if (!settings.tasks.events.taskReassigned.emailEnabled) {
        return false;
      }
      
      // Check if urgency level filtering is configured
      const urgencyLevels = settings.tasks.events.taskReassigned.urgencyLevels;
      
      // If urgencyLevels is explicitly set (array exists), use it for filtering
      if (urgencyLevels !== undefined) {
        // If empty array, user explicitly deselected all - don't send
        if (urgencyLevels.length === 0) {
          return false;
        }
        
        // Get task urgency from metadata
        const metadata = notification.metadata as { urgency?: number };
        const taskUrgency = metadata.urgency;
        
        // If task has no urgency, don't send
        if (taskUrgency === undefined || taskUrgency === null) {
          return false;
        }
        
        // Only send if task urgency is in the configured urgency levels
        return urgencyLevels.includes(taskUrgency);
      }
      
      // If urgencyLevels is undefined (not configured), send for all (backward compatibility)
      return true;
    }
    
    // Task overdue
    if (notificationType === "task_overdue") {
      // Check if immediate notification is enabled
      if (!settings.tasks.overdue.notifyWhenOverdue.emailEnabled) {
        return false;
      }
      
      // Check if task urgency matches configured urgency levels
      const metadata = notification.metadata as { urgency?: number };
      const taskUrgency = metadata.urgency;
      const urgencyLevels = settings.tasks.overdue.notifyWhenOverdue.urgencyLevels;
      
      return shouldIncludeTaskByUrgency(taskUrgency, urgencyLevels);
    }
    
    // Task reminders (due soon)
    if (notificationType === "task_due_soon") {
      const metadata = notification.metadata as { timeframe?: string; urgency?: number };
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
        return categorySettings.dueIn1Week.emailEnabled;
      }
      if (timeframe === "48h" || timeframe === "48 hours") {
        return categorySettings.dueIn48h.emailEnabled;
      }
      if (timeframe === "24h" || timeframe === "1_day" || timeframe === "1 day") {
        return categorySettings.dueIn24h.emailEnabled;
      }
      if (timeframe === "12h" || timeframe === "12 hours") {
        return categorySettings.dueIn12h.emailEnabled;
      }
      if (timeframe === "2h" || timeframe === "2 hours") {
        return categorySettings.dueIn2h.emailEnabled;
      }
      if (timeframe === "1h" || timeframe === "1 hour") {
        return categorySettings.dueIn1h.emailEnabled;
      }
      
      return false;
    }
  }
  
  // Appointment notifications
  if (notification.category === "appointments") {
    // Appointment events
    if (notificationType === "appointment_scheduled") {
      return settings.appointments.events.appointmentScheduled.emailEnabled;
    }
    if (notificationType === "appointment_rescheduled") {
      return settings.appointments.events.appointmentRescheduled.emailEnabled;
    }
    if (notificationType === "appointment_cancelled") {
      return settings.appointments.events.appointmentCancelled.emailEnabled;
    }
    
    // Appointment reminders
    if (notificationType === "appointment_reminder") {
      const metadata = notification.metadata as { 
        reminderType?: string; 
        appointmentType?: string;
      };
      const reminderType = metadata.reminderType;
      const appointmentType = metadata.appointmentType ?? "visita";
      
      // Get appointment type settings
      const appointmentSettings = settings.appointments[appointmentType as keyof typeof settings.appointments];
      if (!appointmentSettings || !("notify24h" in appointmentSettings)) {
        return false;
      }
      
      // Map reminder type to setting
      if (reminderType === "24h" || reminderType === "1_day" || reminderType === "1 day") {
        return appointmentSettings.notify24h.emailEnabled;
      }
      if (reminderType === "12h" || reminderType === "12 hours") {
        return appointmentSettings.notify12h.emailEnabled;
      }
      if (reminderType === "1h" || reminderType === "1 hour") {
        return appointmentSettings.notify1h.emailEnabled;
      }
      if (reminderType === "30min" || reminderType === "30_min" || reminderType === "30 minutes") {
        return appointmentSettings.notify30min.emailEnabled;
      }
      if (reminderType === "travel_time" || reminderType === "travel") {
        return appointmentSettings.notifyTravelTime.emailEnabled;
      }
      
      return false;
    }
  }
  
  // Customer notifications (properties, documents, deals, appointments)
  const notificationCategory = notification.category;
  if (notificationCategory === "properties" || notificationCategory === "contacts" || notificationCategory === "deals") {
    const metadata = notification.metadata;
    const notificationType = metadata.notificationType as string | undefined;
    
    if (!notificationType) {
      return false;
    }
    
    if (notificationCategory === "properties") {
      const propSettings = settings.customers.properties;
      switch (notificationType) {
        case "new_listing":
          return propSettings.newListing.emailEnabled;
        case "price_change":
          return propSettings.priceChange.emailEnabled;
        case "status_change":
          return propSettings.statusChange.emailEnabled;
        case "new_photos":
          return propSettings.newPhotos.emailEnabled;
        default:
          return false;
      }
    }
    
    if (notificationCategory === "contacts" && notificationType.includes("document")) {
      const docSettings = settings.customers.documents;
      switch (notificationType) {
        case "document_ready":
          return docSettings.documentReady.emailEnabled;
        case "signature_required":
          return docSettings.signatureRequired.emailEnabled;
        case "document_expiring":
          return docSettings.documentExpiring.emailEnabled;
        default:
          return false;
      }
    }
    
    if (notificationCategory === "deals") {
      const dealSettings = settings.customers.deals;
      switch (notificationType) {
        case "offer_received":
          return dealSettings.offerReceived.emailEnabled;
        case "offer_accepted":
          return dealSettings.offerAccepted.emailEnabled;
        case "deal_closed":
          return dealSettings.dealClosed.emailEnabled;
        case "payment_received":
          return dealSettings.paymentReceived.emailEnabled;
        default:
          return false;
      }
    }
  }
  
  // Customer appointment reminders
  if (notificationCategory === "appointments") {
    const metadata = notification.metadata;
    if (metadata.isCustomerNotification) {
      const reminderTimeframe = metadata.reminderTimeframe as string | undefined;
      const appointmentType = metadata.appointmentType as string | undefined;
      
      if (!reminderTimeframe || !appointmentType) {
        return false;
      }
      
      const aptSettings = settings.customers.appointments[appointmentType as keyof typeof settings.customers.appointments];
      if (!aptSettings) {
        return false;
      }
      
      switch (reminderTimeframe) {
        case "24h":
          return aptSettings.notify24h.emailEnabled;
        case "12h":
          return aptSettings.notify12h.emailEnabled;
        case "1h":
          return aptSettings.notify1h.emailEnabled;
        case "30min":
          return aptSettings.notify30min.emailEnabled;
        case "travel_time":
          return aptSettings.notifyTravelTime.emailEnabled;
        default:
          return false;
      }
    }
  }
  
  // Default: don't send if not explicitly configured
  return false;
}

/**
 * Calculate reminder timeframe based on due date, due time, and current time
 * Combines dueDate and dueTime to get the actual deadline datetime
 */
export function getReminderTimeframe(
  dueDate: Date,
  now: Date = new Date(),
  dueTime?: string | null,
): "1_week" | "48h" | "24h" | "12h" | "2h" | "1h" | null {
  // Combine dueDate and dueTime to get the actual deadline datetime
  let actualDueDateTime: Date;
  
  if (dueTime) {
    // Parse dueTime (format: "HH:MM" or "HH:MM:SS")
    const timeParts = dueTime.split(":").map(Number);
    const hours = timeParts[0] ?? 23;
    const minutes = timeParts[1] ?? 59;
    
    // Create datetime in local timezone using the date from dueDate and time from dueTime
    actualDueDateTime = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate(),
      hours,
      minutes,
      0,
      0
    );
  } else {
    // No dueTime provided, use end of day (23:59:59.999)
    actualDueDateTime = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate(),
      23,
      59,
      59,
      999
    );
  }

  const diffMs = actualDueDateTime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;
  
  if (diffDays >= 7) {
    return "1_week";
  }
  if (diffHours >= 48) {
    return "48h";
  }
  if (diffHours >= 24) {
    return "24h";
  }
  if (diffHours >= 12) {
    return "12h";
  }
  if (diffHours >= 2) {
    return "2h";
  }
  if (diffHours >= 1) {
    return "1h";
  }
  
  return null;
}

/**
 * Check if briefing is enabled for a specific type and category
 */
export function isBriefingEnabled(
  settings: MailSettings,
  briefingType: "weekly" | "daily",
  category: "tasks" | "appointments",
  urgencyLevel?: "critical" | "urgent" | "other",
  appointmentType?: string,
): boolean {
  if (category === "tasks") {
    if (!urgencyLevel) {
      // Check if any urgency level has briefing enabled
      return (
        settings.tasks.critical[`${briefingType}Briefing` as keyof typeof settings.tasks.critical].emailEnabled ||
        settings.tasks.urgent[`${briefingType}Briefing` as keyof typeof settings.tasks.urgent].emailEnabled ||
        settings.tasks.other[`${briefingType}Briefing` as keyof typeof settings.tasks.other].emailEnabled
      );
    }
    
    const categorySettings = settings.tasks[urgencyLevel];
    return categorySettings[`${briefingType}Briefing` as keyof typeof categorySettings].emailEnabled;
  }
  
  if (category === "appointments") {
    const aptType = appointmentType ?? "visita";
    const appointmentSettings = settings.appointments[aptType as keyof typeof settings.appointments];
    
    if (!appointmentSettings || !("weeklyBriefing" in appointmentSettings)) {
      return false;
    }
    
    return appointmentSettings[`${briefingType}Briefing` as keyof typeof appointmentSettings].emailEnabled;
  }
  
  return false;
}

/**
 * Check if notification should bypass quiet hours (critical/urgent)
 */
export function shouldBypassQuietHours(notification: Notification): boolean {
  // Critical tasks always bypass quiet hours
  if (notification.type === "task_overdue") {
    const metadata = notification.metadata as { urgency?: number };
    return metadata.urgency === 5;
  }
  
  // High priority notifications bypass quiet hours
  if (notification.priority === "urgent" || notification.priority === "high") {
    return true;
  }
  
  return false;
}

/**
 * Check if overdue digest is enabled and get configured urgency levels
 * @returns urgencyLevels array if enabled, null if disabled
 */
export function isOverdueDigestEnabled(
  settings: MailSettings,
  digestType: "weekly" | "daily",
): number[] | null {
  const digestSetting = digestType === "weekly"
    ? settings.tasks.overdue.weeklyDigest
    : settings.tasks.overdue.dailyDigest;
  
  if (!digestSetting.emailEnabled) {
    return null;
  }
  
  // Return urgencyLevels if configured, otherwise return null (will be handled as backward compatibility)
  return digestSetting.urgencyLevels ?? null;
}

/**
 * Check if a task should be included based on urgency level filtering
 * @param taskUrgency - The urgency level of the task (1-5, or undefined)
 * @param urgencyLevels - Array of urgency levels to include (undefined = include all for backward compatibility)
 * @returns true if task should be included, false otherwise
 */
export function shouldIncludeTaskByUrgency(
  taskUrgency: number | undefined | null,
  urgencyLevels: number[] | undefined | null,
): boolean {
  // If urgencyLevels is undefined or null, include all tasks (backward compatibility)
  if (urgencyLevels === undefined || urgencyLevels === null) {
    return true;
  }
  
  // If urgencyLevels is empty array, user explicitly deselected all - exclude all
  if (urgencyLevels.length === 0) {
    return false;
  }
  
  // If task has no urgency, exclude it (can't match any urgency level)
  if (taskUrgency === undefined || taskUrgency === null) {
    return false;
  }
  
  // Only include if task urgency is in the configured urgency levels
  return urgencyLevels.includes(taskUrgency);
}

