"use client";

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
import { toast } from "sonner";
import { toggleListingPublishToWebsiteWithAuth } from "~/server/queries/listing";

interface ConfirmPublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: number;
  onConfirm: () => void;
}

export function ConfirmPublishDialog({
  open,
  onOpenChange,
  listingId,
  onConfirm,
}: ConfirmPublishDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await toggleListingPublishToWebsiteWithAuth(listingId);
      toast.success("Propiedad publicada en la web");
      onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error enabling website publication:", error);
      toast.error("No se pudo publicar la propiedad en la web");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Publicar en la web</DialogTitle>
          <DialogDescription>
            Para compartir esta propiedad, primero debe estar publicada en tu
            sitio web. ¿Deseas publicarla ahora?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Publicando..." : "Publicar y compartir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
