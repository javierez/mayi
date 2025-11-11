import { getCurrentUser } from "~/lib/dal";
import { getTokenUsageSummary } from "~/server/queries/tokens";
import { TokenTrackerRing } from "./token-tracker-ring";

interface TokenTrackerServerProps {
  className?: string;
}

/**
 * Server component that fetches token balance and passes to client component
 */
export async function TokenTrackerServer({
  className,
}: TokenTrackerServerProps) {
  try {
    // Get account info from session
    const user = await getCurrentUser();

    if (!user?.accountId) {
      console.warn("No account ID found for token tracker");
      return null;
    }

    // Fetch token usage summary
    const tokenSummary = await getTokenUsageSummary(
      BigInt(user.accountId),
    );

    if (!tokenSummary) {
      console.warn("Could not fetch token summary for account");
      return null;
    }

    // Pass data to client component
    return (
      <TokenTrackerRing
        className={className}
      />
    );
  } catch (error) {
    console.error("Error in TokenTrackerServer:", error);
    return null;
  }
}
