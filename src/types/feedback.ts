export type FeedbackStatus =
  | "submitted"
  | "backlog"
  | "evaluating"
  | "testing"
  | "ongoing"
  | "resolved";

export interface Feedback {
  feedbackId: bigint;
  userId: string;
  accountId: bigint;
  feedbackComment: string;
  scale: number;
  url: string | null;
  status: FeedbackStatus;
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedbackWithAccount extends Feedback {
  accountName: string | null;
  userName: string | null;
  userEmail: string | null;
}

export interface FeedbackKanbanColumn {
  id: FeedbackStatus;
  title: string;
  feedbacks: FeedbackWithAccount[];
  color: string;
}
