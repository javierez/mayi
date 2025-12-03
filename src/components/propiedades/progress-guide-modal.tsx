"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Info, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { ProcessStage } from "~/lib/constants/process-stages";
import { ProgressBarDisplay } from "./progress-bar-display";

interface ProgressGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processStages: ProcessStage[];
  progressPercent: number;
  substagePercentages: Record<string, number>;
  listingType?: string;
}

interface StageGuide {
  id: string;
  label: string;
  percentage: number;
  description: string;
  requirements: string[];
}

// Stage guides for sale listings
const stageGuidesSale: StageGuide[] = [
  {
    id: "alta",
    label: "Alta",
    percentage: 10,
    description: "La propiedad ha sido creada en el sistema",
    requirements: [
      "La propiedad existe en el sistema",
      "El registro básico de la propiedad está completo",
    ],
  },
  {
    id: "completar-info",
    label: "Ficha Completa",
    percentage: 24,
    description: "La información de la propiedad está completa y lista para comercializar",
    requirements: [
      "Todos los campos obligatorios están completados",
      "Se ha subido al menos una imagen de la propiedad",
      "La propiedad puede publicarse en portales externos",
    ],
  },
  {
    id: "firma-encargo",
    label: "Encargo",
    percentage: 43,
    description: "Contrato de encargo firmado con el propietario",
    requirements: [
      "La información de la propiedad debe estar completa (Ficha Completa)",
      "El contrato de encargo ha sido firmado",
      "La propiedad está oficialmente bajo representación de tu agencia",
    ],
  },
  {
    id: "visitas",
    label: "Visitas",
    percentage: 56,
    description: "Se están programando y realizando visitas a la propiedad",
    requirements: [
      "El encargo debe estar firmado",
      "Se ha programado al menos una visita a la propiedad",
      "Hay esfuerzos activos para mostrar la propiedad a potenciales compradores",
    ],
  },
  {
    id: "oferta-aceptada",
    label: "Oferta",
    percentage: 60,
    description: "Una oferta de compra ha sido aceptada por el propietario",
    requirements: [
      "Se han realizado visitas a la propiedad",
      "Un comprador ha hecho una oferta",
      "El propietario ha aceptado la oferta",
    ],
  },
  {
    id: "arras",
    label: "Arras",
    percentage: 73,
    description: "Contrato de arras firmado y señal pagada",
    requirements: [
      "La oferta ha sido aceptada",
      "El contrato de arras ha sido firmado por ambas partes",
      "El comprador ha pagado la señal (arras)",
    ],
  },
  {
    id: "contrato",
    label: "Escritura",
    percentage: 93,
    description: "Escritura pública firmada ante notario",
    requirements: [
      "El contrato de arras ha sido completado",
      "La escritura pública ha sido firmada ante notario",
      "La transferencia de propiedad está formalizada",
    ],
  },
  {
    id: "cierre-final",
    label: "Cierre",
    percentage: 100,
    description: "Operación completada exitosamente",
    requirements: [
      "La escritura pública ha sido firmada",
      "El pago final ha sido completado",
      "Las llaves han sido entregadas al comprador",
      "El estado de la operación está marcado como 'Cerrado' en el sistema",
    ],
  },
];

