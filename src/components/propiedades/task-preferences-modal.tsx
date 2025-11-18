"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import { Loader2, ChevronDown, ChevronUp, Plus, Minus } from "lucide-react";
import { updatePreferencesAndCreateTasksAction } from "~/server/actions/task-preferences";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TaskPreferences {
  property: {
    uploadPhotos: { enabled: boolean; dueDays: number };
    completeInfo: { enabled: boolean; dueDays: number };
    scheduleVisit: { enabled: boolean; dueDays: number };
    pickupKeys: { enabled: boolean; dueDays: number };
    valuation: { enabled: boolean; dueDays: number };
    createHojaEncargo: { enabled: boolean; dueDays: number };
    signHojaEncargo: { enabled: boolean; dueDays: number };
    generateCartel: { enabled: boolean; dueDays: number };
  };
}

interface TaskPreferencesModalProps {
  isOpen: boolean;
  listingId: string;
  initialPreferences: TaskPreferences;
}

interface TaskOption {
  id: keyof TaskPreferences["property"];
  label: string;
  description: string;
}

const TASK_OPTIONS: TaskOption[] = [
  {
    id: "uploadPhotos",
    label: "Subir fotos de la propiedad",
    description:
      "Cargar y organizar las fotografías del inmueble para portales inmobiliarios",
  },
  {
    id: "completeInfo",
    label: "Completar información del inmueble",
    description: "Revisar y completar todos los campos pendientes del cuestionario",
  },
  {
    id: "scheduleVisit",
    label: "Programar visita al inmueble",
    description:
      "Coordinar y agendar una visita con el propietario para conocer el inmueble",
  },
  {
    id: "pickupKeys",
    label: "Recoger llaves del inmueble",
    description:
      "Coordinar con el propietario la recogida de las llaves del inmueble",
  },
  {
    id: "valuation",
    label: "Realizar valoración del inmueble",
    description:
      "Realizar una valoración profesional considerando ubicación, estado y mercado",
  },
  {
    id: "createHojaEncargo",
    label: "Crear hoja de encargo",
    description:
      "Preparar y redactar la hoja de encargo con todos los términos y condiciones",
  },
  {
    id: "signHojaEncargo",
    label: "Firmar hoja de encargo",
    description:
      "Coordinar la firma de la hoja de encargo con el propietario",
  },
  {
    id: "generateCartel",
    label: "Generar cartel del inmueble",
    description:
      "Crear el cartel promocional del inmueble con fotografías y características",
  },
];

