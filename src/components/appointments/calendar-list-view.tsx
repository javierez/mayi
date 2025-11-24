"use client";

import { Loader, Info } from "lucide-react";
import { ListCalendarEvent } from "~/components/appointments/calendar-event";
import { ExpandableSection } from "~/components/propiedades/detail/activity/expandable-section";
import type { AppointmentData } from "~/components/appointments/appointment-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

interface CalendarListViewProps {
  appointments: AppointmentData[];
  loading: boolean;
  error: string | null;
  selectedEvent: bigint | null;
  onEventSelect: (eventId: bigint) => void;
  appointmentTasksMap: Record<number, unknown[]>;
}

// Helper to get date string in YYYY-MM-DD
const getDateString = (date: Date) => date.toISOString().split("T")[0];

// Helper to format date for display in separators
const formatDateSeparator = (date: Date) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = getDateString(date) === getDateString(today);
  const isTomorrow = getDateString(date) === getDateString(tomorrow);
  const isYesterday = getDateString(date) === getDateString(yesterday);

  if (isToday) return "Hoy";
  if (isTomorrow) return "Mañana";
  if (isYesterday) return "Ayer";

  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
};

export function CalendarListView({
  appointments,
  loading,
  error,
  selectedEvent,
  onEventSelect,
  appointmentTasksMap,
}: CalendarListViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="h-6 w-6 animate-spin" />
        <span className="ml-2">Cargando citas...</span>
      </div>
    );
  }

  if (error) {
    return <div className="py-8 text-center text-red-600">{error}</div>;
  }

  if (appointments.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No se encontraron citas
      </div>
    );
  }

  const now = new Date();

  // 🔴 Urgent/Action Required Section
  const urgentAppointments = appointments
    .filter((a) => {
      // Include NoShow and Rescheduled
      if (a.status === "NoShow" || a.status === "Rescheduled") return true;
      // Include Scheduled appointments that are in the past
      if (a.status === "Scheduled" && a.datetimeEnd < now) return true;
      return false;
    })
    .sort((a, b) => b.datetimeStart.getTime() - a.datetimeStart.getTime());

  // 🟢 Active/Upcoming Appointments Section
  const activeAppointments = appointments
    .filter((a) => a.status === "Scheduled" && a.datetimeEnd >= now)
    .sort((a, b) => a.datetimeStart.getTime() - b.datetimeStart.getTime());

  // ✓ Completed Appointments Section
  const completedAppointments = appointments
    .filter((a) => a.status === "Completed")
    .sort((a, b) => b.datetimeStart.getTime() - a.datetimeStart.getTime());

  // ✕ Cancelled Appointments Section
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);
  const cancelledAppointments = appointments
    .filter((a) => a.status === "Cancelled" && a.datetimeStart >= fourteenDaysAgo)
    .sort((a, b) => b.datetimeStart.getTime() - a.datetimeStart.getTime());

  const renderAppointmentsList = (
    appointmentsList: AppointmentData[],
    keyPrefix: string,
  ) => {
    return appointmentsList.map((appointment, index) => {
      const currentDate = getDateString(appointment.datetimeStart);
      const previousDate =
        index > 0
          ? getDateString(appointmentsList[index - 1]!.datetimeStart)
          : null;
      const showDateLabel =
        index === 0 || (previousDate && currentDate !== previousDate);

      return (
        <div key={`${keyPrefix}-${appointment.appointmentId.toString()}`}>
          {showDateLabel && (
            <div className="my-2 sm:my-3">
              <div className="mb-1 flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDateSeparator(appointment.datetimeStart)}
                </span>
                <div className="h-px min-w-0 flex-1 bg-gray-100" />
              </div>
            </div>
          )}
          <div className="mb-1.5 sm:mb-2">
            <ListCalendarEvent
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
              tasks={
                appointmentTasksMap[Number(appointment.appointmentId)] ?? []
              }
            />
          </div>
        </div>
      );
    });
  };

  return (
    <div className="mt-4 space-y-2 sm:mt-8 sm:space-y-3">
      {/* 🔴 Urgent/Action Required Section */}
      {urgentAppointments.length > 0 && (
        <div className="mt-4 sm:mt-6">
          <ExpandableSection
            title="Requieren Atención"
            count={urgentAppointments.length}
            defaultExpanded={false}
            storageKey="calendar-urgent-appointments"
            titleClassName="text-rose-700"
          infoButton={
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-rose-100"
                >
                  <Info className="h-4 w-4 text-rose-600" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>¿Qué incluye &quot;Requieren Atención&quot;?</DialogTitle>
                  <DialogDescription>
                    Esta sección agrupa todas las citas que necesitan acción
                    inmediata o seguimiento urgente. Incluye tres tipos de
                    situaciones:
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h5 className="mb-1 text-xs font-medium text-gray-900 sm:text-sm">
                      Citas No Presentadas (NoShow)
                    </h5>
                    <p className="mb-2 text-xs text-gray-600 sm:text-sm">
                      El cliente no asistió a la cita programada sin avisar.
                    </p>
                    <p className="text-xs text-gray-500 sm:text-sm">
                      Acción recomendada: Contactar al cliente para entender el
                      motivo, reprogramar si sigue interesado, o marcar como
                      cancelada.
                    </p>
                  </div>

                  <div>
                    <h5 className="mb-1 text-xs font-medium text-gray-900 sm:text-sm">
                      Citas Reprogramadas (Rescheduled)
                    </h5>
                    <p className="mb-2 text-xs text-gray-600 sm:text-sm">
                      La cita fue reprogramada pero aún no tiene una nueva fecha
                      confirmada.
                    </p>
                    <p className="text-xs text-gray-500 sm:text-sm">
                      Acción recomendada: Coordinar nueva fecha con el cliente y
                      crear una nueva cita programada.
                    </p>
                  </div>

                  <div>
                    <h5 className="mb-1 text-xs font-medium text-gray-900 sm:text-sm">
                      Citas Pasadas Sin Actualizar
                    </h5>
                    <p className="mb-2 text-xs text-gray-600 sm:text-sm">
                      Citas que tenían estado &quot;Programada&quot; pero ya pasó su
                      fecha/hora de finalización.
                    </p>
                    <p className="text-xs text-gray-500 sm:text-sm">
                      Acción recomendada: Actualizar el estado a &quot;Completada&quot; si
                      se realizó, o a &quot;NoShow&quot;/&quot;Cancelada&quot; según corresponda.
                    </p>
                  </div>

                  <div className="border-t pt-3 sm:pt-4">
                    <p className="text-xs text-gray-500 sm:text-sm">
                      Mantener esta sección vacía indica que todas tus citas
                      están correctamente gestionadas y actualizadas.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          }
        >
          <div className="space-y-0">
            {renderAppointmentsList(urgentAppointments, "urgent")}
          </div>
        </ExpandableSection>
        </div>
      )}

      {/* 🟢 Active/Upcoming Appointments Section */}
      {activeAppointments.length > 0 && (
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 sm:text-sm">
              Próximas Citas ({activeAppointments.length})
            </h3>
          </div>
          <div className="space-y-0">
            {renderAppointmentsList(activeAppointments, "active")}
          </div>
        </div>
      )}

      {/* ✓ Completed Appointments Section - Collapsible */}
      {completedAppointments.length > 0 && (
        <ExpandableSection
          title="Completadas"
          count={completedAppointments.length}
          defaultExpanded={false}
          storageKey="calendar-completed-appointments"
        >
          <div className="space-y-0">
            {renderAppointmentsList(completedAppointments, "completed")}
          </div>
        </ExpandableSection>
      )}

      {/* ✕ Cancelled Appointments Section - Collapsible */}
      {cancelledAppointments.length > 0 && (
        <ExpandableSection
          title="Canceladas"
          count={cancelledAppointments.length}
          defaultExpanded={false}
          storageKey="calendar-cancelled-appointments"
        >
          <div className="space-y-0">
            {renderAppointmentsList(cancelledAppointments, "cancelled")}
          </div>
        </ExpandableSection>
      )}
    </div>
  );
}
