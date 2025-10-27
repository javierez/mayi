import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "~/components/ui/badge";
import { Clock, Check, X, Calendar, UserX } from "lucide-react";

interface TimelineAppointment {
  appointmentId: bigint;
  type: string | null;
  status: string | null;
  datetimeStart: Date;
  datetimeEnd: Date;
  notes: string | null;
}

interface AppointmentTimelineProps {
  appointments: TimelineAppointment[];
}

export function AppointmentTimeline({ appointments }: AppointmentTimelineProps) {
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Calendar className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">No hay visitas programadas para este contacto</p>
      </div>
    );
  }

  const getStatusConfig = (status: string | null) => {
    switch (status) {
      case "Completed":
        return {
          color: "bg-green-500",
          badgeColor: "bg-green-100 text-green-800",
          icon: <Check className="h-3 w-3" />,
          label: "Completado",
        };
      case "Scheduled":
        return {
          color: "bg-blue-500",
          badgeColor: "bg-blue-100 text-blue-800",
          icon: <Clock className="h-3 w-3" />,
          label: "Programado",
        };
      case "Cancelled":
        return {
          color: "bg-gray-400",
          badgeColor: "bg-gray-100 text-gray-800",
          icon: <X className="h-3 w-3" />,
          label: "Cancelado",
        };
      case "Rescheduled":
        return {
          color: "bg-orange-500",
          badgeColor: "bg-orange-100 text-orange-800",
          icon: <Clock className="h-3 w-3" />,
          label: "Reprogramado",
        };
      case "NoShow":
        return {
          color: "bg-red-500",
          badgeColor: "bg-red-100 text-red-800",
          icon: <UserX className="h-3 w-3" />,
          label: "No asistió",
        };
      default:
        return {
          color: "bg-gray-400",
          badgeColor: "bg-gray-100 text-gray-800",
          icon: <Clock className="h-3 w-3" />,
          label: status,
        };
    }
  };

  return (
    <div className="relative space-y-6 pl-8">
      {/* Vertical connecting line */}
      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-200" />

      {appointments.map((appointment, index) => {
        const statusConfig = getStatusConfig(appointment.status);
        const isLast = index === appointments.length - 1;

        return (
          <div key={appointment.appointmentId.toString()} className="relative">
            {/* Timeline dot */}
            <div className="absolute left-[-28px] top-1">
              <div className={`h-5 w-5 rounded-full ${statusConfig.color} border-4 border-white shadow-sm flex items-center justify-center`}>
                <div className="text-white">
                  {statusConfig.icon}
                </div>
              </div>
            </div>

            {/* Compact card */}
            <div className={`rounded-lg border bg-white p-3 shadow-sm hover:shadow-md transition-all ${isLast ? "" : "mb-6"}`}>
              <div className="space-y-2">
                {/* Date and time */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">
                    {format(appointment.datetimeStart, "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                  <Badge className={`${statusConfig.badgeColor} text-xs`}>
                    {statusConfig.label}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground">
                  {format(appointment.datetimeStart, "HH:mm", { locale: es })} - {format(appointment.datetimeEnd, "HH:mm", { locale: es })}
                </div>

                {/* Appointment type */}
                {appointment.type && (
                  <div className="text-sm font-medium text-gray-700">
                    {appointment.type}
                  </div>
                )}

                {/* Notes preview */}
                {appointment.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {appointment.notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
