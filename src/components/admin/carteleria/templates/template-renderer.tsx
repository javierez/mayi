"use client";

import type { FC } from "react";
import { useState, useMemo } from "react";
import type {
  TemplatePropertyData,
  BaseTemplateProps,
} from "~/types/template-data";
import type { TemplateStyle, TemplateFormat } from "~/types/carteleria";
import type { PosterPreferences } from "~/types/poster-preferences";
import {
  getDefaultPropertyData,
  getRandomPropertyData,
} from "~/lib/carteleria/mock-data";

import { cn } from "~/lib/utils";

// Simple fallback template component
const FallbackTemplate: FC<BaseTemplateProps> = ({
  data: _data,
  className,
}) => {
  return (
    <div
      className={cn(
        "relative aspect-[210/297] h-full w-full overflow-hidden bg-gray-800",
        className,
      )}
    >
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-xl text-gray-400">Template Preview</span>
      </div>
    </div>
  );
};

interface TemplateRendererProps {
  styleId: string;
  formatId?: string;
  propertyTypeId?: string;
  customData?: TemplatePropertyData;
  style?: TemplateStyle;
  format?: TemplateFormat;
  className?: string;
  showMockData?: boolean;
  displayOptions?: PosterPreferences;
}

// Basic template preview with black background
const BasicTemplateWrapper: FC<BaseTemplateProps> = ({
  data: _data,
  className,
}) => {
  return (
    <div
      className={cn(
        "relative aspect-[210/297] h-full w-full overflow-hidden bg-black",
        className,
      )}
    >
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-2xl font-bold text-white">Basic Template</span>
      </div>
    </div>
  );
};

const ClassicTemplateWrapper: FC<BaseTemplateProps> = ({
  data: _data,
  className,
}) => {
  return (
    <div
      className={cn(
        "relative aspect-[210/297] h-full w-full overflow-hidden bg-black",
        className,
      )}
    >
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-2xl font-bold text-white">Classic Template</span>
      </div>
    </div>
  );
};

// Minimalist template wrapper with black background
const MinimalistTemplateWrapper: FC<BaseTemplateProps> = ({
  data: _data,
  className,
}) => {
  return (
    <div
      className={cn(
        "relative aspect-[210/297] h-full w-full overflow-hidden bg-black",
        className,
      )}
    >
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-2xl font-bold text-white">
          Minimalist Template
        </span>
      </div>
    </div>
  );
};

const LuxuryTemplateWrapper: FC<BaseTemplateProps> = ({
  data: _data,
  className,
}) => {
  return (
    <div
      className={cn(
        "relative aspect-[210/297] h-full w-full overflow-hidden bg-black",
        className,
      )}
    >
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-2xl font-bold text-white">Luxury Template</span>
      </div>
    </div>
  );
};

const CreativeTemplateWrapper: FC<BaseTemplateProps> = ({
  data: _data,
  className,
}) => {
  return (
    <div
      className={cn(
        "relative aspect-[210/297] h-full w-full overflow-hidden bg-black",
        className,
      )}
    >
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-2xl font-bold text-white">Creative Template</span>
      </div>
    </div>
  );
};

const ProfessionalTemplateWrapper: FC<BaseTemplateProps> = ({
  data: _data,
  className,
}) => {
  return (
    <div
      className={cn(
        "relative aspect-[210/297] h-full w-full overflow-hidden bg-black",
        className,
      )}
    >
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-2xl font-bold text-white">
          Professional Template
        </span>
      </div>
    </div>
  );
};

// Template component mapping for dynamic rendering
const templateComponents = {
  base: FallbackTemplate,
  basic: BasicTemplateWrapper,
  classic: ClassicTemplateWrapper,
  minimalist: MinimalistTemplateWrapper,
  luxury: LuxuryTemplateWrapper,
  creative: CreativeTemplateWrapper,
  professional: ProfessionalTemplateWrapper,
} as const;

