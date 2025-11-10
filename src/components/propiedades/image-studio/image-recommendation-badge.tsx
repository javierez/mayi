"use client";

import { useState, useEffect } from "react";
import {
  getUpscaleRecommendation,
  type ImageDimensions,
  type UpscaleRecommendationResult,
} from "~/lib/freepik-pricing";
import { Sparkles } from "lucide-react";

interface ImageRecommendationBadgeProps {
  imageUrl: string;
  className?: string;
}

export function ImageRecommendationBadge({
  imageUrl,
  className = "",
}: ImageRecommendationBadgeProps) {
  const [recommendation, setRecommendation] =
    useState<UpscaleRecommendationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const dims: ImageDimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
      const rec = getUpscaleRecommendation(dims);
      setRecommendation(rec);
      setLoading(false);
    };
    img.onerror = () => {
      setLoading(false);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  if (loading || !recommendation) {
    return null;
  }

  // Only show for highly-recommended and recommended images
  if (
    recommendation.recommendation !== "highly-recommended" &&
    recommendation.recommendation !== "recommended"
  ) {
    return null;
  }

  const getBadgeStyle = () => {
    return recommendation.recommendation === "highly-recommended"
      ? "bg-gradient-to-r from-amber-400 to-rose-400"
      : "bg-gradient-to-r from-amber-400/80 to-rose-400/80";
  };

  const getBadgeText = () => {
    return recommendation.recommendation === "highly-recommended"
      ? "Mejora recomendada"
      : "Mejora sugerida";
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`rounded-full p-1.5 text-white shadow-md transition-all duration-200 hover:scale-110 hover:shadow-lg cursor-pointer ${getBadgeStyle()} ${className}`}
      title={getBadgeText()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <Sparkles className="h-3.5 w-3.5" />
    </div>
  );
}
