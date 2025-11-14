// Type definitions for the Cartelería Template Selection System

export interface TemplateStyle {
  id: string;
  name: string;
  description: string;
  preview: string;
  category:
    | "basic"
    | "modern"
    | "classic"
    | "minimalist"
    | "luxury"
    | "creative"
    | "professional";
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  isActive: boolean;
}

export interface TemplateFormat {
  id: string;
  name: string;
  dimensions: {
    width: number;
    height: number;
    unit: "mm" | "px";
  };
  orientation: "portrait" | "landscape";
  category: "paper" | "digital";
  isActive: boolean;
}

export interface PropertyType {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultFields: TemplateField[];
  category: "residential" | "commercial" | "land";
}

export interface TemplateField {
  id: string;
  name: string;
  type: "text" | "number" | "image" | "boolean";
  required: boolean;
  placeholder?: string;
}

export interface CarteleriaTemplate {
  id: string;
  name: string;
  description: string;
  styleId: string;
  formatId: string;
  propertyTypeId: string;
  preview: string;
  fields: TemplateField[];
  featured: boolean;
  tags: string[];
}

export interface CarteleriaSelection {
  styleId: string | null;
  formatIds: string[];
  propertyTypeIds: string[];
  templateIds: string[];
  customizations: Record<string, Record<string, unknown>>;
}

// State management interface for the main component
export interface CarteleriaState {
  currentStep: "style" | "format" | "personalization";
  selections: CarteleriaSelection;
  previewTemplate: CarteleriaTemplate | null;
}

// Component prop interfaces
export interface StyleSelectorProps {
  selectedStyleId: string | null;
  onStyleSelect: (styleId: string) => void;
  styles: TemplateStyle[];
}

export interface FormatSelectorProps {
  selectedFormatIds: string[];
  onFormatToggle: (formatId: string) => void;
  formats: TemplateFormat[];
}

export interface PropertyTypeSelectorProps {
  selectedPropertyTypeIds: string[];
  onPropertyTypeToggle: (propertyTypeId: string) => void;
  propertyTypes: PropertyType[];
}

export interface TemplateGalleryProps {
  templates: CarteleriaTemplate[];
  selectedTemplateIds: string[];
  onTemplateToggle: (templateId: string) => void;
  filters?: {
    styleId?: string | null;
    formatIds?: string[];
    propertyTypeIds?: string[];
  };
}

export interface TemplatePreviewProps {
  template: CarteleriaTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (template: CarteleriaTemplate) => void;
}

export interface TemplateCustomizerProps {
  template: CarteleriaTemplate;
  customizations: Record<string, Record<string, unknown>>;
  onCustomizationChange: (
    templateId: string,
    fieldId: string,
    value: unknown,
  ) => void;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}
