/**
 * Task Reminder Email Template
 *
 * Generates email content for task reminders at various timeframes:
 * - 1 week before
 * - 48 hours before
 * - 24 hours before
 * - 12 hours before
 * - 2 hours before
 * - 1 hour before
 *
 * IMPORTANT: This template uses TABLE-BASED layouts for maximum
 * email client compatibility (Outlook, Gmail, Yahoo, Apple Mail).
 */

import { generateNotificationEmailBase } from "./notification-base";
import type { Notification, TaskNotificationMetadata } from "~/types/notifications";
import { getSquareMeter } from "~/lib/properties/area-utils";

export interface TaskReminderMetadata extends TaskNotificationMetadata {
  reminderTimeframe?: "1_week" | "48h" | "24h" | "12h" | "2h" | "1h";
  hoursUntilDue?: number;
  daysUntilDue?: number;
}

export function generateTaskReminderEmail(
  notification: Notification,
): { subject: string; html: string; text: string } {
  const metadata = notification.metadata as TaskReminderMetadata;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
  const actionUrl = notification.actionUrl
    ? `${baseUrl}${notification.actionUrl}`
    : null;

  // Determine reminder timeframe and urgency level
  const timeframe = metadata.reminderTimeframe ?? "24h";
  const isUrgent = timeframe === "2h" || timeframe === "1h" || timeframe === "12h";
  const isCritical = timeframe === "1h" || timeframe === "2h";

  // Build subject based on timeframe
  let subject = notification.title;
  if (metadata.taskTitle) {
    const taskTitle = metadata.taskTitle;
    
    switch (timeframe) {
      case "1_week":
        subject = `Recordatorio: Tarea vence en 1 semana - ${taskTitle}`;
        break;
      case "48h":
        subject = `Recordatorio: Tarea vence en 48 horas - ${taskTitle}`;
        break;
      case "24h":
        subject = `⚠️ Tarea vence mañana - ${taskTitle}`;
        break;
      case "12h":
        subject = `⚠️ Tarea vence en 12 horas - ${taskTitle}`;
        break;
      case "2h":
        subject = `🚨 Tarea vence en 2 horas - ${taskTitle}`;
        break;
      case "1h":
        subject = `🚨 URGENTE: Tarea vence en 1 hora - ${taskTitle}`;
        break;
    }
  }

  // Use task description in the message area
  const taskDescription = metadata.taskDescription ?? "";

  // Build structured HTML sections for task details using TABLE layout
  const taskDetailsSections: string[] = [];

  // Helper function to get Spain time as UTC (matching how tasks are stored)
  // NOTE: Tasks store dates with local Spain time values in UTC format.
  // We need "now" to also use Spain time values in UTC format for correct comparison.
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
    const dateParts = datePart?.split('/').map(Number) ?? [];
    const timeParts = timePart?.split(':').map(Number) ?? [];
    const day = dateParts[0] ?? 1;
    const month = dateParts[1] ?? 1;
    const year = dateParts[2] ?? 2000;
    const hour = timeParts[0] ?? 0;
    const minute = timeParts[1] ?? 0;
    const second = timeParts[2] ?? 0;
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  };

  // Calculate actual time remaining from task due date/time
  const calculateTimeRemaining = (): string => {
    if (!metadata.dueDate) return "";
    
    // Parse due date
    const dueDate = new Date(metadata.dueDate);
    
    // Combine dueDate and dueTime to get actual deadline
    let actualDeadline: Date;
    if (metadata.dueTime) {
      const timeParts = metadata.dueTime.split(":").map(Number);
      const hours = timeParts[0] ?? 23;
      const minutes = timeParts[1] ?? 59;
      actualDeadline = new Date(Date.UTC(
        dueDate.getUTCFullYear(),
        dueDate.getUTCMonth(),
        dueDate.getUTCDate(),
        hours,
        minutes,
        0,
        0
      ));
    } else {
      // No dueTime, use end of day (23:59)
      actualDeadline = new Date(Date.UTC(
        dueDate.getUTCFullYear(),
        dueDate.getUTCMonth(),
        dueDate.getUTCDate(),
        23,
        59,
        59,
        999
      ));
    }
    
    const now = getSpainTimeAsUTC();
    const timeDiff = actualDeadline.getTime() - now.getTime();
    
    if (timeDiff <= 0) return "La tarea ya venció";
    
    const totalMinutes = Math.floor(timeDiff / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;
    
    if (days > 0) {
      if (hours > 0) {
        return `${days} ${days === 1 ? "día" : "días"} y ${hours} ${hours === 1 ? "hora" : "horas"}`;
      }
      return `${days} ${days === 1 ? "día" : "días"}`;
    } else if (hours > 0 && minutes > 0) {
      return `${hours} ${hours === 1 ? "hora" : "horas"} y ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? "hora" : "horas"}`;
    } else if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
    } else {
      return "Menos de 1 minuto";
    }
  };

  // Time remaining section - dynamically calculated
  const timeRemainingLabel = "Tiempo restante";
  const timeRemainingValue = calculateTimeRemaining();

  if (timeRemainingValue) {
    const urgencyColor = isCritical ? "#dc2626" : isUrgent ? "#f59e0b" : "#6b7280";
    taskDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
        <tr>
          <td style="padding: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">${timeRemainingLabel}</td>
              </tr>
              <tr>
                <td style="font-size: 14px; font-weight: 500; color: ${urgencyColor}; line-height: 1.4;">⏰ ${timeRemainingValue}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  // Asignado por section
  if (metadata.assignerName || metadata.assignedByName) {
    const assignerName = metadata.assignerName ?? metadata.assignedByName ?? "";
    taskDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
        <tr>
          <td style="padding: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">Asignado por</td>
              </tr>
              <tr>
                <td style="font-size: 14px; font-weight: 400; color: #111827; line-height: 1.4;">${assignerName}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  // Due date section (deadline)
  if (metadata.dueDate) {
    const dueDate = new Date(metadata.dueDate);
    const formattedDate = dueDate.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    // Capitalize first letter of weekday
    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    let dueDateText = capitalizedDate;
    if (metadata.dueTime) {
      // Remove seconds from time if present (format: HH:MM or HH:MM:SS)
      const timeWithoutSeconds = metadata.dueTime.split(":").slice(0, 2).join(":");
      dueDateText += ` a las ${timeWithoutSeconds}`;
    }
    
    taskDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
        <tr>
          <td style="padding: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">Fecha límite</td>
              </tr>
              <tr>
                <td style="font-size: 14px; font-weight: 400; color: #111827; line-height: 1.4;">${dueDateText}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  // Urgency and Category sections
  if (metadata.urgency) {
    const urgencyLabels: Record<number, string> = {
      1: "Baja",
      2: "Media",
      3: "Alta",
      4: "Urgente",
      5: "Crítica",
    };
    const urgencyLabel = urgencyLabels[metadata.urgency] ?? "Normal";

    taskDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
        <tr>
          <td style="padding: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">Urgencia</td>
              </tr>
              <tr>
                <td style="font-size: 14px; font-weight: 400; color: #111827; line-height: 1.4;">${urgencyLabel}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  if (metadata.category) {
    const formattedCategory = metadata.category.charAt(0).toUpperCase() + metadata.category.slice(1).toLowerCase();
    taskDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
        <tr>
          <td style="padding: 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">Categoría</td>
              </tr>
              <tr>
                <td style="font-size: 14px; font-weight: 400; color: #111827; line-height: 1.4;">${formattedCategory}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  // Combine structured sections
  let structuredMessageHtml = "";
  if (taskDetailsSections.length > 0) {
    structuredMessageHtml = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 2px 0 6px 0;">
        <tr>
          <td>
            ${taskDetailsSections.join("")}
          </td>
        </tr>
      </table>
    `;
  }

  // Determine action label - simplified text
  let actionLabel = "Ir al panel de tareas";
  if (isCritical) {
    actionLabel = "Ver tarea urgente";
  }
  
  // Update action URL to point to tasks panel
  const tasksPanelUrl = actionUrl 
    ? actionUrl.replace(/\/tareas(\?taskId=\d+)?/, "/tareas")
    : `${baseUrl}/tareas`;

  // Generate property card HTML if listing data is available
  let propertyCardHtml = "";
  if (metadata.listing) {
    const listing = metadata.listing;
    const listingId = listing.listingId?.toString() ?? "";
    const propertyBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
    const propertyUrl = listingId ? `${propertyBaseUrl}/propiedades/${listingId}` : actionUrl ?? "#";

    propertyCardHtml = generatePropertyCardHtmlForTaskReminder(listing as Parameters<typeof generatePropertyCardHtmlForTaskReminder>[0], propertyUrl);
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
                             style="display: inline-block; padding: 8px 14px; background: #ffffff; color: #111827; text-decoration: none; font-size: 15px; font-weight: 500; border-radius: 6px; border: 1px solid #e5e7eb;">
                            📞 ${phone}
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

  // Use empty message since we'll inject description separately
  const enhancedMessage = "";

  // Generate base email
  const { html: baseHtml, text: baseText } = generateNotificationEmailBase(
    notification.title,
    enhancedMessage,
    tasksPanelUrl,
    actionLabel,
  );

  // First, inject task description paragraph right after the title
  let finalHtml = baseHtml;
  if (taskDescription) {
    const descriptionHtml = `
                </td>
              </tr>
              
              <!-- Task Description -->
              <tr>
                <td class="email-padding" style="padding: 0 40px;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 400; color: #374151; line-height: 1.5;">
                    ${taskDescription}
                  </p>
                </td>
              </tr>
              
              <tr>
                <td class="email-padding" style="padding: 0 40px;">
    `;
    
    // Insert after the title closing tag, before the message section
    finalHtml = baseHtml.replace(
      /(<\/h2>\s*<\/td>\s*<\/tr>\s*)(<!-- Message Section -->)/,
      `</h2>${descriptionHtml.trim()}</td></tr>$2`,
    );
    
    // Fallback: if pattern not found, try after title
    if (finalHtml === baseHtml) {
      finalHtml = baseHtml.replace(
        /(<\/h2>\s*<\/td>\s*<\/tr>)/,
        `</h2></td></tr>
              <!-- Task Description -->
              <tr>
                <td class="email-padding" style="padding: 0 40px;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 400; color: #374151; line-height: 1.5;">
                    ${taskDescription}
                  </p>
                </td>
              </tr>`,
      );
    }
  }

  // Then inject structured sections, contact cards, and property card
  if (structuredMessageHtml || propertyCardHtml || contactCardsHtml) {
    // Order: task details, contact cards, then property card at bottom
    const allContentHtml = (structuredMessageHtml || "") + (contactCardsHtml || "") + (propertyCardHtml || "");
    
    // Wrap all content in a table row to match the base template structure
    const wrappedContent = `
                </td>
              </tr>
              
              <!-- Additional Task Content -->
              <tr>
                <td class="email-padding" style="padding: 0 40px;">
                  ${allContentHtml}
                </td>
              </tr>
              
              <tr>
                <td class="email-padding" style="padding: 0 40px;">
    `;
    
    // Insert after the message paragraph closing tag, before the next section
    finalHtml = finalHtml.replace(
      /(<\/p>\s*<\/td>\s*<\/tr>\s*)(<!-- Action Button Section -->|\s*<tr>\s*<td align="center")/,
      `</p>${wrappedContent.trim()}</td></tr>$2`,
    );
    
    // Fallback: if pattern not found, try alternative injection point
    if (finalHtml === baseHtml || finalHtml === baseHtml.replace(/(<\/h2>\s*<\/td>\s*<\/tr>)/, `</h2></td></tr>
              <!-- Task Description -->
              <tr>
                <td class="email-padding" style="padding: 0 40px;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 400; color: #374151; line-height: 1.5;">
                    ${taskDescription}
                  </p>
                </td>
              </tr>`)) {
      // Try injecting before the action button or spacer
      finalHtml = finalHtml.replace(
        /(<!-- Action Button Section -->|<!-- Spacer when no button -->)/,
        `<!-- Additional Task Content -->
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
 * Generate property card HTML matching the React component design for task reminders
 * Uses TABLE-BASED layout for maximum email client compatibility
 */
function generatePropertyCardHtmlForTaskReminder(
  listing: {
    listingId?: bigint | string;
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
  if (propertyTypeLabel || listingTypeLabel || listing.isBankOwned) {
    const badges: string[] = [];
    if (propertyTypeLabel) {
      badges.push(`<span style="display: inline-block; background: #f3f4f6; color: #374151; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; margin-right: 8px;">${propertyTypeLabel}</span>`);
    }
    if (listingTypeLabel) {
      badges.push(`<span style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; margin-right: 8px;">${listingTypeLabel}</span>`);
    }
    if (listing.isBankOwned) {
      badges.push(`<span style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">Piso de Banco</span>`);
    }
    badgesHtml = `
      <tr>
        <td style="padding: 6px 10px 0 10px;">
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
        <td style="padding: 6px 10px; font-size: 11px; color: #6b7280;">
          ${details.join(" &nbsp;•&nbsp; ")}
        </td>
      </tr>
    `;
  }

  // Build property card HTML using TABLES for email compatibility
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
