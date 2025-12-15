"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getAppointmentsByDateRangeAction } from "~/server/actions/appointments";

// Re-export types from use-appointments for compatibility
interface CalendarEvent {
  appointmentId: bigint;
  userId: string;
  contactName: string;
  propertyAddress?: string;
  propertyTitle?: string;
  city?: string;
  startTime: Date;
  endTime: Date;
  status: "Scheduled" | "Completed" | "Cancelled" | "Rescheduled" | "NoShow";
  type: string;
  title?: string;
  tripTimeMinutes?: number;
  notes?: string;
  contactId: bigint | null;
  listingId?: bigint | null;
  listingContactId?: bigint | null;
  dealId?: bigint | null;
  prospectId?: bigint | null;
  agentName?: string | null;
  isOptimistic?: boolean;
}

interface RawAppointment {
  appointmentId: bigint;
  userId: string;
  assignedTo: string | null;
  contactId: bigint | null;
  listingId: bigint | null;
  listingContactId: bigint | null;
  dealId: bigint | null;
  prospectId: bigint | null;
  datetimeStart: Date;
  datetimeEnd: Date;
  tripTimeMinutes: number | null;
  status: string;
  title: string | null;
  notes: string | null;
  type: string | null;
  isActive: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  contactFirstName: string | null;
  contactLastName: string | null;
  propertyStreet: string | null;
  propertyTitle: string | null;
  city: string | null;
  creatorName: string | null;
  creatorFirstName: string | null;
  creatorLastName: string | null;
  agentName: string | null;
  agentFirstName: string | null;
  agentLastName: string | null;
}

interface UseSimpleCalendarReturn {
  appointments: CalendarEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  fetchByDateRange: (startDate: Date, endDate: Date) => Promise<void>;
  addOptimisticEvent: (event: Partial<CalendarEvent>) => bigint;
  removeOptimisticEvent: (tempId: bigint) => void;
  updateOptimisticEvent: (
    tempId: bigint,
    updates: Partial<CalendarEvent>,
  ) => void;
}

// Constants
const AUTO_CLEANUP_TIMEOUT = 30 * 1000; // 30 seconds for optimistic events

