"use server";

import { db } from "../db";
import { contacts, listingContacts, listings, properties, listingContactActivity } from "../db/schema";
import { eq, and, sql, or } from "drizzle-orm";
import type { IdealistaLead, ImportIdealistaLeadResult, ImportIdealistaLeadsSummary } from "~/types/idealista-leads";
import {
  parseName,
  normalizePhone,
  hasValidContactInfo,
  buildLeadAdditionalInfo,
  extractPhonePrefix,
  mergeAdditionalInfo,
  determineContactStatus,
} from "../services/idealista-leads-service";
import { getIdealistaLeadsLogger } from "~/server/utils/idealista-leads-logger";
import { getListingById } from "../queries/listing";
import { logContactCreated, logListingContactActivity } from "./log-activity";
import { getSystemUserIdForAccount } from "./fotocasa-leads";

/**
 * Check if an Idealista lead has already been imported by checking additionalInfo
 * Uses gmailMessageId for deduplication
 */
export async function isIdealistaLeadImported(
  accountId: bigint,
  gmailMessageId: string,
): Promise<boolean> {
  try {
    const result = await db
      .select({ contactId: contacts.contactId })
      .from(contacts)
      .where(
        and(
          eq(contacts.accountId, accountId),
          eq(contacts.isActive, true),
          sql`${contacts.additionalInfo}->>'gmailMessageId' = ${gmailMessageId}`,
        ),
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("[Idealista Leads] Error checking duplicate:", error);
    return false;
  }
}

/**
 * Find existing contact by email or normalized phone
 * Uses phone normalization to match different formats (e.g., +34612345678 = 612345678)
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
      const phoneMatch = await db
        .select({ contactId: contacts.contactId })
        .from(contacts)
        .where(
          and(
            eq(contacts.accountId, accountId),
            eq(contacts.isActive, true),
            or(
              sql`REGEXP_REPLACE(${contacts.phone}, '[^0-9]', '', 'g') LIKE '%' || ${normalizedPhone}`,
              sql`REGEXP_REPLACE(${contacts.secondaryPhone}, '[^0-9]', '', 'g') LIKE '%' || ${normalizedPhone}`,
            ),
          ),
        )
        .limit(1);

      if (phoneMatch.length > 0) {
        return phoneMatch[0] ?? null;
      }
    }

    return null;
  } catch (error) {
    console.error("[Idealista Leads] Error finding existing contact:", error);
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
    console.error("[Idealista Leads] Error checking listing_contact:", error);
    return false;
  }
}

/**
 * Check if a listing_contact_activity already exists for a specific Idealista lead ID
 */
async function listingContactActivityExists(
  listingContactId: bigint,
  idealistaLeadId: string,
): Promise<boolean> {
  const logger = getIdealistaLeadsLogger();
  try {
    const result = await db
      .select({ id: listingContactActivity.id })
      .from(listingContactActivity)
      .where(
        and(
          eq(listingContactActivity.listingContactId, listingContactId),
          sql`${listingContactActivity.details}->>'idealistaLeadId' = ${idealistaLeadId}`,
        ),
      )
      .limit(1);

    const exists = result.length > 0;
    if (exists) {
      logger.debug(`Activity already exists for lead ${idealistaLeadId} on listing_contact ${listingContactId.toString()}`);
    }
    return exists;
  } catch (error) {
    logger.error(`Error checking listing_contact_activity for lead ${idealistaLeadId}:`, error);
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
      `[Idealista Leads] Error finding listing by reference ${reference}:`,
      error,
    );
    return null;
  }
}

/**
 * Find the earliest lead date for a contact across all leads in the batch
 */
