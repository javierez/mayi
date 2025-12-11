/**
 * Appointment Briefing Email Template
 *
 * Generates email content for weekly and daily appointment briefings
 * that summarize upcoming appointments grouped by type.
 */

import type { Appointment } from "~/lib/data";

export interface AppointmentBriefingEmailData {
  appointments: Appointment[];
  briefingType: "weekly" | "daily";
  dateRange?: string; // For weekly: "Semana del [start] al [end]"
  date?: string; // For daily: "Fecha"
}

export function generateAppointmentBriefingEmail(
  data: AppointmentBriefingEmailData,
): { subject: string; html: string; text: string } {
  const { appointments, briefingType, dateRange, date } = data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";

  const appointmentCount = appointments.length;
  const isWeekly = briefingType === "weekly";

  // Build subject
  const subject = isWeekly
    ? `Resumen semanal de citas${dateRange ? ` - ${dateRange}` : ""}`
    : `Resumen diario de citas${date ? ` - ${date}` : ""}`;

  // Group appointments by type
  const appointmentTypeLabels: Record<string, string> = {
    visita: "Visitas",
    firma: "Firmas",
    reunion: "Reuniones",
    llamada: "Llamadas",
    cierre: "Cierres",
    viaje: "Viajes",
  };

  const groupedAppointments: Record<string, Appointment[]> = {};
  appointments.forEach((apt) => {
    const type = apt.type ?? "other";
    groupedAppointments[type] ??= [];
    groupedAppointments[type].push(apt);
  });

  // Build appointment item HTML
  const buildAppointmentItem = (appointment: Appointment) => {
    const startDate = new Date(appointment.datetimeStart);
    const endDate = new Date(appointment.datetimeEnd);
    
    const formattedDate = startDate.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const startTime = startDate.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTime = endDate.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    
    const appointmentUrl = `${baseUrl}/calendario?appointmentId=${appointment.appointmentId.toString()}`;
    const typeLabel = appointment.type
      ? (appointmentTypeLabels[appointment.type.toLowerCase()] ?? appointment.type)
      : "Cita";

    return `
      <div style="background: white; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 12px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <h3 style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">
            ${appointment.title}
          </h3>
          <span style="font-size: 14px; color: #6b7280; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">
            ${typeLabel}
          </span>
        </div>
        
        ${appointment.notes ? `
          <p style="margin: 8px 0; color: #4b5563; line-height: 1.5; font-size: 14px;">
            ${appointment.notes}
          </p>
        ` : ""}
        
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
          <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 13px; color: #6b7280;">
            <div>
              <strong style="color: #374151;">📅 Fecha:</strong> ${formattedDate}
            </div>
            <div>
              <strong style="color: #374151;">⏰ Hora:</strong> ${startTime} - ${endTime}
            </div>
            ${appointment.tripTimeMinutes ? `
              <div>
                <strong style="color: #374151;">🚗 Tiempo de viaje:</strong> ${appointment.tripTimeMinutes} min
              </div>
            ` : ""}
          </div>
        </div>
        
        <div style="margin-top: 12px;">
          <a href="${appointmentUrl}" 
             style="background: #3b82f6; 
                    color: white; 
                    padding: 6px 16px; 
                    text-decoration: none; 
                    border-radius: 4px; 
                    font-weight: 500; 
                    font-size: 13px;
                    display: inline-block;">
            Ver cita →
          </a>
        </div>
      </div>
    `;
  };

  // Build sections for each appointment type
  let appointmentsHtml = "";

  Object.entries(groupedAppointments).forEach(([type, typeAppointments]) => {
    const typeLabel = appointmentTypeLabels[type.toLowerCase()] ?? type;
    appointmentsHtml += `
      <div style="margin-bottom: 24px;">
        <h3 style="color: #3b82f6; font-size: 18px; font-weight: 600; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #3b82f6;">
          📅 ${typeLabel} (${typeAppointments.length})
        </h3>
        ${typeAppointments.map(buildAppointmentItem).join("")}
      </div>
    `;
  });

  // Build intro message
  const introMessage = isWeekly
    ? `Resumen de tus citas para la próxima semana:`
    : `Tus citas para hoy y mañana:`;

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
            ${isWeekly ? "📅 Resumen Semanal de Citas" : "📅 Resumen Diario de Citas"}
          </h2>
          
          <p style="margin-bottom: 24px; font-size: 16px; color: #374151;">
            ${introMessage}
          </p>
          
          ${appointmentCount === 0 ? `
            <div style="background: white; padding: 24px; border-radius: 6px; text-align: center;">
              <p style="color: #6b7280; font-size: 16px;">No tienes citas programadas para este período.</p>
            </div>
          ` : `
            <div style="background: white; padding: 24px; border-radius: 6px; margin-bottom: 24px;">
              ${appointmentsHtml}
            </div>
          `}
          
          <div style="text-align: center; margin-top: 30px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
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
  const buildAppointmentText = (appointment: Appointment) => {
    const startDate = new Date(appointment.datetimeStart);
    const endDate = new Date(appointment.datetimeEnd);
    
    const formattedDate = startDate.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const startTime = startDate.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTime = endDate.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    
    const appointmentUrl = `${baseUrl}/calendario?appointmentId=${appointment.appointmentId.toString()}`;
    const typeLabel = appointment.type
      ? (appointmentTypeLabels[appointment.type.toLowerCase()] ?? appointment.type)
      : "Cita";

    return `
- ${appointment.title} (${typeLabel})
  ${appointment.notes ? `  ${appointment.notes}` : ""}
  📅 Fecha: ${formattedDate}
  ⏰ Hora: ${startTime} - ${endTime}
  ${appointment.tripTimeMinutes ? `  🚗 Tiempo de viaje: ${appointment.tripTimeMinutes} min` : ""}
  Ver cita: ${appointmentUrl}
`;
  };

  let appointmentsText = "";
  Object.entries(groupedAppointments).forEach(([type, typeAppointments]) => {
    const typeLabel = appointmentTypeLabels[type.toLowerCase()] ?? type;
    appointmentsText += `\n📅 ${typeLabel.toUpperCase()}:\n${typeAppointments.map(buildAppointmentText).join("")}`;
  });

  const text = `
${subject} - Vesta CRM

${introMessage}

${appointmentCount === 0 ? "No tienes citas programadas para este período." : appointmentsText}

Ver calendario: ${baseUrl}/calendario

Este email fue enviado por Vesta CRM
© ${new Date().getFullYear()} Vesta CRM. Todos los derechos reservados.
  `;

  return { subject, html, text };
}

