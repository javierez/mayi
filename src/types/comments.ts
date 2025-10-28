/**
 * Comment type definitions for property listing comments system
 * Uses comments table with hierarchical structure and user relationships
 */

export interface Comment {
  commentId: bigint;
  listingId: bigint;
  propertyId: bigint;
  userId: string;
  content: string;
  category?: string | null;
  parentId?: bigint | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentWithUser extends Comment {
  user: {
    id: string;
    name: string;
    firstName?: string | null;
    lastName?: string | null;
    image?: string | null;
    initials: string;
  } | null;
  replies: CommentWithUser[];
}

export interface CreateCommentFormData {
  listingId: string | bigint;
  propertyId: string | bigint;
  content: string;
  category?: string | null;
  parentId?: string | bigint | null;
}

export interface UpdateCommentFormData {
  commentId: string | bigint;
  content: string;
}

export interface CommentActionResult {
  success: boolean;
  error?: string;
  data?: Comment;
}

export interface CommentFilters {
  listingId?: bigint;
  propertyId?: bigint;
  userId?: string;
  parentId?: bigint | null;
  isDeleted?: boolean;
}
