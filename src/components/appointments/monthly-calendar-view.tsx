"use client";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
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
import { Skeleton } from "~/components/ui/skeleton";

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

// ===== Multi-day spanning event support =====

interface SpanningEventSegment {
  event: CalendarEvent;
  startColumn: number; // 0-6 (Mon-Sun)
  columnSpan: number; // 1-7 columns to span
  weekIndex: number; // Which week row
  stackIndex: number; // Vertical stacking position
  isContinuation: boolean; // Continues from previous week
  continuesNextWeek: boolean; // Continues to next week
}

const SPANNING_EVENT_HEIGHT = 20; // Height of each spanning bar in pixels
const SPANNING_EVENT_GAP = 2; // Gap between stacked bars
const MAX_SPANNING_ROWS = 2; // Max visible spanning rows before "+N more"

// Check if event spans multiple days
function isMultiDayEvent(event: CalendarEvent): boolean {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return startDay.getTime() !== endDay.getTime();
}

// Get the column index (0-6) for a date within a specific week
function getDayIndexInWeek(date: Date, weekDays: Date[]): number {
  const dateStr = getDateString(date);
  return weekDays.findIndex((d) => getDateString(d) === dateStr);
}

// Split multi-day events into per-week segments
function calculateSpanningSegments(
  event: CalendarEvent,
  weeks: Date[][],
  calendarStartDate: Date,
  calendarEndDate: Date
): SpanningEventSegment[] {
  const segments: SpanningEventSegment[] = [];

  const eventStart = new Date(event.startTime);
  const eventEnd = new Date(event.endTime);

  // Normalize to day boundaries
  const eventStartDay = new Date(
    eventStart.getFullYear(),
    eventStart.getMonth(),
    eventStart.getDate()
  );
  const eventEndDay = new Date(
    eventEnd.getFullYear(),
    eventEnd.getMonth(),
    eventEnd.getDate()
  );

  // Clamp event to calendar visible range
  const calStart = new Date(
    calendarStartDate.getFullYear(),
    calendarStartDate.getMonth(),
    calendarStartDate.getDate()
  );
  const calEnd = new Date(
    calendarEndDate.getFullYear(),
    calendarEndDate.getMonth(),
    calendarEndDate.getDate()
  );

  const visibleStart = new Date(Math.max(eventStartDay.getTime(), calStart.getTime()));
  const visibleEnd = new Date(Math.min(eventEndDay.getTime(), calEnd.getTime()));

  for (let weekIdx = 0; weekIdx < weeks.length; weekIdx++) {
    const week = weeks[weekIdx];
    if (!week || week.length === 0) continue;

    const weekStart = week[0];
    const weekEnd = week[6];
    if (!weekStart || !weekEnd) continue;

    // Normalize week boundaries
    const weekStartTime = new Date(
      weekStart.getFullYear(),
      weekStart.getMonth(),
      weekStart.getDate()
    );
    const weekEndTime = new Date(
      weekEnd.getFullYear(),
      weekEnd.getMonth(),
      weekEnd.getDate()
    );

    // Check if event overlaps with this week
    if (visibleEnd < weekStartTime || visibleStart > weekEndTime) {
      continue;
    }

    // Calculate segment boundaries within this week
    const segmentStart = new Date(
      Math.max(visibleStart.getTime(), weekStartTime.getTime())
    );
    const segmentEnd = new Date(
      Math.min(visibleEnd.getTime(), weekEndTime.getTime())
    );

    const startColumn = getDayIndexInWeek(segmentStart, week);
    const endColumn = getDayIndexInWeek(segmentEnd, week);

    if (startColumn === -1 || endColumn === -1) continue;

    const columnSpan = endColumn - startColumn + 1;

    segments.push({
      event,
      startColumn,
      columnSpan,
      weekIndex: weekIdx,
      stackIndex: 0, // Will be calculated later
      isContinuation: visibleStart.getTime() < weekStartTime.getTime() || eventStartDay.getTime() < visibleStart.getTime(),
      continuesNextWeek: visibleEnd.getTime() > weekEndTime.getTime() || eventEndDay.getTime() > visibleEnd.getTime(),
    });
  }

  return segments;
}

