/**
 * Contact Source Types
 * Defines the possible sources/origins for contacts in the system
 */

export const CONTACT_SOURCES = [
  "email",
  "phone",
  "idealista",
  "fotocasa",
  "aliseda",
  "visita_oficina",
  "servihabitat",
  "otra_inmob",
  "pagina_web",
] as const;

export type ContactSource = (typeof CONTACT_SOURCES)[number];

/**
 * Spanish labels for contact sources (for UI display)
 */
export const CONTACT_SOURCE_LABELS: Record<ContactSource, string> = {
  email: "Email",
  phone: "Teléfono",
  idealista: "Idealista",
  fotocasa: "Fotocasa",
  aliseda: "Aliseda",
  visita_oficina: "Visita Oficina",
  servihabitat: "Servihabitat",
  otra_inmob: "Otra Inmob.",
  pagina_web: "Página web",
};
