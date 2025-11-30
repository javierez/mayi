/**
 * Activity Logging Helper Functions
 *
 * Type-safe functions for logging listing, listing contact, deal, and contact activities.
 * Uses the defined action types and detail structures to ensure consistency.
 */

import { db } from "~/server/db";
import {
  listingActivity,
  listingContactActivity,
  dealActivity,
  contactActivity,
} from "~/server/db/schema";
import type { ListingActivityAction } from "~/lib/constants/listing-activity-actions";
import type { ListingContactActivityAction } from "~/lib/constants/listing-contact-activity-actions";
import type { DealActivityAction } from "~/lib/constants/deal-activity-actions";
import type { ContactActivityAction } from "~/lib/constants/contact-activity-actions";
import type {
  ListingActivityDetails,
  ListingActivityDetailsMap,
} from "~/types/listing-activity-details";
import type {
  ListingContactActivityDetails,
  ListingContactActivityDetailsMap,
} from "~/types/listing-contact-activity-details";
import type {
  DealActivityDetails,
  DealActivityDetailsMap,
} from "~/types/deal-activity-details";
import type {
  ContactActivityDetails,
  ContactActivityDetailsMap,
} from "~/types/contact-activity-details";

// ============================================================================
// LISTING ACTIVITY LOGGING
// ============================================================================

/**
 * Generic function to log a listing activity with type safety
 *
 * @example
 * await logListingActivity({
 *   listingId: 12345n,
 *   userId: "user-123",
 *   action: "price_changed",
 *   details: {
 *     field: "price",
 *     oldValue: 250000,
 *     newValue: 235000,
 *     percentChange: -6.0,
 *     changeType: "reduction",
 *     reason: "Market adjustment",
 *     daysActive: 32
 *   }
 * });
 */
export async function logListingActivity<T extends ListingActivityAction>(params: {
  listingId: bigint;
  userId: string;
  action: T;
  details: ListingActivityDetailsMap[T];
}): Promise<void> {
  const { listingId, userId, action, details } = params;

  await db.insert(listingActivity).values({
    listingId,
    userId,
    action,
    details: details as unknown as Record<string, unknown>,
  });
}

/**
 * Convenience function: Log price change
 */
export async function logPriceChanged(params: {
  listingId: bigint;
  userId: string;
  oldPrice: number;
  newPrice: number;
  reason?: string;
  daysActive?: number;
}) {
  const { listingId, userId, oldPrice, newPrice, reason, daysActive } = params;
  const percentChange = ((newPrice - oldPrice) / oldPrice) * 100;
  const changeType =
    newPrice < oldPrice
      ? ("reduction" as const)
      : newPrice > oldPrice
        ? ("increase" as const)
        : ("correction" as const);

  return logListingActivity({
    listingId,
    userId,
    action: "price_changed",
    details: {
      field: "price",
      oldValue: oldPrice,
      newValue: newPrice,
      percentChange: Number(percentChange.toFixed(2)),
      changeType,
      updatedBy: userId,
      reason,
      daysActive,
    },
  });
}

/**
 * Convenience function: Log status change
 */
export async function logStatusChanged(params: {
  listingId: bigint;
  userId: string;
  oldStatus: string;
  newStatus: string;
  reason?: string;
  dealId?: number;
  salePrice?: number;
  daysToSell?: number;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "status_changed",
    details: {
      field: "status",
      oldStatus: params.oldStatus,
      newStatus: params.newStatus,
      reason: params.reason,
      dealId: params.dealId,
      salePrice: params.salePrice,
      daysToSell: params.daysToSell,
    },
  });
}

/**
 * Convenience function: Log agent reassignment
 */
export async function logAgentReassigned(params: {
  listingId: bigint;
  userId: string; // User making the change (usually manager)
  oldAgentId: string;
  oldAgentName: string;
  newAgentId: string;
  newAgentName: string;
  reason: string;
  commissionImpact?: string;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "agent_reassigned",
    details: {
      field: "agentId",
      oldAgentId: params.oldAgentId,
      oldAgentName: params.oldAgentName,
      newAgentId: params.newAgentId,
      newAgentName: params.newAgentName,
      reason: params.reason,
      commissionImpact: params.commissionImpact,
    },
  });
}

/**
 * Convenience function: Log portal publication
 */
