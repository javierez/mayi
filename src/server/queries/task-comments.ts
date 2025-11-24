"use server";

import { db } from "../db";
import { taskComments, users, tasks } from "../db/schema";
import { eq, and, sql, desc, isNull } from "drizzle-orm";
import { getCurrentUserAccountId } from "../../lib/dal";
import type {
  TaskComment,
  TaskCommentWithUser,
} from "../../types/task-comments";

// Wrapper functions that automatically get accountId from current session
export async function getTaskCommentsByIdWithAuth(taskId: bigint) {
  const accountId = await getCurrentUserAccountId();
  return getTaskCommentsByTaskId(taskId, accountId);
}

export async function getTaskCommentByIdWithAuth(commentId: bigint) {
  const accountId = await getCurrentUserAccountId();
  return getTaskCommentById(commentId, accountId);
}

// Core query functions with account security

export async function getTaskCommentsByTaskId(
  taskId: bigint,
  accountId: number,
): Promise<TaskCommentWithUser[]> {
  try {
    // Get top-level comments (parentId is null) with user data
    const topLevelComments = await db
      .select({
        commentId: taskComments.commentId,
        taskId: taskComments.taskId,
        userId: taskComments.userId,
        content: taskComments.content,
        parentId: taskComments.parentId,
        isDeleted: sql<boolean>`COALESCE(${taskComments.isDeleted}, false)`,
        createdAt: taskComments.createdAt,
        updatedAt: taskComments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`CONCAT(LEFT(${users.firstName}, 1), LEFT(${users.lastName}, 1))`,
        },
      })
      .from(taskComments)
      .innerJoin(users, eq(taskComments.userId, users.id))
      .innerJoin(tasks, eq(taskComments.taskId, tasks.taskId))
      .where(
        and(
          eq(taskComments.taskId, taskId),
          eq(taskComments.isDeleted, false),
          isNull(taskComments.parentId),
          eq(users.accountId, BigInt(accountId)),
        ),
      )
      .orderBy(desc(taskComments.createdAt));

    // Get all replies for these comments
    const result: TaskCommentWithUser[] = [];
    for (const comment of topLevelComments) {
      const replies = await getTaskCommentReplies(comment.commentId, accountId);
      result.push({
        ...comment,
        replies,
      });
    }

    return result;
  } catch (error) {
    console.error("Error fetching task comments by task ID:", error);
    throw error;
  }
}

export async function getTaskCommentById(
  commentId: bigint,
  accountId: number,
): Promise<TaskCommentWithUser | null> {
  try {
    const [comment] = await db
      .select({
        commentId: taskComments.commentId,
        taskId: taskComments.taskId,
        userId: taskComments.userId,
        content: taskComments.content,
        parentId: taskComments.parentId,
        isDeleted: sql<boolean>`COALESCE(${taskComments.isDeleted}, false)`,
        createdAt: taskComments.createdAt,
        updatedAt: taskComments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`CONCAT(LEFT(${users.firstName}, 1), LEFT(${users.lastName}, 1))`,
        },
      })
      .from(taskComments)
      .innerJoin(users, eq(taskComments.userId, users.id))
      .innerJoin(tasks, eq(taskComments.taskId, tasks.taskId))
      .where(
        and(
          eq(taskComments.commentId, commentId),
          eq(taskComments.isDeleted, false),
          eq(users.accountId, BigInt(accountId)),
        ),
      );

    if (!comment) {
      return null;
    }

    // Get replies if this is a top-level comment
    const replies = comment.parentId
      ? []
      : await getTaskCommentReplies(comment.commentId, accountId);

    return {
      ...comment,
      replies,
    };
  } catch (error) {
    console.error("Error fetching task comment by ID:", error);
    throw error;
  }
}

export async function getTaskCommentReplies(
  parentCommentId: bigint,
  accountId: number,
): Promise<TaskCommentWithUser[]> {
  try {
    const replies = await db
      .select({
        commentId: taskComments.commentId,
        taskId: taskComments.taskId,
        userId: taskComments.userId,
        content: taskComments.content,
        parentId: taskComments.parentId,
        isDeleted: sql<boolean>`COALESCE(${taskComments.isDeleted}, false)`,
        createdAt: taskComments.createdAt,
        updatedAt: taskComments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`CONCAT(LEFT(${users.firstName}, 1), LEFT(${users.lastName}, 1))`,
        },
      })
      .from(taskComments)
      .innerJoin(users, eq(taskComments.userId, users.id))
      .innerJoin(tasks, eq(taskComments.taskId, tasks.taskId))
      .where(
        and(
          eq(taskComments.parentId, parentCommentId),
          eq(taskComments.isDeleted, false),
          eq(users.accountId, BigInt(accountId)),
        ),
      )
      .orderBy(taskComments.createdAt);

    return replies.map((reply) => ({
      ...reply,
      replies: [], // Replies don't have sub-replies
    }));
  } catch (error) {
    console.error("Error fetching task comment replies:", error);
    throw error;
  }
}

