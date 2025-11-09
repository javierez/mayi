import twilio from "twilio";
import { env } from "~/env";

/**
 * Twilio SMS Service
 * Sends verification codes via SMS for 2FA
 *
 * Note: TWILIO_ACCOUNT_SID can be either:
 * - Account SID (starts with AC) - standard authentication
 * - API Key SID (starts with SK) - API key authentication (more secure)
 */

// Initialize Twilio client
// If using API Key (SK), Twilio will automatically detect and use key-based auth
const twilioClient = twilio(
  env.TWILIO_ACCOUNT_SID,
  env.TWILIO_AUTH_TOKEN,
);

/**
 * Generate a 6-digit verification code
 */
export function generateSMSCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Normalize phone number to E.164 format
 * Automatically adds +34 prefix for Spanish numbers without country code
 */
function normalizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return "";

  // Remove any whitespace
  let normalized = phoneNumber.trim().replace(/\s+/g, "");

  // If already has country code, return as is
  if (normalized.startsWith("+")) {
    return normalized;
  }

  // If starts with 00, replace with +
  if (normalized.startsWith("00")) {
    return "+" + normalized.substring(2);
  }

  // If starts with 34, add +
  if (normalized.startsWith("34")) {
    return "+" + normalized;
  }

  // Otherwise, assume Spanish number and add +34
  return "+34" + normalized;
}

/**
 * Send SMS verification code
 * @param phoneNumber - Phone number (will be normalized to E.164 format)
 * @param code - 6-digit verification code
 * @returns Success status and message
 */
export async function sendSMSCode(
  phoneNumber: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("📱 [Twilio] Original phone number:", phoneNumber);

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    console.log("📱 [Twilio] Normalized phone number:", normalizedPhone);
    console.log("📱 [Twilio] Phone number type:", typeof normalizedPhone);

    // Validate phone number format
    if (!normalizedPhone || !normalizedPhone.startsWith("+")) {
      console.error("❌ [Twilio] Invalid phone number format:", normalizedPhone);
      return {
        success: false,
        error: "Número de teléfono inválido. Debe incluir código de país (+34 para España).",
      };
    }

    const senderId = env.TWILIO_SENDER_ID ?? env.TWILIO_PHONE_NUMBER;

    const message = await twilioClient.messages.create({
      body: `Tu código de verificación de Vesta es: ${code}. Válido por 5 minutos.`,
      from: senderId,
      to: normalizedPhone,
    });

    console.log(`SMS sent successfully: ${message.sid}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return {
      success: false,
      error: "Error al enviar el código SMS. Por favor, verifica el número de teléfono.",
    };
  }
}