export async function logPortalPublished(params: {
  listingId: bigint;
  userId: string;
  portal: "fotocasa" | "idealista" | "habitaclia" | "pisoscom" | "yaencontre" | "milanuncios";
  portalListingId?: string;
  visibilityMode?: 1 | 2 | 3;
  hidePrice?: boolean;
  expiryDate?: string;
  cost?: number;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "portal_published",
    details: {
      portal: params.portal,
      published: true,
      portalListingId: params.portalListingId,
      visibilityMode: params.visibilityMode,
      hidePrice: params.hidePrice,
      publicationDate: new Date().toISOString(),
      expiryDate: params.expiryDate,
      cost: params.cost,
    },
  });
}

/**
 * Convenience function: Log portal sync error
 */
export async function logPortalSyncError(params: {
  listingId: bigint;
  userId: string;
  portal: "fotocasa" | "idealista" | "habitaclia" | "pisoscom" | "yaencontre" | "milanuncios";
  operation: "publish" | "update_price" | "update_description" | "update_images" | "unpublish";
  errorCode: string;
  errorMessage: string;
  attemptNumber: number;
  willRetry: boolean;
  nextRetryAt?: string;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "portal_sync_error",
    details: {
      portal: params.portal,
      operation: params.operation,
      errorCode: params.errorCode,
      errorMessage: params.errorMessage,
      attemptNumber: params.attemptNumber,
      willRetry: params.willRetry,
      nextRetryAt: params.nextRetryAt,
    },
  });
}

// ============================================================================
// LISTING CONTACT ACTIVITY LOGGING
// ============================================================================

/**
 * Generic function to log a listing contact activity with type safety
 *
 * @example
 * await logListingContactActivity({
 *   listingContactId: 5001n,
 *   userId: "user-123",
 *   action: "call_logged",
 *   details: {
 *     direction: "outbound",
 *     phoneNumber: "+34 612 345 678",
 *     duration: 420,
 *     outcome: "interested",
 *     interestLevel: 4,
 *     appointmentScheduled: true,
 *     appointmentId: 3456
 *   }
 * });
 */
export async function logListingContactActivity<
  T extends ListingContactActivityAction,
>(params: {
  listingContactId: bigint;
  userId: string;
  action: T;
  details: ListingContactActivityDetailsMap[T];
}): Promise<bigint> {
  const { listingContactId, userId, action, details } = params;

  const [result] = await db.insert(listingContactActivity).values({
    listingContactId,
    userId,
    action,
    details: details as unknown as Record<string, unknown>,
  }).returning({ id: listingContactActivity.id });

  return result!.id;
}

/**
 * Convenience function: Log call
 */
export async function logCallLogged(params: {
  listingContactId: bigint;
  userId: string;
  direction: "inbound" | "outbound";
  phoneNumber: string;
  duration: number;
  outcome: "interested" | "not_interested" | "callback" | "no_answer" | "voicemail";
  interestLevel?: 1 | 2 | 3 | 4 | 5;
  appointmentScheduled?: boolean;
  appointmentId?: number;
  concerns?: string[];
  nextSteps?: string;
}) {
  return logListingContactActivity({
    listingContactId: params.listingContactId,
    userId: params.userId,
    action: "call_logged",
    details: {
      direction: params.direction,
      phoneNumber: params.phoneNumber,
      duration: params.duration,
      outcome: params.outcome,
      interestLevel: params.interestLevel,
      appointmentScheduled: params.appointmentScheduled,
      appointmentId: params.appointmentId,
      concerns: params.concerns,
      nextSteps: params.nextSteps,
    },
  });
}

/**
 * Convenience function: Log viewing completion
 */
export async function logViewingCompleted(params: {
  listingContactId: bigint;
  userId: string;
  appointmentId: number;
  attended: boolean;
  duration?: number;
  attendees?: string[];
  interestLevel: 1 | 2 | 3 | 4 | 5;
  liked?: string[];
  disliked?: string[];
  concerns?: string[];
  willMakeOffer?: "yes" | "no" | "maybe" | "likely";
  nextSteps?: string;
}) {
  return logListingContactActivity({
    listingContactId: params.listingContactId,
    userId: params.userId,
    action: "viewing_completed",
    details: {
      appointmentId: params.appointmentId,
      attended: params.attended,
      duration: params.duration,
      attendees: params.attendees,
      interestLevel: params.interestLevel,
      feedback: {
        liked: params.liked,
        disliked: params.disliked,
        concerns: params.concerns,
      },
      willMakeOffer: params.willMakeOffer,
      nextSteps: params.nextSteps,
    },
  });
}

/**
 * Convenience function: Log offer received
 */
