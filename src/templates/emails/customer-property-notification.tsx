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

  const { html, text } = generateNotificationEmailBase(
    subject,
    message,
    actionUrl,
    actionLabel,
  );

  return {
    subject,
    html,
    text,
  };
}

