// =============================================================================
// SEARCH TEXT NORMALIZATION UTILITIES
// =============================================================================

/**
 * Normalizes text for search comparison by:
 * - Converting to lowercase
 * - Removing accents/diacritics (á → a, ñ → n, etc.)
 * - Removing punctuation
 * - Collapsing multiple spaces
 * - Trimming whitespace
 */
export function normalizeSearchText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents/diacritics
    .replace(/[.,\-'"`()]/g, "") // Remove common punctuation
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
}

/**
 * Normalizes phone number by removing all non-digit characters.
 * Useful for comparing phone numbers regardless of format.
 * Example: "+34 612 345 678" → "34612345678"
 */
export function normalizePhoneForSearch(
  phone: string | null | undefined,
): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

/**
 * Checks if a target string matches a search query using normalized comparison.
 * Supports partial matching - all query words must be present in the target.
 *
 * @param target - The text to search in (e.g., contact name)
 * @param query - The search query from user input
 * @returns true if all query words are found in the target
 *
 * @example
 * matchesSearch("José García López", "garcia jose") // true
 * matchesSearch("García", "García López") // false (López not in target)
 */
export function matchesSearch(
  target: string | null | undefined,
  query: string | null | undefined,
): boolean {
  if (!query) return true; // Empty query matches everything
  if (!target) return false; // No target can't match non-empty query

  const normalizedTarget = normalizeSearchText(target);
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) return true;

  // Split query into words and check if all are present in target
  const queryWords = normalizedQuery.split(" ").filter(Boolean);
  return queryWords.every((word) => normalizedTarget.includes(word));
}

/**
 * Checks if a phone number matches a search query.
 * Compares normalized (digits-only) versions of both.
 *
 * @example
 * matchesPhoneSearch("+34 612 345 678", "612345678") // true
 * matchesPhoneSearch("612-345-678", "612 345 678") // true
 */
export function matchesPhoneSearch(
  targetPhone: string | null | undefined,
  queryPhone: string | null | undefined,
): boolean {
  if (!queryPhone) return true;
  if (!targetPhone) return false;

  const normalizedTarget = normalizePhoneForSearch(targetPhone);
  const normalizedQuery = normalizePhoneForSearch(queryPhone);

  if (!normalizedQuery) return true;

  // Allow partial phone number matching
  return normalizedTarget.includes(normalizedQuery);
}

/**
 * Combined search matcher for contacts.
 * Checks name, email, phone, and NIF with appropriate normalization for each.
 *
 * @param contact - Object with contact fields to search
 * @param query - The search query from user input
 * @returns true if query matches any searchable field
 */
export function matchesContactSearch(
  contact: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    nif?: string | null;
  },
  query: string | null | undefined,
): boolean {
  if (!query) return true;

  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  // Check full name
  const fullName = `${contact.firstName ?? ""} ${contact.lastName ?? ""}`;
  if (matchesSearch(fullName, query)) return true;

  // Check email
  if (matchesSearch(contact.email, query)) return true;

  // Check phone (use phone-specific matching)
  if (matchesPhoneSearch(contact.phone, query)) return true;

  // Check NIF/DNI
  if (matchesSearch(contact.nif, query)) return true;

  return false;
}

/**
 * SQL-safe search pattern generator.
 * Creates a pattern suitable for SQL LIKE queries with normalization hints.
 * Note: For full accent-insensitive search in SQL, use database collation
 * or the UNACCENT extension (PostgreSQL) / custom function (MySQL).
 */
export function createSearchPattern(query: string): string {
  const normalized = normalizeSearchText(query);
  return `%${normalized}%`;
}

// =============================================================================
// URL SLUG UTILITIES (Property Search)
// =============================================================================

export type PropertyType =
  | "piso"
  | "casa"
  | "local"
  | "solar"
  | "garaje"
  | "any";

export interface SearchParams {
  location?: string;
  propertyType?: PropertyType;
  bedrooms?: string;
  bathrooms?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  status?: "for-sale" | "for-rent" | "any";
  province?: string;
  municipality?: string;
}

