"use server";

import { eq, and, inArray, asc } from "drizzle-orm";
import { db } from "~/server/db";
import { listings, listingActivity, appointments, accounts, properties } from "~/server/db/schema";
import { getSecureSession } from "~/lib/dal";
import {
  exportToIdealista,
  checkIdealistaSlotAvailability,
  swapIdealistaListing,
} from "~/server/portals/idealista";
import { cleanupAllWatermarkedImagesForReference } from "~/server/utils/watermarked-upload";

// Progress stage action types that we track from listing_activity
const PROGRESS_STAGE_ACTIONS = [
  "listing_created",
  "ficha_completed",
  "encargo_signed",
  "offer_accepted",
  "arras_signed",
  "escritura_signed",
  "deal_closed",
] as const;

export interface ProgressStageActivity {
  action: string;
  createdAt: Date;
  details: Record<string, unknown>;
}

/**
 * Get progress stage activities for a listing (for timeline display in modals)
 * Returns completed stages from listing_activity table
 */
export async function getProgressStageActivities(
  listingId: number,
): Promise<ProgressStageActivity[]> {
  console.log("📊 getProgressStageActivities called with listingId:", listingId);

  try {
    const session = await getSecureSession();
    if (!session) {
      console.log("❌ No session found");
      return [];
    }
    console.log("✅ Session found, accountId:", session.user.accountId);

    // First verify the listing belongs to this account
    const [listing] = await db
      .select({ accountId: listings.accountId })
      .from(listings)
      .where(eq(listings.listingId, BigInt(listingId)))
      .limit(1);

    console.log("📋 Listing lookup result:", listing);

    if (!listing || listing.accountId !== BigInt(session.user.accountId)) {
      console.log("❌ Listing not found or account mismatch");
      return [];
    }

    // Fetch progress stage activities ordered by creation date
    console.log("🔍 Fetching activities for actions:", PROGRESS_STAGE_ACTIONS);

    const [activities, firstAppointment] = await Promise.all([
      // Fetch from listing_activity
      db
        .select({
          action: listingActivity.action,
          createdAt: listingActivity.createdAt,
          details: listingActivity.details,
        })
        .from(listingActivity)
        .where(
          and(
            eq(listingActivity.listingId, BigInt(listingId)),
            inArray(listingActivity.action, [...PROGRESS_STAGE_ACTIONS]),
          ),
        )
        .orderBy(asc(listingActivity.createdAt)),

      // Fetch first appointment for this listing (for visitas_started)
      db
        .select({
          appointmentId: appointments.appointmentId,
          datetimeStart: appointments.datetimeStart,
          title: appointments.title,
          type: appointments.type,
        })
        .from(appointments)
        .where(
          and(
            eq(appointments.listingId, BigInt(listingId)),
            eq(appointments.isActive, true),
          ),
        )
        .orderBy(asc(appointments.datetimeStart))
        .limit(1),
    ]);

    console.log("📊 Raw activities from DB:", activities);
    console.log("📊 Activities count:", activities.length);
    console.log("📅 First appointment:", firstAppointment[0] ?? "none");

    // Build result array from listing_activity
    const result: ProgressStageActivity[] = activities.map((a) => ({
      action: a.action,
      createdAt: a.createdAt,
      details: a.details as Record<string, unknown>,
    }));

    // Add visitas_started from first appointment if exists
    if (firstAppointment[0]) {
      const appointment = firstAppointment[0];
      result.push({
        action: "visitas_started",
        createdAt: appointment.datetimeStart,
        details: {
          stageId: "visitas",
          stageName: "Visitas",
          progressPercent: 56,
          appointmentId: appointment.appointmentId.toString(),
          appointmentTitle: appointment.title,
          appointmentType: appointment.type,
        },
      });
      console.log("✅ Added visitas_started from appointment:", appointment.datetimeStart);
    }

    // Sort all activities by createdAt
    result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    console.log("✅ Returning activities:", result.map(r => ({
      action: r.action,
      createdAt: r.createdAt,
      stageName: r.details?.stageName,
    })));

    return result;
  } catch (error) {
    console.error("💥 Error fetching progress stage activities:", error);
    return [];
  }
}

