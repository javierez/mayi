/**
 * Task Digest Email Template
 *
 * Generates email content for digest emails containing multiple overdue tasks
 */

import { generateNotificationEmailBase } from "./notification-base";
import type { Task } from "~/lib/data";

export interface TaskDigestEmailData {
  tasks: Task[];
  digestType: "weekly" | "daily";
  userEmail: string;
}

export function generateTaskDigestEmail(
  data: TaskDigestEmailData,
): { subject: string; html: string; text: string } {
  const { tasks, digestType, userEmail } = data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";

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

  const taskItemsHtml = tasks.map((task) => {
    const urgencyLabel = task.urgency
      ? urgencyLabels[task.urgency as keyof typeof urgencyLabels] || "Normal"
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
    
    const urgencyColor = task.urgency === 5 ? "#dc2626" : "#f59e0b";
    const urgencyBadge = task.urgency === 5 ? "🔴" : "🟡";

    return `
      <div style="background: white; border-left: 4px solid ${urgencyColor}; padding: 20px; margin-bottom: 16px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
          <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">
            ${task.title}
          </h3>
          <span style="font-size: 20px;">${urgencyBadge}</span>
        </div>
        
        ${task.description ? `
          <p style="margin: 8px 0; color: #4b5563; line-height: 1.6;">
            ${task.description}
          </p>
        ` : ""}
        
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
          <div style="display: flex; flex-wrap: wrap; gap: 16px; font-size: 14px; color: #6b7280;">
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
        
        <div style="margin-top: 16px;">
          <a href="${taskUrl}" 
             style="background: ${urgencyColor}; 
                    color: white; 
                    padding: 8px 20px; 
                    text-decoration: none; 
                    border-radius: 4px; 
                    font-weight: 500; 
                    font-size: 14px;
                    display: inline-block;">
            Ver tarea →
          </a>
        </div>
      </div>
    `;
  }).join("");

  // Build main message
  const introMessage = isCritical
    ? `Tienes <strong>${taskCount} tarea${taskCount > 1 ? "s" : ""} crítica${taskCount > 1 ? "s" : ""} vencida${taskCount > 1 ? "s" : ""}</strong> que requieren atención inmediata.`
    : `Tienes <strong>${taskCount} tarea${taskCount > 1 ? "s" : ""} vencida${taskCount > 1 ? "s" : ""}</strong> pendiente${taskCount > 1 ? "s" : ""} de completar.`;

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
            ${isCritical ? "🚨 Tareas Críticas Vencidas" : "📋 Resumen de Tareas Vencidas"}
          </h2>
          
          <p style="margin-bottom: 24px; font-size: 16px; color: #374151;">
            ${introMessage}
          </p>
          
          <div style="background: white; padding: 24px; border-radius: 6px; margin-bottom: 24px;">
            ${taskItemsHtml}
          </div>
          
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
  const taskItemsText = tasks.map((task, index) => {
    const urgencyLabel = task.urgency
      ? urgencyLabels[task.urgency as keyof typeof urgencyLabels] || "Normal"
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

