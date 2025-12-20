"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserAccountId, getCurrentUser } from "~/lib/dal";
import { db } from "~/server/db";
import { listingContacts, contacts, deals } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { logListingOfferAccepted } from "~/server/queries/log-activity";

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
          eq(contacts.accountId, BigInt(accountId)),
        ),
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
 * Reactivate a listing contact (set isActive = true)
 * This adds the contact back to the active contacts list for a property
 */
export async function reactivateListingContactAction(
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
          eq(contacts.accountId, BigInt(accountId)),
        ),
      )
      .limit(1);

    if (!listingContact) {
      return {
        success: false,
        error: "Contacto no encontrado o acceso denegado",
      };
    }

    // Update the listing contact to set isActive = true
    await db
      .update(listingContacts)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(listingContacts.listingContactId, listingContactId));

    // Revalidate the property detail page if listingId is provided
    if (listingId ?? listingContact.listingId) {
      revalidatePath(`/propiedades/${listingId ?? listingContact.listingId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error reactivating listing contact:", error);
    return {
      success: false,
      error: "Error al reactivar el contacto",
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
          eq(contacts.accountId, BigInt(accountId)),
        ),
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
 * When accepting an offer, automatically creates or updates a deal record
 * When revoking acceptance, deletes the associated deal
 */
export async function updateOfferStatusAction(
  listingContactId: bigint,
  offerAccepted: boolean | null,
  listingId?: bigint,
  contactId?: bigint,
) {
  try {
    const accountId = await getCurrentUserAccountId();

    // Use transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      // Verify the listing contact belongs to the current account
      const [listingContact] = await tx
        .select({
          listingContactId: listingContacts.listingContactId,
          listingId: listingContacts.listingId,
          contactId: listingContacts.contactId,
          offer: listingContacts.offer,
        })
        .from(listingContacts)
        .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
        .where(
          and(
            eq(listingContacts.listingContactId, listingContactId),
            eq(contacts.accountId, BigInt(accountId)),
          ),
        )
        .limit(1);

      if (!listingContact) {
        throw new Error("Contacto no encontrado o acceso denegado");
      }

      // Update the listing contact offer status
      await tx
        .update(listingContacts)
        .set({
          offerAccepted,
          updatedAt: new Date(),
        })
        .where(eq(listingContacts.listingContactId, listingContactId));

      // Handle deal creation/update/deletion based on offer status
      if (offerAccepted === true) {
        // Verify listingId exists before creating deal
        if (!listingContact.listingId) {
          throw new Error(
            "No se puede crear un trato sin un listingId asociado",
          );
        }

        // Accepting an offer: create or update deal
        const [existingDeal] = await tx
          .select()
          .from(deals)
          .where(eq(deals.listingContactId, listingContactId))
          .limit(1);

        if (existingDeal) {
          // Update existing deal status
          await tx
            .update(deals)
            .set({
              status: "Arras Pending",
              updatedAt: new Date(),
            })
            .where(eq(deals.dealId, existingDeal.dealId));
        } else {
          // Create new deal
          await tx.insert(deals).values({
            listingId: listingContact.listingId,
            listingContactId: listingContactId,
            status: "Arras Pending",
          });
        }

        // Log the offer_accepted activity
        try {
          const currentUser = await getCurrentUser();
          await logListingOfferAccepted({
            listingId: listingContact.listingId,
            userId: currentUser.id,
            listingContactId: listingContactId,
            offerAmount: listingContact.offer ?? undefined,
          });
        } catch (logError) {
          console.error("Failed to log offer_accepted activity:", logError);
        }
      } else if (offerAccepted === null) {
        // Revoking acceptance: delete any associated deal
        await tx
          .delete(deals)
          .where(eq(deals.listingContactId, listingContactId));
      }
      // If offerAccepted === false (rejected), do nothing with deals

      return listingContact;
    });

    // Revalidate the property detail page if listingId is provided
    if (listingId ?? result.listingId) {
      revalidatePath(`/propiedades/${listingId ?? result.listingId}`);
    }

    // Revalidate the contact detail page if contactId is provided
    if (contactId ?? result.contactId) {
      revalidatePath(`/contactos/${contactId ?? result.contactId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating offer status:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al actualizar el estado de la oferta",
    };
  }
}

