import {
  type FotocasaLead,
  type FotocasaSite,
  type FetchLeadsResult,
  fotocasaLeadsResponseSchema,
} from "~/types/fotocasa-leads";
import { getFotocasaLeadsLogger } from "~/server/utils/fotocasa-leads-logger";

const FOTOCASA_LEADS_API_BASE = "https://leads.gw.fotocasa.pro/v1";

interface FetchLeadsParams {
  apiKey: string; // Each agency's unique API key
  publisherId: string; // Each agency's unique publisher ID
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
 * - publisherId = agency's unique publisher ID (from portal settings)
 * - api-key header = agency's unique API key
 */
export async function fetchFotocasaLeads(
  params: FetchLeadsParams,
): Promise<FetchLeadsResult> {
  const { apiKey, publisherId, from, to } = params;

  const url = new URL(
    `${FOTOCASA_LEADS_API_BASE}/publishers/${publisherId}/leads`,
  );
  url.searchParams.set("from", formatDateForApi(from));
  url.searchParams.set("to", formatDateForApi(to));

  const logger = getFotocasaLeadsLogger();
  
  try {
    logger.section("FETCHING LEADS FROM FOTOCASA API");
    logger.debug("Publisher ID", publisherId);
    logger.debug("API Key", `${apiKey.substring(0, 8)}...`);
    logger.debug("Date range", `${formatDateForApi(from)} to ${formatDateForApi(to)}`);
    logger.debug("Full URL", url.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "api-key": apiKey,
        Accept: "application/json",
      },
    });

