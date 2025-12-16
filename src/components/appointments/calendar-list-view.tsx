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

// Helper to get date string in DD-MM-YYYY using UTC (for appointment dates stored as UTC)
const getDateString = (date: Date): string => {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
};

// Helper to get local date string for today/tomorrow/yesterday comparison
// These should use local time since they represent the user's current day
const getLocalDateString = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Helper to format date for display in separators
// Compares appointment UTC date with user's local today/tomorrow/yesterday
const formatDateSeparator = (date: Date) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Compare appointment date (UTC) with local dates for "Hoy/Mañana/Ayer" display
  const appointmentDateStr = getDateString(date);
  const isToday = appointmentDateStr === getLocalDateString(today);
  const isTomorrow = appointmentDateStr === getLocalDateString(tomorrow);
  const isYesterday = appointmentDateStr === getLocalDateString(yesterday);

  if (isToday) return "Hoy";
  if (isTomorrow) return "Mañana";
  if (isYesterday) return "Ayer";

  // For display, create a date using UTC components to show correct date
  const displayDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(displayDate);
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
                title: appointment.title ?? undefined,
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
              <DialogContent className="max-w-[95vw] sm:max-w-md">
                <DialogHeader className="space-y-3">
                  <DialogTitle className="text-lg font-semibold">
                    Citas que requieren atención
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Agrupa citas con acción pendiente o seguimiento urgente.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-2 space-y-4">
                  {/* Item 1 */}
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                      <span className="text-xs font-medium">1</span>
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-sm font-medium text-foreground">
                        No presentadas
                      </h5>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Cliente no asistió sin avisar. Contactar para reprogramar o cancelar.
                      </p>
                    </div>
                  </div>

                  <div className="ml-3 border-l-2 border-muted" />

                  {/* Item 2 */}
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                      <span className="text-xs font-medium">2</span>
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-sm font-medium text-foreground">
                        Reprogramadas
                      </h5>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Cita pospuesta sin nueva fecha. Coordinar y confirmar nueva fecha.
                      </p>
                    </div>
                  </div>

                  <div className="ml-3 border-l-2 border-muted" />

                  {/* Item 3 */}
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <span className="text-xs font-medium">3</span>
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-sm font-medium text-foreground">
                        Pendientes de actualizar
                      </h5>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Citas pasadas aún marcadas como programadas. Actualizar estado.
                      </p>
                    </div>
                  </div>

                  {/* Footer note */}
                  <div className="mt-4 rounded-md bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Sección vacía = citas al día
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
