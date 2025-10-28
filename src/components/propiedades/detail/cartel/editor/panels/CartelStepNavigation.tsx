import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";

interface CartelStepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onDownload?: () => void;
  isGenerating?: boolean;
  canGeneratePdf?: boolean;
}

export function CartelStepNavigation({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onDownload,
  isGenerating = false,
  canGeneratePdf = false,
}: CartelStepNavigationProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="mt-6 flex justify-between">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstStep}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </Button>

      <div className="flex gap-2">
        {isLastStep && onDownload && (
          <Button
            onClick={onDownload}
            disabled={isGenerating || !canGeneratePdf}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                Generando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Descargar PDF
              </>
            )}
          </Button>
        )}

        {!isLastStep && (
          <Button onClick={onNext} className="flex items-center gap-2">
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
