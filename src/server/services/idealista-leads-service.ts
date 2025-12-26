import { getGmailClient } from "~/lib/google-gmail";
import { decodeMessageBody } from "~/lib/gmail-transformers";
import type { IdealistaLead, FetchIdealistaLeadsResult } from "~/types/idealista-leads";
import { getIdealistaLeadsLogger } from "~/server/utils/idealista-leads-logger";
import { randomUUID } from "crypto";

/**
 * Parameters for fetching Idealista leads from Gmail
 */
interface FetchIdealistaLeadsParams {
  userId: string;
  from: Date;
  to: Date;
}

/**
 * Fetch Idealista leads from Gmail emails
 * Queries emails from reply@idealista.com within the specified date range
 */
export async function fetchIdealistaLeadsFromGmail(
  params: FetchIdealistaLeadsParams
): Promise<FetchIdealistaLeadsResult> {
  const { userId, from, to } = params;
  const logger = getIdealistaLeadsLogger();

  try {
    const gmail = await getGmailClient(userId);
    if (!gmail) {
      return {
        success: false,
        leads: [],
        error: "Gmail not connected for user",
      };
    }

    // Build Gmail query for Idealista emails
    // Format: after:YYYY/MM/DD before:YYYY/MM/DD
    const afterDate = formatDateForGmail(from);
    const beforeDate = formatDateForGmail(to);
    const query = `from:reply@idealista.com after:${afterDate} before:${beforeDate}`;

    logger.info(`Fetching Idealista emails with query: ${query}`);

    // List messages matching query
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 100,
    });

    const messageRefs = listResponse.data.messages ?? [];
    logger.info(`Found ${messageRefs.length} Idealista emails`);

    if (messageRefs.length === 0) {
      return { success: true, leads: [] };
    }

    const leads: IdealistaLead[] = [];

    // Fetch and parse each message
    for (const messageRef of messageRefs) {
      if (!messageRef.id) continue;

      try {
        const messageResponse = await gmail.users.messages.get({
          userId: "me",
          id: messageRef.id,
          format: "full",
        });

        const message = messageResponse.data;
        const headers = message.payload?.headers ?? [];

        // Get subject and date
        const subject = getHeader(headers, "Subject") ?? "";
        const dateHeader = getHeader(headers, "Date") ?? "";
        const emailDate = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString();
        const threadId = message.threadId ?? messageRef.id;

        // Decode message body
        const { content, htmlContent } = decodeMessageBody(message.payload);
        const bodyText = htmlContent ?? content;

        // Parse the email to extract lead data
        const lead = parseIdealistaEmail(
          bodyText,
          subject,
          messageRef.id,
          threadId,
          emailDate
        );

        if (lead) {
          leads.push(lead);
          logger.debug(`Parsed lead: ${lead.senderName} (${lead.senderEmail})`);
        } else {
          logger.warn(`Could not parse lead from email: ${subject}`);
        }
      } catch (parseError) {
        logger.error(`Error parsing message ${messageRef.id}:`, parseError);
      }
    }

    logger.info(`Successfully parsed ${leads.length} leads from ${messageRefs.length} emails`);
    return { success: true, leads };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to fetch Idealista leads from Gmail:", error);
    return {
      success: false,
      leads: [],
      error: errorMessage,
    };
  }
}

/**
 * Parse an Idealista email to extract lead information
 */
export function parseIdealistaEmail(
  bodyText: string,
  subject: string,
  gmailMessageId: string,
  gmailThreadId: string,
  emailDate: string
): IdealistaLead | null {
  const logger = getIdealistaLeadsLogger();

  try {
    // Extract name from subject: "Nuevo mensaje de volodymr sobre tu inmueble..."
    const nameFromSubject = extractNameFromSubject(subject);

    // Extract property reference from subject: "...con ref: VESTA2025000011,..."
    const propertyReference = extractPropertyReference(subject);

    // Extract masked email (@contacts.idealista.com)
    const maskedEmail = extractMaskedEmail(bodyText);

    // Extract real email from message body (not the masked one)
    const realEmail = extractRealEmail(bodyText);

    // Extract phone number if present
    const phone = extractPhoneNumber(bodyText);

    // Extract message content
    const message = extractMessageContent(bodyText);

    // Extract Idealista ad code: "Código del anuncio: 110160328"
    const idealistaAdCode = extractAdCode(bodyText);

    // Validate required fields
    if (!realEmail && !maskedEmail) {
      logger.warn("No email found in Idealista email");
      return null;
    }

    if (!propertyReference) {
      logger.warn("No property reference found in Idealista email");
      return null;
    }

    return {
      id: randomUUID(),
      emailDate,
      senderName: nameFromSubject ?? "Idealista Lead",
      senderEmail: realEmail ?? maskedEmail ?? "",
      maskedEmail: maskedEmail ?? "",
      phone,
      message: message ?? "",
      propertyReference,
      idealistaAdCode: idealistaAdCode ?? "",
      gmailMessageId,
      gmailThreadId,
    };
  } catch (error) {
    logger.error("Error parsing Idealista email:", error);
    return null;
  }
}

