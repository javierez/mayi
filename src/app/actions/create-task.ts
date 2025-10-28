"use server";

import { createTaskWithAuth } from "~/server/queries/task";
import { getCurrentUser } from "~/lib/dal";

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
