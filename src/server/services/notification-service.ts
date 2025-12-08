/**
 * Notification Service
 *
 * Helper functions for creating notifications for tasks and appointments.
 * These functions handle the business logic of building notification content
 * and calling the notification query functions.
 */

import { createNotificationInternal } from "~/server/queries/notification";
import type {
  NotificationType,
  NotificationPriority,
  EntityType,
  TaskReminderTimeframe,
  AppointmentReminderTimeframe,
  TaskNotificationMetadata,
  AppointmentNotificationMetadata,
} from "~/types/notifications";
import type { Task } from "~/lib/data";
import type { Appointment } from "~/lib/data";

/**
 * Build action URL for navigation based on entity type and ID
 */
function buildActionUrl(
  entityType: EntityType | null,
  entityId: bigint | null,
): string | null {
  if (!entityType || !entityId) {
    return null;
  }

  switch (entityType) {
    case "task":
      return `/tareas?taskId=${entityId.toString()}`;
    case "appointment":
      return `/calendario?appointmentId=${entityId.toString()}`;
    case "listing":
      return `/propiedades/${entityId.toString()}`;
    case "contact":
      return `/contactos/${entityId.toString()}`;
    case "deal":
      return `/operaciones/deals?dealId=${entityId.toString()}`;
    case "prospect":
      return `/operaciones/prospects?prospectId=${entityId.toString()}`;
    default:
      return null;
  }
}

/**
 * Determine priority based on notification type
 */
function determinePriority(type: NotificationType): NotificationPriority {
  switch (type) {
    case "task_overdue":
    case "appointment_reminder":
      return "high";
    case "task_due_soon":
    case "task_deleted":
      return "normal";
    case "task_assigned":
    case "task_updated":
    case "task_reassigned":
    case "task_completed":
    case "appointment_scheduled":
    case "appointment_rescheduled":
      return "normal";
    case "appointment_cancelled":
    case "appointment_completed":
      return "low";
    default:
      return "normal";
  }
}

/**
 * Build notification title based on type and entity
 */
function buildTitle(
  type: NotificationType,
  entityTitle: string,
  context?: Record<string, unknown>,
): string {
  switch (type) {
    case "task_assigned":
      return `Nueva tarea asignada: ${entityTitle}`;
    case "task_updated":
      return `Tarea actualizada: ${entityTitle}`;
    case "task_reassigned":
      return `Tarea reasignada: ${entityTitle}`;
    case "task_completed":
      return `Tarea completada: ${entityTitle}`;
    case "task_deleted":
      return `Tarea eliminada: ${entityTitle}`;
    case "task_due_soon":
      const dueTimeframe = context?.timeframe as TaskReminderTimeframe;
      if (dueTimeframe === "same_day") {
        return `Tarea vence hoy: ${entityTitle}`;
      }
      return `Tarea vence mañana: ${entityTitle}`;
    case "task_overdue":
      return `Tarea vencida: ${entityTitle}`;
    case "appointment_scheduled":
      return `Nueva cita: ${entityTitle}`;
    case "appointment_rescheduled":
      return `Cita reagendada: ${entityTitle}`;
    case "appointment_cancelled":
      return `Cita cancelada: ${entityTitle}`;
    case "appointment_completed":
      return `Cita completada: ${entityTitle}`;
    case "appointment_reminder":
      const reminderType = context?.reminderType as
        | AppointmentReminderTimeframe
        | undefined;
      if (reminderType === "30_min") {
        return `Recordatorio: ${entityTitle} en 30 minutos`;
      }
      if (reminderType === "1_day") {
        return `Recordatorio: ${entityTitle} mañana`;
      }
      return `Recordatorio: ${entityTitle}`;
    default:
      return entityTitle;
  }
}

/**
 * Build notification message based on type and context
 */
