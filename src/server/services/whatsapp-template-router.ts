/**
 * WhatsApp Template Router
 *
 * Routes notifications to appropriate WhatsApp templates and extracts variables.
 * Templates are pre-approved in Twilio and documented in docs/whatsapp-templates.md
 */

import type { Notification } from "~/types/notifications";
import type {
  TaskNotificationMetadata,
  AppointmentNotificationMetadata,
} from "~/types/notifications";
import {
  WHATSAPP_TEMPLATE_SIDS,
  URGENCY_LABELS,
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_TIPS,
} from "~/types/whatsapp-templates";
import { env } from "~/env";

export interface TemplateRouteResult {
  templateSid: string;
  variables: Record<string, string>;
}

/**
 * Format urgency level for display
 */
function formatUrgency(urgency: number | undefined): string {
  return URGENCY_LABELS[urgency ?? 1] ?? "Normal";
}

/**
 * Format date for WhatsApp display (Spanish format)
 */
function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "No especificada";

  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format datetime for WhatsApp display
 */
function formatDateTime(
  dateStr: string | undefined | null,
  timeStr?: string | null,
): string {
  if (!dateStr) return "No especificada";

  const datePart = formatDate(dateStr);

  if (timeStr) {
    return `${datePart} a las ${timeStr}`;
  }

  return datePart;
}

/**
 * Format current datetime for Spanish display
 */
