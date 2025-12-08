"use client";

import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
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
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    dismiss,
    loadMore,
    hasMore,
  } = useNotifications(20, 60000);

  const [open, setOpen] = useState(false);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

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
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Notificaciones
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-7 text-xs"
              >
                <CheckCheck className="mr-1 h-3 w-3" />
                Marcar todas
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <ScrollArea className="max-h-[400px]">
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
              <div className="divide-y">
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
              <div className="border-t p-2">
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
              <div className="border-t p-2 text-center">
                <p className="text-xs text-gray-500">Cargando...</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}

