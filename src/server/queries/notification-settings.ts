"use server";

import { db } from "../db";
import { accounts } from "../db/schema";
import { eq } from "drizzle-orm";
import type { MailSettings } from "~/components/admin/account/mail-configuration/types";
import { defaultSettings } from "~/components/admin/account/mail-configuration/constants";

/**
 * Get notification settings for an account
 * Returns default settings if none are configured
 */
export async function getNotificationSettings(
  accountId: bigint,
): Promise<MailSettings> {
  try {
    const [account] = await db
      .select({ notificationSettings: accounts.notificationSettings })
      .from(accounts)
      .where(eq(accounts.accountId, accountId))
      .limit(1);

    if (!account) {
      throw new Error("Account not found");
    }

    // If notificationSettings is null, empty object, or invalid, return defaults
    const settings = account.notificationSettings as MailSettings | null | undefined;
    
    if (!settings || Object.keys(settings).length === 0) {
      return defaultSettings;
    }

    // Merge with defaults to ensure all required fields exist, including nested urgencyLevels
    return {
      ...defaultSettings,
      ...settings,
      tasks: {
        ...defaultSettings.tasks,
        ...(settings.tasks || {}),
        events: {
          ...defaultSettings.tasks.events,
          ...(settings.tasks?.events || {}),
          taskAssigned: {
            ...defaultSettings.tasks.events.taskAssigned,
            ...(settings.tasks?.events?.taskAssigned || {}),
            urgencyLevels: settings.tasks?.events?.taskAssigned?.urgencyLevels ?? defaultSettings.tasks.events.taskAssigned.urgencyLevels,
          },
          taskCompleted: {
            ...defaultSettings.tasks.events.taskCompleted,
            ...(settings.tasks?.events?.taskCompleted || {}),
          },
          taskReassigned: {
            ...defaultSettings.tasks.events.taskReassigned,
            ...(settings.tasks?.events?.taskReassigned || {}),
          },
        },
      },
      appointments: {
        ...defaultSettings.appointments,
        ...(settings.appointments || {}),
      },
      customers: {
        ...defaultSettings.customers,
        ...(settings.customers || {}),
      },
      quietHours: {
        ...defaultSettings.quietHours,
        ...(settings.quietHours || {}),
      },
    };
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    // Return defaults on error
    return defaultSettings;
  }
}

/**
 * Update notification settings for an account
 */
export async function updateNotificationSettings(
  accountId: bigint,
  settings: MailSettings,
): Promise<MailSettings> {
  try {
    const [updated] = await db
      .update(accounts)
      .set({
        notificationSettings: settings as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(eq(accounts.accountId, accountId))
      .returning({ notificationSettings: accounts.notificationSettings });

    if (!updated) {
      throw new Error("Failed to update notification settings");
    }

    return (updated.notificationSettings as MailSettings) || defaultSettings;
  } catch (error) {
    console.error("Error updating notification settings:", error);
    throw new Error("Failed to update notification settings");
  }
}

