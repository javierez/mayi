/**
 * Appointment Notification Email Template
 *
 * Generates email content for appointment-related notifications
 * with appointment-specific details like datetime, location, etc.
 * Enhanced to handle appointment events: scheduled, rescheduled, cancelled
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

export function generateAppointmentNotificationEmail(
  notification: Notification,
): { subject: string; html: string; text: string } {
  const metadata = notification.metadata as AppointmentNotificationMetadata;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
  const actionUrl = notification.actionUrl
    ? `${baseUrl}${notification.actionUrl}`
    : null;

  // Build structured message HTML with better visual hierarchy
  let structuredMessageHtml = "";

  // Build structured HTML sections for appointment details using TABLE layout
  const appointmentDetailsSections: string[] = [];

  // Programada por / Reprogramada por / Cancelada por section
  if (notification.type === "appointment_scheduled" && metadata.scheduledByName) {
    appointmentDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 12px;">
        <tr>
          <td style="padding: 16px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px;">Programada por</td>
              </tr>
              <tr>
                <td style="font-size: 15px; font-weight: 400; color: #111827; line-height: 1.5;">${metadata.scheduledByName}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  } else if (notification.type === "appointment_rescheduled" && metadata.rescheduledByName) {
    appointmentDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 12px;">
        <tr>
          <td style="padding: 16px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px;">Reprogramada por</td>
              </tr>
              <tr>
                <td style="font-size: 15px; font-weight: 400; color: #111827; line-height: 1.5;">${metadata.rescheduledByName}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  } else if (notification.type === "appointment_cancelled" && metadata.cancelledByName) {
    appointmentDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 12px;">
        <tr>
          <td style="padding: 16px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px;">Cancelada por</td>
              </tr>
              <tr>
                <td style="font-size: 15px; font-weight: 400; color: #111827; line-height: 1.5;">${metadata.cancelledByName}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  // Previous date section (for rescheduled appointments)
  if (notification.type === "appointment_rescheduled" && metadata.previousDatetime) {
    const previousDate = new Date(metadata.previousDatetime);
    const formattedPreviousDate = previousDate.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const capitalizedPreviousDate = formattedPreviousDate.charAt(0).toUpperCase() + formattedPreviousDate.slice(1);
    const formattedPreviousTime = previousDate.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    appointmentDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 12px;">
        <tr>
          <td style="padding: 16px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px;">Fecha anterior</td>
              </tr>
              <tr>
                <td style="font-size: 15px; font-weight: 400; color: #6b7280; line-height: 1.5; text-decoration: line-through;">${capitalizedPreviousDate} a las ${formattedPreviousTime}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  // Date and time section
  if (metadata.datetimeStart && notification.type !== "appointment_cancelled") {
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

    // Calculate time remaining
    const now = new Date();
    const timeDiff = startDate.getTime() - now.getTime();
    let timeRemainingText = "";
    if (timeDiff > 0) {
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (days > 0 && hours > 0) {
        timeRemainingText = ` (${days} ${days === 1 ? "día" : "días"} y ${hours} ${hours === 1 ? "hora" : "horas"})`;
      } else if (days > 0) {
        timeRemainingText = ` (${days} ${days === 1 ? "día" : "días"})`;
      } else if (hours > 0) {
        timeRemainingText = ` (${hours} ${hours === 1 ? "hora" : "horas"})`;
      }
    }

    const labelText = notification.type === "appointment_rescheduled" ? "Nueva fecha y hora" : "Fecha y hora";

    appointmentDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 12px;">
        <tr>
          <td style="padding: 16px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px;">${labelText}</td>
              </tr>
              <tr>
                <td style="font-size: 15px; font-weight: 400; color: #111827; line-height: 1.5;">${dateTimeText}${timeRemainingText}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  // Appointment type and location sections - displayed side by side
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
    ? (appointmentTypeLabels[metadata.appointmentType] ?? metadata.appointmentType)
    : null;

  // Appointment type section (full width)
  if (appointmentTypeLabel) {
    appointmentDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 12px;">
        <tr>
          <td style="padding: 16px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px;">Tipo de cita</td>
              </tr>
              <tr>
                <td style="font-size: 15px; font-weight: 400; color: #111827; line-height: 1.5;">${appointmentTypeLabel}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  // Notes section (full width)
  if (metadata.location) {
    appointmentDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 12px;">
        <tr>
          <td style="padding: 16px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px;">Notas</td>
              </tr>
              <tr>
                <td style="font-size: 15px; font-weight: 400; color: #111827; line-height: 1.5;">${metadata.location}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  // Cancellation reason section
  if (notification.type === "appointment_cancelled" && metadata.cancellationReason) {
    appointmentDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 12px;">
        <tr>
          <td style="padding: 16px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px;">Motivo de cancelación</td>
              </tr>
              <tr>
                <td style="font-size: 15px; font-weight: 400; color: #111827; line-height: 1.5;">${metadata.cancellationReason}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  // Combine structured sections
  if (appointmentDetailsSections.length > 0) {
    structuredMessageHtml = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 4px 0 8px 0;">
        <tr>
          <td>
            ${appointmentDetailsSections.join("")}
          </td>
        </tr>
      </table>
    `;
  }

  // Determine action label based on notification type
  let actionLabel = "Ver cita";
  if (notification.type === "appointment_scheduled") {
    actionLabel = "Ver en el calendario";
  } else if (notification.type === "appointment_rescheduled") {
    actionLabel = "Ver en el calendario";
  } else if (notification.type === "appointment_cancelled") {
    actionLabel = "Ver citas";
  }

  // Update action URL to point to calendar panel
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
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 8px;">
        <tr>
          <td style="padding: 12px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 12px; font-weight: 500; color: #111827; line-height: 1.4; padding-bottom: 8px;">
                  ${displayName}
                </td>
              </tr>
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="6" border="0">
                    <tr>
                      ${phone ? `
                        <td>
                          <a href="tel:${phone.replace(/\s/g, "")}"
                             style="display: inline-block; padding: 6px 12px; background: #ffffff; color: #111827; text-decoration: none; font-size: 13px; font-weight: 500; border-radius: 6px; border: 1px solid #e5e7eb;">
                            📞 Llamar
                          </a>
                        </td>
                      ` : ""}
                      ${email ? `
                        <td>
                          <a href="mailto:${email}"
                             style="display: inline-block; padding: 6px 12px; background: #ffffff; color: #111827; text-decoration: none; font-size: 13px; font-weight: 500; border-radius: 6px; border: 1px solid #e5e7eb;">
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
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 16px 0;">
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
    notification.title,
    "",
    calendarUrl,
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

              <!-- Additional Appointment Content -->
              <tr>
                <td style="padding: 0 40px;">
                  ${allContentHtml}
                </td>
              </tr>

              <tr>
                <td style="padding: 0 40px;">
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
        `<!-- Additional Appointment Content -->
              <tr>
                <td style="padding: 0 40px 20px 40px;">
                  ${allContentHtml}
                </td>
              </tr>

              $1`,
      );
    }
  }

  return {
    subject: notification.title,
    html: finalHtml,
    text: baseText,
  };
}

/**
 * Generate property card HTML for appointment notifications
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

  // Get primary image (only one as requested)
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

  // Generate badges HTML as separate row (email-safe)
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
        <td style="padding: 8px 12px 0 12px;">
          ${badges.join("")}
        </td>
      </tr>
    `;
  }

  // Build property details row (bedrooms, bathrooms, square meters)
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
        <td style="padding: 8px 12px; font-size: 12px; color: #6b7280;">
          ${details.join(" &nbsp;•&nbsp; ")}
        </td>
      </tr>
    `;
  }

  // Build property card HTML using TABLES for email compatibility
  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 32px 0; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #ffffff;">
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
                      style="display: block; width: 100%; height: auto; max-height: 200px; object-fit: cover;"
                    />
                  </td>
                </tr>
              ` : `
                <tr>
                  <td style="padding: 40px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center; color: white;">
                    <div style="font-size: 48px; margin-bottom: 8px;">🏠</div>
                    ${propertyTypeLabel ? `<div style="font-size: 13px; font-weight: 400; opacity: 0.9;">${propertyTypeLabel}</div>` : ""}
                  </td>
                </tr>
              `}

              <!-- Content Section -->
              ${badgesHtml}

              <!-- Title and Price Row -->
              <tr>
                <td style="padding: 12px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="font-size: 16px; font-weight: 600; color: #111827; line-height: 1.3;">
                        ${listing.street ?? listing.title ?? "Propiedad"}
                      </td>
                      ${displayPrice ? `
                        <td align="right" style="font-size: 16px; font-weight: 600; color: #111827; line-height: 1.3; white-space: nowrap;">
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
                  <td style="padding: 0 12px 8px 12px; font-size: 12px; color: #6b7280;">
                    📍 ${[listing.city, listing.province].filter(Boolean).join(", ")}
                  </td>
                </tr>
              ` : ""}

              <!-- Details Row -->
              ${detailsHtml}

              <!-- Reference Number -->
              ${listing.referenceNumber ? `
                <tr>
                  <td style="padding: 8px 12px 12px 12px; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; color: #9ca3af; text-transform: uppercase;">
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
