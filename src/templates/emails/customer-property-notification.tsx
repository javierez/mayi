/**
 * Customer Property Notification Email Template
 *
 * Generates customer-facing email content for property-related notifications:
 * - New listing available
 * - Price change
 * - Status change
 * - New photos added
 */

import { generateNotificationEmailBase } from "./notification-base";
import { getSquareMeter } from "~/lib/properties/area-utils";

export interface CustomerPropertyNotificationMetadata {
  notificationType: "new_listing" | "price_change" | "status_change" | "new_photos";
  propertyAddress: string;
  propertyTitle?: string;
  propertyType?: string;
  propertySize?: string;
  oldPrice?: number;
  newPrice?: number;
  priceChangePercentage?: number;
  previousStatus?: string;
  newStatus?: string;
  photos?: Array<{ url: string; thumbnail?: string }>;
  totalPhotos?: number;
  keyFeatures?: string[];
  description?: string;
  listingAgentName?: string;
  listingAgentPhone?: string;
  listingAgentEmail?: string;
  propertyUrl?: string;
  // Additional fields for property card
  bedrooms?: number;
  bathrooms?: number;
  squareMeter?: number;
  builtSurfaceArea?: number;
  city?: string;
  province?: string;
  referenceNumber?: string;
  listingType?: string;
  isBankOwned?: boolean;
}

export function generateCustomerPropertyNotificationEmail(
  metadata: CustomerPropertyNotificationMetadata,
): { subject: string; html: string; text: string } {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
  const actionUrl = metadata.propertyUrl ?? `${baseUrl}/propiedades/${metadata.propertyAddress}`;

  let subject = "";
  let message = "";

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  switch (metadata.notificationType) {
    case "new_listing":
      subject = `Nueva propiedad disponible: ${metadata.propertyAddress}`;
      message = `Tenemos una nueva propiedad que podría interesarte:\n\n${metadata.propertyAddress}`;
      
      if (metadata.propertyTitle) {
        message += `\n\n${metadata.propertyTitle}`;
      }
      
      if (metadata.newPrice) {
        message += `\n\n💰 Precio: ${formatPrice(metadata.newPrice)}`;
      }
      
      if (metadata.propertyType) {
        message += `\n\n🏠 Tipo: ${metadata.propertyType}`;
      }
      
      if (metadata.propertySize) {
        message += `\n\n📐 Tamaño: ${metadata.propertySize}`;
      }
      
      if (metadata.keyFeatures && metadata.keyFeatures.length > 0) {
        message += `\n\n✨ Características principales:`;
        metadata.keyFeatures.forEach((feature) => {
          message += `\n- ${feature}`;
        });
      }
      
      if (metadata.description) {
        message += `\n\n📝 Descripción:\n${metadata.description}`;
      }
      
      if (metadata.totalPhotos && metadata.totalPhotos > 0) {
        message += `\n\n📷 ${metadata.totalPhotos} foto${metadata.totalPhotos > 1 ? "s" : ""} disponible${metadata.totalPhotos > 1 ? "s" : ""}`;
      }
      break;

    case "price_change":
      subject = `Actualización de precio: ${metadata.propertyAddress}`;
      message = `El precio de la propiedad que te interesa ha cambiado:\n\n${metadata.propertyAddress}`;
      
      if (metadata.oldPrice && metadata.newPrice) {
        message += `\n\n💰 Precio anterior: ${formatPrice(metadata.oldPrice)}`;
        message += `\n💰 Nuevo precio: ${formatPrice(metadata.newPrice)}`;
        
        if (metadata.priceChangePercentage) {
          const changeEmoji = metadata.priceChangePercentage < 0 ? "📉" : "📈";
          message += `\n${changeEmoji} Cambio: ${Math.abs(metadata.priceChangePercentage).toFixed(1)}%`;
        }
      }
      
      if (metadata.propertyTitle) {
        message += `\n\n${metadata.propertyTitle}`;
      }
      
      if (metadata.propertyType) {
        message += `\n\n🏠 Tipo: ${metadata.propertyType}`;
      }
      
      if (metadata.totalPhotos && metadata.totalPhotos > 0) {
        message += `\n\n📷 Ver ${metadata.totalPhotos} foto${metadata.totalPhotos > 1 ? "s" : ""}`;
      }
      break;

    case "status_change":
      subject = `Actualización de estado: ${metadata.propertyAddress}`;
      message = `El estado de la propiedad ha cambiado:\n\n${metadata.propertyAddress}`;
      
      if (metadata.previousStatus && metadata.newStatus) {
        message += `\n\nEstado anterior: ${metadata.previousStatus}`;
        message += `\nNuevo estado: ${metadata.newStatus}`;
      } else if (metadata.newStatus) {
        message += `\n\nEstado: ${metadata.newStatus}`;
      }
      
      if (metadata.propertyTitle) {
        message += `\n\n${metadata.propertyTitle}`;
      }
      
      // If property is no longer available, suggest alternatives
      if (metadata.newStatus?.toLowerCase().includes("vendida") || 
          metadata.newStatus?.toLowerCase().includes("alquilada") ||
          metadata.newStatus?.toLowerCase().includes("retirada")) {
        message += `\n\n💡 Esta propiedad ya no está disponible. ¿Te gustaría que te mostremos propiedades similares?`;
      }
      break;

    case "new_photos":
      subject = `Nuevas fotos disponibles: ${metadata.propertyAddress}`;
      message = `Hemos añadido nuevas fotos a la propiedad que te interesa:\n\n${metadata.propertyAddress}`;
      
      if (metadata.propertyTitle) {
        message += `\n\n${metadata.propertyTitle}`;
      }
      
      if (metadata.totalPhotos && metadata.totalPhotos > 0) {
        message += `\n\n📷 Ahora hay ${metadata.totalPhotos} foto${metadata.totalPhotos > 1 ? "s" : ""} disponible${metadata.totalPhotos > 1 ? "s" : ""}`;
      }
      
      if (metadata.newPrice) {
        message += `\n\n💰 Precio: ${formatPrice(metadata.newPrice)}`;
      }
      break;
  }

  // Add agent contact information
  if (metadata.listingAgentName) {
    message += `\n\n👤 Tu agente: ${metadata.listingAgentName}`;
    if (metadata.listingAgentPhone) {
      message += `\n📞 Teléfono: ${metadata.listingAgentPhone}`;
    }
    if (metadata.listingAgentEmail) {
      message += `\n📧 Email: ${metadata.listingAgentEmail}`;
    }
  }

  // Determine action label
  let actionLabel = "Ver propiedad";
  if (metadata.notificationType === "new_listing") {
    actionLabel = "Ver nueva propiedad";
  } else if (metadata.notificationType === "price_change") {
    actionLabel = "Ver detalles actualizados";
  } else if (metadata.notificationType === "status_change") {
    actionLabel = "Ver estado actualizado";
  } else if (metadata.notificationType === "new_photos") {
    actionLabel = "Ver galería de fotos";
  }

  // Generate property card HTML
  const propertyCardHtml = generatePropertyCardHtml(metadata, actionUrl);

  const { html: baseHtml, text } = generateNotificationEmailBase(
    subject,
    message,
    actionUrl,
    actionLabel,
  );

  // Inject property card into HTML after the message paragraph, before the action button
  let finalHtml = baseHtml;
  if (propertyCardHtml) {
    // Insert property card after the message paragraph, before the action button
    finalHtml = baseHtml.replace(
      /(<\/p>\s*<\/div>\s*<div[^>]*text-align: center[^>]*>)/,
      `</p>${propertyCardHtml}</div><div style="text-align: center; margin: 30px 0;">`,
    );
    // Fallback: if pattern not found, insert before closing div of content area
    if (finalHtml === baseHtml) {
      finalHtml = baseHtml.replace(
        /(\s*<\/div>\s*<div[^>]*text-align: center[^>]*margin-top[^>]*>)/,
        `${propertyCardHtml}$1`,
      );
    }
  }

  return {
    subject,
    html: finalHtml,
    text,
  };
}

