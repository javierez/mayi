"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

interface UrgentAction {
  type: "task" | "appointment";
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  datetimeStart?: string;
  status: string;
  entityName?: string;
  daysUntilDue?: number;
  isOverdue?: boolean;
}

interface AgentUrgentActionsProps {
  actions: UrgentAction[];
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getUrgencyText(action: UrgentAction) {
  if (action.type === "task") {
    if (action.isOverdue) {
      return "Vencida";
    }
    if ((action.daysUntilDue ?? 0) <= 1) {
      return "Hoy/Mañana";
    }
    return `${action.daysUntilDue} días`;
  } else {
    const daysUntil = action.datetimeStart
      ? Math.ceil(
          (new Date(action.datetimeStart).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    if (daysUntil === 0) return "Hoy";
    if (daysUntil === 1) return "Mañana";
    return `En ${daysUntil} días`;
  }
}

export function AgentUrgentActions({ actions }: AgentUrgentActionsProps) {
  if (actions.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Acciones Urgentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm font-medium text-gray-900">¡Todo al día!</p>
            <p className="text-xs text-muted-foreground">
              No hay tareas urgentes ni citas próximas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Separate tasks and appointments
  const tasks = actions.filter((a) => a.type === "task");
  const appointments = actions.filter((a) => a.type === "appointment");

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Acciones Urgentes
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {actions.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overdue and urgent tasks */}
        {tasks.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-medium text-muted-foreground">
              Tareas Urgentes
            </h3>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-2">
              {tasks.map((task) => (
                <Card key={task.id} className="border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/calendario`}
                            className="text-sm font-medium hover:underline"
                          >
                            {task.title}
                          </Link>
                          <Badge variant="outline" className="text-xs">
                            {getUrgencyText(task)}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {task.description}
                          </p>
                        )}
                        {task.entityName && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {task.entityName}
                          </p>
                        )}
                        {task.dueDate && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Vence: {formatDate(task.dueDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming appointments */}
        {appointments.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-medium text-muted-foreground">
              Citas Próximas
            </h3>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-2">
              {appointments.map((appt) => (
                <Card key={appt.id} className="border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/calendario`}
                            className="text-sm font-medium hover:underline"
                          >
                            {appt.title}
                          </Link>
                          <Badge variant="outline" className="text-xs">
                            {getUrgencyText(appt)}
                          </Badge>
                        </div>
                        {appt.entityName && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Con: {appt.entityName}
                          </p>
                        )}
                        {appt.datetimeStart && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDateTime(appt.datetimeStart)}
                          </p>
                        )}
                        <Badge variant="outline" className="mt-2 text-xs">
                          {appt.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
