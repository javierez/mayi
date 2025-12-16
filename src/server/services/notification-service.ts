/**
 * Notification Service
 *
 * Helper functions for creating notifications for tasks and appointments.
 * These functions handle the business logic of building notification content
 * and calling the notification query functions.
 */

import { createNotificationInternal } from "~/server/queries/notification";
import { sendPushToUser } from "~/server/services/push-service";
import { sendNotificationEmailIfNeeded } from "~/server/services/email-notification-service";
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
 * Helper function to send push notification after creating DB notification
 * Wraps errors so push failures don't break notification creation
 */
async function sendPushAfterNotification(
  userId: string,
  accountId: bigint,
  notification: { notificationId: bigint; title: string; message: string; actionUrl: string | null },
  entityType: EntityType | null,
  entityId: bigint | null,
): Promise<void> {
  try {
    await sendPushToUser(userId, accountId, {
      title: notification.title,
      body: notification.message,
      icon: "/apple-icon.png",
      badge: "/apple-icon.png",
      data: {
        url: notification.actionUrl ?? "/dashboard",
        actionUrl: notification.actionUrl ?? "/dashboard",
        notificationId: notification.notificationId.toString(),
      },
      tag: entityType && entityId ? `${entityType}-${entityId}` : undefined,
      requireInteraction: false,
    });
  } catch (pushError) {
    console.error("Error sending push notification:", pushError);
    // Don't throw - push failures shouldn't break notification creation
  }
}

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
      return `Nueva tarea: ${entityTitle}`;
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
 * Helper function to fetch listing and contact data for task notifications
 * 
 * Logic:
 * - If listingId exists: fetch listing card + always fetch owner from listingContacts
 * - If only contactId exists: fetch contact as generic contact
 * - If both listingId + contactId exist: check if contactId is owner; if not, they're buyer
 *   Also fetch the actual owner from listingContacts
 */
