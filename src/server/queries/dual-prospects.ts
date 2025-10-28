"use server";

import { db } from "~/server/db";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { prospects, contacts } from "~/server/db/schema";
import { getCurrentUserAccountId } from "~/lib/dal";
import type {
  DualProspect,
  SearchProspect,
  ListingProspect,
  DualProspectFilters,
  ProspectStatistics,
  DualProspectOperationCard,
} from "~/types/dual-prospects";
import type { KanbanColumn, KanbanData } from "~/types/operations";
import { convertToOperationCard } from "~/lib/prospect-utils";

// Wrapper functions that automatically get accountId from current session
export async function getDualProspectsForKanbanWithAuth(
  listingType?: "sale" | "rent" | "all",
  prospectType?: "search" | "listing" | "all",
  status?: string,
) {
  const accountId = await getCurrentUserAccountId();
  return getDualProspectsForKanban(
    Number(accountId),
    listingType,
    prospectType,
    status,
  );
}

export async function getDualProspectWithAuth(id: bigint) {
  const accountId = await getCurrentUserAccountId();
  return getDualProspect(id, Number(accountId));
}

export async function getAllDualProspectsWithAuth(
  filters?: DualProspectFilters,
) {
  const accountId = await getCurrentUserAccountId();
  return getAllDualProspects(Number(accountId), filters);
}

export async function getDualProspectStatisticsWithAuth(
  prospectType?: "search" | "listing" | "all",
) {
  const accountId = await getCurrentUserAccountId();
  return getDualProspectStatistics(Number(accountId), prospectType);
}

// Core query functions with account-based security