/**
 * Extract name from subject line
 * Pattern: "Nuevo mensaje de volodymr sobre tu inmueble..."
 */
function extractNameFromSubject(subject: string): string | null {
  const regex = /mensaje de\s+(\S+)\s+sobre/i;
  const match = regex.exec(subject);
  return match ? match[1] ?? null : null;
}

/**
 * Extract property reference from subject
 * Pattern: "...con ref: VESTA2025000011,..."
 */
function extractPropertyReference(subject: string): string | null {
  const regex = /ref[.:]\s*([A-Z0-9]+)/i;
  const match = regex.exec(subject);
  return match ? match[1] ?? null : null;
}

/**
 * Extract masked Idealista email
 * Pattern: xxx@contacts.idealista.com
 */
function extractMaskedEmail(bodyText: string): string | null {
  const regex = /([a-zA-Z0-9]+@contacts\.idealista\.com)/i;
  const match = regex.exec(bodyText);
  return match ? match[1] ?? null : null;
}

/**
 * Extract real email from message body (not the masked @contacts.idealista.com)
 * Looks for email pattern that's NOT @contacts.idealista.com
 */
function extractRealEmail(bodyText: string): string | null {
  // Match email addresses but exclude @contacts.idealista.com
  const emailRegex = /([a-zA-Z0-9._%+-]+@(?!contacts\.idealista\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const matches = bodyText.match(emailRegex);

  if (!matches || matches.length === 0) {
    return null;
  }

  // Filter out common Idealista-related emails
  const filteredEmails = matches.filter((email) => {
    const lowerEmail = email.toLowerCase();
    return (
      !lowerEmail.includes("idealista.com") &&
      !lowerEmail.includes("noreply") &&
      !lowerEmail.includes("reply@")
    );
  });

  return filteredEmails[0] ?? null;
}

/**
 * Extract Spanish phone number from text
 * Patterns: +34 XXX XXX XXX, 6XX XXX XXX, 7XX XXX XXX, etc.
 */
function extractPhoneNumber(bodyText: string): string | null {
  // Match various Spanish phone formats
  const phoneRegexes = [
    /(?:\+34|0034)?[\s.-]?[67]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/g,
    /(?:\+34|0034)?[\s.-]?[89]\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/g,
  ];

  for (const regex of phoneRegexes) {
    const matches = bodyText.match(regex);
    if (matches && matches.length > 0) {
      // Clean up the phone number
      const phone = matches[0]?.replace(/[\s.-]/g, "");
      if (phone && phone.length >= 9) {
        return phone;
      }
    }
  }

  return null;
}

/**
 * Extract message content from the email body
 * The message appears between the masked email and "Responder desde idealista"
 */
function extractMessageContent(bodyText: string): string | null {
  // Try to find the message section
  // It's usually after the masked email line and before "Responder desde"

  // First, try to find content between specific markers
  const markerRegex = /@contacts\.idealista\.com\s*([\s\S]*?)(?:Responder desde|También puedes)/i;
  const match = markerRegex.exec(bodyText);

  if (match?.[1]) {
    // Clean up the extracted message
    let message = match[1]
      .replace(/<[^>]*>/g, " ") // Remove HTML tags
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    // Remove any email addresses from the message (they'll be extracted separately)
    message = message.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "").trim();

    if (message.length > 0) {
      return message;
    }
  }

  // Fallback: look for common message patterns
  const fallbackPatterns = [
    /Hola[,\s]*([\s\S]*?)(?:Un saludo|Saludos|Gracias)/i,
    /interesa\s*([\s\S]*?)(?:Responder|También)/i,
  ];

  for (const pattern of fallbackPatterns) {
    const fallbackMatch = pattern.exec(bodyText);
    if (fallbackMatch?.[0]) {
      return fallbackMatch[0]
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  return null;
}

/**
 * Extract Idealista ad code
 * Pattern: "Código del anuncio: 110160328"
 */
function extractAdCode(bodyText: string): string | null {
  const regex = /[cC][oó]digo del anuncio[:\s]*(\d+)/i;
  const match = regex.exec(bodyText);
  return match ? match[1] ?? null : null;
}

/**
 * Get header value from Gmail headers array
 */
function getHeader(
  headers: Array<{ name?: string | null; value?: string | null }>,
  name: string
): string | null {
  const header = headers.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase()
  );
  return header?.value ?? null;
}

/**
 * Format date for Gmail query (YYYY/MM/DD)
 */
function formatDateForGmail(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

/**
 * Parse name into firstName and lastName
 * Similar to fotocasa-leads-service.ts
 */
export function parseName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName || fullName.trim() === "") {
    return { firstName: "Lead", lastName: "Idealista" };
  }

  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return {
      firstName: capitalizeWord(parts[0] ?? ""),
      lastName: "",
    };
  }

  const firstName = capitalizeWord(parts[0] ?? "");
  const lastName = parts
    .slice(1)
    .map(capitalizeWord)
    .join(" ");

  return { firstName, lastName };
}

