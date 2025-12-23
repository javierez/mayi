"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Button } from "~/components/ui/button";
import { useNotifications } from "~/hooks/use-notifications";
import { NotificationItem } from "./notification-item";
import { NotificationBell } from "./notification-bell";

export function NotificationDropdown() {
  const {
    notifications,
    loading,
    markAsRead,
    dismiss,
    loadMore,
    hasMore,
  } = useNotifications(20, 60000);

  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          aria-label="Notificaciones"
        >
          <NotificationBell />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[420px] p-0 border-0 shadow-lg" align="end">
        <div className="flex flex-col">
          {/* Notifications List */}
          <ScrollArea className="h-[min(400px,60vh)]">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-gray-500">Cargando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <Bell className="h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm font-medium text-gray-900">
                  No hay notificaciones
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Te notificaremos cuando haya algo nuevo
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.notificationId.toString()}
                    notification={notification}
                    onDismiss={dismiss}
                    onMarkAsRead={markAsRead}
                  />
                ))}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && !loading && notifications.length > 0 && (
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMore}
                  className="w-full text-xs"
                >
                  Cargar más
                </Button>
              </div>
            )}

            {loading && notifications.length > 0 && (
              <div className="p-2 text-center">
                <p className="text-xs text-gray-500">Cargando...</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}

