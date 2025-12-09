/**
 * Task Notification Email Template
 *
 * Generates email content for task-related notifications
 * with task-specific details like due dates, urgency, etc.
 */

import { generateNotificationEmailBase } from "./notification-base";
import type { Notification, TaskNotificationMetadata } from "~/types/notifications";

export function generateTaskNotificationEmail(
  notification: Notification,
): { subject: string; html: string; text: string } {
  const metadata = notification.metadata as TaskNotificationMetadata;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  const actionUrl = notification.actionUrl
    ? `${baseUrl}${notification.actionUrl}`
    : null;

  // Build detailed message with task information
  let detailedMessage = notification.message;

  // Add due date information if available
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

  // Add urgency information if available
  if (metadata.urgency) {
    const urgencyLabels: Record<number, string> = {
      1: "Baja",
      2: "Media",
      3: "Alta",
      4: "Urgente",
    };
    const urgencyLabel =
      urgencyLabels[metadata.urgency as keyof typeof urgencyLabels] || "Normal";
    detailedMessage += `\n\n⚡ Urgencia: ${urgencyLabel}`;
  }

  // Add category if available
  if (metadata.category) {
    detailedMessage += `\n\n📁 Categoría: ${metadata.category}`;
  }

  const { html, text } = generateNotificationEmailBase(
    notification.title,
    detailedMessage,
    actionUrl,
    "Ver tarea",
  );

  return {
    subject: notification.title,
    html,
    text,
  };
}

