"use client";

import { useEffect } from "react";
import { Image as ImageIcon } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Switch } from "~/components/ui/switch";
import { Slider } from "~/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import type { WatermarkSectionProps } from "../types/website-sections";

export function WatermarkSection({
  form,
  isActive,
  onUnsavedChanges,
}: WatermarkSectionProps) {
  // Watch for form changes to detect unsaved changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name?.startsWith("watermarkProps.")) {
        onUnsavedChanges(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onUnsavedChanges]);

  // Only render when active section
  if (!isActive) return null;

  const watermarkEnabled = form.watch("watermarkProps.enabled");
  const logoUrl = form.watch("logo"); // Use logo from branding section

  const positionOptions = [
    { value: "southeast", label: "Esquina Inferior Derecha" },
    { value: "northeast", label: "Esquina Superior Derecha" },
    { value: "southwest", label: "Esquina Inferior Izquierda" },
    { value: "northwest", label: "Esquina Superior Izquierda" },
    { value: "center", label: "Centro" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <ImageIcon className="h-5 w-5 text-gray-500" />
          Marca de Agua
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Configura la marca de agua para las imágenes de tus propiedades
        </p>
      </div>

      <div className="space-y-6">
        {/* Enable/Disable Watermark */}
        <FormField
          control={form.control}
          name="watermarkProps.enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg p-4 shadow-lg">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Marca de Agua Activa
                </FormLabel>
                <FormDescription>
                  Las imágenes se marcarán automáticamente con tu logo
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Logo Warning - Only show if watermark is enabled and logo is missing */}
        {watermarkEnabled && !logoUrl && (
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-lg border-2 border-dashed border-yellow-300 bg-yellow-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ImageIcon
                      className="h-5 w-5 text-yellow-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Logo no configurado
                    </h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      Configura tu logo en la sección &quot;Marca&quot; para
                      usarlo como marca de agua.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Position Settings - Only show if watermark is enabled */}
        {watermarkEnabled && (
          <Card>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="watermarkProps.position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posición</FormLabel>
                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {positionOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`relative flex cursor-pointer rounded-lg p-4 shadow-md transition-colors ${
                            field.value === option.value
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            value={option.value}
                            checked={field.value === option.value}
                            onChange={() => field.onChange(option.value)}
                          />
                          <div className="flex w-full items-center justify-between">
                            <span className="text-sm font-medium">
                              {option.label}
                            </span>
                            {field.value === option.value && (
                              <Badge variant="default" className="ml-2">
                                Activo
                              </Badge>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Size Settings - Only show if watermark is enabled */}
        {watermarkEnabled && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Tamaño de la Marca de Agua
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="watermarkProps.sizePercentage"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Tamaño</FormLabel>
                      <Badge variant="outline" className="text-xs">
                        {field.value || 30}%
                      </Badge>
                    </div>

                    <FormControl>
                      <Slider
                        value={[field.value || 30]}
                        onValueChange={(value) => field.onChange(value[0])}
                        max={50}
                        min={10}
                        step={5}
                        className="w-full"
                      />
                    </FormControl>

                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Pequeño</span>
                      <span>Medio</span>
                      <span>Grande</span>
                    </div>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Opacity Settings - Only show if watermark is enabled */}
        {watermarkEnabled && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Transparencia de la Marca de Agua
              </CardTitle>
              <CardDescription>
                Ajusta la opacidad de la marca de agua (0 = transparente, 100 =
                opaco)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="watermarkProps.opacity"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Opacidad</FormLabel>
                      <Badge variant="outline" className="text-xs">
                        {Math.round((field.value ?? 0.8) * 100)}%
                      </Badge>
                    </div>

                    <FormControl>
                      <Slider
                        value={[(field.value ?? 0.8) * 100]}
                        onValueChange={(value) =>
                          field.onChange(value[0]! / 100)
                        }
                        max={100}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </FormControl>

                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Transparente</span>
                      <span>Medio</span>
                      <span>Opaco</span>
                    </div>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