// Assign vertical stack positions to avoid overlaps
function assignStackPositions(
  segments: SpanningEventSegment[]
): SpanningEventSegment[] {
  // Group segments by week
  const segmentsByWeek = new Map<number, SpanningEventSegment[]>();

  for (const segment of segments) {
    const weekSegments = segmentsByWeek.get(segment.weekIndex) ?? [];
    weekSegments.push(segment);
    segmentsByWeek.set(segment.weekIndex, weekSegments);
  }

  // Process each week independently
  for (const [, weekSegments] of segmentsByWeek) {
    // Sort by start column, then by span length (longer first for better layout)
    weekSegments.sort((a, b) => {
      if (a.startColumn !== b.startColumn) return a.startColumn - b.startColumn;
      return b.columnSpan - a.columnSpan;
    });

    // Track occupied slots per column
    const occupiedSlots = new Map<number, Set<number>>();

    for (const segment of weekSegments) {
      let stackIndex = 0;
      let foundSlot = false;

      while (!foundSlot) {
        let slotAvailable = true;

        // Check if this slot is free for all columns the segment spans
        for (
          let col = segment.startColumn;
          col < segment.startColumn + segment.columnSpan;
          col++
        ) {
          const colSlots = occupiedSlots.get(col) ?? new Set();
          if (colSlots.has(stackIndex)) {
            slotAvailable = false;
            break;
          }
        }

        if (slotAvailable) {
          foundSlot = true;
          segment.stackIndex = stackIndex;

          // Mark these slots as occupied
          for (
            let col = segment.startColumn;
            col < segment.startColumn + segment.columnSpan;
            col++
          ) {
            const colSlots = occupiedSlots.get(col) ?? new Set();
            colSlots.add(stackIndex);
            occupiedSlots.set(col, colSlots);
          }
        } else {
          stackIndex++;
        }
      }
    }
  }

  return segments;
}

