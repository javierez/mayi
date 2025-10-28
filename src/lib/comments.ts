/**
 * Comment utility functions for formatting and helper operations
 */

import type { CommentWithUser } from "~/types/comments";

/**
 * Convert bigint IDs to strings for JSON serialization
 * Following pattern from existing codebase for BigInt handling
 */
export function serializeComment(
  comment: CommentWithUser,
): Record<string, unknown> {
  return {
    ...comment,
    commentId: comment.commentId.toString(),
    listingId: comment.listingId.toString(),
    propertyId: comment.propertyId.toString(),
    parentId: comment.parentId?.toString() ?? null,
    replies: comment.replies.map(serializeComment),
  };
}

/**
 * Generate initials from user first name and last name
 * Fallback to first two characters of name if no separate names
 */
export function generateUserInitials(user: {
  firstName?: string | null;
  lastName?: string | null;
  name: string;
}): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  const nameParts = user.name.trim().split(" ");
  if (nameParts.length >= 2) {
    return `${nameParts[0]!.charAt(0)}${nameParts[1]!.charAt(0)}`.toUpperCase();
  }

  return user.name.substring(0, 2).toUpperCase();
}

/**
 * Build hierarchical comment structure from flat array
 * Useful when fetching all comments at once and organizing them
 */
export function buildCommentHierarchy(
  flatComments: CommentWithUser[],
): CommentWithUser[] {
  const commentMap = new Map<string, CommentWithUser>();
  const topLevelComments: CommentWithUser[] = [];

  // First pass: create map and initialize replies array
  for (const comment of flatComments) {
    commentMap.set(comment.commentId.toString(), {
      ...comment,
      replies: [],
    });
  }

  // Second pass: build hierarchy
  for (const comment of flatComments) {
    const mappedComment = commentMap.get(comment.commentId.toString())!;

    if (comment.parentId) {
      const parentComment = commentMap.get(comment.parentId.toString());
      if (parentComment) {
        parentComment.replies.push(mappedComment);
      }
    } else {
      topLevelComments.push(mappedComment);
    }
  }

  return topLevelComments;
}

/**
 * Validate comment content length and format
 */
export function validateCommentContent(content: string): {
  isValid: boolean;
  error?: string;
} {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return {
      isValid: false,
      error: "El comentario no puede estar vacío",
    };
  }

  if (trimmedContent.length > 2000) {
    return {
      isValid: false,
      error: "El comentario no puede exceder 2000 caracteres",
    };
  }

  return { isValid: true };
}

/**
 * Check if a user can modify a comment (edit/delete)
 * Simple client-side check - server-side validation still required
 */
export function canUserModifyComment(
  comment: CommentWithUser,
  currentUserId?: string,
): boolean {
  return !!(currentUserId && comment.userId === currentUserId);
}

/**
 * Format comment count for display
 */
export function formatCommentCount(count: number): string {
  if (count === 0) return "Sin comentarios";
  if (count === 1) return "1 comentario";
  return `${count} comentarios`;
}

/**
 * Sort comments by creation date (newest first for top-level, oldest first for replies)
 */
export function sortComments(
  comments: CommentWithUser[],
  isReplies = false,
): CommentWithUser[] {
  const sorted = [...comments].sort((a, b) => {
    if (isReplies) {
      // Replies: chronological order (oldest first)
      return a.createdAt.getTime() - b.createdAt.getTime();
    } else {
      // Top-level: newest first
      return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  // Sort replies for each comment
  return sorted.map((comment) => ({
    ...comment,
    replies: sortComments(comment.replies, true),
  }));
}
