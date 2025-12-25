/**
 * Premises/Local Ubication Types
 * Maps to Idealista's featuresUbication field
 */

export const PREMISES_UBICATION_VALUES = [
  "street",
  "mezzanine",
  "shopping",
  "on_top_floor",
  "belowGround",
  "other",
  "unknown",
] as const;

export type PremisesUbication = (typeof PREMISES_UBICATION_VALUES)[number];

export const PREMISES_UBICATION_LABELS: Record<PremisesUbication, string> = {
  street: "A pie de calle",
  mezzanine: "Entreplanta",
  shopping: "Centro comercial",
  on_top_floor: "Planta alta",
  belowGround: "Sótano",
  other: "Otro",
  unknown: "Desconocido",
};

export function isValidPremisesUbication(
  value: unknown,
): value is PremisesUbication {
  return (
    typeof value === "string" &&
    PREMISES_UBICATION_VALUES.includes(value as PremisesUbication)
  );
}
