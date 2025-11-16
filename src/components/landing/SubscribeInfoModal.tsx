"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Check } from "lucide-react";

interface SubscribeInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscribeInfoModal({
  open,
  onOpenChange,
}: SubscribeInfoModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setIsSubmitted(false);
    }
  }, [open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) return;

    // Aquí normalmente enviarías el email al backend
    setIsSubmitted(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subscríbete para más novedades</DialogTitle>
          <DialogDescription>
            Déjanos tu correo y te avisaremos cuando lancemos nuevas
            funcionalidades y mejoras.
          </DialogDescription>
        </DialogHeader>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="subscribe-email"
                className="text-sm font-medium text-gray-900"
              >
                Email
              </label>
              <Input
                id="subscribe-email"
                type="email"
                required
                placeholder="tu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Enviar
            </Button>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-700" />
            </div>
            <p className="text-center text-sm text-gray-700">
              ¡Gracias por suscribirte! Te avisaremos por email cuando haya más
              novedades sobre Vesta.
            </p>
            <Button variant="outline" className="mt-2" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


