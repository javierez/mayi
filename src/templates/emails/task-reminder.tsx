/**
 * Task Reminder Email Template
 *
 * Generates email content for task reminders at various timeframes:
 * - 1 week before
 * - 48 hours before
 * - 24 hours before
 * - 12 hours before
 * - 2 hours before
 * - 1 hour before
 */

import { generateNotificationEmailBase } from "./notification-base";
import type { Notification, TaskNotificationMetadata } from "~/types/notifications";

export interface TaskReminderMetadata extends TaskNotificationMetadata {
  reminderTimeframe?: "1_week" | "48h" | "24h" | "12h" | "2h" | "1h";
  hoursUntilDue?: number;
  daysUntilDue?: number;
}

export function generateTaskReminderEmail(
  notification: Notification,
): { subject: string; html: string; text: string } {
  const metadata = notification.metadata as TaskReminderMetadata;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
  const actionUrl = notification.actionUrl
    ? `${baseUrl}${notification.actionUrl}`
    : null;

  // Determine reminder timeframe and urgency level
  const timeframe = metadata.reminderTimeframe ?? "24h";
  const isUrgent = timeframe === "2h" || timeframe === "1h" || timeframe === "12h";
  const isCritical = timeframe === "1h" || timeframe === "2h";

  // Build subject and message based on timeframe
  let subject = notification.title;
  let detailedMessage = notification.message;

  // Customize message based on timeframe
  if (metadata.taskTitle) {
    const taskTitle = metadata.taskTitle;
    
    switch (timeframe) {
      case "1_week":
        subject = `Recordatorio: Tarea vence en 1 semana - ${taskTitle}`;
        detailedMessage = `La tarea "${taskTitle}" vence en 1 semana.`;
        break;
      case "48h":
        subject = `Recordatorio: Tarea vence en 48 horas - ${taskTitle}`;
        detailedMessage = `La tarea "${taskTitle}" vence en 48 horas.`;
        break;
      case "24h":
        subject = `⚠️ Tarea vence mañana - ${taskTitle}`;
        detailedMessage = `La tarea "${taskTitle}" vence mañana.`;
        break;
      case "12h":
        subject = `⚠️ Tarea vence en 12 horas - ${taskTitle}`;
        detailedMessage = `La tarea "${taskTitle}" vence en 12 horas.`;
        break;
      case "2h":
        subject = `🚨 Tarea vence en 2 horas - ${taskTitle}`;
        detailedMessage = `La tarea "${taskTitle}" vence en 2 horas. ¡Acción requerida!`;
        break;
      case "1h":
        subject = `🚨 URGENTE: Tarea vence en 1 hora - ${taskTitle}`;
        detailedMessage = `La tarea "${taskTitle}" vence en 1 hora. ¡Acción inmediata requerida!`;
        break;
      default:
        detailedMessage = `Recordatorio: La tarea "${taskTitle}" está próxima a vencer.`;
    }
  }

  // Add due date information
  if (metadata.dueDate) {
    const dueDate = new Date(metadata.dueDate);
    const formattedDate = dueDate.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    detailedMessage += `\n\n📅 Fecha de vencimiento: ${formattedDate}`;
    if (metadata.dueTime) {
      detailedMessage += ` a las ${metadata.dueTime}`;
    }
  }

  // Add time until due if calculated
  if (metadata.hoursUntilDue !== undefined) {
    if (metadata.hoursUntilDue >= 24) {
      const days = Math.floor(metadata.hoursUntilDue / 24);
      detailedMessage += `\n\n⏰ Tiempo restante: ${days} día${days > 1 ? "s" : ""}`;
    } else {
      detailedMessage += `\n\n⏰ Tiempo restante: ${metadata.hoursUntilDue} hora${metadata.hoursUntilDue > 1 ? "s" : ""}`;
    }
  } else if (metadata.daysUntilDue !== undefined) {
    detailedMessage += `\n\n⏰ Tiempo restante: ${metadata.daysUntilDue} día${metadata.daysUntilDue > 1 ? "s" : ""}`;
  }

  // Add urgency information
  if (metadata.urgency) {
    const urgencyLabels: Record<number, string> = {
      1: "Baja",
      2: "Media",
      3: "Alta",
      4: "Urgente",
      5: "Crítica",
    };
    const urgencyLabel = urgencyLabels[metadata.urgency] ?? "Normal";
    const urgencyEmoji = metadata.urgency >= 4 ? "🔴" : metadata.urgency >= 3 ? "🟡" : "🟢";
    detailedMessage += `\n\n${urgencyEmoji} Urgencia: ${urgencyLabel}`;
  }

  // Add category if available
  if (metadata.category) {
    detailedMessage += `\n\n📁 Categoría: ${metadata.category}`;
  }

  // Add context if available
  if (metadata.contactId) {
    detailedMessage += `\n\n👤 Relacionada con un contacto`;
  }
  if (metadata.listingId) {
    detailedMessage += `\n\n🏠 Relacionada con una propiedad`;
  }

  // Determine action label based on urgency
  let actionLabel = "Ver tarea";
  if (isCritical) {
    actionLabel = "Ver tarea urgente";
  } else if (isUrgent) {
    actionLabel = "Ver tarea";
  }

  const { html, text } = generateNotificationEmailBase(
    subject,
    detailedMessage,
    actionUrl,
    actionLabel,
  );

  return {
    subject,
    html,
    text,
  };
}