/**
 * Capitalize first letter of a word
 */
function capitalizeWord(word: string): string {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Normalize phone number (remove non-digits, handle Spanish prefix)
 * Similar to fotocasa-leads-service.ts
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, "");

  // Handle Spanish country code
  if (digits.startsWith("34") && digits.length > 9) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0034")) {
    digits = digits.slice(4);
  }

  // Return null if too short
  if (digits.length < 6) return null;

  return digits;
}

/**
 * Extract phone prefix from phone number
 */
export function extractPhonePrefix(phone: string | null | undefined): string | null {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");

  if (phone.includes("+34") || digits.startsWith("34")) {
    return "+34";
  }
  if (digits.startsWith("0034")) {
    return "+34";
  }

  // Default Spanish prefix for mobile/landline numbers
  if (digits.startsWith("6") || digits.startsWith("7") || digits.startsWith("8") || digits.startsWith("9")) {
    return "+34";
  }

  return null;
}

/**
 * Check if lead has valid contact info
 */
export function hasValidContactInfo(lead: IdealistaLead): boolean {
  const hasEmail = Boolean(lead.senderEmail?.includes("@"));
  const hasPhone = Boolean(lead.phone && normalizePhone(lead.phone));
  return hasEmail || hasPhone;
}

/**
 * Build additional info object for storing in contact
 */
export function buildLeadAdditionalInfo(lead: IdealistaLead): Record<string, unknown> {
  return {
    idealistaLeadId: lead.id,
    idealistaAdCode: lead.idealistaAdCode,
    idealistaDate: lead.emailDate,
    gmailMessageId: lead.gmailMessageId,
    gmailThreadId: lead.gmailThreadId,
    maskedEmail: lead.maskedEmail,
    notes: lead.message,
  };
}

/**
 * Determine contact status based on message content
 */
export function determineContactStatus(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("visita") ||
    lowerMessage.includes("ver el piso") ||
    lowerMessage.includes("ver la casa") ||
    lowerMessage.includes("ver el inmueble") ||
    lowerMessage.includes("visitarlo") ||
    lowerMessage.includes("visitarla") ||
    lowerMessage.includes("quedar")
  ) {
    return "Visita pendiente";
  }

  if (
    lowerMessage.includes("información") ||
    lowerMessage.includes("informacion") ||
    lowerMessage.includes("precio") ||
    lowerMessage.includes("disponible") ||
    lowerMessage.includes("detalles")
  ) {
    return "Información pendiente";
  }

  return "Visita o información pendiente";
}

/**
 * Merge additional info, preserving existing user notes
 */
export function mergeAdditionalInfo(
  existing: Record<string, unknown> | null,
  newInfo: Record<string, unknown>
): Record<string, unknown> {
  if (!existing) {
    return newInfo;
  }

  // Preserve existing notes if they exist
  const existingNotes = existing.notes as string | undefined;
  const newNotes = newInfo.notes as string | undefined;

  return {
    ...existing,
    ...newInfo,
    notes: existingNotes
      ? `${existingNotes}\n---\n${newNotes ?? ""}`
      : newNotes,
  };
}
