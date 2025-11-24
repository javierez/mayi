"use server";

import { db } from "../db";
import { appointmentComments, users, appointments } from "../db/schema";
import { eq, and, sql, desc, isNull } from "drizzle-orm";
import { getCurrentUserAccountId } from "../../lib/dal";
import type {
  AppointmentComment,
  AppointmentCommentWithUser,
} from "../../types/appointment-comments";

// Wrapper functions that automatically get accountId from current session
export async function getAppointmentCommentsByIdWithAuth(appointmentId: bigint) {
  const accountId = await getCurrentUserAccountId();
  return getAppointmentCommentsByAppointmentId(appointmentId, accountId);
}

export async function getAppointmentCommentByIdWithAuth(commentId: bigint) {
  const accountId = await getCurrentUserAccountId();
  return getAppointmentCommentById(commentId, accountId);
}

// Core query functions with account security

export async function getAppointmentCommentsByAppointmentId(
  appointmentId: bigint,
  accountId: number,
): Promise<AppointmentCommentWithUser[]> {
  try {
    // Get top-level comments (parentId is null) with user data
    const topLevelComments = await db
      .select({
        commentId: appointmentComments.commentId,
        appointmentId: appointmentComments.appointmentId,
        userId: appointmentComments.userId,
        content: appointmentComments.content,
        parentId: appointmentComments.parentId,
        isDeleted: sql<boolean>`COALESCE(${appointmentComments.isDeleted}, false)`,
        createdAt: appointmentComments.createdAt,
        updatedAt: appointmentComments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`CONCAT(LEFT(${users.firstName}, 1), LEFT(${users.lastName}, 1))`,
        },
      })
      .from(appointmentComments)
      .innerJoin(users, eq(appointmentComments.userId, users.id))
      .innerJoin(appointments, eq(appointmentComments.appointmentId, appointments.appointmentId))
      .where(
        and(
          eq(appointmentComments.appointmentId, appointmentId),
          eq(appointmentComments.isDeleted, false),
          isNull(appointmentComments.parentId),
          eq(users.accountId, BigInt(accountId)),
        ),
      )
      .orderBy(desc(appointmentComments.createdAt));

    // Get all replies for these comments
    const result: AppointmentCommentWithUser[] = [];
    for (const comment of topLevelComments) {
      const replies = await getAppointmentCommentReplies(comment.commentId, accountId);
      result.push({
        ...comment,
        replies,
      });
    }

    return result;
  } catch (error) {
    console.error("Error fetching appointment comments by appointment ID:", error);
    throw error;
  }
}

export async function getAppointmentCommentById(
  commentId: bigint,
  accountId: number,
): Promise<AppointmentCommentWithUser | null> {
  try {
    const [comment] = await db
      .select({
        commentId: appointmentComments.commentId,
        appointmentId: appointmentComments.appointmentId,
        userId: appointmentComments.userId,
        content: appointmentComments.content,
        parentId: appointmentComments.parentId,
        isDeleted: sql<boolean>`COALESCE(${appointmentComments.isDeleted}, false)`,
        createdAt: appointmentComments.createdAt,
        updatedAt: appointmentComments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`CONCAT(LEFT(${users.firstName}, 1), LEFT(${users.lastName}, 1))`,
        },
      })
      .from(appointmentComments)
      .innerJoin(users, eq(appointmentComments.userId, users.id))
      .innerJoin(appointments, eq(appointmentComments.appointmentId, appointments.appointmentId))
      .where(
        and(
          eq(appointmentComments.commentId, commentId),
          eq(appointmentComments.isDeleted, false),
          eq(users.accountId, BigInt(accountId)),
        ),
      );

    if (!comment) {
      return null;
    }

    // Get replies if this is a top-level comment
    const replies = comment.parentId
      ? []
      : await getAppointmentCommentReplies(comment.commentId, accountId);

    return {
      ...comment,
      replies,
    };
  } catch (error) {
    console.error("Error fetching appointment comment by ID:", error);
    throw error;
  }
}

export async function getAppointmentCommentReplies(
  parentCommentId: bigint,
  accountId: number,
): Promise<AppointmentCommentWithUser[]> {
  try {
    const replies = await db
      .select({
        commentId: appointmentComments.commentId,
        appointmentId: appointmentComments.appointmentId,
        userId: appointmentComments.userId,
        content: appointmentComments.content,
        parentId: appointmentComments.parentId,
        isDeleted: sql<boolean>`COALESCE(${appointmentComments.isDeleted}, false)`,
        createdAt: appointmentComments.createdAt,
        updatedAt: appointmentComments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`CONCAT(LEFT(${users.firstName}, 1), LEFT(${users.lastName}, 1))`,
        },
      })
      .from(appointmentComments)
      .innerJoin(users, eq(appointmentComments.userId, users.id))
      .innerJoin(appointments, eq(appointmentComments.appointmentId, appointments.appointmentId))
      .where(
        and(
          eq(appointmentComments.parentId, parentCommentId),
          eq(appointmentComments.isDeleted, false),
          eq(users.accountId, BigInt(accountId)),
        ),
      )
      .orderBy(appointmentComments.createdAt);

    return replies.map((reply) => ({
      ...reply,
      replies: [], // Replies don't have sub-replies
    }));
  } catch (error) {
    console.error("Error fetching appointment comment replies:", error);
    throw error;
  }
}

