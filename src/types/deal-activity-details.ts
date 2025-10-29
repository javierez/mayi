/**
 * Deal Activity Details Type Definitions
 *
 * Defines the exact structure of the `details` JSON field for each
 * dealActivity action. This ensures type safety and consistency when
 * logging deal lifecycle events, financial milestones, and transaction progress.
 *
 * Scope: CRITICAL priority actions only (18 total)
 */

// ============================================================================
// LIFECYCLE & STATUS (5 actions)
// ============================================================================

export interface DealCreatedDetails {
  listingId: number;
  listingContactId?: number; // FK to listing_contacts if applicable
  initialStatus: string; // e.g., "Offer", "Arras Pending"
  finalPrice: number; // Initial deal price
  commissionAmount?: number; // Estimated commission
  commissionPercentage?: number; // Commission %
  source?: string; // How deal originated
  createdBy: string; // User ID who created deal
  notes?: string;
}

export interface StatusChangedDetails {
  oldStatus: string; // Previous stage value
  newStatus: string; // New stage value
  reason?: string; // Why status changed
  daysInPreviousStatus?: number; // Time spent in old status
  milestone?: string; // If this is a significant milestone
  automatedChange?: boolean; // Was this auto-triggered?
}

export interface DealClosedDetails {
  closingDate: string; // ISO timestamp of actual closing
  finalPrice: number; // Final sale/rental price
  commissionAmount: number; // Actual commission earned
  commissionPaid?: boolean; // Was commission disbursed?
  daysToClose: number; // Days from deal creation to close
  notary?: string; // Notary name
  deedNumber?: string; // Escritura number
  registrySubmitted?: boolean; // Submitted to property registry?
  celebrationNotes?: string; // Success notes
}

export interface DealCancelledDetails {
  cancellationDate: string; // ISO timestamp
  reason: string; // Required - detailed reason
  reasonCategory?:
    | "financing_failed"
    | "inspection_issues"
    | "buyer_withdrew"
    | "seller_withdrew"
    | "title_issues"
    | "contingency_not_met"
    | "other";
  faultParty: "buyer" | "seller" | "both" | "external" | "none";
  stageWhenCancelled: string; // Deal status when cancelled
  daysActive: number; // How long deal was active
  arrasDisposition?: "returned_to_buyer" | "kept_by_seller" | "split";
  arrasAmount?: number; // Amount of deposit involved
  preventable: boolean; // Could this have been prevented?
  lessonsLearned?: string; // Post-mortem notes
}

export interface DealReactivatedDetails {
  reactivationDate: string; // ISO timestamp
  reason: string; // Why deal was reopened
  previousCancellationReason: string; // Why it was cancelled before
  previousCancellationDate: string; // ISO timestamp
  changesMade?: string; // What changed to make deal viable
  newTerms?: {
    priceAdjustment?: number;
    newContingencies?: string[];
    extendedTimeline?: boolean;
  };
  reactivatedBy: string; // User ID
}

// ============================================================================
// FINANCIAL TRACKING (3 actions)
// ============================================================================

export interface PriceChangedDetails {
  field: "finalPrice";
  oldPrice: number;
  newPrice: number;
  difference: number; // newPrice - oldPrice
  percentChange: number; // Percentage change
  changeType: "increase" | "decrease" | "correction";
  reason: string; // Required - why price changed
  commissionImpact?: {
    oldCommission: number;
    newCommission: number;
    difference: number;
  };
  approvedBy?: string; // User ID who approved change
}

export interface CommissionPaidDetails {
  amount: number; // Total commission paid
  paymentDate: string; // ISO timestamp
  paymentMethod: "bank_transfer" | "check" | "cash" | "other";
  recipients: Array<{
    agentId: string;
    agentName: string;
    role: "listing_agent" | "selling_agent";
    amount: number;
    percentage: number;
  }>;
  invoiceNumber?: string;
  taxWithheld?: number; // Tax withheld amount
  netPaid: number; // Amount after taxes
  notes?: string;
}

export interface ArrasReceivedDetails {
  amount: number; // Deposit amount in euros
  arrasType: "confirmatorias" | "penitenciales"; // Legal type
  paymentDate: string; // ISO timestamp
  paymentMethod: "bank_transfer" | "check" | "cash" | "banker_check";
  receiptNumber?: string; // Receipt/transaction ID
  payerName: string; // Who paid (usually buyer)
  depositedTo?: string; // Bank account or escrow
  contractReference?: string; // Reference to arras contract
}

