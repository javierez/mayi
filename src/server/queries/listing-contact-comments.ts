"use server";

import { db } from "../db";
import { listingContactComments, users, listingContacts, contacts } from "../db/schema";
import { eq, and, sql, desc, isNull } from "drizzle-orm";
import { getCurrentUserAccountId } from "../../lib/dal";

// Types for listing contact comments
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

// Wrapper functions that automatically get accountId from current session
export async function getListingContactCommentsByIdWithAuth(listingContactId: bigint) {
  const accountId = await getCurrentUserAccountId();
  return getListingContactCommentsById(listingContactId, accountId);
}

export async function getListingContactCommentByIdWithAuth(commentId: bigint) {
  const accountId = await getCurrentUserAccountId();
  return getListingContactCommentById(commentId, accountId);
}

// Core query functions with account security

export async function getListingContactCommentsById(
  listingContactId: bigint,
  accountId: number,
): Promise<ListingContactCommentWithUser[]> {
  try {
    // Get top-level comments (parentId is null) with user data
    const topLevelComments = await db
      .select({
        commentId: listingContactComments.commentId,
        listingContactId: listingContactComments.listingContactId,
        userId: listingContactComments.userId,
        content: listingContactComments.content,
        category: sql<string | null>`${listingContactComments.category}`,
        parentId: listingContactComments.parentId,
        isDeleted: sql<boolean>`COALESCE(${listingContactComments.isDeleted}, false)`,
        createdAt: listingContactComments.createdAt,
        updatedAt: listingContactComments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`CONCAT(LEFT(${users.firstName}, 1), LEFT(${users.lastName}, 1))`,
        },
      })
      .from(listingContactComments)
      .innerJoin(users, eq(listingContactComments.userId, users.id))
      .innerJoin(listingContacts, eq(listingContactComments.listingContactId, listingContacts.listingContactId))
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContactComments.listingContactId, listingContactId),
          eq(listingContactComments.isDeleted, false),
          isNull(listingContactComments.parentId),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      )
      .orderBy(desc(listingContactComments.createdAt));

    // Get all replies for these comments
    const result: ListingContactCommentWithUser[] = [];
    for (const comment of topLevelComments) {
      const replies = await getListingContactCommentReplies(comment.commentId, accountId);
      result.push({
        ...comment,
        replies,
      });
    }

    return result;
  } catch (error) {
    console.error("Error fetching listing contact comments:", error);
    throw error;
  }
}

export async function getListingContactCommentById(
  commentId: bigint,
  accountId: number,
): Promise<ListingContactCommentWithUser | null> {
  try {
    const [comment] = await db
      .select({
        commentId: listingContactComments.commentId,
        listingContactId: listingContactComments.listingContactId,
        userId: listingContactComments.userId,
        content: listingContactComments.content,
        category: sql<string | null>`${listingContactComments.category}`,
        parentId: listingContactComments.parentId,
        isDeleted: sql<boolean>`COALESCE(${listingContactComments.isDeleted}, false)`,
        createdAt: listingContactComments.createdAt,
        updatedAt: listingContactComments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`CONCAT(LEFT(${users.firstName}, 1), LEFT(${users.lastName}, 1))`,
        },
      })
      .from(listingContactComments)
      .innerJoin(users, eq(listingContactComments.userId, users.id))
      .innerJoin(listingContacts, eq(listingContactComments.listingContactId, listingContacts.listingContactId))
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContactComments.commentId, commentId),
          eq(listingContactComments.isDeleted, false),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      );

    if (!comment) {
      return null;
    }

    // Get replies if this is a top-level comment
    const replies = comment.parentId
      ? []
      : await getListingContactCommentReplies(comment.commentId, accountId);

    return {
      ...comment,
      replies,
    };
  } catch (error) {
    console.error("Error fetching listing contact comment by ID:", error);
    throw error;
  }
}

export async function getListingContactCommentReplies(
  parentCommentId: bigint,
  accountId: number,
): Promise<ListingContactCommentWithUser[]> {
  try {
    const replies = await db
      .select({
        commentId: listingContactComments.commentId,
        listingContactId: listingContactComments.listingContactId,
        userId: listingContactComments.userId,
        content: listingContactComments.content,
        category: sql<string | null>`${listingContactComments.category}`,
        parentId: listingContactComments.parentId,
        isDeleted: sql<boolean>`COALESCE(${listingContactComments.isDeleted}, false)`,
        createdAt: listingContactComments.createdAt,
        updatedAt: listingContactComments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`CONCAT(LEFT(${users.firstName}, 1), LEFT(${users.lastName}, 1))`,
        },
      })
      .from(listingContactComments)
      .innerJoin(users, eq(listingContactComments.userId, users.id))
      .innerJoin(listingContacts, eq(listingContactComments.listingContactId, listingContacts.listingContactId))
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContactComments.parentId, parentCommentId),
          eq(listingContactComments.isDeleted, false),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      )
      .orderBy(listingContactComments.createdAt);

    return replies.map((reply) => ({
      ...reply,
      replies: [], // Replies don't have sub-replies
    }));
  } catch (error) {
    console.error("Error fetching listing contact comment replies:", error);
    throw error;
  }
}

