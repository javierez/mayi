/**
 * Commercial Activities for Premises/Local Properties
 * Maps to Idealista's featuresCommercialMainActivity and featuresCommercialSecondaryActivity fields
 */

export const COMMERCIAL_ACTIVITY_VALUES = [
  // Food & Drink
  "bar",
  "cafeteria",
  "restaurant",
  "pub",
  "disco",
  // Food Shops
  "bakery",
  "butcher",
  "fishmonger",
  "grocery",
  "supermarket",
  // Retail
  "clothing",
  "shoes",
  "jewelry",
  "furniture",
  "electronics",
  // Health & Beauty
  "pharmacy",
  "herbalist",
  "beauty",
  "hair_salon",
  "gym",
  // Services
  "travel_agency",
  "real_estate",
  "insurance",
  "bank",
  // Education & Care
  "academy",
  "nursery",
  // Medical
  "medical",
  "dental",
  "veterinary",
  // Industrial/Technical
  "workshop",
  "garage",
  "printing",
  "laundry",
  // Other
  "other",
] as const;

export type CommercialActivity = (typeof COMMERCIAL_ACTIVITY_VALUES)[number];

export const COMMERCIAL_ACTIVITY_LABELS: Record<CommercialActivity, string> = {
  // Food & Drink
  bar: "Bar",
  cafeteria: "Cafetería",
  restaurant: "Restaurante",
  pub: "Pub",
  disco: "Discoteca",
  // Food Shops
  bakery: "Panadería",
  butcher: "Carnicería",
  fishmonger: "Pescadería",
  grocery: "Ultramarinos",
  supermarket: "Supermercado",
  // Retail
  clothing: "Ropa",
  shoes: "Zapatería",
  jewelry: "Joyería",
  furniture: "Muebles",
  electronics: "Electrónica",
  // Health & Beauty
  pharmacy: "Farmacia",
  herbalist: "Herbolario",
  beauty: "Estética",
  hair_salon: "Peluquería",
  gym: "Gimnasio",
  // Services
  travel_agency: "Agencia de viajes",
  real_estate: "Inmobiliaria",
  insurance: "Seguros",
  bank: "Banca",
  // Education & Care
  academy: "Academia",
  nursery: "Guardería",
  // Medical
  medical: "Clínica médica",
  dental: "Clínica dental",
  veterinary: "Veterinario",
  // Industrial/Technical
  workshop: "Taller",
  garage: "Garaje",
  printing: "Imprenta",
  laundry: "Lavandería",
  // Other
  other: "Otro",
};

export function isValidCommercialActivity(
  value: unknown,
): value is CommercialActivity {
  return (
    typeof value === "string" &&
    COMMERCIAL_ACTIVITY_VALUES.includes(value as CommercialActivity)
  );
}
