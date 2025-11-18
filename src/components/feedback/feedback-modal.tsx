import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import {
  MessageSquare,
  Send,
  X,
  Frown,
  Meh,
  Smile,
  Heart,
  CheckCircle,
} from "lucide-react";
import { PushToTalkWhisperButton } from "~/components/shared/push-to-talk-whisper-button";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ratingOptions = [
  { value: 1, icon: Frown, label: "Muy mal" },
  { value: 2, icon: Meh, label: "Mal" },
  { value: 3, icon: Smile, label: "Bien" },
  { value: 4, icon: Heart, label: "Excelente" },
];

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!rating || !comment.trim()) return;

    setIsSubmitting(true);
    try {
      const currentUrl = window.location.pathname + window.location.search;
      console.log("Sending feedback with URL:", currentUrl);

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scale: rating,
          feedbackComment: comment.trim(),
          url: currentUrl,
        }),
      });

      if (response.ok) {
        // Show success state
        setIsSuccess(true);
        // Reset form and close after 2 seconds
        setTimeout(() => {
          setRating(null);
          setComment("");
          setIsSuccess(false);
          onClose();
        }, 2000);
      } else {
        console.error("Error submitting feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(null);
    setComment("");
    setIsSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          // Success State
          <div className="py-12 text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-600" />
            <p className="text-lg font-medium text-gray-900">
              ¡Gracias por tu feedback!
            </p>
          </div>
        ) : (
          // Feedback Form
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <MessageSquare className="h-5 w-5 text-gray-600" />
                Tu opinión nos ayuda
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Comment Section */}
              <div className="space-y-3">
                <label
                  htmlFor="feedback-comment"
                  className="text-sm font-medium text-gray-700"
                >
                  Cuéntanos tu experiencia...
                </label>
                <div className="relative">
                  <Textarea
                    id="feedback-comment"
                    placeholder="Comparte tus comentarios, sugerencias o problemas que hayas encontrado..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px] resize-none pr-12 focus:border-gray-400 focus:ring-gray-400"
                    maxLength={500}
                  />
                  <div className="absolute right-2 top-2">
                    <PushToTalkWhisperButton
                      onTranscript={(text) => {
                        setComment((prev) => {
                          const newValue = prev ? `${prev} ${text}`.trim() : text;
                          return newValue.slice(0, 500);
                        });
                      }}
                      language="es"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  {comment.length}/500 caracteres
                </div>
              </div>

              {/* Rating Section */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  ¿Cómo calificarías tu experiencia?
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {ratingOptions.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.value}
                        onClick={() => setRating(item.value)}
                        className={cn(
                          "flex items-center justify-center rounded-lg border p-3 transition-all duration-200",
                          rating === item.value
                            ? "border-gray-900 bg-gray-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                        )}
                      >
                        <IconComponent
                          className={cn(
                            "h-5 w-5",
                            rating === item.value
                              ? "text-gray-900"
                              : "text-gray-500",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!rating || !comment.trim() || isSubmitting}
                className="flex-1"
              >
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
