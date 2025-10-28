"use client";

// import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Image, Video, Glasses } from "lucide-react";

export type MediaType = "images" | "videos" | "virtual-tour";

interface MediaTypeSelectorProps {
  selectedType: MediaType;
  onTypeChange: (type: MediaType) => void;
  className?: string;
}

export function MediaTypeSelector({
  selectedType,
  onTypeChange,
  className,
}: MediaTypeSelectorProps) {
  const mediaTypes = [
    {
      type: "images" as const,
      label: "Imágenes",
      icon: Image,
    },
    {
      type: "videos" as const,
      label: "Vídeos",
      icon: Video,
    },
    {
      type: "virtual-tour" as const,
      label: "Tour Virtual",
      icon: Glasses,
    },
  ];

  return (
    <div className={cn("flex justify-center", className)}>
      <div className="inline-flex items-center gap-1 rounded-full bg-background/60 p-1 shadow-lg backdrop-blur-sm">
        {mediaTypes.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => onTypeChange(type)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-all duration-300 ease-out",
              selectedType === type
                ? "bg-gradient-to-r from-amber-400 to-rose-400 text-white shadow-md hover:from-amber-500 hover:to-rose-500 hover:shadow-lg"
                : "text-gray-600 hover:bg-white/50 hover:text-gray-900 hover:shadow-sm",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
