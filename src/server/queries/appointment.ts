import { db } from "../db";
import {
  appointments,
  contacts,
  listings,
  properties,
  users,
} from "../db/schema";
import { eq, and, or, between, inArray, sql } from "drizzle-orm";
import type { Appointment } from "../../lib/data";
import { getCurrentUserAccountId } from "../../lib/dal";

// Wrapper functions that automatically get accountId from current session
export async function getAppointmentByIdWithAuth(appointmentId: number) {
  const accountId = await getCurrentUserAccountId();
  return getAppointmentByIdAndAccount(appointmentId, accountId);
}

export async function getUserAppointmentsWithAuth(userId: string) {
  const accountId = await getCurrentUserAccountId();
  return getUserAppointmentsByAccount(userId, accountId);
}

export async function getAppointmentsByDateRangeWithAuth(
  startDate: Date,
  endDate: Date,
) {
  const accountId = await getCurrentUserAccountId();
  return getAppointmentsByDateRangeAndAccount(startDate, endDate, accountId);
}

export async function updateAppointmentWithAuth(
  appointmentId: number,
  data: Omit<Partial<Appointment>, "appointmentId" | "createdAt" | "updatedAt">,
) {
  const accountId = await getCurrentUserAccountId();
  return updateAppointmentByAccount(appointmentId, accountId, data);
}

// Create a new appointment
export async function createAppointment(
  data: Omit<Appointment, "appointmentId" | "createdAt" | "updatedAt">,
) {
  try {
    const [result] = await db
      .insert(appointments)
      .values({
        ...data,
        isActive: true,
      })
      .returning();
    if (!result) throw new Error("Failed to create appointment");
    const [newAppointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.appointmentId, BigInt(result.appointmentId)));
    return newAppointment;
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }
}

// Get appointment by ID (without account filtering - for system use)
export async function getAppointmentById(appointmentId: number) {
  try {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.appointmentId, BigInt(appointmentId)),
          eq(appointments.isActive, true),
        ),
      );
    return appointment;
  } catch (error) {
    console.error("Error fetching appointment:", error);
    throw error;
  }
}

// Get appointment by ID and account (secure version)
export async function getAppointmentByIdAndAccount(
  appointmentId: number,
  accountId: number,
) {
  try {
    const [appointment] = await db
      .select()
      .from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .where(
        and(
          eq(appointments.appointmentId, BigInt(appointmentId)),
          eq(users.accountId, BigInt(accountId)),
          eq(appointments.isActive, true),
        ),
      );
    return appointment;
  } catch (error) {
    console.error("Error fetching appointment by ID and account:", error);
    throw error;
  }
}

