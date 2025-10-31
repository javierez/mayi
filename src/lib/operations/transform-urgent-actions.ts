import type { TodayAppointment } from "~/server/queries/operaciones-dashboard";
import type { getMostUrgentTasksWithAuth } from "~/server/queries/task";
import type { UrgentAction } from "~/types/urgent-actions";

type DetailedTask = Awaited<ReturnType<typeof getMostUrgentTasksWithAuth>>[0];

/**
 * Transform UrgentAction[] into DetailedTask[] and TodayAppointment[] arrays
 */
export function transformUrgentActions(
  urgentActions: UrgentAction[],
): {
  detailedTasks: DetailedTask[];
  appointments: TodayAppointment[];
} {
  const detailedTasks: DetailedTask[] = [];
  const appointments: TodayAppointment[] = [];

  for (const action of urgentActions) {
    if (action.type === "task") {
      // Convert task to DetailedTask format
      const taskId =
        typeof action.id === "bigint"
          ? Number(action.id)
          : typeof action.id === "string"
            ? parseInt(action.id, 10)
            : action.id;

      const task: DetailedTask = {
        taskId,
        userId: action.userId ?? "",
        title: action.title,
        description: action.description ?? "",
        dueDate: action.dueDate
          ? new Date(action.dueDate)
          : null,
        dueTime: null,
        completed: action.completed ?? false,
        urgency: action.urgency ?? 0,
        status: (action.status as DetailedTask["status"]) ?? "backlog",
        category: action.category ?? "",
        listingId:
          action.listingId !== undefined
            ? typeof action.listingId === "bigint"
              ? Number(action.listingId)
              : typeof action.listingId === "string"
                ? parseInt(action.listingId, 10)
                : action.listingId ?? 0
            : 0,
        listingContactId: 0,
        dealId: 0,
        appointmentId: 0,
        prospectId: 0,
        contactId:
          action.contactId !== undefined
            ? typeof action.contactId === "bigint"
              ? Number(action.contactId)
              : typeof action.contactId === "string"
                ? parseInt(action.contactId, 10)
                : action.contactId ?? 0
            : 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        userName: action.userName ?? "",
        userFirstName: action.userFirstName ?? "",
        userLastName: action.userLastName ?? "",
        contactFirstName: action.contactFirstName ?? null,
        contactLastName: action.contactLastName ?? null,
        propertyTitle: action.propertyTitle ?? null,
      };

      detailedTasks.push(task);
    } else if (action.type === "appointment") {
      // Convert appointment to TodayAppointment format
      const appointmentId =
        typeof action.id === "bigint"
          ? BigInt(Number(action.id))
          : typeof action.id === "string"
            ? BigInt(parseInt(action.id, 10))
            : BigInt(action.id);

      const appointment: TodayAppointment = {
        appointmentId,
        contactId:
          action.contactId !== undefined
            ? typeof action.contactId === "bigint"
              ? action.contactId
              : typeof action.contactId === "string"
                ? BigInt(parseInt(action.contactId, 10))
                : undefined
            : undefined,
        listingId:
          action.listingId !== undefined
            ? typeof action.listingId === "bigint"
              ? action.listingId
              : typeof action.listingId === "string"
                ? BigInt(parseInt(action.listingId, 10))
                : undefined
            : undefined,
        contactName: action.entityName ?? action.title ?? "Unknown",
        propertyAddress: action.propertyAddress ?? undefined,
        startTime: action.datetimeStart
          ? new Date(action.datetimeStart)
          : new Date(),
        endTime: action.datetimeEnd
          ? new Date(action.datetimeEnd)
          : action.datetimeStart
            ? new Date(new Date(action.datetimeStart).getTime() + 60 * 60 * 1000) // Default 1 hour duration
            : new Date(),
        tripTimeMinutes: undefined,
        status: (action.status as TodayAppointment["status"]) ?? "Scheduled",
        appointmentType: action.title.includes("-")
          ? action.title.split(" - ")[0] ?? "Visita"
          : "Visita",
      };

      appointments.push(appointment);
    }
  }

  return { detailedTasks, appointments };
}
