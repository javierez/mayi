/**
 * WhatsApp Incoming Message Webhook
 *
 * POST /api/webhooks/whatsapp/incoming
 *
 * Receives incoming WhatsApp messages from Twilio.
 * Stores messages and updates conversations.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  handleIncomingMessage,
  validateTwilioSignature,
  parseWebhookFormData,
} from "~/server/services/whatsapp-webhook-handler";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the Twilio signature from headers
    const twilioSignature = request.headers.get("x-twilio-signature");

    // Parse form data
    const formData = await request.formData();

    // Build URL for signature validation
    const url = request.url;

    // Convert FormData to params object for validation
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = typeof value === "string" ? value : value.name;
    });

    // Validate signature (optional in dev, required in prod)
    if (process.env.NODE_ENV === "production" && twilioSignature) {
      const isValid = validateTwilioSignature(url, params, twilioSignature);

      if (!isValid) {
        console.error("[WhatsApp Webhook] Invalid signature");
        // Still return 200 to prevent Twilio retries
        return NextResponse.json({ success: false, error: "Invalid signature" });
      }
    }

    // Parse the webhook payload
    const payload = parseWebhookFormData(formData);

    // Process the incoming message
    const result = await handleIncomingMessage(payload);

    if (!result.success) {
      console.log("[WhatsApp Webhook] Message not processed:", result.error);
    }

    // Always return 200 to acknowledge receipt
    // Twilio will retry if we return an error
    return NextResponse.json({
      success: result.success,
      messageId: result.messageId?.toString(),
    });
  } catch (error) {
    console.error("[WhatsApp Webhook] Unexpected error:", error);

    // Return 200 even on error to prevent Twilio retries
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Internal error",
    });
  }
}

// Twilio may send GET requests for webhook verification
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: "WhatsApp webhook endpoint active" });
}