/**
 * Generate arras contract for a listing contact
 * This action sets the offer to the listing price, accepts it (creating a deal),
 * and optionally reactivates the contact or auto-completes a visit.
 */
export async function generateArrasContractAction(
  listingContactId: bigint,
  listingId: bigint,
  contactId: bigint,
  listingPrice: number,
  options: {
    reactivateFirst?: boolean;
    autoCompleteVisit?: boolean;
    appointmentId?: bigint;
  },
): Promise<{
  success: boolean;
  dealId?: string;
  error?: string;
}> {
  try {
    const accountId = await getCurrentUserAccountId();
    const currentUser = await getCurrentUser();

    const result = await db.transaction(async (tx) => {
      // 1. Verify the listing contact belongs to the current account
      const [listingContact] = await tx
        .select({
          listingContactId: listingContacts.listingContactId,
          listingId: listingContacts.listingId,
          contactId: listingContacts.contactId,
          isActive: listingContacts.isActive,
        })
        .from(listingContacts)
        .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
        .where(
          and(
            eq(listingContacts.listingContactId, listingContactId),
            eq(contacts.accountId, BigInt(accountId)),
          ),
        )
        .limit(1);

      if (!listingContact) {
        throw new Error("Contacto no encontrado o acceso denegado");
      }

      // 2. Reactivate if needed
      if (options.reactivateFirst) {
        await tx
          .update(listingContacts)
          .set({
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(listingContacts.listingContactId, listingContactId));
      }

      // 3. Auto-complete visit if needed
      if (options.autoCompleteVisit && options.appointmentId) {
        const { appointments } = await import("~/server/db/schema");
        await tx
          .update(appointments)
          .set({
            status: "Completed",
            editedBy: currentUser.id,
            updatedAt: new Date(),
          })
          .where(eq(appointments.appointmentId, options.appointmentId));
      }

      // 4. Set offer to listing price and accept it
      await tx
        .update(listingContacts)
        .set({
          offer: listingPrice,
          offerAccepted: true,
          updatedAt: new Date(),
        })
        .where(eq(listingContacts.listingContactId, listingContactId));

      // 5. Create or update deal
      const [existingDeal] = await tx
        .select()
        .from(deals)
        .where(eq(deals.listingContactId, listingContactId))
        .limit(1);

      let dealId: bigint;

      if (existingDeal) {
        await tx
          .update(deals)
          .set({
            status: "Arras Pending",
            updatedAt: new Date(),
          })
          .where(eq(deals.dealId, existingDeal.dealId));
        dealId = existingDeal.dealId;
      } else {
        const [newDeal] = await tx
          .insert(deals)
          .values({
            listingId: listingId,
            listingContactId: listingContactId,
            status: "Arras Pending",
          })
          .returning({ dealId: deals.dealId });

        if (!newDeal) {
          throw new Error("Error al crear el deal");
        }
        dealId = newDeal.dealId;
      }

      return { dealId, listingContact };
    });

    // 6. Log the offer_accepted activity (outside transaction)
    try {
      await logListingOfferAccepted({
        listingId: listingId,
        userId: currentUser.id,
        listingContactId: listingContactId,
        offerAmount: listingPrice,
      });
    } catch (logError) {
      console.error("Failed to log offer_accepted activity:", logError);
    }

    // 7. Revalidate paths
    revalidatePath(`/propiedades/${listingId}`);
    revalidatePath(`/contactos/${contactId}`);

    return {
      success: true,
      dealId: result.dealId.toString(),
    };
  } catch (error) {
    console.error("Error generating arras contract:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al generar el contrato de arras",
    };
  }
}
