"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Search } from "lucide-react";

interface CrucesInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CrucesInfoModal({
  open,
  onOpenChange,
}: CrucesInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>¿Qué son los Cruces?</DialogTitle>
          <DialogDescription>
            Encuentra coincidencias entre demandas y propiedades
          </DialogDescription>
        </DialogHeader>

        {/* Main Explanation - Scrollable */}
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-700">
              Los <span className="font-semibold">cruces</span> son el punto de
              encuentro entre las <span className="font-semibold">demandas de los clientes</span> y las{" "}
              <span className="font-semibold">propiedades en cartera</span>.
            </p>
            <p className="mt-2 text-sm text-gray-600">
              El sistema identifica automáticamente qué propiedades disponibles
              coinciden con los criterios de búsqueda de cada cliente,
              ahorrándote tiempo y ayudándote a cerrar operaciones más rápido.
            </p>
          </div>

          {/* Example Section - Schema */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">
              ¿Cómo funciona? Ejemplo paso a paso:
            </h4>

            {/* Step 1: Client creates demand */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-xs font-semibold text-white">
                  1
                </div>
                <span className="text-xs font-medium text-gray-700">
                  Un cliente te contacta con su búsqueda
                </span>
              </div>
              <div className="ml-8 rounded-lg border border-gray-200 bg-white p-3">
                <p className="mb-2 text-xs font-medium text-gray-900">
                  María López busca:
                </p>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-700">Tipo:</span>
                    <span>Alquiler de Piso</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-700">Precio:</span>
                    <span>Máximo €1,200/mes</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-700">Habitaciones:</span>
                    <span>Mínimo 2 habitaciones</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-700">Baños:</span>
                    <span>Mínimo 1 baño</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-700">Zona:</span>
                    <span>Chamberí o Salamanca (Madrid)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: System searches */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-xs font-semibold text-white">
                  2
                </div>
                <span className="text-xs font-medium text-gray-700">
                  El sistema busca automáticamente en tu cartera
                </span>
              </div>
              <div className="ml-8 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-3">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Search className="h-4 w-4" />
                  <span className="italic">Analizando propiedades disponibles...</span>
                </div>
              </div>
            </div>

            {/* Step 3: Match found */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-xs font-semibold text-white">
                  3
                </div>
                <span className="text-xs font-medium text-gray-700">
                  ¡Cruce encontrado! Coincidencia perfecta
                </span>
              </div>
              <div className="ml-8 rounded-lg border border-gray-300 bg-white p-3">
                <p className="mb-2 text-xs font-medium text-gray-900">
                  Propiedad disponible: Ref. #A-245
                </p>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-700">Tipo:</span>
                    <span>Alquiler de Piso</span>
                    <span className="ml-auto text-gray-400">✓ Coincide</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-700">Precio:</span>
                    <span>€1,100/mes</span>
                    <span className="ml-auto text-gray-400">✓ Dentro del presupuesto</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-700">Habitaciones:</span>
                    <span>3 habitaciones</span>
                    <span className="ml-auto text-gray-400">✓ Cumple requisito</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-700">Baños:</span>
                    <span>2 baños</span>
                    <span className="ml-auto text-gray-400">✓ Cumple requisito</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-700">Zona:</span>
                    <span>Chamberí, Madrid</span>
                    <span className="ml-auto text-gray-400">✓ Zona preferida</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Action */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-xs font-semibold text-white">
                  4
                </div>
                <span className="text-xs font-medium text-gray-700">
                  Contacta a María y cierra la operación
                </span>
              </div>
              <div className="ml-8 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-600">
                  Comparte la propiedad con María por email, WhatsApp o SMS directamente desde el sistema.
                </p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h4 className="mb-2 text-sm font-semibold text-gray-900">
              Beneficios:
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Identifica oportunidades automáticamente</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Ahorra tiempo en la búsqueda manual</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Aumenta la satisfacción de tus clientes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Cierra operaciones más rápidamente</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Entendido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
