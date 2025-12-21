"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { AlertTriangle, ArrowRight } from "lucide-react";

export interface FieldChange {
  field: "nif" | "address" | "phone" | "email";
  label: string;
  originalValue: string;
  newValue: string;
  contactType: "seller" | "buyer";
  contactId: bigint;
}

interface ConfirmChangesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changes: FieldChange[];
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmChangesModal({
  open,
  onOpenChange,
  changes,
  onConfirm,
  isLoading = false,
}: ConfirmChangesModalProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            ¿Modificar datos existentes?
          </DialogTitle>
          <DialogDescription>
            Los siguientes campos ya tenían valores y serán actualizados en la
            ficha del contacto:
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-60 space-y-3 overflow-y-auto py-2">
          {changes.map((change, index) => (
            <div
              key={`${change.contactType}-${change.field}-${index}`}
              className="rounded-lg border bg-gray-50 p-3"
            >
              <p className="mb-1 text-sm font-medium text-gray-900">
                {change.label}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="rounded bg-red-100 px-2 py-0.5 text-red-700 line-through">
                  {change.originalValue || "(vacío)"}
                </span>
                <ArrowRight className="h-3 w-3 text-gray-400" />
                <span className="rounded bg-green-100 px-2 py-0.5 text-green-700">
                  {change.newValue}
                </span>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Guardando..." : "Confirmar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