function buildMessage(
  type: NotificationType,
  context: Record<string, unknown>,
): string {
  switch (type) {
    case "task_assigned":
      const assignerName = context.assignerName as string | undefined;
      if (assignerName) {
        return `${assignerName} te ha asignado una nueva tarea.`;
      }
      return "Se te ha asignado una nueva tarea.";
    case "task_updated":
      const updaterName = context.updaterName as string | undefined;
      const updatedFields = context.updatedFields as string[] | undefined;
      if (updaterName && updatedFields && updatedFields.length > 0) {
        return `${updaterName} ha actualizado la tarea: ${updatedFields.join(", ")}.`;
      }
      if (updaterName) {
        return `${updaterName} ha actualizado la tarea.`;
      }
      return "La tarea ha sido actualizada.";
    case "task_reassigned":
      const reassignerName = context.reassignerName as string | undefined;
      if (reassignerName) {
        return `${reassignerName} te ha reasignado esta tarea.`;
      }
      return "Se te ha reasignado esta tarea.";
    case "task_completed":
      const completedByName = context.completedByName as string | undefined;
      if (completedByName) {
        return `${completedByName} ha completado la tarea.`;
      }
      return "La tarea ha sido completada.";
    case "task_deleted":
      const deleterName = context.deleterName as string | undefined;
      if (deleterName) {
        return `${deleterName} ha eliminado una tarea que te fue asignada.`;
      }
      return "Una tarea que te fue asignada ha sido eliminada.";
    case "task_due_soon":
      const dueTimeframe = context.timeframe as TaskReminderTimeframe;
      if (dueTimeframe === "same_day") {
        return "Esta tarea vence hoy. ¡No olvides completarla!";
      }
      return "Esta tarea vence mañana. Prepárate para completarla.";
    case "task_overdue":
      return "Esta tarea está vencida. Por favor, complétala lo antes posible.";
    case "appointment_scheduled":
      const schedulerName = context.schedulerName as string | undefined;
      if (schedulerName) {
        return `${schedulerName} ha programado una nueva cita.`;
      }
      return "Se ha programado una nueva cita.";
    case "appointment_rescheduled":
      const reschedulerName = context.reschedulerName as string | undefined;
      if (reschedulerName) {
        return `${reschedulerName} ha reagendado la cita.`;
      }
      return "La cita ha sido reagendada.";
    case "appointment_cancelled":
      const cancellerName = context.cancellerName as string | undefined;
      if (cancellerName) {
        return `${cancellerName} ha cancelado la cita.`;
      }
      return "La cita ha sido cancelada.";
    case "appointment_completed":
      const completerName = context.completerName as string | undefined;
      if (completerName) {
        return `${completerName} ha marcado la cita como completada.`;
      }
      return "La cita ha sido completada.";
    case "appointment_reminder":
      const reminderType = context.reminderType as
        | AppointmentReminderTimeframe
        | undefined;
      if (reminderType === "30_min") {
        return "Tu cita comienza en 30 minutos. ¡Prepárate!";
      }
      if (reminderType === "1_day") {
        return "Tienes una cita mañana. Revisa los detalles.";
      }
      return "Recordatorio de cita próxima.";
    default:
      return "Tienes una nueva notificación.";
  }
}

// ===== TASK NOTIFICATIONS =====

/**
 * Create notification when a task is assigned to a user
 */
export async function notifyTaskAssigned(
  task: Task,
  assigneeId: string,
  assignerId: string | null,
  accountId: bigint,
): Promise<void> {
  try {
    const metadata: TaskNotificationMetadata = {
      taskTitle: task.title,
      dueDate: task.dueDate?.toISOString(),
      dueTime: task.dueTime ?? undefined,
      urgency: task.urgency ?? undefined,
      category: task.category ?? undefined,
      listingId: task.listingId?.toString(),
      contactId: task.contactId?.toString(),
    };

    await createNotificationInternal({
      accountId,
      userId: assigneeId,
      fromUserId: assignerId,
      type: "task_assigned",
      title: buildTitle("task_assigned", task.title),
      message: buildMessage("task_assigned", {
        assignerName: assignerId ? undefined : "Sistema",
      }),
      actionUrl: buildActionUrl("task", task.taskId),
      priority: determinePriority("task_assigned"),
      category: "tasks",
      entityType: "task",
      entityId: task.taskId,
      metadata,
    });
  } catch (error) {
    console.error("Error creating task assigned notification:", error);
    throw error;
  }
}

/**
 * Create notification when a task is updated
 * Only notifies the assigned user if they are different from the editor
 */
export async function notifyTaskUpdated(
  task: Task,
  assigneeId: string,
  editorId: string | null,
  accountId: bigint,
  updatedFields: string[],
): Promise<void> {
  try {
    // Don't notify if the editor is the same as the assignee
    if (editorId === assigneeId) {
      return;
    }

    const metadata: TaskNotificationMetadata = {
      taskTitle: task.title,
      dueDate: task.dueDate?.toISOString(),
      dueTime: task.dueTime ?? undefined,
      urgency: task.urgency ?? undefined,
      category: task.category ?? undefined,
      listingId: task.listingId?.toString(),
      contactId: task.contactId?.toString(),
      updatedFields,
    };

    await createNotificationInternal({
      accountId,
      userId: assigneeId,
      fromUserId: editorId,
      type: "task_updated",
      title: buildTitle("task_updated", task.title),
      message: buildMessage("task_updated", {
        updaterName: editorId ? undefined : "Sistema",
        updatedFields,
      }),
      actionUrl: buildActionUrl("task", task.taskId),
      priority: determinePriority("task_updated"),
      category: "tasks",
      entityType: "task",
      entityId: task.taskId,
      metadata,
    });
  } catch (error) {
    console.error("Error creating task updated notification:", error);
    throw error;
  }
}

