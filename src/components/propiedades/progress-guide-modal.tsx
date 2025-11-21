"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Info } from "lucide-react";
import { cn } from "~/lib/utils";

interface ProgressGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProgressStage {
  id: string;
  label: string;
  percentage: number;
  description: string;
  requirements: string[];
}

const progressStages: ProgressStage[] = [
  {
    id: "alta",
    label: "Alta",
    percentage: 10,
    description: "Property has been created in the system",
    requirements: [
      "The property exists in the system",
      "Basic property registration is complete",
    ],
  },
  {
    id: "completar-info",
    label: "Ficha Completa",
    percentage: 24,
    description: "Property information is complete and ready for marketing",
    requirements: [
      "All mandatory fields are filled in",
      "At least one property image has been uploaded",
      "Property can be published to external portals",
    ],
  },
  {
    id: "firma-encargo",
    label: "Encargo",
    percentage: 43,
    description: "Listing agreement signed with the property owner",
    requirements: [
      "Property information must be complete (Ficha Completa)",
      "Encargo contract has been signed",
      "Property is officially under your agency's representation",
    ],
  },
  {
    id: "visitas",
    label: "Visitas",
    percentage: 56,
    description: "Property showings are being scheduled and conducted",
    requirements: [
      "Encargo must be signed",
      "At least one property showing has been scheduled",
      "Active efforts to show the property to potential buyers",
    ],
  },
  {
    id: "oferta-aceptada",
    label: "Oferta",
    percentage: 60,
    description: "A purchase offer has been accepted by the owner",
    requirements: [
      "Property showings have been conducted",
      "A buyer has made an offer",
      "The property owner has accepted the offer",
    ],
  },
  {
    id: "arras",
    label: "Arras",
    percentage: 73,
    description: "Deposit contract signed and earnest money paid",
    requirements: [
      "Offer has been accepted",
      "Arras contract has been signed by both parties",
      "Buyer has paid the deposit (earnest money)",
    ],
  },
  {
    id: "contrato",
    label: "Escritura",
    percentage: 93,
    description: "Public deed signed at the notary",
    requirements: [
      "Arras contract has been completed",
      "Public deed (escritura) has been signed at the notary",
      "Property ownership transfer is formalized",
    ],
  },
  {
    id: "cierre-final",
    label: "Cierre",
    percentage: 100,
    description: "Deal completed successfully",
    requirements: [
      "Public deed has been signed",
      "Final payment has been completed",
      "Keys have been handed over to the buyer",
      "Deal status is marked as 'Closed' in the system",
    ],
  },
];

export function ProgressGuideModal({ open, onOpenChange }: ProgressGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Info className="h-5 w-5 text-amber-600" />
            Property Progress Guide
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Introduction */}
          <div className="rounded-lg bg-amber-50 p-4">
            <p className="text-sm text-gray-700">
              This guide explains each stage of the property sales process and what needs to be
              completed to reach each milestone. The progress bar fills automatically as you
              complete each stage.
            </p>
          </div>

          {/* Visual Progress Bar Overview */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
              Complete Progress Timeline
            </h3>
            <div className="relative h-12 overflow-hidden rounded-full border border-gray-200 bg-gradient-to-br from-gray-100 to-gray-50 shadow-inner">
              {/* Full progress gradient */}
              <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-amber-400 via-amber-500 to-rose-400" />

              {/* Milestone markers */}
              <div className="absolute inset-0 flex">
                {progressStages.slice(0, -1).map((stage, index) => {
                  const isLast = index === progressStages.length - 2;
                  return (
                    <div
                      key={stage.id}
                      className="relative flex-1"
                    >
                      {!isLast && (
                        <div className="absolute right-0 top-1/2 h-[70%] w-[2px] -translate-y-1/2 bg-white/60" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Percentage labels */}
            <div className="flex justify-between px-1 text-[10px] font-semibold text-gray-600">
              {progressStages.map((stage) => (
                <div key={stage.id} className="text-center">
                  {stage.percentage}%
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Stage Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
              Stage Details
            </h3>

            <div className="space-y-4">
              {progressStages.map((stage, index) => (
                <div
                  key={stage.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                >
                  {/* Stage Header */}
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-400 text-sm font-bold text-white shadow-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-gray-800">{stage.label}</h4>
                        <p className="text-xs text-gray-500">Progress: {stage.percentage}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar for this stage */}
                  <div className="mb-3">
                    <div className="relative h-3 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
                        style={{ width: `${stage.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mb-3 text-sm text-gray-700">{stage.description}</p>

                  {/* Requirements */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Requirements to reach this stage:
                    </p>
                    <ul className="space-y-1.5">
                      {stage.requirements.map((requirement, reqIndex) => (
                        <li key={reqIndex} className="flex items-start gap-2 text-sm text-gray-700">
                          <span
                            className={cn(
                              "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs",
                              "bg-amber-100 text-amber-700",
                            )}
                          >
                            ✓
                          </span>
                          <span>{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Note */}
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> The progress bar updates automatically as you complete each
              stage. If you need to update a specific stage, click on the stage label in the main
              progress bar to open the stage details modal.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
