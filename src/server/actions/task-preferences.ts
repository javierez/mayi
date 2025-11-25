"use server";

import { getCurrentUser } from "~/lib/dal";
import { updateAccountTaskPreferences } from "~/server/queries/accounts";
import { createTaskWithAuth } from "~/server/queries/task";
import { db } from "~/server/db";
import { listingContacts } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

interface TaskPreferences {
  property: {
    uploadPhotos: { enabled: boolean; dueDays: number | null };
    completeInfo: { enabled: boolean; dueDays: number | null };
    scheduleVisit: { enabled: boolean; dueDays: number | null };
    pickupKeys: { enabled: boolean; dueDays: number | null };
    valuation: { enabled: boolean; dueDays: number | null };
    createHojaEncargo: { enabled: boolean; dueDays: number | null };
    signHojaEncargo: { enabled: boolean; dueDays: number | null };
    generateCartel: { enabled: boolean; dueDays: number | null };
  };
}

interface CreateTasksResult {
  success: boolean;
  message: string;
  tasksCreated?: number;
  error?: string;
}

/**
 * Updates account task preferences
 */
export async function updateTaskPreferencesAction(
  taskPreferences: TaskPreferences,
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.accountId) {
      return {
        success: false,
        message: "User not authenticated",
        error: "No account found for current user",
      };
    }

    await updateAccountTaskPreferences(
      currentUser.accountId,
      taskPreferences as unknown as Record<string, unknown>,
    );

    return {
      success: true,
      message: "Task preferences updated successfully",
    };
  } catch (error) {
    console.error("Error updating task preferences:", error);
    return {
      success: false,
      message: "Failed to update task preferences",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Creates tasks based on task preferences for a specific listing
 */
export async function createTasksFromPreferencesAction(
  listingId: bigint,
  taskPreferences: TaskPreferences,
): Promise<CreateTasksResult> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.id) {
      return {
        success: false,
        message: "User not authenticated",
        error: "No user ID found",
      };
    }

    // Query the database to get the owner's listing_contact_id and contact_id for this listing
    let ownerListingContactId: bigint | undefined;
    let ownerContactId: bigint | undefined;

    try {
      const [ownerRelation] = await db
        .select({
          listingContactId: listingContacts.listingContactId,
          contactId: listingContacts.contactId,
        })
        .from(listingContacts)
        .where(
          and(
            eq(listingContacts.listingId, listingId),
            eq(listingContacts.contactType, "owner"),
            eq(listingContacts.isActive, true),
          ),
        )
        .limit(1);

      ownerListingContactId = ownerRelation?.listingContactId;
      ownerContactId = ownerRelation?.contactId;
    } catch (error) {
      console.error(
        "Error fetching owner listing_contact_id and contact_id:",
        error,
      );
      // Continue with undefined if query fails
    }

    let tasksCreated = 0;

    // Helper function to calculate due date (returns undefined if days is null or 0)
    const calculateDueDate = (days: number | null): Date | undefined => {
      if (days === null || days === 0) return undefined;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + days);
      return dueDate;
    };

    // Create tasks based on preferences
    if (taskPreferences.property.uploadPhotos.enabled) {
      await createTaskWithAuth({
        userId: currentUser.id,
        title: "Subir fotos de la propiedad",
        description:
          "Cargar y organizar las fotografías del inmueble para mejorar la presentación en portales inmobiliarios y atraer más interesados",
        category: "property",
        dueDate: calculateDueDate(taskPreferences.property.uploadPhotos.dueDays),
        dueTime: undefined,
        completed: false,
        createdBy: "0",
        listingId,
        listingContactId: ownerListingContactId,
        dealId: undefined,
        appointmentId: undefined,
        prospectId: undefined,
        contactId: ownerContactId,
        isActive: true,
      });
      tasksCreated++;
    }

    if (taskPreferences.property.completeInfo.enabled) {
      await createTaskWithAuth({
        userId: currentUser.id,
        title: "Completar información del inmueble en el cuestionario",
        description:
          "Revisar y completar todos los campos pendientes del cuestionario para tener la información completa del inmueble",
        category: "property",
        dueDate: calculateDueDate(taskPreferences.property.completeInfo.dueDays),
        dueTime: undefined,
        completed: false,
        createdBy: "0",
        listingId,
        listingContactId: ownerListingContactId,
        dealId: undefined,
        appointmentId: undefined,
        prospectId: undefined,
        contactId: ownerContactId,
        isActive: true,
      });
      tasksCreated++;
    }

    if (taskPreferences.property.scheduleVisit.enabled) {
      await createTaskWithAuth({
        userId: currentUser.id,
        title: "Programar visita al inmueble",
        description:
          "Coordinar y agendar una visita con el propietario para conocer el inmueble y tomar fotografías profesionales",
        category: "property",
        dueDate: calculateDueDate(taskPreferences.property.scheduleVisit.dueDays),
        dueTime: undefined,
        completed: false,
        createdBy: "0",
        listingId,
        listingContactId: ownerListingContactId,
        dealId: undefined,
        appointmentId: undefined,
        prospectId: undefined,
        contactId: ownerContactId,
        isActive: true,
      });
      tasksCreated++;
    }

    if (taskPreferences.property.pickupKeys.enabled) {
      await createTaskWithAuth({
        userId: currentUser.id,
        title: "Recoger llaves del inmueble",
        description:
          "Coordinar con el propietario la recogida de las llaves para facilitar las visitas y gestiones del inmueble",
        category: "property",
        dueDate: calculateDueDate(taskPreferences.property.pickupKeys.dueDays),
        dueTime: undefined,
        completed: false,
        createdBy: "0",
        listingId,
        listingContactId: ownerListingContactId,
        dealId: undefined,
        appointmentId: undefined,
        prospectId: undefined,
        contactId: ownerContactId,
        isActive: true,
      });
      tasksCreated++;
    }

    if (taskPreferences.property.valuation.enabled) {
      await createTaskWithAuth({
        userId: currentUser.id,
        title: "Realizar valoración del inmueble",
        description:
          "Realizar una valoración profesional del inmueble considerando ubicación, estado, mercado local y características únicas",
        category: "property",
        dueDate: calculateDueDate(taskPreferences.property.valuation.dueDays),
        dueTime: undefined,
        completed: false,
        createdBy: "0",
        listingId,
        listingContactId: ownerListingContactId,
        dealId: undefined,
        appointmentId: undefined,
        prospectId: undefined,
        contactId: ownerContactId,
        isActive: true,
      });
      tasksCreated++;
    }

    if (taskPreferences.property.createHojaEncargo.enabled) {
      await createTaskWithAuth({
        userId: currentUser.id,
        title: "Crear hoja de encargo",
        description:
          "Preparar y redactar la hoja de encargo con todos los términos y condiciones para la comercialización del inmueble",
        category: "property",
        dueDate: calculateDueDate(
          taskPreferences.property.createHojaEncargo.dueDays,
        ),
        dueTime: undefined,
        completed: false,
        createdBy: "0",
        listingId,
        listingContactId: ownerListingContactId,
        dealId: undefined,
        appointmentId: undefined,
        prospectId: undefined,
        contactId: ownerContactId,
        isActive: true,
      });
      tasksCreated++;
    }

    if (taskPreferences.property.signHojaEncargo.enabled) {
      await createTaskWithAuth({
        userId: currentUser.id,
        title: "Firmar hoja de encargo",
        description:
          "Coordinar la firma de la hoja de encargo con el propietario para formalizar el mandato de comercialización",
        category: "property",
        dueDate: calculateDueDate(
          taskPreferences.property.signHojaEncargo.dueDays,
        ),
        dueTime: undefined,
        completed: false,
        createdBy: "0",
        listingId,
        listingContactId: ownerListingContactId,
        dealId: undefined,
        appointmentId: undefined,
        prospectId: undefined,
        contactId: ownerContactId,
        isActive: true,
      });
      tasksCreated++;
    }

    if (taskPreferences.property.generateCartel.enabled) {
      await createTaskWithAuth({
        userId: currentUser.id,
        title: "Generar cartel del inmueble",
        description:
          "Crear el cartel promocional del inmueble con fotografías, características y información comercial para su difusión",
        category: "property",
        dueDate: calculateDueDate(taskPreferences.property.generateCartel.dueDays),
        dueTime: undefined,
        completed: false,
        createdBy: "0",
        listingId,
        listingContactId: ownerListingContactId,
        dealId: undefined,
        appointmentId: undefined,
        prospectId: undefined,
        contactId: ownerContactId,
        isActive: true,
      });
      tasksCreated++;
    }

    return {
      success: true,
      message: `${tasksCreated} tasks created successfully`,
      tasksCreated,
    };
  } catch (error) {
    console.error("Error creating tasks from preferences:", error);
    return {
      success: false,
      message: "Failed to create tasks",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Combined action: Updates preferences and creates tasks in one call
 */
export async function updatePreferencesAndCreateTasksAction(
  listingId: bigint,
  taskPreferences: TaskPreferences,
): Promise<CreateTasksResult> {
  try {
    // Update preferences first
    const updateResult = await updateTaskPreferencesAction(taskPreferences);

    if (!updateResult.success) {
      return {
        success: false,
        message: "Failed to update preferences",
        error: updateResult.error,
      };
    }

    // Create tasks based on preferences
    const createResult =
      await createTasksFromPreferencesAction(listingId, taskPreferences);

    return createResult;
  } catch (error) {
    console.error("Error in combined update and create action:", error);
    return {
      success: false,
      message: "Failed to update preferences and create tasks",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
