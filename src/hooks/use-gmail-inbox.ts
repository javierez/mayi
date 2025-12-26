"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { InboxThread, ComposeMessageData, ThreadContext } from "~/components/inbox/inbox-types";
import type { EmailAttachment } from "~/server/services/gmail-service";
import {
  getGmailConnectionStatusAction,
  getGmailThreadsAction,
  getGmailThreadAction,
  toggleGmailReadAction,
  toggleGmailStarAction,
  sendGmailMessageAction,
  replyToGmailThreadAction,
  markGmailReadAction,
  disconnectGmailAction,
  deleteGmailThreadAction,
} from "~/server/actions/gmail";
import { getThreadContextsByThreadIds } from "~/server/queries/email-thread-context";
import { assignListingToThreadAction } from "~/server/actions/email-thread-context";

export interface UseGmailInboxReturn {
  // Connection state
  isConnected: boolean | null;
  connectionEmail: string | null;
  isCheckingConnection: boolean;

  // Thread state
  threads: InboxThread[];
  isLoading: boolean;
  error: string | null;
  nextPageToken: string | null;

  // Actions
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  selectThread: (threadId: string) => Promise<InboxThread | null>;
  toggleRead: (threadId: string) => Promise<void>;
  toggleStarred: (threadId: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<boolean>;
  sendMessage: (data: ComposeMessageData) => Promise<boolean>;
  sendReply: (threadId: string, content: string, attachments?: EmailAttachment[]) => Promise<boolean>;
  disconnect: () => Promise<void>;
  checkConnection: () => Promise<void>;
  markContactAsLinked: (email: string) => void;
  assignListingToThread: (
    threadId: string,
    contactId: bigint,
    listingId: bigint | null,
    contactType?: "owner" | "buyer",
  ) => Promise<boolean>;
  updateThreadContext: (threadId: string, context: ThreadContext | undefined) => void;
}

export function useGmailInbox(): UseGmailInboxReturn {
  // Connection state
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionEmail, setConnectionEmail] = useState<string | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  // Thread state
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  // Track last refresh time to avoid rapid refreshes
  const lastRefreshTime = useRef<number>(0);
  const REFRESH_COOLDOWN_MS = 30000; // 30 seconds

  // Check connection status
  const checkConnection = useCallback(async () => {
    setIsCheckingConnection(true);
    try {
      const status = await getGmailConnectionStatusAction();
      setIsConnected(status.connected);
      setConnectionEmail(status.email ?? null);
    } catch (err) {
      console.error("Error checking Gmail connection:", err);
      setIsConnected(false);
      setConnectionEmail(null);
    } finally {
      setIsCheckingConnection(false);
    }
  }, []);

  // Initial connection check
  useEffect(() => {
    void checkConnection();
  }, [checkConnection]);

  // Helper to enrich threads with their contexts
  const enrichThreadsWithContexts = useCallback(async (threadsToEnrich: InboxThread[]): Promise<InboxThread[]> => {
    if (threadsToEnrich.length === 0) return threadsToEnrich;

    try {
      const threadIds = threadsToEnrich.map((t) => t.id);
      const contextsMap = await getThreadContextsByThreadIds(threadIds);

      return threadsToEnrich.map((thread) => {
        const contextData = contextsMap.get(thread.id);
        if (!contextData) return thread;

        const threadContext: ThreadContext | undefined = contextData.listingContactId
          ? {
              listingContactId: contextData.listingContactId,
              contactId: contextData.contactId,
              contactType: contextData.contactType as "owner" | "buyer" | null,
              listing: contextData.listing,
            }
          : undefined;

        return { ...thread, threadContext };
      });
    } catch (err) {
      console.error("Error fetching thread contexts:", err);
      return threadsToEnrich;
    }
  }, []);

