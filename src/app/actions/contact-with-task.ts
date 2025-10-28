"use server";

import {
  createContact,
  createContactWithListings,
} from "~/server/queries/contact";
import { createTaskWithAuth } from "~/server/queries/task";
import { getCurrentUser } from "~/lib/dal";

interface ContactData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  additionalInfo: Record<string, unknown>;
  orgId: bigint;
  isActive: boolean;
}

interface CreateContactWithTaskResult {
  success: boolean;
  contact?: unknown;
  task?: unknown;
  error?: string;
}

export async function createContactWithTaskAction(
  contactData: ContactData,
  selectedListings: bigint[] = [],
  contactType: "owner" | "buyer",
  ownershipAction?: "change" | "add",
  notes?: string,
): Promise<CreateContactWithTaskResult> {
  try {
    let newContact;

    if (selectedListings.length === 0) {
      // Create contact without listing relationships
      newContact = await createContact(contactData);
    } else {
      // Create contact with listing relationships
      newContact = await createContactWithListings(
        contactData,
        selectedListings,
        contactType,
        ownershipAction,
      );
    }

    // If contact is a demandante (buyer), automatically create appointment task
    let newTask = null;
    if (newContact && "contactId" in newContact && contactType === "buyer") {
      try {
        // Get current user for task assignment
        const currentUser = await getCurrentUser();

        // Calculate due date (3 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3);

        // Prepare task description with contact info
        const contactName =
          `${contactData.firstName} ${contactData.lastName}`.trim();
        let description = `Configurar cita para mostrar propiedades a ${contactName}`;

        if (selectedListings.length > 0) {
          description += `\n\nPropiedades de interés: ${selectedListings.length} propiedades seleccionadas`;
        }

        if (notes?.trim()) {
          description += `\n\nNotas del contacto: ${notes.trim()}`;
        }

        // Create the task
        const taskData = {
          userId: currentUser.id,
          title: "Configurar cita para ver propiedades",
          description,
          dueDate,
          completed: false,
          contactId: newContact.contactId,
          isActive: true,
        };

        newTask = await createTaskWithAuth(taskData);
      } catch (taskError) {
        console.error("Error creating appointment task:", taskError);
        // Don't fail the entire operation if task creation fails
      }
    }

    return {
      success: true,
      contact: newContact,
      task: newTask,
    };
  } catch (error) {
    console.error("Error creating contact:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error inesperado",
    };
  }
}
