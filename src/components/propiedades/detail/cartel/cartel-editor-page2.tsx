"use client";

import React from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Slider } from "~/components/ui/slider";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  FileText,
  List,
} from "lucide-react";
import { cn } from "~/lib/utils";
import type {
  TemplateConfiguration,
  ExtendedTemplatePropertyData,
} from "~/types/template-data";
import { AdditionalFieldsSelector } from "~/components/admin/carteleria/controls/additional-fields-selector";

interface CartelEditorPage2Props {
  config: TemplateConfiguration;
  updateConfig: (updates: Partial<TemplateConfiguration>) => void;
  propertyData: ExtendedTemplatePropertyData;
  updatePropertyData: (updates: Partial<ExtendedTemplatePropertyData>) => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function CartelEditorPage2({
  config,
  updateConfig,
  propertyData,
  updatePropertyData,
  onPrevious,
  onNext,
}: CartelEditorPage2Props) {
  // Determine current selection based on config
  const getCurrentSelection = (): "iconos" | "descripcion" | "bullets" => {
    if (config.showIcons) return "iconos";
    if (config.showShortDescription) return "descripcion";
    return "bullets";
  };

  const handleContentTypeChange = (value: "iconos" | "descripcion" | "bullets") => {
    if (value === "iconos") {
      updateConfig({ showIcons: true, showShortDescription: false });
    } else if (value === "descripcion") {
      updateConfig({ showIcons: false, showShortDescription: true });
    } else if (value === "bullets") {
      updateConfig({ showIcons: false, showShortDescription: false });
    }
  };

  const currentSelection = getCurrentSelection();

  const contentTypeOptions = [
    {
      value: "iconos" as const,
      label: "Iconos",
      icon: LayoutGrid,
    },
    {
      value: "descripcion" as const,
      label: "Descripción",
      icon: FileText,
    },
    {
      value: "bullets" as const,
      label: "Lista",
      icon: List,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Content Type Selection */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Tipo de Contenido</Label>
        <div className="grid grid-cols-3 gap-3">
          {contentTypeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = currentSelection === option.value;
            return (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                className={cn(
                  "flex h-20 flex-col items-center justify-center gap-2 transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "hover:bg-gray-50",
                )}
                onClick={() => handleContentTypeChange(option.value)}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isSelected ? "text-primary" : "text-gray-600",
                  )}
                />
                <span
                  className={cn(
                    "text-xs",
                    isSelected ? "font-medium text-primary" : "text-gray-600",
                  )}
                >
                  {option.label}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Content Group */}
      <div className="space-y-2">
        <div className="space-y-2">
          {/* Bullets/List - Show when bullets is selected */}
          {currentSelection === "bullets" && (
            <div>
                <textarea
                  value={propertyData.iconListText ?? ""}
                  onChange={(e) =>
                    updatePropertyData({
                      iconListText: e.target.value,
                    })
                  }
                  placeholder="Lista de características (una por línea)..."
                  className="w-full resize-none rounded border border-gray-200 p-3 text-sm md:p-2 md:text-xs"
                  rows={4}
                />

                {/* Bullet List Styling Controls */}
                <div className="mt-3 space-y-3 rounded-lg bg-gray-50 p-3">
                  <Label className="text-xs font-medium">
                    Personalización de Lista
                  </Label>

                  {/* Font and Size */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Fuente</Label>
                      <Select
                        value={config.bulletFont}
                        onValueChange={(value) =>
                          updateConfig({
                            bulletFont:
                              value as TemplateConfiguration["bulletFont"],
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">
                            Por defecto
                          </SelectItem>
                          <SelectItem value="serif">
                            Serif
                          </SelectItem>
                          <SelectItem value="sans">Sans</SelectItem>
                          <SelectItem value="mono">Mono</SelectItem>
                          <SelectItem value="elegant">
                            Elegante
                          </SelectItem>
                          <SelectItem value="modern">
                            Moderno
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Tamaño</Label>
                      <div className="flex items-center space-x-2">
                        <Slider
                          value={[config.bulletSize]}
                          onValueChange={([value]) =>
                            updateConfig({ bulletSize: value })
                          }
                          max={24}
                          min={12}
                          step={1}
                          className="flex-1"
                        />
                        <span className="w-8 text-xs">
                          {config.bulletSize}px
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Alignment and Color */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Alineación</Label>
                      <div className="flex rounded-md border">
                        <button
                          type="button"
                          onClick={() =>
                            updateConfig({
                              bulletAlignment: "left",
                            })
                          }
                          className={`flex-1 rounded-l-md border-r p-2 ${
                            config.bulletAlignment === "left"
                              ? "bg-blue-500 text-white"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <AlignLeft className="mx-auto h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateConfig({
                              bulletAlignment: "center",
                            })
                          }
                          className={`flex-1 border-r p-2 ${
                            config.bulletAlignment === "center"
                              ? "bg-blue-500 text-white"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <AlignCenter className="mx-auto h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateConfig({
                              bulletAlignment: "right",
                            })
                          }
                          className={`flex-1 rounded-r-md p-2 ${
                            config.bulletAlignment === "right"
                              ? "bg-blue-500 text-white"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <AlignRight className="mx-auto h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Color</Label>
                      <Input
                        type="color"
                        value={config.bulletColor}
                        onChange={(e) =>
                          updateConfig({
                            bulletColor: e.target.value,
                          })
                        }
                        className="h-8"
                      />
                    </div>
                  </div>

                  {/* Position Controls - Joystick Style */}
                  <div>
                    <Label className="text-xs text-gray-600">
                      Posición
                    </Label>
                    <div className="mt-2 flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        {/* Up Arrow */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="mb-0.5 h-6 w-6 p-0"
                          onClick={() =>
                            updateConfig({
                              bulletPositionY: Math.max(
                                (config.bulletPositionY ?? 0) - 5,
                                -30,
                              ),
                            })
                          }
                          disabled={
                            (config.bulletPositionY ?? 0) <= -30
                          }
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
                              updateConfig({
                                bulletPositionX: Math.max(
                                  (config.bulletPositionX ?? 0) - 5,
                                  -50,
                                ),
                              })
                            }
                            disabled={
                              (config.bulletPositionX ?? 0) <= -50
                            }
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </Button>

                          {/* Center/Reset Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 rounded-full p-0"
                            onClick={() =>
                              updateConfig({
                                bulletPositionX: 0,
                                bulletPositionY: 0,
                              })
                            }
                          >
                            <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                          </Button>

                          {/* Right Arrow */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              updateConfig({
                                bulletPositionX: Math.min(
                                  (config.bulletPositionX ?? 0) + 5,
                                  50,
                                ),
                              })
                            }
                            disabled={
                              (config.bulletPositionX ?? 0) >= 50
                            }
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
                            updateConfig({
                              bulletPositionY: Math.min(
                                (config.bulletPositionY ?? 0) + 5,
                                30,
                              ),
                            })
                          }
                          disabled={
                            (config.bulletPositionY ?? 0) >= 30
                          }
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <span className="text-xs text-gray-500">
                        {config.bulletPositionX}px,{" "}
                        {config.bulletPositionY}px
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Short Description with Edit - Show when descripcion is selected */}
          {currentSelection === "descripcion" && (
            <div>
                <textarea
                  value={propertyData.shortDescription ?? ""}
                  onChange={(e) => {
                    console.log(
                      "Updating shortDescription:",
                      e.target.value,
                    );
                    updatePropertyData({
                      shortDescription: e.target.value,
                    });
                  }}
                  placeholder="Escribe una descripción personalizada..."
                  className="w-full resize-none rounded border border-gray-200 p-3 text-sm md:p-2 md:text-xs"
                  rows={2}
                />

                {/* Description Styling Controls */}
                <div className="mt-3 space-y-3 rounded-lg bg-gray-50 p-3">
                  <Label className="text-xs font-medium">
                    Personalización de Descripción
                  </Label>

                  {/* Font and Size */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Fuente</Label>
                      <Select
                        value={config.descriptionFont}
                        onValueChange={(value) =>
                          updateConfig({
                            descriptionFont:
                              value as TemplateConfiguration["descriptionFont"],
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">
                            Por defecto
                          </SelectItem>
                          <SelectItem value="serif">
                            Serif
                          </SelectItem>
                          <SelectItem value="sans">Sans</SelectItem>
                          <SelectItem value="mono">Mono</SelectItem>
                          <SelectItem value="elegant">
                            Elegante
                          </SelectItem>
                          <SelectItem value="modern">
                            Moderno
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Tamaño</Label>
                      <div className="flex items-center space-x-2">
                        <Slider
                          value={[config.descriptionSize]}
                          onValueChange={([value]) =>
                            updateConfig({ descriptionSize: value })
                          }
                          max={32}
                          min={12}
                          step={1}
                          className="flex-1"
                        />
                        <span className="w-8 text-xs">
                          {config.descriptionSize}px
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Alignment and Color */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Alineación</Label>
                      <div className="flex rounded-md border">
                        <button
                          type="button"
                          onClick={() =>
                            updateConfig({
                              descriptionAlignment: "left",
                            })
                          }
                          className={`flex-1 rounded-l-md border-r p-2 ${
                            config.descriptionAlignment === "left"
                              ? "bg-blue-500 text-white"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <AlignLeft className="mx-auto h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateConfig({
                              descriptionAlignment: "center",
                            })
                          }
                          className={`flex-1 border-r p-2 ${
                            config.descriptionAlignment === "center"
                              ? "bg-blue-500 text-white"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <AlignCenter className="mx-auto h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateConfig({
                              descriptionAlignment: "right",
                            })
                          }
                          className={`flex-1 rounded-r-md p-2 ${
                            config.descriptionAlignment === "right"
                              ? "bg-blue-500 text-white"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <AlignRight className="mx-auto h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Color</Label>
                      <Input
                        type="color"
                        value={config.descriptionColor}
                        onChange={(e) =>
                          updateConfig({
                            descriptionColor: e.target.value,
                          })
                        }
                        className="h-8"
                      />
                    </div>
                  </div>

                  {/* Position Controls */}
                  <div>
                    <Label className="text-xs text-gray-600">
                      Posición
                    </Label>
                    <div className="mt-2 flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        {/* Up Arrow */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="mb-0.5 h-6 w-6 p-0"
                          onClick={() =>
                            updateConfig({
                              descriptionPositionY: Math.max(
                                (config.descriptionPositionY ?? 0) -
                                  5,
                                -30,
                              ),
                            })
                          }
                          disabled={
                            (config.descriptionPositionY ?? 0) <=
                            -30
                          }
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
                              updateConfig({
                                descriptionPositionX: Math.max(
                                  (config.descriptionPositionX ??
                                    0) - 5,
                                  -50,
                                ),
                              })
                            }
                            disabled={
                              (config.descriptionPositionX ?? 0) <=
                              -50
                            }
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </Button>

                          {/* Center/Reset Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 rounded-full p-0"
                            onClick={() =>
                              updateConfig({
                                descriptionPositionX: 0,
                                descriptionPositionY: 0,
                              })
                            }
                          >
                            <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                          </Button>

                          {/* Right Arrow */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              updateConfig({
                                descriptionPositionX: Math.min(
                                  (config.descriptionPositionX ??
                                    0) + 5,
                                  50,
                                ),
                              })
                            }
                            disabled={
                              (config.descriptionPositionX ?? 0) >=
                              50
                            }
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
                            updateConfig({
                              descriptionPositionY: Math.min(
                                (config.descriptionPositionY ?? 0) +
                                  5,
                                30,
                              ),
                            })
                          }
                          disabled={
                            (config.descriptionPositionY ?? 0) >= 30
                          }
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Additional Fields Selector */}
      <div>
        <AdditionalFieldsSelector
          config={config}
          onChange={updateConfig}
        />
      </div>

      {/* Navigation */}
      {(onPrevious ?? onNext) && (
        <div className="mt-6 flex justify-between">
          {onPrevious && (
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
          )}
          {onNext && (
            <Button
              type="button"
              onClick={onNext}
              size="sm"
              variant="ghost"
              className="bg-gray-100 text-xs font-normal text-gray-800 shadow-md hover:bg-gray-200 hover:text-black hover:shadow-lg"
            >
              Siguiente
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
