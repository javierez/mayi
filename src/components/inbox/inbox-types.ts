// Inbox Types for WhatsApp and Email conversations (threads)
// Based on Gmail API thread structure

export type MessageChannel = "whatsapp" | "email";
export type MessageStatus = "received" | "sent" | "draft";
export type WhatsAppMessageType =
  | "info"
  | "follow_up"
  | "reminder"
  | "appointment_confirmation"
  | "offer_update";

export interface InboxContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  contactId?: number; // Linked contact's database ID (undefined = unlinked)
  isLinked?: boolean; // Convenience flag for UI
}

export interface InboxAttachment {
  name: string;
  type: string;
  size?: string;
  url?: string;
  // Gmail-specific fields for downloading
  attachmentId?: string;
  messageId?: string;
}

// Related listing/property for a conversation
export interface RelatedListing {
  listingId: bigint;
  title: string | null;
  referenceNumber: string | null;
  price: string;
  city: string | null;
  imageUrl: string | null;
}

// Thread context linking thread to listing-contact relationship
export interface ThreadContext {
  listingContactId: bigint;
  contactId: bigint | null;
  contactType: "owner" | "buyer" | null;
  listing: RelatedListing | null;
}

// Individual message within a thread
export interface ThreadMessage {
  id: string;
  threadId: string;
  status: MessageStatus;
  from: InboxContact;
  to?: InboxContact[]; // All recipients
  cc?: InboxContact[]; // CC recipients
  content: string;
  htmlContent?: string;
  timestamp: Date;
  attachments?: InboxAttachment[];
  whatsappMessageType?: WhatsAppMessageType;
}

// Thread/Conversation containing multiple messages
export interface InboxThread {
  id: string;
  channel: MessageChannel;
  subject?: string; // For email threads
  snippet: string; // Preview of the latest message
  participants: InboxContact[];
  messages: ThreadMessage[];
  lastMessageAt: Date;
  read: boolean;
  starred: boolean;
  messageCount: number;
  // Labels similar to Gmail
  labels?: string[];
  // Thread context - links thread to listing-contact relationship
  threadContext?: ThreadContext;
}

export type InboxFilter = "all" | "whatsapp" | "email";

export interface InboxState {
  threads: InboxThread[];
  selectedThreadId: string | null;
  filter: InboxFilter;
  searchQuery: string;
  isComposeOpen: boolean;
}

export interface ComposeAttachment {
  filename: string;
  mimeType: string;
  data: string; // Base64 encoded
}

export interface ComposeMessageData {
  channel: MessageChannel;
  recipientId: string;
  recipientName: string;
  subject?: string;
  content: string;
  attachments?: ComposeAttachment[];
}

// For backwards compatibility during migration
export interface InboxMessage {
  id: string;
  channel: MessageChannel;
  status: MessageStatus;
  from: InboxContact;
  to?: InboxContact;
  subject?: string;
  preview: string;
  content: string;
  htmlContent?: string;
  timestamp: Date;
  read: boolean;
  starred: boolean;
  attachments?: InboxAttachment[];
  whatsappMessageType?: WhatsAppMessageType;
  replyTo?: string;
  cc?: string[];
}
