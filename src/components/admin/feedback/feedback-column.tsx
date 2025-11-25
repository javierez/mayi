"use client";

import { useDroppable } from "@dnd-kit/core";
import { FeedbackCard } from "./feedback-card";
import type { FeedbackWithAccount } from "~/types/feedback";
import { cn } from "~/lib/utils";

interface FeedbackColumnProps {
  id: string;
  title: string;
  feedbacks: FeedbackWithAccount[];
  color: string;
  onToggleResolved: (feedbackId: string, currentResolved: boolean) => void;
  onFeedbackClick: (feedbackId: string) => void;
}

export function FeedbackColumn({
  id,
  title,
  feedbacks,
  color: _color,
  onToggleResolved,
  onFeedbackClick,
}: FeedbackColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "column",
      status: id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-64 shrink-0 flex-col transition-colors",
        isOver && "opacity-60",
      )}
    >
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium font-mono tracking-wider uppercase text-foreground">
            {title}
          </h3>
          <span className="text-xs text-muted-foreground">{feedbacks.length}</span>
        </div>
        <div className="mt-1 h-px w-full bg-border" />
      </div>
      <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto px-1">
        {feedbacks.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-xs text-muted-foreground">
              Arrastra feedback aquí
            </p>
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <FeedbackCard
              key={feedback.feedbackId.toString()}
              feedback={feedback}
              onToggleResolved={onToggleResolved}
              onClick={onFeedbackClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
