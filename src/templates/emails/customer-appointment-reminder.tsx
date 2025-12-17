/**
 * Customer Appointment Reminder Email Template
 *
 * Generates customer-facing email content for appointment reminders.
 * Uses the same structure as internal appointment-reminder.tsx but with:
 * - Account-specific branding (logo from website_config)
 * - Customer-friendly messaging
 * - Agent contact info instead of internal user info
 *
 * IMPORTANT: This template uses TABLE-BASED layouts for maximum
 * email client compatibility (Outlook, Gmail, Yahoo, Apple Mail).
 */

import {
  generateCustomerNotificationEmailBase,
  type CustomerEmailBranding,
} from "./customer-notification-base";
import { getSquareMeter } from "~/lib/properties/area-utils";

export interface CustomerAppointmentReminderMetadata {
  appointmentTitle: string;
  appointmentType: "visita" | "firma" | "reunion" | "llamada" | "cierre" | "viaje";
  datetimeStart: string;
  datetimeEnd?: string;
  reminderTimeframe: "24h" | "12h" | "1h" | "30min" | "travel_time";
  // Agent/representative contact info
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  // Location
  location?: string;
  propertyAddress?: string;
  travelTime?: number; // in minutes
  directionsUrl?: string;
  // Notes
  preparationNotes?: string;
  cancellationPolicy?: string;
  // Property data (for property card)
  listing?: {
    listingId?: string;
    title?: string | null;
    street?: string | null;
    propertyType?: string | null;
    listingType?: string;
    price?: string;
    bedrooms?: number | null;
    bathrooms?: string | number | null;
    squareMeter?: number | null;
    builtSurfaceArea?: number | null;
    city?: string | null;
    province?: string | null;
    referenceNumber?: string | null;
    imageUrl?: string | null;
    imageUrls?: string[];
    propertyUrl?: string | null;
  };
  // Branding (from account)
  branding?: CustomerEmailBranding;
}

