/**
 * Customer Email Service
 *
 * Handles sending customer-facing email notifications for:
 * - Property notifications
 * - Document notifications
 * - Deal notifications
 * - Customer appointment reminders
 */

import { sendEmail } from "~/lib/email";
import { getEmailSettingsForAccount, getAccountEmailSenderConfig } from "./email-config-helpers";
import type { MailSettings } from "~/components/admin/account/mail-configuration/types";
import { generateCustomerAppointmentReminderEmail } from "~/templates/emails/customer-appointment-reminder";
import { generateCustomerPropertyNotificationEmail } from "~/templates/emails/customer-property-notification";
import { generateCustomerDocumentNotificationEmail } from "~/templates/emails/customer-document-notification";
import { generateCustomerDealNotificationEmail } from "~/templates/emails/customer-deal-notification";

/**
 * Check if customer notification is enabled in settings
 */
function isCustomerNotificationEnabled(
  settings: MailSettings,
  notificationType: string,
  category: "properties" | "documents" | "deals" | "appointments",
  appointmentType?: string,
): boolean {
  if (category === "properties") {
    const propSettings = settings.customers.properties;
    switch (notificationType) {
      case "new_listing":
        return propSettings.newListing.emailEnabled;
      case "price_change":
        return propSettings.priceChange.emailEnabled;
      case "status_change":
        return propSettings.statusChange.emailEnabled;
      case "new_photos":
        return propSettings.newPhotos.emailEnabled;
      default:
        return false;
    }
  }

  if (category === "documents") {
    const docSettings = settings.customers.documents;
    switch (notificationType) {
      case "document_ready":
        return docSettings.documentReady.emailEnabled;
      case "signature_required":
        return docSettings.signatureRequired.emailEnabled;
      case "document_expiring":
        return docSettings.documentExpiring.emailEnabled;
      default:
        return false;
    }
  }

  if (category === "deals") {
    const dealSettings = settings.customers.deals;
    switch (notificationType) {
      case "offer_received":
        return dealSettings.offerReceived.emailEnabled;
      case "offer_accepted":
        return dealSettings.offerAccepted.emailEnabled;
      case "deal_closed":
        return dealSettings.dealClosed.emailEnabled;
      case "payment_received":
        return dealSettings.paymentReceived.emailEnabled;
      default:
        return false;
    }
  }

  if (category === "appointments" && appointmentType) {
    const aptSettings = settings.customers.appointments[appointmentType as keyof typeof settings.customers.appointments];
    if (!aptSettings) {
      return false;
    }

    // For appointment reminders, check the reminder timeframe
    // This would be passed in metadata
    return true; // Simplified - actual check would be based on reminder timeframe
  }

  return false;
}

/**
 * Send customer property notification email
 */
export async function sendCustomerPropertyNotification(
  customerEmail: string,
  accountId: bigint,
  metadata: Parameters<typeof generateCustomerPropertyNotificationEmail>[0],
): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await getEmailSettingsForAccount(accountId);

    // Check if notification is enabled
    if (!isCustomerNotificationEnabled(settings, metadata.notificationType, "properties")) {
      return { success: false, error: "Property notification not enabled in settings" };
    }

    // Generate email
    const emailContent = generateCustomerPropertyNotificationEmail(metadata);

    // Send email
    await sendEmail({
      to: customerEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    console.log(`✅ Customer property notification sent to ${customerEmail}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Failed to send customer property notification:", error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send customer document notification email
 */
export async function sendCustomerDocumentNotification(
  customerEmail: string,
  accountId: bigint,
  metadata: Parameters<typeof generateCustomerDocumentNotificationEmail>[0],
): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await getEmailSettingsForAccount(accountId);

    // Check if notification is enabled
    if (!isCustomerNotificationEnabled(settings, metadata.notificationType, "documents")) {
      return { success: false, error: "Document notification not enabled in settings" };
    }

    // Generate email
    const emailContent = generateCustomerDocumentNotificationEmail(metadata);

    // Send email
    await sendEmail({
      to: customerEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    console.log(`✅ Customer document notification sent to ${customerEmail}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Failed to send customer document notification:", error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send customer deal notification email
 */
export async function sendCustomerDealNotification(
  customerEmail: string,
  accountId: bigint,
  metadata: Parameters<typeof generateCustomerDealNotificationEmail>[0],
): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await getEmailSettingsForAccount(accountId);

    // Check if notification is enabled
    if (!isCustomerNotificationEnabled(settings, metadata.notificationType, "deals")) {
      return { success: false, error: "Deal notification not enabled in settings" };
    }

    // Generate email
    const emailContent = generateCustomerDealNotificationEmail(metadata);

    // Send email
    await sendEmail({
      to: customerEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    console.log(`✅ Customer deal notification sent to ${customerEmail}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Failed to send customer deal notification:", error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send customer appointment reminder email
 * Emails are sent from the agency's identity using account.name and account.email
 */
export async function sendCustomerAppointmentReminder(
  customerEmail: string,
  accountId: bigint,
  metadata: Parameters<typeof generateCustomerAppointmentReminderEmail>[0],
): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await getEmailSettingsForAccount(accountId);

    // Check if notification is enabled
    const appointmentType = metadata.appointmentType || "visita";
    if (!isCustomerNotificationEnabled(settings, metadata.reminderTimeframe, "appointments", appointmentType)) {
      return { success: false, error: "Customer appointment reminder not enabled in settings" };
    }

    // Get account email sender configuration (uses account.name and account.email)
    const emailSenderConfig = await getAccountEmailSenderConfig(accountId);

    // Generate email
    const emailContent = generateCustomerAppointmentReminderEmail(metadata);

    // Send email with account-specific sender identity
    await sendEmail({
      to: customerEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      fromName: emailSenderConfig.displayName,
      replyTo: emailSenderConfig.replyToEmail ?? undefined,
    });

    console.log(`✅ Customer appointment reminder sent to ${customerEmail} from "${emailSenderConfig.displayName}"`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Failed to send customer appointment reminder:", error);
    return { success: false, error: errorMessage };
  }
}