// Utility functions
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getYearRange(currentWeekStart: Date): {
  startDate: Date;
  endDate: Date;
} {
  // 6 months before
  const startDate = new Date(currentWeekStart);
  startDate.setMonth(startDate.getMonth() - 6);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  // 6 months after (end of that month)
  const endDate = new Date(currentWeekStart);
  endDate.setMonth(endDate.getMonth() + 7);
  endDate.setDate(0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

function generateTempId(): bigint {
  return BigInt(-Date.now());
}

function transformToOptimisticEvent(
  eventData: Partial<CalendarEvent>,
  tempId: bigint,
): CalendarEvent {
  const now = new Date();
  return {
    appointmentId: tempId,
    userId: eventData.userId ?? "",
    contactName: eventData.contactName ?? "New Contact",
    propertyAddress: eventData.propertyAddress,
    propertyTitle: eventData.propertyTitle,
    city: eventData.city,
    startTime: eventData.startTime ?? now,
    endTime: eventData.endTime ?? new Date(now.getTime() + 60 * 60 * 1000),
    status: eventData.status ?? "Scheduled",
    type: eventData.type ?? "Visita",
    title: eventData.title,
    tripTimeMinutes: eventData.tripTimeMinutes,
    notes: eventData.notes,
    contactId: eventData.contactId ?? BigInt(0),
    listingId: eventData.listingId,
    listingContactId: eventData.listingContactId,
    dealId: eventData.dealId,
    prospectId: eventData.prospectId,
    agentName: eventData.agentName,
    isOptimistic: true,
  };
}

function transformToCalendarEvent(
  rawAppointment: RawAppointment,
): CalendarEvent {
  const contactName =
    rawAppointment.contactFirstName && rawAppointment.contactLastName
      ? `${rawAppointment.contactFirstName} ${rawAppointment.contactLastName}`
      : `Contact ${rawAppointment.contactId}`;

  console.log("🔄 [Hook] Transforming appointment:", {
    appointmentId: rawAppointment.appointmentId.toString(),
    userId: rawAppointment.userId,
    contactName,
  });

  return {
    appointmentId: rawAppointment.appointmentId,
    userId: rawAppointment.userId,
    contactName,
    propertyAddress: rawAppointment.propertyStreet ?? undefined,
    propertyTitle: rawAppointment.propertyTitle ?? undefined,
    city: rawAppointment.city ?? undefined,
    startTime: rawAppointment.datetimeStart,
    endTime: rawAppointment.datetimeEnd,
    status:
      (rawAppointment.status as
        | "Scheduled"
        | "Completed"
        | "Cancelled"
        | "Rescheduled"
        | "NoShow") ?? "Scheduled",
    type: rawAppointment.type ?? "Visita",
    title: rawAppointment.title ?? undefined,
    tripTimeMinutes: rawAppointment.tripTimeMinutes ?? undefined,
    notes: rawAppointment.notes ?? undefined,
    contactId: rawAppointment.contactId,
    listingId: rawAppointment.listingId,
    listingContactId: rawAppointment.listingContactId,
    dealId: rawAppointment.dealId,
    prospectId: rawAppointment.prospectId,
    agentName: rawAppointment.agentName,
    isOptimistic: false,
  };
}

function mergeAndSortEvents(
  serverEvents: CalendarEvent[],
  optimisticEvents: CalendarEvent[],
): CalendarEvent[] {
  const allEvents = [...serverEvents, ...optimisticEvents];
  return allEvents.sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );
}

// Main simplified hook
export function useSimpleCalendar(
  currentWeekStart: Date,
  filterByUserIds?: string[],
): UseSimpleCalendarReturn {
  // State
  const [appointments, setAppointments] = useState<CalendarEvent[]>([]);
  const [optimisticEvents, setOptimisticEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedRange, setLoadedRange] = useState<{
    startDate: Date;
    endDate: Date;
  } | null>(null);
  const [lastFilterIds, setLastFilterIds] = useState<string[] | undefined>(
    filterByUserIds,
  );

  // Calculate year range (±6 months)
  const currentRange = useMemo(
    () => getYearRange(currentWeekStart),
    [currentWeekStart],
  );

  // Check if current week is within loaded range AND filter hasn't changed
  const isWithinLoadedRange = useMemo(() => {
    if (!loadedRange) return false;

    // Check if filter has changed
    const filterChanged =
      JSON.stringify(lastFilterIds?.sort()) !==
      JSON.stringify(filterByUserIds?.sort());

    if (filterChanged) return false;

    return (
      currentRange.startDate >= loadedRange.startDate &&
      currentRange.endDate <= loadedRange.endDate
    );
  }, [currentRange, loadedRange, lastFilterIds, filterByUserIds]);

  // Fetch 4 weeks of data
  const fetch4Weeks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getAppointmentsByDateRangeAction(
        currentRange.startDate,
        currentRange.endDate,
        filterByUserIds,
      );

      if (result.success) {
        const calendarEvents = result.appointments.map(
          transformToCalendarEvent,
        );
        setAppointments(calendarEvents);
        setLoadedRange(currentRange);
        setLastFilterIds(filterByUserIds);
      } else {
        setError(result.error ?? "Error desconocido");
        setAppointments([]);
      }
    } catch (err) {
      setError("Error al cargar las citas");
      setAppointments([]);
      console.error("Error fetching 4-week appointments:", err);
    } finally {
      setLoading(false);
    }
  }, [currentRange, filterByUserIds]);

  // Optimistic event management
  const addOptimisticEvent = useCallback(
    (eventData: Partial<CalendarEvent>): bigint => {
      const tempId = generateTempId();
      const optimisticEvent = transformToOptimisticEvent(eventData, tempId);

      setOptimisticEvents((prev) => [...prev, optimisticEvent]);

      // Auto-cleanup after timeout
      setTimeout(() => {
        setOptimisticEvents((prev) =>
          prev.filter((event) => event.appointmentId !== tempId),
        );
      }, AUTO_CLEANUP_TIMEOUT);

      return tempId;
    },
    [],
  );

  const removeOptimisticEvent = useCallback((tempId: bigint) => {
    setOptimisticEvents((prev) =>
      prev.filter((event) => event.appointmentId !== tempId),
    );
  }, []);

  const updateOptimisticEvent = useCallback(
    (tempId: bigint, updates: Partial<CalendarEvent>) => {
      setOptimisticEvents((prev) =>
        prev.map((event) => {
          if (event.appointmentId === tempId) {
            return { ...event, ...updates };
          }
          return event;
        }),
      );
    },
    [],
  );

  // Merge server events with optimistic events
  const mergedAppointments = useMemo(() => {
    return mergeAndSortEvents(appointments, optimisticEvents);
  }, [appointments, optimisticEvents]);

  // Fetch data when range changes or on initial load
  useEffect(() => {
    if (!isWithinLoadedRange) {
      void fetch4Weeks();
    }
  }, [isWithinLoadedRange, fetch4Weeks]);

  // Refetch function
  const refetch = useCallback(async () => {
    await fetch4Weeks();
  }, [fetch4Weeks]);

  // Custom date range fetch
  const fetchByDateRange = useCallback(
    async (startDate: Date, endDate: Date) => {
      setLoading(true);
      setError(null);

      try {
        const result = await getAppointmentsByDateRangeAction(
          startDate,
          endDate,
          filterByUserIds,
        );

        if (result.success) {
          const calendarEvents = result.appointments.map(
            transformToCalendarEvent,
          );
          setAppointments(calendarEvents);
          setLoadedRange({ startDate, endDate });
          setLastFilterIds(filterByUserIds);
        } else {
          setError(result.error ?? "Error desconocido");
          setAppointments([]);
        }
      } catch (err) {
        setError("Error al cargar las citas por rango de fechas");
        setAppointments([]);
        console.error("Error fetching appointments by date range:", err);
      } finally {
        setLoading(false);
      }
    },
    [filterByUserIds],
  );

  return {
    appointments: mergedAppointments,
    loading,
    error,
    refetch,
    fetchByDateRange,
    addOptimisticEvent,
    removeOptimisticEvent,
    updateOptimisticEvent,
  };
}

