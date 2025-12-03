/**
 * Street Type Constants
 *
 * Defines the street type (traffic intensity) values used for commercial properties (local).
 * Only applicable when propertyType === 'local'.
 */

/**
 * Street type values representing traffic intensity
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
 * Get display label for a street type value
 */
export function getStreetTypeLabel(value: string | null | undefined): string {
  if (!value) return "";
  return STREET_TYPE_LABELS[value as StreetType] ?? "";
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
