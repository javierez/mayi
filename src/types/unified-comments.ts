/**
 * Unified comment type definitions for displaying comments from multiple sources
 * (user comments, appointment comments, listing contact comments) in a single view
 */

// Comment source types
export type CommentSource = "contact" | "appointment" | "listing_contact";

// Metadata for appointment comments (for display label)
export interface AppointmentMetadata {
  appointmentId: bigint;
  type: string | null; // "Visita", "Reunión", "Firma", etc.
  datetimeStart: Date; // For display: "15 Dic 2024"
  title: string | null; // Appointment title
}

// Metadata for listing contact comments (for display label)
export interface ListingContactMetadata {
  listingContactId: bigint;
  listingId: bigint | null;
  propertyAddress: string; // Property street + city
  propertyTitle: string | null;
  contactType: string; // "buyer", "owner", "viewer"
}

// User info common to all comment types
export interface CommentUser {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  image?: string | null;
  initials: string;
}

// Unified comment structure that can represent any of the three comment types
export interface UnifiedComment {
  // Common fields (present in all comment types)
  commentId: bigint;
  userId: string;
  content: string;
  parentId: bigint | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: CommentUser;
  replies: UnifiedComment[];

  // Source identification
  source: CommentSource;

  // Source-specific IDs (for CRUD operations - only one will be set)
  contactId?: bigint; // For "contact" source
  appointmentId?: bigint; // For "appointment" source
  listingContactId?: bigint; // For "listing_contact" source

  // Source-specific metadata (for display labels)
  appointmentMeta?: AppointmentMetadata; // Only for "appointment" source
  listingContactMeta?: ListingContactMetadata; // Only for "listing_contact" source

  // Optional: category for listing contact comments
  category?: string | null;

  // UI state for optimistic updates
  status?: "sending" | "sent" | "error";
}

// Form data for creating a unified comment
export interface CreateUnifiedCommentFormData {
  content: string;
  parentId?: bigint | null;
  source: CommentSource;
  // Source-specific IDs (only one should be provided based on source)
  contactId?: bigint;
  appointmentId?: bigint;
  listingContactId?: bigint;
  // Optional category for listing contact comments
  category?: string | null;
}

// Result type for unified comment actions
export interface UnifiedCommentActionResult {
  success: boolean;
  error?: string;
}
