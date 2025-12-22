/**
 * Hoja de Encargo (Listing Agreement) type definitions
 * Uses documents table for PDF storage (no dedicated tracking table)
 */

export interface HojaEncargoFormData {
  listingId: bigint;
  ownerContactId: bigint;
  // Owner (Propietario)
  ownerName: string;
  ownerNif: string;
  ownerAddress: string;
  ownerCity: string;
  ownerPostalCode: string;
  ownerPhone: string;
  ownerEmail: string;
  // Property (Inmueble)
  propertyDescription?: string;
  // Terms (Condiciones del Encargo)
  commissionPercentage: number;
  minimumCommission: number;
  durationMonths: number;
  exclusivity: boolean;
  // Authorizations
  allowSignage: boolean;
  allowVisits: boolean;
  allowKeyDelivery: boolean;
  allowPortalPublication: boolean;
  gdprConsent: boolean;
  // Signatures (optional, base64 data URL)
  ownerSignature?: string;
  agentSignature?: string;
  // Metadata
  signingDate: Date;
  signingLocation: string;
}

export interface HojaEncargoPageData {
  accountId: string;
  listing: {
    listingId: bigint;
    price: string | null;
    listingType: string;
    shortDescription: string | null;
    description: string | null;
    hasKeys: boolean;
  };
  property: {
    propertyId: bigint;
    referenceNumber: string | null;
    street: string | null;
    addressDetails: string | null;
    postalCode: string | null;
    city: string | null;
    province: string | null;
    cadastralReference: string | null;
    squareMeters: number | null;
    builtSurfaceArea: string | null;
    propertyType: string | null;
    energyConsumptionScale: string | null;
    energyConsumptionValue: number | null;
  };
  owner: {
    contactId: bigint;
    listingContactId: bigint;
    firstName: string | null;
    lastName: string | null;
    nif: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    gdprConsent: boolean | null;
  } | null;
  agency: {
    accountId: bigint;
    accountType: string;
    name: string;
    agentPersonName: string | null; // Earliest user's name for non-company accounts
    email: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    taxId: string | null;
    collegiateNumber: string | null;
    logo: string | null;
    signatureUrl: string | null; // Account's default signature URL
  };
  terms: {
    commission: number;
    minCommission: number;
    duration: number;
    exclusivity: boolean;
    allowSignage: boolean;
    allowVisits: boolean;
    allowKeyDelivery: boolean;
    allowPortalPublication: boolean;
    communications: boolean;
  } | null;
  existingDocument: {
    docId: bigint;
    filename: string;
    fileUrl: string;
    createdAt: Date;
  } | null;
}

export interface HojaEncargoDocumentData {
  documentNumber: string;
  agency: {
    agentName: string;
    collegiateNumber: string;
    agentNIF: string;
    website: string;
    email: string;
    logo?: string;
    offices: Array<{
      address: string;
      city: string;
      postalCode: string;
      phone: string;
    }>;
  };
  client: {
    fullName: string;
    nif: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
    email: string;
  };
  property: {
    description: string;
    fullAddress: string;
    cadastralReference?: string;
    surfaceArea?: string;
    energyCertificate: string;
    hasKeys: boolean;
  };
  operation: {
    type: string;
    price: string;
  };
  terms: {
    commissionPercentage: number;
    minimumCommission: string;
    durationMonths: number;
    exclusivity: boolean;
    allowSignage: boolean;
    allowVisits: boolean;
    allowKeyDelivery: boolean;
    allowPortalPublication: boolean;
  };
  signatures: {
    ownerSignatureUrl?: string;
    agentSignatureUrl?: string;
    location: string;
    date: string;
  };
  jurisdiction: {
    city: string;
  };
  observations: string;
  gdprConsent: boolean;
}