// Create a new listing contact comment
export async function createListingContactComment(
  data: Omit<
    ListingContactComment,
    "commentId" | "createdAt" | "updatedAt" | "isDeleted"
  >,
  accountId: number,
) {
  try {
    // Verify the listing contact belongs to this account
    const [listingContact] = await db
      .select({ listingContactId: listingContacts.listingContactId })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContacts.listingContactId, data.listingContactId),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      );

    if (!listingContact) {
      throw new Error("Listing contact not found or access denied");
    }

    // If it's a reply, verify parent comment exists and belongs to same listing contact
    if (data.parentId) {
      const [parentComment] = await db
        .select({ listingContactId: listingContactComments.listingContactId })
        .from(listingContactComments)
        .innerJoin(listingContacts, eq(listingContactComments.listingContactId, listingContacts.listingContactId))
        .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
        .where(
          and(
            eq(listingContactComments.commentId, data.parentId),
            eq(listingContactComments.isDeleted, false),
            eq(contacts.accountId, BigInt(accountId)),
          ),
        );

      if (!parentComment) {
        throw new Error("Parent comment not found or access denied");
      }

      if (parentComment.listingContactId !== data.listingContactId) {
        throw new Error(
          "Reply must belong to the same listing contact as parent comment",
        );
      }
    }

    const [result] = await db
      .insert(listingContactComments)
      .values({
        ...data,
        isDeleted: false,
      })
      .returning();

    if (!result) throw new Error("Failed to create listing contact comment");

    const [newComment] = await db
      .select({
        commentId: sql<number>`CAST(${listingContactComments.commentId} AS BIGINT)`,
        listingContactId: sql<number>`CAST(${listingContactComments.listingContactId} AS BIGINT)`,
        userId: listingContactComments.userId,
        content: listingContactComments.content,
        category: listingContactComments.category,
        parentId: sql<number>`CAST(${listingContactComments.parentId} AS BIGINT)`,
        isDeleted: listingContactComments.isDeleted,
        createdAt: listingContactComments.createdAt,
        updatedAt: listingContactComments.updatedAt,
      })
      .from(listingContactComments)
      .where(eq(listingContactComments.commentId, BigInt(result.commentId)));

    return newComment;
  } catch (error) {
    console.error("Error creating listing contact comment:", error);
    throw error;
  }
}

// Update listing contact comment
export async function updateListingContactComment(
  commentId: bigint,
  content: string,
  accountId: number,
  category?: string | null,
) {
  try {
    // First verify the comment belongs to this account
    const [existingComment] = await db
      .select({ commentId: listingContactComments.commentId })
      .from(listingContactComments)
      .innerJoin(listingContacts, eq(listingContactComments.listingContactId, listingContacts.listingContactId))
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContactComments.commentId, commentId),
          eq(listingContactComments.isDeleted, false),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      );

    if (!existingComment) {
      throw new Error("Listing contact comment not found or access denied");
    }

    const updateData: { content: string; category?: string | null } = { content };
    if (category !== undefined) {
      updateData.category = category;
    }

    await db
      .update(listingContactComments)
      .set(updateData)
      .where(
        and(
          eq(listingContactComments.commentId, commentId),
          eq(listingContactComments.isDeleted, false),
        ),
      );

    return { success: true };
  } catch (error) {
    console.error("Error updating listing contact comment:", error);
    throw error;
  }
}

// Delete listing contact comment (soft delete)
export async function deleteListingContactComment(commentId: bigint, accountId: number) {
  try {
    // First verify the comment belongs to this account
    const [existingComment] = await db
      .select({ commentId: listingContactComments.commentId })
      .from(listingContactComments)
      .innerJoin(listingContacts, eq(listingContactComments.listingContactId, listingContacts.listingContactId))
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContactComments.commentId, commentId),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      );

    if (!existingComment) {
      throw new Error("Listing contact comment not found or access denied");
    }

    // Soft delete the comment and any replies
    await db
      .update(listingContactComments)
      .set({ isDeleted: true })
      .where(and(eq(listingContactComments.commentId, commentId)));

    // Also soft delete any replies to this comment
    await db
      .update(listingContactComments)
      .set({ isDeleted: true })
      .where(eq(listingContactComments.parentId, commentId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting listing contact comment:", error);
    throw error;
  }
}
