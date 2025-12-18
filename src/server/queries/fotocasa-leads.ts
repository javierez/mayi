"use server";

import { db } from "../db";
import { contacts, listingContacts, listings, properties } from "../db/schema";
import { eq, and, sql, or } from "drizzle-orm";
import type { FotocasaLead, ImportLeadResult } from "~/types/fotocasa-leads";
import {
  mapSiteToSource,
  parseName,
  buildLeadAdditionalInfo,
  normalizePhone,
  hasValidContactInfo,
} from "../services/fotocasa-leads-service";

/**
 * Check if a Fotocasa lead has already been imported by checking additionalInfo
 */
export async function isFotocasaLeadImported(
  accountId: bigint,
  fotocasaLeadId: string,
): Promise<boolean> {
  try {
    const result = await db
      .select({ contactId: contacts.contactId })
      .from(contacts)
      .where(
        and(
          eq(contacts.accountId, accountId),
          eq(contacts.isActive, true),
          sql`${contacts.additionalInfo}->>'fotocasaLeadId' = ${fotocasaLeadId}`,
        ),
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("[Fotocasa Leads] Error checking duplicate:", error);
    return false;
  }
}

/**
 * Find existing contact by email or normalized phone
 * Uses phone normalization to match different formats (e.g., +34612345678 = 612345678)
 * Returns the contact if found, null otherwise
 */
export async function findExistingContact(
  accountId: bigint,
  email: string | null | undefined,
  phone: string | null | undefined,
): Promise<{ contactId: bigint } | null> {
  try {
    const normalizedPhone = normalizePhone(phone);
    const trimmedEmail = email?.trim()?.toLowerCase();

    // Need at least email or phone to check
    if (!trimmedEmail && !normalizedPhone) {
      return null;
    }

    // First try exact email match (most reliable)
    if (trimmedEmail) {
      const emailMatch = await db
        .select({ contactId: contacts.contactId })
        .from(contacts)
        .where(
          and(
            eq(contacts.accountId, accountId),
            eq(contacts.isActive, true),
            sql`LOWER(${contacts.email}) = ${trimmedEmail}`,
          ),
        )
        .limit(1);

      if (emailMatch.length > 0) {
        return emailMatch[0] ?? null;
      }
    }

    // Then try normalized phone match
    if (normalizedPhone) {
      // Match phone numbers by comparing normalized versions
      // This handles +34612345678, 612 345 678, 612-345-678, etc.
      const phoneMatch = await db
        .select({ contactId: contacts.contactId })
        .from(contacts)
        .where(
          and(
            eq(contacts.accountId, accountId),
            eq(contacts.isActive, true),
            sql`REGEXP_REPLACE(${contacts.phone}, '[^0-9]', '', 'g') LIKE '%' || ${normalizedPhone}`,
          ),
        )
        .limit(1);

      if (phoneMatch.length > 0) {
        return phoneMatch[0] ?? null;
      }
    }

    return null;
  } catch (error) {
    console.error("[Fotocasa Leads] Error finding existing contact:", error);
    return null;
  }
}

/**
 * Check if a listing_contact already exists for this contact + listing
 */
export async function listingContactExists(
  contactId: bigint,
  listingId: bigint,
): Promise<boolean> {
  try {
    const result = await db
      .select({ listingContactId: listingContacts.listingContactId })
      .from(listingContacts)
      .where(
        and(
          eq(listingContacts.contactId, contactId),
          eq(listingContacts.listingId, listingId),
          eq(listingContacts.isActive, true),
        ),
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("[Fotocasa Leads] Error checking listing_contact:", error);
    return false;
  }
}

/**
 * Find a listing by reference number for an account
 * Joins listings with properties to match by referenceNumber
 */
export async function findListingByReference(
  accountId: bigint,
  reference: string,
): Promise<{ listingId: bigint } | null> {
  try {
    const result = await db
      .select({ listingId: listings.listingId })
      .from(listings)
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(listings.accountId, accountId),
          eq(properties.referenceNumber, reference),
          eq(listings.isActive, true),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  } catch (error) {
    console.error(
      `[Fotocasa Leads] Error finding listing by reference ${reference}:`,
      error,
    );
    return null;
  }
}

/**
 * Import a single Fotocasa lead
 * - Checks if Fotocasa lead was already imported (by fotocasaLeadId)
 * - Checks if contact already exists (by email/phone) - uses existing if found
 * - Creates listing_contact only if it doesn't already exist
 */
export async function importFotocasaLead(
  accountId: bigint,
  lead: FotocasaLead,
): Promise<ImportLeadResult> {
  try {
    // Check for duplicate using fotocasaLeadId (same Fotocasa lead)
    const alreadyImported = await isFotocasaLeadImported(accountId, lead.id);
    if (alreadyImported) {
      return {
        success: true,
        skipped: true,
        skipReason: "Lead already imported (same fotocasaLeadId)",
      };
    }

    // Skip leads without valid contact info (no email AND no phone)
    if (!hasValidContactInfo(lead)) {
      console.warn(
        `[Fotocasa Leads] Skipping lead ${lead.id}: no valid email or phone`,
      );
      return {
        success: true,
        skipped: true,
        skipReason: "No valid contact info (missing email and phone)",
      };
    }

    // Parse contact name
    const { firstName, lastName } = parseName(lead.contactDetails.name);
    const source = mapSiteToSource(lead.site);

    // Build additionalInfo with Fotocasa metadata
    const additionalInfo = buildLeadAdditionalInfo(lead);

    // Check if contact already exists by email or phone
    const existingContact = await findExistingContact(
      accountId,
      lead.contactDetails.email,
      lead.contactDetails.phone,
    );

    let contactId: bigint;
    let contactCreated = false;

    if (existingContact) {
      // Use existing contact
      contactId = existingContact.contactId;
      console.log(
        `[Fotocasa Leads] Found existing contact ${contactId} for lead ${lead.id}`,
      );

      // Update the existing contact's additionalInfo to append Fotocasa lead data
      // This preserves history of all Fotocasa leads linked to this contact
      await db
        .update(contacts)
        .set({
          additionalInfo: sql`
            CASE
              WHEN ${contacts.additionalInfo} IS NULL THEN ${JSON.stringify(additionalInfo)}::jsonb
              ELSE ${contacts.additionalInfo} || ${JSON.stringify(additionalInfo)}::jsonb
            END
          `,
          updatedAt: new Date(),
        })
        .where(eq(contacts.contactId, contactId));
    } else {
      // Create new contact
      const [newContact] = await db
        .insert(contacts)
        .values({
          accountId,
          firstName,
          lastName,
          email: lead.contactDetails.email ?? null,
          phone: lead.contactDetails.phone ?? null,
          source,
          additionalInfo,
          isActive: true,
        })
        .returning();

      if (!newContact) {
        throw new Error("Failed to create contact");
      }

      contactId = newContact.contactId;
      contactCreated = true;
      console.log(
        `[Fotocasa Leads] Created new contact ${contactId} for lead ${lead.id}`,
      );
    }

    const result: ImportLeadResult = {
      success: true,
      contactId,
    };

    // Try to find matching listing and create listing_contact
    if (lead.reference) {
      const listing = await findListingByReference(accountId, lead.reference);

      if (listing) {
        // Check if listing_contact already exists for this contact + listing
        const lcExists = await listingContactExists(contactId, listing.listingId);

        if (lcExists) {
          console.log(
            `[Fotocasa Leads] listing_contact already exists for contact ${contactId} + listing ${listing.listingId}`,
          );
        } else {
          // Create new listing_contact
          const [newListingContact] = await db
            .insert(listingContacts)
            .values({
              listingId: listing.listingId,
              contactId,
              contactType: "buyer",
              source,
              status: "Nuevo", // Initial status for new leads
              isActive: true,
            })
            .returning();

          if (newListingContact) {
            result.listingContactId = newListingContact.listingContactId;
            console.log(
              `[Fotocasa Leads] Created listing_contact ${newListingContact.listingContactId} for listing ${listing.listingId}`,
            );
          }
        }
      } else {
        console.log(
          `[Fotocasa Leads] No matching listing found for reference: ${lead.reference}`,
        );
      }
    }

    console.log(
      `[Fotocasa Leads] Imported lead ${lead.id} → contact ${contactId} (${contactCreated ? "new" : "existing"})`,
    );
    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[Fotocasa Leads] Error importing lead ${lead.id}:`, error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Import multiple Fotocasa leads for an account
 * Returns summary of import results
 */
export async function importFotocasaLeads(
  accountId: bigint,
  leads: FotocasaLead[],
): Promise<{
  total: number;
  imported: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}> {
  const result = {
    total: leads.length,
    imported: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [] as string[],
  };

  for (const lead of leads) {
    const importResult = await importFotocasaLead(accountId, lead);

    if (importResult.success) {
      if (importResult.skipped) {
        result.skipped++;
      } else {
        result.imported++;
      }
    } else {
      result.errors++;
      result.errorDetails.push(
        `Lead ${lead.id}: ${importResult.error ?? "Unknown error"}`,
      );
    }
  }

  return result;
}
