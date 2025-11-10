"use client";

import { useState, useEffect } from "react";
import { getUpscaleRecommendation } from "~/lib/freepik-pricing";
import type { PropertyImage } from "~/lib/data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface EnhancementSummaryProps {
  images: PropertyImage[];
  isOpen: boolean;
  onClose: () => void;
}

export function EnhancementSummary({
  images,
  isOpen,
  onClose,
}: EnhancementSummaryProps) {
  const [recommendationCounts, setRecommendationCounts] = useState({
    highlyRecommended: 0,
    recommended: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const analyzeImages = async () => {
      let highlyRecommended = 0;
      let recommended = 0;

      const promises = images.map(async (image) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            const dims = { width: img.naturalWidth, height: img.naturalHeight };
            const rec = getUpscaleRecommendation(dims);

            if (rec.recommendation === "highly-recommended") {
              highlyRecommended++;
            } else if (rec.recommendation === "recommended") {
              recommended++;
            }
            resolve();
          };
          img.onerror = () => resolve();
          img.src = image.imageUrl;
        });
      });

      await Promise.all(promises);

      if (mounted) {
        setRecommendationCounts({
          highlyRecommended,
          recommended,
          total: highlyRecommended + recommended,
        });
        setLoading(false);
      }
    };

    void analyzeImages();

    return () => {
      mounted = false;
    };
  }, [images]);

  // Don't render if there are no recommendations (but still show loading state in modal)
  if (!loading && recommendationCounts.total === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Resumen de imágenes</DialogTitle>
          <DialogDescription>
            Análisis de calidad para esta propiedad
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            {/* Subtle pulsing dots */}
            <div className="mb-6 flex space-x-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-gray-300" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 animate-pulse rounded-full bg-gray-300" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 animate-pulse rounded-full bg-gray-300" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-xs text-muted-foreground">
              Analizando calidad de imágenes
            </p>
          </div>
        ) : (
          <div className="py-8">
            {/* Main Content */}
            <div className="text-center space-y-8">
              {/* Total Images - Primary */}
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Total Images
                </p>
                <p className="text-6xl font-bold tracking-tight text-gray-900">
                  {images.length}
                </p>
              </div>

              {/* Can be improved - Secondary Card */}
              <div className="flex justify-center">
                <div className="inline-block rounded-lg bg-white px-4 py-3 shadow-md">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">
                      can be improved with AI
                    </p>
                    <p className="text-2xl font-semibold tracking-tight text-gray-900">
                      {recommendationCounts.total}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
