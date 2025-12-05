/**
 * Property Completion Tracker
 * Validates property listing fields and categorizes them by importance
 */

import { getSquareMeter } from "~/lib/properties/area-utils";

export type PropertyType = "piso" | "casa" | "local" | "solar" | "garaje";

export interface FieldRule {
  id: string;
  label: string; // Spanish user-facing label
  fieldPath: string; // Path in listing object
  importance: "mandatory" | "nth"; // Field importance category
  category: string; // Card/module name
  applicablePropertyTypes?: PropertyType[]; // If undefined, applies to all types
  validator: (value: unknown, listing?: Record<string, unknown>) => boolean;
}

export const fieldRules: FieldRule[] = [
  // ==================== MANDATORY FIELDS ====================
  // Essential for portal publishing

  // ========== UNIVERSAL MANDATORY (7 fields - all property types) ==========

  {
    id: "price",
    label: "Precio",
    fieldPath: "price",
    importance: "mandatory",
    category: "Información Básica",
    // Applies to all property types
    validator: (v) => v !== null && v !== undefined && Number(v) > 0,
  },
  {
    id: "listingType",
    label: "Tipo de anuncio",
    fieldPath: "listingType",
    importance: "mandatory",
    category: "Información Básica",
    // Applies to all property types
    validator: (v) => !!v && typeof v === "string" && v.trim().length > 0,
  },
  {
    id: "propertyType",
    label: "Tipo de propiedad",
    fieldPath: "propertyType",
    importance: "mandatory",
    category: "Información Básica",
    // Applies to all property types
    validator: (v) => !!v && typeof v === "string" && v.trim().length > 0,
  },
  {
    id: "street",
    label: "Calle",
    fieldPath: "street",
    importance: "mandatory",
    category: "Dirección",
    // Applies to all property types
    validator: (v) => !!v && typeof v === "string" && v.trim().length > 0,
  },
  {
    id: "city",
    label: "Ciudad",
    fieldPath: "city",
    importance: "mandatory",
    category: "Dirección",
    // Applies to all property types
    validator: (v) => !!v && typeof v === "string" && v.trim().length > 0,
  },
  {
    id: "province",
    label: "Provincia",
    fieldPath: "province",
    importance: "mandatory",
    category: "Dirección",
    // Applies to all property types
    validator: (v) => !!v && typeof v === "string" && v.trim().length > 0,
  },
  {
    id: "postalCode",
    label: "Código postal",
    fieldPath: "postalCode",
    importance: "mandatory",
    category: "Dirección",
    // Applies to all property types
    validator: (v) => !!v && typeof v === "string" && v.trim().length > 0,
  },

  // ========== PROPERTY TYPE-SPECIFIC MANDATORY FIELDS ==========

  // Superficie - Required for piso, casa, local, solar (NOT garaje - uses builtSurfaceArea)
  {
    id: "squareMeter",
    label: "Superficie",
    fieldPath: "squareMeter",
    importance: "mandatory",
    category: "Detalles de la Propiedad",
    applicablePropertyTypes: ["piso", "casa", "local", "solar"],
    validator: (_v, listing) => {
      // Use bidirectional fallback for all property types
      if (!listing) return false;
      const areaValue = getSquareMeter(listing as { squareMeter?: number | null; builtSurfaceArea?: string | number | null });
      return areaValue !== null && areaValue > 0;
    },
  },

  // Superficie construida - Optional for garaje (moved to NTH section below)
  // No longer mandatory for any property type

  // Dormitorios - Required ONLY for piso and casa (residential)
  {
    id: "bedrooms",
    label: "Dormitorios",
    fieldPath: "bedrooms",
    importance: "mandatory",
    category: "Detalles de la Propiedad",
    applicablePropertyTypes: ["piso", "casa"],
    validator: (v) => v !== null && v !== undefined,
  },

  // Baños - Required for piso, casa, and local (NOT garaje or solar)
  {
    id: "bathrooms",
    label: "Baños",
    fieldPath: "bathrooms",
    importance: "mandatory",
    category: "Detalles de la Propiedad",
    applicablePropertyTypes: ["piso", "casa", "local"],
    validator: (v) => v !== null && v !== undefined,
  },

  // Descripción - Required for all property types
  {
    id: "description",
    label: "Descripción completa",
    fieldPath: "description",
    importance: "mandatory",
    category: "Descripción",
    // Applies to all property types
    validator: (v) => {
      if (!v) return false;
      if (typeof v === "string") return v.trim().length >= 20;
      return false;
    },
  },

  // Imágenes - Different requirements per property type
  {
    id: "images",
    label: "Imágenes",
    fieldPath: "imageCount",
    importance: "mandatory",
    category: "Imágenes",
    // Applies to all property types, but with different minimums
    validator: (v, listing) => {
      const count = Number(v ?? 0);
      const propertyType = listing?.propertyType as PropertyType | undefined;

      // Only log if imageCount is problematic (0 or missing)
      if (count === 0 || v === undefined || v === null) {
        console.warn("⚠️ Image count issue:", {
          rawValue: v,
          parsedCount: count,
          propertyType,
          listingImageCount: listing?.imageCount,
          allListingKeys: listing ? Object.keys(listing).filter(k => k.includes('image') || k.includes('Image')) : [],
        });
      }

      // Residential properties (piso, casa) and commercial (local) need minimum 5 images
      if (
        propertyType === "piso" ||
        propertyType === "casa" ||
        propertyType === "local"
      ) {
        return count >= 5;
      }

      // Garaje and solar need minimum 3 images
      if (propertyType === "garaje" || propertyType === "solar") {
        return count >= 3;
      }

      // Default: 5 images if property type is unknown
      return count >= 5;
    },
  },

  // ==================== NTH FIELDS (Nice to Have) ====================
  // Improves listing quality (~80 fields)

  {
    id: "title",
    label: "Título",
    fieldPath: "title",
    importance: "nth",
    category: "Información Básica",
    validator: (v) => !!v && typeof v === "string" && v.trim().length > 0,
  },
  {
    id: "shortDescription",
    label: "Descripción corta",
    fieldPath: "shortDescription",
    importance: "nth",
    category: "Descripción",
    validator: (v) => !!v && typeof v === "string" && v.trim().length > 0,
  },
  {
    id: "propertySubtype",
    label: "Subtipo de propiedad",
    fieldPath: "propertySubtype",
    importance: "nth",
    category: "Información Básica",
    validator: (v) => !!v && typeof v === "string" && v.trim().length > 0,
  },
  {
    id: "yearBuilt",
    label: "Año de construcción",
    fieldPath: "yearBuilt",
    importance: "nth",
    category: "Detalles de la Propiedad",
    validator: (v) => v !== null && v !== undefined && Number(v) > 1800,
  },
  {
    id: "lastRenovationYear",
    label: "Año de última reforma",
    fieldPath: "lastRenovationYear",
    importance: "nth",
    category: "Detalles de la Propiedad",
    validator: (v) => v !== null && v !== undefined && Number(v) > 1800,
  },
  {
    id: "conservationStatus",
    label: "Estado de conservación",
    fieldPath: "conservationStatus",
    importance: "nth",
    category: "Detalles de la Propiedad",
    validator: (v) => v !== null && v !== undefined,
  },
  {
    id: "buildingFloors",
    label: "Plantas del edificio",
    fieldPath: "buildingFloors",
    importance: "nth",
    category: "Detalles de la Propiedad",
    validator: (v) => v !== null && v !== undefined && Number(v) > 0,
  },
  {
    id: "builtSurfaceArea",
    label: "Superficie construida",
    fieldPath: "builtSurfaceArea",
    importance: "nth",
    category: "Detalles de la Propiedad",
    validator: (v) => v !== null && v !== undefined && Number(v) > 0,
  },
  {
    id: "cadastralReference",
    label: "Referencia catastral",
    fieldPath: "cadastralReference",
    importance: "nth",
    category: "Información Básica",
    validator: (v) => !!v && typeof v === "string" && v.trim().length > 0,
  },
  {
    id: "newConstruction",
    label: "Obra nueva",
    fieldPath: "newConstruction",
    importance: "nth",
    category: "Información Básica",
    validator: (v) => v === true,
  },
  {
    id: "neighborhood",
    label: "Barrio",
    fieldPath: "neighborhood",
    importance: "nth",
    category: "Dirección",
    validator: (v) => !!v && typeof v === "string" && v.trim().length > 0,
  },
  {
    id: "municipality",
    label: "Municipio",
    fieldPath: "municipality",
    importance: "nth",
    category: "Dirección",
    validator: (v) => !!v && typeof v === "string" && v.trim().length > 0,
  },
  {
    id: "addressDetails",
    label: "Detalles de dirección",
    fieldPath: "addressDetails",
    importance: "nth",
    category: "Dirección",
    validator: (v) => !!v && typeof v === "string" && v.trim().length > 0,
  },
  {
    id: "hasElevator",
    label: "Ascensor",
    fieldPath: "hasElevator",
    importance: "nth",
    category: "Características",
    validator: (v) => v === true,
  },
  {
    id: "hasGarage",
    label: "Garaje",
    fieldPath: "hasGarage",
    importance: "nth",
    category: "Características",
    validator: (v) => v === true,
  },
  {
    id: "garageType",
    label: "Tipo de garaje",
    fieldPath: "garageType",
    importance: "nth",
    category: "Características",
    validator: (v) => !!v && typeof v === "string" && v.trim().length > 0,
  },
  {
    id: "garageSpaces",
    label: "Plazas de garaje",
    fieldPath: "garageSpaces",
    importance: "nth",
    category: "Características",
    validator: (v) => v !== null && v !== undefined && Number(v) > 0,
  },
  {
    id: "hasStorageRoom",
    label: "Trastero",
    fieldPath: "hasStorageRoom",
    importance: "nth",
    category: "Características",
    validator: (v) => v === true,
  },
  {
    id: "storageRoomSize",
    label: "Tamaño del trastero",
    fieldPath: "storageRoomSize",
    importance: "nth",
    category: "Características",
    validator: (v) => v !== null && v !== undefined && Number(v) > 0,
  },
  {
    id: "hasHeating",
    label: "Calefacción",
    fieldPath: "hasHeating",
    importance: "nth",
    category: "Características",
    validator: (v) => v === true,
  },
  {
    id: "heatingType",
    label: "Tipo de calefacción",
    fieldPath: "heatingType",
    importance: "nth",
    category: "Características",
    validator: (v) => !!v && typeof v === "string" && v.trim().length > 0,
  },
  {
    id: "hotWaterType",
    label: "Agua caliente",
    fieldPath: "hotWaterType",
    importance: "nth",
    category: "Características",
    validator: (v) => !!v && typeof v === "string" && v.trim().length > 0,
  },
  {
    id: "airConditioningType",
    label: "Aire acondicionado",
    fieldPath: "airConditioningType",
    importance: "nth",
    category: "Características",
    validator: (v) => !!v && typeof v === "string" && v.trim().length > 0,
  },
  {
    id: "isFurnished",
    label: "Amueblado",
    fieldPath: "isFurnished",
    importance: "nth",
    category: "Características",
    validator: (v) => v === true,
  },
  {
    id: "exterior",
    label: "Exterior",
    fieldPath: "exterior",
    importance: "nth",
    category: "Orientación",
    validator: (v) => v === true,
  },
  {
    id: "bright",
    label: "Luminoso",
    fieldPath: "bright",
    importance: "nth",
    category: "Orientación",
    validator: (v) => v === true,
  },
  {
    id: "orientation",
    label: "Orientación",
    fieldPath: "orientation",
    importance: "nth",
    category: "Orientación",
    validator: (v) => !!v && typeof v === "string" && v.trim().length > 0,
  },
  {
    id: "disabledAccessible",
    label: "Accesible para discapacitados",
    fieldPath: "disabledAccessible",
    importance: "nth",
    category: "Características Adicionales",
    validator: (v) => v === true,
  },
  {
    id: "videoIntercom",
    label: "Videoportero",
    fieldPath: "videoIntercom",
    importance: "nth",
    category: "Características Adicionales",
    validator: (v) => v === true,
  },
  {
    id: "alarm",
    label: "Alarma",
    fieldPath: "alarm",
    importance: "nth",
    category: "Características Adicionales",
    validator: (v) => v === true,
  },
  {
    id: "securityDoor",
    label: "Puerta de seguridad",
    fieldPath: "securityDoor",
    importance: "nth",
    category: "Características Adicionales",
    validator: (v) => v === true,
  },
  {
    id: "kitchenType",
    label: "Tipo de cocina",
    fieldPath: "kitchenType",
    importance: "nth",
    category: "Características Adicionales",
    validator: (v) => !!v && typeof v === "string" && v.trim().length > 0,
  },
  {
    id: "views",
    label: "Vistas",
    fieldPath: "views",
    importance: "nth",
    category: "Características Premium",
    validator: (v) => v === true,
  },
  {
    id: "mountainViews",
    label: "Vistas a la montaña",
    fieldPath: "mountainViews",
    importance: "nth",
    category: "Características Premium",
    validator: (v) => v === true,
  },
  {
    id: "seaViews",
    label: "Vistas al mar",
    fieldPath: "seaViews",
    importance: "nth",
    category: "Características Premium",
    validator: (v) => v === true,
  },
  {
    id: "pool",
    label: "Piscina",
    fieldPath: "pool",
    importance: "nth",
    category: "Características Premium",
    validator: (v) => v === true,
  },
  {
    id: "garden",
    label: "Jardín",
    fieldPath: "garden",
    importance: "nth",
    category: "Características Premium",
    validator: (v) => v === true,
  },
  {
    id: "terrace",
    label: "Terraza",
    fieldPath: "terrace",
    importance: "nth",
    category: "Espacios Adicionales",
    validator: (v) => v === true,
  },
  {
    id: "terraceSize",
    label: "Tamaño de terraza",
    fieldPath: "terraceSize",
    importance: "nth",
    category: "Espacios Adicionales",
    validator: (v) => v !== null && v !== undefined && Number(v) > 0,
  },
  {
    id: "balconyCount",
    label: "Número de balcones",
    fieldPath: "balconyCount",
    importance: "nth",
    category: "Espacios Adicionales",
    validator: (v) => v !== null && v !== undefined && Number(v) > 0,
  },
  {
    id: "builtInWardrobes",
    label: "Armarios empotrados",
    fieldPath: "builtInWardrobes",
    importance: "nth",
    category: "Espacios Adicionales",
    validator: (v) => v === true,
  },
  {
    id: "mainFloorType",
    label: "Tipo de suelo",
    fieldPath: "mainFloorType",
    importance: "nth",
    category: "Materiales",
    validator: (v) => !!v && typeof v === "string" && v.trim().length > 0,
  },
];

