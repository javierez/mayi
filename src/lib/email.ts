import { Resend } from "resend";
import { env } from "~/env";

// Initialize Resend client
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  if (!resend || !env.RESEND_API_KEY) {
    console.warn(
      "⚠️ Email service not configured. Set RESEND_API_KEY to enable email functionality.",
    );

    // In development, log the email instead of sending
    if (env.NODE_ENV === "development") {
      console.log("\n📧 Email (Development Mode):");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text}`);
      console.log(`HTML: ${html}`);
      console.log("──────────────────────────────\n");
      return { success: true, id: "dev-email-id" };
    }

    throw new Error("Email service not configured");
  }

  try {
    // Use configured email or fallback to default
    const fromEmail =
      env.RESEND_FROM_EMAIL ?? "Vesta CRM <noreply@vesta-crm.com>";

    const result = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      text,
      html,
    });

    console.log(`✅ Email sent successfully to ${to} (ID: ${result.data?.id})`);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    throw error;
  }
}

/**
 * Generate password reset email HTML
 */
export function generatePasswordResetEmail(
  resetUrl: string,
  userEmail: string,
): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Restablecer Contraseña - Vesta CRM</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1f2937; margin-bottom: 10px;">
            Vesta <span style="background: linear-gradient(to right, #f59e0b, #f43f5e); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">CRM</span>
          </h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Restablecer tu contraseña</h2>
          
          <p style="margin-bottom: 20px;">
            Hola,
          </p>
          
          <p style="margin-bottom: 20px;">
            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Vesta CRM 
            (<strong>${userEmail}</strong>).
          </p>
          
          <p style="margin-bottom: 30px;">
            Para continuar con el restablecimiento de tu contraseña, haz clic en el siguiente enlace:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(to right, #f59e0b, #f43f5e); 
                      color: white; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 6px; 
                      font-weight: bold; 
                      display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          
          <p style="margin-bottom: 20px; color: #6b7280; font-size: 14px;">
            Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
          </p>
          
          <p style="margin-bottom: 30px; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 14px;">
            ${resetUrl}
          </p>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
              ⚠️ <strong>Importante:</strong>
            </p>
            <ul style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
              <li>Este enlace expira en 1 hora por seguridad</li>
              <li>Si no solicitaste este cambio, puedes ignorar este email</li>
              <li>Tu contraseña no cambiará hasta que accedas al enlace y establezcas una nueva</li>
            </ul>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
          <p>Este email fue enviado por Vesta CRM</p>
          <p>© ${new Date().getFullYear()} Vesta CRM. Todos los derechos reservados.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Restablecer tu contraseña - Vesta CRM

Hola,

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Vesta CRM (${userEmail}).

Para continuar con el restablecimiento de tu contraseña, visita el siguiente enlace:

${resetUrl}

IMPORTANTE:
- Este enlace expira en 1 hora por seguridad
- Si no solicitaste este cambio, puedes ignorar este email
- Tu contraseña no cambiará hasta que accedas al enlace y establezcas una nueva

Este email fue enviado por Vesta CRM
© ${new Date().getFullYear()} Vesta CRM. Todos los derechos reservados.
  `;

  return { html, text };
}
