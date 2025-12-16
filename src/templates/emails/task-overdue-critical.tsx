/**
 * Task Overdue Immediate Email Template
 *
 * Generates urgent email content for tasks that have just become overdue.
 * This template is used for immediate notifications based on configured urgency levels.
 * Uses TABLE-BASED layouts with box format for maximum email client compatibility.
 */

import type { Notification, TaskNotificationMetadata } from "~/types/notifications";

export function generateTaskOverdueImmediateEmail(
  notification: Notification,
): { subject: string; html: string; text: string } {
  const metadata = notification.metadata as TaskNotificationMetadata;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
  const actionUrl = notification.actionUrl
    ? `${baseUrl}${notification.actionUrl}`
    : `${baseUrl}/tareas`;

  // Build structured message HTML with box format
  const taskDetailsSections: string[] = [];

  // Task title box
  if (metadata.taskTitle) {
    taskDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
        <tr>
          <td style="padding: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">
                  Tarea
                </td>
              </tr>
              <tr>
                <td style="font-size: 14px; font-weight: 400; color: #111827; line-height: 1.4;">
                  <a href="${actionUrl}" style="color: #111827; text-decoration: none;">
                    ${metadata.taskTitle}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  // Due date box
  if (metadata.dueDate) {
    const dueDate = new Date(metadata.dueDate);
    const formattedDate = dueDate.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const dueTimeStr = metadata.dueTime ? ` a las ${metadata.dueTime}` : "";
    
    // Calculate how overdue
    const now = new Date();
    const overdueDate = new Date(metadata.dueDate);
    const hoursOverdue = Math.floor((now.getTime() - overdueDate.getTime()) / (1000 * 60 * 60));
    const daysOverdue = Math.floor(hoursOverdue / 24);
    
    let overdueText = "";
    if (daysOverdue > 0) {
      overdueText = `Vencida hace ${daysOverdue} día${daysOverdue > 1 ? "s" : ""}`;
    } else if (hoursOverdue > 0) {
      overdueText = `Vencida hace ${hoursOverdue} hora${hoursOverdue > 1 ? "s" : ""}`;
    } else {
      overdueText = "Recién vencida";
    }

    taskDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
        <tr>
          <td style="padding: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">
                  Vencimiento
                </td>
              </tr>
              <tr>
                <td style="font-size: 14px; font-weight: 400; color: #111827; line-height: 1.4;">
                  ${formattedDate}${dueTimeStr}
                </td>
              </tr>
              <tr>
                <td style="padding-top: 6px; font-size: 12px; color: #dc2626; font-weight: 500;">
                  ⏰ ${overdueText}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  // Urgency box (use actual urgency from metadata)
  const urgencyLabels: Record<number, string> = {
    1: "Baja",
    2: "Normal",
    3: "Alta",
    4: "Urgente",
    5: "Crítica",
  };
  
  const urgencyLabel = metadata.urgency
    ? (urgencyLabels[metadata.urgency] ?? `Nivel ${metadata.urgency}`)
    : "Normal";
  
  // Color based on urgency level
  const urgencyColor = metadata.urgency === 5 ? "#dc2626" : metadata.urgency === 4 ? "#f59e0b" : "#6b7280";
  
  taskDetailsSections.push(`
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
      <tr>
        <td style="padding: 10px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">
                Urgencia
              </td>
            </tr>
            <tr>
              <td style="font-size: 14px; font-weight: 400; color: ${urgencyColor}; line-height: 1.4;">
                ${urgencyLabel}${metadata.urgency ? ` (Nivel ${metadata.urgency})` : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `);

  // Category box
  if (metadata.category) {
    taskDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
        <tr>
          <td style="padding: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">
                  Categoría
                </td>
              </tr>
              <tr>
                <td style="font-size: 14px; font-weight: 400; color: #111827; line-height: 1.4;">
                  ${metadata.category}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  const structuredMessageHtml = taskDetailsSections.length > 0
    ? `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 2px 0 6px 0;">
        <tr>
          <td>
            ${taskDetailsSections.join("")}
          </td>
        </tr>
      </table>
    `
    : "";

  const mainMessage = "Esta tarea crítica requiere atención inmediata.";

  // Build HTML using table-based layout
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
        <style>
          @media only screen and (max-width: 600px) {
            .email-container { width: 100% !important; padding: 16px !important; }
            .email-padding { padding: 0 20px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 560px; background: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);" class="email-container">

                <!-- Header -->
                <tr>
                  <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #f3f4f6;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td>
                          <span style="font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">
                            Tarea vencida
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 8px;">
                          <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: ${metadata.urgency === 5 ? "#dc2626" : metadata.urgency === 4 ? "#f59e0b" : "#111827"}; line-height: 1.3;">
                            ${metadata.urgency === 5 ? "🚨" : metadata.urgency === 4 ? "⚠️" : "📋"} ${notification.title}
                          </h1>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 6px;">
                          <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                            ${mainMessage}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 24px 32px;">
                    ${structuredMessageHtml}
                  </td>
                </tr>

                <!-- Action Button -->
                <tr>
                  <td style="padding: 0 32px 32px 32px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="padding-top: 8px;">
                          <a href="${actionUrl}"
                             style="display: inline-block; padding: 10px 20px; background: ${metadata.urgency === 5 ? "#dc2626" : metadata.urgency === 4 ? "#f59e0b" : "#111827"}; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 500; border-radius: 6px;">
                            Ver tarea
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px; background: #f9fafb; border-radius: 0 0 12px 12px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center">
                          <span style="font-size: 12px; color: #9ca3af;">
                            Vesta CRM
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  // Build text version
  let textContent = `${notification.title}\n\n`;
  textContent += `${mainMessage}\n\n`;
  
  if (metadata.taskTitle) {
    textContent += `Tarea: ${metadata.taskTitle}\n`;
  }
  
  if (metadata.dueDate) {
    const dueDate = new Date(metadata.dueDate);
    const formattedDate = dueDate.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    textContent += `Vencimiento: ${formattedDate}${metadata.dueTime ? ` a las ${metadata.dueTime}` : ""}\n`;
  }
  
  textContent += `Urgencia: ${urgencyLabel}${metadata.urgency ? ` (Nivel ${metadata.urgency})` : ""}\n`;
  
  if (metadata.category) {
    textContent += `Categoría: ${metadata.category}\n`;
  }
  
  textContent += `\nVer tarea: ${actionUrl}\n\n`;
  textContent += `---\nVesta CRM`;

  // Build subject based on urgency level
  const urgencyEmoji = metadata.urgency === 5 ? "🚨" : metadata.urgency === 4 ? "⚠️" : "📋";
  const urgencyPrefix = metadata.urgency === 5 ? "URGENTE" : metadata.urgency === 4 ? "IMPORTANTE" : "";
  const subject = urgencyPrefix 
    ? `${urgencyEmoji} ${urgencyPrefix}: ${metadata.taskTitle || "Tarea vencida"}`
    : `${urgencyEmoji} ${metadata.taskTitle || "Tarea vencida"}`;

  return {
    subject,
    html,
    text: textContent,
  };
}


