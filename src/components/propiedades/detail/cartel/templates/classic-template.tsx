"use client";

import React, { type FC } from "react";
import Image from "next/image";
import type { ConfigurableTemplateProps } from "~/types/template-data";
import { PropertyQRCode } from "~/components/admin/carteleria/qr-code";
import { getTemplateImages } from "~/lib/carteleria/s3-images";
import { formatLocation, formatPrice } from "~/lib/carteleria/mock-data";
import { cn } from "~/lib/utils";
import { FeaturesGrid } from "~/components/admin/carteleria/templates/classic/features-grid";
import {
  MapPin,
  Calendar,
  Car,
  Home,
  Compass,
  Flame,
  Phone,
  Mail,
  Globe,
  Package,
  Trees,
  Wrench,
  ArrowUp,
  Award,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  PRINT_DIMENSIONS,
  getDimensionsForOrientation,
  getTypographySize,
} from "~/lib/carteleria/classic-vertical-constants";
import { injectPrintStyles } from "~/lib/carteleria/print-utils";
import { getConservationStatusLabel } from "~/lib/constants/conservation-status";

// Helper functions for dynamic styling
const getFontClass = (fontType: string) => {
  const fontMap: Record<string, string> = {
    default: "font-sans",
    serif: "font-serif",
    sans: "font-sans",
    mono: "font-mono",
    elegant: "font-serif",
    modern: "font-sans font-light",
  };
  return fontMap[fontType] ?? "font-sans";
};

const getOverlayClass = (overlayType: string) => {
  const overlayMap: Record<string, string> = {
    default: "bg-gray-400",
    dark: "bg-gray-800",
    light: "bg-gray-200",
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    red: "bg-red-500",
  };
  return overlayMap[overlayType] ?? "bg-gray-400";
};

const getTextColor = (overlayType: string) => {
  // Light overlay needs dark text, others need white text
  return overlayType === "light" ? "text-gray-900" : "text-white";
};

