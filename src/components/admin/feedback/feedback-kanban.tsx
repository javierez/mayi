"use client";

import { useState, useMemo, useRef } from "react";
import {
  DndContext,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { FeedbackColumn } from "./feedback-column";
import { FeedbackDragOverlay } from "./feedback-drag-overlay";
import { FeedbackDetailSheet } from "./feedback-detail-sheet";
import { useToast } from "~/components/hooks/use-toast";
import { updateFeedbackStatusWithAuth } from "~/server/queries/feedback";
import { useRouter } from "next/navigation";
import type { FeedbackWithAccount, FeedbackStatus } from "~/types/feedback";

interface FeedbackKanbanProps {
  initialFeedback: FeedbackWithAccount[];
  searchQuery?: string;
}

const FEEDBACK_STATUSES = [
  { id: "submitted", label: "Enviado", color: "gray" },
  { id: "backlog", label: "En espera", color: "blue" },
  { id: "evaluating", label: "Evaluando", color: "yellow" },
  { id: "testing", label: "En prueba", color: "purple" },
  { id: "ongoing", label: "En progreso", color: "orange" },
  { id: "resolved", label: "Resuelto", color: "green" },
] as const;

export function FeedbackKanban({
  initialFeedback,
  searchQuery = "",
}: FeedbackKanbanProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackWithAccount[]>(initialFeedback);
  const [activeFeedback, setActiveFeedback] = useState<FeedbackWithAccount | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithAccount | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const previousFeedbacks = useRef<FeedbackWithAccount[]>(initialFeedback);
  const { toast } = useToast();
  const router = useRouter();

  // Client-side search filtering
  const filteredFeedbacks = useMemo(() => {
    if (!searchQuery.trim()) return feedbacks;
    const query = searchQuery.toLowerCase();
    return feedbacks.filter((feedback) => {
      const commentMatch = feedback.feedbackComment.toLowerCase().includes(query);
      const accountMatch = feedback.accountName?.toLowerCase().includes(query) ?? false;
      return commentMatch || accountMatch;
    });
  }, [feedbacks, searchQuery]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
  );

  // Group feedbacks by status
  const feedbacksByStatus = useMemo(() => {
    const grouped: Record<string, FeedbackWithAccount[]> = {};
    FEEDBACK_STATUSES.forEach((status) => {
      grouped[status.id] = [];
    });

    filteredFeedbacks.forEach((feedback) => {
      if (grouped[feedback.status]) {
        grouped[feedback.status]?.push(feedback);
      } else {
        // If feedback has unknown status, put in submitted
        grouped.submitted?.push(feedback);
      }
    });

    // Sort all columns by createdAt (newest first)
    Object.keys(grouped).forEach((status) => {
      if (grouped[status]) {
        grouped[status]?.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      }
    });

    return grouped;
  }, [filteredFeedbacks]);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const feedback = filteredFeedbacks.find(
      (f) => f.feedbackId.toString() === active.id
    );
    setActiveFeedback(feedback ?? null);
    previousFeedbacks.current = filteredFeedbacks;
  }

  function handleFeedbackClick(feedbackId: string) {
    const feedback = feedbacks.find(
      (f) => f.feedbackId.toString() === feedbackId
    );
    setSelectedFeedback(feedback ?? null);
    setIsSheetOpen(true);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeFeedback = filteredFeedbacks.find(
      (f) => f.feedbackId.toString() === activeId
    );
    if (!activeFeedback) return;

    const overData = over.data.current;
    if (overData?.type === "column") {
      const newStatus = overData.status as FeedbackStatus;
      if (activeFeedback.status !== newStatus) {
        // Optimistic update
        setFeedbacks((prevFeedbacks) =>
          prevFeedbacks.map((feedback) =>
            feedback.feedbackId.toString() === activeId
              ? { ...feedback, status: newStatus }
              : feedback
          )
        );
      }
    }
  }

  async function handleToggleResolved(
    feedbackId: string,
    currentResolved: boolean
  ) {
    const newResolved = !currentResolved;
    // When resolving, move to "resolved"; when un-resolving, move to "evaluating"
    const newStatus: FeedbackStatus = newResolved ? "resolved" : "evaluating";

    // Optimistic update
    setFeedbacks((prevFeedbacks) =>
      prevFeedbacks.map((feedback) =>
        feedback.feedbackId.toString() === feedbackId
          ? {
              ...feedback,
              resolved: newResolved,
              status: newStatus,
            }
          : feedback
      )
    );

    const previousState = feedbacks;

    try {
      const result = await updateFeedbackStatusWithAuth(feedbackId, newStatus);

      if (!result.success) {
        throw new Error(result.error ?? "Failed to update feedback");
      }

      toast({
        title: newResolved ? "Feedback resuelto" : "Feedback reactivado",
        description: newResolved
          ? "El feedback se movió a Resuelto"
          : "El feedback se movió a Evaluando",
      });

      router.refresh();
    } catch (error) {
      console.error("Error updating feedback:", error);
      setFeedbacks(previousState);
      toast({
        title: "Error",
        description: "No se pudo actualizar el feedback. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveFeedback(null);

    if (!over) {
      setFeedbacks(previousFeedbacks.current);
      return;
    }

    const activeId = active.id;
    // Get the feedback from current state (which has the updated status from handleDragOver)
    const feedback = feedbacks.find(
      (f) => f.feedbackId.toString() === activeId
    );

    if (!feedback) return;

    try {
      const result = await updateFeedbackStatusWithAuth(
        feedback.feedbackId.toString(),
        feedback.status
      );

      if (!result.success) {
        throw new Error(result.error ?? "Failed to update feedback");
      }

      toast({
        title: "Feedback actualizado",
        description: `El feedback se movió a "${
          FEEDBACK_STATUSES.find((s) => s.id === feedback.status)?.label ??
          feedback.status
        }"`,
      });
    } catch (error) {
      console.error("Error updating feedback:", error);
      setFeedbacks(previousFeedbacks.current);
      toast({
        title: "Error",
        description: "No se pudo actualizar el feedback. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4">
          {FEEDBACK_STATUSES.map((status) => (
            <FeedbackColumn
              key={status.id}
              id={status.id}
              title={status.label}
              feedbacks={feedbacksByStatus[status.id] ?? []}
              color={status.color}
              onToggleResolved={handleToggleResolved}
              onFeedbackClick={handleFeedbackClick}
            />
          ))}
        </div>
        <FeedbackDragOverlay activeFeedback={activeFeedback} />
      </DndContext>

      <FeedbackDetailSheet
        feedback={selectedFeedback}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onMarkResolved={handleToggleResolved}
      />
    </>
  );
}
