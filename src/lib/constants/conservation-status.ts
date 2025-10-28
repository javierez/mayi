/**
 * Conservation Status Constants
 *
 * Defines the conservation status values used throughout the application
 * and their mappings to display labels. These values align with Fotocasa API requirements.
 */

/**
 * Conservation status mapping from numeric IDs to Spanish display labels
 *
 * Numeric IDs:
 * - 1 = Good (Bueno)
 * - 2 = Pretty good (Muy bueno)
 * - 3 = Almost new (Como nuevo)
 * - 4 = Needs renovation (A reformar)
 * - 6 = Renovated (Reformado)
 *
 * Note: ID 5 is intentionally skipped in the database/Fotocasa API
 */
export const CONSERVATION_STATUS_LABELS: Record<number, string> = {
  1: "Bueno",
  2: "Muy bueno",
  3: "Como nuevo",
  4: "A reformar",
  6: "Reformado",
};

/**
 * Valid conservation status IDs
 */
export const CONSERVATION_STATUS_IDS = [1, 2, 3, 4, 6] as const;

export type ConservationStatusId = (typeof CONSERVATION_STATUS_IDS)[number];

/**
 * Get display label for a conservation status ID
 */
export function getConservationStatusLabel(
  id: number | null | undefined,
): string {
  if (id == null) return "N/A";
  return CONSERVATION_STATUS_LABELS[id] ?? "N/A";
}

/**
 * Check if a value is a valid conservation status ID
 */
export function isValidConservationStatus(
  value: unknown,
): value is ConservationStatusId {
  return (
    typeof value === "number" &&
    CONSERVATION_STATUS_IDS.includes(value as ConservationStatusId)
  );
}
