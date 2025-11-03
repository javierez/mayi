"use server";

import { db } from "~/server/db";
import {
  contacts,
  listings,
  properties,
  listingContacts,
  deals,
  tasks,
  appointments,
  users,
} from "~/server/db/schema";
import { eq, and, lte, gte, sql, isNotNull, desc } from "drizzle-orm";
import { getCurrentUser } from "~/lib/dal";

// Interfaces for return types
export interface AgentSummaryStats {
  activeListingsCount: number;
  contactsCount: number;
  dealsCount: number;
  tasksCount: number;
  appointmentsCount: number;
}

export interface AgentContactOwner {
  contactId: bigint;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  // Priority counts for intelligent sorting
  offersAcceptedCount?: number;
  pendingOffersCount?: number;
  rejectedOffersCount?: number;
  upcomingVisitsCount?: number;
  completedVisitsCount?: number;
  missedVisitsCount?: number;
  cancelledVisitsCount?: number;
  inactiveContactsCount?: number;
}

export interface AgentListing {
  listingId: bigint;
  propertyId: bigint;
  title: string | null;
  street: string | null;
  addressDetails: string | null;
  price: string;
  status: string;
  listingType: string;
  isActive: boolean | null;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
}

export interface AgentListingContact {
  listingContactId: bigint;
  listingId: bigint | null;
  contactId: bigint;
  contactType: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  offer: number | null;
  offerAccepted: boolean | null;
  hasUpcomingVisit: boolean;
  hasMissedVisit: boolean;
  hasCompletedVisit: boolean;
  hasCancelledVisit: boolean;
  visitCount: number;
  hasOffer: boolean;
  createdAt: Date;
  upcomingAppointmentId: bigint | null;
}

export interface AgentTask {
  taskId: bigint;
  title: string;
  description: string;
  dueDate: Date | null;
  completed: boolean | null;
  listingId: bigint | null;
  listingContactId: bigint | null;
  dealId: bigint | null;
  appointmentId: bigint | null;
  entityName: string | null;
}

export interface AgentAppointment {
  appointmentId: bigint;
  datetimeStart: Date;
  datetimeEnd: Date;
  status: string;
  type: string | null;
  contactName: string;
  propertyAddress: string | null;
  listingId: bigint | null;
}

export interface UrgentAgentAction {
  type: "task" | "appointment";
  id: bigint;
  title: string;
  description?: string;
  dueDate?: Date;
  datetimeStart?: Date;
  datetimeEnd?: Date;
  status: string;
  entityName?: string;
  entityContactId?: bigint;
  listingTitle?: string;
  listingId?: bigint;
  contactId?: bigint;
  contactFirstName?: string;
  contactLastName?: string;
  propertyTitle?: string;
  propertyAddress?: string;
  daysUntilDue?: number;
  isOverdue?: boolean;
  urgency?: number;
  category?: string;
  completed?: boolean;
  userId?: string;
  userName?: string;
  userFirstName?: string;
  userLastName?: string;
}

/**
 * Get summary statistics for an agent
 * @param userId - The agent's user ID
 * @param accountId - The account ID
 */