  // Fetch threads
  const fetchThreads = useCallback(async (pageToken?: string, isRefresh = false) => {
    if (!isConnected) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getGmailThreadsAction({
        maxResults: 20,
        pageToken,
      });

      if (result.success) {
        // Enrich threads with their contexts
        const enrichedThreads = await enrichThreadsWithContexts(result.threads);

        if (pageToken) {
          // Append to existing threads (pagination)
          setThreads((prev) => [...prev, ...enrichedThreads]);
        } else if (isRefresh) {
          // Incremental refresh: merge new threads with existing ones
          setThreads((prev) => {
            const existingById = new Map(prev.map((t) => [t.id, t]));
            const newThreads = enrichedThreads.filter((t) => !existingById.has(t.id));

            // Update existing threads with fresh data, but preserve isLinked status and threadContext
            const updatedExisting = prev.map((existing) => {
              const fresh = enrichedThreads.find((t) => t.id === existing.id);
              if (!fresh) return existing;

              // Preserve isLinked status from existing participants
              const linkedEmails = new Set(
                existing.participants
                  .filter((p) => p.isLinked)
                  .map((p) => (p.email ?? p.id).toLowerCase().trim())
              );

              return {
                ...fresh,
                // Preserve threadContext from fresh data (already enriched)
                threadContext: fresh.threadContext ?? existing.threadContext,
                participants: fresh.participants.map((p) => {
                  const email = (p.email ?? p.id).toLowerCase().trim();
                  return linkedEmails.has(email) ? { ...p, isLinked: true } : p;
                }),
              };
            });

            // Combine and sort by date
            return [...newThreads, ...updatedExisting].sort(
              (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
            );
          });
        } else {
          // Initial load: replace threads
          setThreads(enrichedThreads);
        }
        setNextPageToken(result.nextPageToken ?? null);
      } else {
        setError(result.error ?? "Error al cargar emails");
      }
    } catch (err) {
      console.error("Error fetching threads:", err);
      setError("Error al cargar emails");
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, enrichThreadsWithContexts]);

  // Load threads when connected
  useEffect(() => {
    if (isConnected === true) {
      void fetchThreads();
      lastRefreshTime.current = Date.now();
    }
  }, [isConnected, fetchThreads]);

  // Refresh threads (incremental - keeps existing threads and merges new ones)
  const refresh = useCallback(async () => {
    setNextPageToken(null);
    await fetchThreads(undefined, true); // isRefresh = true
    lastRefreshTime.current = Date.now();
  }, [fetchThreads]);

  // Refresh on window focus (when user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      // Only refresh if connected, not loading, and cooldown has passed
      if (
        isConnected &&
        !isLoading &&
        Date.now() - lastRefreshTime.current > REFRESH_COOLDOWN_MS
      ) {
        void refresh();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isConnected, isLoading, refresh]);

  // Load more threads
  const loadMore = useCallback(async () => {
    if (nextPageToken) {
      await fetchThreads(nextPageToken);
    }
  }, [fetchThreads, nextPageToken]);

  // Select thread (fetch full details and mark as read)
  const selectThread = useCallback(async (threadId: string): Promise<InboxThread | null> => {
    try {
      const result = await getGmailThreadAction(threadId);
      if (result.success && result.thread) {
        // Mark as read
        if (!result.thread.read) {
          await markGmailReadAction(threadId);
          // Update local state
          setThreads((prev) =>
            prev.map((t) =>
              t.id === threadId ? { ...t, read: true } : t
            )
          );
        }
        return result.thread;
      }
      return null;
    } catch (err) {
      console.error("Error selecting thread:", err);
      return null;
    }
  }, []);