export function TaskPreferencesModal({
  isOpen,
  listingId,
  initialPreferences,
}: TaskPreferencesModalProps) {
  const [preferences, setPreferences] =
    useState<TaskPreferences>(initialPreferences);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = (taskId: keyof TaskPreferences["property"]) => {
    setPreferences((prev) => ({
      property: {
        ...prev.property,
        [taskId]: {
          ...prev.property[taskId],
          enabled: !prev.property[taskId].enabled,
        },
      },
    }));
  };

  const handleDueDaysChange = (
    taskId: keyof TaskPreferences["property"],
    delta: number,
  ) => {
    setPreferences((prev) => {
      const currentDays = prev.property[taskId].dueDays;
      const newDays = Math.max(1, Math.min(90, currentDays + delta));
      return {
        property: {
          ...prev.property,
          [taskId]: {
            ...prev.property[taskId],
            dueDays: newDays,
          },
        },
      };
    });
  };

  const toggleExpanded = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  const handleSelectAll = () => {
    setPreferences((prev) => ({
      property: {
        uploadPhotos: { ...prev.property.uploadPhotos, enabled: true },
        completeInfo: { ...prev.property.completeInfo, enabled: true },
        scheduleVisit: { ...prev.property.scheduleVisit, enabled: true },
        pickupKeys: { ...prev.property.pickupKeys, enabled: true },
        valuation: { ...prev.property.valuation, enabled: true },
        createHojaEncargo: { ...prev.property.createHojaEncargo, enabled: true },
        signHojaEncargo: { ...prev.property.signHojaEncargo, enabled: true },
        generateCartel: { ...prev.property.generateCartel, enabled: true },
      },
    }));
  };

  const handleDeselectAll = () => {
    setPreferences((prev) => ({
      property: {
        uploadPhotos: { ...prev.property.uploadPhotos, enabled: false },
        completeInfo: { ...prev.property.completeInfo, enabled: false },
        scheduleVisit: { ...prev.property.scheduleVisit, enabled: false },
        pickupKeys: { ...prev.property.pickupKeys, enabled: false },
        valuation: { ...prev.property.valuation, enabled: false },
        createHojaEncargo: { ...prev.property.createHojaEncargo, enabled: false },
        signHojaEncargo: { ...prev.property.signHojaEncargo, enabled: false },
        generateCartel: { ...prev.property.generateCartel, enabled: false },
      },
    }));
  };

  const handleCreateTasks = () => {
    startTransition(async () => {
      try {
        const result = await updatePreferencesAndCreateTasksAction(
          BigInt(listingId),
          preferences,
        );

        if (result.success) {
          toast.success("¡Tareas creadas!", {
            description: `Se han creado ${result.tasksCreated ?? 0} tareas para esta propiedad.`,
            duration: 4000,
          });

          // Trigger task refresh via global callback
          if (typeof window !== "undefined") {
            const refreshCallback = (
              window as { refreshPropertyTasks?: () => void }
            ).refreshPropertyTasks;
            if (refreshCallback) {
              refreshCallback();
            }
          }

          // Remove the ?new=true param from URL and refresh
          router.replace(`/propiedades/${listingId}`);
          router.refresh();
        } else {
          toast.error("Error al crear tareas", {
            description: result.error ?? "No se pudieron crear las tareas.",
          });
        }
      } catch (error) {
        console.error("Error creating tasks:", error);
        toast.error("Error inesperado", {
          description: "Ocurrió un error al crear las tareas.",
        });
      }
    });
  };

  const selectedCount = Object.values(preferences.property).filter(
    (task) => task.enabled,
  ).length;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        // Modal is required, cannot be dismissed
      }}
      modal
    >
      <DialogContent
        className="custom-scrollbar max-h-[85vh] max-w-xl overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Configurar Tareas Automáticas
          </DialogTitle>
          <DialogDescription className="text-sm">
            Selecciona las tareas que deseas crear para esta nueva propiedad. Tus
            preferencias se guardarán para futuras propiedades.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Quick Actions */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <div className="text-xs font-medium text-gray-600">
              {selectedCount} de {TASK_OPTIONS.length} seleccionadas
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                disabled={isPending}
                className="h-7 text-xs"
              >
                Todas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeselectAll}
                disabled={isPending}
                className="h-7 text-xs"
              >
                Ninguna
              </Button>
            </div>
          </div>

          {/* Task Options - Compact List */}
          <div className="space-y-2">
            {TASK_OPTIONS.map((task) => {
              const isExpanded = expandedTaskId === task.id;
              const taskPreference = preferences.property[task.id];

              return (
                <div
                  key={task.id}
                  className="rounded-lg bg-white shadow-md transition-all hover:shadow-lg has-[:checked]:bg-amber-50/40 has-[:checked]:shadow-lg"
                >
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <Checkbox
                      id={task.id}
                      checked={taskPreference.enabled}
                      onCheckedChange={() => handleToggle(task.id)}
                      disabled={isPending}
                    />
                    <label
                      htmlFor={task.id}
                      className="flex-1 cursor-pointer text-sm font-medium text-gray-700"
                    >
                      {task.label}
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(task.id)}
                      className="rounded p-1 transition-colors hover:bg-gray-100"
                      disabled={isPending}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 px-3 pb-3 pt-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDueDaysChange(task.id, -1)}
                          disabled={isPending || taskPreference.dueDays <= 1}
                          className="rounded-full p-1.5 transition-colors hover:bg-gray-100 disabled:opacity-40"
                        >
                          <Minus className="h-4 w-4 text-gray-600" />
                        </button>
                        <span className="min-w-[80px] text-center text-sm font-medium text-gray-700">
                          {taskPreference.dueDays} {taskPreference.dueDays === 1 ? "día" : "días"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDueDaysChange(task.id, 1)}
                          disabled={isPending || taskPreference.dueDays >= 90}
                          className="rounded-full p-1.5 transition-colors hover:bg-gray-100 disabled:opacity-40"
                        >
                          <Plus className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleCreateTasks}
              disabled={isPending}
              className="min-w-[140px] bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                `Crear ${selectedCount} tarea${selectedCount !== 1 ? "s" : ""}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
