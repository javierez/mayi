"use client";

import { X } from "lucide-react";
import { Button } from "~/components/ui/button";

interface Tool {
  id: string;
  title: string;
  description: string;
  tokens: number;
  icon: React.ReactNode;
}

interface ToolConfirmationModalProps {
  isOpen: boolean;
  tool: Tool | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ToolConfirmationModal({
  isOpen,
  tool,
  onConfirm,
  onCancel,
}: ToolConfirmationModalProps) {
  if (!isOpen || !tool) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-lg bg-white shadow-xl ring-1 ring-gray-200">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute right-3 top-3 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4 text-center">
            <h3 className="mb-1 font-mono text-sm font-bold uppercase tracking-widest text-gray-900">
              {tool.title}
            </h3>
            <p className="text-xs text-gray-500">
              {tool.description}
            </p>
          </div>

          {/* Beta Banner - Only for Reform tool */}
          {tool.id === "reform" && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2.5 text-left">
              <div className="mb-1.5">
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  BETA
                </span>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                Este modelo puede generar errores, inventar elementos que no existen en la imagen original y requiere supervisión. Por esta razón ofrecemos un precio reducido.
              </p>
            </div>
          )}

          {/* Token Cost */}
          <div className="mb-5 rounded-md bg-gray-50 px-4 py-3 text-center">
            <div className="font-mono text-2xl font-bold text-gray-900">
              {tool.tokens.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600">
              tokens
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-gray-900 text-xs text-white hover:bg-gray-800"
            >
              Confirmar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
