import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSecureSession } from "~/lib/dal";
import { setDefaultCartelConfigurationWithAuth } from "~/server/queries/cartel-configurations";

// POST - Set cartel configuration as default
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Use optimized DAL function for session retrieval
    const session = await getSecureSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const result = await setDefaultCartelConfigurationWithAuth(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Configuration set as default successfully",
    });
  } catch (error) {
    console.error("Error setting default cartel configuration:", error);
    return NextResponse.json(
      { error: "Failed to set default configuration" },
      { status: 500 },
    );
  }
}
