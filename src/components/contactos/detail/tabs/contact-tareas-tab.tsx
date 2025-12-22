"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ContactTareas } from "../contact-tareas";
import { ContactComments } from "../contact-comments";
import { useSession } from "~/lib/auth-client";
import type { UnifiedComment, CommentSource } from "~/types/unified-comments";
import {
  updateContactTaskWithAuth,
  deleteContactTaskWithAuth,
} from "~/server/queries/task";
import { getContactTasksWithAuth } from "~/server/queries/user-comments";
import { getAllContactCommentsWithAuth } from "~/server/queries/unified-comments";
import {
  createUserCommentAction,
  updateUserCommentAction,
  deleteUserCommentAction,
} from "~/server/actions/user-comments";
import {
  createAppointmentCommentAction,
  updateAppointmentCommentAction,
  deleteAppointmentCommentAction,
} from "~/server/actions/appointment-comments";
import {
  createListingContactCommentAction,
  updateListingContactCommentAction,
  deleteListingContactCommentAction,
} from "~/server/actions/listing-contact-comments";

// Task interface matching what ContactTareas expects
interface Task {
  taskId?: bigint;
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate?: Date;
  completed: boolean;
  listingId?: bigint;
  leadId?: bigint;
  dealId?: bigint;
  appointmentId?: bigint;
  prospectId?: bigint;
  contactId?: bigint;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
  userName?: string;
  userFirstName?: string;
  userLastName?: string;
}

interface ContactTareasTabProps {
  contactId: bigint;
}