// ============================================================================
// TIMELINE & MILESTONES (5 actions)
// ============================================================================

export interface ArrasContractSignedDetails {
  signingDate: string; // ISO timestamp
  location: string; // Where contract was signed
  partiesPresent: string[]; // Names of people who attended
  notary?: string; // Notary name if applicable
  arrasAmount: number; // Deposit amount
  arrasType: "confirmatorias" | "penitenciales";
  contractTerms?: {
    deedDeadline?: string; // ISO date
    contingencies?: string[];
    specialConditions?: string[];
  };
  witnessedBy?: string; // Witness name
  contractCopy?: string; // Document ID or S3 key
}

export interface DeedDateScheduledDetails {
  scheduledDate: string; // ISO timestamp
  notaryId?: number; // FK to contacts/organizations
  notaryName: string; // Notary name
  notaryLocation: string; // Office address
  expectedAttendees: string[]; // Who should attend
  daysUntilDeed: number; // Days from now
  documentsNeeded?: string[]; // Checklist of required docs
  estimatedDuration?: number; // Minutes
}

export interface DeedDateChangedDetails {
  oldDate: string; // ISO timestamp
  newDate: string; // ISO timestamp
  daysDifference: number; // How many days moved
  direction: "earlier" | "later";
  reason: string; // Required - why date changed
  impact: "minor" | "moderate" | "severe"; // Impact on deal
  partiesNotified: string[]; // Who was informed
  requestedBy: "buyer" | "seller" | "bank" | "notary" | "agent";
  approved: boolean;
}

export interface DeedSignedDetails {
  signingDate: string; // ISO timestamp - actual signing date
  notaryId?: number;
  notaryName: string;
  notaryLocation: string;
  partiesPresent: string[]; // Who attended
  deedNumber: string; // Official escritura number
  registrySubmitted: boolean; // Submitted to property registry?
  registrySubmissionDate?: string; // ISO date
  finalPrice: number; // Final agreed price
  taxesPaid?: number; // ITP or IVA paid
  registryFees?: number;
  notaryFees?: number;
  celebrationNotes?: string;
}

export interface KeysTransferredDetails {
  transferDate: string; // ISO timestamp
  location: string; // Where keys were handed over
  transferredTo: string; // Recipient name (usually buyer)
  transferredBy: string; // Who handed over (usually seller/agent)
  witness?: string; // Witness present
  keyCount: number; // Number of keys/key sets
  keyTypes: string[]; // e.g., ["front_door", "garage", "mailbox"]
  inventoryChecklist?: {
    appliances?: boolean;
    furniture?: boolean;
    condition?: "excellent" | "good" | "fair" | "poor";
    issues?: string[];
  };
  documentation?: string; // Document ID for signed handover form
}

// ============================================================================
// WORKFLOW STATUS (2 actions)
// ============================================================================

export interface FinancingStatusChangedDetails {
  oldStatus:
    | "not_needed"
    | "pending"
    | "pre_approved"
    | "approved"
    | "denied"
    | null;
  newStatus:
    | "not_needed"
    | "pending"
    | "pre_approved"
    | "approved"
    | "denied";
  bankId?: number; // FK to organizations
  bankName?: string;
  loanAmount?: number;
  downPayment?: number;
  loanToValue?: number; // Percentage
  interestRate?: number;
  approvalDate?: string; // ISO timestamp
  expiryDate?: string; // ISO timestamp (for pre-approvals)
  conditions?: string[]; // Conditions for approval
  denialReason?: string; // If denied
  impact: "positive" | "neutral" | "negative"; // Impact on deal
}

export interface ContingenciesClearedDetails {
  clearanceDate: string; // ISO timestamp
  contingenciesCleared: Array<{
    contingencyType: string; // e.g., "financing", "inspection", "sale_of_other_property"
    clearanceDate: string; // ISO date
    outcome: "satisfied" | "waived" | "removed";
    notes?: string;
  }>;
  remainingContingencies?: string[]; // If any left
  allClear: boolean; // Are ALL contingencies now cleared?
  nextSteps?: string; // What happens now
}

