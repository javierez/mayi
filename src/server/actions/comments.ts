"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserAccountId, getCurrentUser } from "~/lib/dal";
import { db } from "~/server/db";
import { comments } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import type {
  CreateCommentFormData,
  UpdateCommentFormData,
  CommentActionResult,
} from "~/types/comments";
import { canUserModifyComment } from "~/server/queries/comments";

// Server action for creating a new comment
export async function createCommentAction(
  formData: CreateCommentFormData,
): Promise<CommentActionResult> {
  try {
    // PATTERN: Always get account ID and current user for security
    await getCurrentUserAccountId();
    const currentUser = await getCurrentUser();

    if (!currentUser?.id) {
      return {
        success: false,
        error: "Usuario no autenticado",
      };
    }

    // Validate required fields
    if (!formData.content?.trim()) {
      return {
        success: false,
        error: "El contenido del comentario es requerido",
      };
    }

    if (!formData.listingId || !formData.propertyId) {
      return {
        success: false,
        error: "ID de propiedad y listing son requeridos",
      };
    }

    // CRITICAL: Convert form data to database format
    const commentData = {
      listingId: BigInt(formData.listingId),
      propertyId: BigInt(formData.propertyId),
      userId: currentUser.id,
      content: formData.content.trim(),
      category: formData.category ?? null,
      parentId: formData.parentId ? BigInt(formData.parentId) : null,
      isDeleted: false,
    };

    console.log("Creating comment with data:", commentData);

    // PATTERN: Use database insert with proper error handling
    const [result] = await db
      .insert(comments)
      .values(commentData)
      .returning();

    if (!result) {
      return {
        success: false,
        error: "Error al crear el comentario",
      };
    }

    console.log("Comment created successfully with ID:", result.commentId);

    // PATTERN: Revalidate path after mutation
    revalidatePath(`/dashboard/propiedades/${formData.propertyId}`);

    return {
      success: true,
      data: {
        commentId: result.commentId,
        listingId: commentData.listingId,
        propertyId: commentData.propertyId,
        userId: commentData.userId,
        content: commentData.content,
        category: commentData.category,
        parentId: commentData.parentId,
        isDeleted: commentData.isDeleted,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  } catch (error) {
    console.error("Error creating comment:", error);
    return {
      success: false,
      error: "Error interno del servidor al crear el comentario",
    };
  }
}

// Server action for updating an existing comment
export async function updateCommentAction(
  formData: UpdateCommentFormData,
): Promise<CommentActionResult> {
  try {
    // PATTERN: Always get account ID and current user for security
    const accountId = await getCurrentUserAccountId();
    const currentUser = await getCurrentUser();

    if (!currentUser?.id) {
      return {
        success: false,
        error: "Usuario no autenticado",
      };
    }

    // Validate required fields
    if (!formData.content?.trim()) {
      return {
        success: false,
        error: "El contenido del comentario es requerido",
      };
    }

    if (!formData.commentId) {
      return {
        success: false,
        error: "ID de comentario es requerido",
      };
    }

    const commentId = BigInt(formData.commentId);

    // PATTERN: Check user permissions before modification
    const canModify = await canUserModifyComment(
      commentId,
      currentUser.id,
      accountId,
    );

    if (!canModify) {
      return {
        success: false,
        error: "No tienes permisos para editar este comentario",
      };
    }

    console.log(
      "Updating comment:",
      commentId,
      "with content:",
      formData.content,
    );

    // PATTERN: Use database update with proper conditions
    await db
      .update(comments)
      .set({
        content: formData.content.trim(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(comments.commentId, commentId),
          eq(comments.userId, currentUser.id),
          eq(comments.isDeleted, false),
        ),
      );

    console.log("Comment updated successfully");

    // Get property ID for revalidation
    const [comment] = await db
      .select({ propertyId: comments.propertyId })
      .from(comments)
      .where(eq(comments.commentId, commentId));

    if (comment?.propertyId) {
      revalidatePath(`/dashboard/propiedades/${comment.propertyId}`);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating comment:", error);
    return {
      success: false,
      error: "Error interno del servidor al actualizar el comentario",
    };
  }
}

// Server action for soft deleting a comment
export async function deleteCommentAction(
  commentId: bigint,
): Promise<CommentActionResult> {
  try {
    // PATTERN: Always get account ID and current user for security
    const accountId = await getCurrentUserAccountId();
    const currentUser = await getCurrentUser();

    if (!currentUser?.id) {
      return {
        success: false,
        error: "Usuario no autenticado",
      };
    }

    if (!commentId) {
      return {
        success: false,
        error: "ID de comentario es requerido",
      };
    }

    // PATTERN: Check user permissions before modification
    const canModify = await canUserModifyComment(
      commentId,
      currentUser.id,
      accountId,
    );

    if (!canModify) {
      return {
        success: false,
        error: "No tienes permisos para eliminar este comentario",
      };
    }

    console.log("Soft deleting comment:", commentId);

    // Get property ID and check for replies before deletion
    const [comment] = await db
      .select({ propertyId: comments.propertyId, parentId: comments.parentId })
      .from(comments)
      .where(eq(comments.commentId, commentId));

    // Check if this comment has replies (only for parent comments)
    const replies =
      comment?.parentId === null
        ? await db
            .select({ commentId: comments.commentId })
            .from(comments)
            .where(
              and(
                eq(comments.parentId, commentId),
                eq(comments.isDeleted, false),
              ),
            )
        : [];

    console.log(
      `Comment has ${replies.length} replies that will also be deleted`,
    );

    // PATTERN: Cascade soft delete - delete parent and all replies
    if (comment?.parentId === null && replies.length > 0) {
      // Delete parent comment + all replies in a transaction-like approach
      await db
        .update(comments)
        .set({
          isDeleted: true,
          updatedAt: new Date(),
        })
        .where(
          and(eq(comments.parentId, commentId), eq(comments.isDeleted, false)),
        );
      console.log(`Cascade deleted ${replies.length} replies`);
    }

    // Delete the main comment
    await db
      .update(comments)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(comments.commentId, commentId),
          eq(comments.userId, currentUser.id),
        ),
      );

    console.log("Comment soft deleted successfully.");

    // Double check if the comment was actually deleted
    const [checkComment] = await db
      .select({ isDeleted: comments.isDeleted })
      .from(comments)
      .where(eq(comments.commentId, commentId));
    console.log("Comment after delete - isDeleted:", checkComment?.isDeleted);

    // PATTERN: Revalidate path after mutation
    if (comment?.propertyId) {
      revalidatePath(`/dashboard/propiedades/${comment.propertyId}`);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return {
      success: false,
      error: "Error interno del servidor al eliminar el comentario",
    };
  }
}
