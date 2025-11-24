"use client";

import { useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";
import { ChevronLeft, ChevronRight, RefreshCw, Loader } from "lucide-react";
import CalendarEvent from "~/components/appointments/calendar-event";
import type { AppointmentData } from "~/components/appointments/appointment-card";

interface CalendarWeeklyViewProps {
  appointments: AppointmentData[];
  loading: boolean;
  error: string | null;
  selectedEvent: bigint | null;
  onEventSelect: (eventId: bigint) => void;
  weekStart: Date;
  onNavigateWeek: (direction: "prev" | "next") => void;
  onRefresh: () => void;
  onTimeSlotClick: (date: Date, hour: number, minute: number) => void;
}

// Helper to get the week days
const getWeekDays = (weekStart: Date) => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    days.push(day);
  }
  return days;
};

const formatShortDate = (date: Date) => {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
  }).format(date);
};

const formatWeekday = (date: Date) => {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
  })
    .format(date)
    .toUpperCase();
};

const formatMonthYear = (date: Date) => {
  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(date);
};

const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// Helper to calculate event position and height for a specific day
const calculateEventStyle = (
  startDateTime: Date,
  endDateTime: Date,
  currentDay: Date,
) => {
  const calendarStartMinutes = 6 * 60; // 6:00 AM = 360 minutes
  const calendarEndMinutes = 24 * 60; // 11:59 PM = 1440 minutes
  const calendarDurationMinutes = calendarEndMinutes - calendarStartMinutes;

  // Get date strings for comparison (YYYY-MM-DD)
  const currentDayStr = currentDay.toISOString().split("T")[0];
  const startDayStr = startDateTime.toISOString().split("T")[0];
  const endDayStr = endDateTime.toISOString().split("T")[0];

  // Determine if this is the start day, end day, middle day, or single day
  const isStartDay = currentDayStr === startDayStr;
  const isEndDay = currentDayStr === endDayStr;
  const isSingleDay = isStartDay && isEndDay;

  let topPosition = 0;
  let height = 0;

  if (isSingleDay) {
    // Single day event - use actual start and end times
    const startMinutes =
      startDateTime.getHours() * 60 + startDateTime.getMinutes();
    const endMinutes = endDateTime.getHours() * 60 + endDateTime.getMinutes();

    topPosition = ((startMinutes - calendarStartMinutes) / 60) * 60;
    const durationMinutes = endMinutes - startMinutes;
    height = (durationMinutes / 60) * 60;

    // Hide if starts before calendar view
    if (startMinutes < calendarStartMinutes) {
      return { top: "0px", height: "0px", display: "none" };
    }
  } else if (isStartDay) {
    // First day of multi-day event - from start time to midnight
    const startMinutes =
      startDateTime.getHours() * 60 + startDateTime.getMinutes();
    topPosition = ((startMinutes - calendarStartMinutes) / 60) * 60;
    const remainingMinutes = calendarEndMinutes - startMinutes;
    height = (remainingMinutes / 60) * 60;

    if (startMinutes < calendarStartMinutes) {
      topPosition = 0;
      height = ((calendarEndMinutes - calendarStartMinutes) / 60) * 60;
    }
  } else if (isEndDay) {
    // Last day of multi-day event - from calendar start to end time
    const endMinutes = endDateTime.getHours() * 60 + endDateTime.getMinutes();
    topPosition = 0;
    height = ((endMinutes - calendarStartMinutes) / 60) * 60;

    if (endMinutes < calendarStartMinutes) {
      return { top: "0px", height: "0px", display: "none" };
    }
  } else {
    // Middle day of multi-day event - full day from calendar start to end
    topPosition = 0;
    height = (calendarDurationMinutes / 60) * 60;
  }

  return {
    top: `${Math.max(0, topPosition)}px`,
    height: `${Math.max(0, height)}px`,
  };
};

