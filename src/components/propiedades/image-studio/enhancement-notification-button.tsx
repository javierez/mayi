"use client";

import { useState, useEffect } from "react";
import { getUpscaleRecommendation } from "~/lib/freepik-pricing";
import { Bell } from "lucide-react";
import type { PropertyImage } from "~/lib/data";

interface EnhancementNotificationButtonProps {
  images: PropertyImage[];
  onClick: () => void;
  className?: string;
}

export function EnhancementNotificationButton({
  images,
  onClick,
  className = "",
}: EnhancementNotificationButtonProps) {
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const analyzeImages = async () => {
      let count = 0;

      const promises = images.map(async (image) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            const dims = { width: img.naturalWidth, height: img.naturalHeight };
            const rec = getUpscaleRecommendation(dims);

            if (
              rec.recommendation === "highly-recommended" ||
              rec.recommendation === "recommended"
            ) {
              count++;
            }
            resolve();
          };
          img.onerror = () => resolve();
          img.src = image.imageUrl;
        });
      });

      await Promise.all(promises);

      if (mounted) {
        setTotalCount(count);
        setLoading(false);
      }
    };

    void analyzeImages();

    return () => {
      mounted = false;
    };
  }, [images]);

  // Debug logging
  console.log("🔔 Notification Button State:", {
    loading,
    imagesCount: images.length,
    totalCount,
    shouldShow: !loading && images.length > 0,
  });

  // Always show for debugging
  return (
    <button
      type="button"
      className={`relative rounded-full bg-black/40 p-2 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-black/60 ${className}`}
      onClick={onClick}
      aria-label="Ver resumen de mejoras"
    >
      <Bell className="h-5 w-5" />
      {totalCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400 text-[10px] font-bold text-white shadow-md">
          {totalCount}
        </span>
      )}
    </button>
  );
}
