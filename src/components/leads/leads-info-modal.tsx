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
import { Calendar, FileCheck, CheckCircle2, Lightbulb, TrendingUp } from "lucide-react";

interface LeadsInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadsInfoModal({
  open,
  onOpenChange,
}: LeadsInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">¿Qué son las Conexiones?</DialogTitle>
          <DialogDescription className="text-base">
            Gestiona el proceso completo desde el primer contacto hasta cerrar la operación
          </DialogDescription>
        </DialogHeader>

        {/* Main Explanation - Scrollable */}
        <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-2">
          {/* Introduction */}
          <div className="space-y-3 rounded-xl border bg-gradient-to-br from-gray-50 to-white p-5 shadow-sm">
            <p className="leading-relaxed text-gray-700">
              Las <span className="font-semibold text-gray-900">conexiones</span> representan la
              relación activa entre un <span className="font-semibold text-gray-900">demandante</span> interesado
              y una <span className="font-semibold text-gray-900">propiedad específica</span>.
            </p>
            <p className="text-sm leading-relaxed text-gray-600">
              El sistema te acompaña en todo el ciclo de venta: desde agendar la primera cita,
              hacer seguimiento de las visitas, gestionar ofertas, hasta cerrar la operación.
            </p>
          </div>

          {/* Lead Workflow */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">
                Flujo de trabajo
              </h4>
            </div>

            {/* Stage 1: Cita Pendiente */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 font-semibold text-white shadow-sm">
                  1
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-700" />
                  <span className="font-semibold text-gray-900">
                    Cita Pendiente
                  </span>
                </div>
              </div>
              <div className="ml-12 space-y-3 rounded-lg border bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-900">
                  Estado inicial: Contacto interesado en una propiedad
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                    <span>Se crea la conexión cuando un contacto muestra interés en una propiedad</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                    <span>Agenda una cita para mostrar la propiedad</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                    <span>Cuando la cita se completa, avanza automáticamente a la siguiente etapa</span>
                  </li>
                </ul>
                <div className="rounded-md border-l-2 border-gray-300 bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-700">Ejemplo:</p>
                  <p className="mt-1 text-xs italic leading-relaxed text-gray-600">
                    &ldquo;María López quiere ver el piso en C/ Serrano, 123&rdquo; → Se crea la conexión
                    y agendas la visita para el martes a las 10:00
                  </p>
                </div>
              </div>
            </div>

            {/* Stage 2: Oferta Pendiente */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 font-semibold text-white shadow-sm">
                  2
                </div>
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-gray-700" />
                  <span className="font-semibold text-gray-900">
                    Oferta Pendiente
                  </span>
                </div>
              </div>
              <div className="ml-12 space-y-3 rounded-lg border bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-900">
                  Después de la visita: Esperando oferta del cliente
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                    <span>La visita se completó y el cliente está interesado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                    <span>Esperando que el cliente haga una oferta formal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                    <span>Registra la oferta cuando el cliente la presente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                    <span>Cuando se registra la oferta, avanza automáticamente</span>
                  </li>
                </ul>
                <div className="rounded-md border-l-2 border-gray-300 bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-700">Ejemplo:</p>
                  <p className="mt-1 text-xs italic leading-relaxed text-gray-600">
                    María visitó la propiedad y le gustó mucho. Está preparando una oferta
                    de €245,000. Mientras tanto, haces seguimiento.
                  </p>
                </div>
              </div>
            </div>

            {/* Stage 3: Oferta Aceptada Pendiente */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 font-semibold text-white shadow-sm">
                  3
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-gray-700" />
                  <span className="font-semibold text-gray-900">
                    Oferta Aceptada Pendiente
                  </span>
                </div>
              </div>
              <div className="ml-12 space-y-3 rounded-lg border bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-900">
                  Oferta presentada: Esperando aceptación del propietario
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                    <span>El cliente ha hecho una oferta formal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                    <span>Presentas la oferta al propietario y esperas respuesta</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                    <span>Si se acepta la oferta, marca la conexión como &ldquo;Oferta Aceptada&rdquo;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                    <span>Continúa con el proceso de cierre (arras, escritura, etc.)</span>
                  </li>
                </ul>
                <div className="rounded-md border-l-2 border-gray-300 bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-700">Ejemplo:</p>
                  <p className="mt-1 text-xs italic leading-relaxed text-gray-600">
                    María ofreció €245,000. El propietario está considerando la oferta.
                    Si acepta, ¡operación cerrada!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lead Sources */}
          <div className="space-y-3 rounded-xl border bg-white p-5 shadow-sm">
            <h4 className="font-semibold text-gray-900">
              ¿De dónde vienen las Conexiones?
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex gap-3 rounded-lg border bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Citas</p>
                  <p className="text-xs text-gray-600">Desde el calendario</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-lg border bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Cruces</p>
                  <p className="text-xs text-gray-600">Del buscador de cruces</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-lg border bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Web/Portal</p>
                  <p className="text-xs text-gray-600">Consultas online</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-lg border bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Walk-In</p>
                  <p className="text-xs text-gray-600">Visitas a oficina</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="space-y-3 rounded-xl border bg-gradient-to-br from-gray-50 to-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">
                Ventajas principales
              </h4>
            </div>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <span>Seguimiento visual del estado de cada negociación en tiempo real</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <span>Transiciones automáticas según avanza el proceso de venta</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <span>Filtros avanzados para priorizar las conexiones más prometedoras</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <span>Gestión completa de ofertas con historial y notas</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <span>Cierra operaciones más rápido con seguimiento organizado</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
