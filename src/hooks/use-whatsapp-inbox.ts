"use client";

/**
 * WhatsApp Inbox Hook
 *
 * Client-side hook for managing WhatsApp conversations.
 * Follows the same pattern as use-gmail-inbox.ts.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type {
  InboxThread,
  ThreadContext,
} from "~/components/inbox/inbox-types";
import type {
  WhatsAppConversation,
  WhatsAppConversationWithMessages,
  WhatsAppSessionInfo,
} from "~/types/whatsapp-conversations";
import { getSessionInfo, convertToInboxThread } from "~/types/whatsapp-conversations";
import {
  getWhatsAppConnectionStatusAction,
  getWhatsAppConversationsAction,
  getWhatsAppConversationAction,
  sendWhatsAppMessageAction,
  sendWhatsAppTemplateAction,
  markWhatsAppReadAction,
  archiveWhatsAppConversationAction,
  startWhatsAppConversationAction,
  linkWhatsAppToListingAction,
} from "~/server/actions/whatsapp-conversations";
import type { WHATSAPP_TEMPLATE_SIDS } from "~/types/whatsapp-templates";

// =============================================================================
// Types
// =============================================================================

export interface UseWhatsAppInboxReturn {
  // Connection state
  isConnected: boolean | null;
  whatsappNumber: string | null;
  isCheckingConnection: boolean;

  // Conversation state
  conversations: WhatsAppConversation[];
  threads: InboxThread[]; // Converted for inbox compatibility
  isLoading: boolean;
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<WhatsAppConversationWithMessages | null>;
  sendMessage: (conversationId: string, content: string) => Promise<boolean>;
  sendTemplate: (
    conversationId: string,
    templateType: keyof typeof WHATSAPP_TEMPLATE_SIDS,
    variables: Record<string, string>,
  ) => Promise<boolean>;
  startConversation: (contactId: string, message: string) => Promise<string | null>;
  markAsRead: (conversationId: string) => Promise<void>;
  archiveConversation: (conversationId: string) => Promise<boolean>;
  linkToListing: (
    conversationId: string,
    listingContactId: string | null,
  ) => Promise<boolean>;
  checkConnection: () => Promise<void>;

  // 24h window helpers
  canSendFreeform: (conversationId: string) => boolean;
  getSessionInfo: (conversationId: string) => WhatsAppSessionInfo | null;
}

// =============================================================================
// Constants
// =============================================================================

const POLL_INTERVAL_MS = 15000; // 15 seconds
const REFRESH_COOLDOWN_MS = 5000; // 5 seconds

// =============================================================================
// Hook Implementation
// =============================================================================

export function useWhatsAppInbox(): UseWhatsAppInboxReturn {
  // Connection state
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  // Conversation state
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for tracking
  const lastRefreshTime = useRef<number>(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ---------------------------------------------------------------------------
  // Connection Check
  // ---------------------------------------------------------------------------

  const checkConnection = useCallback(async () => {
    setIsCheckingConnection(true);
    try {
      const status = await getWhatsAppConnectionStatusAction();
      setIsConnected(status.connected);
      setWhatsappNumber(status.whatsappNumber ?? null);
    } catch (err) {
      console.error("Error checking WhatsApp connection:", err);
      setIsConnected(false);
      setWhatsappNumber(null);
    } finally {
      setIsCheckingConnection(false);
    }
  }, []);

  // Initial connection check
  useEffect(() => {
    void checkConnection();
  }, [checkConnection]);

  // ---------------------------------------------------------------------------
  // Fetch Conversations
  // ---------------------------------------------------------------------------

  const fetchConversations = useCallback(async (showLoading = true) => {
    if (!isConnected) return;

    // Cooldown check
    const now = Date.now();
    if (now - lastRefreshTime.current < REFRESH_COOLDOWN_MS) {
      return;
    }
    lastRefreshTime.current = now;

    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await getWhatsAppConversationsAction({ limit: 50 });

      if (result.success) {
        setConversations(result.conversations);
      } else {
        setError(result.error ?? "Error cargando conversaciones");
      }
    } catch (err) {
      console.error("Error fetching WhatsApp conversations:", err);
      setError("Error de conexion");
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  // Initial fetch when connected
  useEffect(() => {
    if (isConnected === true) {
      void fetchConversations();
    }
  }, [isConnected, fetchConversations]);

  // ---------------------------------------------------------------------------
  // Polling
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isConnected) return;

    // Start polling
    pollIntervalRef.current = setInterval(() => {
      void fetchConversations(false); // Silent refresh
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isConnected, fetchConversations]);

  // Refresh on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (isConnected) {
        void fetchConversations(false);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isConnected, fetchConversations]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const refresh = useCallback(async () => {
    await fetchConversations(true);
  }, [fetchConversations]);

  const selectConversation = useCallback(
    async (conversationId: string): Promise<WhatsAppConversationWithMessages | null> => {
      try {
        const result = await getWhatsAppConversationAction(conversationId);

        if (result.success && result.conversation) {
          // Update local state with fresh data
          setConversations((prev) =>
            prev.map((c) =>
              c.conversationId.toString() === conversationId
                ? {
                    ...c,
                    unreadCount: 0,
                    lastMessageAt: result.conversation!.lastMessageAt,
                    lastCustomerMessageAt: result.conversation!.lastCustomerMessageAt,
                  }
                : c,
            ),
          );

          return result.conversation;
        }

        return null;
      } catch (err) {
        console.error("Error selecting conversation:", err);
        return null;
      }
    },
    [],
  );

  const sendMessage = useCallback(
    async (conversationId: string, content: string): Promise<boolean> => {
      try {
        const result = await sendWhatsAppMessageAction(conversationId, content);

        if (result.success) {
          // Refresh to get the new message
          await fetchConversations(false);
          return true;
        }

        if (result.requiresTemplate) {
          toast.error("La ventana de 24h ha expirado. Usa una plantilla.");
        } else {
          toast.error(result.error ?? "Error al enviar mensaje");
        }

        return false;
      } catch (err) {
        console.error("Error sending message:", err);
        toast.error("Error al enviar mensaje");
        return false;
      }
    },
    [fetchConversations],
  );

  const sendTemplate = useCallback(
    async (
      conversationId: string,
      templateType: keyof typeof WHATSAPP_TEMPLATE_SIDS,
      variables: Record<string, string>,
    ): Promise<boolean> => {
      try {
        const result = await sendWhatsAppTemplateAction(
          conversationId,
          templateType,
          variables,
        );

        if (result.success) {
          await fetchConversations(false);
          return true;
        }

        toast.error(result.error ?? "Error al enviar plantilla");
        return false;
      } catch (err) {
        console.error("Error sending template:", err);
        toast.error("Error al enviar plantilla");
        return false;
      }
    },
    [fetchConversations],
  );

  const startConversation = useCallback(
    async (contactId: string, message: string): Promise<string | null> => {
      try {
        const result = await startWhatsAppConversationAction(contactId, message);

        if (result.success && result.conversationId) {
          await fetchConversations(false);
          return result.conversationId.toString();
        }

        toast.error(result.error ?? "Error al iniciar conversacion");
        return null;
      } catch (err) {
        console.error("Error starting conversation:", err);
        toast.error("Error al iniciar conversacion");
        return null;
      }
    },
    [fetchConversations],
  );

  const markAsRead = useCallback(
    async (conversationId: string): Promise<void> => {
      try {
        // Optimistic update
        setConversations((prev) =>
          prev.map((c) =>
            c.conversationId.toString() === conversationId
              ? { ...c, unreadCount: 0 }
              : c,
          ),
        );

        await markWhatsAppReadAction(conversationId);
      } catch (err) {
        console.error("Error marking as read:", err);
      }
    },
    [],
  );

  const archiveConversation = useCallback(
    async (conversationId: string): Promise<boolean> => {
      try {
        const result = await archiveWhatsAppConversationAction(conversationId);

        if (result.success) {
          // Remove from local state
          setConversations((prev) =>
            prev.filter((c) => c.conversationId.toString() !== conversationId),
          );
          return true;
        }

        toast.error(result.error ?? "Error al archivar");
        return false;
      } catch (err) {
        console.error("Error archiving conversation:", err);
        toast.error("Error al archivar");
        return false;
      }
    },
    [],
  );

  const linkToListing = useCallback(
    async (
      conversationId: string,
      listingContactId: string | null,
    ): Promise<boolean> => {
      try {
        const result = await linkWhatsAppToListingAction(
          conversationId,
          listingContactId,
        );

        if (result.success) {
          await fetchConversations(false);
          return true;
        }

        toast.error(result.error ?? "Error al vincular propiedad");
        return false;
      } catch (err) {
        console.error("Error linking to listing:", err);
        toast.error("Error al vincular propiedad");
        return false;
      }
    },
    [fetchConversations],
  );

  // ---------------------------------------------------------------------------
  // 24h Window Helpers
  // ---------------------------------------------------------------------------

  const canSendFreeformFn = useCallback(
    (conversationId: string): boolean => {
      const conversation = conversations.find(
        (c) => c.conversationId.toString() === conversationId,
      );
      return conversation?.isWithin24Hours ?? false;
    },
    [conversations],
  );

  const getSessionInfoFn = useCallback(
    (conversationId: string): WhatsAppSessionInfo | null => {
      const conversation = conversations.find(
        (c) => c.conversationId.toString() === conversationId,
      );
      if (!conversation) return null;
      return getSessionInfo(conversation.lastCustomerMessageAt);
    },
    [conversations],
  );

  // ---------------------------------------------------------------------------
  // Convert to InboxThread format
  // ---------------------------------------------------------------------------

  const threads: InboxThread[] = conversations.map((conversation) => ({
    id: `wa-${conversation.conversationId}`,
    channel: "whatsapp" as const,
    snippet: "", // Will be filled when messages are loaded
    participants: [
      {
        id: `contact-${conversation.contactId}`,
        name: `${conversation.contact.firstName} ${conversation.contact.lastName}`.trim(),
        phone: conversation.whatsappNumber,
        contactId: Number(conversation.contactId),
        isLinked: true,
      },
    ],
    messages: [], // Will be filled when selected
    lastMessageAt: conversation.lastMessageAt ?? conversation.createdAt,
    read: conversation.unreadCount === 0,
    starred: false,
    messageCount: 0,
    threadContext: conversation.listingContactId
      ? {
          listingContactId: conversation.listingContactId,
          contactId: conversation.contactId,
          contactType: null,
          listing: conversation.listing,
        }
      : undefined,
  }));

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // Connection state
    isConnected,
    whatsappNumber,
    isCheckingConnection,

    // Conversation state
    conversations,
    threads,
    isLoading,
    error,

    // Actions
    refresh,
    selectConversation,
    sendMessage,
    sendTemplate,
    startConversation,
    markAsRead,
    archiveConversation,
    linkToListing,
    checkConnection,

    // 24h window helpers
    canSendFreeform: canSendFreeformFn,
    getSessionInfo: getSessionInfoFn,
  };
}
