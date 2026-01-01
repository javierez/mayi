/**
 * WhatsApp Service
 *
 * Sends WhatsApp messages using Twilio Content API with pre-approved templates.
 * Handles phone normalization for Spain (+34 prefix).
 * Supports per-user Twilio configuration.
 */

import twilio from "twilio";
import { env } from "~/env";
import type { TwilioSettings } from "~/types/whatsapp-conversations";

// Default Twilio client (uses env credentials as fallback)
const defaultTwilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

/**
 * Get Twilio client for user (uses user's credentials if provided, otherwise default)
 */
function getTwilioClient(settings?: TwilioSettings) {
  if (settings?.accountSid && settings?.authToken) {
    return twilio(settings.accountSid, settings.authToken);
  }
  return defaultTwilioClient;
}

/**
 * Get WhatsApp number (user's number or fallback to env)
 */
function getWhatsAppNumber(settings?: TwilioSettings): string | null {
  return settings?.whatsappNumber ?? env.TWILIO_WHATSAPP_NUMBER ?? null;
}

/**
 * Normalize phone number to E.164 format
 * Automatically adds +34 prefix for Spanish numbers without country code
 */
function normalizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return "";

  // Remove any whitespace
  const normalized = phoneNumber.trim().replace(/\s+/g, "");

  // If already has country code, return as is
  if (normalized.startsWith("+")) {
    return normalized;
  }

  // If starts with 00, replace with +
  if (normalized.startsWith("00")) {
    return "+" + normalized.substring(2);
  }

  // If starts with 34, add +
  if (normalized.startsWith("34")) {
    return "+" + normalized;
  }

  // Otherwise, assume Spanish number and add +34
  return "+34" + normalized;
}

/**
 * Convert phone number to WhatsApp format
 * WhatsApp requires: whatsapp:+34612345678
 */
export function normalizeToWhatsApp(phoneNumber: string): string {
  const normalized = normalizePhoneNumber(phoneNumber);
  return `whatsapp:${normalized}`;
}

/**
 * Send WhatsApp message using Content Template
 *
 * @param phoneNumber - Recipient phone number (will be normalized)
 * @param contentSid - Twilio Content Template SID (starts with HX)
 * @param contentVariables - Template variables as key-value pairs
 * @param twilioSettings - Optional user-specific Twilio settings
 * @returns Success status with message SID or error
 */
export async function sendWhatsAppTemplate(
  phoneNumber: string,
  contentSid: string,
  contentVariables: Record<string, string>,
  twilioSettings?: TwilioSettings,
): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  try {
    const whatsappNumber = getWhatsAppNumber(twilioSettings);

    if (!whatsappNumber) {
      console.error("[WhatsApp] WhatsApp number not configured");
      return {
        success: false,
        error: "WhatsApp number not configured",
      };
    }

    // Validate content SID format
    if (!contentSid.startsWith("HX")) {
      console.error("[WhatsApp] Invalid content SID format:", contentSid);
      return {
        success: false,
        error: "Invalid template SID format - must start with HX",
      };
    }

    // Check if using placeholder template
    if (contentSid.includes("PLACEHOLDER")) {
      console.warn("[WhatsApp] Template not yet configured:", contentSid);
      return {
        success: false,
        error: "Template not yet approved - using placeholder SID",
      };
    }

    const client = getTwilioClient(twilioSettings);
    const normalizedTo = normalizeToWhatsApp(phoneNumber);
    const normalizedFrom = `whatsapp:${whatsappNumber}`;

    console.log(`[WhatsApp] Sending message:`);
    console.log(`  From: ${normalizedFrom}`);
    console.log(`  To: ${normalizedTo}`);
    console.log(`  Template: ${contentSid}`);
    console.log(`  Variables: ${Object.keys(contentVariables).length} values`);

    const message = await client.messages.create({
      from: normalizedFrom,
      to: normalizedTo,
      contentSid: contentSid,
      contentVariables: JSON.stringify(contentVariables),
    });

    console.log(`[WhatsApp] Message sent successfully: ${message.sid}`);
    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error("[WhatsApp] Error sending message:", error);

    // Extract Twilio error details if available
    let errorMessage = "Error sending WhatsApp message";
    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for common Twilio errors
      const twilioError = error as { code?: number; moreInfo?: string };
      if (twilioError.code === 63016) {
        errorMessage =
          "Template not approved or not found. Check Twilio Content Template Builder.";
      } else if (twilioError.code === 21614) {
        errorMessage =
          "Invalid phone number format. Ensure the number is in E.164 format.";
      } else if (twilioError.code === 21608) {
        errorMessage =
          "Recipient has not opted in to receive WhatsApp messages from this sender.";
      }
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Send a freeform WhatsApp message (within 24h conversation window)
 * Only use this when responding to a user's message within 24 hours
 *
 * @param phoneNumber - Recipient phone number
 * @param body - Message text
 * @param twilioSettings - Optional user-specific Twilio settings
 * @returns Success status with message SID or error
 */
export async function sendWhatsAppFreeform(
  phoneNumber: string,
  body: string,
  twilioSettings?: TwilioSettings,
): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  try {
    const whatsappNumber = getWhatsAppNumber(twilioSettings);

    if (!whatsappNumber) {
      return {
        success: false,
        error: "WhatsApp number not configured",
      };
    }

    const client = getTwilioClient(twilioSettings);
    const normalizedTo = normalizeToWhatsApp(phoneNumber);
    const normalizedFrom = `whatsapp:${whatsappNumber}`;

    const message = await client.messages.create({
      from: normalizedFrom,
      to: normalizedTo,
      body: body,
    });

    console.log(`[WhatsApp] Freeform message sent: ${message.sid}`);
    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error("[WhatsApp] Error sending freeform message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if WhatsApp is configured for a user
 * @param twilioSettings - Optional user-specific Twilio settings
 */
export function isWhatsAppConfigured(twilioSettings?: TwilioSettings): boolean {
  return Boolean(getWhatsAppNumber(twilioSettings));
}
