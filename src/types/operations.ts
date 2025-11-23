import { z } from "zod";

// Core operation types for kanban implementation
export interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  items: OperationCard[];
  itemCount: number;
}

export interface OperationCard {
  id: bigint;
  type: "prospect" | "lead" | "deal";
  status: string;
  listingType: "Sale" | "Rent";
  // Prospect-specific fields
  contactName?: string;
  needSummary?: string;
  urgencyLevel?: number;
  lastActivity?: Date;
  nextTask?: string;
  // Lead-specific fields
  listingAddress?: string;
  source?: string;
  // Deal-specific fields
  amount?: number;
  closeDate?: Date;
  participants?: string[];
}

export interface KanbanViewProps {
  operationType: "prospects" | "leads" | "deals";
  listingType: "sale" | "rent" | "all";
  columns: KanbanColumn[];
  onCardMove: (
    cardId: bigint,
    fromColumn: string,
    toColumn: string,
  ) => Promise<void>;
  onBulkAction: (action: BulkActionType, cardIds: bigint[]) => Promise<void>;
}

// Operation type definitions
export type OperationType = "prospects" | "leads" | "deals";
export type ListingTypeFilter = "sale" | "rent" | "all";
export type ViewMode = "list" | "kanban";

// Bulk action types
export type BulkActionType =
  | "assign"
  | "updateStatus"
  | "createTasks"
  | "export";

// Status workflows for different operation types (3 final statuses)
export const PROSPECT_STATUSES = [
  "En búsqueda",
  "Archivado",
  "Finalizado",
] as const;

// Dual-type prospect status workflows (Spanish)
export const LISTING_PROSPECT_STATUSES = [
  "Información básica",
  "Valoración",
  "Hoja de encargo",
  "En búsqueda",
] as const;

export const SEARCH_PROSPECT_STATUSES = [
  "Información básica",
  "En búsqueda",
] as const;
export const LEAD_STATUSES = [
  "New",
  "Working",
  "Converted",
  "Disqualified",
] as const;
export const DEAL_STATUSES = [
  "Offer",
  "UnderContract",
  "Closed",
  "Lost",
] as const;

export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type DealStatus = (typeof DEAL_STATUSES)[number];

// Spanish translations for statuses
export const STATUS_TRANSLATIONS = {
  // Legacy Prospects (English to Spanish)
  New: "En búsqueda",
  Working: "En preparación",
  Qualified: "Finalizado",
  Archived: "Archivado",
  // Spanish statuses (already translated)
  "En búsqueda": "En búsqueda",
  "En preparación": "En preparación",
  Archivado: "Archivado",
  Finalizado: "Finalizado",
  // Dual-Type Prospects (Spanish - these are already in Spanish)
  "Información básica": "Información básica",
  Valoración: "Valoración",
  "Hoja de encargo": "Hoja de encargo",
  // Leads
  Converted: "Convertido",
  Disqualified: "Descalificado",
  // Deals
  Offer: "Oferta",
  UnderContract: "Bajo Contrato",
  Closed: "Cerrado",
  Lost: "Perdido",
} as const;

// Get translated status
export function getTranslatedStatus(status: string): string {
  return (
    STATUS_TRANSLATIONS[status as keyof typeof STATUS_TRANSLATIONS] ?? status
  );
}

// Get status list for operation type
export function getStatusesForOperationType(
  operationType: OperationType,
  prospectType?: "search" | "listing",
): readonly string[] {
  switch (operationType) {
    case "prospects":
      // For dual-type prospects, return the appropriate Spanish workflow
      if (prospectType === "listing") {
        return LISTING_PROSPECT_STATUSES;
      } else if (prospectType === "search") {
        return SEARCH_PROSPECT_STATUSES;
      }
      // Fallback to legacy statuses
      return PROSPECT_STATUSES;
    case "leads":
      return LEAD_STATUSES;
    case "deals":
      return DEAL_STATUSES;
    default:
      return [];
  }
}

// Validate status transitions
export function isValidStatusTransition(
  operationType: OperationType,
  fromStatus: string,
  toStatus: string,
  prospectType?: "search" | "listing",
): boolean {
  const validStatuses = getStatusesForOperationType(
    operationType,
    prospectType,
  );
  return validStatuses.includes(fromStatus) && validStatuses.includes(toStatus);
}

