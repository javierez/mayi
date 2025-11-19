"use server";

import { db } from "../db";
import {
  tasks,
  contacts,
  prospects,
  listingContacts,
  listings,
  properties,
  users,
  contactActivity,
  listingContactActivity,
} from "../db/schema";
import { eq, and, or, sql, isNotNull, asc, lte } from "drizzle-orm";
import type { Task } from "../../lib/data";
import { getCurrentUserAccountId, getSecureSession } from "../../lib/dal";

// Wrapper functions that automatically get accountId from current session
export async function createTaskWithAuth(
  data: Omit<Task, "taskId" | "createdAt" | "updatedAt">,
) {
  const accountId = await getCurrentUserAccountId();
  return createTask(data, accountId);
}

export async function getTaskByIdWithAuth(taskId: number) {
  const accountId = await getCurrentUserAccountId();
  return getTaskById(taskId, accountId);
}

export async function getUserTasksWithAuth(
  userId: string,
  filters?: {
    createdBy?: string[];
    category?: string[];
    urgency?: number[];
    completed?: boolean;
  },
) {
  const accountId = await getCurrentUserAccountId();
  return getUserTasks(userId, accountId, filters);
}

export async function getListingTasksWithAuth(listingId: number) {
  const accountId = await getCurrentUserAccountId();
  return getListingTasks(listingId, accountId);
}

export async function getLeadTasksWithAuth(listingContactId: number) {
  const accountId = await getCurrentUserAccountId();
  return getLeadTasks(listingContactId, accountId);
}

export async function getDealTasksWithAuth(dealId: number) {
  const accountId = await getCurrentUserAccountId();
  return getDealTasks(dealId, accountId);
}

export async function getAppointmentTasksWithAuth(appointmentId: number) {
  const accountId = await getCurrentUserAccountId();
  return getAppointmentTasks(appointmentId, accountId);
}

export async function updateTaskWithAuth(
  taskId: number,
  data: Omit<Partial<Task>, "taskId" | "createdAt" | "updatedAt">,
) {
  const accountId = await getCurrentUserAccountId();
  const session = await getSecureSession();
  const userId = session?.user?.id;
  return updateTask(taskId, data, accountId, userId);
}

export async function updateContactTaskWithAuth(
  taskId: number,
  data: Omit<Partial<Task>, "taskId" | "createdAt" | "updatedAt">,
) {
  const accountId = await getCurrentUserAccountId();
  return updateContactTask(taskId, data, accountId);
}

export async function updateListingTaskWithAuth(
  taskId: number,
  data: Omit<Partial<Task>, "taskId" | "createdAt" | "updatedAt">,
) {
  const accountId = await getCurrentUserAccountId();
  const session = await getSecureSession();
  const userId = session?.user?.id;
  return updateListingTask(taskId, data, accountId, userId);
}

export async function completeTaskWithAuth(taskId: number) {
  const accountId = await getCurrentUserAccountId();
  const session = await getSecureSession();
  const userId = session?.user?.id;
  return completeTask(taskId, accountId, userId);
}

export async function softDeleteTaskWithAuth(taskId: number) {
  const accountId = await getCurrentUserAccountId();
  return softDeleteTask(taskId, accountId);
}

export async function deleteTaskWithAuth(taskId: number) {
  const accountId = await getCurrentUserAccountId();
  return deleteTask(taskId, accountId);
}

export async function deleteContactTaskWithAuth(taskId: number) {
  const accountId = await getCurrentUserAccountId();
  return deleteContactTask(taskId, accountId);
}

export async function deleteListingTaskWithAuth(taskId: number) {
  const accountId = await getCurrentUserAccountId();
  return deleteListingTask(taskId, accountId);
}

export async function listTasksWithAuth(
  page = 1,
  limit = 10,
  filters?: Parameters<typeof listTasks>[3],
) {
  const accountId = await getCurrentUserAccountId();
  return listTasks(page, limit, accountId, filters);
}

export async function getMostUrgentTasksWithAuth(
  limit = 10,
  daysAhead = 30,
  filters?: {
    appointmentListingId?: number;
    appointmentContactId?: number;
    userId?: string; // Filter by task.userId (agent filter)
  },
) {
  const accountId = await getCurrentUserAccountId();
  return getMostUrgentTasks(accountId, limit, daysAhead, filters);
}

export async function createAppointmentTaskWithAuth(
  contactId: bigint,
  contactName: string,
  notes?: string,
  selectedListingsCount = 0,
) {
  try {
    // Get current user for task assignment
    const accountId = await getCurrentUserAccountId();

    // We need to get the current user's ID, but we need to fetch it from the database
    // Let's use the session to get the user ID directly
    const session = await getSecureSession();
    if (!session?.user?.id) {
      throw new Error("No authenticated user found");
    }

    // Calculate due date (3 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    // Prepare task description
    let description = `Configurar cita para mostrar propiedades a ${contactName}`;

    if (selectedListingsCount > 0) {
      description += `\n\nPropiedades de interés: ${selectedListingsCount} propiedades seleccionadas`;
    }

    if (notes?.trim()) {
      description += `\n\nNotas del contacto: ${notes.trim()}`;
    }

    // Create the task using the existing createTask function
    const taskData = {
      userId: session.user.id,
      title: "Configurar cita para ver propiedades",
      description,
      dueDate,
      completed: false,
      contactId,
      isActive: true,
    };

    const newTask = await createTask(taskData, accountId);
    return newTask;
  } catch (error) {
    console.error("Error creating appointment task:", error);
    throw error;
  }
}