  // Toggle read status
  const toggleRead = useCallback(async (threadId: string) => {
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) return;

    // Optimistic update
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId ? { ...t, read: !t.read } : t
      )
    );

    try {
      const result = await toggleGmailReadAction(threadId, thread.read);
      if (!result.success) {
        // Revert on error
        setThreads((prev) =>
          prev.map((t) =>
            t.id === threadId ? { ...t, read: thread.read } : t
          )
        );
        toast.error(result.error ?? "Error al cambiar estado de lectura");
      }
    } catch {
      // Revert on error
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, read: thread.read } : t
        )
      );
      toast.error("Error al cambiar estado de lectura");
    }
  }, [threads]);

  // Toggle starred status
  const toggleStarred = useCallback(async (threadId: string) => {
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) return;

    // Optimistic update
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId ? { ...t, starred: !t.starred } : t
      )
    );

    try {
      const result = await toggleGmailStarAction(threadId, thread.starred);
      if (!result.success) {
        // Revert on error
        setThreads((prev) =>
          prev.map((t) =>
            t.id === threadId ? { ...t, starred: thread.starred } : t
          )
        );
        toast.error(result.error ?? "Error al cambiar favorito");
      }
    } catch {
      // Revert on error
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, starred: thread.starred } : t
        )
      );
      toast.error("Error al cambiar favorito");
    }
  }, [threads]);

  // Delete thread
  const deleteThread = useCallback(async (threadId: string): Promise<boolean> => {
    try {
      const result = await deleteGmailThreadAction(threadId);

      if (result.success) {
        // Remove from local state
        setThreads((prev) => prev.filter((t) => t.id !== threadId));
        toast.success("Email eliminado");
        return true;
      } else {
        toast.error(result.error ?? "Error al eliminar email");
        return false;
      }
    } catch (err) {
      console.error("Error deleting thread:", err);
      toast.error("Error al eliminar email");
      return false;
    }
  }, []);

  // Send new message
  const sendMessage = useCallback(async (data: ComposeMessageData): Promise<boolean> => {
    if (data.channel !== "email") {
      toast.error("Solo se pueden enviar emails por Gmail");
      return false;
    }

    try {
      // Convert ComposeAttachment to EmailAttachment format
      const attachments = data.attachments?.map((att) => ({
        filename: att.filename,
        mimeType: att.mimeType,
        data: att.data,
      }));

      const result = await sendGmailMessageAction({
        to: data.recipientId, // recipientId should be the email address
        subject: data.subject ?? "",
        body: data.content,
        attachments,
      });

      if (result.success) {
        toast.success("Email enviado");
        await refresh();
        return true;
      } else {
        toast.error(result.error ?? "Error al enviar email");
        return false;
      }
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Error al enviar email");
      return false;
    }
  }, [refresh]);

  // Send reply
  const sendReply = useCallback(async (
    threadId: string,
    content: string,
    attachments?: EmailAttachment[]
  ): Promise<boolean> => {
    try {
      const result = await replyToGmailThreadAction(threadId, content, undefined, attachments);

      if (result.success) {
        toast.success("Respuesta enviada");
        await refresh();
        return true;
      } else {
        toast.error(result.error ?? "Error al enviar respuesta");
        return false;
      }
    } catch (err) {
      console.error("Error sending reply:", err);
      toast.error("Error al enviar respuesta");
      return false;
    }
  }, [refresh]);

  // Disconnect Gmail
  const disconnect = useCallback(async () => {
    try {
      const result = await disconnectGmailAction();
      if (result.success) {
        setIsConnected(false);
        setConnectionEmail(null);
        setThreads([]);
        toast.success("Gmail desconectado");
      } else {
        toast.error(result.error ?? "Error al desconectar Gmail");
      }
    } catch (err) {
      console.error("Error disconnecting Gmail:", err);
      toast.error("Error al desconectar Gmail");
    }
  }, []);

  // Optimistically mark a contact as linked by email
  const markContactAsLinked = useCallback((email: string) => {
    const normalizedEmail = email.toLowerCase().trim();

    setThreads((prev) =>
      prev.map((thread) => ({
        ...thread,
        participants: thread.participants.map((p) => {
          const participantEmail = (p.email ?? p.id).toLowerCase().trim();
          if (participantEmail === normalizedEmail) {
            return { ...p, isLinked: true };
          }
          return p;
        }),
        messages: thread.messages.map((msg) => ({
          ...msg,
          from: msg.from && (msg.from.email ?? msg.from.id).toLowerCase().trim() === normalizedEmail
            ? { ...msg.from, isLinked: true }
            : msg.from,
          to: msg.to?.map((t) =>
            (t.email ?? t.id).toLowerCase().trim() === normalizedEmail
              ? { ...t, isLinked: true }
              : t
          ),
          cc: msg.cc?.map((c) =>
            (c.email ?? c.id).toLowerCase().trim() === normalizedEmail
              ? { ...c, isLinked: true }
              : c
          ),
        })),
      }))
    );
  }, []);

  // Update thread context (optimistically)
  const updateThreadContext = useCallback((threadId: string, context: ThreadContext | undefined) => {
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === threadId ? { ...thread, threadContext: context } : thread
      )
    );
  }, []);

  // Assign listing to thread
  const assignListingToThread = useCallback(
    async (
      threadId: string,
      contactId: bigint,
      listingId: bigint | null,
      contactType?: "owner" | "buyer",
    ): Promise<boolean> => {
      try {
        const result = await assignListingToThreadAction(
          threadId,
          contactId,
          listingId,
          contactType,
        );

        if (result.success) {
          // Refresh to get updated context
          await refresh();
          return true;
        } else {
          toast.error(result.error ?? "Error al asignar propiedad");
          return false;
        }
      } catch (err) {
        console.error("Error assigning listing to thread:", err);
        toast.error("Error al asignar propiedad");
        return false;
      }
    },
    [refresh]
  );

  return {
    isConnected,
    connectionEmail,
    isCheckingConnection,
    threads,
    isLoading,
    error,
    nextPageToken,
    refresh,
    loadMore,
    selectThread,
    toggleRead,
    toggleStarred,
    deleteThread,
    sendMessage,
    sendReply,
    disconnect,
    checkConnection,
    markContactAsLinked,
    assignListingToThread,
    updateThreadContext,
  };
}
