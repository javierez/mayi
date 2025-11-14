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
import { ScrollArea } from "~/components/ui/scroll-area";
import { Loader, ArrowRight } from "lucide-react";

interface NotesTransformationPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  originalContent: string;
  transformedContent: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function NotesTransformationPreviewModal({
  open,
  onOpenChange,
  title,
  description,
  originalContent,
  transformedContent,
  onConfirm,
  isLoading = false,
}: NotesTransformationPreviewModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="max-h-[calc(90vh-180px)]">
            <div className="space-y-6 pr-4">
              {/* Original Content */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Notas originales
                  </h3>
                  <span className="text-xs text-gray-500">
                    ({originalContent.length} caracteres)
                  </span>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="whitespace-pre-wrap text-sm text-gray-700">
                    {originalContent}
                  </p>
                </div>
              </div>

              {/* Arrow Indicator */}
              <div className="flex justify-center">
                <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-primary">
                    Transformado
                  </span>
                </div>
              </div>

              {/* Transformed Content */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-green-700">
                    Resultado
                  </h3>
                  <span className="text-xs text-green-600">
                    ({transformedContent.length} caracteres)
                  </span>
                  {transformedContent.length < originalContent.length && (
                    <span className="text-xs font-medium text-green-600">
                      ↓ {Math.round(
                        ((originalContent.length - transformedContent.length) /
                          originalContent.length) *
                          100
                      )}% más corto
                    </span>
                  )}
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="whitespace-pre-wrap text-sm text-gray-800">
                    {transformedContent}
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            Confirmar y reemplazar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
