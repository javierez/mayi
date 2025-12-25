import { getGmailClient, getGmailUserEmail } from "~/lib/google-gmail";
import { gmailThreadToInboxThread } from "~/lib/gmail-transformers";
import type { InboxThread } from "~/components/inbox/inbox-types";
import {
  buildOperationalEmailQuery,
  shouldIncludeEmail,
} from "~/lib/constants/inbox-filters";

export interface FetchThreadsOptions {
  maxResults?: number;
  pageToken?: string;
  query?: string;
  /** Skip operational email filtering (default: false) */
  skipFilters?: boolean;
}

export interface FetchThreadsResult {
  threads: InboxThread[];
  nextPageToken?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  htmlBody?: string;
  threadId?: string;
  replyToMessageId?: string;
}

export interface SendEmailResult {
  messageId: string;
  threadId: string;
}

/**
 * Fetch Gmail threads for a user
 *
 * By default, applies operational email filters to only show relevant emails
 * (clients, banks, notaries, agencies, portals). Set skipFilters=true to get all emails.
 */
export async function fetchGmailThreads(
  userId: string,
  options: FetchThreadsOptions = {}
): Promise<FetchThreadsResult> {
  const gmail = await getGmailClient(userId);
  if (!gmail) {
    throw new Error("Gmail not connected");
  }

  const userEmail = await getGmailUserEmail(userId);
  if (!userEmail) {
    throw new Error("Could not get user email");
  }

  const { maxResults = 30, pageToken, query, skipFilters = false } = options;

  // Build the query: use custom query, or operational filter, or no filter
  let finalQuery = query;
  if (!finalQuery && !skipFilters) {
    finalQuery = buildOperationalEmailQuery();
  }

  // List threads from inbox
  const listResponse = await gmail.users.threads.list({
    userId: "me",
    maxResults,
    pageToken,
    q: finalQuery,
    labelIds: ["INBOX"],
  });

  const threadIds = listResponse.data.threads ?? [];
  const nextPageToken = listResponse.data.nextPageToken ?? undefined;

  // Fetch full thread data for each thread
  const threads: InboxThread[] = [];
  for (const threadRef of threadIds) {
    if (!threadRef.id) continue;

    try {
      const threadResponse = await gmail.users.threads.get({
        userId: "me",
        id: threadRef.id,
        format: "full",
      });

      const thread = gmailThreadToInboxThread(threadResponse.data, userEmail);

      // Apply post-filter if filters are enabled
      if (!skipFilters) {
        // Get sender from last message
        const lastMessage = thread.messages[thread.messages.length - 1];
        const senderEmail = lastMessage?.from?.email ?? "";
        const subject = thread.subject ?? "";

        // Only include if it passes the filter
        if (shouldIncludeEmail(senderEmail, subject)) {
          threads.push(thread);
        }
      } else {
        threads.push(thread);
      }
    } catch (error) {
      console.error(`Failed to fetch thread ${threadRef.id}:`, error);
    }
  }

  return { threads, nextPageToken };
}

/**
 * Fetch a single Gmail thread
 */
export async function fetchGmailThread(
  userId: string,
  threadId: string
): Promise<InboxThread | null> {
  const gmail = await getGmailClient(userId);
  if (!gmail) {
    throw new Error("Gmail not connected");
  }

  const userEmail = await getGmailUserEmail(userId);
  if (!userEmail) {
    throw new Error("Could not get user email");
  }

  try {
    const response = await gmail.users.threads.get({
      userId: "me",
      id: threadId,
      format: "full",
    });

    return gmailThreadToInboxThread(response.data, userEmail);
  } catch (error) {
    console.error(`Failed to fetch thread ${threadId}:`, error);
    return null;
  }
}

/**
 * Create MIME message for sending
 */
function createMimeMessage(options: SendEmailOptions): string {
  const { to, subject, body, htmlBody, replyToMessageId } = options;

  const boundary = `boundary_${Date.now()}`;
  const lines: string[] = [];

  // Headers
  lines.push(`To: ${to}`);
  lines.push(`Subject: ${subject}`);
  lines.push("MIME-Version: 1.0");

  // Add reply headers if replying
  if (replyToMessageId) {
    lines.push(`In-Reply-To: ${replyToMessageId}`);
    lines.push(`References: ${replyToMessageId}`);
  }

  if (htmlBody) {
    // Multipart message with text and HTML
    lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    lines.push("");
    lines.push(`--${boundary}`);
    lines.push("Content-Type: text/plain; charset=UTF-8");
    lines.push("");
    lines.push(body);
    lines.push(`--${boundary}`);
    lines.push("Content-Type: text/html; charset=UTF-8");
    lines.push("");
    lines.push(htmlBody);
    lines.push(`--${boundary}--`);
  } else {
    // Plain text only
    lines.push("Content-Type: text/plain; charset=UTF-8");
    lines.push("");
    lines.push(body);
  }

  return lines.join("\r\n");
}

