"use server";

import { findOrCreateListingContact } from "~/server/queries/contact";
import {
  upsertEmailThreadContext,
  removeEmailThreadContext,
  getThreadContextByThreadId,
} from "~/server/queries/email-thread-context";

/**
 * Assign a listing to a thread for an existing contact
 * Creates or finds the listingContact relationship and links the thread to it
 */
export async function assignListingToThreadAction(
  threadId: string,
  contactId: bigint,
  listingId: bigint | null,
  contactType?: "owner" | "buyer",
): Promise<{
  success: boolean;
  listingContactId?: bigint;
  error?: string;
}> {
  try {
    // If listingId is null, we're unlinking the thread from any listing
    if (listingId === null) {
      await removeEmailThreadContext(threadId);
      return { success: true };
    }

    // Validate contactType is provided when listingId is present
    if (!contactType) {
      return {
        success: false,
        error: "Contact type is required when assigning a listing",
      };
    }

    // Find or create the listing-contact relationship
    const { listingContactId } = await findOrCreateListingContact(
      contactId,
      listingId,
      contactType,
    );

    // Link the thread to this listing-contact relationship
    await upsertEmailThreadContext(threadId, listingContactId);

    return { success: true, listingContactId };
  } catch (error) {
    console.error("Error assigning listing to thread:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Get the current thread context (if any)
 */
export async function getThreadContextAction(threadId: string): Promise<{
  success: boolean;
  context?: {
    listingContactId: bigint | null;
    contactId: bigint | null;
    contactType: string | null;
    listing: {
      listingId: bigint;
      title: string | null;
      referenceNumber: string | null;
      price: string;
      city: string | null;
      imageUrl: string | null;
    } | null;
  };
  error?: string;
}> {
  try {
    const context = await getThreadContextByThreadId(threadId);

    if (!context) {
      return { success: true, context: undefined };
    }

    return {
      success: true,
      context: {
        listingContactId: context.listingContactId,
        contactId: context.contactId,
        contactType: context.contactType,
        listing: context.listing,
      },
    };
  } catch (error) {
    console.error("Error getting thread context:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Remove the listing assignment from a thread (unlink)
 */
export async function unlinkThreadFromListingAction(threadId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await removeEmailThreadContext(threadId);
    return { success: true };
  } catch (error) {
    console.error("Error unlinking thread from listing:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
