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
import { AlertTriangle, User, Mail, Phone, CheckCircle2 } from "lucide-react";
import { cn } from "~/lib/utils";
import type { DuplicateContact } from "~/lib/contact-duplicate-detection";

interface DuplicateWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: DuplicateContact[];
  onUseExisting: (contactId: number) => void;
  onCreateAnyway: () => void;
}

/**
 * Dialog component that displays potential duplicate contacts
 * and allows the user to either use an existing contact or create a new one anyway.
 */
export function DuplicateWarningDialog({
  isOpen,
  onClose,
  duplicates,
  onUseExisting,
  onCreateAnyway,
}: DuplicateWarningDialogProps) {
  const [selectedContactId, setSelectedContactId] = useState<number | null>(
    null,
  );

  const handleUseExisting = () => {
    if (selectedContactId) {
      onUseExisting(selectedContactId);
      onClose();
    }
  };

  const handleCreateAnyway = () => {
    onCreateAnyway();
    onClose();
  };

  const handleClose = () => {
    setSelectedContactId(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Posibles Contactos Duplicados</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Se encontraron {duplicates.length}{" "}
            {duplicates.length === 1 ? "contacto" : "contactos"} con información
            similar. Puedes usar uno existente o crear uno nuevo de todas
            formas.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] space-y-3 overflow-y-auto py-4">
          {duplicates.map((duplicate) => (
            <div
              key={duplicate.contactId}
              onClick={() => setSelectedContactId(duplicate.contactId)}
              className={cn(
                "relative cursor-pointer rounded-lg border p-3 transition-all hover:border-gray-300 hover:bg-gray-50/50",
                selectedContactId === duplicate.contactId
                  ? "border-gray-300 bg-gray-50/70 ring-1 ring-gray-200"
                  : "border-gray-200 bg-white",
              )}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  {/* Contact Name */}
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {duplicate.firstName} {duplicate.lastName}
                    </span>
                  </div>

                  {/* Contact Email */}
                  {duplicate.email && (
                    <div className="flex items-center space-x-1.5">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {duplicate.email}
                      </span>
                    </div>
                  )}

                  {/* Contact Phone */}
                  {duplicate.phone && (
                    <div className="flex items-center space-x-1.5">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {duplicate.phone}
                      </span>
                    </div>
                  )}
                </div>

                {/* Selection Indicator */}
                {selectedContactId === duplicate.contactId && (
                  <CheckCircle2 className="h-7 w-7 text-emerald-500 shrink-0" />
                )}
              </div>

              {/* Match Reason - Bottom Right (absolute) */}
              <span className="absolute bottom-2 right-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                {duplicate.matchReason}
              </span>
            </div>
          ))}
        </div>

        <DialogFooter className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={handleCreateAnyway}
            className="w-full border-gray-300 hover:border-gray-400 hover:bg-gray-50 sm:w-auto"
          >
            Crear de Todas Formas
          </Button>
          <Button
            onClick={handleUseExisting}
            disabled={!selectedContactId}
            className="w-full bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500 sm:w-auto"
          >
            Usar Contacto Seleccionado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
