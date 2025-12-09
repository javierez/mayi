import { type NextRequest, NextResponse } from "next/server";
import { getSecureSession } from "~/lib/dal";
import { subscribePushAction } from "~/server/actions/push-subscription";

/**
 * POST /api/push/subscribe
 * Subscribe to push notifications
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[PushSubscription] 📨 POST /api/push/subscribe called");
    const session = await getSecureSession();

    if (!session?.user) {
      console.log("[PushSubscription] ❌ Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      endpoint: string;
      keys: {
        p256dh: string;
        auth: string;
      };
      userAgent?: string;
    };

    console.log("[PushSubscription] 📥 Request body received:", {
      endpoint: body.endpoint?.substring(0, 50) + "...",
      hasKeys: !!body.keys,
      userAgent: body.userAgent?.substring(0, 50),
    });

    // Validate subscription object
    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      console.log("[PushSubscription] ❌ Invalid subscription object");
      return NextResponse.json(
        { error: "Invalid subscription object" },
        { status: 400 },
      );
    }

    const result = await subscribePushAction({
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: body.userAgent ?? request.headers.get("user-agent") ?? undefined,
    });

    if (!result.success) {
      console.log("[PushSubscription] ❌ Subscription failed:", result.error);
      return NextResponse.json(
        { error: result.error ?? "Failed to subscribe" },
        { status: 400 },
      );
    }

    console.log("[PushSubscription] ✅ Subscription successful");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PushSubscription] ❌ Error in POST /api/push/subscribe:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

