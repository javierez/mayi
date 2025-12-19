/**
 * Listing Contact Activity Details Type Definitions
 *
 * Defines the exact structure of the `details` JSON field for each
 * listingContactActivity action. This ensures type safety and consistency
 * when logging buyer/lead interactions and journey.
 */

// ============================================================================
// BASE TYPES
// ============================================================================

// Common contact info pattern (for reference - not exported)
// Many details include contact information with this structure

// ============================================================================
// EXISTING ACTIONS
// ============================================================================

export interface StatusChangedDetails {
  oldStatus: string;
  newStatus: string;
  reason?: string;
  qualificationCriteria?: {
    budgetMatch?: boolean;
    timelineMatch?: boolean;
    financingReady?: boolean;
    propertyMatch?: "low" | "medium" | "high";
  };
  score?: number; // Lead score (0-100)
  nextAction?: string; // Recommended next step
}

export interface OfferReceivedDetails {
  amount: number;
  listingPrice: number;
  percentOfAsking: number; // e.g., 95.74
  offerType: "firm" | "contingent" | "verbal";
  conditions?: string[]; // e.g., ["Financing contingency (30 days)"]
  expiryDate?: string; // ISO timestamp
  depositAmount?: number;
  closeDate?: string; // ISO timestamp
  notes?: string;
  presentedToSeller: boolean;
}

export interface OfferAcceptedDetails {
  finalAmount: number;
  originalListing: number;
  discount: number; // Amount discounted
  discountPercent: number; // Percentage discount
  offerNumber: number; // Which offer iteration was accepted
  negotiationDuration?: number; // Hours spent negotiating
  conditions: string[]; // Accepted conditions
  depositAmount: number;
  depositDueDate: string; // ISO date
  expectedCloseDate: string; // ISO date
  dealCreated: boolean;
  dealId?: number;
}

export interface OfferRejectedDetails {
  rejectedAmount: number;
  listingPrice: number;
  offerNumber: number;
  reason: string; // Why offer was rejected
  rejectedBy: "seller" | "buyer" | "agent";
  counterOfferMade: boolean;
  counterOfferAmount?: number;
  negotiationEnded: boolean; // Is negotiation completely over?
}

export interface AppointmentScheduledDetails {
  appointmentId: number;
  appointmentDate: string; // ISO timestamp
  appointmentType: "viewing" | "valuation" | "signing" | "meeting" | "other";
  location?: string;
  duration?: number; // Minutes
  attendees?: string[]; // Names of attendees
  notes?: string;
  reminderSent?: boolean;
}

// ============================================================================
// CONTACT MANAGEMENT
// ============================================================================

export interface ContactAssignedDetails {
  contactId: number;
  contactName: string;
  contactType: "buyer" | "owner" | "viewer";
  source: string; // e.g., "Website", "Walk-In", "Referral"
  initialInterest?: "low" | "medium" | "high";
  budget?: number;
  notes?: string;
}

export interface ContactTypeChangedDetails {
  oldType: "buyer" | "owner" | "viewer";
  newType: "buyer" | "owner" | "viewer";
  reason: string;
  implications?: string; // What this change means
}

export interface ContactMergedDetails {
  mergedFromContactId: number;
  mergedFromName: string;
  mergedToContactId: number;
  mergedToName: string;
  reason: string; // Why they were duplicates
  dataPreserved: string[]; // Which fields were kept from merged contact
}

// ============================================================================
// COMMUNICATION TRACKING
// ============================================================================

export interface CallLoggedDetails {
  direction: "inbound" | "outbound";
  phoneNumber?: string; // Optional - already in contact record
  duration: number; // Seconds
  outcome: "interested" | "not_interested" | "callback" | "no_answer" | "voicemail";
  interestLevel?: 1 | 2 | 3 | 4 | 5;
  appointmentScheduled?: boolean;
  appointmentId?: number;
  concerns?: string[]; // Issues raised by contact
  nextSteps?: string;
  recordingUrl?: string; // Call recording URL if available
  // Fotocasa-specific fields
  notes?: string;
  topic?: string;
  activityType?: string;
  isPending?: boolean;
  createdAt?: string;
  fotocasaLeadId?: string;
}

