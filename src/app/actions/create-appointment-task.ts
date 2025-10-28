"use server";

import { createTaskWithAuth } from "~/server/queries/task";
import { getCurrentUser } from "~/lib/dal";
import { db } from "~/server/db";
import { listingContacts } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

interface CreateAppointmentTaskResult {
  success: boolean;
  task?: unknown;
  error?: string;
}

export async function createAppointmentTaskAction(
  contactId: bigint,
  contactName: string,
  notes?: string,
  selectedListings: bigint[] = [],
): Promise<CreateAppointmentTaskResult> {
  try {
    // Get current user for task assignment
    const currentUser = await getCurrentUser();

    // Calculate due date (3 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    // Prepare task description
    const description = `Configurar cita con ${contactName}`;

    // Get listing contact relationship for task association (use first listing if multiple)
    let listingId: bigint | undefined;
    let listingContactId: bigint | undefined;

    if (selectedListings.length > 0) {
      try {
        const [listingContact] = await db
          .select({
            listingContactId: listingContacts.listingContactId,
            listingId: listingContacts.listingId,
          })
          .from(listingContacts)
          .where(
            and(
              eq(listingContacts.contactId, contactId),
              eq(listingContacts.listingId, selectedListings[0]!), // Use first listing
              eq(listingContacts.isActive, true),
            ),
          )
          .limit(1);

        if (listingContact) {
          listingId = listingContact.listingId ?? undefined;
          listingContactId = listingContact.listingContactId ?? undefined;
        }
      } catch (error) {
        console.error("Error fetching listing contact relationship:", error);
        // Continue without listing association if query fails
      }
    }

    // Create the task
    const taskData = {
      userId: currentUser.id,
      title: "Configurar cita para ver propiedades",
      description,
      dueDate,
      completed: false,
      contactId,
      listingId,
      listingContactId,
      isActive: true,
    };

    const newTask = await createTaskWithAuth(taskData);

    return {
      success: true,
      task: newTask,
    };
  } catch (error) {
    console.error("Error creating appointment task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error creating task",
    };
  }
}
