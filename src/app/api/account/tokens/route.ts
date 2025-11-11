import { NextResponse } from "next/server";
import { getSecureSession } from "~/lib/dal";
import { getTokenUsageSummary } from "~/server/queries/tokens";

/**
 * GET /api/account/tokens
 * Get current account's token balance and usage summary
 */
export async function GET() {
  try {
    // Get authenticated session
    const session = await getSecureSession();

    if (!session?.user?.accountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = BigInt(session.user.accountId);

    // Fetch token usage summary
    const tokenSummary = await getTokenUsageSummary(accountId);

    if (!tokenSummary) {
      return NextResponse.json(
        { error: "Could not fetch token balance" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        currentBalance: tokenSummary.currentBalance,
        tokensUsed: tokenSummary.tokensUsed,
        totalTokens: tokenSummary.totalTokens,
        percentageRemaining: tokenSummary.percentageRemaining,
        percentageUsed: tokenSummary.percentageUsed,
      },
    });
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch token balance" },
      { status: 500 },
    );
  }
}