export function ContactTareasTab({ contactId }: ContactTareasTabProps) {
  const { data: session } = useSession();

  // State for unified comments (from all sources)
  const [contactComments, setContactComments] = useState<UnifiedComment[]>([]);
  const [, setIsLoadingComments] = useState(false);

  // State for tasks
  const [contactTasks, setContactTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Task update functions
  const handleToggleTaskCompleted = async (taskId: string) => {
    const task = contactTasks.find((t) => t.id === taskId);
    if (!task?.taskId) return;

    const newCompleted = !task.completed;
    // When completing, move to "finished"; when uncompleting, always move to "validation"
    const newStatus = newCompleted ? "finished" : "validation";

    // Optimistic update
    setContactTasks(
      contactTasks.map((t) =>
        t.id === taskId ? { ...t, completed: newCompleted } : t,
      ),
    );

    try {
      await updateContactTaskWithAuth(Number(task.taskId), {
        completed: newCompleted,
        status: newStatus,
      });
    } catch (error) {
      console.error("Error updating task:", error);
      // Revert optimistic update on error
      setContactTasks(
        contactTasks.map((t) =>
          t.id === taskId ? { ...t, completed: !newCompleted } : t,
        ),
      );
      toast.error("Error al actualizar la tarea");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = contactTasks.find((t) => t.id === taskId);
    if (!task?.taskId) return;

    // Optimistic update: remove from UI immediately
    const previousTasks = contactTasks;
    setContactTasks(contactTasks.filter((t) => t.id !== taskId));

    try {
      await deleteContactTaskWithAuth(Number(task.taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
      // Revert optimistic update on error
      setContactTasks(previousTasks);
      toast.error("Error al eliminar la tarea");
    }
  };

  const handleAddTask = async (newTask: Task) => {
    // Add task optimistically
    setContactTasks([newTask, ...contactTasks]);
    return newTask;
  };

  const handleUpdateTaskAfterSave = (optimisticId: string, savedTask: Task) => {
    // Update with server response
    setContactTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === optimisticId ? savedTask : task)),
    );
  };

  const handleRemoveOptimisticTask = (optimisticId: string) => {
    // Remove optimistic task on error
    setContactTasks((prevTasks) =>
      prevTasks.filter((task) => task.id !== optimisticId),
    );
  };

  // Unified comment handler - routes to correct action based on source
  const handleAddComment = async (tempComment: UnifiedComment) => {
    // Add comment optimistically
    setContactComments((prev) => [tempComment, ...prev]);

    // Route to correct action based on source
    try {
      let result: { success: boolean; error?: string };

      switch (tempComment.source) {
        case "contact":
          result = await createUserCommentAction({
            contactId: tempComment.contactId!,
            content: tempComment.content,
            parentId: tempComment.parentId,
          });
          break;
        case "appointment":
          result = await createAppointmentCommentAction({
            appointmentId: tempComment.appointmentId!,
            content: tempComment.content,
            parentId: tempComment.parentId,
          });
          break;
        case "listing_contact":
          result = await createListingContactCommentAction({
            listingContactId: tempComment.listingContactId!,
            content: tempComment.content,
            parentId: tempComment.parentId,
          });
          break;
        default:
          result = { success: false, error: "Unknown comment source" };
      }

      if (result.success) {
        // Refetch all comments to get server data
        const freshComments = await getAllContactCommentsWithAuth(contactId);
        setContactComments(freshComments);
      }

      return result;
    } catch (error) {
      // Remove optimistic comment on error
      setContactComments((prev) =>
        prev.filter((c) => c.commentId !== tempComment.commentId),
      );
      throw error;
    }
  };

  // Unified edit handler - routes to correct action based on source
  const handleEditComment = async (
    commentId: bigint,
    content: string,
    source: CommentSource,
  ) => {
    // Find original comment for potential revert
    const findCommentById = (
      comments: UnifiedComment[],
      id: bigint,
    ): UnifiedComment | null => {
      for (const comment of comments) {
        if (comment.commentId === id) return comment;
        const replyFound = findCommentById(comment.replies, id);
        if (replyFound) return replyFound;
      }
      return null;
    };

    const originalComment = findCommentById(contactComments, commentId);
    if (!originalComment) return { success: false, error: "Comment not found" };

    // Optimistic update
    const updateComment = (comments: UnifiedComment[]): UnifiedComment[] => {
      return comments.map((comment) => {
        if (comment.commentId === commentId) {
          return { ...comment, content };
        }
        return {
          ...comment,
          replies: updateComment(comment.replies),
        };
      });
    };

    setContactComments((prev) => updateComment(prev));

    try {
      let result: { success: boolean; error?: string };

      switch (source) {
        case "contact":
          result = await updateUserCommentAction({
            commentId,
            content,
          });
          break;
        case "appointment":
          result = await updateAppointmentCommentAction({
            commentId,
            content,
          });
          break;
        case "listing_contact":
          result = await updateListingContactCommentAction({
            commentId,
            content,
          });
          break;
        default:
          result = { success: false, error: "Unknown comment source" };
      }

      if (!result.success) {
        // Revert on failure
        setContactComments((prev) =>
          updateComment(prev).map((comment) => {
            if (comment.commentId === commentId) {
              return { ...comment, content: originalComment.content };
            }
            return {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply.commentId === commentId
                  ? { ...reply, content: originalComment.content }
                  : reply,
              ),
            };
          }),
        );
      }

      return result;
    } catch (error) {
      // Revert on error
      setContactComments((prev) =>
        updateComment(prev).map((comment) => {
          if (comment.commentId === commentId) {
            return { ...comment, content: originalComment.content };
          }
          return {
            ...comment,
            replies: comment.replies.map((reply) =>
              reply.commentId === commentId
                ? { ...reply, content: originalComment.content }
                : reply,
            ),
          };
        }),
      );
      throw error;
    }
  };

  // Unified delete handler - routes to correct action based on source
  const handleDeleteComment = async (commentId: bigint, source: CommentSource) => {
    // Store original state for revert
    const previousComments = contactComments;

    // Optimistic delete
    const deleteComment = (comments: UnifiedComment[]): UnifiedComment[] => {
      return comments
        .filter((c) => c.commentId !== commentId)
        .map((comment) => ({
          ...comment,
          replies: comment.replies.filter((r) => r.commentId !== commentId),
        }));
    };

    setContactComments((prev) => deleteComment(prev));

    try {
      let result: { success: boolean; error?: string };

      switch (source) {
        case "contact":
          result = await deleteUserCommentAction(commentId);
          break;
        case "appointment":
          result = await deleteAppointmentCommentAction(commentId);
          break;
        case "listing_contact":
          result = await deleteListingContactCommentAction(commentId);
          break;
        default:
          result = { success: false, error: "Unknown comment source" };
      }

      if (result.success) {
        // Refetch to ensure consistency
        const freshComments = await getAllContactCommentsWithAuth(contactId);
        setContactComments(freshComments);
      } else {
        // Revert on failure
        setContactComments(previousComments);
      }

      return result;
    } catch (error) {
      // Revert on error
      setContactComments(previousComments);
      throw error;
    }
  };

  // Function to fetch tasks (can be called independently)
  const fetchTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const tasks = await getContactTasksWithAuth(contactId);

      // Transform tasks to expected format
      const formattedTasks = tasks.map((task) => ({
        id: task.taskId?.toString() ?? Date.now().toString(),
        taskId: task.taskId ? BigInt(task.taskId) : undefined,
        userId: task.userId,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        dueTime: task.dueTime ?? undefined, // Include for accurate time remaining
        completed: task.completed ?? false,
        listingId: task.listingId ? BigInt(task.listingId) : undefined,
        leadId: task.listingContactId
          ? BigInt(task.listingContactId)
          : undefined,
        dealId: task.dealId ? BigInt(task.dealId) : undefined,
        appointmentId: task.appointmentId
          ? BigInt(task.appointmentId)
          : undefined,
        prospectId: task.prospectId ? BigInt(task.prospectId) : undefined,
        contactId: contactId,
        isActive: task.isActive ?? true,
        createdAt: new Date(task.createdAt),
        updatedAt: task.updatedAt ? new Date(task.updatedAt) : undefined,
        createdBy: task.createdBy ?? undefined,
        userName: task.userName ?? undefined,
        userFirstName: task.userFirstName ?? undefined,
        userLastName: task.userLastName ?? undefined,
        propertyTitle: task.propertyTitle ?? undefined,
      }));

      setContactTasks(formattedTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Error al cargar las tareas");
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Load unified comments and tasks for the contact
  useEffect(() => {
    const loadCommentsAndTasks = async () => {
      setIsLoadingComments(true);
      try {
        // Fetch unified comments from all sources
        const comments = await getAllContactCommentsWithAuth(contactId);
        setContactComments(comments);
      } catch (error) {
        console.error("Error loading comments:", error);
        toast.error("Error al cargar los comentarios");
      } finally {
        setIsLoadingComments(false);
      }

      // Fetch tasks separately
      await fetchTasks();
    };
    void loadCommentsAndTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left side - Tasks */}
        <div className="flex-1 lg:w-1/2">
          <ContactTareas
            contactId={contactId}
            tasks={contactTasks}
            loading={isLoadingTasks}
            onToggleCompleted={handleToggleTaskCompleted}
            onDeleteTask={handleDeleteTask}
            onAddTask={handleAddTask}
            onUpdateTaskAfterSave={handleUpdateTaskAfterSave}
            onRemoveOptimisticTask={handleRemoveOptimisticTask}
            onTaskCreated={fetchTasks}
          />
        </div>

        {/* Right side - Comments */}
        <div className="flex-1 lg:w-1/2">
          <h3 className="mb-2 text-lg font-semibold sm:text-xl">Notas</h3>
          <ContactComments
            contactId={contactId}
            initialComments={contactComments}
            currentUserId={session?.user?.id}
            currentUser={
              session?.user
                ? {
                    id: session.user.id,
                    name: session.user.name ?? undefined,
                    image: session.user.image ?? undefined,
                  }
                : undefined
            }
            onAddComment={handleAddComment}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
          />
        </div>
      </div>
    </div>
  );
}
