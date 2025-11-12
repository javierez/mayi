"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../../lib/dal";
import { logListingContactActivity } from "../queries/log-activity";
import {
  validateListingContactActivityAction,
  type ListingContactActivityAction,
} from "../../lib/constants/listing-contact-activity-actions";
import type { ListingContactActivityDetailsMap } from "../../types/listing-contact-activity-details";

export interface CreateListingContactActivityFormData {
  listingContactId: string | bigint;
  action: string;
  notes: string;
  topic?: string;
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
    } catch (error) {
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

    // Extract topic from notes if not provided (first 50 chars or first sentence)
    const topic =
      formData.topic?.trim() ||
      (() => {
        const notes = formData.notes.trim();
        const sentences = notes.split(/[.!?]/);
        const firstSentence = sentences[0]?.trim() || "";
        if (firstSentence && firstSentence.length > 50) {
          return firstSentence.substring(0, 50) + "...";
        }
        return firstSentence || notes.substring(0, 50);
      })();

    // Prepare details based on action type
    // For simple note-based actions, we'll use a generic structure
    const details: Record<string, unknown> = {
      notes: formData.notes.trim(),
      topic,
    };

    // Log the activity using the helper function
    await logListingContactActivity({
      listingContactId,
      userId: currentUser.id,
      action: validatedAction,
      details: details as unknown as ListingContactActivityDetailsMap[typeof validatedAction],
    });

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

