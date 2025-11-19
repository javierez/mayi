"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, getCurrentUserAccountId } from "../../lib/dal";
import { logListingContactActivity } from "../queries/log-activity";
import {
  validateListingContactActivityAction,
  type ListingContactActivityAction,
} from "../../lib/constants/listing-contact-activity-actions";
import type { ListingContactActivityDetailsMap } from "../../types/listing-contact-activity-details";
import { generateActivityTitle } from "../openai/activity-title-generator";
import { db } from "../db";
import { listingContactActivity, contacts, listingContacts } from "../db/schema";
import { eq, and } from "drizzle-orm";

export interface CreateListingContactActivityFormData {
  listingContactId: string | bigint;
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

export interface ListingContactActivityActionResult {
  success: boolean;
  error?: string;
  data?: {
    id: bigint;
    listingContactId: bigint;
    userId: string;
    action: string;
    createdAt: Date;
  };
}

/**
 * Create a new listing contact activity
 * Supports simple note-based activities (call_logged, message_received, etc.)
 */
export async function createListingContactActivityAction(
  formData: CreateListingContactActivityFormData,
): Promise<ListingContactActivityActionResult> {
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

    if (!formData.listingContactId) {
      return { success: false, error: "ID de contacto de listado requerido" };
    }

    if (!formData.action) {
      return { success: false, error: "Tipo de acción requerido" };
    }

    // Validate action type
    let validatedAction: ListingContactActivityAction;
    try {
      validatedAction = validateListingContactActivityAction(formData.action);
    } catch {
      return {
        success: false,
        error: `Tipo de acción inválido: ${formData.action}`,
      };
    }

    // Convert string ID to BigInt if needed
    const listingContactId =
      typeof formData.listingContactId === "string"
        ? BigInt(formData.listingContactId)
        : formData.listingContactId;

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
          activityType,
        );
      } catch {
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

    // Prepare details based on action type
    // For simple note-based activities, we'll use a generic structure
    // Spread formData.details first, then override with our generated topic to ensure it's saved
    const details: Record<string, unknown> = {
      notes: formData.notes.trim(),
      ...(formData.details ?? {}),
      topic, // Set topic AFTER spread to ensure it's not overwritten
    };

    // Log the activity using the helper function
    const activityId = await logListingContactActivity({
      listingContactId,
      userId: currentUser.id,
      action: validatedAction,
      details: details as unknown as ListingContactActivityDetailsMap[typeof validatedAction],
    });

    // Auto-create task if isPending is true
    if (formData.details?.isPending === true) {
      try {
        const { createTaskAction } = await import("../../app/actions/create-task");
        const {
          fetchContactName,
          fetchListingTitle,
          generateTaskTitleFromActivity,
        } = await import("./task-helpers");

        // Fetch contactId and listingId from listingContactId
        const [listingContact] = await db
          .select({
            contactId: listingContacts.contactId,
            listingId: listingContacts.listingId,
          })
          .from(listingContacts)
          .where(eq(listingContacts.listingContactId, listingContactId))
          .limit(1);

        if (listingContact) {
          // Fetch contact name for task title
          const contactName = await fetchContactName(listingContact.contactId);

          // Fetch listing title if available
          let listingTitle: string | null = null;
          if (listingContact.listingId) {
            listingTitle = await fetchListingTitle(listingContact.listingId);
          }

          // Generate task title
          const taskTitle = await generateTaskTitleFromActivity(
            validatedAction,
            contactName,
            listingTitle,
          );

          // Calculate due date from hours (default 48 hours)
          const deadlineHours = formData.details?.deadlineHours ?? 48;
          const dueDate = new Date();
          dueDate.setHours(dueDate.getHours() + deadlineHours);

          // Create follow-up task with calculated due date and activity reference
          await createTaskAction({
            title: taskTitle,
            description: formData.notes.trim(),
            contactId: listingContact.contactId,
            urgency: 2, // Medium urgency
            category: "contact",
            dueDate,
            listingId: listingContact.listingId ?? undefined,
            listingContactId,
            activityId, // Link task to the activity that created it
            activityType: "listing_contact_activity", // Specify this came from listing_contact_activity
          });
        }
      } catch (taskError) {
        // Log error but don't fail the activity creation
        console.error("Error creating task from pending activity:", taskError);
      }
    }

    // Revalidate the page
    revalidatePath(`/operaciones/leads`);

    return {
      success: true,
      data: {
        id: 0n, // Will be set by the database
        listingContactId,
        userId: currentUser.id,
        action: validatedAction,
        createdAt: new Date(),
      },
    };
  } catch (error) {
    console.error("Error in createListingContactActivityAction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
}

/**
 * Delete a listing contact activity
 * User can delete if they created it OR have deleteAll permission for tasks
 */
export async function deleteListingContactActivityAction(
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
        id: listingContactActivity.id,
        userId: listingContactActivity.userId,
      })
      .from(listingContactActivity)
      .innerJoin(
        listingContacts,
        eq(listingContactActivity.listingContactId, listingContacts.listingContactId),
      )
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContactActivity.id, activityId),
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

    // Check permissions: user can delete if they created it OR have deleteAll permission
    // For now, we'll use the same permission check as tasks
    const { canDeleteAllTasks } = await import("../../app/actions/permissions/check-permissions");
    const hasDeleteAllPermission = await canDeleteAllTasks();
    const canDelete = activity.userId === currentUser.id || hasDeleteAllPermission;

    if (!canDelete) {
      return {
        success: false,
        error: "No tienes permisos para eliminar esta actividad",
      };
    }

    // Delete the activity
    await db
      .delete(listingContactActivity)
      .where(eq(listingContactActivity.id, activityId));

    // Revalidate the page
    revalidatePath(`/operaciones/leads`);

    return { success: true };
  } catch (error) {
    console.error("Error in deleteListingContactActivityAction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
}

