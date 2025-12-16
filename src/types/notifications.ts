import { z } from "zod";

// Notification types for tasks and appointments
export type NotificationType =
  // Task notifications
  | "task_assigned"
  | "task_updated"
  | "task_reassigned"
  | "task_completed"
  | "task_deleted"
  | "task_due_soon"
  | "task_overdue"
  // Appointment notifications
  | "appointment_scheduled"
  | "appointment_rescheduled"
  | "appointment_cancelled"
  | "appointment_reminder";

export type NotificationCategory =
  | "tasks"
  | "appointments"
  | "properties"
  | "contacts"
  | "deals"
  | "system";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export type DeliveryChannel = "in_app" | "email" | "push" | "sms";

export type EntityType =
  | "task"
  | "appointment"
  | "property"
  | "listing"
  | "contact"
  | "deal"
  | "prospect"
  | "document";

// Database notification record
export interface Notification {
  notificationId: bigint;
  accountId: bigint;
  userId: string | null;
  fromUserId: string | null;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  priority: string | null;
  category: string;
  entityType: string | null;
  entityId: bigint | null;
  metadata: Record<string, unknown>;
  isRead: boolean | null;
  readAt: Date | null;
  isDismissed: boolean | null;
  dismissedAt: Date | null;
  deliveryChannel: string | null;
  isDelivered: boolean | null;
  deliveredAt: Date | null;
  deliveryError: string | null;
  scheduledFor: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean | null;
}

// Notification with user info for display
export interface NotificationWithUser extends Notification {
  fromUserName?: string | null;
  fromUserImage?: string | null;
}

// Input for creating notifications
export interface CreateNotificationInput {
  userId?: string | null;
  fromUserId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
  priority?: NotificationPriority;
  category: NotificationCategory;
  entityType?: EntityType | null;
  entityId?: bigint | null;
  metadata?: Record<string, unknown>;
  deliveryChannel?: DeliveryChannel;
  scheduledFor?: Date | null;
  expiresAt?: Date | null;
}

// Zod schemas for validation
export const notificationTypeSchema = z.enum([
  "task_assigned",
  "task_updated",
  "task_reassigned",
  "task_completed",
  "task_deleted",
  "task_due_soon",
  "task_overdue",
  "appointment_scheduled",
  "appointment_rescheduled",
  "appointment_cancelled",
  "appointment_reminder",
]);

export const notificationCategorySchema = z.enum([
  "tasks",
  "appointments",
  "properties",
  "contacts",
  "deals",
  "system",
]);

export const notificationPrioritySchema = z.enum([
  "low",
  "normal",
  "high",
  "urgent",
]);

export const deliveryChannelSchema = z.enum(["in_app", "email", "push", "sms"]);

export const entityTypeSchema = z.enum([
  "task",
  "appointment",
  "property",
  "listing",
  "contact",
  "deal",
  "prospect",
  "document",
]);

export const createNotificationSchema = z.object({
  userId: z.string().nullable().optional(),
  fromUserId: z.string().nullable().optional(),
  type: notificationTypeSchema,
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  actionUrl: z.string().max(500).nullable().optional(),
  priority: notificationPrioritySchema.optional().default("normal"),
  category: notificationCategorySchema,
  entityType: entityTypeSchema.nullable().optional(),
  entityId: z.bigint().nullable().optional(),
  metadata: z.record(z.unknown()).optional().default({}),
  deliveryChannel: deliveryChannelSchema.optional().default("in_app"),
  scheduledFor: z.date().nullable().optional(),
  expiresAt: z.date().nullable().optional(),
});

// Reminder timeframes
export type TaskReminderTimeframe = "1_week" | "48h" | "24h" | "12h" | "2h" | "1h" | "1_day" | "same_day";
export type AppointmentReminderTimeframe = "30_min" | "1h" | "12h" | "1_day" | "travel_time";

// Metadata types for specific notifications
export interface TaskNotificationMetadata extends Record<string, unknown> {
  taskTitle: string;
  taskDescription?: string;
  dueDate?: string;
  dueTime?: string;
  urgency?: number;
  category?: string;
  listingId?: string;
  contactId?: string;
  // Listing data for email display
  listing?: {
    listingId: string;
    title: string | null;
    referenceNumber: string | null;
    price: string;
    listingType: string;
    propertyType: string | null;
    bedrooms: number | null;
    bathrooms: string | null;
    squareMeter: number | null;
    builtSurfaceArea?: number | null;
    city: string | null;
    province?: string | null;
    agentName: string | null;
    imageUrl: string | null;
    imageUrls?: string[];
    street?: string | null;
  };
  // Contact data for email display (backward compatibility)
  contact?: {
    contactId: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    isOwner?: boolean;
    isBuyer?: boolean;
  };
  // Owner contact data (from listingContacts table)
  owner?: {
    contactId: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
  };
  // Buyer contact data (from listingContacts table)
  buyer?: {
    contactId: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
  };
  // For task_updated notification
  updatedFields?: string[];
  // For task_reassigned notification
  previousAssigneeId?: string;
  previousAssigneeName?: string;
  newAssigneeName?: string;
  // For task_deleted notification
  deletedByName?: string;
  // For task reminders
  timeframe?: string;
  reminderType?: string;
  // For task events
  assignedByName?: string;
  completedByName?: string;
  reassignedByName?: string;
  // Assigner contact information (who assigned the task)
  assignerEmail?: string;
  assignerPhone?: string;
  assignerName?: string;
  // Completer contact information (who completed the task)
  completerEmail?: string;
  completerPhone?: string;
  completerName?: string;
}

export interface AppointmentNotificationMetadata extends Record<string, unknown> {
  appointmentTitle: string;
  datetimeStart: string;
  datetimeEnd: string;
  contactName?: string;
  propertyAddress?: string;
  previousDatetime?: string;
  reminderType?: AppointmentReminderTimeframe;
  appointmentType?: string;
  cancellationReason?: string;
  scheduledByName?: string;
  rescheduledByName?: string;
  cancelledByName?: string;
  location?: string;
  // Listing data for email display
  listing?: {
    listingId: string;
    title: string | null;
    referenceNumber: string | null;
    price: string;
    listingType: string;
    propertyType: string | null;
    bedrooms: number | null;
    bathrooms: string | null;
    squareMeter: number | null;
    builtSurfaceArea?: number | null;
    city: string | null;
    province?: string | null;
    agentName: string | null;
    imageUrl: string | null;
    imageUrls?: string[];
    street?: string | null;
  };
  // Contact data for email display (backward compatibility)
  contact?: {
    contactId: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    isOwner?: boolean;
    isBuyer?: boolean;
  };
  // Owner contact data (from listingContacts table)
  owner?: {
    contactId: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
  };
  // Buyer contact data (from listingContacts table)
  buyer?: {
    contactId: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
  };
}
