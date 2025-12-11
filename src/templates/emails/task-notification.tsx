/**
 * Task Notification Email Template
 *
 * Generates email content for task-related notifications
 * with task-specific details like due dates, urgency, etc.
 * Enhanced to handle task events: assigned, completed, reassigned
 */

import { generateNotificationEmailBase } from "./notification-base";
import type { Notification, TaskNotificationMetadata } from "~/types/notifications";

export function generateTaskNotificationEmail(
  notification: Notification,
): { subject: string; html: string; text: string } {
  const metadata = notification.metadata as TaskNotificationMetadata;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
  const actionUrl = notification.actionUrl
    ? `${baseUrl}${notification.actionUrl}`
    : null;

  // Build detailed message with task information
  let detailedMessage = notification.message;

  // Handle task-specific event types with enhanced messaging
  if (notification.type === "task_assigned") {
    // Task assigned notification
    if (metadata.taskTitle) {
      detailedMessage = `Se te ha asignado una nueva tarea: ${metadata.taskTitle}`;
    }
    // Add who assigned it if available
    if (metadata.assignedByName || metadata.assignerName) {
      detailedMessage += `\n\n👤 Asignada por: ${metadata.assignerName ?? metadata.assignedByName}`;
    }
  } else if (notification.type === "task_completed") {
    // Task completed notification
    if (metadata.taskTitle) {
      detailedMessage = `La tarea "${metadata.taskTitle}" ha sido completada.`;
    }
    // Add who completed it if available
    if (metadata.completedByName) {
      detailedMessage += `\n\n✅ Completada por: ${metadata.completedByName}`;
    }
  } else if (notification.type === "task_reassigned") {
    // Task reassigned notification
    if (metadata.taskTitle) {
      detailedMessage = `Tu tarea "${metadata.taskTitle}" ha sido reasignada.`;
    }
    if (metadata.previousAssigneeName && metadata.newAssigneeName) {
      detailedMessage += `\n\n🔄 Reasignada de: ${metadata.previousAssigneeName} a: ${metadata.newAssigneeName}`;
    } else if (metadata.newAssigneeName) {
      detailedMessage += `\n\n🔄 Reasignada a: ${metadata.newAssigneeName}`;
    }
    if (metadata.reassignedByName) {
      detailedMessage += `\n\n👤 Reasignada por: ${metadata.reassignedByName}`;
    }
  }

  // Add due date information if available
  if (metadata.dueDate) {
    const dueDate = new Date(metadata.dueDate);
    const formattedDate = dueDate.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    detailedMessage += `\n\n📅 Fecha de vencimiento: ${formattedDate}`;
    if (metadata.dueTime) {
      detailedMessage += ` a las ${metadata.dueTime}`;
    }
  }

  // Add urgency information if available
  if (metadata.urgency) {
    const urgencyLabels: Record<number, string> = {
      1: "Baja",
      2: "Media",
      3: "Alta",
      4: "Urgente",
      5: "Crítica",
    };
    const urgencyLabel = urgencyLabels[metadata.urgency] ?? "Normal";
    detailedMessage += `\n\n⚡ Urgencia: ${urgencyLabel}`;
  }

  // Add category if available
  if (metadata.category) {
    detailedMessage += `\n\n📁 Categoría: ${metadata.category}`;
  }

  // Determine action label based on notification type
  let actionLabel = "Ver tarea";
  if (notification.type === "task_assigned") {
    actionLabel = "Ver tarea asignada";
  } else if (notification.type === "task_completed") {
    actionLabel = "Ver tarea completada";
  } else if (notification.type === "task_reassigned") {
    actionLabel = "Ver tarea reasignada";
  }

  // Generate property card HTML if listing data is available
  let propertyCardHtml = "";
  if (metadata.listing) {
    const listing = metadata.listing;
    const formatPrice = (price: string) => {
      return new Intl.NumberFormat("es-ES").format(Number(price));
    };
    const formatListingType = (type: string) => {
      const types: Record<string, string> = {
        Sale: "Venta",
        Rent: "Alquiler",
        RentWithOption: "Alquiler con opción",
        RoomSharing: "Compartir",
      };
      return types[type] ?? type;
    };
    const getPropertyTypeLabel = (type: string | null) => {
      const types: Record<string, string> = {
        piso: "Piso",
        casa: "Casa",
        local: "Local",
        solar: "Solar",
        garaje: "Garaje",
      };
      return type ? types[type] ?? type : "";
    };
    const getSquareMeter = () => {
      return listing.squareMeter ?? listing.builtSurfaceArea ?? null;
    };

    propertyCardHtml = `
      <div style="margin: 24px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #ffffff;">
        ${listing.imageUrl ? `
          <div style="position: relative; width: 100%; padding-top: 75%; background: #f3f4f6; overflow: hidden;">
            <img src="${listing.imageUrl}" alt="${listing.title ?? "Property"}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" />
            <div style="position: absolute; top: 8px; left: 8px; background: rgba(255,255,255,0.9); padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
              ${getPropertyTypeLabel(listing.propertyType)}
            </div>
            <div style="position: absolute; top: 8px; right: 8px; background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
              ${formatListingType(listing.listingType)}
            </div>
            ${listing.referenceNumber ? `
              <div style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.6); color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; letter-spacing: 1px;">
                ${listing.referenceNumber}
              </div>
            ` : ""}
          </div>
        ` : `
          <div style="padding: 40px; background: #f3f4f6; text-align: center; color: #6b7280;">
            <div style="font-size: 48px; margin-bottom: 8px;">🏠</div>
            <div style="font-size: 14px;">${getPropertyTypeLabel(listing.propertyType)}</div>
          </div>
        `}
        <div style="padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #111827; flex: 1;">
              ${listing.street ?? listing.title ?? "Propiedad"}
            </h3>
            <p style="margin: 0; font-size: 16px; font-weight: 700; color: #111827;">
              ${formatPrice(listing.price)}€${["Rent", "RentWithOption", "RoomSharing"].includes(listing.listingType) ? "/mes" : ""}
            </p>
          </div>
          ${listing.city ? `
            <div style="margin-bottom: 12px; font-size: 12px; color: #6b7280;">
              📍 ${listing.city}${listing.province ? `, ${listing.province}` : ""}
            </div>
          ` : ""}
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6b7280;">
            ${listing.propertyType && !["solar", "garaje", "local"].includes(listing.propertyType) ? `
              ${listing.bedrooms ? `<div>🛏️ ${listing.bedrooms} ${listing.bedrooms === 1 ? "Hab" : "Habs"}</div>` : ""}
              ${listing.bathrooms ? `<div>🚿 ${Math.floor(Number(listing.bathrooms))} ${Math.floor(Number(listing.bathrooms)) === 1 ? "Baño" : "Baños"}</div>` : ""}
            ` : ""}
            <div>📐 ${getSquareMeter() ?? "-"} m²</div>
          </div>
          ${listing.agentName ? `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              👤 ${listing.agentName}
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }

  // Generate contact card HTML if contact data is available
  let contactCardHtml = "";
  if (metadata.contact) {
    const contact = metadata.contact;
    const initials = `${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}`.toUpperCase();
    const bgColor = contact.isOwner ? "rgba(149,113,79,1)" : contact.isBuyer ? "rgba(140,145,108,1)" : "#6b7280";

    contactCardHtml = `
      <div style="margin: 24px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #ffffff;">
        <div style="background: ${bgColor}; padding: 24px; text-align: center;">
          <div style="display: inline-block; width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.9); line-height: 48px; font-size: 18px; font-weight: 600; color: #374151;">
            ${initials}
          </div>
          <div style="margin-top: 12px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            ${contact.isOwner ? `
              <span style="background: rgba(255,255,255,0.9); padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 500; color: rgba(149,113,79,1);">
                🏠 Propietario
              </span>
            ` : ""}
            ${contact.isBuyer ? `
              <span style="background: rgba(255,255,255,0.9); padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 500; color: rgba(140,145,108,1);">
                🔍 Comprador
              </span>
            ` : ""}
          </div>
        </div>
        <div style="padding: 16px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">
            ${contact.firstName} ${contact.lastName}
          </h3>
          ${contact.email || contact.phone ? `
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
              ${contact.phone ? `
                <a href="tel:${contact.phone.replace(/\s/g, "")}" 
                   style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 500;">
                  📞 Llamar
                </a>
              ` : ""}
              ${contact.email ? `
                <a href="mailto:${contact.email}" 
                   style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 500;">
                  ✉️ Email
                </a>
              ` : ""}
            </div>
          ` : ""}
          ${contact.email ? `
            <div style="margin-bottom: 4px; font-size: 12px; color: #6b7280;">
              ✉️ ${contact.email}
            </div>
          ` : ""}
          ${contact.phone ? `
            <div style="font-size: 12px; color: #6b7280;">
              📞 ${contact.phone}
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }

  // Generate assigner contact links HTML if available
  let assignerContactHtml = "";
  if (metadata.assignerEmail || metadata.assignerPhone) {
    const assignerName = metadata.assignerName ?? metadata.assignedByName ?? "Asignador";
    assignerContactHtml = `
      <div style="margin: 24px 0; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #111827;">
          👤 Contactar a ${assignerName}
        </div>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          ${metadata.assignerPhone ? `
            <a href="tel:${metadata.assignerPhone.replace(/\s/g, "")}" 
               style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
              📞 Llamar
            </a>
          ` : ""}
          ${metadata.assignerEmail ? `
            <a href="mailto:${metadata.assignerEmail}" 
               style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
              ✉️ Enviar email
            </a>
          ` : ""}
        </div>
        ${metadata.assignerPhone ? `
          <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">
            📞 ${metadata.assignerPhone}
          </div>
        ` : ""}
        ${metadata.assignerEmail ? `
          <div style="margin-top: 4px; font-size: 12px; color: #6b7280;">
            ✉️ ${metadata.assignerEmail}
          </div>
        ` : ""}
      </div>
    `;
  }

  // Add property and contact cards to the message if they exist
  let enhancedMessage = detailedMessage;
  if (propertyCardHtml || contactCardHtml || assignerContactHtml) {
    enhancedMessage += "\n\n---\n\n";
    if (propertyCardHtml) {
      enhancedMessage += "🏠 Propiedad relacionada\n\n";
    }
    if (contactCardHtml) {
      enhancedMessage += "👤 Contacto relacionado\n\n";
    }
    if (assignerContactHtml) {
      enhancedMessage += "👤 Contactar asignador\n\n";
    }
  }

  // Generate base email
  const { html: baseHtml, text: baseText } = generateNotificationEmailBase(
    notification.title,
    enhancedMessage,
    actionUrl,
    actionLabel,
  );

  // Inject property, contact cards, and assigner contact links into HTML after the message paragraph
  let finalHtml = baseHtml;
  if (propertyCardHtml || contactCardHtml || assignerContactHtml) {
    const cardsHtml = (assignerContactHtml || "") + (propertyCardHtml || "") + (contactCardHtml || "");
    // Insert cards after the message paragraph, before the action button
    finalHtml = baseHtml.replace(
      /(<\/p>\s*<\/div>\s*<div[^>]*text-align: center[^>]*>)/,
      `</p>${cardsHtml}</div><div style="text-align: center; margin: 30px 0;">`,
    );
    // Fallback: if pattern not found, insert before closing div of content area
    if (finalHtml === baseHtml) {
      finalHtml = baseHtml.replace(
        /(\s*<\/div>\s*<div[^>]*text-align: center[^>]*margin-top[^>]*>)/,
        `${cardsHtml}$1`,
      );
    }
  }

  return {
    subject: notification.title,
    html: finalHtml,
    text: baseText,
  };
}

