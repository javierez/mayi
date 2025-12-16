/**
 * Weekly Briefing Email Template
 *
 * Generates a refined weekly briefing email with tasks and appointments
 * for the upcoming week. Uses TABLE-BASED layouts for maximum
 * email client compatibility.
 *
 * IMPORTANT: Uses BOX-BASED design with white backgrounds consistent with
 * task and appointment notification templates for visual consistency.
 */

import type { Task } from "~/lib/data";
import type { Appointment } from "~/lib/data";

export interface WeeklyBriefingEmailData {
  tasks?: Task[];
  appointments?: Appointment[];
  includeTasks: boolean;
  includeAppointments: boolean;
  dateRange?: string;
}

interface DayGroup {
  date: Date;
  dayLabel: string;
  tasks: Task[];
  appointments: Appointment[];
}

export function generateWeeklyBriefingEmail(
  data: WeeklyBriefingEmailData,
): { subject: string; html: string; text: string } {
  const {
    tasks = [],
    appointments = [],
    includeTasks,
    includeAppointments,
    dateRange,
  } = data;
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";

  const hasTasks = includeTasks && tasks.length > 0;
  const hasAppointments = includeAppointments && appointments.length > 0;
  const taskCount = tasks.length;
  const appointmentCount = appointments.length;

  // Build subject
  let subject = "Tu semana";
  if (hasTasks && hasAppointments) {
    subject = `Tu semana - ${taskCount} tarea${taskCount > 1 ? "s" : ""}, ${appointmentCount} cita${appointmentCount > 1 ? "s" : ""}`;
  } else if (hasTasks) {
    subject = `Tu semana - ${taskCount} tarea${taskCount > 1 ? "s" : ""}`;
  } else if (hasAppointments) {
    subject = `Tu semana - ${appointmentCount} cita${appointmentCount > 1 ? "s" : ""}`;
  }
  if (dateRange) {
    subject += ` | ${dateRange}`;
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

  // Group items by day
  const groupByDay = (): DayGroup[] => {
    const groups: Map<string, DayGroup> = new Map();

    // Process tasks
    if (hasTasks) {
      tasks.forEach((task) => {
        if (task.dueDate) {
          const date = new Date(task.dueDate);
          const dateKey = date.toISOString().split("T")[0] ?? "";
          const existing = groups.get(dateKey);
          if (existing) {
            existing.tasks.push(task);
          } else {
            groups.set(dateKey, {
              date,
              dayLabel: date.toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              }),
              tasks: [task],
              appointments: [],
            });
          }
        }
      });
    }

    // Process appointments
    if (hasAppointments) {
      appointments.forEach((apt) => {
        const date = new Date(apt.datetimeStart);
        const dateKey = date.toISOString().split("T")[0] ?? "";
        const existing = groups.get(dateKey);
        if (existing) {
          existing.appointments.push(apt);
        } else {
          groups.set(dateKey, {
            date,
            dayLabel: date.toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }),
            tasks: [],
            appointments: [apt],
          });
        }
      });
    }

    // Sort by date
    return Array.from(groups.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
  };

  const dayGroups = groupByDay();

  // Build task box HTML (white box with gray border)
  const buildTaskBox = (task: Task) => {
    const urgencyLabel = task.urgency ? (urgencyLabels[task.urgency] ?? "Normal") : "Normal";
    const taskUrl = `${baseUrl}/tareas?taskId=${task.taskId.toString()}`;
    const timeStr = task.dueTime ? `a las ${task.dueTime}` : "";

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
                  ${urgencyLabel}${timeStr ? ` · ${timeStr}` : ""}
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
                  ${timeStr}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  };

  // Build day section HTML (white boxes)
  const buildDaySection = (group: DayGroup, isFirst: boolean) => {
    const capitalizedDay =
      group.dayLabel.charAt(0).toUpperCase() + group.dayLabel.slice(1);
    const itemCount = group.tasks.length + group.appointments.length;

    // Sort tasks by urgency, appointments by time
    const sortedTasks = [...group.tasks].sort(
      (a, b) => (b.urgency ?? 2) - (a.urgency ?? 2),
    );
    const sortedAppointments = [...group.appointments].sort(
      (a, b) =>
        new Date(a.datetimeStart).getTime() -
        new Date(b.datetimeStart).getTime(),
    );

    return `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 16px; ${!isFirst ? "border-top: 1px solid #f3f4f6; padding-top: 16px;" : ""}">
        <!-- Day Header Box -->
        <tr>
          <td style="padding-bottom: 8px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
              <tr>
                <td style="padding: 10px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${capitalizedDay}
                      </td>
                      <td align="right" style="font-size: 14px; font-weight: 400; color: #111827;">
                        ${itemCount}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Day Items -->
        <tr>
          <td>
            ${sortedTasks.map(buildTaskBox).join("")}
            ${sortedAppointments.map(buildAppointmentBox).join("")}
          </td>
        </tr>
      </table>
    `;
  };

  // Build summary stats (white boxes)
  const buildSummaryStats = () => {
    const stats: string[] = [];

    if (hasTasks) {
      stats.push(`
        <table cellpadding="0" cellspacing="0" border="0" width="48%" style="border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
          <tr>
            <td style="padding: 10px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">
                    Tareas
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 22px; font-weight: 600; color: #111827; line-height: 1;">
                    ${taskCount}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `);
    }

    if (hasAppointments) {
      stats.push(`
        <table cellpadding="0" cellspacing="0" border="0" width="48%" style="border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
          <tr>
            <td style="padding: 10px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">
                    Citas
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 22px; font-weight: 600; color: #111827; line-height: 1;">
                    ${appointmentCount}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `);
    }

    if (stats.length === 0) return "";

    return `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 16px;">
        <tr>
          <td>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                ${stats.map((stat, i) => `<td width="48%" valign="top">${stat}</td>${i < stats.length - 1 ? '<td width="4%"></td>' : ""}`).join("")}
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  };

  // Empty state
  const emptyStateHtml = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
      <tr>
        <td align="center" style="padding: 32px 20px;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            No tienes actividades programadas para esta semana.
          </p>
          <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 13px;">
            Aprovecha para planificar nuevos objetivos.
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

  // Build content section
  let contentHtml = "";
  if (hasTasks || hasAppointments) {
    contentHtml = `
      ${buildSummaryStats()}
      ${dayGroups.map((group, i) => buildDaySection(group, i === 0)).join("")}
    `;
  } else {
    contentHtml = emptyStateHtml;
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
                            Resumen semanal
                          </span>
                        </td>
                        <td align="right">
                          <span style="font-size: 12px; color: #6b7280;">
                            ${dateRange ?? "Proxima semana"}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 8px;">
                          <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #111827; line-height: 1.3;">
                            Planifica tu semana
                          </h1>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 6px;">
                          <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                            ${hasTasks || hasAppointments ? "Aqui tienes un vistazo de lo que viene." : "Tu semana esta libre para nuevos proyectos."}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 24px 32px;">
                    ${contentHtml}
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
  textContent += `${dateRange ?? "Proxima semana"}\n\n`;

  if (!hasTasks && !hasAppointments) {
    textContent += "No tienes actividades programadas para esta semana.\n";
  } else {
    // Summary
    textContent += `RESUMEN: ${taskCount} tareas, ${appointmentCount} citas\n\n`;

    // Group by day
    dayGroups.forEach((group) => {
      const capitalizedDay =
        group.dayLabel.charAt(0).toUpperCase() + group.dayLabel.slice(1);
      textContent += `${capitalizedDay.toUpperCase()}:\n`;

      group.tasks.forEach((task) => {
        const urgencyLabel = task.urgency ? (urgencyLabels[task.urgency] ?? "Normal") : "Normal";
        textContent += `  - [Tarea] ${task.title} [${urgencyLabel}]\n`;
      });

      group.appointments.forEach((apt) => {
        const startDate = new Date(apt.datetimeStart);
        const timeStr = startDate.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const typeLabel = apt.type
          ? (appointmentTypeLabels[apt.type.toLowerCase()] ?? apt.type)
          : "Cita";
        textContent += `  - [${typeLabel}] ${apt.title} - ${timeStr}\n`;
      });

      textContent += "\n";
    });

    if (hasTasks) {
      textContent += `Ver tareas: ${baseUrl}/tareas\n`;
    }
    if (hasAppointments) {
      textContent += `Ver calendario: ${baseUrl}/calendario\n`;
    }
  }

  textContent += `\n---\nVesta CRM`;

  return { subject, html, text: textContent };
}