// Get appointments by user ID with contact names and property address (without account filtering - for system use)
export async function getUserAppointments(userId: string) {
  try {
    const userAppointments = await db
      .select({
        appointmentId: appointments.appointmentId,
        userId: appointments.userId,
        contactId: appointments.contactId,
        listingId: appointments.listingId,
        listingContactId: appointments.listingContactId,
        dealId: appointments.dealId,
        prospectId: appointments.prospectId,
        datetimeStart: appointments.datetimeStart,
        datetimeEnd: appointments.datetimeEnd,
        tripTimeMinutes: appointments.tripTimeMinutes,
        status: appointments.status,
        notes: appointments.notes,
        type: appointments.type,
        isActive: appointments.isActive,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        // Add contact name from joined table
        contactFirstName: contacts.firstName,
        contactLastName: contacts.lastName,
        // Add property address from joined listings/properties tables
        propertyStreet: properties.street,
        // Add agent/user information
        agentName: users.name,
        agentFirstName: users.firstName,
        agentLastName: users.lastName,
      })
      .from(appointments)
      .leftJoin(contacts, eq(appointments.contactId, contacts.contactId))
      .leftJoin(listings, eq(appointments.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(users, eq(appointments.userId, users.id))
      .where(
        and(
          eq(appointments.userId, userId), // userId is now string
          eq(appointments.isActive, true),
        ),
      );
    return userAppointments;
  } catch (error) {
    console.error("Error fetching user appointments:", error);
    throw error;
  }
}

// Get appointments by user ID and account (secure version)
export async function getUserAppointmentsByAccount(
  userId: string,
  accountId: number,
) {
  try {
    const userAppointments = await db
      .select({
        appointmentId: appointments.appointmentId,
        userId: appointments.userId,
        contactId: appointments.contactId,
        listingId: appointments.listingId,
        listingContactId: appointments.listingContactId,
        dealId: appointments.dealId,
        prospectId: appointments.prospectId,
        datetimeStart: appointments.datetimeStart,
        datetimeEnd: appointments.datetimeEnd,
        tripTimeMinutes: appointments.tripTimeMinutes,
        status: appointments.status,
        notes: appointments.notes,
        type: appointments.type,
        isActive: appointments.isActive,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        // Add contact name from joined table
        contactFirstName: contacts.firstName,
        contactLastName: contacts.lastName,
        // Add property address from joined listings/properties tables
        propertyStreet: properties.street,
        // Add agent/user information
        agentName: users.name,
        agentFirstName: users.firstName,
        agentLastName: users.lastName,
      })
      .from(appointments)
      .leftJoin(contacts, eq(appointments.contactId, contacts.contactId))
      .leftJoin(listings, eq(appointments.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(users, eq(appointments.userId, users.id))
      .where(
        and(
          eq(appointments.userId, userId),
          eq(users.accountId, BigInt(accountId)),
          eq(appointments.isActive, true),
        ),
      );
    return userAppointments;
  } catch (error) {
    console.error("Error fetching user appointments by account:", error);
    throw error;
  }
}

// Get appointments by contact ID
export async function getContactAppointments(contactId: number) {
  try {
    const contactAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.contactId, BigInt(contactId)),
          eq(appointments.isActive, true),
        ),
      );
    return contactAppointments;
  } catch (error) {
    console.error("Error fetching contact appointments:", error);
    throw error;
  }
}

// Get appointments by listing ID
export async function getListingAppointments(listingId: number) {
  try {
    const listingAppointments = await db
      .select({
        appointmentId: appointments.appointmentId,
        userId: appointments.userId,
        contactId: appointments.contactId,
        listingId: appointments.listingId,
        listingContactId: appointments.listingContactId,
        dealId: appointments.dealId,
        prospectId: appointments.prospectId,
        datetimeStart: appointments.datetimeStart,
        datetimeEnd: appointments.datetimeEnd,
        tripTimeMinutes: appointments.tripTimeMinutes,
        status: appointments.status,
        notes: appointments.notes,
        type: appointments.type,
        isActive: appointments.isActive,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        // Add contact information from joined table
        contactFirstName: contacts.firstName,
        contactLastName: contacts.lastName,
        contactEmail: contacts.email,
      })
      .from(appointments)
      .leftJoin(contacts, eq(appointments.contactId, contacts.contactId))
      .where(
        and(
          eq(appointments.listingId, BigInt(listingId)),
          eq(appointments.isActive, true),
        ),
      );
    return listingAppointments;
  } catch (error) {
    console.error("Error fetching listing appointments:", error);
    throw error;
  }
}

// Get appointments by date range with contact names and property address (without account filtering - for system use)
export async function getAppointmentsByDateRange(
  startDate: Date,
  endDate: Date,
) {
  try {
    const dateRangeAppointments = await db
      .select({
        appointmentId: appointments.appointmentId,
        userId: appointments.userId,
        contactId: appointments.contactId,
        listingId: appointments.listingId,
        listingContactId: appointments.listingContactId,
        dealId: appointments.dealId,
        prospectId: appointments.prospectId,
        datetimeStart: appointments.datetimeStart,
        datetimeEnd: appointments.datetimeEnd,
        tripTimeMinutes: appointments.tripTimeMinutes,
        status: appointments.status,
        notes: appointments.notes,
        type: appointments.type,
        isActive: appointments.isActive,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        // Add contact name from joined table
        contactFirstName: contacts.firstName,
        contactLastName: contacts.lastName,
        // Add property address from joined listings/properties tables
        propertyStreet: properties.street,
        // Add agent/user information
        agentName: users.name,
        agentFirstName: users.firstName,
        agentLastName: users.lastName,
      })
      .from(appointments)
      .leftJoin(contacts, eq(appointments.contactId, contacts.contactId))
      .leftJoin(listings, eq(appointments.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(users, eq(appointments.userId, users.id))
      .where(
        and(
          or(
            between(appointments.datetimeStart, startDate, endDate),
            between(appointments.datetimeEnd, startDate, endDate),
          ),
          eq(appointments.isActive, true),
        ),
      );
    return dateRangeAppointments;
  } catch (error) {
    console.error("Error fetching appointments by date range:", error);
    throw error;
  }
}

// Get appointments by date range and account (secure version)
export async function getAppointmentsByDateRangeAndAccount(
  startDate: Date,
  endDate: Date,
  accountId: number,
) {
  try {
    const dateRangeAppointments = await db
      .select({
        appointmentId: appointments.appointmentId,
        userId: appointments.userId,
        contactId: appointments.contactId,
        listingId: appointments.listingId,
        listingContactId: appointments.listingContactId,
        dealId: appointments.dealId,
        prospectId: appointments.prospectId,
        datetimeStart: appointments.datetimeStart,
        datetimeEnd: appointments.datetimeEnd,
        tripTimeMinutes: appointments.tripTimeMinutes,
        status: appointments.status,
        notes: appointments.notes,
        type: appointments.type,
        isActive: appointments.isActive,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        // Add contact name from joined table
        contactFirstName: contacts.firstName,
        contactLastName: contacts.lastName,
        // Add property address from joined listings/properties tables
        propertyStreet: properties.street,
        // Add agent/user information
        agentName: users.name,
        agentFirstName: users.firstName,
        agentLastName: users.lastName,
      })
      .from(appointments)
      .leftJoin(contacts, eq(appointments.contactId, contacts.contactId))
      .leftJoin(listings, eq(appointments.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(users, eq(appointments.userId, users.id))
      .where(
        and(
          or(
            between(appointments.datetimeStart, startDate, endDate),
            between(appointments.datetimeEnd, startDate, endDate),
          ),
          eq(users.accountId, BigInt(accountId)),
          eq(appointments.isActive, true),
        ),
      );
    return dateRangeAppointments;
  } catch (error) {
    console.error(
      "Error fetching appointments by date range and account:",
      error,
    );
    throw error;
  }
}

// Get appointments by status
export async function getAppointmentsByStatus(status: Appointment["status"]) {
  try {
    const statusAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(eq(appointments.status, status), eq(appointments.isActive, true)),
      );
    return statusAppointments;
  } catch (error) {
    console.error("Error fetching appointments by status:", error);
    throw error;
  }
}

// Update appointment (without account filtering - for system use)
export async function updateAppointment(
  appointmentId: number,
  data: Omit<Partial<Appointment>, "appointmentId" | "createdAt" | "updatedAt">,
) {
  try {
    await db
      .update(appointments)
      .set(data)
      .where(
        and(
          eq(appointments.appointmentId, BigInt(appointmentId)),
          eq(appointments.isActive, true),
        ),
      );
    const [updatedAppointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.appointmentId, BigInt(appointmentId)));
    return updatedAppointment;
  } catch (error) {
    console.error("Error updating appointment:", error);
    throw error;
  }
}

// Update appointment by account (secure version)
export async function updateAppointmentByAccount(
  appointmentId: number,
  accountId: number,
  data: Omit<Partial<Appointment>, "appointmentId" | "createdAt" | "updatedAt">,
) {
  try {
    // First verify the appointment belongs to the account via user relationship
    const [existingAppointment] = await db
      .select({ appointmentId: appointments.appointmentId })
      .from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .where(
        and(
          eq(appointments.appointmentId, BigInt(appointmentId)),
          eq(users.accountId, BigInt(accountId)),
          eq(appointments.isActive, true),
        ),
      );

    if (!existingAppointment) {
      throw new Error("Appointment not found or access denied");
    }

    await db
      .update(appointments)
      .set(data)
      .where(
        and(
          eq(appointments.appointmentId, BigInt(appointmentId)),
          eq(appointments.isActive, true),
        ),
      );

    const [updatedAppointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.appointmentId, BigInt(appointmentId)));

    return updatedAppointment;
  } catch (error) {
    console.error("Error updating appointment by account:", error);
    throw error;
  }
}

// Soft delete appointment (set isActive to false)
export async function softDeleteAppointment(appointmentId: number) {
  try {
    await db
      .update(appointments)
      .set({ isActive: false })
      .where(eq(appointments.appointmentId, BigInt(appointmentId)));
    return { success: true };
  } catch (error) {
    console.error("Error soft deleting appointment:", error);
    throw error;
  }
}

// Hard delete appointment (remove from database)
export async function deleteAppointment(appointmentId: number) {
  try {
    await db
      .delete(appointments)
      .where(eq(appointments.appointmentId, BigInt(appointmentId)));
    return { success: true };
  } catch (error) {
    console.error("Error deleting appointment:", error);
    throw error;
  }
}

// List all appointments (with pagination)
export async function listAppointments(
  page = 1,
  limit = 10,
  includeInactive = false,
) {
  try {
    const offset = (page - 1) * limit;
    const query = db.select().from(appointments).limit(limit).offset(offset);

    if (!includeInactive) {
      query.where(eq(appointments.isActive, true));
    }

    const allAppointments = await query;
    return allAppointments;
  } catch (error) {
    console.error("Error listing appointments:", error);
    throw error;
  }
}

// Get all agents (users) for filtering - filtered by account
export async function getAgentsForFilter() {
  try {
    const accountId = await getCurrentUserAccountId();
    const agents = await db
      .select({
        id: users.id,
        name: users.name,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(
        and(eq(users.accountId, BigInt(accountId)), eq(users.isActive, true)),
      )
      .orderBy(users.name);

    return agents;
  } catch (error) {
    console.error("Error fetching agents for filter:", error);
    throw error;
  }
}

// SECURE VERSIONS WITH ACCOUNT FILTERING

/**
 * Get appointments by date range filtered by account
 * This ensures users only see appointments from their organization
 */
export async function getAppointmentsByDateRangeSecure(
  startDate: Date,
  endDate: Date,
) {
  try {
    const accountId = await getCurrentUserAccountId();

    // First get all user IDs that belong to this account
    const accountUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.accountId, BigInt(accountId)));

    const userIds = accountUsers.map((u) => u.id);

    if (userIds.length === 0) {
      return [];
    }

    const dateRangeAppointments = await db
      .select({
        appointmentId: appointments.appointmentId,
        userId: appointments.userId,
        assignedTo: appointments.assignedTo,
        contactId: appointments.contactId,
        listingId: appointments.listingId,
        listingContactId: appointments.listingContactId,
        dealId: appointments.dealId,
        prospectId: appointments.prospectId,
        datetimeStart: appointments.datetimeStart,
        datetimeEnd: appointments.datetimeEnd,
        tripTimeMinutes: appointments.tripTimeMinutes,
        status: appointments.status,
        notes: appointments.notes,
        type: appointments.type,
        isActive: appointments.isActive,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        // Add contact name from joined table
        contactFirstName: contacts.firstName,
        contactLastName: contacts.lastName,
        // Add property address from joined listings/properties tables
        propertyStreet: properties.street,
        // Add creator user information
        creatorName: sql<string>`creator_user.name`,
        creatorFirstName: sql<string>`creator_user.first_name`,
        creatorLastName: sql<string>`creator_user.last_name`,
        // Add assigned user information (for filtering)
        agentName: sql<string | null>`assigned_user.name`,
        agentFirstName: sql<string | null>`assigned_user.first_name`,
        agentLastName: sql<string | null>`assigned_user.last_name`,
      })
      .from(appointments)
      .leftJoin(contacts, eq(appointments.contactId, contacts.contactId))
      .leftJoin(listings, eq(appointments.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        sql`users AS creator_user`,
        sql`${appointments.userId} = creator_user.id`,
      )
      .leftJoin(
        sql`users AS assigned_user`,
        sql`${appointments.assignedTo} = assigned_user.id`,
      )
      .where(
        and(
          inArray(appointments.userId, userIds), // Only appointments from users in this account
          or(
            between(appointments.datetimeStart, startDate, endDate),
            between(appointments.datetimeEnd, startDate, endDate),
          ),
          eq(appointments.isActive, true),
        ),
      );
    return dateRangeAppointments;
  } catch (error) {
    console.error("Error fetching appointments by date range:", error);
    throw error;
  }
}

/**
 * Get appointments for current user's account
 */
export async function getUserAppointmentsSecure(userId: string) {
  try {
    const accountId = await getCurrentUserAccountId();

    // Verify the user belongs to the current account
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.accountId, BigInt(accountId))));

    if (!user) {
      throw new Error("User not found or access denied");
    }

    // Now get appointments
    const userAppointments = await db
      .select({
        appointmentId: appointments.appointmentId,
        userId: appointments.userId,
        contactId: appointments.contactId,
        listingId: appointments.listingId,
        listingContactId: appointments.listingContactId,
        dealId: appointments.dealId,
        prospectId: appointments.prospectId,
        datetimeStart: appointments.datetimeStart,
        datetimeEnd: appointments.datetimeEnd,
        tripTimeMinutes: appointments.tripTimeMinutes,
        status: appointments.status,
        notes: appointments.notes,
        type: appointments.type,
        isActive: appointments.isActive,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        // Add contact name from joined table
        contactFirstName: contacts.firstName,
        contactLastName: contacts.lastName,
        // Add property address from joined listings/properties tables
        propertyStreet: properties.street,
        // Add agent/user information
        agentName: users.name,
        agentFirstName: users.firstName,
        agentLastName: users.lastName,
      })
      .from(appointments)
      .leftJoin(contacts, eq(appointments.contactId, contacts.contactId))
      .leftJoin(listings, eq(appointments.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(users, eq(appointments.userId, users.id))
      .where(
        and(eq(appointments.userId, userId), eq(appointments.isActive, true)),
      );
    return userAppointments;
  } catch (error) {
    console.error("Error fetching user appointments:", error);
    throw error;
  }
}