// Create a new task comment
export async function createTaskComment(
  data: Omit<
    TaskComment,
    "commentId" | "createdAt" | "updatedAt" | "isDeleted"
  >,
  accountId: number,
) {
  try {
    // Verify the task belongs to this account (through user)
    const [task] = await db
      .select({ taskId: tasks.taskId })
      .from(tasks)
      .innerJoin(users, eq(tasks.userId, users.id))
      .where(
        and(
          eq(tasks.taskId, data.taskId),
          eq(users.accountId, BigInt(accountId)),
        ),
      );

    if (!task) {
      throw new Error("Task not found or access denied");
    }

    // If it's a reply, verify parent comment exists and belongs to same task
    if (data.parentId) {
      const [parentComment] = await db
        .select({ taskId: taskComments.taskId })
        .from(taskComments)
        .innerJoin(tasks, eq(taskComments.taskId, tasks.taskId))
        .innerJoin(users, eq(tasks.userId, users.id))
        .where(
          and(
            eq(taskComments.commentId, data.parentId),
            eq(taskComments.isDeleted, false),
            eq(users.accountId, BigInt(accountId)),
          ),
        );

      if (!parentComment) {
        throw new Error("Parent comment not found or access denied");
      }

      if (parentComment.taskId !== data.taskId) {
        throw new Error(
          "Reply must belong to the same task as parent comment",
        );
      }
    }

    const [result] = await db
      .insert(taskComments)
      .values({
        ...data,
        isDeleted: false,
      })
      .returning();

    if (!result) throw new Error("Failed to create task comment");

    const [newComment] = await db
      .select({
        commentId: sql<number>`CAST(${taskComments.commentId} AS BIGINT)`,
        taskId: sql<number>`CAST(${taskComments.taskId} AS BIGINT)`,
        userId: taskComments.userId,
        content: taskComments.content,
        parentId: sql<number>`CAST(${taskComments.parentId} AS BIGINT)`,
        isDeleted: taskComments.isDeleted,
        createdAt: taskComments.createdAt,
        updatedAt: taskComments.updatedAt,
      })
      .from(taskComments)
      .where(eq(taskComments.commentId, BigInt(result.commentId)));

    return newComment;
  } catch (error) {
    console.error("Error creating task comment:", error);
    throw error;
  }
}

// Update task comment
export async function updateTaskComment(
  commentId: bigint,
  content: string,
  accountId: number,
) {
  try {
    // First verify the comment belongs to this account
    const [existingComment] = await db
      .select({ commentId: taskComments.commentId })
      .from(taskComments)
      .innerJoin(tasks, eq(taskComments.taskId, tasks.taskId))
      .innerJoin(users, eq(tasks.userId, users.id))
      .where(
        and(
          eq(taskComments.commentId, commentId),
          eq(taskComments.isDeleted, false),
          eq(users.accountId, BigInt(accountId)),
        ),
      );

    if (!existingComment) {
      throw new Error("Task comment not found or access denied");
    }

    await db
      .update(taskComments)
      .set({ content })
      .where(
        and(
          eq(taskComments.commentId, commentId),
          eq(taskComments.isDeleted, false),
        ),
      );

    return { success: true };
  } catch (error) {
    console.error("Error updating task comment:", error);
    throw error;
  }
}

// Delete task comment (soft delete)
export async function deleteTaskComment(commentId: bigint, accountId: number) {
  try {
    // First verify the comment belongs to this account
    const [existingComment] = await db
      .select({ commentId: taskComments.commentId })
      .from(taskComments)
      .innerJoin(tasks, eq(taskComments.taskId, tasks.taskId))
      .innerJoin(users, eq(tasks.userId, users.id))
      .where(
        and(
          eq(taskComments.commentId, commentId),
          eq(users.accountId, BigInt(accountId)),
        ),
      );

    if (!existingComment) {
      throw new Error("Task comment not found or access denied");
    }

    // Soft delete the comment and any replies
    await db
      .update(taskComments)
      .set({ isDeleted: true })
      .where(and(eq(taskComments.commentId, commentId)));

    // Also soft delete any replies to this comment
    await db
      .update(taskComments)
      .set({ isDeleted: true })
      .where(eq(taskComments.parentId, commentId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting task comment:", error);
    throw error;
  }
}
