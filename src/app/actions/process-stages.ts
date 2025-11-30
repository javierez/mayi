"use server";

import { revalidatePath } from "next/cache";
import { db } from "~/server/db";
import { listings, deals, listingContacts } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUserAccountId, getCurrentUser } from "~/lib/dal";
import {
  createDealWithAuth,
  getActiveDealForListingWithAuth,
} from "~/server/queries/deal";
import {
  logEncargoSigned,
  logListingOfferAccepted,
  logArrasSigned,
  logEscrituraSigned,
  logListingDealClosed,
} from "~/server/queries/log-activity";

export interface CompleteStagesResult {
  success: boolean;
  error?: string;
  updatedFields?: string[];
}

/**
 * Complete all stages up to the target stage
 * This will update the database fields necessary to mark stages as completed
 */
export async function completeStagesUpTo(
  listingId: number,
  targetStageId: string,
  selectedStageIds: string[],
): Promise<CompleteStagesResult> {
  try {
    console.log("🚀 completeStagesUpTo called with:", {
      listingId,
      listingIdType: typeof listingId,
      targetStageId,
      selectedStageIds,
    });

    const accountId = await getCurrentUserAccountId();
    console.log("👤 Current account ID:", accountId);

    const updatedFields: string[] = [];

    // Verify listing belongs to this account using direct select
    console.log("🔍 Querying listing with ID:", listingId, "as BigInt:", BigInt(listingId));

    const [listing] = await db
      .select({
        listingId: listings.listingId,
        accountId: listings.accountId,
      })
      .from(listings)
      .where(eq(listings.listingId, BigInt(listingId)))
      .limit(1);

    console.log("📄 Listing query result:", listing);

    if (!listing) {
      console.error("❌ Listing not found for ID:", listingId);
      return { success: false, error: "Listing not found" };
    }

    // Verify account ownership
    console.log("🔐 Checking ownership:", {
      listingAccountId: listing.accountId,
      currentAccountId: accountId,
      match: listing.accountId === BigInt(accountId),
    });

    if (listing.accountId !== BigInt(accountId)) {
      console.error("❌ Access denied - account mismatch");
      return { success: false, error: "Access denied" };
    }

    console.log("✅ Listing verified, proceeding with stage updates");

    // Get existing deal if any
    let existingDeal = await getActiveDealForListingWithAuth(listingId);
    console.log("📋 Existing deal:", existingDeal ? "Found" : "Not found");

    // Process each selected stage
    console.log("🔄 Processing stages:", selectedStageIds);

    for (const stageId of selectedStageIds) {
      console.log(`\n📍 Processing stage: ${stageId}`);

      switch (stageId) {
        case "alta":
          console.log("  ℹ️  'alta' - Always completed, no action needed");
          break;

        case "completar-info":
          console.log("  ℹ️  'completar-info' - Auto-calculated, no DB update");
          break;

        case "firma-encargo":
          console.log("  ✍️  Updating listings.encargo to true");
          await db
            .update(listings)
            .set({ encargo: true })
            .where(eq(listings.listingId, BigInt(listingId)));
          updatedFields.push("encargo");

          // Log the encargo_signed activity
          try {
            const currentUser = await getCurrentUser();
            await logEncargoSigned({
              listingId: BigInt(listingId),
              userId: currentUser.id,
            });
            console.log("  📝 Logged encargo_signed activity");
          } catch (logError) {
            console.error("  ⚠️ Failed to log encargo_signed activity:", logError);
          }

          console.log("  ✅ Updated encargo");
          break;

        case "visitas":
          // Check if there are any active contacts
          const activeContacts = await db
            .select()
            .from(listingContacts)
            .where(
              and(
                eq(listingContacts.listingId, BigInt(listingId)),
                eq(listingContacts.isActive, true),
              ),
            )
            .limit(1);

          if (activeContacts.length === 0) {
            // Skip this stage if no contacts exist
            console.warn(
              "Skipping 'visitas' stage: No active contacts found for listing",
              listingId,
            );
            break;
          }

          // Update the first active contact's offer_accepted
          const firstContact = activeContacts[0];
          if (!firstContact) break;

          await db
            .update(listingContacts)
            .set({ offerAccepted: true })
            .where(
              eq(
                listingContacts.listingContactId,
                firstContact.listingContactId,
              ),
            );
          updatedFields.push("offerAccepted");

          // Log the offer_accepted activity
          try {
            const currentUser = await getCurrentUser();
            await logListingOfferAccepted({
              listingId: BigInt(listingId),
              userId: currentUser.id,
              listingContactId: firstContact.listingContactId,
              offerAmount: firstContact.offer ?? undefined,
            });
            console.log("  📝 Logged offer_accepted activity");
          } catch (logError) {
            console.error("  ⚠️ Failed to log offer_accepted activity:", logError);
          }
          break;

        case "arras":
        case "contrato":
        case "cierre-final":
          // These require a deal record
          if (!existingDeal) {
            // Create a new deal
            const firstContact = await db
              .select()
              .from(listingContacts)
              .where(
                and(
                  eq(listingContacts.listingId, BigInt(listingId)),
                  eq(listingContacts.isActive, true),
                ),
              )
              .limit(1);

            if (firstContact.length === 0) {
              return {
                success: false,
                error:
                  "Cannot create deal: No active contacts found for this listing",
              };
            }

            const dealData = {
              listingId: BigInt(listingId),
              listingContactId: firstContact[0]!.listingContactId,
              status: "Offer" as const,
            };

            const newDeal = await createDealWithAuth(dealData);
            if (!newDeal) {
              return { success: false, error: "Failed to create deal" };
            }

            // Get the created deal
            existingDeal = await getActiveDealForListingWithAuth(listingId);
            if (!existingDeal) {
              return {
                success: false,
                error: "Failed to retrieve created deal",
              };
            }
          }

          // Now update the deal based on the stage
          const dealUpdates: {
            arrasDate?: Date;
            actualDeedDate?: Date;
            closeDate?: Date;
            status?: string;
          } = {};

          if (stageId === "arras") {
            dealUpdates.arrasDate = new Date();
            updatedFields.push("arrasDate");
          }

          if (stageId === "contrato" || stageId === "cierre-final") {
            // Escritura requires arras to be set
            if (!existingDeal.arrasDate) {
              dealUpdates.arrasDate = new Date();
              updatedFields.push("arrasDate");
            }
            dealUpdates.actualDeedDate = new Date();
            updatedFields.push("actualDeedDate");
          }

          if (stageId === "cierre-final") {
            // Cierre requires both arras and actualDeedDate
            if (!existingDeal.arrasDate) {
              dealUpdates.arrasDate = new Date();
              updatedFields.push("arrasDate");
            }
            if (!existingDeal.actualDeedDate) {
              dealUpdates.actualDeedDate = new Date();
              updatedFields.push("actualDeedDate");
            }
            dealUpdates.closeDate = new Date();
            dealUpdates.status = "Closed";
            updatedFields.push("closeDate", "status");
          }

          if (Object.keys(dealUpdates).length > 0) {
            // Update deal directly via db since we have access to the full schema
            await db
              .update(deals)
              .set(dealUpdates)
              .where(eq(deals.dealId, existingDeal.dealId));

            // Log activity based on stage
            try {
              const currentUser = await getCurrentUser();
              if (stageId === "arras") {
                await logArrasSigned({
                  listingId: BigInt(listingId),
                  userId: currentUser.id,
                  dealId: existingDeal.dealId,
                });
                console.log("  📝 Logged arras_signed activity");
              } else if (stageId === "contrato") {
                await logEscrituraSigned({
                  listingId: BigInt(listingId),
                  userId: currentUser.id,
                  dealId: existingDeal.dealId,
                });
                console.log("  📝 Logged escritura_signed activity");
              } else if (stageId === "cierre-final") {
                await logListingDealClosed({
                  listingId: BigInt(listingId),
                  userId: currentUser.id,
                  dealId: existingDeal.dealId,
                });
                console.log("  📝 Logged deal_closed activity");
              }
            } catch (logError) {
              console.error("  ⚠️ Failed to log deal activity:", logError);
            }
          }
          break;

        default:
          console.warn(`Unknown stage ID: ${stageId}`);
      }
    }

    // Revalidate the path to refresh the UI
    console.log("\n🔄 Revalidating paths...");
    revalidatePath(`/propiedades/${listingId}`);
    revalidatePath("/propiedades");

    console.log("🎉 Successfully completed stages! Updated fields:", updatedFields);

    return {
      success: true,
      updatedFields,
    };
  } catch (error) {
    console.error("💥 Error completing stages:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get current progress for a listing to determine which stages are completed
 */
export async function getListingProgress(listingId: number) {
  try {
    const accountId = await getCurrentUserAccountId();

    // Get listing using direct select
    const [listing] = await db
      .select({
        listingId: listings.listingId,
        accountId: listings.accountId,
        encargo: listings.encargo,
      })
      .from(listings)
      .where(eq(listings.listingId, BigInt(listingId)))
      .limit(1);

    if (!listing) {
      return null;
    }

    // Verify account ownership
    if (listing.accountId !== BigInt(accountId)) {
      return null;
    }

    // Get active contacts
    const activeContacts = await db
      .select()
      .from(listingContacts)
      .where(
        and(
          eq(listingContacts.listingId, BigInt(listingId)),
          eq(listingContacts.isActive, true),
        ),
      );

    // Check if any contact has accepted offer
    const hasOfferAccepted = activeContacts.some(
      (contact) => contact.offerAccepted === true,
    );

    // Get active deal
    const deal = await getActiveDealForListingWithAuth(listingId);

    return {
      hasEncargo: listing.encargo ?? false,
      hasOfferAccepted,
      hasDeal: !!deal,
      hasArrasDate: !!deal?.arrasDate,
      hasActualDeedDate: !!deal?.actualDeedDate,
      hasCloseDate: !!deal?.closeDate,
      dealStatus: deal?.status ?? null,
      hasActiveContacts: activeContacts.length > 0,
    };
  } catch (error) {
    console.error("Error getting listing progress:", error);
    return null;
  }
}