// Enhanced validation for dual-type prospects with workflow rules
export function isValidDualProspectStatusTransition(
  prospectType: "search" | "listing",
  fromStatus: string,
  toStatus: string,
): { valid: boolean; error?: string } {
  const workflows = {
    listing: LISTING_PROSPECT_STATUSES,
    search: SEARCH_PROSPECT_STATUSES,
  };

  const validStatuses = workflows[prospectType];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  const fromIndex = validStatuses.indexOf(fromStatus as any);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  const toIndex = validStatuses.indexOf(toStatus as any);

  // Check if statuses exist in the workflow
  if (fromIndex === -1 || toIndex === -1) {
    return {
      valid: false,
      error: `Estado no válido para prospecto de tipo ${prospectType}`,
    };
  }

  // Allow backward movement for corrections or forward movement by one step
  if (toIndex < fromIndex - 1 || toIndex > fromIndex + 1) {
    return {
      valid: false,
      error: "Solo se permite avanzar un estado o retroceder un estado",
    };
  }

  return { valid: true };
}

// Zod schemas for server action validation
export const StatusUpdateSchema = z.object({
  operationId: z.string().transform((val) => BigInt(val)),
  operationType: z.enum(["prospects", "leads", "deals"]),
  fromStatus: z.string(),
  toStatus: z.string(),
  accountId: z.string().transform((val) => BigInt(val)),
});

export const BulkActionSchema = z.object({
  action: z.enum(["assign", "updateStatus", "createTasks", "export"]),
  operationIds: z.array(z.string().transform((val) => BigInt(val))),
  operationType: z.enum(["prospects", "leads", "deals"]),
  targetValue: z.string().optional(), // For assign user ID or new status
  accountId: z.string().transform((val) => BigInt(val)),
});

// Table column definitions for each operation type
export interface TableColumn {
  key: string;
  title: string;
  sortable?: boolean;
  width?: string;
  className?: string;
}

export const PROSPECT_TABLE_COLUMNS: TableColumn[] = [
  { key: "select", title: "", width: "w-12" },
  { key: "contactName", title: "Contact", sortable: true },
  { key: "needSummary", title: "Need Summary", width: "w-64" },
  { key: "status", title: "Status", sortable: true, width: "w-24" },
  { key: "urgencyLevel", title: "Urgency", sortable: true, width: "w-20" },
  {
    key: "lastActivity",
    title: "Last Activity",
    sortable: true,
    width: "w-32",
  },
  { key: "nextTask", title: "Next Task", width: "w-48" },
  { key: "actions", title: "", width: "w-16" },
];

export const LEAD_TABLE_COLUMNS: TableColumn[] = [
  { key: "select", title: "", width: "w-12" },
  { key: "contactName", title: "Contact", sortable: true },
  { key: "listingAddress", title: "Listing", sortable: true, width: "w-64" },
  { key: "source", title: "Source", sortable: true, width: "w-24" },
  { key: "status", title: "Status", sortable: true, width: "w-24" },
  {
    key: "lastActivity",
    title: "Last Activity",
    sortable: true,
    width: "w-32",
  },
  { key: "nextTask", title: "Next Task", width: "w-48" },
  { key: "actions", title: "", width: "w-16" },
];

export const DEAL_TABLE_COLUMNS: TableColumn[] = [
  { key: "select", title: "", width: "w-12" },
  { key: "listingAddress", title: "Listing", sortable: true },
  { key: "status", title: "Stage", sortable: true, width: "w-24" },
  { key: "amount", title: "Amount", sortable: true, width: "w-32" },
  { key: "closeDate", title: "Close Date", sortable: true, width: "w-32" },
  { key: "participants", title: "Participants", width: "w-48" },
  {
    key: "lastActivity",
    title: "Last Activity",
    sortable: true,
    width: "w-32",
  },
  { key: "nextTask", title: "Next Task", width: "w-48" },
  { key: "actions", title: "", width: "w-16" },
];

// Get table columns for operation type
export function getTableColumnsForOperationType(
  operationType: OperationType,
): TableColumn[] {
  switch (operationType) {
    case "prospects":
      return PROSPECT_TABLE_COLUMNS;
    case "leads":
      return LEAD_TABLE_COLUMNS;
    case "deals":
      return DEAL_TABLE_COLUMNS;
    default:
      return [];
  }
}

// Type definitions for server queries
export interface KanbanData {
  columns: KanbanColumn[];
  totalCount: number;
}

export interface OperationFilters {
  listingType?: ListingTypeFilter;
  status?: string;
  searchQuery?: string;
  page?: number;
  limit?: number;
}

// Server action result types
export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type StatusUpdateResult = ActionResult<{
  operationId: bigint;
  newStatus: string;
  updatedAt: Date;
}>;

export type BulkActionResult = ActionResult<{
  affectedCount: number;
  results: Array<{
    operationId: bigint;
    success: boolean;
    error?: string;
  }>;
}>;
