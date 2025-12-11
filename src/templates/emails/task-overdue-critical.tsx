/**
 * Critical Task Overdue Email Template
 *
 * Generates urgent email content for critical tasks that have just become overdue.
 * This template is designed to grab immediate attention and bypass quiet hours.
 */

import { generateNotificationEmailBase } from "./notification-base";
import type { Notification, TaskNotificationMetadata } from "~/types/notifications";

export function generateCriticalTaskOverdueEmail(
  notification: Notification,
): { subject: string; html: string; text: string } {
  const metadata = notification.metadata as TaskNotificationMetadata;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
  const actionUrl = notification.actionUrl
    ? `${baseUrl}${notification.actionUrl}`
    : null;

  // Build urgent message
  let detailedMessage = notification.message;
  
  if (metadata.taskTitle) {
    detailedMessage = `🚨 TAREA CRÍTICA VENCIDA: ${metadata.taskTitle}`;
    detailedMessage += `\n\nEsta tarea crítica requiere atención inmediata.`;
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
    
    // Calculate how overdue
    const now = new Date();
    const overdueDate = new Date(metadata.dueDate);
    const hoursOverdue = Math.floor((now.getTime() - overdueDate.getTime()) / (1000 * 60 * 60));
    const daysOverdue = Math.floor(hoursOverdue / 24);
    
    if (daysOverdue > 0) {
      detailedMessage += `\n\n⏰ Vencida hace ${daysOverdue} día${daysOverdue > 1 ? "s" : ""}`;
    } else if (hoursOverdue > 0) {
      detailedMessage += `\n\n⏰ Vencida hace ${hoursOverdue} hora${hoursOverdue > 1 ? "s" : ""}`;
    } else {
      detailedMessage += `\n\n⏰ Recién vencida`;
    }
  }

  // Add urgency information (should always be 5 for critical)
  detailedMessage += `\n\n⚡ Urgencia: Crítica (Nivel 5)`;

  // Add category if available
  if (metadata.category) {
    detailedMessage += `\n\n📁 Categoría: ${metadata.category}`;
  }

  // Add contact or listing context if available
  if (metadata.contactId) {
    detailedMessage += `\n\n👤 Relacionada con un contacto`;
  }
  if (metadata.listingId) {
    detailedMessage += `\n\n🏠 Relacionada con una propiedad`;
  }

  const { html, text } = generateNotificationEmailBase(
    notification.title,
    detailedMessage,
    actionUrl,
    "Ver tarea urgente",
  );

  // Override subject to ensure urgency is clear
  const subject = `🚨 URGENTE: ${metadata.taskTitle || "Tarea crítica vencida"}`;

  return {
    subject,
    html,
    text,
  };
}

