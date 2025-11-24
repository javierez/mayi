"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";
import { ExternalLink, Building2, User, Mail, Calendar, Hash, MessageSquare } from "lucide-react";
import type { FeedbackWithAccount } from "~/types/feedback";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface FeedbackDetailSheetProps {
  feedback: FeedbackWithAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkResolved: (feedbackId: string, currentResolved: boolean) => void;
}

const SCALE_LABELS = {
  1: "Muy mal",
  2: "Mal",
  3: "Bien",
  4: "Excelente",
};

const SCALE_VARIANTS = {
  1: "destructive" as const,
  2: "secondary" as const,
  3: "outline" as const,
  4: "default" as const,
};

const STATUS_LABELS = {
  submitted: "Enviado",
  backlog: "En espera",
  evaluating: "Evaluando",
  testing: "En prueba",
  ongoing: "En progreso",
  resolved: "Resuelto",
};

export function FeedbackDetailSheet({
  feedback,
  open,
  onOpenChange,
  onMarkResolved,
}: FeedbackDetailSheetProps) {
  if (!feedback) return null;

  const scaleLabel = SCALE_LABELS[feedback.scale as keyof typeof SCALE_LABELS] ?? "N/A";
  const scaleVariant = SCALE_VARIANTS[feedback.scale as keyof typeof SCALE_VARIANTS] ?? "outline";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalle del Feedback</SheetTitle>
          <SheetDescription>
            Información completa del feedback enviado por el usuario
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Badges Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-block text-[10px] font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-1">
              {STATUS_LABELS[feedback.status]}
            </span>
            <span className={`inline-block text-[10px] font-medium rounded px-2 py-1 ${scaleVariant === "destructive" ? "bg-red-100 text-red-800" : scaleVariant === "secondary" ? "bg-orange-100 text-orange-800" : scaleVariant === "outline" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
              {scaleLabel}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded px-2 py-1">
              <Hash className="h-3 w-3" />
              {feedback.feedbackId.toString()}
            </span>
          </div>

          {/* Comment */}
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <div className="flex items-start gap-2 mb-2">
              <MessageSquare className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {feedback.feedbackComment}
              </p>
            </div>
          </div>

          {/* Account and User Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-900 font-medium">
                {feedback.accountName ?? "Sin cuenta"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-900">
                {feedback.userName ?? "Sin nombre"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">
                {feedback.userEmail ?? "Sin email"}
              </span>
            </div>
          </div>

          {/* URL */}
          {feedback.url && (
            <div className="pt-2 border-t">
              <a
                href={feedback.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1.5 break-all"
              >
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                {feedback.url}
              </a>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex items-center gap-4 pt-2 border-t text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(new Date(feedback.createdAt), "Pp", { locale: es })}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4">
            <Button
              className="w-full"
              variant={feedback.resolved ? "outline" : "default"}
              onClick={() => {
                onMarkResolved(feedback.feedbackId.toString(), feedback.resolved);
                onOpenChange(false);
              }}
            >
              {feedback.resolved ? "Reactivar feedback" : "Marcar como resuelto"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