/**
 * Encode message to base64url for Gmail API
 */
function encodeBase64Url(message: string): string {
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Send a new email or reply
 */
export async function sendGmailMessage(
  userId: string,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  const gmail = await getGmailClient(userId);
  if (!gmail) {
    throw new Error("Gmail not connected");
  }

  const mimeMessage = createMimeMessage(options);
  const raw = encodeBase64Url(mimeMessage);

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
      threadId: options.threadId,
    },
  });

  if (!response.data.id || !response.data.threadId) {
    throw new Error("Failed to send message");
  }

  return {
    messageId: response.data.id,
    threadId: response.data.threadId,
  };
}

/**
 * Reply to a Gmail thread
 */
export async function replyToGmailThread(
  userId: string,
  threadId: string,
  content: string,
  htmlContent?: string
): Promise<SendEmailResult> {
  const gmail = await getGmailClient(userId);
  if (!gmail) {
    throw new Error("Gmail not connected");
  }

  // Get the thread to find the last message's headers
  const threadResponse = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "metadata",
    metadataHeaders: ["From", "To", "Subject", "Message-ID"],
  });

  const messages = threadResponse.data.messages ?? [];
  const lastMessage = messages[messages.length - 1];
  const headers = lastMessage?.payload?.headers ?? [];

  // Find reply-to address and subject
  const getHeader = (name: string) =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value;

  const fromHeader = getHeader("From");
  const toHeader = getHeader("To");
  const subjectHeader = getHeader("Subject");
  const messageIdHeader = getHeader("Message-ID");

  // Determine recipient (reply to sender or original recipient)
  const userEmail = await getGmailUserEmail(userId);
  let replyTo = fromHeader ?? "";

  // If the last message was from us, reply to the "To" instead
  if (fromHeader && userEmail && fromHeader.includes(userEmail)) {
    replyTo = toHeader ?? fromHeader;
  }

  // Ensure subject has Re: prefix
  let subject = subjectHeader ?? "";
  if (!subject.toLowerCase().startsWith("re:")) {
    subject = `Re: ${subject}`;
  }

  return sendGmailMessage(userId, {
    to: replyTo,
    subject,
    body: content,
    htmlBody: htmlContent,
    threadId,
    replyToMessageId: messageIdHeader ?? undefined,
  });
}

/**
 * Mark a thread as read
 */
export async function markGmailThreadRead(
  userId: string,
  threadId: string
): Promise<boolean> {
  const gmail = await getGmailClient(userId);
  if (!gmail) return false;

  try {
    await gmail.users.threads.modify({
      userId: "me",
      id: threadId,
      requestBody: {
        removeLabelIds: ["UNREAD"],
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to mark thread as read:", error);
    return false;
  }
}

/**
 * Mark a thread as unread
 */
export async function markGmailThreadUnread(
  userId: string,
  threadId: string
): Promise<boolean> {
  const gmail = await getGmailClient(userId);
  if (!gmail) return false;

  try {
    await gmail.users.threads.modify({
      userId: "me",
      id: threadId,
      requestBody: {
        addLabelIds: ["UNREAD"],
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to mark thread as unread:", error);
    return false;
  }
}

/**
 * Star a thread
 */
export async function starGmailThread(
  userId: string,
  threadId: string
): Promise<boolean> {
  const gmail = await getGmailClient(userId);
  if (!gmail) return false;

  try {
    await gmail.users.threads.modify({
      userId: "me",
      id: threadId,
      requestBody: {
        addLabelIds: ["STARRED"],
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to star thread:", error);
    return false;
  }
}

/**
 * Unstar a thread
 */
export async function unstarGmailThread(
  userId: string,
  threadId: string
): Promise<boolean> {
  const gmail = await getGmailClient(userId);
  if (!gmail) return false;

  try {
    await gmail.users.threads.modify({
      userId: "me",
      id: threadId,
      requestBody: {
        removeLabelIds: ["STARRED"],
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to unstar thread:", error);
    return false;
  }
}

/**
 * Delete a thread (move to Trash)
 */
export async function deleteGmailThread(
  userId: string,
  threadId: string
): Promise<boolean> {
  const gmail = await getGmailClient(userId);
  if (!gmail) return false;

  try {
    await gmail.users.threads.trash({
      userId: "me",
      id: threadId,
    });
    return true;
  } catch (error) {
    console.error("Failed to delete thread:", error);
    return false;
  }
}

/**
 * Get unread email count
 */
export async function getGmailUnreadCount(userId: string): Promise<number> {
  const gmail = await getGmailClient(userId);
  if (!gmail) return 0;

  try {
    const response = await gmail.users.threads.list({
      userId: "me",
      labelIds: ["INBOX", "UNREAD"],
      maxResults: 1,
    });

    return response.data.resultSizeEstimate ?? 0;
  } catch (error) {
    console.error("Failed to get unread count:", error);
    return 0;
  }
}
