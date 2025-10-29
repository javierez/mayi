import { type NextRequest, NextResponse } from "next/server";
import {
  getAgentSummaryStatsWithAuth,
  getAgentContactsOwnersWithAuth,
  getAgentListingsWithDetailsWithAuth,
  getAgentListingContactsWithAuth,
  getAgentTasksAndAppointmentsWithAuth,
  getUrgentAgentActionsWithAuth,
} from "~/server/queries/agent-summary";
import { getSecureSession } from "~/lib/dal";

// Helper function to convert BigInt to string in objects
function serializeBigInt<T>(obj: T): unknown {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSecureSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get userId from query params (for Account Admins viewing other agents)
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") ?? session.user.id;

    // Fetch all data in parallel for better performance
    const [
      stats,
      contacts,
      listings,
      { tasks, appointments },
      urgentActions,
    ] = await Promise.all([
      getAgentSummaryStatsWithAuth(userId),
      getAgentContactsOwnersWithAuth(userId),
      getAgentListingsWithDetailsWithAuth(userId),
      getAgentTasksAndAppointmentsWithAuth(userId),
      getUrgentAgentActionsWithAuth(userId),
    ]);

    // Get listing contacts for all listings
    const listingIds = listings.map((listing) => listing.listingId);
    const listingContacts = await getAgentListingContactsWithAuth(listingIds);

    // Serialize BigInt values to strings
    const response = serializeBigInt({
      stats,
      contacts,
      listings,
      listingContacts,
      tasks,
      appointments,
      urgentActions,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching agent summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent summary" },
      { status: 500 },
    );
  }
}