export interface CompletionResult {
  mandatory: {
    completed: Array<FieldRule & { isCompleted: boolean }>;
    pending: Array<FieldRule & { isCompleted: boolean }>;
    total: number;
    completedCount: number;
  };
  nth: {
    completed: Array<FieldRule & { isCompleted: boolean }>;
    pending: Array<FieldRule & { isCompleted: boolean }>;
    total: number;
    completedCount: number;
  };
  overallPercentage: number;
  overallCompleted: number;
  overallTotal: number;
  canPublishToPortals: boolean;
}

/**
 * Checks if a field rule is applicable to a given property type
 */
function isFieldApplicable(rule: FieldRule, propertyType?: string): boolean {
  // If no applicablePropertyTypes specified, field applies to all types
  if (!rule.applicablePropertyTypes) {
    return true;
  }

  // If no property type provided, include the field (for safety)
  if (!propertyType) {
    return true;
  }

  // Check if the property type is in the applicable list
  return rule.applicablePropertyTypes.includes(propertyType as PropertyType);
}

/**
 * Gets the dynamic label for images based on property type
 */
function getImageLabel(propertyType?: string): string {
  if (propertyType === "garaje" || propertyType === "solar") {
    return "Imágenes (mínimo 3)";
  }
  return "Imágenes (mínimo 5)";
}

