/**
 * WhatsApp Message Service
 *
 * Handles sending and storing WhatsApp messages.
 * Uses existing whatsapp-service.ts for Twilio API calls.
 */

import { db } from "~/server/db";
import { whatsappMessages, users } from "~/server/db/schema";
import { eq, desc, and, lt, sql } from "drizzle-orm";
import {
  sendWhatsAppFreeform,
  sendWhatsAppTemplate,
} from "./whatsapp-service";
import {
  getConversation,
  updateConversationAfterMessage,
} from "./whatsapp-conversation-service";
import { WHATSAPP_TEMPLATE_SIDS } from "~/types/whatsapp-templates";
import type {
  WhatsAppMessage,
  WhatsAppMessageRow,
  WhatsAppMediaAttachment,
  SendMessageResult,
  GetMessagesOptions,
  TwilioIncomingWebhookPayload,
  WhatsAppMessageDirection,
  WhatsAppMessageStatus,
  WhatsAppSenderType,
  TwilioSettings,
} from "~/types/whatsapp-conversations";
import { isWithin24HourWindow, parseWhatsAppNumber } from "~/types/whatsapp-conversations";

// =============================================================================
// Send Message Operations
// =============================================================================

/**
 * Send a message to a conversation
 * Automatically handles 24h window logic
 */
export async function sendMessage(
  conversationId: bigint,
  content: string,
  userId: string,
  twilioSettings?: TwilioSettings,
): Promise<SendMessageResult> {
  // Get conversation to check 24h window
  const conversation = await getConversation(conversationId);

  if (!conversation) {
    return { success: false, error: "Conversation not found" };
  }

  // Check if within 24h window
  const canSendFreeform = isWithin24HourWindow(
    conversation.lastCustomerMessageAt,
  );

  if (!canSendFreeform) {
    // Window expired - need to use template
    return {
      success: false,
      error: "La ventana de 24 horas ha expirado. Usa una plantilla para recontactar.",
      requiresTemplate: true,
    };
  }

  // Send freeform message via Twilio (using user's settings)
  const twilioResult = await sendWhatsAppFreeform(
    conversation.whatsappNumber,
    content,
    twilioSettings,
  );

  if (!twilioResult.success) {
    // Store failed message for tracking
    const [failedMessage] = await db
      .insert(whatsappMessages)
      .values({
        conversationId,
        twilioMessageSid: null,
        direction: "outbound",
        status: "failed",
        body: content,
        mediaUrls: [],
        senderType: "agent",
        senderUserId: userId,
        isTemplate: false,
        errorMessage: twilioResult.error,
        sentAt: new Date(),
      })
      .returning();

    return {
      success: false,
      messageId: failedMessage?.messageId,
      error: twilioResult.error,
    };
  }

  // Store successful message
  const [message] = await db
    .insert(whatsappMessages)
    .values({
      conversationId,
      twilioMessageSid: twilioResult.messageSid,
      direction: "outbound",
      status: "sent",
      body: content,
      mediaUrls: [],
      senderType: "agent",
      senderUserId: userId,
      isTemplate: false,
      sentAt: new Date(),
    })
    .returning();

  // Update conversation timestamps
  await updateConversationAfterMessage(conversationId, "outbound");

  return {
    success: true,
    messageId: message?.messageId,
    twilioMessageSid: twilioResult.messageSid,
  };
}

/**
 * Send a template message (for re-engagement after 24h)
 */
export async function sendTemplateMessage(
  conversationId: bigint,
  templateType: keyof typeof WHATSAPP_TEMPLATE_SIDS,
  variables: Record<string, string>,
  userId: string,
  twilioSettings?: TwilioSettings,
): Promise<SendMessageResult> {
  const conversation = await getConversation(conversationId);

  if (!conversation) {
    return { success: false, error: "Conversation not found" };
  }

  const templateSid = WHATSAPP_TEMPLATE_SIDS[templateType];

  // Send template via Twilio (using user's settings)
  const twilioResult = await sendWhatsAppTemplate(
    conversation.whatsappNumber,
    templateSid,
    variables,
    twilioSettings,
  );

  if (!twilioResult.success) {
    // Store failed message
    const [failedMessage] = await db
      .insert(whatsappMessages)
      .values({
        conversationId,
        twilioMessageSid: null,
        direction: "outbound",
        status: "failed",
        body: `[Template: ${templateType}]`,
        mediaUrls: [],
        senderType: "agent",
        senderUserId: userId,
        isTemplate: true,
        templateSid,
        templateVariables: variables,
        errorMessage: twilioResult.error,
        sentAt: new Date(),
      })
      .returning();

    return {
      success: false,
      messageId: failedMessage?.messageId,
      error: twilioResult.error,
    };
  }

  // Store successful template message
  const [message] = await db
    .insert(whatsappMessages)
    .values({
      conversationId,
      twilioMessageSid: twilioResult.messageSid,
      direction: "outbound",
      status: "sent",
      body: `[Template: ${templateType}]`,
      mediaUrls: [],
      senderType: "agent",
      senderUserId: userId,
      isTemplate: true,
      templateSid,
      templateVariables: variables,
      sentAt: new Date(),
    })
    .returning();

  // Update conversation
  await updateConversationAfterMessage(conversationId, "outbound");

  return {
    success: true,
    messageId: message?.messageId,
    twilioMessageSid: twilioResult.messageSid,
  };
}

