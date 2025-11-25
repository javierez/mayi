"use client";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { ChevronLeft, ChevronRight, RefreshCw, Loader } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  Home,
  Users,
  PenTool,
  Handshake,
  Train,
  ListTodo,
  CalendarIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";

// Calendar Event Type
interface CalendarEvent {
  appointmentId: bigint;
  contactName: string;
  propertyAddress?: string;
  startTime: Date;
  endTime: Date;
  status: "Scheduled" | "Completed" | "Cancelled" | "Rescheduled" | "NoShow";
  type: string;
  title?: string;
  tripTimeMinutes?: number;
  notes?: string;
  isOptimistic?: boolean;
}

interface MonthlyCalendarViewProps {
  appointments: CalendarEvent[];
  loading: boolean;
  error: string | null;
  onRefetch: () => void;
  onEventClick: (appointmentId: bigint) => void;
  onDateClick: (date: Date) => void;
  selectedEventId: bigint | null;
}

// Appointment type icons and colors
const appointmentTypes = {
  Visita: {
    color: "bg-blue-500",
    icon: Home,
  },
  Reunión: {
    color: "bg-purple-500",
    icon: Users,
  },
  Firma: {
    color: "bg-green-500",
    icon: PenTool,
  },
  Cierre: {
    color: "bg-yellow-500",
    icon: Handshake,
  },
  Viaje: {
    color: "bg-emerald-500",
    icon: Train,
  },
  Tarea: {
    color: "bg-rose-500",
    icon: ListTodo,
  },
};

// Helper to get the first day of the month
const getMonthStart = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

// Helper to get the last day of the month
const getMonthEnd = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

// Helper to get all days to display in the calendar (including padding)
const getCalendarDays = (date: Date) => {
  const monthStart = getMonthStart(date);
  const monthEnd = getMonthEnd(date);

  // Get the day of week (0 = Sunday, 1 = Monday, etc.)
  // We want Monday to be the first day, so adjust
  const startDay = monthStart.getDay();
  const startPadding = startDay === 0 ? 6 : startDay - 1; // Monday = 0, Sunday = 6

  const endDay = monthEnd.getDay();
  const endPadding = endDay === 0 ? 0 : 7 - endDay;

  const days: Date[] = [];

  // Add padding days from previous month
  for (let i = startPadding; i > 0; i--) {
    const day = new Date(monthStart);
    day.setDate(day.getDate() - i);
    days.push(day);
  }

  // Add days of current month
  for (let i = 1; i <= monthEnd.getDate(); i++) {
    days.push(new Date(date.getFullYear(), date.getMonth(), i));
  }

  // Add padding days from next month
  for (let i = 1; i <= endPadding; i++) {
    const day = new Date(monthEnd);
    day.setDate(day.getDate() + i);
    days.push(day);
  }

  return days;
};

// Helper to check if date is today
const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// Helper to check if date is in current month
const isCurrentMonth = (date: Date, currentMonth: Date) => {
  return (
    date.getMonth() === currentMonth.getMonth() &&
    date.getFullYear() === currentMonth.getFullYear()
  );
};

// Helper to get date string
const getDateString = (date: Date): string => {
  const str = date.toISOString().split("T")[0];
  return str ?? "";
};

// Helper to format month and year
const formatMonthYear = (date: Date) => {
  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(date);
};

// Helper to format weekday
const formatWeekday = (index: number) => {
  const date = new Date(2025, 0, 6 + index); // Start from a Monday
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
  })
    .format(date)
    .toUpperCase();
};