export async function logOfferReceived(params: {
  listingContactId: bigint;
  userId: string;
  amount: number;
  listingPrice: number;
  offerType?: "firm" | "contingent" | "verbal";
  conditions?: string[];
  expiryDate?: string;
  depositAmount?: number;
  closeDate?: string;
  notes?: string;
  presentedToSeller?: boolean;
}) {
  const percentOfAsking = (params.amount / params.listingPrice) * 100;

  return logListingContactActivity({
    listingContactId: params.listingContactId,
    userId: params.userId,
    action: "offer_received",
    details: {
      amount: params.amount,
      listingPrice: params.listingPrice,
      percentOfAsking: Number(percentOfAsking.toFixed(2)),
      offerType: params.offerType ?? "firm",
      conditions: params.conditions,
      expiryDate: params.expiryDate,
      depositAmount: params.depositAmount,
      closeDate: params.closeDate,
      notes: params.notes,
      presentedToSeller: params.presentedToSeller ?? false,
    },
  });
}

/**
 * Convenience function: Log offer acceptance
 */
export async function logOfferAccepted(params: {
  listingContactId: bigint;
  userId: string;
  finalAmount: number;
  originalListing: number;
  offerNumber: number;
  negotiationDuration?: number;
  conditions: string[];
  depositAmount: number;
  depositDueDate: string;
  expectedCloseDate: string;
  dealCreated: boolean;
  dealId?: number;
}) {
  const discount = params.originalListing - params.finalAmount;
  const discountPercent = (discount / params.originalListing) * 100;

  return logListingContactActivity({
    listingContactId: params.listingContactId,
    userId: params.userId,
    action: "offer_accepted",
    details: {
      finalAmount: params.finalAmount,
      originalListing: params.originalListing,
      discount,
      discountPercent: Number(discountPercent.toFixed(2)),
      offerNumber: params.offerNumber,
      negotiationDuration: params.negotiationDuration,
      conditions: params.conditions,
      depositAmount: params.depositAmount,
      depositDueDate: params.depositDueDate,
      expectedCloseDate: params.expectedCloseDate,
      dealCreated: params.dealCreated,
      dealId: params.dealId,
    },
  });
}

/**
 * Convenience function: Log interest level update
 */
export async function logInterestLevelUpdated(params: {
  listingContactId: bigint;
  userId: string;
  oldLevel: "cold" | "warm" | "hot";
  newLevel: "cold" | "warm" | "hot";
  oldScore: number;
  newScore: number;
  reason: string;
  indicators?: string[];
  predictedCloseDate?: string;
  closeProbability?: number;
}) {
  return logListingContactActivity({
    listingContactId: params.listingContactId,
    userId: params.userId,
    action: "interest_level_updated",
    details: {
      oldLevel: params.oldLevel,
      newLevel: params.newLevel,
      score: {
        old: params.oldScore,
        new: params.newScore,
      },
      reason: params.reason,
      indicators: params.indicators,
      predictedCloseDate: params.predictedCloseDate,
      closeProbability: params.closeProbability,
    },
  });
}

/**
 * Convenience function: Log disqualification
 */
export async function logDisqualified(params: {
  listingContactId: bigint;
  userId: string;
  reason: "budget" | "timeline" | "requirements" | "unresponsive" | "found_other" | "other";
  oldStatus: string;
  newStatus: string;
  elaboration: string;
  attempts: number;
  lastContact?: string;
  suggestedAlternatives?: number[];
  keepInDatabase?: boolean;
  futureOpportunity?: string;
}) {
  return logListingContactActivity({
    listingContactId: params.listingContactId,
    userId: params.userId,
    action: "disqualified",
    details: {
      reason: params.reason,
      oldStatus: params.oldStatus,
      newStatus: params.newStatus,
      elaboration: params.elaboration,
      attempts: params.attempts,
      lastContact: params.lastContact,
      suggestedAlternatives: params.suggestedAlternatives,
      keepInDatabase: params.keepInDatabase ?? true,
      futureOpportunity: params.futureOpportunity,
    },
  });
}

// ============================================================================
// BATCH LOGGING
// ============================================================================

/**
 * Log multiple listing activities at once (useful for bulk operations)
 */
export async function logListingActivitiesBatch(
  activities: Array<{
    listingId: bigint;
    userId: string;
    action: ListingActivityAction;
    details: ListingActivityDetails;
  }>,
): Promise<void> {
  if (activities.length === 0) return;

  await db.insert(listingActivity).values(
    activities.map((activity) => ({
      listingId: activity.listingId,
      userId: activity.userId,
      action: activity.action,
      details: activity.details as unknown as Record<string, unknown>,
    })),
  );
}

/**
 * Log multiple listing contact activities at once
 */
