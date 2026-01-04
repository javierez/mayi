"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Camera } from "lucide-react";
import Image from "next/image";
import { getCalendarMonthAction } from "~/server/actions/memoria/days";
import type { CalendarMonth, DaySummary } from "~/types/memoria";

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

  // Load calendar data (with fallback for no-auth mode)
  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await getCalendarMonthAction(year, month);
        if (result.success && result.data) {
          setCalendarData(result.data);
        } else {
          // Fallback: empty calendar for development
          setCalendarData({ year, month, days: [], milestones: [] });
        }
      } catch {
        // No auth - use empty calendar
        setCalendarData({ year, month, days: [], milestones: [] });
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
    <div className="flex h-[calc(100vh-5rem)] flex-col px-2 pb-2 pt-3">
      {/* Calendar Card - fills available space */}
      <div className="flex flex-1 flex-col rounded-2xl bg-white/90 p-3 shadow-sm backdrop-blur-sm">
        {/* Month navigation */}
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
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
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="py-1.5 text-center text-xs font-medium text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid - fills remaining space */}
        <div className="mt-1 grid flex-1 grid-cols-7 grid-rows-6 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="rounded-lg bg-gray-50/50" />;
            }

            const dayData = getDayData(day);
            const hasMemories = dayData && dayData.memoryCount > 0;
            const todayHighlight = isToday(day);

            return (
              <motion.button
                key={day}
                onClick={() => handleDayClick(day)}
                className={`group relative overflow-hidden rounded-xl transition-all ${
                  hasMemories
                    ? "ring-1 ring-slate-200 hover:ring-slate-400 hover:shadow-md"
                    : todayHighlight
                      ? "ring-2 ring-amber-300"
                      : "hover:bg-gray-100"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {hasMemories && dayData.thumbnailUrl ? (
                  <>
                    <Image
                      src={dayData.thumbnailUrl}
                      alt={dayData.title ?? `Recuerdos del día ${day}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 14vw, 60px"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <span className="text-base font-semibold text-white drop-shadow-md">
                        {day}
                      </span>
                    </div>
                  </>
                ) : hasMemories ? (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100">
                    <span className="text-base font-medium text-gray-600">
                      {day}
                    </span>
                    <Camera className="h-4 w-4 text-slate-400" />
                  </div>
                ) : (
                  <div
                    className={`relative flex h-full w-full items-center justify-center text-base ${
                      todayHighlight
                        ? "bg-amber-50 font-bold text-amber-600"
                        : "bg-gray-50 text-gray-400"
                    }`}
                  >
                    <span className="transition-opacity group-hover:opacity-0">{day}</span>
                    {/* Plus button on hover for empty days */}
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 opacity-0 transition-opacity group-hover:opacity-100">
                      <Plus className="h-6 w-6 text-slate-500" />
                    </div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Memory count - smaller footer */}
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Camera className="h-3.5 w-3.5" />
          <span>
            {isPending ? "Cargando..." : `${memoriesThisMonth} recuerdos este mes`}
          </span>
        </div>
      </div>
    </div>
  );
}
