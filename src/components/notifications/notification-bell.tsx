"use client";

import { Bell } from "lucide-react";
import { cn } from "~/lib/utils";
import { useNotifications } from "~/hooks/use-notifications";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const { unreadCount } = useNotifications(20, 60000);

  return (
    <div className={cn("relative", className)}>
      <Bell className="h-5 w-5 text-gray-600" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </div>
  );
}

