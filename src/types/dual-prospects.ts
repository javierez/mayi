import { z } from "zod";

// Dual-type prospect system with discriminator pattern
export interface BaseProspect {
  id: bigint;
  contactId: bigint;
  status: string;
  listingType: "Sale" | "Rent";
  prospectType: "search" | "listing"; // Discriminator field
  urgencyLevel?: number;
  notesInternal?: string;
  createdAt: Date;
  updatedAt: Date;
  // Contact information (from JOIN)
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

// Search Prospect: People looking FOR properties to buy/rent
export interface SearchProspect extends BaseProspect {
  prospectType: "search";
  // Property search criteria
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  preferredCities?: string[]; // City names: ["León", "Alicante"]
  preferredAreas?: Array<{ name: string }>; // Neighborhood names: [{name: "Moisés de León"}]
  minBedrooms?: number;
  minBathrooms?: number;
  minSquareMeters?: number;
  maxSquareMeters?: number;
  moveInBy?: Date;
  extras?: Record<string, boolean>;
  fundingReady?: boolean;
}

// Listing Prospect: People wanting to LIST properties for sale/rent
export interface ListingProspect extends BaseProspect {
  prospectType: "listing";
  // Property to be listed information
  propertyToList?: {
    address: string;
    propertyType: string;
    estimatedValue: number;
    condition: string;
    readyToList: boolean;
    bedrooms?: number;
    bathrooms?: number;
    squareMeters?: number;
    description?: string;
  };
  valuationStatus?: "pending" | "scheduled" | "completed";
  listingAgreementStatus?: "not_started" | "in_progress" | "signed";
}

// Union type for type-safe handling
export type DualProspect = SearchProspect | ListingProspect;

// Type guards for discriminating between prospect types
export function isSearchProspect(
  prospect: DualProspect,
): prospect is SearchProspect {
  return prospect.prospectType === "search";
}

export function isListingProspect(
  prospect: DualProspect,
): prospect is ListingProspect {
  return prospect.prospectType === "listing";
}

// Spanish status workflows for each prospect type
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

export type ListingProspectStatus = (typeof LISTING_PROSPECT_STATUSES)[number];
export type SearchProspectStatus = (typeof SEARCH_PROSPECT_STATUSES)[number];

// Spanish translations for valuation statuses
export const VALUATION_STATUS_TRANSLATIONS = {
  pending: "Pendiente",
  scheduled: "Programada",
  completed: "Completada",
} as const;

// Spanish translations for listing agreement statuses
export const LISTING_AGREEMENT_STATUS_TRANSLATIONS = {
  not_started: "No iniciado",
  in_progress: "En progreso",
  signed: "Firmado",
} as const;

// Zod schemas for server action validation
export const DualProspectStatusUpdateSchema = z.object({
  prospectId: z.string().transform((val) => BigInt(val)),
  prospectType: z.enum(["search", "listing"]),
  fromStatus: z.string(),
  toStatus: z.string(),
  accountId: z.string().transform((val) => BigInt(val)),
});

export const CreateSearchProspectSchema = z.object({
  contactId: z.string().transform((val) => BigInt(val)),
  status: z.string().default("Información básica"),
  listingType: z.enum(["Sale", "Rent"]),
  propertyType: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  preferredCities: z.array(z.string()).optional(),
  preferredAreas: z
    .array(
      z.object({
        name: z.string(),
      }),
    )
    .optional(),
  minBedrooms: z.number().optional(),
  minBathrooms: z.number().optional(),
  minSquareMeters: z.number().optional(),
  maxSquareMeters: z.number().optional(),
  moveInBy: z.date().optional(),
  extras: z.record(z.boolean()).optional(),
  urgencyLevel: z.number().min(1).max(5).optional(),
  fundingReady: z.boolean().optional(),
  notesInternal: z.string().optional(),
});

export const CreateListingProspectSchema = z.object({
  contactId: z.string().transform((val) => BigInt(val)),
  status: z.string().default("Información básica"),
  listingType: z.enum(["Sale", "Rent"]),
  propertyToList: z.object({
    address: z.string(),
    propertyType: z.string(),
    estimatedValue: z.number(),
    condition: z.string(),
    readyToList: z.boolean().default(false),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    squareMeters: z.number().optional(),
    description: z.string().optional(),
  }),
  valuationStatus: z
    .enum(["pending", "scheduled", "completed"])
    .default("pending"),
  listingAgreementStatus: z
    .enum(["not_started", "in_progress", "signed"])
    .default("not_started"),
  urgencyLevel: z.number().min(1).max(5).optional(),
  notesInternal: z.string().optional(),
});

export const BulkDualProspectActionSchema = z.object({
  action: z.enum(["assign", "updateStatus", "createTasks", "export"]),
  prospectIds: z.array(z.string().transform((val) => BigInt(val))),
  prospectType: z.enum(["search", "listing"]).optional(),
  targetValue: z.string().optional(), // For assign user ID or new status
  accountId: z.string().transform((val) => BigInt(val)),
});

// Utility types for prospect filtering
export type ProspectTypeFilter = "search" | "listing" | "all";

export interface DualProspectFilters {
  prospectType?: ProspectTypeFilter;
  listingType?: "sale" | "rent" | "all";
  status?: string;
  urgencyLevel?: number;
  searchQuery?: string;
  page?: number;
  limit?: number;
}

// Enhanced operation card interface for dual-type prospects
export interface DualProspectOperationCard {
  id: bigint;
  type: "prospect";
  status: string;
  listingType: "Sale" | "Rent";
  prospectType: "search" | "listing";

  // Contact information
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;

  // Common fields
  urgencyLevel?: number;
  lastActivity?: Date;
  nextTask?: string;

  // Search prospect specific fields
  needSummary?: string; // Generated summary of search criteria
  budgetRange?: string; // Formatted price range
  preferredAreasText?: string; // Formatted areas list

  // Listing prospect specific fields
  propertyAddress?: string;
  estimatedValue?: number;
  valuationStatus?: string;
  listingAgreementStatus?: string;
  propertyCondition?: string;
}

// Prospect summary builder utility types
export interface ProspectSummary {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  tags: string[];
}

// Type for prospect statistics
export interface ProspectStatistics {
  totalCount: number;
  searchCount: number;
  listingCount: number;
  byStatus: Record<string, number>;
  byListingType: Record<string, number>;
  averageUrgency: number;
}
