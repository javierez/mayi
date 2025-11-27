"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

interface ColorPickerPopoverProps {
  value: string;
  onChange: (color: string) => void;
  accountColorPalette?: string[];
  label?: string;
  className?: string;
}

export function ColorPickerPopover({
  value,
  onChange,
  accountColorPalette = [],
  label,
  className,
}: ColorPickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Ensure hex value is properly formatted
  const normalizedValue = value.startsWith("#") ? value : `#${value}`;

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let hex = e.target.value;
    // Add # if missing
    if (!hex.startsWith("#")) {
      hex = `#${hex}`;
    }
    // Only update if it's a valid hex color (3, 4, 6, or 8 chars after #)
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(hex)) {
      onChange(hex);
    } else if (hex.length <= 7) {
      // Allow partial input while typing
      onChange(hex);
    }
  };

  return (
    <div className={cn("space-y-1", className)}>
      {label && <Label className="text-sm text-gray-600">{label}</Label>}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div
              className="h-5 w-5 rounded border border-gray-300"
              style={{ backgroundColor: normalizedValue }}
            />
            <span className="font-mono text-xs text-muted-foreground">
              {normalizedValue.toUpperCase()}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="space-y-3">
            {/* Color Picker */}
            <HexColorPicker color={normalizedValue} onChange={onChange} />

            {/* Hex Input */}
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 shrink-0 rounded border border-gray-300"
                style={{ backgroundColor: normalizedValue }}
              />
              <Input
                type="text"
                value={normalizedValue}
                onChange={handleHexInputChange}
                className="h-8 font-mono text-xs"
                placeholder="#000000"
                maxLength={7}
              />
            </div>

            {/* Corporate Color Presets */}
            {accountColorPalette.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Colores corporativos
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {accountColorPalette.map((color, index) => (
                    <button
                      key={`${color}-${index}`}
                      type="button"
                      className={cn(
                        "h-6 w-6 rounded border-2 transition-all hover:scale-110",
                        normalizedValue.toLowerCase() === color.toLowerCase()
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-300 hover:border-gray-400"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        onChange(color);
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Common Colors Quick Pick */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Colores comunes
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "#ffffff",
                  "#000000",
                  "#6b7280",
                  "#ef4444",
                  "#f97316",
                  "#eab308",
                  "#22c55e",
                  "#3b82f6",
                  "#8b5cf6",
                  "#ec4899",
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "h-6 w-6 rounded border-2 transition-all hover:scale-110",
                      normalizedValue.toLowerCase() === color.toLowerCase()
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : color === "#ffffff"
                          ? "border-gray-300"
                          : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      onChange(color);
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
