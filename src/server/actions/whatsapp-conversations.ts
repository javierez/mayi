"use server";

/**
 * WhatsApp Conversations Server Actions
 *
 * Server actions for the WhatsApp inbox functionality.
 * Similar pattern to gmail.ts actions.
 */

import { getCurrentUser } from "~/lib/dal";
import { isWhatsAppConfigured } from "~/server/services/whatsapp-service";
import {
  getConversationsForUser,
  getConversation,
  getOrCreateConversation,
  markConversationAsRead,
  archiveConversation,
  linkConversationToListing,
  getUserTwilioSettings,
} from "~/server/services/whatsapp-conversation-service";
import {
  sendMessage,
  sendTemplateMessage,
  getMessages,
} from "~/server/services/whatsapp-message-service";
import { WHATSAPP_TEMPLATE_SIDS } from "~/types/whatsapp-templates";
import type {
  WhatsAppConversation,
  WhatsAppConversationWithMessages,
  WhatsAppActionResult,
  SendMessageResult,
  StartConversationResult,
  TwilioSettings,
} from "~/types/whatsapp-conversations";
import { getSessionInfo } from "~/types/whatsapp-conversations";

// =============================================================================
// Result Types
// =============================================================================

export interface WhatsAppConnectionStatus {
  connected: boolean;
  whatsappNumber?: string;
}

export interface WhatsAppConversationsResult {
  success: boolean;
  conversations: WhatsAppConversation[];
  total: number;
  error?: string;
}

export interface WhatsAppConversationResult {
  success: boolean;
  conversation: WhatsAppConversationWithMessages | null;
  error?: string;
}

// =============================================================================
// Connection Status
// =============================================================================

/**
 * Get WhatsApp connection status for the current user
 */
export async function getWhatsAppConnectionStatusAction(): Promise<WhatsAppConnectionStatus> {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return { connected: false };
    }

    // Get user's Twilio settings
    const twilioSettings = await getUserTwilioSettings(user.id);

    // Check if user has WhatsApp configured
    const configured = isWhatsAppConfigured(twilioSettings ?? undefined);

    if (!configured) {
      return { connected: false };
    }

    return {
      connected: true,
      whatsappNumber: twilioSettings?.whatsappNumber ?? undefined,
    };
  } catch (error) {
    console.error("Error checking WhatsApp connection:", error);
    return { connected: false };
  }
}

// =============================================================================
// Conversation Actions
// =============================================================================

/**
 * Get all conversations for the current user
 */
