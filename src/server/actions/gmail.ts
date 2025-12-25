"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "~/lib/dal";
import { disconnectGmailIntegration, getGmailUserEmail } from "~/lib/google-gmail";
import {
  hasGmailIntegrationWithAuth,
  getGmailThreadsWithAuth,
  getGmailThreadWithAuth,
  getGmailUnreadCountWithAuth,
} from "~/server/queries/gmail";
import {
  sendGmailMessage,
  replyToGmailThread,
  markGmailThreadRead,
  markGmailThreadUnread,
  starGmailThread,
  unstarGmailThread,
  deleteGmailThread,
  type FetchThreadsOptions,
} from "~/server/services/gmail-service";
import type { InboxThread } from "~/components/inbox/inbox-types";

export interface GmailConnectionStatus {
  connected: boolean;
  email?: string;
}

export interface GmailThreadsResult {
  success: boolean;
  threads: InboxThread[];
  nextPageToken?: string;
  error?: string;
}

export interface GmailThreadResult {
  success: boolean;
  thread: InboxThread | null;
  error?: string;
}

export interface SendEmailData {
  to: string;
  subject: string;
  body: string;
  htmlBody?: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

export interface SendResult extends ActionResult {
  messageId?: string;
  threadId?: string;
}

export interface ToggleResult extends ActionResult {
  read?: boolean;
  starred?: boolean;
}

/**
 * Get Gmail connection status
 */
export async function getGmailConnectionStatusAction(): Promise<GmailConnectionStatus> {
  try {
    const connected = await hasGmailIntegrationWithAuth();
    if (!connected) {
      return { connected: false };
    }

    const user = await getCurrentUser();
    if (!user) {
      return { connected: false };
    }

    const email = await getGmailUserEmail(user.id);
    return {
      connected: true,
      email: email ?? undefined,
    };
  } catch (error) {
    console.error("Error checking Gmail connection:", error);
    return { connected: false };
  }
}

/**
 * Disconnect Gmail
 */
export async function disconnectGmailAction(): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    const success = await disconnectGmailIntegration(user.id);
    if (success) {
      revalidatePath("/inbox");
    }

    return { success };
  } catch (error) {
    console.error("Error disconnecting Gmail:", error);
    return { success: false, error: "Error al desconectar Gmail" };
  }
}

/**
 * Get Gmail threads
 */
export async function getGmailThreadsAction(
  options?: FetchThreadsOptions
): Promise<GmailThreadsResult> {
  try {
    const result = await getGmailThreadsWithAuth(options);
    return {
      success: true,
      threads: result.threads,
      nextPageToken: result.nextPageToken,
    };
  } catch (error) {
    console.error("Error fetching Gmail threads:", error);
    return {
      success: false,
      threads: [],
      error: error instanceof Error ? error.message : "Error al cargar emails",
    };
  }
}

/**
 * Get a single Gmail thread
 */
export async function getGmailThreadAction(
  threadId: string
): Promise<GmailThreadResult> {
  try {
    const thread = await getGmailThreadWithAuth(threadId);
    return {
      success: true,
      thread,
    };
  } catch (error) {
    console.error("Error fetching Gmail thread:", error);
    return {
      success: false,
      thread: null,
      error: error instanceof Error ? error.message : "Error al cargar conversacion",
    };
  }
}

/**
 * Get unread email count
 */
export async function getGmailUnreadCountAction(): Promise<number> {
  try {
    return await getGmailUnreadCountWithAuth();
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
}

/**
 * Send a new email
 */
export async function sendGmailMessageAction(
  data: SendEmailData
): Promise<SendResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    const result = await sendGmailMessage(user.id, data);
    revalidatePath("/inbox");

    return {
      success: true,
      messageId: result.messageId,
      threadId: result.threadId,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al enviar email",
    };
  }
}

/**
 * Reply to a Gmail thread
 */
export async function replyToGmailThreadAction(
  threadId: string,
  content: string,
  htmlContent?: string
): Promise<SendResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    const result = await replyToGmailThread(user.id, threadId, content, htmlContent);
    revalidatePath("/inbox");

    return {
      success: true,
      messageId: result.messageId,
      threadId: result.threadId,
    };
  } catch (error) {
    console.error("Error replying to thread:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al responder",
    };
  }
}

/**
 * Toggle read status of a thread
 */
export async function toggleGmailReadAction(
  threadId: string,
  currentlyRead: boolean
): Promise<ToggleResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    let success: boolean;
    if (currentlyRead) {
      success = await markGmailThreadUnread(user.id, threadId);
    } else {
      success = await markGmailThreadRead(user.id, threadId);
    }

    if (success) {
      revalidatePath("/inbox");
    }

    return {
      success,
      read: !currentlyRead,
    };
  } catch (error) {
    console.error("Error toggling read status:", error);
    return {
      success: false,
      error: "Error al cambiar estado de lectura",
    };
  }
}

/**
 * Mark a thread as read
 */
export async function markGmailReadAction(threadId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    const success = await markGmailThreadRead(user.id, threadId);
    if (success) {
      revalidatePath("/inbox");
    }

    return { success };
  } catch (error) {
    console.error("Error marking as read:", error);
    return { success: false, error: "Error al marcar como leido" };
  }
}

/**
 * Toggle starred status of a thread
 */
export async function toggleGmailStarAction(
  threadId: string,
  currentlyStarred: boolean
): Promise<ToggleResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    let success: boolean;
    if (currentlyStarred) {
      success = await unstarGmailThread(user.id, threadId);
    } else {
      success = await starGmailThread(user.id, threadId);
    }

    if (success) {
      revalidatePath("/inbox");
    }

    return {
      success,
      starred: !currentlyStarred,
    };
  } catch (error) {
    console.error("Error toggling star:", error);
    return {
      success: false,
      error: "Error al cambiar favorito",
    };
  }
}

/**
 * Delete a Gmail thread (move to trash)
 */
export async function deleteGmailThreadAction(
  threadId: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    const success = await deleteGmailThread(user.id, threadId);
    if (success) {
      revalidatePath("/inbox");
    }

    return { success };
  } catch (error) {
    console.error("Error deleting thread:", error);
    return { success: false, error: "Error al eliminar email" };
  }
}