// Stage guides for rent listings
const stageGuidesRent: StageGuide[] = [
  {
    id: "alta",
    label: "Alta",
    percentage: 10,
    description: "La propiedad ha sido creada en el sistema",
    requirements: [
      "La propiedad existe en el sistema",
      "El registro básico de la propiedad está completo",
    ],
  },
  {
    id: "completar-info",
    label: "Ficha Completa",
    percentage: 24,
    description: "La información de la propiedad está completa y lista para comercializar",
    requirements: [
      "Todos los campos obligatorios están completados",
      "Se ha subido al menos una imagen de la propiedad",
      "La propiedad puede publicarse en portales externos",
    ],
  },
  {
    id: "firma-encargo",
    label: "Encargo",
    percentage: 43,
    description: "Contrato de encargo firmado con el propietario",
    requirements: [
      "La información de la propiedad debe estar completa (Ficha Completa)",
      "El contrato de encargo ha sido firmado",
      "La propiedad está oficialmente bajo representación de tu agencia",
    ],
  },
  {
    id: "visitas",
    label: "Visitas",
    percentage: 56,
    description: "Se están programando y realizando visitas a la propiedad",
    requirements: [
      "El encargo debe estar firmado",
      "Se ha programado al menos una visita a la propiedad",
      "Hay esfuerzos activos para mostrar la propiedad a potenciales inquilinos",
    ],
  },
  {
    id: "oferta-aceptada",
    label: "Oferta",
    percentage: 60,
    description: "Una oferta de alquiler ha sido aceptada por el propietario",
    requirements: [
      "Se han realizado visitas a la propiedad",
      "Un inquilino ha hecho una oferta",
      "El propietario ha aceptado la oferta",
    ],
  },
  {
    id: "arras",
    label: "Reserva",
    percentage: 73,
    description: "Contrato de reserva firmado y depósito pagado",
    requirements: [
      "La oferta ha sido aceptada",
      "El contrato de reserva ha sido firmado",
      "El inquilino ha pagado el depósito de reserva",
    ],
  },
  {
    id: "contrato",
    label: "Firma",
    percentage: 93,
    description: "Contrato de alquiler firmado",
    requirements: [
      "La reserva ha sido completada",
      "El contrato de alquiler ha sido firmado por ambas partes",
      "La fianza ha sido entregada",
    ],
  },
  {
    id: "cierre-final",
    label: "Cierre",
    percentage: 100,
    description: "Operación completada exitosamente",
    requirements: [
      "El contrato de alquiler ha sido firmado",
      "El primer mes de alquiler ha sido pagado",
      "Las llaves han sido entregadas al inquilino",
      "El estado de la operación está marcado como 'Cerrado' en el sistema",
    ],
  },
];

/**
 * Get stage guides based on listing type
 */
function getStageGuides(listingType?: string): StageGuide[] {
  return listingType?.toLowerCase() === "rent" ? stageGuidesRent : stageGuidesSale;
}

export function ProgressGuideModal({
  open,
  onOpenChange,
  processStages,
  progressPercent,
  substagePercentages,
  listingType,
}: ProgressGuideModalProps) {
  // Get stage guides based on listing type (sale vs rent)
  const stageGuides = getStageGuides(listingType);
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="custom-scrollbar max-h-[90vh] overflow-y-auto sm:max-w-[700px] [&>button]:hidden">
        <DialogHeader className="space-y-0 -mb-4">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 flex-1">
              <Info className="h-5 w-5 text-amber-600" />
              Guía de Progreso
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Introduction */}
          <div className="rounded-lg bg-amber-50 p-3">
            <p className="text-xs text-gray-600">
              La barra de progreso se actualiza automáticamente al completar cada etapa del proceso de venta.
            </p>
          </div>

          {/* Current Progress Bar */}
          <div>
            <div className="px-2">
              <ProgressBarDisplay
                processStages={processStages}
                progressPercent={progressPercent}
                substagePercentages={substagePercentages}
                compact={false}
              />
            </div>
            <div className="text-center mt-2">
              <p className="text-xs font-medium text-gray-600">
                {progressPercent}%
              </p>
            </div>
          </div>

          {/* Detailed Stage Information */}
          <div className="space-y-2.5">
              {stageGuides.map((stage) => (
                <div
                  key={stage.id}
                  className="rounded-lg border border-gray-100 bg-gray-50/50 p-3"
                >
                  {/* Actual Progress Bar at this stage - Compact version */}
                  <div className="px-2 mb-5">
                    <ProgressBarDisplay
                      processStages={processStages}
                      progressPercent={stage.percentage}
                      substagePercentages={substagePercentages}
                      compact={true}
                    />
                  </div>

                  {/* Description */}
                  <p className="mb-2 text-xs text-gray-600">{stage.description}</p>

                  {/* Requirements */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                      Requisitos:
                    </p>
                    <ul className="space-y-1">
                      {stage.requirements.map((requirement, reqIndex) => (
                        <li key={reqIndex} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <span className="mt-0.5 text-amber-500">•</span>
                          <span>{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
