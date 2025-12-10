/**
 * Task Digest Email Service
 *
 * Handles sending digest emails for overdue tasks:
 * - Weekly digest (Monday 9 AM) for all overdue tasks (urgency < 5)
 * - Daily digest (9 AM) for critical overdue tasks (urgency = 5)
 */

import { sendEmail } from "~/lib/email";
import { getUserById } from "~/server/queries/users";
import { generateTaskDigestEmail } from "~/templates/emails/task-digest-notification";
import type { Task } from "~/lib/data";
import { db } from "~/server/db";
import { notifications } from "~/server/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

/**
 * Check if we should send a digest email based on last sent timestamp
 * Note: This assumes UTC timezone. Adjust if your server runs in a different timezone.
 */
async function shouldSendDigest(
  userId: string,
  digestType: "weekly" | "daily",
): Promise<boolean> {
  const now = new Date();
  let cutoffTime: Date;
  let shouldCheckTime = false;

  if (digestType === "weekly") {
    // Check if it's Monday 9 AM UTC (or later on Monday)
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday
    const hour = now.getUTCHours();
    
    // Only send on Monday, at or after 9 AM UTC
    if (dayOfWeek === 1 && hour >= 9) {
      shouldCheckTime = true;
      // Check if we've sent a weekly digest in the last 7 days
      cutoffTime = new Date(now);
      cutoffTime.setUTCDate(cutoffTime.getUTCDate() - 7);
    } else {
      return false;
    }
  } else {
    // Daily: Check if it's 9 AM UTC or later
    const hour = now.getUTCHours();
    if (hour >= 9) {
      shouldCheckTime = true;
      // Check if we've sent a daily digest today (UTC)
      cutoffTime = new Date(now);
      cutoffTime.setUTCHours(0, 0, 0, 0);
    } else {
      return false;
    }
  }

  if (!shouldCheckTime) {
    return false;
  }

  // Check if a digest notification was sent after cutoff time
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.type, `task_overdue_digest_${digestType}`),
        gte(notifications.createdAt, cutoffTime),
      ),
    );

  return (result[0]?.count ?? 0) === 0;
}

/**
 * Send digest email for overdue tasks
 */
export async function sendTaskDigestEmail(
  userId: string,
  tasks: Task[],
  digestType: "weekly" | "daily",
  accountId: bigint,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (tasks.length === 0) {
      return { success: false, error: "No tasks to send" };
    }

    // Check if we should send this digest
    const shouldSend = await shouldSendDigest(userId, digestType);
    if (!shouldSend) {
      return { success: false, error: "Digest already sent recently" };
    }

    // Get user email
    const user = await getUserById(userId);
    if (!user?.email) {
      return { success: false, error: "User email not found" };
    }

    // Generate email content
    const { subject, html, text } = generateTaskDigestEmail({
      tasks,
      digestType,
    });

    // Send email
    await sendEmail({
      to: user.email,
      subject,
      html,
      text,
    });

    // Create a notification record to track that digest was sent
    await db.insert(notifications).values({
      accountId,
      userId,
      fromUserId: null,
      type: `task_overdue_digest_${digestType}`,
      title: subject,
      message: `Se envió un resumen de ${tasks.length} tarea${tasks.length > 1 ? "s" : ""} vencida${tasks.length > 1 ? "s" : ""}.`,
      actionUrl: "/tareas",
      priority: digestType === "daily" ? "high" : "normal",
      category: "tasks",
      entityType: null,
      entityId: null,
      metadata: {
        taskCount: tasks.length,
        taskIds: tasks.map((t) => t.taskId.toString()),
        digestType,
      },
      deliveryChannel: "email",
      isDelivered: true,
      deliveredAt: new Date(),
      isRead: false,
      isDismissed: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(
      `✅ Task digest email sent to ${user.email}: ${tasks.length} tasks (${digestType})`,
    );

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Failed to send task digest email:`, error);
    return { success: false, error: errorMessage };
  }
}

