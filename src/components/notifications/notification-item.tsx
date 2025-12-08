"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { X, CheckSquare, Calendar, Clock, AlertCircle } from "lucide-react";
import { cn } from "~/lib/utils";
import type { NotificationWithUser } from "~/types/notifications";
import { useRouter } from "next/navigation";

interface NotificationItemProps {
  notification: NotificationWithUser;
  onDismiss: (id: bigint) => void;
  onMarkAsRead: (id: bigint) => void;
}

function getNotificationIcon(type: string) {
  if (type.startsWith("task_")) {
    return CheckSquare;
  }
  if (type.startsWith("appointment_")) {
    return Calendar;
  }
  return AlertCircle;
}

function getNotificationColor(type: string, isRead: boolean) {
  const baseColor = isRead ? "text-gray-500" : "text-gray-900";
  
  if (type === "task_overdue" || type === "appointment_reminder") {
    return isRead ? "text-orange-500" : "text-orange-600";
  }
  
  return baseColor;
}

export function NotificationItem({
  notification,
  onDismiss,
  onMarkAsRead,
}: NotificationItemProps) {
  const router = useRouter();
  const Icon = getNotificationIcon(notification.type);
  const isRead = notification.isRead ?? false;

  const handleClick = () => {
    if (!isRead) {
      onMarkAsRead(notification.notificationId);
    }
    
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss(notification.notificationId);
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: es,
  });

  return (
    <div
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50",
        !isRead && "bg-blue-50/50",
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isRead ? "bg-gray-100" : "bg-blue-100",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            getNotificationColor(notification.type, isRead),
          )}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-medium",
              isRead ? "text-gray-600" : "text-gray-900",
            )}
          >
            {notification.title}
          </p>
          <button
            onClick={handleDismiss}
            className="opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Descartar notificación"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <p className="mt-1 text-xs text-gray-500">{notification.message}</p>

        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <Clock className="h-3 w-3" />
          <span>{timeAgo}</span>
        </div>
      </div>

    </div>
  );
}

