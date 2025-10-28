import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSecureSession } from "~/lib/dal";
import {
  saveCartelConfigurationWithAuth,
  getCartelConfigurationsWithAuth,
  getDefaultCartelConfigurationWithAuth,
} from "~/server/queries/cartel-configurations";
import type { SaveConfigurationRequest } from "~/types/template-data";

// POST - Save new cartel configuration
export async function POST(request: NextRequest) {
  try {
    // Use optimized DAL function for session retrieval
    const session = await getSecureSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as SaveConfigurationRequest;

    // Validate required fields
    if (!body.name || !body.templateConfig) {
      return NextResponse.json(
        { error: "Name and template configuration are required" },
        { status: 400 },
      );
    }

    const result = await saveCartelConfigurationWithAuth(body);

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
    console.error("Error saving cartel configuration:", error);
    return NextResponse.json(
      { error: "Failed to save configuration" },
      { status: 500 },
    );
  }
}

// GET - Fetch cartel configurations for user
export async function GET(request: NextRequest) {
  try {
    // Use optimized DAL function for session retrieval
    const session = await getSecureSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId") ?? undefined;
    const defaultOnly = searchParams.get("default") === "true";

    if (defaultOnly) {
      // Get only the default configuration
      const result = await getDefaultCartelConfigurationWithAuth();

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
    } else {
      // Get all configurations
      const result = await getCartelConfigurationsWithAuth(propertyId);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      // Convert BigInt values to strings for JSON serialization
      const serializedData = result.data!.map((config) => ({
        ...config,
        id: config.id.toString(),
        accountId: config.accountId.toString(),
        propertyId: config.propertyId?.toString(),
      }));

      return NextResponse.json({
        success: true,
        data: serializedData,
      });
    }
  } catch (error) {
    console.error("Error fetching cartel configurations:", error);
    return NextResponse.json(
      { error: "Failed to fetch configurations" },
      { status: 500 },
    );
  }
}
