"use client";

import React, { type FC } from "react";
import Image from "next/image";
import type { ConfigurableTemplateProps } from "~/types/template-data";
import { PropertyQRCode } from "~/components/admin/carteleria/qr-code";
import { getTemplateImages } from "~/lib/carteleria/s3-images";
import { formatLocation, formatPrice } from "~/lib/carteleria/mock-data";
import { cn } from "~/lib/utils";
import {
  Bed,
  Bath,
  Maximize,
  Hammer,
  Car,
  Home,
  Compass,
  Flame,
  Package,
  Fence,
  BadgeCheck,
  ArrowUpDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  getDimensionsForOrientation,
  getTypographySize,
} from "~/lib/carteleria/classic-vertical-constants";
import { injectPrintStyles } from "~/lib/carteleria/print-utils";
import { MiniEnergyCertificate } from "../mini-energy-certificate";
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

// Helper function to check if a color is a hex value
const isHexColor = (color: string): boolean => {
  return /^#([0-9A-F]{3}){1,2}$/i.test(color);
};

// Helper function to calculate luminance of a hex color
const getColorLuminance = (hex: string): number => {
  // Remove # if present
  const color = hex.replace("#", "");

  // Convert to RGB
  const r = parseInt(color.substring(0, 2), 16) / 255;
  const g = parseInt(color.substring(2, 4), 16) / 255;
  const b = parseInt(color.substring(4, 6), 16) / 255;

  // Calculate relative luminance
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance;
};

const getOverlayClass = (overlayType: string) => {
  // If it's a hex color, return empty string (will be handled via inline styles)
  if (isHexColor(overlayType)) {
    return "";
  }

  const overlayMap: Record<string, string> = {
    default: "bg-gray-400",
    dark: "bg-gray-800",
    light: "bg-gray-200",
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    red: "bg-red-500",
    white: "bg-white",
    black: "bg-black",
    gray: "bg-gray-500",
  };
  return overlayMap[overlayType] ?? "";
};

const getTextColorForOverlay = (overlayType: string) => {
  // Handle hex colors with luminance calculation
  if (isHexColor(overlayType)) {
    const luminance = getColorLuminance(overlayType);
    // Use white text for dark backgrounds, dark text for light backgrounds
    return luminance > 0.5 ? "#1e293b" : "white";
  }

  // Light overlay needs dark text, others need white text
  return overlayType === "light" || overlayType === "white"
    ? "#1e293b"
    : "white";
};

// Helper functions for additional fields
const getFieldIcon = (fieldValue: string) => {
  const iconMap: Record<string, LucideIcon> = {
    yearBuilt: Hammer,
    hasElevator: ArrowUpDown,
    hasGarage: Car,
    hasStorageRoom: Package,
    terrace: Fence,
    orientation: Compass,
    heatingType: Flame,
    conservationStatus: BadgeCheck,
  };
  return iconMap[fieldValue] ?? Home;
};