export async function logListingContactActivitiesBatch(
  activities: Array<{
    listingContactId: bigint;
    userId: string;
    action: ListingContactActivityAction;
    details: ListingContactActivityDetails;
  }>,
): Promise<void> {
  if (activities.length === 0) return;

  await db.insert(listingContactActivity).values(
    activities.map((activity) => ({
      listingContactId: activity.listingContactId,
      userId: activity.userId,
      action: activity.action,
      details: activity.details as unknown as Record<string, unknown>,
    })),
  );
}

// ============================================================================
// DEAL ACTIVITY LOGGING
// ============================================================================

/**
 * Generic function to log a deal activity with type safety
 *
 * @example
 * await logDealActivity({
 *   dealId: 123n,
 *   userId: "user-123",
 *   action: "deal_created",
 *   details: {
 *     listingId: 456,
 *     initialStatus: "Offer",
 *     finalPrice: 350000,
 *     createdBy: "user-123"
 *   }
 * });
 */
export async function logDealActivity<T extends DealActivityAction>(params: {
  dealId: bigint;
  userId: string;
  action: T;
  details: DealActivityDetailsMap[T];
}): Promise<void> {
  const { dealId, userId, action, details } = params;

  await db.insert(dealActivity).values({
    dealId,
    userId,
    action,
    details: details as unknown as Record<string, unknown>,
  });
}

/**
 * Convenience function: Log deal creation
 */
export async function logDealCreated(params: {
  dealId: bigint;
  userId: string;
  listingId: number;
  listingContactId?: number;
  initialStatus: string;
  finalPrice: number;
  commissionAmount?: number;
  commissionPercentage?: number;
  source?: string;
  notes?: string;
}) {
  return logDealActivity({
    dealId: params.dealId,
    userId: params.userId,
    action: "deal_created",
    details: {
      listingId: params.listingId,
      listingContactId: params.listingContactId,
      initialStatus: params.initialStatus,
      finalPrice: params.finalPrice,
      commissionAmount: params.commissionAmount,
      commissionPercentage: params.commissionPercentage,
      source: params.source,
      createdBy: params.userId,
      notes: params.notes,
    },
  });
}

/**
 * Convenience function: Log deal status change
 */
export async function logDealStatusChanged(params: {
  dealId: bigint;
  userId: string;
  oldStatus: string;
  newStatus: string;
  reason?: string;
  daysInPreviousStatus?: number;
  milestone?: string;
}) {
  return logDealActivity({
    dealId: params.dealId,
    userId: params.userId,
    action: "status_changed",
    details: {
      oldStatus: params.oldStatus,
      newStatus: params.newStatus,
      reason: params.reason,
      daysInPreviousStatus: params.daysInPreviousStatus,
      milestone: params.milestone,
    },
  });
}

/**
 * Convenience function: Log deal closure
 */
export async function logDealClosed(params: {
  dealId: bigint;
  userId: string;
  closingDate: string;
  finalPrice: number;
  commissionAmount: number;
  daysToClose: number;
  commissionPaid?: boolean;
  notary?: string;
  deedNumber?: string;
}) {
  return logDealActivity({
    dealId: params.dealId,
    userId: params.userId,
    action: "deal_closed",
    details: {
      closingDate: params.closingDate,
      finalPrice: params.finalPrice,
      commissionAmount: params.commissionAmount,
      commissionPaid: params.commissionPaid,
      daysToClose: params.daysToClose,
      notary: params.notary,
      deedNumber: params.deedNumber,
    },
  });
}

/**
 * Convenience function: Log deal cancellation
 */
export async function logDealCancelled(params: {
  dealId: bigint;
  userId: string;
  cancellationDate: string;
  reason: string;
  reasonCategory?:
    | "financing_failed"
    | "inspection_issues"
    | "buyer_withdrew"
    | "seller_withdrew"
    | "title_issues"
    | "contingency_not_met"
    | "other";
  faultParty: "buyer" | "seller" | "both" | "external" | "none";
  stageWhenCancelled: string;
  daysActive: number;
  preventable: boolean;
  arrasDisposition?: "returned_to_buyer" | "kept_by_seller" | "split";
  arrasAmount?: number;
  lessonsLearned?: string;
}) {
  return logDealActivity({
    dealId: params.dealId,
    userId: params.userId,
    action: "deal_cancelled",
    details: {
      cancellationDate: params.cancellationDate,
      reason: params.reason,
      reasonCategory: params.reasonCategory,
      faultParty: params.faultParty,
      stageWhenCancelled: params.stageWhenCancelled,
      daysActive: params.daysActive,
      preventable: params.preventable,
      arrasDisposition: params.arrasDisposition,
      arrasAmount: params.arrasAmount,
      lessonsLearned: params.lessonsLearned,
    },
  });
}