// Cache to prevent excessive logging for the same listing
const logCache = new Map<string, boolean>();
const LOG_CACHE_DURATION = 2000; // 2 seconds

export function calculateCompletion(
  listing: Record<string, unknown>,
): CompletionResult {
  const mandatory = {
    completed: [] as Array<FieldRule & { isCompleted: boolean }>,
    pending: [] as Array<FieldRule & { isCompleted: boolean }>,
    total: 0,
    completedCount: 0,
  };

  const nth = {
    completed: [] as Array<FieldRule & { isCompleted: boolean }>,
    pending: [] as Array<FieldRule & { isCompleted: boolean }>,
    total: 0,
    completedCount: 0,
  };

  // If no listing data, return empty result
  if (!listing) {
    return {
      mandatory,
      nth,
      overallPercentage: 0,
      overallCompleted: 0,
      overallTotal: fieldRules.length,
      canPublishToPortals: false,
    };
  }

  // Get property type from listing
  const propertyType = listing.propertyType as PropertyType | undefined;

  // Create a cache key for this listing
  const cacheKey = `${String(listing.listingId)}_${String(listing.imageCount)}`;
  const shouldLog = !logCache.has(cacheKey);

  if (shouldLog) {
    logCache.set(cacheKey, true);
    setTimeout(() => logCache.delete(cacheKey), LOG_CACHE_DURATION);

    console.log("🔍 calculateCompletion called for listing:", {
      listingId: listing.listingId,
      imageCount: listing.imageCount,
      propertyType,
    });
  }

  // Filter and process field rules based on property type
  fieldRules.forEach((rule) => {
    // Skip fields that don't apply to this property type
    if (!isFieldApplicable(rule, propertyType)) {
      return;
    }

    const fieldValue = listing[rule.fieldPath];
    const isValid = rule.validator(fieldValue, listing);

    // Create field info with dynamic label for images
    const fieldInfo = {
      ...rule,
      label: rule.id === "images" ? getImageLabel(propertyType) : rule.label,
      isCompleted: isValid,
    };

    if (rule.importance === "mandatory") {
      mandatory.total++;
      if (isValid) {
        mandatory.completed.push(fieldInfo);
        mandatory.completedCount++;
      } else {
        mandatory.pending.push(fieldInfo);
      }
    } else {
      nth.total++;
      if (isValid) {
        nth.completed.push(fieldInfo);
        nth.completedCount++;
      } else {
        nth.pending.push(fieldInfo);
      }
    }
  });

  const overallCompleted = mandatory.completedCount + nth.completedCount;
  const overallTotal = mandatory.total + nth.total;

  return {
    mandatory,
    nth,
    overallPercentage:
      overallTotal > 0
        ? Math.round((overallCompleted / overallTotal) * 100)
        : 0,
    overallCompleted,
    overallTotal,
    canPublishToPortals: mandatory.pending.length === 0,
  };
}
