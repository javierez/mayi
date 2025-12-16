import { db } from "~/server/db";
import { tasks, users, listingContacts } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { generateTaskNotificationEmail } from "~/templates/emails/task-notification";
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
import type { Notification, TaskNotificationMetadata } from "~/types/notifications";
import { EmailTemplatesClient } from "./client";

// Fetch real task data from database with related data (like production)
async function getExampleTask() {
  const EXAMPLE_TASK_ID = 158;

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
      listingId: tasks.listingId,
      contactId: tasks.contactId,
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

// Fetch related data like production does
async function fetchTaskRelatedData(
  listingId: bigint | null | undefined,
  contactId: bigint | null | undefined,
): Promise<{
  listing: TaskNotificationMetadata["listing"];
  contact: TaskNotificationMetadata["contact"];
}> {
  let listingData: TaskNotificationMetadata["listing"] | undefined;
  let contactData: TaskNotificationMetadata["contact"] | undefined;

  // Fetch listing data if listingId exists
  if (listingId) {
    try {
      const { getListingCompactByIdWithAuth } = await import("~/server/queries/listing");
      const { getPropertyImages } = await import("~/server/queries/property_images");
      const { db } = await import("~/server/db");
      const { listings } = await import("~/server/db/schema");
      const { eq } = await import("drizzle-orm");
      
      const listing = await getListingCompactByIdWithAuth(listingId);
      if (listing) {
        // Get propertyId from listing
        const [listingWithProperty] = await db
          .select({
            propertyId: listings.propertyId,
          })
          .from(listings)
          .where(eq(listings.listingId, listingId))
          .limit(1);

        // Fetch multiple property images (limit to 5 for email)
        let imageUrls: string[] = [];
        if (listingWithProperty?.propertyId) {
          try {
            const propertyImages = await getPropertyImages(listingWithProperty.propertyId, true);
            imageUrls = propertyImages
              .slice(0, 5) // Limit to 5 images for email
              .map((img) => img.imageUrl)
              .filter((url): url is string => url !== null && url !== undefined);
          } catch (imageError) {
            console.error("Error fetching property images for notification:", imageError);
            // Fallback to single image if available
            if (listing.imageUrl) {
              imageUrls = [listing.imageUrl];
            }
          }
        } else if (listing.imageUrl) {
          // Fallback to single image if propertyId not found
          imageUrls = [listing.imageUrl];
        }

        listingData = {
          listingId: listing.listingId.toString(),
          title: listing.title,
          referenceNumber: listing.referenceNumber,
          price: listing.price,
          listingType: listing.listingType,
          propertyType: listing.propertyType,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          squareMeter: listing.squareMeter,
          builtSurfaceArea: listing.builtSurfaceArea ? (typeof listing.builtSurfaceArea === "string" ? parseFloat(listing.builtSurfaceArea) : listing.builtSurfaceArea) : undefined,
          city: listing.city,
          agentName: listing.agentName,
          imageUrl: listing.imageUrl,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        };
      }
    } catch (error) {
      console.error("Error fetching listing data for notification:", error);
    }
  }

  // Fetch contact data if contactId exists
  if (contactId) {
    try {
      const { getContactByIdWithAuth } = await import("~/server/queries/contact");
      const contact = await getContactByIdWithAuth(Number(contactId));
      if (contact) {
        // Check if contact is owner or buyer
        const ownerCheck = await db
          .select()
          .from(listingContacts)
          .where(
            and(
              eq(listingContacts.contactId, contactId),
              eq(listingContacts.contactType, "owner"),
              eq(listingContacts.isActive, true),
            ),
          )
          .limit(1);

        const buyerCheck = await db
          .select()
          .from(listingContacts)
          .where(
            and(
              eq(listingContacts.contactId, contactId),
              eq(listingContacts.contactType, "buyer"),
              eq(listingContacts.isActive, true),
            ),
          )
          .limit(1);

        contactData = {
          contactId: contact.contactId.toString(),
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email ?? undefined,
          phone: contact.phone ?? undefined,
          isOwner: ownerCheck.length > 0,
          isBuyer: buyerCheck.length > 0,
        };
      }
    } catch (error) {
      console.error("Error fetching contact data for notification:", error);
    }
  }

  return { listing: listingData, contact: contactData };
}

export default async function EmailTemplatesPage() {
  const exampleTask = await getExampleTask();
  
  // Fetch related data (listing, contact) like production does
  const { listing: listingData, contact: contactData } = await fetchTaskRelatedData(
    exampleTask?.listingId,
    exampleTask?.contactId,
  );

  // Fetch assigner information if available
  let assignerEmail: string | undefined;
  let assignerPhone: string | undefined;
  let assignerName: string | undefined;
  if (exampleTask?.createdBy) {
    try {
      const { getUserByIdWithAuth } = await import("~/server/queries/users");
      const assigner = await getUserByIdWithAuth(exampleTask.createdBy);
      if (assigner) {
        assignerEmail = assigner.email ?? undefined;
        assignerPhone = assigner.phone ?? undefined;
        assignerName = assigner.name ?? undefined;
      }
    } catch (error) {
      console.error("Error fetching assigner data for notification:", error);
    }
  }

  // Create notification based on real task data with full metadata (like production)
  function createTaskNotification(type: Notification["type"]): Notification {
    const taskTitle = exampleTask?.title ?? "Tarea de ejemplo";
    const taskId = exampleTask?.taskId ?? BigInt(158);
    const assignedByName = exampleTask?.userFirstName && exampleTask?.userLastName
      ? `${exampleTask.userFirstName} ${exampleTask.userLastName}`
      : exampleTask?.userName ?? "Usuario";

    return {
      notificationId: BigInt(1),
      accountId: BigInt(1),
      userId: exampleTask?.userId ?? "user-1",
      fromUserId: exampleTask?.createdBy ?? "user-2",
      type,
      title: `${type === "task_assigned" ? "Nueva tarea" : type === "task_completed" ? "Tarea completada" : type === "task_reassigned" ? "Tarea reasignada" : type === "task_overdue" ? "Tarea vencida" : "Recordatorio"}: ${taskTitle}`,
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
        listingId: exampleTask?.listingId?.toString(),
        contactId: exampleTask?.contactId?.toString(),
        // Include rich data like production
        listing: listingData,
        contact: contactData,
        assignerEmail,
        assignerPhone,
        assignerName,
        assignedByName: assignerName ?? assignedByName,
        completedByName: assignedByName,
        previousAssigneeName: "Usuario Anterior",
        newAssigneeName: assignedByName,
        timeframe: "24h",
      },
    };
  }

  function createAppointmentNotification(type: Notification["type"]): Notification {
    const assignedByName = exampleTask?.userFirstName && exampleTask?.userLastName
      ? `${exampleTask.userFirstName} ${exampleTask.userLastName}`
      : exampleTask?.userName ?? "Usuario";

    return {
      notificationId: BigInt(2),
      accountId: BigInt(1),
      userId: exampleTask?.userId ?? "user-1",
      fromUserId: exampleTask?.createdBy ?? "user-2",
      type,
      title: type === "appointment_scheduled"
        ? "Nueva cita: Visita a propiedad"
        : type === "appointment_rescheduled"
        ? "Cita reagendada: Visita a propiedad"
        : "Recordatorio: Visita a propiedad",
      message: type === "appointment_scheduled"
        ? "Se ha programado una nueva cita para ti."
        : type === "appointment_rescheduled"
        ? "Tu cita ha sido reprogramada."
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
        scheduledByName: assignerName ?? assignedByName,
        rescheduledByName: assignerName ?? assignedByName,
        location: "Calle Principal 123, León",
        // Include rich data like production
        listing: listingData,
        contact: contactData,
        owner: contactData ? {
          contactId: contactData.contactId,
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          email: contactData.email,
          phone: contactData.phone,
        } : undefined,
        previousDatetime: type === "appointment_rescheduled"
          ? new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
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
          preview: generateTaskNotificationEmail(createTaskNotification("task_overdue")),
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
                taskId: exampleTask?.taskId ?? BigInt(158),
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
                taskId: exampleTask?.taskId ?? BigInt(158),
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
