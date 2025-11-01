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
import { getMatchesForProspects } from "~/server/queries/connection-matches";

// Dashboard-specific data types
export interface OperacionesSummary {
  sale: {
    prospects: number;
    prospectsWithMatches: number;
    prospectsWithoutMatches: number;
    listings: number;
    leads: Record<string, number>;
    deals: Record<string, number>;
  };
  rent: {
    prospects: number;
    prospectsWithMatches: number;
    prospectsWithoutMatches: number;
    listings: number;
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
  contactId?: bigint;
  listingId?: bigint;
  contactName: string;
  propertyAddress?: string;
  startTime: Date;
  endTime: Date;
  tripTimeMinutes?: number;
  status: "Scheduled" | "Completed" | "Cancelled" | "Rescheduled" | "NoShow";
  appointmentType: string; // viewing, valuation, etc.
  assignedTo?: string; // userId of assigned agent
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

// Helper function to calculate badge type (mirrors logic from contact-detail-sheet.tsx)
function calculateBadgeType(contact: {
  isActive?: boolean | null;
  hasUpcomingVisit: boolean;
  hasMissedVisit: boolean;
  hasCompletedVisit: boolean;
  hasCancelledVisit: boolean;
  hasOffer: boolean;
  offerAccepted: boolean | null;
}): string {
  // Priority order (same as contact-detail-sheet.tsx lines 415-483)
  if (contact.isActive === false) return "Inactivo";
  if (contact.hasUpcomingVisit) return "Visita Pendiente";
  if (contact.offerAccepted === true) return "Oferta Aceptada";
  if (contact.offerAccepted === false) return "Oferta Rechazada";
  if (contact.hasOffer) return "Oferta Pendiente";
  if (contact.hasCancelledVisit) return "Visita Cancelada";
  if (contact.hasMissedVisit) return "Visita Perdida";
  if (contact.hasCompletedVisit) return "Visita Completada";
  return "Sin Visitas";
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
      .groupBy(
        sql`COALESCE(${listings.prospectStatus}, ${listings.status})`,
        listings.listingType,
      );

    // Get leads data with appointment information to calculate badge types
    const leadsDataRaw = await db
      .select({
        listingContactId: listingContacts.listingContactId,
        listingType: listings.listingType,
        isActive: listingContacts.isActive,
        offer: listingContacts.offer,
        offerAccepted: listingContacts.offerAccepted,
        // Calculate visit flags using SQL aggregation
        hasUpcomingVisit: sql<boolean>`
          CASE WHEN COUNT(CASE
            WHEN ${appointments.status} = 'Scheduled'
            AND ${appointments.datetimeStart} >= NOW()
            AND ${appointments.type} = 'Visita'
            THEN 1
          END) > 0 THEN TRUE ELSE FALSE END
        `,
        hasMissedVisit: sql<boolean>`
          CASE WHEN COUNT(CASE
            WHEN ${appointments.status} = 'NoShow'
            AND ${appointments.type} = 'Visita'
            THEN 1
          END) > 0 THEN TRUE ELSE FALSE END
        `,
        hasCompletedVisit: sql<boolean>`
          CASE WHEN COUNT(CASE
            WHEN ${appointments.status} = 'Completed'
            AND ${appointments.type} = 'Visita'
            THEN 1
          END) > 0 THEN TRUE ELSE FALSE END
        `,
        hasCancelledVisit: sql<boolean>`
          CASE WHEN COUNT(CASE
            WHEN ${appointments.status} = 'Cancelled'
            AND ${appointments.type} = 'Visita'
            THEN 1
          END) > 0 THEN TRUE ELSE FALSE END
        `,
      })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .leftJoin(listings, eq(listingContacts.listingId, listings.listingId))
      .leftJoin(
        appointments,
        and(
          eq(appointments.contactId, listingContacts.contactId),
          eq(appointments.listingId, listingContacts.listingId),
        ),
      )
      .where(
        and(
          eq(contacts.accountId, accountId),
          eq(listingContacts.contactType, "buyer"),
          eq(listingContacts.isActive, true),
        ),
      )
      .groupBy(
        listingContacts.listingContactId,
        listings.listingType,
        listingContacts.isActive,
        listingContacts.offer,
        listingContacts.offerAccepted,
      );

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

    // Get matches to determine prospects with/without connections
    const matchResults = await getMatchesForProspects({
      accountId,
      filters: {
        accountScope: "current",
        includeNearStrict: true,
        propertyTypes: [],
        locationIds: [],
        prospectTypes: [],
        listingTypes: [],
        statuses: [],
        urgencyLevels: [],
      },
      pagination: {
        offset: 0,
        limit: 10000, // Large limit to get all matches
      },
    });

    // Build a set of prospect IDs that have matches
    const prospectIdsWithMatches = new Set<string>();
    matchResults.matches.forEach((match) => {
      prospectIdsWithMatches.add(match.prospectId.toString());
    });

    // Get all prospect IDs grouped by listing type
    const saleProspectIds = new Set<string>();
    const rentProspectIds = new Set<string>();

    prospectsData.forEach((row) => {
      // We need to get actual prospect IDs, so let's query them
      const type = row.listingType === "Sale" ? "sale" : "rent";
      if (type === "sale") {
        // We'll populate this below
      } else {
        // We'll populate this below
      }
    });

    // Get all prospects to map IDs to listing types
    const allProspectsQuery = await db
      .select({
        id: prospects.id,
        listingType: prospects.listingType,
      })
      .from(prospects)
      .innerJoin(contacts, eq(prospects.contactId, contacts.contactId))
      .where(eq(contacts.accountId, accountId));

    allProspectsQuery.forEach((prospect) => {
      const prospectId = prospect.id.toString();
      if (prospect.listingType === "Sale") {
        saleProspectIds.add(prospectId);
      } else if (prospect.listingType === "Rent") {
        rentProspectIds.add(prospectId);
      }
    });

    // Calculate counts
    const saleProspectsWithMatches = Array.from(saleProspectIds).filter((id) =>
      prospectIdsWithMatches.has(id),
    ).length;
    const rentProspectsWithMatches = Array.from(rentProspectIds).filter((id) =>
      prospectIdsWithMatches.has(id),
    ).length;

    // Format the results into the expected structure
    const summary: OperacionesSummary = {
      sale: {
        prospects: 0,
        prospectsWithMatches: saleProspectsWithMatches,
        prospectsWithoutMatches: 0,
        listings: 0,
        leads: {},
        deals: {},
      },
      rent: {
        prospects: 0,
        prospectsWithMatches: rentProspectsWithMatches,
        prospectsWithoutMatches: 0,
        listings: 0,
        leads: {},
        deals: {},
      },
    };

    // Process prospects data - just count totals
    prospectsData.forEach((row) => {
      const type = row.listingType === "Sale" ? "sale" : "rent";
      summary[type].prospects += row.count;
    });

    // Calculate without matches
    summary.sale.prospectsWithoutMatches =
      summary.sale.prospects - summary.sale.prospectsWithMatches;
    summary.rent.prospectsWithoutMatches =
      summary.rent.prospects - summary.rent.prospectsWithMatches;

    // Process listings data - separate from prospects
    listingsData.forEach((row) => {
      const type = row.listingType === "Sale" ? "sale" : "rent";
      summary[type].listings += row.count;
    });

    // Process leads data - calculate badge types and group
    leadsDataRaw.forEach((row) => {
      if (!row.listingType) return;

      const type = row.listingType === "Sale" ? "sale" : "rent";

      // Calculate badge type using the helper function
      const badgeType = calculateBadgeType({
        isActive: row.isActive,
        hasUpcomingVisit: Boolean(row.hasUpcomingVisit),
        hasMissedVisit: Boolean(row.hasMissedVisit),
        hasCompletedVisit: Boolean(row.hasCompletedVisit),
        hasCancelledVisit: Boolean(row.hasCancelledVisit),
        hasOffer: row.offer !== null,
        offerAccepted: row.offerAccepted,
      });

      // Increment count for this badge type
      summary[type].leads[badgeType] =
        (summary[type].leads[badgeType] ?? 0) + 1;
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
      .leftJoin(
        listingContacts,
        and(
          eq(tasks.listingContactId, listingContacts.listingContactId),
          eq(listingContacts.contactType, "buyer"),
        ),
      )
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
  filters?: {
    type?: string[];
    assignedTo?: string | string[]; // Support single userId string or array
  },
): Promise<TodayAppointment[]> {
  try {
    // Calculate date ranges for today and tomorrow
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 2); // End of tomorrow

    const whereConditions = [
      // Account filtering
      eq(contacts.accountId, accountId),
      // Date range filtering (today and tomorrow)
      gte(appointments.datetimeStart, today),
      lte(appointments.datetimeStart, tomorrow),
      // Only active appointments
      eq(appointments.isActive, true),
      // Exclude cancelled appointments
      sql`${appointments.status} != 'Cancelled'`,
    ];

    // Add filter conditions if provided
    if (filters?.type && filters.type.length > 0) {
      whereConditions.push(
        sql`${appointments.type} IN (${sql.join(
          filters.type.map((t) => sql`${t}`),
          sql`, `,
        )})`,
      );
    }

    if (filters?.assignedTo) {
      // Handle both single string and array
      const assignedToArray = Array.isArray(filters.assignedTo)
        ? filters.assignedTo
        : [filters.assignedTo];
      
      if (assignedToArray.length > 0) {
        whereConditions.push(
          sql`${appointments.userId} IN (${sql.join(
            assignedToArray.map((a) => sql`${a}`),
            sql`, `,
          )})`,
        );
      }
    }

    const appointmentsQuery = await db
      .select({
        appointmentId: appointments.appointmentId,
        contactId: appointments.contactId,
        listingId: appointments.listingId,
        startTime: appointments.datetimeStart,
        endTime: appointments.datetimeEnd,
        tripTimeMinutes: appointments.tripTimeMinutes,
        status: appointments.status,
        notes: appointments.notes,
        appointmentType: appointments.type,
        assignedTo: appointments.userId, // Include userId (assignedTo)
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
      .where(and(...whereConditions))
      .orderBy(appointments.datetimeStart);

    return appointmentsQuery.map((appt) => ({
      appointmentId: appt.appointmentId,
      contactId: appt.contactId ?? undefined,
      listingId: appt.listingId ?? undefined,
      contactName: appt.contactName,
      propertyAddress: appt.propertyAddress || undefined,
      startTime: appt.startTime,
      endTime: appt.endTime,
      tripTimeMinutes: appt.tripTimeMinutes ?? undefined,
      status: appt.status as TodayAppointment["status"],
      appointmentType: appt.appointmentType ?? "Visita", // Use actual type from database, default to "Visita"
      assignedTo: appt.assignedTo ?? undefined,
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

export async function getTodayAppointmentsWithAuth(
  filters?: {
    type?: string[];
    assignedTo?: string | string[]; // Support single userId string or array
  },
): Promise<TodayAppointment[]> {
  const accountId = await getCurrentUserAccountId();
  return getTodayAppointments(BigInt(accountId), filters);
}
