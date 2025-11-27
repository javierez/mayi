"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Slider } from "~/components/ui/slider";
import { ColorPickerPopover } from "~/components/ui/color-picker-popover";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type {
  TemplateConfiguration,
  ExtendedTemplatePropertyData,
} from "~/types/template-data";

interface CartelEditorPage3Props {
  config: TemplateConfiguration;
  updateConfig: (updates: Partial<TemplateConfiguration>) => void;
  propertyData: ExtendedTemplatePropertyData;
  updatePropertyData: (updates: Partial<ExtendedTemplatePropertyData>) => void;
  locationText: string;
  setLocationText: (text: string) => void;
  accountColorPalette?: string[];
  onPrevious?: () => void;
  onNext?: () => void;
}

export function CartelEditorPage3({
  config,
  updateConfig,
  propertyData,
  updatePropertyData,
  locationText,
  setLocationText,
  accountColorPalette = [],
  onPrevious,
  onNext,
}: CartelEditorPage3Props) {
  // Toggle states for customization sections
  const [showTitleCustomization, setShowTitleCustomization] = useState(false);
  const [showLocationCustomization, setShowLocationCustomization] =
    useState(false);
  const [showPriceCustomization, setShowPriceCustomization] = useState(false);
  const [showContactCustomization, setShowContactCustomization] =
    useState(false);

  return (
    <div className="space-y-6">
      {/* Title Customization Section */}
      <div className="space-y-3">
        {/* Title Input Field */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={propertyData.title}
              onChange={(e) => {
                if (e.target.value.length <= 25) {
                  updatePropertyData({ title: e.target.value });
                }
              }}
              maxLength={25}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowTitleCustomization(!showTitleCustomization)}
            className="group mt-6 rounded-md p-2 transition-colors duration-150 hover:bg-gray-100"
            title="Personalizar título"
          >
            <div
              className={`text-gray-400 transition-transform duration-200 group-hover:text-gray-600 ${showTitleCustomization ? "rotate-180" : "rotate-0"} `}
            >
              <ChevronDown className="h-4 w-4" />
            </div>
          </button>
        </div>

        {/* Title Styling Controls */}
        {showTitleCustomization && (
          <div className="space-y-4 rounded-lg bg-gray-50 p-3">
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Font Style */}
                <div>
                  <Label htmlFor="titleFont">Fuente</Label>
                  <Select
                    value={config.titleFont}
                    onValueChange={(
                      value:
                        | "default"
                        | "serif"
                        | "sans"
                        | "mono"
                        | "elegant"
                        | "modern",
                    ) => updateConfig({ titleFont: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Por defecto</SelectItem>
                      <SelectItem value="serif" style={{ fontFamily: "serif" }}>
                        Serif
                      </SelectItem>
                      <SelectItem
                        value="sans"
                        style={{ fontFamily: "sans-serif" }}
                      >
                        Sans
                      </SelectItem>
                      <SelectItem value="mono" style={{ fontFamily: "monospace" }}>
                        Mono
                      </SelectItem>
                      <SelectItem
                        value="elegant"
                        style={{ fontFamily: "Times, serif" }}
                      >
                        Elegant
                      </SelectItem>
                      <SelectItem
                        value="modern"
                        style={{ fontFamily: "Arial, sans-serif" }}
                      >
                        Modern
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Text Color */}
                <ColorPickerPopover
                  label="Color del texto"
                  value={config.titleColor === "white" ? "#ffffff" : config.titleColor === "black" ? "#000000" : config.titleColor === "gray" ? "#6b7280" : config.titleColor}
                  onChange={(color) => updateConfig({ titleColor: color })}
                  accountColorPalette={accountColorPalette}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Text Alignment */}
                <div>
                  <Label>Alineación</Label>
                  <div className="mt-1 flex gap-1">
                    <Button
                      variant={
                        config.titleAlignment === "left" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => updateConfig({ titleAlignment: "left" })}
                      className="p-2"
                    >
                      <AlignLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={
                        config.titleAlignment === "center" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => updateConfig({ titleAlignment: "center" })}
                      className="p-2"
                    >
                      <AlignCenter className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={
                        config.titleAlignment === "right" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => updateConfig({ titleAlignment: "right" })}
                      className="p-2"
                    >
                      <AlignRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Text Size */}
                <div>
                  <Label>Tamaño</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs">A</span>
                    <Slider
                      value={[config.titleSize]}
                      onValueChange={([value]) =>
                        updateConfig({ titleSize: value })
                      }
                      max={60}
                      min={16}
                      step={2}
                      className="flex-1"
                    />
                    <span className="text-lg font-bold">A</span>
                  </div>
                </div>
              </div>

              {/* Position Controls */}
              <div>
                <Label className="text-sm text-gray-600">Posición</Label>
                <div className="mt-2 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    {/* Up Arrow */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mb-0.5 h-6 w-6 p-0"
                      onClick={() =>
                        updateConfig({
                          titlePositionY: Math.max(
                            (config.titlePositionY ?? 0) - 5,
                            -30,
                          ),
                        })
                      }
                      disabled={(config.titlePositionY ?? 0) <= -30}
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
                            titlePositionX: Math.max(
                              (config.titlePositionX ?? 0) - 5,
                              -50,
                            ),
                          })
                        }
                        disabled={(config.titlePositionX ?? 0) <= -50}
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
                            titlePositionX: 0,
                            titlePositionY: 0,
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
                            titlePositionX: Math.min(
                              (config.titlePositionX ?? 0) + 5,
                              50,
                            ),
                          })
                        }
                        disabled={(config.titlePositionX ?? 0) >= 50}
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
                          titlePositionY: Math.min(
                            (config.titlePositionY ?? 0) + 5,
                            30,
                          ),
                        })
                      }
                      disabled={(config.titlePositionY ?? 0) >= 30}
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

      {/* Location Customization Section */}
      <div className="space-y-3">
        {/* Location Input Field */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label htmlFor="location">Ubicación</Label>
            <Input
              id="location"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="Barrio (Ciudad)"
            />
          </div>
          <button
            type="button"
            onClick={() =>
              setShowLocationCustomization(!showLocationCustomization)
            }
            className="group mt-6 rounded-md p-2 transition-colors duration-150 hover:bg-gray-100"
            title="Personalizar ubicación"
          >
            <div
              className={`text-gray-400 transition-transform duration-200 group-hover:text-gray-600 ${showLocationCustomization ? "rotate-180" : "rotate-0"}`}
            >
              <ChevronDown className="h-4 w-4" />
            </div>
          </button>
        </div>

        {/* Location Styling Controls */}
        {showLocationCustomization && (
          <div className="space-y-4 rounded-lg bg-gray-50 p-3">
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Font Style */}
                <div>
                  <Label htmlFor="locationFont">Fuente</Label>
                  <Select
                    value={config.locationFont}
                    onValueChange={(
                      value:
                        | "default"
                        | "serif"
                        | "sans"
                        | "mono"
                        | "elegant"
                        | "modern",
                    ) => updateConfig({ locationFont: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Por defecto</SelectItem>
                      <SelectItem value="serif" style={{ fontFamily: "serif" }}>
                        Serif
                      </SelectItem>
                      <SelectItem
                        value="sans"
                        style={{ fontFamily: "sans-serif" }}
                      >
                        Sans
                      </SelectItem>
                      <SelectItem value="mono" style={{ fontFamily: "monospace" }}>
                        Mono
                      </SelectItem>
                      <SelectItem
                        value="elegant"
                        style={{ fontFamily: "Times, serif" }}
                      >
                        Elegant
                      </SelectItem>
                      <SelectItem
                        value="modern"
                        style={{ fontFamily: "Arial, sans-serif" }}
                      >
                        Modern
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Text Color */}
                <ColorPickerPopover
                  label="Color del texto"
                  value={config.locationColor === "white" ? "#ffffff" : config.locationColor === "black" ? "#000000" : config.locationColor === "gray" ? "#6b7280" : config.locationColor}
                  onChange={(color) => updateConfig({ locationColor: color })}
                  accountColorPalette={accountColorPalette}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Text Alignment */}
                <div>
                  <Label>Alineación</Label>
                  <div className="mt-1 flex gap-1">
                    <Button
                      variant={
                        config.locationAlignment === "left"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        updateConfig({ locationAlignment: "left" })
                      }
                      className="p-2"
                    >
                      <AlignLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={
                        config.locationAlignment === "center"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        updateConfig({ locationAlignment: "center" })
                      }
                      className="p-2"
                    >
                      <AlignCenter className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={
                        config.locationAlignment === "right"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        updateConfig({ locationAlignment: "right" })
                      }
                      className="p-2"
                    >
                      <AlignRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Text Size */}
                <div>
                  <Label>Tamaño</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs">A</span>
                    <Slider
                      value={[config.locationSize]}
                      onValueChange={([value]) =>
                        updateConfig({ locationSize: value })
                      }
                      max={32}
                      min={16}
                      step={2}
                      className="flex-1"
                    />
                    <span className="text-lg font-bold">A</span>
                  </div>
                </div>
              </div>

              {/* Position Controls */}
              <div>
                <Label className="text-sm text-gray-600">Posición</Label>
                <div className="mt-2 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    {/* Up Arrow */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mb-0.5 h-6 w-6 p-0"
                      onClick={() =>
                        updateConfig({
                          locationPositionY: Math.max(
                            (config.locationPositionY ?? 0) - 5,
                            -30,
                          ),
                        })
                      }
                      disabled={(config.locationPositionY ?? 0) <= -30}
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
                            locationPositionX: Math.max(
                              (config.locationPositionX ?? 0) - 5,
                              -50,
                            ),
                          })
                        }
                        disabled={(config.locationPositionX ?? 0) <= -50}
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
                            locationPositionX: 0,
                            locationPositionY: 0,
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
                            locationPositionX: Math.min(
                              (config.locationPositionX ?? 0) + 5,
                              50,
                            ),
                          })
                        }
                        disabled={(config.locationPositionX ?? 0) >= 50}
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
                          locationPositionY: Math.min(
                            (config.locationPositionY ?? 0) + 5,
                            30,
                          ),
                        })
                      }
                      disabled={(config.locationPositionY ?? 0) >= 30}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Border Radius Control - Only show for classic template */}
              {config.templateStyle !== "basic" && (
                <div>
                  <Label className="text-sm text-gray-600">
                    Esquinas redondeadas
                  </Label>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs">◼</span>
                    <Slider
                      value={[config.locationBorderRadius]}
                      onValueChange={([value]) =>
                        updateConfig({ locationBorderRadius: value })
                      }
                      max={20}
                      min={0}
                      step={2}
                      className="flex-1"
                    />
                    <span className="text-xs">◯</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Price Customization Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">
            Personalización de Precio
          </h3>
          <button
            type="button"
            onClick={() => setShowPriceCustomization(!showPriceCustomization)}
            className="group rounded-md p-2 transition-colors duration-150 hover:bg-gray-100"
            title="Personalizar precio"
          >
            <div
              className={`text-gray-400 transition-transform duration-200 group-hover:text-gray-600 ${showPriceCustomization ? "rotate-180" : "rotate-0"}`}
            >
              <ChevronDown className="h-4 w-4" />
            </div>
          </button>
        </div>

        {showPriceCustomization && (
          <div className="space-y-4 rounded-lg bg-gray-50 p-3">
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Font Style */}
                <div>
                  <Label htmlFor="priceFont">Fuente</Label>
                  <Select
                    value={config.priceFont}
                    onValueChange={(
                      value:
                        | "default"
                        | "serif"
                        | "sans"
                        | "mono"
                        | "elegant"
                        | "modern",
                    ) => updateConfig({ priceFont: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Por defecto</SelectItem>
                      <SelectItem value="serif" style={{ fontFamily: "serif" }}>
                        Serif
                      </SelectItem>
                      <SelectItem
                        value="sans"
                        style={{ fontFamily: "sans-serif" }}
                      >
                        Sans
                      </SelectItem>
                      <SelectItem value="mono" style={{ fontFamily: "monospace" }}>
                        Mono
                      </SelectItem>
                      <SelectItem
                        value="elegant"
                        style={{ fontFamily: "Times, serif" }}
                      >
                        Elegant
                      </SelectItem>
                      <SelectItem
                        value="modern"
                        style={{ fontFamily: "Arial, sans-serif" }}
                      >
                        Modern
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Text Color */}
                <ColorPickerPopover
                  label="Color del texto"
                  value={config.priceColor === "white" ? "#ffffff" : config.priceColor === "black" ? "#000000" : config.priceColor === "gray" ? "#6b7280" : config.priceColor}
                  onChange={(color) => updateConfig({ priceColor: color })}
                  accountColorPalette={accountColorPalette}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Text Alignment */}
                <div>
                  <Label>Alineación</Label>
                  <div className="mt-1 flex gap-1">
                    <Button
                      variant={
                        config.priceAlignment === "left" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => updateConfig({ priceAlignment: "left" })}
                      className="p-2"
                    >
                      <AlignLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={
                        config.priceAlignment === "center" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => updateConfig({ priceAlignment: "center" })}
                      className="p-2"
                    >
                      <AlignCenter className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={
                        config.priceAlignment === "right" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => updateConfig({ priceAlignment: "right" })}
                      className="p-2"
                    >
                      <AlignRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Text Size */}
                <div>
                  <Label>Tamaño</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs">A</span>
                    <Slider
                      value={[config.priceSize]}
                      onValueChange={([value]) =>
                        updateConfig({ priceSize: value })
                      }
                      max={80}
                      min={24}
                      step={4}
                      className="flex-1"
                    />
                    <span className="text-lg font-bold">A</span>
                  </div>
                </div>
              </div>

              {/* Position Controls */}
              <div>
                <Label className="text-sm text-gray-600">Posición</Label>
                <div className="mt-2 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    {/* Up Arrow */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mb-0.5 h-6 w-6 p-0"
                      onClick={() =>
                        updateConfig({
                          pricePositionY: Math.max(
                            (config.pricePositionY ?? 0) - 5,
                            -30,
                          ),
                        })
                      }
                      disabled={(config.pricePositionY ?? 0) <= -30}
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
                            pricePositionX: Math.max(
                              (config.pricePositionX ?? 0) - 5,
                              -50,
                            ),
                          })
                        }
                        disabled={(config.pricePositionX ?? 0) <= -50}
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
                            pricePositionX: 0,
                            pricePositionY: 0,
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
                            pricePositionX: Math.min(
                              (config.pricePositionX ?? 0) + 5,
                              50,
                            ),
                          })
                        }
                        disabled={(config.pricePositionX ?? 0) >= 50}
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
                          pricePositionY: Math.min(
                            (config.pricePositionY ?? 0) + 5,
                            30,
                          ),
                        })
                      }
                      disabled={(config.pricePositionY ?? 0) >= 30}
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

      {/* Contact Customization Section - Hidden for basic template */}
      {config.templateStyle !== "basic" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              Personalización de Contacto
            </h3>
            <button
              type="button"
              onClick={() =>
                setShowContactCustomization(!showContactCustomization)
              }
              className="group rounded-md p-2 transition-colors duration-150 hover:bg-gray-100"
              title="Personalizar información de contacto"
            >
              <div
                className={`text-gray-400 transition-transform duration-200 group-hover:text-gray-600 ${showContactCustomization ? "rotate-180" : "rotate-0"}`}
              >
                <ChevronDown className="h-4 w-4" />
              </div>
            </button>
          </div>

          {showContactCustomization && (
          <div className="space-y-4 rounded-lg bg-gray-50 p-3">
            <div className="space-y-3">
              {/* Background Color */}
              <ColorPickerPopover
                label="Color de Fondo"
                value={
                  config.contactBackgroundColor === "default" ? "#4b5563" :
                  config.contactBackgroundColor === "white" ? "#ffffff" :
                  config.contactBackgroundColor === "black" ? "#000000" :
                  config.contactBackgroundColor === "gray" ? "#6b7280" :
                  config.contactBackgroundColor === "light" ? "#e5e7eb" :
                  config.contactBackgroundColor === "dark" ? "#1f2937" :
                  config.contactBackgroundColor
                }
                onChange={(color) => updateConfig({ contactBackgroundColor: color })}
                accountColorPalette={accountColorPalette}
              />

              {/* Border Radius */}
              <div>
                <Label>Esquinas Redondeadas</Label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs">0</span>
                  <Slider
                    value={[config.contactBorderRadius]}
                    onValueChange={([value]) =>
                      updateConfig({ contactBorderRadius: value })
                    }
                    max={20}
                    min={0}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs">20</span>
                </div>
              </div>

              {/* Position Controls */}
              <div>
                <Label>Posición</Label>
                <div className="mt-2 flex justify-center">
                  <div className="flex flex-col items-center">
                    {/* Up Arrow */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mb-0.5 h-6 w-6 p-0"
                      onClick={() =>
                        updateConfig({
                          contactPositionY: Math.max(
                            (config.contactPositionY ?? 0) - 5,
                            -30,
                          ),
                        })
                      }
                      disabled={(config.contactPositionY ?? 0) <= -30}
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
                            contactPositionX: Math.max(
                              (config.contactPositionX ?? 0) - 5,
                              -50,
                            ),
                          })
                        }
                        disabled={(config.contactPositionX ?? 0) <= -50}
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
                            contactPositionX: 0,
                            contactPositionY: 0,
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
                            contactPositionX: Math.min(
                              (config.contactPositionX ?? 0) + 5,
                              50,
                            ),
                          })
                        }
                        disabled={(config.contactPositionX ?? 0) >= 50}
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
                          contactPositionY: Math.min(
                            (config.contactPositionY ?? 0) + 5,
                            30,
                          ),
                        })
                      }
                      disabled={(config.contactPositionY ?? 0) >= 30}
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
      )}

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
