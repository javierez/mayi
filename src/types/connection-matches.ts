import type { ListingWithDetails } from "~/server/queries/operations-listings";

// Simple type for prospect with contact data (matching database structure)
export type ProspectWithContact = {
  prospects: {
    id: bigint;
    contactId: bigint;
    status: string;
    listingType: string | null;
    propertyType: string | null;
    minPrice: string | null;
    maxPrice: string | null;
    preferredAreas: unknown;
    minBedrooms: number | null;
    minBathrooms: number | null;
    minSquareMeters: number | null;
    maxSquareMeters: number | null;
    moveInBy: Date | null;
    extras: unknown;
    urgencyLevel: number | null;
    fundingReady: boolean | null;
    notesInternal: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  contacts: {
    contactId: bigint;
    accountId: bigint;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    additionalInfo: unknown;
    orgId: bigint | null;
    isActive: boolean | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

// Core matching data structures ensuring type safety and consistency

// Match result with tolerance indicators
export interface ProspectMatch {
  prospectId: bigint;
  listingId: bigint;
  listingAccountId: bigint;
  matchType: "strict" | "near-strict";
  toleranceReasons: string[]; // e.g., ["Price +3.2%", "Area -4.1%"]

  // Embedded prospect and listing data
  prospect: ProspectWithContact;
  listing: ListingWithDetails;

  // Calculated match scores
  priceMatch: "exact" | "tolerance" | "out-of-range";
  areaMatch: "exact" | "tolerance" | "out-of-range";

  // Cross-account privacy
  isCrossAccount: boolean;
  canContact: boolean;

  // Lead information
  existingLead?: {
    listingContactId: bigint;
    status: string;
    createdAt: Date;
  };
  hasExistingLead: boolean;
}

// Filtering options
export interface MatchFilters {
  accountScope: "current" | "cross-account" | "all";
  includeNearStrict: boolean;
  propertyTypes: string[];
  locationIds: bigint[];
  minPrice?: number;
  maxPrice?: number;
  // Prospect-specific filters from prospect-filter.tsx
  prospectTypes?: string[];
  listingTypes?: string[];
  statuses?: string[];
  urgencyLevels?: string[];
}

// Paginated results
export interface MatchResults {
  matches: ProspectMatch[];
  totalCount: number;
  hasNextPage: boolean;
  filters: MatchFilters;
}

// Query parameters for matching function
export interface MatchQueryParams {
  prospectIds?: bigint[];
  filters: MatchFilters;
  pagination: {
    offset: number;
    limit: number;
  };
}

// Raw result from SQL query before processing
export interface RawMatchResult {
  // Prospect fields
  prospectId: bigint;
  prospectListingType: string | null;
  prospectPropertyType: string | null;
  prospectMinPrice: string | null;
  prospectMaxPrice: string | null;
  prospectMinBedrooms: number | null;
  prospectMinBathrooms: number | null;
  prospectMinSquareMeters: number | null;
  prospectMaxSquareMeters: number | null;
  prospectPreferredAreas: unknown;
  prospectExtras: unknown;

  // Listing + Property fields (flattened for performance)
  listingId: bigint;
  listingPrice: string;
  listingType: string;
  listingAccountId: bigint;
  propertyType: string | null;
  propertyBedrooms: number | null;
  propertyBathrooms: string | null;
  propertySquareMeters: number | null;
  propertyNeighborhoodId: bigint | null;

  // Location and contact info
  neighborhoodName: string | null;
  municipality: string | null;
  ownerContactId: bigint | null;
  ownerName: string | null;

  // Property features for must-have matching
  hasElevator: boolean | null;
  hasGarage: boolean | null;
  hasStorageRoom: boolean | null;
  terrace: boolean | null;
}

// Action result types for save/dismiss/contact actions
export interface MatchActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

// Actions available for each match
export type MatchAction =
  | "save"
  | "dismiss"
  | "contact"
  | "request-contact"
  | "create-lead"
  | "share";

// Match preferences for user settings
export interface MatchPreferences {
  autoIncludeNearStrict: boolean;
  defaultAccountScope: "current" | "cross-account" | "all";
  preferredPropertyTypes: string[];
  maxTolerancePercentage: number; // Default 5%
  enableEmailNotifications: boolean;
}

// Tolerance calculation helpers
export interface ToleranceResult {
  isWithinOriginal: boolean;
  isWithinTolerance: boolean;
  percentageDifference: number;
  reason?: string;
}

// Property features matching requirements
export interface FeatureRequirements {
  mustHave: string[]; // Features that are absolutely required
  preferred: string[]; // Features that are nice to have
  dealBreakers: string[]; // Features that would disqualify a match
}

// Location matching details
export interface LocationMatch {
  neighborhoodId: bigint;
  name: string;
  municipality: string;
  exactMatch: boolean; // True if exact neighborhood match, false if broader area match
}

// Export utility type for client-side usage (BigInt to string conversion)
export type ClientSafeProspectMatch = Omit<
  ProspectMatch,
  "prospectId" | "listingId"
> & {
  prospectId: string;
  listingId: string;
};

export type ClientSafeMatchResults = Omit<MatchResults, "matches"> & {
  matches: ClientSafeProspectMatch[];
};