// Convenience hooks for backwards compatibility
export function useWeeklyAppointments(
  weekStart: Date,
  filterByUserIds?: string[],
): UseSimpleCalendarReturn {
  return useSimpleCalendar(weekStart, filterByUserIds);
}

// Additional hooks for full compatibility with use-appointments.ts
export function useAppointments(): UseSimpleCalendarReturn {
  // Use current date as baseline for full appointments view
  const today = new Date();
  const monday = getMonday(today);
  return useSimpleCalendar(monday);
}

export function useTodayAppointments(): UseSimpleCalendarReturn {
  const today = new Date();
  const monday = getMonday(today);
  return useSimpleCalendar(monday);
}

// Alias for the main hook to maintain compatibility
export function useCachedCalendar(
  currentWeekStart: Date,
): UseSimpleCalendarReturn {
  return useSimpleCalendar(currentWeekStart);
}

// Utility functions that were in the original hook
export function filterAppointmentsByDate(
  appointments: CalendarEvent[],
  date: Date,
): CalendarEvent[] {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(targetDate);
  nextDay.setDate(targetDate.getDate() + 1);

  return appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.startTime);
    return appointmentDate >= targetDate && appointmentDate < nextDay;
  });
}

export function groupAppointmentsByDate(
  appointments: CalendarEvent[],
): Record<string, CalendarEvent[]> {
  return appointments.reduce(
    (groups, appointment) => {
      const dateKey = new Date(appointment.startTime)
        .toISOString()
        .split("T")[0];
      if (!dateKey) return groups;

      groups[dateKey] ??= [];
      groups[dateKey]?.push(appointment);
      return groups;
    },
    {} as Record<string, CalendarEvent[]>,
  );
}

export function formatAppointmentTime(appointment: CalendarEvent): string {
  const startTime = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(appointment.startTime);

  const endTime = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(appointment.endTime);

  return `${startTime} - ${endTime}`;
}

export function isAppointmentToday(appointment: CalendarEvent): boolean {
  const today = new Date();
  const appointmentDate = new Date(appointment.startTime);

  return (
    today.getDate() === appointmentDate.getDate() &&
    today.getMonth() === appointmentDate.getMonth() &&
    today.getFullYear() === appointmentDate.getFullYear()
  );
}

// For backwards compatibility, export return type with old name
export type UseCachedCalendarReturn = UseSimpleCalendarReturn;