// Get dual prospects formatted for kanban display
export async function getDualProspectsForKanban(
  accountId: number,
  listingType?: "sale" | "rent" | "all",
  prospectType?: "search" | "listing" | "all",
  status?: string,
): Promise<KanbanData> {
  // Apply additional filters
  const additionalConditions = [];

  if (listingType && listingType !== "all") {
    const targetListingType = listingType === "sale" ? "Sale" : "Rent";
    additionalConditions.push(eq(prospects.listingType, targetListingType));
  }

  if (prospectType && prospectType !== "all") {
    additionalConditions.push(eq(prospects.prospectType, prospectType));
  }

  if (status) {
    additionalConditions.push(eq(prospects.status, status));
  }

  // Build final query with all conditions
  const allConditions = [
    eq(contacts.accountId, BigInt(accountId)),
    eq(contacts.isActive, true),
    ...additionalConditions,
  ];

  const queryWithConditions = db
    .select({
      // Prospect fields
      id: prospects.id,
      contactId: prospects.contactId,
      status: prospects.status,
      listingType: prospects.listingType,
      prospectType: prospects.prospectType,

      // Search prospect fields
      propertyType: prospects.propertyType,
      minPrice: prospects.minPrice,
      maxPrice: prospects.maxPrice,
      preferredAreas: prospects.preferredAreas,
      minBedrooms: prospects.minBedrooms,
      minBathrooms: prospects.minBathrooms,
      minSquareMeters: prospects.minSquareMeters,
      maxSquareMeters: prospects.maxSquareMeters,
      moveInBy: prospects.moveInBy,
      extras: prospects.extras,
      urgencyLevel: prospects.urgencyLevel,
      fundingReady: prospects.fundingReady,

      // Listing prospect fields
      // Note: propertyToList, valuationStatus, listingAgreementStatus are stored in notesInternal JSON field

      // Common fields
      notesInternal: prospects.notesInternal,
      createdAt: prospects.createdAt,
      updatedAt: prospects.updatedAt,

      // Contact information from JOIN
      contactFirstName: contacts.firstName,
      contactLastName: contacts.lastName,
      contactEmail: contacts.email,
      contactPhone: contacts.phone,
    })
    .from(prospects)
    .innerJoin(contacts, eq(prospects.contactId, contacts.contactId))
    .where(and(...allConditions));

  const results = await queryWithConditions
    .orderBy(desc(prospects.updatedAt))
    .execute();

  // Transform raw data to DualProspect objects
  const dualProspects: DualProspect[] = results.map((row) => {
    const baseProspect = {
      id: row.id,
      contactId: row.contactId,
      status: row.status,
      listingType: row.listingType as "Sale" | "Rent",
      prospectType: row.prospectType as "search" | "listing",
      urgencyLevel: row.urgencyLevel ?? undefined,
      notesInternal: row.notesInternal ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      contactName: `${row.contactFirstName} ${row.contactLastName}`,
      contactEmail: row.contactEmail ?? undefined,
      contactPhone: row.contactPhone ?? undefined,
    };

    if (row.prospectType === "search") {
      return {
        ...baseProspect,
        prospectType: "search" as const,
        propertyType: row.propertyType ?? undefined,
        minPrice: row.minPrice ? Number(row.minPrice) : undefined,
        maxPrice: row.maxPrice ? Number(row.maxPrice) : undefined,
        preferredAreas:
          (row.preferredAreas as Array<{
            neighborhoodId: bigint;
            name: string;
          }>) ?? undefined,
        minBedrooms: row.minBedrooms ?? undefined,
        minBathrooms: row.minBathrooms ?? undefined,
        minSquareMeters: row.minSquareMeters ?? undefined,
        maxSquareMeters: row.maxSquareMeters ?? undefined,
        moveInBy: row.moveInBy ?? undefined,
        extras: (row.extras as Record<string, boolean>) ?? undefined,
        fundingReady: row.fundingReady ?? undefined,
      } as SearchProspect;
    } else {
      // Parse listing fields from notesInternal JSON
      const notesData =
        typeof row.notesInternal === "string"
          ? (() => {
              try {
                return JSON.parse(row.notesInternal) as Record<string, unknown>;
              } catch {
                return null;
              }
            })()
          : (row.notesInternal as Record<string, unknown> | null);

      return {
        ...baseProspect,
        prospectType: "listing" as const,
        propertyToList: notesData?.propertyToList ?? undefined,
        valuationStatus: notesData?.valuationStatus as
          | "pending"
          | "scheduled"
          | "completed"
          | undefined,
        listingAgreementStatus: notesData?.listingAgreementStatus as
          | "not_started"
          | "in_progress"
          | "signed"
          | undefined,
      } as ListingProspect;
    }
  });

  // Convert to operation cards
  const operationCards: DualProspectOperationCard[] = dualProspects.map(
    convertToOperationCard,
  );

  // Group by status to create kanban columns
  const statusGroups = operationCards.reduce(
    (groups, card) => {
      const status = card.status;
      groups[status] ??= [];
      groups[status].push(card);
      return groups;
    },
    {} as Record<string, DualProspectOperationCard[]>,
  );

  // Create kanban columns with proper Spanish status names
  const columns: KanbanColumn[] = Object.entries(statusGroups).map(
    ([status, items]) => ({
      id: status,
      title: status, // Already in Spanish from the database
      status,
      items,
      itemCount: items.length,
    }),
  );

  // Sort columns by typical workflow order
  const statusOrder = [
    "Información básica",
    "Valoración",
    "Hoja de encargo",
    "En búsqueda",
    "New", // Fallback for legacy statuses
    "Working",
    "Qualified",
    "Archived",
  ];

  columns.sort((a, b) => {
    const aIndex = statusOrder.indexOf(a.id);
    const bIndex = statusOrder.indexOf(b.id);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  return {
    columns,
    totalCount: dualProspects.length,
  };
}

// Get a single dual prospect by ID
export async function getDualProspect(
  id: bigint,
  accountId: number,
): Promise<DualProspect | null> {
  const [result] = await db
    .select({
      // Prospect fields
      id: prospects.id,
      contactId: prospects.contactId,
      status: prospects.status,
      listingType: prospects.listingType,
      prospectType: prospects.prospectType,

      // Search prospect fields
      propertyType: prospects.propertyType,
      minPrice: prospects.minPrice,
      maxPrice: prospects.maxPrice,
      preferredAreas: prospects.preferredAreas,
      minBedrooms: prospects.minBedrooms,
      minBathrooms: prospects.minBathrooms,
      minSquareMeters: prospects.minSquareMeters,
      maxSquareMeters: prospects.maxSquareMeters,
      moveInBy: prospects.moveInBy,
      extras: prospects.extras,
      urgencyLevel: prospects.urgencyLevel,
      fundingReady: prospects.fundingReady,

      // Listing prospect fields
      // Note: propertyToList, valuationStatus, listingAgreementStatus are stored in notesInternal JSON field

      // Common fields
      notesInternal: prospects.notesInternal,
      createdAt: prospects.createdAt,
      updatedAt: prospects.updatedAt,

      // Contact information
      contactFirstName: contacts.firstName,
      contactLastName: contacts.lastName,
      contactEmail: contacts.email,
      contactPhone: contacts.phone,
    })
    .from(prospects)
    .innerJoin(contacts, eq(prospects.contactId, contacts.contactId))
    .where(
      and(eq(prospects.id, id), eq(contacts.accountId, BigInt(accountId))),
    );

  if (!result) return null;

  const baseProspect = {
    id: result.id,
    contactId: result.contactId,
    status: result.status,
    listingType: result.listingType as "Sale" | "Rent",
    prospectType: result.prospectType as "search" | "listing",
    urgencyLevel: result.urgencyLevel ?? undefined,
    notesInternal: result.notesInternal ?? undefined,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    contactName: `${result.contactFirstName} ${result.contactLastName}`,
    contactEmail: result.contactEmail ?? undefined,
    contactPhone: result.contactPhone ?? undefined,
  };

  if (result.prospectType === "search") {
    return {
      ...baseProspect,
      prospectType: "search" as const,
      propertyType: result.propertyType ?? undefined,
      minPrice: result.minPrice ? Number(result.minPrice) : undefined,
      maxPrice: result.maxPrice ? Number(result.maxPrice) : undefined,
      preferredAreas:
        (result.preferredAreas as Array<{
          neighborhoodId: bigint;
          name: string;
        }>) ?? undefined,
      minBedrooms: result.minBedrooms ?? undefined,
      minBathrooms: result.minBathrooms ?? undefined,
      minSquareMeters: result.minSquareMeters ?? undefined,
      maxSquareMeters: result.maxSquareMeters ?? undefined,
      moveInBy: result.moveInBy ?? undefined,
      extras: (result.extras as Record<string, boolean>) ?? undefined,
      fundingReady: result.fundingReady ?? undefined,
    } as SearchProspect;
  }

  // Parse listing fields from notesInternal JSON
  const notesData =
    typeof result.notesInternal === "string"
      ? (() => {
          try {
            return JSON.parse(result.notesInternal) as Record<string, unknown>;
          } catch {
            return null;
          }
        })()
      : (result.notesInternal as Record<string, unknown> | null);

  return {
    ...baseProspect,
    prospectType: "listing" as const,
    propertyToList: notesData?.propertyToList as
      | {
          address: string;
          propertyType: string;
          estimatedValue: number;
          condition: string;
          readyToList: boolean;
          bedrooms?: number;
          bathrooms?: number;
          squareMeters?: number;
          description?: string;
        }
      | undefined,
    valuationStatus: notesData?.valuationStatus as
      | "pending"
      | "scheduled"
      | "completed"
      | undefined,
    listingAgreementStatus: notesData?.listingAgreementStatus as
      | "not_started"
      | "in_progress"
      | "signed"
      | undefined,
  } as ListingProspect;
}

// Get all dual prospects with filtering
export async function getAllDualProspects(
  accountId: number,
  filters?: DualProspectFilters,
): Promise<DualProspect[]> {
  // Apply filters
  const conditions = [];

  if (filters?.prospectType && filters.prospectType !== "all") {
    conditions.push(eq(prospects.prospectType, filters.prospectType));
  }

  if (filters?.listingType && filters.listingType !== "all") {
    const targetListingType = filters.listingType === "sale" ? "Sale" : "Rent";
    conditions.push(eq(prospects.listingType, targetListingType));
  }

  if (filters?.status) {
    conditions.push(eq(prospects.status, filters.status));
  }

  if (filters?.urgencyLevel) {
    conditions.push(eq(prospects.urgencyLevel, filters.urgencyLevel));
  }

  // Build final query with all conditions
  const allConditions = [
    eq(contacts.accountId, BigInt(accountId)),
    ...conditions,
  ];

  const finalQueryWithConditions = db
    .select({
      // Prospect fields
      id: prospects.id,
      contactId: prospects.contactId,
      status: prospects.status,
      listingType: prospects.listingType,
      prospectType: prospects.prospectType,

      // Search prospect fields
      propertyType: prospects.propertyType,
      minPrice: prospects.minPrice,
      maxPrice: prospects.maxPrice,
      preferredAreas: prospects.preferredAreas,
      minBedrooms: prospects.minBedrooms,
      minBathrooms: prospects.minBathrooms,
      minSquareMeters: prospects.minSquareMeters,
      maxSquareMeters: prospects.maxSquareMeters,
      moveInBy: prospects.moveInBy,
      extras: prospects.extras,
      urgencyLevel: prospects.urgencyLevel,
      fundingReady: prospects.fundingReady,

      // Listing prospect fields
      // Note: propertyToList, valuationStatus, listingAgreementStatus are stored in notesInternal JSON field

      // Common fields
      notesInternal: prospects.notesInternal,
      createdAt: prospects.createdAt,
      updatedAt: prospects.updatedAt,

      // Contact information
      contactFirstName: contacts.firstName,
      contactLastName: contacts.lastName,
      contactEmail: contacts.email,
      contactPhone: contacts.phone,
    })
    .from(prospects)
    .innerJoin(contacts, eq(prospects.contactId, contacts.contactId))
    .where(and(...allConditions));

  // Build final query with pagination
  const baseQuery = finalQueryWithConditions.orderBy(desc(prospects.updatedAt));

  let results;
  if (filters?.page && filters?.limit) {
    const offset = (filters.page - 1) * filters.limit;
    results = await baseQuery.limit(filters.limit).offset(offset);
  } else if (filters?.limit) {
    results = await baseQuery.limit(filters.limit);
  } else {
    results = await baseQuery;
  }

  // Transform results to DualProspect objects
  return results.map((row) => {
    const baseProspect = {
      id: row.id,
      contactId: row.contactId,
      status: row.status,
      listingType: row.listingType as "Sale" | "Rent",
      prospectType: row.prospectType as "search" | "listing",
      urgencyLevel: row.urgencyLevel ?? undefined,
      notesInternal: row.notesInternal ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      contactName: `${row.contactFirstName} ${row.contactLastName}`,
      contactEmail: row.contactEmail ?? undefined,
      contactPhone: row.contactPhone ?? undefined,
    };

    if (row.prospectType === "search") {
      return {
        ...baseProspect,
        prospectType: "search" as const,
        propertyType: row.propertyType ?? undefined,
        minPrice: row.minPrice ? Number(row.minPrice) : undefined,
        maxPrice: row.maxPrice ? Number(row.maxPrice) : undefined,
        preferredAreas:
          (row.preferredAreas as Array<{
            neighborhoodId: bigint;
            name: string;
          }>) ?? undefined,
        minBedrooms: row.minBedrooms ?? undefined,
        minBathrooms: row.minBathrooms ?? undefined,
        minSquareMeters: row.minSquareMeters ?? undefined,
        maxSquareMeters: row.maxSquareMeters ?? undefined,
        moveInBy: row.moveInBy ?? undefined,
        extras: (row.extras as Record<string, boolean>) ?? undefined,
        fundingReady: row.fundingReady ?? undefined,
      } as SearchProspect;
    }

    // Parse listing fields from notesInternal JSON
    const notesData =
      typeof row.notesInternal === "string"
        ? (() => {
            try {
              return JSON.parse(row.notesInternal) as Record<string, unknown>;
            } catch {
              return null;
            }
          })()
        : (row.notesInternal as Record<string, unknown> | null);

    return {
      ...baseProspect,
      prospectType: "listing" as const,
      propertyToList: notesData?.propertyToList ?? undefined,
      valuationStatus: notesData?.valuationStatus as
        | "pending"
        | "scheduled"
        | "completed"
        | undefined,
      listingAgreementStatus: notesData?.listingAgreementStatus as
        | "not_started"
        | "in_progress"
        | "signed"
        | undefined,
    } as ListingProspect;
  });
}

// Get dual prospect statistics for dashboard
export async function getDualProspectStatistics(
  accountId: number,
  prospectType?: "search" | "listing" | "all",
): Promise<ProspectStatistics> {
  const baseConditions = eq(contacts.accountId, BigInt(accountId));
  const typeCondition =
    prospectType && prospectType !== "all"
      ? eq(prospects.prospectType, prospectType)
      : undefined;

  const conditions = typeCondition
    ? and(baseConditions, typeCondition)
    : baseConditions;

  // Get total counts
  const [totalResult] = await db
    .select({
      totalCount: count(prospects.id),
      searchCount: sql<number>`sum(case when ${prospects.prospectType} = 'search' then 1 else 0 end)`,
      listingCount: sql<number>`sum(case when ${prospects.prospectType} = 'listing' then 1 else 0 end)`,
      averageUrgency: sql<number>`avg(${prospects.urgencyLevel})`,
    })
    .from(prospects)
    .innerJoin(contacts, eq(prospects.contactId, contacts.contactId))
    .where(conditions);

  // Get counts by status
  const statusResults = await db
    .select({
      status: prospects.status,
      count: count(prospects.id),
    })
    .from(prospects)
    .innerJoin(contacts, eq(prospects.contactId, contacts.contactId))
    .where(conditions)
    .groupBy(prospects.status);

  // Get counts by listing type
  const listingTypeResults = await db
    .select({
      listingType: prospects.listingType,
      count: count(prospects.id),
    })
    .from(prospects)
    .innerJoin(contacts, eq(prospects.contactId, contacts.contactId))
    .where(conditions)
    .groupBy(prospects.listingType);

  const byStatus = statusResults.reduce(
    (acc, row) => {
      acc[row.status] = row.count;
      return acc;
    },
    {} as Record<string, number>,
  );

  const byListingType = listingTypeResults.reduce(
    (acc, row) => {
      if (row.listingType) {
        acc[row.listingType] = row.count;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    totalCount: totalResult?.totalCount ?? 0,
    searchCount: totalResult?.searchCount ?? 0,
    listingCount: totalResult?.listingCount ?? 0,
    byStatus,
    byListingType,
    averageUrgency: totalResult?.averageUrgency ?? 0,
  };
}
