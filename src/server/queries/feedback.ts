"use server";

import { db } from "~/server/db";
import { feedback, accounts, users } from "~/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSecureSession } from "~/lib/dal";
import { userHasRole } from "~/server/queries/user-roles";
import type { FeedbackWithAccount, FeedbackStatus } from "~/types/feedback";

/**
 * Get all feedback with account and user information
 * Only accessible by admins (role ID 1)
 */
export async function getAllFeedbackWithAuth(): Promise<FeedbackWithAccount[]> {
  const session = await getSecureSession();

  if (!session?.user) {
    throw new Error("Unauthorized: No session found");
  }

  // Check if user is admin (role ID 1)
  const isAdmin = await userHasRole(session.user.id, 1);
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin role required");
  }

  const feedbackData = await db
    .select({
      feedbackId: feedback.feedbackId,
      userId: feedback.userId,
      accountId: feedback.accountId,
      feedbackComment: feedback.feedbackComment,
      scale: feedback.scale,
      url: feedback.url,
      status: feedback.status,
      resolved: feedback.resolved,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
      accountName: accounts.name,
      userName: users.name,
      userEmail: users.email,
    })
    .from(feedback)
    .leftJoin(accounts, eq(feedback.accountId, accounts.accountId))
    .leftJoin(users, eq(feedback.userId, users.id))
    .orderBy(desc(feedback.createdAt));

  return feedbackData.map((row) => ({
    feedbackId: row.feedbackId,
    userId: row.userId,
    accountId: row.accountId,
    feedbackComment: row.feedbackComment,
    scale: row.scale,
    url: row.url,
    status: (row.status ?? "submitted") as FeedbackStatus,
    resolved: row.resolved,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    accountName: row.accountName,
    userName: row.userName,
    userEmail: row.userEmail,
  }));
}

/**
 * Update feedback status
 * Only accessible by admins (role ID 1)
 */
export async function updateFeedbackStatusWithAuth(
  feedbackId: string | bigint,
  newStatus: FeedbackStatus,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSecureSession();

    if (!session?.user) {
      return { success: false, error: "Unauthorized: No session found" };
    }

    // Check if user is admin (role ID 1)
    const isAdmin = await userHasRole(session.user.id, 1);
    if (!isAdmin) {
      return { success: false, error: "Unauthorized: Admin role required" };
    }

    const feedbackIdBigInt =
      typeof feedbackId === "string" ? BigInt(feedbackId) : feedbackId;

    await db
      .update(feedback)
      .set({
        status: newStatus,
        resolved: newStatus === "resolved",
        updatedAt: new Date(),
      })
      .where(eq(feedback.feedbackId, feedbackIdBigInt));

    return { success: true };
  } catch (error) {
    console.error("Error updating feedback status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Mark feedback as resolved
 * Only accessible by admins (role ID 1)
 */
export async function resolveFeedbackWithAuth(
  feedbackId: string | bigint,
): Promise<{ success: boolean; error?: string }> {
  return updateFeedbackStatusWithAuth(feedbackId, "resolved");
}
