/**
 * Contact Activity Details Type Definitions
 *
 * Defines the exact structure of the `details` JSON field for each
 * contactActivity action. This ensures type safety and consistency when
 * logging contact lifecycle events and GDPR compliance actions.
 *
 * Note: This tracks contact master record changes only. Listing-specific
 * interactions are tracked in listingContactActivity table.
 *
 * Scope: CRITICAL priority actions only (7 total)
 */

// ============================================================================
// CONTACT LIFECYCLE (3 actions)
// ============================================================================

export interface ContactCreatedDetails {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  source: string; // How contact was acquired (e.g., "Website", "Walk-In", "Referral", "Portal")
  channel?:
    | "website"
    | "phone"
    | "email"
    | "walk-in"
    | "portal"
    | "referral"
    | "social_media"
    | "event"
    | "other";
  createdBy: string; // User ID who created contact
  campaign?: string; // Marketing campaign if applicable
  referrer?: string; // Person/entity who referred
  utmParams?: {
    // Web tracking parameters
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  initialNotes?: string;
  accountId: number; // FK to accounts (multi-tenant)
}

export interface ContactDeactivatedDetails {
  deactivationDate: string; // ISO timestamp
  reason:
    | "gdpr_request"
    | "deceased"
    | "moved_away"
    | "duplicate"
    | "request"
    | "inactive"
    | "data_quality"
    | "other";
  reasonDetail?: string; // Additional context
  deactivatedBy: string; // User ID who deactivated
  previousStatus?: string; // What was contact status before
  dataRetained: boolean; // Is data kept in system?
  retentionPeriod?: number; // Days until permanent deletion (if applicable)
  relatedRecords?: {
    // What happens to related data
    listings?: "keep" | "anonymize" | "delete";
    deals?: "keep" | "anonymize" | "delete";
    appointments?: "keep" | "anonymize" | "delete";
  };
  reactivationPossible: boolean; // Can contact be reactivated?
}

export interface ContactMergedDetails {
  mergedFromContactId: number; // Contact that was merged (now inactive)
  mergedFromName: string; // Name of merged contact
  mergedToContactId: number; // Primary contact kept (this record)
  mergedToName: string; // Name of primary contact
  mergeDate: string; // ISO timestamp
  reason: string; // Why contacts were merged
  duplicateDetectionMethod:
    | "manual"
    | "email_match"
    | "phone_match"
    | "name_match"
    | "ai_detection";
  similarityScore?: number; // 0-100 if algorithmically detected
  dataPreserved: {
    // Which fields were kept from merged contact
    fromMerged: string[]; // Fields taken from merged record
    fromPrimary: string[]; // Fields kept from primary record
    combined?: string[]; // Fields that were merged together
  };
  conflictsResolved?: Array<{
    field: string;
    mergedValue: string;
    primaryValue: string;
    chosenValue: string;
    reason: string;
  }>;
  relatedRecordsTransferred: {
    // What was moved to primary contact
    listings?: number; // Count of listings transferred
    deals?: number; // Count of deals transferred
    appointments?: number; // Count of appointments transferred
    documents?: number; // Count of documents transferred
  };
  mergedBy: string; // User ID who performed merge
  reversible: boolean; // Can this merge be undone?
}

// ============================================================================
// GDPR & COMPLIANCE (4 actions)
// ============================================================================

export interface ConsentGivenDetails {
  consentType:
    | "marketing_email"
    | "marketing_sms"
    | "marketing_whatsapp"
    | "marketing_phone"
    | "marketing_all"
    | "data_processing"
    | "third_party_sharing";
  consentDate: string; // ISO timestamp
  consentMethod:
    | "web_form"
    | "email_confirmation"
    | "verbal"
    | "written_form"
    | "checkbox"
    | "double_opt_in"
    | "other";
  ipAddress?: string; // IP address when consent given (for web)
  userAgent?: string; // Browser/device info (for web)
  consentText?: string; // Exact wording shown to user
  consentVersion?: string; // Version of privacy policy/terms
  witness?: string; // Person who witnessed (for verbal/written)
  documentReference?: string; // Document ID if signed form
  source?: string; // Where consent was obtained
  scope?: string[]; // What consent covers
  expiryDate?: string; // ISO date if consent has expiration
}

export interface ConsentWithdrawnDetails {
  consentType:
    | "marketing_email"
    | "marketing_sms"
    | "marketing_whatsapp"
    | "marketing_phone"
    | "marketing_all"
    | "data_processing"
    | "third_party_sharing";
  withdrawalDate: string; // ISO timestamp
  withdrawalMethod:
    | "unsubscribe_link"
    | "email_request"
    | "phone_request"
    | "written_request"
    | "web_portal"
    | "in_person"
    | "other";
  reason?: string; // Why consent was withdrawn (optional)
  reasonCategory?:
    | "too_frequent"
    | "not_relevant"
    | "privacy_concerns"
    | "no_longer_interested"
    | "moved"
    | "other";
  ipAddress?: string; // IP if done via web
  processedBy?: string; // User ID who processed withdrawal
  confirmationSent: boolean; // Was confirmation sent to contact?
  confirmationMethod?: "email" | "sms" | "letter" | "none";
  effectiveDate: string; // ISO date when withdrawal takes effect
  impactedCampaigns?: string[]; // Campaigns they'll be removed from
}

export interface DoNotContactSetDetails {
  setDate: string; // ISO timestamp
  reason:
    | "explicit_request"
    | "complaint"
    | "harassment_claim"
    | "legal_requirement"
    | "deceased"
    | "other";
  reasonDetail?: string; // Additional context
  scope: "all" | "email" | "phone" | "sms" | "whatsapp" | "mail"; // What channels are blocked
  requestedBy: "contact" | "agent" | "compliance" | "legal" | "system";
  requestMethod?:
    | "email"
    | "phone"
    | "letter"
    | "in_person"
    | "lawyer"
    | "complaint"
    | "other";
  legalBasis?: string; // Legal reason if applicable
  permanent: boolean; // Is this permanent or temporary?
  expiryDate?: string; // ISO date if temporary
  exceptions?: string[]; // Exceptions (e.g., "transactional emails only")
  processedBy: string; // User ID who set flag
  confirmationSent: boolean;
  auditTrail?: string; // Reference to supporting documentation
  complianceVerified: boolean; // Has compliance team verified?
}

export interface GdprDataExportRequestedDetails {
  requestDate: string; // ISO timestamp
  requestMethod: "email" | "phone" | "letter" | "web_portal" | "in_person";
  requestedBy: string; // Name of person requesting (usually contact themselves)
  verificationRequired: boolean; // Does identity need verification?
  verificationMethod?:
    | "photo_id"
    | "passport"
    | "security_questions"
    | "email_confirmation"
    | "other";
  verificationCompleted?: boolean;
  verificationDate?: string; // ISO timestamp
  legalDeadline: string; // ISO date (30 days from request per GDPR Article 15)
  dataScope: "full" | "partial"; // Full export or specific data
  dataTypesRequested?: string[]; // If partial: specific data types
  format?: "pdf" | "csv" | "json" | "xml"; // Export format requested
  deliveryMethod: "email" | "mail" | "in_person" | "secure_download";
  status: "pending" | "in_progress" | "completed" | "rejected";
  assignedTo?: string; // User ID responsible for fulfilling
  completedDate?: string; // ISO timestamp when fulfilled
  deliveryDate?: string; // ISO timestamp when delivered
  rejectionReason?: string; // If rejected (e.g., "unable to verify identity")
  notes?: string;
}

// ============================================================================
// UNION TYPE FOR ALL DETAILS
// ============================================================================

/**
 * Union type of all possible contact activity detail structures
 */
export type ContactActivityDetails =
  // Lifecycle
  | ContactCreatedDetails
  | ContactDeactivatedDetails
  | ContactMergedDetails
  // GDPR
  | ConsentGivenDetails
  | ConsentWithdrawnDetails
  | DoNotContactSetDetails
  | GdprDataExportRequestedDetails;

// ============================================================================
// MAPPING: ACTION → DETAILS TYPE
// ============================================================================

/**
 * Maps each action to its corresponding details type
 * Useful for type narrowing and validation
 */
export interface ContactActivityDetailsMap {
  // Lifecycle
  contact_created: ContactCreatedDetails;
  contact_deactivated: ContactDeactivatedDetails;
  contact_merged: ContactMergedDetails;
  // GDPR
  consent_given: ConsentGivenDetails;
  consent_withdrawn: ConsentWithdrawnDetails;
  do_not_contact_set: DoNotContactSetDetails;
  gdpr_data_export_requested: GdprDataExportRequestedDetails;
}