/**
 * Convenience function: Log commission payment
 */
export async function logCommissionPaid(params: {
  dealId: bigint;
  userId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: "bank_transfer" | "check" | "cash" | "other";
  recipients: Array<{
    agentId: string;
    agentName: string;
    role: "listing_agent" | "selling_agent";
    amount: number;
    percentage: number;
  }>;
  netPaid: number;
  invoiceNumber?: string;
  taxWithheld?: number;
}) {
  return logDealActivity({
    dealId: params.dealId,
    userId: params.userId,
    action: "commission_paid",
    details: {
      amount: params.amount,
      paymentDate: params.paymentDate,
      paymentMethod: params.paymentMethod,
      recipients: params.recipients,
      netPaid: params.netPaid,
      invoiceNumber: params.invoiceNumber,
      taxWithheld: params.taxWithheld,
    },
  });
}

/**
 * Convenience function: Log arras receipt
 */
export async function logArrasReceived(params: {
  dealId: bigint;
  userId: string;
  amount: number;
  arrasType: "confirmatorias" | "penitenciales";
  paymentDate: string;
  paymentMethod: "bank_transfer" | "check" | "cash" | "banker_check";
  payerName: string;
  receiptNumber?: string;
  depositedTo?: string;
}) {
  return logDealActivity({
    dealId: params.dealId,
    userId: params.userId,
    action: "arras_received",
    details: {
      amount: params.amount,
      arrasType: params.arrasType,
      paymentDate: params.paymentDate,
      paymentMethod: params.paymentMethod,
      receiptNumber: params.receiptNumber,
      payerName: params.payerName,
      depositedTo: params.depositedTo,
    },
  });
}

/**
 * Convenience function: Log deed signing
 */
export async function logDeedSigned(params: {
  dealId: bigint;
  userId: string;
  signingDate: string;
  notaryName: string;
  notaryLocation: string;
  partiesPresent: string[];
  deedNumber: string;
  finalPrice: number;
  registrySubmitted?: boolean;
  registrySubmissionDate?: string;
}) {
  return logDealActivity({
    dealId: params.dealId,
    userId: params.userId,
    action: "deed_signed",
    details: {
      signingDate: params.signingDate,
      notaryName: params.notaryName,
      notaryLocation: params.notaryLocation,
      partiesPresent: params.partiesPresent,
      deedNumber: params.deedNumber,
      finalPrice: params.finalPrice,
      registrySubmitted: params.registrySubmitted ?? false,
      registrySubmissionDate: params.registrySubmissionDate,
    },
  });
}

/**
 * Log multiple deal activities at once
 */
export async function logDealActivitiesBatch(
  activities: Array<{
    dealId: bigint;
    userId: string;
    action: DealActivityAction;
    details: DealActivityDetails;
  }>,
): Promise<void> {
  if (activities.length === 0) return;

  await db.insert(dealActivity).values(
    activities.map((activity) => ({
      dealId: activity.dealId,
      userId: activity.userId,
      action: activity.action,
      details: activity.details as unknown as Record<string, unknown>,
    })),
  );
}

// ============================================================================
// CONTACT ACTIVITY LOGGING
// ============================================================================

/**
 * Generic function to log a contact activity with type safety
 *
 * @example
 * await logContactActivity({
 *   contactId: 789n,
 *   userId: "user-123",
 *   action: "contact_created",
 *   details: {
 *     firstName: "Juan",
 *     lastName: "García",
 *     email: "juan@example.com",
 *     source: "Website",
 *     createdBy: "user-123",
 *     accountId: 1
 *   }
 * });
 */
export async function logContactActivity<T extends ContactActivityAction>(params: {
  contactId: bigint;
  userId: string;
  action: T;
  details: ContactActivityDetailsMap[T];
}): Promise<bigint> {
  const { contactId, userId, action, details } = params;

  const [result] = await db.insert(contactActivity).values({
    contactId,
    userId,
    action,
    details: details as unknown as Record<string, unknown>,
  }).returning({ id: contactActivity.id });

  return result!.id;
}

/**
 * Convenience function: Log contact creation
 */
export async function logContactCreated(params: {
  contactId: bigint;
  userId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  source: string;
  accountId: number;
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
  campaign?: string;
  initialNotes?: string;
}) {
  return logContactActivity({
    contactId: params.contactId,
    userId: params.userId,
    action: "contact_created",
    details: {
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      phone: params.phone,
      source: params.source,
      channel: params.channel,
      createdBy: params.userId,
      campaign: params.campaign,
      initialNotes: params.initialNotes,
      accountId: params.accountId,
    },
  });
}

