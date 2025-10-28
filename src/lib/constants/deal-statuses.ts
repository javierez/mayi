/**
 * Deal Status Constants
 * Defines the statuses available for deals in the CRM
 */

export const DEAL_STATUSES = [
  "Offer",
  "UnderContract",
  "Closed",
  "Lost",
] as const;

export type DealStatus = (typeof DEAL_STATUSES)[number];

/**
 * Spanish translations for deal statuses
 */
export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  Offer: "Oferta",
  UnderContract: "Bajo Contrato",
  Closed: "Cerrado",
  Lost: "Perdido",
};

/**
 * Tailwind CSS classes for deal status badges
 */
export const DEAL_STATUS_COLORS: Record<DealStatus, string> = {
  Offer: "bg-amber-100 text-amber-800 border-amber-200",
  UnderContract: "bg-blue-100 text-blue-800 border-blue-200",
  Closed: "bg-green-100 text-green-800 border-green-200",
  Lost: "bg-gray-100 text-gray-800 border-gray-200",
};

/**
 * Icons for each deal status (lucide-react icon names)
 */
export const DEAL_STATUS_ICONS: Record<DealStatus, string> = {
  Offer: "FileText",
  UnderContract: "FileSignature",
  Closed: "CheckCircle",
  Lost: "XCircle",
};
