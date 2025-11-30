import { NextResponse } from "next/server";
import { getAgentsForGalleryWithAuth } from "~/server/queries/users";
import { getSecureSession } from "~/lib/dal";

export async function GET() {
  try {
    const session = await getSecureSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agents = await getAgentsForGalleryWithAuth();

    return NextResponse.json(agents);
  } catch (error) {
    console.error("Error fetching agents list:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents list" },
      { status: 500 },
    );
  }
}
