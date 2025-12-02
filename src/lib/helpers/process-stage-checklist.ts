/**
 * Process Stage Checklist Helpers
 *
 * Utilities for generating checklists and managing stage progression
 * in the property process timeline.
 */

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  isCompleted: boolean;
  isRequired: boolean;
  fieldToUpdate?: string; // Database field that needs updating
  warningMessage?: string; // Optional warning for special cases
}

export interface StageRequirement {
  fieldName: string;
  tableName: "listings" | "deals" | "listing_contacts";
  value: boolean | string | Date | null;
  requiresDeal?: boolean; // If true, deal record must exist
  requiresContact?: boolean; // If true, contact record must exist
}

// Map each substage to its database requirements
export const STAGE_REQUIREMENTS: Record<string, StageRequirement[]> = {
  alta: [], // Always completed
  "completar-info": [], // Derived from mandatory fields, no direct DB update
  "firma-encargo": [
    {
      fieldName: "encargo",
      tableName: "listings",
      value: true,
    },
  ],
  visitas: [
    {
      fieldName: "offerAccepted",
      tableName: "listing_contacts",
      value: true,
      requiresContact: true,
    },
  ],
  arras: [
    {
      fieldName: "arrasDate",
      tableName: "deals",
      value: new Date(),
      requiresDeal: true,
    },
  ],
  contrato: [
    {
      fieldName: "actualDeedDate",
      tableName: "deals",
      value: new Date(),
      requiresDeal: true,
    },
  ],
  "cierre-final": [
    {
      fieldName: "closeDate",
      tableName: "deals",
      value: new Date(),
      requiresDeal: true,
    },
    {
      fieldName: "status",
      tableName: "deals",
      value: "Closed",
      requiresDeal: true,
    },
  ],
};

// Human-readable labels for each stage (sale)
const STAGE_LABELS_SALE: Record<string, { title: string; description: string }> = {
  alta: {
    title: "Alta de propiedad",
    description: "La propiedad ha sido registrada en el sistema",
  },
  "completar-info": {
    title: "Ficha completa",
    description: "Todos los campos obligatorios están completados",
  },
  "firma-encargo": {
    title: "Encargo firmado",
    description: "El contrato de encargo ha sido firmado con el propietario",
  },
  visitas: {
    title: "Oferta aceptada",
    description: "Un cliente ha hecho una oferta que ha sido aceptada",
  },
  arras: {
    title: "Arras firmadas",
    description: "Se han firmado las arras con el comprador",
  },
  contrato: {
    title: "Escritura",
    description: "Se ha firmado la escritura ante notario",
  },
  "cierre-final": {
    title: "Cierre de operación",
    description: "La operación se ha cerrado completamente",
  },
};

// Human-readable labels for each stage (rent)
const STAGE_LABELS_RENT: Record<string, { title: string; description: string }> = {
  alta: {
    title: "Alta de propiedad",
    description: "La propiedad ha sido registrada en el sistema",
  },
  "completar-info": {
    title: "Ficha completa",
    description: "Todos los campos obligatorios están completados",
  },
  "firma-encargo": {
    title: "Encargo firmado",
    description: "El contrato de encargo ha sido firmado con el propietario",
  },
  visitas: {
    title: "Oferta aceptada",
    description: "Un cliente ha hecho una oferta que ha sido aceptada",
  },
  arras: {
    title: "Reserva firmada",
    description: "Se ha firmado la reserva con el inquilino",
  },
  contrato: {
    title: "Firma del contrato",
    description: "Se ha firmado el contrato de alquiler",
  },
  "cierre-final": {
    title: "Cierre de operación",
    description: "La operación se ha cerrado completamente",
  },
};

/**
 * Get stage labels based on listing type
 * For rentals, "Arras" becomes "Reserva" and "Escritura" becomes "Firma del contrato"
 */
export function getStageLabelsByType(listingType?: string): Record<string, { title: string; description: string }> {
  return listingType === "rent" ? STAGE_LABELS_RENT : STAGE_LABELS_SALE;
}

