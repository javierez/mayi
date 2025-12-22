/**
 * Arras Contract type definitions for contrato de arras generation
 * Uses deals table and documents table for signatures and contract PDF
 */

export type ArrasType = "penitenciales" | "confirmatorias";
export type PaymentMethod = "transferencia" | "cheque" | "cheque_bancario";

export interface ArrasContractFormData {
  dealId: bigint;
  listingId: bigint;
  // Seller (Vendedor)
  sellerName: string;
  sellerNif: string;
  sellerAddress: string;
  sellerPhone?: string;
  sellerEmail?: string;
  // Buyer (Comprador)
  buyerName: string;
  buyerNif: string;
  buyerAddress: string;
  buyerPhone?: string;
  buyerEmail?: string;
  // Financial
  totalPrice: number;
  arrasAmount: number;
  arrasType: ArrasType;
  paymentMethod: PaymentMethod;
  bankAccountIban?: string;
  // Timeline
  signingDate: Date;
  signingLocation: string;
  deedDeadline: Date;
  hasFinancingCondition: boolean;
  financingDeadline?: Date;
  // Conditions
  specialConditions?: string;
  // Signatures (base64 data URL)
  sellerSignature: string;
  buyerSignature: string;
  // Consent
  gdprConsent: boolean;
}

export interface ArrasContractPageData {
  accountId: string;
  deal: {
    dealId: bigint;
    listingId: bigint;
    listingContactId: bigint | null;
    status: string;
    finalPrice: string | null;
    arrasAmount: string | null;
    arrasType: ArrasType | null;
    arrasSigningDate: Date | null;
    expectedDeedDate: Date | null;
    specialConditions: string | null;
    offer: number | null; // From listing_contacts.offer
  };
  buyer: {
    contactId: bigint;
    firstName: string;
    lastName: string | null;
    nif: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
  };
  seller: {
    contactId: bigint;
    firstName: string;
    lastName: string | null;
    nif: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
  } | null;
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
  };
  listing: {
    listingId: bigint;
    price: string | null;
    listingType: string | null;
  };
  agent: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  agency: {
    accountId: bigint;
    accountType: string;
    name: string;
    signatureUrl: string | null;
  };
  existingContract: {
    docId: bigint;
    filename: string;
    fileUrl: string;
    createdAt: Date;
  } | null;
}

export interface ArrasDocumentData {
  accountId?: string;
  deal: {
    dealId: bigint;
    finalPrice: string;
    arrasAmount: string;
    arrasType: ArrasType;
    paymentMethod: PaymentMethod;
    bankAccountIban?: string;
    signingDate: Date;
    deedDeadline: Date;
    hasFinancingCondition: boolean;
    financingDeadline?: Date;
    specialConditions?: string;
  };
  seller: {
    name: string;
    nif: string;
    address: string;
    phone?: string;
    email?: string;
  };
  buyer: {
    name: string;
    nif: string;
    address: string;
    phone?: string;
    email?: string;
  };
  property: {
    propertyId?: bigint;
    referenceNumber: string;
    fullAddress: string;
    cadastralReference?: string;
    surfaceArea?: string;
    propertyType?: string;
  };
  signatures: {
    sellerSignatureUrl?: string;
    buyerSignatureUrl?: string;
  };
  branding?: {
    logoUrl?: string;
    agentName?: string;
    collegiateNumber?: string;
    accountType?: string;
    accountName?: string;
    taxId?: string;
    offices?: Array<{
      address: string;
      city: string;
      postalCode: string;
      phone: string;
    }>;
    website?: string;
    email?: string;
    signatureUrl?: string; // Account's default signature URL for agent
  };
  location: string;
  date: string;
  gdprConsent: boolean;
}

export interface ArrasSignatureDocument {
  docId: bigint;
  filename: string;
  fileUrl: string;
  signatureType: "seller" | "buyer";
  dealId: bigint;
}
