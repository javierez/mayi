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
                "cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-amber-300 hover:bg-amber-50",
                selectedContactId === duplicate.contactId
                  ? "border-amber-500 bg-amber-50"
                  : "border-gray-200 bg-white",
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  {/* Contact Name */}
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {duplicate.firstName} {duplicate.lastName}
                    </span>
                  </div>

                  {/* Contact Email */}
                  {duplicate.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {duplicate.email}
                      </span>
                    </div>
                  )}

                  {/* Contact Phone */}
                  {duplicate.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {duplicate.phone}
                      </span>
                    </div>
                  )}

                  {/* Match Reason */}
                  <div className="mt-2">
                    <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                      {duplicate.matchReason}
                    </span>
                  </div>
                </div>

                {/* Selection Indicator */}
                {selectedContactId === duplicate.contactId && (
                  <CheckCircle2 className="h-5 w-5 text-amber-500" />
                )}
              </div>
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
