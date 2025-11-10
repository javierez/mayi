import type { NextRequest } from "next/server";
import { getSecureSession } from "~/lib/dal";
import { freepikClient } from "~/lib/freepik-client";
import { getListingHeaderData } from "~/server/queries/listing";

/**
 * POST: Start image enhancement with Freepik API
 */
export async function POST(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await _params;

  try {
    // 1. Use optimized DAL function for authentication
    const session = await getSecureSession();

    if (!session?.user?.id) {
      console.error("Unauthorized access to enhancement API");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get request data
    const data = (await request.json()) as {
      imageUrl: string;
      referenceNumber: string;
      currentImageOrder: number;
    };
    const propertyId = BigInt(resolvedParams.id);

    if (
      !data.imageUrl ||
      !data.referenceNumber ||
      data.currentImageOrder === undefined
    ) {
      console.error("Missing required fields for enhancement");
      return Response.json(
        {
          error:
            "imageUrl, referenceNumber, and currentImageOrder are required",
        },
        { status: 400 },
      );
    }

    // 3. Validate property ownership
    const propertyData = await getListingHeaderData(
      parseInt(resolvedParams.id),
    );
    if (!propertyData) {
      console.error("Property not found for enhancement");
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    // 4. Validate image URL format
    if (!data.imageUrl.startsWith("http")) {
      console.error("Invalid image URL format");
      return Response.json(
        { error: "Image URL must be a valid HTTP/HTTPS URL" },
        { status: 400 },
      );
    }

    // 5. Call Freepik API v1 to start enhancement
    // Note: freepikClient.enhance() downloads the URL and converts to base64 internally
    const result = await freepikClient.enhance(data.imageUrl);

    // 6. Return task information for polling
    return Response.json({
      success: true,
      taskId: result.taskId,
      status: result.status,
      referenceNumber: data.referenceNumber,
      currentImageOrder: data.currentImageOrder,
      propertyId: propertyId.toString(),
    });
  } catch (error) {
    console.error("Freepik enhancement API error:", error);

    // Return specific error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes("fetch")) {
        return Response.json(
          { error: "Failed to download image. Please check the image URL." },
          { status: 400 },
        );
      }
      if (error.message.includes("API error")) {
        return Response.json(
          {
            error:
              "Enhancement service temporarily unavailable. Please try again.",
          },
          { status: 503 },
        );
      }
    }

    return Response.json(
      { error: "Failed to start image enhancement" },
      { status: 500 },
    );
  }
}

/**
 * GET: Check enhancement status and upload to S3 when complete
 */
export async function GET(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Use optimized DAL function for authentication
    const session = await getSecureSession();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get query parameters
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    const referenceNumber = searchParams.get("referenceNumber");
    const currentImageOrder = searchParams.get("currentImageOrder");

    if (!taskId || !referenceNumber || !currentImageOrder) {
      return Response.json(
        {
          error: "taskId, referenceNumber, and currentImageOrder are required",
        },
        { status: 400 },
      );
    }

    // 3. Check Freepik task status
    const status = await freepikClient.checkStatus(taskId);

    // 4. If still processing, return status
    if (status.status === "IN_PROGRESS") {
      return Response.json({
        status: "IN_PROGRESS",
        progress: status.progress ?? 0,
      });
    }

    // 5. If failed, return error
    if (status.status === "FAILED") {
      return Response.json({
        status: "FAILED",
        error: status.error ?? "Enhancement failed",
      });
    }

    // 6. If successful, return temporary Freepik URL (don't save to S3 yet)
    if (status.status === "COMPLETED" && status.result?.generated?.[0]) {
      const enhancedImageUrl = status.result.generated[0];

      // Return the temporary Freepik URL and metadata needed for saving later
      return Response.json({
        status: "SUCCESS",
        enhancedImageUrl: enhancedImageUrl, // Freepik's temporary URL
        referenceNumber: referenceNumber,
        currentImageOrder: currentImageOrder,
      });
    }

    // 7. Unexpected status
    return Response.json({
      status: status.status,
      error: "Unexpected enhancement status",
    });
  } catch (error) {
    console.error("Enhancement status check error:", error);
    return Response.json(
      { error: "Failed to check enhancement status" },
      { status: 500 },
    );
  }
}
