"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, getCurrentUserAccountId } from "../../lib/dal";
import { logContactActivity } from "../queries/log-activity";
import {
  validateContactActivityAction,
  type ContactActivityAction,
} from "../../lib/constants/contact-activity-actions";
import { generateActivityTitle } from "../openai/activity-title-generator";
import { db } from "../db";
import { listingContacts, contacts, contactActivity } from "../db/schema";
import { eq, and } from "drizzle-orm";

export interface CreateContactActivityFormData {
  contactId: string | bigint;
  action: string;
  notes: string;
  topic?: string;
  details?: {
    isPending?: boolean;
    deadlineHours?: number;
    activityType?: string;
    [key: string]: unknown;
  };
}

export interface ContactActivityActionResult {
  success: boolean;
  error?: string;
  activity?: {
    id: bigint;
    contactId: bigint;
    userId: string;
    action: string;
    createdAt: Date;
  };
}

/**
 * Find listing_contact_id from contactId and listingId
 */
export async function findListingContactIdAction(
  contactId: bigint,
  listingId: bigint,
): Promise<{ success: boolean; listingContactId?: bigint; error?: string; notFound?: boolean }> {
  try {
    const accountId = await getCurrentUserAccountId();

    const [listingContact] = await db
      .select({
        listingContactId: listingContacts.listingContactId,
      })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContacts.contactId, contactId),
          eq(listingContacts.listingId, listingId),
          eq(listingContacts.isActive, true),
          eq(contacts.accountId, BigInt(accountId)),
          eq(contacts.isActive, true),
        ),
      )
      .limit(1);

    if (!listingContact) {
      return {
        success: false,
        notFound: true,
        error: "No se encontró la relación entre el contacto y la propiedad",
      };
    }

    return {
      success: true,
      listingContactId: listingContact.listingContactId,
    };
  } catch (error) {
    console.error("Error finding listing contact ID:", error);
    return {
      success: false,
      error: "Error al buscar la relación",
    };
  }
}

/**
 * Create a listing-contact relationship with 'buyer' contact type
 */
export async function createListingContactRelationshipAction(
  contactId: bigint,
  listingId: bigint,
): Promise<{ success: boolean; listingContactId?: bigint; error?: string }> {
  try {
    const accountId = await getCurrentUserAccountId();

    // Verify that the contact belongs to the current account
    const [contact] = await db
      .select({ contactId: contacts.contactId })
      .from(contacts)
      .where(
        and(
          eq(contacts.contactId, contactId),
          eq(contacts.accountId, BigInt(accountId)),
          eq(contacts.isActive, true),
        ),
      )
      .limit(1);

    if (!contact) {
      return {
        success: false,
        error: "Contacto no encontrado o acceso denegado",
      };
    }

    // Create the listing-contact relationship
    const [newRelation] = await db
      .insert(listingContacts)
      .values({
        contactId,
        listingId,
        contactType: "buyer",
        isActive: true,
        status: "active",
      })
      .returning({ listingContactId: listingContacts.listingContactId });

    if (!newRelation) {
      return {
        success: false,
        error: "Error al crear la relación",
      };
    }

    return {
      success: true,
      listingContactId: newRelation.listingContactId,
    };
  } catch (error) {
    console.error("Error creating listing contact relationship:", error);
    return {
      success: false,
      error: "Error al crear la relación entre el contacto y la propiedad",
    };
  }
}

/**
 * Get contactId and listingId from listingContactId
 */
export async function getContactAndListingFromListingContactIdAction(
  listingContactId: bigint,
): Promise<{
  success: boolean;
  contactId?: bigint;
  listingId?: bigint;
  error?: string;
}> {
  try {
    const accountId = await getCurrentUserAccountId();

    const [listingContact] = await db
      .select({
        contactId: listingContacts.contactId,
        listingId: listingContacts.listingId,
      })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContacts.listingContactId, listingContactId),
          eq(listingContacts.isActive, true),
          eq(contacts.accountId, BigInt(accountId)),
          eq(contacts.isActive, true),
        ),
      )
      .limit(1);

    if (!listingContact) {
      return {
        success: false,
        error: "No se encontró la relación de contacto con propiedad",
      };
    }

    const listingId: bigint | undefined = listingContact.listingId ?? undefined;

    return {
      success: true,
      contactId: listingContact.contactId,
      listingId,
    };
  } catch (error) {
    console.error("Error getting contact and listing from listingContactId:", error);
    return {
      success: false,
      error: "Error al obtener la información",
    };
  }
}

/**
 * Create a new contact activity
 * Used when adding activities without a specific listing
 */
