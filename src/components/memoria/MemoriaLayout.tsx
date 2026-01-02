"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Heart,
  BookOpen,
  Settings,
  Bell,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";
import { cn } from "~/lib/utils";

interface MemoriaLayoutProps {
  children: React.ReactNode;
  coupleName?: string;
  partnerName?: string;
  showBackButton?: boolean;
  backHref?: string;
  title?: string;
}

const navItems = [
  {
    href: "/memoria",
    label: "Calendario",
    icon: Calendar,
  },
  {
    href: "/memoria/hitos",
    label: "Hitos",
    icon: Heart,
  },
  {
    href: "/memoria/notas",
    label: "Notas",
    icon: BookOpen,
  },
  {
    href: "/memoria/configuracion",
    label: "Ajustes",
    icon: Settings,
  },
];

export function MemoriaLayout({
  children,
  coupleName,
  partnerName,
  showBackButton = false,
  backHref = "/calendario",
  title,
}: MemoriaLayoutProps) {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50/30 to-pink-50/50">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-pink-100/50 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          {showBackButton ? (
            <Link
              href={backHref}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">Volver</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-400">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium text-gray-700">
                {coupleName ?? "MayI"}
              </span>
            </div>
          )}

          {title && (
            <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-medium text-gray-700">
              {title}
            </h1>
          )}

          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-full p-2 text-gray-500 hover:bg-pink-50 hover:text-pink-500"
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" />
            {/* Notification badge - uncomment when needed
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-400 text-[10px] font-bold text-white">
              3
            </span>
            */}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-pink-100/50 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 transition-colors",
                  isActive
                    ? "text-rose-500"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <div className="relative">
                  <Icon className="h-6 w-6" />
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-rose-400"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Safe area spacer for iOS */}
        <div className="h-safe-area-inset-bottom bg-white/95" />
      </nav>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
              onClick={() => setShowNotifications(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed right-4 top-16 z-50 w-80 rounded-2xl bg-white p-4 shadow-xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium text-gray-700">Notificaciones</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="text-center text-sm text-gray-400 py-8">
                No tienes notificaciones
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
