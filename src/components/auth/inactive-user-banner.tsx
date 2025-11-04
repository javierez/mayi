"use client";

import { AlertTriangle } from "lucide-react";

export function InactiveUserBanner() {
  return (
    <div className="mb-4 flex items-center justify-center gap-2 bg-amber-50 py-3">
      <AlertTriangle className="h-3 w-3 text-amber-700" />
      <p className="text-[10px] font-mono uppercase tracking-widest text-amber-700">
        Tu cuenta está inactiva. Por favor, contacta con el administrador de la
        cuenta para activar tu acceso.
      </p>
    </div>
  );
}
