"use client";

import type { FC } from "react";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Palette,
  FileText,
  Loader2,
  Save,
} from "lucide-react";
import { useToast } from "~/components/hooks/use-toast";
import { useSession } from "~/lib/auth-client";
import { getCurrentUserAccountIdAction } from "~/app/actions/settings";
import {
  loadPosterPreferencesWithDefaults,
  updatePosterPreferenceFields,
} from "~/app/actions/poster-preferences";

// Import all the sub-components
import { StyleSelector } from "./carteleria/style-selector";
import { FormatSelector } from "./carteleria/format-selector";
import { TemplatePreview } from "./carteleria/template-preview";

import type { CarteleriaState, CarteleriaSelection } from "~/types/carteleria";
import { templateStyles, templateFormats } from "~/lib/carteleria/templates";

type Step = "style" | "format";

interface StepConfig {
  id: Step;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isComplete: (state: CarteleriaState) => boolean;
  canProceed: (state: CarteleriaState) => boolean;
}

const steps: StepConfig[] = [
  {
    id: "style",
    title: "Estilo",
    description: "Elige tu estilo principal",
    icon: Palette,
    isComplete: (state) => state.selections.styleId !== null,
    canProceed: (state) => state.selections.styleId !== null,
  },
  {
    id: "format",
    title: "Formatos",
    description: "Selecciona los tamaños",
    icon: FileText,
    isComplete: (state) => state.selections.formatIds.length > 0,
    canProceed: (state) => state.selections.formatIds.length > 0,
  },
];

const STORAGE_KEY = "carteleria_selection";

