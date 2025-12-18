import { env } from "~/env";
import {
  type FotocasaLead,
  type FotocasaSite,
  type FetchLeadsResult,
  fotocasaLeadsResponseSchema,
} from "~/types/fotocasa-leads";

const FOTOCASA_LEADS_API_BASE = "https://leads.gw.fotocasa.pro/v1";

interface FetchLeadsParams {
  apiKey: string; // Each agency's unique API key
  from: Date;
  to: Date;
}

/**
 * Format date for Fotocasa API
 * Format: yyyy-MM-dd HH:mm:ss
 */
function formatDateForApi(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

/**
 * Fetch leads from Fotocasa Leads API
 * - publisherId = env.FOTOCASA_ID (VESTA's platform ID - same for all agencies)
 * - api-key header = agency's unique API key
 */
export async function fetchFotocasaLeads(
  params: FetchLeadsParams,
): Promise<FetchLeadsResult> {
  const { apiKey, from, to } = params;
  const publisherId = env.FOTOCASA_ID; // VESTA's publisher ID

  const url = new URL(
    `${FOTOCASA_LEADS_API_BASE}/publishers/${publisherId}/leads`,
  );
  url.searchParams.set("from", formatDateForApi(from));
  url.searchParams.set("to", formatDateForApi(to));

  try {
    console.log(`[Fotocasa Leads] === DEBUG INFO ===`);
    console.log(`[Fotocasa Leads] Publisher ID: ${publisherId}`);
    console.log(`[Fotocasa Leads] API Key: ${apiKey.substring(0, 8)}...`);
    console.log(`[Fotocasa Leads] Date range: ${formatDateForApi(from)} to ${formatDateForApi(to)}`);
    console.log(`[Fotocasa Leads] Full URL: ${url.toString()}`);
    console.log(`[Fotocasa Leads] =================`);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "api-key": apiKey,
        Accept: "application/json",
      },
    });

    // Handle 404 as "no leads found" - this is normal when there are no leads in the date range
    if (response.status === 404) {
      console.log(`[Fotocasa Leads] No leads found in the requested date range (404)`);
      return {
        success: true,
        leads: [],
      };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[Fotocasa Leads] API error ${response.status}: ${errorText}`,
      );
      return {
        success: false,
        leads: [],
        error: `API error ${response.status}: ${errorText}`,
      };
    }

    const data = (await response.json()) as unknown;

    // Validate response with Zod
    const parseResult = fotocasaLeadsResponseSchema.safeParse(data);

    if (!parseResult.success) {
      console.error(
        "[Fotocasa Leads] Invalid API response:",
        parseResult.error.message,
      );
      return {
        success: false,
        leads: [],
        error: `Invalid API response: ${parseResult.error.message}`,
      };
    }

    console.log(`[Fotocasa Leads] Received ${parseResult.data.length} leads`);
    return {
      success: true,
      leads: parseResult.data,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Fotocasa Leads] Fetch error:", errorMessage);
    return {
      success: false,
      leads: [],
      error: errorMessage,
    };
  }
}

/**
 * Map Fotocasa site to Vesta contact source
 */
export function mapSiteToSource(site: FotocasaSite): string {
  switch (site) {
    case "FOTOCASA":
      return "fotocasa";
    case "HABITACLIA":
      return "habitaclia";
    case "MILANUNCIOS":
      return "milanuncios";
    default:
      return "fotocasa";
  }
}

/**
 * Parse full name into firstName and lastName
 * Handles empty/whitespace names with fallback
 */
export function parseName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const trimmed = fullName.trim();
  if (!trimmed) {
    // Fallback for empty names
    return { firstName: "Lead", lastName: "Fotocasa" };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0] ?? "Lead", lastName: "" };
  }

  const firstName = parts[0] ?? "Lead";
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

/**
 * Normalize phone number for comparison
 * Removes spaces, dashes, parentheses, and Spanish country code (+34)
 * Returns null if phone is empty/invalid
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove all non-digit characters except leading +
  let normalized = phone.replace(/[^\d+]/g, "");

  // Remove Spanish country code variations
  if (normalized.startsWith("+34")) {
    normalized = normalized.slice(3);
  } else if (normalized.startsWith("0034")) {
    normalized = normalized.slice(4);
  } else if (normalized.startsWith("34") && normalized.length > 9) {
    normalized = normalized.slice(2);
  }

  // Remove any remaining + (from other country codes)
  normalized = normalized.replace(/\+/g, "");

  // Return null if too short to be a valid phone
  if (normalized.length < 6) return null;

  return normalized;
}

/**
 * Check if a lead has valid contact info (at least email or phone)
 */
export function hasValidContactInfo(lead: FotocasaLead): boolean {
  const hasEmail = Boolean(lead.contactDetails.email?.trim());
  const hasPhone = Boolean(normalizePhone(lead.contactDetails.phone));
  return hasEmail || hasPhone;
}

/**
 * Build additionalInfo object for contact from Fotocasa lead
 */
export function buildLeadAdditionalInfo(
  lead: FotocasaLead,
): Record<string, unknown> {
  const additionalInfo: Record<string, unknown> = {
    fotocasaLeadId: lead.id,
    fotocasaDate: lead.date,
    fotocasaSite: lead.site,
    fotocasaType: lead.type,
  };

  if (lead.reference) {
    additionalInfo.fotocasaReference = lead.reference;
  }

  if (lead.message) {
    additionalInfo.fotocasaMessage = lead.message;
  }

  if (lead.transactionType) {
    additionalInfo.fotocasaTransactionType = lead.transactionType;
  }

  // Add call tracking data if present
  if (lead.type === "CALL_TRACKING") {
    const callTracking: Record<string, unknown> = {};

    if (lead.contactDetails.audioUrl) {
      callTracking.audioUrl = lead.contactDetails.audioUrl;
    }
    if (lead.contactDetails.duration !== undefined) {
      callTracking.duration = lead.contactDetails.duration;
    }
    if (lead.contactDetails.calledPhone) {
      callTracking.calledPhone = lead.contactDetails.calledPhone;
    }
    if (lead.contactDetails.attendedCall !== undefined) {
      callTracking.attendedCall = lead.contactDetails.attendedCall;
    }

    if (Object.keys(callTracking).length > 0) {
      additionalInfo.callTracking = callTracking;
    }
  }

  return additionalInfo;
}
