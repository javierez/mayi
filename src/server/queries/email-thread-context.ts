"use server";

import { db } from "../db";
import {
  emailThreadContexts,
  listingContacts,
  listings,
  properties,
  propertyImages,
  contacts,
  locations,
} from "../db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { getCurrentUserAccountId } from "../../lib/dal";

// Type for thread context with listing info
export interface ThreadContextWithListing {
  id: bigint;
  threadId: string;
  listingContactId: bigint | null;
  contactId: bigint | null;
  contactType: string | null;
  listing: {
    listingId: bigint;
    title: string | null;
    referenceNumber: string | null;
    price: string;
    city: string | null;
    imageUrl: string | null;
  } | null;
}

/**
 * Upsert thread context (create or update)
 * If listingContactId is null, removes the listing association
 */
export async function upsertEmailThreadContext(
  threadId: string,
  listingContactId: bigint | null,
): Promise<{ id: bigint }> {
  const accountId = await getCurrentUserAccountId();

  // Check if context exists for this thread
  const [existing] = await db
    .select({ id: emailThreadContexts.id })
    .from(emailThreadContexts)
    .where(
      and(
        eq(emailThreadContexts.threadId, threadId),
        eq(emailThreadContexts.accountId, BigInt(accountId)),
      ),
    )
    .limit(1);

  if (existing) {
    // Update existing
    await db
      .update(emailThreadContexts)
      .set({
        listingContactId,
        updatedAt: new Date(),
      })
      .where(eq(emailThreadContexts.id, existing.id));

    return { id: existing.id };
  } else {
    // Insert new
    const [result] = await db
      .insert(emailThreadContexts)
      .values({
        accountId: BigInt(accountId),
        threadId,
        listingContactId,
      })
      .returning({ id: emailThreadContexts.id });

    if (!result) throw new Error("Failed to create email thread context");
    return { id: result.id };
  }
}

/**
 * Get contexts for multiple threads (batch)
 * Returns a map of threadId -> context with listing info
 */
export async function getThreadContextsByThreadIds(
  threadIds: string[],
): Promise<Map<string, ThreadContextWithListing>> {
  if (threadIds.length === 0) return new Map();

  const accountId = await getCurrentUserAccountId();

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

  const results = await db
    .select({
      id: emailThreadContexts.id,
      threadId: emailThreadContexts.threadId,
      listingContactId: emailThreadContexts.listingContactId,
      contactId: listingContacts.contactId,
      contactType: listingContacts.contactType,
      listingId: listings.listingId,
      title: properties.title,
      referenceNumber: properties.referenceNumber,
      price: listings.price,
      city: locations.city,
      imageUrl: firstImageSubquery.imageUrl,
    })
    .from(emailThreadContexts)
    .leftJoin(
      listingContacts,
      eq(emailThreadContexts.listingContactId, listingContacts.listingContactId),
    )
    .leftJoin(listings, eq(listingContacts.listingId, listings.listingId))
    .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
    .leftJoin(locations, eq(properties.neighborhoodId, locations.neighborhoodId))
    .leftJoin(firstImageSubquery, eq(properties.propertyId, firstImageSubquery.propertyId))
    .where(
      and(
        inArray(emailThreadContexts.threadId, threadIds),
        eq(emailThreadContexts.accountId, BigInt(accountId)),
      ),
    );

  const map = new Map<string, ThreadContextWithListing>();

  for (const row of results) {
    map.set(row.threadId, {
      id: row.id,
      threadId: row.threadId,
      listingContactId: row.listingContactId,
      contactId: row.contactId,
      contactType: row.contactType,
      listing: row.listingId
        ? {
            listingId: row.listingId,
            title: row.title,
            referenceNumber: row.referenceNumber,
            price: row.price ?? "0",
            city: row.city,
            imageUrl: row.imageUrl,
          }
        : null,
    });
  }

  return map;
}

/**
 * Get thread context for a single thread
 */
export async function getThreadContextByThreadId(
  threadId: string,
): Promise<ThreadContextWithListing | null> {
  const map = await getThreadContextsByThreadIds([threadId]);
  return map.get(threadId) ?? null;
}

/**
 * Remove thread context (unlink completely)
 */
export async function removeEmailThreadContext(threadId: string): Promise<void> {
  const accountId = await getCurrentUserAccountId();

  await db
    .delete(emailThreadContexts)
    .where(
      and(
        eq(emailThreadContexts.threadId, threadId),
        eq(emailThreadContexts.accountId, BigInt(accountId)),
      ),
    );
}

/**
 * Get all thread contexts for a specific contact
 * Useful for showing which threads are linked to a contact
 */
export async function getThreadContextsByContactId(
  contactId: bigint,
): Promise<Array<{ threadId: string; listingContactId: bigint; listingId: bigint | null }>> {
  const accountId = await getCurrentUserAccountId();

  // Verify contact belongs to account
  const [contact] = await db
    .select({ contactId: contacts.contactId })
    .from(contacts)
    .where(
      and(
        eq(contacts.contactId, contactId),
        eq(contacts.accountId, BigInt(accountId)),
      ),
    )
    .limit(1);

  if (!contact) {
    throw new Error("Contact not found");
  }

  const results = await db
    .select({
      threadId: emailThreadContexts.threadId,
      listingContactId: emailThreadContexts.listingContactId,
      listingId: listingContacts.listingId,
    })
    .from(emailThreadContexts)
    .innerJoin(
      listingContacts,
      eq(emailThreadContexts.listingContactId, listingContacts.listingContactId),
    )
    .where(
      and(
        eq(listingContacts.contactId, contactId),
        eq(emailThreadContexts.accountId, BigInt(accountId)),
      ),
    );

  return results.map((r) => ({
    threadId: r.threadId,
    listingContactId: r.listingContactId!,
    listingId: r.listingId,
  }));
}