async function fetchTaskRelatedData(
  listingId: bigint | null | undefined,
  contactId: bigint | null | undefined,
  accountId: bigint,
): Promise<{
  listing: TaskNotificationMetadata["listing"];
  contact: TaskNotificationMetadata["contact"];
  owner: TaskNotificationMetadata["owner"];
  buyer: TaskNotificationMetadata["buyer"];
}> {
  let listingData: TaskNotificationMetadata["listing"] | undefined;
  let contactData: TaskNotificationMetadata["contact"] | undefined;
  let ownerData: TaskNotificationMetadata["owner"] | undefined;
  let buyerData: TaskNotificationMetadata["buyer"] | undefined;

  // Fetch listing data if listingId exists
  if (listingId) {
    try {
      const { getListingCompactByIdWithAuth } = await import("~/server/queries/listing");
      const { getPropertyImages } = await import("~/server/queries/property_images");
      const { db } = await import("~/server/db");
      const { listings, listingContacts, contacts } = await import("~/server/db/schema");
      const { eq, and } = await import("drizzle-orm");
      
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

        // Convert builtSurfaceArea to number if it's a string
        const builtSurfaceAreaRaw = listing.builtSurfaceArea;
        let builtSurfaceArea: number | null | undefined = null;
        if (builtSurfaceAreaRaw !== null && builtSurfaceAreaRaw !== undefined) {
          if (typeof builtSurfaceAreaRaw === "string") {
            const parsed = parseFloat(builtSurfaceAreaRaw);
            builtSurfaceArea = isNaN(parsed) ? null : parsed;
          } else {
            builtSurfaceArea = builtSurfaceAreaRaw;
          }
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
          builtSurfaceArea: builtSurfaceArea ?? undefined,
          city: listing.city,
          agentName: listing.agentName,
          imageUrl: listing.imageUrl,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        };

        // Always fetch owner from listingContacts when listingId exists
        try {
          const [ownerContact] = await db
            .select({
              contactId: contacts.contactId,
              firstName: contacts.firstName,
              lastName: contacts.lastName,
              email: contacts.email,
              phone: contacts.phone,
            })
            .from(listingContacts)
            .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
            .where(
              and(
                eq(listingContacts.listingId, listingId),
                eq(listingContacts.contactType, "owner"),
                eq(listingContacts.isActive, true),
                eq(contacts.isActive, true),
                eq(contacts.accountId, accountId),
              ),
            )
            .limit(1);

          if (ownerContact) {
            ownerData = {
              contactId: ownerContact.contactId.toString(),
              firstName: ownerContact.firstName,
              lastName: ownerContact.lastName,
              email: ownerContact.email ?? undefined,
              phone: ownerContact.phone ?? undefined,
            };
          }
        } catch (ownerError) {
          console.error("Error fetching owner contact for notification:", ownerError);
        }
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
        const { db } = await import("~/server/db");
        const { listingContacts, contacts } = await import("~/server/db/schema");
        const { eq, and } = await import("drizzle-orm");

        // If listingId exists, check if this contact is owner or buyer for THIS listing
        if (listingId) {
          // Join with contacts to filter by accountId
          const ownerCheck = await db
            .select()
            .from(listingContacts)
            .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
            .where(
              and(
                eq(listingContacts.listingId, listingId),
                eq(listingContacts.contactId, contactId),
                eq(listingContacts.contactType, "owner"),
                eq(listingContacts.isActive, true),
                eq(contacts.isActive, true),
                eq(contacts.accountId, accountId),
              ),
            )
            .limit(1);

          const buyerCheck = await db
            .select()
            .from(listingContacts)
            .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
            .where(
              and(
                eq(listingContacts.listingId, listingId),
                eq(listingContacts.contactId, contactId),
                eq(listingContacts.contactType, "buyer"),
                eq(listingContacts.isActive, true),
                eq(contacts.isActive, true),
                eq(contacts.accountId, accountId),
              ),
            )
            .limit(1);

          const isOwner = ownerCheck.length > 0;
          const isBuyer = buyerCheck.length > 0;

          // If contact is the owner, they're already in ownerData
          // If contact is the buyer, add them to buyerData
          if (isBuyer) {
            buyerData = {
              contactId: contact.contactId.toString(),
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email ?? undefined,
              phone: contact.phone ?? undefined,
            };
          }
          // If they're the owner, ownerData is already set above
          // If they're neither, treat as generic contact (backward compatibility)
          if (!isOwner && !isBuyer) {
            contactData = {
              contactId: contact.contactId.toString(),
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email ?? undefined,
              phone: contact.phone ?? undefined,
              isOwner: false,
              isBuyer: false,
            };
          }
        } else {
          // No listingId: just return as generic contact
          contactData = {
            contactId: contact.contactId.toString(),
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email ?? undefined,
            phone: contact.phone ?? undefined,
            isOwner: false,
            isBuyer: false,
          };
        }
      }
    } catch (error) {
      console.error("Error fetching contact data for notification:", error);
    }
  }

  return { listing: listingData, contact: contactData, owner: ownerData, buyer: buyerData };
}

/**
 * Fetch related data (listing, contact, owner, buyer) for an appointment
 * Reuses the same logic as fetchTaskRelatedData for consistency
 */
