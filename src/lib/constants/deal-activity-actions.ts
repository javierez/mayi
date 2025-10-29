/**
 * Deal Activity Action Constants
 *
 * Defines all critical actions that can be tracked in the dealActivity table.
 * These actions log important changes and events throughout the real estate
 * transaction lifecycle from offer through closing or cancellation.
 *
 * Scope: CRITICAL priority actions only (18 total)
 */

// ============================================================================
// DEAL ACTIVITY ACTIONS (CRITICAL PRIORITY ONLY)
// ============================================================================

export const DEAL_ACTIVITY_ACTIONS = [
  // === Lifecycle & Status (5 actions) ===
  "deal_created", // Deal entry into system
  "status_changed", // Deal progression through stages
  "deal_closed", // Successful transaction completion
  "deal_cancelled", // Deal falls through
  "deal_reactivated", // Previously cancelled deal reopened

  // === Financial Tracking (3 actions) ===
  "price_changed", // finalPrice modified
  "commission_paid", // Commission disbursed to agents
  "arras_received", // Deposit payment received

  // === Timeline & Milestones (5 actions) ===
  "arras_contract_signed", // Deposit contract executed
  "deed_date_scheduled", // Closing date set
  "deed_date_changed", // Closing date modified
  "deed_signed", // Ownership transfer completed
  "keys_transferred", // Physical possession transferred

  // === Workflow Status (2 actions) ===
  "financing_status_changed", // Mortgage approval status updated
  "contingencies_cleared", // All contingencies satisfied

  // === Cancellation & Failure (2 actions) ===
  "arras_forfeited", // Deposit kept by seller
  "deadline_missed", // Contract deadline passed without completion

  // === Parties (1 action) ===
  "agent_assigned", // Listing/selling agent assigned
] as const;

export type DealActivityAction = (typeof DEAL_ACTIVITY_ACTIONS)[number];

// ============================================================================
// ACTION CATEGORIES
// ============================================================================

/**
 * Groups actions by category for filtering and display purposes
 */
export const DEAL_ACTIVITY_CATEGORIES = {
  LIFECYCLE: [
    "deal_created",
    "status_changed",
    "deal_closed",
    "deal_cancelled",
    "deal_reactivated",
  ],
  FINANCIAL: ["price_changed", "commission_paid", "arras_received"],
  TIMELINE: [
    "arras_contract_signed",
    "deed_date_scheduled",
    "deed_date_changed",
    "deed_signed",
    "keys_transferred",
  ],
  WORKFLOW: ["financing_status_changed", "contingencies_cleared"],
  CANCELLATION: ["arras_forfeited", "deadline_missed"],
  PARTIES: ["agent_assigned"],
} as const;

// ============================================================================
// ACTION METADATA
// ============================================================================

/**
 * Human-readable labels for each action (Spanish)
 */
export const DEAL_ACTIVITY_LABELS: Record<DealActivityAction, string> = {
  // Lifecycle
  deal_created: "Operación creada",
  status_changed: "Estado cambiado",
  deal_closed: "Operación cerrada",
  deal_cancelled: "Operación cancelada",
  deal_reactivated: "Operación reactivada",

  // Financial
  price_changed: "Precio final modificado",
  commission_paid: "Comisión pagada",
  arras_received: "Arras recibidas",

  // Timeline
  arras_contract_signed: "Contrato de arras firmado",
  deed_date_scheduled: "Fecha de escritura programada",
  deed_date_changed: "Fecha de escritura modificada",
  deed_signed: "Escritura firmada",
  keys_transferred: "Llaves entregadas",

  // Workflow
  financing_status_changed: "Estado de financiación cambiado",
  contingencies_cleared: "Contingencias resueltas",

  // Cancellation
  arras_forfeited: "Arras perdidas",
  deadline_missed: "Plazo incumplido",

  // Parties
  agent_assigned: "Agente asignado",
};

/**
 * Priority levels for each action (all CRITICAL since this is filtered list)
 */
export const DEAL_ACTIVITY_PRIORITY: Record<
  DealActivityAction,
  "critical" | "high"
> = {
  // Lifecycle - all critical
  deal_created: "critical",
  status_changed: "critical",
  deal_closed: "critical",
  deal_cancelled: "critical",
  deal_reactivated: "critical",

  // Financial - all critical
  price_changed: "critical",
  commission_paid: "critical",
  arras_received: "critical",

  // Timeline - all critical
  arras_contract_signed: "critical",
  deed_date_scheduled: "critical",
  deed_date_changed: "high",
  deed_signed: "critical",
  keys_transferred: "critical",

  // Workflow - all critical
  financing_status_changed: "critical",
  contingencies_cleared: "critical",

  // Cancellation - all critical
  arras_forfeited: "critical",
  deadline_missed: "critical",

  // Parties - critical
  agent_assigned: "critical",
};

/**
 * Indicates which actions should trigger notifications to agents/managers
 */
export const DEAL_ACTIVITY_NOTIFIABLE: Record<DealActivityAction, boolean> = {
  // Lifecycle
  deal_created: true,
  status_changed: true,
  deal_closed: true,
  deal_cancelled: true,
  deal_reactivated: true,

  // Financial
  price_changed: true,
  commission_paid: true,
  arras_received: true,

  // Timeline
  arras_contract_signed: true,
  deed_date_scheduled: true,
  deed_date_changed: true,
  deed_signed: true,
  keys_transferred: true,

  // Workflow
  financing_status_changed: true,
  contingencies_cleared: true,

  // Cancellation
  arras_forfeited: true,
  deadline_missed: true,

  // Parties
  agent_assigned: true,
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a string is a valid DealActivityAction
 */
export function isDealActivityAction(
  action: string,
): action is DealActivityAction {
  return (DEAL_ACTIVITY_ACTIONS as readonly string[]).includes(action);
}

/**
 * Validates an action and returns it typed, or throws an error
 */
export function validateDealActivityAction(action: string): DealActivityAction {
  if (!isDealActivityAction(action)) {
    throw new Error(
      `Invalid deal activity action: ${action}. Must be one of: ${DEAL_ACTIVITY_ACTIONS.join(", ")}`,
    );
  }
  return action;
}