function findEarliestContactDate(
  leads: IdealistaLead[],
  email: string | null | undefined,
  phone: string | null | undefined,
): string | null {
  const normalizedPhone = normalizePhone(phone);
  const trimmedEmail = email?.trim()?.toLowerCase();

  let earliestDate: string | null = null;

  for (const lead of leads) {
    const leadEmail = lead.senderEmail?.trim()?.toLowerCase();
    const leadPhone = normalizePhone(lead.phone);

    const emailMatch = trimmedEmail && leadEmail && leadEmail === trimmedEmail;
    const phoneMatch = normalizedPhone && leadPhone && leadPhone === normalizedPhone;

    if (emailMatch || phoneMatch) {
      if (!earliestDate || lead.emailDate < earliestDate) {
        earliestDate = lead.emailDate;
      }
    }
  }

  return earliestDate;
}

/**
 * Find the earliest lead date for a listing_contact across all leads in the batch
 */
function findEarliestListingContactDate(
  leads: IdealistaLead[],
  email: string | null | undefined,
  phone: string | null | undefined,
  listingReference: string,
): string | null {
  const normalizedPhone = normalizePhone(phone);
  const trimmedEmail = email?.trim()?.toLowerCase();

  let earliestDate: string | null = null;

  for (const lead of leads) {
    if (lead.propertyReference !== listingReference) continue;

    const leadEmail = lead.senderEmail?.trim()?.toLowerCase();
    const leadPhone = normalizePhone(lead.phone);

    const emailMatch = trimmedEmail && leadEmail && leadEmail === trimmedEmail;
    const phoneMatch = normalizedPhone && leadPhone && leadPhone === normalizedPhone;

    if (emailMatch || phoneMatch) {
      if (!earliestDate || lead.emailDate < earliestDate) {
        earliestDate = lead.emailDate;
      }
    }
  }

  return earliestDate;
}

/**
 * Import a single Idealista lead
 */
