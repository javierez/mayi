/**
 * Contact Duplicate Detection Utilities
 *
 * Provides functions to normalize contact data and detect potential duplicates
 * based on email, phone, and name combinations.
 */

/**
 * Normalizes a phone number by removing all non-numeric characters
 * and common international prefixes.
 *
 * Examples:
 * - "+34 123 456 789" → "123456789"
 * - "(123) 456-7890" → "1234567890"
 * - "123 456 789" → "123456789"
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";

  // Remove all non-numeric characters
  let normalized = phone.replace(/\D/g, "");

  // Remove common Spanish prefix (+34)
  if (normalized.startsWith("34") && normalized.length > 9) {
    normalized = normalized.substring(2);
  }

  return normalized;
}

/**
 * Normalizes an email address by converting to lowercase and trimming whitespace.
 *
 * Examples:
 * - "John.Doe@Email.com" → "john.doe@email.com"
 * - "  user@example.com  " → "user@example.com"
 */
export function normalizeEmail(email: string | null | undefined): string {
  if (!email) return "";
  return email.toLowerCase().trim();
}

/**
 * Normalizes a name by trimming whitespace and converting to lowercase
 * for case-insensitive comparisons.
 */
export function normalizeName(name: string | null | undefined): string {
  if (!name) return "";
  return name.toLowerCase().trim();
}

/**
 * Represents a potential duplicate contact match
 */
export interface DuplicateContact {
  contactId: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  matchReason: string;
  matchType:
    | "exact_email"
    | "exact_phone"
    | "email_and_name"
    | "phone_and_name";
}

/**
 * Input data for checking duplicates
 */
export interface ContactCheckInput {
  firstName: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
}

/**
 * Validates if contact has at least one identifier (email or phone)
 */
export function hasValidIdentifier(contact: ContactCheckInput): boolean {
  const hasEmail = !!contact.email?.trim();
  const hasPhone = !!contact.phone?.trim();
  return hasEmail || hasPhone;
}

/**
 * Determines the match reason display text based on match type
 */
export function getMatchReasonText(
  matchType: DuplicateContact["matchType"],
): string {
  switch (matchType) {
    case "exact_email":
      return "Mismo correo electrónico";
    case "exact_phone":
      return "Mismo número de teléfono";
    case "email_and_name":
      return "Mismo correo y nombre";
    case "phone_and_name":
      return "Mismo teléfono y nombre";
    default:
      return "Posible duplicado";
  }
}
