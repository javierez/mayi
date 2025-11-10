"use client";

import { useState, useEffect } from "react";
import {
  calculateMegapixels,
  formatDimensions,
  calculateUpscaleOptions,
  formatPrice,
  getUpscaleRecommendation,
  type ImageDimensions,
} from "~/lib/freepik-pricing";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Info } from "lucide-react";

interface ImageInfoIconProps {
  imageUrl: string;
  className?: string;
}

export function ImageInfoIcon({
  imageUrl,
  className = "",
}: ImageInfoIconProps) {
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      const options = calculateUpscaleOptions(dims);
      const rec = getUpscaleRecommendation(dims);
      const megapixels = calculateMegapixels(dims.width, dims.height);

      // Log dimensions and pricing to console (internal use)
      console.log("📐 Image Dimensions Detected:", {
        url: imageUrl.substring(0, 80) + "...",
        dimensions: `${dims.width}×${dims.height}`,
        megapixels: `${megapixels} MP`,
        inputPixels: dims.width * dims.height,
        shortestSide: Math.min(dims.width, dims.height),
        longestSide: Math.max(dims.width, dims.height),
      });

      console.log("💡 Upscale Recommendation:", {
        recommendation: rec.recommendation,
        reason: rec.reason,
        suggestedFactor: rec.suggestedFactor ?? "N/A",
      });

      console.log("💰 Pricing Details (for internal reference):");
      console.table(
        options.map((opt) => ({
          "Upscale Factor": `${opt.factor}x`,
          "Output Size": `${opt.outputWidth}×${opt.outputHeight}`,
          "Output Pixels": opt.outputPixels.toLocaleString(),
          "Output MP": (opt.outputPixels / 1_000_000).toFixed(2),
          Price: formatPrice(opt.price),
        })),
      );

      setDimensions(dims);
      setLoading(false);
    };
    img.onerror = () => {
      console.error("❌ Failed to load image dimensions for:", imageUrl);
      setLoading(false);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  if (loading || !dimensions) {
    return null;
  }

  const megapixels = calculateMegapixels(dimensions.width, dimensions.height);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            className={`rounded-full bg-black/40 p-1.5 text-white transition-all duration-200 hover:bg-black/60 cursor-pointer ${className}`}
            aria-label="Ver información de la imagen"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            <Info className="h-3.5 w-3.5" />
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="left"
          className="max-w-xs border-gray-200 bg-white p-3 text-gray-900 shadow-xl"
        >
          <div className="space-y-2">
            <div>
              <p className="text-xs font-semibold text-gray-900">Dimensiones</p>
              <p className="text-xs text-gray-600">
                {formatDimensions(dimensions.width, dimensions.height)} (
                {megapixels} MP)
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
