/**
 * Listing Contact Activity Action Constants
 *
 * Defines all possible actions that can be tracked in the listingContactActivity table.
 * These actions log the buyer/lead journey and all interactions with contacts
 * interested in specific listings.
 */

// ============================================================================
// LISTING CONTACT ACTIVITY ACTIONS
// ============================================================================

export const LISTING_CONTACT_ACTIVITY_ACTIONS = [
  // === Existing Actions (Currently Implemented) ===
  "status_changed",
  "offer_received",
  "offer_accepted",
  "offer_rejected",
  "appointment_scheduled",

  // === Contact Management ===
  "contact_assigned", // Initial association with listing
  "contact_type_changed", // Role changed (buyer → viewer, etc.)
  "contact_merged", // Duplicate contact consolidated

  // === Communication Tracking ===
  "call_logged", // Phone conversation recorded
  "email_sent", // Email communication
  "whatsapp_sent", // WhatsApp message
  "message_received", // Inbound communication from contact

  // === Viewing & Appointments ===
  "viewing_completed", // After appointment completion
  "appointment_cancelled", // No-show or cancellation
  "appointment_rescheduled", // Date changed
  "viewing_feedback_received", // Post-viewing notes

  // === Offer & Negotiation ===
  "counter_offer_made", // Negotiation in progress
  "offer_expired", // Time-limited offer expired
  "financing_status_updated", // Mortgage pre-approval status

  // === Lead Qualification ===
  "interest_level_updated", // Hot/warm/cold classification
  "disqualified", // Lead marked as not viable
  "source_identified", // Lead source determined

  // === Deal Progression ===
  "deal_created", // Moved to deal stage
  "document_requested", // Agent requests paperwork
  "document_received", // Contact submits documents

  // === Follow-up & Tasks ===
  "follow_up_scheduled", // Reminder set
  "follow_up_completed", // Reminder done
  "notes_added", // Important observation recorded

  // === Property Matching ===
  "match_score_updated", // AI matching algorithm result
  "alternative_suggested", // Agent recommends different property
] as const;

export type ListingContactActivityAction =
  (typeof LISTING_CONTACT_ACTIVITY_ACTIONS)[number];

// ============================================================================
// ACTION CATEGORIES
// ============================================================================

/**
 * Groups actions by category for filtering and display purposes
 */
export const LISTING_CONTACT_ACTIVITY_CATEGORIES = {
  EXISTING: [
    "status_changed",
    "offer_received",
    "offer_accepted",
    "offer_rejected",
    "appointment_scheduled",
  ],
  CONTACT_MANAGEMENT: [
    "contact_assigned",
    "contact_type_changed",
    "contact_merged",
  ],
  COMMUNICATION: [
    "call_logged",
    "email_sent",
    "whatsapp_sent",
    "message_received",
  ],
  VIEWING: [
    "viewing_completed",
    "appointment_cancelled",
    "appointment_rescheduled",
    "viewing_feedback_received",
  ],
  NEGOTIATION: [
    "counter_offer_made",
    "offer_expired",
    "financing_status_updated",
  ],
  QUALIFICATION: [
    "interest_level_updated",
    "disqualified",
    "source_identified",
  ],
  DEAL_PROGRESSION: [
    "deal_created",
    "document_requested",
    "document_received",
  ],
  FOLLOW_UP: ["follow_up_scheduled", "follow_up_completed", "notes_added"],
  MATCHING: ["match_score_updated", "alternative_suggested"],
} as const;

// ============================================================================
// ACTION METADATA
// ============================================================================

/**
 * Human-readable labels for each action (Spanish)
 */
export const LISTING_CONTACT_ACTIVITY_LABELS: Record<
  ListingContactActivityAction,
  string