export async function getAgentSummaryStats(
  userId: string,
  accountId: bigint,
): Promise<AgentSummaryStats> {
  try {
    // Active listings count (where agent is assigned, status != 'Draft', isActive = true)
    const activeListingsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(listings)
      .where(
        and(
          eq(listings.accountId, accountId),
          eq(listings.agentId, userId),
          eq(listings.isActive, true),
          sql`${listings.status} != 'Draft'`,
        ),
      );

    // Contacts count (contacts that are owners of agent's listings)
    const contactsResult = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${contacts.contactId})` })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .innerJoin(listings, eq(listingContacts.listingId, listings.listingId))
      .where(
        and(
          eq(contacts.accountId, accountId),
          eq(listings.agentId, userId),
          eq(listingContacts.contactType, "owner"),
        ),
      );

    // Deals count (deals for agent's listings)
    const dealsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(deals)
      .innerJoin(listings, eq(deals.listingId, listings.listingId))
      .where(
        and(eq(listings.accountId, accountId), eq(listings.agentId, userId)),
      );

    // Tasks count (assigned to agent)
    const tasksResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.isActive, true),
          eq(tasks.completed, false),
        ),
      );

    // Appointments count (assigned to agent)
    const appointmentsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(appointments)
      .where(
        and(
          eq(appointments.userId, userId),
          eq(appointments.isActive, true),
          sql`${appointments.status} != 'Cancelled'`,
        ),
      );

    return {
      activeListingsCount: activeListingsResult[0]?.count ?? 0,
      contactsCount: contactsResult[0]?.count ?? 0,
      dealsCount: dealsResult[0]?.count ?? 0,
      tasksCount: tasksResult[0]?.count ?? 0,
      appointmentsCount: appointmentsResult[0]?.count ?? 0,
    };
  } catch (error) {
    console.error("Error fetching agent summary stats:", error);
    throw error;
  }
}

/**
 * Get contacts that are owners of agent's listings
 * @param userId - The agent's user ID
 * @param accountId - The account ID
 */
export async function getAgentContactsOwners(
  userId: string,
  accountId: bigint,
): Promise<AgentContactOwner[]> {
  try {
    // Get owners with activity metrics for intelligent ordering
    const ownersWithMetrics = await db
      .select({
        contactId: contacts.contactId,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone,
        // Count active listing contacts (leads/buyers interested in this owner's properties)
        activeLeadsCount: sql<number>`
          (SELECT COUNT(DISTINCT lc2.listing_contact_id)
           FROM listing_contacts lc2
           INNER JOIN listings l2 ON lc2.listing_id = l2.listing_id
           WHERE l2.listing_id IN (
             SELECT listing_id FROM listing_contacts
             WHERE contact_id = ${contacts.contactId} AND contact_type = 'owner'
           )
           AND lc2.contact_type IN ('buyer', 'viewer')
           AND lc2.is_active = true
          )
        `,
        // Count deals related to this owner's properties
        dealsCount: sql<number>`
          (SELECT COUNT(DISTINCT d.deal_id)
           FROM deals d
           INNER JOIN listings l3 ON d.listing_id = l3.listing_id
           INNER JOIN listing_contacts lc3 ON l3.listing_id = lc3.listing_id
           WHERE lc3.contact_id = ${contacts.contactId}
           AND lc3.contact_type = 'owner'
          )
        `,
        // Priority counts for sorting
        offersAcceptedCount: sql<number>`
          (SELECT COUNT(DISTINCT lc_offer_accepted.listing_contact_id)
           FROM listing_contacts lc_offer_accepted
           INNER JOIN listings l_offer_accepted ON lc_offer_accepted.listing_id = l_offer_accepted.listing_id
           WHERE l_offer_accepted.listing_id IN (
             SELECT listing_id FROM listing_contacts
             WHERE contact_id = ${contacts.contactId} AND contact_type = 'owner'
           )
           AND lc_offer_accepted.contact_type IN ('buyer', 'viewer')
           AND lc_offer_accepted.is_active = true
           AND lc_offer_accepted.offer_accepted = true
          )
        `,
        pendingOffersCount: sql<number>`
          (SELECT COUNT(DISTINCT lc_pending.listing_contact_id)
           FROM listing_contacts lc_pending
           INNER JOIN listings l_pending ON lc_pending.listing_id = l_pending.listing_id
           WHERE l_pending.listing_id IN (
             SELECT listing_id FROM listing_contacts
             WHERE contact_id = ${contacts.contactId} AND contact_type = 'owner'
           )
           AND lc_pending.contact_type IN ('buyer', 'viewer')
           AND lc_pending.is_active = true
           AND lc_pending.offer IS NOT NULL
           AND lc_pending.offer_accepted IS NULL
          )
        `,
        rejectedOffersCount: sql<number>`
          (SELECT COUNT(DISTINCT lc_rejected.listing_contact_id)
           FROM listing_contacts lc_rejected
           INNER JOIN listings l_rejected ON lc_rejected.listing_id = l_rejected.listing_id
           WHERE l_rejected.listing_id IN (
             SELECT listing_id FROM listing_contacts
             WHERE contact_id = ${contacts.contactId} AND contact_type = 'owner'
           )
           AND lc_rejected.contact_type IN ('buyer', 'viewer')
           AND lc_rejected.is_active = true
           AND lc_rejected.offer_accepted = false
          )
        `,
        upcomingVisitsCount: sql<number>`
          (SELECT COUNT(DISTINCT appt_upcoming.appointment_id)
           FROM appointments appt_upcoming
           WHERE appt_upcoming.listing_id IN (
             SELECT listing_id FROM listing_contacts
             WHERE contact_id = ${contacts.contactId} AND contact_type = 'owner'
           )
           AND appt_upcoming.is_active = true
           AND appt_upcoming.status = 'Scheduled'
           AND appt_upcoming.datetime_start > NOW()
          )
        `,
        completedVisitsCount: sql<number>`
          (SELECT COUNT(DISTINCT appt_completed.appointment_id)
           FROM appointments appt_completed
           WHERE appt_completed.listing_id IN (
             SELECT listing_id FROM listing_contacts
             WHERE contact_id = ${contacts.contactId} AND contact_type = 'owner'
           )
           AND appt_completed.is_active = true
           AND appt_completed.status = 'Completed'
          )
        `,
        missedVisitsCount: sql<number>`
          (SELECT COUNT(DISTINCT appt_missed.appointment_id)
           FROM appointments appt_missed
           WHERE appt_missed.listing_id IN (
             SELECT listing_id FROM listing_contacts
             WHERE contact_id = ${contacts.contactId} AND contact_type = 'owner'
           )
           AND appt_missed.is_active = true
           AND (
             (appt_missed.datetime_start < NOW() AND appt_missed.status = 'Scheduled')
             OR appt_missed.status = 'NoShow'
           )
          )
        `,
        cancelledVisitsCount: sql<number>`
          (SELECT COUNT(DISTINCT appt_cancelled.appointment_id)
           FROM appointments appt_cancelled
           WHERE appt_cancelled.listing_id IN (
             SELECT listing_id FROM listing_contacts
             WHERE contact_id = ${contacts.contactId} AND contact_type = 'owner'
           )
           AND appt_cancelled.is_active = true
           AND appt_cancelled.status = 'Cancelled'
          )
        `,
        inactiveContactsCount: sql<number>`
          (SELECT COUNT(DISTINCT lc_inactive.listing_contact_id)
           FROM listing_contacts lc_inactive
           INNER JOIN listings l_inactive ON lc_inactive.listing_id = l_inactive.listing_id
           WHERE l_inactive.listing_id IN (
             SELECT listing_id FROM listing_contacts
             WHERE contact_id = ${contacts.contactId} AND contact_type = 'owner'
           )
           AND lc_inactive.contact_type IN ('buyer', 'viewer')
           AND lc_inactive.is_active = false
          )
        `,
      })
      .from(contacts)
      .innerJoin(
        listingContacts,
        eq(listingContacts.contactId, contacts.contactId),
      )
      .innerJoin(listings, eq(listingContacts.listingId, listings.listingId))
      .where(
        and(
          eq(contacts.accountId, accountId),
          eq(listings.agentId, userId),
          eq(listingContacts.contactType, "owner"),
          eq(listingContacts.isActive, true),
        ),
      )
      .groupBy(
        contacts.contactId,
        contacts.firstName,
        contacts.lastName,
        contacts.email,
        contacts.phone,
      );

    // Log pre-sort data for debugging
    console.log("📊 [Agent Contacts] Pre-sort contact metrics:", {
      totalContacts: ownersWithMetrics.length,
      contacts: ownersWithMetrics.map((owner) => ({
        name: `${owner.firstName} ${owner.lastName}`,
        offersAccepted: owner.offersAcceptedCount,
        pendingOffers: owner.pendingOffersCount,
        upcomingVisits: owner.upcomingVisitsCount,
        missedVisits: owner.missedVisitsCount,
        cancelledVisits: owner.cancelledVisitsCount,
        rejectedOffers: owner.rejectedOffersCount,
        completedVisits: owner.completedVisitsCount,
        deals: owner.dealsCount,
        activeLeads: owner.activeLeadsCount,
      })),
    });

    // Sort by priority-based activity (highest urgency first)
    const sortedOwners = ownersWithMetrics.sort((a, b) => {
      let sortReason = "";

      // Priority 1: Offers Accepted (highest urgency - deals closing)
      if (a.offersAcceptedCount !== b.offersAcceptedCount) {
        sortReason = `Offers Accepted: ${b.offersAcceptedCount} vs ${a.offersAcceptedCount}`;
        console.log(
          `🔄 [Sort] ${b.firstName} ${b.lastName} > ${a.firstName} ${a.lastName} (${sortReason})`,
        );
        return b.offersAcceptedCount - a.offersAcceptedCount;
      }

      // Priority 2: Pending Offers (needs decision)
      if (a.pendingOffersCount !== b.pendingOffersCount) {
        sortReason = `Pending Offers: ${b.pendingOffersCount} vs ${a.pendingOffersCount}`;
        console.log(
          `🔄 [Sort] ${b.firstName} ${b.lastName} > ${a.firstName} ${a.lastName} (${sortReason})`,
        );
        return b.pendingOffersCount - a.pendingOffersCount;
      }

      // Priority 3: Upcoming Visits (scheduled engagement)
      if (a.upcomingVisitsCount !== b.upcomingVisitsCount) {
        sortReason = `Upcoming Visits: ${b.upcomingVisitsCount} vs ${a.upcomingVisitsCount}`;
        console.log(
          `🔄 [Sort] ${b.firstName} ${b.lastName} > ${a.firstName} ${a.lastName} (${sortReason})`,
        );
        return b.upcomingVisitsCount - a.upcomingVisitsCount;
      }

      // Priority 4: Missed Visits (requires follow-up)
      if (a.missedVisitsCount !== b.missedVisitsCount) {
        sortReason = `Missed Visits: ${b.missedVisitsCount} vs ${a.missedVisitsCount}`;
        console.log(
          `🔄 [Sort] ${b.firstName} ${b.lastName} > ${a.firstName} ${a.lastName} (${sortReason})`,
        );
        return b.missedVisitsCount - a.missedVisitsCount;
      }

      // Priority 5: Cancelled Visits (re-engagement needed)
      if (a.cancelledVisitsCount !== b.cancelledVisitsCount) {
        sortReason = `Cancelled Visits: ${b.cancelledVisitsCount} vs ${a.cancelledVisitsCount}`;
        console.log(
          `🔄 [Sort] ${b.firstName} ${b.lastName} > ${a.firstName} ${a.lastName} (${sortReason})`,
        );
        return b.cancelledVisitsCount - a.cancelledVisitsCount;
      }

      // Priority 6: Rejected Offers (potential re-negotiation)
      if (a.rejectedOffersCount !== b.rejectedOffersCount) {
        sortReason = `Rejected Offers: ${b.rejectedOffersCount} vs ${a.rejectedOffersCount}`;
        console.log(
          `🔄 [Sort] ${b.firstName} ${b.lastName} > ${a.firstName} ${a.lastName} (${sortReason})`,
        );
        return b.rejectedOffersCount - a.rejectedOffersCount;
      }

      // Priority 7: Completed Visits (awaiting next step)
      if (a.completedVisitsCount !== b.completedVisitsCount) {
        sortReason = `Completed Visits: ${b.completedVisitsCount} vs ${a.completedVisitsCount}`;
        console.log(
          `🔄 [Sort] ${b.firstName} ${b.lastName} > ${a.firstName} ${a.lastName} (${sortReason})`,
        );
        return b.completedVisitsCount - a.completedVisitsCount;
      }

      // Priority 8: Deals (existing tiebreaker)
      if (a.dealsCount !== b.dealsCount) {
        sortReason = `Deals: ${b.dealsCount} vs ${a.dealsCount}`;
        console.log(
          `🔄 [Sort] ${b.firstName} ${b.lastName} > ${a.firstName} ${a.lastName} (${sortReason})`,
        );
        return b.dealsCount - a.dealsCount;
      }

      // Priority 9: Active Leads (existing tiebreaker)
      if (a.activeLeadsCount !== b.activeLeadsCount) {
        sortReason = `Active Leads: ${b.activeLeadsCount} vs ${a.activeLeadsCount}`;
        console.log(
          `🔄 [Sort] ${b.firstName} ${b.lastName} > ${a.firstName} ${a.lastName} (${sortReason})`,
        );
        return b.activeLeadsCount - a.activeLeadsCount;
      }

      // Final tiebreaker: alphabetical by last name, then first name
      const lastNameCompare = a.lastName.localeCompare(b.lastName, "es");
      if (lastNameCompare !== 0) {
        console.log(
          `🔄 [Sort] Alphabetical by last name: ${a.lastName} vs ${b.lastName}`,
        );
        return lastNameCompare;
      }
      console.log(
        `🔄 [Sort] Alphabetical by first name: ${a.firstName} vs ${b.firstName}`,
      );
      return a.firstName.localeCompare(b.firstName, "es");
    });

    // Log final sorted order
    console.log("✅ [Agent Contacts] Final sorted order:", {
      totalContacts: sortedOwners.length,
      order: sortedOwners.map((owner, index) => ({
        position: index + 1,
        name: `${owner.firstName} ${owner.lastName}`,
        priorityCounts: {
          offersAccepted: owner.offersAcceptedCount,
          pendingOffers: owner.pendingOffersCount,
          upcomingVisits: owner.upcomingVisitsCount,
          missedVisits: owner.missedVisitsCount,
          cancelledVisits: owner.cancelledVisitsCount,
          rejectedOffers: owner.rejectedOffersCount,
          completedVisits: owner.completedVisitsCount,
          deals: owner.dealsCount,
          activeLeads: owner.activeLeadsCount,
        },
      })),
    });

    // Return with all fields including priority counts
    return sortedOwners.map(
      ({
        contactId,
        firstName,
        lastName,
        email,
        phone,
        offersAcceptedCount,
        pendingOffersCount,
        rejectedOffersCount,
        upcomingVisitsCount,
        completedVisitsCount,
        missedVisitsCount,
        cancelledVisitsCount,
        inactiveContactsCount,
      }) => ({
        contactId,
        firstName,
        lastName,
        email,
        phone,
        offersAcceptedCount,
        pendingOffersCount,
        rejectedOffersCount,
        upcomingVisitsCount,
        completedVisitsCount,
        missedVisitsCount,
        cancelledVisitsCount,
        inactiveContactsCount,
      }),
    );
  } catch (error) {
    console.error("Error fetching agent contact owners:", error);
    throw error;
  }
}

/**
 * Get agent's assigned listings with property and owner details
 * @param userId - The agent's user ID
 * @param accountId - The account ID
 */
export async function getAgentListingsWithDetails(
  userId: string,
  accountId: bigint,
): Promise<AgentListing[]> {
  try {
    const agentListings = await db
      .select({
        listingId: listings.listingId,
        propertyId: listings.propertyId,
        title: properties.title,
        street: properties.street,
        addressDetails: properties.addressDetails,
        price: listings.price,
        status: listings.status,
        listingType: listings.listingType,
        isActive: listings.isActive,
        ownerFirstName: contacts.firstName,
        ownerLastName: contacts.lastName,
        ownerEmail: contacts.email,
        ownerPhone: contacts.phone,
      })
      .from(listings)
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        listingContacts,
        and(
          eq(listingContacts.listingId, listings.listingId),
          eq(listingContacts.contactType, "owner"),
        ),
      )
      .leftJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listings.accountId, accountId),
          eq(listings.agentId, userId),
          eq(listings.isActive, true),
          sql`${listings.status} != 'Draft'`,
        ),
      )
      .orderBy(desc(listings.createdAt));

    return agentListings;
  } catch (error) {
    console.error("Error fetching agent listings with details:", error);
    throw error;
  }
}

/**
 * Get listing contacts for specified listings
 * @param listingIds - Array of listing IDs
 * @param accountId - The account ID
 */
export async function getAgentListingContacts(
  listingIds: bigint[],
  accountId: bigint,
): Promise<AgentListingContact[]> {
  try {
    if (listingIds.length === 0) {
      return [];
    }

    const listingContactsData = await db
      .select({
        listingContactId: listingContacts.listingContactId,
        listingId: listingContacts.listingId,
        contactId: listingContacts.contactId,
        contactType: listingContacts.contactType,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone,
        status: listingContacts.status,
        offer: listingContacts.offer,
        offerAccepted: listingContacts.offerAccepted,
        createdAt: contacts.createdAt,
        // Visit-related flags for status badges
        hasUpcomingVisit: sql<boolean>`EXISTS(
          SELECT 1 FROM appointments
          WHERE appointments.contact_id = ${listingContacts.contactId}
          AND appointments.listing_id = ${listingContacts.listingId}
          AND appointments.status = 'Scheduled'
          AND appointments.datetime_start > NOW()
          AND appointments.is_active = true
        )`,
        upcomingAppointmentId: sql<bigint | null>`(
          SELECT appointments.appointment_id
          FROM appointments
          WHERE appointments.contact_id = ${listingContacts.contactId}
          AND appointments.listing_id = ${listingContacts.listingId}
          AND appointments.status = 'Scheduled'
          AND appointments.datetime_start > NOW()
          AND appointments.is_active = true
          ORDER BY appointments.datetime_start ASC
          LIMIT 1
        )`,
        hasMissedVisit: sql<boolean>`EXISTS(
          SELECT 1 FROM appointments
          WHERE appointments.contact_id = ${listingContacts.contactId}
          AND appointments.listing_id = ${listingContacts.listingId}
          AND appointments.is_active = true
          AND (
            (appointments.status = 'Scheduled' AND appointments.datetime_start < NOW())
            OR appointments.status = 'NoShow'
          )
        )`,
        hasCompletedVisit: sql<boolean>`EXISTS(
          SELECT 1 FROM appointments
          WHERE appointments.contact_id = ${listingContacts.contactId}
          AND appointments.listing_id = ${listingContacts.listingId}
          AND appointments.status = 'Completed'
          AND appointments.is_active = true
        )`,
        hasCancelledVisit: sql<boolean>`EXISTS(
          SELECT 1 FROM appointments
          WHERE appointments.contact_id = ${listingContacts.contactId}
          AND appointments.listing_id = ${listingContacts.listingId}
          AND appointments.status = 'Cancelled'
          AND appointments.is_active = true
        )`,
        visitCount: sql<number>`(
          SELECT COUNT(*)
          FROM appointments
          WHERE appointments.contact_id = ${listingContacts.contactId}
          AND appointments.listing_id = ${listingContacts.listingId}
          AND appointments.is_active = true
        )`,
        hasOffer: sql<boolean>`${listingContacts.offer} IS NOT NULL`,
      })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(contacts.accountId, accountId),
          eq(listingContacts.isActive, true),
          sql`${listingContacts.listingId} IN (${sql.join(listingIds, sql`, `)})`,
        ),
      )
      .orderBy(listingContacts.listingId, contacts.lastName);

    return listingContactsData;
  } catch (error) {
    console.error("Error fetching agent listing contacts:", error);
    throw error;
  }
}

/**
 * Get tasks and appointments for an agent
 * @param userId - The agent's user ID
 * @param _accountId - The account ID (not used but kept for consistency)
 */
export async function getAgentTasksAndAppointments(
  userId: string,
  _accountId: bigint,
): Promise<{ tasks: AgentTask[]; appointments: AgentAppointment[] }> {
  try {
    // Get tasks
    const agentTasks = await db
      .select({
        taskId: tasks.taskId,
        title: tasks.title,
        description: tasks.description,
        dueDate: tasks.dueDate,
        completed: tasks.completed,
        listingId: tasks.listingId,
        listingContactId: tasks.listingContactId,
        dealId: tasks.dealId,
        appointmentId: tasks.appointmentId,
        // Get entity name from property address or contact name
        entityName: sql<string | null>`
          CASE
            WHEN ${tasks.listingId} IS NOT NULL THEN CONCAT(${properties.street}, ', ', ${properties.addressDetails})
            WHEN ${tasks.listingContactId} IS NOT NULL THEN CONCAT(${contacts.firstName}, ' ', ${contacts.lastName})
            WHEN ${tasks.dealId} IS NOT NULL THEN CONCAT(${properties.street}, ', ', ${properties.addressDetails})
            ELSE NULL
          END
        `,
      })
      .from(tasks)
      .leftJoin(listings, eq(tasks.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        listingContacts,
        eq(tasks.listingContactId, listingContacts.listingContactId),
      )
      .leftJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .leftJoin(deals, eq(tasks.dealId, deals.dealId))
      .where(and(eq(tasks.userId, userId), eq(tasks.isActive, true)))
      .orderBy(tasks.dueDate);

    // Get appointments
    const agentAppointments = await db
      .select({
        appointmentId: appointments.appointmentId,
        datetimeStart: appointments.datetimeStart,
        datetimeEnd: appointments.datetimeEnd,
        status: appointments.status,
        type: appointments.type,
        contactName: sql<string>`CONCAT(${contacts.firstName}, ' ', ${contacts.lastName})`,
        propertyAddress: sql<string | null>`
          CASE WHEN ${appointments.listingId} IS NOT NULL
          THEN CONCAT(${properties.street}, ', ', ${properties.addressDetails})
          ELSE NULL END
        `,
        listingId: appointments.listingId,
      })
      .from(appointments)
      .innerJoin(contacts, eq(appointments.contactId, contacts.contactId))
      .leftJoin(listings, eq(appointments.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(appointments.userId, userId),
          eq(appointments.isActive, true),
          sql`${appointments.status} != 'Cancelled'`,
        ),
      )
      .orderBy(appointments.datetimeStart);

    return {
      tasks: agentTasks,
      appointments: agentAppointments,
    };
  } catch (error) {
    console.error("Error fetching agent tasks and appointments:", error);
    throw error;
  }
}

/**
 * Get urgent actions for an agent (tasks due in next 5 working days and upcoming appointments)
 * @param userId - The agent's user ID
 * @param accountId - The account ID
 * @param workingDaysLimit - Number of working days to look ahead (default 5)
 */
export async function getUrgentAgentActions(
  userId: string,
  accountId: bigint,
  workingDaysLimit = 5,
): Promise<UrgentAgentAction[]> {
  try {
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() + Number(workingDaysLimit));

    // Get urgent tasks (due within working days or overdue)
    const directContacts = sql`direct_contacts`;
    const lcContacts = sql`lc_contacts`;
    const urgentTasks = await db
      .select({
        taskId: tasks.taskId,
        userId: tasks.userId,
        title: tasks.title,
        description: tasks.description,
        dueDate: tasks.dueDate,
        completed: tasks.completed,
        urgency: tasks.urgency,
        category: tasks.category,
        status: tasks.status,
        listingId: tasks.listingId,
        listingTitle: properties.title,
        propertyTitle: properties.title,
        propertyAddress: sql<string | null>`
          CASE WHEN ${tasks.listingId} IS NOT NULL
          THEN CONCAT(${properties.street}, ', ', ${properties.addressDetails})
          ELSE NULL END
        `,
        // User information
        userName: users.name,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        // Contact information - check both direct contact and listing contact
        contactId: sql<bigint | null>`
          CASE
            WHEN ${tasks.contactId} IS NOT NULL THEN ${tasks.contactId}
            WHEN ${tasks.listingContactId} IS NOT NULL THEN ${lcContacts}.contact_id
            ELSE NULL
          END
        `,
        contactFirstName: sql<string | null>`
          CASE
            WHEN ${tasks.contactId} IS NOT NULL THEN ${directContacts}.first_name
            WHEN ${tasks.listingContactId} IS NOT NULL THEN ${lcContacts}.first_name
            ELSE NULL
          END
        `,
        contactLastName: sql<string | null>`
          CASE
            WHEN ${tasks.contactId} IS NOT NULL THEN ${directContacts}.last_name
            WHEN ${tasks.listingContactId} IS NOT NULL THEN ${lcContacts}.last_name
            ELSE NULL
          END
        `,
        // Keep entityName for backward compatibility
        entityName: sql<string | null>`
          CASE
            WHEN ${tasks.contactId} IS NOT NULL THEN CONCAT(${directContacts}.first_name, ' ', ${directContacts}.last_name)
            WHEN ${tasks.listingContactId} IS NOT NULL THEN CONCAT(${lcContacts}.first_name, ' ', ${lcContacts}.last_name)
            ELSE NULL
          END
        `,
        entityContactId: sql<bigint | null>`
          CASE
            WHEN ${tasks.contactId} IS NOT NULL THEN ${tasks.contactId}
            WHEN ${tasks.listingContactId} IS NOT NULL THEN ${lcContacts}.contact_id
            ELSE NULL
          END
        `,
      })
      .from(tasks)
      .innerJoin(users, eq(tasks.userId, users.id))
      .leftJoin(listings, eq(tasks.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        listingContacts,
        eq(tasks.listingContactId, listingContacts.listingContactId),
      )
      .leftJoin(
        sql`contacts AS lc_contacts`,
        sql`${listingContacts.contactId} = ${lcContacts}.contact_id`,
      )
      .leftJoin(
        sql`contacts AS direct_contacts`,
        sql`${tasks.contactId} = ${directContacts}.contact_id`,
      )
      .leftJoin(deals, eq(tasks.dealId, deals.dealId))
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.isActive, true),
          eq(tasks.completed, false),
          isNotNull(tasks.dueDate),
          lte(tasks.dueDate, cutoffDate),
        ),
      )
      .orderBy(tasks.dueDate);

    // Get upcoming appointments
    const upcomingAppointments = await db
      .select({
        appointmentId: appointments.appointmentId,
        datetimeStart: appointments.datetimeStart,
        datetimeEnd: appointments.datetimeEnd,
        status: appointments.status,
        type: appointments.type,
        contactId: appointments.contactId,
        contactName: sql<string>`CONCAT(${contacts.firstName}, ' ', ${contacts.lastName})`,
        listingId: appointments.listingId,
        propertyAddress: sql<string | null>`
          CASE WHEN ${appointments.listingId} IS NOT NULL
          THEN CONCAT(${properties.street}, ', ', ${properties.addressDetails})
          ELSE NULL END
        `,
      })
      .from(appointments)
      .innerJoin(contacts, eq(appointments.contactId, contacts.contactId))
      .leftJoin(listings, eq(appointments.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(appointments.userId, userId),
          eq(appointments.isActive, true),
          sql`${appointments.status} != 'Cancelled'`,
          gte(appointments.datetimeStart, today),
          lte(appointments.datetimeStart, cutoffDate),
        ),
      )
      .orderBy(appointments.datetimeStart);

    // Combine and format results
    const urgentActions: UrgentAgentAction[] = [];

    // Add urgent tasks
    urgentTasks.forEach((task) => {
      const dueDate = task.dueDate!;
      const daysUntilDue = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      const isOverdue = daysUntilDue < 0;

      const action = {
        type: "task" as const,
        id: task.taskId,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate ?? undefined,
        status: task.status ?? (task.completed ? "completed" : isOverdue ? "overdue" : "pending"),
        entityName: task.entityName ?? undefined,
        entityContactId: task.entityContactId ?? undefined,
        listingTitle: task.listingTitle ?? undefined,
        listingId: task.listingId ?? undefined,
        contactId: task.contactId ?? undefined,
        contactFirstName: task.contactFirstName ?? undefined,
        contactLastName: task.contactLastName ?? undefined,
        propertyTitle: task.propertyTitle ?? undefined,
        propertyAddress: task.propertyAddress ?? undefined,
        urgency: task.urgency ?? undefined,
        category: task.category ?? undefined,
        completed: task.completed ?? false,
        userId: task.userId ?? undefined,
        userName: task.userName ?? undefined,
        userFirstName: task.userFirstName ?? undefined,
        userLastName: task.userLastName ?? undefined,
        daysUntilDue,
        isOverdue,
      };

      urgentActions.push(action);
    });

    // Add upcoming appointments
    upcomingAppointments.forEach((appt) => {
      urgentActions.push({
        type: "appointment",
        id: appt.appointmentId,
        title: `${appt.type ?? "Cita"} - ${appt.contactName}`,
        datetimeStart: appt.datetimeStart,
        datetimeEnd: appt.datetimeEnd,
        status: appt.status,
        entityName: appt.contactName,
        contactId: appt.contactId ?? undefined,
        listingId: appt.listingId ?? undefined,
        propertyAddress: appt.propertyAddress ?? undefined,
      });
    });

    // Sort by date (tasks by dueDate, appointments by datetimeStart)
    urgentActions.sort((a, b) => {
      const dateA = a.dueDate ?? a.datetimeStart;
      const dateB = b.dueDate ?? b.datetimeStart;
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });

    return urgentActions;
  } catch (error) {
    console.error("Error fetching urgent agent actions:", error);
    throw error;
  }
}

/**
 * Get list of all agents in account (for Account Admin dropdown)
 * @param accountId - The account ID
 */
export async function getAccountAgents(accountId: bigint) {
  try {
    const agents = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(and(eq(users.accountId, accountId), eq(users.isActive, true)))
      .orderBy(users.firstName, users.lastName);

    return agents;
  } catch (error) {
    console.error("Error fetching account agents:", error);
    throw error;
  }
}

// Auth wrapper functions that automatically get current user and account
export async function getAgentSummaryStatsWithAuth(
  selectedUserId?: string,
): Promise<AgentSummaryStats> {
  const user = await getCurrentUser();
  const userId = selectedUserId ?? user.id;
  return getAgentSummaryStats(userId, BigInt(user.accountId));
}

export async function getAgentContactsOwnersWithAuth(
  selectedUserId?: string,
): Promise<AgentContactOwner[]> {
  const user = await getCurrentUser();
  const userId = selectedUserId ?? user.id;
  return getAgentContactsOwners(userId, BigInt(user.accountId));
}

export async function getAgentListingsWithDetailsWithAuth(
  selectedUserId?: string,
): Promise<AgentListing[]> {
  const user = await getCurrentUser();
  const userId = selectedUserId ?? user.id;
  return getAgentListingsWithDetails(userId, BigInt(user.accountId));
}

export async function getAgentListingContactsWithAuth(
  listingIds: bigint[],
): Promise<AgentListingContact[]> {
  const user = await getCurrentUser();
  return getAgentListingContacts(listingIds, BigInt(user.accountId));
}

export async function getAgentTasksAndAppointmentsWithAuth(
  selectedUserId?: string,
): Promise<{ tasks: AgentTask[]; appointments: AgentAppointment[] }> {
  const user = await getCurrentUser();
  const userId = selectedUserId ?? user.id;
  return getAgentTasksAndAppointments(userId, BigInt(user.accountId));
}

export async function getUrgentAgentActionsWithAuth(
  selectedUserId?: string,
  workingDaysLimit = 5,
): Promise<UrgentAgentAction[]> {
  const user = await getCurrentUser();
  const userId = selectedUserId ?? user.id;
  return getUrgentAgentActions(userId, BigInt(user.accountId), workingDaysLimit);
}

export async function getAccountAgentsWithAuth() {
  const user = await getCurrentUser();
  return getAccountAgents(BigInt(user.accountId));
}
