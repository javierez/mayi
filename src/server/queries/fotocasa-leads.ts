"use server";

import { db } from "../db";
import { contacts, listingContacts, listings, properties, users, userRoles } from "../db/schema";
import { eq, and, sql, or } from "drizzle-orm";
import type { FotocasaLead, ImportLeadResult } from "~/types/fotocasa-leads";
import {
  mapSiteToSource,
  parseName,
  buildLeadAdditionalInfo,
  normalizePhone,
  hasValidContactInfo,
  extractPhonePrefix,
  mergeAdditionalInfo,
  determineContactStatus,
} from "../services/fotocasa-leads-service";
import { getFotocasaLeadsLogger } from "~/server/utils/fotocasa-leads-logger";
import { getListingById } from "../queries/listing";
import { logContactCreated, logListingContactActivity } from "./log-activity";

/**
 * Get a system user ID for automated activities (Fotocasa leads, portal syncs, etc.)
 * 
 * Priority:
 * 1. User with role 3 (Account Admin) - preferred for system activities
 * 2. Any active user in the account - fallback
 * 
 * This ensures we always have a valid user_id for activity logging foreign keys.
 * 
 * @param accountId - The account ID to find a system user for
 * @returns User ID string, or null if no users found (shouldn't happen in practice)
 */
