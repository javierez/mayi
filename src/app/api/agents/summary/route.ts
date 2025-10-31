import { type NextRequest, NextResponse } from "next/server";
import {
  getAgentSummaryStatsWithAuth,
  getAgentContactsOwnersWithAuth,
  getAgentListingsWithDetailsWithAuth,
  getAgentListingContactsWithAuth,
  getAgentTasksAndAppointmentsWithAuth,
} from "~/server/queries/agent-summary";
import { getMostUrgentTasksWithAuth } from "~/server/queries/task";
import { getTodayAppointmentsWithAuth } from "~/server/queries/operaciones-dashboard";
import { getSecureSession } from "~/lib/dal";

// Helper function to convert BigInt to string in objects
function serializeBigInt<T>(obj: T): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(obj, (_key, value: unknown) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  ) as Record<string, unknown>;
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
      detailedTasks,
      todayAppointments,
    ] = await Promise.all([
      getAgentSummaryStatsWithAuth(userId),
      getAgentContactsOwnersWithAuth(userId),
      getAgentListingsWithDetailsWithAuth(userId),
      getAgentTasksAndAppointmentsWithAuth(userId),
      getMostUrgentTasksWithAuth(10, 7, { userId }), // Get detailed tasks for selected agent
      getTodayAppointmentsWithAuth({ assignedTo: userId }), // Get appointments for selected agent
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
      detailedTasks,
      todayAppointments,
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