/**
 * Create notification when a task is reassigned to a different user
 */
export async function notifyTaskReassigned(
  task: Task,
  newAssigneeId: string,
  previousAssigneeId: string | null,
  reassignerId: string | null,
  accountId: bigint,
): Promise<void> {
  try {
    // Don't notify if reassigning to the same person who made the change
    if (reassignerId === newAssigneeId) {
      return;
    }

    const metadata: TaskNotificationMetadata = {
      taskTitle: task.title,
      dueDate: task.dueDate?.toISOString(),
      dueTime: task.dueTime ?? undefined,
      urgency: task.urgency ?? undefined,
      category: task.category ?? undefined,
      listingId: task.listingId?.toString(),
      contactId: task.contactId?.toString(),
      previousAssigneeId: previousAssigneeId ?? undefined,
    };

    await createNotificationInternal({
      accountId,
      userId: newAssigneeId,
      fromUserId: reassignerId,
      type: "task_reassigned",
      title: buildTitle("task_reassigned", task.title),
      message: buildMessage("task_reassigned", {
        reassignerName: reassignerId ? undefined : "Sistema",
      }),
      actionUrl: buildActionUrl("task", task.taskId),
      priority: determinePriority("task_reassigned"),
      category: "tasks",
      entityType: "task",
      entityId: task.taskId,
      metadata,
    });
  } catch (error) {
    console.error("Error creating task reassigned notification:", error);
    throw error;
  }
}

/**
 * Create notification when a task is deleted
 * Notifies the assigned user if they are different from the deleter
 */
export async function notifyTaskDeleted(
  task: Task,
  assigneeId: string,
  deleterId: string | null,
  accountId: bigint,
): Promise<void> {
  try {
    // Don't notify if the deleter is the same as the assignee
    if (deleterId === assigneeId) {
      return;
    }

    const metadata: TaskNotificationMetadata = {
      taskTitle: task.title,
      dueDate: task.dueDate?.toISOString(),
      dueTime: task.dueTime ?? undefined,
      urgency: task.urgency ?? undefined,
      category: task.category ?? undefined,
      listingId: task.listingId?.toString(),
      contactId: task.contactId?.toString(),
      deletedByName: deleterId ?? undefined,
    };

    await createNotificationInternal({
      accountId,
      userId: assigneeId,
      fromUserId: deleterId,
      type: "task_deleted",
      title: buildTitle("task_deleted", task.title),
      message: buildMessage("task_deleted", {
        deleterName: deleterId ? undefined : "Sistema",
      }),
      actionUrl: null, // No action URL since the task is deleted
      priority: determinePriority("task_deleted"),
      category: "tasks",
      entityType: "task",
      entityId: task.taskId,
      metadata,
    });
  } catch (error) {
    console.error("Error creating task deleted notification:", error);
    throw error;
  }
}

/**
 * Create notification when a task is completed
 */
export async function notifyTaskCompleted(
  task: Task,
  completedById: string | null,
  accountId: bigint,
): Promise<void> {
  try {
    const metadata: TaskNotificationMetadata = {
      taskTitle: task.title,
      dueDate: task.dueDate?.toISOString(),
      dueTime: task.dueTime ?? undefined,
      urgency: task.urgency ?? undefined,
      category: task.category ?? undefined,
      listingId: task.listingId?.toString(),
      contactId: task.contactId?.toString(),
    };

    const notificationData = {
      accountId,
      fromUserId: completedById,
      type: "task_completed" as const,
      title: buildTitle("task_completed", task.title),
      message: buildMessage("task_completed", {
        completedByName: completedById ? undefined : "Sistema",
      }),
      actionUrl: buildActionUrl("task", task.taskId),
      priority: determinePriority("task_completed"),
      category: "tasks" as const,
      entityType: "task" as const,
      entityId: task.taskId,
      metadata,
    };

    // Notify assigned user (if different from creator)
    if (task.userId) {
      await createNotificationInternal({
        ...notificationData,
        userId: task.userId,
      });
    }

    // Notify creator (if different from assigned user and exists)
    if (task.createdBy && task.createdBy !== task.userId) {
      await createNotificationInternal({
        ...notificationData,
        userId: task.createdBy,
      });
    }
  } catch (error) {
    console.error("Error creating task completed notification:", error);
    throw error;
  }
}

