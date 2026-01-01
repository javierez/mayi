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
import { Search, Link2, Handshake, ArrowRight } from "lucide-react";

interface OperacionesInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OperacionesInfoModal({
  open,
  onOpenChange,
}: OperacionesInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-lg">Panel de Operaciones</DialogTitle>
          <DialogDescription className="text-sm">
            Tu centro de control para gestionar ventas y alquileres
          </DialogDescription>
        </DialogHeader>

        {/* Main Explanation - Scrollable */}
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
          {/* Introduction */}
          <div className="space-y-2 rounded-xl border bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
            <p className="text-sm leading-relaxed text-gray-700">
              El panel de operaciones te permite ver de un vistazo el estado de
              tu negocio inmobiliario, separando{" "}
              <span className="font-semibold text-gray-900">ventas</span> y{" "}
              <span className="font-semibold text-gray-900">alquileres</span>.
            </p>
            <p className="text-xs leading-relaxed text-gray-600">
              Cada operación sigue un flujo: desde que un cliente busca una
              propiedad, hasta que se cierra la venta o alquiler.
            </p>
          </div>

          {/* Flow Diagram */}
          <div className="space-y-3">
            <h4 className="border-b pb-2 text-sm font-semibold text-gray-900">
              Flujo de una operación
            </h4>

            {/* Visual Flow */}
            <div className="flex flex-wrap items-center justify-center gap-2 rounded-lg border bg-gray-50 p-3">
              <div className="flex w-16 flex-col items-center gap-1 rounded-lg bg-white p-2 shadow-sm">
                <Search className="h-5 w-5 text-gray-700" />
                <span className="text-xs font-medium text-gray-900">
                  Búsqueda
                </span>
              </div>
              <ArrowRight className="h-3 w-3 text-gray-400" />
              <div className="flex w-16 flex-col items-center gap-1 rounded-lg bg-white p-2 shadow-sm">
                <Link2 className="h-5 w-5 text-gray-700" />
                <span className="text-xs font-medium text-gray-900">
                  Conexión
                </span>
              </div>
              <ArrowRight className="h-3 w-3 text-gray-400" />
              <div className="flex w-16 flex-col items-center gap-1 rounded-lg bg-white p-2 shadow-sm">
                <Handshake className="h-5 w-5 text-gray-700" />
                <span className="text-xs font-medium text-gray-900">
                  Cierre
                </span>
              </div>
            </div>
          </div>

          {/* Concepts Explanation */}
          <div className="space-y-3">
            <h4 className="border-b pb-2 text-sm font-semibold text-gray-900">
              Conceptos clave
            </h4>

            {/* Búsquedas */}
            <div className="space-y-2 rounded-lg border bg-white p-3 shadow-sm">
              <span className="text-sm font-semibold text-gray-900">Búsquedas</span>
              <p className="text-xs text-gray-600">
                Clientes que buscan comprar o alquilar. Registras sus criterios
                (zona, precio, habitaciones) y el sistema encuentra propiedades compatibles.
              </p>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-1 pr-3 font-medium text-gray-700">Con Resultados</td>
                    <td className="py-1 text-gray-500">Tienen propiedades compatibles en cartera</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-3 font-medium text-gray-700">Sin Resultados</td>
                    <td className="py-1 text-gray-500">Aún no hay propiedades que encajen</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Propiedades en Cartera */}
            <div className="space-y-1.5 rounded-lg border bg-white p-3 shadow-sm">
              <span className="text-sm font-semibold text-gray-900">
                Propiedades en Cartera
              </span>
              <p className="text-xs text-gray-600">
                Tu inventario de propiedades disponibles para vender o alquilar.
                Son las que el sistema cruza con las búsquedas de tus clientes.
              </p>
            </div>

            {/* Conexiones */}
            <div className="space-y-2 rounded-lg border bg-white p-3 shadow-sm">
              <span className="text-sm font-semibold text-gray-900">Conexiones</span>
              <p className="text-xs text-gray-600">
                Cuando vinculas un cliente con una propiedad concreta.
                Desde aquí gestionas visitas, haces seguimiento y registras ofertas.
              </p>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-1 pr-3 font-medium text-gray-700">Sin Visitas</td>
                    <td className="py-1 text-gray-500">Conexión creada, pendiente de agendar visita</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-3 font-medium text-gray-700">Visita Pendiente</td>
                    <td className="py-1 text-gray-500">Visita programada, esperando que ocurra</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-3 font-medium text-gray-700">Visita Completada</td>
                    <td className="py-1 text-gray-500">Visita realizada, pendiente de oferta</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-3 font-medium text-gray-700">Visita Cancelada</td>
                    <td className="py-1 text-gray-500">El cliente canceló la visita</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-3 font-medium text-gray-700">Visita Perdida</td>
                    <td className="py-1 text-gray-500">El cliente no se presentó</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-3 font-medium text-gray-700">Oferta Pendiente</td>
                    <td className="py-1 text-gray-500">Cliente interesado, esperando oferta formal</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-3 font-medium text-gray-700">Oferta Aceptada</td>
                    <td className="py-1 text-gray-500">Propietario aceptó, avanza a cierre</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-3 font-medium text-gray-700">Oferta Rechazada</td>
                    <td className="py-1 text-gray-500">Propietario rechazó la oferta</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-3 font-medium text-gray-700">Inactivo</td>
                    <td className="py-1 text-gray-500">Conexión pausada o sin actividad</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Ofertas aceptadas y cierres */}
            <div className="space-y-2 rounded-lg border bg-white p-3 shadow-sm">
              <span className="text-sm font-semibold text-gray-900">
                Ofertas aceptadas y cierres
              </span>
              <p className="text-xs text-gray-600">
                Propiedades que avanzan hacia el cierre de la operación.
              </p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-1 pr-2 text-left font-medium text-gray-500">Estado</th>
                    <th className="py-1 text-left font-medium text-gray-500">Descripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-1 pr-2 font-medium text-gray-700">Oferta Aceptada</td>
                    <td className="py-1 text-gray-500">Propietario acepta la oferta del comprador</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-2 font-medium text-gray-700">Arras Firmadas</td>
                    <td className="py-1 text-gray-500">Contrato de arras firmado</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-2 font-medium text-gray-700">Contrato Firmado</td>
                    <td className="py-1 text-gray-500">Escritura o contrato firmado</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-2 font-medium text-gray-700">Cerrado</td>
                    <td className="py-1 text-gray-500">Operación completada, entrega de llaves</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-2 font-medium text-gray-700">Perdido</td>
                    <td className="py-1 text-gray-500">Operación no completada</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="space-y-2 rounded-xl border bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-900">Cómo usarlo</h4>
            <ul className="space-y-1.5 text-xs text-gray-600">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                <span>
                  Alterna entre <strong>Venta</strong> y{" "}
                  <strong>Alquiler</strong> para ver las métricas de cada tipo
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                <span>
                  Haz clic en cada sección para expandir y ver el desglose
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                <span>
                  Los números te ayudan a identificar dónde enfocar tu esfuerzo
                </span>
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