/**
 * Convenience function: Log contact deactivation
 */
export async function logContactDeactivated(params: {
  contactId: bigint;
  userId: string;
  deactivationDate: string;
  reason:
    | "gdpr_request"
    | "deceased"
    | "moved_away"
    | "duplicate"
    | "request"
    | "inactive"
    | "data_quality"
    | "other";
  reasonDetail?: string;
  dataRetained?: boolean;
  reactivationPossible?: boolean;
}) {
  return logContactActivity({
    contactId: params.contactId,
    userId: params.userId,
    action: "contact_deactivated",
    details: {
      deactivationDate: params.deactivationDate,
      reason: params.reason,
      reasonDetail: params.reasonDetail,
      deactivatedBy: params.userId,
      dataRetained: params.dataRetained ?? true,
      reactivationPossible: params.reactivationPossible ?? true,
    },
  });
}

/**
 * Convenience function: Log consent given
 */
export async function logConsentGiven(params: {
  contactId: bigint;
  userId: string;
  consentType:
    | "marketing_email"
    | "marketing_sms"
    | "marketing_whatsapp"
    | "marketing_phone"
    | "marketing_all"
    | "data_processing"
    | "third_party_sharing";
  consentDate: string;
  consentMethod:
    | "web_form"
    | "email_confirmation"
    | "verbal"
    | "written_form"
    | "checkbox"
    | "double_opt_in"
    | "other";
  ipAddress?: string;
  consentText?: string;
  source?: string;
}) {
  return logContactActivity({
    contactId: params.contactId,
    userId: params.userId,
    action: "consent_given",
    details: {
      consentType: params.consentType,
      consentDate: params.consentDate,
      consentMethod: params.consentMethod,
      ipAddress: params.ipAddress,
      consentText: params.consentText,
      source: params.source,
    },
  });
}

/**
 * Convenience function: Log consent withdrawal
 */
export async function logConsentWithdrawn(params: {
  contactId: bigint;
  userId: string;
  consentType:
    | "marketing_email"
    | "marketing_sms"
    | "marketing_whatsapp"
    | "marketing_phone"
    | "marketing_all"
    | "data_processing"
    | "third_party_sharing";
  withdrawalDate: string;
  withdrawalMethod:
    | "unsubscribe_link"
    | "email_request"
    | "phone_request"
    | "written_request"
    | "web_portal"
    | "in_person"
    | "other";
  effectiveDate: string;
  confirmationSent?: boolean;
  reason?: string;
}) {
  return logContactActivity({
    contactId: params.contactId,
    userId: params.userId,
    action: "consent_withdrawn",
    details: {
      consentType: params.consentType,
      withdrawalDate: params.withdrawalDate,
      withdrawalMethod: params.withdrawalMethod,
      effectiveDate: params.effectiveDate,
      confirmationSent: params.confirmationSent ?? false,
      reason: params.reason,
    },
  });
}

/**
 * Convenience function: Log GDPR data export request
 */
export async function logGdprDataExportRequested(params: {
  contactId: bigint;
  userId: string;
  requestDate: string;
  requestMethod: "email" | "phone" | "letter" | "web_portal" | "in_person";
  requestedBy: string;
  verificationRequired?: boolean;
  legalDeadline: string;
  dataScope?: "full" | "partial";
  deliveryMethod: "email" | "mail" | "in_person" | "secure_download";
  status?: "pending" | "in_progress" | "completed" | "rejected";
}) {
  return logContactActivity({
    contactId: params.contactId,
    userId: params.userId,
    action: "gdpr_data_export_requested",
    details: {
      requestDate: params.requestDate,
      requestMethod: params.requestMethod,
      requestedBy: params.requestedBy,
      verificationRequired: params.verificationRequired ?? true,
      legalDeadline: params.legalDeadline,
      dataScope: params.dataScope ?? "full",
      deliveryMethod: params.deliveryMethod,
      status: params.status ?? "pending",
    },
  });
}

/**
 * Log multiple contact activities at once
 */
export async function logContactActivitiesBatch(
  activities: Array<{
    contactId: bigint;
    userId: string;
    action: ContactActivityAction;
    details: ContactActivityDetails;
  }>,
): Promise<void> {
  if (activities.length === 0) return;

  await db.insert(contactActivity).values(
    activities.map((activity) => ({
      contactId: activity.contactId,
      userId: activity.userId,
      action: activity.action,
      details: activity.details as unknown as Record<string, unknown>,
    })),
  );
}

