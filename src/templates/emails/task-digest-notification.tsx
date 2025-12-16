/**
 * Task Digest Email Template
 *
 * Generates email content for digest emails containing multiple overdue tasks
 */

import type { Task } from "~/lib/data";

export interface TaskDigestEmailData {
  tasks: Task[];
  digestType: "weekly" | "daily";
}

export function generateTaskDigestEmail(
  data: TaskDigestEmailData,
): { subject: string; html: string; text: string } {
  const { tasks, digestType } = data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";

  const taskCount = tasks.length;
  const isCritical = digestType === "daily";
  
  // Build subject
  const subject = isCritical
    ? `🚨 ${taskCount} tarea${taskCount > 1 ? "s" : ""} crítica${taskCount > 1 ? "s" : ""} vencida${taskCount > 1 ? "s" : ""}`
    : `📋 ${taskCount} tarea${taskCount > 1 ? "s" : ""} vencida${taskCount > 1 ? "s" : ""}`;

  // Build task list HTML
  const urgencyLabels: Record<number, string> = {
    1: "Baja",
    2: "Media",
    3: "Alta",
    4: "Muy Alta",
    5: "Crítica",
  };

  // Build task box HTML (white box with gray border)
  const buildTaskBox = (task: Task) => {
    const urgencyLabel = task.urgency
      ? (urgencyLabels[task.urgency] ?? "Normal")
      : "Normal";
    
    const dueDateStr = task.dueDate
      ? new Date(task.dueDate).toLocaleDateString("es-ES", {
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      : "";
    
    const dueTimeStr = task.dueTime ?? "";
    const taskUrl = `${baseUrl}/tareas?taskId=${task.taskId.toString()}`;

    return `
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
                  <a href="${taskUrl}" style="color: #111827; text-decoration: none;">
                    ${task.title}
                  </a>
                </td>
              </tr>
              ${task.description ? `
              <tr>
                <td style="padding-top: 6px; font-size: 13px; color: #6b7280; line-height: 1.4;">
                  ${task.description}
                </td>
              </tr>
              ` : ""}
              <tr>
                <td style="padding-top: 6px; font-size: 12px; color: #6b7280;">
                  ${urgencyLabel}${dueDateStr ? ` · ${dueDateStr}` : ""}${dueTimeStr ? ` a las ${dueTimeStr}` : ""}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  };

  const taskItemsHtml = tasks.map(buildTaskBox).join("");

  // Build main message
  const introMessage = isCritical
    ? `Tienes <strong>${taskCount} tarea${taskCount > 1 ? "s" : ""} crítica${taskCount > 1 ? "s" : ""} vencida${taskCount > 1 ? "s" : ""}</strong> que requieren atención inmediata.`
    : `Tienes <strong>${taskCount} tarea${taskCount > 1 ? "s" : ""} vencida${taskCount > 1 ? "s" : ""}</strong> pendiente${taskCount > 1 ? "s" : ""} de completar.`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
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
                            ${isCritical ? "Tareas críticas vencidas" : "Resumen de tareas vencidas"}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 8px;">
                          <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #111827; line-height: 1.3;">
                            ${isCritical ? "🚨 Tareas Críticas Vencidas" : "📋 Resumen de Tareas Vencidas"}
                          </h1>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 6px;">
                          <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                            ${introMessage.replace(/<strong>/g, "").replace(/<\/strong>/g, "")}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 24px 32px;">
                    ${taskItemsHtml}
                  </td>
                </tr>

                <!-- Action Button -->
                <tr>
                  <td style="padding: 0 32px 32px 32px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="padding-top: 8px;">
                          <a href="${baseUrl}/tareas"
                             style="display: inline-block; padding: 10px 20px; background: #111827; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 500; border-radius: 6px;">
                            Ver todas las tareas
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
  const taskItemsText = tasks.map((task, index) => {
    const urgencyLabel = task.urgency
      ? (urgencyLabels[task.urgency] ?? "Normal")
      : "Normal";
    
    const dueDateStr = task.dueDate
      ? new Date(task.dueDate).toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Sin fecha";
    
    const dueTimeStr = task.dueTime ? ` a las ${task.dueTime}` : "";
    const taskUrl = `${baseUrl}/tareas?taskId=${task.taskId.toString()}`;

    return `
${index + 1}. ${task.title}
   ${task.description ? `   ${task.description}` : ""}
   📅 Vencimiento: ${dueDateStr}${dueTimeStr}
   ⚡ Urgencia: ${urgencyLabel}
   ${task.category ? `   📁 Categoría: ${task.category}` : ""}
   Ver tarea: ${taskUrl}
`;
  }).join("\n");

  const text = `
${subject} - Vesta CRM

${introMessage.replace(/<strong>/g, "").replace(/<\/strong>/g, "")}

TAREAS:

${taskItemsText}

Ver todas las tareas: ${baseUrl}/tareas

Este email fue enviado por Vesta CRM
© ${new Date().getFullYear()} Vesta CRM. Todos los derechos reservados.
  `;

  return { subject, html, text };
}

