"use server";

import { revalidatePath } from "next/cache";
import { requireCoupleSession, getCurrentCoupleId } from "~/lib/dal-couples";
import {
  getCommentsForMemory,
  addComment,
  updateComment,
  deleteComment,
  canUserModifyComment,
} from "~/server/queries/memoria/comments";
import { verifyMemoryBelongsToCouple, getMemoryById } from "~/server/queries/memoria/memories";
import { getDayById } from "~/server/queries/memoria/days";
import type { ActionResult, Comment } from "~/types/memoria";

/**
 * Get all comments for a memory
 */
export async function getCommentsAction(
  memoryId: string
): Promise<ActionResult<Comment[]>> {
  try {
    const coupleId = await getCurrentCoupleId();

    // Verify memory belongs to couple
    const belongs = await verifyMemoryBelongsToCouple(
      BigInt(memoryId),
      coupleId
    );
    if (!belongs) {
      return { success: false, error: "Recuerdo no encontrado" };
    }

    const comments = await getCommentsForMemory(BigInt(memoryId));
    return { success: true, data: comments };
  } catch (error) {
    console.error("Error getting comments:", error);
    return { success: false, error: "Error al cargar comentarios" };
  }
}

/**
 * Add a comment to a memory
 */
export async function addCommentAction(
  memoryId: string,
  content: string,
  parentId?: string
): Promise<ActionResult<Comment>> {
  try {
    const session = await requireCoupleSession();
    const coupleId = session.user.coupleId;

    // Verify memory belongs to couple
    const belongs = await verifyMemoryBelongsToCouple(
      BigInt(memoryId),
      coupleId
    );
    if (!belongs) {
      return { success: false, error: "Recuerdo no encontrado" };
    }

    const comment = await addComment(
      BigInt(memoryId),
      session.user.id,
      content,
      parentId ? BigInt(parentId) : undefined
    );

    // Revalidate paths
    const memory = await getMemoryById(BigInt(memoryId));
    if (memory) {
      const day = await getDayById(memory.dayId);
      if (day) {
        revalidatePath(`/dia/${day.date}`);
      }
    }
    revalidatePath(`/recuerdo/${memoryId}`);

    return { success: true, data: comment };
  } catch (error) {
    console.error("Error adding comment:", error);
    return { success: false, error: "Error al añadir comentario" };
  }
}

/**
 * Update a comment
 */
export async function updateCommentAction(
  commentId: string,
  content: string
): Promise<ActionResult<Comment>> {
  try {
    const session = await requireCoupleSession();

    // Verify user can modify
    const canModify = await canUserModifyComment(
      BigInt(commentId),
      session.user.id
    );
    if (!canModify) {
      return { success: false, error: "No tienes permiso para editar este comentario" };
    }

    const comment = await updateComment(BigInt(commentId), content);
    if (!comment) {
      return { success: false, error: "Comentario no encontrado" };
    }

    revalidatePath(`/recuerdo/${comment.memoryId.toString()}`);
    return { success: true, data: comment };
  } catch (error) {
    console.error("Error updating comment:", error);
    return { success: false, error: "Error al actualizar comentario" };
  }
}

/**
 * Delete a comment
 */
export async function deleteCommentAction(
  commentId: string
): Promise<ActionResult<void>> {
  try {
    const session = await requireCoupleSession();

    // Verify user can modify
    const canModify = await canUserModifyComment(
      BigInt(commentId),
      session.user.id
    );
    if (!canModify) {
      return { success: false, error: "No tienes permiso para eliminar este comentario" };
    }

    await deleteComment(BigInt(commentId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return { success: false, error: "Error al eliminar comentario" };
  }
}
