"use client";

import { DragOverlay } from "@dnd-kit/core";
import { Check } from "lucide-react";
import type { FeedbackWithAccount } from "~/types/feedback";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface FeedbackDragOverlayProps {
  activeFeedback: FeedbackWithAccount | null;
}

const SCALE_LABELS = {
  1: "Muy mal",
  2: "Mal",
  3: "Bien",
  4: "Excelente",
};

const SCALE_COLORS = {
  1: "bg-red-100 text-red-800",
  2: "bg-orange-100 text-orange-800",
  3: "bg-blue-100 text-blue-800",
  4: "bg-green-100 text-green-800",
};

export function FeedbackDragOverlay({
  activeFeedback,
}: FeedbackDragOverlayProps) {
  if (!activeFeedback) return null;

  const scaleLabel =
    SCALE_LABELS[activeFeedback.scale as keyof typeof SCALE_LABELS] ?? "N/A";
  const scaleColor =
    SCALE_COLORS[activeFeedback.scale as keyof typeof SCALE_COLORS] ??
    "bg-gray-100 text-gray-800";

  const timeAgo = formatDistanceToNow(new Date(activeFeedback.createdAt), {
    addSuffix: false,
    locale: es,
  });

  return (
    <DragOverlay>
      <div className="relative cursor-grabbing rounded-lg border border-gray-200 bg-white p-2 shadow-xl rotate-3 sm:p-3">
        {/* Rating badge - top right with subtle color */}
        <div className="absolute right-2 top-2 mt-1.5">
          <span
            className={`whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${scaleColor}`}
          >
            {scaleLabel}
          </span>
        </div>

        <div className="space-y-2">
          {/* Header: Checkbox + Comment */}
          <div className="flex items-start gap-1.5 sm:gap-2">
            {/* Custom checkbox (read-only during drag) */}
            <div
              className={`mt-1 flex h-3 w-3 flex-shrink-0 items-center justify-center rounded border-2 transition-all duration-200 ${
                activeFeedback.resolved
                  ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                  : "border-gray-300"
              }`}
            >
              {activeFeedback.resolved && <Check className="h-2 w-2" />}
            </div>

            {/* Comment Preview - inline with checkbox */}
            <p className="min-w-0 flex-1 text-xs font-semibold leading-tight text-gray-900 line-clamp-2 break-words pr-16">
              {activeFeedback.feedbackComment}
            </p>
          </div>

          {/* Subtle separator */}
          <div className="border-t border-gray-100" />

          {/* Footer: Account + Time */}
          <div className="flex items-center justify-between text-[10px] text-gray-500 sm:text-xs">
            <span className="font-medium truncate">
              {activeFeedback.accountName ?? "Sin cuenta"}
            </span>
            <span className="whitespace-nowrap">{timeAgo}</span>
          </div>
        </div>
      </div>
    </DragOverlay>
  );
}
