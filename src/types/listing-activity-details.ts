
/**
 * Listing Activity Details Type Definitions
 *
 * Defines the exact structure of the `details` JSON field for each
 * listingActivity action. This ensures type safety and consistency
 * when logging activities.
 */

// ============================================================================
// BASE TYPES
// ============================================================================

// Common fields pattern (not exported - used as reference for consistency)
// Many details follow this pattern: { field, oldValue, newValue, reason }

// ============================================================================
// EXISTING ACTIONS
// ============================================================================

export interface PriceChangedDetails {
  field: "price";
  oldValue: number;
  newValue: number;
  percentChange: number; // e.g., -6.0 for 6% reduction
  changeType: "reduction" | "increase" | "correction";
  updatedBy: string; // User ID of the agent who made the change
  reason?: string;
  daysActive?: number; // How many days the listing has been active
}

export interface StatusChangedDetails {
  field: "status";
  oldStatus: string; // e.g., "En Venta"
  newStatus: string; // e.g., "Vendido"
  reason?: string;
  dealId?: number; // If status changed due to deal closing
  salePrice?: number; // Final sale price if sold
  daysToSell?: number; // Days from listing to sale
}

export interface PortalPublishedDetails {
  portal: "fotocasa" | "idealista" | "habitaclia" | "pisoscom" | "yaencontre" | "milanuncios";
  published: boolean;
  portalListingId?: string; // External portal listing ID
  visibilityMode?: 1 | 2 | 3; // 1=Exact, 2=Street, 3=Zone
  hidePrice?: boolean;
  publicationDate: string; // ISO timestamp
  expiryDate?: string; // ISO timestamp
  cost?: number; // Publication cost in euros
}

export interface PortalUnpublishedDetails {
  portal: "fotocasa" | "idealista" | "habitaclia" | "pisoscom" | "yaencontre" | "milanuncios";
  published: boolean;
  unpublishedDate: string; // ISO timestamp
  reason?: "expired" | "manual" | "sold" | "error" | "other";
  notes?: string;
}

// ============================================================================
// CONTENT & MARKETING
// ============================================================================

export interface DescriptionChangedDetails {
  method: "ai" | "manual";
  oldLength: number; // Character count
  newLength: number; // Character count
  prompt?: string; // AI prompt if method === "ai"
  model?: string; // AI model used (e.g., "gpt-4")
  language?: string; // e.g., "es", "en"
  reviewedByAgent?: boolean; // Was AI output reviewed?
}

export interface ImagesUpdatedDetails {
  operation: "added" | "removed" | "reordered";
  imageIds?: number[]; // Array of property_image_id
  count: number; // Number of images affected
  totalImages: number; // Total images after operation
  imageTypes?: string[]; // e.g., ["living_room", "kitchen"]
  photographer?: string; // Photographer name/company
}

export interface FeaturedToggledDetails {
  field: "isFeatured";
  oldValue: boolean;
  newValue: boolean;
  reason?: string; // Why it was featured/unfeatured
  featuredUntil?: string; // ISO timestamp for temporary featured
}

// ============================================================================
// PROPERTY CHANGES
// ============================================================================

export interface AgentReassignedDetails {
  field: "agentId";
  oldAgentId: string;
  oldAgentName: string;
  newAgentId: string;
  newAgentName: string;
  reason: string; // Required - explain why agent changed
  commissionImpact?: string; // e.g., "Split 50/50 if sold within 60 days"
}

export interface ListingTypeChangedDetails {
  field: "listingType";
  oldType: "Sale" | "Rent" | "Sold" | "Transfer" | "RentWithOption" | "RoomSharing";
  newType: "Sale" | "Rent" | "Sold" | "Transfer" | "RentWithOption" | "RoomSharing";
  reason: string;
  priceAdjusted?: boolean; // Was price changed accordingly?
  newPrice?: number;
}

export interface SpecificationsUpdatedDetails {
  field: string; // e.g., "bedrooms", "bathrooms", "squareMeter"
  oldValue: unknown;
  newValue: unknown;
  reason?: string;
  verificationSource?: string; // e.g., "cadastre", "owner_confirmation", "inspection"
}

