/**
 * Street Type Constants
 *
 * Defines the street type (traffic intensity) values used for commercial properties (local).
 * Also defines access type values used for land/solar properties.
 */

/**
 * Street type values representing traffic intensity (for local/commercial)
 */
export const STREET_TYPE_VALUES = [
  "muy_transitada",
  "transitada",
  "moderada",
  "poco_transitada",
] as const;

export type StreetType = (typeof STREET_TYPE_VALUES)[number];

/**
 * Street type mapping from values to Spanish display labels
 */
export const STREET_TYPE_LABELS: Record<StreetType, string> = {
  muy_transitada: "Muy transitada",
  transitada: "Transitada",
  moderada: "Tránsito moderado",
  poco_transitada: "Poco transitada",
};

/**
 * Access type values for land/solar properties (Idealista featuresAccessType)
 */
export const ACCESS_TYPE_VALUES = [
  "urban",
  "road",
  "track",
  "highway",
] as const;

export type AccessType = (typeof ACCESS_TYPE_VALUES)[number];

/**
 * Access type mapping from values to Spanish display labels
 */
export const ACCESS_TYPE_LABELS: Record<AccessType, string> = {
  urban: "Urbano",
  road: "Carretera",
  track: "Camino",
  highway: "Autovía",
};

/**
 * Get display label for a street type value
 */
export function getStreetTypeLabel(value: string | null | undefined): string {
  if (!value) return "";
  return STREET_TYPE_LABELS[value as StreetType] ?? "";
}

/**
 * Get display label for an access type value
 */
export function getAccessTypeLabel(value: string | null | undefined): string {
  if (!value) return "";
  return ACCESS_TYPE_LABELS[value as AccessType] ?? "";
}

/**
 * Check if a value is a valid street type
 */
export function isValidStreetType(value: unknown): value is StreetType {
  return (
    typeof value === "string" &&
    STREET_TYPE_VALUES.includes(value as StreetType)
  );
}

/**
 * Check if a value is a valid access type
 */
export function isValidAccessType(value: unknown): value is AccessType {
  return (
    typeof value === "string" &&
    ACCESS_TYPE_VALUES.includes(value as AccessType)
  );
}