export async function getWhatsAppConversationsAction(
  options?: { page?: number; limit?: number },
): Promise<WhatsAppConversationsResult> {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return { success: false, conversations: [], total: 0, error: "No autorizado" };
    }

    // Get conversations for this user (not account)
    const result = await getConversationsForUser(user.id, options);

    return {
      success: true,
      conversations: result.conversations,
      total: result.total,
    };
  } catch (error) {
    console.error("Error getting WhatsApp conversations:", error);
    return {
      success: false,
      conversations: [],
      total: 0,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Get a single conversation with messages
 */
export async function getWhatsAppConversationAction(
  conversationId: string,
): Promise<WhatsAppConversationResult> {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return { success: false, conversation: null, error: "No autorizado" };
    }

    const conversation = await getConversation(BigInt(conversationId));

    if (!conversation) {
      return { success: false, conversation: null, error: "Conversacion no encontrada" };
    }

    // Verify user ownership
    if (conversation.userId !== user.id) {
      return { success: false, conversation: null, error: "No autorizado" };
    }

    // Get messages
    const messages = await getMessages(BigInt(conversationId));

    return {
      success: true,
      conversation: {
        ...conversation,
        messages,
      },
    };
  } catch (error) {
    console.error("Error getting WhatsApp conversation:", error);
    return {
      success: false,
      conversation: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Start a new conversation with a contact
 */
export async function startWhatsAppConversationAction(
  contactId: string,
  initialMessage: string,
): Promise<StartConversationResult> {
  try {
    const user = await getCurrentUser();

    if (!user?.id || !user?.accountId) {
      return { success: false, error: "No autorizado" };
    }

    // Get user's Twilio settings
    const twilioSettings = await getUserTwilioSettings(user.id);

    if (!twilioSettings?.whatsappNumber) {
      return { success: false, error: "WhatsApp no configurado" };
    }

    // Get or create conversation for this user
    const conversation = await getOrCreateConversation(
      BigInt(contactId),
      BigInt(user.accountId),
      user.id,
    );

    // Check if we can send freeform (new conversation likely can't)
    const sessionInfo = getSessionInfo(conversation.lastCustomerMessageAt);

    if (!sessionInfo.canSendFreeform) {
      // Need to send template for first message
      const result = await sendTemplateMessage(
        conversation.conversationId,
        "re_engagement",
        { "1": initialMessage },
        user.id,
        twilioSettings,
      );

      if (!result.success) {
        return { success: false, error: result.error };
      }
    } else {
      // Can send freeform
      const result = await sendMessage(
        conversation.conversationId,
        initialMessage,
        user.id,
        twilioSettings,
      );

      if (!result.success) {
        return { success: false, error: result.error };
      }
    }

    return {
      success: true,
      conversationId: conversation.conversationId,
    };
  } catch (error) {
    console.error("Error starting WhatsApp conversation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// =============================================================================
// Message Actions
// =============================================================================

/**
 * Send a message to a conversation
 */
export async function sendWhatsAppMessageAction(
  conversationId: string,
  content: string,
): Promise<SendMessageResult> {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return { success: false, error: "No autorizado" };
    }

    // Verify conversation ownership
    const conversation = await getConversation(BigInt(conversationId));

    if (!conversation || conversation.userId !== user.id) {
      return { success: false, error: "No autorizado" };
    }

    // Get user's Twilio settings
    const twilioSettings = await getUserTwilioSettings(user.id);

    if (!twilioSettings?.whatsappNumber) {
      return { success: false, error: "WhatsApp no configurado" };
    }

    // Send message with user's settings
    const result = await sendMessage(
      BigInt(conversationId),
      content,
      user.id,
      twilioSettings,
    );

    return result;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Send a template message (for re-engagement)
 */
export async function sendWhatsAppTemplateAction(
  conversationId: string,
  templateType: keyof typeof WHATSAPP_TEMPLATE_SIDS,
  variables: Record<string, string>,
): Promise<SendMessageResult> {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return { success: false, error: "No autorizado" };
    }

    // Verify conversation ownership
    const conversation = await getConversation(BigInt(conversationId));

    if (!conversation || conversation.userId !== user.id) {
      return { success: false, error: "No autorizado" };
    }

    // Get user's Twilio settings
    const twilioSettings = await getUserTwilioSettings(user.id);

    if (!twilioSettings?.whatsappNumber) {
      return { success: false, error: "WhatsApp no configurado" };
    }

    // Send template with user's settings
    const result = await sendTemplateMessage(
      BigInt(conversationId),
      templateType,
      variables,
      user.id,
      twilioSettings,
    );

    return result;
  } catch (error) {
    console.error("Error sending WhatsApp template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// =============================================================================
// Conversation Management Actions
// =============================================================================

/**
 * Mark a conversation as read
 */
export async function markWhatsAppReadAction(
  conversationId: string,
): Promise<WhatsAppActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return { success: false, error: "No autorizado" };
    }

    // Verify ownership
    const conversation = await getConversation(BigInt(conversationId));

    if (!conversation || conversation.userId !== user.id) {
      return { success: false, error: "No autorizado" };
    }

    await markConversationAsRead(BigInt(conversationId));

    return { success: true };
  } catch (error) {
    console.error("Error marking WhatsApp as read:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Archive a conversation
 */
export async function archiveWhatsAppConversationAction(
  conversationId: string,
): Promise<WhatsAppActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return { success: false, error: "No autorizado" };
    }

    // Verify ownership
    const conversation = await getConversation(BigInt(conversationId));

    if (!conversation || conversation.userId !== user.id) {
      return { success: false, error: "No autorizado" };
    }

    await archiveConversation(BigInt(conversationId));

    return { success: true };
  } catch (error) {
    console.error("Error archiving WhatsApp conversation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Link a conversation to a listing-contact relationship
 */
export async function linkWhatsAppToListingAction(
  conversationId: string,
  listingContactId: string | null,
): Promise<WhatsAppActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return { success: false, error: "No autorizado" };
    }

    // Verify ownership
    const conversation = await getConversation(BigInt(conversationId));

    if (!conversation || conversation.userId !== user.id) {
      return { success: false, error: "No autorizado" };
    }

    await linkConversationToListing(
      BigInt(conversationId),
      listingContactId ? BigInt(listingContactId) : null,
    );

    return { success: true };
  } catch (error) {
    console.error("Error linking WhatsApp to listing:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
