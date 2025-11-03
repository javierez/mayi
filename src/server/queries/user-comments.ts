"use server";

import { db } from "../db";
import { userComments, users, contacts } from "../db/schema";
import { eq, and, sql, desc, isNull } from "drizzle-orm";
import { getCurrentUserAccountId } from "../../lib/dal";

// Types for user comments (contact-based comments)
export interface UserComment {
  commentId: bigint;
  contactId: bigint;
  userId: string;
  content: string;
  parentId?: bigint | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCommentWithUser extends UserComment {
  user: {
    id: string;
    name: string;
    firstName?: string | null;
    lastName?: string | null;
    image?: string | null;
    initials: string;
  };
  replies: UserCommentWithUser[];
}

export interface CreateUserCommentFormData {
  contactId: string | bigint;
  content: string;
  parentId?: string | bigint | null;
}

export interface UpdateUserCommentFormData {
  commentId: string | bigint;
  content: string;
}

export interface UserCommentActionResult {
  success: boolean;
  error?: string;
  data?: UserComment;
}

// Wrapper functions that automatically get accountId from current session
export async function getUserCommentsByContactIdWithAuth(contactId: bigint) {
  const accountId = await getCurrentUserAccountId();
  return getUserCommentsByContactId(contactId, accountId);
}

export async function getUserCommentByIdWithAuth(commentId: bigint) {
  const accountId = await getCurrentUserAccountId();
  return getUserCommentById(commentId, accountId);
}

// Core query functions with account security

export async function getUserCommentsByContactId(
  contactId: bigint,
  accountId: number,
): Promise<UserCommentWithUser[]> {
  try {
    // Get top-level comments (parentId is null) with user data
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
    const result: UserCommentWithUser[] = [];
    for (const comment of topLevelComments) {
      const replies = await getUserCommentReplies(comment.commentId, accountId);
      result.push({
        ...comment,
        replies,
      });
    }

    return result;
  } catch (error) {
    console.error("Error fetching user comments by contact ID:", error);
    throw error;
  }
}

export async function getUserCommentById(
  commentId: bigint,
  accountId: number,
): Promise<UserCommentWithUser | null> {
  try {
    const [comment] = await db
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
          eq(userComments.commentId, commentId),
          eq(userComments.isDeleted, false),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      );

    if (!comment) {
      return null;
    }

    // Get replies if this is a top-level comment
    const replies = comment.parentId
      ? []
      : await getUserCommentReplies(comment.commentId, accountId);

    return {
      ...comment,
      replies,
    };
  } catch (error) {
    console.error("Error fetching user comment by ID:", error);
    throw error;
  }
}

export async function getUserCommentReplies(
  parentCommentId: bigint,
  accountId: number,
): Promise<UserCommentWithUser[]> {
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
      replies: [], // Replies don't have sub-replies
    }));
  } catch (error) {
    console.error("Error fetching user comment replies:", error);
    throw error;
  }
}

