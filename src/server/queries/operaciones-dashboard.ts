"use server";

import { db } from "~/server/db";
import {
  contacts,
  prospects,
  listingContacts,
  deals,
  tasks,
  appointments,
  listings,
  properties,
} from "~/server/db/schema";
import { eq, and, lte, gte, sql, isNotNull, ne } from "drizzle-orm";
import { getCurrentUserAccountId } from "~/lib/dal";

// Dashboard-specific data types
export interface OperacionesSummary {
  sale: {
    prospects: Record<string, number>;
    leads: Record<string, number>;
    deals: Record<string, number>;
  };
  rent: {
    prospects: Record<string, number>;
    leads: Record<string, number>;
    deals: Record<string, number>;
  };
}

export interface UrgentTask {
  taskId: bigint;
  description: string;
  dueDate: Date;
  entityType: "prospect" | "lead" | "deal" | "listing" | "appointment" | null;
  entityId: bigint | null;
  entityName: string; // Contact name or property address
  daysUntilDue: number;
  completed: boolean;
}

export interface TodayAppointment {
  appointmentId: bigint;
  contactName: string;
  propertyAddress?: string;
  startTime: Date;
  endTime: Date;
  tripTimeMinutes?: number;
  status: "Scheduled" | "Completed" | "Cancelled" | "Rescheduled" | "NoShow";
  appointmentType: string; // viewing, valuation, etc.
}

// Utility function to calculate working days difference (excluding weekends)
function calculateWorkingDays(from: Date, to: Date): number {
  const start = new Date(from);
  const end = new Date(to);
  let workingDays = 0;

  while (start <= end) {
    const dayOfWeek = start.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    start.setDate(start.getDate() + 1);
  }

  return workingDays;
}