export interface KeysReceivedDetails {
  field: "hasKeys";
  oldValue: boolean;
  newValue: boolean;
  receivedFrom: string; // Who provided the keys
  keyCount?: number; // Number of keys/key sets
  keyType?: "original" | "copy" | "electronic";
  location?: string; // Where keys are stored (e.g., "Office safe - Drawer B3")
  notes?: string;
}

// ============================================================================
// VISIBILITY & PUBLICATION
// ============================================================================

export interface VisibilityChangedDetails {
  field: "visibilityMode";
  oldMode: 1 | 2 | 3; // 1=Exact, 2=Street, 3=Zone
  newMode: 1 | 2 | 3;
  reason?: string; // Why visibility was changed
  requestedBy?: "owner" | "agent" | "legal";
}

export interface WebsitePublicationToggledDetails {
  field: "publishToWebsite";
  oldValue: boolean;
  newValue: boolean;
  reason?: string;
  publishedDate?: string; // ISO timestamp
}

export interface ActivatedDetails {
  field: "isActive";
  oldValue: false;
  newValue: true;
  reason?: string;
  previousStatus?: string; // What was the status before deactivation
}

export interface DeactivatedDetails {
  field: "isActive";
  oldValue: true;
  newValue: false;
  reason: string; // Required - why was it deactivated
  willReactivate?: boolean; // Temporary deactivation?
  reactivationDate?: string; // ISO timestamp
}

// ============================================================================
// PORTAL SYNC
// ============================================================================

export interface PortalSyncErrorDetails {
  portal: "fotocasa" | "idealista" | "habitaclia" | "pisoscom" | "yaencontre" | "milanuncios";
  operation: "publish" | "update_price" | "update_description" | "update_images" | "unpublish";
  errorCode: string; // e.g., "INVALID_CREDENTIALS", "RATE_LIMIT"
  errorMessage: string;
  attemptNumber: number; // Which retry attempt
  willRetry: boolean;
  nextRetryAt?: string; // ISO timestamp
  stackTrace?: string; // For debugging
}

export interface PortalSettingsUpdatedDetails {
  portal: "fotocasa" | "idealista" | "habitaclia" | "pisoscom" | "yaencontre" | "milanuncios";
  changedFields: string[]; // e.g., ["visibilityMode", "hidePrice"]
  newSettings: Record<string, unknown>; // Portal-specific settings
  previousSettings?: Record<string, unknown>;
}

// ============================================================================
// ANALYTICS & PERFORMANCE
// ============================================================================

export interface ViewsMilestoneDetails {
  viewCount: number; // Current view count
  milestone: number; // e.g., 100, 200, 500
  daysActive: number; // Days since listing creation
  averageViewsPerDay: number;
  previousMilestone?: number;
}

export interface InquiryReceivedDetails {
  source: "website" | "portal" | "phone" | "email" | "walk-in" | "other";
  contactInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  message?: string; // Inquiry message
  propertyInterest?: string; // What they're interested in
  newContact: boolean; // Is this a new contact or existing?
  contactId?: number; // If contact was created/identified
}

// ============================================================================
// DOCUMENTS & MEDIA
// ============================================================================

export interface DocumentUploadedDetails {
  documentId: number;
  documentType: "energy_certificate" | "deed" | "floor_plan" | "cadastral" | "contract" | "inspection" | "other";
  filename: string;
  fileSize: number; // Bytes
  s3Key: string;
  expiryDate?: string; // ISO timestamp for documents with expiry
  rating?: string; // e.g., energy certificate rating "A", "B", etc.
  verified?: boolean; // Document has been verified by agent
}

export interface VirtualTourAddedDetails {
  url: string; // Virtual tour URL
  provider?: string; // e.g., "Matterport", "YouTube", "Custom"
  type?: "360_photo" | "video" | "3d_model";
  embedCode?: string; // For embedding
  thumbnailUrl?: string;
}

// ============================================================================
// FOTOCASA PORTAL ACTIONS
// ============================================================================

export interface FotocasaPublishedDetails {
  visibilityMode: 1 | 2 | 3; // 1=Exact, 2=Street, 3=Zone
  hidePrice: boolean;
  publicationDate: string; // ISO timestamp
}

export interface FotocasaUpdatedDetails {
  updateDate: string; // ISO timestamp
  visibilityMode?: 1 | 2 | 3;
  hidePrice?: boolean;
}

export interface FotocasaDeletedDetails {
  deletedDate: string; // ISO timestamp
}