export interface EmailSentDetails {
  emailType: "initial_contact" | "follow_up" | "appointment_reminder" | "offer_response" | "document_request" | "other";
  subject: string;
  to: string;
  cc?: string[];
  bcc?: string[];
  template?: string; // Template name if using template
  attachments?: string[]; // Filenames
  opened?: boolean;
  openedAt?: string; // ISO timestamp
  clicked?: boolean;
  clickedLinks?: string[];
  deliveryStatus: "sent" | "delivered" | "bounced" | "failed";
}

export interface WhatsAppSentDetails {
  messageType: "info" | "follow_up" | "reminder" | "appointment_confirmation" | "offer_update";
  phoneNumber: string;
  content: string; // Message content
  delivered: boolean;
  deliveredAt?: string; // ISO timestamp
  read?: boolean;
  readAt?: string; // ISO timestamp
  replied?: boolean;
  reply?: string;
  repliedAt?: string; // ISO timestamp
}

export interface MessageReceivedDetails {
  channel?: "email" | "phone" | "whatsapp" | "portal" | "sms" | "other"; // Optional - can infer from context
  from?: string; // Optional - already in contact record
  content?: string; // Message content (optional - Fotocasa uses notes instead)
  sentiment?: "positive" | "neutral" | "negative";
  urgency?: "low" | "normal" | "high";
  requiresResponse?: boolean; // Optional - can infer from context
  responseDeadline?: string; // ISO timestamp
  relatedTo?: string; // Optional - can infer from listing_contact
  // Fotocasa-specific fields
  notes?: string; // For Fotocasa: contains the message content
  topic?: string;
  activityType?: string;
  isPending?: boolean;
  createdAt?: string;
  fotocasaLeadId?: string;
}

// ============================================================================
// VIEWING & APPOINTMENTS
// ============================================================================

export interface ViewingCompletedDetails {
  appointmentId: number;
  attended: boolean;
  duration?: number; // Minutes
  attendees?: string[]; // Who attended
  interestLevel: 1 | 2 | 3 | 4 | 5;
  feedback: {
    liked?: string[]; // What they liked
    disliked?: string[]; // What they didn't like
    concerns?: string[]; // Their concerns
  };
  willMakeOffer?: "yes" | "no" | "maybe" | "likely";
  nextSteps?: string;
  agentNotes?: string;
}

export interface AppointmentCancelledDetails {
  appointmentId: number;
  appointmentDate: string; // ISO timestamp
  reason: string;
  cancelledBy: "contact" | "agent" | "system";
  noticeHours: number; // How many hours notice was given
  rescheduled: boolean;
  newAppointmentId?: number;
  newAppointmentDate?: string; // ISO timestamp
  noShowPenalty?: boolean;
}

export interface AppointmentRescheduledDetails {
  appointmentId: number;
  oldDate: string; // ISO timestamp
  newDate: string; // ISO timestamp
  reason: string;
  requestedBy: "contact" | "agent";
  noticeHours: number;
  confirmed: boolean;
}

export interface ViewingFeedbackReceivedDetails {
  appointmentId: number;
  viewingDate: string; // ISO timestamp
  interestLevel: 1 | 2 | 3 | 4 | 5;
  liked: string[];
  disliked: string[];
  concerns: string[];
  questions: string[];
  comparisons?: string[]; // Other properties they're comparing to
  decisionTimeline?: string; // When they expect to decide
  nextSteps: string;
}

// ============================================================================
// OFFER & NEGOTIATION
// ============================================================================

export interface CounterOfferMadeDetails {
  originalOffer: number;
  counterOffer: number;
  offerNumber: number; // Which iteration (1, 2, 3...)
  sellerResponse?: string; // Seller's explanation
  conditions: string[];
  expiryDate?: string; // ISO timestamp
  notes?: string;
  gap: number; // Difference between offers
  gapPercent: number; // Percentage difference
}

export interface OfferExpiredDetails {
  offerAmount: number;
  offerNumber: number;
  expiryDate: string; // ISO timestamp
  wasExtended: boolean;
  extensionOffered: boolean;
  buyerResponse?: "withdrew" | "renewed" | "no_response";
  nextSteps?: string;
}

