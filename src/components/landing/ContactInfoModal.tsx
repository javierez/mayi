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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contacto</DialogTitle>
          <DialogDescription>
            Puedes ponerte en contacto con nosotros a través de cualquiera de
            estos canales.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 space-y-3 text-sm text-gray-800">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-600" />
            <a
              href="mailto:javier@vesta-crm.com"
              className="underline underline-offset-2 hover:text-gray-900"
            >
              javier@vesta-crm.com
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-600" />
            <a
              href="tel:+34636036116"
              className="underline underline-offset-2 hover:text-gray-900"
            >
              +34 636 036 116
            </a>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-gray-600" />
            <p>
              Calle Aviador Zorita 6,
              <br />
              28020, Madrid
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


