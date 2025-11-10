"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "~/components/ui/button";
import { RotateCcw, Check } from "lucide-react";
import { cn } from "~/lib/utils";

interface SignaturePadProps {
  label: string;
  onSignatureChange: (signature: string | null) => void;
  required?: boolean;
  className?: string;
}

export function SignaturePad({
  label,
  onSignatureChange,
  required = false,
  className,
}: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const clear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setIsEmpty(true);
      onSignatureChange(null);
    }
  };

  const handleEnd = () => {
    if (sigCanvas.current) {
      const canvas = sigCanvas.current.getCanvas();
      const isEmpty = sigCanvas.current.isEmpty();
      setIsEmpty(isEmpty);

      console.log(`📝 ${label} signature capture:`, {
        isEmpty,
        canvasSize: `${canvas.width}x${canvas.height}`,
      });

      if (!isEmpty) {
        const dataURL = canvas.toDataURL("image/png");
        console.log(`✅ ${label} signature captured:`, {
          dataURL: dataURL.substring(0, 50) + "...",
        });
        onSignatureChange(dataURL);
      } else {
        console.log(`❌ ${label} signature is empty`);
        onSignatureChange(null);
      }
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-gray-900">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <div className="relative overflow-hidden rounded-lg border-2 border-gray-300 bg-white">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            width: 400,
            height: 200,
            className:
              "signature-canvas w-full h-32 sm:h-40 lg:h-48 touch-none",
            style: { minHeight: "128px" },
          }}
          backgroundColor="rgba(255,255,255,0)"
          penColor="black"
          onEnd={handleEnd}
        />
        <div className="pointer-events-none absolute bottom-2 right-2 text-xs text-gray-400">
          {isEmpty ? "Toque para firmar" : ""}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clear}
          className="flex items-center gap-1 text-xs sm:text-sm"
        >
          <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Limpiar</span>
          <span className="sm:hidden">Borrar</span>
        </Button>

        {!isEmpty && (
          <div className="flex items-center gap-1 text-xs text-green-600 sm:text-sm">
            <Check className="h-3 w-3 sm:h-4 sm:w-4" />
            Firmado
          </div>
        )}
      </div>

      {required && isEmpty && (
        <p className="text-sm text-red-500">Este campo es obligatorio</p>
      )}
    </div>
  );
}
