/**
 * Appointment Reminder Email Template
 *
 * Generates email content for appointment reminders at various timeframes:
 * - 24 hours before
 * - 12 hours before
 * - 1 hour before
 * - 30 minutes before
 * - Travel time notification
 */

import { generateNotificationEmailBase } from "./notification-base";
import type {
  Notification,
  AppointmentNotificationMetadata,
} from "~/types/notifications";

export interface AppointmentReminderMetadata extends AppointmentNotificationMetadata {
  reminderTimeframe?: "24h" | "12h" | "1h" | "30min" | "travel_time";
  appointmentType?: "visita" | "firma" | "reunion" | "llamada" | "cierre" | "viaje";
  travelTime?: number; // in minutes
  location?: string;
  directionsUrl?: string;
}

export function generateAppointmentReminderEmail(
  notification: Notification,
): { subject: string; html: string; text: string } {
  const metadata = notification.metadata as AppointmentReminderMetadata;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
  const actionUrl = notification.actionUrl
    ? `${baseUrl}${notification.actionUrl}`
    : null;

  // Determine reminder timeframe
  const timeframe = metadata.reminderTimeframe ?? "24h";
  const isUrgent = timeframe === "1h" || timeframe === "30min" || timeframe === "travel_time";

  // Build subject and message based on timeframe
  let subject = notification.title;
  let detailedMessage = notification.message;

  // Get appointment type label
  const appointmentTypeLabels: Record<string, string> = {
    visita: "Visita",
    firma: "Firma",
    reunion: "Reunión",
    llamada: "Llamada",
    cierre: "Cierre",
    viaje: "Viaje",
  };
  const appointmentTypeLabel = metadata.appointmentType
    ? appointmentTypeLabels[metadata.appointmentType] ?? metadata.appointmentType
    : "Cita";

  // Customize message based on timeframe
  if (metadata.appointmentTitle) {
    const appointmentTitle = metadata.appointmentTitle;
    
    switch (timeframe) {
      case "24h":
        subject = `Recordatorio: Cita mañana - ${appointmentTypeLabel}`;
        detailedMessage = `Tienes una cita programada para mañana: ${appointmentTitle}`;
        break;
      case "12h":
        subject = `Recordatorio: Cita en 12 horas - ${appointmentTypeLabel}`;
        detailedMessage = `Recordatorio: Tu cita es en 12 horas: ${appointmentTitle}`;
        break;
      case "1h":
        subject = `⏰ Tu cita es en 1 hora - ${appointmentTypeLabel}`;
        detailedMessage = `Tu cita comienza en 1 hora: ${appointmentTitle}`;
        break;
      case "30min":
        subject = `⏰ Tu cita es en 30 minutos - ${appointmentTypeLabel}`;
        detailedMessage = `Tu cita comienza en 30 minutos: ${appointmentTitle}. ¡Prepárate para salir!`;
        break;
      case "travel_time":
        subject = `🚗 Es hora de salir - Cita: ${appointmentTypeLabel}`;
        detailedMessage = `Es hora de salir para tu cita: ${appointmentTitle}`;
        if (metadata.travelTime) {
          detailedMessage += `\n\nTiempo estimado de viaje: ${metadata.travelTime} minutos`;
        }
        break;
      default:
        detailedMessage = `Recordatorio: Tienes una cita programada: ${appointmentTitle}`;
    }
  }

  // Add datetime information
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
    
    if (timeframe === "24h") {
      detailedMessage += `\n\n📅 Fecha y hora: ${formattedDate} a las ${formattedTime}`;
    } else {
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

  // Add location information
  if (metadata.location) {
    detailedMessage += `\n\n📍 Ubicación: ${metadata.location}`;
  } else if (metadata.propertyAddress) {
    detailedMessage += `\n\n📍 Propiedad: ${metadata.propertyAddress}`;
  }

  // Add contact name if available
  if (metadata.contactName) {
    detailedMessage += `\n\n👤 Contacto: ${metadata.contactName}`;
  }

  // Add travel time and directions for travel_time reminder
  if (timeframe === "travel_time" && metadata.travelTime) {
    detailedMessage += `\n\n🚗 Tiempo estimado de viaje: ${metadata.travelTime} minutos`;
    if (metadata.directionsUrl) {
      detailedMessage += `\n\n🗺️ Direcciones: ${metadata.directionsUrl}`;
    }
  }

  // Add preparation notes for urgent reminders
  if (isUrgent) {
    detailedMessage += `\n\n💡 Últimos recordatorios:`;
    if (timeframe === "travel_time") {
      detailedMessage += `\n- Verifica que tengas todo lo necesario`;
      detailedMessage += `\n- Revisa el tráfico antes de salir`;
    } else if (timeframe === "30min") {
      detailedMessage += `\n- Prepárate para salir pronto`;
      detailedMessage += `\n- Revisa los detalles de la cita`;
    } else if (timeframe === "1h") {
      detailedMessage += `\n- Revisa los detalles de la cita`;
      detailedMessage += `\n- Prepara todo lo necesario`;
    }
  }

  // Determine action label
  let actionLabel = "Ver cita";
  if (timeframe === "travel_time") {
    actionLabel = "Ver direcciones";
  } else if (isUrgent) {
    actionLabel = "Ver detalles de la cita";
  }

  const { html, text } = generateNotificationEmailBase(
    subject,
    detailedMessage,
    actionUrl ?? metadata.directionsUrl ?? null,
    actionLabel,
  );

  return {
    subject,
    html,
    text,
  };
}

