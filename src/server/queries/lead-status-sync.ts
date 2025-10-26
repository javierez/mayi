"use server";

import { db } from "../db";
import { listingContacts, contacts } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUserAccountId } from "../../lib/dal";
import {
  type LeadStatus,
  APPOINTMENT_TO_LEAD_STATUS,
  DEFAULT_APPOINTMENT_LEAD_STATUS,
  APPOINTMENT_LEAD_SOURCE,
} from "../../lib/constants/lead-statuses";
import { createLeadWithAuth, updateLeadWithAuth } from "./lead";

/**
 * Find an existing lead for a contact+listing combination
 * PATTERN: Mirror auth patterns from lead.ts
 */
export async function findLeadByContactAndListing(
  contactId: bigint,
  listingId: bigint | undefined,
): Promise<{ listingContactId: bigint } | null> {
  try {
    // PATTERN: Always get account ID for security (see lead.ts patterns)
    const accountId = await getCurrentUserAccountId();

    const whereConditions = [
      eq(listingContacts.contactId, contactId),
      eq(contacts.accountId, BigInt(accountId)),
      eq(listingContacts.contactType, "buyer"),
    ];

    // Add listing condition if provided, otherwise look for leads with no listing
    if (listingId) {
      whereConditions.push(eq(listingContacts.listingId, listingId));
    } else {
      // Find leads with null listingId for this contact
      // This uses a different approach since we can't directly eq with null
      const [existingLead] = await db
        .select({ listingContactId: listingContacts.listingContactId })
        .from(listingContacts)
        .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
        .where(
          and(
            eq(listingContacts.contactId, contactId),
            eq(contacts.accountId, BigInt(accountId)),
            eq(listingContacts.contactType, "buyer"),
            eq(listingContacts.isActive, true),
          ),
        )
        .limit(1);

      return existingLead ?? null;
    }

    const [existingLead] = await db
      .select({ listingContactId: listingContacts.listingContactId })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(and(...whereConditions, eq(listingContacts.isActive, true)))
      .limit(1);

    return existingLead ?? null;
  } catch (error) {
    console.error("Error finding lead by contact and listing:", error);
    throw error;
  }
}

/**
 * Find existing lead or create new one for appointment
 * PATTERN: Use auth wrapper functions (see lead.ts)
 */
export async function findOrCreateLeadForAppointment(
  contactId: bigint,
  listingId: bigint | undefined,
  prospectId: bigint | undefined,
): Promise<{ listingContactId: bigint; created: boolean }> {
  try {
    // CRITICAL: Check for existing lead by contact+listing combination
    const existingLead = await findLeadByContactAndListing(
      contactId,
      listingId,
    );

    if (existingLead) {
      return { listingContactId: existingLead.listingContactId, created: false };
    }

    // PATTERN: Use auth wrapper for database operations (see lead.ts)
    const newLead = await createLeadWithAuth({
      contactId,
      listingId,
      prospectId,
      contactType: "buyer",
      status: "Cita Pendiente", // Set correct status immediately for appointment-created leads
      source: APPOINTMENT_LEAD_SOURCE,
      isActive: true,
    });

    if (!newLead?.listing_contacts?.listingContactId) {
      throw new Error("Failed to create new lead - no listingContactId returned");
    }

    console.log("🆕 Created new lead for appointment:", {
      listingContactId: newLead.listing_contacts.listingContactId.toString(),
      contactId: contactId.toString(),
      listingId: listingId?.toString(),
      status: DEFAULT_APPOINTMENT_LEAD_STATUS,
    });

    return { listingContactId: newLead.listing_contacts.listingContactId, created: true };
  } catch (error) {
    console.error("Error finding or creating lead for appointment:", error);
    throw error;
  }
}

/**
 * Sync lead status based on appointment status change
 * PATTERN: Follow same structure as existing lead functions
 */
export async function syncLeadStatusFromAppointment(
  listingContactId: bigint,
  appointmentStatus: string,
): Promise<void> {
  try {
    // Map appointment status to lead status
    const newLeadStatus = APPOINTMENT_TO_LEAD_STATUS[appointmentStatus];

    if (!newLeadStatus) {
      console.warn(
        `No lead status mapping found for appointment status: ${appointmentStatus}`,
      );
      return;
    }

    // PATTERN: Use auth wrapper for updates (see lead.ts)
    await updateLeadWithAuth(Number(listingContactId), {
      status: newLeadStatus,
    });

    console.log("🔄 Synced lead status from appointment:", {
      listingContactId: listingContactId.toString(),
      appointmentStatus,
      newLeadStatus,
    });
  } catch (error) {
    console.error("Error syncing lead status from appointment:", error);
    throw error;
  }
}

/**
 * Update lead status based on visit outcome
 * Used when visit is recorded to advance lead through workflow
 */
export async function updateLeadStatusFromVisitOutcome(
  listingContactId: bigint,
  visitOutcome: "offer_made" | "info_needed",
): Promise<void> {
  try {
    const newStatus: LeadStatus =
      visitOutcome === "offer_made" ? "Oferta Pendiente" : "Cita Pendiente";

    // PATTERN: Use auth wrapper for updates (see lead.ts)
    await updateLeadWithAuth(Number(listingContactId), {
      status: newStatus,
    });

    console.log("📋 Updated lead status from visit outcome:", {
      listingContactId: listingContactId.toString(),
      visitOutcome,
      newStatus,
    });
  } catch (error) {
    console.error("Error updating lead status from visit outcome:", error);
    throw error;
  }
}
