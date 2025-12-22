/**
 * Property management process stages configuration
 *
 * Three main categories with subprocesses:
 * - Oportunidad: Initial property onboarding
 * - Búsqueda: Active marketing phase
 * - Cierre: Deal closing phase
 */

import { calculateCompletion } from "~/lib/properties/completion-tracker";

export type StageStatus = "accomplished" | "ongoing" | "future";

export interface SubStage {
  id: string;
  label: string;
  status: StageStatus;
}

export interface ProcessStage {
  id: string;
  label: string;
  status: StageStatus;
  subStages: SubStage[];
}

// Helper function to validate and fix substage progression within a stage
function validateSubstageProgression(subStages: SubStage[]): SubStage[] {
  let foundCompleted = false;

  return subStages.map((substage, _index) => {
    // If we found a completed substage, all previous ones should be completed
    if (substage.status === "accomplished") {
      foundCompleted = true;
    }

    // If we found a completed substage, all subsequent ones should be future
    // BUT: allow "ongoing" status to remain (it's the current step being worked on)
    if (foundCompleted && substage.status !== "accomplished" && substage.status !== "ongoing") {
      return { ...substage, status: "future" as StageStatus };
    }

    return substage;
  });
}

// Helper function to validate global progression across all stages
function validateGlobalProgression(stages: ProcessStage[]): ProcessStage[] {
  // Find the last stage with any completed substage
  let lastCompletedStageIndex = -1;

  stages.forEach((stage, index) => {
    const hasCompletedSubstage = stage.subStages.some(
      (sub) => sub.status === "accomplished" || sub.status === "ongoing",
    );
    if (hasCompletedSubstage) {
      lastCompletedStageIndex = index;
    }
  });

  // If no completed stages found, return as is
  if (lastCompletedStageIndex === -1) {
    return stages;
  }

  // Apply logic: all stages before lastCompletedStageIndex should be completed
  // all stages after should be future
  return stages.map((stage, stageIndex) => {
    if (stageIndex < lastCompletedStageIndex) {
      // All previous stages: mark all substages as accomplished
      return {
        ...stage,
        subStages: stage.subStages.map((sub) => ({
          ...sub,
          status: "accomplished" as StageStatus,
        })),
      };
    } else if (stageIndex > lastCompletedStageIndex) {
      // All future stages: mark all substages as future
      return {
        ...stage,
        subStages: stage.subStages.map((sub) => ({
          ...sub,
          status: "future" as StageStatus,
        })),
      };
    }
    // Current stage: keep as is
    return stage;
  });
}

/**
 * Get the label for a stage based on listing type
 * For rentals, "Arras" becomes "Reserva" and "Escritura" becomes "Firma"
 */
export function getStageLabel(stageId: string, listingType?: string): string {
  const isRent = listingType?.toLowerCase() === "rent";

  const labels: Record<string, { sale: string; rent: string }> = {
    "arras": { sale: "Arras", rent: "Reserva" },
    "contrato": { sale: "Escritura", rent: "Firma" },
  };

  const labelConfig = labels[stageId];
  if (labelConfig) {
    return isRent ? labelConfig.rent : labelConfig.sale;
  }

  // Default labels for stages without rent-specific overrides
  const defaultLabels: Record<string, string> = {
    "alta": "Alta",
    "completar-info": "Ficha completa",
    "firma-encargo": "Encargo",
    "visitas": "Visitas",
    "oferta-aceptada": "Oferta",
    "cierre-final": "Cierre",
  };

  return defaultLabels[stageId] ?? stageId;
}

/**
 * Generate raw process stages with labels based on listing type
 */
function getRawProcessStages(listingType?: string): ProcessStage[] {
  return [
    {
      id: "oportunidad",
      label: "Oportunidad",
      status: "accomplished",
      subStages: [
        { id: "alta", label: getStageLabel("alta", listingType), status: "accomplished" },
        { id: "completar-info", label: getStageLabel("completar-info", listingType), status: "accomplished" },
        { id: "firma-encargo", label: getStageLabel("firma-encargo", listingType), status: "future" },
      ],
    },
    {
      id: "busqueda",
      label: "Búsqueda",
      status: "ongoing",
      subStages: [
        { id: "visitas", label: getStageLabel("visitas", listingType), status: "accomplished" },
        { id: "oferta-aceptada", label: getStageLabel("oferta-aceptada", listingType), status: "future" },
      ],
    },
    {
      id: "cierre",
      label: "Cierre",
      status: "future",
      subStages: [
        { id: "arras", label: getStageLabel("arras", listingType), status: "future" },
        { id: "contrato", label: getStageLabel("contrato", listingType), status: "future" },
        { id: "cierre-final", label: getStageLabel("cierre-final", listingType), status: "future" },
      ],
    },
  ];
}

// Default stages for sale listings (backwards compatibility)
const rawProcessStages: ProcessStage[] = getRawProcessStages();

// Apply validation: first individual substage progression, then global progression
export const PROCESS_STAGES: ProcessStage[] = validateGlobalProgression(
  rawProcessStages.map((stage) => ({
    ...stage,
    subStages: validateSubstageProgression(stage.subStages),
  })),
);

/**
 * Deep clone a process stage to avoid mutation
 */
function cloneProcessStage(stage: ProcessStage): ProcessStage {
  return {
    ...stage,
    subStages: stage.subStages.map((sub) => ({ ...sub })),
  };
}

/**
 * Get process stages with dynamic status based on listing/deal data.
 * Uses REVERSE logic: checks from the END first to find the furthest stage with data.
 * This allows skipping intermediate stages (e.g., if Oferta is accepted but Encargo is missing,
 * the progress bar still fills to 60%).
 *
 * @param listing - Property listing data for completion calculation
 * @param deal - Active deal data for closing stages (arras, escritura, cierre)
 * @returns Process stages with dynamic completion status
 */
