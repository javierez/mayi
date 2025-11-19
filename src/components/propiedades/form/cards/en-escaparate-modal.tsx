"use client";

import { useState, useTransition, useOptimistic } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { CommentWithUser } from "~/types/comments";
import { CommentItem, type CommentWithStatus } from "~/components/propiedades/detail/comments";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { PushToTalkWhisperButton } from "~/components/shared/push-to-talk-whisper-button";

interface EnEscaparateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: bigint;
  propertyId: bigint;
  currentUserId?: string;
  currentUser?: {
    id: string;
    name?: string;
    image?: string;
  };
  onAddComment: (
    comment: CommentWithUser,
  ) => Promise<{ success: boolean; error?: string }>;
  onEditComment: (
    commentId: bigint,
    content: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteComment: (
    commentId: bigint,
  ) => Promise<{ success: boolean; error?: string }>;
  enEscaparateComments?: CommentWithUser[];
}

export function EnEscaparateModal({
  open,
  onOpenChange,
  listingId,
  propertyId,
  currentUserId,
  currentUser,
  onAddComment,
  onEditComment,
  onDeleteComment,
  enEscaparateComments,
}: EnEscaparateModalProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<bigint | null>(null);

  // Generate initials from user name
  const getCurrentUserInitials = () => {
    if (!currentUser?.name) return "UA";
    const parts = currentUser.name.split(" ").filter((p) => p.length > 0);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    } else if (parts.length === 1 && parts[0]) {
      return parts[0].charAt(0).toUpperCase();
    }
    return "UA";
  };

  // Optimistic comments with status tracking
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    enEscaparateComments
      ? enEscaparateComments.map((c) => ({ ...c, status: "sent" as const }))
      : [],
    (
      state: CommentWithStatus[],
      action: {
        type: string;
        comment?: CommentWithStatus;
        commentId?: string;
        status?: "sending" | "sent" | "error";
        parentId?: string;
        reply?: CommentWithStatus;
        content?: string;
      },
    ) => {
      switch (action.type) {
        case "ADD_COMMENT":
          return action.comment ? [action.comment, ...state] : state;

        case "ADD_REPLY":
          return state.map((comment) => {
            if (
              comment.commentId.toString() === action.parentId &&
              action.reply
            ) {
              return {
                ...comment,
                replies: [
                  ...comment.replies.map((r) => ({
                    ...r,
                    status: "sent" as const,
                  })),
                  action.reply,
                ],
              };
            }
            return comment;
          });

        case "UPDATE_COMMENT":
          if (action.content && action.commentId) {
            return state.map((comment) => {
              if (comment.commentId.toString() === action.commentId) {
                return { ...comment, content: action.content! };
              }
              return {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply.commentId.toString() === action.commentId
                    ? { ...reply, content: action.content! }
                    : reply,
                ),
              };
            });
          }
          return state;

        case "UPDATE_STATUS":
          if (action.commentId && action.status) {
            return state.map((comment) => {
              if (comment.commentId.toString() === action.commentId) {
                return { ...comment, status: action.status! };
              }
              return {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply.commentId.toString() === action.commentId
                    ? { ...reply, status: action.status! }
                    : reply,
                ),
              };
            });
          }
          return state;

        case "DELETE_COMMENT":
          return state.filter(
            (c) => c.commentId.toString() !== action.commentId,
          );

        case "DELETE_REPLY":
          return state.map((comment) => ({
            ...comment,
            replies: comment.replies.filter(
              (reply) => reply.commentId.toString() !== action.commentId,
            ),
          }));

        default:
          return state;
      }
    },
  );

  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<bigint | null>(null);
  const [replyContents, setReplyContents] = useState<Record<string, string>>(
    {},
  );
  const [editingComment, setEditingComment] = useState<bigint | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const tempComment: CommentWithStatus = {
      commentId: BigInt(Date.now()),
      listingId,
      propertyId,
      userId: currentUserId ?? "temp",
      content: newComment,
      category: "enEscaparate",
      parentId: null,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: currentUserId ?? "temp",
        name: currentUser?.name ?? "Usuario",
        initials: getCurrentUserInitials(),
        image: currentUser?.image,
      },
      replies: [],
      status: "sending",
    };

    // Clear form immediately
    setNewComment("");

    // Call parent function and add optimistic comment inside transition
    startTransition(async () => {
      // Add optimistic comment with "sending" status
      addOptimisticComment({ type: "ADD_COMMENT", comment: tempComment });
      try {
        const result = await onAddComment(tempComment);

        if (!result.success) {
          // Update status to error
          addOptimisticComment({
            type: "UPDATE_STATUS",
            commentId: tempComment.commentId.toString(),
            status: "error",
          });
          toast.error(result.error ?? "Error al crear la nota");
        } else {
          // Update status to sent
          addOptimisticComment({
            type: "UPDATE_STATUS",
            commentId: tempComment.commentId.toString(),
            status: "sent",
          });
        }
      } catch (error) {
        console.error("Error creating comment:", error);
        // Update status to error
        addOptimisticComment({
          type: "UPDATE_STATUS",
          commentId: tempComment.commentId.toString(),
          status: "error",
        });
        toast.error("Error interno del servidor");
      }
    });
  };

  const handleAddReply = async (parentId: bigint) => {
    const content = replyContents[parentId.toString()] ?? "";
    if (!content.trim()) return;

    // Create reply with current user info and sending status
    const tempReply: CommentWithStatus = {
      commentId: BigInt(Date.now()),
      listingId,
      propertyId,
      userId: currentUserId ?? "temp",
      content: content,
      parentId: parentId,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: currentUserId ?? "temp",
        name: currentUser?.name ?? "Usuario",
        initials: getCurrentUserInitials(),
        image: currentUser?.image,
      },
      replies: [],
      status: "sending",
    };

    // Clear form and close reply UI immediately
    setReplyContents((prev) => ({ ...prev, [parentId.toString()]: "" }));
    setReplyingTo(null);

    // Call parent function and add optimistic reply inside transition
    startTransition(async () => {
      // Add optimistic reply with "sending" status
      addOptimisticComment({
        type: "ADD_REPLY",
        parentId: parentId.toString(),
        reply: tempReply,
      });
      try {
        const result = await onAddComment(tempReply);

        if (!result.success) {
          // Update status to error
          addOptimisticComment({
            type: "UPDATE_STATUS",
            commentId: tempReply.commentId.toString(),
            status: "error",
          });
          toast.error(result.error ?? "Error al crear la respuesta");
        } else {
          // Update status to sent
          addOptimisticComment({
            type: "UPDATE_STATUS",
            commentId: tempReply.commentId.toString(),
            status: "sent",
          });
        }
      } catch (error) {
        console.error("Error creating reply:", error);
        // Update status to error
        addOptimisticComment({
          type: "UPDATE_STATUS",
          commentId: tempReply.commentId.toString(),
          status: "error",
        });
        toast.error("Error interno del servidor");
      }
    });
  };

  const handleEditComment = async (commentId: bigint) => {
    if (!editContent.trim()) return;

    // Store edit content and exit edit mode immediately
    const newContent = editContent;
    setEditingComment(null);
    setEditContent("");

    // Call parent function
    startTransition(async () => {
      try {
        const result = await onEditComment(commentId, newContent);

        if (!result.success) {
          toast.error(result.error ?? "Error al editar la nota");
        } else {
          // Update optimistic comment
          addOptimisticComment({
            type: "UPDATE_COMMENT",
            commentId: commentId.toString(),
            content: newContent,
          });
          toast.success("Nota editada exitosamente");
        }
      } catch (error) {
        console.error("Error editing comment:", error);
        toast.error("Error interno del servidor");
      }
    });
  };

  const handleDeleteComment = async (commentId: bigint) => {
    // Call parent function
    startDeleteTransition(async () => {
      try {
        const result = await onDeleteComment(commentId);

        if (!result.success) {
          toast.error(result.error ?? "Error al eliminar la nota");
        } else {
          // Remove from optimistic comments
          addOptimisticComment({
            type: "DELETE_COMMENT",
            commentId: commentId.toString(),
          });
          toast.success("Nota eliminada exitosamente");
        }
      } catch (error) {
        console.error("Error deleting comment:", error);
        toast.error("Error interno del servidor");
      }
    });
  };

  const startEditingComment = (comment: CommentWithUser) => {
    setEditingComment(comment.commentId);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent("");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>En Escaparate</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Add New Comment */}
            <div className="rounded-lg p-4">
                <div className="relative">
                  <Textarea
                    placeholder="Escribe una nota sobre el escaparate..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] resize-none border-gray-200 pr-24"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-2">
                    <PushToTalkWhisperButton
                      onTranscript={(text) => {
                        setNewComment((prev) =>
                          prev ? `${prev} ${text}`.trim() : text,
                        );
                      }}
                      language="es"
                      disabled={isPending}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || isPending}
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    >
                      {isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Añadir nota"
                      )}
                    </Button>
                  </div>
                </div>
            </div>

            {/* Comments Section */}
            {optimisticComments.length > 0 && (
              <div className="space-y-3">
                {optimisticComments.map((comment) => (
                  <div key={comment.commentId.toString()}>
                    <CommentItem
                      comment={comment}
                      currentUserId={currentUserId}
                      replyingTo={replyingTo}
                      setReplyingTo={setReplyingTo}
                      replyContents={replyContents}
                      setReplyContents={setReplyContents}
                      editingComment={editingComment}
                      setEditingComment={setEditingComment}
                      editContent={editContent}
                      setEditContent={setEditContent}
                      isPending={isPending}
                      isDeleting={isDeleting}
                      handleAddReply={handleAddReply}
                      handleEditComment={handleEditComment}
                      handleDeleteComment={handleDeleteComment}
                      startEditingComment={startEditingComment}
                      cancelEditing={cancelEditing}
                      setCommentToDelete={setCommentToDelete}
                      setDeleteConfirmOpen={setDeleteConfirmOpen}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Eliminar nota"
        description={
          commentToDelete
            ? "¿Estás seguro de que quieres eliminar esta nota? Esta acción no se puede deshacer."
            : "¿Estás seguro de que quieres eliminar esta nota? Esta acción no se puede deshacer."
        }
        onConfirm={() => {
          if (commentToDelete) {
            void handleDeleteComment(commentToDelete);
            setCommentToDelete(null);
          }
        }}
        onCancel={() => setCommentToDelete(null)}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmVariant="destructive"
      />
    </>
  );
}