    // Handle 404 as "no leads found" - this is normal when there are no leads in the date range
    if (response.status === 404) {
      logger.info("No leads found in the requested date range (404)");
      return {
        success: true,
        leads: [],
      };
    }

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`API error ${response.status}`, errorText);
      return {
        success: false,
        leads: [],
        error: `API error ${response.status}: ${errorText}`,
      };
    }

    const data = (await response.json()) as unknown;

    // Log raw API response for debugging
    logger.section("RAW API RESPONSE");
    logger.info(`Response length: ${Array.isArray(data) ? data.length : 'not an array'}`);
    if (Array.isArray(data) && data.length > 0) {
      logger.info("First lead sample", data[0]);
      if (data.length > 1) {
        logger.info(`... and ${data.length - 1} more leads`);
      }
      // Log full response array to file
      logger.debug("Full API response", data);
    } else {
      logger.info("Full response", data);
    }

    // Validate response with Zod
    const parseResult = fotocasaLeadsResponseSchema.safeParse(data);

    if (!parseResult.success) {
      logger.error("Invalid API response", parseResult.error.message);
      logger.debug("Validation errors", parseResult.error.errors);
      return {
        success: false,
        leads: [],
        error: `Invalid API response: ${parseResult.error.message}`,
      };
    }

    logger.info(`Successfully received ${parseResult.data.length} leads`);
    return {
      success: true,
      leads: parseResult.data,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Fetch error", errorMessage);
    logger.debug("Error details", error);
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
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Parse full name into firstName and lastName
 * Handles empty/whitespace names with fallback
 * Capitalizes first letter of each name part
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

  const parts = trimmed.split(/\s+/).map(part => capitalize(part));
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
 * Extract phone prefix and number from a phone string
 * Returns prefix (defaults to "+34") and number without prefix
 */
export function extractPhonePrefix(
  phone: string | null | undefined,
): { prefix: string; number: string } {
  if (!phone) {
    return { prefix: "+34", number: "" };
  }

  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, "");

  // Check for +34 prefix
  if (cleaned.startsWith("+34")) {
    return { prefix: "+34", number: cleaned.slice(3) };
  }

  // Check for 0034 prefix
  if (cleaned.startsWith("0034")) {
    return { prefix: "+34", number: cleaned.slice(4) };
  }

  // Check for 34 prefix (if followed by 9 digits, it's likely a Spanish number)
  if (cleaned.startsWith("34") && cleaned.length > 9) {
    return { prefix: "+34", number: cleaned.slice(2) };
  }

  // Check for other country codes (e.g., +1, +44, etc.)
  const plusIndex = cleaned.indexOf("+");
  if (plusIndex === 0) {
    // Find where the country code ends (typically 1-3 digits after +)
    const match = /^\+(\d{1,3})(\d+)$/.exec(cleaned);
    if (match) {
      return { prefix: `+${match[1]}`, number: match[2] ?? "" };
    }
  }

  // No prefix found, default to +34
  return { prefix: "+34", number: cleaned };
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
 * Generate a short topic/summary for a lead (used in activity logging)
 */
export function generateLeadTopic(lead: FotocasaLead): string {
  if (lead.type.includes('CALL')) {
    const status = lead.contactDetails.attendedCall ? 'atendida' : 'perdida';
    return `Llamada ${status} - ${lead.site}`;
  }
  if (lead.message) {
    return lead.message.substring(0, 50) + (lead.message.length > 50 ? '...' : '');
  }
  return `Lead recibido desde ${lead.site}`;
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
    // Also store message as notes for contact display
    additionalInfo.notes = lead.message;
  }

  if (lead.transactionType) {
    additionalInfo.fotocasaTransactionType = lead.transactionType;
  }

  // Add call tracking data if present (for both CALL_TRACKING and CALL_TRACKING_AD)
  if (lead.type === "CALL_TRACKING" || lead.type === "CALL_TRACKING_AD") {
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

/**
 * Merge additionalInfo objects while preserving callTracking data and notes
 * Ensures callTracking from CALL_TRACKING/CALL_TRACKING_AD leads is never lost
 * Preserves existing notes field (user-entered notes should not be overwritten by lead messages)
 */
export function mergeAdditionalInfo(
  existing: Record<string, unknown> | null | undefined,
  newInfo: Record<string, unknown>,
  leadType: string,
): Record<string, unknown> {
  if (!existing) {
    return newInfo;
  }

  // If new lead has callTracking, preserve it
  // If existing has callTracking and new doesn't, preserve existing
  const isCallTrackingLead = leadType === "CALL_TRACKING" || leadType === "CALL_TRACKING_AD";
  const existingCallTracking = existing.callTracking as Record<string, unknown> | undefined;
  const newCallTracking = newInfo.callTracking as Record<string, unknown> | undefined;

  // Preserve existing notes - don't overwrite user-entered notes with lead messages
  const existingNotes = existing.notes as string | undefined;

  // Merge the objects (newInfo takes precedence for most fields)
  const merged = { ...existing, ...newInfo };

  // Preserve existing notes if they exist (user-entered notes take precedence)
  if (existingNotes) {
    merged.notes = existingNotes;
  }

  // Preserve callTracking intelligently:
  // - If new lead has callTracking, use it (it's more recent)
  // - If existing has callTracking but new doesn't, keep existing
  if (isCallTrackingLead && newCallTracking) {
    // New call tracking data - use it
    merged.callTracking = newCallTracking;
  } else if (existingCallTracking && !newCallTracking) {
    // Existing call tracking but new lead doesn't have it - preserve existing
    merged.callTracking = existingCallTracking;
  } else if (existingCallTracking && newCallTracking) {
    // Both have call tracking - merge them (new takes precedence for individual fields)
    merged.callTracking = { ...existingCallTracking, ...newCallTracking };
  }

  return merged;
}

/**
 * Determine contact status based on lead type and message content
 * Returns appropriate status for listing_contact based on intent detection
 */
export function determineContactStatus(
  leadType: string,
  message: string | null | undefined,
): "Visita pendiente" | "Información pendiente" | "Visita o información pendiente" {
  // For CALL_TRACKING without reference, no listing_contact is created (handled separately)
  // This function is only called for PROPERTY and CALL_TRACKING_AD leads
  
  if (!message) {
    return "Visita o información pendiente";
  }

  const lowerMessage = message.toLowerCase();

  // Visit keywords (check first, as they take precedence)
  const visitKeywords = [
    "visita",
    "para visitar",
    "concertar una visita",
    "visitar",
    "visitar el",
    "visitar la",
    "visitar piso",
    "visitar casa",
    "visitar inmueble",
    "ver",
    "ver piso",
    "ver casa",
    "ver inmueble",
    "ver el piso",
    "ver la casa",
    "ver el inmueble",
    "quiero visitar",
    "me gustaría visitar",
    "deseo visitar",
    "quiero ver",
    "me gustaría ver",
    "deseo ver",
    "cita para ver",
    "cita para visitar",
    "agendar visita",
    "solicitar visita",
  ];

  // Information keywords
  const informationKeywords = [
    "más información",
    "recibir más información",
    "más información sobre",
    "información sobre",
    "información del",
    "información de la",
    "información",
    "quiero información",
    "me gustaría información",
    "deseo información",
    "necesito información",
    "solicito información",
    "detalles",
    "más detalles",
    "quiero saber",
    "me gustaría saber",
    "deseo saber",
    "necesito saber",
    "consultar",
    "consulta",
    "preguntar",
    "pregunta",
    "dudas",
    "duda",
  ];

  // Check for visit intent first (takes precedence)
  const hasVisitIntent = visitKeywords.some((keyword) =>
    lowerMessage.includes(keyword),
  );

  if (hasVisitIntent) {
    return "Visita pendiente";
  }

  // Check for information intent
  const hasInformationIntent = informationKeywords.some((keyword) =>
    lowerMessage.includes(keyword),
  );

  if (hasInformationIntent) {
    return "Información pendiente";
  }

  // Default: unknown intent
  return "Visita o información pendiente";
}
