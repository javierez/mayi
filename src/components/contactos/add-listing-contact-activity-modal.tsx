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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { PushToTalkWhisperButton } from "~/components/shared/push-to-talk-whisper-button";
import { createListingContactActivityAction } from "~/server/actions/listing-contact-activity";
import {
  LISTING_CONTACT_ACTIVITY_LABELS,
  type ListingContactActivityAction,
} from "~/lib/constants/listing-contact-activity-actions";

interface AddListingContactActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingContactId: bigint;
  onSuccess?: () => void;
}

// Common action types that users will likely use
const COMMON_ACTIONS: ListingContactActivityAction[] = [
  "call_logged",
  "message_received",
  "whatsapp_sent",
  "email_sent",
  "notes_added",
  "appointment_scheduled",
  "viewing_completed",
  "follow_up_completed",
] as const;

export function AddListingContactActivityModal({
  open,
  onOpenChange,
  listingContactId,
  onSuccess,
}: AddListingContactActivityModalProps) {
  const [action, setAction] = useState<ListingContactActivityAction | "">("");
  const [notes, setNotes] = useState("");
  const [topic, setTopic] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      });

      if (result.success) {
        toast.success("Actividad registrada correctamente");
        // Reset form
        setAction("");
        setNotes("");
        setTopic("");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agregar Actividad</DialogTitle>
          <DialogDescription>
            Registra una nueva actividad para este contacto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action Type Selector */}
          <div className="space-y-2">
            <Label htmlFor="action">Tipo de acción</Label>
            <Select
              value={action}
              onValueChange={(value) => setAction(value as ListingContactActivityAction)}
            >
              <SelectTrigger id="action">
                <SelectValue placeholder="Selecciona un tipo de acción" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_ACTIONS.map((actionType) => (
                  <SelectItem key={actionType} value={actionType}>
                    {LISTING_CONTACT_ACTIVITY_LABELS[actionType]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          {/* Topic (optional, auto-filled) */}
          <div className="space-y-2">
            <Label htmlFor="topic">Tema (opcional)</Label>
            <Textarea
              id="topic"
              placeholder="Se generará automáticamente desde las notas"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              El tema se genera automáticamente desde las notas, pero puedes editarlo
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !action || !notes.trim()}>
            {isSubmitting ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

