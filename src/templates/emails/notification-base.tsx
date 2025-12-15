/**
 * Base Email Template for Notifications
 *
 * Provides a reusable base template with Vesta branding.
 * Uses TABLE-BASED layouts for maximum email client compatibility
 * (Outlook uses Word rendering engine, which doesn't support flexbox).
 * 
 * CSS Properties Supported in Most Email Clients:
 * ✅ Tables, padding, margin, border, background-color
 * ✅ Font styles (size, weight, family, color)
 * ✅ Text alignment, line-height
 * ✅ Width, height (on tables/cells)
 * 
 * CSS Properties NOT Supported (avoid these):
 * ❌ display: flex/grid
 * ❌ box-shadow
 * ❌ position: absolute/relative
 * ❌ CSS variables
 * ❌ JavaScript
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>${title} - Vesta CRM</title>
        <!--[if mso]>
        <style type="text/css">
          table { border-collapse: collapse; }
          td { font-family: Arial, sans-serif; }
        </style>
        <![endif]-->
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb;">
        <!-- Outer wrapper table for full-width background -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <!-- Inner container table -->
              <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px;">
                <!-- Logo Section -->
                <tr>
                  <td align="center" style="padding: 12px 40px 8px 40px;">
                    <img src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/vestalogotransp.png" alt="Vesta CRM" width="180" style="max-width: 180px; height: auto; display: block;" />
                  </td>
                </tr>
                
                <!-- Title Section -->
                <tr>
                  <td style="padding: 0 40px;">
                    <h2 style="color: #111827; margin: 0 0 12px 0; font-size: 24px; font-weight: 400; line-height: 1.3;">${title}</h2>
                  </td>
                </tr>
                
                <!-- Message Section -->
                <tr>
                  <td style="padding: 0 40px;">
                    <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 400; color: #374151; line-height: 1.6;">
                      ${message}
                    </p>
                  </td>
                </tr>
                
                ${actionUrl && actionLabel ? `
                  <!-- Action Button Section -->
                  <tr>
                    <td align="center" style="padding: 16px 40px 40px 40px;">
                      <table cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="background-color: #111827; border-radius: 6px;">
                            <a href="${actionUrl}" 
                               style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
                              ${actionLabel}
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                ` : `
                  <!-- Spacer when no button -->
                  <tr>
                    <td style="padding: 0 40px 40px 40px;"></td>
                  </tr>
                `}
                
                <!-- Footer Section -->
                <tr>
                  <td style="padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="color: #9ca3af; font-size: 12px; font-weight: 400; line-height: 1.6;">
                          <p style="margin: 0 0 8px 0;">Este email fue enviado por Vesta CRM</p>
                          <p style="margin: 0;">© ${new Date().getFullYear()} Vesta CRM. Todos los derechos reservados.</p>
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

  const text = `
${title} - Vesta CRM

${message}

${actionUrl ? `${actionLabel ?? "Accede aquí"}: ${actionUrl}` : ''}

Este email fue enviado por Vesta CRM
© ${new Date().getFullYear()} Vesta CRM. Todos los derechos reservados.
  `;

  return { html, text };
}
