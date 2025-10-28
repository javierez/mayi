/**
 * Share utility functions for SMS, WhatsApp, and clipboard
 */

/**
 * Opens the SMS app with a pre-filled message
 * @param phoneNumber - The recipient's phone number
 * @param message - The message to send
 */
export function sendSMS(phoneNumber: string, message: string): void {
  // Clean phone number (remove spaces, dashes, etc.)
  const cleanPhone = phoneNumber.replace(/[\s\-()]/g, "");

  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);

  // Different URL schemes for different platforms
  // iOS uses sms:, Android uses sms:
  const smsUrl = `sms:${cleanPhone}${
    /iPhone|iPad|iPod/.test(navigator.userAgent) ? "&" : "?"
  }body=${encodedMessage}`;

  // Open SMS app
  window.location.href = smsUrl;
}

/**
 * Opens WhatsApp with a pre-filled message
 * @param phoneNumber - The recipient's phone number (with country code)
 * @param message - The message to send
 */
export function openWhatsApp(phoneNumber: string, message: string): void {
  // Clean phone number and ensure it starts with country code
  let cleanPhone = phoneNumber.replace(/[\s\-()]/g, "");

  // If phone doesn't start with +, assume it's Spanish (+34)
  if (!cleanPhone.startsWith("+")) {
    // Remove leading 0 if present (Spanish mobile numbers often start with 0)
    if (cleanPhone.startsWith("0")) {
      cleanPhone = cleanPhone.substring(1);
    }
    // Add Spanish country code
    cleanPhone = `34${cleanPhone}`;
  } else {
    // Remove the + sign for WhatsApp API
    cleanPhone = cleanPhone.substring(1);
  }

  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);

  // WhatsApp Web/App URL
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  // Open in new window
  window.open(whatsappUrl, "_blank");
}

/**
 * Copies text to clipboard
 * @param text - The text to copy
 * @returns Promise that resolves when copy is successful
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand("copy");
    textArea.remove();

    if (!successful) {
      throw new Error("Copy command failed");
    }
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    throw new Error("No se pudo copiar al portapapeles");
  }
}

/**
 * Formats a phone number for display
 * @param phoneNumber - The phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-numeric characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, "");

  // Spanish mobile format: +34 XXX XX XX XX
  if (cleaned.startsWith("+34") && cleaned.length === 12) {
    return `+34 ${cleaned.substring(3, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)} ${cleaned.substring(10, 12)}`;
  }

  // Spanish landline format: +34 XX XXX XX XX
  if (cleaned.startsWith("+34") && cleaned.length === 11) {
    return `+34 ${cleaned.substring(3, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8, 10)} ${cleaned.substring(10, 11)}`;
  }

  // Default: return as-is if doesn't match Spanish format
  return phoneNumber;
}

/**
 * Validates if a string is a valid email address
 * @param email - The email to validate
 * @returns true if valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates if a string is a valid phone number
 * @param phone - The phone to validate
 * @returns true if valid phone number
 */
export function isValidPhone(phone: string): boolean {
  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, "");

  // Must have at least 9 digits (basic validation)
  const digitCount = cleaned.replace(/\+/g, "").length;
  return digitCount >= 9 && digitCount <= 15;
}
