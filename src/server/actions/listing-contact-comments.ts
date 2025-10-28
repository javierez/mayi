"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../../lib/dal";
import {
  createListingContactComment,
  updateListingContactComment,
  deleteListingContactComment,
  getListingContactCommentByIdWithAuth,
  type CreateListingContactCommentFormData,
  type UpdateListingContactCommentFormData,
  type ListingContactCommentActionResult,
} from "../queries/listing-contact-comments";

export async function createListingContactCommentAction(
  formData: CreateListingContactCommentFormData,
): Promise<ListingContactCommentActionResult> {
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

    if (!formData.listingContactId) {
      return { success: false, error: "ID de contacto de listado requerido" };
    }

    // Convert string IDs to BigInt if needed
    const listingContactId =
      typeof formData.listingContactId === "string"
        ? BigInt(formData.listingContactId)
        : formData.listingContactId;

    const parentId = formData.parentId
      ? typeof formData.parentId === "string"
        ? BigInt(formData.parentId)
        : formData.parentId
      : null;

    const comment = await createListingContactComment(
      {
        listingContactId,
        userId: currentUser.id,
        content: formData.content.trim(),
        category: formData.category ?? null,
        parentId,
      },
      Number(currentUser.accountId),
    );

    if (!comment) {
      return { success: false, error: "Error al crear el comentario" };
    }

    // Revalidate the page
    revalidatePath(`/operaciones/leads`);

    return {
      success: true,
      data: {
        commentId: BigInt(comment.commentId),
        listingContactId: BigInt(comment.listingContactId),
        userId: comment.userId,
        content: comment.content,
        category: comment.category ?? null,
        parentId: comment.parentId ? BigInt(comment.parentId) : null,
        isDeleted: comment.isDeleted ?? false,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      },
    };
  } catch (error) {
    console.error("Error in createListingContactCommentAction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
}

export async function updateListingContactCommentAction(
  formData: UpdateListingContactCommentFormData,
): Promise<ListingContactCommentActionResult> {
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
    const existingComment = await getListingContactCommentByIdWithAuth(commentId);
    if (!existingComment) {
      return { success: false, error: "Comentario no encontrado" };
    }

    if (existingComment.userId !== currentUser.id) {
      return {
        success: false,
        error: "Solo puedes editar tus propios comentarios",
      };
    }

    await updateListingContactComment(
      commentId,
      formData.content.trim(),
      Number(currentUser.accountId),
      formData.category,
    );

    // Revalidate the page
    revalidatePath(`/operaciones/leads`);

    return { success: true };
  } catch (error) {
    console.error("Error in updateListingContactCommentAction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
}

export async function deleteListingContactCommentAction(
  commentId: bigint,
): Promise<ListingContactCommentActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: "No tienes permisos para eliminar comentarios",
      };
    }

    // Verify the comment exists and belongs to the current user
    const existingComment = await getListingContactCommentByIdWithAuth(commentId);
    if (!existingComment) {
      return { success: false, error: "Comentario no encontrado" };
    }

    if (existingComment.userId !== currentUser.id) {
      return {
        success: false,
        error: "Solo puedes eliminar tus propios comentarios",
      };
    }

    await deleteListingContactComment(commentId, Number(currentUser.accountId));

    // Revalidate the page
    revalidatePath(`/operaciones/leads`);

    return { success: true };
  } catch (error) {
    console.error("Error in deleteListingContactCommentAction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error interno del servidor",
    };
  }
}