export const TemplateRenderer: FC<TemplateRendererProps> = ({
  styleId,
  formatId: _formatId,
  propertyTypeId,
  customData,
  style: _style,
  format: _format,
  className,
  showMockData = true,
  displayOptions: _displayOptions,
}) => {
  // Generate or use provided property data
  const propertyData = useMemo(() => {
    if (customData) {
      return customData;
    }

    if (showMockData) {
      if (
        propertyTypeId &&
        ["piso", "casa", "local", "garaje", "solar"].includes(propertyTypeId)
      ) {
        return getDefaultPropertyData(
          propertyTypeId as "piso" | "casa" | "local" | "garaje" | "solar",
        );
      }
      return getRandomPropertyData();
    }

    // Return default data if no mock data requested
    return getDefaultPropertyData();
  }, [customData, propertyTypeId, showMockData]);

  // Select the appropriate template component
  const TemplateComponent = useMemo(() => {
    // Validate styleId and return appropriate component
    if (styleId in templateComponents) {
      return templateComponents[styleId as keyof typeof templateComponents];
    }

    // Fallback to base template if style not found
    console.warn(
      `Unknown template style: ${styleId}, falling back to base template`,
    );
    return FallbackTemplate;
  }, [styleId]);

  // Error boundary wrapper for template rendering
  const [hasError, setHasError] = useState(false);

  const handleTemplateError = (error: Error) => {
    console.error(`Template rendering error for style "${styleId}":`, error);
    setHasError(true);
  };

  // If error occurred, render fallback template
  if (hasError) {
    return <FallbackTemplate data={propertyData} className={className} />;
  }

  try {
    // TODO: Pass displayOptions to template components when they support it
    // For now, displayOptions are accepted but not yet used by individual templates
    return <TemplateComponent data={propertyData} className={className} />;
  } catch (error) {
    handleTemplateError(error as Error);
    return <FallbackTemplate data={propertyData} className={className} />;
  }
};

// Preview template renderer for style selector
interface TemplatePreviewRendererProps {
  styleId: string;
  propertyTypeId?: string;
  className?: string;
  size?: "small" | "medium" | "large";
}

export const TemplatePreviewRenderer: FC<TemplatePreviewRendererProps> = ({
  styleId,
  propertyTypeId,
  className,
  size = "medium",
}) => {
  const sizeClasses = {
    small: "w-full h-full",
    medium: "w-full h-full",
    large: "w-full h-full",
  };

  return (
    <div className={`${sizeClasses[size]} transition-transform duration-200`}>
      <TemplateRenderer
        styleId={styleId}
        propertyTypeId={propertyTypeId}
        className={className}
        showMockData={true}
      />
    </div>
  );
};

// Batch template renderer for gallery view
interface TemplateGalleryRendererProps {
  templates: Array<{
    styleId: string;
    propertyTypeId?: string;
    formatId?: string;
  }>;
  onTemplatePreview?: (styleId: string) => void;
  className?: string;
}

export const TemplateGalleryRenderer: FC<TemplateGalleryRendererProps> = ({
  templates,
  onTemplatePreview: _onTemplatePreview,
  className,
}) => {
  return (
    <div
      className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${className ?? ""}`}
    >
      {templates.map((template, index) => (
        <div
          key={`${template.styleId}-${index}`}
          className="flex justify-center"
        >
          <TemplatePreviewRenderer
            styleId={template.styleId}
            propertyTypeId={template.propertyTypeId}
            size="medium"
          />
        </div>
      ))}
    </div>
  );
};

// Utility function to validate template style ID
export const isValidStyleId = (styleId: string): boolean => {
  return styleId in templateComponents;
};

// Utility function to get available template styles
export const getAvailableStyles = (): string[] => {
  return Object.keys(templateComponents);
};

// Utility function to get template component name for debugging
export const getTemplateComponentName = (styleId: string): string => {
  if (styleId in templateComponents) {
    return (
      templateComponents[styleId as keyof typeof templateComponents].name ||
      styleId
    );
  }
  return "FallbackTemplate";
};