/**
 * Get completion dates for a listing (for process stage modals)
 */
export async function getListingCompletionDates(listingId: number) {
  try {
    const session = await getSecureSession();
    if (!session) {
      return null;
    }

    const [listing] = await db
      .select({
        fichaCompletedAt: listings.fichaCompletedAt,
      })
      .from(listings)
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(session.user.accountId)),
        ),
      )
      .limit(1);

    if (!listing) {
      return null;
    }

    return {
      fichaCompletedAt: listing.fichaCompletedAt,
    };
  } catch (error) {
    console.error("Error fetching listing completion dates:", error);
    return null;
  }
}

/**
 * Export all Idealista-enabled listings to S3
 * Called when Idealista toggle changes (either enabled or disabled)
 */
export async function triggerIdealistaExport(): Promise<{
  success: boolean;
  propertyCount?: number;
  s3Url?: string;
  error?: string;
}> {
  try {
    const session = await getSecureSession();
    if (!session) {
      return { success: false, error: "No session" };
    }

    const accountId = Number(session.user.accountId);

    // Get account portal settings for customer code
    const [account] = await db
      .select({ portalSettings: accounts.portalSettings })
      .from(accounts)
      .where(eq(accounts.accountId, BigInt(accountId)))
      .limit(1);

    const portalSettings = account?.portalSettings as {
      idealista?: { apiKey?: string };
    } | null;

    const customerCode = portalSettings?.idealista?.apiKey ?? `account_${accountId}`;

    // Export to S3
    const result = await exportToIdealista(accountId, customerCode);

    if (result.success) {
      return {
        success: true,
        propertyCount: result.propertyCount,
        s3Url: result.s3Url,
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    console.error("Error triggering Idealista export:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check Idealista slot availability for current account
 */
export async function checkIdealistaSlots(): Promise<{
  success: boolean;
  hasCapacity?: boolean;
  currentCount?: number;
  maxSlots?: number | null;
  enabledListings?: Array<{
    listingId: bigint;
    referenceNumber: string | null;
    title: string | null;
    city: string | null;
    price: string;
    propertyType: string | null;
    imageUrl: string | null;
  }>;
  error?: string;
}> {
  try {
    const session = await getSecureSession();
    if (!session) {
      return { success: false, error: "No session" };
    }

    const result = await checkIdealistaSlotAvailability(
      Number(session.user.accountId),
    );
    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error("Error checking Idealista slots:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Swap Idealista listing - deactivate one and activate another
 * Automatically triggers export after swap
 */
export async function performIdealistaSwap(
  listingIdToDeactivate: string,
  listingIdToActivate: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSecureSession();
    if (!session) {
      return { success: false, error: "No session" };
    }

    const result = await swapIdealistaListing(
      Number(session.user.accountId),
      BigInt(listingIdToDeactivate),
      listingIdToActivate,
    );

    if (result.success) {
      // Trigger export after swap
      await triggerIdealistaExport();
    }

    return result;
  } catch (error) {
    console.error("Error performing Idealista swap:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Clean up watermarked images for a listing when Idealista is disabled
 * This is called when the user turns off the Idealista toggle for a listing
 */
export async function cleanupIdealistaWatermarkedImages(
  listingId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSecureSession();
    if (!session) {
      return { success: false, error: "No session" };
    }

    // Get the listing's reference number by joining with properties table
    const [listing] = await db
      .select({ referenceNumber: properties.referenceNumber })
      .from(listings)
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(session.user.accountId)),
        ),
      )
      .limit(1);

    if (!listing) {
      return { success: false, error: "Listing not found" };
    }

    const referenceNumber = listing.referenceNumber ?? listingId.toString();

    // Clean up watermarked images for this listing
    const result = await cleanupAllWatermarkedImagesForReference(referenceNumber);

    if (result.success) {
      console.log(`Cleaned up watermarked images for listing ${listingId}: ${result.message}`);
      return { success: true };
    } else {
      console.warn(`Failed to cleanup watermarked images for listing ${listingId}: ${result.message}`);
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.error("Error cleaning up Idealista watermarked images:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