// Helper to format time
const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export function MonthlyCalendarView({
  appointments,
  loading,
  error,
  onRefetch,
  onEventClick,
  onDateClick,
  selectedEventId,
}: MonthlyCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = React.useState(() => new Date());

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth);
    if (direction === "next") {
      newMonth.setMonth(newMonth.getMonth() + 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() - 1);
    }
    setCurrentMonth(newMonth);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const calendarDays = getCalendarDays(currentMonth);
  const weeks: Date[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  // Group appointments by date
  const appointmentsByDate = React.useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    appointments.forEach((apt) => {
      const dateStr = getDateString(apt.startTime);
      grouped[dateStr] ??= [];
      const dateGroup = grouped[dateStr];
      if (dateGroup) {
        dateGroup.push(apt);
      }
    });
    // Sort appointments by start time within each day
    Object.keys(grouped).forEach((dateStr) => {
      const dateGroup = grouped[dateStr];
      if (dateGroup) {
        dateGroup.sort(
          (a, b) => a.startTime.getTime() - b.startTime.getTime()
        );
      }
    });
    return grouped;
  }, [appointments]);

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <div className="mb-4 mt-4 flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h3 className="text-base font-semibold sm:text-lg">
              {formatMonthYear(currentMonth)}
            </h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={goToToday}
              className="w-full sm:w-auto"
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onRefetch}
              disabled={loading}
              title="Refrescar eventos"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto p-0">
        <div className="min-w-[640px]">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b bg-white">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <div
                key={day}
                className="flex h-10 items-center justify-center border-r text-xs font-medium text-muted-foreground last:border-r-0"
              >
                {formatWeekday(day)}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="border-t">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader className="h-6 w-6 animate-spin" />
                <span className="ml-2">Cargando citas...</span>
              </div>
            ) : error ? (
              <div className="py-20 text-center text-red-600">{error}</div>
            ) : (
              weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="grid grid-cols-7">
                  {week.map((day, dayIdx) => {
                    const dateStr = getDateString(day);
                    const dayAppointments = appointmentsByDate[dateStr] ?? [];
                    const isCurrentMonthDay = isCurrentMonth(day, currentMonth);
                    const isTodayDay = isToday(day);

                    return (
                      <div
                        key={dayIdx}
                        className={cn(
                          "relative min-h-[100px] border-b border-r p-1 last:border-r-0 sm:min-h-[120px] sm:p-2",
                          !isCurrentMonthDay && "bg-muted/30",
                          isTodayDay && "bg-blue-50"
                        )}
                      >
                        {/* Date number */}
                        <div className="mb-1 flex items-center justify-between">
                          <div
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium sm:h-7 sm:w-7 sm:text-sm",
                              isTodayDay && "bg-blue-600 text-white",
                              !isTodayDay &&
                                !isCurrentMonthDay &&
                                "text-muted-foreground"
                            )}
                          >
                            {day.getDate()}
                          </div>
                          <div className="flex items-center gap-0.5">
                            {dayAppointments.length > 3 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  className="relative z-10 rounded px-1 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                >
                                  +{dayAppointments.length - 3}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-64 p-2"
                                align="center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="mb-2 text-sm font-medium">
                                  {day.toLocaleDateString("es-ES", {
                                    day: "numeric",
                                    month: "long",
                                  })}
                                </div>
                                <ScrollArea className="max-h-[300px]">
                                  <div className="space-y-1">
                                    {dayAppointments.map((apt: CalendarEvent) => {
                                      const typeConfig =
                                        appointmentTypes[
                                          apt.type as keyof typeof appointmentTypes
                                        ] ?? {
                                          color: "bg-gray-500",
                                          icon: CalendarIcon,
                                        };
                                      const Icon = typeConfig.icon;

                                      return (
                                        <button
                                          key={apt.appointmentId.toString()}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick(apt.appointmentId);
                                          }}
                                          className={cn(
                                            "group flex w-full items-start gap-1.5 rounded px-2 py-1.5 text-left text-white transition-all hover:ring-1 hover:ring-black",
                                            typeConfig.color,
                                            apt.status === "Cancelled" &&
                                              "opacity-40 line-through",
                                            apt.status === "Completed" &&
                                              "opacity-75 bg-green-600",
                                            apt.status === "NoShow" &&
                                              "opacity-60 bg-red-400",
                                            selectedEventId === apt.appointmentId &&
                                              "ring-1 ring-black"
                                          )}
                                        >
                                          <Icon className="mt-0.5 h-3 w-3 flex-shrink-0" />
                                          <div className="min-w-0 flex-1">
                                            <div className="text-xs font-medium leading-tight">
                                              {formatTime(apt.startTime)} - {formatTime(apt.endTime)}
                                            </div>
                                            <div className="truncate text-xs opacity-90">
                                              {apt.contactName}
                                            </div>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </ScrollArea>
                              </PopoverContent>
                            </Popover>
                            )}
                          </div>
                        </div>

                        {/* Appointments for this day - show first 3 only */}
                        <div className="space-y-0.5">
                          {dayAppointments.slice(0, 3).map((apt: CalendarEvent) => {
                            const typeConfig =
                              appointmentTypes[
                                apt.type as keyof typeof appointmentTypes
                              ] ?? {
                                color: "bg-gray-500",
                                icon: CalendarIcon,
                              };
                            const Icon = typeConfig.icon;

                            return (
                              <button
                                key={apt.appointmentId.toString()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEventClick(apt.appointmentId);
                                }}
                                className={cn(
                                  "group relative z-10 flex w-full items-start gap-1 rounded px-1 py-0.5 text-left text-white transition-all hover:ring-1 hover:ring-black",
                                  typeConfig.color,
                                  apt.status === "Cancelled" &&
                                    "opacity-40 line-through",
                                  apt.status === "Completed" &&
                                    "opacity-75 bg-green-600",
                                  apt.status === "NoShow" &&
                                    "opacity-60 bg-red-400",
                                  selectedEventId === apt.appointmentId &&
                                    "ring-1 ring-black"
                                )}
                              >
                                <Icon className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 sm:h-3 sm:w-3" />
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-[10px] font-medium leading-tight sm:text-xs">
                                    {formatTime(apt.startTime)} {apt.contactName}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Click area for creating new appointment - fills empty space */}
                        <div
                          className="absolute inset-0 cursor-pointer"
                          onClick={() => onDateClick(day)}
                          title={`Crear cita - ${day.toLocaleDateString("es-ES")}`}
                        />
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Add React import
import React from "react";
