"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Mail, Phone, MapPin } from "lucide-react";

interface ContactInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactInfoModal({
  open,
  onOpenChange,
}: ContactInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contacta con nosotros</DialogTitle>
          <DialogDescription>
            Estamos aquí para ayudarte. Ponte en contacto con nosotros a través
            de cualquiera de estos canales.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <a
                href="mailto:javier@vesta-crm.com"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                javier@vesta-crm.com
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Teléfono</p>
              <a
                href="tel:+34636036116"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                +34 636 036 116
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Dirección</p>
              <p className="text-sm text-muted-foreground">
                Calle Aviador Zorita 6, 28020, Madrid
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