export function getProcessStages(
  listing?: Record<string, unknown>,
  deal?: Record<string, unknown> | null,
): ProcessStage[] {
  // If no listing data provided, return default stages
  if (!listing) {
    console.log(
      "🔍 getProcessStages: No listing data provided, returning default stages",
    );
    return PROCESS_STAGES;
  }

  // IMPORTANT: Ensure imageCount defaults to 0 if not present
  const listingWithDefaults = {
    ...listing,
    imageCount: listing.imageCount ?? 0,
  };

  // Calculate completion status
  const completion = calculateCompletion(listingWithDefaults);

  // Extract listingType for label customization
  const listingType = listing.listingType as string | undefined;

  // Clone raw stages with appropriate labels based on listingType
  const dynamicStages: ProcessStage[] = getRawProcessStages(listingType).map(cloneProcessStage);

  // Extract all conditions (check what data exists)
  const isFichaComplete = completion.canPublishToPortals;
  const hasEncargo = Boolean(listing.encargo);
  const hasScheduledVisits = Boolean(listing.hasScheduledVisits);
  const hasOfferAccepted = Boolean(listing.offerAccepted);
  const hasArrasCompleted = deal?.arrasDate != null;
  const hasEscrituraCompleted = deal?.actualDeedDate != null;
  const hasDealClosed = deal?.closeDate != null && deal?.status === "Closed";

  console.log("🔄 REVERSE LOGIC - Checking from end to find furthest stage:", {
    hasDealClosed,
    hasEscrituraCompleted,
    hasArrasCompleted,
    hasOfferAccepted,
    hasScheduledVisits,
    hasEncargo,
    isFichaComplete,
  });

  // Define the stage order and their conditions (from LAST to FIRST)
  // We check from the end and stop at the first true condition
  type StageCheck = {
    id: string;
    condition: boolean;
    percentage: number;
  };

  const stageChecks: StageCheck[] = [
    { id: "cierre-final", condition: hasDealClosed, percentage: 100 },
    { id: "contrato", condition: hasEscrituraCompleted, percentage: 93 },
    { id: "arras", condition: hasArrasCompleted, percentage: 73 },
    { id: "oferta-aceptada", condition: hasOfferAccepted, percentage: 60 },
    { id: "visitas", condition: hasScheduledVisits, percentage: 56 },
    { id: "firma-encargo", condition: hasEncargo, percentage: 43 },
    { id: "completar-info", condition: isFichaComplete, percentage: 24 },
    { id: "alta", condition: true, percentage: 10 }, // Always true - property exists
  ];

  // Find the furthest stage with data (first true condition from the end)
  let furthestStageId = "alta";
  let furthestPercentage = 10;

  for (const check of stageChecks) {
    if (check.condition) {
      furthestStageId = check.id;
      furthestPercentage = check.percentage;
      console.log(`✅ Found furthest stage: ${check.id} (${check.percentage}%)`);
      break;
    }
  }

  console.log(`🎯 Furthest stage with data: ${furthestStageId} (${furthestPercentage}%)`);

  // Build a flat list of all substage IDs in order
  const allSubstageIds: string[] = [];
  dynamicStages.forEach((stage) => {
    stage.subStages.forEach((sub) => {
      allSubstageIds.push(sub.id);
    });
  });

  // Find the index of the furthest stage
  const furthestIndex = allSubstageIds.indexOf(furthestStageId);

  // Mark all stages up to and including the furthest as accomplished
  // Mark all stages after as future
  dynamicStages.forEach((stage) => {
    stage.subStages.forEach((sub) => {
      const subIndex = allSubstageIds.indexOf(sub.id);
      if (subIndex <= furthestIndex) {
        sub.status = "accomplished";
      } else {
        sub.status = "future";
      }
    });

    // Update the parent stage status based on substages
    const hasAccomplished = stage.subStages.some((s) => s.status === "accomplished");
    const allFuture = stage.subStages.every((s) => s.status === "future");
    stage.status = allFuture ? "future" : hasAccomplished ? "accomplished" : "ongoing";
  });

  console.log("📊 Final stage statuses:", {
    stages: dynamicStages.map((s) => ({
      id: s.id,
      status: s.status,
      substages: s.subStages.map((sub) => `${sub.id}: ${sub.status}`),
    })),
  });

  return dynamicStages;
}

/**
 * Get stage styles based on status - Card-based design with elevation
 */
export const getStageStyles = (status: StageStatus) => {
  switch (status) {
    case "accomplished":
      return {
        card: "bg-white shadow-lg",
        badge: "bg-slate-600 text-slate-200 shadow-md font-bold",
        title: "text-slate-700",
        substage: "bg-slate-100 text-slate-600 shadow-sm",
        connector: "text-slate-400 drop-shadow-sm",
        arrow: "text-slate-500",
      };
    case "ongoing":
      return {
        card: "bg-white shadow-lg",
        badge: "bg-slate-600 text-slate-200 shadow-md font-bold",
        title: "text-slate-700",
        substage: "bg-slate-100 text-slate-600 shadow-sm",
        connector: "text-slate-400 drop-shadow-sm",
        arrow: "text-slate-500",
      };
    case "future":
      return {
        card: "bg-white/30 shadow-sm backdrop-blur-sm",
        badge: "bg-gray-200/50 text-gray-400 shadow-sm",
        title: "text-gray-400",
        substage: "bg-gray-100/40 text-gray-400 shadow-sm",
        connector: "text-gray-400 drop-shadow-sm",
        arrow: "text-gray-500/50",
      };
  }
};
