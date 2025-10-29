import { NextResponse } from "next/server";
import { getAccountAgentsWithAuth } from "~/server/queries/agent-summary";
import { getSecureSession } from "~/lib/dal";

// Helper function to convert BigInt to string in objects
function serializeBigInt<T>(obj: T): unknown {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );
}

export async function GET() {
  try {
    const session = await getSecureSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agents = await getAccountAgentsWithAuth();

    // Serialize BigInt values to strings
    const response = serializeBigInt(agents);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching agents list:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents list" },
      { status: 500 },
    );
  }
}
