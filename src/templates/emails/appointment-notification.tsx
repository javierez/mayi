/**
 * Appointment Notification Email Template
 *
 * Generates email content for appointment-related notifications
 * with appointment-specific details like datetime, location, etc.
 * Enhanced to handle appointment events: scheduled, rescheduled, cancelled
 */

import { generateNotificationEmailBase } from "./notification-base";
import type {
  Notification,
  AppointmentNotificationMetadata,
} from "~/types/notifications";

export function generateAppointmentNotificationEmail(
  notification: Notification,
): { subject: string; html: string; text: string } {
  const metadata = notification.metadata as AppointmentNotificationMetadata;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
  const actionUrl = notification.actionUrl
    ? `${baseUrl}${notification.actionUrl}`
    : null;

  // Build detailed message with appointment information
  let detailedMessage = notification.message;

  // Handle appointment-specific event types with enhanced messaging
  if (notification.type === "appointment_scheduled") {
    // Appointment scheduled notification
    if (metadata.appointmentTitle) {
      detailedMessage = `Se ha programado una nueva cita para ti: ${metadata.appointmentTitle}`;
    }
    if (metadata.scheduledByName) {
      detailedMessage += `\n\n👤 Programada por: ${metadata.scheduledByName}`;
    }
  } else if (notification.type === "appointment_rescheduled") {
    // Appointment rescheduled notification
    if (metadata.appointmentTitle) {
      detailedMessage = `Tu cita ha sido reprogramada: ${metadata.appointmentTitle}`;
    }
    if (metadata.previousDatetime) {
      const previousDate = new Date(metadata.previousDatetime);
      const formattedPreviousDate = previousDate.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedPreviousTime = previousDate.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
      detailedMessage += `\n\n🔄 Fecha anterior: ${formattedPreviousDate} a las ${formattedPreviousTime}`;
    }
    if (metadata.rescheduledByName) {
      detailedMessage += `\n\n👤 Reprogramada por: ${metadata.rescheduledByName}`;
    }
  } else if (notification.type === "appointment_cancelled") {
    // Appointment cancelled notification
    if (metadata.appointmentTitle) {
      detailedMessage = `Tu cita ha sido cancelada: ${metadata.appointmentTitle}`;
    }
    if (metadata.cancelledByName) {
      detailedMessage += `\n\n👤 Cancelada por: ${metadata.cancelledByName}`;
    }
    // Add cancellation reason if available in metadata
    if (metadata.cancellationReason) {
      detailedMessage += `\n\n📝 Motivo: ${metadata.cancellationReason}`;
    }
  }

  // Add datetime information if available
  if (metadata.datetimeStart) {
    const startDate = new Date(metadata.datetimeStart);
    const formattedDate = startDate.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = startDate.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    
    if (notification.type === "appointment_rescheduled") {
      detailedMessage += `\n\n📅 Nueva fecha y hora: ${formattedDate} a las ${formattedTime}`;
    } else if (notification.type !== "appointment_cancelled") {
    detailedMessage += `\n\n📅 Fecha y hora: ${formattedDate} a las ${formattedTime}`;
    }

    // Add end time if available
    if (metadata.datetimeEnd) {
      const endDate = new Date(metadata.datetimeEnd);
      const endTime = endDate.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
      detailedMessage += ` - ${endTime}`;
    }
  }

  // Add contact name if available
  if (metadata.contactName) {
    detailedMessage += `\n\n👤 Contacto: ${metadata.contactName}`;
  }

  // Add property address if available
  if (metadata.propertyAddress) {
    detailedMessage += `\n\n📍 Propiedad: ${metadata.propertyAddress}`;
  }

  // Add location if available
  if (metadata.location) {
    detailedMessage += `\n\n📍 Ubicación: ${metadata.location}`;
  }

  // Add reminder type context if available
  if (metadata.reminderType) {
    if (metadata.reminderType === "30_min") {
      detailedMessage += `\n\n⏰ Tu cita comienza en 30 minutos. ¡Prepárate!`;
    } else if (metadata.reminderType === "1_day") {
      detailedMessage += `\n\n📆 Tienes una cita mañana. Revisa los detalles.`;
    }
  }

  // Determine action label based on notification type
  let actionLabel = "Ver cita";
  if (notification.type === "appointment_scheduled") {
    actionLabel = "Ver cita programada";
  } else if (notification.type === "appointment_rescheduled") {
    actionLabel = "Ver cita reprogramada";
  } else if (notification.type === "appointment_cancelled") {
    actionLabel = "Ver citas";
  } else if (notification.type === "appointment_reminder") {
    actionLabel = "Ver detalles de la cita";
  }

  const { html, text } = generateNotificationEmailBase(
    notification.title,
    detailedMessage,
    actionUrl,
    actionLabel,
  );

  return {
    subject: notification.title,
    html,
    text,
  };
}