// =============================================================================
// Store Incoming Message (from webhook)
// =============================================================================

/**
 * Store an incoming message from Twilio webhook
 */
export async function storeIncomingMessage(
  conversationId: bigint,
  payload: TwilioIncomingWebhookPayload,
): Promise<bigint> {
  // Extract media URLs
  const mediaUrls: WhatsAppMediaAttachment[] = [];
  const numMedia = parseInt(payload.NumMedia, 10);

  for (let i = 0; i < numMedia; i++) {
    const urlKey = `MediaUrl${i}` as keyof TwilioIncomingWebhookPayload;
    const typeKey = `MediaContentType${i}` as keyof TwilioIncomingWebhookPayload;

    const url = payload[urlKey];
    const contentType = payload[typeKey];

    if (url) {
      mediaUrls.push({
        url: url as string,
        contentType: (contentType as string) ?? "application/octet-stream",
      });
    }
  }

  // Store message
  const [message] = await db
    .insert(whatsappMessages)
    .values({
      conversationId,
      twilioMessageSid: payload.MessageSid,
      direction: "inbound",
      status: "received",
      body: payload.Body,
      mediaUrls,
      senderType: "contact",
      senderUserId: null,
      isTemplate: false,
      sentAt: new Date(),
    })
    .returning();

  if (!message) {
    throw new Error("Failed to store incoming message");
  }

  // Update conversation (resets 24h window, increments unread)
  await updateConversationAfterMessage(conversationId, "inbound");

  return message.messageId;
}

// =============================================================================
// Message Status Updates (from webhook)
// =============================================================================

/**
 * Update message status from Twilio status callback
 */
export async function updateMessageStatus(
  twilioMessageSid: string,
  status: string,
  errorCode?: string,
  errorMessage?: string,
): Promise<void> {
  const now = new Date();

  const updates: Record<string, unknown> = {
    status,
  };

  // Set timestamp based on status
  if (status === "delivered") {
    updates.deliveredAt = now;
  } else if (status === "read") {
    updates.deliveredAt = updates.deliveredAt ?? now;
    updates.readAt = now;
  } else if (status === "failed") {
    updates.errorCode = errorCode;
    updates.errorMessage = errorMessage;
  }

  await db
    .update(whatsappMessages)
    .set(updates)
    .where(eq(whatsappMessages.twilioMessageSid, twilioMessageSid));
}

// =============================================================================
// Query Messages
// =============================================================================

/**
 * Get messages for a conversation
 */
export async function getMessages(
  conversationId: bigint,
  options: GetMessagesOptions = {},
): Promise<WhatsAppMessage[]> {
  const { limit = 50, before } = options;

  const conditions = [eq(whatsappMessages.conversationId, conversationId)];

  if (before) {
    conditions.push(lt(whatsappMessages.createdAt, before));
  }

  const rows = await db
    .select()
    .from(whatsappMessages)
    .where(and(...conditions))
    .orderBy(desc(whatsappMessages.createdAt))
    .limit(limit);

  // Enrich with sender names
  return Promise.all(rows.map(enrichMessage));
}

/**
 * Get a single message by ID
 */
export async function getMessage(
  messageId: bigint,
): Promise<WhatsAppMessage | null> {
  const result = await db
    .select()
    .from(whatsappMessages)
    .where(eq(whatsappMessages.messageId, messageId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return enrichMessage(result[0]!);
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Enrich a message row with sender name
 */
async function enrichMessage(row: WhatsAppMessageRow): Promise<WhatsAppMessage> {
  let senderName = "Unknown";

  if (row.senderType === "agent" && row.senderUserId) {
    // Get user name
    const userResult = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, row.senderUserId))
      .limit(1);

    senderName = userResult[0]?.name ?? "Agent";
  } else if (row.senderType === "contact") {
    senderName = "Contact"; // Will be enriched at conversation level
  } else if (row.senderType === "system") {
    senderName = "System";
  }

  // Parse media URLs from JSON
  let mediaUrls: WhatsAppMediaAttachment[] = [];
  if (row.mediaUrls) {
    try {
      mediaUrls = row.mediaUrls as WhatsAppMediaAttachment[];
    } catch {
      mediaUrls = [];
    }
  }

  return {
    messageId: row.messageId,
    conversationId: row.conversationId,
    twilioMessageSid: row.twilioMessageSid,
    direction: row.direction as WhatsAppMessageDirection,
    status: (row.status ?? "sent") as WhatsAppMessageStatus,
    body: row.body,
    mediaUrls,
    senderType: row.senderType as WhatsAppSenderType,
    senderUserId: row.senderUserId,
    senderName,
    isTemplate: row.isTemplate ?? false,
    templateSid: row.templateSid,
    errorCode: row.errorCode,
    errorMessage: row.errorMessage,
    sentAt: row.sentAt,
    deliveredAt: row.deliveredAt,
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}
