"use server";

import { getCurrentUser } from "~/lib/dal";
import {
  getGoogleCalendarSyncDirection,
  updateGoogleCalendarSyncDirection,
} from "~/server/queries/settings";

export async function getGoogleCalendarSyncDirectionAction(): Promise<{
  success: boolean;
  syncDirection?:
    | "bidirectional"
    | "vesta_to_google"
    | "google_to_vesta"
    | "none";
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    const syncDirection = await getGoogleCalendarSyncDirection(currentUser.id);

    return {
      success: true,
      syncDirection: syncDirection ?? "vesta_to_google", // Default to recommended one-way sync
    };
  } catch (error) {
    console.error("Error getting sync direction:", error);
    return {
      success: false,
      error: "Failed to get sync direction",
    };
  }
}

export async function updateGoogleCalendarSyncDirectionAction(
  direction: "bidirectional" | "vesta_to_google" | "google_to_vesta" | "none",
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    const success = await updateGoogleCalendarSyncDirection(
      currentUser.id,
      direction,
    );

    if (success) {
      return { success: true };
    } else {
      return { success: false, error: "Failed to update sync direction" };
    }
  } catch (error) {
    console.error("Error updating sync direction:", error);
    return {
      success: false,
      error: "Failed to update sync direction",
    };
  }
}