export function generateCustomerAppointmentReminderEmail(
  metadata: CustomerAppointmentReminderMetadata,
): { subject: string; html: string; text: string } {
  const timeframe = metadata.reminderTimeframe;
  const isUrgent = timeframe === "1h" || timeframe === "30min" || timeframe === "travel_time";

  // Appointment type labels
  const appointmentTypeLabels: Record<string, string> = {
    visita: "Visita",
    firma: "Firma",
    reunion: "Reunión",
    llamada: "Llamada",
    cierre: "Cierre",
    viaje: "Viaje",
  };
  const appointmentTypeLabel = appointmentTypeLabels[metadata.appointmentType] ?? metadata.appointmentType;

  // Build subject based on timeframe
  const appointmentNoun = appointmentTypeLabel === "Visita" ? "Visita" : "Cita";
  const appointmentNounLower = appointmentTypeLabel === "Visita" ? "visita" : "cita";

  let subject = "";
  switch (timeframe) {
    case "24h":
      subject = `Recordatorio: ${appointmentNoun} mañana - ${appointmentTypeLabel}`;
      break;
    case "12h":
      subject = `Recordatorio: ${appointmentNoun} en 12 horas - ${appointmentTypeLabel}`;
      break;
    case "1h":
      subject = `Tu ${appointmentNounLower} es en 1 hora - ${appointmentTypeLabel}`;
      break;
    case "30min":
      subject = `Tu ${appointmentNounLower} es en 30 minutos - ${appointmentTypeLabel}`;
      break;
    case "travel_time":
      subject = `Es hora de salir - ${appointmentNoun}: ${appointmentTypeLabel}`;
      break;
    default:
      subject = `Recordatorio: ${appointmentTypeLabel}`;
  }

  // Build structured HTML sections (same as internal template)
  const reminderDetailsSections: string[] = [];

  // Time remaining section
  const getSpainTimeAsUTC = (): Date => {
    const now = new Date();
    const spainTimeStr = now.toLocaleString('en-GB', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const [datePart, timePart] = spainTimeStr.split(', ');
    const [day, month, year] = datePart!.split('/').map(Number);
    const [hour, minute, second] = timePart!.split(':').map(Number);
    return new Date(Date.UTC(year!, month! - 1, day!, hour!, minute!, second!));
  };

  const calculateTimeRemaining = (): string => {
    if (!metadata.datetimeStart) return "";

    const startDate = new Date(metadata.datetimeStart);
    const now = getSpainTimeAsUTC();
    const timeDiff = startDate.getTime() - now.getTime();

    if (timeDiff <= 0) return "La cita ya comenzó";

    const totalMinutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours} ${hours === 1 ? "hora" : "horas"} y ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? "hora" : "horas"}`;
    } else if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
    } else {
      return "Menos de 1 minuto";
    }
  };

  let timeRemainingLabel = "";
  let timeRemainingValue = "";

  switch (timeframe) {
    case "24h":
      timeRemainingLabel = "Tiempo restante";
      if (metadata.datetimeStart) {
        const startDate = new Date(metadata.datetimeStart);
        const now = getSpainTimeAsUTC();
        const hoursUntil = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntil >= 24 && hoursUntil < 48) {
          timeRemainingValue = `Tu ${appointmentNounLower} es mañana`;
        } else {
          timeRemainingValue = calculateTimeRemaining();
        }
      } else {
        timeRemainingValue = `Tu ${appointmentNounLower} es mañana`;
      }
      break;
    case "12h":
    case "1h":
    case "30min":
      timeRemainingLabel = "Tiempo restante";
      timeRemainingValue = calculateTimeRemaining();
      break;
    case "travel_time":
      timeRemainingLabel = "Estado";
      timeRemainingValue = "Es hora de salir";
      break;
  }

  if (timeRemainingLabel && timeRemainingValue) {
    reminderDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
        <tr>
          <td style="padding: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">${timeRemainingLabel}</td>
              </tr>
              <tr>
                <td style="font-size: 14px; font-weight: 400; color: #111827; line-height: 1.4;">${timeRemainingValue}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  // Property address section with Google Maps link (placed at top)
  const buildFullPropertyAddress = (): string | null => {
    if (!metadata.listing) return null;
    const { street, city, province } = metadata.listing;
    const addressParts = [street, city, province].filter(Boolean);
    return addressParts.length > 0 ? addressParts.join(", ") : null;
  };

  // Disclaimer about being late or not making it (placed at top)
  reminderDetailsSections.push(`
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px;">
      <tr>
        <td style="padding: 10px; font-size: 12px; color: #6b7280; font-style: italic; line-height: 1.5; text-align: center;">
          Si vas a llegar tarde o no puedes asistir, por favor responde a este correo para avisarnos.
        </td>
      </tr>
    </table>
  `);

  const fullPropertyAddress = buildFullPropertyAddress();
  if (fullPropertyAddress) {
    const addressContent = metadata.directionsUrl
      ? `<a href="${metadata.directionsUrl}" target="_blank" style="color: #111827; text-decoration: underline; font-size: 14px; font-weight: 400; line-height: 1.4;">${fullPropertyAddress}</a>`
      : `<span style="font-size: 14px; font-weight: 400; color: #111827; line-height: 1.4;">${fullPropertyAddress}</span>`;

    reminderDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
        <tr>
          <td style="padding: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">📍 Dirección de la cita</td>
              </tr>
              <tr>
                <td>${addressContent}</td>
              </tr>
              ${metadata.directionsUrl ? `
              <tr>
                <td style="padding-top: 8px;">
                  <a href="${metadata.directionsUrl}" target="_blank" style="display: inline-block; padding: 5px 10px; background: #ffffff; color: #111827; text-decoration: none; font-size: 12px; font-weight: 500; border-radius: 4px; border: 1px solid #e5e7eb;">
                    Ver en Google Maps
                  </a>
                </td>
              </tr>
              ` : ""}
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  // Date and time section
  if (metadata.datetimeStart) {
    const startDate = new Date(metadata.datetimeStart);
    const formattedDate = startDate.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    const formattedTime = startDate.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });

    let dateTimeText = `${capitalizedDate} a las ${formattedTime}`;

    if (metadata.datetimeEnd) {
      const endDate = new Date(metadata.datetimeEnd);
      const endTime = endDate.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      });
      dateTimeText += ` - ${endTime}`;
    }

    reminderDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
        <tr>
          <td style="padding: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">Fecha y hora</td>
              </tr>
              <tr>
                <td style="font-size: 14px; font-weight: 400; color: #111827; line-height: 1.4;">${dateTimeText}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  // Appointment type section
  if (appointmentTypeLabel) {
    const appointmentTypeLabelText = appointmentTypeLabel === "Visita" ? "Tipo de visita" : "Tipo de cita";
    reminderDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
        <tr>
          <td style="padding: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">${appointmentTypeLabelText}</td>
              </tr>
              <tr>
                <td style="font-size: 14px; font-weight: 400; color: #111827; line-height: 1.4;">${appointmentTypeLabel}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  // Location/Notes section
  if (metadata.location) {
    reminderDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
        <tr>
          <td style="padding: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">Ubicación</td>
              </tr>
              <tr>
                <td style="font-size: 14px; font-weight: 400; color: #111827; line-height: 1.4;">${metadata.location}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  // Travel time section for travel_time reminder
  if (timeframe === "travel_time" && metadata.travelTime) {
    reminderDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
        <tr>
          <td style="padding: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">Tiempo de viaje estimado</td>
              </tr>
              <tr>
                <td style="font-size: 14px; font-weight: 400; color: #111827; line-height: 1.4;">${metadata.travelTime} minutos</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  // Customer-friendly tips for urgent reminders
  if (isUrgent) {
    const tips: string[] = [];

    if (timeframe === "travel_time") {
      tips.push("Verifica que tengas todo lo necesario");
      tips.push("Revisa el tráfico antes de salir");
    } else if (timeframe === "30min") {
      tips.push("Prepárate para salir pronto");
      tips.push("Ten a mano tu documentación");
    } else if (timeframe === "1h") {
      tips.push("Revisa los detalles de tu cita");
      tips.push("Prepara cualquier documento necesario");
    }

    if (tips.length > 0) {
      const tipsHtml = tips.map(tip => `<li style="margin-bottom: 4px;">${tip}</li>`).join("");
      reminderDetailsSections.push(`
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
          <tr>
            <td style="padding: 10px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">Recordatorios</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; font-weight: 400; color: #111827; line-height: 1.4;">
                    <ul style="margin: 0; padding-left: 20px;">
                      ${tipsHtml}
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `);
    }
  }

  // Combine structured sections
  let structuredMessageHtml = "";
  if (reminderDetailsSections.length > 0) {
    structuredMessageHtml = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 2px 0 6px 0;">
        <tr>
          <td>
            ${reminderDetailsSections.join("")}
          </td>
        </tr>
      </table>
    `;
  }

  // Agent contact card
  let agentCardHtml = "";
  if (metadata.contactName) {
    agentCardHtml = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 12px 0 6px 0; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
        <tr>
          <td style="padding: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 12px; font-weight: 500; color: #111827; line-height: 1.3; padding-bottom: 6px;">
                  ${metadata.contactName} (Tu agente)
                </td>
              </tr>
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="4" border="0">
                    <tr>
                      ${metadata.contactPhone ? `
                        <td>
                          <a href="tel:${metadata.contactPhone.replace(/\s/g, "")}"
                             style="display: inline-block; padding: 5px 10px; background: #ffffff; color: #111827; text-decoration: none; font-size: 12px; font-weight: 500; border-radius: 4px; border: 1px solid #e5e7eb;">
                            📞 ${metadata.contactPhone}
                          </a>
                        </td>
                      ` : ""}
                      ${metadata.contactEmail ? `
                        <td>
                          <a href="mailto:${metadata.contactEmail}"
                             style="display: inline-block; padding: 5px 10px; background: #ffffff; color: #111827; text-decoration: none; font-size: 12px; font-weight: 500; border-radius: 4px; border: 1px solid #e5e7eb;">
                            ✉️ Email
                          </a>
                        </td>
                      ` : ""}
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }

  // Property card
  let propertyCardHtml = "";
  if (metadata.listing) {
    propertyCardHtml = generatePropertyCardHtml(metadata.listing);
  }

  // Determine action URL and label - customers don't have CRM access
  const actionUrl: string | null = timeframe === "travel_time" && metadata.directionsUrl
    ? metadata.directionsUrl
    : null;

  const actionLabel = timeframe === "travel_time" && metadata.directionsUrl
    ? "Ver direcciones"
    : null;

  // Generate base email
  const branding: CustomerEmailBranding = metadata.branding ?? {
    logoUrl: null,
    accountName: "Su Agencia Inmobiliaria",
  };

  const { html: baseHtml, text: baseText } = generateCustomerNotificationEmailBase(
    subject,
    "",
    actionUrl,
    actionLabel,
    branding,
  );

  // Inject structured content into the HTML
  let finalHtml = baseHtml;
  const allContentHtml = (structuredMessageHtml || "") + (agentCardHtml || "") + (propertyCardHtml || "");

  if (allContentHtml) {
    const wrappedContent = `
                </td>
              </tr>

              <!-- Additional Reminder Content -->
              <tr>
                <td class="email-padding" style="padding: 0 40px;">
                  ${allContentHtml}
                </td>
              </tr>

              <tr>
                <td class="email-padding" style="padding: 0 40px;">
    `;

    finalHtml = baseHtml.replace(
      /(<\/p>\s*<\/td>\s*<\/tr>\s*)(<!-- Action Button Section -->|<!-- Spacer when no button -->|\s*<tr>\s*<td align="center")/,
      `</p>${wrappedContent.trim()}</td></tr>$2`,
    );

    // Fallback
    if (finalHtml === baseHtml) {
      finalHtml = baseHtml.replace(
        /(<!-- Action Button Section -->|<!-- Spacer when no button -->)/,
        `<!-- Additional Reminder Content -->
              <tr>
                <td class="email-padding" style="padding: 0 40px 16px 40px;">
                  ${allContentHtml}
                </td>
              </tr>

              $1`,
      );
    }
  }

  return {
    subject,
    html: finalHtml,
    text: baseText,
  };
}

