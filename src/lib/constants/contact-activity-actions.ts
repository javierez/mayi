/**
 * Contact Activity Action Constants
 *
 * Defines all critical actions that can be tracked in the contactActivity table.
 * These actions log important contact-level lifecycle events and GDPR compliance.
 *
 * Note: listingContactActivity tracks contact interactions with specific listings.
 * This contactActivity table tracks the contact master record lifecycle only.
 *
 * Scope: CRITICAL priority actions only (7 total)
 */

// ============================================================================
// CONTACT ACTIVITY ACTIONS (CRITICAL PRIORITY ONLY)
// ============================================================================

export const CONTACT_ACTIVITY_ACTIONS = [
  // === Contact Lifecycle (3 actions) ===
  "contact_created", // New contact added to system
  "contact_deactivated", // Contact marked inactive
  "contact_merged", // Duplicate contact consolidated

  // === GDPR & Compliance (4 actions) ===
  "consent_given", // Marketing/communication consent granted
  "consent_withdrawn", // Marketing/communication consent revoked
  "do_not_contact_set", // Contact requests no communication
  "gdpr_data_export_requested", // Contact requests their data (GDPR Article 15)
] as const;

export type ContactActivityAction = (typeof CONTACT_ACTIVITY_ACTIONS)[number];

// ============================================================================
// ACTION CATEGORIES
// ============================================================================

/**
 * Groups actions by category for filtering and display purposes
 */
export const CONTACT_ACTIVITY_CATEGORIES = {
  LIFECYCLE: ["contact_created", "contact_deactivated", "contact_merged"],
  GDPR: [
    "consent_given",
    "consent_withdrawn",
    "do_not_contact_set",
    "gdpr_data_export_requested",
  ],
} as const;

// ============================================================================
// ACTION METADATA
// ============================================================================

/**
 * Human-readable labels for each action (Spanish)
 */
export const CONTACT_ACTIVITY_LABELS: Record<ContactActivityAction, string> = {
  // Lifecycle
  contact_created: "Contacto creado",
  contact_deactivated: "Contacto desactivado",
  contact_merged: "Contacto fusionado",

  // GDPR
  consent_given: "Consentimiento otorgado",
  consent_withdrawn: "Consentimiento retirado",
  do_not_contact_set: "No contactar establecido",
  gdpr_data_export_requested: "Exportación de datos solicitada (GDPR)",
};

/**
 * Priority levels for each action (all CRITICAL since this is filtered list)
 */
export const CONTACT_ACTIVITY_PRIORITY: Record<
  ContactActivityAction,
  "critical"
> = {
  // Lifecycle - all critical
  contact_created: "critical",
  contact_deactivated: "critical",
  contact_merged: "critical",

  // GDPR - all critical
  consent_given: "critical",
  consent_withdrawn: "critical",
  do_not_contact_set: "critical",
  gdpr_data_export_requested: "critical",
};

/**
 * Indicates which actions should trigger notifications to agents/compliance team
 */
export const CONTACT_ACTIVITY_NOTIFIABLE: Record<
  ContactActivityAction,
  boolean
> = {
  // Lifecycle
  contact_created: false, // Too frequent, no notification needed
  contact_deactivated: false, // Informational only
  contact_merged: true, // Important data integrity action

  // GDPR - all notifiable for compliance
  consent_given: false, // Positive action, no alert needed
  consent_withdrawn: true, // Must ensure compliance
  do_not_contact_set: true, // Must ensure immediate compliance
  gdpr_data_export_requested: true, // Legal deadline (30 days)
};

/**
 * Indicates which actions are GDPR-related (for compliance reporting)
 */
export const CONTACT_ACTIVITY_GDPR_RELATED: Record<
  ContactActivityAction,
  boolean
> = {
  // Lifecycle
  contact_created: false,
  contact_deactivated: false,
  contact_merged: false,

  // GDPR
  consent_given: true,
  consent_withdrawn: true,
  do_not_contact_set: true,
  gdpr_data_export_requested: true,
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a string is a valid ContactActivityAction
 */
export function isContactActivityAction(
  action: string,
): action is ContactActivityAction {
  return (CONTACT_ACTIVITY_ACTIONS as readonly string[]).includes(action);
}

/**
 * Validates an action and returns it typed, or throws an error
 */
export function validateContactActivityAction(
  action: string,
): ContactActivityAction {
  if (!isContactActivityAction(action)) {
    throw new Error(
      `Invalid contact activity action: ${action}. Must be one of: ${CONTACT_ACTIVITY_ACTIONS.join(", ")}`,
    );
  }
  return action;
}