export function CalendarWeeklyView({
  appointments,
  loading,
  error,
  selectedEvent,
  onEventSelect,
  weekStart,
  onNavigateWeek,
  onRefresh,
  onTimeSlotClick,
}: CalendarWeeklyViewProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Scroll to 10:00 AM on mount and when week changes
  useEffect(() => {
    if (scrollAreaRef.current) {
      // Calendar starts at 6:00 AM, so 10:00 AM is 4 hours down
      const scrollPosition = 4 * 60; // 4 hours from 6:00 AM = 240px (4 hours * 60px per hour)
      scrollAreaRef.current.scrollTop = scrollPosition;
    }
  }, [weekStart]);

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <div className="mb-3 mt-3 flex flex-col gap-2 px-3 sm:mb-4 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 md:px-6">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigateWeek("prev")}
              className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigateWeek("next")}
              className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h3 className="min-w-0 truncate text-sm font-semibold sm:text-base md:text-lg">
              {formatMonthYear(weekStart)}
            </h3>
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const today = new Date();
                const d = today;
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(d.setDate(diff));
                onNavigateWeek(monday > weekStart ? "next" : "prev");
              }}
              className="h-9 flex-1 text-sm sm:h-10 sm:w-auto sm:flex-none sm:text-base"
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={loading}
              title="Refrescar eventos"
              className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="-mx-3 overflow-x-auto p-0 sm:-mx-0">
        <div className="min-w-[580px] sm:min-w-[640px] md:min-w-[720px]">
          {/* Day headers */}
          <div className="sticky top-0 z-10 grid grid-cols-8 border-b bg-white">
            {/* Time column header */}
            <div className="flex h-12 min-w-[48px] items-center justify-center border-r text-[10px] text-muted-foreground sm:h-14 sm:min-w-[60px] sm:text-xs md:text-sm">
              GMT+02
            </div>

            {/* Day columns headers */}
            {getWeekDays(weekStart).map((day, dayIdx) => (
              <div
                key={dayIdx}
                className={cn(
                  "relative flex h-12 min-w-[68px] flex-col items-center justify-center sm:h-14 sm:min-w-[80px] md:min-w-[100px]",
                  isToday(day) && "bg-blue-50",
                )}
              >
                <div className="text-[10px] text-muted-foreground sm:text-xs">
                  {formatWeekday(day)}
                </div>
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium sm:h-8 sm:w-8 sm:text-sm md:h-10 md:w-10 md:text-xl",
                    isToday(day) && "bg-blue-600 text-white",
                  )}
                >
                  {formatShortDate(day)}
                </div>
              </div>
            ))}
          </div>

          <ScrollArea
            className="h-[350px] sm:h-[450px] md:h-[500px] lg:h-[600px]"
            ref={scrollAreaRef}
          >
            <div className="grid grid-cols-8">
              {/* Hours column */}
              <div className="flex min-w-[48px] flex-col border-r sm:min-w-[60px]">
                {Array.from({ length: 18 }, (_, i) => i + 6).map((hour) => (
                  <div
                    key={hour}
                    className="flex h-[60px] items-start justify-end border-b pr-1 pt-1 text-[10px] text-muted-foreground sm:pr-2 sm:text-xs"
                  >
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {/* Days columns */}
              {getWeekDays(weekStart).map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className={cn(
                    "relative flex min-w-[68px] flex-col border-r sm:min-w-[80px] md:min-w-[100px]",
                    isToday(day) && "bg-blue-50/30",
                  )}
                >
                  {/* Hour slots */}
                  {Array.from({ length: 18 }, (_, i) => i + 6).map((hour) => (
                    <div key={hour} className="relative h-[60px] border-b">
                      {/* First half-hour slot */}
                      <div
                        className="absolute left-0 right-0 top-0 h-1/2 cursor-pointer transition-colors hover:bg-blue-50/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTimeSlotClick(day, hour, 0);
                        }}
                        title={`Crear cita - ${hour.toString().padStart(2, "0")}:00`}
                      />

                      {/* Half-hour divider */}
                      <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-gray-200"></div>

                      {/* Second half-hour slot */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-1/2 cursor-pointer transition-colors hover:bg-blue-50/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTimeSlotClick(day, hour, 30);
                        }}
                        title={`Crear cita - ${hour.toString().padStart(2, "0")}:30`}
                      />
                    </div>
                  ))}

                  {/* Appointments for this day */}
                  {!loading &&
                    !error &&
                    appointments
                      .filter((app) => {
                        // Show event if it overlaps with this day at all
                        const dayStart = new Date(day);
                        dayStart.setHours(0, 0, 0, 0);
                        const dayEnd = new Date(day);
                        dayEnd.setHours(23, 59, 59, 999);

                        const appStart = new Date(app.datetimeStart);
                        const appEnd = new Date(app.datetimeEnd);

                        // Event overlaps if it starts before day ends AND ends after day starts
                        return appStart <= dayEnd && appEnd >= dayStart;
                      })
                      .map((app) => {
                        const eventStyle = calculateEventStyle(
                          new Date(app.datetimeStart),
                          new Date(app.datetimeEnd),
                          day,
                        );

                        return (
                          <CalendarEvent
                            key={app.appointmentId.toString()}
                            event={{
                              appointmentId: app.appointmentId,
                              type: app.type,
                              status: app.status,
                              startTime: app.datetimeStart,
                              endTime: app.datetimeEnd,
                              contactName: app.contactName,
                              propertyAddress: app.propertyAddress ?? undefined,
                              notes: app.notes ?? undefined,
                              tripTimeMinutes: app.tripTimeMinutes ?? undefined,
                              isOptimistic: false,
                            }}
                            style={eventStyle}
                            isSelected={selectedEvent === app.appointmentId}
                            onClick={() => onEventSelect(app.appointmentId)}
                          />
                        );
                      })}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>

      {/* Loading overlay for weekly view */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <Loader className="h-6 w-6 animate-spin" />
        </div>
      )}
    </Card>
  );
}
