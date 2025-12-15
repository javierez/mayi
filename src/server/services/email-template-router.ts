/**
 * Email Template Router
 *
 * Routes notifications to the appropriate email template generator
 * based on notification type and category.
 */

import type { Notification } from "~/types/notifications";
import type { MailSettings } from "~/components/admin/account/mail-configuration/types";
import { generateTaskNotificationEmail } from "~/templates/emails/task-notification";
import { generateAppointmentNotificationEmail } from "~/templates/emails/appointment-notification";
import { generateTaskReminderEmail } from "~/templates/emails/task-reminder";
import { generateAppointmentReminderEmail } from "~/templates/emails/appointment-reminder";
import { generateNotificationEmailBase } from "~/templates/emails/notification-base";
import { generateCustomerAppointmentReminderEmail } from "~/templates/emails/customer-appointment-reminder";
import { generateCustomerPropertyNotificationEmail } from "~/templates/emails/customer-property-notification";
import { generateCustomerDocumentNotificationEmail } from "~/templates/emails/customer-document-notification";
import { generateCustomerDealNotificationEmail } from "~/templates/emails/customer-deal-notification";
import { getReminderTimeframe } from "./email-config-helpers";

/**
 * Route notification to appropriate email template generator
 */
export function routeToTemplate(
  notification: Notification,
  _settings: MailSettings,
): { subject: string; html: string; text: string } {
  const notificationType = notification.type;
  const category = notification.category;
  
  // Task notifications
  if (category === "tasks") {
    // Overdue tasks (both critical and non-critical use the same template now)
    if (notificationType === "task_overdue") {
      return generateTaskNotificationEmail(notification);
    }
    
    // Task reminders (due soon)
    if (notificationType === "task_due_soon") {
      const metadata = notification.metadata as {
        dueDate?: string;
        timeframe?: string;
        [key: string]: unknown;
      };
      
      // Calculate timeframe if not provided
      let timeframe = metadata.timeframe;
      if (!timeframe && metadata.dueDate) {
        const dueDate = new Date(metadata.dueDate);
        const calculated = getReminderTimeframe(dueDate);
        if (calculated) {
          timeframe = calculated;
        }
      }
      
      // Add timeframe to metadata for template
      const reminderMetadata = {
        ...metadata,
        reminderTimeframe: timeframe,
      };
      
      const reminderNotification: Notification = {
        ...notification,
        metadata: reminderMetadata,
      };
      
      return generateTaskReminderEmail(reminderNotification);
    }
    
    // Task events (assigned, completed, reassigned)
    if (
      notificationType === "task_assigned" ||
      notificationType === "task_completed" ||
      notificationType === "task_reassigned"
    ) {
      return generateTaskNotificationEmail(notification);
    }
    
    // Default task notification
    return generateTaskNotificationEmail(notification);
  }
  
  // Appointment notifications
  if (category === "appointments") {
    // Appointment reminders
    if (notificationType === "appointment_reminder") {
      const metadata = notification.metadata as {
        reminderType?: string;
        appointmentType?: string;
        datetimeStart?: string;
        [key: string]: unknown;
      };
      
      // Map reminder type to timeframe
      let timeframe: "24h" | "12h" | "1h" | "30min" | "travel_time" | undefined;
      if (metadata.reminderType === "1_day" || metadata.reminderType === "24h") {
        timeframe = "24h";
      } else if (metadata.reminderType === "12h") {
        timeframe = "12h";
      } else if (metadata.reminderType === "1h") {
        timeframe = "1h";
      } else if (metadata.reminderType === "30_min" || metadata.reminderType === "30min") {
        timeframe = "30min";
      } else if (metadata.reminderType === "travel_time" || metadata.reminderType === "travel") {
        timeframe = "travel_time";
      }
      
      // Add timeframe to metadata
      const reminderMetadata = {
        ...metadata,
        reminderTimeframe: timeframe,
      };
      
      const reminderNotification: Notification = {
        ...notification,
        metadata: reminderMetadata,
      };
      
      return generateAppointmentReminderEmail(reminderNotification);
    }
    
    // Appointment events (scheduled, rescheduled, cancelled)
    if (
      notificationType === "appointment_scheduled" ||
      notificationType === "appointment_rescheduled" ||
      notificationType === "appointment_cancelled"
    ) {
      return generateAppointmentNotificationEmail(notification);
    }
    
    // Default appointment notification
    return generateAppointmentNotificationEmail(notification);
  }
  
  // Customer notifications
  if (category === "properties" || category === "contacts" || category === "deals") {
    // Check if this is a customer notification by looking at metadata or entity type
    const metadata = notification.metadata;
    
    // Customer property notifications
    if (category === "properties" && metadata.notificationType) {
      const notifType = metadata.notificationType as string;
      // Validate notification type and generate email if valid
      if (["new_listing", "price_change", "status_change", "new_photos"].includes(notifType)) {
        const customerMetadata = {
          notificationType: notifType as "new_listing" | "price_change" | "status_change" | "new_photos",
          propertyAddress: metadata.propertyAddress as string,
          propertyTitle: metadata.propertyTitle as string | undefined,
          propertyType: metadata.propertyType as string | undefined,
          propertySize: metadata.propertySize as string | undefined,
          oldPrice: metadata.oldPrice as number | undefined,
          newPrice: metadata.newPrice as number | undefined,
          priceChangePercentage: metadata.priceChangePercentage as number | undefined,
          previousStatus: metadata.previousStatus as string | undefined,
          newStatus: metadata.newStatus as string | undefined,
          photos: metadata.photos as Array<{ url: string; thumbnail?: string }> | undefined,
          totalPhotos: metadata.totalPhotos as number | undefined,
          keyFeatures: metadata.keyFeatures as string[] | undefined,
          description: metadata.description as string | undefined,
          listingAgentName: metadata.listingAgentName as string | undefined,
          listingAgentPhone: metadata.listingAgentPhone as string | undefined,
          listingAgentEmail: metadata.listingAgentEmail as string | undefined,
          propertyUrl: metadata.propertyUrl as string | undefined,
        };

        return generateCustomerPropertyNotificationEmail(customerMetadata);
      }
    }
    
    // Customer document notifications
    if (category === "contacts" && metadata.notificationType) {
      const docType = metadata.notificationType as string;
      if (docType.includes("document")) {
        const customerMetadata = {
          notificationType: docType as "document_ready" | "signature_required" | "document_expiring",
          documentName: metadata.documentName as string,
          documentType: metadata.documentType as string | undefined,
          documentDescription: metadata.documentDescription as string | undefined,
          readyDate: metadata.readyDate as string | undefined,
          signatureDeadline: metadata.signatureDeadline as string | undefined,
          expirationDate: metadata.expirationDate as string | undefined,
          daysUntilExpiration: metadata.daysUntilExpiration as number | undefined,
          renewalInstructions: metadata.renewalInstructions as string | undefined,
          downloadUrl: metadata.downloadUrl as string | undefined,
          signingUrl: metadata.signingUrl as string | undefined,
          renewalUrl: metadata.renewalUrl as string | undefined,
          agentName: metadata.agentName as string | undefined,
          agentPhone: metadata.agentPhone as string | undefined,
          agentEmail: metadata.agentEmail as string | undefined,
        };
        
        return generateCustomerDocumentNotificationEmail(customerMetadata);
      }
    }
    
    // Customer deal notifications
    if (category === "deals" && metadata.notificationType) {
      const customerMetadata = {
        notificationType: metadata.notificationType as "offer_received" | "offer_accepted" | "deal_closed" | "payment_received",
        dealTitle: metadata.dealTitle as string,
        propertyAddress: metadata.propertyAddress as string | undefined,
        offerAmount: metadata.offerAmount as number | undefined,
        offerTerms: metadata.offerTerms as string | undefined,
        offerExpirationDate: metadata.offerExpirationDate as string | undefined,
        acceptanceDate: metadata.acceptanceDate as string | undefined,
        closingDate: metadata.closingDate as string | undefined,
        finalAmount: metadata.finalAmount as number | undefined,
        paymentAmount: metadata.paymentAmount as number | undefined,
        paymentDate: metadata.paymentDate as string | undefined,
        paymentMethod: metadata.paymentMethod as string | undefined,
        transactionReference: metadata.transactionReference as string | undefined,
        paymentPurpose: metadata.paymentPurpose as string | undefined,
        nextSteps: metadata.nextSteps as string[] | undefined,
        postClosingInfo: metadata.postClosingInfo as string | undefined,
        documents: metadata.documents as Array<{ name: string; url: string }> | undefined,
        agentName: metadata.agentName as string | undefined,
        agentPhone: metadata.agentPhone as string | undefined,
        agentEmail: metadata.agentEmail as string | undefined,
        dealUrl: metadata.dealUrl as string | undefined,
      };
      
      return generateCustomerDealNotificationEmail(customerMetadata);
    }
  }
  
  // Customer appointment reminders (if category is appointments but marked as customer)
  if (category === "appointments") {
    const metadata = notification.metadata;
    if (metadata.isCustomerNotification) {
    const customerMetadata = {
      appointmentTitle: metadata.appointmentTitle as string,
      appointmentType: metadata.appointmentType as "visita" | "firma" | "reunion" | "llamada" | "cierre" | "viaje",
      datetimeStart: metadata.datetimeStart as string,
      datetimeEnd: metadata.datetimeEnd as string | undefined,
      reminderTimeframe: metadata.reminderTimeframe as "24h" | "12h" | "1h" | "30min" | "travel_time",
      contactName: metadata.contactName as string | undefined,
      contactPhone: metadata.contactPhone as string | undefined,
      contactEmail: metadata.contactEmail as string | undefined,
      location: metadata.location as string | undefined,
      propertyAddress: metadata.propertyAddress as string | undefined,
      travelTime: metadata.travelTime as number | undefined,
      directionsUrl: metadata.directionsUrl as string | undefined,
      preparationNotes: metadata.preparationNotes as string | undefined,
      cancellationPolicy: metadata.cancellationPolicy as string | undefined,
    };
    
      return generateCustomerAppointmentReminderEmail(customerMetadata);
    }
  }
  
  // Fallback to base template
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
  const actionUrl = notification.actionUrl
    ? `${baseUrl}${notification.actionUrl}`
    : null;
  
  const { html, text } = generateNotificationEmailBase(
    notification.title,
    notification.message,
    actionUrl,
    "Ver detalles",
  );
  
  return {
    subject: notification.title,
    html,
    text,
  };
}

