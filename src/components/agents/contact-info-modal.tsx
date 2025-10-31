"use client";

import { Mail, Phone, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";

interface Contact {
  contactId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

interface ContactInfoModalProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactInfoModal({
  contact,
  open,
  onOpenChange,
}: ContactInfoModalProps) {
  if (!contact) return null;

  const handleEmailClick = () => {
    if (contact.email) {
      window.location.href = `mailto:${contact.email}`;
    }
  };

  const handlePhoneClick = () => {
    if (contact.phone) {
      window.location.href = `tel:${contact.phone}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {contact.firstName} {contact.lastName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {contact.email && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Email</p>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleEmailClick}
              >
                <Mail className="h-4 w-4" />
                <span className="truncate">{contact.email}</span>
              </Button>
            </div>
          )}

          {contact.phone && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Teléfono</p>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handlePhoneClick}
              >
                <Phone className="h-4 w-4" />
                <span>{contact.phone}</span>
              </Button>
            </div>
          )}

          {!contact.email && !contact.phone && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay información de contacto disponible
            </p>
          )}
        </div>

        <Separator />

        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
