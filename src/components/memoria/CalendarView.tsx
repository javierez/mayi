"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Heart, Star } from "lucide-react";
import Image from "next/image";
import { getCalendarMonthAction } from "~/server/actions/memoria/days";
import type { CalendarMonth, DaySummary, MilestoneWithNextDate } from "~/types/memoria";

const DAYS_OF_WEEK = ["L", "M", "X", "J", "V", "S", "D"];
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Monday=0
}

export function CalendarView() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [calendarData, setCalendarData] = useState<CalendarMonth | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Load calendar data
  useEffect(() => {
    startTransition(async () => {
      const result = await getCalendarMonthAction(year, month);
      if (result.success && result.data) {
        setCalendarData(result.data);
      }
    });
  }, [year, month]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Helper to get day data
  const getDayData = (day: number): DaySummary | undefined => {
    if (!calendarData) return undefined;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return calendarData.days.find((d) => d.date === dateStr);
  };

  // Check if date is today
  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  // Navigate to day detail
  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    router.push(`/memoria/dia/${dateStr}`);
  };

  // Generate calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Count memories this month
  const memoriesThisMonth = calendarData?.days.reduce(
    (sum, day) => sum + day.memoryCount,
    0
  ) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-light text-gray-700">Nuestros Recuerdos</h2>
        <p className="mt-1 text-sm text-gray-500">
          Haz clic en cualquier día para ver o añadir recuerdos
        </p>
      </div>

      {/* Calendar Card */}
      <div className="rounded-2xl bg-white/80 p-6 shadow-xl backdrop-blur-sm">
        {/* Month navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-pink-50 hover:text-pink-500"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={goToToday}
            className="flex flex-col items-center"
          >
            <h3 className="text-xl font-medium text-gray-700">
              {MONTHS[month]} {year}
            </h3>
            <span className="text-xs text-gray-400">Ir a hoy</span>
          </button>

          <button
            onClick={goToNextMonth}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-pink-50 hover:text-pink-500"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Days of week header */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-sm font-medium text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dayData = getDayData(day);
            const hasMemories = dayData && dayData.memoryCount > 0;
            const hasMilestone = dayData?.hasMilestone;
            const todayHighlight = isToday(day);

            return (
              <motion.button
                key={day}
                onClick={() => handleDayClick(day)}
                className={`relative aspect-square overflow-hidden rounded-lg transition-all ${
                  hasMemories
                    ? "ring-2 ring-pink-200 hover:ring-pink-400 hover:shadow-lg"
                    : todayHighlight
                      ? "ring-2 ring-amber-300"
                      : "hover:bg-gray-50"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {hasMemories && dayData.thumbnailUrl ? (
                  <>
                    <Image
                      src={dayData.thumbnailUrl}
                      alt={dayData.title ?? `Recuerdos del día ${day}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 40px, 60px"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <span className="text-sm font-medium text-white drop-shadow">
                        {day}
                      </span>
                    </div>
                    {dayData.memoryCount > 1 && (
                      <span className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-pink-400 text-[9px] font-bold text-white">
                        {dayData.memoryCount}
                      </span>
                    )}
                  </>
                ) : hasMemories ? (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-pink-50 to-amber-50">
                    <span className="text-sm font-medium text-gray-600">
                      {day}
                    </span>
                    <Heart className="h-3 w-3 fill-pink-300 text-pink-300" />
                  </div>
                ) : (
                  <div
                    className={`flex h-full w-full items-center justify-center text-sm ${
                      todayHighlight
                        ? "bg-amber-50 font-bold text-amber-600"
                        : "bg-gray-50 text-gray-400"
                    }`}
                  >
                    {day}
                  </div>
                )}

                {/* Milestone indicator */}
                {hasMilestone && (
                  <Star className="absolute right-0.5 top-0.5 h-3 w-3 fill-amber-400 text-amber-400 drop-shadow" />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Memory count */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
          <Heart className="h-4 w-4 fill-pink-300 text-pink-300" />
          <span>
            {isPending ? "Cargando..." : `${memoriesThisMonth} recuerdos este mes`}
          </span>
        </div>
      </div>

      {/* Upcoming milestones */}
      {calendarData && calendarData.milestones.length > 0 && (
        <div className="rounded-2xl bg-white/80 p-4 shadow-lg backdrop-blur-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-600">
            <Star className="h-4 w-4 text-amber-400" />
            Próximos hitos
          </h3>
          <div className="space-y-2">
            {calendarData.milestones.slice(0, 3).map((milestone) => (
              <MilestonePreview key={milestone.id.toString()} milestone={milestone} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MilestonePreview({ milestone }: { milestone: MilestoneWithNextDate }) {
  const date = new Date(milestone.nextDate);
  const formattedDate = date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="flex items-center gap-3 rounded-lg bg-amber-50/50 px-3 py-2">
      <span className="text-lg">{milestone.icon ?? "🎉"}</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700">{milestone.title}</p>
        <p className="text-xs text-gray-500">
          {formattedDate}
          {milestone.yearsAgo && milestone.yearsAgo > 0 && (
            <span className="ml-1">· {milestone.yearsAgo} años</span>
          )}
        </p>
      </div>
      {milestone.daysUntil <= 7 && (
        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-700">
          {milestone.daysUntil === 0
            ? "¡Hoy!"
            : milestone.daysUntil === 1
              ? "Mañana"
              : `${milestone.daysUntil} días`}
        </span>
      )}
    </div>
  );
}
