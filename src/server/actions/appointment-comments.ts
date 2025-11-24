"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../../lib/dal";
import {
  createAppointmentComment,
  updateAppointmentComment,
  deleteAppointmentComment,
  getAppointmentCommentByIdWithAuth,
} from "../queries/appointment-comments";
import type {
  CreateAppointmentCommentFormData,
  UpdateAppointmentCommentFormData,
  AppointmentCommentActionResult,
} from "../../types/appointment-comments";

export async function createAppointmentCommentAction(
  formData: CreateAppointmentCommentFormData,
): Promise<AppointmentCommentActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: "No tienes permisos para crear comentarios",
      };
    }

    // Validate input
    if (!formData.content?.trim()) {
      return {
        success: false,
        error: "El contenido del comentario no puede estar vacío",
      };
    }

    if (!formData.appointmentId) {
      return { success: false, error: "ID de cita requerido" };
    }

    // Convert string IDs to BigInt if needed
    const appointmentId =
      typeof formData.appointmentId === "string"
        ? BigInt(formData.appointmentId)
        : formData.appointmentId;

    const parentId = formData.parentId
      ? typeof formData.parentId === "string"
        ? BigInt(formData.parentId)
        : formData.parentId
      : null;

    const comment = await createAppointmentComment(
      {
        appointmentId,
        userId: currentUser.id,
        content: formData.content.trim(),
        parentId,
      },
      Number(currentUser.accountId),
    );

    if (!comment) {
      return { success: false, error: "Error al crear el comentario" };
    }

    // Revalidate the calendar to show new comment
    revalidatePath("/calendario");

    return {
      success: true,
      data: {
        commentId: BigInt(comment.commentId),
        appointmentId: BigInt(comment.appointmentId),
        userId: comment.userId,
        content: comment.content,
        parentId: comment.parentId ? BigInt(comment.parentId) : null,
        isDeleted: comment.isDeleted ?? false,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      },
    };
  } catch (error) {
    console.error("Error in createAppointmentCommentAction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
}

export async function updateAppointmentCommentAction(
  formData: UpdateAppointmentCommentFormData,
): Promise<AppointmentCommentActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: "No tienes permisos para editar comentarios",
      };
    }

    // Validate input
    if (!formData.content?.trim()) {
      return {
        success: false,
        error: "El contenido del comentario no puede estar vacío",
      };
    }

    if (!formData.commentId) {
      return { success: false, error: "ID de comentario requerido" };
    }

    // Convert string ID to BigInt if needed
    const commentId =
      typeof formData.commentId === "string"
        ? BigInt(formData.commentId)
        : formData.commentId;

    // Verify the comment exists and belongs to the current user
    const existingComment = await getAppointmentCommentByIdWithAuth(commentId);
    if (!existingComment) {
      return { success: false, error: "Comentario no encontrado" };
    }

    if (existingComment.userId !== currentUser.id) {
      return {
        success: false,
        error: "Solo puedes editar tus propios comentarios",
      };
    }

    await updateAppointmentComment(
      commentId,
      formData.content.trim(),
      Number(currentUser.accountId),
    );

    // Revalidate the calendar to show updated comment
    revalidatePath("/calendario");

    return { success: true };
  } catch (error) {
    console.error("Error in updateAppointmentCommentAction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
}

export async function deleteAppointmentCommentAction(
  commentId: bigint,
): Promise<AppointmentCommentActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: "No tienes permisos para eliminar comentarios",
      };
    }

    // Verify the comment exists and belongs to the current user
    const existingComment = await getAppointmentCommentByIdWithAuth(commentId);
    if (!existingComment) {
      return { success: false, error: "Comentario no encontrado" };
    }

    if (existingComment.userId !== currentUser.id) {
      return {
        success: false,
        error: "Solo puedes eliminar tus propios comentarios",
      };
    }

    await deleteAppointmentComment(commentId, Number(currentUser.accountId));

    // Revalidate the calendar to hide deleted comment
    revalidatePath("/calendario");

    return { success: true };
  } catch (error) {
    console.error("Error in deleteAppointmentCommentAction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
}
