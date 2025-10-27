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
    if (foundCompleted && substage.status !== "accomplished") {
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
      sub => sub.status === "accomplished" || sub.status === "ongoing"
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
        subStages: stage.subStages.map(sub => ({ ...sub, status: "accomplished" as StageStatus }))
      };
    } else if (stageIndex > lastCompletedStageIndex) {
      // All future stages: mark all substages as future
      return {
        ...stage,
        subStages: stage.subStages.map(sub => ({ ...sub, status: "future" as StageStatus }))
      };
    }
    // Current stage: keep as is
    return stage;
  });
}

const rawProcessStages: ProcessStage[] = [
  {
    id: "oportunidad",
    label: "Oportunidad",
    status: "accomplished",
    subStages: [
      { id: "alta", label: "Alta propiedad", status: "accomplished" },
      { id: "completar-info", label: "Ficha completa", status: "accomplished" },
      { id: "firma-encargo", label: "Encargo", status: "future" },
    ],
  },
  {
    id: "busqueda",
    label: "Búsqueda",
    status: "ongoing",
    subStages: [
      { id: "visitas", label: "Visitas", status: "accomplished" },
    ],
  },
  {
    id: "cierre",
    label: "Cierre",
    status: "future",
    subStages: [
      { id: "arras", label: "Arras", status: "future" },
      { id: "contrato", label: "Escritura", status: "future" },
      { id: "cierre-final", label: "Cierre", status: "future" },
    ],
  },
];

// Apply validation: first individual substage progression, then global progression
export const PROCESS_STAGES: ProcessStage[] = validateGlobalProgression(
  rawProcessStages.map(stage => ({
    ...stage,
    subStages: validateSubstageProgression(stage.subStages)
  }))
);

/**
 * Deep clone a process stage to avoid mutation
 */
function cloneProcessStage(stage: ProcessStage): ProcessStage {
  return {
    ...stage,
    subStages: stage.subStages.map(sub => ({ ...sub }))
  };
}

/**
 * Get process stages with dynamic "Ficha completa" status based on listing completion
 * @param listing - Property listing data for completion calculation
 * @returns Process stages with dynamic completion status
 */
