import type { gmail_v1 } from "googleapis";
import type {
  InboxThread,
  ThreadMessage,
  InboxContact,
  InboxAttachment,
  MessageStatus,
} from "~/components/inbox/inbox-types";

/**
 * Parse email address string like "John Doe <john@example.com>" into contact
 */
export function parseEmailAddress(raw: string): { name: string; email: string } {
  const regex = /^(.+?)\s*<(.+?)>$/;
  const match = regex.exec(raw);
  if (match) {
    return {
      name: match[1]?.trim() ?? "",
      email: match[2]?.trim() ?? "",
    };
  }
  // Just an email address
  return {
    name: raw.trim(),
    email: raw.trim(),
  };
}

/**
 * Extract a header value from Gmail message headers
 */
function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string
): string | null {
  if (!headers) return null;
  const header = headers.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase()
  );
  return header?.value ?? null;
}

/**
 * Extract contact from email headers
 */
export function extractContactFromHeaders(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  headerName: string
): InboxContact | null {
  const value = getHeader(headers, headerName);
  if (!value) return null;

  const { name, email } = parseEmailAddress(value);
  return {
    id: email,
    name: name ? name : (email.split("@")[0] ?? email),
    email,
  };
}

/**
 * Decode base64url encoded message body
 */
function decodeBase64Url(encoded: string): string {
  // Replace base64url characters with base64
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  // Decode
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Find the message body part (text/plain or text/html)
 */
function findBodyPart(
  payload: gmail_v1.Schema$MessagePart,
  mimeType: string
): gmail_v1.Schema$MessagePart | null {
  if (payload.mimeType === mimeType && payload.body?.data) {
    return payload;
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const found = findBodyPart(part, mimeType);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Decode message body from Gmail payload
 */
export function decodeMessageBody(
  payload: gmail_v1.Schema$MessagePart | undefined
): { content: string; htmlContent?: string } {
  if (!payload) {
    return { content: "" };
  }

  // Try to find HTML content first
  const htmlPart = findBodyPart(payload, "text/html");
  const textPart = findBodyPart(payload, "text/plain");

  let content = "";
  let htmlContent: string | undefined;

  if (textPart?.body?.data) {
    content = decodeBase64Url(textPart.body.data);
  }

  if (htmlPart?.body?.data) {
    htmlContent = decodeBase64Url(htmlPart.body.data);
    // If no text content, extract from HTML
    if (!content && htmlContent) {
      content = htmlContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }
  }

  // If still no content, try the payload body directly
  if (!content && payload.body?.data) {
    content = decodeBase64Url(payload.body.data);
  }

  return { content, htmlContent };
}

/**
 * Extract attachments from Gmail message payload
 */
export function extractAttachments(
  payload: gmail_v1.Schema$MessagePart | undefined
): InboxAttachment[] {
  const attachments: InboxAttachment[] = [];

  function findAttachments(part: gmail_v1.Schema$MessagePart) {
    if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
      attachments.push({
        name: part.filename,
        type: part.mimeType ?? "application/octet-stream",
        size: part.body.size ? `${Math.round(part.body.size / 1024)} KB` : undefined,
      });
    }

    if (part.parts) {
      for (const subpart of part.parts) {
        findAttachments(subpart);
      }
    }
  }

  if (payload) {
    findAttachments(payload);
  }

  return attachments;
}

/**
 * Determine if message was sent by the user or received
 */
function getMessageStatus(
  message: gmail_v1.Schema$Message,
  userEmail: string
): MessageStatus {
  const fromHeader = getHeader(message.payload?.headers, "From");
  if (!fromHeader) return "received";

  const { email } = parseEmailAddress(fromHeader);
  return email.toLowerCase() === userEmail.toLowerCase() ? "sent" : "received";
}

/**
 * Transform Gmail message to ThreadMessage
 */
export function gmailMessageToThreadMessage(
  message: gmail_v1.Schema$Message,
  threadId: string,
  userEmail: string
): ThreadMessage {
  const headers = message.payload?.headers;
  const from = extractContactFromHeaders(headers, "From");
  const to = extractContactFromHeaders(headers, "To");
  const { content, htmlContent } = decodeMessageBody(message.payload);
  const attachments = extractAttachments(message.payload);
  const status = getMessageStatus(message, userEmail);

  return {
    id: message.id ?? "",
    threadId,
    status,
    from: from ?? { id: "unknown", name: "Unknown", email: "" },
    to: to ?? undefined,
    content: content ? content : (message.snippet ?? ""),
    htmlContent,
    timestamp: new Date(parseInt(message.internalDate ?? "0", 10)),
    attachments: attachments.length > 0 ? attachments : undefined,
  };
}

/**
 * Transform Gmail thread to InboxThread
 */
export function gmailThreadToInboxThread(
  thread: gmail_v1.Schema$Thread,
  userEmail: string
): InboxThread {
  const messages = thread.messages ?? [];
  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];
  const headers = firstMessage?.payload?.headers;

  // Get subject from first message
  const subject = getHeader(headers, "Subject") ?? "(Sin asunto)";

  // Get participants from all messages
  const participantsMap = new Map<string, InboxContact>();
  for (const msg of messages) {
    const from = extractContactFromHeaders(msg.payload?.headers, "From");
    const to = extractContactFromHeaders(msg.payload?.headers, "To");
    if (from) participantsMap.set(from.email ?? from.id, from);
    if (to) participantsMap.set(to.email ?? to.id, to);
  }

  // Check labels for read/starred status (use last message's labels)
  const labels = lastMessage?.labelIds ?? [];
  const read = !labels.includes("UNREAD");
  const starred = labels.includes("STARRED");

  // Transform all messages
  const threadMessages = messages.map((msg) =>
    gmailMessageToThreadMessage(msg, thread.id ?? "", userEmail)
  );

  return {
    id: thread.id ?? "",
    channel: "email",
    subject,
    snippet: thread.snippet ?? lastMessage?.snippet ?? "",
    participants: Array.from(participantsMap.values()),
    messages: threadMessages,
    lastMessageAt: new Date(
      parseInt(lastMessage?.internalDate ?? "0", 10)
    ),
    read,
    starred,
    messageCount: messages.length,
    labels: labels.filter((l) => !["UNREAD", "STARRED", "INBOX"].includes(l)),
  };
}