// Default export for backwards compatibility (sale labels)
export const STAGE_LABELS = STAGE_LABELS_SALE;

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
  canPublishToPortals: boolean; // For "completar-info"
  hasActiveContacts: boolean; // For "visitas" warning
}

/**
 * Get all substage IDs in order from the process stages
 */
export function getAllSubstageIds(processStages: ProcessStage[]): string[] {
  return processStages.flatMap((stage) =>
    stage.subStages.map((sub) => sub.id)
  );
}

/**
 * Get all substage IDs up to and including the target stage
 */
export function getSubstageIdsUpTo(
  processStages: ProcessStage[],
  targetStageId: string
): string[] {
  const allIds = getAllSubstageIds(processStages);
  const targetIndex = allIds.indexOf(targetStageId);

  if (targetIndex === -1) {
    return [];
  }

  return allIds.slice(0, targetIndex + 1);
}

/**
 * Generate checklist items for stages up to the target, excluding completed ones
 */
export function getChecklistItemsForStage(
  processStages: ProcessStage[],
  targetStageId: string,
  currentProgress: CurrentProgress,
  listingType?: string
): ChecklistItem[] {
  const stageIdsUpToTarget = getSubstageIdsUpTo(processStages, targetStageId);
  const checklistItems: ChecklistItem[] = [];
  const stageLabels = getStageLabelsByType(listingType);

  for (const stageId of stageIdsUpToTarget) {
    const isCompleted = isStageCompleted(stageId, currentProgress);
    const stageInfo = stageLabels[stageId];

    if (!stageInfo) continue;

    // Special handling for different stages
    let warningMessage: string | undefined;
    let isRequired = true;

    if (stageId === "completar-info") {
      // This is auto-calculated, not directly updatable
      isRequired = false;
    }

    if (stageId === "visitas" && !currentProgress.hasActiveContacts) {
      warningMessage = "No hay contactos activos asociados a esta propiedad";
      isRequired = false;
    }

    checklistItems.push({
      id: stageId,
      label: stageInfo.title,
      description: stageInfo.description,
      isCompleted,
      isRequired,
      warningMessage,
    });
  }

  return checklistItems;
}

/**
 * Check if a specific stage is completed based on current progress
 */
export function isStageCompleted(
  stageId: string,
  progress: CurrentProgress
): boolean {
  switch (stageId) {
    case "alta":
      return true; // Always completed

    case "completar-info":
      return progress.canPublishToPortals;

    case "firma-encargo":
      return progress.hasEncargo;

    case "visitas":
      return progress.hasOfferAccepted;

    case "arras":
      return progress.hasArrasDate;

    case "contrato":
      return progress.hasActualDeedDate;

    case "cierre-final":
      return progress.hasCloseDate && progress.dealStatus === "Closed";

    default:
      return false;
  }
}

/**
 * Filter out completed items from checklist
 */
export function filterIncompleteItems(
  items: ChecklistItem[]
): ChecklistItem[] {
  return items.filter((item) => !item.isCompleted);
}

/**
 * Get the stages that need to be updated based on checklist
 */
export function getStagesToUpdate(
  selectedStageIds: string[],
  currentProgress: CurrentProgress
): string[] {
  return selectedStageIds.filter(
    (stageId) => !isStageCompleted(stageId, currentProgress)
  );
}

/**
 * Validate if all required stages before target are completed
 */
export function validateStageProgression(
  targetStageId: string,
  currentProgress: CurrentProgress,
  processStages: ProcessStage[]
): { isValid: boolean; missingStages: string[] } {
  const stageIdsUpToTarget = getSubstageIdsUpTo(processStages, targetStageId);
  const missingStages: string[] = [];

  for (const stageId of stageIdsUpToTarget) {
    // Skip the target stage itself
    if (stageId === targetStageId) continue;

    // Skip "completar-info" and "visitas" as they have special handling
    if (stageId === "completar-info" || stageId === "visitas") continue;

    if (!isStageCompleted(stageId, currentProgress)) {
      missingStages.push(stageId);
    }
  }

  return {
    isValid: missingStages.length === 0,
    missingStages,
  };
}
