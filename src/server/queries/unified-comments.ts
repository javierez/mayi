"use server";

import { db } from "../db";
import {
  userComments,
  appointmentComments,
  listingContactComments,
  appointments,
  listingContacts,
  listings,
  properties,
  locations,
  contacts,
  users,
} from "../db/schema";
import { eq, and, sql, desc, isNull, inArray } from "drizzle-orm";
import { getCurrentUserAccountId } from "../../lib/dal";
import type { UnifiedComment, CommentSource } from "../../types/unified-comments";

/**
 * Main function: Get all comments for a contact from all sources
 * Fetches user comments, appointment comments, and listing contact comments in parallel
 */
export async function getAllContactCommentsWithAuth(
  contactId: bigint,
): Promise<UnifiedComment[]> {
  const accountId = await getCurrentUserAccountId();

  // Fetch all three types in parallel to avoid sequential N+1 queries
  const [userCommentsList, appointmentCommentsList, listingContactCommentsList] =
    await Promise.all([
      getUserCommentsForContact(contactId, accountId),
      getAppointmentCommentsForContact(contactId, accountId),
      getListingContactCommentsForContact(contactId, accountId),
    ]);

  // Merge and sort by createdAt descending
  const allComments = [
    ...userCommentsList,
    ...appointmentCommentsList,
    ...listingContactCommentsList,
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return allComments;
}

/**
 * Helper: Get user comments (direct contact notes) for a contact
 */
async function getUserCommentsForContact(
  contactId: bigint,
  accountId: number,
): Promise<UnifiedComment[]> {
  try {
    // Get top-level comments with user data
    const topLevelComments = await db
      .select({
        commentId: userComments.commentId,
        contactId: userComments.contactId,
        userId: userComments.userId,
        content: userComments.content,
        parentId: userComments.parentId,
        isDeleted: sql<boolean>`COALESCE(${userComments.isDeleted}, false)`,
        createdAt: userComments.createdAt,
        updatedAt: userComments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`CONCAT(LEFT(${users.firstName}, 1), LEFT(${users.lastName}, 1))`,
        },
      })
      .from(userComments)
      .innerJoin(users, eq(userComments.userId, users.id))
      .innerJoin(contacts, eq(userComments.contactId, contacts.contactId))
      .where(
        and(
          eq(userComments.contactId, contactId),
          eq(userComments.isDeleted, false),
          isNull(userComments.parentId),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      )
      .orderBy(desc(userComments.createdAt));

    // Get all replies for these comments
    const result: UnifiedComment[] = [];
    for (const comment of topLevelComments) {
      const replies = await getUserCommentReplies(comment.commentId, accountId);
      result.push({
        ...comment,
        parentId: comment.parentId ?? null,
        source: "contact" as CommentSource,
        replies,
        status: "sent",
      });
    }

    return result;
  } catch (error) {
    console.error("Error fetching user comments for contact:", error);
    return [];
  }
}

/**
 * Helper: Get replies for a user comment
 */
async function getUserCommentReplies(
  parentCommentId: bigint,
  accountId: number,
): Promise<UnifiedComment[]> {
  try {
    const replies = await db
      .select({
        commentId: userComments.commentId,
        contactId: userComments.contactId,
        userId: userComments.userId,
        content: userComments.content,
        parentId: userComments.parentId,
        isDeleted: sql<boolean>`COALESCE(${userComments.isDeleted}, false)`,
        createdAt: userComments.createdAt,
        updatedAt: userComments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`CONCAT(LEFT(${users.firstName}, 1), LEFT(${users.lastName}, 1))`,
        },
      })
      .from(userComments)
      .innerJoin(users, eq(userComments.userId, users.id))
      .innerJoin(contacts, eq(userComments.contactId, contacts.contactId))
      .where(
        and(
          eq(userComments.parentId, parentCommentId),
          eq(userComments.isDeleted, false),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      )
      .orderBy(userComments.createdAt);

    return replies.map((reply) => ({
      ...reply,
      parentId: reply.parentId ?? null,
      source: "contact" as CommentSource,
      replies: [],
      status: "sent" as const,
    }));
  } catch (error) {
    console.error("Error fetching user comment replies:", error);
    return [];
  }
}

/**
 * Helper: Get ALL appointments for a contact, then fetch comments for each
 */
async function getAppointmentCommentsForContact(
  contactId: bigint,
  accountId: number,
): Promise<UnifiedComment[]> {
  try {
    // 1. Get all appointments for this contact with metadata for labels (including listing info)
    const contactAppointments = await db
      .select({
        appointmentId: appointments.appointmentId,
        type: appointments.type,
        datetimeStart: appointments.datetimeStart,
        title: appointments.title,
        listingId: appointments.listingId,
        propertyStreet: properties.street,
        city: locations.city,
      })
      .from(appointments)
      .innerJoin(contacts, eq(appointments.contactId, contacts.contactId))
      .leftJoin(listings, eq(appointments.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(locations, eq(properties.neighborhoodId, locations.neighborhoodId))
      .where(
        and(
          eq(appointments.contactId, contactId),
          eq(appointments.isActive, true),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      );

    if (contactAppointments.length === 0) return [];

    // Create a map for quick lookup of appointment metadata
    const appointmentMetaMap = new Map(
      contactAppointments.map((a) => [
        a.appointmentId.toString(),
        {
          appointmentId: a.appointmentId,
          type: a.type,
          datetimeStart: a.datetimeStart,
          title: a.title,
          listingId: a.listingId,
          propertyAddress: [a.propertyStreet, a.city].filter(Boolean).join(", ") || null,
        },
      ]),
    );

    const appointmentIds = contactAppointments.map((a) => a.appointmentId);

    // 2. Batch fetch all top-level comments for these appointments
    const comments = await db
      .select({
        commentId: appointmentComments.commentId,
        appointmentId: appointmentComments.appointmentId,
        userId: appointmentComments.userId,
        content: appointmentComments.content,
        parentId: appointmentComments.parentId,
        isDeleted: sql<boolean>`COALESCE(${appointmentComments.isDeleted}, false)`,
        createdAt: appointmentComments.createdAt,
        updatedAt: appointmentComments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`CONCAT(LEFT(${users.firstName}, 1), LEFT(${users.lastName}, 1))`,
        },
      })
      .from(appointmentComments)
      .innerJoin(users, eq(appointmentComments.userId, users.id))
      .where(
        and(
          inArray(appointmentComments.appointmentId, appointmentIds),
          eq(appointmentComments.isDeleted, false),
          isNull(appointmentComments.parentId),
        ),
      )
      .orderBy(desc(appointmentComments.createdAt));

    // 3. Get replies for each comment and transform to UnifiedComment
    const result: UnifiedComment[] = [];
    for (const comment of comments) {
      const replies = await getAppointmentCommentReplies(
        comment.commentId,
        comment.appointmentId,
        appointmentMetaMap,
        accountId,
      );
      const meta = appointmentMetaMap.get(comment.appointmentId.toString());

      result.push({
        ...comment,
        parentId: comment.parentId ?? null,
        source: "appointment" as CommentSource,
        appointmentId: comment.appointmentId,
        appointmentMeta: meta
          ? {
              appointmentId: meta.appointmentId,
              type: meta.type,
              datetimeStart: meta.datetimeStart,
              title: meta.title,
              listingId: meta.listingId,
              propertyAddress: meta.propertyAddress,
            }
          : undefined,
        replies,
        status: "sent",
      });
    }

    return result;
  } catch (error) {
    console.error("Error fetching appointment comments for contact:", error);
    return [];
  }
}

/**
 * Helper: Get replies for an appointment comment
 */
async function getAppointmentCommentReplies(
  parentCommentId: bigint,
  appointmentId: bigint,
  appointmentMetaMap: Map<
    string,
    {
      appointmentId: bigint;
      type: string | null;
      datetimeStart: Date;
      title: string | null;
      listingId: bigint | null;
      propertyAddress: string | null;
    }
  >,
  _accountId: number,
): Promise<UnifiedComment[]> {
  try {
    const replies = await db
      .select({
        commentId: appointmentComments.commentId,
        appointmentId: appointmentComments.appointmentId,
        userId: appointmentComments.userId,
        content: appointmentComments.content,
        parentId: appointmentComments.parentId,
        isDeleted: sql<boolean>`COALESCE(${appointmentComments.isDeleted}, false)`,
        createdAt: appointmentComments.createdAt,
        updatedAt: appointmentComments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`CONCAT(LEFT(${users.firstName}, 1), LEFT(${users.lastName}, 1))`,
        },
      })
      .from(appointmentComments)
      .innerJoin(users, eq(appointmentComments.userId, users.id))
      .where(
        and(
          eq(appointmentComments.parentId, parentCommentId),
          eq(appointmentComments.isDeleted, false),
        ),
      )
      .orderBy(appointmentComments.createdAt);

    const meta = appointmentMetaMap.get(appointmentId.toString());

    return replies.map((reply) => ({
      ...reply,
      parentId: reply.parentId ?? null,
      source: "appointment" as CommentSource,
      appointmentId: reply.appointmentId,
      appointmentMeta: meta
        ? {
            appointmentId: meta.appointmentId,
            type: meta.type,
            datetimeStart: meta.datetimeStart,
            title: meta.title,
            listingId: meta.listingId,
            propertyAddress: meta.propertyAddress,
          }
        : undefined,
      replies: [],
      status: "sent" as const,
    }));
  } catch (error) {
    console.error("Error fetching appointment comment replies:", error);
    return [];
  }
}

/**
 * Helper: Get ALL listing_contacts for a contact, then fetch comments for each
 */
async function getListingContactCommentsForContact(
  contactId: bigint,
  accountId: number,
): Promise<UnifiedComment[]> {
  try {
    // 1. Get all listingContact records for this contact with property info
    const contactListingContacts = await db
      .select({
        listingContactId: listingContacts.listingContactId,
        listingId: listingContacts.listingId,
        contactType: listingContacts.contactType,
        propertyStreet: properties.street,
        propertyTitle: properties.title,
        city: locations.city,
      })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .leftJoin(listings, eq(listingContacts.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .where(
        and(
          eq(listingContacts.contactId, contactId),
          eq(listingContacts.isActive, true),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      );

    if (contactListingContacts.length === 0) return [];

    // Create a map for quick lookup of listing contact metadata
    const listingContactMetaMap = new Map(
      contactListingContacts.map((lc) => [
        lc.listingContactId.toString(),
        {
          listingContactId: lc.listingContactId,
          listingId: lc.listingId,
          propertyAddress: [lc.propertyStreet, lc.city]
            .filter(Boolean)
            .join(", "),
          propertyTitle: lc.propertyTitle,
          contactType: lc.contactType,
        },
      ]),
    );

    const listingContactIds = contactListingContacts.map(
      (lc) => lc.listingContactId,
    );

    // 2. Batch fetch all top-level comments for these listing contacts
    const comments = await db
      .select({
        commentId: listingContactComments.commentId,
        listingContactId: listingContactComments.listingContactId,
        userId: listingContactComments.userId,
        content: listingContactComments.content,
        category: sql<string | null>`${listingContactComments.category}`,
        parentId: listingContactComments.parentId,
        isDeleted: sql<boolean>`COALESCE(${listingContactComments.isDeleted}, false)`,
        createdAt: listingContactComments.createdAt,
        updatedAt: listingContactComments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`CONCAT(LEFT(${users.firstName}, 1), LEFT(${users.lastName}, 1))`,
        },
      })
      .from(listingContactComments)
      .innerJoin(users, eq(listingContactComments.userId, users.id))
      .where(
        and(
          inArray(listingContactComments.listingContactId, listingContactIds),
          eq(listingContactComments.isDeleted, false),
          isNull(listingContactComments.parentId),
        ),
      )
      .orderBy(desc(listingContactComments.createdAt));

    // 3. Get replies for each comment and transform to UnifiedComment
    const result: UnifiedComment[] = [];
    for (const comment of comments) {
      const replies = await getListingContactCommentReplies(
        comment.commentId,
        comment.listingContactId,
        listingContactMetaMap,
        accountId,
      );
      const meta = listingContactMetaMap.get(
        comment.listingContactId.toString(),
      );

      result.push({
        ...comment,
        parentId: comment.parentId ?? null,
        source: "listing_contact" as CommentSource,
        listingContactId: comment.listingContactId,
        category: comment.category,
        listingContactMeta: meta
          ? {
              listingContactId: meta.listingContactId,
              listingId: meta.listingId,
              propertyAddress: meta.propertyAddress,
              propertyTitle: meta.propertyTitle,
              contactType: meta.contactType,
            }
          : undefined,
        replies,
        status: "sent",
      });
    }

    return result;
  } catch (error) {
    console.error(
      "Error fetching listing contact comments for contact:",
      error,
    );
    return [];
  }
}

/**
 * Helper: Get replies for a listing contact comment
 */
async function getListingContactCommentReplies(
  parentCommentId: bigint,
  listingContactId: bigint,
  listingContactMetaMap: Map<
    string,
    {
      listingContactId: bigint;
      listingId: bigint | null;
      propertyAddress: string;
      propertyTitle: string | null;
      contactType: string;
    }
  >,
  _accountId: number,
): Promise<UnifiedComment[]> {
  try {
    const replies = await db
      .select({
        commentId: listingContactComments.commentId,
        listingContactId: listingContactComments.listingContactId,
        userId: listingContactComments.userId,
        content: listingContactComments.content,
        category: sql<string | null>`${listingContactComments.category}`,
        parentId: listingContactComments.parentId,
        isDeleted: sql<boolean>`COALESCE(${listingContactComments.isDeleted}, false)`,
        createdAt: listingContactComments.createdAt,
        updatedAt: listingContactComments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`CONCAT(LEFT(${users.firstName}, 1), LEFT(${users.lastName}, 1))`,
        },
      })
      .from(listingContactComments)
      .innerJoin(users, eq(listingContactComments.userId, users.id))
      .where(
        and(
          eq(listingContactComments.parentId, parentCommentId),
          eq(listingContactComments.isDeleted, false),
        ),
      )
      .orderBy(listingContactComments.createdAt);

    const meta = listingContactMetaMap.get(listingContactId.toString());

    return replies.map((reply) => ({
      ...reply,
      parentId: reply.parentId ?? null,
      source: "listing_contact" as CommentSource,
      listingContactId: reply.listingContactId,
      category: reply.category,
      listingContactMeta: meta
        ? {
            listingContactId: meta.listingContactId,
            listingId: meta.listingId,
            propertyAddress: meta.propertyAddress,
            propertyTitle: meta.propertyTitle,
            contactType: meta.contactType,
          }
        : undefined,
      replies: [],
      status: "sent" as const,
    }));
  } catch (error) {
    console.error("Error fetching listing contact comment replies:", error);
    return [];
  }
}

/**
 * Get unified comments for a specific listing-contact relationship
 * Fetches both listing contact comments and appointment comments
 * where both listingId AND contactId match
 */
export async function getListingContactUnifiedComments(
  listingId: bigint,
  contactId: bigint,
  listingContactId: bigint,
): Promise<UnifiedComment[]> {
  const accountId = await getCurrentUserAccountId();

  // Fetch both types in parallel
  const [listingContactCommentsList, appointmentCommentsList] = await Promise.all([
    getListingContactCommentsForListingContact(listingContactId, listingId, accountId),
    getAppointmentCommentsForListingContact(listingId, contactId, accountId),
  ]);

  // Merge and sort by createdAt descending
  const allComments = [...listingContactCommentsList, ...appointmentCommentsList].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  return allComments;
}

/**
 * Helper: Get listing contact comments for a specific listingContactId
 */
async function getListingContactCommentsForListingContact(
  listingContactId: bigint,
  listingId: bigint,
  accountId: number,
): Promise<UnifiedComment[]> {
  try {
    // Get property info for the listing
    const listingInfo = await db
      .select({
        listingId: listings.listingId,
        propertyStreet: properties.street,
        propertyTitle: properties.title,
        city: locations.city,
      })
      .from(listings)
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(locations, eq(properties.neighborhoodId, locations.neighborhoodId))
      .where(
        and(
          eq(listings.listingId, listingId),
          eq(properties.accountId, BigInt(accountId)),
        ),
      )
      .limit(1);

    const propertyAddress = listingInfo[0]
      ? [listingInfo[0].propertyStreet, listingInfo[0].city].filter(Boolean).join(", ")
      : "";
    const propertyTitle = listingInfo[0]?.propertyTitle ?? null;

    // Get listing contact type
    const lcInfo = await db
      .select({ contactType: listingContacts.contactType })
      .from(listingContacts)
      .where(eq(listingContacts.listingContactId, listingContactId))
      .limit(1);

    const contactType = lcInfo[0]?.contactType ?? "buyer";

    // Get top-level comments
    const comments = await db
      .select({
        commentId: listingContactComments.commentId,
        listingContactId: listingContactComments.listingContactId,
        userId: listingContactComments.userId,
        content: listingContactComments.content,
        category: sql<string | null>`${listingContactComments.category}`,
        parentId: listingContactComments.parentId,
        isDeleted: sql<boolean>`COALESCE(${listingContactComments.isDeleted}, false)`,
        createdAt: listingContactComments.createdAt,
        updatedAt: listingContactComments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`CONCAT(LEFT(${users.firstName}, 1), LEFT(${users.lastName}, 1))`,
        },
      })
      .from(listingContactComments)
      .innerJoin(users, eq(listingContactComments.userId, users.id))
      .where(
        and(
          eq(listingContactComments.listingContactId, listingContactId),
          eq(listingContactComments.isDeleted, false),
          isNull(listingContactComments.parentId),
        ),
      )
      .orderBy(desc(listingContactComments.createdAt));

    // Create metadata map for replies
    const metaMap = new Map([
      [
        listingContactId.toString(),
        {
          listingContactId,
          listingId,
          propertyAddress,
          propertyTitle,
          contactType,
        },
      ],
    ]);

    // Get replies and transform
    const result: UnifiedComment[] = [];
    for (const comment of comments) {
      const replies = await getListingContactCommentReplies(
        comment.commentId,
        listingContactId,
        metaMap,
        accountId,
      );

      result.push({
        ...comment,
        parentId: comment.parentId ?? null,
        source: "listing_contact" as CommentSource,
        listingContactId: comment.listingContactId,
        category: comment.category,
        listingContactMeta: {
          listingContactId,
          listingId,
          propertyAddress,
          propertyTitle,
          contactType,
        },
        replies,
        status: "sent",
      });
    }

    return result;
  } catch (error) {
    console.error("Error fetching listing contact comments:", error);
    return [];
  }
}

/**
 * Helper: Get appointment comments for appointments matching both listingId and contactId
 */
async function getAppointmentCommentsForListingContact(
  listingId: bigint,
  contactId: bigint,
  accountId: number,
): Promise<UnifiedComment[]> {
  try {
    // Get property info for the listing
    const listingInfo = await db
      .select({
        propertyStreet: properties.street,
        city: locations.city,
      })
      .from(listings)
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(locations, eq(properties.neighborhoodId, locations.neighborhoodId))
      .where(
        and(
          eq(listings.listingId, listingId),
          eq(properties.accountId, BigInt(accountId)),
        ),
      )
      .limit(1);

    const propertyAddress = listingInfo[0]
      ? [listingInfo[0].propertyStreet, listingInfo[0].city].filter(Boolean).join(", ")
      : null;

    // Find appointments where BOTH listingId AND contactId match
    const matchingAppointments = await db
      .select({
        appointmentId: appointments.appointmentId,
        type: appointments.type,
        datetimeStart: appointments.datetimeStart,
        title: appointments.title,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.listingId, listingId),
          eq(appointments.contactId, contactId),
          eq(appointments.isActive, true),
        ),
      );

    if (matchingAppointments.length === 0) return [];

    // Create metadata map
    const appointmentMetaMap = new Map(
      matchingAppointments.map((a) => [
        a.appointmentId.toString(),
        {
          appointmentId: a.appointmentId,
          type: a.type,
          datetimeStart: a.datetimeStart,
          title: a.title,
          listingId,
          propertyAddress,
        },
      ]),
    );

    const appointmentIds = matchingAppointments.map((a) => a.appointmentId);

    // Batch fetch top-level comments
    const comments = await db
      .select({
        commentId: appointmentComments.commentId,
        appointmentId: appointmentComments.appointmentId,
        userId: appointmentComments.userId,
        content: appointmentComments.content,
        parentId: appointmentComments.parentId,
        isDeleted: sql<boolean>`COALESCE(${appointmentComments.isDeleted}, false)`,
        createdAt: appointmentComments.createdAt,
        updatedAt: appointmentComments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          image: users.image,
          initials: sql<string>`CONCAT(LEFT(${users.firstName}, 1), LEFT(${users.lastName}, 1))`,
        },
      })
      .from(appointmentComments)
      .innerJoin(users, eq(appointmentComments.userId, users.id))
      .where(
        and(
          inArray(appointmentComments.appointmentId, appointmentIds),
          eq(appointmentComments.isDeleted, false),
          isNull(appointmentComments.parentId),
        ),
      )
      .orderBy(desc(appointmentComments.createdAt));

    // Get replies and transform
    const result: UnifiedComment[] = [];
    for (const comment of comments) {
      const replies = await getAppointmentCommentReplies(
        comment.commentId,
        comment.appointmentId,
        appointmentMetaMap,
        accountId,
      );
      const meta = appointmentMetaMap.get(comment.appointmentId.toString());

      result.push({
        ...comment,
        parentId: comment.parentId ?? null,
        source: "appointment" as CommentSource,
        appointmentId: comment.appointmentId,
        appointmentMeta: meta
          ? {
              appointmentId: meta.appointmentId,
              type: meta.type,
              datetimeStart: meta.datetimeStart,
              title: meta.title,
              listingId: meta.listingId,
              propertyAddress: meta.propertyAddress,
            }
          : undefined,
        replies,
        status: "sent",
      });
    }

    return result;
  } catch (error) {
    console.error("Error fetching appointment comments for listing-contact:", error);
    return [];
  }
}