// ============================================================================
// CANCELLATION & FAILURE (2 actions)
// ============================================================================

export interface ArrasForfeitedDetails {
  amount: number; // Amount forfeited
  forfeitureDate: string; // ISO timestamp
  reason: string; // Why deposit was forfeited
  faultParty: "buyer" | "seller"; // Who caused forfeiture
  legalBasis: "penitenciales" | "confirmatorias_breach"; // Legal justification
  disposition: "kept_by_seller" | "split" | "disputed";
  arrasType: "confirmatorias" | "penitenciales";
  disputeStatus?: "no_dispute" | "disputed" | "in_arbitration" | "resolved";
  legalAdviceObtained?: boolean;
  documentationReference?: string; // Contract clause or legal doc
}

export interface DeadlineMissedDetails {
  deadlineType:
    | "financing_deadline"
    | "contingency_expiration"
    | "arras_signing"
    | "deed_date"
    | "document_submission"
    | "inspection"
    | "other";
  originalDate: string; // ISO timestamp - when deadline was
  missedDate: string; // ISO timestamp - when deadline passed
  daysOverdue: number; // How many days past deadline
  consequence:
    | "deal_at_risk"
    | "penalty_fee"
    | "contingency_forfeited"
    | "deal_cancelled"
    | "extension_granted"
    | "none";
  responsibleParty: "buyer" | "seller" | "bank" | "agent" | "external";
  reason: string; // Why deadline was missed
  resolution?: string; // How it was resolved
  extensionGranted?: {
    newDeadline: string; // ISO date
    extensionDays: number;
    conditions?: string[];
  };
}

// ============================================================================
// PARTIES (1 action)
// ============================================================================

export interface AgentAssignedDetails {
  agentId: string; // User ID
  agentName: string;
  role: "listing_agent" | "selling_agent" | "both";
  assignmentDate: string; // ISO timestamp
  commissionSplit?: number; // Percentage (0-100)
  replacedAgentId?: string; // If replacing someone
  replacedAgentName?: string;
  reason?: string; // Why agent was assigned/changed
  approvedBy?: string; // User ID who approved
}

// ============================================================================
// UNION TYPE FOR ALL DETAILS
// ============================================================================

/**
 * Union type of all possible deal activity detail structures
 */
export type DealActivityDetails =
  // Lifecycle
  | DealCreatedDetails
  | StatusChangedDetails
  | DealClosedDetails
  | DealCancelledDetails
  | DealReactivatedDetails
  // Financial
  | PriceChangedDetails
  | CommissionPaidDetails
  | ArrasReceivedDetails
  // Timeline
  | ArrasContractSignedDetails
  | DeedDateScheduledDetails
  | DeedDateChangedDetails
  | DeedSignedDetails
  | KeysTransferredDetails
  // Workflow
  | FinancingStatusChangedDetails
  | ContingenciesClearedDetails
  // Cancellation
  | ArrasForfeitedDetails
  | DeadlineMissedDetails
  // Parties
  | AgentAssignedDetails;

// ============================================================================
// MAPPING: ACTION → DETAILS TYPE
// ============================================================================

/**
 * Maps each action to its corresponding details type
 * Useful for type narrowing and validation
 */
export interface DealActivityDetailsMap {
  // Lifecycle
  deal_created: DealCreatedDetails;
  status_changed: StatusChangedDetails;
  deal_closed: DealClosedDetails;
  deal_cancelled: DealCancelledDetails;
  deal_reactivated: DealReactivatedDetails;
  // Financial
  price_changed: PriceChangedDetails;
  commission_paid: CommissionPaidDetails;
  arras_received: ArrasReceivedDetails;
  // Timeline
  arras_contract_signed: ArrasContractSignedDetails;
  deed_date_scheduled: DeedDateScheduledDetails;
  deed_date_changed: DeedDateChangedDetails;
  deed_signed: DeedSignedDetails;
  keys_transferred: KeysTransferredDetails;
  // Workflow
  financing_status_changed: FinancingStatusChangedDetails;
  contingencies_cleared: ContingenciesClearedDetails;
  // Cancellation
  arras_forfeited: ArrasForfeitedDetails;
  deadline_missed: DeadlineMissedDetails;
  // Parties
  agent_assigned: AgentAssignedDetails;
}
