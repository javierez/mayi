/**
 * Deal Status Constants
 * Defines the statuses available for deals in the CRM
 */

/**
 * Database deal statuses (used in deals.status field)
 */
export const DEAL_STATUSES_DB = [
  "Offer",
  "Arras Pending",
  "UnderContract",
  "Closed",
  "Lost",
] as const;

export type DealStatusDB = (typeof DEAL_STATUSES_DB)[number];

/**
 * Derived deal statuses (calculated from dates for display)
 * These are used in the OperacionesSummaryCard based on deal dates:
 * - Oferta Aceptada: Deal exists (offer was accepted)
 * - Arras Firmadas: arrasDate is set
 * - Contrato Firmado: actualDeedDate is set
 * - Cerrado: closeDate is set
 * - Perdido: status = 'Lost'
 */
export const DEAL_STATUSES_DERIVED = [
  "Oferta Aceptada",
  "Arras Firmadas",
  "Contrato Firmado",
  "Cerrado",
  "Perdido",
] as const;

export type DealStatusDerived = (typeof DEAL_STATUSES_DERIVED)[number];

// Legacy export for backwards compatibility
export const DEAL_STATUSES = DEAL_STATUSES_DB;
export type DealStatus = DealStatusDB;

/**
 * Spanish translations for database deal statuses
 */
export const DEAL_STATUS_LABELS: Record<DealStatusDB, string> = {
  Offer: "Oferta Aceptada",
  "Arras Pending": "Arras Pendientes",
  UnderContract: "Arras Firmadas",
  Closed: "Cerrado",
  Lost: "Perdido",
};

/**
 * Tailwind CSS classes for deal status badges
 */
export const DEAL_STATUS_COLORS: Record<DealStatusDB, string> = {
  Offer: "bg-amber-100 text-amber-800 border-amber-200",
  "Arras Pending": "bg-orange-100 text-orange-800 border-orange-200",
  UnderContract: "bg-blue-100 text-blue-800 border-blue-200",
  Closed: "bg-green-100 text-green-800 border-green-200",
  Lost: "bg-gray-100 text-gray-800 border-gray-200",
};

/**
 * Tailwind CSS classes for derived deal status badges
 */
export const DEAL_STATUS_DERIVED_COLORS: Record<DealStatusDerived, string> = {
  "Oferta Aceptada": "bg-amber-100 text-amber-800 border-amber-200",
  "Arras Firmadas": "bg-blue-100 text-blue-800 border-blue-200",
  "Contrato Firmado": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Cerrado": "bg-green-100 text-green-800 border-green-200",
  "Perdido": "bg-gray-100 text-gray-800 border-gray-200",
};

/**
 * Icons for each deal status (lucide-react icon names)
 */
export const DEAL_STATUS_ICONS: Record<DealStatusDB, string> = {
  Offer: "FileText",
  "Arras Pending": "Clock",
  UnderContract: "FileSignature",
  Closed: "CheckCircle",
  Lost: "XCircle",
};
