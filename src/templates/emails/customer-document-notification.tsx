/**
 * Customer Document Notification Email Template
 *
 * Generates customer-facing email content for document-related notifications:
 * - Document ready
 * - Signature required
 * - Document expiring
 */

import { generateNotificationEmailBase } from "./notification-base";

export interface CustomerDocumentNotificationMetadata {
  notificationType: "document_ready" | "signature_required" | "document_expiring";
  documentName: string;
  documentType?: string;
  documentDescription?: string;
  readyDate?: string;
  signatureDeadline?: string;
  expirationDate?: string;
  daysUntilExpiration?: number;
  renewalInstructions?: string;
  downloadUrl?: string;
  signingUrl?: string;
  renewalUrl?: string;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
}

export function generateCustomerDocumentNotificationEmail(
  metadata: CustomerDocumentNotificationMetadata,
): { subject: string; html: string; text: string } {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";

  let subject = "";
  let message = "";
  let actionUrl: string | null = null;
  let actionLabel = "";

  switch (metadata.notificationType) {
    case "document_ready":
      subject = `Documento listo para revisión: ${metadata.documentName}`;
      message = `Tu documento está listo para revisión:\n\n${metadata.documentName}`;
      
      if (metadata.documentType) {
        message += `\n\n📄 Tipo: ${metadata.documentType}`;
      }
      
      if (metadata.documentDescription) {
        message += `\n\n📝 Descripción:\n${metadata.documentDescription}`;
      }
      
      if (metadata.readyDate) {
        const readyDate = new Date(metadata.readyDate);
        const formattedDate = readyDate.toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        message += `\n\n✅ Listo desde: ${formattedDate}`;
      }
      
      message += `\n\n📋 Próximos pasos:\n- Revisa el documento`;
      if (metadata.signingUrl) {
        message += `\n- Firma el documento si es necesario`;
      }
      message += `\n- Contacta a tu agente si tienes preguntas`;
      
      actionUrl = metadata.downloadUrl ?? `${baseUrl}/documentos/${encodeURIComponent(metadata.documentName)}`;
      actionLabel = "Ver documento";
      break;

    case "signature_required":
      subject = `Firma requerida: ${metadata.documentName}`;
      message = `Se requiere tu firma en el siguiente documento:\n\n${metadata.documentName}`;
      
      if (metadata.documentType) {
        message += `\n\n📄 Tipo: ${metadata.documentType}`;
      }
      
      if (metadata.documentDescription) {
        message += `\n\n📝 Descripción:\n${metadata.documentDescription}`;
      }
      
      if (metadata.signatureDeadline) {
        const deadline = new Date(metadata.signatureDeadline);
        const formattedDeadline = deadline.toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const formattedTime = deadline.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        });
        message += `\n\n⏰ Fecha límite para firmar: ${formattedDeadline} a las ${formattedTime}`;
        
        // Calculate urgency
        const now = new Date();
        const hoursUntilDeadline = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
        if (hoursUntilDeadline < 24) {
          message += `\n\n⚠️ Atención: La fecha límite es en menos de 24 horas`;
        }
      }
      
      message += `\n\n📋 Instrucciones:\n- Revisa el documento cuidadosamente`;
      message += `\n- Firma el documento usando el enlace a continuación`;
      message += `\n- Contacta a tu agente si tienes preguntas`;
      
      actionUrl = metadata.signingUrl ?? `${baseUrl}/documentos/firmar/${encodeURIComponent(metadata.documentName)}`;
      actionLabel = "Firmar documento";
      break;

    case "document_expiring":
      subject = `Recordatorio: Documento próximo a vencer - ${metadata.documentName}`;
      message = `Tu documento está próximo a vencer:\n\n${metadata.documentName}`;
      
      if (metadata.documentType) {
        message += `\n\n📄 Tipo: ${metadata.documentType}`;
      }
      
      if (metadata.expirationDate) {
        const expiration = new Date(metadata.expirationDate);
        const formattedExpiration = expiration.toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        message += `\n\n📅 Fecha de vencimiento: ${formattedExpiration}`;
      }
      
      if (metadata.daysUntilExpiration !== undefined) {
        if (metadata.daysUntilExpiration === 0) {
          message += `\n\n⚠️ Este documento vence HOY`;
        } else if (metadata.daysUntilExpiration === 1) {
          message += `\n\n⚠️ Este documento vence MAÑANA`;
        } else {
          message += `\n\n⏰ Tiempo restante: ${metadata.daysUntilExpiration} días`;
        }
      }
      
      if (metadata.renewalInstructions) {
        message += `\n\n📋 Instrucciones para renovación:\n${metadata.renewalInstructions}`;
      } else {
        message += `\n\n📋 Próximos pasos:\n- Renueva el documento antes de la fecha de vencimiento`;
        message += `\n- Contacta a tu agente para más información`;
      }
      
      actionUrl = metadata.renewalUrl ?? `${baseUrl}/documentos/renovar/${encodeURIComponent(metadata.documentName)}`;
      actionLabel = "Renovar documento";
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


