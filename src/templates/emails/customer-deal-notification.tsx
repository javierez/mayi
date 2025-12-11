/**
 * Customer Deal Notification Email Template
 *
 * Generates customer-facing email content for deal-related notifications:
 * - Offer received
 * - Offer accepted
 * - Deal closed
 * - Payment received
 */

import { generateNotificationEmailBase } from "./notification-base";

export interface CustomerDealNotificationMetadata {
  notificationType: "offer_received" | "offer_accepted" | "deal_closed" | "payment_received";
  dealTitle: string;
  propertyAddress?: string;
  offerAmount?: number;
  offerTerms?: string;
  offerExpirationDate?: string;
  acceptanceDate?: string;
  closingDate?: string;
  finalAmount?: number;
  paymentAmount?: number;
  paymentDate?: string;
  paymentMethod?: string;
  transactionReference?: string;
  paymentPurpose?: string; // "deposit", "installment", "final_payment", etc.
  nextSteps?: string[];
  postClosingInfo?: string;
  documents?: Array<{ name: string; url: string }>;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  dealUrl?: string;
}

export function generateCustomerDealNotificationEmail(
  metadata: CustomerDealNotificationMetadata,
): { subject: string; html: string; text: string } {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
  const actionUrl = metadata.dealUrl ?? `${baseUrl}/operaciones/${encodeURIComponent(metadata.dealTitle)}`;

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  let subject = "";
  let message = "";
  let actionLabel = "";

  switch (metadata.notificationType) {
    case "offer_received":
      subject = `Nueva oferta recibida: ${metadata.propertyAddress ?? metadata.dealTitle}`;
      message = `Se ha recibido una nueva oferta para tu propiedad:\n\n${metadata.propertyAddress ?? metadata.dealTitle}`;
      
      if (metadata.offerAmount) {
        message += `\n\n💰 Monto de la oferta: ${formatPrice(metadata.offerAmount)}`;
      }
      
      if (metadata.offerTerms) {
        message += `\n\n📋 Términos de la oferta:\n${metadata.offerTerms}`;
      }
      
      if (metadata.offerExpirationDate) {
        const expiration = new Date(metadata.offerExpirationDate);
        const formattedExpiration = expiration.toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        message += `\n\n⏰ Fecha límite de respuesta: ${formattedExpiration}`;
        
        // Calculate urgency
        const now = new Date();
        const hoursUntilExpiration = Math.floor((expiration.getTime() - now.getTime()) / (1000 * 60 * 60));
        if (hoursUntilExpiration < 24) {
          message += `\n\n⚠️ Atención: La oferta expira en menos de 24 horas`;
        }
      }
      
      message += `\n\n📋 Próximos pasos:\n- Revisa los detalles de la oferta`;
      message += `\n- Contacta a tu agente para discutir la oferta`;
      message += `\n- Decide si aceptas, rechazas o haces una contraoferta`;
      
      actionLabel = "Ver oferta";
      break;

    case "offer_accepted":
      subject = `¡Oferta aceptada! - ${metadata.propertyAddress ?? metadata.dealTitle}`;
      message = `¡Tu oferta ha sido aceptada! ¡Felicidades!\n\n${metadata.propertyAddress ?? metadata.dealTitle}`;
      
      if (metadata.offerAmount) {
        message += `\n\n💰 Monto aceptado: ${formatPrice(metadata.offerAmount)}`;
      }
      
      if (metadata.acceptanceDate) {
        const acceptance = new Date(metadata.acceptanceDate);
        const formattedAcceptance = acceptance.toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        message += `\n\n✅ Fecha de aceptación: ${formattedAcceptance}`;
      }
      
      if (metadata.nextSteps && metadata.nextSteps.length > 0) {
        message += `\n\n📋 Próximos pasos:`;
        metadata.nextSteps.forEach((step, index) => {
          message += `\n${index + 1}. ${step}`;
        });
      } else {
        message += `\n\n📋 Próximos pasos:\n- Revisa los documentos del acuerdo`;
        message += `\n- Completa los trámites necesarios`;
        message += `\n- Contacta a tu agente para más información`;
      }
      
      actionLabel = "Ver detalles del acuerdo";
      break;

    case "deal_closed":
      subject = `¡Operación cerrada! - ${metadata.propertyAddress ?? metadata.dealTitle}`;
      message = `¡Tu operación ha sido cerrada exitosamente! ¡Felicidades!\n\n${metadata.propertyAddress ?? metadata.dealTitle}`;
      
      if (metadata.finalAmount) {
        message += `\n\n💰 Monto final: ${formatPrice(metadata.finalAmount)}`;
      }
      
      if (metadata.closingDate) {
        const closing = new Date(metadata.closingDate);
        const formattedClosing = closing.toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        message += `\n\n✅ Fecha de cierre: ${formattedClosing}`;
      }
      
      if (metadata.documents && metadata.documents.length > 0) {
        message += `\n\n📄 Documentos disponibles:`;
        metadata.documents.forEach((doc) => {
          message += `\n- ${doc.name}`;
        });
      }
      
      if (metadata.postClosingInfo) {
        message += `\n\n📋 Información post-cierre:\n${metadata.postClosingInfo}`;
      } else {
        message += `\n\n📋 Información importante:\n- Guarda todos los documentos relacionados`;
        message += `\n- Contacta a tu agente si tienes preguntas`;
        message += `\n- ¡Gracias por confiar en nosotros!`;
      }
      
      actionLabel = "Ver documentos";
      break;

    case "payment_received":
      subject = `Pago recibido - Operación: ${metadata.propertyAddress ?? metadata.dealTitle}`;
      message = `Hemos recibido tu pago:\n\n${metadata.propertyAddress ?? metadata.dealTitle}`;
      
      if (metadata.paymentAmount) {
        message += `\n\n💰 Monto recibido: ${formatPrice(metadata.paymentAmount)}`;
      }
      
      if (metadata.paymentDate) {
        const payment = new Date(metadata.paymentDate);
        const formattedPayment = payment.toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        message += `\n\n📅 Fecha de pago: ${formattedPayment}`;
      }
      
      if (metadata.paymentMethod) {
        message += `\n\n💳 Método de pago: ${metadata.paymentMethod}`;
      }
      
      if (metadata.transactionReference) {
        message += `\n\n🔖 Referencia de transacción: ${metadata.transactionReference}`;
      }
      
      if (metadata.paymentPurpose) {
        const purposeLabels: Record<string, string> = {
          deposit: "Seña",
          installment: "Pago parcial",
          final_payment: "Pago final",
        };
        const purposeLabel = purposeLabels[metadata.paymentPurpose] ?? metadata.paymentPurpose;
        message += `\n\n📝 Propósito: ${purposeLabel}`;
      }
      
      message += `\n\n✅ Tu pago ha sido procesado correctamente.`;
      message += `\n\n📄 Recibirás un recibo por email en breve.`;
      
      actionLabel = "Ver detalles del pago";
      break;
  }

  // Add agent contact information
  if (metadata.agentName) {
    message += `\n\n👤 Tu agente: ${metadata.agentName}`;
    if (metadata.agentPhone) {
      message += `\n📞 Teléfono: ${metadata.agentPhone}`;
    }
    if (metadata.agentEmail) {
      message += `\n📧 Email: ${metadata.agentEmail}`;
    }
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

