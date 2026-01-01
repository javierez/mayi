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
import {
  Plus,
  Users,
  CheckSquare,
  Calendar,
  Phone,
  Clock,
} from "lucide-react";

interface QuickActionsInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickActionsInfoModal({
  open,
  onOpenChange,
}: QuickActionsInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-lg">Acciones Rápidas</DialogTitle>
          <DialogDescription className="text-sm">
            Accesos directos para las tareas más comunes del día a día
          </DialogDescription>
        </DialogHeader>

        {/* Main Explanation - Scrollable */}
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
          {/* Introduction */}
          <div className="space-y-2 rounded-xl border bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
            <p className="text-sm leading-relaxed text-gray-700">
              Las acciones rápidas te permiten realizar las operaciones más
              frecuentes sin navegar por el menú. Ideal para{" "}
              <span className="font-semibold text-gray-900">
                agilizar tu flujo de trabajo
              </span>{" "}
              diario.
            </p>
          </div>

          {/* Actions Explanation */}
          <div className="space-y-3">
            <h4 className="border-b pb-2 text-sm font-semibold text-gray-900">
              Acciones disponibles
            </h4>

            {/* Añadir Propiedad */}
            <div className="flex items-start gap-3 rounded-lg border bg-white p-3 shadow-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <Plus className="h-4 w-4 text-gray-700" />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-900">
                  Añadir Propiedad
                </span>
                <p className="text-xs text-gray-600">
                  Crea una nueva propiedad en tu cartera. Te lleva directamente
                  al formulario de registro donde puedes añadir todos los
                  detalles del inmueble.
                </p>
              </div>
            </div>

            {/* Añadir Contacto */}
            <div className="flex items-start gap-3 rounded-lg border bg-white p-3 shadow-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <Users className="h-4 w-4 text-gray-700" />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-900">
                  Añadir Contacto
                </span>
                <p className="text-xs text-gray-600">
                  Registra un nuevo contacto rápidamente. Puedes añadir
                  propietarios, compradores, inquilinos o cualquier persona
                  relacionada con tus operaciones.
                </p>
              </div>
            </div>

            {/* Crear Tarea */}
            <div className="flex items-start gap-3 rounded-lg border bg-white p-3 shadow-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <CheckSquare className="h-4 w-4 text-gray-700" />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-900">
                  Crear Tarea
                </span>
                <p className="text-xs text-gray-600">
                  Añade una tarea a tu lista de pendientes. Puedes asignar
                  fecha, prioridad y vincularla a una propiedad o contacto
                  específico.
                </p>
              </div>
            </div>

            {/* Programar Cita */}
            <div className="flex items-start gap-3 rounded-lg border bg-white p-3 shadow-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <Calendar className="h-4 w-4 text-gray-700" />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-900">
                  Programar Cita
                </span>
                <p className="text-xs text-gray-600">
                  Agenda una cita o visita directamente en tu calendario. Puedes
                  seleccionar fecha, hora y añadir participantes o notas.
                </p>
              </div>
            </div>

            {/* Acción Rápida */}
            <div className="flex items-start gap-3 rounded-lg border bg-white p-3 shadow-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <Phone className="h-4 w-4 text-gray-700" />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-900">
                  Acción Rápida
                </span>
                <p className="text-xs text-gray-600">
                  Registra rápidamente una llamada, correo o interacción con un
                  contacto. Ideal para mantener el historial de comunicaciones
                  actualizado.
                </p>
              </div>
            </div>

            {/* Historial */}
            <div className="flex items-start gap-3 rounded-lg border bg-white p-3 shadow-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <Clock className="h-4 w-4 text-gray-700" />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-900">
                  Historial
                </span>
                <p className="text-xs text-gray-600">
                  Accede al historial completo de actividades. Revisa todas las
                  acciones realizadas, cambios en propiedades y comunicaciones
                  con contactos.
                </p>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="space-y-2 rounded-xl border bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-900">Consejos</h4>
            <ul className="space-y-1.5 text-xs text-gray-600">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                <span>
                  Usa <strong>Acción Rápida</strong> después de cada llamada
                  para no olvidar registrarla
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                <span>
                  Programa citas directamente desde aquí para mantener tu
                  calendario organizado
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                <span>
                  Crea tareas con recordatorios para no perder seguimientos
                  importantes
                </span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