/**
 * Generate property card HTML matching the React component design
 */
function generatePropertyCardHtml(
  metadata: CustomerPropertyNotificationMetadata,
  propertyUrl: string,
): string {
  // Helper functions
  const formatPriceEmail = (price: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
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

  const getPropertyTypeLabel = (type?: string) => {
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

  // Get square meters
  const squareMeter = getSquareMeter({
    squareMeter: metadata.squareMeter ?? null,
    builtSurfaceArea: metadata.builtSurfaceArea ?? null,
  });

  // Get primary image (only one as requested)
  const primaryImage = metadata.photos && metadata.photos.length > 0
    ? metadata.photos[0].url ?? metadata.photos[0].thumbnail
    : null;

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
  const displayPrice = metadata.newPrice ?? metadata.oldPrice;
  const listingType = metadata.listingType ?? "";
  const isRent = ["Rent", "RentWithOption", "RoomSharing"].includes(listingType);

  // Generate image HTML
  let imageHtml = "";
  if (validImageUrl) {
    imageHtml = `
      <div style="position: relative; width: 100%; padding-top: 75%; background: #f9fafb; overflow: hidden;">
        <img 
          src="${validImageUrl}" 
          alt="${metadata.propertyAddress}" 
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" 
        />
      </div>
    `;
  } else {
    // Placeholder when no image
    const propertyTypeLabel = getPropertyTypeLabel(metadata.propertyType);
    const placeholderIcon = propertyTypeLabel ? propertyTypeLabel.charAt(0).toUpperCase() : "🏠";
    imageHtml = `
      <div style="padding: 60px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center; color: white; min-height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="font-size: 48px; margin-bottom: 8px;">${placeholderIcon}</div>
        ${propertyTypeLabel ? `<div style="font-size: 13px; font-weight: 400; opacity: 0.9;">${propertyTypeLabel}</div>` : ""}
      </div>
    `;
  }

  // Build property card HTML
  return `
    <div style="margin: 32px 0; overflow: hidden; background: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border-radius: 12px;">
      <a href="${propertyUrl}" style="text-decoration: none; color: inherit; display: block;">
        <!-- Image Section -->
        <div style="position: relative;">
          ${imageHtml}
          
          <!-- Top Left - Property Type Badge -->
          ${metadata.propertyType ? `
            <div style="position: absolute; left: 8px; top: 8px; z-index: 10; background: rgba(255, 255, 255, 0.8); padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; border: 1px solid rgba(229, 231, 235, 0.8);">
              ${getPropertyTypeLabel(metadata.propertyType)}
            </div>
          ` : ""}
          
          <!-- Top Right - Listing Type Badge -->
          ${listingType ? `
            <div style="position: absolute; right: 8px; top: 8px; z-index: 10; background: hsl(221.2, 83.2%, 53.3%); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
              ${formatListingType(listingType)}
            </div>
          ` : ""}
          
          <!-- Bottom Center - Reference Number -->
          ${metadata.referenceNumber ? `
            <div style="position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); z-index: 10;">
              <span style="font-size: 10px; font-weight: 600; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);">
                ${metadata.referenceNumber}
              </span>
            </div>
          ` : ""}
          
          <!-- Bottom Right - Bank Owned Badge -->
          ${metadata.isBankOwned ? `
            <div style="position: absolute; bottom: 8px; right: 8px; z-index: 10; background: #f59e0b; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
              Piso de Banco
            </div>
          ` : ""}
        </div>
        
        <!-- Content Section -->
        <div style="padding: 12px;">
          <!-- Title and Price -->
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; line-height: 1.3; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 8px;">
              ${metadata.propertyAddress}
            </h3>
            ${displayPrice ? `
              <p style="margin: 0; font-size: 16px; font-weight: 600; line-height: 1.3; white-space: nowrap;">
                ${formatPriceEmail(displayPrice)}€${isRent ? "/mes" : ""}
              </p>
            ` : ""}
          </div>
          
          <!-- Location -->
          ${(metadata.city || metadata.province) ? `
            <div style="margin-bottom: 8px; display: flex; align-items: center; font-size: 12px; color: #6b7280;">
              <span style="margin-right: 4px;">📍</span>
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${[metadata.city, metadata.province].filter(Boolean).join(", ")}
              </span>
            </div>
          ` : ""}
          
          <!-- Property Details (Bedrooms, Bathrooms, Square Meters) -->
          ${(metadata.bedrooms || metadata.bathrooms || squareMeter) && metadata.propertyType && !["solar", "garaje", "local"].includes(metadata.propertyType.toLowerCase()) ? `
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6b7280;">
              ${metadata.bedrooms ? `
                <div style="display: flex; align-items: center;">
                  <span style="margin-right: 4px;">🛏️</span>
                  <span>${metadata.bedrooms} ${metadata.bedrooms === 1 ? "Hab" : "Habs"}</span>
                </div>
              ` : ""}
              ${metadata.bathrooms ? `
                <div style="display: flex; align-items: center;">
                  <span style="margin-right: 4px;">🚿</span>
                  <span>${Math.floor(metadata.bathrooms)} ${Math.floor(metadata.bathrooms) === 1 ? "Baño" : "Baños"}</span>
                </div>
              ` : ""}
              ${squareMeter ? `
                <div style="display: flex; align-items: center;">
                  <span style="margin-right: 4px;">📐</span>
                  <span>${squareMeter} m²</span>
                </div>
              ` : ""}
            </div>
          ` : squareMeter ? `
            <div style="display: flex; justify-content: flex-end; font-size: 12px; color: #6b7280;">
              <div style="display: flex; align-items: center;">
                <span style="margin-right: 4px;">📐</span>
                <span>${squareMeter} m²</span>
              </div>
            </div>
          ` : ""}
        </div>
        
        <!-- Footer with Agent Name -->
        ${metadata.listingAgentName ? `
          <div style="border-top: 1px solid rgba(229, 231, 235, 0.4); padding: 12px; display: flex; align-items: center;">
            <span style="font-size: 12px; font-weight: 300; color: #6b7280;">
              👤 ${metadata.listingAgentName}
            </span>
          </div>
        ` : ""}
      </a>
    </div>
  `;
}

