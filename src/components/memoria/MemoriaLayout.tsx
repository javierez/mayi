"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  Heart,
  MapPin,
  Settings,
} from "lucide-react";
import { cn } from "~/lib/utils";

interface MemoriaLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  {
    href: "/memoria",
    label: "Calendario",
    icon: Calendar,
  },
  {
    href: "/memoria/para-ti",
    label: "Para ti",
    icon: Heart,
  },
  {
    href: "/memoria/notas",
    label: "Mapa",
    icon: MapPin,
  },
  {
    href: "/memoria/configuracion",
    label: "Ajustes",
    icon: Settings,
  },
];

export function MemoriaLayout({
  children,
}: MemoriaLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50/50 to-white">
      {/* Main Content */}
      <main className="flex-1 pb-24">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-100 bg-white/95 backdrop-blur-md safe-area-inset-bottom">
        <div className="flex h-16 items-center justify-around px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-5 py-2 transition-colors active:scale-95",
                  isActive
                    ? "text-slate-800"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <div className="relative">
                  <Icon className="h-6 w-6" strokeWidth={isActive ? 2 : 1.5} />
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-slate-800"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>
                <span className="text-[11px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Safe area spacer for iOS */}
        <div className="h-safe-area-inset-bottom bg-white/95" />
      </nav>

    </div>
  );
}
