import type {
  TemplateStyle,
  TemplateFormat,
  PropertyType,
  TemplateField,
  CarteleriaTemplate,
} from "~/types/carteleria";

// Template Styles - 6 main design styles
export const templateStyles: TemplateStyle[] = [
  {
    id: "basic",
    name: "Básico",
    description: "Diseño limpio y contemporáneo con líneas minimalistas",
    preview: "/templates/styles/basic-preview.jpg",
    category: "basic",
    colorScheme: {
      primary: "#2563eb",
      secondary: "#64748b",
      accent: "#0ea5e9",
    },
    isActive: true,
  },
  {
    id: "classic",
    name: "Clásico",
    description: "Estilo elegante y tradicional con elementos atemporales",
    preview: "/templates/styles/classic-preview.jpg",
    category: "classic",
    colorScheme: {
      primary: "#1f2937",
      secondary: "#6b7280",
      accent: "#d97706",
    },
    isActive: true,
  },
  {
    id: "minimalist",
    name: "Minimalista",
    description: "Máxima simplicidad con enfoque en lo esencial",
    preview: "/templates/styles/minimalist-preview.jpg",
    category: "minimalist",
    colorScheme: {
      primary: "#000000",
      secondary: "#9ca3af",
      accent: "#ffffff",
    },
    isActive: false,
  },
  {
    id: "luxury",
    name: "Lujo",
    description: "Diseño premium con elementos sofisticados",
    preview: "/templates/styles/luxury-preview.jpg",
    category: "luxury",
    colorScheme: {
      primary: "#7c2d12",
      secondary: "#a3a3a3",
      accent: "#fbbf24",
    },
    isActive: false,
  },
  {
    id: "creative",
    name: "Creativo",
    description: "Estilo innovador con elementos artísticos únicos",
    preview: "/templates/styles/creative-preview.jpg",
    category: "creative",
    colorScheme: {
      primary: "#7c3aed",
      secondary: "#f59e0b",
      accent: "#ec4899",
    },
    isActive: false,
  },
  {
    id: "professional",
    name: "Profesional",
    description: "Formal y confiable, ideal para empresas establecidas",
    preview: "/templates/styles/professional-preview.jpg",
    category: "professional",
    colorScheme: {
      primary: "#1e40af",
      secondary: "#374151",
      accent: "#059669",
    },
    isActive: false,
  },
];

// Template Formats - Paper and digital formats
export const templateFormats: TemplateFormat[] = [
  {
    id: "vertical",
    name: "Vertical",
    dimensions: { width: 210, height: 297, unit: "mm" },
    orientation: "portrait",
    category: "paper",
    isActive: true,
  },
  {
    id: "horizontal",
    name: "Horizontal",
    dimensions: { width: 297, height: 210, unit: "mm" },
    orientation: "landscape",
    category: "paper",
    isActive: true,
  },
  {
    id: "story",
    name: "Story",
    dimensions: { width: 1080, height: 1920, unit: "px" },
    orientation: "portrait",
    category: "digital",
    isActive: false,
  },
  {
    id: "post",
    name: "Post",
    dimensions: { width: 1080, height: 1080, unit: "px" },
    orientation: "portrait",
    category: "digital",
    isActive: false,
  },
];

// Default template fields
const defaultFields: TemplateField[] = [
  {
    id: "title",
    name: "Título",
    type: "text",
    required: true,
    placeholder: "Ej: Se Vende Piso",
  },
  {
    id: "price",
    name: "Precio",
    type: "number",
    required: true,
    placeholder: "250000",
  },
  {
    id: "location",
    name: "Ubicación",
    type: "text",
    required: true,
    placeholder: "Ej: Centro, Madrid",
  },
  {
    id: "description",
    name: "Descripción",
    type: "text",
    required: false,
    placeholder: "Descripción breve de la propiedad",
  },
  {
    id: "contact",
    name: "Contacto",
    type: "text",
    required: true,
    placeholder: "Teléfono o email",
  },
  {
    id: "image",
    name: "Imagen Principal",
    type: "image",
    required: true,
  },
];

const houseFields: TemplateField[] = [
  ...defaultFields,
  {
    id: "bedrooms",
    name: "Habitaciones",
    type: "number",
    required: false,
    placeholder: "3",
  },
  {
    id: "bathrooms",
    name: "Baños",
    type: "number",
    required: false,
    placeholder: "2",
  },
  {
    id: "surface",
    name: "Superficie",
    type: "text",
    required: false,
    placeholder: "120 m²",
  },
];

