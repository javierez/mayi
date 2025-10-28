"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getUserAppointmentsAction,
  getAppointmentsByDateRangeAction,
} from "~/server/actions/appointments";

// Calendar Event Display Type from PRP
interface CalendarEvent {
  appointmentId: bigint;
  contactName: string;
  propertyAddress?: string;
  startTime: Date;
  endTime: Date;
  status: "Scheduled" | "Completed" | "Cancelled" | "Rescheduled" | "NoShow";
  type: string;
  tripTimeMinutes?: number;
  notes?: string;
  // Additional fields needed for editing
  contactId: bigint;
  listingId?: bigint | null;
  listingContactId?: bigint | null;
  dealId?: bigint | null;
  prospectId?: bigint | null;
  // Agent information
  agentName?: string | null;
  // Optimistic update flag
  isOptimistic?: boolean;
}

// Raw appointment data from database with joined contact and property data
interface RawAppointment {
  appointmentId: bigint;
  userId: string;
  contactId: bigint;
  listingId: bigint | null;
  listingContactId: bigint | null;
  dealId: bigint | null;
  prospectId: bigint | null;
  datetimeStart: Date;
  datetimeEnd: Date;
  tripTimeMinutes: number | null;
  status: string;
  notes: string | null;
  type: string | null;
  isActive: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined contact data
  contactFirstName: string | null;
  contactLastName: string | null;
  // Joined property data
  propertyStreet: string | null;
  // Joined agent/user data
  agentName: string | null;
  agentFirstName: string | null;
  agentLastName: string | null;
}