/**
 * Generate property card HTML for customer appointment reminders
 */
function generatePropertyCardHtml(
  listing: {
    listingId?: string;
    title?: string | null;
    street?: string | null;
    propertyType?: string | null;
    listingType?: string;
    price?: string;
    bedrooms?: number | null;
    bathrooms?: string | number | null;
    squareMeter?: number | null;
    builtSurfaceArea?: number | null;
    city?: string | null;
    province?: string | null;
    referenceNumber?: string | null;
    imageUrl?: string | null;
    imageUrls?: string[];
    propertyUrl?: string | null;
  },
): string {
  const formatPriceEmail = (price: string | number | undefined) => {
    if (!price) return "";
    return new Intl.NumberFormat("es-ES", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  const formatListingType = (type?: string) => {
    if (!type) return "";
    const types: Record<string, string> = {
      Sale: "Venta",
      sale: "Venta",
      Rent: "Alquiler",
      rent: "Alquiler",
      RentWithOption: "Alquiler",
      RoomSharing: "Compartir",
    };
    return types[type] ?? types[type.toLowerCase()] ?? type;
  };

  const getPropertyTypeLabel = (type?: string | null) => {
    if (!type) return "";
    const types: Record<string, string> = {
      piso: "Piso",
      casa: "Casa",
      local: "Local",
      solar: "Solar",
      garaje: "Garaje",
    };
    return types[type.toLowerCase()] ?? type;
  };

  const squareMeter = getSquareMeter({
    squareMeter: listing.squareMeter ?? null,
    builtSurfaceArea: listing.builtSurfaceArea ?? null,
  });

  const primaryImage = listing.imageUrls && listing.imageUrls.length > 0
    ? listing.imageUrls[0]
    : listing.imageUrl ?? null;

  const isValidImage = (url: string | null | undefined): boolean => {
    if (!url) return false;
    if (url.includes("youtube.com") || url.includes("youtu.be")) return false;
    if (/\.(mp4|mov|avi|webm|mkv|flv|wmv)(\?|$)/i.exec(url)) return false;
    if (url.includes("/videos/")) return false;
    return true;
  };

  const validImageUrl = isValidImage(primaryImage) ? primaryImage : null;

  const displayPrice = listing.price;
  const listingType = listing.listingType ?? "";
  const isRent = ["Rent", "RentWithOption", "RoomSharing"].includes(listingType);

  const propertyTypeLabel = getPropertyTypeLabel(listing.propertyType);
  const listingTypeLabel = formatListingType(listingType);

  // Generate badges HTML
  let badgesHtml = "";
  if (propertyTypeLabel || listingTypeLabel) {
    const badges: string[] = [];
    if (propertyTypeLabel) {
      badges.push(`<span style="display: inline-block; background: #f3f4f6; color: #374151; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; margin-right: 8px;">${propertyTypeLabel}</span>`);
    }
    if (listingTypeLabel) {
      badges.push(`<span style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; margin-right: 8px;">${listingTypeLabel}</span>`);
    }
    badgesHtml = `
      <tr>
        <td style="padding: 6px 10px 0 10px;">
          ${badges.join("")}
        </td>
      </tr>
    `;
  }

  // Build property details row
  let detailsHtml = "";
  const showDetails = (Boolean(listing.bedrooms) || Boolean(listing.bathrooms) || Boolean(squareMeter)) &&
    listing.propertyType &&
    !["solar", "garaje", "local"].includes(listing.propertyType.toLowerCase());

  if (Boolean(showDetails) || Boolean(squareMeter)) {
    const details: string[] = [];
    if (showDetails) {
      if (listing.bedrooms) {
        details.push(`${listing.bedrooms} ${listing.bedrooms === 1 ? "Hab" : "Habs"}`);
      }
      if (listing.bathrooms) {
        details.push(`${Math.floor(Number(listing.bathrooms))} ${Math.floor(Number(listing.bathrooms)) === 1 ? "Baño" : "Baños"}`);
      }
    }
    if (squareMeter) {
      details.push(`${squareMeter} m²`);
    }

    detailsHtml = `
      <tr>
        <td style="padding: 6px 10px; font-size: 11px; color: #6b7280;">
          ${details.join(" • ")}
        </td>
      </tr>
    `;
  }

  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 12px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; background: #ffffff;">
      <tr>
        <td>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <!-- Image Section -->
            ${validImageUrl ? `
              <tr>
                <td style="background: #f9fafb;">
                  <img
                    src="${validImageUrl}"
                    alt="${[listing.street, listing.city, listing.province].filter(Boolean).join(", ") || listing.title || "Propiedad"}"
                    width="100%"
                    style="display: block; width: 100%; height: auto; max-height: 160px; object-fit: cover;"
                  />
                </td>
              </tr>
            ` : `
              <tr>
                <td style="padding: 30px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center; color: white;">
                  <div style="font-size: 40px; margin-bottom: 6px;">🏠</div>
                  ${propertyTypeLabel ? `<div style="font-size: 12px; font-weight: 400; opacity: 0.9;">${propertyTypeLabel}</div>` : ""}
                </td>
              </tr>
            `}

            <!-- Content Section -->
            ${badgesHtml}

            <!-- Title Row -->
            <tr>
              <td style="padding: 10px 10px 4px 10px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="font-size: 15px; font-weight: 600; color: #111827; line-height: 1.3;">
                      ${listing.title ?? "Propiedad"}
                    </td>
                    ${displayPrice ? `
                      <td align="right" style="font-size: 15px; font-weight: 600; color: #111827; line-height: 1.3; white-space: nowrap;">
                        ${formatPriceEmail(displayPrice)}€${isRent ? "/mes" : ""}
                      </td>
                    ` : ""}
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Details Row -->
            ${detailsHtml}

            <!-- Reference Number -->
            ${listing.referenceNumber ? `
              <tr>
                <td style="padding: 6px 10px 10px 10px; font-size: 9px; font-weight: 600; letter-spacing: 0.1em; color: #9ca3af; text-transform: uppercase;">
                  REF: ${listing.referenceNumber}
                </td>
              </tr>
            ` : ""}
          </table>
        </td>
      </tr>
    </table>
  `;
}
