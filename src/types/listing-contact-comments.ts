/**
 * Listing Contact Comment type definitions for listing-contact relationship comments system
 * Uses listing_contact_comments table with hierarchical structure and user relationships
 */

export interface ListingContactComment {
  commentId: bigint;
  listingContactId: bigint;
  userId: string;
  content: string;
  category?: string | null;
  parentId?: bigint | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingContactCommentWithUser extends ListingContactComment {
  user: {
    id: string;
    name: string;
    firstName?: string | null;
    lastName?: string | null;
    image?: string | null;
    initials: string;
  };
  replies: ListingContactCommentWithUser[];
}

export interface CreateListingContactCommentFormData {
  listingContactId: string | bigint;
  content: string;
  category?: string | null;
  parentId?: string | bigint | null;
}

export interface UpdateListingContactCommentFormData {
  commentId: string | bigint;
  content: string;
  category?: string | null;
}

export interface ListingContactCommentActionResult {
  success: boolean;
  error?: string;
  data?: ListingContactComment;
}

export interface ListingContactCommentFilters {
  listingContactId?: bigint;
  userId?: string;
  category?: string | null;
  parentId?: bigint | null;
  isDeleted?: boolean;
}

// Comment category options for UI
export const LISTING_CONTACT_COMMENT_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "offer", label: "Oferta" },
  { value: "viewing", label: "Visita" },
  { value: "negotiation", label: "Negociación" },
  { value: "follow_up", label: "Seguimiento" },
  { value: "internal", label: "Interno" },
] as const;

export type ListingContactCommentCategory = typeof LISTING_CONTACT_COMMENT_CATEGORIES[number]["value"];
