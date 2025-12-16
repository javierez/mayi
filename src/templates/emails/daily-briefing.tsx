/**
 * Daily Briefing Email Template
 *
 * Generates a refined daily briefing email with tasks and appointments
 * for today. Uses TABLE-BASED layouts for maximum email client compatibility.
 *
 * IMPORTANT: Uses BOX-BASED design with white backgrounds consistent with
 * task and appointment notification templates for visual consistency.
 */

import type { Task } from "~/lib/data";
import type { Appointment } from "~/lib/data";

export interface DailyBriefingEmailData {
  tasks?: Task[];
  appointments?: Appointment[];
  includeTasks: boolean;
  includeAppointments: boolean;
  date?: string;
}

export function generateDailyBriefingEmail(
  data: DailyBriefingEmailData,
): { subject: string; html: string; text: string } {
  const {
    tasks = [],
    appointments = [],
    includeTasks,
    includeAppointments,
    date,
  } = data;
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";

  const hasTasks = includeTasks && tasks.length > 0;
  const hasAppointments = includeAppointments && appointments.length > 0;
  const taskCount = tasks.length;
  const appointmentCount = appointments.length;

  // Build subject
  let subject = "Buenos dias";
  if (hasTasks && hasAppointments) {
    subject = `Tu dia de hoy - ${taskCount} tarea${taskCount > 1 ? "s" : ""}, ${appointmentCount} cita${appointmentCount > 1 ? "s" : ""}`;
  } else if (hasTasks) {
    subject = `Tu dia de hoy - ${taskCount} tarea${taskCount > 1 ? "s" : ""}`;
  } else if (hasAppointments) {
    subject = `Tu dia de hoy - ${appointmentCount} cita${appointmentCount > 1 ? "s" : ""}`;
  }
  if (date) {
    subject += ` | ${date}`;
  }

  // Urgency labels
  const urgencyLabels: Record<number, string> = {
    1: "Baja",
    2: "Normal",
    3: "Alta",
    4: "Urgente",
    5: "Critica",
  };

  // Appointment type labels
  const appointmentTypeLabels: Record<string, string> = {
    visita: "Visita",
    firma: "Firma",
    reunion: "Reunion",
    llamada: "Llamada",
    cierre: "Cierre",
    viaje: "Viaje",
  };

  // Build task box HTML (white box with gray border)
  const buildTaskBox = (task: Task) => {
    const urgencyLabel = task.urgency ? (urgencyLabels[task.urgency] ?? "Normal") : "Normal";
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

  // Build appointment box HTML (white box with gray border)
  const buildAppointmentBox = (appointment: Appointment) => {
    const startDate = new Date(appointment.datetimeStart);
    const endDate = new Date(appointment.datetimeEnd);

    const timeStr = `${startDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} - ${endDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
    const dateStr = startDate.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    const typeLabel = appointment.type
      ? (appointmentTypeLabels[appointment.type.toLowerCase()] ?? appointment.type)
      : "Cita";

    const appointmentUrl = `${baseUrl}/calendario?appointmentId=${appointment.appointmentId.toString()}`;

    return `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
        <tr>
          <td style="padding: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">
                  ${typeLabel}
                </td>
              </tr>
              <tr>
                <td style="font-size: 14px; font-weight: 400; color: #111827; line-height: 1.4;">
                  <a href="${appointmentUrl}" style="color: #111827; text-decoration: none;">
                    ${appointment.title}
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding-top: 6px; font-size: 12px; color: #6b7280;">
                  ${dateStr} · ${timeStr}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  };

  // Build tasks section
  let tasksSectionHtml = "";
  if (hasTasks) {
    const sortedTasks = [...tasks].sort(
      (a, b) => (b.urgency ?? 2) - (a.urgency ?? 2),
    );
    tasksSectionHtml = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 16px;">
        <tr>
          <td style="padding-bottom: 8px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
              <tr>
                <td style="padding: 10px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
                        Tareas pendientes
                      </td>
                      <td align="right" style="font-size: 14px; font-weight: 400; color: #111827;">
                        ${taskCount}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            ${sortedTasks.map(buildTaskBox).join("")}
          </td>
        </tr>
      </table>
    `;
  }

  // Build appointments section
  let appointmentsSectionHtml = "";
  if (hasAppointments) {
    const sortedAppointments = [...appointments].sort(
      (a, b) =>
        new Date(a.datetimeStart).getTime() -
        new Date(b.datetimeStart).getTime(),
    );
    appointmentsSectionHtml = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 16px;">
        <tr>
          <td style="padding-bottom: 8px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
              <tr>
                <td style="padding: 10px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
                        Citas programadas
                      </td>
                      <td align="right" style="font-size: 14px; font-weight: 400; color: #111827;">
                        ${appointmentCount}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            ${sortedAppointments.map(buildAppointmentBox).join("")}
          </td>
        </tr>
      </table>
    `;
  }

  // Empty state
  const emptyStateHtml = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
      <tr>
        <td align="center" style="padding: 32px 20px;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            No tienes actividades programadas para hoy.
          </p>
          <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 13px;">
            Disfruta de un dia tranquilo.
          </p>
        </td>
      </tr>
    </table>
  `;

  // Build action buttons
  let actionButtonsHtml = "";
  if (hasTasks || hasAppointments) {
    const buttons: string[] = [];
    if (hasTasks) {
      buttons.push(`
        <td style="padding: 0 6px;">
          <a href="${baseUrl}/tareas"
             style="display: inline-block; padding: 10px 20px; background: #111827; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 500; border-radius: 6px;">
            Ver tareas
          </a>
        </td>
      `);
    }
    if (hasAppointments) {
      buttons.push(`
        <td style="padding: 0 6px;">
          <a href="${baseUrl}/calendario"
             style="display: inline-block; padding: 10px 20px; background: ${hasTasks ? "#ffffff" : "#111827"}; color: ${hasTasks ? "#111827" : "#ffffff"}; text-decoration: none; font-size: 13px; font-weight: 500; border-radius: 6px; ${hasTasks ? "border: 1px solid #e5e7eb;" : ""}">
            Ver calendario
          </a>
        </td>
      `);
    }
    actionButtonsHtml = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding-top: 8px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                ${buttons.join("")}
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }

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
                            Resumen diario
                          </span>
                        </td>
                        <td align="right">
                          <span style="font-size: 12px; color: #6b7280;">
                            ${date ?? new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 8px;">
                          <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #111827; line-height: 1.3;">
                            Buenos dias
                          </h1>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 6px;">
                          <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                            ${hasTasks || hasAppointments ? "Esto es lo que tienes programado para hoy." : "Tu dia esta libre de compromisos."}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 24px 32px;">
                    ${hasTasks || hasAppointments ? `${tasksSectionHtml}${appointmentsSectionHtml}` : emptyStateHtml}
                  </td>
                </tr>

                <!-- Action Buttons -->
                ${
                  hasTasks || hasAppointments
                    ? `
                <tr>
                  <td style="padding: 0 32px 32px 32px;">
                    ${actionButtonsHtml}
                  </td>
                </tr>
                `
                    : ""
                }

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
  let textContent = `${subject}\n\n`;
  textContent += `${date ?? new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}\n\n`;

  if (!hasTasks && !hasAppointments) {
    textContent += "No tienes actividades programadas para hoy.\n";
  } else {
    if (hasTasks) {
      textContent += `TAREAS PENDIENTES (${taskCount}):\n`;
      tasks.forEach((task) => {
        const urgencyLabel = task.urgency ? (urgencyLabels[task.urgency] ?? "Normal") : "Normal";
        const dueDateStr = task.dueDate
          ? new Date(task.dueDate).toLocaleDateString("es-ES", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })
          : "";
        textContent += `- ${task.title} [${urgencyLabel}]${dueDateStr ? ` - ${dueDateStr}` : ""}\n`;
      });
      textContent += `\nVer tareas: ${baseUrl}/tareas\n\n`;
    }

    if (hasAppointments) {
      textContent += `CITAS PROGRAMADAS (${appointmentCount}):\n`;
      appointments.forEach((apt) => {
        const startDate = new Date(apt.datetimeStart);
        const timeStr = startDate.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const typeLabel = apt.type
          ? (appointmentTypeLabels[apt.type.toLowerCase()] ?? apt.type)
          : "Cita";
        textContent += `- ${apt.title} [${typeLabel}] - ${timeStr}\n`;
      });
      textContent += `\nVer calendario: ${baseUrl}/calendario\n`;
    }
  }

  textContent += `\n---\nVesta CRM`;

  return { subject, html, text: textContent };
}
