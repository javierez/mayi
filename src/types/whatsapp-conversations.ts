/**
 * WhatsApp Conversations Type Definitions
 *
 * Types for two-way WhatsApp messaging with contacts.
 * These types map to the database schema and are used by services.
 */

import type { RelatedListing, ThreadContext, InboxThread, ThreadMessage } from "~/components/inbox/inbox-types";

// =============================================================================
// Enums / Constants
// =============================================================================

export type WhatsAppMessageDirection = "inbound" | "outbound";

export type WhatsAppMessageStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export type WhatsAppConversationStatus = "active" | "closed" | "archived";

export type WhatsAppSenderType = "agent" | "contact" | "system";

// =============================================================================
// Twilio Settings (per-user configuration)
// =============================================================================

/**
 * Twilio settings stored in users.twilioSettings JSON field
 */
export interface TwilioSettings {
  whatsappNumber?: string; // User's WhatsApp Business number (e.g., "+34612345678")
  accountSid?: string; // Optional: User's own Twilio account SID (if not using shared)
  authToken?: string; // Optional: User's own Twilio auth token (if not using shared)
}

// =============================================================================
// Database Types (match schema.ts)
// =============================================================================

/**
 * WhatsApp conversation record from database
 */
export interface WhatsAppConversationRow {
  conversationId: bigint;
  accountId: bigint;
  userId: string; // User who owns this conversation
  contactId: bigint;
  whatsappNumber: string;
  status: string | null;
  lastMessageAt: Date | null;
  lastCustomerMessageAt: Date | null;
  unreadCount: number;
  listingContactId: bigint | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean | null;
}

/**
 * WhatsApp message record from database
 */
export interface WhatsAppMessageRow {
  messageId: bigint;
  conversationId: bigint;
  twilioMessageSid: string | null;
  direction: string;
  status: string | null;
  body: string | null;
  mediaUrls: unknown; // JSONB
  senderType: string;
  senderUserId: string | null;
  isTemplate: boolean | null;
  templateSid: string | null;
  templateVariables: unknown; // JSONB
  errorCode: string | null;
  errorMessage: string | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  createdAt: Date;
}

// =============================================================================
// Application Types (enriched with joins)
// =============================================================================

/**
 * Contact info for a conversation
 */
export interface WhatsAppContactInfo {
  contactId: bigint;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  avatar: string | null;
}

/**
 * WhatsApp conversation with enriched data
 */
export interface WhatsAppConversation {
  conversationId: bigint;
  accountId: bigint;
  userId: string; // User who owns this conversation
  contactId: bigint;
  whatsappNumber: string;
  status: WhatsAppConversationStatus;
  lastMessageAt: Date | null;
  lastCustomerMessageAt: Date | null;
  unreadCount: number;
  listingContactId: bigint | null;
  createdAt: Date;
  updatedAt: Date;
  // Enriched fields
  contact: WhatsAppContactInfo;
  listing: RelatedListing | null;
  // 24h window computed field
  isWithin24Hours: boolean;
  windowExpiresAt: Date | null;
}

/**
 * Media attachment in a message
 */
export interface WhatsAppMediaAttachment {
  url: string;
  contentType: string;
}

/**
 * WhatsApp message with enriched data
 */
export interface WhatsAppMessage {
  messageId: bigint;
  conversationId: bigint;
  twilioMessageSid: string | null;
  direction: WhatsAppMessageDirection;
  status: WhatsAppMessageStatus;
  body: string | null;
  mediaUrls: WhatsAppMediaAttachment[];
  senderType: WhatsAppSenderType;
  senderUserId: string | null;
  senderName: string; // Enriched: agent name or contact name
  isTemplate: boolean;
  templateSid: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  createdAt: Date;
}

/**
 * Conversation with messages (for detail view)
 */
export interface WhatsAppConversationWithMessages extends WhatsAppConversation {
  messages: WhatsAppMessage[];
}

// =============================================================================
// 24-Hour Window Types
// =============================================================================

/**
 * Session info for the 24h freeform window
 */
export interface WhatsAppSessionInfo {
  isWithin24Hours: boolean;
  windowExpiresAt: Date | null;
  canSendFreeform: boolean;
  hoursRemaining: number | null;
}

// =============================================================================
// Webhook Payload Types (from Twilio)
// =============================================================================

/**
 * Twilio incoming message webhook payload
 */
export interface TwilioIncomingWebhookPayload {
  MessageSid: string;
  AccountSid: string;
  From: string; // whatsapp:+34612345678
  To: string; // whatsapp:+14155238886
  Body: string;
  NumMedia: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  MediaUrl1?: string;
  MediaContentType1?: string;
  // ... up to MediaUrl9
  ProfileName?: string; // WhatsApp display name
  WaId?: string; // WhatsApp ID (phone without +)
}

/**
 * Twilio status callback webhook payload
 */
