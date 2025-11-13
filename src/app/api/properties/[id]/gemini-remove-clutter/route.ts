import type { NextRequest } from "next/server";
import { getSecureSession } from "~/lib/dal";
import { geminiClient } from "~/lib/gemini-client";
import {
  imageUrlToBase64,
  validateImageSize,
  getImageSizeInMB,
} from "~/lib/image-utils";
import { getListingHeaderData } from "~/server/queries/listing";
import {
  calculateGeminiTokens,
} from "~/lib/image-token-pricing";
import {
  checkSufficientTokens,
  deductGeminiRemoveClutterTokens,
} from "~/server/services/token-service";

/**
 * POST: Remove clutter from image with Gemini API
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
      console.error("Unauthorized access to remove clutter API");
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
      console.error("Missing required fields for remove clutter");
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
      console.error("Property not found for remove clutter");
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    // 4. Download and validate image
    const imageBase64 = await imageUrlToBase64(data.imageUrl);

    // Validate size (max 20MB for Gemini)
    if (!validateImageSize(imageBase64, 20)) {
      const sizeMB = getImageSizeInMB(imageBase64);
      console.error(
        "Image too large for remove clutter:",
        `${sizeMB.toFixed(2)}MB`,
      );
      return Response.json(
        {
          error: `Image too large (${sizeMB.toFixed(2)}MB). Maximum size is 20MB`,
        },
        { status: 400 },
      );
    }

    // 5. Additional Gemini-specific validation
    const validation = geminiClient.validateImageInput(imageBase64);
    if (!validation.valid) {
      console.error("Gemini image validation failed:", validation.error);
      return Response.json(
        { error: validation.error ?? "Invalid image format for remove clutter" },
        { status: 400 },
      );
    }

    // 6. Get account ID from session
    const accountId = BigInt(session.user.accountId);

    // 7. Calculate token cost
    const removeClutterCost = calculateGeminiTokens("remove_clutter");
    const totalTokensNeeded = removeClutterCost.tokens;

    console.log("Gemini remove clutter token costs:", {
      removeClutterTokens: totalTokensNeeded,
      totalTokens: totalTokensNeeded,
    });

    // 8. Check if account has sufficient tokens
    const tokenCheck = await checkSufficientTokens(accountId, totalTokensNeeded);

    if (!tokenCheck.sufficient) {
      console.error("Insufficient tokens for Gemini remove clutter:", {
        required: totalTokensNeeded,
        available: tokenCheck.currentBalance,
        deficit: tokenCheck.deficit,
      });

      return Response.json(
        {
          error: "Insufficient tokens",
          required: totalTokensNeeded,
          available: tokenCheck.currentBalance,
          deficit: tokenCheck.deficit,
        },
        { status: 402 }, // 402 Payment Required
      );
    }

    console.log("Starting Gemini remove clutter:", {
      propertyId: propertyId.toString(),
      imageSize: getImageSizeInMB(imageBase64).toFixed(2) + "MB",
      tokensToDeduct: totalTokensNeeded,
    });

    // 9. Deduct tokens BEFORE calling API
    try {
      await deductGeminiRemoveClutterTokens(
        accountId,
        totalTokensNeeded,
        undefined, // propertyImageId
        propertyId,
        session.user.id,
      );
      console.log(
        `Deducted ${totalTokensNeeded} tokens for remove clutter`,
      );
    } catch (tokenError) {
      console.error("Failed to deduct remove clutter tokens:", tokenError);
      return Response.json(
        { error: "Failed to process token deduction for remove clutter" },
        { status: 500 },
      );
    }

    // 10. Call Gemini API for remove clutter (synchronous)
    const result = await geminiClient.removeClutter(imageBase64);

    if (!result.success) {
      console.error("Gemini remove clutter failed:", result.error);
      return Response.json(
        { error: result.error ?? "Remove clutter failed" },
        { status: 500 },
      );
    }

    if (!result.renovatedImageBase64) {
      console.error("No decluttered image returned from Gemini");
      return Response.json(
        { error: "No decluttered image generated" },
        { status: 500 },
      );
    }

    // 11. Return successful remove clutter result
    console.log("✅ Remove clutter complete");

    return Response.json({
      success: true,
      status: "COMPLETED",
      declutteredImageBase64: result.renovatedImageBase64,
      referenceNumber: data.referenceNumber,
      currentImageOrder: data.currentImageOrder,
      propertyId: propertyId.toString(),
    });
  } catch (error) {
    console.error("Gemini remove clutter API error:", error);

    // Return specific error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes("fetch")) {
        return Response.json(
          { error: "Failed to download image. Please check the image URL." },
          { status: 400 },
        );
      }
      if (error.message.includes("API") || error.message.includes("Gemini")) {
        return Response.json(
          {
            error:
              "Remove clutter service temporarily unavailable. Please try again.",
          },
          { status: 503 },
        );
      }
      if (error.message.includes("Missing required")) {
        return Response.json(
          { error: "Remove clutter service configuration error." },
          { status: 500 },
        );
      }
    }

    return Response.json(
      { error: "Failed to start image remove clutter" },
      { status: 500 },
    );
  }
}



