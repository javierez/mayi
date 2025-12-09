"use server";

import { db } from "~/server/db";
import { notifications, users } from "~/server/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getSecureSession, getCurrentUserAccountId } from "~/lib/dal";
import type {
  Notification,
  NotificationWithUser,
  CreateNotificationInput,
} from "~/types/notifications";

// === READ OPERATIONS ===

/**
 * Get paginated notifications for the current user
 */
export async function getNotificationsWithAuth(
  limit = 20,
  offset = 0,
): Promise<NotificationWithUser[]> {
  const session = await getSecureSession();

  if (!session?.user) {
    throw new Error("Unauthorized: No session found");
  }

  const accountId = await getCurrentUserAccountId();

  const results = await db
    .select({
      notificationId: notifications.notificationId,
      accountId: notifications.accountId,
      userId: notifications.userId,
      fromUserId: notifications.fromUserId,
      type: notifications.type,
      title: notifications.title,
      message: notifications.message,
      actionUrl: notifications.actionUrl,
      priority: notifications.priority,
      category: notifications.category,
      entityType: notifications.entityType,
      entityId: notifications.entityId,
      metadata: notifications.metadata,
      isRead: notifications.isRead,
      readAt: notifications.readAt,
      isDismissed: notifications.isDismissed,
      dismissedAt: notifications.dismissedAt,
      deliveryChannel: notifications.deliveryChannel,
      isDelivered: notifications.isDelivered,
      deliveredAt: notifications.deliveredAt,
      deliveryError: notifications.deliveryError,
      scheduledFor: notifications.scheduledFor,
      expiresAt: notifications.expiresAt,
      createdAt: notifications.createdAt,
      updatedAt: notifications.updatedAt,
      isActive: notifications.isActive,
      fromUserName: users.name,
      fromUserImage: users.image,
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.fromUserId, users.id))
    .where(
      and(
        eq(notifications.accountId, BigInt(accountId)),
        eq(notifications.userId, session.user.id),
        eq(notifications.isActive, true),
        eq(notifications.isDismissed, false),
        // Only show notifications that are scheduled for now or earlier (or not scheduled)
        sql`(${notifications.scheduledFor} IS NULL OR ${notifications.scheduledFor} <= NOW())`,
      ),
    )
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  return results.map((row) => ({
    ...row,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  }));
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadCountWithAuth(): Promise<number> {
  const session = await getSecureSession();

  if (!session?.user) {
    return 0;
  }

  const accountId = await getCurrentUserAccountId();

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.accountId, BigInt(accountId)),
        eq(notifications.userId, session.user.id),
        eq(notifications.isActive, true),
        eq(notifications.isRead, false),
        eq(notifications.isDismissed, false),
        sql`(${notifications.scheduledFor} IS NULL OR ${notifications.scheduledFor} <= NOW())`,
      ),
    );

  return result[0]?.count ?? 0;
}

/**
 * Get a single notification by ID
 */
export async function getNotificationByIdWithAuth(
  notificationId: bigint,
): Promise<NotificationWithUser | null> {
  const session = await getSecureSession();

  if (!session?.user) {
    throw new Error("Unauthorized: No session found");
  }

  const accountId = await getCurrentUserAccountId();

  const results = await db
    .select({
      notificationId: notifications.notificationId,
      accountId: notifications.accountId,
      userId: notifications.userId,
      fromUserId: notifications.fromUserId,
      type: notifications.type,
      title: notifications.title,
      message: notifications.message,
      actionUrl: notifications.actionUrl,
      priority: notifications.priority,
      category: notifications.category,
      entityType: notifications.entityType,
      entityId: notifications.entityId,
      metadata: notifications.metadata,
      isRead: notifications.isRead,
      readAt: notifications.readAt,
      isDismissed: notifications.isDismissed,
      dismissedAt: notifications.dismissedAt,
      deliveryChannel: notifications.deliveryChannel,
      isDelivered: notifications.isDelivered,
      deliveredAt: notifications.deliveredAt,
      deliveryError: notifications.deliveryError,
      scheduledFor: notifications.scheduledFor,
      expiresAt: notifications.expiresAt,
      createdAt: notifications.createdAt,
      updatedAt: notifications.updatedAt,
      isActive: notifications.isActive,
      fromUserName: users.name,
      fromUserImage: users.image,
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.fromUserId, users.id))
    .where(
      and(
        eq(notifications.notificationId, notificationId),
        eq(notifications.accountId, BigInt(accountId)),
        eq(notifications.userId, session.user.id),
      ),
    )
    .limit(1);

  const notification = results[0];
  if (!notification) {
    return null;
  }

  return {
    ...notification,
    metadata: (notification.metadata as Record<string, unknown>) ?? {},
  };
}

// === WRITE OPERATIONS ===

/**
 * Create a notification (internal use - no auth check)
 * Used by notification service when triggered by system events
 */
