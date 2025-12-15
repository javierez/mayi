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
  const taskDescription = (metadata.taskDescription as string | undefined) ?? "";
  let detailedMessage = taskDescription;

  // Build structured HTML sections for task details using TABLE layout
  const taskDetailsSections: string[] = [];

  // Asignado por section
  if (metadata.assignerName || metadata.assignedByName) {
    const assignerName = metadata.assignerName ?? metadata.assignedByName ?? "";
    taskDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 12px;">
        <tr>
          <td style="padding: 16px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px;">Asignado por</td>
              </tr>
              <tr>
                <td style="font-size: 15px; font-weight: 400; color: #111827; line-height: 1.5;">${assignerName}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
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
    
    // Calculate remaining time
    const targetDate = new Date(metadata.dueDate);
    if (metadata.dueTime) {
      const [hours, minutes] = metadata.dueTime.split(":").map(Number);
      targetDate.setHours(hours ?? 23, minutes ?? 59, 0, 0);
    } else {
      targetDate.setHours(23, 59, 59, 999);
    }
    
    const now = new Date();
    const timeDiff = targetDate.getTime() - now.getTime();
    let remainingText = "";
    if (timeDiff > 0) {
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0 && hours > 0) {
        remainingText = ` (${days} ${days === 1 ? "día" : "días"} y ${hours} ${hours === 1 ? "hora" : "horas"} restantes)`;
      } else if (days > 0) {
        remainingText = ` (${days} ${days === 1 ? "día" : "días"} restantes)`;
      } else if (hours > 0) {
        remainingText = ` (${hours} ${hours === 1 ? "hora" : "horas"} restantes)`;
      }
    }
    
    taskDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 12px;">
        <tr>
          <td style="padding: 16px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px;">Fecha límite</td>
              </tr>
              <tr>
                <td style="font-size: 15px; font-weight: 400; color: #111827; line-height: 1.5;">${dueDateText}${remainingText}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `);
  }

  // Urgency and Category sections - displayed side by side
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

    taskDetailsSections.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 12px;">
        <tr>
          ${metadata.urgency ? `
            <td width="50%" style="padding-right: 6px; vertical-align: top;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding: 16px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px;">Urgencia</td>
                      </tr>
                      <tr>
                        <td style="font-size: 15px; font-weight: 400; color: #111827; line-height: 1.5;">${urgencyLabel}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          ` : ""}
          ${metadata.category ? `
            <td width="${metadata.urgency ? "50%" : "100%"}" style="${metadata.urgency ? "padding-left: 6px;" : ""} vertical-align: top;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding: 16px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 8px;">Categoría</td>
                      </tr>
                      <tr>
                        <td style="font-size: 15px; font-weight: 400; color: #111827; line-height: 1.5;">${formattedCategory}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          ` : ""}
        </tr>
      </table>
    `);
  }

  // Combine structured sections
  if (taskDetailsSections.length > 0) {
    structuredMessageHtml = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 4px 0 8px 0;">
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
  
  // Contact card (owner/buyer)
  if (metadata.contact) {
    const contact = metadata.contact;
    const contactType = contact.isOwner ? "Propietario" : contact.isBuyer ? "Comprador" : "Contacto";
    const contactName = `${contact.firstName} ${contact.lastName}`;
    // For buyers, ensure "(Comprador)" is shown at the end
    const displayName = contact.isBuyer 
      ? `${contactName} (Comprador)`
      : `${contactName} (${contactType})`;

    contactCards.push(`
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
                      ${contact.phone ? `
                        <td>
                          <a href="tel:${contact.phone.replace(/\s/g, "")}" 
                             style="display: inline-block; padding: 6px 12px; background: #ffffff; color: #111827; text-decoration: none; font-size: 13px; font-weight: 500; border-radius: 6px; border: 1px solid #e5e7eb;">
                            📞 Llamar
                          </a>
                        </td>
                      ` : ""}
                      ${contact.email ? `
                        <td>
                          <a href="mailto:${contact.email}" 
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
    `);
  }

  // Assigner contact card
  if (metadata.assignerEmail || metadata.assignerPhone) {
    const assignerName = metadata.assignerName ?? metadata.assignedByName ?? "Asignador";
    contactCards.push(`
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 8px;">
        <tr>
          <td style="padding: 12px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size: 12px; font-weight: 500; color: #111827; line-height: 1.4; padding-bottom: 8px;">
                  ${assignerName}
                </td>
              </tr>
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="6" border="0">
                    <tr>
                      ${metadata.assignerPhone ? `
                        <td>
                          <a href="tel:${metadata.assignerPhone.replace(/\s/g, "")}" 
                             style="display: inline-block; padding: 6px 12px; background: #ffffff; color: #111827; text-decoration: none; font-size: 13px; font-weight: 500; border-radius: 6px; border: 1px solid #e5e7eb;">
                            📞 Llamar
                          </a>
                        </td>
                      ` : ""}
                      ${metadata.assignerEmail ? `
                        <td>
                          <a href="mailto:${metadata.assignerEmail}" 
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
    `);
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
                <td style="padding: 0 40px;">
                  <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 400; color: #374151; line-height: 1.6;">
                    ${taskDescription}
                  </p>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 0 40px;">
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
                <td style="padding: 0 40px;">
                  <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 400; color: #374151; line-height: 1.6;">
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
                <td style="padding: 0 40px;">
                  ${allContentHtml}
                </td>
              </tr>
              
              <tr>
                <td style="padding: 0 40px;">
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
                <td style="padding: 0 40px;">
                  <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 400; color: #374151; line-height: 1.6;">
                    ${taskDescription}
                  </p>
                </td>
              </tr>`)) {
        // Try injecting before the action button or spacer
        finalHtml = finalHtml.replace(
          /(<!-- Action Button Section -->|<!-- Spacer when no button -->)/,
          `<!-- Additional Task Content -->
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
        <td style="padding: 8px 12px 0 12px;">
          ${badges.join("")}
        </td>
      </tr>
    `;
  }

  // Build property details row (bedrooms, bathrooms, square meters)
  let detailsHtml = "";
  const showDetails = (listing.bedrooms || listing.bathrooms || squareMeter) && 
    listing.propertyType && 
    !["solar", "garaje", "local"].includes(listing.propertyType.toLowerCase());
  
  if (showDetails || squareMeter) {
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
