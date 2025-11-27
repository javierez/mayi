"use server";

import { getCurrentUser } from "../../lib/dal";
import {
  logWebsitePublished,
  logWebsiteUnpublished,
  logKeysReturned,
  logCartelPlaced,
  logCartelRemoved,
  logEscaparateAdded,
  logEscaparateRemoved,
  logListingActivity,
} from "../queries/log-activity";

export interface PortalToggleChanges {
  publishToWebsite?: { old: boolean; new: boolean };
  hasKeys?: { old: boolean; new: boolean };
  hasCartel?: { old: boolean; new: boolean };
  enEscaparate?: { old: boolean; new: boolean };
}

export interface SavePortalChangesResult {
  success: boolean;
  error?: string;
  activitiesLogged: number;
}

/**
 * Server action to save portal toggle changes with activity logging.
 * This function determines the direction of each change (0→1 or 1→0)
 * and logs the appropriate activity.
 */
export async function savePortalChangesWithActivity(
  listingId: bigint,
  changes: PortalToggleChanges,
): Promise<SavePortalChangesResult> {
  try {
    const currentUser = await getCurrentUser();
    let activitiesLogged = 0;

    // publishToWebsite changes
    if (changes.publishToWebsite && changes.publishToWebsite.old !== changes.publishToWebsite.new) {
      if (changes.publishToWebsite.new) {
        // 0 → 1: website_published
        await logWebsitePublished({
          listingId,
          userId: currentUser.id,
        });
      } else {
        // 1 → 0: website_unpublished
        await logWebsiteUnpublished({
          listingId,
          userId: currentUser.id,
        });
      }
      activitiesLogged++;
    }

    // hasKeys changes
    if (changes.hasKeys && changes.hasKeys.old !== changes.hasKeys.new) {
      if (changes.hasKeys.new) {
        // 0 → 1: keys_received (use existing action with simplified details)
        await logListingActivity({
          listingId,
          userId: currentUser.id,
          action: "keys_received",
          details: {
            field: "hasKeys",
            oldValue: false,
            newValue: true,
            receivedFrom: "Portal toggle",
          },
        });
      } else {
        // 1 → 0: keys_returned
        await logKeysReturned({
          listingId,
          userId: currentUser.id,
        });
      }
      activitiesLogged++;
    }

    // hasCartel changes
    if (changes.hasCartel && changes.hasCartel.old !== changes.hasCartel.new) {
      if (changes.hasCartel.new) {
        // 0 → 1: cartel_placed
        await logCartelPlaced({
          listingId,
          userId: currentUser.id,
        });
      } else {
        // 1 → 0: cartel_removed
        await logCartelRemoved({
          listingId,
          userId: currentUser.id,
        });
      }
      activitiesLogged++;
    }

    // enEscaparate changes
    if (changes.enEscaparate && changes.enEscaparate.old !== changes.enEscaparate.new) {
      if (changes.enEscaparate.new) {
        // 0 → 1: escaparate_added
        await logEscaparateAdded({
          listingId,
          userId: currentUser.id,
        });
      } else {
        // 1 → 0: escaparate_removed
        await logEscaparateRemoved({
          listingId,
          userId: currentUser.id,
        });
      }
      activitiesLogged++;
    }

    return {
      success: true,
      activitiesLogged,
    };
  } catch (error) {
    console.error("Error saving portal changes with activity:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      activitiesLogged: 0,
    };
  }
}
