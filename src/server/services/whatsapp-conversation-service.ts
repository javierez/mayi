/**
 * WhatsApp Conversation Service
 *
 * Manages WhatsApp conversations for two-way messaging with contacts.
 * Uses existing whatsapp-service.ts for Twilio API calls.
 */

import { db } from "~/server/db";
import { whatsappConversations, whatsappMessages, contacts, listings, listingContacts, properties, locations, propertyImages, users } from "~/server/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { normalizeToWhatsApp } from "./whatsapp-service";
import type {
  WhatsAppConversation,
  WhatsAppConversationRow,
  WhatsAppContactInfo,
  GetConversationsOptions,
  WhatsAppConversationStatus,
  TwilioSettings,
} from "~/types/whatsapp-conversations";
import {
  isWithin24HourWindow,
  getWindowExpiresAt,
} from "~/types/whatsapp-conversations";
import type { RelatedListing } from "~/components/inbox/inbox-types";

// =============================================================================
// Conversation CRUD Operations
// =============================================================================

/**
 * Get or create a conversation for a contact
 */
export async function getOrCreateConversation(
  contactId: bigint,
  accountId: bigint,
  userId: string,
): Promise<WhatsAppConversation> {
  // Check if conversation already exists for this user
  const existing = await db
    .select()
    .from(whatsappConversations)
    .where(
      and(
        eq(whatsappConversations.contactId, contactId),
        eq(whatsappConversations.userId, userId),
        eq(whatsappConversations.isActive, true),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return enrichConversation(existing[0]!);
  }

  // Get contact's phone number
  const contact = await db
    .select({
      contactId: contacts.contactId,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      phone: contacts.phone,
      phonePrefix: contacts.phonePrefix,
      email: contacts.email,
    })
    .from(contacts)
    .where(eq(contacts.contactId, contactId))
    .limit(1);

  if (contact.length === 0) {
    throw new Error(`Contact not found: ${contactId}`);
  }

  const contactData = contact[0]!;
  const phone = contactData.phone;

  if (!phone) {
    throw new Error(`Contact ${contactId} has no phone number`);
  }

  // Normalize phone to WhatsApp format and extract the number
  const whatsappFormat = normalizeToWhatsApp(phone);
  const whatsappNumber = whatsappFormat.replace("whatsapp:", "");

  // Create new conversation
  const [newConversation] = await db
    .insert(whatsappConversations)
    .values({
      accountId,
      userId,
      contactId,
      whatsappNumber,
      status: "active",
      unreadCount: 0,
    })
    .returning();

  if (!newConversation) {
    throw new Error("Failed to create conversation");
  }

  return enrichConversation(newConversation);
}

/**
 * Get a single conversation by ID
 */
export async function getConversation(
  conversationId: bigint,
): Promise<WhatsAppConversation | null> {
  const result = await db
    .select()
    .from(whatsappConversations)
    .where(eq(whatsappConversations.conversationId, conversationId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return enrichConversation(result[0]!);
}

/**
 * Get conversations for a user (for inbox list)
 */
export async function getConversationsForUser(
  userId: string,
  options: GetConversationsOptions = {},
): Promise<{ conversations: WhatsAppConversation[]; total: number }> {
  const { page = 1, limit = 50, status } = options;
  const offset = (page - 1) * limit;

  // Build where conditions - filter by userId
  const conditions = [
    eq(whatsappConversations.userId, userId),
    eq(whatsappConversations.isActive, true),
  ];

  if (status) {
    conditions.push(eq(whatsappConversations.status, status));
  }

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(whatsappConversations)
    .where(and(...conditions));

  const total = countResult[0]?.count ?? 0;

  // Get conversations ordered by last message
  const rows = await db
    .select()
    .from(whatsappConversations)
    .where(and(...conditions))
    .orderBy(desc(whatsappConversations.lastMessageAt))
    .limit(limit)
    .offset(offset);

  // Enrich each conversation
  const conversations = await Promise.all(rows.map(enrichConversation));

  return { conversations, total };
}

/**
 * Find conversation by WhatsApp number for a specific user
 */
export async function findConversationByPhone(
  whatsappNumber: string,
  userId: string,
): Promise<WhatsAppConversation | null> {
  // Normalize the incoming number
  const normalized = whatsappNumber.replace("whatsapp:", "");

  const result = await db
    .select()
    .from(whatsappConversations)
    .where(
      and(
        eq(whatsappConversations.whatsappNumber, normalized),
        eq(whatsappConversations.userId, userId),
        eq(whatsappConversations.isActive, true),
      ),
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return enrichConversation(result[0]!);
}

/**
 * Find user by their WhatsApp number (for incoming webhooks)
 */
export async function findUserByWhatsAppNumber(
  whatsappNumber: string,
): Promise<{ userId: string; accountId: bigint; twilioSettings: TwilioSettings } | null> {
  const normalized = whatsappNumber.replace("whatsapp:", "");

  const result = await db
    .select({
      id: users.id,
      accountId: users.accountId,
      twilioSettings: users.twilioSettings,
    })
    .from(users)
    .where(eq(users.isActive, true));

  // Find user whose twilioSettings.whatsappNumber matches
  for (const user of result) {
    const settings = user.twilioSettings as TwilioSettings | null;
    if (settings?.whatsappNumber === normalized && user.accountId) {
      return {
        userId: user.id,
        accountId: user.accountId,
        twilioSettings: settings,
      };
    }
  }

  return null;
}

/**
 * Get user's Twilio settings
 */
export async function getUserTwilioSettings(
  userId: string,
): Promise<TwilioSettings | null> {
  const result = await db
    .select({
      twilioSettings: users.twilioSettings,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return (result[0]?.twilioSettings as TwilioSettings) ?? null;
}

/**
 * Mark conversation as read
 */
export async function markConversationAsRead(
  conversationId: bigint,
): Promise<void> {
  await db
    .update(whatsappConversations)
    .set({
      unreadCount: 0,
      updatedAt: new Date(),
    })
    .where(eq(whatsappConversations.conversationId, conversationId));

  // Also mark all messages in conversation as read
  await db
    .update(whatsappMessages)
    .set({
      readAt: new Date(),
      status: "read",
    })
    .where(
      and(
        eq(whatsappMessages.conversationId, conversationId),
        eq(whatsappMessages.direction, "inbound"),
        sql`${whatsappMessages.readAt} IS NULL`,
      ),
    );
}

/**
 * Archive a conversation
 */
export async function archiveConversation(
  conversationId: bigint,
): Promise<void> {
  await db
    .update(whatsappConversations)
    .set({
      status: "archived",
      updatedAt: new Date(),
    })
    .where(eq(whatsappConversations.conversationId, conversationId));
}

/**
 * Link conversation to a listing-contact relationship
 */
export async function linkConversationToListing(
  conversationId: bigint,
  listingContactId: bigint | null,
): Promise<void> {
  await db
    .update(whatsappConversations)
    .set({
      listingContactId,
      updatedAt: new Date(),
    })
    .where(eq(whatsappConversations.conversationId, conversationId));
}

/**
 * Update conversation after a new message
 */
export async function updateConversationAfterMessage(
  conversationId: bigint,
  direction: "inbound" | "outbound",
): Promise<void> {
  const now = new Date();

  const updates: Partial<WhatsAppConversationRow> = {
    lastMessageAt: now,
    updatedAt: now,
  };

  if (direction === "inbound") {
    // Customer message: reset 24h window and increment unread
    updates.lastCustomerMessageAt = now;

    await db
      .update(whatsappConversations)
      .set({
        ...updates,
        unreadCount: sql`${whatsappConversations.unreadCount} + 1`,
      })
      .where(eq(whatsappConversations.conversationId, conversationId));
  } else {
    // Agent message: just update timestamp
    await db
      .update(whatsappConversations)
      .set(updates)
      .where(eq(whatsappConversations.conversationId, conversationId));
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Enrich a conversation row with contact and listing data
 */
async function enrichConversation(
  row: WhatsAppConversationRow,
): Promise<WhatsAppConversation> {
  // Get contact info
  const contactResult = await db
    .select({
      contactId: contacts.contactId,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      phone: contacts.phone,
      email: contacts.email,
    })
    .from(contacts)
    .where(eq(contacts.contactId, row.contactId))
    .limit(1);

  const contactInfo: WhatsAppContactInfo = contactResult[0]
    ? {
        contactId: contactResult[0].contactId,
        firstName: contactResult[0].firstName ?? "",
        lastName: contactResult[0].lastName ?? "",
        phone: contactResult[0].phone,
        email: contactResult[0].email,
        avatar: null,
      }
    : {
        contactId: row.contactId,
        firstName: "Unknown",
        lastName: "Contact",
        phone: row.whatsappNumber,
        email: null,
        avatar: null,
      };

  // Get listing info if linked
  let listing: RelatedListing | null = null;

  if (row.listingContactId) {
    // Subquery for first image
    const firstImageSubquery = db
      .select({
        propertyId: propertyImages.propertyId,
        imageUrl: sql<string>`MIN(${propertyImages.imageUrl})`.as("imageUrl"),
      })
      .from(propertyImages)
      .where(eq(propertyImages.isActive, true))
      .groupBy(propertyImages.propertyId)
      .as("first_image");

    const listingResult = await db
      .select({
        listingId: listings.listingId,
        title: properties.title,
        referenceNumber: properties.referenceNumber,
        price: listings.price,
        city: locations.city,
        imageUrl: firstImageSubquery.imageUrl,
      })
      .from(listingContacts)
      .innerJoin(listings, eq(listingContacts.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(locations, eq(properties.neighborhoodId, locations.neighborhoodId))
      .leftJoin(firstImageSubquery, eq(properties.propertyId, firstImageSubquery.propertyId))
      .where(eq(listingContacts.listingContactId, row.listingContactId))
      .limit(1);

    if (listingResult[0]) {
      listing = {
        listingId: listingResult[0].listingId,
        title: listingResult[0].title,
        referenceNumber: listingResult[0].referenceNumber,
        price: listingResult[0].price?.toString() ?? "0",
        city: listingResult[0].city,
        imageUrl: listingResult[0].imageUrl,
      };
    }
  }

  // Calculate 24h window
  const within24h = isWithin24HourWindow(row.lastCustomerMessageAt);
  const expiresAt = getWindowExpiresAt(row.lastCustomerMessageAt);

  return {
    conversationId: row.conversationId,
    accountId: row.accountId,
    userId: row.userId,
    contactId: row.contactId,
    whatsappNumber: row.whatsappNumber,
    status: (row.status ?? "active") as WhatsAppConversationStatus,
    lastMessageAt: row.lastMessageAt,
    lastCustomerMessageAt: row.lastCustomerMessageAt,
    unreadCount: row.unreadCount,
    listingContactId: row.listingContactId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    contact: contactInfo,
    listing,
    isWithin24Hours: within24h,
    windowExpiresAt: expiresAt,
  };
}