// ============================================================================
// FOTOCASA ACTIVITY LOGGING
// ============================================================================

/**
 * Convenience function: Log Fotocasa publication (POST success)
 */
export async function logFotocasaPublished(params: {
  listingId: bigint;
  userId: string;
  visibilityMode: 1 | 2 | 3;
  hidePrice: boolean;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "fotocasa_published",
    details: {
      visibilityMode: params.visibilityMode,
      hidePrice: params.hidePrice,
      publicationDate: new Date().toISOString(),
    },
  });
}

/**
 * Convenience function: Log Fotocasa update (PUT success)
 */
export async function logFotocasaUpdated(params: {
  listingId: bigint;
  userId: string;
  visibilityMode?: 1 | 2 | 3;
  hidePrice?: boolean;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "fotocasa_updated",
    details: {
      updateDate: new Date().toISOString(),
      visibilityMode: params.visibilityMode,
      hidePrice: params.hidePrice,
    },
  });
}

/**
 * Convenience function: Log Fotocasa deletion (DELETE success)
 */
export async function logFotocasaDeleted(params: {
  listingId: bigint;
  userId: string;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "fotocasa_deleted",
    details: {
      deletedDate: new Date().toISOString(),
    },
  });
}

// ============================================================================
// IDEALISTA ACTIVITY LOGGING
// ============================================================================

/**
 * Convenience function: Log Idealista publication (enabled for export)
 */
export async function logIdealistaPublished(params: {
  listingId: bigint;
  userId: string;
  addressVisibility: "full" | "street" | "hidden";
  coordinatesPrecision?: "exact" | "moved";
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "idealista_published",
    details: {
      portal: "idealista",
      addressVisibility: params.addressVisibility,
      coordinatesPrecision: params.coordinatesPrecision,
      publicationDate: new Date().toISOString(),
    },
  });
}

/**
 * Convenience function: Log Idealista update (settings changed)
 */
export async function logIdealistaUpdated(params: {
  listingId: bigint;
  userId: string;
  addressVisibility: "full" | "street" | "hidden";
  changes?: string[];
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "idealista_updated",
    details: {
      portal: "idealista",
      addressVisibility: params.addressVisibility,
      updateDate: new Date().toISOString(),
      changes: params.changes,
    },
  });
}

/**
 * Convenience function: Log Idealista deletion (disabled from export)
 */
export async function logIdealistaDeleted(params: {
  listingId: bigint;
  userId: string;
  reason?: string;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "idealista_deleted",
    details: {
      portal: "idealista",
      deletedDate: new Date().toISOString(),
      reason: params.reason,
    },
  });
}

/**
 * Convenience function: Log Idealista export (batch export to FTP)
 * Note: This is typically logged at account level, not individual listing
 */
export async function logIdealistaExported(params: {
  listingId: bigint;
  userId: string;
  propertyCount: number;
  uploadedToFtp: boolean;
  filename?: string;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "idealista_exported",
    details: {
      portal: "idealista",
      propertyCount: params.propertyCount,
      uploadedToFtp: params.uploadedToFtp,
      filename: params.filename,
      exportDate: new Date().toISOString(),
    },
  });
}

// ============================================================================
// PORTAL SELECTION TOGGLE LOGGING
// ============================================================================

/**
 * Convenience function: Log website publication (publishToWebsite = true)
 */
export async function logWebsitePublished(params: {
  listingId: bigint;
  userId: string;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "website_published",
    details: {
      publishedDate: new Date().toISOString(),
    },
  });
}

/**
 * Convenience function: Log website unpublication (publishToWebsite = false)
 */
export async function logWebsiteUnpublished(params: {
  listingId: bigint;
  userId: string;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "website_unpublished",
    details: {
      unpublishedDate: new Date().toISOString(),
    },
  });
}

/**
 * Convenience function: Log keys returned (hasKeys = false)
 */
export async function logKeysReturned(params: {
  listingId: bigint;
  userId: string;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "keys_returned",
    details: {
      returnedDate: new Date().toISOString(),
    },
  });
}

/**
 * Convenience function: Log cartel placed (hasCartel = true)
 */
export async function logCartelPlaced(params: {
  listingId: bigint;
  userId: string;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "cartel_placed",
    details: {
      placedDate: new Date().toISOString(),
    },
  });
}

/**
 * Convenience function: Log cartel removed (hasCartel = false)
 */
export async function logCartelRemoved(params: {
  listingId: bigint;
  userId: string;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "cartel_removed",
    details: {
      removedDate: new Date().toISOString(),
    },
  });
}