// Create a new user comment
export async function createUserComment(
  data: Omit<
    UserComment,
    "commentId" | "createdAt" | "updatedAt" | "isDeleted"
  >,
  accountId: number,
) {
  try {
    // Verify the contact belongs to this account
    const [contact] = await db
      .select({ contactId: contacts.contactId })
      .from(contacts)
      .where(
        and(
          eq(contacts.contactId, data.contactId),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      );

    if (!contact) {
      throw new Error("Contact not found or access denied");
    }

    // If it's a reply, verify parent comment exists and belongs to same contact
    if (data.parentId) {
      const [parentComment] = await db
        .select({ contactId: userComments.contactId })
        .from(userComments)
        .innerJoin(contacts, eq(userComments.contactId, contacts.contactId))
        .where(
          and(
            eq(userComments.commentId, data.parentId),
            eq(userComments.isDeleted, false),
            eq(contacts.accountId, BigInt(accountId)),
          ),
        );

      if (!parentComment) {
        throw new Error("Parent comment not found or access denied");
      }

      if (parentComment.contactId !== data.contactId) {
        throw new Error(
          "Reply must belong to the same contact as parent comment",
        );
      }
    }

    const [result] = await db
      .insert(userComments)
      .values({
        ...data,
        isDeleted: false,
      })
      .returning();

    if (!result) throw new Error("Failed to create user comment");

    const [newComment] = await db
      .select({
        commentId: sql<number>`CAST(${userComments.commentId} AS BIGINT)`,
        contactId: sql<number>`CAST(${userComments.contactId} AS BIGINT)`,
        userId: userComments.userId,
        content: userComments.content,
        parentId: sql<number>`CAST(${userComments.parentId} AS BIGINT)`,
        isDeleted: userComments.isDeleted,
        createdAt: userComments.createdAt,
        updatedAt: userComments.updatedAt,
      })
      .from(userComments)
      .where(eq(userComments.commentId, BigInt(result.commentId)));

    return newComment;
  } catch (error) {
    console.error("Error creating user comment:", error);
    throw error;
  }
}

// Update user comment
export async function updateUserComment(
  commentId: bigint,
  content: string,
  accountId: number,
) {
  try {
    // First verify the comment belongs to this account
    const [existingComment] = await db
      .select({ commentId: userComments.commentId })
      .from(userComments)
      .innerJoin(contacts, eq(userComments.contactId, contacts.contactId))
      .where(
        and(
          eq(userComments.commentId, commentId),
          eq(userComments.isDeleted, false),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      );

    if (!existingComment) {
      throw new Error("User comment not found or access denied");
    }

    await db
      .update(userComments)
      .set({ content })
      .where(
        and(
          eq(userComments.commentId, commentId),
          eq(userComments.isDeleted, false),
        ),
      );

    return { success: true };
  } catch (error) {
    console.error("Error updating user comment:", error);
    throw error;
  }
}

// Delete user comment (soft delete)
export async function deleteUserComment(commentId: bigint, accountId: number) {
  try {
    // First verify the comment belongs to this account
    const [existingComment] = await db
      .select({ commentId: userComments.commentId })
      .from(userComments)
      .innerJoin(contacts, eq(userComments.contactId, contacts.contactId))
      .where(
        and(
          eq(userComments.commentId, commentId),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      );

    if (!existingComment) {
      throw new Error("User comment not found or access denied");
    }

    // Soft delete the comment and any replies
    await db
      .update(userComments)
      .set({ isDeleted: true })
      .where(and(eq(userComments.commentId, commentId)));

    // Also soft delete any replies to this comment
    await db
      .update(userComments)
      .set({ isDeleted: true })
      .where(eq(userComments.parentId, commentId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting user comment:", error);
    throw error;
  }
}

// Get tasks by contact ID (through listing_contact_id)
export async function getContactTasksWithAuth(contactId: bigint) {
  const accountId = await getCurrentUserAccountId();
  return getContactTasks(contactId, accountId);
}

export async function getContactTasks(contactId: bigint, accountId: number) {
  try {
    const { tasks, listingContacts } = await import("../db/schema");

    const contactTasks = await db
      .select({
        // Task fields - convert BigInt to number for JSON serialization
        taskId: sql<number>`CAST(${tasks.taskId} AS BIGINT)`,
        userId: tasks.userId,
        title: tasks.title,
        description: tasks.description,
        dueDate: tasks.dueDate,
        dueTime: tasks.dueTime,
        completed: tasks.completed,
        createdBy: tasks.createdBy,
        completedBy: tasks.completedBy,
        editedBy: tasks.editedBy,
        category: tasks.category,
        listingId: sql<number>`CAST(${tasks.listingId} AS BIGINT)`,
        listingContactId: sql<number>`CAST(${tasks.listingContactId} AS BIGINT)`,
        dealId: sql<number>`CAST(${tasks.dealId} AS BIGINT)`,
        appointmentId: sql<number>`CAST(${tasks.appointmentId} AS BIGINT)`,
        prospectId: sql<number>`CAST(${tasks.prospectId} AS BIGINT)`,
        contactId: sql<number>`CAST(${tasks.contactId} AS BIGINT)`,
        isActive: tasks.isActive,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        // User fields for "Asignado a"
        userName: users.name,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(tasks)
      .leftJoin(
        listingContacts,
        eq(tasks.listingContactId, listingContacts.listingContactId),
      )
      .leftJoin(contacts, eq(contacts.contactId, contactId))
      .innerJoin(users, eq(tasks.userId, users.id))
      .where(
        and(
          eq(tasks.contactId, contactId),
          eq(tasks.isActive, true),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      )
      .orderBy(tasks.createdAt);

    return contactTasks;
  } catch (error) {
    console.error("Error fetching contact tasks:", error);
    throw error;
  }
}

// Get contact's listing relationships for task association
export async function getContactListingsForTasksWithAuth(contactId: bigint) {
  const accountId = await getCurrentUserAccountId();
  return getContactListingsForTasks(contactId, accountId);
}

export async function getContactListingsForTasks(
  contactId: bigint,
  accountId: number,
) {
  try {
    const { listings, listingContacts, properties, locations } = await import(
      "../db/schema"
    );

    const contactListings = await db
      .select({
        listingContactId: sql<number>`CAST(${listingContacts.listingContactId} AS BIGINT)`,
        listingId: sql<number>`CAST(${listings.listingId} AS BIGINT)`,
        contactType: listingContacts.contactType,
        // Property info
        street: properties.street,
        city: locations.city,
        province: locations.province,
        propertyType: properties.propertyType,
        // Listing info
        listingType: listings.listingType,
        price: listings.price,
        status: listings.status,
      })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .innerJoin(listings, eq(listingContacts.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .where(
        and(
          eq(listingContacts.contactId, contactId),
          eq(contacts.accountId, BigInt(accountId)),
          eq(listings.isActive, true),
          eq(listingContacts.isActive, true),
        ),
      )
      .orderBy(desc(listingContacts.createdAt));

    return contactListings;
  } catch (error) {
    console.error("Error fetching contact listings for tasks:", error);
    throw error;
  }
}

// Get contact's deals for task association
export async function getContactDealsWithAuth(contactId: bigint) {
  const accountId = await getCurrentUserAccountId();
  return getContactDeals(contactId, accountId);
}

export async function getContactDeals(contactId: bigint, accountId: number) {
  try {
    const { deals, dealParticipants } = await import("../db/schema");

    const contactDeals = await db
      .select({
        dealId: sql<number>`CAST(${deals.dealId} AS BIGINT)`,
        status: deals.status,
        closeDate: deals.closeDate,
        createdAt: deals.createdAt,
        role: dealParticipants.role,
      })
      .from(dealParticipants)
      .innerJoin(deals, eq(dealParticipants.dealId, deals.dealId))
      .innerJoin(contacts, eq(dealParticipants.contactId, contacts.contactId))
      .where(
        and(
          eq(dealParticipants.contactId, contactId),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      )
      .orderBy(desc(deals.createdAt));

    return contactDeals;
  } catch (error) {
    console.error("Error fetching contact deals:", error);
    throw error;
  }
}
