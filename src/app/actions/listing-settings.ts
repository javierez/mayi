"use server";

import { eq, and } from "drizzle-orm";
import { db } from "~/server/db";
import { listings } from "~/server/db/schema";
import { getSecureSession } from "~/lib/dal";
import { revalidatePath } from "next/cache";

export async function updateListingStatus(
  listingId: bigint,
  newStatus: string,
) {
  try {
    const session = await getSecureSession();
    if (!session) {
      throw new Error("User not authenticated");
    }

    // Validate inputs
    if (!newStatus.trim()) {
      throw new Error("Status cannot be empty");
    }

    const validStatuses = [
      "En Venta",
      "En Alquiler",
      "Vendido",
      "Alquilado",
      "Draft",
    ];

    if (!validStatuses.includes(newStatus)) {
      throw new Error("Invalid status");
    }

    // Verify the listing belongs to the user's account
    const [listing] = await db
      .select({
        accountId: listings.accountId,
        propertyId: listings.propertyId,
        currentListingType: listings.listingType,
        currentStatus: listings.status,
      })
      .from(listings)
      .where(eq(listings.listingId, listingId))
      .limit(1);

    if (!listing) {
      throw new Error("Listing not found");
    }

    if (listing.accountId !== BigInt(session.user.accountId)) {
      throw new Error("Access denied: Listing belongs to different account");
    }

    // Update only the listing status (listingType remains unchanged)
    await db
      .update(listings)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(listings.listingId, listingId),
          eq(listings.accountId, BigInt(session.user.accountId)),
        ),
      );

    // Revalidate the property page to show the updated status
    revalidatePath(`/propiedades/${listing.propertyId}`);

    // Also revalidate the main properties list
    revalidatePath("/propiedades");

    return {
      success: true,
      listingType: listing.currentListingType, // Return unchanged listingType
      status: newStatus,
    };
  } catch (error) {
    console.error("Error updating listing status:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update listing status",
    };
  }
}

export async function updateListingFeatured(
  listingId: bigint,
  isFeatured: boolean,
) {
  try {
    const session = await getSecureSession();
    if (!session) {
      throw new Error("User not authenticated");
    }

    // Verify the listing belongs to the user's account
    const [listing] = await db
      .select({
        accountId: listings.accountId,
        propertyId: listings.propertyId,
      })
      .from(listings)
      .where(eq(listings.listingId, listingId))
      .limit(1);

    if (!listing) {
      throw new Error("Listing not found");
    }

    if (listing.accountId !== BigInt(session.user.accountId)) {
      throw new Error("Access denied: Listing belongs to different account");
    }

    // Update the isFeatured field
    await db
      .update(listings)
      .set({
        isFeatured,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(listings.listingId, listingId),
          eq(listings.accountId, BigInt(session.user.accountId)),
        ),
      );

    // Revalidate the property page
    revalidatePath(`/propiedades/${listing.propertyId}`);
    revalidatePath("/propiedades");

    return {
      success: true,
      isFeatured,
    };
  } catch (error) {
    console.error("Error updating listing featured:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update featured status",
    };
  }
}

export async function updateListingOpportunity(
  listingId: bigint,
  isOpportunity: boolean,
) {
  try {
    const session = await getSecureSession();
    if (!session) {
      throw new Error("User not authenticated");
    }

    // Verify the listing belongs to the user's account
    const [listing] = await db
      .select({
        accountId: listings.accountId,
        propertyId: listings.propertyId,
      })
      .from(listings)
      .where(eq(listings.listingId, listingId))
      .limit(1);

    if (!listing) {
      throw new Error("Listing not found");
    }

    if (listing.accountId !== BigInt(session.user.accountId)) {
      throw new Error("Access denied: Listing belongs to different account");
    }

    // Update the isOpportunity field
    await db
      .update(listings)
      .set({
        isOpportunity,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(listings.listingId, listingId),
          eq(listings.accountId, BigInt(session.user.accountId)),
        ),
      );

    // Revalidate the property page
    revalidatePath(`/propiedades/${listing.propertyId}`);
    revalidatePath("/propiedades");

    return {
      success: true,
      isOpportunity,
    };
  } catch (error) {
    console.error("Error updating listing opportunity:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update opportunity status",
    };
  }
}