export async function getSystemUserIdForAccount(
  accountId: bigint,
): Promise<string | null> {
  try {
    // First, try to find a user with role 3 (Account Admin)
    const [accountAdmin] = await db
      .select({ userId: users.id })
      .from(users)
      .innerJoin(userRoles, eq(users.id, userRoles.userId))
      .where(
        and(
          eq(users.accountId, accountId),
          eq(users.isActive, true),
          eq(userRoles.roleId, BigInt(3)), // Account Admin role
          eq(userRoles.isActive, true),
        ),
      )
      .limit(1);

    if (accountAdmin) {
      return accountAdmin.userId;
    }

    // Fallback: get any active user in the account
    const [anyUser] = await db
      .select({ userId: users.id })
      .from(users)
      .where(
        and(eq(users.accountId, accountId), eq(users.isActive, true)),
      )
      .limit(1);

    if (anyUser) {
      return anyUser.userId;
    }

    // No users found - this shouldn't happen in practice but handle gracefully
    const logger = getFotocasaLeadsLogger();
    logger.warn(
      `No active users found for account ${accountId.toString()} - cannot log activities`,
    );
    return null;
  } catch (error) {
    const logger = getFotocasaLeadsLogger();
    logger.error(
      `Error finding system user for account ${accountId.toString()}:`,
      error,
    );
    return null;
  }
}

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

    // Then try normalized phone match (check both primary and secondary phone)
    if (normalizedPhone) {
      // Match phone numbers by comparing normalized versions
      // This handles +34612345678, 612 345 678, 612-345-678, etc.
      // Also checks secondary_phone to catch cases where same person uses different numbers
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
  const logger = getFotocasaLeadsLogger();
  
  try {
    logger.debug(`Processing lead ${lead.id}`, {
      type: lead.type,
      site: lead.site,
      reference: lead.reference,
      hasEmail: !!lead.contactDetails.email,
      hasPhone: !!lead.contactDetails.phone,
    });

    // Check for duplicate using fotocasaLeadId (same Fotocasa lead)
    const alreadyImported = await isFotocasaLeadImported(accountId, lead.id);
    if (alreadyImported) {
      logger.debug(`Lead ${lead.id} already imported, skipping`);
      return {
        success: true,
        skipped: true,
        skipReason: "Lead already imported (same fotocasaLeadId)",
      };
    }

    // Skip leads without valid contact info (no email AND no phone)
    if (!hasValidContactInfo(lead)) {
      logger.warn(`Skipping lead ${lead.id}: no valid email or phone`);
      return {
        success: true,
        skipped: true,
        skipReason: "No valid contact info (missing email and phone)",
      };
    }

    // Parse contact name (handle optional name field)
    const { firstName, lastName } = parseName(lead.contactDetails.name ?? "");
    const source = mapSiteToSource(lead.site);

    // Build additionalInfo with Fotocasa metadata
    const additionalInfo = buildLeadAdditionalInfo(lead);

    // Check if contact already exists by email or phone
    const existingContactMatch = await findExistingContact(
      accountId,
      lead.contactDetails.email,
      lead.contactDetails.phone,
    );

    let contactId: bigint;
    let contactCreated = false;

    if (existingContactMatch) {
      // Use existing contact - fetch full contact data for enrichment
      contactId = existingContactMatch.contactId;
      logger.info(`Found existing contact ${contactId.toString()} for lead ${lead.id}`);

      // Fetch full contact to check what needs enrichment
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

      // Upgrade from generic "Lead Fotocasa" name
      if (existingContact.firstName === 'Lead' && lead.contactDetails.name) {
        const { firstName: newFirstName, lastName: newLastName } = parseName(lead.contactDetails.name);
        enrichmentUpdates.firstName = newFirstName;
        enrichmentUpdates.lastName = newLastName;
      }

      // Add email if missing
      if (!existingContact.email && lead.contactDetails.email) {
        enrichmentUpdates.email = lead.contactDetails.email;
      }

      // Add secondary phone if different from both primary and existing secondary
      const normalizedNewPhone = normalizePhone(lead.contactDetails.phone);
      const normalizedPrimary = normalizePhone(existingContact.phone);
      const normalizedSecondary = normalizePhone(existingContact.secondaryPhone);

      if (normalizedNewPhone && 
          normalizedNewPhone !== normalizedPrimary &&
          normalizedNewPhone !== normalizedSecondary &&
          !existingContact.secondaryPhone) {
        const secondaryPhoneData = extractPhonePrefix(lead.contactDetails.phone);
        enrichmentUpdates.secondaryPhone = secondaryPhoneData.number;
        enrichmentUpdates.secondaryPhonePrefix = secondaryPhoneData.prefix;
      }

      // Update phone prefix if phone exists but prefix is missing
      if (existingContact.phone && !existingContact.phonePrefix) {
        const phoneData = extractPhonePrefix(existingContact.phone);
        enrichmentUpdates.phonePrefix = phoneData.prefix;
        // Optionally update phone to remove prefix if it still contains it
        if (existingContact.phone.includes("+") || existingContact.phone.startsWith("00")) {
          enrichmentUpdates.phone = phoneData.number;
        }
      }

      // Update secondary phone prefix if secondary phone exists but prefix is missing
      if (existingContact.secondaryPhone && !existingContact.secondaryPhonePrefix) {
        const secondaryPhoneData = extractPhonePrefix(existingContact.secondaryPhone);
        enrichmentUpdates.secondaryPhonePrefix = secondaryPhoneData.prefix;
        // Optionally update secondary phone to remove prefix if it still contains it
        if (existingContact.secondaryPhone.includes("+") || existingContact.secondaryPhone.startsWith("00")) {
          enrichmentUpdates.secondaryPhone = secondaryPhoneData.number;
        }
      }

      // Merge additionalInfo intelligently (preserve callTracking from CALL_TRACKING leads)
      const existingAdditionalInfo = existingContact.additionalInfo as Record<string, unknown> | null | undefined;
      const mergedAdditionalInfo = mergeAdditionalInfo(
        existingAdditionalInfo,
        additionalInfo,
        lead.type,
      );

      // Update contact with enrichment + additionalInfo
      const updateData: Partial<typeof contacts.$inferInsert> = {
        additionalInfo: mergedAdditionalInfo,
        updatedAt: new Date(),
        ...enrichmentUpdates,
      };

      await db
        .update(contacts)
        .set(updateData)
        .where(eq(contacts.contactId, contactId));
      
      if (Object.keys(enrichmentUpdates).length > 0) {
        logger.debug(`Updated contact ${contactId.toString()} with enrichment`, enrichmentUpdates);
      } else {
        logger.debug(`Updated contact ${contactId.toString()} additionalInfo`);
      }
    } else {
      // Extract phone prefix and number
      const phoneData = extractPhonePrefix(lead.contactDetails.phone);
      
      // Create new contact
      const [newContact] = await db
        .insert(contacts)
        .values({
          accountId,
          firstName,
          lastName,
          email: lead.contactDetails.email ?? null,
          phone: phoneData.number || null,
          phonePrefix: phoneData.prefix,
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
      logger.info(`Created new contact ${contactId.toString()} for lead ${lead.id}`, {
        firstName,
        lastName,
        email: lead.contactDetails.email,
        phone: lead.contactDetails.phone,
        source,
      });

      // Log contact creation activity
      try {
        const systemUserId = await getSystemUserIdForAccount(accountId);
        if (systemUserId) {
          await logContactCreated({
            contactId,
            userId: systemUserId,
            firstName,
            lastName,
            email: lead.contactDetails.email,
            phone: lead.contactDetails.phone,
            source,
            accountId: Number(accountId),
            channel: "portal",
            initialNotes: lead.message,
          });
        } else {
          logger.warn(
            `Skipping contact_activity log for contact ${contactId.toString()} - no system user found`,
          );
        }
      } catch (activityError) {
        // Log error but don't fail the import
        logger.debug(`Failed to log contact_activity for contact ${contactId.toString()}`, activityError);
      }
    }

    const result: ImportLeadResult = {
      success: true,
      contactId,
      contactCreated,
      contactUpdated: !contactCreated,
    };

    // Create listing_contact using reference directly as listingId
    if (lead.reference) {
      // Reference from API = listingId directly (convert to bigint)
      const listingId = BigInt(lead.reference);

      // First, verify that the listing exists in the database
      const listing = await getListingById(Number(listingId), Number(accountId));

      if (!listing) {
        logger.warn(`Listing ${listingId.toString()} does not exist - skipping listing_contact creation`, {
          reference: lead.reference,
          contactId: contactId.toString(),
        });
        // Continue without creating listing_contact - contact is still imported
      } else {
        // Check if listing_contact already exists for this contact + listing
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
          // Determine status based on lead type and message content
          const contactStatus = determineContactStatus(lead.type, lead.message);
          
          // Create new listing_contact using reference as listingId
          const [newListingContact] = await db
            .insert(listingContacts)
            .values({
              listingId: listingId,
              contactId,
              contactType: "buyer",
              source,
              status: contactStatus,
              isActive: true,
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
              reference: lead.reference,
            });
          }
        }

        // Log listing_contact_activity for every lead interaction
        if (listingContactId) {
          try {
            const systemUserId = await getSystemUserIdForAccount(accountId);
            if (!systemUserId) {
              logger.warn(
                `Skipping listing_contact_activity log for listing_contact ${listingContactId.toString()} - no system user found`,
              );
            } else {
              if (lead.type.includes('CALL')) {
                // For CALL types, use call_logged action
                const outcome = lead.contactDetails.attendedCall 
                  ? 'interested' as const
                  : 'no_answer' as const;
                
                await logListingContactActivity({
                  listingContactId,
                  userId: systemUserId,
                  action: "call_logged",
                  details: {
                    direction: "inbound" as const,
                    phoneNumber: lead.contactDetails.phone ?? "",
                    duration: lead.contactDetails.duration ?? 0,
                    outcome,
                    recordingUrl: lead.contactDetails.audioUrl,
                    nextSteps: lead.message ?? undefined,
                  },
                });
              } else {
                // For PROPERTY types, use message_received action
                await logListingContactActivity({
                  listingContactId,
                  userId: systemUserId,
                  action: "message_received",
                  details: {
                    channel: "portal" as const,
                    from: lead.contactDetails.name ?? lead.contactDetails.email ?? lead.contactDetails.phone ?? "Unknown",
                    content: lead.message ?? `Lead recibido desde ${lead.site}`,
                    requiresResponse: true,
                    relatedTo: lead.reference ? `Propiedad ${lead.reference}` : undefined,
                  },
                });
              }
            }
          } catch (activityError) {
            // Log error but don't fail the import
            logger.debug(`Failed to log listing_contact_activity for listing_contact ${listingContactId.toString()}`, activityError);
          }
        }
      }
    }

    logger.info(`Imported lead ${lead.id} → contact ${contactId.toString()} (${contactCreated ? "new" : "existing"})`);
    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error importing lead ${lead.id}`, errorMessage);
    logger.debug("Error details", error);
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
  contactsCreated: number;
  contactsUpdated: number;
  createdContactIds: bigint[];
}> {
  const result = {
    total: leads.length,
    imported: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [] as string[],
  };

  // Track database operations for summary
  const dbOperations = {
    contactsCreated: 0,
    contactsUpdated: 0,
    listingContactsCreated: 0,
    listingContactsSkipped: 0,
    duplicatesSkipped: 0,
    invalidContactSkipped: 0,
  };

  // Track contact IDs that were created (for notification linking)
  const createdContactIds: bigint[] = [];

  // Sort leads by type priority (PROPERTY first, then CALL_TRACKING_AD, then CALL_TRACKING)
  // This ensures contacts are created with rich data first, so subsequent leads find existing contacts
  const LEAD_TYPE_PRIORITY: Record<string, number> = {
    'PROPERTY': 3,        // Richest data (name, email, message)
    'CALL_TRACKING_AD': 2, // Has property reference
    'CALL_TRACKING': 1     // Phone only, no reference
  };

  const sortedLeads = [...leads].sort((a, b) => {
    const priorityA = LEAD_TYPE_PRIORITY[a.type] ?? 0;
    const priorityB = LEAD_TYPE_PRIORITY[b.type] ?? 0;
    return priorityB - priorityA; // Higher priority first
  });

  for (const lead of sortedLeads) {
    const importResult = await importFotocasaLead(accountId, lead);

    if (importResult.success) {
      if (importResult.skipped) {
        result.skipped++;
        // Track skip reasons
        if (importResult.skipReason?.includes("already imported")) {
          dbOperations.duplicatesSkipped++;
        } else if (importResult.skipReason?.includes("No valid contact")) {
          dbOperations.invalidContactSkipped++;
        }
      } else {
        result.imported++;
        // Track database operations
        if (importResult.contactCreated) {
          dbOperations.contactsCreated++;
          // Track contact ID for notification linking
          if (importResult.contactId) {
            createdContactIds.push(importResult.contactId);
          }
        }
        if (importResult.contactUpdated) {
          dbOperations.contactsUpdated++;
        }
        if (importResult.listingContactCreated) {
          dbOperations.listingContactsCreated++;
        }
        if (importResult.listingContactSkipped) {
          dbOperations.listingContactsSkipped++;
        }
      }
    } else {
      result.errors++;
      result.errorDetails.push(
        `Lead ${lead.id}: ${importResult.error ?? "Unknown error"}`,
      );
    }
  }

  // Log database operations summary
  const logger = getFotocasaLeadsLogger();
  logger.section("DATABASE OPERATIONS SUMMARY");
  logger.info(`Total leads processed: ${result.total}`);
  logger.info(`Successfully imported: ${result.imported}`);
  if (result.imported > 0) {
    logger.info(`  - Contacts created: ${dbOperations.contactsCreated}`);
    logger.info(`  - Contacts updated: ${dbOperations.contactsUpdated}`);
    logger.info(`  - Listing contacts created: ${dbOperations.listingContactsCreated}`);
    if (dbOperations.listingContactsSkipped > 0) {
      logger.info(`  - Listing contacts skipped (already exist): ${dbOperations.listingContactsSkipped}`);
    }
  }
  logger.info(`Skipped: ${result.skipped}`);
  if (result.skipped > 0) {
    logger.info(`  - Duplicates (already imported): ${dbOperations.duplicatesSkipped}`);
    logger.info(`  - Invalid contact info: ${dbOperations.invalidContactSkipped}`);
  }
  logger.info(`Errors: ${result.errors}`);
  if (result.errorDetails.length > 0) {
    logger.error("Error details", result.errorDetails);
  }

  return {
    ...result,
    contactsCreated: dbOperations.contactsCreated,
    contactsUpdated: dbOperations.contactsUpdated,
    createdContactIds: createdContactIds.length === 1 ? [createdContactIds[0]!] : createdContactIds,
  };
}
