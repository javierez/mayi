import { NextResponse } from "next/server";
import { getSecureSession } from "~/lib/dal";
import { calculateAndStoreMatches } from "~/server/queries/match-calculation-service";

/**
 * POST /api/matches/calculate
 * Manually trigger match calculation and storage
 *
 * This endpoint:
 * 1. Authenticates the user
 * 2. Marks existing matches as stale
 * 3. Calculates fresh matches (internal + cross-account)
 * 4. Stores them in prospect_listing_matches table
 *
 * Body (optional):
 * {
 *   "prospectIds": ["123", "456"],  // Optional: specific prospects
 *   "listingIds": ["789", "012"],   // Optional: specific listings
 *   "clearStale": true               // Optional: mark existing as stale (default: true)
 * }
 */
export async function POST(request: Request) {
  try {
    // Authentication check
    const session = await getSecureSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("📞 Manual match calculation triggered by:", {
      userId: session.user.id,
      accountId: session.user.accountId,
      timestamp: new Date().toISOString(),
    });

    // Parse request body (optional parameters)
    const body = (await request.json().catch(() => ({}))) as {
      prospectIds?: string[];
      listingIds?: string[];
      clearStale?: boolean;
    };
    const { prospectIds, listingIds, clearStale = true } = body;

    // Run calculation
    const startTime = Date.now();
    const result = await calculateAndStoreMatches({
      accountId: BigInt(session.user.accountId),
      prospectIds: prospectIds?.map((id) => BigInt(id)),
      listingIds: listingIds?.map((id) => BigInt(id)),
      clearStale,
    });
    const totalTime = Date.now() - startTime;

    console.log("✅ Manual calculation completed:", {
      ...result,
      totalTime,
      userId: session.user.id,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Matches calculated and stored successfully",
        data: {
          matchesCalculated: result.matchesCalculated,
          matchesInserted: result.matchesInserted,
          matchesMarkedStale: result.matchesMarkedStale,
          executionTime: result.executionTime,
          totalTime,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Match calculation completed with errors",
          data: result,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Manual match calculation failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate matches",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/matches/calculate/status
 * Get status of match calculation system
 */
export async function GET() {
  try {
    const session = await getSecureSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add logic to check last calculation time, number of matches, etc.
    return NextResponse.json({
      status: "operational",
      message: "Match calculation system is operational",
      features: {
        manualTrigger: true,
        backgroundJob: false, // We're not using cron
        tableStorage: true,
      },
    });
  } catch (error) {
    console.error("Error checking match calculation status:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
