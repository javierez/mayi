import { z } from "zod";

// Fotocasa site enum (which portal the lead came from)
export type FotocasaSite = "FOTOCASA" | "HABITACLIA" | "MILANUNCIOS";

// Fotocasa lead type enum
export type FotocasaLeadType =
  | "PROPERTY"
  | "MINISITE"
  | "PROMOTION"
  | "TYPOLOGY"
  | "CALL_TRACKING"
  | "CALL_TRACKING_AD";

// Fotocasa transaction type enum
export type FotocasaTransactionType =
  | "UNDEFINED"
  | "BUY"
  | "RENT"
  | "TRANSFER"
  | "SHARE"
  | "RENT_BUY_OPTION"
  | "VACATION_RENTAL";

// Contact details from Fotocasa lead
export interface FotocasaContactDetails {
  name?: string;
  email?: string;
  phone?: string;
  // Call tracking specific fields
  audioUrl?: string;
  duration?: number;
  calledPhone?: string;
  attendedCall?: boolean;
}

// Individual lead from Fotocasa API
export interface FotocasaLead {
  id: string; // UUID
  date: string; // ISO timestamp
  message?: string;
  site: FotocasaSite;
  type: FotocasaLeadType;
  transactionType?: FotocasaTransactionType;
  reference?: string; // Listing reference number
  contactDetails: FotocasaContactDetails;
}

// Zod schema for contact details
export const fotocasaContactDetailsSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  audioUrl: z.string().optional(),
  duration: z.number().optional(),
  calledPhone: z.string().optional(),
  attendedCall: z.boolean().optional(),
});

// Zod schema for a single Fotocasa lead
export const fotocasaLeadSchema = z.object({
  id: z.string(),
  date: z.string(),
  message: z.string().optional(),
  site: z.enum(["FOTOCASA", "HABITACLIA", "MILANUNCIOS"]),
  type: z.enum([
    "PROPERTY",
    "MINISITE",
    "PROMOTION",
    "TYPOLOGY",
    "CALL_TRACKING",
    "CALL_TRACKING_AD",
  ]),
  transactionType: z
    .enum([
      "UNDEFINED",
      "BUY",
      "RENT",
      "TRANSFER",
      "SHARE",
      "RENT_BUY_OPTION",
      "VACATION_RENTAL",
    ])
    .optional(),
  reference: z.string().optional(),
  contactDetails: fotocasaContactDetailsSchema,
});

// Zod schema for API response (array of leads)
export const fotocasaLeadsResponseSchema = z.array(fotocasaLeadSchema);

// Type inferred from Zod schema
export type FotocasaLeadParsed = z.infer<typeof fotocasaLeadSchema>;

// Result type for fetch operation
export interface FetchLeadsResult {
  success: boolean;
  leads: FotocasaLead[];
  error?: string;
}

// Result type for import operation
export interface ImportLeadResult {
  success: boolean;
  contactId?: bigint;
  listingContactId?: bigint;
  skipped?: boolean;
  skipReason?: string;
  error?: string;
  // Database operation tracking
  contactCreated?: boolean;
  contactUpdated?: boolean;
  listingContactCreated?: boolean;
  listingContactSkipped?: boolean;
}