/**
 * Create notification when a task is due soon
 */
export async function notifyTaskDueSoon(
  task: Task,
  accountId: bigint,
  timeframe: TaskReminderTimeframe,
): Promise<void> {
  try {
    if (!task.userId) {
      return;
    }

    const metadata: TaskNotificationMetadata = {
      taskTitle: task.title,
      dueDate: task.dueDate?.toISOString(),
      dueTime: task.dueTime ?? undefined,
      urgency: task.urgency ?? undefined,
      category: task.category ?? undefined,
      listingId: task.listingId?.toString(),
      contactId: task.contactId?.toString(),
    };

    await createNotificationInternal({
      accountId,
      userId: task.userId,
      fromUserId: null, // System notification
      type: "task_due_soon",
      title: buildTitle("task_due_soon", task.title, { timeframe }),
      message: buildMessage("task_due_soon", { timeframe }),
      actionUrl: buildActionUrl("task", task.taskId),
      priority: determinePriority("task_due_soon"),
      category: "tasks",
      entityType: "task",
      entityId: task.taskId,
      metadata: {
        ...metadata,
        reminderType: timeframe,
      },
    });
  } catch (error) {
    console.error("Error creating task due soon notification:", error);
    throw error;
  }
}

/**
 * Create notification when a task is overdue
 */
export async function notifyTaskOverdue(
  task: Task,
  accountId: bigint,
): Promise<void> {
  try {
    if (!task.userId) {
      return;
    }

    const metadata: TaskNotificationMetadata = {
      taskTitle: task.title,
      dueDate: task.dueDate?.toISOString(),
      dueTime: task.dueTime ?? undefined,
      urgency: task.urgency ?? undefined,
      category: task.category ?? undefined,
      listingId: task.listingId?.toString(),
      contactId: task.contactId?.toString(),
    };

    await createNotificationInternal({
      accountId,
      userId: task.userId,
      fromUserId: null, // System notification
      type: "task_overdue",
      title: buildTitle("task_overdue", task.title),
      message: buildMessage("task_overdue", {}),
      actionUrl: buildActionUrl("task", task.taskId),
      priority: determinePriority("task_overdue"),
      category: "tasks",
      entityType: "task",
      entityId: task.taskId,
      metadata,
    });
  } catch (error) {
    console.error("Error creating task overdue notification:", error);
    throw error;
  }
}

// ===== APPOINTMENT NOTIFICATIONS =====

/**
 * Create notification when an appointment is scheduled
 */
export async function notifyAppointmentScheduled(
  appointment: Appointment,
  createdById: string,
  accountId: bigint,
): Promise<void> {
  try {
    // Notify the assigned user, or the creator if no one is assigned
    const targetUserId = appointment.assignedTo ?? appointment.userId;

    const metadata: AppointmentNotificationMetadata = {
      appointmentTitle: appointment.title,
      datetimeStart: appointment.datetimeStart.toISOString(),
      datetimeEnd: appointment.datetimeEnd.toISOString(),
    };

    await createNotificationInternal({
      accountId,
      userId: targetUserId,
      fromUserId: createdById,
      type: "appointment_scheduled",
      title: buildTitle("appointment_scheduled", appointment.title),
      message: buildMessage("appointment_scheduled", {
        schedulerName: createdById ? undefined : "Sistema",
      }),
      actionUrl: buildActionUrl("appointment", appointment.appointmentId),
      priority: determinePriority("appointment_scheduled"),
      category: "appointments",
      entityType: "appointment",
      entityId: appointment.appointmentId,
      metadata,
    });
  } catch (error) {
    console.error("Error creating appointment scheduled notification:", error);
    throw error;
  }
}

/**
 * Create notification when an appointment is rescheduled
 */
