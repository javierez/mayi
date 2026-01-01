/**
 * WhatsApp Status Callback Webhook
 *
 * POST /api/webhooks/whatsapp/status
 *
 * Receives message delivery status updates from Twilio.
 * Updates message status: queued → sent → delivered → read
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  handleStatusCallback,
  validateTwilioSignature,
  parseStatusFormData,
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
        console.error("[WhatsApp Status] Invalid signature");
        return NextResponse.json({ success: false, error: "Invalid signature" });
      }
    }

    // Parse the status payload
    const payload = parseStatusFormData(formData);

    // Process the status update
    const result = await handleStatusCallback(payload);

    if (!result.success) {
      console.log("[WhatsApp Status] Update failed:", result.error);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: result.success });
  } catch (error) {
    console.error("[WhatsApp Status] Unexpected error:", error);

    // Return 200 even on error to prevent Twilio retries
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Internal error",
    });
  }
}

// Verification endpoint
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: "WhatsApp status webhook endpoint active" });
}
