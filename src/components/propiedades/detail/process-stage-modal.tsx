"use client";

import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
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

  // Generate checklist items
  const allItems = getChecklistItemsForStage(
    processStages,
    targetStageId,
    currentProgress,
  );

  // Filter out completed items
  const incompleteItems = filterIncompleteItems(allItems);

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

  // Handle select all
  const handleSelectAll = () => {
    const requiredItems = incompleteItems.filter((item) => item.isRequired);
    const allSelected = requiredItems.every((item) => selectedItems.has(item.id));

    if (allSelected) {
      // Deselect all
      setSelectedItems(new Set());
    } else {
      // Select all required items
      setSelectedItems(new Set(requiredItems.map((item) => item.id)));
    }
  };

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
      onClose();
    }
  };

  const hasIncompleteItems = incompleteItems.length > 0;
  const hasSelectedItems = selectedItems.size > 0;
  const requiredItems = incompleteItems.filter((item) => item.isRequired);
  const allRequiredSelected = requiredItems.every((item) => selectedItems.has(item.id));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Completar hasta: {targetStageLabel}
          </DialogTitle>
          <DialogDescription>
            Marca las tareas completadas para actualizar el progreso de la propiedad.
            {!hasIncompleteItems && (
              <span className="mt-2 block text-green-600">
                ✓ Todas las etapas hasta este punto están completadas
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto py-4">
          {hasIncompleteItems ? (
            <>
              {/* Select All Button */}
              {requiredItems.length > 1 && (
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-sm font-medium text-gray-700">
                    {selectedItems.size} de {requiredItems.length} seleccionadas
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {allRequiredSelected ? "Deseleccionar todas" : "Seleccionar todas"}
                  </Button>
                </div>
              )}

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
      className={`rounded-lg border p-4 transition-colors ${
        isSelected
          ? "border-amber-400 bg-amber-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      } ${isDisabled ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          id={item.id}
          checked={isSelected}
          onCheckedChange={onToggle}
          disabled={isDisabled}
          className="mt-1"
        />
        <div className="flex-1">
          <label
            htmlFor={item.id}
            className={`block font-medium ${
              isDisabled ? "cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {item.label}
          </label>
          <p className="mt-1 text-sm text-gray-600">{item.description}</p>

          {/* Warning Message */}
          {item.warningMessage && (
            <Alert className="mt-2 border-amber-300 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800">
                {item.warningMessage}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
