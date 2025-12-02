"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  RegistrationOptions,
  OptionDetails,
  type RegistrationOption,
} from "~/components/propiedades/registro/registration-options";
import { VoiceRecordingEnhanced } from "~/components/propiedades/registro/voice-recording-enhanced";
import type { EnhancedExtractedPropertyData } from "~/types/textract-enhanced";
import { FileUpload } from "~/components/propiedades/registro/file-upload";
import { QuickForm } from "~/components/propiedades/registro/quick-form";

export default function CapturaPage() {
  const router = useRouter();
  const [activeOption, setActiveOption] = useState<string | null>("quick");

  // Handle voice recording completion
  const handleVoiceProcessingComplete = (
    extractedData: EnhancedExtractedPropertyData,
  ) => {
    console.log(
      "🎉 Voice processing completed with extracted data:",
      extractedData,
    );

    // TODO: Navigate to property creation form with pre-populated data
    // For now, we'll just log the data and show an alert
    alert(
      `¡Datos extraídos correctamente! Se encontraron ${Object.keys(extractedData).length} campos.`,
    );

    // In the future, you can navigate to the form with the data:
    // router.push(`/propiedades/crear?voiceData=${encodeURIComponent(JSON.stringify(extractedData))}`);
  };

  // Handle retry recording
  const handleRetryRecording = () => {
    console.log("🔄 Retrying voice recording...");
    // Reset to recording option, component will handle the reset internally
  };

  // Handle manual entry fallback
  const handleManualEntry = () => {
    console.log("✏️ Switching to manual entry...");
    // Switch to quick form option
    setActiveOption("quick");
  };

  const options: RegistrationOption[] = [
    {
      id: "quick",
      title: "Formulario Rápido",
      description:
        "Captura los datos esenciales para crear la propiedad en un instante",
      features: [
        "Venta o alquiler, casa o piso",
        "Información de contacto",
        "Dirección y precio",
      ],
      gradient: "from-amber-400 to-rose-400",
      bgActive: "from-amber-50 to-rose-50",
      action: () => {
        // The actual action is handled by the button in QuickForm component
        console.log("Quick form option selected");
      },
    },
    {
      id: "recording",
      title: "Grabación de Voz",
      description:
        "Habla con nuesetro sistema y la IA registrará la información automáticamente",
      features: [
        "Transcripción automática",
        "Procesamiento con IA",
        "Extracción de datos",
        "Ahorra 10 minutos por propiedad",
      ],
      additionalInfo:
        "Dirección, tipo de propiedad, habitaciones, baños, precio y características especiales.",
      gradient: "from-amber-400 to-rose-400",
      bgActive: "from-amber-50 to-rose-50",
      action: () => console.log("Open recording panel"),
    },
    {
      id: "upload",
      title: "Ficha de Encargo",
      description:
        "Carga documentos existentes y extrae información automáticamente",
      features: [
        "OCR inteligente",
        "Extracción automática",
        "Múltiples formatos",
        "Procesamiento rápido",
      ],
      gradient: "from-amber-400 to-rose-400",
      bgActive: "from-amber-50 to-rose-50",
      action: () =>
        setActiveOption(activeOption === "upload" ? null : "upload"),
    },
  ];

  const toggleOption = (optionId: string) => {
    setActiveOption(activeOption === optionId ? null : optionId);
    const option = options.find((o) => o.id === optionId);
    if (option && optionId !== "upload") {
      option.action();
    }
  };

  const handleFileUpload = async (files: File[]) => {
    console.log("Handling file upload:", files);
    // Files are now handled directly by the FileUpload component
    // which uploads them to the API and shows progress
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4">
      <div className="max-h-[95vh] w-full max-w-7xl overflow-y-auto">
        <div className="rounded-2xl bg-white shadow-2xl">
          <div className="relative p-4 sm:p-6 md:p-8">
            {/* Close button */}
            <button
              onClick={() => router.back()}
              className="absolute right-4 top-4 rounded-full p-2 transition-colors hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>

            {/* Header */}
            <div className="mb-6 text-center sm:mb-8 md:mb-12">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
                Registro de Propiedad
              </h2>
              <p className="mt-2 text-sm text-gray-600 sm:mt-3 sm:text-base md:mt-4 md:text-lg">
                Selecciona cómo quieres registrar la nueva propiedad
              </p>
            </div>

            {/* Feature Tabs */}
            <RegistrationOptions
              activeOption={activeOption}
              onToggleOption={toggleOption}
              className="mb-4 sm:mb-6 md:mb-8"
            />

            {/* Expanded Content */}
            {activeOption && activeOption !== "upload" && (
              <div className="animate-in slide-in-from-top-4 duration-300">
                <div className="rounded-2xl bg-gradient-to-br from-amber-50/50 to-rose-50/50 p-4 shadow-lg sm:p-6 md:p-8">
                  <div className="grid gap-4 sm:gap-6 md:gap-8 lg:grid-cols-3">
                    {/* Description and Features */}
                    {(() => {
                      const selectedOption = options.find(
                        (o) => o.id === activeOption,
                      );
                      return selectedOption ? (
                        <OptionDetails
                          option={selectedOption}
                          onStart={() => selectedOption.action()}
                        />
                      ) : null;
                    })()}

                    {/* Visual Preview */}
                    <div className="flex items-center justify-center lg:col-span-2">
                      {activeOption === "recording" && (
                        <VoiceRecordingEnhanced
                          onProcessingComplete={handleVoiceProcessingComplete}
                          onRetryRecording={handleRetryRecording}
                          onManualEntry={handleManualEntry}
                          referenceNumber="temp-voice-recording"
                        />
                      )}
                      {activeOption === "quick" && <QuickForm />}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Section for Ficha de Encargo */}
            {activeOption === "upload" && (
              <div className="animate-in slide-in-from-top-4 duration-300">
                <FileUpload onFileUpload={handleFileUpload} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
