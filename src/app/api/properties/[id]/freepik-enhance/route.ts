import type { NextRequest } from "next/server";
import { getSecureSession } from "~/lib/dal";
import { freepikClient } from "~/lib/freepik-client";
import { getListingHeaderData } from "~/server/queries/listing";
import { calculateFreepikTokensWithFactor } from "~/lib/image-token-pricing";
import {
  checkSufficientTokens,
  deductFreepikTokens,
  addTokens,
} from "~/server/services/token-service";

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
      imageWidth: number;
      imageHeight: number;
      upscaleFactor?: number;
    };

    if (
      !data.imageUrl ||
      !data.referenceNumber ||
      data.currentImageOrder === undefined ||
      !data.imageWidth ||
      !data.imageHeight
    ) {
      console.error("Missing required fields for enhancement");
      return Response.json(
        {
          error:
            "imageUrl, referenceNumber, currentImageOrder, imageWidth, and imageHeight are required",
        },
        { status: 400 },
      );
    }

    const upscaleFactor = data.upscaleFactor ?? 2; // Default to 2x upscale

    // 3. Validate property ownership
    const propertyData = await getListingHeaderData(
      parseInt(resolvedParams.id),
    );
    if (!propertyData) {
      console.error("Property not found for enhancement");
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    // Extract propertyId from propertyData (may be null if property doesn't exist)
    const propertyId = propertyData.propertyId ?? undefined;

    // 4. Validate image URL format
    if (!data.imageUrl.startsWith("http")) {
      console.error("Invalid image URL format");
      return Response.json(
        { error: "Image URL must be a valid HTTP/HTTPS URL" },
        { status: 400 },
      );
    }

    // 5. Get account ID from session (not from propertyData)
    const accountId = BigInt(session.user.accountId);

    // 6. Calculate token cost based on output dimensions
    const tokenCost = calculateFreepikTokensWithFactor(
      data.imageWidth,
      data.imageHeight,
      upscaleFactor,
    );

    console.log("Freepik enhancement token cost:", {
      inputWidth: data.imageWidth,
      inputHeight: data.imageHeight,
      upscaleFactor,
      tokens: tokenCost.tokens,
      estimatedCostEUR: tokenCost.estimatedCostEUR,
    });

    // 7. Validate Freepik API is available BEFORE deducting tokens
    if (!process.env.FREEPIK_API_KEY) {
      console.error("Freepik API key not configured");
      return Response.json(
        {
          error: "Enhancement service is not configured. Please contact support.",
        },
        { status: 503 },
      );
    }

    // 8. Check if account has sufficient tokens
    const tokenCheck = await checkSufficientTokens(accountId, tokenCost.tokens);

    if (!tokenCheck.sufficient) {
      console.error("Insufficient tokens for enhancement:", {
        required: tokenCost.tokens,
        available: tokenCheck.currentBalance,
        deficit: tokenCheck.deficit,
      });

      return Response.json(
        {
          error: "Insufficient tokens",
          required: tokenCost.tokens,
          available: tokenCheck.currentBalance,
          deficit: tokenCheck.deficit,
        },
        { status: 402 }, // 402 Payment Required
      );
    }

    // 9. Deduct tokens BEFORE calling Freepik API
    let tokensDeducted = false;
    try {
      await deductFreepikTokens(
        accountId,
        tokenCost.tokens,
        data.imageWidth,
        data.imageHeight,
        upscaleFactor,
        undefined, // propertyImageId - we don't have this yet
        propertyId, // propertyId from propertyData (may be undefined)
        session.user.id,
      );

      tokensDeducted = true;
      console.log(
        `Deducted ${tokenCost.tokens} tokens from account ${accountId}`,
      );
    } catch (tokenError) {
      console.error("Failed to deduct tokens:", tokenError);
      return Response.json(
        { error: "Failed to process token deduction" },
        { status: 500 },
      );
    }

    // 10. Call Freepik API v1 to start enhancement
    // Note: freepikClient.enhance() downloads the URL and converts to base64 internally
    let result;
    try {
      result = await freepikClient.enhance(data.imageUrl);
    } catch (apiError) {
      // If API call fails after tokens were deducted, refund them
      if (tokensDeducted) {
        console.error(
          `Freepik API call failed after token deduction. Refunding ${tokenCost.tokens} tokens...`,
        );
        try {
          await addTokens({
            accountId,
            tokens: tokenCost.tokens,
            operation: "admin_credit",
            metadata: {
              reason: "Refund due to Freepik API failure",
              originalOperation: "freepik_enhance",
              error: apiError instanceof Error ? apiError.message : String(apiError),
            },
            userId: session.user.id,
          });
          console.log(
            `✅ Refunded ${tokenCost.tokens} tokens to account ${accountId}`,
          );
        } catch (refundError) {
          console.error("Failed to refund tokens:", refundError);
          // Continue to throw the original API error
        }
      }
      throw apiError;
    }

    // 11. Return task information for polling
    return Response.json({
      success: true,
      taskId: result.taskId,
      status: result.status,
      referenceNumber: data.referenceNumber,
      currentImageOrder: data.currentImageOrder,
      propertyId: propertyId?.toString() ?? null,
    });
  } catch (error) {
    console.error("Freepik enhancement API error:", error);

    // Return specific error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes("Missing required Freepik environment variables")) {
        return Response.json(
          {
            error:
              "Enhancement service is not configured. Please contact support.",
          },
          { status: 503 },
        );
      }
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