function formatCurrentDateTime(): string {
  const now = new Date();
  return now.toLocaleString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Build property address from listing metadata
 */
function buildPropertyAddress(
  listing: TaskNotificationMetadata["listing"] | AppointmentNotificationMetadata["listing"],
): string {
  if (!listing) return "N/A";

  const parts = [listing.street, listing.city, listing.province].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "N/A";
}

/**
 * Build contact display with type
 */
function buildContactDisplay(
  owner: TaskNotificationMetadata["owner"],
  buyer: TaskNotificationMetadata["buyer"],
  contact: TaskNotificationMetadata["contact"],
): { name: string; type: string; phone: string } {
  if (owner) {
    return {
      name: `${owner.firstName} ${owner.lastName}`.trim(),
      type: "Propietario",
      phone: owner.phone ?? "-",
    };
  }
  if (buyer) {
    return {
      name: `${buyer.firstName} ${buyer.lastName}`.trim(),
      type: "Comprador",
      phone: buyer.phone ?? "-",
    };
  }
  if (contact) {
    const type = contact.isOwner
      ? "Propietario"
      : contact.isBuyer
        ? "Comprador"
        : "Contacto";
    return {
      name: `${contact.firstName} ${contact.lastName}`.trim(),
      type,
      phone: contact.phone ?? "-",
    };
  }
  return { name: "No especificado", type: "-", phone: "-" };
}

/**
 * Get Vesta action URL
 */
function getVestaUrl(actionUrl: string | null): string {
  const baseUrl = env.APP_URL ?? "https://vesta.app";
  return actionUrl ? `${baseUrl}${actionUrl}` : `${baseUrl}/dashboard`;
}

/**
 * Get reminder tips for appointment type
 */
function getAppointmentTips(appointmentType: string | undefined): string {
  const type = (appointmentType ?? "visita").toLowerCase();
  return APPOINTMENT_TIPS[type] ?? APPOINTMENT_TIPS.visita ?? "";
}

/**
 * Route notification to WhatsApp template
 * Returns null if notification type is not supported
 */
export function routeToWhatsAppTemplate(
  notification: Notification,
): TemplateRouteResult | null {
  const vestaUrl = getVestaUrl(notification.actionUrl);

  // Task notifications
  if (notification.type === "task_assigned") {
    const meta = notification.metadata as TaskNotificationMetadata;
    const contact = buildContactDisplay(meta.owner, meta.buyer, meta.contact);

    return {
      templateSid: WHATSAPP_TEMPLATE_SIDS.task_assigned,
      variables: {
        "1": meta.taskTitle ?? notification.title,
        "2": meta.taskDescription ?? "-",
        "3": meta.assignerName ?? "Sistema",
        "4": formatDateTime(meta.dueDate, meta.dueTime),
        "5": formatUrgency(meta.urgency),
        "6": meta.category ?? "-",
        "7": buildPropertyAddress(meta.listing),
        "8": meta.listing?.referenceNumber ?? "-",
        "9": contact.name,
        "10": contact.type,
        "11": contact.phone,
        "12": vestaUrl,
      },
    };
  }

  if (notification.type === "task_completed") {
    const meta = notification.metadata as TaskNotificationMetadata;

    return {
      templateSid: WHATSAPP_TEMPLATE_SIDS.task_completed,
      variables: {
        "1": meta.taskTitle ?? notification.title,
        "2": meta.taskDescription ?? "-",
        "3": meta.completerName ?? "Sistema",
        "4": formatCurrentDateTime(),
        "5": buildPropertyAddress(meta.listing),
        "6": meta.listing?.referenceNumber ?? "-",
        "7": vestaUrl,
      },
    };
  }

  if (notification.type === "task_reassigned") {
    const meta = notification.metadata as TaskNotificationMetadata;
    const contact = buildContactDisplay(meta.owner, meta.buyer, meta.contact);

    return {
      templateSid: WHATSAPP_TEMPLATE_SIDS.task_reassigned,
      variables: {
        "1": meta.taskTitle ?? notification.title,
        "2": meta.taskDescription ?? "-",
        "3": meta.reassignedByName ?? "Sistema",
        "4": meta.newAssigneeName ?? "-",
        "5": formatDateTime(meta.dueDate, meta.dueTime),
        "6": formatUrgency(meta.urgency),
        "7": buildPropertyAddress(meta.listing),
        "8": meta.listing?.referenceNumber ?? "-",
        "9": contact.name,
        "10": contact.type,
        "11": contact.phone,
        "12": vestaUrl,
      },
    };
  }

  if (notification.type === "task_due_soon") {
    const meta = notification.metadata as TaskNotificationMetadata;
    const contact = buildContactDisplay(meta.owner, meta.buyer, meta.contact);

    // Format time remaining
    const timeframe = meta.timeframe ?? "";
    let timeRemaining = timeframe;
    if (timeframe === "1h") timeRemaining = "1 hora";
    else if (timeframe === "2h") timeRemaining = "2 horas";
    else if (timeframe === "12h") timeRemaining = "12 horas";
    else if (timeframe === "24h" || timeframe === "1_day") timeRemaining = "24 horas";
    else if (timeframe === "48h") timeRemaining = "48 horas";
    else if (timeframe === "1_week") timeRemaining = "1 semana";

    return {
      templateSid: WHATSAPP_TEMPLATE_SIDS.task_due_soon,
      variables: {
        "1": meta.taskTitle ?? notification.title,
        "2": meta.taskDescription ?? "-",
        "3": timeRemaining,
        "4": formatDateTime(meta.dueDate, meta.dueTime),
        "5": formatUrgency(meta.urgency),
        "6": buildPropertyAddress(meta.listing),
        "7": meta.listing?.referenceNumber ?? "-",
        "8": contact.name,
        "9": contact.type,
        "10": contact.phone,
        "11": vestaUrl,
      },
    };
  }

  if (notification.type === "task_overdue") {
    const meta = notification.metadata as TaskNotificationMetadata;
    const contact = buildContactDisplay(meta.owner, meta.buyer, meta.contact);

    // Calculate overdue time (simplified)
    const overdueText = "tiempo vencido";

    return {
      templateSid: WHATSAPP_TEMPLATE_SIDS.task_overdue,
      variables: {
        "1": meta.taskTitle ?? notification.title,
        "2": meta.taskDescription ?? "-",
        "3": overdueText,
        "4": formatDateTime(meta.dueDate, meta.dueTime),
        "5": formatUrgency(meta.urgency),
        "6": buildPropertyAddress(meta.listing),
        "7": meta.listing?.referenceNumber ?? "-",
        "8": contact.name,
        "9": contact.type,
        "10": contact.phone,
        "11": vestaUrl,
      },
    };
  }

  // Appointment notifications
  if (notification.type === "appointment_scheduled") {
    const meta = notification.metadata as AppointmentNotificationMetadata;
    const ownerInfo = meta.owner ?? meta.contact;
    const buyerInfo = meta.buyer;

    // Parse datetime
    const startDate = meta.datetimeStart ? new Date(meta.datetimeStart) : null;
    const endDate = meta.datetimeEnd ? new Date(meta.datetimeEnd) : null;

    const dateStr = startDate
      ? startDate.toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "No especificada";

    const startTime = startDate
      ? startDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
      : "-";

    const endTime = endDate
      ? endDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
      : "-";

    const appointmentType = meta.appointmentType ?? "visita";

    return {
      templateSid: WHATSAPP_TEMPLATE_SIDS.apt_scheduled,
      variables: {
        "1": meta.appointmentTitle ?? notification.title,
        "2": APPOINTMENT_TYPE_LABELS[appointmentType.toLowerCase()] ?? appointmentType,
        "3": dateStr,
        "4": startTime,
        "5": endTime,
        "6": meta.location ?? "-",
        "7": meta.scheduledByName ?? "Sistema",
        "8": buildPropertyAddress(meta.listing),
        "9": meta.listing?.referenceNumber ?? "-",
        "10": ownerInfo ? `${ownerInfo.firstName} ${ownerInfo.lastName}`.trim() : "-",
        "11": ownerInfo?.phone ?? "-",
        "12": buyerInfo ? `${buyerInfo.firstName} ${buyerInfo.lastName}`.trim() : "-",
        "13": buyerInfo?.phone ?? "-",
        "14": vestaUrl,
      },
    };
  }

  if (notification.type === "appointment_rescheduled") {
    const meta = notification.metadata as AppointmentNotificationMetadata;
    const ownerInfo = meta.owner ?? meta.contact;
    const buyerInfo = meta.buyer;

    const startDate = meta.datetimeStart ? new Date(meta.datetimeStart) : null;
    const dateStr = startDate
      ? startDate.toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "No especificada";

    const newTime = startDate
      ? startDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
      : "-";

    const appointmentType = meta.appointmentType ?? "visita";

    return {
      templateSid: WHATSAPP_TEMPLATE_SIDS.apt_rescheduled,
      variables: {
        "1": meta.appointmentTitle ?? notification.title,
        "2": APPOINTMENT_TYPE_LABELS[appointmentType.toLowerCase()] ?? appointmentType,
        "3": dateStr,
        "4": newTime,
        "5": meta.previousDatetime ?? "Fecha anterior",
        "6": meta.location ?? "-",
        "7": meta.rescheduledByName ?? "Sistema",
        "8": buildPropertyAddress(meta.listing),
        "9": meta.listing?.referenceNumber ?? "-",
        "10": ownerInfo ? `${ownerInfo.firstName} ${ownerInfo.lastName}`.trim() : "-",
        "11": ownerInfo?.phone ?? "-",
        "12": buyerInfo ? `${buyerInfo.firstName} ${buyerInfo.lastName}`.trim() : "-",
        "13": buyerInfo?.phone ?? "-",
        "14": vestaUrl,
      },
    };
  }

  if (notification.type === "appointment_cancelled") {
    const meta = notification.metadata as AppointmentNotificationMetadata;
    const ownerInfo = meta.owner ?? meta.contact;
    const buyerInfo = meta.buyer;

    const startDate = meta.datetimeStart ? new Date(meta.datetimeStart) : null;
    const dateStr = startDate
      ? startDate.toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "No especificada";

    const originalTime = startDate
      ? startDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
      : "-";

    const appointmentType = meta.appointmentType ?? "visita";

    return {
      templateSid: WHATSAPP_TEMPLATE_SIDS.apt_cancelled,
      variables: {
        "1": meta.appointmentTitle ?? notification.title,
        "2": APPOINTMENT_TYPE_LABELS[appointmentType.toLowerCase()] ?? appointmentType,
        "3": dateStr,
        "4": originalTime,
        "5": meta.location ?? "-",
        "6": meta.cancelledByName ?? "Sistema",
        "7": meta.cancellationReason ?? "No especificado",
        "8": buildPropertyAddress(meta.listing),
        "9": meta.listing?.referenceNumber ?? "-",
        "10": ownerInfo ? `${ownerInfo.firstName} ${ownerInfo.lastName}`.trim() : "-",
        "11": ownerInfo?.phone ?? "-",
        "12": buyerInfo ? `${buyerInfo.firstName} ${buyerInfo.lastName}`.trim() : "-",
        "13": buyerInfo?.phone ?? "-",
        "14": vestaUrl,
      },
    };
  }

  if (notification.type === "appointment_reminder") {
    const meta = notification.metadata as AppointmentNotificationMetadata;
    const ownerInfo = meta.owner ?? meta.contact;
    const buyerInfo = meta.buyer;

    const startDate = meta.datetimeStart ? new Date(meta.datetimeStart) : null;
    const dateStr = startDate
      ? startDate.toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "No especificada";

    const appointmentTime = startDate
      ? startDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
      : "-";

    const appointmentType = meta.appointmentType ?? "visita";

    // Format time until appointment
    const reminderType = meta.reminderType ?? "";
    const reminderTypeMap: Record<string, string> = {
      "30_min": "30 minutos",
      "30min": "30 minutos",
      "1h": "1 hora",
      "12h": "12 horas",
      "1_day": "24 horas",
      "24h": "24 horas",
      "travel_time": "tiempo de viaje",
    };
    const timeUntil = reminderTypeMap[reminderType] ?? reminderType;

    return {
      templateSid: WHATSAPP_TEMPLATE_SIDS.apt_reminder,
      variables: {
        "1": appointmentType.toLowerCase(),
        "2": meta.appointmentTitle ?? notification.title,
        "3": timeUntil,
        "4": dateStr,
        "5": appointmentTime,
        "6": meta.location ?? "-",
        "7": buildPropertyAddress(meta.listing),
        "8": meta.listing?.referenceNumber ?? "-",
        "9": ownerInfo ? `${ownerInfo.firstName} ${ownerInfo.lastName}`.trim() : "-",
        "10": ownerInfo?.phone ?? "-",
        "11": buyerInfo ? `${buyerInfo.firstName} ${buyerInfo.lastName}`.trim() : "-",
        "12": buyerInfo?.phone ?? "-",
        "13": getAppointmentTips(appointmentType),
        "14": vestaUrl,
      },
    };
  }

  // Unknown notification type
  console.warn(`[WhatsApp Router] Unknown notification type: ${notification.type}`);
  return null;
}
