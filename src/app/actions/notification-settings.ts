"use server";

import { getSecureSession } from "~/lib/dal";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "~/server/queries/notification-settings";
import type { MailSettings } from "~/components/admin/account/mail-configuration/types";

/**
 * Get notification settings for the current user's account
 */
export async function getNotificationSettingsAction(): Promise<{
  success: boolean;
  data?: MailSettings;
  error?: string;
}> {
  try {
    const session = await getSecureSession();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get user's account ID from session
    const accountId = session.user.accountId ? BigInt(session.user.accountId) : null;

    if (!accountId) {
      return {
        success: false,
        error: "Account not found",
      };
    }

    const settings = await getNotificationSettings(accountId);

    return {
      success: true,
      data: settings,
    };
  } catch (error) {
    console.error("Error in getNotificationSettingsAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch notification settings",
    };
  }
}

/**
 * Update notification settings for the current user's account
 */
export async function updateNotificationSettingsAction(
  settings: MailSettings,
): Promise<{
  success: boolean;
  data?: MailSettings;
  error?: string;
}> {
  try {
    const session = await getSecureSession();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get user's account ID from session
    const accountId = session.user.accountId ? BigInt(session.user.accountId) : null;

    if (!accountId) {
      return {
        success: false,
        error: "Account not found",
      };
    }

    const updatedSettings = await updateNotificationSettings(accountId, settings);

    return {
      success: true,
      data: updatedSettings,
    };
  } catch (error) {
    console.error("Error in updateNotificationSettingsAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update notification settings",
    };
  }
}

