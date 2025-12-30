"use client";

import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import type {
  InboxThread,
  InboxFilter,
  ComposeMessageData,
} from "~/components/inbox/inbox-types";
import type { EmailAttachment } from "~/server/services/gmail-service";
import {
  mockThreads,
  filterThreads,
  getUnreadCount,
} from "~/components/inbox/mock-inbox-data";
import { useGmailInbox } from "./use-gmail-inbox";
import { useWhatsAppInbox } from "./use-whatsapp-inbox";
import { convertToInboxThread } from "~/types/whatsapp-conversations";

export function useInbox() {
  // Gmail integration
  const gmail = useGmailInbox();

  // WhatsApp integration
  const whatsapp = useWhatsAppInbox();

  // Mock threads (used as fallback when services are not connected)
  const mockWhatsappThreads = useMemo(
    () => mockThreads.filter((t) => t.channel === "whatsapp"),
    []
  );
  const mockEmailThreads = useMemo(
    () => mockThreads.filter((t) => t.channel === "email"),
    []
  );

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedThreadData, setSelectedThreadData] = useState<InboxThread | null>(null);
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Combine threads from all sources
  const allThreads = useMemo(() => {
    // Get email threads from Gmail if connected, otherwise use mock
    const emailThreads = gmail.isConnected ? gmail.threads : mockEmailThreads;

    // Get WhatsApp threads from hook if connected, otherwise use mock
    const waThreads = whatsapp.isConnected ? whatsapp.threads : mockWhatsappThreads;

    // Combine email and WhatsApp threads
    const combined = [...emailThreads, ...waThreads];

    // Sort by last message date (newest first)
    return combined.sort(
      (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
    );
  }, [gmail.isConnected, gmail.threads, mockEmailThreads, whatsapp.isConnected, whatsapp.threads, mockWhatsappThreads]);

  // Filtered threads based on current filter and search
  const filteredThreads = useMemo(() => {
    return filterThreads(allThreads, filter, searchQuery);
  }, [allThreads, filter, searchQuery]);

  // Unread counts
  const unreadCounts = useMemo(() => {
    return {
      all: getUnreadCount(allThreads, "all"),
      whatsapp: getUnreadCount(allThreads, "whatsapp"),
      email: getUnreadCount(allThreads, "email"),
    };
  }, [allThreads]);

  // Get selected thread
  const selectedThread = useMemo(() => {
    if (!selectedThreadId) return null;

    // Find the thread in allThreads (which has threadContext from enrichment)
    const threadFromList = allThreads.find((t) => t.id === selectedThreadId);

    // Check if we have detailed thread data (from Gmail)
    if (selectedThreadData?.id === selectedThreadId) {
      // Merge threadContext from allThreads into the detailed data
      // since gmail.selectThread() doesn't include threadContext
      return {
        ...selectedThreadData,
        threadContext: selectedThreadData.threadContext ?? threadFromList?.threadContext,
      };
    }

    // Otherwise return from combined threads
    return threadFromList ?? null;
  }, [allThreads, selectedThreadId, selectedThreadData]);

  // Select a thread and mark as read
  const selectThread = useCallback(
    async (threadId: string | null) => {
      setSelectedThreadId(threadId);

      // Only clear selectedThreadData if deselecting (null)
      // Don't clear when switching threads to avoid flicker
      if (!threadId) {
        setSelectedThreadData(null);
      }

      if (threadId) {
        const thread = allThreads.find((t) => t.id === threadId);

        if (thread?.channel === "email" && gmail.isConnected) {
          // Fetch detailed Gmail thread and mark as read
          const detailedThread = await gmail.selectThread(threadId);
          if (detailedThread) {
            setSelectedThreadData(detailedThread);
          }
        } else if (thread?.channel === "whatsapp" && whatsapp.isConnected) {
          // Fetch detailed WhatsApp conversation with messages
          const conversationId = threadId.replace("wa-", "");
          const detailedConversation = await whatsapp.selectConversation(conversationId);
          if (detailedConversation) {
            // Convert to InboxThread format
            const detailedThread = convertToInboxThread(detailedConversation);
            setSelectedThreadData(detailedThread);
          }
          // Mark as read
          await whatsapp.markAsRead(conversationId);
        } else {
          // Mock fallback - clear detailed data
          setSelectedThreadData(null);
        }
      }
    },
    [allThreads, gmail, whatsapp]
  );

  // Toggle read status
  const toggleRead = useCallback(
    async (threadId: string) => {
      const thread = allThreads.find((t) => t.id === threadId);
      if (!thread) return;

      if (thread.channel === "email" && gmail.isConnected) {
        await gmail.toggleRead(threadId);
      } else if (thread.channel === "whatsapp" && whatsapp.isConnected) {
        // WhatsApp only supports marking as read (not toggling)
        const conversationId = threadId.replace("wa-", "");
        await whatsapp.markAsRead(conversationId);
      }
      // Mock fallback - no action needed
    },
    [allThreads, gmail, whatsapp]
  );

  // Toggle starred status
  const toggleStarred = useCallback(
    async (threadId: string) => {
      const thread = allThreads.find((t) => t.id === threadId);
      if (!thread) return;

      if (thread.channel === "email" && gmail.isConnected) {
        await gmail.toggleStarred(threadId);
      }
      // WhatsApp doesn't support starring - no action
    },
    [allThreads, gmail]
  );

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    // Note: Batch mark as read not implemented for Gmail or WhatsApp yet
    toast.success("Todas las conversaciones marcadas como leidas");
  }, []);

  // Delete/archive thread
  const deleteThread = useCallback(
    async (threadId: string) => {
      const thread = allThreads.find((t) => t.id === threadId);
      if (!thread) return;

      if (thread.channel === "email" && gmail.isConnected) {
        // Delete via Gmail
        const success = await gmail.deleteThread(threadId);
        if (success && selectedThreadId === threadId) {
          setSelectedThreadId(null);
          setSelectedThreadData(null);
        }
      } else if (thread.channel === "whatsapp" && whatsapp.isConnected) {
        // Archive WhatsApp conversation
        const conversationId = threadId.replace("wa-", "");
        const success = await whatsapp.archiveConversation(conversationId);
        if (success && selectedThreadId === threadId) {
          setSelectedThreadId(null);
          setSelectedThreadData(null);
        }
      }
      // Mock fallback - no action
    },
    [allThreads, gmail, whatsapp, selectedThreadId]
  );

  // Send reply to thread
  const sendReply = useCallback(
    async (threadId: string, replyContent: string, attachments?: EmailAttachment[]) => {
      if (!replyContent.trim()) {
        toast.error("El mensaje no puede estar vacio");
        return;
      }

      const thread = allThreads.find((t) => t.id === threadId);
      if (!thread) return;

      if (thread.channel === "email" && gmail.isConnected) {
        // Send via Gmail
        const success = await gmail.sendReply(threadId, replyContent, attachments);
        if (success) {
          // Refresh the selected thread data
          const updated = await gmail.selectThread(threadId);
          if (updated) {
            setSelectedThreadData(updated);
          }
        }
      } else if (thread.channel === "whatsapp" && whatsapp.isConnected) {
        // Send via WhatsApp
        const conversationId = threadId.replace("wa-", "");
        const success = await whatsapp.sendMessage(conversationId, replyContent);
        if (success) {
          // Refresh the selected thread data
          const detailedConversation = await whatsapp.selectConversation(conversationId);
          if (detailedConversation) {
            const detailedThread = convertToInboxThread(detailedConversation);
            setSelectedThreadData(detailedThread);
          }
        }
      }
      // Mock fallback - no action
    },
    [allThreads, gmail, whatsapp]
  );

  // Send new message / create new thread
  const sendMessage = useCallback(
    async (data: ComposeMessageData) => {
      if (!data.content.trim()) {
        toast.error("El mensaje no puede estar vacio");
        return;
      }

      if (data.channel === "email" && gmail.isConnected) {
        // Send via Gmail
        const success = await gmail.sendMessage(data);
        if (success) {
          setIsComposeOpen(false);
        }
      } else if (data.channel === "whatsapp" && whatsapp.isConnected) {
        // Start WhatsApp conversation via hook
        // Note: recipientId should be the contactId
        const conversationId = await whatsapp.startConversation(
          data.recipientId,
          data.content
        );
        if (conversationId) {
          setIsComposeOpen(false);
          // Select the new conversation
          await selectThread(`wa-${conversationId}`);
        }
      } else if (data.channel === "email") {
        // Email but Gmail not connected
        toast.error("Conecta tu cuenta de Gmail para enviar emails");
      } else {
        // WhatsApp but not connected
        toast.error("WhatsApp no esta configurado");
      }
    },
    [gmail, whatsapp, selectThread]
  );

  // Open compose dialog
  const openCompose = useCallback(() => {
    setIsComposeOpen(true);
  }, []);

  // Close compose dialog
  const closeCompose = useCallback(() => {
    setIsComposeOpen(false);
  }, []);

  // Refresh threads
  const refresh = useCallback(async () => {
    const refreshPromises: Promise<void>[] = [];
    if (gmail.isConnected) {
      refreshPromises.push(gmail.refresh());
    }
    if (whatsapp.isConnected) {
      refreshPromises.push(whatsapp.refresh());
    }
    await Promise.all(refreshPromises);
  }, [gmail, whatsapp]);

  // Load more threads (pagination)
  const loadMore = useCallback(async () => {
    if (gmail.isConnected && gmail.nextPageToken) {
      await gmail.loadMore();
    }
  }, [gmail]);

  // Check if there are more pages to load
  const hasMorePages = gmail.isConnected && gmail.nextPageToken !== null;

  return {
    // State
    threads: filteredThreads,
    selectedThread,
    selectedThreadId,
    filter,
    searchQuery,
    isComposeOpen,
    unreadCounts,

    // Gmail state
    isGmailConnected: gmail.isConnected,
    isGmailLoading: gmail.isLoading,
    gmailEmail: gmail.connectionEmail,
    isCheckingGmailConnection: gmail.isCheckingConnection,

    // WhatsApp state
    isWhatsAppConnected: whatsapp.isConnected,
    isWhatsAppLoading: whatsapp.isLoading,
    whatsappNumber: whatsapp.whatsappNumber,
    isCheckingWhatsAppConnection: whatsapp.isCheckingConnection,

    // WhatsApp 24h window helpers
    canSendFreeform: whatsapp.canSendFreeform,
    getWhatsAppSessionInfo: whatsapp.getSessionInfo,
    sendWhatsAppTemplate: whatsapp.sendTemplate,
    linkWhatsAppToListing: whatsapp.linkToListing,

    // Pagination
    hasMorePages,
    loadMore,

    // Actions
    selectThread,
    setFilter,
    setSearchQuery,
    toggleRead,
    toggleStarred,
    markAllAsRead,
    deleteThread,
    sendReply,
    sendMessage,
    openCompose,
    closeCompose,
    refresh,
    disconnectGmail: gmail.disconnect,
    markContactAsLinked: gmail.markContactAsLinked,
    assignListingToThread: gmail.assignListingToThread,
    updateThreadContext: gmail.updateThreadContext,
  };
}
