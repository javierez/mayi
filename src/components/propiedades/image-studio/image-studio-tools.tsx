"use client";

import { useState, useEffect } from "react";
import { Sparkles, EyeOff, Trash2 } from "lucide-react";
import { cn } from "~/lib/utils";
import { ToolConfirmationModal } from "./tool-confirmation-modal";
import type { EnhancementStatus, PropertyImage } from "~/types/freepik";
import type { RenovationStatus } from "~/types/gemini";
import { calculateFreepikTokensWithFactor, GEMINI_TOKEN_COSTS } from "~/lib/image-token-pricing";

interface ImageStudioToolsProps {
  onEnhanceImage: () => Promise<void>;
  _enhancementStatus: EnhancementStatus;
  _enhancementProgress: number;
  _enhancementError: string | null;
  selectedImage?: PropertyImage;
  _isComparisonVisible?: boolean;
  // Renovation functionality
  onRenovateImage?: () => Promise<void>;
  _renovationStatus?: RenovationStatus;
  // Blur faces functionality
  onBlurFaces?: () => Promise<void>;
  _blurFacesStatus?: RenovationStatus;
  // Remove clutter functionality
  onRemoveClutter?: () => Promise<void>;
  _removeClutterStatus?: RenovationStatus;
}

export function ImageStudioTools({
  onEnhanceImage,
  _enhancementStatus,
  _enhancementProgress,
  _enhancementError,
  selectedImage,
  _isComparisonVisible,
  onRenovateImage,
  _renovationStatus = "idle",
  onBlurFaces,
  _blurFacesStatus = "idle",
  onRemoveClutter,
  _removeClutterStatus = "idle",
}: ImageStudioToolsProps) {
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    tool: (typeof tools)[0] | null;
  }>({
    isOpen: false,
    tool: null,
  });

  const [qualityTokens, setQualityTokens] = useState(120); // Default

  // Calculate actual tokens based on selected image dimensions
  useEffect(() => {
    if (!selectedImage) {
      setQualityTokens(120); // Default when no image selected
      return;
    }

    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const upscaleFactor = 2;

      const tokenCost = calculateFreepikTokensWithFactor(width, height, upscaleFactor);
      setQualityTokens(tokenCost.tokens);
    };
    img.onerror = () => {
      setQualityTokens(120); // Fallback on error
    };
    img.src = selectedImage.imageUrl;
  }, [selectedImage]);

  const openConfirmModal = (tool: (typeof tools)[0]) => {
    setConfirmModal({
      isOpen: true,
      tool: tool,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      tool: null,
    });
  };

  const handleConfirmTool = async () => {
    if (confirmModal.tool) {
      // Close modal immediately after user confirms
      const currentTool = confirmModal.tool;
      closeConfirmModal();

      if (currentTool.id === "quality") {
        // Handle quality enhancement
        if (!selectedImage) {
          console.error("No image selected for enhancement");
          return;
        }

        try {
          await onEnhanceImage();
        } catch (error) {
          console.error("Enhancement failed:", error);
        }
      } else if (currentTool.id === "reform") {
        // Handle renovation with Gemini
        if (!selectedImage) {
          console.error("No image selected for renovation");
          return;
        }

        if (!onRenovateImage) {
          console.error("Renovation handler not provided");
          return;
        }

        try {
          await onRenovateImage();
        } catch (error) {
          console.error("Renovation failed:", error);
        }
      } else if (currentTool.id === "blur-faces") {
        // Handle blur faces with Gemini
        if (!selectedImage) {
          console.error("No image selected for blur faces");
          return;
        }

        if (!onBlurFaces) {
          console.error("Blur faces handler not provided");
          return;
        }

        try {
          await onBlurFaces();
        } catch (error) {
          console.error("Blur faces failed:", error);
        }
      } else if (currentTool.id === "remove-clutter") {
        // Handle remove clutter with Gemini
        if (!selectedImage) {
          console.error("No image selected for remove clutter");
          return;
        }

        if (!onRemoveClutter) {
          console.error("Remove clutter handler not provided");
          return;
        }

        try {
          await onRemoveClutter();
        } catch (error) {
          console.error("Remove clutter failed:", error);
        }
      }
    } else {
      console.warn("No tool selected in modal");
    }
  };

  const tools = [
    {
      id: "quality",
      title: "Mejorar Calidad",
      description: "Hasta 16x más resolución",
      tokens: qualityTokens, // Dynamic based on image dimensions
      icon: <Sparkles className="h-3 w-3 text-white" />,
    },
    {
      id: "reform",
      title: "Reforma",
      description: "Simula reformas y renovaciones con IA",
      tokens: GEMINI_TOKEN_COSTS.RENOVATION, // Fixed 150 tokens
      icon: (
        <svg
          className="h-3 w-3 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      ),
    },
    {
      id: "blur-faces",
      title: "Pixelar Caras",
      description: "Protege la privacidad desenfocando caras",
      tokens: GEMINI_TOKEN_COSTS.BLUR_FACES, // Fixed 100 tokens
      icon: <EyeOff className="h-3 w-3 text-white" />,
    },
    {
      id: "remove-clutter",
      title: "Eliminar Desorden",
      description: "Elimina objetos y desorden no esencial",
      tokens: GEMINI_TOKEN_COSTS.REMOVE_CLUTTER, // Fixed 100 tokens
      icon: <Trash2 className="h-3 w-3 text-white" />,
    },
  ];

  return (
    <section className="animate-in slide-in-from-bottom-8 delay-500 duration-700">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={cn(
              "group relative overflow-hidden rounded-md bg-white px-3 py-2 text-center shadow-md transition-all duration-200 h-12",
              !selectedImage
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:bg-gray-50 hover:shadow-lg active:scale-[0.98]",
            )}
            onClick={() => {
              if (!selectedImage) {
                return;
              }
              openConfirmModal(tool);
            }}
            disabled={!selectedImage}
          >
            <div className="flex h-full items-center justify-center">
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-gray-800">
                {tool.title}
              </h4>
            </div>
          </button>
        ))}
      </div>

      <ToolConfirmationModal
        isOpen={confirmModal.isOpen}
        tool={confirmModal.tool}
        onConfirm={handleConfirmTool}
        onCancel={closeConfirmModal}
      />
    </section>
  );
}