/**
 * Convenience function: Log escaparate added (enEscaparate = true)
 */
export async function logEscaparateAdded(params: {
  listingId: bigint;
  userId: string;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "escaparate_added",
    details: {
      addedDate: new Date().toISOString(),
    },
  });
}

/**
 * Convenience function: Log escaparate removed (enEscaparate = false)
 */
export async function logEscaparateRemoved(params: {
  listingId: bigint;
  userId: string;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "escaparate_removed",
    details: {
      removedDate: new Date().toISOString(),
    },
  });
}

// ============================================================================
// PROGRESS STAGE LOGGING
// ============================================================================

/**
 * Convenience function: Log listing creation (Alta stage - 10%)
 */
export async function logListingCreated(params: {
  listingId: bigint;
  userId: string;
  propertyId: number;
  propertyType?: string;
  listingType: string; // Sale, Rent, Transfer, RentWithOption, RoomSharing, Sold, etc.
  initialStatus: string;
  source?: "manual" | "import" | "api" | "duplicate";
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "listing_created",
    details: {
      stageId: "alta",
      stageName: "Alta",
      progressPercent: 10,
      propertyId: params.propertyId,
      propertyType: params.propertyType,
      listingType: params.listingType,
      initialStatus: params.initialStatus,
      createdBy: params.userId,
      source: params.source ?? "manual",
    },
  });
}

/**
 * Convenience function: Log ficha completion (Ficha Completa stage - 24%)
 */
export async function logFichaCompleted(params: {
  listingId: bigint;
  userId: string;
  completedFields: string[];
  triggerField?: string;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "ficha_completed",
    details: {
      stageId: "ficha_completa",
      stageName: "Ficha Completa",
      progressPercent: 24,
      completedFields: params.completedFields,
      completedBy: params.userId,
      triggerField: params.triggerField,
    },
  });
}

/**
 * Convenience function: Log encargo signing (Encargo Firmado stage - 43%)
 */
export async function logEncargoSigned(params: {
  listingId: bigint;
  userId: string;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "encargo_signed",
    details: {
      stageId: "firma_encargo",
      stageName: "Encargo Firmado",
      progressPercent: 43,
      signedBy: params.userId,
      signedAt: new Date().toISOString(),
    },
  });
}

/**
 * Convenience function: Log offer acceptance at listing level (Oferta Aceptada stage - 60%)
 * Note: This is for listingActivity (listing-level progress tracking).
 * For listingContactActivity (contact-level), use logOfferAccepted above.
 */
export async function logListingOfferAccepted(params: {
  listingId: bigint;
  userId: string;
  listingContactId: bigint;
  offerAmount?: number;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "offer_accepted",
    details: {
      stageId: "oferta_aceptada",
      stageName: "Oferta Aceptada",
      progressPercent: 60,
      acceptedBy: params.userId,
      acceptedAt: new Date().toISOString(),
      listingContactId: params.listingContactId.toString(),
      offerAmount: params.offerAmount,
    },
  });
}

/**
 * Convenience function: Log arras signing (Arras Firmadas stage - 73%)
 */
export async function logArrasSigned(params: {
  listingId: bigint;
  userId: string;
  dealId: bigint;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "arras_signed",
    details: {
      stageId: "arras",
      stageName: "Arras Firmadas",
      progressPercent: 73,
      signedBy: params.userId,
      signedAt: new Date().toISOString(),
      dealId: params.dealId.toString(),
    },
  });
}

/**
 * Convenience function: Log escritura signing (Escritura Firmada stage - 93%)
 */
export async function logEscrituraSigned(params: {
  listingId: bigint;
  userId: string;
  dealId: bigint;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "escritura_signed",
    details: {
      stageId: "contrato",
      stageName: "Escritura Firmada",
      progressPercent: 93,
      signedBy: params.userId,
      signedAt: new Date().toISOString(),
      dealId: params.dealId.toString(),
    },
  });
}

/**
 * Convenience function: Log deal closure at listing level (Cierre Final stage - 100%)
 * Note: This is for listingActivity (listing-level progress tracking).
 * For dealActivity (deal-level), use logDealClosed above.
 */
export async function logListingDealClosed(params: {
  listingId: bigint;
  userId: string;
  dealId: bigint;
}) {
  return logListingActivity({
    listingId: params.listingId,
    userId: params.userId,
    action: "deal_closed",
    details: {
      stageId: "cierre_final",
      stageName: "Cierre Final",
      progressPercent: 100,
      closedBy: params.userId,
      closedAt: new Date().toISOString(),
      dealId: params.dealId.toString(),
    },
  });
}
