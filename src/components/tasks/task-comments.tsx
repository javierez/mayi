"use client";

import { useState, useTransition, useOptimistic } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card, CardContent } from "~/components/ui/card";
import {
  MessageCircle,
  Reply,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { clsx } from "clsx";
import type { TaskCommentWithUser } from "~/types/task-comments";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { PushToTalkWhisperButton } from "~/components/shared/push-to-talk-whisper-button";

// Extended Comment type with status
interface CommentWithStatus extends TaskCommentWithUser {
  status?: "sending" | "sent" | "error";
}

interface TaskCommentsProps {
  taskId: bigint;
  initialComments?: TaskCommentWithUser[];
  currentUserId?: string;
  currentUser?: {
    id: string;
    name?: string;
    image?: string;
  };
  onAddComment: (
    comment: TaskCommentWithUser,
  ) => Promise<{ success: boolean; error?: string }>;
  onEditComment: (
    commentId: bigint,
    content: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteComment: (
    commentId: bigint,
  ) => Promise<{ success: boolean; error?: string }>;
}

interface TaskCommentItemProps {
  comment: CommentWithStatus;
  isReply?: boolean;
  currentUserId?: string;
  replyingTo: bigint | null;
  setReplyingTo: (id: bigint | null) => void;
  replyContents: Record<string, string>;
  setReplyContents: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  editingComment: bigint | null;
  setEditingComment: (id: bigint | null) => void;
  editContent: string;
  setEditContent: (content: string) => void;
  isPending: boolean;
  isDeleting: boolean;
  handleAddReply: (parentId: bigint) => Promise<void>;
  handleEditComment: (commentId: bigint) => Promise<void>;
  handleDeleteComment: (commentId: bigint) => Promise<void>;
  startEditingComment: (comment: TaskCommentWithUser) => void;
  cancelEditing: () => void;
  setCommentToDelete: (id: bigint | null) => void;
  setDeleteConfirmOpen: (open: boolean) => void;
}

function TaskCommentItem({
  comment,
  isReply = false,
  currentUserId,
  replyingTo,
  setReplyingTo,
  replyContents,
  setReplyContents,
  editingComment,
  setEditingComment,
  editContent,
  setEditContent,
  isPending,
  isDeleting,
  handleAddReply,
  handleEditComment,
  handleDeleteComment,
  startEditingComment,
  cancelEditing,
  setCommentToDelete,
  setDeleteConfirmOpen,
}: TaskCommentItemProps) {
  return (
    <div className={clsx("max-w-full", isReply && "ml-12 pl-4")}>
      <div className="flex space-x-3 max-w-full">
        <Avatar className={clsx("flex-shrink-0", isReply ? "h-8 w-8" : "h-10 w-10")}>
          <AvatarImage src={comment.user.image ?? undefined} />
          <AvatarFallback className={clsx(isReply ? "text-xs" : "text-sm")}>
            {comment.user.initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 max-w-full overflow-hidden">
          <div
            className={clsx(
              "group relative rounded-2xl px-4 py-3",
              comment.userId === "temp"
                ? "bg-blue-50 opacity-70 shadow-sm"
                : isReply
                  ? "bg-white shadow-sm"
                  : "bg-gray-50 shadow-md"
            )}
          >
            {/* Action buttons - top right */}
            <div className="absolute right-2 top-2 flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
              {!isReply && (
                <button
                  onClick={() => {
                    if (replyingTo === comment.commentId) {
                      setReplyingTo(null);
                      setReplyContents((prev) => ({
                        ...prev,
                        [comment.commentId.toString()]: "",
                      }));
                    } else {
                      setReplyingTo(comment.commentId);
                    }
                  }}
                  className="rounded p-1 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
                  title="Responder"
                >
                  <Reply className="h-3 w-3" />
                </button>
              )}

              {currentUserId === comment.userId &&
                editingComment !== comment.commentId && (
                  <>
                    <button
                      onClick={() => startEditingComment(comment)}
                      className="rounded p-1 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
                      title="Editar"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>

                    <button
                      onClick={() => {
                        setCommentToDelete(comment.commentId);
                        setDeleteConfirmOpen(true);
                      }}
                      className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </>
                )}
            </div>

            <div className="flex flex-col items-start space-y-1 pr-16">
              <div className="flex items-center space-x-2">
                <span
                  className={clsx("font-semibold", isReply ? "text-xs" : "text-sm")}
                >
                  {comment.user.name}
                </span>

                {/* Status indicator */}
                {comment.status === "sending" && (
                  <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                )}
                {comment.status === "sent" &&
                  currentUserId === comment.userId && (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  )}
                {comment.status === "error" && (
                  <div
                    className="h-3 w-3 rounded-full bg-red-500"
                    title="Error al enviar"
                  />
                )}
              </div>

              <span
                className={clsx("text-gray-500", isReply ? "text-xs" : "text-xs")}
              >
                {formatDistanceToNow(comment.createdAt, {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </div>
            {editingComment === comment.commentId ? (
              <div className="mt-2">
                <div className="relative">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[60px] resize-none pr-10"
                  />
                  <div className="absolute right-2 top-2">
                    <PushToTalkWhisperButton
                      onTranscript={(text) => {
                        setEditContent(
                          editContent ? `${editContent} ${text}`.trim() : text
                        );
                      }}
                      language="es"
                    />
                  </div>
                </div>
                <div className="mt-2 flex justify-end space-x-2">
                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleEditComment(comment.commentId)}
                    disabled={!editContent.trim()}
                  >
                    Guardar
                  </Button>
                </div>
              </div>
            ) : (
              <p
                className={clsx("mt-1 text-gray-900 break-words whitespace-pre-wrap", isReply ? "text-xs" : "text-sm")}
              >
                {comment.content}
              </p>
            )}
          </div>

          {replyingTo === comment.commentId && (
            <div className="mt-3 flex space-x-3 max-w-full">
              <div className="relative flex-1 min-w-0 max-w-full">
                <Textarea
                  placeholder={`Responder a ${comment.user.name}...`}
                  value={replyContents[comment.commentId.toString()] ?? ""}
                  onChange={(e) =>
                    setReplyContents((prev) => ({
                      ...prev,
                      [comment.commentId.toString()]: e.target.value,
                    }))
                  }
                  className="min-h-[60px] resize-none border-gray-200 pr-10"
                />
                <div className="absolute right-2 top-2">
                  <PushToTalkWhisperButton
                    onTranscript={(text) => {
                      setReplyContents((prev) => {
                        const current = prev[comment.commentId.toString()] ?? "";
                        return {
                          ...prev,
                          [comment.commentId.toString()]: current
                            ? `${current} ${text}`.trim()
                            : text,
                        };
                      });
                    }}
                    language="es"
                  />
                </div>
              </div>
              <div className="mt-2 flex justify-end space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContents((prev) => ({
                        ...prev,
                        [comment.commentId.toString()]: "",
                      }));
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAddReply(comment.commentId)}
                    disabled={
                      !(
                        replyContents[comment.commentId.toString()] ?? ""
                      ).trim()
                    }
                  >
                    Responder
                  </Button>
                </div>
            </div>
          )}

          {comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <TaskCommentItem
                  key={reply.commentId.toString()}
                  comment={reply}
                  isReply={true}
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TaskComments({
  taskId,
  initialComments = [],
  currentUserId,
  currentUser,
  onAddComment,
  onEditComment,
  onDeleteComment,
}: TaskCommentsProps) {
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
    initialComments.map((comment) => ({ ...comment, status: "sent" as const })),
    (
      state: CommentWithStatus[],
      action: {
        type: string;
        comment?: CommentWithStatus;
        commentId?: string;
        status?: "sending" | "sent" | "error";
        updatedComment?: CommentWithStatus;
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
              // Also check replies
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
              // Also check replies
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
      taskId,
      userId: currentUserId ?? "temp",
      content: newComment,
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

    // Clear form immediately so user can type more
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
      taskId,
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

    // Clear form and close reply UI immediately so user can continue
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

    // Store edit content and exit edit mode immediately for instant UX
    const newContent = editContent;
    setEditingComment(null);
    setEditContent("");

    // Call parent function - parent handles optimistic updates
    startTransition(async () => {
      try {
        const result = await onEditComment(commentId, newContent);

        if (!result.success) {
          toast.error(result.error ?? "Error al editar la nota");
        } else {
          toast.success("Nota editada exitosamente");
        }
      } catch (error) {
        console.error("Error editing comment:", error);
        toast.error("Error interno del servidor");
      }
    });
  };

  const handleDeleteComment = async (commentId: bigint) => {
    // Call parent function - parent handles optimistic updates
    startDeleteTransition(async () => {
      try {
        const result = await onDeleteComment(commentId);

        if (!result.success) {
          toast.error(result.error ?? "Error al eliminar la nota");
        } else {
          toast.success("Nota eliminada exitosamente");
        }
      } catch (error) {
        console.error("Error deleting comment:", error);
        toast.error("Error interno del servidor");
      }
    });
  };

  const startEditingComment = (comment: TaskCommentWithUser) => {
    setEditingComment(comment.commentId);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent("");
  };

  return (
    <div className="mt-7 space-y-1">
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentUser?.image ?? undefined} />
              <AvatarFallback>{getCurrentUserInitials()}</AvatarFallback>
            </Avatar>
            <div className="relative flex-1">
              <Textarea
                placeholder="Escribe una nota..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] resize-none border-gray-200 pr-10"
              />
              <div className="absolute right-2 top-2">
                <PushToTalkWhisperButton
                  onTranscript={(text) => {
                    setNewComment((prev) => (prev ? `${prev} ${text}`.trim() : text));
                  }}
                  language="es"
                  disabled={isPending}
                />
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="flex h-8 items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Añadir nota
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-1">
        {optimisticComments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">
                No hay notas aún. ¡Añade la primera nota!
              </p>
            </CardContent>
          </Card>
        ) : (
          optimisticComments.map((comment) => (
            <Card key={comment.commentId.toString()}>
              <CardContent className="p-4">
                <TaskCommentItem
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
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Eliminar nota"
        description={(() => {
          if (!commentToDelete)
            return "¿Estás seguro de que quieres eliminar esta nota? Esta acción no se puede deshacer.";

          const comment = optimisticComments.find(
            (c) => c.commentId === commentToDelete,
          );
          const replyCount = comment?.replies?.length ?? 0;

          if (replyCount > 0) {
            return `Esta nota tiene ${replyCount} respuesta${replyCount > 1 ? "s" : ""}. Al eliminarla también se eliminarán todas las respuestas. ¿Estás seguro? Esta acción no se puede deshacer.`;
          }

          return "¿Estás seguro de que quieres eliminar esta nota? Esta acción no se puede deshacer.";
        })()}
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
    </div>
  );
}
