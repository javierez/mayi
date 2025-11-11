"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import type { RenovationStatus } from "~/types/gemini";
import { Send, Loader2, MessageSquare, X } from "lucide-react";

export function RenovationReviewToggle({
  onToggle,
  disabled,
  isVisible,
}: {
  onToggle: () => void;
  disabled?: boolean;
  isVisible: boolean;
}) {
  return (
    <Button
      onClick={onToggle}
      disabled={disabled}
      variant="outline"
      size="icon"
      className="border-white/20 bg-white/40 px-2.5 py-2.5 text-gray-700 shadow-xl backdrop-blur-md transition-all hover:bg-white/50 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={isVisible ? "Ocultar feedback" : "Mostrar feedback"}
    >
      <MessageSquare className="h-4 w-4" />
    </Button>
  );
}

export function RenovationReviewModal({
  onReview,
  reviewStatus,
  disabled = false,
  isVisible,
  onClose,
}: {
  onReview: (reviewText: string) => Promise<void>;
  reviewStatus: RenovationStatus;
  disabled?: boolean;
  isVisible: boolean;
  onClose: () => void;
}) {
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reviewText.trim() || isSubmitting || disabled) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onReview(reviewText);
      // Clear the textarea after successful review
      setReviewText("");
      onClose();
    } catch (error) {
      console.error("Review submission error:", error);
      // Error is handled by the hook/toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 300) {
      setReviewText(value);
    }
  };

  const isProcessing = reviewStatus === "processing" || isSubmitting;

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-24 left-1/2 z-20 w-80 -translate-x-1/2 rounded-lg border border-white/20 bg-white/40 p-3 shadow-xl backdrop-blur-md">
      <div className="mb-2 flex items-center justify-end">
        <button
          onClick={() => {
            onClose();
            setReviewText("");
          }}
          className="rounded p-1 transition-colors hover:bg-white/30"
          aria-label="Ocultar feedback"
        >
          <X className="h-3.5 w-3.5 text-gray-700" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={reviewText}
          onChange={handleTextChange}
          placeholder="Feedback (ej: añade una puerta, cambia el estilo)"
          className="min-h-[50px] resize-none border-white/30 bg-white/35 text-xs text-gray-700 placeholder:text-gray-500 backdrop-blur-sm"
          disabled={isProcessing || disabled}
          maxLength={300}
        />

        <Button
          type="submit"
          disabled={!reviewText.trim() || isProcessing || disabled}
          size="icon"
          className="h-7 w-full bg-white/50 text-gray-700 shadow-md transition-all hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isProcessing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </Button>
      </form>
    </div>
  );
}

// Legacy component for backwards compatibility
export function RenovationReview({
  onReview,
  reviewStatus,
  disabled = false,
}: {
  onReview: (reviewText: string) => Promise<void>;
  reviewStatus: RenovationStatus;
  disabled?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      <RenovationReviewToggle
        onToggle={() => setIsVisible(!isVisible)}
        disabled={disabled}
        isVisible={isVisible}
      />
      <RenovationReviewModal
        onReview={onReview}
        reviewStatus={reviewStatus}
        disabled={disabled}
        isVisible={isVisible}
        onClose={() => setIsVisible(false)}
      />
    </>
  );
}

