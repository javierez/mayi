/**
 * Visit type definitions for calendar visit flow feature
 * Uses appointments table and documents table for signatures
 */

export interface VisitFormData {
  appointmentId: bigint;
  notes?: string;
  agentSignature?: string; // base64 data URL
  visitorSignature?: string; // base64 data URL
  visitOutcome?: "offer_made" | "info_needed"; // Visit outcome for lead status progression
}

export interface AppointmentWithDetails {
  appointmentId: bigint;
  listingId?: bigint | null;
  listingContactId?: bigint | null; // For lead status progression
  contactId: bigint;
  userId: string;
  datetimeStart: Date;
  datetimeEnd: Date;
  type?: string | null;
  notes?: string | null;
  status?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
  contactNif?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  propertyStreet?: string | null;
  propertyAddressDetails?: string | null;
  agentName?: string | null;
  agentFirstName?: string | null;
  agentLastName?: string | null;
}

export interface VisitSignatureDocument {
  docId: bigint;
  filename: string;
  fileUrl: string;
  signatureType: "agent" | "visitor";
  appointmentId: bigint;
}

export interface VisitDocumentData {
  appointment: {
    appointmentId: bigint;
    contactFirstName: string;
    contactLastName: string;
    contactNif?: string | null;
    propertyStreet?: string | null;
    propertyAddressDetails?: string | null;
    agentName?: string | null;
    agentFirstName?: string | null;
    agentLastName?: string | null;
    datetimeStart: Date;
    datetimeEnd: Date;
    notes?: string | null;
  };
  signatures: {
    agentSignatureUrl?: string | null;
    visitorSignatureUrl?: string | null;
  };
  branding?: {
    logoUrl?: string | null;
    agentName?: string | null;
    collegiateNumber?: string | null;
    accountType?: string | null;
    accountName?: string | null;
    taxId?: string | null;
    offices?: Array<{
      address: string;
      city: string;
      postalCode: string;
      phone: string;
    }>;
    website?: string | null;
  };
  location: string;
  date: string;
  marketingConsent?: boolean;
}
