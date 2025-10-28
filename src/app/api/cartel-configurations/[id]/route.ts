import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSecureSession } from "~/lib/dal";
import {
  getCartelConfigurationWithAuth,
  updateCartelConfigurationWithAuth,
  deleteCartelConfigurationWithAuth,
} from "~/server/queries/cartel-configurations";
import type { SaveConfigurationRequest } from "~/types/template-data";

// GET - Fetch specific cartel configuration
export async function GET(
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

    const result = await getCartelConfigurationWithAuth(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    // Convert BigInt values to strings for JSON serialization
    const serializedData = {
      ...result.data!,
      id: result.data!.id.toString(),
      accountId: result.data!.accountId.toString(),
      propertyId: result.data!.propertyId?.toString(),
    };

    return NextResponse.json({
      success: true,
      data: serializedData,
    });
  } catch (error) {
    console.error("Error fetching cartel configuration:", error);
    return NextResponse.json(
      { error: "Failed to fetch configuration" },
      { status: 500 },
    );
  }
}

// PUT - Update existing cartel configuration
export async function PUT(
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
    const body = (await request.json()) as Partial<SaveConfigurationRequest>;

    const result = await updateCartelConfigurationWithAuth(id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Convert BigInt values to strings for JSON serialization
    const serializedData = {
      ...result.data!,
      id: result.data!.id.toString(),
      accountId: result.data!.accountId.toString(),
      propertyId: result.data!.propertyId?.toString(),
    };

    return NextResponse.json({
      success: true,
      data: serializedData,
    });
  } catch (error) {
    console.error("Error updating cartel configuration:", error);
    return NextResponse.json(
      { error: "Failed to update configuration" },
      { status: 500 },
    );
  }
}

// DELETE - Delete cartel configuration
export async function DELETE(
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

    const result = await deleteCartelConfigurationWithAuth(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Configuration deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting cartel configuration:", error);
    return NextResponse.json(
      { error: "Failed to delete configuration" },
      { status: 500 },
    );
  }
}
