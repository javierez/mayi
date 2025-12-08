"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getNotificationsAction,
  getUnreadCountAction,
  markAsReadAction,
  markAllAsReadAction,
  dismissNotificationAction,
} from "~/server/actions/notifications";
import type { NotificationWithUser } from "~/types/notifications";

interface UseNotificationsReturn {
  notifications: NotificationWithUser[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markAsRead: (id: bigint) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (id: bigint) => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

/**
 * Custom hook for managing notifications
 * Features:
 * - Polling every 60 seconds for new notifications
 * - Pagination support with loadMore
 * - Optimistic updates for mark as read/dismiss
 * - Error handling and retry logic
 */
export function useNotifications(
  limit = 20,
  pollingInterval = 60000,
): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationWithUser[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Refs for cleanup
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isMounted, setIsMounted] = useState(true);

  // Mount/unmount management
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (resetOffset = false) => {
      if (!isMounted) return;

      const currentOffset = resetOffset ? 0 : offset;
      setLoading(true);
      setError(null);

      try {
        const result = await getNotificationsAction(limit, currentOffset);

        if (result.success && result.data) {
          if (resetOffset) {
            setNotifications(result.data);
            setOffset(limit);
          } else {
            setNotifications((prev) => [...prev, ...result.data!]);
            setOffset((prev) => prev + limit);
          }

          // Check if there are more notifications
          setHasMore(result.data.length === limit);
        } else {
          setError(result.error ?? "Error desconocido");
          if (resetOffset) {
            setNotifications([]);
          }
        }
      } catch (err) {
        setError("Error al cargar las notificaciones");
        console.error("Error fetching notifications:", err);
        if (resetOffset) {
          setNotifications([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    },
    [limit, offset, isMounted],
  );

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isMounted) return;

    try {
      const result = await getUnreadCountAction();

      if (result.success && result.data !== undefined) {
        setUnreadCount(result.data);
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, [isMounted]);

  // Initial fetch
  useEffect(() => {
    void fetchNotifications(true);
    void fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Set up polling
  useEffect(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(() => {
      if (isMounted) {
        void fetchNotifications(true);
        void fetchUnreadCount();
      }
    }, pollingInterval);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [pollingInterval, fetchNotifications, fetchUnreadCount, isMounted]);

  // Mark as read with optimistic update
  const markAsRead = useCallback(
    async (id: bigint) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.notificationId === id
            ? { ...notif, isRead: true, readAt: new Date() }
            : notif,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        const result = await markAsReadAction(id);
        if (!result.success) {
          // Revert on error
          void fetchNotifications(true);
          void fetchUnreadCount();
        }
      } catch (err) {
        console.error("Error marking notification as read:", err);
        // Revert on error
        void fetchNotifications(true);
        void fetchUnreadCount();
      }
    },
    [fetchNotifications, fetchUnreadCount],
  );

  // Mark all as read with optimistic update
  const markAllAsRead = useCallback(async () => {
    const previousUnreadCount = unreadCount;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((notif) => ({
        ...notif,
        isRead: true,
        readAt: notif.readAt ?? new Date(),
      })),
    );
    setUnreadCount(0);

    try {
      const result = await markAllAsReadAction();
      if (!result.success) {
        // Revert on error
        void fetchNotifications(true);
        void fetchUnreadCount();
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      // Revert on error
      setUnreadCount(previousUnreadCount);
      void fetchNotifications(true);
      void fetchUnreadCount();
    }
  }, [unreadCount, fetchNotifications, fetchUnreadCount]);

  // Dismiss notification with optimistic update
  const dismiss = useCallback(
    async (id: bigint) => {
      // Optimistic update - remove from list
      const dismissedNotif = notifications.find(
        (n) => n.notificationId === id,
      );
      const wasUnread = dismissedNotif && !dismissedNotif.isRead;

      setNotifications((prev) =>
        prev.filter((notif) => notif.notificationId !== id),
      );
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        const result = await dismissNotificationAction(id);
        if (!result.success) {
          // Revert on error
          void fetchNotifications(true);
          void fetchUnreadCount();
        }
      } catch (err) {
        console.error("Error dismissing notification:", err);
        // Revert on error
        void fetchNotifications(true);
        void fetchUnreadCount();
      }
    },
    [notifications, fetchNotifications, fetchUnreadCount],
  );

  // Load more notifications
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    await fetchNotifications(false);
  }, [hasMore, loading, fetchNotifications]);

  // Refetch function
  const refetch = useCallback(async () => {
    setOffset(0);
    setHasMore(true);
    await fetchNotifications(true);
    await fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
    dismiss,
    loadMore,
    hasMore,
  };
}