> = {
  // Existing
  status_changed: "Estado cambiado",
  offer_received: "Oferta recibida",
  offer_accepted: "Oferta aceptada",
  offer_rejected: "Oferta rechazada",
  appointment_scheduled: "Cita programada",

  // Contact Management
  contact_assigned: "Contacto asignado",
  contact_type_changed: "Tipo de contacto cambiado",
  contact_merged: "Contacto fusionado",

  // Communication
  call_logged: "Llamada registrada",
  email_sent: "Email enviado",
  whatsapp_sent: "WhatsApp enviado",
  message_received: "Mensaje recibido",

  // Viewing
  viewing_completed: "Visita completada",
  appointment_cancelled: "Cita cancelada",
  appointment_rescheduled: "Cita reprogramada",
  viewing_feedback_received: "Feedback de visita recibido",

  // Negotiation
  counter_offer_made: "Contraoferta realizada",
  offer_expired: "Oferta expirada",
  financing_status_updated: "Estado de financiación actualizado",

  // Qualification
  interest_level_updated: "Nivel de interés actualizado",
  disqualified: "Descalificado",
  source_identified: "Fuente identificada",

  // Deal Progression
  deal_created: "Operación creada",
  document_requested: "Documento solicitado",
  document_received: "Documento recibido",

  // Follow-up
  follow_up_scheduled: "Seguimiento programado",
  follow_up_completed: "Seguimiento completado",
  notes_added: "Notas añadidas",

  // Matching
  match_score_updated: "Puntuación de coincidencia actualizada",
  alternative_suggested: "Alternativa sugerida",
};

/**
 * Priority levels for each action (used for notifications and filtering)
 */
export const LISTING_CONTACT_ACTIVITY_PRIORITY: Record<
  ListingContactActivityAction,
  "low" | "normal" | "high" | "critical"
> = {
  // Existing
  status_changed: "normal",
  offer_received: "critical",
  offer_accepted: "critical",
  offer_rejected: "high",
  appointment_scheduled: "high",

  // Contact Management
  contact_assigned: "normal",
  contact_type_changed: "low",
  contact_merged: "low",

  // Communication
  call_logged: "high",
  email_sent: "normal",
  whatsapp_sent: "normal",
  message_received: "high",

  // Viewing
  viewing_completed: "high",
  appointment_cancelled: "high",
  appointment_rescheduled: "normal",
  viewing_feedback_received: "high",

  // Negotiation
  counter_offer_made: "critical",
  offer_expired: "high",
  financing_status_updated: "critical",

  // Qualification
  interest_level_updated: "normal",
  disqualified: "normal",
  source_identified: "low",

  // Deal Progression
  deal_created: "critical",
  document_requested: "high",
  document_received: "high",

  // Follow-up
  follow_up_scheduled: "normal",
  follow_up_completed: "low",
  notes_added: "low",

  // Matching
  match_score_updated: "low",
  alternative_suggested: "normal",
};

/**
 * Indicates which actions should trigger notifications to the agent
 */
export const LISTING_CONTACT_ACTIVITY_NOTIFIABLE: Record<
  ListingContactActivityAction,
  boolean
> = {
  // Existing
  status_changed: true,
  offer_received: true,
  offer_accepted: true,
  offer_rejected: true,
  appointment_scheduled: true,

  // Contact Management
  contact_assigned: true,
  contact_type_changed: false,
  contact_merged: false,

  // Communication
  call_logged: false,
  email_sent: false,
  whatsapp_sent: false,
  message_received: true,

  // Viewing
  viewing_completed: true,
  appointment_cancelled: true,
  appointment_rescheduled: true,
  viewing_feedback_received: true,

  // Negotiation
  counter_offer_made: true,
  offer_expired: true,
  financing_status_updated: true,

  // Qualification
  interest_level_updated: false,
  disqualified: false,
  source_identified: false,

  // Deal Progression
  deal_created: true,
  document_requested: false,
  document_received: true,

  // Follow-up
  follow_up_scheduled: false,
  follow_up_completed: false,
  notes_added: false,

  // Matching
  match_score_updated: false,
  alternative_suggested: false,
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a string is a valid ListingContactActivityAction
 */
export function isListingContactActivityAction(
  action: string,
): action is ListingContactActivityAction {
  return (LISTING_CONTACT_ACTIVITY_ACTIONS as readonly string[]).includes(
    action,
  );
}

/**
 * Validates an action and returns it typed, or throws an error
 */
export function validateListingContactActivityAction(
  action: string,
): ListingContactActivityAction {
  if (!isListingContactActivityAction(action)) {
    throw new Error(
      `Invalid listing contact activity action: ${action}. Must be one of: ${LISTING_CONTACT_ACTIVITY_ACTIONS.join(", ")}`,
    );
  }
  return action;
}
