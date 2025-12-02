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
  const isRent = listingType === "rent";

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
 * Get process stages with dynamic "Ficha completa" status based on listing completion
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
  // This prevents validation from failing when listing is passed before imageCount is merged
  const listingWithDefaults = {
    ...listing,
    imageCount: listing.imageCount ?? 0,
  };

  // Calculate completion status
  const completion = calculateCompletion(listingWithDefaults);

  // Extract listingType for label customization
  const listingType = listing.listingType as string | undefined;

  // Log completion calculation results
  console.log("📊 Property Completion Calculation:", {
    canPublishToPortals: completion.canPublishToPortals,
    overallPercentage: completion.overallPercentage,
    listingType,
    mandatory: {
      completed: completion.mandatory.completedCount,
      total: completion.mandatory.total,
      pending: completion.mandatory.pending.length,
      pendingFields: completion.mandatory.pending.map((f) => f.label),
    },
    optional: {
      completed: completion.nth.completedCount,
      total: completion.nth.total,
      pending: completion.nth.pending.length,
    },
  });

  // Clone raw stages with appropriate labels based on listingType
  const dynamicStages: ProcessStage[] = getRawProcessStages(listingType).map(cloneProcessStage);

  // Find and update "Ficha completa" substage based on mandatory field completion
  const oportunidadStage = dynamicStages.find(
    (stage) => stage.id === "oportunidad",
  );
  if (oportunidadStage) {
    const fichaCompleta = oportunidadStage.subStages.find(
      (sub) => sub.id === "completar-info",
    );
    const encargoSubstage = oportunidadStage.subStages.find(
      (sub) => sub.id === "firma-encargo",
    );

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
        const fichaIndex = oportunidadStage.subStages.findIndex(
          (sub) => sub.id === "completar-info",
        );
        // Set all substages after "completar-info" in Oportunidad to future
        for (
          let i = fichaIndex + 1;
          i < oportunidadStage.subStages.length;
          i++
        ) {
          oportunidadStage.subStages[i]!.status = "future";
        }

        // Set all stages after Oportunidad to future (including all their substages)
        const oportunidadIndex = dynamicStages.findIndex(
          (stage) => stage.id === "oportunidad",
        );
        for (let i = oportunidadIndex + 1; i < dynamicStages.length; i++) {
          const stage = dynamicStages[i];
          if (stage) {
            stage.status = "future";
            stage.subStages.forEach((sub) => {
              sub.status = "future";
            });
          }
        }

        console.log(
          "🚫 Step 1: Blocking at 'Ficha completa' - mandatory fields incomplete",
        );
        console.log("   Missing fields:", completion.mandatory.pending.map((f) => f.label).join(", "));
      }
      // Step 2: If ficha is complete but encargo is false, stay at "Ficha completa" (24%)
      // Encargo is a boolean - it's either done (true) or not done (false)
      // If false, keep encargo as "future" and stay at Ficha (24%)
      else if (!hasEncargo && encargoSubstage) {
        // Keep encargo as future (not started yet)
        encargoSubstage.status = "future";

        // Set all stages after Oportunidad to future
        const oportunidadIndex = dynamicStages.findIndex(
          (stage) => stage.id === "oportunidad",
        );
        for (let i = oportunidadIndex + 1; i < dynamicStages.length; i++) {
          const stage = dynamicStages[i];
          if (stage) {
            stage.status = "future";
            stage.subStages.forEach((sub) => {
              sub.status = "future";
            });
          }
        }

        console.log("✋ Step 2: Staying at 'Ficha completa' (24%) - encargo not signed yet");
        console.log("   Need to complete: Encargo (firma de contrato)");
        console.log("   Debug - encargo value:", {
          hasEncargo,
          encargoValue: listing.encargo,
          encargoType: typeof listing.encargo,
        });
      }
      // Step 3: If encargo is true but offerAccepted is false, block at "Visitas"
      else if (hasEncargo && encargoSubstage) {
        // Mark encargo as accomplished
        encargoSubstage.status = "accomplished";

        // Check offerAccepted status
        const hasOfferAccepted = Boolean(listing.offerAccepted);

        console.log("📋 Step 3: Encargo is true, checking offer status:", {
          hasEncargo,
          hasOfferAccepted,
          offerAcceptedValue: listing.offerAccepted,
          hasScheduledVisits: listing.hasScheduledVisits,
        });

        if (!hasOfferAccepted) {
          // Check if there are scheduled visits
          const hasScheduledVisits = Boolean(listing.hasScheduledVisits);

          console.log("🔍 Visits check (scheduled or completed):", {
            hasScheduledVisits,
            hasScheduledVisitsValue: listing.hasScheduledVisits,
            hasScheduledVisitsType: typeof listing.hasScheduledVisits,
            encargo: listing.encargo,
            offerAccepted: listing.offerAccepted,
          });

          // Find the "Busqueda" stage and "visitas" & "oferta-aceptada" substages
          const busquedaStage = dynamicStages.find(
            (stage) => stage.id === "busqueda",
          );
          const visitasSubstage = busquedaStage?.subStages.find(
            (sub) => sub.id === "visitas",
          );
          const ofertaSubstage = busquedaStage?.subStages.find(
            (sub) => sub.id === "oferta-aceptada",
          );

          if (hasScheduledVisits && visitasSubstage) {
            // Has scheduled visits - mark visitas as accomplished (56%)
            // NO "ongoing" for milestones - use accomplished/future only
            visitasSubstage.status = "accomplished";

            // Mark oferta-aceptada as future
            if (ofertaSubstage) {
              ofertaSubstage.status = "future";
            }

            // Set all stages after Busqueda to future
            const busquedaIndex = dynamicStages.findIndex(
              (stage) => stage.id === "busqueda",
            );
            for (let i = busquedaIndex + 1; i < dynamicStages.length; i++) {
              const stage = dynamicStages[i];
              if (stage) {
                stage.status = "future";
                stage.subStages.forEach((sub) => {
                  sub.status = "future";
                });
              }
            }

            console.log(
              "🔍 Step 3: Has scheduled visits - 'Visitas' accomplished (56%)",
            );
            console.log("   Next step: Accept an offer from a contact");
          } else {
            // No scheduled visits - stay at Encargo (43%)
            // Keep visitas as future (not started yet)
            if (visitasSubstage) {
              visitasSubstage.status = "future";
            }
            if (ofertaSubstage) {
              ofertaSubstage.status = "future";
            }

            // Set all stages after Oportunidad to future
            const oportunidadIndex = dynamicStages.findIndex(
              (stage) => stage.id === "oportunidad",
            );
            for (let i = oportunidadIndex + 1; i < dynamicStages.length; i++) {
              const stage = dynamicStages[i];
              if (stage) {
                stage.status = "future";
                stage.subStages.forEach((sub) => {
                  sub.status = "future";
                });
              }
            }

            console.log(
              "📋 Step 3: No scheduled visits - staying at 'Encargo' (43%)",
            );
            console.log("   Need to complete: Schedule visits to show the property");
          }
        } else {
          // Step 4: offerAccepted is true, mark visitas as accomplished and oferta-aceptada as ongoing
          const busquedaStage = dynamicStages.find(
            (stage) => stage.id === "busqueda",
          );
          const visitasSubstage = busquedaStage?.subStages.find(
            (sub) => sub.id === "visitas",
          );
          const ofertaSubstage = busquedaStage?.subStages.find(
            (sub) => sub.id === "oferta-aceptada",
          );

          if (visitasSubstage) {
            visitasSubstage.status = "accomplished";

            // Mark oferta-aceptada as accomplished (offer has been accepted)
            // NO "ongoing" for milestones - use accomplished/future only
            if (ofertaSubstage) {
              ofertaSubstage.status = "accomplished";
            }

            // Check deal data for closing stages (arras, escritura, cierre)
            const hasArrasCompleted = deal?.arrasDate != null;
            const hasEscrituraCompleted = deal?.actualDeedDate != null;
            const hasDealClosed =
              deal?.closeDate != null && deal?.status === "Closed";

            console.log("📋 Closing stages status check:", {
              hasDeal: Boolean(deal),
              hasArrasCompleted,
              arrasDate: deal?.arrasDate,
              hasEscrituraCompleted,
              actualDeedDate: deal?.actualDeedDate,
              hasDealClosed,
              closeDate: deal?.closeDate,
              dealStatus: deal?.status,
            });

            const cierreStage = dynamicStages.find(
              (stage) => stage.id === "cierre",
            );
            const arrasSubstage = cierreStage?.subStages.find(
              (sub) => sub.id === "arras",
            );
            const escrituraSubstage = cierreStage?.subStages.find(
              (sub) => sub.id === "contrato",
            );
            const cierreSubstage = cierreStage?.subStages.find(
              (sub) => sub.id === "cierre-final",
            );

            if (!hasArrasCompleted) {
              // Step 4a: Arras not completed, oferta-aceptada ongoing (60%), mark arras as future
              // Keep oferta-aceptada as ongoing (current step)
              // Arras is future because it hasn't been started yet
              if (arrasSubstage) {
                arrasSubstage.status = "future";
              }

              // Set all stages after Arras to future
              if (escrituraSubstage) escrituraSubstage.status = "future";
              if (cierreSubstage) cierreSubstage.status = "future";

              console.log(
                "✅ Step 4a: Offer accepted - 'Oferta Aceptada' ongoing (60%), 'Arras' is future (not started)",
              );
              console.log("   Current step: Oferta Aceptada (60%)");
              console.log("   Next step: Sign arras (deposit contract)");
            } else if (!hasEscrituraCompleted) {
              // Step 4b: Arras completed, Escritura not completed
              // Mark oferta-aceptada as accomplished (offer was accepted)
              // Mark arras as accomplished (arras has been signed)
              // Mark escritura as FUTURE (not started yet) - NO "ongoing" for milestones
              if (ofertaSubstage) {
                ofertaSubstage.status = "accomplished";
              }
              if (arrasSubstage) {
                arrasSubstage.status = "accomplished";
              }
              if (escrituraSubstage) {
                escrituraSubstage.status = "future";
              }

              // Set Cierre to future
              if (cierreSubstage) cierreSubstage.status = "future";

              console.log(
                "📝 Step 5: Arras completed (73%) - Escritura is next (future)",
              );
              console.log("   Need to complete: Sign escritura (public deed)");
            } else if (!hasDealClosed) {
              // Step 6: Escritura completed, deal not closed
              // Mark all previous stages as accomplished
              // Mark cierre as FUTURE (not started yet) - NO "ongoing" for milestones
              if (ofertaSubstage) {
                ofertaSubstage.status = "accomplished";
              }
              if (arrasSubstage) {
                arrasSubstage.status = "accomplished";
              }
              if (escrituraSubstage) {
                escrituraSubstage.status = "accomplished";
              }
              if (cierreSubstage) {
                cierreSubstage.status = "future";
              }

              console.log(
                "🏁 Step 7: Escritura completed (93%) - Cierre is next (future)",
              );
              console.log("   Need to complete: Close the deal (set close date and status)");
            } else {
              // Step 7: Deal fully closed
              // Mark all stages as accomplished
              if (ofertaSubstage) {
                ofertaSubstage.status = "accomplished";
              }
              if (arrasSubstage) {
                arrasSubstage.status = "accomplished";
              }
              if (escrituraSubstage) {
                escrituraSubstage.status = "accomplished";
              }
              if (cierreSubstage) {
                cierreSubstage.status = "accomplished";
              }

              console.log(
                "🎉 Step 8: Deal fully closed (100%) - all stages completed!",
              );
            }
          }
        }
      }
    }
  }

  // Don't apply validation - we want to keep our dynamic status
  // Just ensure internal substage consistency within each stage
  return dynamicStages.map((stage) => ({
    ...stage,
    subStages: validateSubstageProgression(stage.subStages),
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
