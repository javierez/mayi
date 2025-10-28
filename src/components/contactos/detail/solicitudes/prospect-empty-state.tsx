"use client";

import { User } from "lucide-react";

/**
 * Empty state UI displayed when no prospects exist
 */
export function ProspectEmptyState() {
  return (
    <div className="py-8 text-center text-gray-500">
      <User className="mx-auto mb-3 h-12 w-12 text-gray-300" />
      <p className="text-sm">No hay solicitudes de búsqueda configuradas</p>
      <p className="mt-1 text-xs text-gray-400">
        Haz clic en &quot;Añadir solicitud&quot; para crear la primera solicitud
      </p>
    </div>
  );
}
