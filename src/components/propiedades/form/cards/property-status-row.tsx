"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Card } from "~/components/ui/card";
import { PropertyImagePlaceholder } from "~/components/propiedades/PropertyImagePlaceholder";
import { ImageViewer } from "~/components/ui/image-viewer";
import { getAllPropertyImages } from "~/app/actions/property-images";
import { getProcessStages } from "~/lib/constants/process-stages";
import { cn } from "~/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  Calendar,
  Key,
  FileCheck,
  Globe,
  Share2,
  Upload,
  Radio,
  CheckCircle2
} from "lucide-react";

const scrollbarStyles = `
  .property-status-scrollbar::-webkit-scrollbar {
    height: 4px;
  }

  .property-status-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }

  .property-status-scrollbar::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 100px;
    transition: background 0.3s ease;
  }

  .property-status-scrollbar.scrolling::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground) / 0.2);
  }

  .property-status-scrollbar.scrolling::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--muted-foreground) / 0.3);
  }

  .property-status-scrollbar.scrolling::-webkit-scrollbar-thumb:active {
    background: hsl(var(--muted-foreground) / 0.4);
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .progress-shimmer {
    animation: shimmer 5s infinite;
  }

  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(251, 191, 36, 0.3), 0 0 40px rgba(251, 113, 133, 0.2);
    }
    50% {
      box-shadow: 0 0 30px rgba(251, 191, 36, 0.5), 0 0 60px rgba(251, 113, 133, 0.4);
    }
  }

  .progress-pulse {
    animation: pulse-glow 2s ease-in-out infinite;
  }
`;

export interface PropertyStatusRowProps {
  firstImageUrl?: string | null;
  oportunidadStatus?: string | null;
  propertyType?: string | null;
  propertyId?: number | string | bigint | null;
  createdAt?: Date | null;
  listing?: Record<string, unknown> & {
    hasKeys?: boolean;
    hasCartel?: boolean;
    publishToWebsite?: boolean;
    fotocasa?: boolean;
    idealista?: boolean;
    enEscaparate?: boolean;
    imageCount?: number;
    deal?: Record<string, unknown> | null;
  };
}