const commercialFields: TemplateField[] = [
  ...defaultFields,
  {
    id: "business_type",
    name: "Tipo de Negocio",
    type: "text",
    required: false,
    placeholder: "Oficina, Local comercial, etc.",
  },
  {
    id: "surface",
    name: "Superficie",
    type: "text",
    required: false,
    placeholder: "150 m²",
  },
];

const garageFields: TemplateField[] = [
  {
    id: "title",
    name: "Título",
    type: "text",
    required: true,
    placeholder: "Ej: Se Vende Plaza de Garaje",
  },
  {
    id: "price",
    name: "Precio",
    type: "number",
    required: true,
    placeholder: "25000",
  },
  {
    id: "location",
    name: "Ubicación",
    type: "text",
    required: true,
    placeholder: "Ej: Garaje Subterráneo, Centro",
  },
  {
    id: "contact",
    name: "Contacto",
    type: "text",
    required: true,
    placeholder: "Teléfono o email",
  },
  {
    id: "image",
    name: "Imagen",
    type: "image",
    required: false,
  },
  // Note: No description field for garage as mentioned in requirements
];

// Property Types - piso, local, casa, garaje, solar
export const propertyTypes: PropertyType[] = [
  {
    id: "piso",
    name: "Piso",
    description: "Viviendas en edificios y apartamentos",
    icon: "Building2",
    defaultFields: houseFields,
    category: "residential",
  },
  {
    id: "casa",
    name: "Casa",
    description: "Viviendas unifamiliares y chalets",
    icon: "Home",
    defaultFields: houseFields,
    category: "residential",
  },
  {
    id: "local",
    name: "Local Comercial",
    description: "Espacios para negocios y oficinas",
    icon: "Store",
    defaultFields: commercialFields,
    category: "commercial",
  },
  {
    id: "garaje",
    name: "Garaje",
    description: "Plazas de parking y trasteros",
    icon: "Car",
    defaultFields: garageFields,
    category: "residential",
  },
  {
    id: "solar",
    name: "Solar",
    description: "Terrenos y parcelas para construcción",
    icon: "TreePine",
    defaultFields: [
      ...defaultFields,
      {
        id: "surface",
        name: "Superficie",
        type: "text",
        required: true,
        placeholder: "500 m²",
      },
      {
        id: "buildable",
        name: "Edificable",
        type: "boolean",
        required: false,
      },
    ],
    category: "land",
  },
];

