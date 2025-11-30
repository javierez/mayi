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

  // === Fotocasa Portal Actions ===
  "fotocasa_published", // POST success - listing published to Fotocasa
  "fotocasa_updated", // PUT success - listing updated on Fotocasa
  "fotocasa_deleted", // DELETE success - listing removed from Fotocasa

  // === Idealista Portal Actions ===
  "idealista_published", // Listing enabled for Idealista export
  "idealista_updated", // Listing settings updated for Idealista
  "idealista_deleted", // Listing disabled from Idealista
  "idealista_exported", // Listing included in FTP export

  // === Portal Selection Toggles ===
  "website_published", // publishToWebsite set to true
  "website_unpublished", // publishToWebsite set to false
  "keys_returned", // hasKeys set to false
  "cartel_placed", // hasCartel set to true
  "cartel_removed", // hasCartel set to false
  "escaparate_added", // enEscaparate set to true
  "escaparate_removed", // enEscaparate set to false

  // === Progress Stage Actions ===
  "listing_created", // Alta - listing created (10%)
  "ficha_completed", // Ficha Completa - all mandatory fields complete (24%)
  "encargo_signed", // Encargo firmado - mandate signed (43%)
  "offer_accepted", // Oferta aceptada - offer accepted (60%)
  "arras_signed", // Arras firmadas - deposit contract signed (73%)
  "escritura_signed", // Escritura firmada - deed signed (93%)
  "deal_closed", // Cierre final - deal closed (100%)
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
  FOTOCASA: ["fotocasa_published", "fotocasa_updated", "fotocasa_deleted"],
  IDEALISTA: [
    "idealista_published",
    "idealista_updated",
    "idealista_deleted",
    "idealista_exported",
  ],
  PORTAL_TOGGLES: [
    "website_published",
    "website_unpublished",
    "keys_returned",
    "cartel_placed",
    "cartel_removed",
    "escaparate_added",
    "escaparate_removed",
  ],
  PROGRESS_STAGES: [
    "listing_created",
    "ficha_completed",
    "encargo_signed",
    "offer_accepted",
    "arras_signed",
    "escritura_signed",
    "deal_closed",
  ],
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

  // Fotocasa
  fotocasa_published: "Publicado en Fotocasa",
  fotocasa_updated: "Actualizado en Fotocasa",
  fotocasa_deleted: "Eliminado de Fotocasa",

  // Idealista
  idealista_published: "Activado para Idealista",
  idealista_updated: "Actualizado en Idealista",
  idealista_deleted: "Desactivado de Idealista",
  idealista_exported: "Exportado a Idealista",

  // Portal Toggles
  website_published: "Publicado en web",
  website_unpublished: "Despublicado de web",
  keys_returned: "Llaves devueltas",
  cartel_placed: "Cartel colocado",
  cartel_removed: "Cartel retirado",
  escaparate_added: "Añadido a escaparate",
  escaparate_removed: "Retirado de escaparate",

  // Progress Stages
  listing_created: "Alta de propiedad",
  ficha_completed: "Ficha completa",
  encargo_signed: "Encargo firmado",
  offer_accepted: "Oferta aceptada",
  arras_signed: "Arras firmadas",
  escritura_signed: "Escritura firmada",
  deal_closed: "Cierre final",
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

  // Fotocasa
  fotocasa_published: "high",
  fotocasa_updated: "normal",
  fotocasa_deleted: "high",

  // Idealista
  idealista_published: "high",
  idealista_updated: "normal",
  idealista_deleted: "high",
  idealista_exported: "normal",

  // Portal Toggles
  website_published: "normal",
  website_unpublished: "normal",
  keys_returned: "high",
  cartel_placed: "normal",
  cartel_removed: "normal",
  escaparate_added: "normal",
  escaparate_removed: "normal",

  // Progress Stages
  listing_created: "normal",
  ficha_completed: "normal",
  encargo_signed: "high",
  offer_accepted: "critical",
  arras_signed: "critical",
  escritura_signed: "critical",
  deal_closed: "critical",
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
