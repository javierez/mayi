"use client";

import { useEffect, useState, useCallback } from "react";
import { Code, Info } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import type { HeadSectionProps } from "../types/website-sections";

export function HeadSection({
  form,
  isActive,
  onUnsavedChanges,
}: HeadSectionProps) {
  const [visibleDescriptions, setVisibleDescriptions] = useState<Set<string>>(new Set());

  const toggleDescription = useCallback((fieldName: string) => {
    setVisibleDescriptions(prev => {
      const next = new Set(prev);
      if (next.has(fieldName)) {
        next.delete(fieldName);
      } else {
        next.add(fieldName);
      }
      return next;
    });
  }, []);

  // Watch for form changes to detect unsaved changes - PRESERVE existing logic
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name?.startsWith("headProps")) {
        onUnsavedChanges(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onUnsavedChanges]);

  // Only render when active section
  if (!isActive) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <Code className="h-5 w-5 text-gray-500" />
          Scripts y Código Personalizado
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Añade scripts de seguimiento y código personalizado
        </p>
      </div>

      <div className="space-y-4">
        {/* Google Analytics Field */}
        <FormField
          control={form.control}
          name="headProps.googleAnalytics"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-1">
                <FormLabel>Google Analytics ID</FormLabel>
                <button
                  type="button"
                  onClick={() => toggleDescription("headProps.googleAnalytics")}
                  className="focus:outline-none"
                >
                  <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                </button>
              </div>
              {visibleDescriptions.has("headProps.googleAnalytics") && (
                <FormDescription className="text-xs">
                  ID de seguimiento de Google Analytics (ej: G-XXXXXXXXXX)
                </FormDescription>
              )}
              <FormControl>
                <Input {...field} placeholder="G-XXXXXXXXXX" />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Facebook Pixel Field */}
        <FormField
          control={form.control}
          name="headProps.facebookPixel"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-1">
                <FormLabel>Facebook Pixel ID</FormLabel>
                <button
                  type="button"
                  onClick={() => toggleDescription("headProps.facebookPixel")}
                  className="focus:outline-none"
                >
                  <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                </button>
              </div>
              {visibleDescriptions.has("headProps.facebookPixel") && (
                <FormDescription className="text-xs">
                  ID del píxel de Facebook para seguimiento
                </FormDescription>
              )}
              <FormControl>
                <Input {...field} placeholder="1234567890" />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Custom Scripts Field */}
        <FormField
          control={form.control}
          name="headProps.customScripts"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-1">
                <FormLabel>Scripts Personalizados</FormLabel>
                <button
                  type="button"
                  onClick={() => toggleDescription("headProps.customScripts")}
                  className="focus:outline-none"
                >
                  <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                </button>
              </div>
              {visibleDescriptions.has("headProps.customScripts") && (
                <FormDescription className="text-xs">
                  Código HTML/JavaScript personalizado para el head
                </FormDescription>
              )}
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="<!-- Tu código personalizado aquí -->"
                  rows={6}
                  className="font-mono text-sm"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
