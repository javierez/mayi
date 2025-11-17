"use server";

import { createTaskWithAuth } from "~/server/queries/task";
import { getCurrentUser } from "~/lib/dal";

/**
 * Generic task creation action
 * Used for creating tasks from AI-generated task extraction
 */
export async function createTaskAction(params: {
  title: string;
  description: string;
  contactId: bigint;
  dueDate?: Date;
  urgency?: number;
  category?: string;
  suggestedDueDays?: number; // Will be converted to dueDate if dueDate not provided
  listingId?: bigint;
  listingContactId?: bigint;
  activityId?: bigint;
  activityType?: "contact_activity" | "listing_contact_activity";
}) {
  try {
    const currentUser = await getCurrentUser();

    // Calculate due date: use provided dueDate, or calculate from suggestedDueDays, or default to 3 days
    let dueDate: Date;
    if (params.dueDate) {
      dueDate = params.dueDate;
    } else if (params.suggestedDueDays) {
      const date = new Date();
      date.setDate(date.getDate() + params.suggestedDueDays);
      dueDate = date;
    } else {
      const date = new Date();
      date.setDate(date.getDate() + 3);
      dueDate = date;
    }

    const taskData = {
      userId: currentUser.id,
      title: params.title,
      description: params.description,
      dueDate,
      completed: false,
      contactId: params.contactId,
      isActive: true,
      urgency: params.urgency,
      category: params.category,
      listingId: params.listingId,
      listingContactId: params.listingContactId,
      activityId: params.activityId,
      activityType: params.activityType,
    };

    const newTask = await createTaskWithAuth(taskData);

    return {
      success: true,
      task: newTask,
    };
  } catch (error) {
    console.error("Error creating task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error creating task",
    };
  }
}

export async function createAppointmentTaskAction(
  contactId: bigint,
  contactName: string,
  notes?: string,
  _selectedListingsCount = 0,
) {
  try {
    // Get current user for task assignment
    const currentUser = await getCurrentUser();

    // Calculate due date (3 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    // Prepare task description
    const description = `Configurar cita con ${contactName}`;

    // Create the task
    const taskData = {
      userId: currentUser.id,
      title: "Configurar cita para ver propiedades",
      description,
      dueDate,
      completed: false,
      contactId,
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
