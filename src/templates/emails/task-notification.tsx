/**
 * Task Notification Email Template
 *
 * Generates email content for task-related notifications
 * with task-specific details like due dates, urgency, etc.
 * Enhanced to handle task events: assigned, completed, reassigned
 * 
 * IMPORTANT: This template uses TABLE-BASED layouts for maximum
 * email client compatibility (Outlook, Gmail, Yahoo, Apple Mail).
 * JavaScript does NOT work in emails - countdown timers use
 * external image services that generate dynamic GIFs server-side.
 */

import { generateNotificationEmailBase } from "./notification-base";
import type { Notification, TaskNotificationMetadata } from "~/types/notifications";
import { getSquareMeter } from "~/lib/properties/area-utils";

export function generateTaskNotificationEmail(
  notification: Notification,
): { subject: string; html: string; text: string } {
  const metadata = notification.metadata as TaskNotificationMetadata;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
  const actionUrl = notification.actionUrl
    ? `${baseUrl}${notification.actionUrl}`
    : null;

  // Build structured message HTML with better visual hierarchy
  let structuredMessageHtml = "";

  // Use only task description in the message area
  const taskDescription = metadata.taskDescription ?? "";

  // Build structured HTML sections for task details using TABLE layout
  const taskDetailsSections: string[] = [];

  // Asignado por / Completado por section
  if (notification.type === "task_completed") {
    // For completed tasks, show "Completado por" section
    if (metadata.completerName || metadata.completedByName) {
      const completerName = metadata.completerName ?? metadata.completedByName ?? "";
      taskDetailsSections.push(`
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff;">
          <tr>
            <td style="padding: 10px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-size: 10px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">Completado por</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; font-weight: 400; color: #111827; line-height: 1.4;">${completerName}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `);
    }
  } else {
    // For assigned/reassigned tasks, show "Asignado por" section
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
  }

  // Due date section (deadline) - exclude for completed tasks
  if (metadata.dueDate && notification.type !== "task_completed") {
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
    
    // Calculate time difference - remaining time for non-overdue, overdue time for overdue tasks
    const targetDate = new Date(metadata.dueDate);
    if (metadata.dueTime) {
      const [hours, minutes] = metadata.dueTime.split(":").map(Number);
      targetDate.setHours(hours ?? 23, minutes ?? 59, 0, 0);
    } else {
      targetDate.setHours(23, 59, 59, 999);
    }
    
    const now = new Date();
    const timeDiff = targetDate.getTime() - now.getTime();
    let timeText = "";
    
    if (notification.type === "task_overdue") {
      // For overdue tasks, show how overdue
      if (timeDiff < 0) {
        const overdueMs = Math.abs(timeDiff);
        const daysOverdue = Math.floor(overdueMs / (1000 * 60 * 60 * 24));
        const hoursOverdue = Math.floor((overdueMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (daysOverdue > 0 && hoursOverdue > 0) {
          timeText = ` (Vencida hace ${daysOverdue} ${daysOverdue === 1 ? "día" : "días"} y ${hoursOverdue} ${hoursOverdue === 1 ? "hora" : "horas"})`;
        } else if (daysOverdue > 0) {
          timeText = ` (Vencida hace ${daysOverdue} ${daysOverdue === 1 ? "día" : "días"})`;
        } else if (hoursOverdue > 0) {
          timeText = ` (Vencida hace ${hoursOverdue} ${hoursOverdue === 1 ? "hora" : "horas"})`;
        } else {
          timeText = ` (Recién vencida)`;
        }
      }
    } else {
      // For non-overdue tasks, show remaining time
    if (timeDiff > 0) {
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0 && hours > 0) {
          timeText = ` (${days} ${days === 1 ? "día" : "días"} y ${hours} ${hours === 1 ? "hora" : "horas"} restantes)`;
      } else if (days > 0) {
          timeText = ` (${days} ${days === 1 ? "día" : "días"} restantes)`;
      } else if (hours > 0) {
          timeText = ` (${hours} ${hours === 1 ? "hora" : "horas"} restantes)`;
        }
      }
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
                <td style="font-size: 14px; font-weight: 400; color: #111827; line-height: 1.4;">${dueDateText}${timeText}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  // Urgency and Category sections - displayed as separate full-width boxes
  if (metadata.urgency || metadata.category) {
    const urgencyLabels: Record<number, string> = {
      1: "Baja",
      2: "Media",
      3: "Alta",
      4: "Urgente",
      5: "Crítica",
    };
    const urgencyLabel = metadata.urgency ? (urgencyLabels[metadata.urgency] ?? "Normal") : null;
    const formattedCategory = metadata.category 
      ? metadata.category.charAt(0).toUpperCase() + metadata.category.slice(1).toLowerCase()
      : null;

    // Urgency section - full width
    if (metadata.urgency) {
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

    // Category section - full width
    if (metadata.category) {
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
  }

  // Combine structured sections
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
  const actionLabel = "Ir al panel de tareas";
  
  // Update action URL to point to tasks panel (remove taskId query param if present)
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

    // Type assertion to match function signature (listingId can be string or bigint)
    propertyCardHtml = generatePropertyCardHtmlForTask(listing as Parameters<typeof generatePropertyCardHtmlForTask>[0], propertyUrl);
  }

  // Generate contact cards HTML (combine contact and assigner for compact display)
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

  // Note: Completer contact card removed for task_completed notifications
  // Only owner, buyer, and generic contact cards are shown

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

  // Add property and contact cards to the message if they exist
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
  // into the HTML after the message paragraph, before the action button.
  // Property card goes at the very bottom.
  // The base template uses table rows, so we insert new rows.
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
      // Pattern: close of </p> followed by </td> and </tr>
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

  // Add warning emoji to subject for overdue tasks
  const subject = notification.type === "task_overdue" 
    ? `🚨 ${notification.title}`
    : notification.title;

  return {
    subject,
    html: finalHtml,
    text: baseText,
  };
}

/**
 * Generate property card HTML matching the React component design for task notifications
 * Uses TABLE-BASED layout for maximum email client compatibility
 */
function generatePropertyCardHtmlForTask(
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