export async function createNotificationInternal(
  data: CreateNotificationInput & { accountId: bigint },
): Promise<Notification> {
  const [result] = await db
    .insert(notifications)
    .values({
      accountId: data.accountId,
      userId: data.userId ?? null,
      fromUserId: data.fromUserId ?? null,
      type: data.type,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl ?? null,
      priority: data.priority ?? "normal",
      category: data.category,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
      metadata: data.metadata ?? {},
      deliveryChannel: data.deliveryChannel ?? "in_app",
      scheduledFor: data.scheduledFor ?? null,
      expiresAt: data.expiresAt ?? null,
      isRead: false,
      isDismissed: false,
      isDelivered: data.deliveryChannel === "in_app",
      deliveredAt: data.deliveryChannel === "in_app" ? new Date() : null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  if (!result) {
    throw new Error("Failed to create notification");
  }

  return {
    ...result,
    metadata: (result.metadata as Record<string, unknown>) ?? {},
  };
}

/**
 * Create a notification with auth (for user-triggered notifications)
 */
export async function createNotificationWithAuth(
  data: CreateNotificationInput,
): Promise<Notification> {
  const session = await getSecureSession();

  if (!session?.user) {
    throw new Error("Unauthorized: No session found");
  }

  const accountId = await getCurrentUserAccountId();

  return createNotificationInternal({
    ...data,
    accountId: BigInt(accountId),
    fromUserId: data.fromUserId ?? session.user.id,
  });
}

/**
 * Mark a notification as read
 */
export async function markAsReadWithAuth(
  notificationId: bigint,
): Promise<boolean> {
  const session = await getSecureSession();

  if (!session?.user) {
    throw new Error("Unauthorized: No session found");
  }

  const accountId = await getCurrentUserAccountId();

  const result = await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(notifications.notificationId, notificationId),
        eq(notifications.accountId, BigInt(accountId)),
        eq(notifications.userId, session.user.id),
      ),
    )
    .returning({ notificationId: notifications.notificationId });

  return result.length > 0;
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllAsReadWithAuth(): Promise<number> {
  const session = await getSecureSession();

  if (!session?.user) {
    throw new Error("Unauthorized: No session found");
  }

  const accountId = await getCurrentUserAccountId();

  const result = await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(notifications.accountId, BigInt(accountId)),
        eq(notifications.userId, session.user.id),
        eq(notifications.isRead, false),
        eq(notifications.isActive, true),
      ),
    )
    .returning({ notificationId: notifications.notificationId });

  return result.length;
}

/**
 * Dismiss a notification (soft remove from list)
 */
export async function dismissNotificationWithAuth(
  notificationId: bigint,
): Promise<boolean> {
  const session = await getSecureSession();

  if (!session?.user) {
    throw new Error("Unauthorized: No session found");
  }

  const accountId = await getCurrentUserAccountId();

  const result = await db
    .update(notifications)
    .set({
      isDismissed: true,
      dismissedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(notifications.notificationId, notificationId),
        eq(notifications.accountId, BigInt(accountId)),
        eq(notifications.userId, session.user.id),
      ),
    )
    .returning({ notificationId: notifications.notificationId });

  return result.length > 0;
}

/**
 * Update notification delivery status
 * Used to track email delivery status after sending
 */
export async function updateNotificationDeliveryStatus(
  notificationId: bigint,
  deliveryChannel: string,
  isDelivered: boolean,
  deliveryError: string | null,
): Promise<void> {
  await db
    .update(notifications)
    .set({
      deliveryChannel,
      isDelivered,
      deliveredAt: isDelivered ? new Date() : null,
      deliveryError,
      updatedAt: new Date(),
    })
    .where(eq(notifications.notificationId, notificationId));
}

// === CRON JOB HELPERS ===

/**
 * Check if a reminder notification already exists for an entity
 * Used to prevent duplicate reminder notifications
 */
export async function reminderExistsForEntity(
  accountId: bigint,
  entityType: string,
  entityId: bigint,
  notificationType: string,
  reminderTimeframe: string,
): Promise<boolean> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.accountId, accountId),
        eq(notifications.entityType, entityType),
        eq(notifications.entityId, entityId),
        eq(notifications.type, notificationType),
        sql`${notifications.metadata}->>'reminderType' = ${reminderTimeframe}`,
        eq(notifications.isActive, true),
      ),
    );

  return (result[0]?.count ?? 0) > 0;
}

/**
 * Get notification IDs that have been sent for a specific entity and type
 * Used for deduplication in cron jobs
 */
export async function getSentNotificationTypes(
  accountId: bigint,
  entityType: string,
  entityId: bigint,
): Promise<string[]> {
  const results = await db
    .select({
      type: notifications.type,
      metadata: notifications.metadata,
    })
    .from(notifications)
    .where(
      and(
        eq(notifications.accountId, accountId),
        eq(notifications.entityType, entityType),
        eq(notifications.entityId, entityId),
        eq(notifications.isActive, true),
      ),
    );

  return results.map((r) => {
    const metadata = r.metadata as Record<string, unknown>;
    const reminderType = metadata?.reminderType as string | undefined;
    return reminderType ? `${r.type}:${reminderType}` : r.type;
  });
}