export interface FinancingStatusUpdatedDetails {
  oldStatus: "not_needed" | "pending" | "pre_approved" | "approved" | "denied";
  newStatus: "not_needed" | "pending" | "pre_approved" | "approved" | "denied";
  bankName?: string;
  loanAmount?: number;
  downPayment?: number;
  loanToValue?: number; // Percentage
  interestRate?: number;
  approvalDate?: string; // ISO timestamp
  expiryDate?: string; // ISO timestamp for pre-approvals
  conditions?: string[];
  notes?: string;
}

// ============================================================================
// LEAD QUALIFICATION
// ============================================================================

export interface InterestLevelUpdatedDetails {
  oldLevel: "cold" | "warm" | "hot";
  newLevel: "cold" | "warm" | "hot";
  score: {
    old: number; // 0-100
    new: number; // 0-100
  };
  reason: string;
  indicators?: string[]; // What indicated the change
  predictedCloseDate?: string; // ISO date
  closeProbability?: number; // Percentage (0-100)
}

export interface DisqualifiedDetails {
  reason: "budget" | "timeline" | "requirements" | "unresponsive" | "found_other" | "other";
  oldStatus: string;
  newStatus: string;
  elaboration: string; // Detailed explanation
  attempts: number; // How many contact attempts were made
  lastContact?: string; // ISO timestamp
  suggestedAlternatives?: number[]; // Other listing IDs suggested
  keepInDatabase: boolean;
  futureOpportunity?: string; // When to re-engage
}

export interface SourceIdentifiedDetails {
  source: "Website" | "Fotocasa" | "Idealista" | "Walk-In" | "Referral" | "Social Media" | "Other";
  referrer?: string; // Person or entity that referred
  campaign?: string; // Marketing campaign
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  verificationMethod: "asked_directly" | "tracking_code" | "referral_link" | "inferred";
}

// ============================================================================
// DEAL PROGRESSION
// ============================================================================

export interface DealCreatedDetails {
  dealId: number;
  dealAmount: number;
  expectedCloseDate: string; // ISO date
  dealStage: string; // Initial stage
  commissionAmount?: number;
  commissionPercent?: number;
  depositAmount?: number;
  notes?: string;
}

export interface DocumentRequestedDetails {
  documentType: "id" | "income_proof" | "pre_approval" | "deposit_proof" | "other";
  deadline: string; // ISO date
  received: boolean;
  requestMethod: "email" | "phone" | "in_person" | "portal";
  urgency: "low" | "normal" | "high";
  notes?: string;
}

export interface DocumentReceivedDetails {
  documentType: "id" | "income_proof" | "pre_approval" | "deposit_proof" | "other";
  documentId?: number; // If uploaded to documents table
  receivedDate: string; // ISO timestamp
  verified: boolean;
  verifiedBy?: string; // Agent who verified
  issuesFound?: string[];
  acceptableForClosing: boolean;
  notes?: string;
}

// ============================================================================
// FOLLOW-UP & TASKS
// ============================================================================

export interface FollowUpScheduledDetails {
  dueDate: string; // ISO date
  dueTime?: string; // Time of day
  taskType: "call" | "email" | "meeting" | "document_check" | "other";
  priority: "low" | "normal" | "high" | "urgent";
  notes?: string;
  taskId?: number; // If task was created
  reminderSet?: boolean;
}

export interface FollowUpCompletedDetails {
  taskId?: number;
  completedDate: string; // ISO timestamp
  outcome: "successful" | "no_response" | "rescheduled" | "cancelled";
  notes?: string;
  nextFollowUp?: string; // ISO date for next follow-up
  nextFollowUpType?: string;
}

export interface NotesAddedDetails {
  category?: "general" | "offer" | "viewing" | "negotiation" | "follow_up" | "internal";
  content: string;
  visibility: "internal" | "shared"; // Internal only or shared with team
  tags?: string[];
  relatedTo?: {
    entityType?: "appointment" | "offer" | "document" | "call";
    entityId?: number;
  };
}