// Create a new appointment comment
export async function createAppointmentComment(
  data: Omit<
    AppointmentComment,
    "commentId" | "createdAt" | "updatedAt" | "isDeleted"
  >,
  accountId: number,
) {
  try {
    // Verify the appointment belongs to this account (through user)
    const [appointment] = await db
      .select({ appointmentId: appointments.appointmentId })
      .from(appointments)
      .innerJoin(users, eq(appointments.userId, users.id))
      .where(
        and(
          eq(appointments.appointmentId, data.appointmentId),
          eq(users.accountId, BigInt(accountId)),
        ),
      );

    if (!appointment) {
      throw new Error("Appointment not found or access denied");
    }

    // If it's a reply, verify parent comment exists and belongs to same appointment
    if (data.parentId) {
      const [parentComment] = await db
        .select({ appointmentId: appointmentComments.appointmentId })
        .from(appointmentComments)
        .innerJoin(appointments, eq(appointmentComments.appointmentId, appointments.appointmentId))
        .innerJoin(users, eq(appointments.userId, users.id))
        .where(
          and(
            eq(appointmentComments.commentId, data.parentId),
            eq(appointmentComments.isDeleted, false),
            eq(users.accountId, BigInt(accountId)),
          ),
        );

      if (!parentComment) {
        throw new Error("Parent comment not found or access denied");
      }

      if (parentComment.appointmentId !== data.appointmentId) {
        throw new Error(
          "Reply must belong to the same appointment as parent comment",
        );
      }
    }

    const [result] = await db
      .insert(appointmentComments)
      .values({
        ...data,
        isDeleted: false,
      })
      .returning();

    if (!result) throw new Error("Failed to create appointment comment");

    const [newComment] = await db
      .select({
        commentId: sql<number>`CAST(${appointmentComments.commentId} AS BIGINT)`,
        appointmentId: sql<number>`CAST(${appointmentComments.appointmentId} AS BIGINT)`,
        userId: appointmentComments.userId,
        content: appointmentComments.content,
        parentId: sql<number>`CAST(${appointmentComments.parentId} AS BIGINT)`,
        isDeleted: appointmentComments.isDeleted,
        createdAt: appointmentComments.createdAt,
        updatedAt: appointmentComments.updatedAt,
      })
      .from(appointmentComments)
      .where(eq(appointmentComments.commentId, BigInt(result.commentId)));

    return newComment;
  } catch (error) {
    console.error("Error creating appointment comment:", error);
    throw error;
  }
}

// Update appointment comment
export async function updateAppointmentComment(
  commentId: bigint,
  content: string,
  accountId: number,
) {
  try {
    // First verify the comment belongs to this account
    const [existingComment] = await db
      .select({ commentId: appointmentComments.commentId })
      .from(appointmentComments)
      .innerJoin(appointments, eq(appointmentComments.appointmentId, appointments.appointmentId))
      .innerJoin(users, eq(appointments.userId, users.id))
      .where(
        and(
          eq(appointmentComments.commentId, commentId),
          eq(appointmentComments.isDeleted, false),
          eq(users.accountId, BigInt(accountId)),
        ),
      );

    if (!existingComment) {
      throw new Error("Appointment comment not found or access denied");
    }

    await db
      .update(appointmentComments)
      .set({ content })
      .where(
        and(
          eq(appointmentComments.commentId, commentId),
          eq(appointmentComments.isDeleted, false),
        ),
      );

    return { success: true };
  } catch (error) {
    console.error("Error updating appointment comment:", error);
    throw error;
  }
}

// Delete appointment comment (soft delete)
export async function deleteAppointmentComment(commentId: bigint, accountId: number) {
  try {
    // First verify the comment belongs to this account
    const [existingComment] = await db
      .select({ commentId: appointmentComments.commentId })
      .from(appointmentComments)
      .innerJoin(appointments, eq(appointmentComments.appointmentId, appointments.appointmentId))
      .innerJoin(users, eq(appointments.userId, users.id))
      .where(
        and(
          eq(appointmentComments.commentId, commentId),
          eq(users.accountId, BigInt(accountId)),
        ),
      );

    if (!existingComment) {
      throw new Error("Appointment comment not found or access denied");
    }

    // Soft delete the comment and any replies
    await db
      .update(appointmentComments)
      .set({ isDeleted: true })
      .where(and(eq(appointmentComments.commentId, commentId)));

    // Also soft delete any replies to this comment
    await db
      .update(appointmentComments)
      .set({ isDeleted: true })
      .where(eq(appointmentComments.parentId, commentId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting appointment comment:", error);
    throw error;
  }
}