// Create a new task
export async function createTask(
  data: Omit<Task, "taskId" | "createdAt" | "updatedAt">,
  accountId: number,
) {
  try {
    // Verify access based on the task's entity relationships
    if (data.prospectId) {
      const [prospect] = await db
        .select({ id: prospects.id })
        .from(prospects)
        .innerJoin(contacts, eq(prospects.contactId, contacts.contactId))
        .where(
          and(
            eq(prospects.id, data.prospectId),
            eq(contacts.accountId, BigInt(accountId)),
          ),
        );
      if (!prospect) throw new Error("Prospect not found or access denied");
    }

    if (data.listingContactId) {
      const [lead] = await db
        .select({ listingContactId: listingContacts.listingContactId })
        .from(listingContacts)
        .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
        .where(
          and(
            eq(listingContacts.listingContactId, data.listingContactId),
            eq(contacts.accountId, BigInt(accountId)),
            eq(listingContacts.isActive, true),
          ),
        );
      if (!lead) throw new Error("Listing contact not found or access denied");
    }

    if (data.listingId) {
      const [listing] = await db
        .select({ listingId: listings.listingId })
        .from(listings)
        .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
        .where(
          and(
            eq(listings.listingId, data.listingId),
            eq(properties.accountId, BigInt(accountId)),
          ),
        );
      if (!listing) throw new Error("Listing not found or access denied");
    }

    if (data.contactId) {
      const [contact] = await db
        .select({ contactId: contacts.contactId })
        .from(contacts)
        .where(
          and(
            eq(contacts.contactId, data.contactId),
            eq(contacts.accountId, BigInt(accountId)),
          ),
        );
      if (!contact) throw new Error("Contact not found or access denied");
    }

    const [result] = await db
      .insert(tasks)
      .values({
        ...data,
        isActive: true,
      })
      .returning();
    if (!result) throw new Error("Failed to create task");
    const [newTask] = await db
      .select({
        taskId: sql<number>`CAST(${tasks.taskId} AS BIGINT)`,
        userId: tasks.userId,
        title: tasks.title,
        description: tasks.description,
        dueDate: tasks.dueDate,
        dueTime: tasks.dueTime,
        completed: tasks.completed,
        createdBy: tasks.createdBy,
        urgency: tasks.urgency,
        listingId: sql<number>`CAST(${tasks.listingId} AS BIGINT)`,
        listingContactId: sql<number>`CAST(${tasks.listingContactId} AS BIGINT)`,
        dealId: sql<number>`CAST(${tasks.dealId} AS BIGINT)`,
        appointmentId: sql<number>`CAST(${tasks.appointmentId} AS BIGINT)`,
        prospectId: sql<number>`CAST(${tasks.prospectId} AS BIGINT)`,
        contactId: sql<number>`CAST(${tasks.contactId} AS BIGINT)`,
        isActive: tasks.isActive,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .where(eq(tasks.taskId, BigInt(result.taskId)));
    return newTask;
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
}

// Get task by ID
export async function getTaskById(taskId: number, accountId: number) {
  try {
    // Complex query to verify account access through various relationships
    const [task] = await db
      .select()
      .from(tasks)
      .leftJoin(prospects, eq(tasks.prospectId, prospects.id))
      .leftJoin(
        contacts,
        or(
          eq(prospects.contactId, contacts.contactId),
          eq(tasks.contactId, contacts.contactId),
        ),
      )
      .leftJoin(
        listingContacts,
        eq(tasks.listingContactId, listingContacts.listingContactId),
      )
      .leftJoin(listings, eq(tasks.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(tasks.taskId, BigInt(taskId)),
          eq(tasks.isActive, true),
          or(
            // Task belongs to account through prospect->contact
            eq(contacts.accountId, BigInt(accountId)),
            // Task belongs to account through listing->property
            eq(properties.accountId, BigInt(accountId)),
          ),
        ),
      );
    return task;
  } catch (error) {
    console.error("Error fetching task:", error);
    throw error;
  }
}

// Get tasks by user ID
export async function getUserTasks(
  userId: string,
  accountId: number,
  filters?: {
    createdBy?: string[];
    category?: string[];
    urgency?: number[];
    completed?: boolean;
  },
) {
  try {
    // Build the where conditions array
    const whereConditions = [
      eq(tasks.userId, userId),
      eq(tasks.isActive, true),
      or(
        // Task belongs to account through prospect->contact
        eq(contacts.accountId, BigInt(accountId)),
        // Task belongs to account through listing->property
        eq(properties.accountId, BigInt(accountId)),
      ),
    ];

    // Apply filters if provided
    if (filters) {
      // Filter by completed status
      if (filters.completed !== undefined) {
        whereConditions.push(eq(tasks.completed, filters.completed));
      }

      // Filter by createdBy
      if (filters.createdBy && filters.createdBy.length > 0) {
        whereConditions.push(
          sql`${tasks.createdBy} IN (${sql.join(filters.createdBy.map((id) => sql`${id}`), sql`, `)})`,
        );
      }

      // Filter by category
      if (filters.category && filters.category.length > 0) {
        whereConditions.push(
          sql`${tasks.category} IN (${sql.join(filters.category.map((cat) => sql`${cat}`), sql`, `)})`,
        );
      }

      // Filter by urgency
      if (filters.urgency && filters.urgency.length > 0) {
        whereConditions.push(
          sql`${tasks.urgency} IN (${sql.join(filters.urgency.map((urg) => sql`${urg}`), sql`, `)})`,
        );
      }
    }

    const userTasks = await db
      .select()
      .from(tasks)
      .leftJoin(prospects, eq(tasks.prospectId, prospects.id))
      .leftJoin(
        contacts,
        or(
          eq(prospects.contactId, contacts.contactId),
          eq(tasks.contactId, contacts.contactId),
        ),
      )
      .leftJoin(
        listingContacts,
        eq(tasks.listingContactId, listingContacts.listingContactId),
      )
      .leftJoin(listings, eq(tasks.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(and(...whereConditions));
    return userTasks;
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    throw error;
  }
}

// Get tasks by listing ID
export async function getListingTasks(listingId: number, accountId: number) {
  try {
    const listingTasks = await db
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
        urgency: tasks.urgency,
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
        // Contact fields for related contact display
        contactFirstName: contacts.firstName,
        contactLastName: contacts.lastName,
        contactEmail: contacts.email,
      })
      .from(tasks)
      .innerJoin(listings, eq(tasks.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .innerJoin(users, eq(tasks.userId, users.id))
      .leftJoin(contacts, eq(tasks.contactId, contacts.contactId))
      .where(
        and(
          eq(tasks.listingId, BigInt(listingId)),
          eq(tasks.isActive, true),
          eq(properties.accountId, BigInt(accountId)),
        ),
      )
      .orderBy(tasks.createdAt);
    return listingTasks;
  } catch (error) {
    console.error("Error fetching listing tasks:", error);
    throw error;
  }
}

// Get tasks by lead ID
export async function getLeadTasks(
  listingContactId: number,
  accountId: number,
) {
  try {
    const leadTasks = await db
      .select()
      .from(tasks)
      .innerJoin(
        listingContacts,
        and(
          eq(tasks.listingContactId, listingContacts.listingContactId),
          eq(listingContacts.contactType, "buyer"),
        ),
      )
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(tasks.listingContactId, BigInt(listingContactId)),
          eq(tasks.isActive, true),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      );
    return leadTasks;
  } catch (error) {
    console.error("Error fetching lead tasks:", error);
    throw error;
  }
}

// Get tasks by deal ID
export async function getDealTasks(dealId: number, _accountId: number) {
  try {
    // Note: deals don't have direct account relationship, need to go through listing->property
    const dealTasks = await db
      .select()
      .from(tasks)
      // This would need the deals table to be imported and joined properly
      // For now, returning empty array to prevent unauthorized access
      .where(
        and(
          eq(tasks.dealId, BigInt(dealId)),
          eq(tasks.isActive, true),
          eq(tasks.taskId, BigInt(-1)),
        ),
      );
    return dealTasks;
  } catch (error) {
    console.error("Error fetching deal tasks:", error);
    throw error;
  }
}

// Get tasks by appointment ID
export async function getAppointmentTasks(
  appointmentId: number,
  accountId: number,
) {
  try {
    const appointmentTasks = await db
      .select()
      .from(tasks)
      .leftJoin(users, eq(tasks.userId, users.id))
      .where(
        and(
          eq(tasks.appointmentId, BigInt(appointmentId)),
          eq(tasks.isActive, true),
          eq(users.accountId, BigInt(accountId)),
        ),
      );

    // Transform to match expected Task interface
    return appointmentTasks.map((row) => ({
      ...row.tasks,
      userName: row.users?.name,
      userFirstName: row.users?.firstName,
      userLastName: row.users?.lastName,
    }));
  } catch (error) {
    console.error("Error fetching appointment tasks:", error);
    throw error;
  }
}

// Update task
export async function updateTask(
  taskId: number,
  data: Omit<Partial<Task>, "taskId" | "createdAt" | "updatedAt">,
  accountId: number,
  editedBy?: string,
) {
  try {
    // First verify the task belongs to this account using JOINs instead of subqueries
    const [existingTask] = await db
      .select({
        taskId: tasks.taskId,
        title: tasks.title,
        completed: tasks.completed,
        userId: tasks.userId,
        createdBy: tasks.createdBy,
        activityId: tasks.activityId,
        activityType: tasks.activityType,
      })
      .from(tasks)
      .leftJoin(prospects, eq(tasks.prospectId, prospects.id))
      .leftJoin(
        contacts,
        or(
          eq(prospects.contactId, contacts.contactId),
          eq(tasks.contactId, contacts.contactId),
        ),
      )
      .leftJoin(
        listingContacts,
        eq(tasks.listingContactId, listingContacts.listingContactId),
      )
      .leftJoin(listings, eq(tasks.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(tasks.taskId, BigInt(taskId)),
          eq(tasks.isActive, true),
          or(
            eq(contacts.accountId, BigInt(accountId)),
            eq(properties.accountId, BigInt(accountId)),
          ),
        ),
      );

    if (!existingTask) {
      throw new Error("Task not found or access denied");
    }

    // Check user permissions for this specific task
    const { canEditTask } = await import("~/app/actions/permissions/check-permissions");
    const hasPermission = await canEditTask(existingTask.createdBy);

    if (!hasPermission) {
      throw new Error("Permission denied: Cannot edit this task");
    }

    // Prepare update data with editedBy
    const updateData = {
      ...data,
      editedBy: editedBy ?? null,
    };

    await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.taskId, BigInt(taskId)), eq(tasks.isActive, true)));

    // If task completion status changed and has an associated activity, update the activity's pending status
    if (
      data.completed !== undefined &&
      data.completed !== existingTask.completed &&
      existingTask.activityId &&
      existingTask.activityType
    ) {
      try {
        const newIsPendingValue = !data.completed; // If completed=true, isPending=false; if completed=false, isPending=true

        // Use activityType to determine which table to update
        if (existingTask.activityType === "contact_activity") {
          // Update contact activity
          const [contactAct] = await db
            .select({
              id: contactActivity.id,
              details: contactActivity.details,
            })
            .from(contactActivity)
            .where(eq(contactActivity.id, existingTask.activityId))
            .limit(1);

          if (contactAct) {
            // Parse details if it's a string, or use as-is if it's an object
            const currentDetails =
              typeof contactAct.details === "string"
                ? (JSON.parse(contactAct.details) as Record<string, unknown>)
                : (contactAct.details as Record<string, unknown>);

            // Update the details JSON to set isPending
            const updatedDetails = {
              ...currentDetails,
              isPending: newIsPendingValue,
            };

            await db
              .update(contactActivity)
              .set({ details: updatedDetails })
              .where(eq(contactActivity.id, existingTask.activityId));

            console.log(
              `[ACTIVITY UPDATED] Contact Activity ID: ${existingTask.activityId}, isPending set to ${newIsPendingValue}`,
            );
          }
        } else if (existingTask.activityType === "listing_contact_activity") {
          // Update listing contact activity
          const [listingContactAct] = await db
            .select({
              id: listingContactActivity.id,
              details: listingContactActivity.details,
            })
            .from(listingContactActivity)
            .where(eq(listingContactActivity.id, existingTask.activityId))
            .limit(1);

          if (listingContactAct) {
            // Parse details if it's a string, or use as-is if it's an object
            const currentDetails =
              typeof listingContactAct.details === "string"
                ? (JSON.parse(listingContactAct.details) as Record<
                    string,
                    unknown
                  >)
                : (listingContactAct.details as Record<string, unknown>);

            // Update the details JSON to set isPending
            const updatedDetails = {
              ...currentDetails,
              isPending: newIsPendingValue,
            };

            await db
              .update(listingContactActivity)
              .set({ details: updatedDetails })
              .where(eq(listingContactActivity.id, existingTask.activityId));

            console.log(
              `[ACTIVITY UPDATED] Listing Contact Activity ID: ${existingTask.activityId}, isPending set to ${newIsPendingValue}`,
            );
          }
        }
      } catch (activityError) {
        // Log error but don't fail task update
        console.error(
          `Error updating activity ${existingTask.activityId}:`,
          activityError,
        );
      }
    }

    // Log the edit action
    const updatedFields = Object.keys(data).join(", ");
    console.log(
      `[TASK EDITED] Task ID: ${taskId}, Title: "${existingTask.title}", Edited by: ${editedBy ?? "unknown"}, Account ID: ${accountId}, Updated fields: [${updatedFields}], Timestamp: ${new Date().toISOString()}`,
    );

    const [updatedTask] = await db
      .select({
        taskId: sql<number>`CAST(${tasks.taskId} AS BIGINT)`,
        userId: tasks.userId,
        title: tasks.title,
        description: tasks.description,
        dueDate: tasks.dueDate,
        dueTime: tasks.dueTime,
        completed: tasks.completed,
        completedBy: tasks.completedBy,
        editedBy: tasks.editedBy,
        category: tasks.category,
        listingId: sql<number>`CAST(${tasks.listingId} AS BIGINT)`,
        listingContactId: sql<number>`CAST(${tasks.listingContactId} AS BIGINT)`,
        dealId: sql<number>`CAST(${tasks.dealId} AS BIGINT)`,
        appointmentId: sql<number>`CAST(${tasks.appointmentId} AS BIGINT)`,
        prospectId: sql<number>`CAST(${tasks.prospectId} AS BIGINT)`,
        isActive: tasks.isActive,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .where(eq(tasks.taskId, BigInt(taskId)));
    return updatedTask;
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
}

// Update contact-specific task
export async function updateContactTask(
  taskId: number,
  data: Omit<Partial<Task>, "taskId" | "createdAt" | "updatedAt">,
  accountId: number,
) {
  try {
    // Verify task exists and belongs to account through contact relationship
    // Also fetch activityId, activityType, and completed for activity sync
    const [existingTask] = await db
      .select({
        taskId: tasks.taskId,
        completed: tasks.completed,
        activityId: tasks.activityId,
        activityType: tasks.activityType,
      })
      .from(tasks)
      .innerJoin(contacts, eq(tasks.contactId, contacts.contactId))
      .where(
        and(
          eq(tasks.taskId, BigInt(taskId)),
          eq(tasks.isActive, true),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      );

    if (!existingTask) {
      throw new Error("Contact task not found or access denied");
    }

    await db
      .update(tasks)
      .set(data)
      .where(and(eq(tasks.taskId, BigInt(taskId)), eq(tasks.isActive, true)));

    // If task completion status changed and has an associated activity, update the activity's pending status
    console.log(
      `[DEBUG updateContactTask] Task ${taskId} - activityId: ${existingTask.activityId ?? "NULL"}, activityType: ${existingTask.activityType ?? "NULL"}`,
    );

    if (
      data.completed !== undefined &&
      data.completed !== existingTask.completed &&
      existingTask.activityId &&
      existingTask.activityType
    ) {
      try {
        const newIsPendingValue = !data.completed; // If completed=true, isPending=false; if completed=false, isPending=true

        console.log(
          `[DEBUG updateContactTask] Completion status changed from ${existingTask.completed} to ${data.completed}, updating activity isPending to ${newIsPendingValue}`,
        );

        // Use activityType to determine which table to update
        if (existingTask.activityType === "contact_activity") {
          const [contactAct] = await db
            .select({
              id: contactActivity.id,
              details: contactActivity.details,
            })
            .from(contactActivity)
            .where(eq(contactActivity.id, existingTask.activityId))
            .limit(1);

          console.log(
            `[DEBUG updateContactTask] Contact Activity found:`,
            contactAct
              ? {
                  id: contactAct.id,
                  detailsType: typeof contactAct.details,
                  detailsRaw: JSON.stringify(contactAct.details),
                }
              : "NOT FOUND",
          );

          if (contactAct) {
            const currentDetails =
              typeof contactAct.details === "string"
                ? (JSON.parse(contactAct.details) as Record<string, unknown>)
                : (contactAct.details as Record<string, unknown>);

            const updatedDetails = {
              ...currentDetails,
              isPending: newIsPendingValue,
            };

            await db
              .update(contactActivity)
              .set({ details: updatedDetails })
              .where(eq(contactActivity.id, existingTask.activityId));

            console.log(
              `[ACTIVITY UPDATED updateContactTask] Contact Activity ID: ${existingTask.activityId}, isPending set to ${newIsPendingValue}`,
            );
          }
        } else if (existingTask.activityType === "listing_contact_activity") {
          const [listingContactAct] = await db
            .select({
              id: listingContactActivity.id,
              details: listingContactActivity.details,
            })
            .from(listingContactActivity)
            .where(eq(listingContactActivity.id, existingTask.activityId))
            .limit(1);

          console.log(
            `[DEBUG updateContactTask] Listing Contact Activity found:`,
            listingContactAct
              ? {
                  id: listingContactAct.id,
                  detailsType: typeof listingContactAct.details,
                  detailsRaw: JSON.stringify(listingContactAct.details),
                }
              : "NOT FOUND",
          );

          if (listingContactAct) {
            const currentDetails =
              typeof listingContactAct.details === "string"
                ? (JSON.parse(listingContactAct.details) as Record<
                    string,
                    unknown
                  >)
                : (listingContactAct.details as Record<string, unknown>);

            const updatedDetails = {
              ...currentDetails,
              isPending: newIsPendingValue,
            };

            await db
              .update(listingContactActivity)
              .set({ details: updatedDetails })
              .where(eq(listingContactActivity.id, existingTask.activityId));

            console.log(
              `[ACTIVITY UPDATED updateContactTask] Listing Contact Activity ID: ${existingTask.activityId}, isPending set to ${newIsPendingValue}`,
            );
          }
        }
      } catch (activityError) {
        // Log error but don't fail task update
        console.error(
          `[ERROR updateContactTask] Error updating activity ${existingTask.activityId}:`,
          activityError,
        );
      }
    }

    const [updatedTask] = await db
      .select({
        taskId: sql<number>`CAST(${tasks.taskId} AS BIGINT)`,
        userId: tasks.userId,
        title: tasks.title,
        description: tasks.description,
        dueDate: tasks.dueDate,
        dueTime: tasks.dueTime,
        completed: tasks.completed,
        listingId: sql<number>`CAST(${tasks.listingId} AS BIGINT)`,
        listingContactId: sql<number>`CAST(${tasks.listingContactId} AS BIGINT)`,
        dealId: sql<number>`CAST(${tasks.dealId} AS BIGINT)`,
        appointmentId: sql<number>`CAST(${tasks.appointmentId} AS BIGINT)`,
        prospectId: sql<number>`CAST(${tasks.prospectId} AS BIGINT)`,
        contactId: sql<number>`CAST(${tasks.contactId} AS BIGINT)`,
        isActive: tasks.isActive,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .where(eq(tasks.taskId, BigInt(taskId)));
    return updatedTask;
  } catch (error) {
    console.error("Error updating contact task:", error);
    throw error;
  }
}

// Update listing-specific task
export async function updateListingTask(
  taskId: number,
  data: Omit<Partial<Task>, "taskId" | "createdAt" | "updatedAt">,
  accountId: number,
  editedBy?: string,
) {
  try {
    // Verify task exists and belongs to account through listing->property relationship
    // Also fetch activityId, activityType, and completed for activity sync
    const [existingTask] = await db
      .select({
        taskId: tasks.taskId,
        title: tasks.title,
        listingId: tasks.listingId,
        completed: tasks.completed,
        activityId: tasks.activityId,
        activityType: tasks.activityType,
      })
      .from(tasks)
      .innerJoin(listings, eq(tasks.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(tasks.taskId, BigInt(taskId)),
          eq(tasks.isActive, true),
          eq(properties.accountId, BigInt(accountId)),
        ),
      );

    if (!existingTask) {
      throw new Error("Listing task not found or access denied");
    }

    // Prepare update data with editedBy
    const updateData = {
      ...data,
      editedBy: editedBy ?? null,
    };

    await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.taskId, BigInt(taskId)), eq(tasks.isActive, true)));

    // If task completion status changed and has an associated activity, update the activity's pending status
    console.log(
      `[DEBUG updateListingTask] Task ${taskId} - activityId: ${existingTask.activityId ?? "NULL"}, activityType: ${existingTask.activityType ?? "NULL"}`,
    );

    if (
      data.completed !== undefined &&
      data.completed !== existingTask.completed &&
      existingTask.activityId &&
      existingTask.activityType
    ) {
      try {
        const newIsPendingValue = !data.completed; // If completed=true, isPending=false; if completed=false, isPending=true

        console.log(
          `[DEBUG updateListingTask] Completion status changed from ${existingTask.completed} to ${data.completed}, updating activity isPending to ${newIsPendingValue}`,
        );

        // Use activityType to determine which table to update
        if (existingTask.activityType === "contact_activity") {
          const [contactAct] = await db
            .select({
              id: contactActivity.id,
              details: contactActivity.details,
            })
            .from(contactActivity)
            .where(eq(contactActivity.id, existingTask.activityId))
            .limit(1);

          if (contactAct) {
            const currentDetails =
              typeof contactAct.details === "string"
                ? (JSON.parse(contactAct.details) as Record<string, unknown>)
                : (contactAct.details as Record<string, unknown>);

            const updatedDetails = {
              ...currentDetails,
              isPending: newIsPendingValue,
            };

            await db
              .update(contactActivity)
              .set({ details: updatedDetails })
              .where(eq(contactActivity.id, existingTask.activityId));

            console.log(
              `[ACTIVITY UPDATED updateListingTask] Contact Activity ID: ${existingTask.activityId}, isPending set to ${newIsPendingValue}`,
            );
          }
        } else if (existingTask.activityType === "listing_contact_activity") {
          const [listingContactAct] = await db
            .select({
              id: listingContactActivity.id,
              details: listingContactActivity.details,
            })
            .from(listingContactActivity)
            .where(eq(listingContactActivity.id, existingTask.activityId))
            .limit(1);

          if (listingContactAct) {
            const currentDetails =
              typeof listingContactAct.details === "string"
                ? (JSON.parse(listingContactAct.details) as Record<
                    string,
                    unknown
                  >)
                : (listingContactAct.details as Record<string, unknown>);

            const updatedDetails = {
              ...currentDetails,
              isPending: newIsPendingValue,
            };

            await db
              .update(listingContactActivity)
              .set({ details: updatedDetails })
              .where(eq(listingContactActivity.id, existingTask.activityId));

            console.log(
              `[ACTIVITY UPDATED updateListingTask] Listing Contact Activity ID: ${existingTask.activityId}, isPending set to ${newIsPendingValue}`,
            );
          }
        }
      } catch (activityError) {
        // Log error but don't fail task update
        console.error(
          `[ERROR updateListingTask] Error updating activity ${existingTask.activityId}:`,
          activityError,
        );
      }
    }

    // Log the edit action
    const updatedFields = Object.keys(data).join(", ");
    console.log(
      `[LISTING TASK EDITED] Task ID: ${taskId}, Title: "${existingTask.title}", Listing ID: ${existingTask.listingId}, Edited by: ${editedBy ?? "unknown"}, Account ID: ${accountId}, Updated fields: [${updatedFields}], Timestamp: ${new Date().toISOString()}`,
    );

    const [updatedTask] = await db
      .select({
        taskId: sql<number>`CAST(${tasks.taskId} AS BIGINT)`,
        userId: tasks.userId,
        title: tasks.title,
        description: tasks.description,
        dueDate: tasks.dueDate,
        dueTime: tasks.dueTime,
        completed: tasks.completed,
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
      })
      .from(tasks)
      .where(eq(tasks.taskId, BigInt(taskId)));
    return updatedTask;
  } catch (error) {
    console.error("Error updating listing task:", error);
    throw error;
  }
}

// Mark task as completed
export async function completeTask(
  taskId: number,
  accountId: number,
  completedBy?: string,
) {
  try {
    // First verify the task belongs to this account and get activityId and activityType
    const [existingTask] = await db
      .select({
        taskId: tasks.taskId,
        title: tasks.title,
        completed: tasks.completed,
        activityId: tasks.activityId,
        activityType: tasks.activityType,
      })
      .from(tasks)
      .leftJoin(prospects, eq(tasks.prospectId, prospects.id))
      .leftJoin(
        contacts,
        or(
          eq(prospects.contactId, contacts.contactId),
          eq(tasks.contactId, contacts.contactId),
        ),
      )
      .leftJoin(
        listingContacts,
        eq(tasks.listingContactId, listingContacts.listingContactId),
      )
      .leftJoin(listings, eq(tasks.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(tasks.taskId, BigInt(taskId)),
          eq(tasks.isActive, true),
          or(
            eq(contacts.accountId, BigInt(accountId)),
            eq(properties.accountId, BigInt(accountId)),
          ),
        ),
      );

    if (!existingTask) {
      throw new Error("Task not found or access denied");
    }

    const wasCompleted = existingTask.completed;

    await db
      .update(tasks)
      .set({
        completed: true,
        completedBy: completedBy ?? null,
      })
      .where(and(eq(tasks.taskId, BigInt(taskId)), eq(tasks.isActive, true)));

    // If task has an associated activity, update the activity's pending status
    console.log(
      `[DEBUG] Task ${taskId} - activityId: ${existingTask.activityId ?? "NULL"}, activityType: ${existingTask.activityType ?? "NULL"}`,
    );

    if (existingTask.activityId && existingTask.activityType) {
      try {
        console.log(
          `[DEBUG] Proceeding with activity update for activityId: ${existingTask.activityId}, activityType: ${existingTask.activityType}`,
        );

        // Use activityType to determine which table to update
        if (existingTask.activityType === "contact_activity") {
          // Update contact activity
          const [contactAct] = await db
            .select({
              id: contactActivity.id,
              details: contactActivity.details,
            })
            .from(contactActivity)
            .where(eq(contactActivity.id, existingTask.activityId))
            .limit(1);

          console.log(
            `[DEBUG] Contact Activity found:`,
            contactAct
              ? {
                  id: contactAct.id,
                  detailsType: typeof contactAct.details,
                  detailsRaw: JSON.stringify(contactAct.details),
                }
              : "NOT FOUND",
          );

          if (contactAct) {
            // Parse details if it's a string, or use as-is if it's an object
            const currentDetails =
              typeof contactAct.details === "string"
                ? (JSON.parse(contactAct.details) as Record<string, unknown>)
                : (contactAct.details as Record<string, unknown>);

            console.log(
              `[DEBUG] Current details parsed:`,
              JSON.stringify(currentDetails),
            );
            console.log(
              `[DEBUG] Current isPending value:`,
              currentDetails.isPending,
            );

            // Update the details JSON to set isPending = false
            const updatedDetails = {
              ...currentDetails,
              isPending: false,
            };

            console.log(
              `[DEBUG] Updated details to save:`,
              JSON.stringify(updatedDetails),
            );

            await db
              .update(contactActivity)
              .set({ details: updatedDetails })
              .where(eq(contactActivity.id, existingTask.activityId));

            console.log(
              `[ACTIVITY UPDATED] Contact Activity ID: ${existingTask.activityId}, isPending set to false`,
            );

            // Verify the update
            const [verifyAct] = await db
              .select({
                id: contactActivity.id,
                details: contactActivity.details,
              })
              .from(contactActivity)
              .where(eq(contactActivity.id, existingTask.activityId))
              .limit(1);

            console.log(
              `[DEBUG] Verification - Activity after update:`,
              verifyAct
                ? {
                    id: verifyAct.id,
                    detailsType: typeof verifyAct.details,
                    detailsRaw: JSON.stringify(verifyAct.details),
                  }
                : "NOT FOUND",
            );
          } else {
            console.log(
              `[DEBUG] Contact activity with ID ${existingTask.activityId} not found`,
            );
          }
        } else if (existingTask.activityType === "listing_contact_activity") {
          // Update listing contact activity
          const [listingContactAct] = await db
            .select({
              id: listingContactActivity.id,
              details: listingContactActivity.details,
            })
            .from(listingContactActivity)
            .where(eq(listingContactActivity.id, existingTask.activityId))
            .limit(1);

          console.log(
            `[DEBUG] Listing Contact Activity found:`,
            listingContactAct
              ? {
                  id: listingContactAct.id,
                  detailsType: typeof listingContactAct.details,
                  detailsRaw: JSON.stringify(listingContactAct.details),
                }
              : "NOT FOUND",
          );

          if (listingContactAct) {
            // Parse details if it's a string, or use as-is if it's an object
            const currentDetails =
              typeof listingContactAct.details === "string"
                ? (JSON.parse(listingContactAct.details) as Record<
                    string,
                    unknown
                  >)
                : (listingContactAct.details as Record<string, unknown>);

            console.log(
              `[DEBUG] Current details parsed:`,
              JSON.stringify(currentDetails),
            );
            console.log(
              `[DEBUG] Current isPending value:`,
              currentDetails.isPending,
            );

            // Update the details JSON to set isPending = false
            const updatedDetails = {
              ...currentDetails,
              isPending: false,
            };

            console.log(
              `[DEBUG] Updated details to save:`,
              JSON.stringify(updatedDetails),
            );

            await db
              .update(listingContactActivity)
              .set({ details: updatedDetails })
              .where(eq(listingContactActivity.id, existingTask.activityId));

            console.log(
              `[ACTIVITY UPDATED] Listing Contact Activity ID: ${existingTask.activityId}, isPending set to false`,
            );

            // Verify the update
            const [verifyAct] = await db
              .select({
                id: listingContactActivity.id,
                details: listingContactActivity.details,
              })
              .from(listingContactActivity)
              .where(eq(listingContactActivity.id, existingTask.activityId))
              .limit(1);

            console.log(
              `[DEBUG] Verification - Activity after update:`,
              verifyAct
                ? {
                    id: verifyAct.id,
                    detailsType: typeof verifyAct.details,
                    detailsRaw: JSON.stringify(verifyAct.details),
                  }
                : "NOT FOUND",
            );
          } else {
            console.log(
              `[DEBUG] Listing contact activity with ID ${existingTask.activityId} not found`,
            );
          }
        } else {
          console.log(
            `[DEBUG] Unknown activityType: ${existingTask.activityType}`,
          );
        }
      } catch (activityError) {
        // Log error but don't fail task completion
        console.error(
          `Error updating activity ${existingTask.activityId}:`,
          activityError,
        );
      }
    }

    // Log the completion action
    console.log(
      `[TASK COMPLETED] Task ID: ${taskId}, Title: "${existingTask.title}", Completed by: ${completedBy ?? "unknown"}, Account ID: ${accountId}, Previous status: ${wasCompleted ? "completed" : "incomplete"}, Timestamp: ${new Date().toISOString()}`,
    );

    const [updatedTask] = await db
      .select({
        taskId: sql<number>`CAST(${tasks.taskId} AS BIGINT)`,
        userId: tasks.userId,
        title: tasks.title,
        description: tasks.description,
        dueDate: tasks.dueDate,
        dueTime: tasks.dueTime,
        completed: tasks.completed,
        completedBy: tasks.completedBy,
        editedBy: tasks.editedBy,
        category: tasks.category,
        listingId: sql<number>`CAST(${tasks.listingId} AS BIGINT)`,
        listingContactId: sql<number>`CAST(${tasks.listingContactId} AS BIGINT)`,
        dealId: sql<number>`CAST(${tasks.dealId} AS BIGINT)`,
        appointmentId: sql<number>`CAST(${tasks.appointmentId} AS BIGINT)`,
        prospectId: sql<number>`CAST(${tasks.prospectId} AS BIGINT)`,
        isActive: tasks.isActive,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .where(eq(tasks.taskId, BigInt(taskId)));
    return updatedTask;
  } catch (error) {
    console.error("Error completing task:", error);
    throw error;
  }
}

// Soft delete task (set isActive to false)
export async function softDeleteTask(taskId: number, accountId: number) {
  try {
    // First verify the task belongs to this account
    const [existingTask] = await db
      .select({ taskId: tasks.taskId })
      .from(tasks)
      .leftJoin(prospects, eq(tasks.prospectId, prospects.id))
      .leftJoin(
        contacts,
        or(
          eq(prospects.contactId, contacts.contactId),
          eq(tasks.contactId, contacts.contactId),
        ),
      )
      .leftJoin(
        listingContacts,
        eq(tasks.listingContactId, listingContacts.listingContactId),
      )
      .leftJoin(listings, eq(tasks.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(tasks.taskId, BigInt(taskId)),
          or(
            eq(contacts.accountId, BigInt(accountId)),
            eq(properties.accountId, BigInt(accountId)),
          ),
        ),
      );

    if (!existingTask) {
      throw new Error("Task not found or access denied");
    }

    await db
      .update(tasks)
      .set({ isActive: false })
      .where(eq(tasks.taskId, BigInt(taskId)));
    return { success: true };
  } catch (error) {
    console.error("Error soft deleting task:", error);
    throw error;
  }
}

// Hard delete task (remove from database)
export async function deleteTask(taskId: number, accountId: number) {
  try {
    // First verify the task belongs to this account using JOINs instead of subqueries
    const [existingTask] = await db
      .select({
        taskId: tasks.taskId,
        userId: tasks.userId,
        createdBy: tasks.createdBy,
      })
      .from(tasks)
      .leftJoin(prospects, eq(tasks.prospectId, prospects.id))
      .leftJoin(
        contacts,
        or(
          eq(prospects.contactId, contacts.contactId),
          eq(tasks.contactId, contacts.contactId),
        ),
      )
      .leftJoin(
        listingContacts,
        eq(tasks.listingContactId, listingContacts.listingContactId),
      )
      .leftJoin(listings, eq(tasks.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(tasks.taskId, BigInt(taskId)),
          or(
            eq(contacts.accountId, BigInt(accountId)),
            eq(properties.accountId, BigInt(accountId)),
          ),
        ),
      );

    if (!existingTask) {
      throw new Error("Task not found or access denied");
    }

    // Check user permissions for this specific task
    const { canDeleteTask } = await import("~/app/actions/permissions/check-permissions");
    const hasPermission = await canDeleteTask(existingTask.createdBy);

    if (!hasPermission) {
      throw new Error("Permission denied: Cannot delete this task");
    }

    await db.delete(tasks).where(eq(tasks.taskId, BigInt(taskId)));
    return { success: true };
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
}

// Delete contact-specific task
export async function deleteContactTask(taskId: number, accountId: number) {
  try {
    // Verify task exists and belongs to account through contact relationship
    const [existingTask] = await db
      .select({ taskId: tasks.taskId })
      .from(tasks)
      .innerJoin(contacts, eq(tasks.contactId, contacts.contactId))
      .where(
        and(
          eq(tasks.taskId, BigInt(taskId)),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      );

    if (!existingTask) {
      throw new Error("Contact task not found or access denied");
    }

    await db.delete(tasks).where(eq(tasks.taskId, BigInt(taskId)));
    return { success: true };
  } catch (error) {
    console.error("Error deleting contact task:", error);
    throw error;
  }
}

// Delete listing-specific task
export async function deleteListingTask(taskId: number, accountId: number) {
  try {
    // Verify task exists and belongs to account through listing->property relationship
    const [existingTask] = await db
      .select({ taskId: tasks.taskId })
      .from(tasks)
      .innerJoin(listings, eq(tasks.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(tasks.taskId, BigInt(taskId)),
          eq(properties.accountId, BigInt(accountId)),
        ),
      );

    if (!existingTask) {
      throw new Error("Listing task not found or access denied");
    }

    await db.delete(tasks).where(eq(tasks.taskId, BigInt(taskId)));
    return { success: true };
  } catch (error) {
    console.error("Error deleting listing task:", error);
    throw error;
  }
}

// List all tasks (with pagination and optional filters)
export async function listTasks(
  page = 1,
  limit = 10,
  accountId: number,
  filters?: {
    userId?: string; // Changed to string for BetterAuth compatibility
    completed?: boolean;
    isActive?: boolean;
  },
) {
  try {
    const offset = (page - 1) * limit;

    // Build the where conditions array
    const whereConditions = [];
    if (filters) {
      if (filters.userId) {
        whereConditions.push(eq(tasks.userId, filters.userId)); // userId is now string
      }
      if (filters.completed !== undefined) {
        whereConditions.push(eq(tasks.completed, filters.completed));
      }
      if (filters.isActive !== undefined) {
        whereConditions.push(eq(tasks.isActive, filters.isActive));
      }
    } else {
      // By default, only show active tasks
      whereConditions.push(eq(tasks.isActive, true));
    }

    // Always filter by account through relationships
    whereConditions.push(
      or(
        eq(contacts.accountId, BigInt(accountId)),
        eq(properties.accountId, BigInt(accountId)),
      ),
    );

    // Create the query with proper joins for account filtering
    const allTasks = await db
      .select()
      .from(tasks)
      .leftJoin(prospects, eq(tasks.prospectId, prospects.id))
      .leftJoin(
        contacts,
        or(
          eq(prospects.contactId, contacts.contactId),
          eq(tasks.contactId, contacts.contactId),
        ),
      )
      .leftJoin(
        listingContacts,
        eq(tasks.listingContactId, listingContacts.listingContactId),
      )
      .leftJoin(listings, eq(tasks.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .limit(limit)
      .offset(offset);

    return allTasks;
  } catch (error) {
    console.error("Error listing tasks:", error);
    throw error;
  }
}

// Get most urgent tasks sorted by due date
export async function getMostUrgentTasks(
  accountId: number,
  limit = 10,
  daysAhead = 30,
  filters?: {
    appointmentListingId?: number;
    appointmentContactId?: number;
    userId?: string; // Filter by task.userId (agent filter)
  },
) {
  try {
    // Calculate the end date based on daysAhead parameter
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + daysAhead);

    const whereConditions = [
      eq(tasks.isActive, true),
      eq(tasks.completed, false),
      isNotNull(tasks.dueDate),
      lte(tasks.dueDate, endDate),
      or(
        eq(contacts.accountId, BigInt(accountId)),
        eq(properties.accountId, BigInt(accountId)),
      ),
    ];

    // Add appointment-based filtering if provided
    // Logic: Always match listingId. If contactId exists in filter, task must also have matching contactId.
    // If no contactId in filter, show tasks with listingId regardless of contactId (including null).
    if (filters?.appointmentListingId) {
      const listingIdCondition = eq(tasks.listingId, BigInt(filters.appointmentListingId));
      
      if (filters.appointmentContactId) {
        // Appointment has a contactId: require both listingId AND contactId to match
        whereConditions.push(
          and(
            listingIdCondition,
            eq(tasks.contactId, BigInt(filters.appointmentContactId))
          )
        );
      } else {
        // Appointment has no contactId: just match listingId (don't filter by contactId)
        whereConditions.push(listingIdCondition);
      }
    }

    // Add userId (agent) filtering if provided
    if (filters?.userId) {
      whereConditions.push(eq(tasks.userId, filters.userId));
    }

    const urgentTasks = await db
      .select({
        taskId: sql<number>`CAST(${tasks.taskId} AS BIGINT)`,
        userId: tasks.userId,
        createdBy: tasks.createdBy,
        title: tasks.title,
        description: tasks.description,
        dueDate: tasks.dueDate,
        dueTime: tasks.dueTime,
        completed: tasks.completed,
        urgency: tasks.urgency,
        status: tasks.status,
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
        userName: users.name,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        // Contact information
        contactFirstName: contacts.firstName,
        contactLastName: contacts.lastName,
        // Property information
        propertyTitle: properties.title,
      })
      .from(tasks)
      .innerJoin(users, eq(tasks.userId, users.id))
      .leftJoin(prospects, eq(tasks.prospectId, prospects.id))
      .leftJoin(
        contacts,
        or(
          eq(prospects.contactId, contacts.contactId),
          eq(tasks.contactId, contacts.contactId),
        ),
      )
      .leftJoin(
        listingContacts,
        eq(tasks.listingContactId, listingContacts.listingContactId),
      )
      .leftJoin(listings, eq(tasks.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(and(...whereConditions))
      .orderBy(asc(tasks.dueDate))
      .limit(limit);

    return urgentTasks;
  } catch (error) {
    console.error("Error fetching most urgent tasks:", error);
    throw error;
  }
}
