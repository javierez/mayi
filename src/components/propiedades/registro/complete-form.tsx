"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "~/lib/utils";
import { FileText, Loader2 } from "lucide-react";
import { createQuickPropertyAction } from "~/app/actions/quick-property";

interface CompleteFormProps {
  className?: string;
}

export function CompleteForm({ className }: CompleteFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleStartCompleteForm = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await createQuickPropertyAction();

      if (result.success) {
        // Navigate to the registration form with the new listing ID
        router.push(`/propiedades/registro/${result.data.listingId}`);
      } else {
        setError(result.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error creating complete property:", error);
      setError("Error inesperado. Por favor, inténtalo de nuevo.");
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("w-full max-w-md", className)}>
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        {/* Icon container with smooth transitions */}
        <div
          className={cn(
            "mx-auto mb-6 flex items-center justify-center rounded-full transition-all duration-700 ease-in-out",
            isLoading
              ? "h-24 w-24 bg-gradient-to-r from-amber-400 to-rose-400"
              : "h-20 w-20 bg-gradient-to-br from-amber-100 to-rose-100",
          )}
        >
          <FileText
            className={cn(
              "transition-all duration-700 ease-in-out",
              isLoading
                ? "h-14 w-14 scale-110 text-white"
                : "h-10 w-10 text-amber-600",
            )}
          />
        </div>

        {/* Text content with fade transition */}
        <div
          className={cn(
            "transform transition-all duration-500 ease-in-out",
            isLoading
              ? "translate-y-2 scale-95 opacity-0"
              : "translate-y-0 scale-100 opacity-100",
          )}
        >
          <h4 className="mb-2 text-lg font-semibold text-gray-900">
            Información completa y detallada
          </h4>
          <p className="mb-6 text-sm text-gray-600">
            Registra los detalles y maximiza el atractivo de tu propiedad y
            descuida, puedes cargar la fotos luego.
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div
            className={cn(
              "flex items-center justify-center gap-2 text-gray-600 transition-all duration-300 ease-in-out",
              "animate-in fade-in slide-in-from-bottom-2",
            )}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Creando propiedad...</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="animate-in fade-in slide-in-from-bottom-2 mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Button - only show when not loading */}
        {!isLoading && (
          <button
            onClick={handleStartCompleteForm}
            disabled={isLoading}
            className={cn(
              "w-full rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-6 py-3 font-medium text-white",
              "shadow-lg transition-all duration-200 hover:scale-105 hover:from-amber-500 hover:to-rose-500",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "animate-in fade-in slide-in-from-bottom-2",
            )}
          >
            Comenzar ahora
          </button>
        )}
      </div>
    </div>
  );
}
