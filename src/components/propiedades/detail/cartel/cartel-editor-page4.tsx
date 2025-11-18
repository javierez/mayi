"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { TemplateConfiguration, ExtendedTemplatePropertyData } from "~/types/template-data";

interface CartelEditorPage4Props {
  config: TemplateConfiguration;
  updateConfig: (updates: Partial<TemplateConfiguration>) => void;
  propertyData: ExtendedTemplatePropertyData;
  templateImages: string[];
  updateImagePosition: (imageUrl: string, x: number, y: number) => void;
  updateImageZoom: (imageUrl: string, zoom: number) => void;
  onPrevious?: () => void;
}

export function CartelEditorPage4({
  config,
  updateConfig,
  propertyData,
  templateImages,
  updateImagePosition,
  updateImageZoom,
  onPrevious,
}: CartelEditorPage4Props) {
  const [expandedImages, setExpandedImages] = useState<Set<number>>(new Set());

  const toggleImage = (index: number) => {
    setExpandedImages((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* 2-Image Layout Toggle - Only show when we have exactly 2 images */}
      {templateImages.length === 2 && (
        <div className="space-y-3 rounded-lg bg-gray-50 p-4">
          <Label className="text-sm font-medium text-gray-700">
            Diseño de 2 Imágenes
          </Label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updateConfig({ twoImageLayout: "vertical" })}
              className={`flex-1 rounded-lg border-2 p-4 transition-all ${
                config.twoImageLayout === "vertical"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-8 w-12 justify-center gap-1 rounded-md bg-gray-200 p-1">
                  <div className="h-full w-2 rounded-sm bg-gray-400"></div>
                  <div className="h-full w-2 rounded-sm bg-gray-400"></div>
                </div>
                <span className="text-sm font-medium">Vertical</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => updateConfig({ twoImageLayout: "horizontal" })}
              className={`flex-1 rounded-lg border-2 p-4 transition-all ${
                config.twoImageLayout === "horizontal"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-8 w-12 flex-col gap-1 rounded-md bg-gray-200 p-1">
                  <div className="h-2 w-full rounded-sm bg-gray-400"></div>
                  <div className="h-2 w-full rounded-sm bg-gray-400"></div>
                </div>
                <span className="text-sm font-medium">Horizontal</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Image Positioning Controls */}
      <div className="space-y-6">
        {templateImages.map((imageUrl, index) => {
          const position = propertyData.imagePositions?.[imageUrl] ?? {
            x: 50,
            y: 50,
            zoom: 1.0,
          };
          const isExpanded = expandedImages.has(index);

          return (
            <div key={`image-${index}`} className="space-y-3">
              <button
                type="button"
                onClick={() => toggleImage(index)}
                className={`group flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-white to-gray-50 px-4 py-3.5 shadow-sm transition-all duration-200 hover:shadow-md hover:from-gray-50 hover:to-gray-100 ${
                  isExpanded
                    ? "border-2 border-gray-300 shadow-md ring-2 ring-gray-200 ring-opacity-50"
                    : "border border-gray-200"
                }`}
              >
                <span
                  className={`text-sm font-semibold transition-colors ${
                    isExpanded ? "text-gray-900" : "text-gray-700"
                  }`}
                >
                  Imagen {index + 1}
                </span>
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 ${
                    isExpanded
                      ? "bg-gray-200 text-gray-700"
                      : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                  }`}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="space-y-4 rounded-lg bg-gray-50 p-4 shadow-md">
                  {/* Position Controls - Joystick Style */}
                  <div className="flex justify-center">
                <div className="flex flex-col items-center">
                  {/* Up Arrow */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mb-0.5 h-6 w-6 p-0"
                    onClick={() =>
                      updateImagePosition(
                        imageUrl,
                        position.x,
                        Math.max(position.y - 5, -500),
                      )
                    }
                    disabled={position.y <= -500}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>

                  <div className="flex items-center gap-0.5">
                    {/* Left Arrow */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() =>
                        updateImagePosition(
                          imageUrl,
                          Math.max(position.x - 5, -500),
                          position.y,
                        )
                      }
                      disabled={position.x <= -500}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>

                    {/* Center/Reset Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 rounded-full p-0"
                      onClick={() => updateImagePosition(imageUrl, 50, 50)}
                    >
                      <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                    </Button>

                    {/* Right Arrow */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() =>
                        updateImagePosition(
                          imageUrl,
                          Math.min(position.x + 5, 500),
                          position.y,
                        )
                      }
                      disabled={position.x >= 500}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Down Arrow */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-0.5 h-6 w-6 p-0"
                    onClick={() =>
                      updateImagePosition(
                        imageUrl,
                        position.x,
                        Math.min(position.y + 5, 500),
                      )
                    }
                    disabled={position.y >= 500}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Zoom Controls - Minimalistic */}
              <div className="flex w-full items-center gap-3">
                <button
                  type="button"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() =>
                    updateImageZoom(imageUrl, (position.zoom ?? 1.0) - 0.1)
                  }
                  disabled={(position.zoom ?? 1.0) <= 0.5}
                >
                  <ZoomOut className="h-3 w-3 text-gray-600" />
                </button>

                <div className="flex-1">
                  <Slider
                    value={[position.zoom ?? 1.0]}
                    onValueChange={([value]) =>
                      updateImageZoom(imageUrl, value ?? 1.0)
                    }
                    max={3.0}
                    min={0.5}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <button
                  type="button"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() =>
                    updateImageZoom(imageUrl, (position.zoom ?? 1.0) + 0.1)
                  }
                  disabled={(position.zoom ?? 1.0) >= 3.0}
                >
                  <ZoomIn className="h-3 w-3 text-gray-600" />
                </button>
              </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      {onPrevious && (
        <div className="mt-6 flex justify-start">
          <Button
            type="button"
            onClick={onPrevious}
            size="sm"
            variant="ghost"
            className="bg-gray-100 text-xs font-normal text-gray-800 shadow-md hover:bg-gray-200 hover:text-black hover:shadow-lg"
          >
            <ChevronLeft className="mr-1 h-3 w-3" />
            Anterior
          </Button>
        </div>
      )}
    </div>
  );
}
