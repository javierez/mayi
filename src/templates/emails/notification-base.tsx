/**
 * Base Email Template for Notifications
 *
 * Provides a reusable base template with Vesta branding
 * that matches the existing password reset email style.
 */

export function generateNotificationEmailBase(
  title: string,
  message: string,
  actionUrl: string | null,
  actionLabel: string | null,
): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title} - Vesta CRM</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1f2937; margin-bottom: 10px;">
            Vesta <span style="background: linear-gradient(to right, #f59e0b, #f43f5e); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">CRM</span>
          </h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">${title}</h2>
          
          <p style="margin-bottom: 20px;">
            ${message}
          </p>
          
          ${actionUrl && actionLabel ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionUrl}" 
                 style="background: linear-gradient(to right, #f59e0b, #f43f5e); 
                        color: white; 
                        padding: 12px 30px; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        font-weight: bold; 
                        display: inline-block;">
                ${actionLabel}
              </a>
            </div>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
          <p>Este email fue enviado por Vesta CRM</p>
          <p>© ${new Date().getFullYear()} Vesta CRM. Todos los derechos reservados.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
${title} - Vesta CRM

${message}

${actionUrl ? `${actionLabel ?? "Accede aquí"}: ${actionUrl}` : ''}

Este email fue enviado por Vesta CRM
© ${new Date().getFullYear()} Vesta CRM. Todos los derechos reservados.
  `;

  return { html, text };
}