// Skeleton component for loading state
function CalendarSkeleton() {
  // Deterministic pattern for appointment counts per day (varies for visual interest)
  const appointmentPattern = [2, 1, 3, 0, 2, 1, 0];

  return (
    <>
      {Array.from({ length: 5 }).map((_, weekIdx) => (
        <div key={weekIdx} className="grid grid-cols-7">
          {Array.from({ length: 7 }).map((_, dayIdx) => {
            const appointmentCount =
              appointmentPattern[(weekIdx + dayIdx) % appointmentPattern.length] ?? 0;

            return (
              <div
                key={dayIdx}
                className="min-h-[100px] border-b border-r p-1 last:border-r-0 sm:min-h-[120px] sm:p-2"
              >
                {/* Date number skeleton */}
                <div className="mb-1 flex items-center justify-between">
                  <Skeleton className="h-6 w-6 rounded-full sm:h-7 sm:w-7" />
                </div>

                {/* Appointment skeletons */}
                <div className="space-y-0.5">
                  {Array.from({ length: appointmentCount }).map((_, aptIdx) => (
                    <Skeleton
                      key={aptIdx}
                      className="h-5 w-full rounded sm:h-6"
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

// Spanning event bar component for multi-day events
interface SpanningEventBarProps {
  segment: SpanningEventSegment;
  onEventClick: (appointmentId: bigint) => void;
  selectedEventId: bigint | null;
}

function SpanningEventBar({
  segment,
  onEventClick,
  selectedEventId,
}: SpanningEventBarProps) {
  const { event, columnSpan, stackIndex, isContinuation, continuesNextWeek } =
    segment;

  const typeConfig = appointmentTypes[
    event.type as keyof typeof appointmentTypes
  ] ?? {
    color: "bg-gray-500",
    icon: CalendarIcon,
  };
  const Icon = typeConfig.icon;

  // Calculate position - cell-relative (width = columnSpan * 100% of cell width)
  const totalWidthPercent = columnSpan * 100;
  const top = stackIndex * (SPANNING_EVENT_HEIGHT + SPANNING_EVENT_GAP);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onEventClick(event.appointmentId);
      }}
      className={cn(
        "absolute left-0 z-20 flex items-center gap-1 overflow-hidden px-1.5 text-[10px] font-medium text-white transition-all hover:ring-1 hover:ring-black sm:px-2 sm:text-xs",
        typeConfig.color,
        event.status === "Cancelled" && "opacity-40 line-through",
        event.status === "Completed" && "bg-green-600 opacity-75",
        event.status === "NoShow" && "bg-red-400 opacity-60",
        selectedEventId === event.appointmentId && "ring-1 ring-black",
        // Rounded corners based on continuation
        isContinuation ? "rounded-l-none" : "rounded-l-md",
        continuesNextWeek ? "rounded-r-none" : "rounded-r-md"
      )}
      style={{
        width: `calc(${totalWidthPercent}% - 4px)`,
        top: `${top}px`,
        height: `${SPANNING_EVENT_HEIGHT}px`,
      }}
      title={`${event.title ?? event.contactName} (${formatTime(event.startTime)} - ${formatTime(event.endTime)})`}
    >
      <Icon className="hidden h-3 w-3 flex-shrink-0 sm:block" />
      <span className="truncate">{event.title ?? event.contactName}</span>
      {/* Visual indicators for continuation */}
      {isContinuation && (
        <span className="absolute left-0.5 text-white/70">‹</span>
      )}
      {continuesNextWeek && (
        <span className="absolute right-0.5 text-white/70">›</span>
      )}
    </button>
  );
}

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
  const weeks = React.useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  // Separate multi-day and single-day events
  const { multiDayEvents, singleDayEvents } = React.useMemo(() => {
    const multiDay: CalendarEvent[] = [];
    const singleDay: CalendarEvent[] = [];

    for (const apt of appointments) {
      if (isMultiDayEvent(apt)) {
        multiDay.push(apt);
      } else {
        singleDay.push(apt);
      }
    }

    return { multiDayEvents: multiDay, singleDayEvents: singleDay };
  }, [appointments]);

  // Calculate spanning segments for multi-day events
  const allSpanningSegments = React.useMemo(() => {
    if (weeks.length === 0) return [];

    const calendarStart = weeks[0]?.[0];
    const calendarEnd = weeks[weeks.length - 1]?.[6];

    if (!calendarStart || !calendarEnd) return [];

    const segments: SpanningEventSegment[] = [];

    for (const event of multiDayEvents) {
      const eventSegments = calculateSpanningSegments(
        event,
        weeks,
        calendarStart,
        calendarEnd
      );
      segments.push(...eventSegments);
    }

    return assignStackPositions(segments);
  }, [multiDayEvents, weeks]);

  // Group single-day appointments by date
  const singleDayByDate = React.useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    singleDayEvents.forEach((apt) => {
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
  }, [singleDayEvents]);

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
              <CalendarSkeleton />
            ) : error ? (
              <div className="py-20 text-center text-red-600">{error}</div>
            ) : (
              weeks.map((week, weekIdx) => {
                // Get spanning segments for this week
                const weekSegments = allSpanningSegments.filter(
                  (s) => s.weekIndex === weekIdx
                );

                return (
                  <div key={weekIdx} className="grid grid-cols-7">
                    {week.map((day, dayIdx) => {
                      const dateStr = getDateString(day);
                      const dayAppointments = singleDayByDate[dateStr] ?? [];
                      const isCurrentMonthDay = isCurrentMonth(
                        day,
                        currentMonth
                      );
                      const isTodayDay = isToday(day);

                      // Get spanning segments that START in this cell (for rendering)
                      const cellSpanningSegments = weekSegments.filter(
                        (s) =>
                          s.startColumn === dayIdx &&
                          s.stackIndex < MAX_SPANNING_ROWS
                      );

                      // Get ALL spanning segments that PASS THROUGH this cell (for spacing)
                      const cellPassingSegments = weekSegments.filter(
                        (s) =>
                          s.stackIndex < MAX_SPANNING_ROWS &&
                          dayIdx >= s.startColumn &&
                          dayIdx < s.startColumn + s.columnSpan
                      );

                      // Count hidden spanning events for this specific day
                      const dayHiddenSpanning = weekSegments.filter(
                        (s) =>
                          s.stackIndex >= MAX_SPANNING_ROWS &&
                          dayIdx >= s.startColumn &&
                          dayIdx < s.startColumn + s.columnSpan
                      ).length;

                      // Calculate height needed - based on ALL events passing through (not just starting)
                      const spanningRowCount = cellPassingSegments.length > 0
                        ? Math.max(...cellPassingSegments.map((s) => s.stackIndex + 1))
                        : 0;
                      const spanningHeight =
                        spanningRowCount * (SPANNING_EVENT_HEIGHT + SPANNING_EVENT_GAP);

                      return (
                        <div
                          key={dayIdx}
                          className={cn(
                            "relative min-h-[100px] overflow-visible border-b border-r p-1 last:border-r-0 sm:min-h-[120px] sm:p-2",
                            !isCurrentMonthDay && "bg-muted/30",
                            isTodayDay && "bg-blue-50"
                          )}
                        >
                          {/* Date number */}
                          <div className="mb-1 flex items-center justify-between">
                            <div
                              className={cn(
                                "relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium sm:h-7 sm:w-7 sm:text-sm",
                                isTodayDay && "bg-blue-600 text-white",
                                !isTodayDay &&
                                  !isCurrentMonthDay &&
                                  "text-muted-foreground"
                              )}
                            >
                              {day.getDate()}
                            </div>
                            <div className="flex items-center gap-0.5">
                              {/* Show +N for hidden spanning events */}
                              {dayHiddenSpanning > 0 && (
                                <span className="relative z-10 rounded bg-muted px-1 text-[10px] text-muted-foreground">
                                  +{dayHiddenSpanning}
                                </span>
                              )}
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
                                          {dayAppointments.map(
                                            (apt: CalendarEvent) => {
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
                                                    onEventClick(
                                                      apt.appointmentId
                                                    );
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
                                                    selectedEventId ===
                                                      apt.appointmentId &&
                                                      "ring-1 ring-black"
                                                  )}
                                                >
                                                  <Icon className="mt-0.5 h-3 w-3 flex-shrink-0" />
                                                  <div className="min-w-0 flex-1">
                                                    <div className="text-xs font-medium leading-tight">
                                                      {formatTime(apt.startTime)}{" "}
                                                      -{" "}
                                                      {formatTime(apt.endTime)}
                                                    </div>
                                                    <div className="truncate text-xs opacity-90">
                                                      {apt.title ??
                                                        apt.contactName}
                                                    </div>
                                                  </div>
                                                </button>
                                              );
                                            }
                                          )}
                                        </div>
                                      </ScrollArea>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>
                            </div>

                          {/* Spanning events spacer - reserves space in ALL cells where events pass through */}
                          {spanningHeight > 0 && (
                            <div
                              className="relative mb-0.5"
                              style={{ height: `${spanningHeight}px` }}
                            >
                              {/* Only render actual bars in the starting cell */}
                              {cellSpanningSegments.map((segment) => (
                                <SpanningEventBar
                                  key={`${segment.event.appointmentId.toString()}-${weekIdx}`}
                                  segment={segment}
                                  onEventClick={onEventClick}
                                  selectedEventId={selectedEventId}
                                />
                              ))}
                            </div>
                          )}

                            {/* Single-day appointments - show first 3 only */}
                            <div className="space-y-0.5">
                              {dayAppointments
                                .slice(0, 3)
                                .map((apt: CalendarEvent) => {
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
                                          {formatTime(apt.startTime)}{" "}
                                          {apt.title ?? apt.contactName}
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
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Add React import
import React from "react";
