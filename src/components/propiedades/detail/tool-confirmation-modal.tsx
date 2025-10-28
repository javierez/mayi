"use client";

import { X, AlertTriangle } from "lucide-react";
import { Button } from "~/components/ui/button";

interface Tool {
  id: string;
  title: string;
  description: string;
  price: string;
  priceDescription: string;
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
  console.log("🪟 [ToolConfirmationModal] Rendered", {
    isOpen,
    toolId: tool?.id,
    toolTitle: tool?.title,
  });

  if (!isOpen || !tool) return null;

  const handleConfirm = () => {
    console.log("✅ [ToolConfirmationModal] Confirm button clicked", {
      toolId: tool.id,
      toolTitle: tool.title,
    });
    onConfirm();
  };

  const handleCancel = () => {
    console.log("❌ [ToolConfirmationModal] Cancel button clicked");
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="animate-in zoom-in-95 relative w-full max-w-md rounded-2xl border border-gray-100 bg-white shadow-2xl duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-amber-400 to-rose-400">
              {tool.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {tool.title}
              </h3>
              <p className="text-sm text-gray-500">Confirmar operación</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="h-8 w-8 rounded-full bg-transparent p-0 text-gray-400 transition-all duration-200 hover:bg-gray-50 hover:text-gray-600"
          >
            <X className="mx-auto h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4 flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
            <div>
              <p className="mb-2 text-sm text-gray-700">
                ¿Estás seguro que deseas proceder con esta operación?
              </p>
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-4 rounded-xl bg-gradient-to-br from-amber-50 to-rose-50 p-4">
            <div className="text-center">
              <div className="mb-1 bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-2xl font-bold text-transparent">
                {tool.price}
              </div>
              <p className="text-xs font-medium text-gray-700">
                {tool.priceDescription}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 border-0 bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
            >
              Proceder
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