export const ClassicTemplate: FC<ConfigurableTemplateProps> = ({
  data,
  config,
  className,
}) => {
  // Inject print styles for PDF generation
  if (typeof window !== "undefined") {
    injectPrintStyles();
  }

  // Get fixed dimensions for print optimization first
  const containerDimensions = getDimensionsForOrientation(config.orientation);

  // Component-specific print styles
  const printStylesCSS = `
    @media print {
      .template-container {
        width: ${containerDimensions.width}px !important;
        height: ${containerDimensions.height}px !important;
        margin: 0 !important;
        padding: 0 !important;
        page-break-inside: avoid !important;
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      .template-container img {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .template-container .no-break {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
    }
  `;
  // Get dynamic colors based on config
  const modernColors = {
    overlay: getOverlayClass(config.overlayColor),
    qrBackground: "bg-black",
    text: getTextColor(config.overlayColor),
    iconText: getTextColor(config.overlayColor),
    price: getTextColor(config.overlayColor),
    badge: `bg-white/20 ${getTextColor(config.overlayColor)} border-white/30`,
  };
  // This is the ClassicTemplate component - render classic style directly
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = "none";
  };

  // Safe data object with fallbacks for missing properties
  const safeData = {
    ...data,
    propertyType: data.propertyType ?? "propiedad",
    title: data.title ?? "Propiedad en venta",
    location: {
      ...data.location,
      city: data.location?.city ?? "Ciudad",
      neighborhood: data.location?.neighborhood ?? "Zona",
    },
    specs: {
      ...data.specs,
      squareMeters: data.specs?.squareMeters ?? 0,
      bedrooms: data.specs?.bedrooms ?? 0,
      bathrooms: data.specs?.bathrooms ?? 0,
    },
    contact: {
      ...data.contact,
      phone: data.contact?.phone ?? "",
      email: data.contact?.email ?? "",
      website: data.contact?.website ?? "",
    },
    reference: data.reference ?? "",
    price: data.price ?? 0,
  };

  const locationText = formatLocation(data.location);

  // Format location with truncation + line breaks
  const formatLocationWithTruncationAndBreaks = (location: {
    city: string;
    neighborhood: string;
  }) => {
    let city = location.city;
    let neighborhood = location.neighborhood;

    // Step 1: Truncate if total > 30 chars
    const formatLength = neighborhood.length + city.length + 3; // +3 for " ()"

    if (formatLength > 30) {
      // Need to truncate - target is 27 chars of text (30 - 3 for formatting)
      const targetTextLength = 27;

      // Truncate the longer one first
      if (neighborhood.length >= city.length) {
        // Truncate neighborhood first
        if (city.length + 3 < targetTextLength) {
          const availableForNeighborhood = targetTextLength - city.length - 3;
          neighborhood =
            neighborhood.substring(0, availableForNeighborhood) + "...";
        } else {
          // Both need truncating, split available space
          const halfSpace = Math.floor(targetTextLength / 2);
          neighborhood = neighborhood.substring(0, halfSpace - 2) + "...";
          city = city.substring(0, targetTextLength - halfSpace - 1) + "...";
        }
      } else {
        // Truncate city first
        if (neighborhood.length + 3 < targetTextLength) {
          const availableForCity = targetTextLength - neighborhood.length - 3;
          city = city.substring(0, availableForCity) + "...";
        } else {
          // Both need truncating, split available space
          const halfSpace = Math.floor(targetTextLength / 2);
          city = city.substring(0, halfSpace - 2) + "...";
          neighborhood =
            neighborhood.substring(0, targetTextLength - halfSpace - 1) + "...";
        }
      }
    }

    // Step 2: Apply line breaks based on listing type
    const text = `${neighborhood} (${city})`;
    // Character limits matching classic template exactly
    const charLimit = config.listingType === "alquiler" ? 17 : 15;

    if (text.length <= charLimit) {
      return text;
    }

    // Find a good break point (prefer breaking at comma or space)
    let breakPoint = text.lastIndexOf(", ", charLimit);
    if (breakPoint === -1) breakPoint = text.lastIndexOf(" ", charLimit);
    if (breakPoint === -1) breakPoint = charLimit;

    return (
      <>
        <span style={{ lineHeight: "1.3" }}>
          {text.substring(0, breakPoint)}
        </span>
        <br />
        <span style={{ lineHeight: "1.3" }}>
          {text.substring(breakPoint).trim()}
        </span>
      </>
    );
  };

  // Check if location needs line break for overlay height adjustment
  const charLimit = config.listingType === "alquiler" ? 17 : 15;
  const priceText = formatPrice(
    data.price,
    data.propertyType,
    config.listingType,
  );

  // Get images from data prop (passed by the editor) or fallback to default S3 images
  const templateImages =
    data.images && data.images.length > 0
      ? data.images
      : getTemplateImages(config.imageCount);

  // Print-optimized image gallery with fixed positioning
  const renderImages = () => {
    if (templateImages.length === 0) return null;

    const containerDims = getDimensionsForOrientation(config.orientation);
    const gap = 2; // Fixed 2px gap between images
    const overlayWidth = PRINT_DIMENSIONS.OVERLAY.left.width; // Account for left overlay

    if (config.orientation === "vertical") {
      // Vertical layout - treat overlay as part of the grid layout
      const mainHeight = Math.floor(containerDims.height / 2) - gap; // 50% height
      const gridHeight = containerDims.height - mainHeight - gap;

      // Calculate available space considering overlay takes left portion with same gap as between images
      const availableWidth = containerDims.width - overlayWidth - gap; // Width available for images after overlay + gap

      if (config.imageCount === 4) {
        // Now the main image takes the remaining width after overlay + gap
        const mainImageWidth = availableWidth;

        return (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "white",
            }}
          >
            {/* Main image - top 50% */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: `${overlayWidth + gap}px`,
                width: `${mainImageWidth}px`,
                height: `${mainHeight}px`,
                overflow: "hidden",
              }}
            >
              {templateImages[0] && (
                <Image
                  src={templateImages[0]}
                  alt={`${data.title} - Imagen principal`}
                  fill
                  className="object-cover"
                  onError={handleImageError}
                  sizes={`${containerDims.width}px`}
                  style={{
                    objectPosition: data.imagePositions?.[templateImages[0]]
                      ? `${data.imagePositions[templateImages[0]]?.x ?? 50}% ${data.imagePositions[templateImages[0]]?.y ?? 50}%`
                      : "50% 50%",
                  }}
                  priority
                />
              )}
              {renderWatermark("large")}
            </div>

            {/* Supporting images - bottom 50%, 3 columns - full width since overlay doesn't cover this area */}
            {templateImages.slice(1, 4).map((image, index) => {
              const fullWidthSubImageWidth =
                Math.floor(containerDims.width / 3) - (gap * 2) / 3;
              return (
                <div
                  key={index}
                  style={{
                    position: "absolute",
                    top: `${mainHeight + gap}px`,
                    left: `${index * (fullWidthSubImageWidth + gap)}px`,
                    width: `${fullWidthSubImageWidth}px`,
                    height: `${gridHeight}px`,
                    overflow: "hidden",
                  }}
                >
                  {image && (
                    <Image
                      src={image}
                      alt={`${data.title} - Imagen ${index + 2}`}
                      fill
                      className="object-cover"
                      onError={handleImageError}
                      sizes={`${fullWidthSubImageWidth}px`}
                      style={{
                        objectPosition: data.imagePositions?.[image]
                          ? `${data.imagePositions[image]?.x ?? 50}% ${data.imagePositions[image]?.y ?? 50}%`
                          : "50% 50%",
                      }}
                    />
                  )}
                  {renderWatermark("small")}
                </div>
              );
            })}
          </div>
        );
      } else {
        // 3 images vertical: main image on top, 2 supporting below
        const mainImageWidth = availableWidth;

        return (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "white",
            }}
          >
            {/* Main image - top 50% */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: `${overlayWidth + gap}px`,
                width: `${mainImageWidth}px`,
                height: `${mainHeight}px`,
                overflow: "hidden",
              }}
            >
              {templateImages[0] && (
                <Image
                  src={templateImages[0]}
                  alt={`${data.title} - Imagen principal`}
                  fill
                  className="object-cover"
                  onError={handleImageError}
                  sizes={`${containerDims.width}px`}
                  style={{
                    objectPosition: data.imagePositions?.[templateImages[0]]
                      ? `${data.imagePositions[templateImages[0]]?.x ?? 50}% ${data.imagePositions[templateImages[0]]?.y ?? 50}%`
                      : "50% 50%",
                  }}
                  priority
                />
              )}
              {renderWatermark("large")}
            </div>

            {/* Supporting images - bottom 50%, 2 columns - full width since overlay doesn't cover this area */}
            {templateImages.slice(1, 3).map((image, index) => {
              // Make bottom images bigger by using full width with smaller gap
              const fullWidthSubImageWidth = Math.floor(
                (containerDims.width - gap) / 2,
              );
              return (
                <div
                  key={index}
                  style={{
                    position: "absolute",
                    top: `${mainHeight + gap}px`,
                    left: `${index * (fullWidthSubImageWidth + gap)}px`,
                    width: `${fullWidthSubImageWidth}px`,
                    height: `${gridHeight}px`,
                    overflow: "hidden",
                  }}
                >
                  {image && (
                    <Image
                      src={image}
                      alt={`${data.title} - Imagen ${index + 2}`}
                      fill
                      className="object-cover"
                      onError={handleImageError}
                      sizes={`${fullWidthSubImageWidth}px`}
                      style={{
                        objectPosition: data.imagePositions?.[image]
                          ? `${data.imagePositions[image]?.x ?? 50}% ${data.imagePositions[image]?.y ?? 50}%`
                          : "50% 50%",
                      }}
                    />
                  )}
                  {renderWatermark("medium")}
                </div>
              );
            })}
          </div>
        );
      }
    } else {
      // Horizontal layout - main image takes 67% horizontally
      const mainWidth = Math.floor(containerDims.width * 0.67) - gap;
      const gridWidth = containerDims.width - mainWidth - gap;

      return (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "white",
          }}
        >
          {/* Main image - left 67% */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${mainWidth}px`,
              height: `${containerDims.height}px`,
              overflow: "hidden",
            }}
          >
            {templateImages[0] && (
              <Image
                src={templateImages[0]}
                alt={`${data.title} - Imagen principal`}
                fill
                className="object-cover"
                onError={handleImageError}
                sizes={`${mainWidth}px`}
                style={{
                  objectPosition: data.imagePositions?.[templateImages[0]]
                    ? `${data.imagePositions[templateImages[0]]?.x ?? 50}% ${data.imagePositions[templateImages[0]]?.y ?? 50}%`
                    : "50% 50%",
                }}
                priority
              />
            )}
            {renderWatermark("large")}
          </div>

          {/* Supporting images - right 33% */}
          {config.imageCount === 4
            ? // 4 images: show 3 supporting images in a column
              templateImages.slice(1, 4).map((image, index) => {
                const subImageHeight =
                  Math.floor(containerDims.height / 3) - (gap * 2) / 3;
                return (
                  <div
                    key={index}
                    style={{
                      position: "absolute",
                      top: `${index * (subImageHeight + gap)}px`,
                      left: `${mainWidth + gap}px`,
                      width: `${gridWidth}px`,
                      height: `${subImageHeight}px`,
                      overflow: "hidden",
                    }}
                  >
                    {image && (
                      <Image
                        src={image}
                        alt={`${data.title} - Imagen ${index + 2}`}
                        fill
                        className="object-cover"
                        onError={handleImageError}
                        sizes={`${gridWidth}px`}
                        style={{
                          objectPosition: data.imagePositions?.[image]
                            ? `${data.imagePositions[image]?.x ?? 50}% ${data.imagePositions[image]?.y ?? 50}%`
                            : "50% 50%",
                        }}
                      />
                    )}
                    {renderWatermark("small")}
                  </div>
                );
              })
            : // 3 images: show 2 supporting images stacked
              templateImages.slice(1, 3).map((image, index) => {
                const subImageHeight =
                  Math.floor(containerDims.height / 2) - gap / 2;
                return (
                  <div
                    key={index}
                    style={{
                      position: "absolute",
                      top: `${index * (subImageHeight + gap)}px`,
                      left: `${mainWidth + gap}px`,
                      width: `${gridWidth}px`,
                      height: `${subImageHeight}px`,
                      overflow: "hidden",
                    }}
                  >
                    {image && (
                      <Image
                        src={image}
                        alt={`${data.title} - Imagen ${index + 2}`}
                        fill
                        className="object-cover"
                        onError={handleImageError}
                        sizes={`${gridWidth}px`}
                        style={{
                          objectPosition: data.imagePositions?.[image]
                            ? `${data.imagePositions[image]?.x ?? 50}% ${data.imagePositions[image]?.y ?? 50}%`
                            : "50% 50%",
                        }}
                      />
                    )}
                    {renderWatermark("medium")}
                  </div>
                );
              })}
        </div>
      );
    }
  };

  // Helper functions for additional fields
  const getFieldIcon = (fieldValue: string) => {
    const iconMap: Record<string, LucideIcon> = {
      energyConsumptionScale: Award,
      yearBuilt: Calendar,
      hasElevator: ArrowUp,
      hasGarage: Car,
      hasStorageRoom: Package,
      terrace: Trees,
      orientation: Compass,
      heatingType: Flame,
      conservationStatus: Wrench,
    };
    return iconMap[fieldValue] ?? Home;
  };

  const getFieldLabel = (fieldValue: string) => {
    const labelMap: Record<string, string> = {
      energyConsumptionScale: "Certificación",
      yearBuilt: "Año",
      hasElevator: "Ascensor",
      hasGarage: "Garaje",
      hasStorageRoom: "Trastero",
      terrace: "Terraza",
      orientation: "Orientación",
      heatingType: "Calefacción",
      conservationStatus: "Estado",
    };
    return labelMap[fieldValue] ?? fieldValue;
  };

  const getFieldValue = (fieldValue: string): string => {
    const value = (data as unknown as Record<string, unknown>)[fieldValue];

    if (value === undefined || value === null) return "N/A";
    if (typeof value === "boolean") return value ? "Sí" : "No";
    if (fieldValue === "conservationStatus" && typeof value === "number") {
      return getConservationStatusLabel(value);
    }
    if (typeof value === "object" && value !== null) {
      return "N/A"; // Don't stringify objects
    }
    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }
    return "N/A";
  };

  // Generate descriptive text for short description mode
  // Render logo watermark for individual images
  const renderWatermark = (size: "large" | "medium" | "small") => {
    if (!config.showWatermark) return null;

    const sizeMap = {
      large: { width: 400, height: 400 },
      medium: { width: 300, height: 300 },
      small: { width: 200, height: 200 },
    };

    const { width, height } = sizeMap[size];

    return (
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        {data.logoUrl && (
          <Image
            src={data.logoUrl}
            alt="Logo watermark"
            width={width}
            height={height}
            className="object-contain opacity-25"
          />
        )}
      </div>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const generateShortDescription = () => {
    const parts: string[] = [];

    // Start with property type and location
    parts.push(
      `${data.propertyType.charAt(0).toUpperCase() + data.propertyType.slice(1)} en ${data.location.neighborhood}, ${data.location.city}`,
    );

    // Add basic specs
    const specs: string[] = [];
    if (data.specs.bedrooms || data.specs.bathrooms) {
      const roomSpecs: string[] = [];
      if (data.specs.bedrooms) {
        roomSpecs.push(
          data.specs.bedrooms === 1
            ? "una habitación"
            : `${data.specs.bedrooms} habitaciones`,
        );
      }
      if (data.specs.bathrooms) {
        roomSpecs.push(
          data.specs.bathrooms === 1
            ? "un baño"
            : `${data.specs.bathrooms} baños`,
        );
      }
      specs.push(`Cuenta con ${roomSpecs.join(" y ")}`);
    }
    specs.push(`${data.specs.squareMeters} metros cuadrados`);

    if (specs.length > 0) {
      parts.push(specs.join(", "));
    }

    // Add additional features
    const features: string[] = [];
    config.additionalFields.slice(0, 3).forEach((fieldValue) => {
      const value = getFieldValue(fieldValue);
      const label = getFieldLabel(fieldValue);

      if (value !== "N/A") {
        switch (fieldValue) {
          case "hasElevator":
            if (value === "Sí") features.push("Con ascensor");
            break;
          case "hasGarage":
            if (value === "Sí") features.push("Con garaje");
            break;
          case "hasStorageRoom":
            if (value === "Sí") features.push("Con trastero");
            break;
          case "terrace":
            if (value === "Sí") features.push("Con terraza");
            break;
          case "energyConsumptionScale":
            features.push(`Certificación energética ${value}`);
            break;
          case "yearBuilt":
            features.push(`Construido en ${value}`);
            break;
          case "orientation":
            features.push(`Orientación ${value}`);
            break;
          case "heatingType":
            features.push(`Calefacción ${value}`);
            break;
          case "conservationStatus":
            features.push(`Estado ${value.toLowerCase()}`);
            break;
          default:
            features.push(`${label} ${value}`);
        }
      }
    });

    // Join all parts into one continuous text
    let fullText = parts.join(". ");
    if (features.length > 0) {
      fullText += ". " + features.join(". ");
    }
    fullText += ".";

    // Print-optimized character limits for better legibility
    const charLimit = config.listingType === "alquiler" ? 25 : 22;

    // Split text into lines based on fixed character limit for print
    const words = fullText.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (testLine.length <= charLimit) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Single word longer than limit, force add it
          lines.push(word);
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return (
      <>
        {lines.map((line, index) => (
          <span key={index} style={{ lineHeight: "1.4" }}>
            {line}
            {index < lines.length - 1 && <br />}
          </span>
        ))}
      </>
    );
  };

  // Calculate total number of features for layout decisions
  const getTotalFeatures = () => {
    let count = 1; // Always have square meters
    if (data.specs.bathrooms) count++;
    if (data.specs.bedrooms) count++;
    count += Math.min(config.additionalFields.length, 3); // Max 3 additional fields
    return count;
  };

  const totalFeatures = getTotalFeatures();
  const shouldCompactIcons = totalFeatures > 4; // Compact icons when more than 4 features

  // Print-optimized font sizing is now handled by getTypographySize()
  // This replaces the old responsive price font calculation

  const locationNeedsLineBreak = locationText.length > charLimit;

  // Inject component-specific print styles
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      const styleId = "classic-template-print-styles";
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;

      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }

      styleElement.textContent = printStylesCSS;
    }
  }, [printStylesCSS]);

  // New print-optimized template structure
  return (
    <div
      className={cn("template-container no-break", className)}
      style={{
        position: "relative",
        overflow: "hidden",
        width: `${containerDimensions.width}px`,
        height: `${containerDimensions.height}px`,
        backgroundColor: "white",
      }}
      data-testid={`template-configurable-${config.orientation}`}
    >
      {/* Background images layer (z-0) */}
      <div className="absolute inset-0 z-0">{renderImages()}</div>

      {/* Left overlay - print-optimized positioning (z-10) */}
      <div
        className={cn("no-break", modernColors.overlay)}
        style={{
          position: "absolute",
          left: `0px`,
          top: `0px`,
          zIndex: 10,
          width: `${PRINT_DIMENSIONS.OVERLAY.left.width}px`,
          height: `${PRINT_DIMENSIONS.OVERLAY.left.height}px`,
          borderRadius: "0px",
          backdropFilter: "blur(4px)",
        }}
      >
        <div
          style={{
            display: "flex",
            height: "100%",
            flexDirection: "column",
            padding: `${PRINT_DIMENSIONS.SPACING.overlayPadding}px`,
          }}
        >
          {/* Top section with title and content - variable size */}
          <div style={{ flex: 1 }}>
            {/* Title - listing type and property type */}
            <div
              style={{
                marginBottom: `${PRINT_DIMENSIONS.SPACING.titleToLocation}px`,
                marginLeft: `${PRINT_DIMENSIONS.SPACING.titleLeftMargin}px`,
              }}
            >
              <h2
                className={cn(
                  "font-bold uppercase",
                  modernColors.text,
                  getFontClass(config.titleFont),
                )}
                style={{
                  fontSize: `${getTypographySize("title", {
                    isCompact: locationNeedsLineBreak,
                    isRental: config.listingType === "alquiler",
                  })}px`,
                  lineHeight: "1.2",
                  margin: 0,
                }}
              >
                {config.listingType}
              </h2>
              <h3
                className={cn(
                  "font-bold uppercase",
                  modernColors.text,
                  getFontClass(config.titleFont),
                )}
                style={{
                  fontSize: `${getTypographySize("title", {
                    isCompact: locationNeedsLineBreak,
                    isRental: config.listingType === "alquiler",
                  })}px`,
                  lineHeight: "1.2",
                  margin: 0,
                }}
              >
                {safeData.propertyType}
              </h3>
            </div>

            {/* Location and features - right under title */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: `${PRINT_DIMENSIONS.SPACING.locationToIcons}px`,
              }}
            >
              {/* Location */}
              <div
                className={cn(modernColors.text)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  paddingLeft: `${PRINT_DIMENSIONS.SPACING.locationBadgePadding}px`,
                  paddingRight: `${PRINT_DIMENSIONS.SPACING.locationBadgePadding}px`,
                  paddingTop: `${PRINT_DIMENSIONS.SPACING.locationBadgePadding}px`,
                  paddingBottom: `${PRINT_DIMENSIONS.SPACING.locationBadgePadding}px`,
                }}
              >
                <MapPin
                  style={{
                    marginRight: "4px",
                    marginLeft: "-4px",
                    width: `${getTypographySize("location")}px`,
                    height: `${getTypographySize("location")}px`,
                    flexShrink: 0,
                  }}
                />
                <span
                  className="font-medium"
                  style={{
                    fontSize: `${getTypographySize("location")}px`,
                    lineHeight: "1.3",
                    marginLeft: "4px",
                  }}
                >
                  {formatLocationWithTruncationAndBreaks(data.location)}
                </span>
              </div>

              {/* Features display - icons, bullets, or text */}
              {config.showShortDescription ? (
                <div
                  className={cn(getFontClass(config.descriptionFont))}
                  style={{
                    marginTop: `${PRINT_DIMENSIONS.SPACING.featuresTopMargin + config.descriptionPositionY}px`,
                    marginLeft: `${PRINT_DIMENSIONS.SPACING.iconsLeftMargin + config.descriptionPositionX}px`,
                    fontSize: `${config.descriptionSize}px`,
                    lineHeight: "1.5",
                    textAlign: config.descriptionAlignment,
                    color: config.descriptionColor,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {data.shortDescription ?? ""}
                </div>
              ) : (
                <FeaturesGrid
                  data={data}
                  config={config}
                  modernColors={modernColors}
                  getFieldIcon={getFieldIcon}
                  getFieldValue={getFieldValue}
                  getFieldLabel={getFieldLabel}
                  shouldCompact={shouldCompactIcons}
                  getFontClass={getFontClass}
                />
              )}
            </div>
          </div>

          {/* Bottom section with price - always shown */}
          <div
            style={{
              marginTop:
                totalFeatures > 4
                  ? `${PRINT_DIMENSIONS.SPACING.iconsToPrice * 2}px`
                  : `${PRINT_DIMENSIONS.SPACING.iconsToPrice}px`,
              textAlign: "center",
            }}
          >
            <div
              className={cn(
                "font-bold",
                modernColors.price,
                getFontClass(config.priceFont),
              )}
              style={{
                fontSize: `${getTypographySize("price", {
                  isRental: config.listingType === "alquiler",
                  priceDigits: data.price.toString().length,
                })}px`,
                lineHeight: "1.2",
              }}
            >
              {config.listingType === "alquiler" ? (
                <>
                  {priceText.replace(" €/mes", "")}
                  <span
                    className="font-normal"
                    style={{
                      fontSize: `${getTypographySize("body")}px`,
                    }}
                  >
                    {" "}
                    €/mes
                  </span>
                </>
              ) : (
                priceText
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom right contact overlay - print-optimized (z-10) */}
      {((config.showPhone ?? false) ||
        ((config.showEmail ?? false) && (data.contact.email ?? false)) ||
        ((config.showWebsite ?? false) && (data.contact.website ?? false))) && (
        <div
          className={cn("no-break", modernColors.overlay)}
          style={{
            position: "absolute",
            bottom: `${PRINT_DIMENSIONS.OVERLAY.contact.position.bottom}px`,
            right: `${PRINT_DIMENSIONS.OVERLAY.contact.position.right}px`,
            zIndex: 10,
            borderRadius: "6px",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              paddingLeft: `${PRINT_DIMENSIONS.SPACING.contactOverlayPadding}px`,
              paddingRight: `${PRINT_DIMENSIONS.SPACING.contactOverlayPadding}px`,
              paddingTop: `${PRINT_DIMENSIONS.SPACING.contactOverlayPadding}px`,
              paddingBottom: `${PRINT_DIMENSIONS.SPACING.contactOverlayPadding}px`,
            }}
          >
            {/* Contact info with icons */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: `${PRINT_DIMENSIONS.SPACING.contactItemsGap}px`,
              }}
            >
              {config.showPhone && (
                <div
                  className={cn(modernColors.text)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Phone
                    style={{
                      width: `${PRINT_DIMENSIONS.ICONS.tiny.width}px`,
                      height: `${PRINT_DIMENSIONS.ICONS.tiny.height}px`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: `${getTypographySize("contact")}px`,
                      lineHeight: "1.2",
                    }}
                  >
                    {data.contact.phone}
                  </span>
                </div>
              )}
              {config.showEmail && data.contact.email && (
                <div
                  className={cn(modernColors.text)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Mail
                    style={{
                      width: `${PRINT_DIMENSIONS.ICONS.tiny.width}px`,
                      height: `${PRINT_DIMENSIONS.ICONS.tiny.height}px`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: `${getTypographySize("contact")}px`,
                      lineHeight: "1.2",
                    }}
                  >
                    {data.contact.email}
                  </span>
                </div>
              )}
              {config.showWebsite && data.contact.website && (
                <div
                  className={cn(modernColors.text)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Globe
                    style={{
                      width: `${PRINT_DIMENSIONS.ICONS.tiny.width}px`,
                      height: `${PRINT_DIMENSIONS.ICONS.tiny.height}px`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: `${getTypographySize("contact")}px`,
                      lineHeight: "1.2",
                    }}
                  >
                    {data.contact.website.replace(/^https?:\/\/(www\.)?/, "")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Property reference - print-optimized positioning (z-20) */}
      {config.showReference && data.reference && (
        <div
          style={{
            position: "absolute",
            bottom: `${PRINT_DIMENSIONS.OVERLAY.reference.position.bottom}px`,
            left: `${PRINT_DIMENSIONS.OVERLAY.reference.position.left}px`,
            zIndex: 20,
          }}
        >
          <span
            className={cn("font-medium uppercase text-white")}
            style={{
              fontSize: `${getTypographySize("reference")}px`,
              letterSpacing: "0.05em",
              lineHeight: "1.1",
            }}
          >
            {data.reference}
          </span>
        </div>
      )}

      {/* QR Code - print-optimized positioning (z-20) */}
      {config.showQR && (
        <div
          style={{
            position: "absolute",
            right: `${PRINT_DIMENSIONS.OVERLAY.qr.position.right}px`,
            top: `${PRINT_DIMENSIONS.OVERLAY.qr.position.top}px`,
            zIndex: 20,
          }}
        >
          <PropertyQRCode
            phone={data.contact.phone}
            email={data.contact.email}
            size={config.orientation === "vertical" ? 80 : 100}
            className="border-0 bg-transparent p-0 shadow-none"
          />
        </div>
      )}
    </div>
  );
};
