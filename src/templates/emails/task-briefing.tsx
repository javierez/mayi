/**
 * Task Briefing Email Template
 *
 * Generates email content for weekly and daily task briefings
 * that summarize upcoming tasks grouped by urgency level.
 */

import type { Task } from "~/lib/data";

export interface TaskBriefingEmailData {
  tasks: Task[];
  briefingType: "weekly" | "daily";
  dateRange?: string; // For weekly: "Semana del [start] al [end]"
  date?: string; // For daily: "Fecha"
}

export function generateTaskBriefingEmail(
  data: TaskBriefingEmailData,
): { subject: string; html: string; text: string } {
  const { tasks, briefingType, dateRange, date } = data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";

  const taskCount = tasks.length;
  const isWeekly = briefingType === "weekly";

  // Build subject
  const subject = isWeekly
    ? `Resumen semanal de tareas${dateRange ? ` - ${dateRange}` : ""}`
    : `Resumen diario de tareas${date ? ` - ${date}` : ""}`;

  // Group tasks by urgency level
  const criticalTasks = tasks.filter((t) => t.urgency === 5);
  const urgentTasks = tasks.filter((t) => t.urgency === 3 || t.urgency === 4);
  const otherTasks = tasks.filter((t) => t.urgency === 1 || t.urgency === 2 || !t.urgency);

  // Urgency labels
  const urgencyLabels: Record<number, string> = {
    1: "Baja",
    2: "Media",
    3: "Alta",
    4: "Urgente",
    5: "Crítica",
  };

  // Build task list HTML
  const buildTaskItem = (task: Task) => {
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
    
    const urgencyColor = task.urgency === 5 ? "#dc2626" : task.urgency === 4 ? "#f59e0b" : "#3b82f6";
    const urgencyBadge = task.urgency === 5 ? "🔴" : task.urgency === 4 ? "🟡" : "🔵";

    return `
      <div style="background: white; border-left: 4px solid ${urgencyColor}; padding: 16px; margin-bottom: 12px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <h3 style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">
            ${task.title}
          </h3>
          <span style="font-size: 18px;">${urgencyBadge}</span>
        </div>
        
        ${task.description ? `
          <p style="margin: 8px 0; color: #4b5563; line-height: 1.5; font-size: 14px;">
            ${task.description}
          </p>
        ` : ""}
        
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
          <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 13px; color: #6b7280;">
            <div>
              <strong style="color: #374151;">📅 Vencimiento:</strong> ${dueDateStr}${dueTimeStr}
            </div>
            <div>
              <strong style="color: #374151;">⚡ Urgencia:</strong> 
              <span style="color: ${urgencyColor}; font-weight: 600;">${urgencyLabel}</span>
            </div>
            ${task.category ? `
              <div>
                <strong style="color: #374151;">📁 Categoría:</strong> ${task.category}
              </div>
            ` : ""}
          </div>
        </div>
        
        <div style="margin-top: 12px;">
          <a href="${taskUrl}" 
             style="background: ${urgencyColor}; 
                    color: white; 
                    padding: 6px 16px; 
                    text-decoration: none; 
                    border-radius: 4px; 
                    font-weight: 500; 
                    font-size: 13px;
                    display: inline-block;">
            Ver tarea →
          </a>
        </div>
      </div>
    `;
  };

  // Build sections for each urgency level
  let tasksHtml = "";

  if (criticalTasks.length > 0) {
    tasksHtml += `
      <div style="margin-bottom: 24px;">
        <h3 style="color: #dc2626; font-size: 18px; font-weight: 600; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #dc2626;">
          🔴 Tareas Críticas (${criticalTasks.length})
        </h3>
        ${criticalTasks.map(buildTaskItem).join("")}
      </div>
    `;
  }

  if (urgentTasks.length > 0) {
    tasksHtml += `
      <div style="margin-bottom: 24px;">
        <h3 style="color: #f59e0b; font-size: 18px; font-weight: 600; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #f59e0b;">
          🟡 Tareas Urgentes (${urgentTasks.length})
        </h3>
        ${urgentTasks.map(buildTaskItem).join("")}
      </div>
    `;
  }

  if (otherTasks.length > 0) {
    tasksHtml += `
      <div style="margin-bottom: 24px;">
        <h3 style="color: #3b82f6; font-size: 18px; font-weight: 600; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #3b82f6;">
          🔵 Otras Tareas (${otherTasks.length})
        </h3>
        ${otherTasks.map(buildTaskItem).join("")}
      </div>
    `;
  }

  // Build intro message
  const introMessage = isWeekly
    ? `Resumen de tus tareas para la próxima semana:`
    : `Tus tareas para hoy y mañana:`;

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
            ${isWeekly ? "📋 Resumen Semanal de Tareas" : "📋 Resumen Diario de Tareas"}
          </h2>
          
          <p style="margin-bottom: 24px; font-size: 16px; color: #374151;">
            ${introMessage}
          </p>
          
          ${taskCount === 0 ? `
            <div style="background: white; padding: 24px; border-radius: 6px; text-align: center;">
              <p style="color: #6b7280; font-size: 16px;">No tienes tareas programadas para este período.</p>
            </div>
          ` : `
            <div style="background: white; padding: 24px; border-radius: 6px; margin-bottom: 24px;">
              ${tasksHtml}
            </div>
          `}
          
          <div style="text-align: center; margin-top: 30px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <a href="${baseUrl}/tareas" 
               style="background: linear-gradient(to right, #f59e0b, #f43f5e); 
                      color: white; 
                      padding: 14px 32px; 
                      text-decoration: none; 
                      border-radius: 6px; 
                      font-weight: bold; 
                      font-size: 16px;
                      display: inline-block;">
              Ver todas las tareas
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
  const buildTaskText = (task: Task) => {
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
- ${task.title}
  ${task.description ? `  ${task.description}` : ""}
  📅 Vencimiento: ${dueDateStr}${dueTimeStr}
  ⚡ Urgencia: ${urgencyLabel}
  ${task.category ? `  📁 Categoría: ${task.category}` : ""}
  Ver tarea: ${taskUrl}
`;
  };

  let tasksText = "";
  if (criticalTasks.length > 0) {
    tasksText += `\n🔴 TAREAS CRÍTICAS:\n${criticalTasks.map(buildTaskText).join("")}`;
  }
  if (urgentTasks.length > 0) {
    tasksText += `\n🟡 TAREAS URGENTES:\n${urgentTasks.map(buildTaskText).join("")}`;
  }
  if (otherTasks.length > 0) {
    tasksText += `\n🔵 OTRAS TAREAS:\n${otherTasks.map(buildTaskText).join("")}`;
  }

  const text = `
${subject} - Vesta CRM

${introMessage}

${taskCount === 0 ? "No tienes tareas programadas para este período." : tasksText}

Ver todas las tareas: ${baseUrl}/tareas

Este email fue enviado por Vesta CRM
© ${new Date().getFullYear()} Vesta CRM. Todos los derechos reservados.
  `;

  return { subject, html, text };
}

