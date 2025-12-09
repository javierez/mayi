import { type NextRequest, NextResponse } from "next/server";
import { getSecureSession } from "~/lib/dal";
import { unsubscribePushAction } from "~/server/actions/push-subscription";

/**
 * DELETE /api/push/unsubscribe
 * Unsubscribe from push notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log("[PushSubscription] 📨 DELETE /api/push/unsubscribe called");
    const session = await getSecureSession();

    if (!session?.user) {
      console.log("[PushSubscription] ❌ Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      subscriptionId: string;
    };

    console.log("[PushSubscription] 📥 Request body received:", {
      subscriptionId: body.subscriptionId,
    });

    if (!body.subscriptionId) {
      console.log("[PushSubscription] ❌ Missing subscription ID");
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 },
      );
    }

    const result = await unsubscribePushAction(BigInt(body.subscriptionId));

    if (!result.success) {
      console.log("[PushSubscription] ❌ Unsubscribe failed:", result.error);
      return NextResponse.json(
        { error: result.error ?? "Failed to unsubscribe" },
        { status: 400 },
      );
    }

    console.log("[PushSubscription] ✅ Unsubscribe successful");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PushSubscription] ❌ Error in DELETE /api/push/unsubscribe:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

