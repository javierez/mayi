/**
 * WhatsApp Webhook Handler
 *
 * Processes incoming webhooks from Twilio for:
 * - Incoming messages
 * - Message status updates
 */

import { db } from "~/server/db";
import { contacts } from "~/server/db/schema";
import { eq, and, or, sql } from "drizzle-orm";
import twilio from "twilio";
import { env } from "~/env";
import {
  getOrCreateConversation,
  findUserByWhatsAppNumber,
} from "./whatsapp-conversation-service";
import {
  storeIncomingMessage,
  updateMessageStatus,
} from "./whatsapp-message-service";
import type {
  TwilioIncomingWebhookPayload,
  TwilioStatusWebhookPayload,
} from "~/types/whatsapp-conversations";
import { parseWhatsAppNumber } from "~/types/whatsapp-conversations";

// =============================================================================
// Webhook Validation
// =============================================================================

/**
 * Validate Twilio webhook signature
 * @see https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
): boolean {
  try {
    return twilio.validateRequest(
      env.TWILIO_AUTH_TOKEN,
      signature,
      url,
      params,
    );
  } catch (error) {
    console.error("[WhatsApp Webhook] Signature validation error:", error);
    return false;
  }
}

// =============================================================================
// Incoming Message Handler
// =============================================================================

/**
 * Process an incoming WhatsApp message
 */
export async function handleIncomingMessage(
  payload: TwilioIncomingWebhookPayload,
): Promise<{ success: boolean; messageId?: bigint; error?: string }> {
  try {
    console.log("[WhatsApp Webhook] Incoming message:", {
      from: payload.From,
      to: payload.To,
      messageSid: payload.MessageSid,
      bodyLength: payload.Body?.length ?? 0,
      numMedia: payload.NumMedia,
    });

    // Parse phone numbers
    const senderPhone = parseWhatsAppNumber(payload.From);
    const recipientPhone = parseWhatsAppNumber(payload.To);

    // Find the user by the recipient WhatsApp number (the user's configured number)
    const userInfo = await findUserByWhatsAppNumber(recipientPhone);

    if (!userInfo) {
      console.log(`[WhatsApp Webhook] No user found with WhatsApp number: ${recipientPhone}`);
      return {
        success: false,
        error: "No user configured with this WhatsApp number",
      };
    }

    // Find contact by phone number (must belong to the same account)
    const contact = await findContactByPhoneAndAccount(senderPhone, userInfo.accountId);

    if (!contact) {
      console.log(`[WhatsApp Webhook] No contact found for phone: ${senderPhone}`);
      // For now, we only accept messages from known contacts
      // In the future, could auto-create leads
      return {
        success: false,
        error: "Contact not found for this phone number",
      };
    }

    // Get or create conversation for this contact and user
    const conversation = await getOrCreateConversation(
      contact.contactId,
      userInfo.accountId,
      userInfo.userId,
    );

    // Store the incoming message
    const messageId = await storeIncomingMessage(conversation.conversationId, payload);

    console.log(`[WhatsApp Webhook] Message stored: ${messageId}`);

    return { success: true, messageId };
  } catch (error) {
    console.error("[WhatsApp Webhook] Error handling incoming message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =============================================================================
// Status Callback Handler
// =============================================================================

/**
 * Process a message status update
 */
export async function handleStatusCallback(
  payload: TwilioStatusWebhookPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[WhatsApp Webhook] Status update:", {
      messageSid: payload.MessageSid,
      status: payload.MessageStatus,
      errorCode: payload.ErrorCode,
    });

    await updateMessageStatus(
      payload.MessageSid,
      payload.MessageStatus,
      payload.ErrorCode,
      payload.ErrorMessage,
    );

    return { success: true };
  } catch (error) {
    console.error("[WhatsApp Webhook] Error handling status callback:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Find a contact by phone number within a specific account
 * Returns the contact ID
 */
async function findContactByPhoneAndAccount(
  phone: string,
  accountId: bigint,
): Promise<{ contactId: bigint } | null> {
  // Normalize phone for search (remove spaces, handle country codes)
  const normalizedPhone = phone.replace(/\s+/g, "");

  // Try different formats
  const phoneVariants = [
    normalizedPhone,
    normalizedPhone.replace("+34", ""),
    normalizedPhone.replace("+", ""),
  ];

  // Search for contact with matching phone in this account
  const result = await db
    .select({
      contactId: contacts.contactId,
    })
    .from(contacts)
    .where(
      and(
        eq(contacts.isActive, true),
        eq(contacts.accountId, accountId),
        or(
          ...phoneVariants.flatMap((p) => [
            eq(contacts.phone, p),
            sql`REPLACE(${contacts.phone}, ' ', '') = ${p}`,
          ]),
        ),
      ),
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return {
    contactId: result[0]!.contactId,
  };
}

/**
 * Parse form data from webhook request body
 */
export function parseWebhookFormData(
  formData: FormData,
): TwilioIncomingWebhookPayload {
  const payload: Record<string, string> = {};

  formData.forEach((value, key) => {
    payload[key] = typeof value === "string" ? value : value.name;
  });

  return payload as unknown as TwilioIncomingWebhookPayload;
}

/**
 * Parse status callback form data
 */
export function parseStatusFormData(
  formData: FormData,
): TwilioStatusWebhookPayload {
  const payload: Record<string, string> = {};

  formData.forEach((value, key) => {
    payload[key] = typeof value === "string" ? value : value.name;
  });

  return payload as unknown as TwilioStatusWebhookPayload;
}
