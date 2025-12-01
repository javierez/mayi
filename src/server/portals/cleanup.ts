/**
 * Portal Cleanup Utility
 *
 * Handles cleanup of portal ads (Fotocasa, Idealista) when listings are deleted or discarded.
 * - Fotocasa: Direct DELETE API call (blocking)
 * - Idealista: Triggers export after DB changes (non-blocking)
 */

import { eq, and } from "drizzle-orm";
import { db } from "~/server/db";
import { listings, accounts } from "~/server/db/schema";
import { deleteFromFotocasa } from "./fotocasa";
import { exportToIdealista } from "./idealista";

export interface PortalCleanupResult {
  fotocasa: {
    wasPublished: boolean;
    attempted: boolean;
    success: boolean;
    error?: string;
  };
  idealista: {
    wasPublished: boolean;
    exportTriggered: boolean;
  };
}

/**
 * Get listing portal status (fotocasa and idealista flags)
 */
async function getListingPortalStatus(
  listingId: number,
  accountId: number,
): Promise<{ fotocasa: boolean; idealista: boolean } | null> {
  const [listing] = await db
    .select({
      fotocasa: listings.fotocasa,
      idealista: listings.idealista,
    })
    .from(listings)
    .where(
      and(
        eq(listings.listingId, BigInt(listingId)),
        eq(listings.accountId, BigInt(accountId)),
      ),
    );

  if (!listing) return null;

  // Handle null values (treat null as false)
  return {
    fotocasa: listing.fotocasa ?? false,
    idealista: listing.idealista ?? false,
  };
}

/**
 * Clean up Fotocasa ad for a single listing
 * This should be called BEFORE deleting the listing from the database
 *
 * @throws Error if Fotocasa deletion fails (blocking)
 */
export async function cleanupFotocasaAd(listingId: number): Promise<{
  wasPublished: boolean;
  attempted: boolean;
  success: boolean;
  error?: string;
}> {
  try {
    // Get listing status to check if published on Fotocasa
    const accountId = await getAccountIdForListing(listingId);
    if (!accountId) {
      return {
        wasPublished: false,
        attempted: false,
        success: true,
      };
    }

    const status = await getListingPortalStatus(listingId, accountId);
    if (!status) {
      return {
        wasPublished: false,
        attempted: false,
        success: true,
      };
    }

    if (!status.fotocasa) {
      // Not published on Fotocasa, nothing to clean up
      return {
        wasPublished: false,
        attempted: false,
        success: true,
      };
    }

    // Listing is published on Fotocasa - call DELETE API
    console.log(`🗑️ [Portal Cleanup] Deleting listing ${listingId} from Fotocasa...`);

    const result = await deleteFromFotocasa(listingId);

    if (result.success) {
      console.log(`✅ [Portal Cleanup] Successfully deleted listing ${listingId} from Fotocasa`);
      return {
        wasPublished: true,
        attempted: true,
        success: true,
      };
    } else {
      console.error(`❌ [Portal Cleanup] Failed to delete listing ${listingId} from Fotocasa:`, result.error);
      return {
        wasPublished: true,
        attempted: true,
        success: false,
        error: result.error ?? "Unknown Fotocasa deletion error",
      };
    }
  } catch (error) {
    console.error(`❌ [Portal Cleanup] Error cleaning up Fotocasa for listing ${listingId}:`, error);
    return {
      wasPublished: true,
      attempted: true,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Trigger Idealista export for an account
 * This should be called AFTER the database changes are made
 *
 * Non-blocking - if export fails, it will be fixed on next export
 */
export async function triggerIdealistaExportForAccount(
  accountId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
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

    console.log(`📤 [Portal Cleanup] Triggering Idealista export for account ${accountId}...`);

    const result = await exportToIdealista(accountId, customerCode);

    if (result.success) {
      console.log(`✅ [Portal Cleanup] Idealista export completed: ${result.propertyCount} properties`);
      return { success: true };
    } else {
      console.error(`⚠️ [Portal Cleanup] Idealista export failed:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(`⚠️ [Portal Cleanup] Error triggering Idealista export:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Clean up portal ads for a single listing before deletion/discard
 *
 * Flow:
 * 1. Check if published on Fotocasa → DELETE API (blocking on failure)
 * 2. Track if published on Idealista → Will trigger export after DB changes
 *
 * @param listingId The listing ID to clean up
 * @returns Results of cleanup, plus whether Idealista export is needed
 * @throws Error if Fotocasa cleanup fails (blocking)
 */
export async function cleanupPortalAdsForListing(
  listingId: number,
): Promise<{
  fotocasaResult: PortalCleanupResult["fotocasa"];
  needsIdealistaExport: boolean;
}> {
  const accountId = await getAccountIdForListing(listingId);
  if (!accountId) {
    return {
      fotocasaResult: {
        wasPublished: false,
        attempted: false,
        success: true,
      },
      needsIdealistaExport: false,
    };
  }

  const status = await getListingPortalStatus(listingId, accountId);
  if (!status) {
    return {
      fotocasaResult: {
        wasPublished: false,
        attempted: false,
        success: true,
      },
      needsIdealistaExport: false,
    };
  }

  // Step 1: Clean up Fotocasa (blocking)
  const fotocasaResult = await cleanupFotocasaAd(listingId);

  // If Fotocasa cleanup failed and listing was published, throw error to block deletion
  if (fotocasaResult.wasPublished && !fotocasaResult.success) {
    throw new Error(`No se puede eliminar: Error al eliminar de Fotocasa - ${fotocasaResult.error}`);
  }

  // Step 2: Track if Idealista export is needed (will be triggered after DB changes)
  const needsIdealistaExport = status.idealista;

  return {
    fotocasaResult,
    needsIdealistaExport,
  };
}

/**
 * Clean up portal ads for multiple listings (used when deleting a property)
 *
 * @param listingIds Array of listing IDs to clean up
 * @param accountId The account ID (for Idealista export)
 * @returns Combined results
 * @throws Error if any Fotocasa cleanup fails (blocking)
 */
export async function cleanupPortalAdsForMultipleListings(
  listingIds: bigint[],
  accountId: number,
): Promise<{
  fotocasaResults: Map<string, PortalCleanupResult["fotocasa"]>;
  needsIdealistaExport: boolean;
}> {
  const fotocasaResults = new Map<string, PortalCleanupResult["fotocasa"]>();
  let needsIdealistaExport = false;

  for (const listingId of listingIds) {
    const listingIdNum = Number(listingId);
    const status = await getListingPortalStatus(listingIdNum, accountId);

    if (status?.idealista) {
      needsIdealistaExport = true;
    }

    if (status?.fotocasa) {
      // Clean up Fotocasa (blocking)
      const fotocasaResult = await cleanupFotocasaAd(listingIdNum);
      fotocasaResults.set(listingId.toString(), fotocasaResult);

      // If Fotocasa cleanup failed, throw error to block deletion
      if (!fotocasaResult.success) {
        throw new Error(
          `No se puede eliminar la propiedad: Error al eliminar anuncio ${listingIdNum} de Fotocasa - ${fotocasaResult.error}`,
        );
      }
    }
  }

  return {
    fotocasaResults,
    needsIdealistaExport,
  };
}

/**
 * Helper function to get account ID for a listing
 */
async function getAccountIdForListing(listingId: number): Promise<number | null> {
  const [listing] = await db
    .select({ accountId: listings.accountId })
    .from(listings)
    .where(eq(listings.listingId, BigInt(listingId)));

  return listing ? Number(listing.accountId) : null;
}
