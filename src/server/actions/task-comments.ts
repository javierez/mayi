"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../../lib/dal";
import {
  createTaskComment,
  updateTaskComment,
  deleteTaskComment,
  getTaskCommentByIdWithAuth,
} from "../queries/task-comments";
import type {
  CreateTaskCommentFormData,
  UpdateTaskCommentFormData,
  TaskCommentActionResult,
} from "../../types/task-comments";

export async function createTaskCommentAction(
  formData: CreateTaskCommentFormData,
): Promise<TaskCommentActionResult> {
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

    if (!formData.taskId) {
      return { success: false, error: "ID de tarea requerido" };
    }

    // Convert string IDs to BigInt if needed
    const taskId =
      typeof formData.taskId === "string"
        ? BigInt(formData.taskId)
        : formData.taskId;

    const parentId = formData.parentId
      ? typeof formData.parentId === "string"
        ? BigInt(formData.parentId)
        : formData.parentId
      : null;

    const comment = await createTaskComment(
      {
        taskId,
        userId: currentUser.id,
        content: formData.content.trim(),
        parentId,
      },
      Number(currentUser.accountId),
    );

    if (!comment) {
      return { success: false, error: "Error al crear el comentario" };
    }

    // Revalidate the tasks page to show new comment
    revalidatePath("/tareas");

    return {
      success: true,
      data: {
        commentId: BigInt(comment.commentId),
        taskId: BigInt(comment.taskId),
        userId: comment.userId,
        content: comment.content,
        parentId: comment.parentId ? BigInt(comment.parentId) : null,
        isDeleted: comment.isDeleted ?? false,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      },
    };
  } catch (error) {
    console.error("Error in createTaskCommentAction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
}

export async function updateTaskCommentAction(
  formData: UpdateTaskCommentFormData,
): Promise<TaskCommentActionResult> {
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
    const existingComment = await getTaskCommentByIdWithAuth(commentId);
    if (!existingComment) {
      return { success: false, error: "Comentario no encontrado" };
    }

    if (existingComment.userId !== currentUser.id) {
      return {
        success: false,
        error: "Solo puedes editar tus propios comentarios",
      };
    }

    await updateTaskComment(
      commentId,
      formData.content.trim(),
      Number(currentUser.accountId),
    );

    // Revalidate the tasks page to show updated comment
    revalidatePath("/tareas");

    return { success: true };
  } catch (error) {
    console.error("Error in updateTaskCommentAction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
}

export async function deleteTaskCommentAction(
  commentId: bigint,
): Promise<TaskCommentActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: "No tienes permisos para eliminar comentarios",
      };
    }

    // Verify the comment exists and belongs to the current user
    const existingComment = await getTaskCommentByIdWithAuth(commentId);
    if (!existingComment) {
      return { success: false, error: "Comentario no encontrado" };
    }

    if (existingComment.userId !== currentUser.id) {
      return {
        success: false,
        error: "Solo puedes eliminar tus propios comentarios",
      };
    }

    await deleteTaskComment(commentId, Number(currentUser.accountId));

    // Revalidate the tasks page to hide deleted comment
    revalidatePath("/tareas");

    return { success: true };
  } catch (error) {
    console.error("Error in deleteTaskCommentAction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
}
