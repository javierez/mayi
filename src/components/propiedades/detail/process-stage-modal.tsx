"use client";

import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, AlertTriangle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Alert, AlertDescription } from "~/components/ui/alert";
import {
  getChecklistItemsForStage,
  filterIncompleteItems,
  type ChecklistItem,
} from "~/lib/helpers/process-stage-checklist";
import { completeStagesUpTo } from "~/app/actions/process-stages";

interface ProcessStage {
  id: string;
  label: string;
  status: "accomplished" | "ongoing" | "future";
  subStages: Array<{
    id: string;
    label: string;
    status: "accomplished" | "ongoing" | "future";
  }>;
}

interface CurrentProgress {
  hasEncargo: boolean;
  hasOfferAccepted: boolean;
  hasDeal: boolean;
  hasArrasDate: boolean;
  hasActualDeedDate: boolean;
  hasCloseDate: boolean;
  dealStatus: string | null;
  canPublishToPortals: boolean;
  hasActiveContacts: boolean;
}

interface ProcessStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: number;
  targetStageId: string;
  targetStageLabel: string;
  processStages: ProcessStage[];
  currentProgress: CurrentProgress;
  onSuccess?: () => void;
}

export function ProcessStageModal({
  isOpen,
  onClose,
  listingId,
  targetStageId,
  targetStageLabel,
  processStages,
  currentProgress,
  onSuccess,
}: ProcessStageModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [hasInitialized, setHasInitialized] = useState(false);

  // Generate checklist items
  const allItems = getChecklistItemsForStage(
    processStages,
    targetStageId,
    currentProgress,
  );

  // Filter out completed items
  const incompleteItems = filterIncompleteItems(allItems);

  // Auto-select all required items when modal opens
  if (isOpen && !hasInitialized && incompleteItems.length > 0) {
    const requiredItemIds = incompleteItems
      .filter((item) => item.isRequired)
      .map((item) => item.id);
    setSelectedItems(new Set(requiredItemIds));
    setHasInitialized(true);
  }

  // Reset initialization flag when modal closes
  if (!isOpen && hasInitialized) {
    setHasInitialized(false);
  }

  // Handle checkbox toggle
  const handleToggle = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Handle select all (currently unused but kept for potential future use)
  // const handleSelectAll = () => {
  //   const requiredItems = incompleteItems.filter((item) => item.isRequired);
  //   const allSelected = requiredItems.every((item) => selectedItems.has(item.id));

  //   if (allSelected) {
  //     // Deselect all
  //     setSelectedItems(new Set());
  //   } else {
  //     // Select all required items
  //     setSelectedItems(new Set(requiredItems.map((item) => item.id)));
  //   }
  // };

  // Handle form submission
  const handleSubmit = async () => {
    console.log("🎯 Modal: Submitting stage updates", {
      listingId,
      targetStageId,
      selectedItems: Array.from(selectedItems),
    });

    setIsSubmitting(true);
    setError(null);

    try {
      const selectedStageIds = Array.from(selectedItems);

      console.log("📤 Calling completeStagesUpTo with:", {
        listingId,
        targetStageId,
        selectedStageIds,
      });

      const result = await completeStagesUpTo(
        listingId,
        targetStageId,
        selectedStageIds,
      );

      console.log("📥 Server response:", result);

      if (result.success) {
        console.log("✅ Success! Updated fields:", result.updatedFields);
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
          // Reset state
          setSelectedItems(new Set());
          setSuccess(false);
        }, 1500);
      } else {
        console.error("❌ Server error:", result.error);
        setError(result.error ?? "Failed to update stages");
      }
    } catch (err) {
      console.error("💥 Exception during submission:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedItems(new Set());
      setError(null);
      setSuccess(false);
      setHasInitialized(false);
      onClose();
    }
  };

  const hasIncompleteItems = incompleteItems.length > 0;
  const hasSelectedItems = selectedItems.size > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="custom-scrollbar max-h-[90vh] overflow-y-auto sm:max-w-[600px] [&>button]:hidden">
        <DialogHeader className="space-y-0 -mb-2">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-xl font-semibold text-gray-900 flex-1">
              Completar hasta: {targetStageLabel}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              title="Cerrar"
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="sr-only">
            Marca las tareas completadas para actualizar el progreso de la propiedad.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          {hasIncompleteItems ? (
            <>
              {/* Checklist Items */}
              <div className="space-y-3">
                {incompleteItems.map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    isSelected={selectedItems.has(item.id)}
                    onToggle={() => handleToggle(item.id)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
              <p className="text-center text-gray-600">
                No hay tareas pendientes hasta esta etapa.
              </p>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ¡Etapas actualizadas correctamente!
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!hasSelectedItems || isSubmitting || success}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Completado
                </>
              ) : (
                "Confirmar"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ChecklistItemRowProps {
  item: ChecklistItem;
  isSelected: boolean;
  onToggle: () => void;
}

function ChecklistItemRow({ item, isSelected, onToggle }: ChecklistItemRowProps) {
  const isDisabled = !item.isRequired;

  return (
    <div
      className={`rounded-lg p-3 transition-all ${
        isSelected
          ? "bg-primary/5 shadow-sm"
          : "bg-white shadow-sm hover:shadow-md"
      } ${isDisabled ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-2.5">
        <Checkbox
          id={item.id}
          checked={isSelected}
          onCheckedChange={onToggle}
          disabled={isDisabled}
        />
        <div className="flex-1">
          <label
            htmlFor={item.id}
            className={`block text-sm font-medium text-gray-900 ${
              isDisabled ? "cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {item.label}
          </label>
          <p className="mt-0.5 text-xs text-gray-600">{item.description}</p>

          {/* Warning Message */}
          {item.warningMessage && (
            <div className="mt-2 rounded-md bg-amber-50 p-2 shadow-sm">
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 mt-0.5" />
                <p className="text-xs text-amber-800">
                  {item.warningMessage}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