// Convert search params to URL slug
export function buildSearchSlug(params: SearchParams): string {
  const segments: string[] = [];

  // Add property type and status
  let typeSegment = "";
  if (params.status === "for-rent") {
    typeSegment = "alquiler";
  } else {
    typeSegment = "venta";
  }

  if (params.propertyType && params.propertyType !== "any") {
    if (params.propertyType === "casa") typeSegment += "-casas";
    else if (params.propertyType === "piso") typeSegment += "-pisos";
    else if (params.propertyType === "local") typeSegment += "-locales";
    else if (params.propertyType === "solar") typeSegment += "-solares";
    else if (params.propertyType === "garaje") typeSegment += "-garajes";
  } else {
    typeSegment += "-propiedades";
  }

  segments.push(typeSegment);

  // Add location
  if (params.location) {
    segments.push(params.location.toLowerCase().replace(/\s+/g, "-"));
  } else {
    segments.push("todas-ubicaciones");
  }

  // Add province and municipality
  if (params.province && params.province !== "all") {
    segments.push(`provincia-${params.province}`);
  }
  if (params.municipality && params.municipality !== "all") {
    segments.push(`municipio-${params.municipality}`);
  }

  // Add filters
  const filters: string[] = [];

  if (params.minPrice) {
    filters.push(`precio-desde_${params.minPrice}`);
  }

  if (params.maxPrice) {
    filters.push(`precio-hasta_${params.maxPrice}`);
  }

  if (params.minArea) {
    filters.push(`metros-cuadrados-mas-de_${params.minArea}`);
  }

  if (params.maxArea) {
    filters.push(`metros-cuadrados-menos-de_${params.maxArea}`);
  }

  if (params.bedrooms && params.bedrooms !== "any") {
    const bedroomsNum = Number.parseInt(params.bedrooms);
    if (bedroomsNum === 1) {
      filters.push("un-dormitorio");
    } else if (bedroomsNum === 2) {
      filters.push("dos-dormitorios");
    } else if (bedroomsNum === 3) {
      filters.push("tres-dormitorios");
    } else if (bedroomsNum >= 4) {
      filters.push("cuatro-o-mas-dormitorios");
    }
  }

  if (params.bathrooms && params.bathrooms !== "any") {
    const bathroomsNum = Number.parseInt(params.bathrooms);
    if (bathroomsNum === 1) {
      filters.push("un-bano");
    } else if (bathroomsNum === 2) {
      filters.push("dos-banos");
    } else if (bathroomsNum >= 3) {
      filters.push("tres-o-mas-banos");
    }
  }

  // Add filters to URL if any exist
  if (filters.length > 0) {
    segments.push(`con-${filters.join(",")}`);
  }

  return segments.join("/");
}

// Parse URL slug to search params
export function parseSearchSlug(slug: string): SearchParams {
  const params: SearchParams = {};

  // Split the slug into segments
  const segments = slug.split("/").filter(Boolean);

  // Parse property type and status
  if (segments.length > 0) {
    const typeSegment = segments[0] ?? "";

    if (typeSegment.startsWith("alquiler")) {
      params.status = "for-rent";
    } else {
      params.status = "for-sale";
    }

    if (typeSegment.includes("-casas")) {
      params.propertyType = "casa";
    } else if (typeSegment.includes("-pisos")) {
      params.propertyType = "piso";
    } else if (typeSegment.includes("-locales")) {
      params.propertyType = "local";
    } else if (typeSegment.includes("-solares")) {
      params.propertyType = "solar";
    } else if (typeSegment.includes("-garajes")) {
      params.propertyType = "garaje";
    }
  }

  // Parse location
  if (segments.length > 1 && segments[1] !== "todas-ubicaciones") {
    params.location = (segments[1] ?? "").replace(/-/g, " ");
  }

  // Parse province and municipality
  for (let i = 2; i < segments.length; i++) {
    const segment = segments[i];
    if (segment?.startsWith("provincia-")) {
      params.province = segment.substring(10);
    } else if (segment?.startsWith("municipio-")) {
      params.municipality = segment.substring(10);
    }
  }

  // Parse filters
  const filtersSegment = segments.find((segment) =>
    segment?.startsWith("con-"),
  );
  if (filtersSegment) {
    const filtersString = filtersSegment.substring(4); // Remove 'con-'
    const filters = filtersString.split(",");

    filters.forEach((filter) => {
      if (filter.startsWith("precio-desde_")) {
        params.minPrice = Number.parseInt(filter.split("_")[1] ?? "0");
      } else if (filter.startsWith("precio-hasta_")) {
        params.maxPrice = Number.parseInt(filter.split("_")[1] ?? "0");
      } else if (filter.startsWith("metros-cuadrados-mas-de_")) {
        params.minArea = Number.parseInt(filter.split("_")[1] ?? "0");
      } else if (filter.startsWith("metros-cuadrados-menos-de_")) {
        params.maxArea = Number.parseInt(filter.split("_")[1] ?? "0");
      } else if (filter === "un-dormitorio") {
        params.bedrooms = "1";
      } else if (filter === "dos-dormitorios") {
        params.bedrooms = "2";
      } else if (filter === "tres-dormitorios") {
        params.bedrooms = "3";
      } else if (filter === "cuatro-o-mas-dormitorios") {
        params.bedrooms = "4";
      } else if (filter === "un-bano") {
        params.bathrooms = "1";
      } else if (filter === "dos-banos") {
        params.bathrooms = "2";
      } else if (filter === "tres-o-mas-banos") {
        params.bathrooms = "3";
      }
    });
  }

  return params;
}
