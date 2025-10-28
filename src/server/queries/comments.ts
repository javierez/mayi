"use server";

import { db } from "../db";
import { comments, users, listings, properties } from "../db/schema";
import { eq, and, sql, desc, isNull } from "drizzle-orm";
import type { CommentWithUser } from "../../types/comments";
import { getCurrentUserAccountId } from "../../lib/dal";

// Wrapper functions that automatically get accountId from current session
// These maintain backward compatibility while adding account filtering

export async function getCommentsByPropertyIdWithAuth(propertyId: bigint) {
  const accountId = await getCurrentUserAccountId();
  return getCommentsByPropertyId(propertyId, accountId);
}

export async function getCommentsByListingIdWithAuth(listingId: bigint) {
  const accountId = await getCurrentUserAccountId();
  return getCommentsByListingId(listingId, accountId);
}

export async function getCommentByIdWithAuth(commentId: bigint) {
  const accountId = await getCurrentUserAccountId();
  return getCommentById(commentId, accountId);
}

export async function getCommentRepliesWithAuth(parentCommentId: bigint) {
  const accountId = await getCurrentUserAccountId();
  return getCommentReplies(parentCommentId, accountId);
}

// Core query functions with account security

export async function getCommentsByPropertyId(
  propertyId: bigint,
  accountId: number,
): Promise<CommentWithUser[]> {
  try {
    // Get top-level comments (parentId is null) with user data
    const topLevelComments = await db
      .select({
        commentId: comments.commentId,
        listingId: comments.listingId,
        propertyId: comments.propertyId,
        userId: comments.userId,
        content: comments.content,
        category: sql<string | null>`${comments.category}`,
        parentId: comments.parentId,
        isDeleted: sql<boolean>`COALESCE(${comments.isDeleted}, false)`,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        user: {
          id: sql<string>`COALESCE(${users.id}, '0')`,
          name: sql<string>`COALESCE(${users.name}, 'Sistema')`,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`COALESCE(CONCAT(LEFT(${users.firstName}, 1), LEFT(${users.lastName}, 1)), 'SI')`,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .innerJoin(listings, eq(comments.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(comments.propertyId, propertyId),
          eq(comments.isDeleted, false),
          isNull(comments.parentId),
          eq(properties.accountId, BigInt(accountId)),
        ),
      )
      .orderBy(desc(comments.createdAt));

    // Get all replies for these comments
    const result: CommentWithUser[] = [];
    for (const comment of topLevelComments) {
      const replies = await getCommentReplies(comment.commentId, accountId);
      result.push({
        ...comment,
        replies,
      });
    }

    return result;
  } catch (error) {
    console.error("Error fetching comments by property ID:", error);
    throw error;
  }
}

export async function getCommentsByListingId(
  listingId: bigint,
  accountId: number,
): Promise<CommentWithUser[]> {
  try {
    // Get top-level comments (parentId is null) with user data
    const topLevelComments = await db
      .select({
        commentId: comments.commentId,
        listingId: comments.listingId,
        propertyId: comments.propertyId,
        userId: comments.userId,
        content: comments.content,
        category: sql<string | null>`${comments.category}`,
        parentId: comments.parentId,
        isDeleted: sql<boolean>`COALESCE(${comments.isDeleted}, false)`,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        user: {
          id: sql<string>`COALESCE(${users.id}, '0')`,
          name: sql<string>`COALESCE(${users.name}, 'Sistema')`,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`COALESCE(CONCAT(LEFT(${users.firstName}, 1), LEFT(${users.lastName}, 1)), 'SI')`,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .innerJoin(listings, eq(comments.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(comments.listingId, listingId),
          eq(comments.isDeleted, false),
          isNull(comments.parentId),
          eq(properties.accountId, BigInt(accountId)),
        ),
      )
      .orderBy(desc(comments.createdAt));

    // Get all replies for these comments
    const result: CommentWithUser[] = [];
    for (const comment of topLevelComments) {
      const replies = await getCommentReplies(comment.commentId, accountId);
      result.push({
        ...comment,
        replies,
      });
    }

    return result;
  } catch (error) {
    console.error("Error fetching comments by listing ID:", error);
    throw error;
  }
}

export async function getCommentById(
  commentId: bigint,
  accountId: number,
): Promise<CommentWithUser | null> {
  try {
    const [comment] = await db
      .select({
        commentId: comments.commentId,
        listingId: comments.listingId,
        propertyId: comments.propertyId,
        userId: comments.userId,
        content: comments.content,
        category: sql<string | null>`${comments.category}`,
        parentId: comments.parentId,
        isDeleted: sql<boolean>`COALESCE(${comments.isDeleted}, false)`,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        user: {
          id: sql<string>`COALESCE(${users.id}, '0')`,
          name: sql<string>`COALESCE(${users.name}, 'Sistema')`,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`COALESCE(CONCAT(LEFT(${users.firstName}, 1), LEFT(${users.lastName}, 1)), 'SI')`,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .innerJoin(listings, eq(comments.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(comments.commentId, commentId),
          eq(comments.isDeleted, false),
          eq(properties.accountId, BigInt(accountId)),
        ),
      );

    if (!comment) {
      return null;
    }

    // Get replies if this is a top-level comment
    const replies = comment.parentId
      ? []
      : await getCommentReplies(comment.commentId, accountId);

    return {
      ...comment,
      replies,
    };
  } catch (error) {
    console.error("Error fetching comment by ID:", error);
    throw error;
  }
}

export async function getCommentReplies(
  parentCommentId: bigint,
  accountId: number,
): Promise<CommentWithUser[]> {
  try {
    const replies = await db
      .select({
        commentId: comments.commentId,
        listingId: comments.listingId,
        propertyId: comments.propertyId,
        userId: comments.userId,
        content: comments.content,
        category: sql<string | null>`${comments.category}`,
        parentId: comments.parentId,
        isDeleted: sql<boolean>`COALESCE(${comments.isDeleted}, false)`,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        user: {
          id: sql<string>`COALESCE(${users.id}, '0')`,
          name: sql<string>`COALESCE(${users.name}, 'Sistema')`,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`COALESCE(CONCAT(LEFT(${users.firstName}, 1), LEFT(${users.lastName}, 1)), 'SI')`,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .innerJoin(listings, eq(comments.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(comments.parentId, parentCommentId),
          eq(comments.isDeleted, false),
          eq(properties.accountId, BigInt(accountId)),
        ),
      )
      .orderBy(comments.createdAt); // Replies in chronological order

    return replies.map((reply) => ({
      ...reply,
      replies: [], // Replies don't have nested replies in this implementation
    }));
  } catch (error) {
    console.error("Error fetching comment replies:", error);
    throw error;
  }
}

// Utility function to check if user can modify comment
export async function canUserModifyComment(
  commentId: bigint,
  userId: string,
  accountId: number,
): Promise<boolean> {
  try {
    const [comment] = await db
      .select({ userId: comments.userId })
      .from(comments)
      .innerJoin(listings, eq(comments.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(comments.commentId, commentId),
          eq(comments.isDeleted, false),
          eq(properties.accountId, BigInt(accountId)),
        ),
      );

    return comment?.userId === userId;
  } catch (error) {
    console.error("Error checking comment modification rights:", error);
    return false;
  }
}
