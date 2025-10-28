import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { OnboardingProvider, useOnboardingContext } from "./onboarding-context";
import StepOne from "./pages/step-one";
import StepTwo from "./pages/step-two";
import StepThree from "./pages/step-three";
import { toast } from "sonner";

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

function OnboardingModalContent({ onComplete }: { onComplete: () => void }) {
  const { state, nextStep, previousStep, setSubmitting } =
    useOnboardingContext();
  const { currentStep, formData } = state;

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      console.log("📝 Submitting onboarding data:", formData);

      const response = await fetch("/api/account/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error ?? "Error al guardar los datos");
      }

      const result = (await response.json()) as {
        success: boolean;
        message: string;
      };
      console.log("✅ Onboarding saved successfully:", result);

      toast.success("¡Bienvenido a Vesta!", {
        description: "Tu configuración inicial ha sido guardada correctamente.",
        duration: 4000,
      });

      // Complete onboarding
      onComplete();
    } catch (error) {
      console.error("❌ Error submitting onboarding:", error);
      toast.error("Error al guardar", {
        description:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la configuración.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Progress Indicator */}
      <div className="mb-6 flex items-center justify-center space-x-2">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                step === currentStep
                  ? "bg-gray-900 text-white"
                  : step < currentStep
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
              }`}
            >
              {step}
            </div>
            {step < 3 && (
              <div
                className={`mx-2 h-0.5 w-12 transition-colors ${
                  step < currentStep ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1">
        {currentStep === 1 && <StepOne onNext={nextStep} />}
        {currentStep === 2 && (
          <StepTwo onNext={nextStep} onBack={previousStep} />
        )}
        {currentStep === 3 && (
          <StepThree onBack={previousStep} onSubmit={handleSubmit} />
        )}
      </div>
    </div>
  );
}

export default function OnboardingModal({
  open,
  onComplete,
}: OnboardingModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        /* Prevent closing */
      }}
      modal
    >
      <DialogContent
        className="m-4 flex h-[90vh] max-h-[90vh] max-w-3xl flex-col overflow-hidden p-0 [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex-shrink-0 px-6 pb-4 pt-6">
          <DialogTitle className="text-2xl">Configuración Inicial</DialogTitle>
          <DialogDescription>
            Completa estos pasos para personalizar tu experiencia en Vesta.
          </DialogDescription>
        </DialogHeader>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-6 pb-6">
          <OnboardingProvider>
            <OnboardingModalContent onComplete={onComplete} />
          </OnboardingProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