// ============================================================================
// PORTAL SELECTION TOGGLES
// ============================================================================

export interface WebsitePublishedDetails {
  publishedDate: string; // ISO timestamp
}

export interface WebsiteUnpublishedDetails {
  unpublishedDate: string; // ISO timestamp
}

export interface KeysReturnedDetails {
  returnedDate: string; // ISO timestamp
}

export interface CartelPlacedDetails {
  placedDate: string; // ISO timestamp
}

export interface CartelRemovedDetails {
  removedDate: string; // ISO timestamp
}

export interface EscaparateAddedDetails {
  addedDate: string; // ISO timestamp
}

export interface EscaparateRemovedDetails {
  removedDate: string; // ISO timestamp
}

// ============================================================================
// UNION TYPE FOR ALL DETAILS
// ============================================================================

/**
 * Union type of all possible activity detail structures
 */
export type ListingActivityDetails =
  // Existing
  | PriceChangedDetails
  | StatusChangedDetails
  | PortalPublishedDetails
  | PortalUnpublishedDetails
  // Content & Marketing
  | DescriptionChangedDetails
  | ImagesUpdatedDetails
  | FeaturedToggledDetails
  // Property Changes
  | AgentReassignedDetails
  | ListingTypeChangedDetails
  | SpecificationsUpdatedDetails
  | KeysReceivedDetails
  // Visibility
  | VisibilityChangedDetails
  | WebsitePublicationToggledDetails
  | ActivatedDetails
  | DeactivatedDetails
  // Portal Sync
  | PortalSyncErrorDetails
  | PortalSettingsUpdatedDetails
  // Analytics
  | ViewsMilestoneDetails
  | InquiryReceivedDetails
  // Documents
  | DocumentUploadedDetails
  | VirtualTourAddedDetails
  // Fotocasa
  | FotocasaPublishedDetails
  | FotocasaUpdatedDetails
  | FotocasaDeletedDetails
  // Portal Toggles
  | WebsitePublishedDetails
  | WebsiteUnpublishedDetails
  | KeysReturnedDetails
  | CartelPlacedDetails
  | CartelRemovedDetails
  | EscaparateAddedDetails
  | EscaparateRemovedDetails;

// ============================================================================
// MAPPING: ACTION → DETAILS TYPE
// ============================================================================

/**
 * Maps each action to its corresponding details type
 * Useful for type narrowing and validation
 */
export interface ListingActivityDetailsMap {
  // Existing
  price_changed: PriceChangedDetails;
  status_changed: StatusChangedDetails;
  portal_published: PortalPublishedDetails;
  portal_unpublished: PortalUnpublishedDetails;
  // Content & Marketing
  description_changed: DescriptionChangedDetails;
  images_updated: ImagesUpdatedDetails;
  featured_toggled: FeaturedToggledDetails;
  // Property Changes
  agent_reassigned: AgentReassignedDetails;
  listing_type_changed: ListingTypeChangedDetails;
  specifications_updated: SpecificationsUpdatedDetails;
  keys_received: KeysReceivedDetails;
  // Visibility
  visibility_changed: VisibilityChangedDetails;
  website_publication_toggled: WebsitePublicationToggledDetails;
  activated: ActivatedDetails;
  deactivated: DeactivatedDetails;
  // Portal Sync
  portal_sync_error: PortalSyncErrorDetails;
  portal_settings_updated: PortalSettingsUpdatedDetails;
  // Analytics
  views_milestone: ViewsMilestoneDetails;
  inquiry_received: InquiryReceivedDetails;
  // Documents
  document_uploaded: DocumentUploadedDetails;
  virtual_tour_added: VirtualTourAddedDetails;
  // Fotocasa
  fotocasa_published: FotocasaPublishedDetails;
  fotocasa_updated: FotocasaUpdatedDetails;
  fotocasa_deleted: FotocasaDeletedDetails;
  // Portal Toggles
  website_published: WebsitePublishedDetails;
  website_unpublished: WebsiteUnpublishedDetails;
  keys_returned: KeysReturnedDetails;
  cartel_placed: CartelPlacedDetails;
  cartel_removed: CartelRemovedDetails;
  escaparate_added: EscaparateAddedDetails;
  escaparate_removed: EscaparateRemovedDetails;
}