export function getProcessStages(listing?: Record<string, unknown>): ProcessStage[] {
  // If no listing data provided, return default stages
  if (!listing) {
    console.log("🔍 getProcessStages: No listing data provided, returning default stages");
    return PROCESS_STAGES;
  }

  // Calculate completion status
  const completion = calculateCompletion(listing);

  // Log completion calculation results
  console.log("📊 Property Completion Calculation:", {
    canPublishToPortals: completion.canPublishToPortals,
    overallPercentage: completion.overallPercentage,
    mandatory: {
      completed: completion.mandatory.completedCount,
      total: completion.mandatory.total,
      pending: completion.mandatory.pending.length,
      pendingFields: completion.mandatory.pending.map(f => f.label),
    },
    optional: {
      completed: completion.nth.completedCount,
      total: completion.nth.total,
      pending: completion.nth.pending.length,
    },
  });

  // Clone raw stages to avoid mutation
  const dynamicStages: ProcessStage[] = rawProcessStages.map(cloneProcessStage);

  // Find and update "Ficha completa" substage based on mandatory field completion
  const oportunidadStage = dynamicStages.find(stage => stage.id === "oportunidad");
  if (oportunidadStage) {
    const fichaCompleta = oportunidadStage.subStages.find(sub => sub.id === "completar-info");
    const encargoSubstage = oportunidadStage.subStages.find(sub => sub.id === "firma-encargo");

    if (fichaCompleta) {
      const previousFichaStatus = fichaCompleta.status;
      // Set to accomplished only if all mandatory fields are complete
      const isFichaComplete = completion.canPublishToPortals;
      fichaCompleta.status = isFichaComplete ? "accomplished" : "future";

      console.log("✨ Ficha completa status update:", {
        previousStatus: previousFichaStatus,
        newStatus: fichaCompleta.status,
        reason: isFichaComplete
          ? "All mandatory fields complete"
          : `${completion.mandatory.pending.length} mandatory fields pending`,
      });

      // Check encargo status from listing
      const hasEncargo = Boolean(listing.encargo);

      console.log("📋 Encargo status check:", {
        hasEncargo,
        encargoValue: listing.encargo,
        isFichaComplete,
      });

      // Step 1: If ficha is not complete, block at "Ficha completa"
      if (!isFichaComplete) {
        const fichaIndex = oportunidadStage.subStages.findIndex(sub => sub.id === "completar-info");
        // Set all substages after "completar-info" in Oportunidad to future
        for (let i = fichaIndex + 1; i < oportunidadStage.subStages.length; i++) {
          oportunidadStage.subStages[i]!.status = "future";
        }

        // Set all stages after Oportunidad to future (including all their substages)
        const oportunidadIndex = dynamicStages.findIndex(stage => stage.id === "oportunidad");
        for (let i = oportunidadIndex + 1; i < dynamicStages.length; i++) {
          const stage = dynamicStages[i];
          if (stage) {
            stage.status = "future";
            stage.subStages.forEach(sub => {
              sub.status = "future";
            });
          }
        }

        console.log("🚫 Step 1: Blocking at 'Ficha completa' - mandatory fields incomplete");
      }
      // Step 2: If ficha is complete but encargo is false, block at "Encargo"
      else if (!hasEncargo && encargoSubstage) {
        // Encargo is pending - mark as ongoing
        encargoSubstage.status = "ongoing";

        // Set all stages after Encargo to future
        const oportunidadIndex = dynamicStages.findIndex(stage => stage.id === "oportunidad");
        for (let i = oportunidadIndex + 1; i < dynamicStages.length; i++) {
          const stage = dynamicStages[i];
          if (stage) {
            stage.status = "future";
            stage.subStages.forEach(sub => {
              sub.status = "future";
            });
          }
        }

        console.log("✋ Step 2: Blocking at 'Encargo' - contract not signed");
      }
      // Step 3: If encargo is true but offerAccepted is false, block at "Visitas"
      else if (hasEncargo && encargoSubstage) {
        // Mark encargo as accomplished
        encargoSubstage.status = "accomplished";

        // Check offerAccepted status
        const hasOfferAccepted = Boolean(listing.offerAccepted);

        console.log("📋 Offer accepted status check:", {
          hasOfferAccepted,
          offerAcceptedValue: listing.offerAccepted,
        });

        if (!hasOfferAccepted) {
          // Find the "Busqueda" stage and "visitas" substage
          const busquedaStage = dynamicStages.find(stage => stage.id === "busqueda");
          const visitasSubstage = busquedaStage?.subStages.find(sub => sub.id === "visitas");

          if (visitasSubstage) {
            // Mark visitas as ongoing
            visitasSubstage.status = "ongoing";

            // Set all stages after Busqueda to future
            const busquedaIndex = dynamicStages.findIndex(stage => stage.id === "busqueda");
            for (let i = busquedaIndex + 1; i < dynamicStages.length; i++) {
              const stage = dynamicStages[i];
              if (stage) {
                stage.status = "future";
                stage.subStages.forEach(sub => {
                  sub.status = "future";
                });
              }
            }

            console.log("🔍 Step 3: Blocking at 'Visitas' - no offer accepted yet");
          }
        } else {
          // Step 4: offerAccepted is true, mark visitas as accomplished and continue
          const busquedaStage = dynamicStages.find(stage => stage.id === "busqueda");
          const visitasSubstage = busquedaStage?.subStages.find(sub => sub.id === "visitas");

          if (visitasSubstage) {
            visitasSubstage.status = "accomplished";
            console.log("✅ Step 4: Offer accepted - progressing to 'Arras' and beyond");
          }
        }
      }
    }
  }

  // Don't apply validation - we want to keep our dynamic status
  // Just ensure internal substage consistency within each stage
  return dynamicStages.map(stage => ({
    ...stage,
    subStages: validateSubstageProgression(stage.subStages)
  }));
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