export function PropertyStatusRow({
  firstImageUrl,
  oportunidadStatus: _oportunidadStatus,
  propertyType,
  propertyId,
  createdAt,
  listing,
}: PropertyStatusRowProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isInfoTooltipOpen, setIsInfoTooltipOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Extract imageCount and deal from listing prop (now fetched in getListingDetails)
  const imageCount = listing?.imageCount ?? 0;
  const deal = listing?.deal ?? null;

  const handleImageClick = async () => {
    if (!propertyId) return;

    setIsLoadingImages(true);
    try {
      const id =
        typeof propertyId === "string" ? Number(propertyId) : propertyId;
      const images = await getAllPropertyImages(id);
      setPropertyImages(images);
      setIsViewerOpen(true);
    } catch (error) {
      console.error("Error loading property images:", error);
    } finally {
      setIsLoadingImages(false);
    }
  };

  // Handle scroll events to show/hide scrollbar
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsScrolling(true);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 1000);
    };

    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Merge imageCount into listing before using it
  const listingWithImages = listing ? { ...listing, imageCount } : undefined;

  // Get dynamic process stages based on listing completion and deal data
  const processStages = getProcessStages(listingWithImages, deal);

  // Calculate total substages for proportional width (excluding the last one)
  const totalSubstages = processStages.reduce(
    (acc, stage) => acc + stage.subStages.length,
    0,
  );
  const totalSubstagesForBar = totalSubstages - 1; // Exclude last cell from bar rendering

  const completedSubstages = processStages.reduce((acc, stage) => {
    return (
      acc +
      stage.subStages.filter((sub) => sub.status === "accomplished").length
    );
  }, 0);

  const ongoingSubstages = processStages.reduce((acc, stage) => {
    return (
      acc + stage.subStages.filter((sub) => sub.status === "ongoing").length
    );
  }, 0);

  // Progress fills to the middle of the previous cell to current process
  // If there's an ongoing process, fill to the middle of the last completed cell
  // If all are completed or none are completed, fill to the end of completed cells
  const progressPercent =
    ongoingSubstages > 0 && completedSubstages > 0
      ? ((completedSubstages - 0.5) / totalSubstagesForBar) * 100
      : (completedSubstages / totalSubstagesForBar) * 100;

  console.log("📊 Progress Bar Debug:", {
    totalSubstages,
    totalSubstagesForBar,
    completedSubstages,
    ongoingSubstages,
    progressPercent,
    formula:
      ongoingSubstages > 0 && completedSubstages > 0
        ? "completedSubstages - 0.5"
        : "completedSubstages",
  });

  // Format created date for tooltip
  const createdAtText = createdAt
    ? new Date(createdAt).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : undefined;

  // Extract listing status fields
  const hasKeys = listing?.hasKeys ?? false;
  const hasCartel = listing?.hasCartel ?? false;
  const publishedToWebsite = listing?.publishToWebsite ?? false;
  const fotocasaActive = listing?.fotocasa ?? false;
  const idealistaActive = listing?.idealista ?? false;
  const enEscaparate = listing?.enEscaparate ?? false;

  return (
    <TooltipProvider>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div className="col-span-full -mt-2 grid grid-cols-1 gap-3 sm:gap-4 md:-mt-3 lg:grid-cols-4">
        {/* Process Timeline - 75% (3 columns) */}
        <div className="overflow-hidden lg:col-span-3">
          <div
            ref={scrollContainerRef}
            className={cn(
              "property-status-scrollbar overflow-x-auto px-4 pb-3 pt-8 sm:px-6 sm:pb-4 sm:pt-10 md:px-8 md:pb-5 md:pt-12",
              isScrolling && "scrolling",
            )}
          >
            {/* Progress bar with milestone labels */}
            <div className="relative">
              {/* Progress bar */}
              <div className="relative h-10 overflow-hidden rounded-full border border-gray-200/50 bg-gradient-to-br from-gray-100 to-gray-50 shadow-inner">
                {/* Completed section */}
                <div
                  className="progress-pulse absolute left-0 top-0 h-full bg-gradient-to-r from-amber-400 via-amber-500 to-rose-400 transition-all duration-700 ease-out"
                  style={{
                    width: `${progressPercent}%`,
                  }}
                >
                  {/* Shimmer overlay */}
                  {progressPercent > 0 && (
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="progress-shimmer absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    </div>
                  )}
                </div>

                {/* Vertical dividers (excluding last cell) */}
                <div className="absolute inset-0 flex">
                  {processStages.map((stage, stageIndex) => {
                    return stage.subStages.map((substage, subIndex) => {
                      const globalIndex =
                        processStages
                          .slice(0, stageIndex)
                          .reduce((acc, s) => acc + s.subStages.length, 0) +
                        subIndex;
                      const isLastCell = globalIndex === totalSubstages - 1;
                      const isSecondToLast = globalIndex === totalSubstages - 2;

                      // Don't render the last cell
                      if (isLastCell) return null;

                      // Each cell has equal width
                      const cellWidth = 100 / totalSubstagesForBar;

                      return (
                        <div
                          key={substage.id}
                          className="relative"
                          style={{ width: `${cellWidth}%` }}
                        >
                          {/* Don't render divider for the last rendered cell */}
                          {!isSecondToLast && (
                            <div className="absolute right-0 top-1/2 h-[60%] w-[2px] -translate-y-1/2 bg-white" />
                          )}
                        </div>
                      );
                    });
                  })}
                </div>
              </div>

              {/* Milestone labels at dividers */}
              <div className="pointer-events-none absolute inset-0">
                {/* Labels for all substages except the last */}
                <div className="absolute inset-0 flex">
                  {processStages.map((stage, stageIndex) => {
                    return stage.subStages.map((substage, subIndex) => {
                      const globalIndex =
                        processStages
                          .slice(0, stageIndex)
                          .reduce((acc, s) => acc + s.subStages.length, 0) +
                        subIndex;
                      const isFirst = globalIndex === 0;
                      const isLast = globalIndex === totalSubstages - 1;
                      const labelPosition =
                        globalIndex % 2 === 0 ? "above" : "below";

                      const showInfoButton =
                        substage.id === "alta" && !!createdAtText;
                      const infoContent =
                        substage.id === "alta" && createdAtText
                          ? `Creado: ${createdAtText}`
                          : undefined;

                      // Check if this milestone is reached (accounting for partial progress)
                      const isReached =
                        globalIndex < completedSubstages + ongoingSubstages;

                      // Don't render the last label here (will be rendered at the right edge)
                      if (isLast) return null;

                      // Each cell has equal width
                      const cellWidth = 100 / totalSubstagesForBar;

                      return (
                        <div
                          key={substage.id}
                          className="relative"
                          style={{ width: `${cellWidth}%` }}
                        >
                          {/* First label - Alta propiedad at the beginning */}
                          {isFirst && (
                            <div
                              className={cn(
                                "pointer-events-auto absolute left-0 flex items-center gap-1.5 whitespace-nowrap text-[9px] font-semibold uppercase tracking-wider sm:text-[11px]",
                                labelPosition === "above"
                                  ? "bottom-[calc(100%+0.5rem)] sm:bottom-[calc(100%+0.625rem)]"
                                  : "top-[calc(100%+0.5rem)] sm:top-[calc(100%+0.625rem)]",
                                isReached ? "text-gray-800" : "text-gray-400",
                              )}
                            >
                              {substage.label}
                              {showInfoButton && infoContent && (
                                <Tooltip
                                  open={isInfoTooltipOpen}
                                  onOpenChange={setIsInfoTooltipOpen}
                                >
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setIsInfoTooltipOpen(!isInfoTooltipOpen)
                                      }
                                      className={cn(
                                        "inline-flex items-center justify-center rounded-full p-1 transition-all duration-200 hover:scale-110 hover:bg-gray-200",
                                        isReached
                                          ? "text-gray-600 hover:text-gray-900"
                                          : "text-gray-300",
                                      )}
                                      aria-label="Fecha de creación"
                                    >
                                      <Calendar className="h-3.5 w-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-[10px]">{infoContent}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          )}

                          {/* All other labels (except first and last) - at dividers */}
                          {!isFirst && (
                            <div
                              className={cn(
                                "pointer-events-auto absolute left-0 flex items-center gap-1.5 whitespace-nowrap text-[9px] font-semibold uppercase tracking-wider sm:text-[11px]",
                                labelPosition === "above"
                                  ? "bottom-[calc(100%+0.5rem)] sm:bottom-[calc(100%+0.625rem)]"
                                  : "top-[calc(100%+0.5rem)] sm:top-[calc(100%+0.625rem)]",
                                isReached ? "text-gray-800" : "text-gray-400",
                              )}
                              style={{
                                transform: "translateX(-50%)",
                              }}
                            >
                              {substage.label}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })}
                </div>

                {/* Last label (Cierre) at the right edge */}
                {(() => {
                  const lastStage = processStages[processStages.length - 1];
                  const lastSubstage =
                    lastStage?.subStages[lastStage.subStages.length - 1];
                  if (!lastSubstage) return null;

                  const lastGlobalIndex = totalSubstages - 1;
                  const labelPosition =
                    lastGlobalIndex % 2 === 0 ? "above" : "below";
                  const isReached =
                    lastGlobalIndex < completedSubstages + ongoingSubstages;

                  return (
                    <div
                      className={cn(
                        "pointer-events-auto absolute right-0 whitespace-nowrap text-[9px] font-semibold uppercase tracking-wider sm:text-[11px]",
                        labelPosition === "above"
                          ? "bottom-[calc(100%+0.75rem)] sm:bottom-[calc(100%+1rem)]"
                          : "top-[calc(100%+0.75rem)] sm:top-[calc(100%+1rem)]",
                        isReached ? "text-gray-800" : "text-gray-400",
                      )}
                    >
                      {lastSubstage.label}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Icon Row - Status Indicators */}
            <div className="mt-14 flex items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6 md:gap-4 md:px-8">
              {/* Keys */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "rounded-lg p-2.5 transition-all duration-300 sm:p-3",
                      hasKeys
                        ? "bg-white shadow-md hover:shadow-lg"
                        : "bg-white opacity-20 hover:opacity-30",
                    )}
                  >
                    <Key
                      className={cn(
                        "h-4 w-4 transition-all sm:h-5 sm:w-5",
                        hasKeys ? "text-gray-700" : "text-gray-400",
                      )}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-[10px]">
                    {hasKeys ? "Llaves recogidas" : "Sin llaves"}
                  </p>
                </TooltipContent>
              </Tooltip>

              {/* Cartel Generado */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "rounded-lg p-2.5 transition-all duration-300 sm:p-3",
                      hasCartel
                        ? "bg-white shadow-md hover:shadow-lg"
                        : "bg-white opacity-20 hover:opacity-30",
                    )}
                  >
                    <FileCheck
                      className={cn(
                        "h-4 w-4 transition-all sm:h-5 sm:w-5",
                        hasCartel ? "text-gray-700" : "text-gray-400",
                      )}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-[10px]">
                    {hasCartel ? "Cartel generado" : "Sin cartel"}
                  </p>
                </TooltipContent>
              </Tooltip>

              {/* Web */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "rounded-lg p-2.5 transition-all duration-300 sm:p-3",
                      publishedToWebsite
                        ? "bg-white shadow-md hover:shadow-lg"
                        : "bg-white opacity-20 hover:opacity-30",
                    )}
                  >
                    <Globe
                      className={cn(
                        "h-4 w-4 transition-all sm:h-5 sm:w-5",
                        publishedToWebsite ? "text-gray-700" : "text-gray-400",
                      )}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-[10px]">
                    {publishedToWebsite
                      ? "Publicado en web"
                      : "No publicado en web"}
                  </p>
                </TooltipContent>
              </Tooltip>

              {/* Portals Group - Fotocasa & Idealista */}
              <div className="flex gap-1.5 sm:gap-2">
                {/* Fotocasa */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "rounded-lg p-2 transition-all duration-300 sm:p-2.5",
                        fotocasaActive
                          ? "bg-white shadow-md hover:shadow-lg"
                          : "bg-white opacity-20 hover:opacity-30",
                      )}
                    >
                      <Image
                        src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/faviconfoto.png"
                        alt="Fotocasa"
                        width={20}
                        height={20}
                        className={cn(
                          "h-4 w-4 transition-all sm:h-5 sm:w-5",
                          !fotocasaActive && "grayscale",
                        )}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-[10px]">
                      {fotocasaActive
                        ? "Publicado en Fotocasa"
                        : "No publicado en Fotocasa"}
                    </p>
                  </TooltipContent>
                </Tooltip>

                {/* Idealista */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "rounded-lg p-2 transition-all duration-300 sm:p-2.5",
                        idealistaActive
                          ? "bg-white shadow-md hover:shadow-lg"
                          : "bg-white opacity-20 hover:opacity-30",
                      )}
                    >
                      <Image
                        src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/faviconide.png"
                        alt="Idealista"
                        width={20}
                        height={20}
                        className={cn(
                          "h-4 w-4 transition-all sm:h-5 sm:w-5",
                          !idealistaActive && "grayscale",
                        )}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-[10px]">
                      {idealistaActive
                        ? "Publicado en Idealista"
                        : "No publicado en Idealista"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Cartel Colgado */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "rounded-lg p-2.5 transition-all duration-300 sm:p-3",
                      enEscaparate
                        ? "bg-white shadow-md hover:shadow-lg"
                        : "bg-white opacity-20 hover:opacity-30",
                    )}
                  >
                    <CheckCircle2
                      className={cn(
                        "h-4 w-4 transition-all sm:h-5 sm:w-5",
                        enEscaparate ? "text-gray-700" : "text-gray-400",
                      )}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-[10px]">
                    {enEscaparate ? "En escaparate" : "No en escaparate"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Image Preview - 25% (1 column) */}
        <Card className="overflow-hidden border-gray-200/50 lg:col-span-1">
          <div className="relative h-full min-h-[180px] sm:min-h-[200px] md:min-h-[220px]">
            {firstImageUrl ? (
              <div
                className="group relative h-full w-full cursor-pointer"
                onClick={handleImageClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    void handleImageClick();
                  }
                }}
                aria-label="Ver imagen en tamaño completo"
              >
                <Image
                  src={firstImageUrl}
                  alt="Vista previa"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                {isLoadingImages && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
                  </div>
                )}
              </div>
            ) : (
              <PropertyImagePlaceholder
                propertyType={propertyType}
                className="h-full w-full"
              />
            )}
          </div>
        </Card>

        {/* Image Viewer */}
        <ImageViewer
          images={propertyImages}
          initialIndex={0}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          title="Imágenes de la propiedad"
        />
      </div>
    </TooltipProvider>
  );
}