export interface TwilioStatusWebhookPayload {
  MessageSid: string;
  MessageStatus: string; // 'queued' | 'sent' | 'delivered' | 'read' | 'failed'
  AccountSid: string;
  From: string;
  To: string;
  ErrorCode?: string;
  ErrorMessage?: string;
}

// =============================================================================
// Action Result Types
// =============================================================================

/**
 * Result of sending a message
 */
export interface SendMessageResult {
  success: boolean;
  messageId?: bigint;
  twilioMessageSid?: string;
  error?: string;
  requiresTemplate?: boolean; // True if 24h window expired
}

/**
 * Result of starting a new conversation
 */
export interface StartConversationResult {
  success: boolean;
  conversationId?: bigint;
  error?: string;
}

/**
 * Generic action result
 */
export interface WhatsAppActionResult {
  success: boolean;
  error?: string;
}

// =============================================================================
// Query Options
// =============================================================================

/**
 * Options for listing conversations
 */
export interface GetConversationsOptions {
  page?: number;
  limit?: number;
  status?: WhatsAppConversationStatus;
  contactId?: bigint;
}

/**
 * Options for listing messages
 */
export interface GetMessagesOptions {
  limit?: number;
  before?: Date;
  after?: Date;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if conversation is within 24h freeform window
 */
export function isWithin24HourWindow(
  lastCustomerMessageAt: Date | null,
): boolean {
  if (!lastCustomerMessageAt) return false;
  const hoursSince =
    (Date.now() - lastCustomerMessageAt.getTime()) / (1000 * 60 * 60);
  return hoursSince < 24;
}

/**
 * Calculate when the 24h window expires
 */
export function getWindowExpiresAt(
  lastCustomerMessageAt: Date | null,
): Date | null {
  if (!lastCustomerMessageAt) return null;
  return new Date(lastCustomerMessageAt.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Get hours remaining in the 24h window
 */
export function getHoursRemaining(
  lastCustomerMessageAt: Date | null,
): number | null {
  if (!lastCustomerMessageAt) return null;
  const expiresAt = getWindowExpiresAt(lastCustomerMessageAt);
  if (!expiresAt) return null;
  const hoursRemaining = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
  return hoursRemaining > 0 ? hoursRemaining : 0;
}

/**
 * Get session info for a conversation
 */
export function getSessionInfo(
  lastCustomerMessageAt: Date | null,
): WhatsAppSessionInfo {
  const isWithin = isWithin24HourWindow(lastCustomerMessageAt);
  return {
    isWithin24Hours: isWithin,
    windowExpiresAt: getWindowExpiresAt(lastCustomerMessageAt),
    canSendFreeform: isWithin,
    hoursRemaining: getHoursRemaining(lastCustomerMessageAt),
  };
}

/**
 * Parse phone number from Twilio WhatsApp format
 * "whatsapp:+34612345678" -> "+34612345678"
 */
export function parseWhatsAppNumber(twilioFormat: string): string {
  return twilioFormat.replace("whatsapp:", "");
}

/**
 * Convert WhatsApp conversation to InboxThread format
 */
export function convertToInboxThread(
  conversation: WhatsAppConversationWithMessages,
): InboxThread {
  const messages: ThreadMessage[] = conversation.messages.map((msg) => ({
    id: `wa-msg-${msg.messageId}`,
    threadId: `wa-${conversation.conversationId}`,
    status: msg.direction === "inbound" ? "received" : "sent",
    from: {
      id: msg.direction === "inbound"
        ? `contact-${conversation.contactId}`
        : `agent-${msg.senderUserId ?? "unknown"}`,
      name: msg.direction === "inbound"
        ? `${conversation.contact.firstName} ${conversation.contact.lastName}`.trim()
        : msg.senderName,
      phone: msg.direction === "inbound"
        ? conversation.whatsappNumber
        : undefined,
      contactId: msg.direction === "inbound"
        ? Number(conversation.contactId)
        : undefined,
    },
    content: msg.body ?? "",
    timestamp: msg.sentAt ?? msg.createdAt,
    attachments: msg.mediaUrls.map((media) => ({
      name: "Media",
      type: media.contentType,
      url: media.url,
    })),
  }));

  return {
    id: `wa-${conversation.conversationId}`,
    channel: "whatsapp",
    snippet: conversation.messages[0]?.body ?? "",
    participants: [
      {
        id: `contact-${conversation.contactId}`,
        name: `${conversation.contact.firstName} ${conversation.contact.lastName}`.trim(),
        phone: conversation.whatsappNumber,
        contactId: Number(conversation.contactId),
        isLinked: true,
      },
    ],
    messages: messages.reverse(), // Oldest first
    lastMessageAt: conversation.lastMessageAt ?? conversation.createdAt,
    read: conversation.unreadCount === 0,
    starred: false,
    messageCount: conversation.messages.length,
    threadContext: conversation.listingContactId
      ? {
          listingContactId: conversation.listingContactId,
          contactId: conversation.contactId,
          contactType: null,
          listing: conversation.listing,
        }
      : undefined,
  };
}
