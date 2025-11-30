"use client";

import React from "react";
import { Button } from "~/components/ui/button";
import { AlertTriangle, Check, X, AlertCircle } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "~/lib/utils";
import type { CadastralDiscrepancy } from "~/server/cadastral/retrieve_cadastral";

interface CadastralCorrectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  discrepancies: CadastralDiscrepancy[];
  onApplyField: (field: string, value: string) => void;
  onApplyAll: () => void;
}

export function CadastralCorrectionsModal({
  isOpen,
  onClose,
  discrepancies,
  onApplyField,
  onApplyAll,
}: CadastralCorrectionsModalProps) {
  const handleApplyAll = () => {
    onApplyAll();
    onClose();
  };

  const handleApplyField = (field: string, value: string) => {
    onApplyField(field, value);
    // Don't close - let user apply more or close manually
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80" />
        <DialogPrimitive.Content
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
          )}
        >
          <DialogPrimitive.Title className="flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Discrepancias Encontradas
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="text-sm text-muted-foreground">
            Los siguientes campos difieren de los datos oficiales del Catastro.
          </DialogPrimitive.Description>

          <div className="max-h-[300px] space-y-4 overflow-y-auto">
            {discrepancies.map((discrepancy) => (
              <div
                key={discrepancy.field}
                className="rounded-lg border border-amber-200 bg-amber-50/50 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-amber-900">
                    {discrepancy.fieldLabel}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 border-amber-400 bg-white px-2 text-xs text-amber-700 hover:bg-amber-50"
                    onClick={() =>
                      handleApplyField(discrepancy.field, discrepancy.suggested)
                    }
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Aplicar
                  </Button>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="w-16 shrink-0 text-muted-foreground">
                      Actual:
                    </span>
                    <span className="text-foreground">{discrepancy.current}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-16 shrink-0 text-muted-foreground">
                      Catastro:
                    </span>
                    <span className="font-medium text-amber-700">
                      {discrepancy.suggested}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Info message when property details fields are present */}
          {discrepancies.some(
            (d) => d.field === "builtSurfaceArea" || d.field === "yearBuilt",
          ) && (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-800" />
              <span>
                Al aplicar cambios en Superficie Construida o Año de
                Construcción, cierra este menú, ve a{" "}
                <span className="font-medium">Distribución y Superficie</span> y
                haz clic en guardar.
              </span>
            </p>
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="ghost" onClick={onClose}>
              <X className="mr-1 h-4 w-4" />
              Ignorar
            </Button>
            <Button onClick={handleApplyAll}>
              <Check className="mr-1 h-4 w-4" />
              Aplicar Todos
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
