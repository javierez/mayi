"use client";

import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { toast } from "sonner";
import { Loader, Mail, MessageSquare, Phone, UserCheck, MoreHorizontal, ArrowLeft } from "lucide-react";
import { PushToTalkWhisperButton } from "~/components/shared/push-to-talk-whisper-button";
import { createListingContactActivityAction } from "~/server/actions/listing-contact-activity";
import type { ListingContactActivityAction } from "~/lib/constants/listing-contact-activity-actions";

interface AddListingContactActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingContactId: bigint;
  onSuccess?: () => void;
}

type ActivityType = "mail" | "whatsapp" | "call" | "visit" | "otros";

const ACTIVITY_TYPES: Array<{
  type: ActivityType;
  label: string;
  action: ListingContactActivityAction;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { type: "mail", label: "Email", action: "email_sent", icon: Mail },
  { type: "whatsapp", label: "WhatsApp", action: "whatsapp_sent", icon: MessageSquare },
  { type: "call", label: "Llamada", action: "call_logged", icon: Phone },
  { type: "visit", label: "Visita en Persona", action: "viewing_completed", icon: UserCheck },
  { type: "otros", label: "Otros", action: "notes_added", icon: MoreHorizontal },
];

export function AddListingContactActivityModal({
  open,
  onOpenChange,
  listingContactId,
  onSuccess,
}: AddListingContactActivityModalProps) {
  const [step, setStep] = useState<"select" | "notes">("select");
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const [action, setAction] = useState<ListingContactActivityAction | "">("");
  const [notes, setNotes] = useState("");
  const [topic, setTopic] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      setStep("select");
      setSelectedType(null);
      setAction("");
      setNotes("");
      setTopic("");
      setIsPending(false);
    }
  }, [open]);

  // Auto-generate topic from notes when notes change
  React.useEffect(() => {
    if (notes.trim() && !topic.trim()) {
      const firstSentence = notes.split(/[.!?]/)[0];
      const generatedTopic =
        (firstSentence?.length ?? 0) > 50
          ? (firstSentence?.substring(0, 50) ?? "") + "..."
          : firstSentence ?? notes.substring(0, 50);
      setTopic(generatedTopic);
    }
  }, [notes, topic]);

  const handleActivityTypeSelect = (type: ActivityType) => {
    const activityConfig = ACTIVITY_TYPES.find((a) => a.type === type);
    if (activityConfig) {
      setSelectedType(type);
      setAction(activityConfig.action);
      setStep("notes");
    }
  };

  const handleBack = () => {
    setStep("select");
  };

  const handleSubmit = async () => {
    if (!action) {
      toast.error("Por favor, selecciona un tipo de acción");
      return;
    }

    if (!notes.trim()) {
      toast.error("Por favor, describe las notas");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createListingContactActivityAction({
        listingContactId: listingContactId.toString(),
        action,
        notes: notes.trim(),
        topic: topic.trim() || undefined,
        details: {
          isPending,
          activityType: selectedType ?? undefined,
        },
      });

      if (result.success) {
        toast.success("Actividad registrada correctamente");
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.error ?? "Error al registrar la actividad");
      }
    } catch (error) {
      console.error("Error submitting activity:", error);
      toast.error("Error al registrar la actividad");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
  };

  const handleVoiceTranscript = (text: string) => {
    setNotes((prev) => (prev ? `${prev} ${text}` : text));
  };

  const selectedActivityConfig = selectedType
    ? ACTIVITY_TYPES.find((a) => a.type === selectedType)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === "select" ? "Agregar Actividad" : selectedActivityConfig?.label}
          </DialogTitle>
          <DialogDescription>
            {step === "select"
              ? "Selecciona el tipo de actividad que deseas registrar"
              : "Registra los detalles de la actividad"}
          </DialogDescription>
        </DialogHeader>

        {step === "select" ? (
          /* Step 1: Activity Type Selection */
          <div className="grid grid-cols-2 gap-3 py-4">
            {ACTIVITY_TYPES.map((activityType) => {
              const Icon = activityType.icon;
              return (
                <Button
                  key={activityType.type}
                  variant="outline"
                  className="flex h-24 flex-col items-center justify-center gap-2"
                  onClick={() => handleActivityTypeSelect(activityType.type)}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm">{activityType.label}</span>
                </Button>
              );
            })}
          </div>
        ) : (
          /* Step 2: Notes Form */
          <div className="space-y-4">
            {/* Notes Input with Voice */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <div className="relative">
                <Textarea
                  id="notes"
                  placeholder="Describe la actividad o mantén presionado el micrófono para grabar..."
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  rows={6}
                  className="pr-10"
                />
                <PushToTalkWhisperButton
                  onTranscript={handleVoiceTranscript}
                  language="es"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Pending Toggle - Subtle and Elegant */}
            <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
              <Switch
                id="pending"
                checked={isPending}
                onCheckedChange={setIsPending}
                className="data-[state=checked]:bg-amber-500"
              />
              <Label
                htmlFor="pending"
                className="cursor-pointer text-xs font-normal text-gray-600 hover:text-gray-900"
              >
                Marcar como pendiente
              </Label>
            </div>

            {/* Topic Preview */}
            {topic && (
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-xs font-medium text-gray-700">Tema generado:</p>
                <p className="mt-1 text-sm text-gray-900">{topic}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "notes" && (
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isSubmitting}
              className="mr-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Atrás
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          {step === "notes" && (
            <Button onClick={handleSubmit} disabled={isSubmitting || !notes.trim()}>
              {isSubmitting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

