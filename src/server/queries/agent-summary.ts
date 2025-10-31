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

    // Sort by activity: deals first, then active leads, then alphabetically
    const sortedOwners = ownersWithMetrics.sort((a, b) => {
      // First priority: contacts with deals
      if (a.dealsCount !== b.dealsCount) {
        return b.dealsCount - a.dealsCount;
      }
      // Second priority: contacts with active leads
      if (a.activeLeadsCount !== b.activeLeadsCount) {
        return b.activeLeadsCount - a.activeLeadsCount;
      }
      // Third priority: alphabetical by last name
      const lastNameCompare = a.lastName.localeCompare(b.lastName);
      if (lastNameCompare !== 0) return lastNameCompare;
      return a.firstName.localeCompare(b.firstName);
    });

    // Return only the contact fields (remove metrics)
    return sortedOwners.map(
      ({ contactId, firstName, lastName, email, phone }) => ({
        contactId,
        firstName,
        lastName,
        email,
        phone,
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
