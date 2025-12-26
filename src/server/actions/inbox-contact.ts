"use server";

import {
  createContact,
  createContactWithListings,
  findContactsByEmailsWithAuth,
} from "~/server/queries/contact";
import { upsertEmailThreadContext } from "~/server/queries/email-thread-context";
import type { InboxContact } from "~/components/inbox/inbox-types";
import type { Contact } from "~/lib/data";

function parseNameParts(displayName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 0) {
    return { firstName: "Sin nombre", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0] ?? "Sin nombre", lastName: "" };
  }
  const firstName = parts[0] ?? "Sin nombre";
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

export async function createContactFromEmailAction(
  inboxContact: {
    id: string;
    name: string;
    email?: string;
  },
  threadId: string,
  listingId?: bigint,
  contactType?: "owner" | "buyer",
): Promise<
  | { success: true; contact: Contact; listingContactId?: bigint }
  | { success: false; error: string }
> {
  try {
    const { firstName, lastName } = parseNameParts(inboxContact.name);
    const email = inboxContact.email ?? inboxContact.id;

    const contactData = {
      firstName,
      lastName,
      email,
      source: "Email",
      isActive: true,
    };

    let result:
      | (Contact & { listingContactId?: bigint })
      | { error: "DUPLICATE_FOUND"; duplicates: unknown[] };
    let listingContactId: bigint | undefined;

    // If listing is provided, use createContactWithListings
    if (listingId && contactType) {
      result = await createContactWithListings(
        contactData,
        [listingId],
        contactType,
        undefined, // ownershipAction
        false, // Don't bypass duplicate check
      );

      // Extract listingContactId if available
      if (!("error" in result) && result.listingContactId) {
        listingContactId = result.listingContactId;
      }
    } else {
      result = await createContact(
        contactData,
        false, // Don't bypass duplicate check
      );
    }

    if ("error" in result && result.error === "DUPLICATE_FOUND") {
      return {
        success: false,
        error: "Ya existe un contacto con este email",
      };
    }

    // Create thread context if we have a listingContactId
    if (listingContactId) {
      await upsertEmailThreadContext(threadId, listingContactId);
    }

    return {
      success: true,
      contact: result as Contact,
      listingContactId,
    };
  } catch (error) {
    console.error("Error creating contact from email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function enrichContactsWithLinkStatus(
  contacts: InboxContact[],
): Promise<InboxContact[]> {
  const emails = contacts
    .map((c) => c.email ?? c.id)
    .filter((email): email is string => Boolean(email));

  if (emails.length === 0) return contacts;

  const linkedContacts = await findContactsByEmailsWithAuth(emails);

  return contacts.map((contact) => {
    const email = (contact.email ?? contact.id).toLowerCase().trim();
    const linked = linkedContacts.get(email);

    return {
      ...contact,
      contactId: linked?.contactId,
      isLinked: !!linked,
    };
  });
}