// ============================================================================
// PROPERTY MATCHING
// ============================================================================

export interface MatchScoreUpdatedDetails {
  score: number; // 0-100
  previousScore?: number;
  reasons: string[]; // Why this score was assigned
  competingListings?: number[]; // Other listing IDs they might be interested in
  strengths: string[]; // What matches well
  weaknesses: string[]; // What doesn't match
  recommendation: string; // Agent recommendation
}

export interface AlternativeSuggestedDetails {
  suggestedListingId: number;
  suggestedListingAddress?: string;
  suggestedListingPrice?: number;
  reason: string; // Why this alternative is better
  matchScore?: number;
  currentListingId: number;
  comparisonNotes?: string;
  contactInterested?: boolean;
}

// ============================================================================
// UNION TYPE FOR ALL DETAILS
// ============================================================================

/**
 * Union type of all possible listing contact activity detail structures
 */
export type ListingContactActivityDetails =
  // Existing
  | StatusChangedDetails
  | OfferReceivedDetails
  | OfferAcceptedDetails
  | OfferRejectedDetails
  | AppointmentScheduledDetails
  // Contact Management
  | ContactAssignedDetails
  | ContactTypeChangedDetails
  | ContactMergedDetails
  // Communication
  | CallLoggedDetails
  | EmailSentDetails
  | WhatsAppSentDetails
  | MessageReceivedDetails
  // Viewing
  | ViewingCompletedDetails
  | AppointmentCancelledDetails
  | AppointmentRescheduledDetails
  | ViewingFeedbackReceivedDetails
  // Negotiation
  | CounterOfferMadeDetails
  | OfferExpiredDetails
  | FinancingStatusUpdatedDetails
  // Qualification
  | InterestLevelUpdatedDetails
  | DisqualifiedDetails
  | SourceIdentifiedDetails
  // Deal Progression
  | DealCreatedDetails
  | DocumentRequestedDetails
  | DocumentReceivedDetails
  // Follow-up
  | FollowUpScheduledDetails
  | FollowUpCompletedDetails
  | NotesAddedDetails
  // Matching
  | MatchScoreUpdatedDetails
  | AlternativeSuggestedDetails;

// ============================================================================
// MAPPING: ACTION → DETAILS TYPE
// ============================================================================

/**
 * Maps each action to its corresponding details type
 * Useful for type narrowing and validation
 */
export interface ListingContactActivityDetailsMap {
  // Existing
  status_changed: StatusChangedDetails;
  offer_received: OfferReceivedDetails;
  offer_accepted: OfferAcceptedDetails;
  offer_rejected: OfferRejectedDetails;
  appointment_scheduled: AppointmentScheduledDetails;
  // Contact Management
  contact_assigned: ContactAssignedDetails;
  contact_type_changed: ContactTypeChangedDetails;
  contact_merged: ContactMergedDetails;
  // Communication
  call_logged: CallLoggedDetails;
  email_sent: EmailSentDetails;
  whatsapp_sent: WhatsAppSentDetails;
  message_received: MessageReceivedDetails;
  // Viewing
  viewing_completed: ViewingCompletedDetails;
  appointment_cancelled: AppointmentCancelledDetails;
  appointment_rescheduled: AppointmentRescheduledDetails;
  viewing_feedback_received: ViewingFeedbackReceivedDetails;
  // Negotiation
  counter_offer_made: CounterOfferMadeDetails;
  offer_expired: OfferExpiredDetails;
  financing_status_updated: FinancingStatusUpdatedDetails;
  // Qualification
  interest_level_updated: InterestLevelUpdatedDetails;
  disqualified: DisqualifiedDetails;
  source_identified: SourceIdentifiedDetails;
  // Deal Progression
  deal_created: DealCreatedDetails;
  document_requested: DocumentRequestedDetails;
  document_received: DocumentReceivedDetails;
  // Follow-up
  follow_up_scheduled: FollowUpScheduledDetails;
  follow_up_completed: FollowUpCompletedDetails;
  notes_added: NotesAddedDetails;
  // Matching
  match_score_updated: MatchScoreUpdatedDetails;
  alternative_suggested: AlternativeSuggestedDetails;
}
