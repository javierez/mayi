"use client";

import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import type {
  InboxThread,
  ThreadMessage,
  InboxFilter,
  ComposeMessageData,
} from "~/components/inbox/inbox-types";
import {
  mockThreads,
  filterThreads,
  getUnreadCount,
} from "~/components/inbox/mock-inbox-data";

export function useInbox() {
  const [threads, setThreads] = useState<InboxThread[]>(mockThreads);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Filtered threads based on current filter and search
  const filteredThreads = useMemo(() => {
    return filterThreads(threads, filter, searchQuery);
  }, [threads, filter, searchQuery]);

  // Unread counts
  const unreadCounts = useMemo(() => {
    return {
      all: getUnreadCount(threads, "all"),
      whatsapp: getUnreadCount(threads, "whatsapp"),
      email: getUnreadCount(threads, "email"),
    };
  }, [threads]);

  // Get selected thread
  const selectedThread = useMemo(() => {
    if (!selectedThreadId) return null;
    return threads.find((t) => t.id === selectedThreadId) ?? null;
  }, [threads, selectedThreadId]);

  // Select a thread and mark as read
  const selectThread = useCallback((threadId: string | null) => {
    setSelectedThreadId(threadId);
    if (threadId) {
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, read: true } : t))
      );
    }
  }, []);

  // Toggle read status
  const toggleRead = useCallback((threadId: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, read: !t.read } : t))
    );
  }, []);

  // Toggle starred status
  const toggleStarred = useCallback((threadId: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, starred: !t.starred } : t))
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setThreads((prev) => prev.map((t) => ({ ...t, read: true })));
    toast.success("Todas las conversaciones marcadas como leidas");
  }, []);

  // Delete thread (mock)
  const deleteThread = useCallback(
    (threadId: string) => {
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      if (selectedThreadId === threadId) {
        setSelectedThreadId(null);
      }
      toast.success("Conversacion eliminada");
    },
    [selectedThreadId]
  );

  // Send reply to thread (mock)
  const sendReply = useCallback(
    (threadId: string, replyContent: string) => {
      if (!replyContent.trim()) {
        toast.error("El mensaje no puede estar vacio");
        return;
      }

      const thread = threads.find((t) => t.id === threadId);
      if (!thread) return;

      // Get the other participant (not "Tu")
      const otherParticipant = thread.participants.find((p) => p.id !== "agent");

      // Create new message in thread
      const newMessage: ThreadMessage = {
        id: `msg-${Date.now()}`,
        threadId: threadId,
        status: "sent",
        from: {
          id: "agent",
          name: "Tu",
          email: "agente@vesta.es",
        },
        to: otherParticipant,
        content: replyContent,
        timestamp: new Date(),
      };

      // Update thread with new message
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id === threadId) {
            return {
              ...t,
              messages: [...t.messages, newMessage],
              messageCount: t.messageCount + 1,
              snippet: replyContent.substring(0, 50) + (replyContent.length > 50 ? "..." : ""),
              lastMessageAt: new Date(),
            };
          }
          return t;
        })
      );

      toast.success(
        `Respuesta enviada por ${thread.channel === "whatsapp" ? "WhatsApp" : "email"}`
      );
    },
    [threads]
  );

  // Send new message / create new thread (mock)
  const sendMessage = useCallback((data: ComposeMessageData) => {
    if (!data.content.trim()) {
      toast.error("El mensaje no puede estar vacio");
      return;
    }

    const agentContact = {
      id: "agent",
      name: "Tu",
      email: "agente@vesta.es",
    };

    const recipientContact = {
      id: data.recipientId,
      name: data.recipientName,
    };

    // Create new message
    const newMessage: ThreadMessage = {
      id: `msg-${Date.now()}`,
      threadId: `thread-new-${Date.now()}`,
      status: "sent",
      from: agentContact,
      to: recipientContact,
      content: data.content,
      timestamp: new Date(),
    };

    // Create new thread
    const newThread: InboxThread = {
      id: `thread-new-${Date.now()}`,
      channel: data.channel,
      subject: data.subject,
      snippet: data.content.substring(0, 50) + (data.content.length > 50 ? "..." : ""),
      participants: [recipientContact, agentContact],
      messages: [newMessage],
      lastMessageAt: new Date(),
      read: true,
      starred: false,
      messageCount: 1,
    };

    setThreads((prev) => [newThread, ...prev]);
    setIsComposeOpen(false);
    toast.success(
      `Mensaje enviado por ${data.channel === "whatsapp" ? "WhatsApp" : "email"}`
    );
  }, []);

  // Open compose dialog
  const openCompose = useCallback(() => {
    setIsComposeOpen(true);
  }, []);

  // Close compose dialog
  const closeCompose = useCallback(() => {
    setIsComposeOpen(false);
  }, []);

  return {
    // State
    threads: filteredThreads,
    selectedThread,
    selectedThreadId,
    filter,
    searchQuery,
    isComposeOpen,
    unreadCounts,

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
  };
}
