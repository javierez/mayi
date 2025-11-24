/**
 * Task comment type definitions for task-based comments system
 * Uses task_comments table with hierarchical structure and user relationships
 */

export interface TaskComment {
  commentId: bigint;
  taskId: bigint;
  userId: string;
  content: string;
  parentId?: bigint | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskCommentWithUser extends TaskComment {
  user: {
    id: string;
    name: string;
    firstName?: string | null;
    lastName?: string | null;
    image?: string | null;
    initials: string;
  };
  replies: TaskCommentWithUser[];
}

export interface CreateTaskCommentFormData {
  taskId: string | bigint;
  content: string;
  parentId?: string | bigint | null;
}

export interface UpdateTaskCommentFormData {
  commentId: string | bigint;
  content: string;
}

export interface TaskCommentActionResult {
  success: boolean;
  error?: string;
  data?: TaskComment;
}

export interface TaskCommentFilters {
  taskId?: bigint;
  userId?: string;
  parentId?: bigint | null;
  isDeleted?: boolean;
}
