"use client";

import React from "react";
import { Button } from "~/components/ui/button";
import { CheckCircle, ExternalLink } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "~/lib/utils";

interface CadastralActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onValidateData: () => void;
  onOpenCadastralMap: () => void;
  cadastralReference: string;
}

// Visually hidden component for accessibility
const VisuallyHidden = ({ children }: { children: React.ReactNode }) => (
  <span className="sr-only">{children}</span>
);

export function CadastralActionModal({
  isOpen,
  onClose,
  onValidateData,
  onOpenCadastralMap,
  cadastralReference,
}: CadastralActionModalProps) {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80" />
        <DialogPrimitive.Content
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] z-50 grid w-full max-w-[200px] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-4 shadow-lg duration-200 sm:rounded-lg",
          )}
        >
          <VisuallyHidden>
            <DialogPrimitive.Title>Opciones de Catastro</DialogPrimitive.Title>
            <DialogPrimitive.Description>
              Referencia: {cadastralReference}
            </DialogPrimitive.Description>
          </VisuallyHidden>
          <div className="space-y-3">
            <Button
              variant="default"
              className="flex h-auto w-full flex-col gap-1 py-3"
              onClick={() => {
                onValidateData();
                onClose();
              }}
            >
              <CheckCircle className="h-5 w-5" />
              <span className="text-xs">Validar datos</span>
            </Button>
            <Button
              variant="outline"
              className="flex h-auto w-full flex-col gap-1 py-3"
              onClick={() => {
                onOpenCadastralMap();
                onClose();
              }}
            >
              <ExternalLink className="h-5 w-5" />
              <span className="text-xs">Abrir Catastro</span>
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
