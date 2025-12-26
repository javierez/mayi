"use client";

import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import type {
  InboxThread,
  ThreadMessage,
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

export function useInbox() {
  // Gmail integration
  const gmail = useGmailInbox();

  // Local state for WhatsApp threads (mock for now)
  const [whatsappThreads, setWhatsappThreads] = useState<InboxThread[]>(
    mockThreads.filter((t) => t.channel === "whatsapp")
  );

  // Mock email threads (used when Gmail is not connected)
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

    // Combine with WhatsApp threads
    const combined = [...emailThreads, ...whatsappThreads];

    // Sort by last message date (newest first)
    return combined.sort(
      (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
    );
  }, [gmail.isConnected, gmail.threads, mockEmailThreads, whatsappThreads]);

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

    // Check if we have detailed thread data (from Gmail)
    if (selectedThreadData?.id === selectedThreadId) {
      return selectedThreadData;
    }

    // Otherwise find in combined threads
    return allThreads.find((t) => t.id === selectedThreadId) ?? null;
  }, [allThreads, selectedThreadId, selectedThreadData]);

  // Select a thread and mark as read
  const selectThread = useCallback(
    async (threadId: string | null) => {
      setSelectedThreadId(threadId);
      setSelectedThreadData(null);

      if (threadId) {
        const thread = allThreads.find((t) => t.id === threadId);

        if (thread?.channel === "email" && gmail.isConnected) {
          // Fetch detailed Gmail thread and mark as read
          const detailedThread = await gmail.selectThread(threadId);
          if (detailedThread) {
            setSelectedThreadData(detailedThread);
          }
        } else {
          // Mark WhatsApp thread as read locally
          setWhatsappThreads((prev) =>
            prev.map((t) => (t.id === threadId ? { ...t, read: true } : t))
          );
        }
      }
    },
    [allThreads, gmail]
  );

  // Toggle read status
  const toggleRead = useCallback(
    async (threadId: string) => {
      const thread = allThreads.find((t) => t.id === threadId);
      if (!thread) return;

      if (thread.channel === "email" && gmail.isConnected) {
        await gmail.toggleRead(threadId);
      } else {
        setWhatsappThreads((prev) =>
          prev.map((t) => (t.id === threadId ? { ...t, read: !t.read } : t))
        );
      }
    },
    [allThreads, gmail]
  );

  // Toggle starred status
  const toggleStarred = useCallback(
    async (threadId: string) => {
      const thread = allThreads.find((t) => t.id === threadId);
      if (!thread) return;

      if (thread.channel === "email" && gmail.isConnected) {
        await gmail.toggleStarred(threadId);
      } else {
        setWhatsappThreads((prev) =>
          prev.map((t) => (t.id === threadId ? { ...t, starred: !t.starred } : t))
        );
      }
    },
    [allThreads, gmail]
  );

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setWhatsappThreads((prev) => prev.map((t) => ({ ...t, read: true })));
    // Note: For Gmail, we would need to implement batch mark as read
    toast.success("Todas las conversaciones marcadas como leidas");
  }, []);

  // Delete thread
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
      } else {
        // Delete WhatsApp (mock)
        setWhatsappThreads((prev) => prev.filter((t) => t.id !== threadId));
        if (selectedThreadId === threadId) {
          setSelectedThreadId(null);
          setSelectedThreadData(null);
        }
        toast.success("Conversacion eliminada");
      }
    },
    [allThreads, gmail, selectedThreadId]
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
      } else {
        // Mock WhatsApp reply
        const otherParticipant = thread.participants.find((p) => p.id !== "agent");

        const newMessage: ThreadMessage = {
          id: `msg-${Date.now()}`,
          threadId: threadId,
          status: "sent",
          from: {
            id: "agent",
            name: "Tu",
            email: "agente@vesta.es",
          },
          to: otherParticipant ? [otherParticipant] : undefined,
          content: replyContent,
          timestamp: new Date(),
        };

        setWhatsappThreads((prev) =>
          prev.map((t) => {
            if (t.id === threadId) {
              return {
                ...t,
                messages: [...t.messages, newMessage],
                messageCount: t.messageCount + 1,
                snippet:
                  replyContent.substring(0, 50) +
                  (replyContent.length > 50 ? "..." : ""),
                lastMessageAt: new Date(),
              };
            }
            return t;
          })
        );

        toast.success("Respuesta enviada por WhatsApp");
      }
    },
    [allThreads, gmail]
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
      } else if (data.channel === "whatsapp") {
        // Mock WhatsApp message
        const agentContact = {
          id: "agent",
          name: "Tu",
          email: "agente@vesta.es",
        };

        const recipientContact = {
          id: data.recipientId,
          name: data.recipientName,
        };

        const newMessage: ThreadMessage = {
          id: `msg-${Date.now()}`,
          threadId: `thread-new-${Date.now()}`,
          status: "sent",
          from: agentContact,
          to: [recipientContact],
          content: data.content,
          timestamp: new Date(),
        };

        const newThread: InboxThread = {
          id: `thread-new-${Date.now()}`,
          channel: data.channel,
          subject: data.subject,
          snippet:
            data.content.substring(0, 50) +
            (data.content.length > 50 ? "..." : ""),
          participants: [recipientContact, agentContact],
          messages: [newMessage],
          lastMessageAt: new Date(),
          read: true,
          starred: false,
          messageCount: 1,
        };

        setWhatsappThreads((prev) => [newThread, ...prev]);
        setIsComposeOpen(false);
        toast.success("Mensaje enviado por WhatsApp");
      } else {
        // Email but Gmail not connected
        toast.error("Conecta tu cuenta de Gmail para enviar emails");
      }
    },
    [gmail]
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
    if (gmail.isConnected) {
      await gmail.refresh();
    }
  }, [gmail]);

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
  };
}