export async function createContactActivityAction(
  formData: CreateContactActivityFormData,
): Promise<ContactActivityActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: "No tienes permisos para crear actividades",
      };
    }

    // Validate input
    if (!formData.notes?.trim()) {
      return {
        success: false,
        error: "Las notas no pueden estar vacías",
      };
    }

    if (!formData.contactId) {
      return { success: false, error: "ID de contacto requerido" };
    }

    // Convert string ID to BigInt if needed
    const contactId =
      typeof formData.contactId === "string"
        ? BigInt(formData.contactId)
        : formData.contactId;

    // Validate and use the actual action type
    let action: ContactActivityAction;
    try {
      action = validateContactActivityAction(formData.action);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Acción no válida",
      };
    }

    // Generate topic from notes if not provided
    // Try OpenAI first, fall back to simple algorithm if it fails
    let topic: string;
    if (formData.topic?.trim()) {
      topic = formData.topic.trim();
    } else {
      try {
        // Try to generate title using OpenAI
        const activityType =
          typeof formData.details?.activityType === "string"
            ? formData.details.activityType
            : undefined;
        topic = await generateActivityTitle(
          formData.notes.trim(),
          action, // Pass the action type
          activityType,
        );
      } catch (error) {
        console.error("Error generating topic with OpenAI:", error);
        // Fall back to simple algorithm if OpenAI fails
        const notes = formData.notes.trim();
        const sentences = notes.split(/[.!?]/);
        const firstSentence = sentences[0]?.trim() ?? "";
        if (firstSentence && firstSentence.length > 50) {
          topic = firstSentence.substring(0, 50) + "...";
        } else {
          topic = (firstSentence || notes.substring(0, 50)) ?? "";
        }
        // Ensure we have a valid topic
        if (!topic?.trim()) {
          topic = notes.substring(0, 50) || "Actividad sin título";
        }
      }
    }

    // Ensure topic is never empty
    if (!topic?.trim()) {
      const notes = formData.notes.trim();
      topic = notes.substring(0, 50) || "Actividad sin título";
    }

    // Prepare details object with notes and topic
    const details: Record<string, unknown> = {
      notes: formData.notes.trim(),
      topic,
      activityType: formData.details?.activityType,
      isPending: formData.details?.isPending,
      ...(formData.details ?? {}),
    };

    // Log the contact activity with the actual action type
    const activityId = await logContactActivity({
      contactId,
      userId: currentUser.id,
      action,
      details: details as never, // Type assertion needed due to strict typing
    });

    // Auto-create task if isPending is true
    if (formData.details?.isPending === true) {
      try {
        const { createTaskAction } = await import("../../app/actions/create-task");
        const {
          fetchContactName,
          generateTaskTitleFromActivity,
        } = await import("./task-helpers");

        // Fetch contact name for task title
        const contactName = await fetchContactName(contactId);

        // Generate task title
        const taskTitle = await generateTaskTitleFromActivity(action, contactName);

        // Calculate due date from hours (default 48 hours)
        const deadlineHours = formData.details.deadlineHours ?? 48;
        const dueDate = new Date();
        dueDate.setHours(dueDate.getHours() + deadlineHours);

        // Create follow-up task with calculated due date and activity reference
        await createTaskAction({
          title: taskTitle,
          description: formData.notes.trim(),
          contactId,
          urgency: 2, // Medium urgency
          category: "contact",
          dueDate,
          activityId, // Link task to the activity that created it
          activityType: "contact_activity", // Specify this came from contact_activity
        });
      } catch (taskError) {
        // Log error but don't fail the activity creation
        console.error("Error creating task from pending activity:", taskError);
      }
    }

    // Revalidate the page
    revalidatePath(`/contactos`);

    return {
      success: true,
      activity: {
        id: BigInt(0), // Contact activity doesn't return ID from logContactActivity
        contactId,
        userId: currentUser.id,
        action,
        createdAt: new Date(),
      },
    };
  } catch (error) {
    console.error("Error in createContactActivityAction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
}

/**
 * Delete a contact activity
 * Only manual activities can be deleted, not automatic system actions
 */
export async function deleteContactActivityAction(
  activityId: bigint,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: "No tienes permisos para eliminar actividades",
      };
    }

    const accountId = await getCurrentUserAccountId();

    // Verify the activity exists and belongs to the current account
    const [activity] = await db
      .select({
        id: contactActivity.id,
        userId: contactActivity.userId,
        action: contactActivity.action,
      })
      .from(contactActivity)
      .innerJoin(contacts, eq(contactActivity.contactId, contacts.contactId))
      .where(
        and(
          eq(contactActivity.id, activityId),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      )
      .limit(1);

    if (!activity) {
      return {
        success: false,
        error: "Actividad no encontrada o acceso denegado",
      };
    }

    // Only allow deletion of manual activities
    const manualActions = ["email_sent", "whatsapp_sent", "call_logged", "viewing_completed", "notes_added"];
    if (!manualActions.includes(activity.action)) {
      return {
        success: false,
        error: "Solo se pueden eliminar actividades manuales",
      };
    }

    // Check if user has permission to delete
    // User can delete if they created it, or if they have permission
    // (canDeleteAll is handled at the UI level)
    if (activity.userId !== currentUser.id) {
      return {
        success: false,
        error: "No tienes permisos para eliminar esta actividad",
      };
    }

    // Delete the activity
    await db.delete(contactActivity).where(eq(contactActivity.id, activityId));

    // Revalidate the page
    revalidatePath(`/contactos`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting contact activity:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
}

