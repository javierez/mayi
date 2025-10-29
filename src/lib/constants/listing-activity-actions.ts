/**
 * Listing Activity Action Constants
 *
 * Defines all possible actions that can be tracked in the listingActivity table.
 * These actions log important changes and events related to property listings.
 */

// ============================================================================
// LISTING ACTIVITY ACTIONS
// ============================================================================

export const LISTING_ACTIVITY_ACTIONS = [
  // === Existing Actions (Currently Implemented) ===
  "price_changed",
  "status_changed",
  "portal_published",
  "portal_unpublished",

  // === Content & Marketing ===
  "description_changed", // AI regeneration or manual edits
  "images_updated", // Photos added/removed/reordered
  "featured_toggled", // isFeatured changed

  // === Property Changes ===
  "agent_reassigned", // agentId changed (critical for commission tracking)
  "listing_type_changed", // Sale → Rent, etc.
  "specifications_updated", // Bedrooms, bathrooms, features modified
  "keys_received", // hasKeys toggled to true

  // === Visibility & Publication ===
  "visibility_changed", // visibilityMode updated (1=Exact, 2=Street, 3=Zone)
  "website_publication_toggled", // publishToWebsite changed
  "activated", // isActive set to true
  "deactivated", // isActive set to false

  // === Portal Sync ===
  "portal_sync_error", // Failed to sync to portal (Fotocasa, Idealista, etc.)
  "portal_settings_updated", // Portal-specific props changed

  // === Analytics & Performance ===
  "views_milestone", // Every 100 views or significant milestones
  "inquiry_received", // inquiryCount increment

  // === Documents & Media ===
  "document_uploaded", // Important documents added
  "virtual_tour_added", // 360° tour or video link added
] as const;

export type ListingActivityAction = (typeof LISTING_ACTIVITY_ACTIONS)[number];

// ============================================================================
// ACTION CATEGORIES
// ============================================================================

/**
 * Groups actions by category for filtering and display purposes
 */
export const LISTING_ACTIVITY_CATEGORIES = {
  EXISTING: [
    "price_changed",
    "status_changed",
    "portal_published",
    "portal_unpublished",
  ],
  CONTENT_MARKETING: [
    "description_changed",
    "images_updated",
    "featured_toggled",
  ],
  PROPERTY_CHANGES: [
    "agent_reassigned",
    "listing_type_changed",
    "specifications_updated",
    "keys_received",
  ],
  VISIBILITY: [
    "visibility_changed",
    "website_publication_toggled",
    "activated",
    "deactivated",
  ],
  PORTAL_SYNC: ["portal_sync_error", "portal_settings_updated"],
  ANALYTICS: ["views_milestone", "inquiry_received"],
  DOCUMENTS: ["document_uploaded", "virtual_tour_added"],
} as const;

// ============================================================================
// ACTION METADATA
// ============================================================================

/**
 * Human-readable labels for each action (Spanish)
 */
export const LISTING_ACTIVITY_LABELS: Record<ListingActivityAction, string> = {
  // Existing
  price_changed: "Precio modificado",
  status_changed: "Estado cambiado",
  portal_published: "Publicado en portal",
  portal_unpublished: "Despublicado de portal",

  // Content & Marketing
  description_changed: "Descripción modificada",
  images_updated: "Imágenes actualizadas",
  featured_toggled: "Estado destacado cambiado",

  // Property Changes
  agent_reassigned: "Agente reasignado",
  listing_type_changed: "Tipo de operación cambiado",
  specifications_updated: "Especificaciones actualizadas",
  keys_received: "Llaves recibidas",

  // Visibility
  visibility_changed: "Visibilidad cambiada",
  website_publication_toggled: "Publicación web cambiada",
  activated: "Activado",
  deactivated: "Desactivado",

  // Portal Sync
  portal_sync_error: "Error de sincronización portal",
  portal_settings_updated: "Configuración portal actualizada",

  // Analytics
  views_milestone: "Hito de visualizaciones",
  inquiry_received: "Consulta recibida",

  // Documents
  document_uploaded: "Documento subido",
  virtual_tour_added: "Tour virtual añadido",
};

/**
 * Priority levels for each action (used for notifications and filtering)
 */
export const LISTING_ACTIVITY_PRIORITY: Record<
  ListingActivityAction,
  "low" | "normal" | "high" | "critical"
> = {
  // Existing
  price_changed: "high",
  status_changed: "high",
  portal_published: "normal",
  portal_unpublished: "normal",

  // Content & Marketing
  description_changed: "normal",
  images_updated: "normal",
  featured_toggled: "normal",

  // Property Changes
  agent_reassigned: "critical",
  listing_type_changed: "high",
  specifications_updated: "normal",
  keys_received: "high",

  // Visibility
  visibility_changed: "normal",
  website_publication_toggled: "normal",
  activated: "high",
  deactivated: "high",

  // Portal Sync
  portal_sync_error: "critical",
  portal_settings_updated: "low",

  // Analytics
  views_milestone: "low",
  inquiry_received: "high",

  // Documents
  document_uploaded: "normal",
  virtual_tour_added: "normal",
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a string is a valid ListingActivityAction
 */
export function isListingActivityAction(
  action: string,
): action is ListingActivityAction {
  return (LISTING_ACTIVITY_ACTIONS as readonly string[]).includes(action);
}

/**
 * Validates an action and returns it typed, or throws an error
 */
export function validateListingActivityAction(
  action: string,
): ListingActivityAction {
  if (!isListingActivityAction(action)) {
    throw new Error(
      `Invalid listing activity action: ${action}. Must be one of: ${LISTING_ACTIVITY_ACTIONS.join(", ")}`,
    );
  }
  return action;
}
