"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface SubscribeInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscribeInfoModal({
  open,
  onOpenChange,
}: SubscribeInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Información de suscripción</DialogTitle>
          <DialogDescription>
            Para recibir información sobre nuestras integraciones, por favor
            contacta con nosotros en javier@vesta-crm.com
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
