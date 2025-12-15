/**
 * Customer Appointment Reminder Email Template
 *
 * Generates customer-facing email content for appointment reminders.
 * Uses friendly, professional tone suitable for external customers.
 */

import { generateNotificationEmailBase } from "./notification-base";

export interface CustomerAppointmentReminderMetadata {
  appointmentTitle: string;
  appointmentType: "visita" | "firma" | "reunion" | "llamada" | "cierre" | "viaje";
  datetimeStart: string;
  datetimeEnd?: string;
  reminderTimeframe: "24h" | "12h" | "1h" | "30min" | "travel_time";
  contactName?: string; // Agent/representative name
  contactPhone?: string;
  contactEmail?: string;
  location?: string;
  propertyAddress?: string;
  travelTime?: number; // in minutes
  directionsUrl?: string;
  preparationNotes?: string;
  cancellationPolicy?: string;
}

export function generateCustomerAppointmentReminderEmail(
  metadata: CustomerAppointmentReminderMetadata,
): { subject: string; html: string; text: string } {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";

  const timeframe = metadata.reminderTimeframe;
  const isUrgent = timeframe === "1h" || timeframe === "30min" || timeframe === "travel_time";

  // Appointment type labels
  const appointmentTypeLabels: Record<string, string> = {
    visita: "Visita",
    firma: "Firma",
    reunion: "Reunión",
    llamada: "Llamada",
    cierre: "Cierre",
    viaje: "Viaje",
  };
  const appointmentTypeLabel = appointmentTypeLabels[metadata.appointmentType] ?? metadata.appointmentType;

  // Build subject and message based on timeframe
  let subject = "";
  let message = "";

  switch (timeframe) {
    case "24h":
      subject = `Recordatorio: Cita mañana - ${appointmentTypeLabel}`;
      message = `Tienes una cita programada para mañana:`;
      break;
    case "12h":
      subject = `Recordatorio: Cita en 12 horas - ${appointmentTypeLabel}`;
      message = `Recordatorio: Tu cita es en 12 horas:`;
      break;
    case "1h":
      subject = `⏰ Tu cita es en 1 hora - ${appointmentTypeLabel}`;
      message = `Tu cita comienza en 1 hora:`;
      break;
    case "30min":
      subject = `⏰ Tu cita es en 30 minutos - ${appointmentTypeLabel}`;
      message = `Tu cita comienza en 30 minutos. ¡Prepárate para salir!`;
      break;
    case "travel_time":
      subject = `Es hora de salir - Cita: ${appointmentTypeLabel}`;
      message = `Es hora de salir para tu cita:`;
      if (metadata.travelTime) {
        message += `\n\nTiempo estimado de viaje: ${metadata.travelTime} minutos`;
      }
      break;
  }

  message += `\n\n${metadata.appointmentTitle}`;

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
    message += `\n\n📅 Fecha y hora: ${formattedDate} a las ${formattedTime}`;

    if (metadata.datetimeEnd) {
      const endDate = new Date(metadata.datetimeEnd);
      const endTime = endDate.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
      message += ` - ${endTime}`;
    }
  }

  // Add location information
  if (metadata.location) {
    message += `\n\n📍 Ubicación: ${metadata.location}`;
  } else if (metadata.propertyAddress) {
    message += `\n\n📍 Propiedad: ${metadata.propertyAddress}`;
  }

  // Add contact information
  if (metadata.contactName) {
    message += `\n\n👤 Tu agente: ${metadata.contactName}`;
    if (metadata.contactPhone) {
      message += `\n📞 Teléfono: ${metadata.contactPhone}`;
    }
    if (metadata.contactEmail) {
      message += `\n📧 Email: ${metadata.contactEmail}`;
    }
  }

  // Add travel time and directions for travel_time reminder
  if (timeframe === "travel_time" && metadata.travelTime) {
    message += `\n\n🚗 Tiempo estimado de viaje: ${metadata.travelTime} minutos`;
    if (metadata.directionsUrl) {
      message += `\n\n🗺️ Direcciones: ${metadata.directionsUrl}`;
    }
  }

  // Add preparation notes
  if (metadata.preparationNotes) {
    message += `\n\n💡 Notas importantes:\n${metadata.preparationNotes}`;
  } else if (isUrgent) {
    message += `\n\n💡 Recordatorios:`;
    if (timeframe === "travel_time") {
      message += `\n- Verifica que tengas todo lo necesario`;
      message += `\n- Revisa el tráfico antes de salir`;
    } else if (timeframe === "30min") {
      message += `\n- Prepárate para salir pronto`;
      message += `\n- Revisa los detalles de la cita`;
    } else if (timeframe === "1h") {
      message += `\n- Revisa los detalles de la cita`;
      message += `\n- Prepara todo lo necesario`;
    }
  }

  // Add cancellation policy for 24h reminder
  if (timeframe === "24h" && metadata.cancellationPolicy) {
    message += `\n\nℹ️ Política de cancelación: ${metadata.cancellationPolicy}`;
  }

  // Determine action URL and label
  let actionUrl: string | null = null;
  let actionLabel = "Ver detalles de la cita";
  
  if (timeframe === "travel_time" && metadata.directionsUrl) {
    actionUrl = metadata.directionsUrl;
    actionLabel = "Ver direcciones";
  } else {
    // Link to customer portal or appointment confirmation page
    actionUrl = `${baseUrl}/cita/confirmacion`;
    if (timeframe === "24h" || timeframe === "12h") {
      actionLabel = "Confirmar o reprogramar cita";
    }
  }

  const { html, text } = generateNotificationEmailBase(
    subject,
    message,
    actionUrl,
    actionLabel,
  );

  return {
    subject,
    html,
    text,
  };
}


