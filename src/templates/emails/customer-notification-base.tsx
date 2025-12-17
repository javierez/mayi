/**
 * Base Email Template for Customer Notifications
 *
 * Provides a reusable base template with account-specific branding (logo).
 * Uses TABLE-BASED layouts for maximum email client compatibility.
 *
 * Unlike notification-base.tsx (internal/Vesta branding), this uses
 * the account's logo from website_config for customer-facing emails.
 */

export interface CustomerEmailBranding {
  logoUrl: string | null;
  accountName: string;
}

export function generateCustomerNotificationEmailBase(
  title: string,
  message: string,
  actionUrl: string | null,
  actionLabel: string | null,
  branding: CustomerEmailBranding,
): { html: string; text: string } {
  const { logoUrl, accountName } = branding;

  // Fallback to Vesta logo if no account logo
  const displayLogoUrl = logoUrl ?? "https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/vestalogotransp.png";
  const displayName = accountName ?? "Vesta CRM";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>${title} - ${displayName}</title>
        <style type="text/css">
          /* Mobile responsive styles - works in Gmail, Apple Mail, Outlook.com */
          @media only screen and (max-width: 600px) {
            .email-container {
              width: 100% !important;
              max-width: 100% !important;
            }
            .email-padding {
              padding-left: 16px !important;
              padding-right: 16px !important;
            }
            .email-outer-padding {
              padding: 20px 10px !important;
            }
            .email-logo-padding {
              padding-left: 16px !important;
              padding-right: 16px !important;
            }
            .email-button-padding {
              padding-left: 16px !important;
              padding-right: 16px !important;
            }
            .email-footer-padding {
              padding-left: 16px !important;
              padding-right: 16px !important;
            }
          }
        </style>
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
            <td align="center" class="email-outer-padding" style="padding: 40px 20px;">
              <!-- Inner container table - FLUID with max-width -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" class="email-container" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px;">
                <!-- Logo Section -->
                <tr>
                  <td align="center" class="email-logo-padding" style="padding: 12px 40px 8px 40px;">
                    <img src="${displayLogoUrl}" alt="${displayName}" width="180" style="max-width: 180px; width: 100%; height: auto; display: block;" />
                  </td>
                </tr>

                <!-- Title Section -->
                <tr>
                  <td class="email-padding" style="padding: 0 40px;">
                    <h2 style="color: #111827; margin: 0 0 12px 0; font-size: 24px; font-weight: 400; line-height: 1.3;">${title}</h2>
                  </td>
                </tr>

                <!-- Message Section -->
                <tr>
                  <td class="email-padding" style="padding: 0 40px;">
                    <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 400; color: #374151; line-height: 1.6;">
                      ${message}
                    </p>
                  </td>
                </tr>

                ${actionUrl && actionLabel ? `
                  <!-- Action Button Section -->
                  <tr>
                    <td align="center" class="email-button-padding" style="padding: 16px 40px 40px 40px;">
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
                    <td class="email-padding" style="padding: 0 40px 40px 40px;"></td>
                  </tr>
                `}

                <!-- Footer Section -->
                <tr>
                  <td class="email-footer-padding" style="padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="color: #9ca3af; font-size: 12px; font-weight: 400; line-height: 1.6;">
                          <p style="margin: 0 0 8px 0;">Este email fue enviado por ${displayName}</p>
                          <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${displayName}. Todos los derechos reservados.</p>
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
${title} - ${displayName}

${message}

${actionUrl ? `${actionLabel ?? "Accede aquí"}: ${actionUrl}` : ''}

Este email fue enviado por ${displayName}
© ${new Date().getFullYear()} ${displayName}. Todos los derechos reservados.
  `;

  return { html, text };
}