export async function notifyAppointmentRescheduled(
  appointment: Appointment,
  previousDateTime: Date,
  userId: string,
  accountId: bigint,
): Promise<void> {
  try {
    const targetUserId = appointment.assignedTo ?? appointment.userId;

    const metadata: AppointmentNotificationMetadata = {
      appointmentTitle: appointment.title,
      datetimeStart: appointment.datetimeStart.toISOString(),
      datetimeEnd: appointment.datetimeEnd.toISOString(),
      previousDatetime: previousDateTime.toISOString(),
    };

    await createNotificationInternal({
      accountId,
      userId: targetUserId,
      fromUserId: userId,
      type: "appointment_rescheduled",
      title: buildTitle("appointment_rescheduled", appointment.title),
      message: buildMessage("appointment_rescheduled", {
        reschedulerName: userId ? undefined : "Sistema",
      }),
      actionUrl: buildActionUrl("appointment", appointment.appointmentId),
      priority: determinePriority("appointment_rescheduled"),
      category: "appointments",
      entityType: "appointment",
      entityId: appointment.appointmentId,
      metadata,
    });
  } catch (error) {
    console.error("Error creating appointment rescheduled notification:", error);
    throw error;
  }
}

/**
 * Create notification when an appointment is cancelled
 */
export async function notifyAppointmentCancelled(
  appointment: Appointment,
  cancelledById: string,
  accountId: bigint,
): Promise<void> {
  try {
    const targetUserId = appointment.assignedTo ?? appointment.userId;

    const metadata: AppointmentNotificationMetadata = {
      appointmentTitle: appointment.title,
      datetimeStart: appointment.datetimeStart.toISOString(),
      datetimeEnd: appointment.datetimeEnd.toISOString(),
    };

    await createNotificationInternal({
      accountId,
      userId: targetUserId,
      fromUserId: cancelledById,
      type: "appointment_cancelled",
      title: buildTitle("appointment_cancelled", appointment.title),
      message: buildMessage("appointment_cancelled", {
        cancellerName: cancelledById ? undefined : "Sistema",
      }),
      actionUrl: buildActionUrl("appointment", appointment.appointmentId),
      priority: determinePriority("appointment_cancelled"),
      category: "appointments",
      entityType: "appointment",
      entityId: appointment.appointmentId,
      metadata,
    });
  } catch (error) {
    console.error("Error creating appointment cancelled notification:", error);
    throw error;
  }
}

/**
 * Create notification when an appointment is completed
 */
export async function notifyAppointmentCompleted(
  appointment: Appointment,
  completedById: string,
  accountId: bigint,
): Promise<void> {
  try {
    const assignedUserId = appointment.assignedTo ?? appointment.userId;
    const creatorUserId = appointment.userId;

    const metadata: AppointmentNotificationMetadata = {
      appointmentTitle: appointment.title,
      datetimeStart: appointment.datetimeStart.toISOString(),
      datetimeEnd: appointment.datetimeEnd.toISOString(),
    };

    const notificationData = {
      accountId,
      fromUserId: completedById,
      type: "appointment_completed" as const,
      title: buildTitle("appointment_completed", appointment.title),
      message: buildMessage("appointment_completed", {
        completerName: completedById ? undefined : "Sistema",
      }),
      actionUrl: buildActionUrl("appointment", appointment.appointmentId),
      priority: determinePriority("appointment_completed"),
      category: "appointments" as const,
      entityType: "appointment" as const,
      entityId: appointment.appointmentId,
      metadata,
    };

    // Notify assigned user
    await createNotificationInternal({
      ...notificationData,
      userId: assignedUserId,
    });

    // Notify creator (if different from assigned user)
    if (creatorUserId !== assignedUserId) {
      await createNotificationInternal({
        ...notificationData,
        userId: creatorUserId,
      });
    }
  } catch (error) {
    console.error("Error creating appointment completed notification:", error);
    throw error;
  }
}

/**
 * Create reminder notification for an upcoming appointment
 */
export async function notifyAppointmentReminder(
  appointment: Appointment,
  accountId: bigint,
  timeframe: AppointmentReminderTimeframe,
): Promise<void> {
  try {
    const targetUserId = appointment.assignedTo ?? appointment.userId;

    const metadata: AppointmentNotificationMetadata = {
      appointmentTitle: appointment.title,
      datetimeStart: appointment.datetimeStart.toISOString(),
      datetimeEnd: appointment.datetimeEnd.toISOString(),
      reminderType: timeframe,
    };

    await createNotificationInternal({
      accountId,
      userId: targetUserId,
      fromUserId: null, // System notification
      type: "appointment_reminder",
      title: buildTitle("appointment_reminder", appointment.title, {
        reminderType: timeframe,
      }),
      message: buildMessage("appointment_reminder", {
        reminderType: timeframe,
      }),
      actionUrl: buildActionUrl("appointment", appointment.appointmentId),
      priority: determinePriority("appointment_reminder"),
      category: "appointments",
      entityType: "appointment",
      entityId: appointment.appointmentId,
      metadata,
    });
  } catch (error) {
    console.error("Error creating appointment reminder notification:", error);
    throw error;
  }
}

