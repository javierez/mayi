import { db } from "~/server/db";
import { tasks, users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { generateTaskNotificationEmail } from "~/templates/emails/task-notification";
import { generateCriticalTaskOverdueEmail } from "~/templates/emails/task-overdue-critical";
import { generateTaskReminderEmail } from "~/templates/emails/task-reminder";
import { generateTaskBriefingEmail } from "~/templates/emails/task-briefing";
import { generateTaskDigestEmail } from "~/templates/emails/task-digest-notification";
import { generateAppointmentNotificationEmail } from "~/templates/emails/appointment-notification";
import { generateAppointmentReminderEmail } from "~/templates/emails/appointment-reminder";
import { generateAppointmentBriefingEmail } from "~/templates/emails/appointment-briefing";
import { generateCustomerAppointmentReminderEmail } from "~/templates/emails/customer-appointment-reminder";
import { generateCustomerPropertyNotificationEmail } from "~/templates/emails/customer-property-notification";
import { generateCustomerDocumentNotificationEmail } from "~/templates/emails/customer-document-notification";
import { generateCustomerDealNotificationEmail } from "~/templates/emails/customer-deal-notification";
import type { Notification } from "~/types/notifications";
import { EmailTemplatesClient } from "./client";

// Fetch real task data from database
async function getExampleTask() {
  const EXAMPLE_TASK_ID = 156;

  const [task] = await db
    .select({
      taskId: tasks.taskId,
      userId: tasks.userId,
      title: tasks.title,
      description: tasks.description,
      dueDate: tasks.dueDate,
      dueTime: tasks.dueTime,
      urgency: tasks.urgency,
      category: tasks.category,
      completed: tasks.completed,
      isActive: tasks.isActive,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      createdBy: tasks.createdBy,
      // User info
      userName: users.name,
      userFirstName: users.firstName,
      userLastName: users.lastName,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.userId, users.id))
    .where(eq(tasks.taskId, BigInt(EXAMPLE_TASK_ID)))
    .limit(1);

  return task;
}

export default async function EmailTemplatesPage() {
  const exampleTask = await getExampleTask();

  // Create notification based on real task data
  function createTaskNotification(type: Notification["type"]): Notification {
    const taskTitle = exampleTask?.title ?? "Tarea de ejemplo";
    const taskId = exampleTask?.taskId ?? BigInt(149);
    const assignedByName = exampleTask?.userFirstName && exampleTask?.userLastName
      ? `${exampleTask.userFirstName} ${exampleTask.userLastName}`
      : exampleTask?.userName ?? "Usuario";

    return {
      notificationId: BigInt(1),
      accountId: BigInt(1),
      userId: exampleTask?.userId ?? "user-1",
      fromUserId: exampleTask?.createdBy ?? "user-2",
      type,
      title: `${type === "task_assigned" ? "Nueva tarea asignada" : type === "task_completed" ? "Tarea completada" : type === "task_reassigned" ? "Tarea reasignada" : type === "task_overdue" ? "Tarea vencida" : "Recordatorio"}: ${taskTitle}`,
      message: type === "task_assigned"
        ? "Se te ha asignado una nueva tarea."
        : type === "task_completed"
        ? "La tarea ha sido completada."
        : type === "task_reassigned"
        ? "Tu tarea ha sido reasignada."
        : type === "task_overdue"
        ? "Una tarea crítica ha vencido."
        : "Tu tarea vence pronto.",
      actionUrl: `/tareas?taskId=${taskId}`,
      priority: type === "task_overdue" ? "urgent" : "normal",
      category: "tasks",
      entityType: "task",
      entityId: taskId,
      isRead: false,
      readAt: null,
      isDismissed: null,
      dismissedAt: null,
      isDelivered: false,
      deliveredAt: null,
      deliveryError: null,
      scheduledFor: null,
      expiresAt: null,
      deliveryChannel: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        taskTitle,
        dueDate: exampleTask?.dueDate?.toISOString() ?? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        dueTime: exampleTask?.dueTime ?? "17:00",
        urgency: exampleTask?.urgency ?? 3,
        category: exampleTask?.category ?? "general",
        assignedByName,
        completedByName: assignedByName,
        previousAssigneeName: "Usuario Anterior",
        newAssigneeName: assignedByName,
        timeframe: "24h",
      },
    };
  }

  function createAppointmentNotification(type: Notification["type"]): Notification {
    return {
      notificationId: BigInt(2),
      accountId: BigInt(1),
      userId: exampleTask?.userId ?? "user-1",
      fromUserId: exampleTask?.createdBy ?? "user-2",
      type,
      title: type === "appointment_scheduled"
        ? "Cita programada: Visita a propiedad"
        : "Recordatorio: Visita a propiedad",
      message: type === "appointment_scheduled"
        ? "Se ha programado una nueva cita para ti."
        : "Tu cita es pronto.",
      actionUrl: "/calendario?appointmentId=456",
      priority: "normal",
      category: "appointments",
      entityType: "appointment",
      entityId: BigInt(456),
      isRead: false,
      readAt: null,
      isDismissed: null,
      dismissedAt: null,
      isDelivered: false,
      deliveredAt: null,
      deliveryError: null,
      scheduledFor: null,
      expiresAt: null,
      deliveryChannel: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        appointmentTitle: "Visita a propiedad en Centro",
        datetimeStart: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        datetimeEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        appointmentType: "visita",
        reminderType: "24h",
      },
    };
  }

  // Build template categories with pre-generated previews using real task data
  const templateCategories = [
    {
      id: "internal-tasks",
      title: "Tareas Internas",
      icon: "Briefcase",
      templates: [
        {
          id: "task-assigned",
          name: "Tarea Asignada",
          description: "Notificación cuando se asigna una nueva tarea",
          icon: "Mail",
          preview: generateTaskNotificationEmail(createTaskNotification("task_assigned")),
        },
        {
          id: "task-completed",
          name: "Tarea Completada",
          description: "Notificación cuando se completa una tarea",
          icon: "CheckCircle",
          preview: generateTaskNotificationEmail(createTaskNotification("task_completed")),
        },
        {
          id: "task-reassigned",
          name: "Tarea Reasignada",
          description: "Notificación cuando se reasigna una tarea",
          icon: "Mail",
          preview: generateTaskNotificationEmail(createTaskNotification("task_reassigned")),
        },
        {
          id: "task-overdue",
          name: "Tarea Vencida (Crítica)",
          description: "Alerta urgente de tarea vencida",
          icon: "AlertTriangle",
          preview: generateCriticalTaskOverdueEmail(createTaskNotification("task_overdue")),
        },
        {
          id: "task-reminder",
          name: "Recordatorio de Tarea",
          description: "Recordatorio antes del vencimiento",
          icon: "Clock",
          preview: generateTaskReminderEmail(createTaskNotification("task_due_soon")),
        },
        {
          id: "task-briefing",
          name: "Resumen Diario de Tareas",
          description: "Resumen de tareas pendientes del día",
          icon: "FileText",
          preview: generateTaskBriefingEmail({
            briefingType: "daily",
            tasks: [
              {
                taskId: exampleTask?.taskId ?? BigInt(149),
                userId: exampleTask?.userId ?? "user-1",
                title: exampleTask?.title ?? "Tarea de ejemplo",
                description: exampleTask?.description ?? "Descripción de la tarea",
                dueDate: exampleTask?.dueDate ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
                dueTime: exampleTask?.dueTime ?? "17:00",
                urgency: exampleTask?.urgency ?? 3,
                completed: false,
                isActive: true,
                createdAt: exampleTask?.createdAt ?? new Date(),
                updatedAt: exampleTask?.updatedAt ?? new Date(),
              },
            ],
            date: new Date().toLocaleDateString("es-ES"),
          }),
        },
        {
          id: "task-digest",
          name: "Resumen Semanal de Tareas Vencidas",
          description: "Digest semanal de tareas atrasadas",
          icon: "FileText",
          preview: generateTaskDigestEmail({
            digestType: "weekly",
            tasks: [
              {
                taskId: exampleTask?.taskId ?? BigInt(149),
                userId: exampleTask?.userId ?? "user-1",
                title: exampleTask?.title ?? "Tarea vencida",
                description: exampleTask?.description ?? "Descripción de la tarea",
                dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                urgency: exampleTask?.urgency ?? 5,
                completed: false,
                isActive: true,
                createdAt: exampleTask?.createdAt ?? new Date(),
                updatedAt: exampleTask?.updatedAt ?? new Date(),
              },
            ],
          }),
        },
      ],
    },
    {
      id: "internal-appointments",
      title: "Citas Internas",
      icon: "Calendar",
      templates: [
        {
          id: "appointment-scheduled",
          name: "Cita Programada",
          description: "Notificación de nueva cita agendada",
          icon: "Calendar",
          preview: generateAppointmentNotificationEmail(createAppointmentNotification("appointment_scheduled")),
        },
        {
          id: "appointment-reminder",
          name: "Recordatorio de Cita",
          description: "Recordatorio antes de la cita",
          icon: "Clock",
          preview: generateAppointmentReminderEmail(createAppointmentNotification("appointment_reminder")),
        },
        {
          id: "appointment-briefing",
          name: "Resumen Diario de Citas",
          description: "Resumen de citas del día",
          icon: "FileText",
          preview: generateAppointmentBriefingEmail({
            briefingType: "daily",
            appointments: [
              {
                appointmentId: BigInt(1),
                userId: exampleTask?.userId ?? "user-1",
                title: "Visita propiedad",
                type: "visita",
                datetimeStart: new Date(Date.now() + 24 * 60 * 60 * 1000),
                datetimeEnd: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
                contactId: null,
                status: "scheduled",
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
            date: new Date().toLocaleDateString("es-ES"),
          }),
        },
      ],
    },
    {
      id: "customer",
      title: "Notificaciones a Clientes",
      icon: "Mail",
      templates: [
        {
          id: "customer-appointment-reminder",
          name: "Recordatorio de Cita",
          description: "Recordatorio enviado al cliente antes de su cita",
          icon: "Clock",
          preview: generateCustomerAppointmentReminderEmail({
            appointmentTitle: "Visita a propiedad en Centro",
            appointmentType: "visita",
            datetimeStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            reminderTimeframe: "24h",
            contactName: "Juan Pérez",
            location: "Calle Principal 123, León",
          }),
        },
        {
          id: "customer-property",
          name: "Nueva Propiedad Disponible",
          description: "Notificación al cliente sobre una propiedad de interés",
          icon: "Home",
          preview: generateCustomerPropertyNotificationEmail({
            notificationType: "new_listing",
            propertyAddress: "Calle Principal 123, León",
            propertyTitle: "Piso en Centro",
            propertyType: "Piso",
            propertySize: "85 m²",
            keyFeatures: ["3 habitaciones", "2 baños", "Balcón"],
          }),
        },
        {
          id: "customer-document",
          name: "Documento Listo",
          description: "Notificación cuando un documento está disponible",
          icon: "FileText",
          preview: generateCustomerDocumentNotificationEmail({
            notificationType: "document_ready",
            documentName: "Contrato de compraventa",
            documentType: "Contrato",
            agentName: "María García",
            downloadUrl: "#",
          }),
        },
        {
          id: "customer-deal",
          name: "Oferta Recibida",
          description: "Notificación al cliente sobre una oferta en su propiedad",
          icon: "Handshake",
          preview: generateCustomerDealNotificationEmail({
            notificationType: "offer_received",
            dealTitle: "Oferta recibida",
            propertyAddress: "Calle Principal 123, León",
            offerAmount: 250000,
            agentName: "María García",
          }),
        },
      ],
    },
  ];

  return <EmailTemplatesClient templateCategories={templateCategories} />;
}
