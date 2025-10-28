"use client";

import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { ChevronLeft, Loader } from "lucide-react";
import { motion } from "framer-motion";
import { Checkbox } from "~/components/ui/checkbox";
import { useOnboardingContext } from "../onboarding-context";

interface StepThreeProps {
  onBack: () => void;
  onSubmit: () => Promise<void>;
}

export default function StepThree({ onBack, onSubmit }: StepThreeProps) {
  const { state, updateFormData } = useOnboardingContext();
  const { formData, isSubmitting } = state;

  const handleSubmit = async () => {
    await onSubmit();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Portales y Lanzamiento
        </h3>
        <p className="mb-6 text-sm text-gray-600">
          Últimos detalles sobre tus herramientas actuales.
        </p>
      </div>

      {/* Portal Usage */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-900">
          Uso actual de portales inmobiliarios
        </label>
        <p className="text-xs text-gray-500">
          Selecciona los portales que utilizas actualmente
        </p>
        <div className="space-y-3 rounded-lg bg-gray-50 p-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="idealista"
              checked={formData.usesIdealista ?? false}
              onCheckedChange={(checked) =>
                updateFormData({ usesIdealista: checked as boolean })
              }
            />
            <label
              htmlFor="idealista"
              className="cursor-pointer select-none text-sm text-gray-700"
            >
              ¿Trabajas con Idealista?
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="fotocasa"
              checked={formData.usesFotocasa ?? false}
              onCheckedChange={(checked) =>
                updateFormData({ usesFotocasa: checked as boolean })
              }
            />
            <label
              htmlFor="fotocasa"
              className="cursor-pointer select-none text-sm text-gray-700"
            >
              ¿Trabajas con Fotocasa?
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="habitaclia"
              checked={formData.usesHabitaclia ?? false}
              onCheckedChange={(checked) =>
                updateFormData({ usesHabitaclia: checked as boolean })
              }
            />
            <label
              htmlFor="habitaclia"
              className="cursor-pointer select-none text-sm text-gray-700"
            >
              ¿Trabajas con Habitaclia?
            </label>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <label
          htmlFor="additionalNotes"
          className="text-sm font-medium text-gray-900"
        >
          Notas adicionales
        </label>
        <p className="text-xs text-gray-500">
          ¿Algo más que debamos saber? (opcional)
        </p>
        <Textarea
          id="additionalNotes"
          value={formData.additionalNotes ?? ""}
          onChange={(e) => updateFormData({ additionalNotes: e.target.value })}
          placeholder="Escribe aquí cualquier información adicional que quieras compartir..."
          className="min-h-[120px] resize-none border border-gray-200 shadow-md"
          maxLength={500}
        />
        <p className="text-right text-xs text-gray-400">
          {formData.additionalNotes?.length ?? 0}/500
        </p>
      </div>

      {/* Navigation Buttons */}
      <motion.div
        className="flex justify-between border-t pt-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex items-center space-x-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Anterior</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center space-x-2 bg-gray-900 hover:bg-gray-800"
          >
            {isSubmitting ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>Completar</span>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
