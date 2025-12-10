/**
 * Appointment Notification Email Template
 *
 * Generates email content for appointment-related notifications
 * with appointment-specific details like datetime, location, etc.
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
    detailedMessage += `\n\n📅 Fecha y hora: ${formattedDate} a las ${formattedTime}`;

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

  // Add previous datetime if rescheduled
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

  // Add contact name if available
  if (metadata.contactName) {
    detailedMessage += `\n\n👤 Contacto: ${metadata.contactName}`;
  }

  // Add property address if available
  if (metadata.propertyAddress) {
    detailedMessage += `\n\n📍 Propiedad: ${metadata.propertyAddress}`;
  }

  // Add reminder type context if available
  if (metadata.reminderType) {
    if (metadata.reminderType === "30_min") {
      detailedMessage += `\n\n⏰ Tu cita comienza en 30 minutos. ¡Prepárate!`;
    } else if (metadata.reminderType === "1_day") {
      detailedMessage += `\n\n📆 Tienes una cita mañana. Revisa los detalles.`;
    }
  }

  const { html, text } = generateNotificationEmailBase(
    notification.title,
    detailedMessage,
    actionUrl,
    "Ver cita",
  );

  return {
    subject: notification.title,
    html,
    text,
  };
}

