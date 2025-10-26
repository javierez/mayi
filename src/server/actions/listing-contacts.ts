"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserAccountId } from "~/lib/dal";
import { db } from "~/server/db";
import { listingContacts, contacts } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Deactivate a listing contact (set isActive = false)
 * This removes the contact from the active contacts list for a property
 */
export async function deactivateListingContactAction(
  listingContactId: bigint,
  listingId?: bigint,
) {
  try {
    const accountId = await getCurrentUserAccountId();

    // Verify the listing contact belongs to the current account
    const [listingContact] = await db
      .select({
        listingContactId: listingContacts.listingContactId,
        listingId: listingContacts.listingId,
      })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContacts.listingContactId, listingContactId),
          eq(contacts.accountId, BigInt(accountId))
        )
      )
      .limit(1);

    if (!listingContact) {
      return {
        success: false,
        error: "Contacto no encontrado o acceso denegado",
      };
    }

    // Update the listing contact to set isActive = false
    await db
      .update(listingContacts)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(listingContacts.listingContactId, listingContactId));

    // Revalidate the property detail page if listingId is provided
    if (listingId ?? listingContact.listingId) {
      revalidatePath(`/propiedades/${listingId ?? listingContact.listingId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deactivating listing contact:", error);
    return {
      success: false,
      error: "Error al dar de baja el contacto",
    };
  }
}

/**
 * Add or update offer amount for a listing contact
 */
export async function addOfferToListingContactAction(
  listingContactId: bigint,
  offerAmount: number,
  listingId?: bigint,
  contactId?: bigint,
) {
  try {
    const accountId = await getCurrentUserAccountId();

    // Verify the listing contact belongs to the current account
    const [listingContact] = await db
      .select({
        listingContactId: listingContacts.listingContactId,
        listingId: listingContacts.listingId,
        contactId: listingContacts.contactId,
      })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContacts.listingContactId, listingContactId),
          eq(contacts.accountId, BigInt(accountId))
        )
      )
      .limit(1);

    if (!listingContact) {
      return {
        success: false,
        error: "Contacto no encontrado o acceso denegado",
      };
    }

    // Update the listing contact offer amount and reset offerAccepted to null
    // (new offers should always be in pending state)
    await db
      .update(listingContacts)
      .set({
        offer: offerAmount,
        offerAccepted: null,
        updatedAt: new Date(),
      })
      .where(eq(listingContacts.listingContactId, listingContactId));

    // Revalidate the property detail page if listingId is provided
    if (listingId ?? listingContact.listingId) {
      revalidatePath(`/propiedades/${listingId ?? listingContact.listingId}`);
    }

    // Revalidate the contact detail page if contactId is provided
    if (contactId ?? listingContact.contactId) {
      revalidatePath(`/contactos/${contactId ?? listingContact.contactId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error adding offer to listing contact:", error);
    return {
      success: false,
      error: "Error al registrar la oferta",
    };
  }
}

/**
 * Update offer status for a listing contact (accept, reject, or revoke)
 * Sets offerAccepted to true (accept), false (reject), or null (revoke decision)
 */
export async function updateOfferStatusAction(
  listingContactId: bigint,
  offerAccepted: boolean | null,
  listingId?: bigint,
  contactId?: bigint,
) {
  try {
    const accountId = await getCurrentUserAccountId();

    // Verify the listing contact belongs to the current account
    const [listingContact] = await db
      .select({
        listingContactId: listingContacts.listingContactId,
        listingId: listingContacts.listingId,
        contactId: listingContacts.contactId,
      })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContacts.listingContactId, listingContactId),
          eq(contacts.accountId, BigInt(accountId))
        )
      )
      .limit(1);

    if (!listingContact) {
      return {
        success: false,
        error: "Contacto no encontrado o acceso denegado",
      };
    }

    // Update the listing contact offer status
    await db
      .update(listingContacts)
      .set({
        offerAccepted,
        updatedAt: new Date(),
      })
      .where(eq(listingContacts.listingContactId, listingContactId));

    // Revalidate the property detail page if listingId is provided
    if (listingId ?? listingContact.listingId) {
      revalidatePath(`/propiedades/${listingId ?? listingContact.listingId}`);
    }

    // Revalidate the contact detail page if contactId is provided
    if (contactId ?? listingContact.contactId) {
      revalidatePath(`/contactos/${contactId ?? listingContact.contactId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating offer status:", error);
    return {
      success: false,
      error: "Error al actualizar el estado de la oferta",
    };
  }
}