export async function importIdealistaLead(
  accountId: bigint,
  lead: IdealistaLead,
  allLeads?: IdealistaLead[],
): Promise<ImportIdealistaLeadResult> {
  const logger = getIdealistaLeadsLogger();

  try {
    logger.debug(`Processing lead ${lead.id}`, {
      reference: lead.propertyReference,
      hasEmail: !!lead.senderEmail,
      hasPhone: !!lead.phone,
    });

    // Check for duplicate using gmailMessageId
    const alreadyImported = await isIdealistaLeadImported(accountId, lead.gmailMessageId);
    if (alreadyImported) {
      logger.debug(`Lead ${lead.id} already imported (gmailMessageId: ${lead.gmailMessageId}), skipping`);
      return {
        success: true,
        skipped: true,
        skipReason: "Lead already imported (same gmailMessageId)",
      };
    }

    // Skip leads without valid contact info
    if (!hasValidContactInfo(lead)) {
      logger.warn(`Skipping lead ${lead.id}: no valid email or phone`);
      return {
        success: true,
        skipped: true,
        skipReason: "No valid contact info (missing email and phone)",
      };
    }

    // Parse contact name
    const { firstName, lastName } = parseName(lead.senderName);
    const source = "idealista";

    // Build additionalInfo with Idealista metadata
    const additionalInfo = buildLeadAdditionalInfo(lead);

    // Check if contact already exists by email or phone
    const existingContactMatch = await findExistingContact(
      accountId,
      lead.senderEmail,
      lead.phone,
    );

    let contactId: bigint;
    let contactCreated = false;

    if (existingContactMatch) {
      // Use existing contact
      contactId = existingContactMatch.contactId;
      logger.info(`Found existing contact ${contactId.toString()} for lead ${lead.id}`);

      // Fetch full contact for enrichment
      const [existingContact] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.contactId, contactId))
        .limit(1);

      if (!existingContact) {
        throw new Error(`Contact ${contactId.toString()} not found after match`);
      }

      // Build enrichment updates
      const enrichmentUpdates: Partial<typeof contacts.$inferInsert> = {};

      // Upgrade from generic name
      if (existingContact.firstName === 'Lead' && lead.senderName) {
        const { firstName: newFirstName, lastName: newLastName } = parseName(lead.senderName);
        enrichmentUpdates.firstName = newFirstName;
        enrichmentUpdates.lastName = newLastName;
      }

      // Add email if missing
      if (!existingContact.email && lead.senderEmail) {
        enrichmentUpdates.email = lead.senderEmail;
      }

      // Add secondary phone if different
      const normalizedNewPhone = normalizePhone(lead.phone);
      const normalizedPrimary = normalizePhone(existingContact.phone);
      const normalizedSecondary = normalizePhone(existingContact.secondaryPhone);

      if (normalizedNewPhone &&
          normalizedNewPhone !== normalizedPrimary &&
          normalizedNewPhone !== normalizedSecondary &&
          !existingContact.secondaryPhone) {
        const prefix = extractPhonePrefix(lead.phone);
        enrichmentUpdates.secondaryPhone = normalizedNewPhone;
        enrichmentUpdates.secondaryPhonePrefix = prefix;
      }

      // Merge additionalInfo
      const existingAdditionalInfo = existingContact.additionalInfo as Record<string, unknown> | null | undefined;
      const mergedAdditionalInfo = mergeAdditionalInfo(
        existingAdditionalInfo ?? null,
        additionalInfo,
      );

      // Update contact
      await db
        .update(contacts)
        .set({
          additionalInfo: mergedAdditionalInfo,
          updatedAt: new Date(),
          ...enrichmentUpdates,
        })
        .where(eq(contacts.contactId, contactId));

      if (Object.keys(enrichmentUpdates).length > 0) {
        logger.debug(`Updated contact ${contactId.toString()} with enrichment`, enrichmentUpdates);
      }
    } else {
      // Extract phone prefix and number
      const phonePrefix = extractPhonePrefix(lead.phone);
      const phoneNumber = normalizePhone(lead.phone);

      // Find the earliest lead date for this contact
      const earliestDate = allLeads
        ? findEarliestContactDate(allLeads, lead.senderEmail, lead.phone)
        : null;
      const contactCreatedAt = earliestDate ? new Date(earliestDate) : new Date(lead.emailDate);

      // Create new contact
      const [newContact] = await db
        .insert(contacts)
        .values({
          accountId,
          firstName,
          lastName,
          email: lead.senderEmail ?? null,
          phone: phoneNumber ?? null,
          phonePrefix,
          source,
          additionalInfo,
          isActive: true,
          createdAt: contactCreatedAt,
        })
        .returning();

      if (!newContact) {
        throw new Error("Failed to create contact");
      }

      contactId = newContact.contactId;
      contactCreated = true;
      logger.info(`Created new contact ${contactId.toString()} for lead ${lead.id}`, {
        firstName,
        lastName,
        email: lead.senderEmail,
        phone: lead.phone,
        source,
      });

      // Log contact creation activity
      try {
        const systemUserId = await getSystemUserIdForAccount(accountId);
        if (systemUserId) {
          const activityLeadDate = earliestDate ?? lead.emailDate;
          await logContactCreated({
            contactId,
            userId: systemUserId,
            source,
            accountId: Number(accountId),
            leadDate: activityLeadDate,
          });
        } else {
          logger.warn(
            `Skipping contact_activity log for contact ${contactId.toString()} - no system user found`,
          );
        }
      } catch (activityError) {
        logger.debug(`Failed to log contact_activity for contact ${contactId.toString()}`, activityError);
      }
    }

    const result: ImportIdealistaLeadResult = {
      success: true,
      contactId,
      contactCreated,
      contactUpdated: !contactCreated,
    };

    // Create listing_contact using property reference
    if (lead.propertyReference) {
      // Find listing by reference number
      const listingMatch = await findListingByReference(accountId, lead.propertyReference);

      if (!listingMatch) {
        logger.warn(`Listing not found for reference ${lead.propertyReference} - skipping listing_contact creation`);
      } else {
        const listingId = listingMatch.listingId;

        // Verify listing exists
        const listing = await getListingById(Number(listingId), Number(accountId));

        if (!listing) {
          logger.warn(`Listing ${listingId.toString()} does not exist - skipping listing_contact creation`);
        } else {
          // Check if listing_contact already exists
          const lcExists = await listingContactExists(contactId, listingId);

          let listingContactId: bigint | undefined;

          if (lcExists) {
            result.listingContactSkipped = true;
            logger.debug(`listing_contact already exists for contact ${contactId.toString()} + listing ${listingId.toString()}`);

            // Fetch existing listing_contact ID for activity logging
            const [existingListingContact] = await db
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

            listingContactId = existingListingContact?.listingContactId;
          } else {
            // Determine status based on message content
            const contactStatus = determineContactStatus(lead.message);

            // Find earliest lead date for this listing_contact
            const earliestDate = allLeads
              ? findEarliestListingContactDate(allLeads, lead.senderEmail, lead.phone, lead.propertyReference)
              : null;
            const listingContactCreatedAt = earliestDate ? new Date(earliestDate) : new Date(lead.emailDate);

            // Create new listing_contact
            const [newListingContact] = await db
              .insert(listingContacts)
              .values({
                listingId,
                contactId,
                contactType: "buyer",
                source,
                status: contactStatus,
                isActive: true,
                createdAt: listingContactCreatedAt,
              })
              .returning();

            if (newListingContact) {
              listingContactId = newListingContact.listingContactId;
              result.listingContactId = listingContactId;
              result.listingContactCreated = true;
              logger.info(`Created listing_contact ${listingContactId.toString()} for listing ${listingId.toString()}`, {
                contactId: contactId.toString(),
                contactType: "buyer",
                source,
                status: contactStatus,
                reference: lead.propertyReference,
              });
            }
          }

          // Log listing_contact_activity
          if (listingContactId) {
            try {
              const activityExists = await listingContactActivityExists(listingContactId, lead.id);
              if (activityExists) {
                logger.debug(`Activity for lead ${lead.id} already exists, skipping`);
              } else {
                const systemUserId = await getSystemUserIdForAccount(accountId);
                if (!systemUserId) {
                  logger.warn(
                    `Skipping listing_contact_activity log for listing_contact ${listingContactId.toString()} - no system user found`,
                  );
                } else {
                  await logListingContactActivity({
                    listingContactId,
                    userId: systemUserId,
                    action: "message_received",
                    details: {
                      notes: lead.message ?? `Lead recibido desde Idealista`,
                      topic: "Mensaje Idealista",
                      activityType: "mail",
                      isPending: true,
                      createdAt: lead.emailDate,
                      idealistaLeadId: lead.id,
                      idealistaAdCode: lead.idealistaAdCode,
                    },
                    createdAt: lead.emailDate,
                  });
                }
              }
            } catch (activityError) {
              logger.debug(`Failed to log listing_contact_activity for listing_contact ${listingContactId.toString()}`, activityError);
            }
          }
        }
      }
    }

    logger.info(`Imported lead ${lead.id} → contact ${contactId.toString()} (${contactCreated ? "new" : "existing"})`);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error importing lead ${lead.id}`, errorMessage);
    logger.debug("Error details", error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Import multiple Idealista leads for an account
 */
export async function importIdealistaLeads(
  accountId: bigint,
  leads: IdealistaLead[],
): Promise<ImportIdealistaLeadsSummary> {
  const result: ImportIdealistaLeadsSummary = {
    total: leads.length,
    imported: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
    contactsCreated: 0,
    contactsUpdated: 0,
    createdContactIds: [],
  };

  for (const lead of leads) {
    const importResult = await importIdealistaLead(accountId, lead, leads);

    if (importResult.success) {
      if (importResult.skipped) {
        result.skipped++;
      } else {
        result.imported++;
        if (importResult.contactCreated) {
          result.contactsCreated++;
          if (importResult.contactId) {
            result.createdContactIds.push(importResult.contactId);
          }
        }
        if (importResult.contactUpdated) {
          result.contactsUpdated++;
        }
      }
    } else {
      result.errors++;
      if (importResult.error) {
        result.errorDetails.push(`Lead ${lead.id}: ${importResult.error}`);
      }
    }
  }

  return result;
}