async function fetchAppointmentRelatedData(
  listingId: bigint | null | undefined,
  contactId: bigint | null | undefined,
  accountId: bigint,
): Promise<{
  listing: AppointmentNotificationMetadata["listing"];
  contact: AppointmentNotificationMetadata["contact"];
  owner: AppointmentNotificationMetadata["owner"];
  buyer: AppointmentNotificationMetadata["buyer"];
}> {
  let listingData: AppointmentNotificationMetadata["listing"] | undefined;
  let contactData: AppointmentNotificationMetadata["contact"] | undefined;
  let ownerData: AppointmentNotificationMetadata["owner"] | undefined;
  let buyerData: AppointmentNotificationMetadata["buyer"] | undefined;

  // Fetch listing data if listingId exists
  if (listingId) {
    try {
      const { getListingCompactByIdWithAuth } = await import("~/server/queries/listing");
      const { getPropertyImages } = await import("~/server/queries/property_images");
      const { db } = await import("~/server/db");
      const { listings, listingContacts, contacts } = await import("~/server/db/schema");
      const { eq, and } = await import("drizzle-orm");

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
            console.error("Error fetching property images for appointment notification:", imageError);
            // Fallback to single image if available
            if (listing.imageUrl) {
              imageUrls = [listing.imageUrl];
            }
          }
        } else if (listing.imageUrl) {
          // Fallback to single image if propertyId not found
          imageUrls = [listing.imageUrl];
        }

        // Convert builtSurfaceArea to number if it's a string
        const builtSurfaceAreaRaw = listing.builtSurfaceArea;
        let builtSurfaceArea: number | null | undefined = null;
        if (builtSurfaceAreaRaw !== null && builtSurfaceAreaRaw !== undefined) {
          if (typeof builtSurfaceAreaRaw === "string") {
            const parsed = parseFloat(builtSurfaceAreaRaw);
            builtSurfaceArea = isNaN(parsed) ? null : parsed;
          } else {
            builtSurfaceArea = builtSurfaceAreaRaw;
          }
        }

        // Check if any contact has accepted an offer for this listing
        let offerAccepted = false;
        try {
          const offerAcceptedCheck = await db
            .select({
              offerAccepted: listingContacts.offerAccepted,
            })
            .from(listingContacts)
            .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
            .where(
              and(
                eq(listingContacts.listingId, listingId),
                eq(listingContacts.offerAccepted, true),
                eq(listingContacts.isActive, true),
                eq(contacts.isActive, true),
                eq(contacts.accountId, accountId),
              ),
            )
            .limit(1);

          offerAccepted = offerAcceptedCheck.length > 0;
        } catch (offerError) {
          console.error("Error checking offerAccepted for appointment notification:", offerError);
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
          builtSurfaceArea: builtSurfaceArea ?? undefined,
          city: listing.city,
          province: listing.province ?? undefined,
          street: listing.street ?? undefined,
          agentName: listing.agentName,
          isBankOwned: listing.isBankOwned ?? undefined,
          hasKeys: listing.hasKeys ?? undefined,
          hasCartel: listing.hasCartel ?? undefined,
          offerAccepted: offerAccepted || undefined,
          imageUrl: listing.imageUrl,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        };

        // Always fetch owner from listingContacts when listingId exists
        try {
          const [ownerContact] = await db
            .select({
              contactId: contacts.contactId,
              firstName: contacts.firstName,
              lastName: contacts.lastName,
              email: contacts.email,
              phone: contacts.phone,
            })
            .from(listingContacts)
            .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
            .where(
              and(
                eq(listingContacts.listingId, listingId),
                eq(listingContacts.contactType, "owner"),
                eq(listingContacts.isActive, true),
                eq(contacts.isActive, true),
                eq(contacts.accountId, accountId),
              ),
            )
            .limit(1);

          if (ownerContact) {
            ownerData = {
              contactId: ownerContact.contactId.toString(),
              firstName: ownerContact.firstName,
              lastName: ownerContact.lastName,
              email: ownerContact.email ?? undefined,
              phone: ownerContact.phone ?? undefined,
            };
          }
        } catch (ownerError) {
          console.error("Error fetching owner contact for appointment notification:", ownerError);
        }
      }
    } catch (error) {
      console.error("Error fetching listing data for appointment notification:", error);
    }
  }

  // Fetch contact data if contactId exists
  if (contactId) {
    try {
      const { getContactByIdWithAuth } = await import("~/server/queries/contact");
      const contact = await getContactByIdWithAuth(Number(contactId));
      if (contact) {
        const { db } = await import("~/server/db");
        const { listingContacts, contacts } = await import("~/server/db/schema");
        const { eq, and } = await import("drizzle-orm");

        // If listingId exists, check if this contact is owner or buyer for THIS listing
        if (listingId) {
          // Join with contacts to filter by accountId
          const ownerCheck = await db
            .select()
            .from(listingContacts)
            .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
            .where(
              and(
                eq(listingContacts.listingId, listingId),
                eq(listingContacts.contactId, contactId),
                eq(listingContacts.contactType, "owner"),
                eq(listingContacts.isActive, true),
                eq(contacts.isActive, true),
                eq(contacts.accountId, accountId),
              ),
            )
            .limit(1);

          const buyerCheck = await db
            .select()
            .from(listingContacts)
            .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
            .where(
              and(
                eq(listingContacts.listingId, listingId),
                eq(listingContacts.contactId, contactId),
                eq(listingContacts.contactType, "buyer"),
                eq(listingContacts.isActive, true),
                eq(contacts.isActive, true),
                eq(contacts.accountId, accountId),
              ),
            )
            .limit(1);

          const isOwner = ownerCheck.length > 0;
          const isBuyer = buyerCheck.length > 0;

          // If contact is the buyer, add them to buyerData
          if (isBuyer) {
            buyerData = {
              contactId: contact.contactId.toString(),
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email ?? undefined,
              phone: contact.phone ?? undefined,
            };
          }
          // If they're neither owner nor buyer, treat as generic contact
          if (!isOwner && !isBuyer) {
            contactData = {
              contactId: contact.contactId.toString(),
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email ?? undefined,
              phone: contact.phone ?? undefined,
              isOwner: false,
              isBuyer: false,
            };
          }
        } else {
          // No listingId: just return as generic contact
          contactData = {
            contactId: contact.contactId.toString(),
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email ?? undefined,
            phone: contact.phone ?? undefined,
            isOwner: false,
            isBuyer: false,
          };
        }
      }
    } catch (error) {
      console.error("Error fetching contact data for appointment notification:", error);
    }
  }

  return { listing: listingData, contact: contactData, owner: ownerData, buyer: buyerData };
}

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
    // Fetch listing and contact data
    const { listing: listingData, contact: contactData, owner: ownerData, buyer: buyerData } = await fetchTaskRelatedData(
      task.listingId,
      task.contactId,
      accountId,
    );

    // Fetch assigner information if available
    let assignerEmail: string | undefined;
    let assignerPhone: string | undefined;
    let assignerName: string | undefined;
    if (assignerId) {
      try {
        const { getUserByIdWithAuth } = await import("~/server/queries/users");
        const assigner = await getUserByIdWithAuth(assignerId);
        if (assigner) {
          assignerEmail = assigner.email ?? undefined;
          assignerPhone = assigner.phone ?? undefined;
          assignerName = assigner.name ?? undefined;
        }
      } catch (error) {
        console.error("Error fetching assigner data for notification:", error);
        // Continue without assigner contact info
      }
    }

    const metadata: TaskNotificationMetadata = {
      taskTitle: task.title,
      taskDescription: task.description,
      dueDate: task.dueDate?.toISOString(),
      dueTime: task.dueTime ?? undefined,
      urgency: task.urgency ?? undefined,
      category: task.category ?? undefined,
      listingId: task.listingId?.toString(),
      contactId: task.contactId?.toString(),
      listing: listingData,
      contact: contactData,
      owner: ownerData,
      buyer: buyerData,
      assignerEmail,
      assignerPhone,
      assignerName,
      assignedByName: assignerName, // Also set for backward compatibility
    };

    const notification = await createNotificationInternal({
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

    await sendPushAfterNotification(
      assigneeId,
      accountId,
      {
        notificationId: notification.notificationId,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
      },
      "task",
      task.taskId,
    );

    // Send email notification if needed (async, don't await)
    sendNotificationEmailIfNeeded(notification, accountId).catch((error) => {
      console.error("Failed to send email notification for task assigned:", error);
      // Don't throw - notification was created successfully
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

    // Fetch listing and contact data
    const { listing: listingData, contact: contactData, owner: ownerData, buyer: buyerData } = await fetchTaskRelatedData(
      task.listingId,
      task.contactId,
      accountId,
    );

    const metadata: TaskNotificationMetadata = {
      taskTitle: task.title,
      taskDescription: task.description,
      dueDate: task.dueDate?.toISOString(),
      dueTime: task.dueTime ?? undefined,
      urgency: task.urgency ?? undefined,
      category: task.category ?? undefined,
      listingId: task.listingId?.toString(),
      contactId: task.contactId?.toString(),
      listing: listingData,
      contact: contactData,
      owner: ownerData,
      buyer: buyerData,
      updatedFields,
    };

    const notification = await createNotificationInternal({
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

    await sendPushAfterNotification(
      assigneeId,
      accountId,
      {
        notificationId: notification.notificationId,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
      },
      "task",
      task.taskId,
    );
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

    // Fetch listing and contact data
    const { listing: listingData, contact: contactData, owner: ownerData, buyer: buyerData } = await fetchTaskRelatedData(
      task.listingId,
      task.contactId,
      accountId,
    );

    // Fetch reassigner information if available (treat as assigner for email template)
    let assignerEmail: string | undefined;
    let assignerPhone: string | undefined;
    let assignerName: string | undefined;
    if (reassignerId) {
      try {
        const { getUserByIdWithAuth } = await import("~/server/queries/users");
        const reassigner = await getUserByIdWithAuth(reassignerId);
        if (reassigner) {
          assignerEmail = reassigner.email ?? undefined;
          assignerPhone = reassigner.phone ?? undefined;
          assignerName = reassigner.name ?? undefined;
        }
      } catch (error) {
        console.error("Error fetching reassigner data for notification:", error);
        // Continue without reassigner contact info
      }
    }

    const metadata: TaskNotificationMetadata = {
      taskTitle: task.title,
      taskDescription: task.description,
      dueDate: task.dueDate?.toISOString(),
      dueTime: task.dueTime ?? undefined,
      urgency: task.urgency ?? undefined,
      category: task.category ?? undefined,
      listingId: task.listingId?.toString(),
      contactId: task.contactId?.toString(),
      listing: listingData,
      contact: contactData,
      owner: ownerData,
      buyer: buyerData,
      previousAssigneeId: previousAssigneeId ?? undefined,
      assignerEmail,
      assignerPhone,
      assignerName,
      assignedByName: assignerName, // Also set for backward compatibility
    };

    const notification = await createNotificationInternal({
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

    await sendPushAfterNotification(
      newAssigneeId,
      accountId,
      {
        notificationId: notification.notificationId,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
      },
      "task",
      task.taskId,
    );

    // Send email notification if needed (async, don't await)
    sendNotificationEmailIfNeeded(notification, accountId).catch((error) => {
      console.error("Failed to send email notification for task reassigned:", error);
      // Don't throw - notification was created successfully
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

    // Fetch listing and contact data
    const { listing: listingData, contact: contactData, owner: ownerData, buyer: buyerData } = await fetchTaskRelatedData(
      task.listingId,
      task.contactId,
      accountId,
    );

    const metadata: TaskNotificationMetadata = {
      taskTitle: task.title,
      dueDate: task.dueDate?.toISOString(),
      dueTime: task.dueTime ?? undefined,
      urgency: task.urgency ?? undefined,
      category: task.category ?? undefined,
      listingId: task.listingId?.toString(),
      contactId: task.contactId?.toString(),
      listing: listingData,
      contact: contactData,
      owner: ownerData,
      buyer: buyerData,
      deletedByName: deleterId ?? undefined,
    };

    const notification = await createNotificationInternal({
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

    await sendPushAfterNotification(
      assigneeId,
      accountId,
      {
        notificationId: notification.notificationId,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
      },
      "task",
      task.taskId,
    );
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
    // Fetch listing and contact data
    const { listing: listingData, contact: contactData, owner: ownerData, buyer: buyerData } = await fetchTaskRelatedData(
      task.listingId,
      task.contactId,
      accountId,
    );

    // Fetch completer information if available
    let completerEmail: string | undefined;
    let completerPhone: string | undefined;
    let completerName: string | undefined;
    if (completedById) {
      try {
        const { getUserByIdWithAuth } = await import("~/server/queries/users");
        const completer = await getUserByIdWithAuth(completedById);
        if (completer) {
          completerEmail = completer.email ?? undefined;
          completerPhone = completer.phone ?? undefined;
          completerName = completer.name ?? undefined;
        }
      } catch (error) {
        console.error("Error fetching completer data for notification:", error);
        // Continue without completer contact info
      }
    }

    const metadata: TaskNotificationMetadata = {
      taskTitle: task.title,
      taskDescription: task.description,
      dueDate: task.dueDate?.toISOString(),
      dueTime: task.dueTime ?? undefined,
      urgency: task.urgency ?? undefined,
      category: task.category ?? undefined,
      listingId: task.listingId?.toString(),
      contactId: task.contactId?.toString(),
      listing: listingData,
      contact: contactData,
      owner: ownerData,
      buyer: buyerData,
      completerEmail,
      completerPhone,
      completerName,
      completedByName: completerName, // Also set for backward compatibility
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

    // Notify the creator of the task (task.createdBy) when it's completed
    // The creator should be notified, not the assignee, so they know their task was completed
    const recipientId = task.createdBy;
    
    if (recipientId) {
      console.log(`[Task Completed Notification] Task ID: ${task.taskId}, Task userId (assigned to): ${task.userId ?? 'null'}, Task createdBy (recipient): ${recipientId}, Completed by: ${completedById}`);
      const notification = await createNotificationInternal({
        ...notificationData,
        userId: recipientId,
      });
      console.log(`[Task Completed Notification] Created notification ID: ${notification.notificationId}, Notification userId (recipient): ${notification.userId}`);
      await sendPushAfterNotification(
        recipientId,
        accountId,
        {
          notificationId: notification.notificationId,
          title: notification.title,
          message: notification.message,
          actionUrl: notification.actionUrl,
        },
        "task",
        task.taskId,
      );

      // Send email notification if needed (async, don't await)
      sendNotificationEmailIfNeeded(notification, accountId).catch((error) => {
        console.error("Failed to send email notification for task completed:", error);
        // Don't throw - notification was created successfully
      });
    } else {
      console.log(`[Task Completed Notification] Task ID: ${task.taskId} has no createdBy, skipping notification`);
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

    // Fetch listing and contact data
    const { listing: listingData, contact: contactData, owner: ownerData, buyer: buyerData } = await fetchTaskRelatedData(
      task.listingId,
      task.contactId,
      accountId,
    );

    const metadata: TaskNotificationMetadata = {
      taskTitle: task.title,
      taskDescription: task.description,
      dueDate: task.dueDate?.toISOString(),
      dueTime: task.dueTime ?? undefined,
      urgency: task.urgency ?? undefined,
      category: task.category ?? undefined,
      listingId: task.listingId?.toString(),
      contactId: task.contactId?.toString(),
      listing: listingData,
      contact: contactData,
      owner: ownerData,
      buyer: buyerData,
    };

    const notification = await createNotificationInternal({
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
        timeframe: timeframe, // Also store as timeframe for template router
      },
    });

    await sendPushAfterNotification(
      task.userId,
      accountId,
      {
        notificationId: notification.notificationId,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
      },
      "task",
      task.taskId,
    );

    // Send email notification if needed (async, don't await)
    sendNotificationEmailIfNeeded(notification, accountId).catch((error) => {
      console.error("Failed to send email notification for task due soon:", error);
      // Don't throw - notification was created successfully
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

    // Fetch listing and contact data
    const { listing: listingData, contact: contactData, owner: ownerData, buyer: buyerData } = await fetchTaskRelatedData(
      task.listingId,
      task.contactId,
      accountId,
    );

    const metadata: TaskNotificationMetadata = {
      taskTitle: task.title,
      taskDescription: task.description,
      dueDate: task.dueDate?.toISOString(),
      dueTime: task.dueTime ?? undefined,
      urgency: task.urgency ?? undefined,
      category: task.category ?? undefined,
      listingId: task.listingId?.toString(),
      contactId: task.contactId?.toString(),
      listing: listingData,
      contact: contactData,
      owner: ownerData,
      buyer: buyerData,
    };

    const notification = await createNotificationInternal({
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

    await sendPushAfterNotification(
      task.userId,
      accountId,
      {
        notificationId: notification.notificationId,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
      },
      "task",
      task.taskId,
    );

    // Send email notification if needed (async, don't await)
    sendNotificationEmailIfNeeded(notification, accountId).catch((error) => {
      console.error("Failed to send email notification for overdue task:", error);
      // Don't throw - notification was created successfully
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

    // Fetch related data (listing, contact, owner, buyer) for rich email templates
    const { listing, contact, owner, buyer } = await fetchAppointmentRelatedData(
      appointment.listingId,
      appointment.contactId,
      accountId,
    );

    const metadata: AppointmentNotificationMetadata = {
      appointmentTitle: appointment.title,
      datetimeStart: appointment.datetimeStart.toISOString(),
      datetimeEnd: appointment.datetimeEnd.toISOString(),
      appointmentType: appointment.type ?? undefined,
      location: appointment.notes ?? undefined,
      // Enriched data for email templates
      listing,
      contact,
      owner,
      buyer,
    };

    const notification = await createNotificationInternal({
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

    await sendPushAfterNotification(
      targetUserId,
      accountId,
      {
        notificationId: notification.notificationId,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
      },
      "appointment",
      appointment.appointmentId,
    );

    // Send email notification if needed (async, don't await)
    sendNotificationEmailIfNeeded(notification, accountId).catch((error) => {
      console.error("Failed to send email notification for appointment scheduled:", error);
      // Don't throw - notification was created successfully
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

    // Fetch related data (listing, contact, owner, buyer) for rich email templates
    const { listing, contact, owner, buyer } = await fetchAppointmentRelatedData(
      appointment.listingId,
      appointment.contactId,
      accountId,
    );

    const metadata: AppointmentNotificationMetadata = {
      appointmentTitle: appointment.title,
      datetimeStart: appointment.datetimeStart.toISOString(),
      datetimeEnd: appointment.datetimeEnd.toISOString(),
      previousDatetime: previousDateTime.toISOString(),
      appointmentType: appointment.type ?? undefined,
      location: appointment.notes ?? undefined,
      // Enriched data for email templates
      listing,
      contact,
      owner,
      buyer,
    };

    const notification = await createNotificationInternal({
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

    await sendPushAfterNotification(
      targetUserId,
      accountId,
      {
        notificationId: notification.notificationId,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
      },
      "appointment",
      appointment.appointmentId,
    );

    // Send email notification if needed (async, don't await)
    sendNotificationEmailIfNeeded(notification, accountId).catch((error) => {
      console.error("Failed to send email notification for appointment rescheduled:", error);
      // Don't throw - notification was created successfully
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
      appointmentType: appointment.type ?? undefined,
    };

    const notification = await createNotificationInternal({
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

    await sendPushAfterNotification(
      targetUserId,
      accountId,
      {
        notificationId: notification.notificationId,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
      },
      "appointment",
      appointment.appointmentId,
    );

    // Send email notification if needed (async, don't await)
    sendNotificationEmailIfNeeded(notification, accountId).catch((error) => {
      console.error("Failed to send email notification for appointment cancelled:", error);
      // Don't throw - notification was created successfully
    });
  } catch (error) {
    console.error("Error creating appointment cancelled notification:", error);
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

    // Fetch related data (listing, contact, owner, buyer) for rich email templates
    const { listing, contact, owner, buyer } = await fetchAppointmentRelatedData(
      appointment.listingId,
      appointment.contactId,
      accountId,
    );

    const metadata: AppointmentNotificationMetadata = {
      appointmentTitle: appointment.title,
      datetimeStart: appointment.datetimeStart.toISOString(),
      datetimeEnd: appointment.datetimeEnd.toISOString(),
      reminderType: timeframe,
      appointmentType: appointment.type ?? undefined,
      location: appointment.notes ?? undefined,
      // Enriched data for email templates
      listing,
      contact,
      owner,
      buyer,
    };

    const notification = await createNotificationInternal({
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

    await sendPushAfterNotification(
      targetUserId,
      accountId,
      {
        notificationId: notification.notificationId,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
      },
      "appointment",
      appointment.appointmentId,
    );

    // Send email notification if needed (async, don't await)
    sendNotificationEmailIfNeeded(notification, accountId).catch((error) => {
      console.error("Failed to send email notification for appointment reminder:", error);
      // Don't throw - notification was created successfully
    });
  } catch (error) {
    console.error("Error creating appointment reminder notification:", error);
    throw error;
  }
}

