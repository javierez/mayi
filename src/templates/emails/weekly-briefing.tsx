/**
 * Weekly Briefing Email Template
 *
 * Generates unified weekly briefing email that can include:
 * - Tasks only
 * - Appointments only
 * - Both tasks and appointments
 * Based on configuration flags.
 */

import type { Task } from "~/lib/data";
import type { Appointment } from "~/lib/data";
import { generateTaskBriefingEmail } from "./task-briefing";
import { generateAppointmentBriefingEmail } from "./appointment-briefing";

export interface WeeklyBriefingEmailData {
  tasks?: Task[];
  appointments?: Appointment[];
  includeTasks: boolean;
  includeAppointments: boolean;
  dateRange?: string; // "Semana del [start] al [end]"
}

export function generateWeeklyBriefingEmail(
  data: WeeklyBriefingEmailData,
): { subject: string; html: string; text: string } {
  const { tasks = [], appointments = [], includeTasks, includeAppointments, dateRange } = data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";

  const hasTasks = includeTasks && tasks.length > 0;
  const hasAppointments = includeAppointments && appointments.length > 0;

  // If only one type, use the specific template
  if (hasTasks && !hasAppointments) {
    return generateTaskBriefingEmail({
      tasks,
      briefingType: "weekly",
      dateRange,
    });
  }

  if (hasAppointments && !hasTasks) {
    return generateAppointmentBriefingEmail({
      appointments,
      briefingType: "weekly",
      dateRange,
    });
  }

  // Combined briefing
  const taskCount = tasks.length;
  const appointmentCount = appointments.length;
  const totalCount = taskCount + appointmentCount;

  // Build subject
  let subject = "Resumen semanal";
  if (hasTasks && hasAppointments) {
    subject = `Resumen semanal - ${taskCount} tarea${taskCount > 1 ? "s" : ""} y ${appointmentCount} cita${appointmentCount > 1 ? "s" : ""}`;
  } else if (hasTasks) {
    subject = `Resumen semanal de tareas - ${taskCount} tarea${taskCount > 1 ? "s" : ""}`;
  } else if (hasAppointments) {
    subject = `Resumen semanal de citas - ${appointmentCount} cita${appointmentCount > 1 ? "s" : ""}`;
  }
  if (dateRange) {
    subject += ` - ${dateRange}`;
  }

  // Generate individual sections
  let tasksHtml = "";
  let appointmentsHtml = "";

  if (hasTasks) {
    const taskBriefing = generateTaskBriefingEmail({
      tasks,
      briefingType: "weekly",
      dateRange,
    });
    // Extract the content section from the task briefing HTML
    const taskContentRegex = /<div style="background: white[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<div style="text-align: center/;
    const taskContentMatch = taskContentRegex.exec(taskBriefing.html);
    if (taskContentMatch?.[1]) {
      tasksHtml = taskContentMatch[1];
    }
  }

  if (hasAppointments) {
    const appointmentBriefing = generateAppointmentBriefingEmail({
      appointments,
      briefingType: "weekly",
      dateRange,
    });
    // Extract the content section from the appointment briefing HTML
    const appointmentContentRegex = /<div style="background: white[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<div style="text-align: center/;
    const appointmentContentMatch = appointmentContentRegex.exec(appointmentBriefing.html);
    if (appointmentContentMatch?.[1]) {
      appointmentsHtml = appointmentContentMatch[1];
    }
  }

  // Build intro message
  let introMessage = "Resumen de tus actividades para la próxima semana:";
  if (hasTasks && hasAppointments) {
    introMessage = `Resumen de tus tareas y citas para la próxima semana:`;
  } else if (hasTasks) {
    introMessage = `Resumen de tus tareas para la próxima semana:`;
  } else if (hasAppointments) {
    introMessage = `Resumen de tus citas para la próxima semana:`;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject} - Vesta CRM</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1f2937; margin-bottom: 10px;">
            Vesta <span style="background: linear-gradient(to right, #f59e0b, #f43f5e); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">CRM</span>
          </h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">
            📋 Resumen Semanal
          </h2>
          
          <p style="margin-bottom: 24px; font-size: 16px; color: #374151;">
            ${introMessage}
          </p>
          
          ${totalCount === 0 ? `
            <div style="background: white; padding: 24px; border-radius: 6px; text-align: center;">
              <p style="color: #6b7280; font-size: 16px;">No tienes actividades programadas para esta semana.</p>
            </div>
          ` : `
            <div style="background: white; padding: 24px; border-radius: 6px; margin-bottom: 24px;">
              ${hasTasks ? `
                <div style="margin-bottom: ${hasAppointments ? "32px" : "0"}">
                  <h3 style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #3b82f6;">
                    📋 Tareas (${taskCount})
                  </h3>
                  ${tasksHtml}
                </div>
              ` : ""}
              
              ${hasAppointments ? `
                <div>
                  <h3 style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #3b82f6;">
                    📅 Citas (${appointmentCount})
                  </h3>
                  ${appointmentsHtml}
                </div>
              ` : ""}
            </div>
          `}
          
          <div style="text-align: center; margin-top: 30px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            ${hasTasks ? `
              <a href="${baseUrl}/tareas" 
                 style="background: linear-gradient(to right, #f59e0b, #f43f5e); 
                        color: white; 
                        padding: 14px 32px; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        font-weight: bold; 
                        font-size: 16px;
                        display: inline-block;
                        margin-right: ${hasAppointments ? "12px" : "0"}">
                Ver todas las tareas
              </a>
            ` : ""}
            ${hasAppointments ? `
              <a href="${baseUrl}/calendario" 
                 style="background: linear-gradient(to right, #f59e0b, #f43f5e); 
                        color: white; 
                        padding: 14px 32px; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        font-weight: bold; 
                        font-size: 16px;
                        display: inline-block;">
                Ver calendario
              </a>
            ` : ""}
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
          <p>Este email fue enviado por Vesta CRM</p>
          <p>© ${new Date().getFullYear()} Vesta CRM. Todos los derechos reservados.</p>
        </div>
      </body>
    </html>
  `;

  // Build text version
  let tasksText = "";
  let appointmentsText = "";

  if (hasTasks) {
    const taskBriefing = generateTaskBriefingEmail({
      tasks,
      briefingType: "weekly",
      dateRange,
    });
    // Extract text content
    const taskTextRegex = /TAREAS:([\s\S]*?)(?=Ver todas|$)/;
    const taskTextMatch = taskTextRegex.exec(taskBriefing.text);
    if (taskTextMatch?.[1]) {
      tasksText = `\n📋 TAREAS:\n${taskTextMatch[1]}`;
    }
  }

  if (hasAppointments) {
    const appointmentBriefing = generateAppointmentBriefingEmail({
      appointments,
      briefingType: "weekly",
      dateRange,
    });
    // Extract text content
    const appointmentTextRegex = /📅 [^:]+:([\s\S]*?)(?=Ver calendario|$)/;
    const appointmentTextMatch = appointmentTextRegex.exec(appointmentBriefing.text);
    if (appointmentTextMatch?.[1]) {
      appointmentsText = `\n📅 CITAS:\n${appointmentTextMatch[1]}`;
    }
  }

  const text = `
${subject} - Vesta CRM

${introMessage}

${totalCount === 0 ? "No tienes actividades programadas para esta semana." : `${tasksText}${appointmentsText}`}

${hasTasks ? `Ver todas las tareas: ${baseUrl}/tareas` : ""}
${hasAppointments ? `Ver calendario: ${baseUrl}/calendario` : ""}

Este email fue enviado por Vesta CRM
© ${new Date().getFullYear()} Vesta CRM. Todos los derechos reservados.
  `;

  return { subject, html, text };
}