// Get comprehensive operations summary for dashboard KPIs
export async function getOperacionesSummary(
  accountId: bigint,
): Promise<OperacionesSummary> {
  try {
    // Get prospects summary by status and listing type
    const prospectsData = await db
      .select({
        status: prospects.status,
        listingType: prospects.listingType,
        count: sql<number>`COUNT(*)`,
      })
      .from(prospects)
      .innerJoin(contacts, eq(prospects.contactId, contacts.contactId))
      .where(eq(contacts.accountId, accountId))
      .groupBy(prospects.status, prospects.listingType);

    // Get active listings summary by prospect_status and listing type (to include in prospects/demanda count)
    const listingsData = await db
      .select({
        status: sql<string>`COALESCE(${listings.prospectStatus}, ${listings.status})`,
        listingType: listings.listingType,
        count: sql<number>`COUNT(*)`,
      })
      .from(listings)
      .where(
        and(
          eq(listings.accountId, accountId),
          eq(listings.isActive, true),
          ne(listings.status, "Draft"),
        ),
      )
      .groupBy(sql`COALESCE(${listings.prospectStatus}, ${listings.status})`, listings.listingType);

    // Get leads summary by status and listing type (through listings)
    const leadsData = await db
      .select({
        status: listingContacts.status,
        listingType: listings.listingType,
        count: sql<number>`COUNT(*)`,
      })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .leftJoin(listings, eq(listingContacts.listingId, listings.listingId))
      .where(and(
        eq(contacts.accountId, accountId),
        eq(listingContacts.contactType, "buyer"),
        eq(listingContacts.isActive, true)
      ))
      .groupBy(listingContacts.status, listings.listingType);

    // Get deals summary by status and listing type (through listings)
    const dealsData = await db
      .select({
        status: deals.status,
        listingType: listings.listingType,
        count: sql<number>`COUNT(*)`,
      })
      .from(deals)
      .innerJoin(listings, eq(deals.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(eq(properties.accountId, accountId))
      .groupBy(deals.status, listings.listingType);

    // Format the results into the expected structure
    const summary: OperacionesSummary = {
      sale: {
        prospects: {},
        leads: {},
        deals: {},
      },
      rent: {
        prospects: {},
        leads: {},
        deals: {},
      },
    };

    // Process prospects data
    prospectsData.forEach((row) => {
      const type = row.listingType === "Sale" ? "sale" : "rent";
      summary[type].prospects[row.status] =
        (summary[type].prospects[row.status] ?? 0) + row.count;
    });

    // Process listings data (include in prospects/demanda count)
    listingsData.forEach((row) => {
      const type = row.listingType === "Sale" ? "sale" : "rent";
      summary[type].prospects[row.status] =
        (summary[type].prospects[row.status] ?? 0) + row.count;
    });

    // Process leads data
    leadsData.forEach((row) => {
      const type = row.listingType === "Sale" ? "sale" : "rent";
      if (row.listingType && row.status) {
        summary[type].leads[row.status] = row.count;
      }
    });

    // Process deals data
    dealsData.forEach((row) => {
      const type = row.listingType === "Sale" ? "sale" : "rent";
      if (row.status) {
        summary[type].deals[row.status] = row.count;
      }
    });

    return summary;
  } catch (error) {
    console.error("Error fetching operaciones summary:", error);
    throw error;
  }
}

// Get urgent tasks (due within specified working days)
export async function getUrgentTasks(
  accountId: bigint,
  workingDaysLimit = 5,
): Promise<UrgentTask[]> {
  try {
    // Calculate the cutoff date for urgent tasks
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() + Number(workingDaysLimit));

    const urgentTasksQuery = await db
      .select({
        taskId: tasks.taskId,
        description: tasks.description,
        dueDate: tasks.dueDate,
        completed: tasks.completed,
        // Entity relationships
        prospectId: tasks.prospectId,
        listingContactId: tasks.listingContactId,
        dealId: tasks.dealId,
        listingId: tasks.listingId,
        appointmentId: tasks.appointmentId,
        // Contact names for prospects/leads
        contactName: sql<string>`
          CASE 
            WHEN ${tasks.prospectId} IS NOT NULL THEN CONCAT(${contacts.firstName}, ' ', ${contacts.lastName})
            WHEN ${tasks.listingContactId} IS NOT NULL THEN CONCAT(${contacts.firstName}, ' ', ${contacts.lastName})
            ELSE NULL 
          END
        `,
        // Property addresses for listings/deals
        propertyAddress: sql<string>`
          CASE 
            WHEN ${tasks.listingId} IS NOT NULL OR ${tasks.dealId} IS NOT NULL
            THEN CONCAT(${properties.street}, ', ', ${properties.addressDetails})
            ELSE NULL 
          END
        `,
      })
      .from(tasks)
      // Join for prospect contact names
      .leftJoin(prospects, eq(tasks.prospectId, prospects.id))
      .leftJoin(contacts, eq(prospects.contactId, contacts.contactId))
      // Join for lead contact names
      .leftJoin(listingContacts, and(
        eq(tasks.listingContactId, listingContacts.listingContactId),
        eq(listingContacts.contactType, "buyer")
      ))
      // Join for property addresses (through listings or deals)
      .leftJoin(listings, eq(tasks.listingId, listings.listingId))
      .leftJoin(deals, eq(tasks.dealId, deals.dealId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          // Account filtering - check through contact relationship
          eq(contacts.accountId, accountId),
          // Due date filtering
          and(
            isNotNull(tasks.dueDate),
            gte(tasks.dueDate, today),
            lte(tasks.dueDate, cutoffDate),
          ),
          // Only active, incomplete tasks
          eq(tasks.isActive, true),
          eq(tasks.completed, false),
        ),
      )
      .orderBy(tasks.dueDate);

    // Process and format the results
    return urgentTasksQuery.map((task) => {
      let entityType: UrgentTask["entityType"] = null;
      let entityId: bigint | null = null;
      let entityName = "Unknown";

      // Determine entity type and name based on which relationship exists
      if (task.prospectId) {
        entityType = "prospect";
        entityId = task.prospectId;
        entityName = task.contactName || "Unknown Contact";
      } else if (task.listingContactId) {
        entityType = "lead";
        entityId = task.listingContactId;
        entityName = task.contactName || "Unknown Contact";
      } else if (task.dealId) {
        entityType = "deal";
        entityId = task.dealId;
        entityName = task.propertyAddress || "Unknown Property";
      } else if (task.listingId) {
        entityType = "listing";
        entityId = task.listingId;
        entityName = task.propertyAddress || "Unknown Property";
      } else if (task.appointmentId) {
        entityType = "appointment";
        entityId = task.appointmentId;
        entityName = "Appointment";
      }

      return {
        taskId: task.taskId,
        description: task.description,
        dueDate: task.dueDate!,
        entityType,
        entityId,
        entityName,
        daysUntilDue: calculateWorkingDays(today, task.dueDate!),
        completed: task.completed ?? false,
      };
    });
  } catch (error) {
    console.error("Error fetching urgent tasks:", error);
    throw error;
  }
}

// Get today's and tomorrow's appointments
export async function getTodayAppointments(
  accountId: bigint,
): Promise<TodayAppointment[]> {
  try {
    // Calculate date ranges for today and tomorrow
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 2); // End of tomorrow

    const appointmentsQuery = await db
      .select({
        appointmentId: appointments.appointmentId,
        startTime: appointments.datetimeStart,
        endTime: appointments.datetimeEnd,
        tripTimeMinutes: appointments.tripTimeMinutes,
        status: appointments.status,
        notes: appointments.notes,
        appointmentType: appointments.type,
        // Contact information
        contactName: sql<string>`CONCAT(contacts.first_name, ' ', contacts.last_name)`,
        // Property information (if linked to listing)
        propertyAddress: sql<string>`
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
          // Account filtering
          eq(contacts.accountId, accountId),
          // Date range filtering (today and tomorrow)
          gte(appointments.datetimeStart, today),
          lte(appointments.datetimeStart, tomorrow),
          // Only active appointments
          eq(appointments.isActive, true),
          // Exclude cancelled appointments
          sql`${appointments.status} != 'Cancelled'`,
        ),
      )
      .orderBy(appointments.datetimeStart);

    return appointmentsQuery.map((appt) => ({
      appointmentId: appt.appointmentId,
      contactName: appt.contactName,
      propertyAddress: appt.propertyAddress || undefined,
      startTime: appt.startTime,
      endTime: appt.endTime,
      tripTimeMinutes: appt.tripTimeMinutes ?? undefined,
      status: appt.status as TodayAppointment["status"],
      appointmentType: appt.appointmentType ?? "Visita", // Use actual type from database, default to "Visita"
    }));
  } catch (error) {
    console.error("Error fetching today's appointments:", error);
    throw error;
  }
}

// Wrapper functions with automatic account filtering
export async function getOperacionesSummaryWithAuth(): Promise<OperacionesSummary> {
  const accountId = await getCurrentUserAccountId();
  return getOperacionesSummary(BigInt(accountId));
}

export async function getUrgentTasksWithAuth(
  workingDaysLimit = 5,
): Promise<UrgentTask[]> {
  const accountId = await getCurrentUserAccountId();
  return getUrgentTasks(BigInt(accountId), workingDaysLimit);
}

export async function getTodayAppointmentsWithAuth(): Promise<
  TodayAppointment[]
> {
  const accountId = await getCurrentUserAccountId();
  return getTodayAppointments(BigInt(accountId));
}
