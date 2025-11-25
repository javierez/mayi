"use client";

import { Loader } from "lucide-react";
import { CompactCalendarEvent } from "~/components/appointments/calendar-event";
import type { AppointmentData } from "~/components/appointments/appointment-card";

interface CalendarCompactViewProps {
  appointments: AppointmentData[];
  loading: boolean;
  error: string | null;
  selectedEvent: bigint | null;
  onEventSelect: (eventId: bigint) => void;
}

export function CalendarCompactView({
  appointments,
  loading,
  error,
  selectedEvent,
  onEventSelect,
}: CalendarCompactViewProps) {
  if (loading) {
    return (
      <div className="col-span-full flex min-h-[120px] w-full items-center justify-center px-2 py-6 sm:px-4 sm:py-8">
        <Loader className="h-5 w-5 flex-shrink-0 animate-spin sm:h-6 sm:w-6" />
        <span className="ml-2 text-sm sm:text-base">Cargando citas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-full w-full break-words px-2 py-6 text-center text-sm text-red-600 sm:px-4 sm:py-8 sm:text-base">
        {error}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="col-span-full w-full px-2 py-6 text-center text-sm text-muted-foreground sm:px-4 sm:py-8 sm:text-base">
        No se encontraron citas
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-1 gap-1.5 sm:gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      {appointments.map((appointment) => (
        <CompactCalendarEvent
          key={appointment.appointmentId.toString()}
          event={{
            appointmentId: appointment.appointmentId,
            type: appointment.type,
            status: appointment.status,
            startTime: appointment.datetimeStart,
            endTime: appointment.datetimeEnd,
            contactName: appointment.contactName,
            propertyAddress: appointment.propertyAddress ?? undefined,
            notes: appointment.notes ?? undefined,
            tripTimeMinutes: appointment.tripTimeMinutes ?? undefined,
            isOptimistic: false,
          }}
          isSelected={selectedEvent === appointment.appointmentId}
          onClick={() => onEventSelect(appointment.appointmentId)}
        />
      ))}
    </div>
  );
}
