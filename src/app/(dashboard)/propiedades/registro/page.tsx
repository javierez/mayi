"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { RegistrationOptions } from "~/components/propiedades/registro/registration-options";
import { VoiceRecordingEnhanced } from "~/components/propiedades/registro/voice-recording-enhanced";
import type { EnhancedExtractedPropertyData } from "~/types/textract-enhanced";
import { FileUpload } from "~/components/propiedades/registro/file-upload";
import { createQuickPropertyAction } from "~/app/actions/quick-property";

export default function CapturaPage() {
  const router = useRouter();
  const [activeOption, setActiveOption] = useState<string | null>(null);
  const [isCreatingProperty, setIsCreatingProperty] = useState(false);

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
    // router.push(`/propiedades/registro?voiceData=${encodeURIComponent(JSON.stringify(extractedData))}`);
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

  const handleQuickForm = async () => {
    if (isCreatingProperty) return;

    try {
      setIsCreatingProperty(true);
      const result = await createQuickPropertyAction();

      if (result.success) {
        router.push(`/propiedades/registro/${result.data.listingId}`);
      } else {
        console.error("Error creating property:", result.error);
        alert("Error al crear la propiedad. Por favor, inténtalo de nuevo.");
        setIsCreatingProperty(false);
      }
    } catch (error) {
      console.error("Error creating property:", error);
      alert("Error inesperado. Por favor, inténtalo de nuevo.");
      setIsCreatingProperty(false);
    }
  };

  const toggleOption = (optionId: string) => {
    // Quick form creates a property and navigates to it
    if (optionId === "quick") {
      void handleQuickForm();
      return;
    }

    setActiveOption(activeOption === optionId ? null : optionId);
  };

  const handleFileUpload = async (files: File[]) => {
    console.log("Handling file upload:", files);
    // Files are now handled directly by the FileUpload component
    // which uploads them to the API and shows progress
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4">
      <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto">
        <div className="rounded-2xl bg-white shadow-2xl">
          <div className="relative p-6 sm:p-8">
            {/* Close button */}
            <button
              onClick={() => router.back()}
              className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header - Compact */}
            <div className="mb-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                Agregar Propiedad
              </h2>
            </div>

            {/* Feature Tabs */}
            <RegistrationOptions
              activeOption={activeOption}
              onToggleOption={toggleOption}
              className="mb-6"
              isQuickFormLoading={isCreatingProperty}
            />

            {/* Voice Recording - Clean and Minimal */}
            {activeOption === "recording" && (
              <div className="animate-in fade-in duration-200">
                <div className="flex justify-center">
                  <VoiceRecordingEnhanced
                    onProcessingComplete={handleVoiceProcessingComplete}
                    onRetryRecording={handleRetryRecording}
                    onManualEntry={handleManualEntry}
                    referenceNumber="temp-voice-recording"
                  />
                </div>
              </div>
            )}

            {/* Upload Section for Ficha de Encargo */}
            {activeOption === "upload" && (
              <div className="animate-in fade-in duration-200">
                <FileUpload onFileUpload={handleFileUpload} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
