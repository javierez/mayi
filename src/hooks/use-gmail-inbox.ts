"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { InboxThread, ComposeMessageData } from "~/components/inbox/inbox-types";
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
  sendReply: (threadId: string, content: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  checkConnection: () => Promise<void>;
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

  // Fetch threads
  const fetchThreads = useCallback(async (pageToken?: string) => {
    if (!isConnected) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getGmailThreadsAction({
        maxResults: 20,
        pageToken,
      });

      if (result.success) {
        if (pageToken) {
          // Append to existing threads
          setThreads((prev) => [...prev, ...result.threads]);
        } else {
          // Replace threads
          setThreads(result.threads);
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
  }, [isConnected]);

  // Load threads when connected
  useEffect(() => {
    if (isConnected === true) {
      void fetchThreads();
    }
  }, [isConnected, fetchThreads]);

  // Refresh threads
  const refresh = useCallback(async () => {
    setNextPageToken(null);
    await fetchThreads();
  }, [fetchThreads]);

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
      const result = await sendGmailMessageAction({
        to: data.recipientId, // recipientId should be the email address
        subject: data.subject ?? "",
        body: data.content,
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
  const sendReply = useCallback(async (threadId: string, content: string): Promise<boolean> => {
    try {
      const result = await replyToGmailThreadAction(threadId, content);

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
  };
}
