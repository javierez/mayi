/**
 * Appointment Reminder Email Template
 *
 * Generates email content for appointment reminders at various timeframes:
 * - 24 hours before
 * - 12 hours before
 * - 1 hour before
 * - 30 minutes before
 * - Travel time notification
 *
 * IMPORTANT: This template uses TABLE-BASED layouts for maximum
 * email client compatibility (Outlook, Gmail, Yahoo, Apple Mail).
 */

import { generateNotificationEmailBase } from "./notification-base";
import type {
  Notification,
  AppointmentNotificationMetadata,
} from "~/types/notifications";
import { getSquareMeter } from "~/lib/properties/area-utils";

export interface AppointmentReminderMetadata extends AppointmentNotificationMetadata {
  reminderTimeframe?: "24h" | "12h" | "1h" | "30min" | "travel_time";
  travelTime?: number; // in minutes
  directionsUrl?: string;
}

export function generateAppointmentReminderEmail(
  notification: Notification,
): { subject: string; html: string; text: string } {
  const metadata = notification.metadata as AppointmentReminderMetadata;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
  const actionUrl = notification.actionUrl
    ? `${baseUrl}${notification.actionUrl}`
    : null;

  // Determine reminder timeframe
  const timeframe = metadata.reminderTimeframe ?? metadata.reminderType ?? "24h";
  const isUrgent = timeframe === "1h" || timeframe === "30min" || timeframe === "30_min" || timeframe === "travel_time";

  // Build subject based on timeframe
  let subject = notification.title;

  // Get appointment type label
  const appointmentTypeLabels: Record<string, string> = {
    visita: "Visita",
    firma: "Firma",
    reunion: "Reunión",
    llamada: "Llamada",
    cierre: "Cierre",
    viaje: "Viaje",
    Visita: "Visita",
    Reunión: "Reunión",
    Firma: "Firma",
    Cierre: "Cierre",
    Viaje: "Viaje",
    Tarea: "Tarea",
  };
  const appointmentTypeLabel = metadata.appointmentType
    ? appointmentTypeLabels[metadata.appointmentType] ?? metadata.appointmentType
    : "Cita";

  // Customize subject based on timeframe
  if (metadata.appointmentTitle) {
    switch (timeframe) {
      case "24h":
      case "1_day":
        subject = `Recordatorio: Cita mañana - ${appointmentTypeLabel}`;
        break;
      case "12h":
        subject = `Recordatorio: Cita en 12 horas - ${appointmentTypeLabel}`;
        break;
      case "1h":
        subject = `⏰ Tu cita es en 1 hora - ${appointmentTypeLabel}`;
        break;
      case "30min":
      case "30_min":
        subject = `⏰ Tu cita es en 30 minutos - ${appointmentTypeLabel}`;
        break;
      case "travel_time":
        subject = `🚗 Es hora de salir - Cita: ${appointmentTypeLabel}`;
        break;
      default:
        subject = `Recordatorio: ${appointmentTypeLabel}`;
    }
  }

  // Build structured HTML sections
  const reminderDetailsSections: string[] = [];

  // Time remaining section based on timeframe
  let timeRemainingLabel = "";
  let timeRemainingValue = "";
  switch (timeframe) {
    case "24h":
    case "1_day":
      timeRemainingLabel = "Tiempo restante";
      timeRemainingValue = "Tu cita es mañana";
      break;
    case "12h":
      timeRemainingLabel = "Tiempo restante";
      timeRemainingValue = "12 horas";
      break;
    case "1h":
      timeRemainingLabel = "Tiempo restante";
      timeRemainingValue = "1 hora";
      break;
    case "30min":
    case "30_min":
      timeRemainingLabel = "Tiempo restante";
      timeRemainingValue = "30 minutos";
      break;
    case "travel_time":
      timeRemainingLabel = "Estado";
      timeRemainingValue = "Es hora de salir";
      break;
  }

  if (timeRemainingLabel && timeRemainingValue) {
    const urgentStyle = isUrgent ? "color: #dc2626; font-weight: 600;" : "";
    reminderDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid ${isUrgent ? "#fecaca" : "#e5e7eb"}; border-radius: 6px; background: ${isUrgent ? "#fef2f2" : "#ffffff"};">
        <tr>
          <td style="padding: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">${timeRemainingLabel}</td>
              </tr>
              <tr>
                <td style="font-size: 14px; font-weight: 400; color: #111827; line-height: 1.4; ${urgentStyle}">${timeRemainingValue}</td>
              </tr>
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
    });
    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    const formattedTime = startDate.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    let dateTimeText = `${capitalizedDate} a las ${formattedTime}`;

    // Add end time if available
    if (metadata.datetimeEnd) {
      const endDate = new Date(metadata.datetimeEnd);
      const endTime = endDate.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
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

  // Appointment type section (full width)
  if (appointmentTypeLabel) {
    reminderDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
        <tr>
          <td style="padding: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">Tipo de cita</td>
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

  // Notes section (full width)
  if (metadata.location) {
    reminderDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
        <tr>
          <td style="padding: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">Notas</td>
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

  // Preparation tips section for urgent reminders
  if (isUrgent) {
    let tips: string[] = [];
    if (timeframe === "travel_time") {
      tips = [
        "Verifica que tengas todo lo necesario",
        "Revisa el tráfico antes de salir",
        "Lleva los documentos requeridos",
      ];
    } else if (timeframe === "30min" || timeframe === "30_min") {
      tips = [
        "Prepárate para salir pronto",
        "Revisa los detalles de la cita",
        "Confirma la dirección",
      ];
    } else if (timeframe === "1h") {
      tips = [
        "Revisa los detalles de la cita",
        "Prepara todo lo necesario",
        "Planifica tu ruta",
      ];
    }

    if (tips.length > 0) {
      const tipsHtml = tips.map(tip => `<li style="margin-bottom: 4px;">${tip}</li>`).join("");
      reminderDetailsSections.push(`
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #fde68a; border-radius: 6px; background: #fffbeb;">
          <tr>
            <td style="padding: 10px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-size: 10px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">💡 Recordatorios</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; font-weight: 400; color: #78350f; line-height: 1.4;">
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

  // Determine action label
  let actionLabel = "Ver cita";
  if (timeframe === "travel_time") {
    actionLabel = "Ver direcciones";
  } else if (isUrgent) {
    actionLabel = "Ver detalles de la cita";
  }

  // Update action URL to point to calendar
  const calendarUrl = actionUrl
    ? actionUrl.replace(/\/calendario(\?appointmentId=\d+)?/, "/calendario")
    : `${baseUrl}/calendario`;

  // Generate property card HTML if listing data is available
  let propertyCardHtml = "";
  if (metadata.listing) {
    const listing = metadata.listing;
    const listingId = listing.listingId?.toString() ?? "";
    const propertyBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
    const propertyUrl = listingId ? `${propertyBaseUrl}/propiedades/${listingId}` : actionUrl ?? "#";

    propertyCardHtml = generatePropertyCardHtml(listing, propertyUrl);
  }

  // Generate contact cards HTML
  let contactCardsHtml = "";
  const contactCards: string[] = [];

  // Helper function to generate a contact card
  const generateContactCard = (
    firstName: string,
    lastName: string,
    email: string | null | undefined,
    phone: string | null | undefined,
    label: string,
  ): string => {
    const contactName = `${firstName} ${lastName}`;
    const displayName = `${contactName} (${label})`;

    return `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
        <tr>
          <td style="padding: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 12px; font-weight: 500; color: #111827; line-height: 1.3; padding-bottom: 6px;">
                  ${displayName}
                </td>
              </tr>
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="4" border="0">
                    <tr>
                      ${phone ? `
                        <td>
                          <a href="tel:${phone.replace(/\s/g, "")}"
                             style="display: inline-block; padding: 5px 10px; background: #ffffff; color: #111827; text-decoration: none; font-size: 12px; font-weight: 500; border-radius: 4px; border: 1px solid #e5e7eb;">
                            📞 Llamar
                          </a>
                        </td>
                      ` : ""}
                      ${email ? `
                        <td>
                          <a href="mailto:${email}"
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
  };

  // Owner card (from listingContacts table)
  if (metadata.owner) {
    const owner = metadata.owner;
    contactCards.push(generateContactCard(
      owner.firstName,
      owner.lastName,
      owner.email,
      owner.phone,
      "Propietario",
    ));
  }

  // Buyer card (from listingContacts table)
  if (metadata.buyer) {
    const buyer = metadata.buyer;
    contactCards.push(generateContactCard(
      buyer.firstName,
      buyer.lastName,
      buyer.email,
      buyer.phone,
      "Comprador",
    ));
  }

  // Fallback to generic contact for backward compatibility (if no owner/buyer)
  if (!metadata.owner && !metadata.buyer && metadata.contact) {
    const contact = metadata.contact;
    const contactType = contact.isOwner ? "Propietario" : contact.isBuyer ? "Comprador" : "Contacto";
    contactCards.push(generateContactCard(
      contact.firstName,
      contact.lastName,
      contact.email,
      contact.phone,
      contactType,
    ));
  }

  if (contactCards.length > 0) {
    contactCardsHtml = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 12px 0;">
        <tr>
          <td>
            ${contactCards.join("")}
          </td>
        </tr>
      </table>
    `;
  }

  // Generate base email with empty message (we'll inject content)
  const { html: baseHtml, text: baseText } = generateNotificationEmailBase(
    subject,
    "",
    calendarUrl ?? metadata.directionsUrl ?? null,
    actionLabel,
  );

  // Inject structured sections, contact cards, and property card into the HTML
  let finalHtml = baseHtml;
  if (structuredMessageHtml || propertyCardHtml || contactCardsHtml) {
    const allContentHtml = (structuredMessageHtml || "") + (contactCardsHtml || "") + (propertyCardHtml || "");

    // Wrap all content in a table row to match the base template structure
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

    // Insert after the message paragraph closing tag, before the next section
    finalHtml = baseHtml.replace(
      /(<\/p>\s*<\/td>\s*<\/tr>\s*)(<!-- Action Button Section -->|\s*<tr>\s*<td align="center")/,
      `</p>${wrappedContent.trim()}</td></tr>$2`,
    );

    // Fallback: if pattern not found, try alternative injection point
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
 * Generate property card HTML for appointment reminders
 * Uses TABLE-BASED layout for maximum email client compatibility
 */
function generatePropertyCardHtml(
  listing: {
    listingId?: string;
    listingType?: string;
    price?: string;
    title?: string | null;
    street?: string | null;
    propertyType?: string | null;
    bedrooms?: number | null;
    bathrooms?: string | number | null;
    squareMeter?: number | null;
    builtSurfaceArea?: number | null;
    city?: string | null;
    province?: string | null;
    neighborhood?: string | null;
    referenceNumber?: string | null;
    isBankOwned?: boolean | null;
    imageUrl?: string | null;
    imageUrls?: string[] | null;
  },
  propertyUrl: string,
): string {
  // Helper functions
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

  // Get square meters using the utility function
  const squareMeter = getSquareMeter({
    squareMeter: listing.squareMeter ?? null,
    builtSurfaceArea: listing.builtSurfaceArea ?? null,
  });

  // Get primary image
  const primaryImage = listing.imageUrls && listing.imageUrls.length > 0
    ? listing.imageUrls[0]
    : listing.imageUrl ?? null;

  // Check if image is valid (not a video)
  const isValidImage = (url: string | null | undefined): boolean => {
    if (!url) return false;
    if (url.includes("youtube.com") || url.includes("youtu.be")) return false;
    if (/\.(mp4|mov|avi|webm|mkv|flv|wmv)(\?|$)/i.exec(url)) return false;
    if (url.includes("/videos/")) return false;
    return true;
  };

  const validImageUrl = isValidImage(primaryImage) ? primaryImage : null;

  // Price to display
  const displayPrice = listing.price;
  const listingType = listing.listingType ?? "";
  const isRent = ["Rent", "RentWithOption", "RoomSharing"].includes(listingType);

  // Property type and listing type labels
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
        details.push(`🛏️ ${listing.bedrooms} ${listing.bedrooms === 1 ? "Hab" : "Habs"}`);
      }
      if (listing.bathrooms) {
        details.push(`🚿 ${Math.floor(Number(listing.bathrooms))} ${Math.floor(Number(listing.bathrooms)) === 1 ? "Baño" : "Baños"}`);
      }
    }
    if (squareMeter) {
      details.push(`📐 ${squareMeter} m²`);
    }

    detailsHtml = `
      <tr>
        <td style="padding: 6px 10px; font-size: 11px; color: #6b7280;">
          ${details.join(" &nbsp;•&nbsp; ")}
        </td>
      </tr>
    `;
  }

  // Build property card HTML
  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; background: #ffffff;">
      <tr>
        <td>
          <a href="${propertyUrl}" style="text-decoration: none; color: inherit; display: block;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <!-- Image Section -->
              ${validImageUrl ? `
                <tr>
                  <td style="background: #f9fafb;">
                    <img
                      src="${validImageUrl}"
                      alt="${listing.street ?? listing.title ?? "Property"}"
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

              <!-- Title and Price Row -->
              <tr>
                <td style="padding: 10px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="font-size: 15px; font-weight: 600; color: #111827; line-height: 1.3;">
                        ${listing.street ?? listing.title ?? "Propiedad"}
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

              <!-- Location Row -->
              ${(listing.city || listing.province) ? `
                <tr>
                  <td style="padding: 0 10px 6px 10px; font-size: 11px; color: #6b7280;">
                    📍 ${[listing.city, listing.province].filter(Boolean).join(", ")}
                  </td>
                </tr>
              ` : ""}

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
          </a>
        </td>
      </tr>
    </table>
  `;
}
