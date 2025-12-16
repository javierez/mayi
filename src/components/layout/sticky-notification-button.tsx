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
import { NotificationItem } from "~/components/notifications/notification-item";
import { PushSubscriptionButton } from "~/components/notifications/push-subscription-button";

export function StickyNotificationButton() {
  const {
    notifications,
    loading,
    unreadCount,
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
          className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          aria-label="Notificaciones"
        >
          <div className="relative">
            <Bell className="h-6 w-6 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2rem)] max-w-[420px] p-0 border-0 shadow-lg"
        align="end"
        side="top"
        sideOffset={8}
      >
        <div className="flex flex-col">
          {/* Push Subscription Button Header */}
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-medium text-gray-900">Notificaciones</span>
            <PushSubscriptionButton />
          </div>
          
          {/* Notifications List */}
          <ScrollArea className="max-h-[60vh] sm:max-h-[400px]">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-gray-500">Cargando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <Bell className="h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm font-medium text-gray-900 text-center">
                  No hay notificaciones
                </p>
                <p className="mt-1 text-xs text-gray-500 text-center">
                  Te notificaremos cuando haya algo nuevo
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-1">
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