export const Carteleria: FC = () => {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [accountId, setAccountId] = useState<number | null>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Main state management
  const [state, setState] = useState<CarteleriaState>({
    currentStep: "style",
    selections: {
      styleId: null,
      formatIds: [],
      propertyTypeIds: [],
      templateIds: [],
      customizations: {},
    },
    previewTemplate: null,
  });

  // Modal states
  const [showPreview, setShowPreview] = useState(false);

  // Load saved state on mount with migration
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedState = JSON.parse(saved) as CarteleriaSelection;
        setState((prev) => ({
          ...prev,
          selections: parsedState,
          // Reset to first step if coming from old version
          currentStep: "style",
        }));
      }
    } catch (error) {
      console.error("Error loading saved state:", error);
    }
  }, []);

  // Load account data on mount
  useEffect(() => {
    async function loadAccountData() {
      if (session?.user?.id) {
        try {
          const userAccountId = await getCurrentUserAccountIdAction();
          if (userAccountId) {
            setAccountId(userAccountId);
          }
        } catch (error) {
          console.error("Error loading account ID:", error);
        }
      }
    }
    void loadAccountData();
  }, [session]);

  // Load preferences when accountId is available
  useEffect(() => {
    if (!accountId) return;

    const loadPreferences = async () => {
      setLoadingPreferences(true);
      try {
        const result = await loadPosterPreferencesWithDefaults(accountId);
        if (result.success && result.data) {
          const data = result.data;

          // Update state with saved style and format preferences
          if (data.template_style || data.format_ids) {
            setState((prevState) => ({
              ...prevState,
              selections: {
                ...prevState.selections,
                styleId: data.template_style ?? null,
                formatIds: data.format_ids ?? [],
              },
            }));
          }

          // Mark as saved (no unsaved changes)
          setHasUnsavedChanges(false);
        } else if (result.error) {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las preferencias guardadas",
          variant: "destructive",
        });
      } finally {
        setLoadingPreferences(false);
      }
    };

    void loadPreferences();
  }, [accountId, toast]);

  // Save state to localStorage whenever selections change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.selections));
    } catch (error) {
      console.error("Error saving state:", error);
    }
  }, [state.selections]);

  // Helper functions
  const updateSelections = (updates: Partial<CarteleriaSelection>) => {
    setState((prev) => ({
      ...prev,
      selections: { ...prev.selections, ...updates },
    }));
  };

  const setCurrentStep = (step: Step) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  };

  // Save preferences function
  const handleSavePreferences = useCallback(async () => {
    if (!accountId) {
      toast({
        title: "Error",
        description: "No se encontró el ID de la cuenta",
        variant: "destructive",
      });
      return;
    }

    setSavingPreferences(true);
    try {
      // Only save style and format preferences - no display options
      const minimalUpdates = {
        template_style: state.selections.styleId ?? undefined,
        format_ids: state.selections.formatIds,
      };

      const result = await updatePosterPreferenceFields(
        accountId,
        minimalUpdates,
      );

      if (result.success) {
        setHasUnsavedChanges(false);
        toast({
          title: "Preferencias guardadas",
          description: "Tus configuraciones han sido guardadas exitosamente",
        });
      } else {
        throw new Error(result.error ?? "Error al guardar");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar las preferencias",
        variant: "destructive",
      });
    } finally {
      setSavingPreferences(false);
    }
  }, [accountId, state.selections.styleId, state.selections.formatIds, toast]);

  const currentStepIndex = steps.findIndex(
    (step) => step.id === state.currentStep,
  );
  const currentStepConfig = steps[currentStepIndex];
  const canGoNext = currentStepConfig?.canProceed(state) ?? false;
  const canGoPrevious = currentStepIndex > 0;

  // Navigation handlers
  const goToStep = (stepId: Step) => {
    setCurrentStep(stepId);
  };

  const goNext = () => {
    if (canGoNext && currentStepIndex < steps.length - 1) {
      const nextStep = steps[currentStepIndex + 1];
      if (nextStep) {
        setCurrentStep(nextStep.id);
      }
    }
  };

  const goPrevious = () => {
    if (canGoPrevious) {
      const prevStep = steps[currentStepIndex - 1];
      if (prevStep) {
        setCurrentStep(prevStep.id);
      }
    }
  };

  // Selection handlers
  const handleStyleSelect = (styleId: string) => {
    // Allow toggling - if clicking the same style, unselect it
    const newStyleId = state.selections.styleId === styleId ? null : styleId;
    updateSelections({ styleId: newStyleId });
    setHasUnsavedChanges(true);
    // Remove auto-advance - user must click "Siguiente" to continue
  };

  const handleFormatToggle = (formatId: string) => {
    const formatIds = state.selections.formatIds.includes(formatId)
      ? state.selections.formatIds.filter((id) => id !== formatId)
      : [...state.selections.formatIds, formatId];

    updateSelections({ formatIds });
    setHasUnsavedChanges(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Configurar Cartelería
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Personaliza tus plantillas de carteles inmobiliarios
          </p>
        </div>

        {/* Step Navigation */}
        <div className="flex items-center justify-center space-x-4">
          {steps.map((step, _index) => {
            const Icon = step.icon;
            const isActive = step.id === state.currentStep;
            const isCompleted = step.isComplete(state);

            return (
              <Button
                key={step.id}
                variant={
                  isActive ? "default" : isCompleted ? "outline" : "ghost"
                }
                size="sm"
                onClick={() => goToStep(step.id)}
                className={`flex min-w-fit items-center gap-2 ${
                  isActive ? "ring-2 ring-primary/20" : ""
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{step.title}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {currentStepConfig && (
              <>
                <currentStepConfig.icon className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>{currentStepConfig.title}</CardTitle>
                  <p className="text-sm text-gray-600">
                    {currentStepConfig.description}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative min-h-[500px]">
          {loadingPreferences && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Cargando preferencias guardadas...</span>
              </div>
            </div>
          )}

          {state.currentStep === "style" && (
            <StyleSelector
              selectedStyleId={state.selections.styleId}
              onStyleSelect={handleStyleSelect}
              styles={templateStyles}
            />
          )}

          {state.currentStep === "format" && (
            <FormatSelector
              selectedFormatIds={state.selections.formatIds}
              onFormatToggle={handleFormatToggle}
              formats={templateFormats}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goPrevious}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>

        <div className="flex items-center gap-4">
          {state.currentStep === "format" ? (
            <Button
              onClick={handleSavePreferences}
              disabled={savingPreferences || !hasUnsavedChanges}
              variant={hasUnsavedChanges ? "default" : "outline"}
            >
              {savingPreferences ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar preferencias
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Guardado
                </>
              )}
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canGoNext}>
              Siguiente
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Modals */}
      <TemplatePreview
        template={state.previewTemplate}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  );
};
