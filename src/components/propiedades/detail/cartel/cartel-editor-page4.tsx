"use client";

import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
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
  return (
    <div className="space-y-6">
      {/* Image Count Selector */}
      <div className="space-y-3">
        <Label htmlFor="imageCount">Número de Imágenes</Label>
        <Select
          value={config.imageCount.toString()}
          onValueChange={(value) =>
            updateConfig({ imageCount: parseInt(value) as 1 | 2 | 4 | 6 })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Imagen</SelectItem>
            <SelectItem value="2">2 Imágenes</SelectItem>
            <SelectItem value="4">4 Imágenes</SelectItem>
            <SelectItem value="6">6 Imágenes</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
        <h3 className="text-sm font-medium text-gray-700">
          Posicionamiento de Imágenes
        </h3>

        {templateImages.map((imageUrl, index) => {
          const position = propertyData.imagePositions?.[imageUrl] ?? {
            x: 50,
            y: 50,
            zoom: 1.0,
          };
          return (
            <div key={`image-${index}`} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Imagen {index + 1}</span>
                {index === 0 && (
                  <span className="text-xs text-muted-foreground">
                    (Principal)
                  </span>
                )}
              </div>

              {/* Image preview with positioning and zoom */}
              <div className="relative h-20 w-full overflow-hidden rounded-md border bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={`Preview ${index + 1}`}
                  className="absolute h-full w-full object-cover"
                  style={{
                    objectPosition: `${position.x}% ${position.y}%`,
                    transform: `scale(${position.zoom ?? 1.0})`,
                    transformOrigin: "center",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                  <div className="text-center">
                    <div className="text-xs font-medium text-white">
                      {position.x.toFixed(0)}%, {position.y.toFixed(0)}%
                    </div>
                    <div className="text-xs text-white/80">
                      {(position.zoom ?? 1.0).toFixed(1)}x
                    </div>
                  </div>
                </div>
              </div>

              {/* Position Controls - Joystick Style */}
              <div className="flex items-center justify-between">
                <Label className="text-xs">Posición</Label>
                <div className="text-xs text-muted-foreground">
                  {position.x.toFixed(0)}%, {position.y.toFixed(0)}%
                </div>
              </div>

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
                          Math.min(position.x + 5, 500),
                          position.y,
                        )
                      }
                      disabled={position.x >= 500}
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
                          Math.max(position.x - 5, -500),
                          position.y,
                        )
                      }
                      disabled={position.x <= -500}
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
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Zoom</Label>

                <div className="flex items-center gap-3">
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
