import { z } from "zod";

/**
 * Parsed lead from Idealista email
 */
export interface IdealistaLead {
  id: string;                  // Generated UUID for deduplication
  emailDate: string;           // ISO timestamp from email
  senderName: string;          // Name (e.g., "volodymr")
  senderEmail: string;         // Real email from body (e.g., "volodymr497@gmail.com")
  maskedEmail: string;         // Masked email (@contacts.idealista.com)
  phone: string | null;        // Phone if present in message
  message: string;             // Full message content
  propertyReference: string;   // VESTA2025000011 from subject
  idealistaAdCode: string;     // 110160328 from email body
  gmailMessageId: string;      // For deduplication
  gmailThreadId: string;
}

/**
 * Zod schema for validation
 */
export const idealistaLeadSchema = z.object({
  id: z.string(),
  emailDate: z.string(),
  senderName: z.string(),
  senderEmail: z.string().email(),
  maskedEmail: z.string(),
  phone: z.string().nullable(),
  message: z.string(),
  propertyReference: z.string(),
  idealistaAdCode: z.string(),
  gmailMessageId: z.string(),
  gmailThreadId: z.string(),
});

/**
 * Result of fetching Idealista leads from Gmail
 */
export interface FetchIdealistaLeadsResult {
  success: boolean;
  leads: IdealistaLead[];
  error?: string;
}

/**
 * Result of importing a single Idealista lead
 */
export interface ImportIdealistaLeadResult {
  success: boolean;
  contactId?: bigint;
  listingContactId?: bigint;
  skipped?: boolean;
  skipReason?: string;
  error?: string;
  contactCreated?: boolean;
  contactUpdated?: boolean;
  listingContactCreated?: boolean;
  listingContactSkipped?: boolean;
}

/**
 * Summary of importing multiple Idealista leads
 */
export interface ImportIdealistaLeadsSummary {
  total: number;
  imported: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
  contactsCreated: number;
  contactsUpdated: number;
  createdContactIds: bigint[];
}
