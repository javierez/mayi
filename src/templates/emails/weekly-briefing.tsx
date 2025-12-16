/**
 * Weekly Briefing Email Template
 *
 * Generates a refined weekly briefing email with tasks and appointments
 * for the upcoming week. Uses TABLE-BASED layouts for maximum
 * email client compatibility.
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

  // Urgency labels and colors
  const urgencyConfig: Record<
    number,
    { label: string; color: string; bgColor: string }
  > = {
    1: { label: "Baja", color: "#6b7280", bgColor: "#f9fafb" },
    2: { label: "Normal", color: "#3b82f6", bgColor: "#eff6ff" },
    3: { label: "Alta", color: "#f59e0b", bgColor: "#fffbeb" },
    4: { label: "Urgente", color: "#f97316", bgColor: "#fff7ed" },
    5: { label: "Critica", color: "#dc2626", bgColor: "#fef2f2" },
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

  // Default config for fallback
  const defaultConfig = { label: "Normal", color: "#3b82f6", bgColor: "#eff6ff" };

  // Build task item HTML (compact version for weekly view)
  const buildTaskItem = (task: Task) => {
    const config = task.urgency
      ? (urgencyConfig[task.urgency] ?? defaultConfig)
      : defaultConfig;
    const taskUrl = `${baseUrl}/tareas?taskId=${task.taskId.toString()}`;
    const timeStr = task.dueTime ? `${task.dueTime}` : "";

    return `
      <tr>
        <td style="padding: 8px 0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="6" style="background: ${config.color}; border-radius: 1px;"></td>
              <td style="padding-left: 10px;">
                <a href="${taskUrl}" style="color: #111827; text-decoration: none; font-size: 13px; font-weight: 500;">
                  ${task.title}
                </a>
                ${timeStr ? `<span style="color: #9ca3af; font-size: 11px; margin-left: 8px;">${timeStr}</span>` : ""}
              </td>
              <td align="right" width="60">
                <span style="display: inline-block; padding: 1px 6px; background: ${config.bgColor}; color: ${config.color}; font-size: 10px; font-weight: 500; border-radius: 8px;">
                  ${config.label}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  };

  // Build appointment item HTML (compact version for weekly view)
  const buildAppointmentItem = (appointment: Appointment) => {
    const startDate = new Date(appointment.datetimeStart);
    const endDate = new Date(appointment.datetimeEnd);
    const timeStr = `${startDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} - ${endDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;

    const typeLabel = appointment.type
      ? (appointmentTypeLabels[appointment.type.toLowerCase()] ??
        appointment.type)
      : "Cita";

    const appointmentUrl = `${baseUrl}/calendario?appointmentId=${appointment.appointmentId.toString()}`;

    return `
      <tr>
        <td style="padding: 8px 0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="6" style="background: #3b82f6; border-radius: 1px;"></td>
              <td style="padding-left: 10px;">
                <a href="${appointmentUrl}" style="color: #111827; text-decoration: none; font-size: 13px; font-weight: 500;">
                  ${appointment.title}
                </a>
                <span style="color: #9ca3af; font-size: 11px; margin-left: 8px;">${timeStr}</span>
              </td>
              <td align="right" width="60">
                <span style="display: inline-block; padding: 1px 6px; background: #eff6ff; color: #3b82f6; font-size: 10px; font-weight: 500; border-radius: 8px;">
                  ${typeLabel}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  };

  // Build day section HTML
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
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px; ${!isFirst ? "border-top: 1px solid #f3f4f6; padding-top: 20px;" : ""}">
        <tr>
          <td style="padding-bottom: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td>
                  <span style="font-size: 14px; font-weight: 600; color: #111827;">
                    ${capitalizedDay}
                  </span>
                </td>
                <td align="right">
                  <span style="display: inline-block; padding: 2px 8px; background: #f3f4f6; color: #6b7280; font-size: 11px; font-weight: 500; border-radius: 8px;">
                    ${itemCount} ${itemCount === 1 ? "item" : "items"}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        ${sortedTasks.map(buildTaskItem).join("")}
        ${sortedAppointments.map(buildAppointmentItem).join("")}
      </table>
    `;
  };

  // Build summary stats
  const buildSummaryStats = () => {
    const criticalCount = tasks.filter((t) => t.urgency === 5).length;
    const urgentCount = tasks.filter(
      (t) => t.urgency === 3 || t.urgency === 4,
    ).length;

    const stats: string[] = [];

    if (hasTasks) {
      stats.push(`
        <td style="padding: 12px 16px; background: #f9fafb; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: 600; color: #111827; line-height: 1;">${taskCount}</div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">Tareas</div>
        </td>
      `);
    }

    if (hasAppointments) {
      stats.push(`
        <td style="padding: 12px 16px; background: #f9fafb; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: 600; color: #3b82f6; line-height: 1;">${appointmentCount}</div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">Citas</div>
        </td>
      `);
    }

    if (criticalCount > 0) {
      stats.push(`
        <td style="padding: 12px 16px; background: #fef2f2; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: 600; color: #dc2626; line-height: 1;">${criticalCount}</div>
          <div style="font-size: 11px; color: #dc2626; margin-top: 4px;">Criticas</div>
        </td>
      `);
    } else if (urgentCount > 0) {
      stats.push(`
        <td style="padding: 12px 16px; background: #fffbeb; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: 600; color: #f59e0b; line-height: 1;">${urgentCount}</div>
          <div style="font-size: 11px; color: #f59e0b; margin-top: 4px;">Urgentes</div>
        </td>
      `);
    }

    if (stats.length === 0) return "";

    // Add spacing between cells
    const spacedStats = stats.flatMap((stat, i) =>
      i < stats.length - 1
        ? [stat, '<td width="12"></td>']
        : [stat],
    );

    return `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          ${spacedStats.join("")}
        </tr>
      </table>
    `;
  };

  // Empty state
  const emptyStateHtml = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding: 32px 20px;">
          <div style="font-size: 32px; margin-bottom: 12px;">&#127796;</div>
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
        const config = task.urgency
          ? (urgencyConfig[task.urgency] ?? defaultConfig)
          : defaultConfig;
        textContent += `  - [Tarea] ${task.title} [${config.label}]\n`;
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
