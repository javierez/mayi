/**
 * Token balance queries
 * Fetch token balance and transaction history for accounts
 */

import { db } from "~/server/db";
import { accounts, imageTokenTransactions } from "~/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export interface AccountTokenBalance {
  balance: number;
  tokensUsed: number;
}

/**
 * Get account's token balance
 * Cached for 10 seconds to reduce database load
 */
export const getAccountTokenBalance = unstable_cache(
  async (accountId: bigint): Promise<AccountTokenBalance | null> => {
    try {
      const result = await db
        .select({
          balance: accounts.imageTokenBalance,
          tokensUsed: accounts.imageTokensUsed,
        })
        .from(accounts)
        .where(eq(accounts.accountId, accountId))
        .limit(1);

      if (!result[0]) {
        return null;
      }

      return {
        balance: result[0].balance ?? 0,
        tokensUsed: result[0].tokensUsed ?? 0,
      };
    } catch (error) {
      console.error("Error fetching account token balance:", error);
      return null;
    }
  },
  ["account-token-balance"],
  {
    revalidate: 10, // Cache for 10 seconds
    tags: ["token-balance"],
  },
);

/**
 * Get recent token transactions for an account
 */
export async function getRecentTokenTransactions(
  accountId: bigint,
  limit = 10,
) {
  try {
    return await db
      .select({
        transactionId: imageTokenTransactions.transactionId,
        operation: imageTokenTransactions.operation,
        tokensChanged: imageTokenTransactions.tokensChanged,
        beforeBalance: imageTokenTransactions.beforeBalance,
        afterBalance: imageTokenTransactions.afterBalance,
        metadata: imageTokenTransactions.metadata,
        createdAt: imageTokenTransactions.createdAt,
      })
      .from(imageTokenTransactions)
      .where(eq(imageTokenTransactions.accountId, accountId))
      .orderBy(desc(imageTokenTransactions.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("Error fetching token transactions:", error);
    return [];
  }
}

/**
 * Get token usage summary for an account
 * Note: Total tokens is fixed at 10,000 for PRO accounts (one-time grant)
 */
export async function getTokenUsageSummary(accountId: bigint) {
  try {
    const balance = await getAccountTokenBalance(accountId);

    if (!balance) {
      return null;
    }

    // Fixed total for PRO accounts (10k tokens one-time grant)
    const TOTAL_TOKENS = 10000;

    return {
      currentBalance: balance.balance,
      tokensUsed: balance.tokensUsed,
      totalTokens: TOTAL_TOKENS,
      percentageRemaining: (balance.balance / TOTAL_TOKENS) * 100,
      percentageUsed: (balance.tokensUsed / TOTAL_TOKENS) * 100,
    };
  } catch (error) {
    console.error("Error calculating token usage summary:", error);
    return null;
  }
}
