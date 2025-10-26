"use client";

import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { VisitsKPIProps } from "~/types/activity";
import { navigateToPage } from "~/lib/navigation";

interface VisitsKPICardProps extends VisitsKPIProps {
  isActive: boolean;
  onClick: () => void;
  listingId: bigint;
}

export function VisitsKPICard({
  completedCount,
  scheduledCount,
  cancelledCount,
  totalCount,
  isActive,
  onClick,
  listingId,
}: VisitsKPICardProps) {
  const router = useRouter();

  const handleScheduleVisit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigateToPage(`/calendario?new=true&listingId=${listingId}`, router);
  };

  return (
    <div className="space-y-3">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex w-full flex-col items-center rounded-2xl p-6 transition-all duration-200 ${
          isActive
            ? "bg-gray-100 shadow-xl"
            : "bg-white shadow hover:shadow-lg"
        }`}
        onClick={onClick}
        type="button"
      >
        {/* Total */}
        <div className="mb-4">
          <span className="text-4xl font-bold text-primary">{totalCount}</span>
        </div>

        {/* Label */}
        <span className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
          Visitas
        </span>

        {/* Breakdown Stats */}
        <div className="flex w-full items-center justify-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-rose-400 to-orange-400" />
            <span className="text-[10px] text-gray-600 uppercase tracking-wide">
              {completedCount} realizadas
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-amber-400" />
            <span className="text-[10px] text-gray-600 uppercase tracking-wide">
              {scheduledCount} pendientes
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-gray-400 to-gray-500" />
            <span className="text-[10px] text-gray-600 uppercase tracking-wide">
              {cancelledCount} canceladas
            </span>
          </div>
        </div>
      </motion.button>

      {/* Quick Action Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleScheduleVisit}
        className="flex w-full flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md"
        type="button"
      >
        <Plus className="mb-2 h-6 w-6" />
        <span className="text-center text-[10px] font-medium uppercase tracking-wide text-gray-600">
          Programar Visita
        </span>
      </motion.button>
    </div>
  );
}