// Hook return type
interface UseAppointmentsReturn {
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

// Generate temporary ID for optimistic events
function generateTempId(): bigint {
  // Use negative timestamp to avoid conflicts with real IDs
  return BigInt(-Date.now());
}

// Transform partial event data to full calendar event for optimistic updates
function transformToOptimisticEvent(
  eventData: Partial<CalendarEvent>,
  tempId: bigint,
): CalendarEvent {
  const now = new Date();

  return {
    appointmentId: tempId,
    contactName: eventData.contactName ?? "New Contact",
    propertyAddress: eventData.propertyAddress,
    startTime: eventData.startTime ?? now,
    endTime: eventData.endTime ?? new Date(now.getTime() + 60 * 60 * 1000), // Default 1 hour
    status: eventData.status ?? "Scheduled",
    type: eventData.type ?? "Visita",
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

// Merge and sort server events with optimistic events
function mergeAndSortEvents(
  serverEvents: CalendarEvent[],
  optimisticEvents: CalendarEvent[],
): CalendarEvent[] {
  const allEvents = [...serverEvents, ...optimisticEvents];

  // Sort by start time
  return allEvents.sort((a, b) => {
    return a.startTime.getTime() - b.startTime.getTime();
  });
}

// Transform raw appointment to calendar event
function transformToCalendarEvent(
  rawAppointment: RawAppointment,
): CalendarEvent {
  // Build contact name from firstName and lastName if available
  const contactName =
    rawAppointment.contactFirstName && rawAppointment.contactLastName
      ? `${rawAppointment.contactFirstName} ${rawAppointment.contactLastName}`
      : `Contact ${rawAppointment.contactId}`;

  return {
    appointmentId: rawAppointment.appointmentId,
    contactName,
    propertyAddress: rawAppointment.propertyStreet ?? undefined,
    startTime: rawAppointment.datetimeStart,
    endTime: rawAppointment.datetimeEnd,
    status:
      (rawAppointment.status as
        | "Scheduled"
        | "Completed"
        | "Cancelled"
        | "Rescheduled"
        | "NoShow") ?? "Scheduled",
    type: rawAppointment.type ?? "Visita", // Use actual type from database
    tripTimeMinutes: rawAppointment.tripTimeMinutes ?? undefined,
    notes: rawAppointment.notes ?? undefined,
    // Additional fields needed for editing
    contactId: rawAppointment.contactId,
    listingId: rawAppointment.listingId,
    listingContactId: rawAppointment.listingContactId,
    dealId: rawAppointment.dealId,
    prospectId: rawAppointment.prospectId,
    // Agent information
    agentName: rawAppointment.agentName,
    isOptimistic: false,
  };
}

// Main hook for appointments data
export function useAppointments(): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user appointments
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getUserAppointmentsAction();

      if (result.success) {
        const calendarEvents = result.appointments.map(
          transformToCalendarEvent,
        );
        setAppointments(calendarEvents);
      } else {
        setError(result.error ?? "Error desconocido");
        setAppointments([]);
      }
    } catch (err) {
      setError("Error al cargar las citas");
      setAppointments([]);
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch appointments by date range
  const fetchByDateRange = useCallback(
    async (startDate: Date, endDate: Date) => {
      setLoading(true);
      setError(null);

      try {
        const result = await getAppointmentsByDateRangeAction(
          startDate,
          endDate,
        );

        if (result.success) {
          const calendarEvents = result.appointments.map(
            transformToCalendarEvent,
          );
          setAppointments(calendarEvents);
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
    [],
  );

  // Initial fetch on mount
  useEffect(() => {
    void fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    refetch: fetchAppointments,
    fetchByDateRange,
    addOptimisticEvent: () => BigInt(0), // Placeholder implementation
    removeOptimisticEvent: () => {
      /* placeholder */
    }, // Placeholder implementation
    updateOptimisticEvent: () => {
      /* placeholder */
    }, // Placeholder implementation
  };
}

// Hook for weekly appointments (specific date range)
export function useWeeklyAppointments(weekStart: Date): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<CalendarEvent[]>([]);
  const [optimisticEvents, setOptimisticEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeeklyAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Calculate week end (7 days after week start)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      weekEnd.setHours(23, 59, 59, 999);

      const result = await getAppointmentsByDateRangeAction(weekStart, weekEnd);

      if (result.success) {
        const calendarEvents = result.appointments.map(
          transformToCalendarEvent,
        );
        setAppointments(calendarEvents);
      } else {
        setError(result.error ?? "Error desconocido");
        setAppointments([]);
      }
    } catch (err) {
      setError("Error al cargar las citas de la semana");
      setAppointments([]);
      console.error("Error fetching weekly appointments:", err);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  // Add optimistic event
  const addOptimisticEvent = useCallback(
    (eventData: Partial<CalendarEvent>): bigint => {
      const tempId = generateTempId();
      const optimisticEvent = transformToOptimisticEvent(eventData, tempId);

      setOptimisticEvents((prev) => [...prev, optimisticEvent]);

      // Auto-cleanup optimistic events after 30 seconds if still optimistic (not converted to real)
      setTimeout(() => {
        setOptimisticEvents((prev) =>
          prev.filter(
            (event) => event.appointmentId !== tempId || !event.isOptimistic,
          ),
        );
      }, 30000);

      return tempId;
    },
    [],
  );

  // Remove optimistic event
  const removeOptimisticEvent = useCallback((tempId: bigint) => {
    setOptimisticEvents((prev) =>
      prev.filter((event) => event.appointmentId !== tempId),
    );
  }, []);

  // Update optimistic event
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

  // Merge server events with optimistic events for display
  const mergedAppointments = mergeAndSortEvents(appointments, optimisticEvents);

  // Refetch when week changes and clear optimistic events
  useEffect(() => {
    void fetchWeeklyAppointments();
    // Clear optimistic events when changing weeks
    setOptimisticEvents([]);
  }, [fetchWeeklyAppointments]);

  return {
    appointments: mergedAppointments,
    loading,
    error,
    refetch: fetchWeeklyAppointments,
    addOptimisticEvent,
    removeOptimisticEvent,
    updateOptimisticEvent,
    fetchByDateRange: async (startDate: Date, endDate: Date) => {
      setLoading(true);
      setError(null);

      try {
        const result = await getAppointmentsByDateRangeAction(
          startDate,
          endDate,
        );

        if (result.success) {
          const calendarEvents = result.appointments.map(
            transformToCalendarEvent,
          );
          setAppointments(calendarEvents);
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
  };
}

// Hook for today's appointments
export function useTodayAppointments(): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodayAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const result = await getAppointmentsByDateRangeAction(today, tomorrow);

      if (result.success) {
        const calendarEvents = result.appointments.map(
          transformToCalendarEvent,
        );
        setAppointments(calendarEvents);
      } else {
        setError(result.error ?? "Error desconocido");
        setAppointments([]);
      }
    } catch (err) {
      setError("Error al cargar las citas de hoy");
      setAppointments([]);
      console.error("Error fetching today's appointments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    void fetchTodayAppointments();
  }, [fetchTodayAppointments]);

  return {
    appointments,
    loading,
    error,
    refetch: fetchTodayAppointments,
    fetchByDateRange: async (startDate: Date, endDate: Date) => {
      setLoading(true);
      setError(null);

      try {
        const result = await getAppointmentsByDateRangeAction(
          startDate,
          endDate,
        );

        if (result.success) {
          const calendarEvents = result.appointments.map(
            transformToCalendarEvent,
          );
          setAppointments(calendarEvents);
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
    addOptimisticEvent: () => BigInt(0), // Placeholder implementation
    removeOptimisticEvent: () => {
      /* placeholder */
    }, // Placeholder implementation
    updateOptimisticEvent: () => {
      /* placeholder */
    }, // Placeholder implementation
  };
}

// Utility function to filter appointments by date
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

// Utility function to group appointments by date
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

// Utility function to format appointment for display
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

// Utility function to check if appointment is today
export function isAppointmentToday(appointment: CalendarEvent): boolean {
  const today = new Date();
  const appointmentDate = new Date(appointment.startTime);

  return (
    today.getDate() === appointmentDate.getDate() &&
    today.getMonth() === appointmentDate.getMonth() &&
    today.getFullYear() === appointmentDate.getFullYear()
  );
}
