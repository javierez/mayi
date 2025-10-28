import React, { useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { PropertyImage } from "~/lib/data";

interface CartelImageSelectorProps {
  images: PropertyImage[];
  title: string;
  maxSelection: 3 | 4;
  selectedImages: string[];
  onSelectionChange: (selectedImages: string[]) => void;
}

export function CartelImageSelector({
  images,
  title,
  maxSelection,
  selectedImages,
  onSelectionChange,
}: CartelImageSelectorProps) {
  // Use the same placeholder image as image-studio-gallery
  const defaultPlaceholder = "";

  // State for managing image sources with fallbacks
  const [imageSources, setImageSources] = useState<Record<string, string>>(
    () => {
      const sources: Record<string, string> = {};
      images.forEach((image) => {
        const key = image.propertyImageId.toString();
        sources[key] = image.imageUrl ?? defaultPlaceholder;
      });
      return sources;
    },
  );

  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});

  const handleImageError = (imageId: string) => {
    setImageSources((prev) => ({
      ...prev,
      [imageId]: defaultPlaceholder,
    }));
  };

  const handleImageLoad = (imageId: string) => {
    setImageLoaded((prev) => ({
      ...prev,
      [imageId]: true,
    }));
  };

  const handleImageToggle = (imageUrl: string) => {
    const isSelected = selectedImages.includes(imageUrl);

    if (isSelected) {
      // Remove from selection
      const newSelection = selectedImages.filter((url) => url !== imageUrl);
      onSelectionChange(newSelection);
    } else {
      // Add to selection if under limit
      if (selectedImages.length < maxSelection) {
        const newSelection = [...selectedImages, imageUrl];
        onSelectionChange(newSelection);
      }
    }
  };

  const handleSelectAll = () => {
    if (images.length <= maxSelection) {
      const allUrls = images.map((img) => img.imageUrl).filter(Boolean);
      onSelectionChange(allUrls);
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  if (images.length === 0) {
    return (
      <div className="space-y-4">
        <div className="aspect-[16/9] w-full rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
          <div className="mx-auto max-w-sm">
            <svg
              className="mx-auto h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay imágenes disponibles
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Esta propiedad no tiene imágenes para seleccionar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with selection info and controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {selectedImages.length} de {maxSelection} seleccionadas
        </div>
        <div className="flex gap-2">
          {images.length <= maxSelection && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={selectedImages.length === images.length}
            >
              Todas
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={selectedImages.length === 0}
          >
            Limpiar
          </Button>
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 gap-3">
        {images.map((image, index) => {
          const imageId = image.propertyImageId.toString();
          const imageUrl = image.imageUrl;
          const isSelected = imageUrl
            ? selectedImages.includes(imageUrl)
            : false;
          const isSelectable =
            selectedImages.length < maxSelection || isSelected;

          return (
            <button
              key={imageId}
              className={cn(
                "group relative h-24 w-full overflow-hidden rounded-lg border-2 transition-all duration-200",
                isSelected
                  ? "scale-105 border-amber-400 shadow-lg ring-2 ring-amber-400/50"
                  : isSelectable
                    ? "hover:scale-102 border-gray-200 hover:border-gray-300"
                    : "cursor-not-allowed border-gray-200 opacity-50",
                !isSelectable && "pointer-events-none",
              )}
              onClick={() => imageUrl && handleImageToggle(imageUrl)}
              disabled={!isSelectable && !isSelected}
              aria-label={`${isSelected ? "Deseleccionar" : "Seleccionar"} imagen ${index + 1}`}
            >
              <Image
                src={imageSources[imageId] ?? defaultPlaceholder}
                alt={`${title} - Imagen ${index + 1}`}
                fill
                className={cn(
                  "object-cover transition-all duration-200",
                  imageSources[imageId] === defaultPlaceholder && "grayscale",
                  !image.isActive && "opacity-70",
                  isSelected && "brightness-110",
                )}
                loading="lazy"
                onError={() => handleImageError(imageId)}
                onLoad={() => handleImageLoad(imageId)}
              />

              {/* Loading state */}
              {!imageLoaded[imageId] && (
                <div className="absolute inset-0 animate-pulse bg-gray-200" />
              )}

              {/* Selection overlay */}
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-rose-400/20" />
              )}

              {/* Selection indicator */}
              <div
                className={cn(
                  "absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-200",
                  isSelected
                    ? "scale-110 border-amber-400 bg-amber-400 text-white"
                    : "border-gray-300 bg-white/80 text-gray-400 group-hover:border-gray-400",
                )}
              >
                {isSelected ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-gray-300 group-hover:bg-gray-400" />
                )}
              </div>

              {/* Image number */}
              <div className="absolute left-2 top-2 rounded bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {index + 1}
              </div>

              {/* Selection order for selected images */}
              {isSelected && (
                <div className="absolute bottom-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-white">
                  {selectedImages.indexOf(imageUrl) + 1}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selection limit warning */}
      {selectedImages.length >= maxSelection && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-600">
          Has alcanzado el límite de {maxSelection} imágenes. Deselecciona una
          imagen para cambiar la selección.
        </div>
      )}
    </div>
  );
}
