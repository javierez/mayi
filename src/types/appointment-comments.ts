/**
 * Appointment comment type definitions for appointment-based comments system
 * Uses appointment_comments table with hierarchical structure and user relationships
 */

export interface AppointmentComment {
  commentId: bigint;
  appointmentId: bigint;
  userId: string;
  content: string;
  parentId?: bigint | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentCommentWithUser extends AppointmentComment {
  user: {
    id: string;
    name: string;
    firstName?: string | null;
    lastName?: string | null;
    image?: string | null;
    initials: string;
  };
  replies: AppointmentCommentWithUser[];
}

export interface CreateAppointmentCommentFormData {
  appointmentId: string | bigint;
  content: string;
  parentId?: string | bigint | null;
}

export interface UpdateAppointmentCommentFormData {
  commentId: string | bigint;
  content: string;
}

export interface AppointmentCommentActionResult {
  success: boolean;
  error?: string;
  data?: AppointmentComment;
}

export interface AppointmentCommentFilters {
  appointmentId?: bigint;
  userId?: string;
  parentId?: bigint | null;
  isDeleted?: boolean;
}
