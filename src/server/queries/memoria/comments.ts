import { db } from "~/server/db";
import { comments, users } from "~/server/db/schema";
import { eq, and, isNull, asc } from "drizzle-orm";
import type { Comment } from "~/types/memoria";

/**
 * Get all comments for a memory (with threading support)
 */
export async function getCommentsForMemory(memoryId: bigint): Promise<Comment[]> {
  // Get all comments for the memory
  const result = await db
    .select({
      id: comments.id,
      memoryId: comments.memoryId,
      userId: comments.userId,
      content: comments.content,
      parentId: comments.parentId,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      isDeleted: comments.isDeleted,
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        image: users.image,
      },
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.userId))
    .where(and(eq(comments.memoryId, memoryId), eq(comments.isDeleted, false)))
    .orderBy(asc(comments.createdAt));

  // Build threaded structure
  const commentsMap = new Map<bigint, Comment>();
  const rootComments: Comment[] = [];

  // First pass: create all comments
  for (const row of result) {
    const comment: Comment = {
      id: row.id,
      memoryId: row.memoryId,
      userId: row.userId,
      content: row.content,
      parentId: row.parentId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      isDeleted: row.isDeleted ?? false,
      user: row.user,
      replies: [],
    };
    commentsMap.set(row.id, comment);
  }

  // Second pass: build tree
  for (const [, comment] of commentsMap) {
    if (comment.parentId) {
      const parent = commentsMap.get(comment.parentId);
      if (parent) {
        parent.replies = parent.replies ?? [];
        parent.replies.push(comment);
      }
    } else {
      rootComments.push(comment);
    }
  }

  return rootComments;
}

/**
 * Get a single comment by ID
 */
export async function getCommentById(commentId: bigint): Promise<Comment | null> {
  const result = await db
    .select({
      id: comments.id,
      memoryId: comments.memoryId,
      userId: comments.userId,
      content: comments.content,
      parentId: comments.parentId,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      isDeleted: comments.isDeleted,
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        image: users.image,
      },
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.userId))
    .where(and(eq(comments.id, commentId), eq(comments.isDeleted, false)))
    .limit(1);

  if (result.length === 0) return null;

  const row = result[0]!;
  return {
    id: row.id,
    memoryId: row.memoryId,
    userId: row.userId,
    content: row.content,
    parentId: row.parentId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    isDeleted: row.isDeleted ?? false,
    user: row.user,
  };
}

/**
 * Add a comment to a memory
 */
export async function addComment(
  memoryId: bigint,
  userId: string,
  content: string,
  parentId?: bigint
): Promise<Comment> {
  const result = await db
    .insert(comments)
    .values({
      memoryId,
      userId,
      content,
      parentId: parentId ?? null,
    })
    .returning();

  // Get user info
  const userResult = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const row = result[0]!;
  const user = userResult[0]!;

  return {
    id: row.id,
    memoryId: row.memoryId,
    userId: row.userId,
    content: row.content,
    parentId: row.parentId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    isDeleted: row.isDeleted ?? false,
    user,
  };
}

/**
 * Update a comment
 */
export async function updateComment(
  commentId: bigint,
  content: string
): Promise<Comment | null> {
  const result = await db
    .update(comments)
    .set({
      content,
      updatedAt: new Date(),
    })
    .where(eq(comments.id, commentId))
    .returning();

  if (result.length === 0) return null;

  // Get user info
  const row = result[0]!;
  const userResult = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, row.userId))
    .limit(1);

  const user = userResult[0]!;

  return {
    id: row.id,
    memoryId: row.memoryId,
    userId: row.userId,
    content: row.content,
    parentId: row.parentId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    isDeleted: row.isDeleted ?? false,
    user,
  };
}

/**
 * Delete a comment (soft delete)
 */
export async function deleteComment(commentId: bigint): Promise<boolean> {
  await db
    .update(comments)
    .set({
      isDeleted: true,
      updatedAt: new Date(),
    })
    .where(eq(comments.id, commentId));

  return true;
}

/**
 * Check if a user can modify a comment (owner only)
 */
export async function canUserModifyComment(
  commentId: bigint,
  userId: string
): Promise<boolean> {
  const result = await db
    .select({ userId: comments.userId })
    .from(comments)
    .where(and(eq(comments.id, commentId), eq(comments.isDeleted, false)))
    .limit(1);

  return result.length > 0 && result[0]!.userId === userId;
}

/**
 * Get comment count for a memory
 */
export async function getCommentCount(memoryId: bigint): Promise<number> {
  const result = await db
    .select({ id: comments.id })
    .from(comments)
    .where(and(eq(comments.memoryId, memoryId), eq(comments.isDeleted, false)));

  return result.length;
}