// Sample Templates - combining styles, formats, and property types
export const sampleTemplates: CarteleriaTemplate[] = [
  // Basic Style Templates
  {
    id: "basic-piso-a4",
    name: "Piso Básico A4",
    description: "Plantilla básica para venta de pisos en formato A4",
    styleId: "basic",
    formatId: "a4-portrait",
    propertyTypeId: "piso",
    preview: "/templates/basic-piso-a4-preview.jpg",
    fields:
      propertyTypes.find((pt) => pt.id === "piso")?.defaultFields ??
      defaultFields,
    featured: true,
    tags: ["venta", "piso", "básico"],
  },
  {
    id: "basic-casa-a3",
    name: "Casa Básica A3",
    description: "Diseño básico para casas en formato A3 horizontal",
    styleId: "basic",
    formatId: "a3-landscape",
    propertyTypeId: "casa",
    preview: "/templates/basic-casa-a3-preview.jpg",
    fields:
      propertyTypes.find((pt) => pt.id === "casa")?.defaultFields ??
      defaultFields,
    featured: true,
    tags: ["venta", "casa", "básico"],
  },

  // Classic Style Templates
  {
    id: "classic-local-a4",
    name: "Local Clásico A4",
    description: "Estilo clásico para locales comerciales",
    styleId: "classic",
    formatId: "a4-portrait",
    propertyTypeId: "local",
    preview: "/templates/classic-local-a4-preview.jpg",
    fields:
      propertyTypes.find((pt) => pt.id === "local")?.defaultFields ??
      defaultFields,
    featured: false,
    tags: ["alquiler", "local", "comercial"],
  },
  {
    id: "classic-piso-a3",
    name: "Piso Clásico A3",
    description: "Diseño clásico y elegante para pisos",
    styleId: "classic",
    formatId: "a3-portrait",
    propertyTypeId: "piso",
    preview: "/templates/classic-piso-a3-preview.jpg",
    fields:
      propertyTypes.find((pt) => pt.id === "piso")?.defaultFields ??
      defaultFields,
    featured: true,
    tags: ["venta", "piso", "elegante"],
  },

  // Minimalist Style Templates
  {
    id: "minimalist-garaje-a4",
    name: "Garaje Minimalista",
    description: "Diseño simple y directo para garajes",
    styleId: "minimalist",
    formatId: "a4-portrait",
    propertyTypeId: "garaje",
    preview: "/templates/minimalist-garaje-a4-preview.jpg",
    fields:
      propertyTypes.find((pt) => pt.id === "garaje")?.defaultFields ??
      defaultFields,
    featured: false,
    tags: ["venta", "garaje", "simple"],
  },
  {
    id: "minimalist-solar-a2",
    name: "Solar Minimalista A2",
    description: "Plantilla minimalista para terrenos en formato grande",
    styleId: "minimalist",
    formatId: "a2-landscape",
    propertyTypeId: "solar",
    preview: "/templates/minimalist-solar-a2-preview.jpg",
    fields:
      propertyTypes.find((pt) => pt.id === "solar")?.defaultFields ??
      defaultFields,
    featured: true,
    tags: ["venta", "solar", "terreno"],
  },

  // Luxury Style Templates
  {
    id: "luxury-casa-a2",
    name: "Casa de Lujo A2",
    description: "Diseño premium para propiedades de alto valor",
    styleId: "luxury",
    formatId: "a2-portrait",
    propertyTypeId: "casa",
    preview: "/templates/luxury-casa-a2-preview.jpg",
    fields:
      propertyTypes.find((pt) => pt.id === "casa")?.defaultFields ??
      defaultFields,
    featured: true,
    tags: ["venta", "casa", "lujo", "premium"],
  },
  {
    id: "luxury-piso-digital",
    name: "Piso Lujo Digital",
    description: "Plantilla de lujo optimizada para redes sociales",
    styleId: "luxury",
    formatId: "digital-square",
    propertyTypeId: "piso",
    preview: "/templates/luxury-piso-digital-preview.jpg",
    fields:
      propertyTypes.find((pt) => pt.id === "piso")?.defaultFields ??
      defaultFields,
    featured: false,
    tags: ["venta", "piso", "digital", "social"],
  },

  // Creative Style Templates
  {
    id: "creative-local-a3",
    name: "Local Creativo A3",
    description: "Diseño artístico y llamativo para locales",
    styleId: "creative",
    formatId: "a3-landscape",
    propertyTypeId: "local",
    preview: "/templates/creative-local-a3-preview.jpg",
    fields:
      propertyTypes.find((pt) => pt.id === "local")?.defaultFields ??
      defaultFields,
    featured: false,
    tags: ["alquiler", "local", "creativo", "artistico"],
  },

  // Professional Style Templates
  {
    id: "professional-piso-a4",
    name: "Piso Profesional A4",
    description: "Estilo corporativo y confiable",
    styleId: "professional",
    formatId: "a4-portrait",
    propertyTypeId: "piso",
    preview: "/templates/professional-piso-a4-preview.jpg",
    fields:
      propertyTypes.find((pt) => pt.id === "piso")?.defaultFields ??
      defaultFields,
    featured: true,
    tags: ["venta", "piso", "profesional", "corporativo"],
  },
];

// Utility functions
export const getStyleById = (styleId: string): TemplateStyle | undefined => {
  return templateStyles.find((style) => style.id === styleId);
};

export const getFormatById = (formatId: string): TemplateFormat | undefined => {
  return templateFormats.find((format) => format.id === formatId);
};

export const getPropertyTypeById = (
  propertyTypeId: string,
): PropertyType | undefined => {
  return propertyTypes.find((pt) => pt.id === propertyTypeId);
};

export const getTemplatesByStyle = (styleId: string): CarteleriaTemplate[] => {
  return sampleTemplates.filter((template) => template.styleId === styleId);
};

export const getTemplatesByFormat = (
  formatId: string,
): CarteleriaTemplate[] => {
  return sampleTemplates.filter((template) => template.formatId === formatId);
};

export const getTemplatesByPropertyType = (
  propertyTypeId: string,
): CarteleriaTemplate[] => {
  return sampleTemplates.filter(
    (template) => template.propertyTypeId === propertyTypeId,
  );
};

export const getFeaturedTemplates = (): CarteleriaTemplate[] => {
  return sampleTemplates.filter((template) => template.featured);
};

export const getTemplatesByFilters = (filters: {
  styleId?: string | null;
  formatIds?: string[];
  propertyTypeIds?: string[];
}): CarteleriaTemplate[] => {
  return sampleTemplates.filter((template) => {
    if (filters.styleId && template.styleId !== filters.styleId) return false;
    if (
      filters.formatIds &&
      filters.formatIds.length > 0 &&
      !filters.formatIds.includes(template.formatId)
    )
      return false;
    if (
      filters.propertyTypeIds &&
      filters.propertyTypeIds.length > 0 &&
      !filters.propertyTypeIds.includes(template.propertyTypeId)
    )
      return false;
    return true;
  });
};