const getFieldLabel = (fieldValue: string) => {
  const labelMap: Record<string, string> = {
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

const getFieldValue = (
  fieldValue: string,
  data: ConfigurableTemplateProps["data"],
): string => {
  const value = (data as unknown as Record<string, unknown>)[fieldValue] as
    | string
    | number
    | boolean
    | undefined
    | null;

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

export const BasicTemplate: FC<ConfigurableTemplateProps> = ({
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
  const overlayClass = getOverlayClass(config.overlayColor);
  const textColor = getTextColorForOverlay(config.overlayColor);

  // Component-specific print styles for wireframe layout
  const printStylesCSS = `
    @media print {
      .basic-template-container {
        width: ${containerDimensions.width}px !important;
        height: ${containerDimensions.height}px !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        page-break-inside: avoid !important;
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .basic-template-container * {
        box-sizing: border-box !important;
      }
      
      .basic-template-container img {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .basic-template-container .no-break {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
    }
  `;

  // This is the BasicTemplate component - render WIREFRAME style layout
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

  // Wireframe-based responsive image gallery
  const renderImageGallery = () => {
    if (templateImages.length === 0) return null;

    const imageCount = Math.min(templateImages.length, config.imageCount);

    // Base styles for all image containers
    const imageContainerStyle: React.CSSProperties = {
      overflow: "hidden",
      backgroundColor: "#f3f4f6",
      position: "relative",
    };

    if (imageCount === 1) {
      // 1 Photo: Fill entire gallery space
      return (
        <div style={imageContainerStyle}>
          {templateImages[0] && (
            <Image
              src={templateImages[0]}
              alt={`${data.title} - Imagen principal`}
              fill
              className="object-cover"
              onError={handleImageError}
              style={{
                objectPosition: data.imagePositions?.[templateImages[0]]
                  ? `${Math.max(0, Math.min(100, data.imagePositions[templateImages[0]]?.x ?? 50))}% ${Math.max(0, Math.min(100, data.imagePositions[templateImages[0]]?.y ?? 50))}%`
                  : "50% 50%",
              }}
              priority
            />
          )}
          {renderWatermark("large")}
          {config.showReference && renderReferenceOverlay(true)}{" "}
          {/* Single image gets reference */}
        </div>
      );
    }

    if (imageCount === 2) {
      // 2 Photos: Layout based on config.twoImageLayout
      const isVertical = config.twoImageLayout === "vertical";
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isVertical ? "1fr 1fr" : "1fr",
            gridTemplateRows: isVertical ? "1fr" : "1fr 1fr",
            gap: "12px",
            width: "100%",
            height: "100%",
          }}
        >
          {templateImages.slice(0, 2).map((image, index) => (
            <div key={index} style={imageContainerStyle}>
              {image && (
                <Image
                  src={image}
                  alt={`${data.title} - Imagen ${index + 1}`}
                  fill
                  className="object-cover"
                  onError={handleImageError}
                  style={{
                    objectPosition: data.imagePositions?.[image]
                      ? `${Math.max(0, Math.min(100, data.imagePositions[image]?.x ?? 50))}% ${Math.max(0, Math.min(100, data.imagePositions[image]?.y ?? 50))}%`
                      : "50% 50%",
                    transform: `scale(${data.imagePositions?.[image]?.zoom ?? 1.0})`,
                    transformOrigin: "center",
                  }}
                />
              )}
              {renderWatermark("medium")}
              {config.showReference && renderReferenceOverlay(index === 1)}{" "}
              {/* Second image gets reference in both layouts */}
            </div>
          ))}
        </div>
      );
    }

    if (imageCount === 3) {
      // 3 Photos: Hero + two below
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "2fr 1fr",
            gap: "12px",
            width: "100%",
            height: "100%",
          }}
        >
          {/* Hero image spans 2 columns */}
          <div style={{ ...imageContainerStyle, gridColumn: "1 / -1" }}>
            {templateImages[0] && (
              <Image
                src={templateImages[0]}
                alt={`${data.title} - Imagen principal`}
                fill
                className="object-cover"
                onError={handleImageError}
                style={{
                  objectPosition: data.imagePositions?.[templateImages[0]]
                    ? `${Math.max(0, Math.min(100, data.imagePositions[templateImages[0]]?.x ?? 50))}% ${Math.max(0, Math.min(100, data.imagePositions[templateImages[0]]?.y ?? 50))}%`
                    : "50% 50%",
                  transform: `scale(${data.imagePositions?.[templateImages[0]]?.zoom ?? 1.0})`,
                  transformOrigin: "center",
                }}
                priority
              />
            )}
            {renderWatermark("large")}
          </div>

          {/* Two smaller images below */}
          {templateImages.slice(1, 3).map((image, index) => (
            <div key={index + 1} style={imageContainerStyle}>
              {image && (
                <Image
                  src={image}
                  alt={`${data.title} - Imagen ${index + 2}`}
                  fill
                  className="object-cover"
                  onError={handleImageError}
                  style={{
                    objectPosition: data.imagePositions?.[image]
                      ? `${Math.max(0, Math.min(100, data.imagePositions[image]?.x ?? 50))}% ${Math.max(0, Math.min(100, data.imagePositions[image]?.y ?? 50))}%`
                      : "50% 50%",
                    transform: `scale(${data.imagePositions?.[image]?.zoom ?? 1.0})`,
                    transformOrigin: "center",
                  }}
                />
              )}
              {renderWatermark("small")}
              {config.showReference && renderReferenceOverlay(index === 1)}{" "}
              {/* Bottom right image (index 1 of the two below) */}
            </div>
          ))}
        </div>
      );
    }

    // 4 Photos: 2x2 uniform grid
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: "12px",
          width: "100%",
          height: "100%",
        }}
      >
        {templateImages.slice(0, 4).map((image, index) => (
          <div key={index} style={imageContainerStyle}>
            {image && (
              <Image
                src={image}
                alt={`${data.title} - Imagen ${index + 1}`}
                fill
                className="object-cover"
                onError={handleImageError}
                style={{
                  objectPosition: data.imagePositions?.[image]
                    ? `${Math.max(0, Math.min(100, data.imagePositions[image]?.x ?? 50))}% ${Math.max(0, Math.min(100, data.imagePositions[image]?.y ?? 50))}%`
                    : "50% 50%",
                  transform: `scale(${data.imagePositions?.[image]?.zoom ?? 1.0})`,
                  transformOrigin: "center",
                }}
                priority={index === 0}
              />
            )}
            {renderWatermark("medium")}
            {config.showReference && renderReferenceOverlay(index === 3)}{" "}
            {/* Bottom right image (index 3) */}
          </div>
        ))}
      </div>
    );
  };

  // Render logo watermark for individual images
  const renderWatermark = (size: "large" | "medium" | "small") => {
    if (!config.showWatermark) return null;

    const sizeMap = {
      large: { width: 300, height: 300 },
      medium: { width: 200, height: 200 },
      small: { width: 150, height: 150 },
    };

    const { width, height } = sizeMap[size];

    return (
      <div
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        style={{
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        {data.logoUrl && (
          <Image
            src={data.logoUrl}
            alt="Logo watermark"
            width={width}
            height={height}
            className="object-contain opacity-25"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        )}
      </div>
    );
  };

  // Render reference text overlay for bottom right image
  const renderReferenceOverlay = (isBottomRight: boolean) => {
    if (!isBottomRight || !data.reference) return null;

    return (
      <div
        className="pointer-events-none absolute bottom-2 right-2 z-20"
        style={{
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <span
          className="font-mono font-medium"
          style={{
            fontSize: "12px",
            color: config.referenceTextColor || "#000000",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: "2px 6px",
            borderRadius: "2px",
            letterSpacing: "0.5px",
          }}
        >
          {data.reference}
        </span>
      </div>
    );
  };

  // Inject component-specific print styles
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      const styleId = "basic-template-print-styles";
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;

      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }

      styleElement.textContent = printStylesCSS;
    }
  }, [printStylesCSS]);

  // Calculate section heights to fit within A4 bounds - flexible approach
  // Base heights that can adapt to content
  const headerHeight = Math.max(
    120,
    config.showShortDescription && data.shortDescription ? 140 : 120,
  );
  const descriptionHeight =
    config.showShortDescription && data.shortDescription
      ? Math.max(30, 35)
      : 35; // Always reserve space for consistent image positioning
  const statsHeight = config.showIcons ? 80 : 180; // When icons disabled or description shown, stats section takes both stats + bottom strip space
  const bottomStripHeight = config.showIcons ? 100 : 0; // Only show bottom strip when icons are enabled
  const footerHeight = 45; // Contact bar - keep fixed

  // Calculate remaining space for gallery with significantly reduced height for bigger icons/price
  const totalFixedHeight =
    headerHeight +
    descriptionHeight +
    statsHeight +
    bottomStripHeight +
    footerHeight;
  const calculatedGalleryHeight = containerDimensions.height - totalFixedHeight;
  const galleryHeight = Math.max(calculatedGalleryHeight - 80, 140); // Much more reduced, minimum 140px

  // Wireframe-structured layout
  return (
    <div
      className={cn("basic-template-container no-break", className)}
      style={{
        position: "relative",
        overflow: "hidden",
        width: `${containerDimensions.width}px`,
        height: `${containerDimensions.height}px`,
        backgroundColor: "white",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        margin: 0,
        padding: 0,
      }}
      data-testid={`template-wireframe-${config.orientation}`}
    >
      {/* 1. HEADER BAR - Title left, Reference right */}
      <div
        className={overlayClass}
        style={{
          height: `${headerHeight}px`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingLeft: "20px",
          paddingRight: "20px",
          borderBottom: overlayClass ? "none" : "2px solid #e2e8f0",
          flexShrink: 0,
          boxSizing: "border-box",
          backgroundColor: isHexColor(config.overlayColor)
            ? config.overlayColor
            : overlayClass
              ? undefined
              : "#f8fafc",
        }}
      >
        <div>
          <h2
            className={cn(
              "font-bold uppercase",
              getFontClass(config.titleFont),
            )}
            style={{
              fontSize: `${config.titleSize || getTypographySize("title")}px`,
              lineHeight: "1.1",
              margin: 0,
              marginBottom: "6px",
              color: config.titleColor || textColor,
              textAlign: config.titleAlignment || "left",
              transform:
                config.titlePositionX || config.titlePositionY
                  ? `translate(${config.titlePositionX || 0}px, ${config.titlePositionY || 0}px)`
                  : undefined,
            }}
          >
            {safeData.title}
          </h2>
          <div
            className={cn("font-medium", getFontClass(config.locationFont))}
            style={{
              fontSize: `${config.locationSize || getTypographySize("body")}px`,
              lineHeight: "1.2",
              margin: 0,
              color: config.locationColor || "#64748b",
              opacity: 0.9,
              textAlign: config.locationAlignment || "left",
              transform:
                config.locationPositionX || config.locationPositionY
                  ? `translate(${config.locationPositionX || 0}px, ${config.locationPositionY || 0}px)`
                  : undefined,
            }}
          >
            {formatLocation(safeData.location)}
          </div>
        </div>

        {/* Right side - QR Code and Energy Certificate (for vertical layout with descripción/lista) */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
          {/* Energy Certificate - Show in header for vertical layout when descripción or lista is selected */}
          {config.orientation === "vertical" &&
            config.showEnergyRating &&
            config.energyConsumptionScale &&
            (config.showShortDescription ||
              (!config.showIcons && !config.showShortDescription)) && (
              <div
                style={{
                  transform: "scale(1.3)",
                  transformOrigin: "center",
                  marginRight: "16px",
                }}
              >
                <MiniEnergyCertificate
                  energyRating={config.energyConsumptionScale}
                />
              </div>
            )}

          {/* QR Code - Top Right */}
          {config.showQR && (
            <PropertyQRCode
              phone={data.contact.phone}
              email={data.contact.email}
              url={
                data.contact.website && data.id
                  ? `${data.contact.website.endsWith("/") ? data.contact.website.slice(0, -1) : data.contact.website}/propiedades/${data.id}`
                  : undefined
              }
              size={
                config.orientation === "vertical" &&
                config.showEnergyRating &&
                config.energyConsumptionScale &&
                (config.showShortDescription ||
                  (!config.showIcons && !config.showShortDescription))
                  ? 104
                  : 80
              }
              className="border-0 bg-transparent p-0 shadow-none"
            />
          )}
        </div>
      </div>

      {/* 2. RESERVED SPACE - Always maintain space for consistent image positioning */}
      <div
        style={{
          height: `30px`,
          display: "flex",
          alignItems: "center",
          paddingLeft: "20px",
          paddingRight: "20px",
          backgroundColor: "#ffffff",
          flexShrink: 0,
          boxSizing: "border-box",
        }}
      >
        {/* This space is reserved to maintain consistent image positioning */}
      </div>

      {/* 3. IMAGE GALLERY - Centerpiece */}
      <div
        style={{
          minHeight: `${galleryHeight}px`,
          paddingLeft: "20px",
          paddingRight: "20px",
          paddingTop: "0px",
          paddingBottom: "20px",
          backgroundColor: "#ffffff",
          flexGrow: 1,
          flexShrink: 1,
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {renderImageGallery()}
      </div>

      {/* 4. STATS ROW - Icons, Bullets, or Description */}
      <div
        style={{
          height: `${statsHeight}px`,
          display: "flex",
          paddingLeft: "20px",
          paddingRight: "20px",
          backgroundColor: "#f8fafc",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          flexShrink: 0,
          boxSizing: "border-box",
          alignItems: "center",
        }}
      >
        {config.showShortDescription && data.shortDescription ? (
          /* Description Layout - Left side description, Right side price */
          <>
            {/* Description - Left half */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                className={cn(
                  getFontClass(config.descriptionFont || "default"),
                )}
                style={{
                  fontSize: `${config.descriptionSize || 16}px`,
                  lineHeight: "1.4",
                  color: config.descriptionColor || "#000000",
                  textAlign: config.descriptionAlignment || "left",
                  transform:
                    config.descriptionPositionX || config.descriptionPositionY
                      ? `translate(${config.descriptionPositionX || 0}px, ${config.descriptionPositionY || 0}px)`
                      : undefined,
                  whiteSpace: "pre-wrap",
                }}
              >
                {data.shortDescription}
              </div>
            </div>

            {/* Price - Right half */}
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
              }}
            >
              <div
                className={cn("font-bold", getFontClass(config.priceFont))}
                style={{
                  fontSize: `${config.priceSize || Math.min(getTypographySize("price"), 48)}px`,
                  lineHeight: "1.1",
                  color: config.priceColor || "#000000",
                  textAlign: "center",
                  transform:
                    config.pricePositionX || config.pricePositionY
                      ? `translate(${config.pricePositionX || 0}px, ${config.pricePositionY || 0}px)`
                      : undefined,
                }}
              >
                {config.listingType === "alquiler" ? (
                  <>
                    {priceText.replace(" €/mes", "")}
                    <span
                      className="font-normal"
                      style={{
                        fontSize: `${Math.min(getTypographySize("body"), 28)}px`,
                        color: config.priceColor
                          ? `${config.priceColor}80`
                          : "#00000080",
                      }}
                    >
                      {" €/mes"}
                    </span>
                  </>
                ) : (
                  priceText
                )}
              </div>

              {/* Energy Certificate - Never show in description layout */}
            </div>
          </>
        ) : config.showIcons ? (
          /* Icon Grid Layout - Dynamic based on selected additional fields */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(3 + (config.additionalFields?.length || 0), 6)}, 1fr)`,
              gap: `${config.iconPairGap || 16}px`,
              width: "100%",
            }}
          >
            {/* Default Icons - Always shown */}
            {/* Bedrooms */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: `${config.iconTextGap || 8}px`,
              }}
            >
              <Bed
                size={Math.round(32 * (config.iconSize || 1))}
                color="#64748b"
              />
              <span
                style={{
                  fontSize: `${Math.round(24 * (config.iconSize || 1))}px`,
                  fontWeight: "600",
                  color: "#1e293b",
                }}
              >
                {safeData.specs.bedrooms || 0}
              </span>
            </div>

            {/* Bathrooms */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: `${config.iconTextGap || 8}px`,
              }}
            >
              <Bath
                size={Math.round(32 * (config.iconSize || 1))}
                color="#64748b"
              />
              <span
                style={{
                  fontSize: `${Math.round(24 * (config.iconSize || 1))}px`,
                  fontWeight: "600",
                  color: "#1e293b",
                }}
              >
                {safeData.specs.bathrooms || 0}
              </span>
            </div>

            {/* Square meters */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: `${config.iconTextGap || 8}px`,
              }}
            >
              <Maximize
                size={Math.round(32 * (config.iconSize || 1))}
                color="#64748b"
              />
              <span
                style={{
                  fontSize: `${Math.round(24 * (config.iconSize || 1))}px`,
                  fontWeight: "600",
                  color: "#1e293b",
                }}
              >
                {safeData.specs.squareMeters}m²
              </span>
            </div>

            {/* Additional Fields - Dynamic based on selection */}
            {config.additionalFields?.slice(0, 3).map((fieldValue) => {
              const value = getFieldValue(fieldValue, data);
              if (value === "N/A") return null;

              const IconComponent = getFieldIcon(fieldValue);

              return (
                <div
                  key={fieldValue}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: `${config.iconTextGap || 8}px`,
                  }}
                >
                  <IconComponent
                    size={Math.round(32 * (config.iconSize || 1))}
                    color="#64748b"
                  />
                  <span
                    style={{
                      fontSize: `${Math.round(24 * (config.iconSize || 1))}px`,
                      fontWeight: "600",
                      color: "#1e293b",
                    }}
                  >
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          /* Split Layout - Left half bullets, Right half price */
          <>
            {/* Bullet List Layout - Left half */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {data.iconListText ? (
                /* Custom text list from user input */
                <div
                  className={cn(getFontClass(config.bulletFont || "default"))}
                  style={{
                    fontSize: `${config.bulletSize || 16}px`,
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap",
                    textAlign: config.bulletAlignment || "left",
                    color: config.bulletColor || "#000000",
                    transform:
                      config.bulletPositionX || config.bulletPositionY
                        ? `translate(${config.bulletPositionX || 0}px, ${config.bulletPositionY || 0}px)`
                        : undefined,
                  }}
                >
                  {data.iconListText}
                </div>
              ) : (
                /* Default bullet list from property data */
                <ul
                  className={cn(getFontClass(config.bulletFont || "default"))}
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: `${config.iconTextGap || 8}px`,
                    fontSize: `${config.bulletSize || 16}px`,
                    lineHeight: "1.3",
                    textAlign: config.bulletAlignment || "left",
                    color: config.bulletColor || "#000000",
                    transform:
                      config.bulletPositionX || config.bulletPositionY
                        ? `translate(${config.bulletPositionX || 0}px, ${config.bulletPositionY || 0}px)`
                        : undefined,
                  }}
                >
                  {safeData.specs.bathrooms && (
                    <li
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          marginRight: "8px",
                          marginTop: "2px",
                        }}
                      >
                        •
                      </span>
                      <span>{safeData.specs.bathrooms} baños</span>
                    </li>
                  )}
                  {safeData.specs.bedrooms && (
                    <li
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          marginRight: "8px",
                          marginTop: "2px",
                        }}
                      >
                        •
                      </span>
                      <span>{safeData.specs.bedrooms} dormitorios</span>
                    </li>
                  )}
                  <li
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        marginRight: "8px",
                        marginTop: "2px",
                      }}
                    >
                      •
                    </span>
                    <span>{safeData.specs.squareMeters} m²</span>
                  </li>

                  {/* Additional fields as bullet points - Show up to 6 total (3 default + 3 additional) */}
                  {config.additionalFields?.slice(0, 6).map((fieldValue) => {
                    const value = getFieldValue(fieldValue, data);
                    if (value === "N/A") return null;

                    return (
                      <li
                        key={fieldValue}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                        }}
                      >
                        <span
                          style={{
                            marginRight: "8px",
                            marginTop: "2px",
                          }}
                        >
                          •
                        </span>
                        <span>
                          {getFieldLabel(fieldValue)}: {value}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Price - Right half */}
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
              }}
            >
              <div
                className={cn("font-bold", getFontClass(config.priceFont))}
                style={{
                  fontSize: `${config.priceSize || Math.min(getTypographySize("price"), 48)}px`,
                  lineHeight: "1.1",
                  color: config.priceColor || "#000000",
                  textAlign: "center",
                  transform:
                    config.pricePositionX || config.pricePositionY
                      ? `translate(${config.pricePositionX || 0}px, ${config.pricePositionY || 0}px)`
                      : undefined,
                }}
              >
                {config.listingType === "alquiler" ? (
                  <>
                    {priceText.replace(" €/mes", "")}
                    <span
                      className="font-normal"
                      style={{
                        fontSize: `${Math.min(getTypographySize("body"), 28)}px`,
                        color: config.priceColor
                          ? `${config.priceColor}80`
                          : "#00000080",
                      }}
                    >
                      {" €/mes"}
                    </span>
                  </>
                ) : (
                  priceText
                )}
              </div>

              {/* Energy Certificate - Never show in bullet list layout (icons are OFF) */}
            </div>
          </>
        )}
      </div>

      {/* 5. BOTTOM STRIP - Only show when icons are enabled (not when description is shown) */}
      {config.showIcons &&
        !(config.showShortDescription && data.shortDescription) && (
          <div
            style={{
              height: `${bottomStripHeight}px`,
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              paddingLeft: "20px",
              paddingRight: "20px",
              backgroundColor: "#ffffff",
              flexShrink: 0,
              boxSizing: "border-box",
            }}
          >
            {/* Price - Centered when icons */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                position: "relative",
              }}
            >
              <div
                className={cn("font-bold", getFontClass(config.priceFont))}
                style={{
                  fontSize: `${config.priceSize || Math.min(getTypographySize("price"), 48)}px`,
                  lineHeight: "1.1",
                  color: config.priceColor || "#000000",
                  textAlign: "center",
                  transform:
                    config.pricePositionX || config.pricePositionY
                      ? `translate(${config.pricePositionX || 0}px, ${config.pricePositionY || 0}px)`
                      : undefined,
                }}
              >
                {config.listingType === "alquiler" ? (
                  <>
                    {priceText.replace(" €/mes", "")}
                    <span
                      className="font-normal"
                      style={{
                        fontSize: `${Math.min(getTypographySize("body"), 28)}px`,
                        color: config.priceColor
                          ? `${config.priceColor}80`
                          : "#00000080",
                      }}
                    >
                      {" €/mes"}
                    </span>
                  </>
                ) : (
                  priceText
                )}
              </div>

              {/* Energy Certificate - Right aligned (for iconos or horizontal layout) */}
              {config.showEnergyRating &&
                config.energyConsumptionScale &&
                (config.showIcons ||
                  config.orientation !== "vertical") && (
                  <div
                    style={{
                      position: "absolute",
                      right: "0px",
                      top: "50%",
                      transform:
                        config.orientation !== "vertical"
                          ? "translateY(-50%) scale(1.3)"
                          : "translateY(-50%)",
                      transformOrigin: "center",
                    }}
                  >
                    <MiniEnergyCertificate
                      energyRating={config.energyConsumptionScale}
                    />
                  </div>
                )}
            </div>
          </div>
        )}

      {/* 6. FOOTER BAR - Contact elements (Basic template supports 2 contact elements max) */}
      <div
        className={overlayClass}
        style={{
          height: `${footerHeight}px`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingLeft: "20px",
          paddingRight: "20px",
          backgroundColor: isHexColor(config.overlayColor)
            ? config.overlayColor
            : overlayClass
              ? undefined
              : "#1e293b",
          color: textColor,
          flexShrink: 0,
          boxSizing: "border-box",
        }}
      >
        {/* Left contact element - Basic template enforces 2-element limit */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {config.showWebsite && data.contact.website && (
            <span
              style={{
                fontSize: `${getTypographySize("contact")}px`,
                color: textColor,
              }}
            >
              {data.contact.website
                .replace(/^https?:\/\/(www\.)?/, "")
                .replace(/\/$/, "")}
            </span>
          )}
          {config.showEmail && data.contact.email && !config.showWebsite && (
            <span
              style={{
                fontSize: `${getTypographySize("contact")}px`,
                color: textColor,
              }}
            >
              {data.contact.email}
            </span>
          )}
        </div>

        {/* Right contact element - Only show if we don't already have 2 elements */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {config.showPhone && data.contact.phone && (
            <span
              style={{
                fontSize: `${getTypographySize("contact")}px`,
                color: textColor,
              }}
            >
              {data.contact.phone}
            </span>
          )}
          {/* Only show email on right if we have website on left (so we have exactly 2 elements) */}
          {config.showEmail &&
            data.contact.email &&
            config.showWebsite &&
            !config.showPhone && (
              <span
                style={{
                  fontSize: `${getTypographySize("contact")}px`,
                  color: textColor,
                }}
              >
                {data.contact.email}
              </span>
            )}
        </div>
      </div>
    </div>
  );
};
