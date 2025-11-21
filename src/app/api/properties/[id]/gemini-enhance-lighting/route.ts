import type { NextRequest } from "next/server";
import { getSecureSession } from "~/lib/dal";
import { geminiClient } from "~/lib/gemini-client";
import {
  imageUrlToBase64,
  validateImageSize,
  getImageSizeInMB,
} from "~/lib/image-utils";
import { getListingHeaderData } from "~/server/queries/listing";
import { calculateGeminiTokens } from "~/lib/image-token-pricing";
import {
  checkSufficientTokens,
  deductGeminiEnhanceLightingTokens,
} from "~/server/services/token-service";

/**
 * POST: Enhance lighting in real estate photos with Gemini API
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
      console.error("Unauthorized access to lighting enhancement API");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get request data
    const data = (await request.json()) as {
      imageUrl: string;
      referenceNumber: string;
      currentImageOrder: number;
    };

    if (
      !data.imageUrl ||
      !data.referenceNumber ||
      data.currentImageOrder === undefined
    ) {
      console.error("Missing required fields for lighting enhancement");
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
      console.error("Property not found for lighting enhancement");
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    // Extract propertyId from propertyData (may be null if property doesn't exist)
    const propertyId = propertyData.propertyId ?? undefined;

    // 4. Download and validate image
    const imageBase64 = await imageUrlToBase64(data.imageUrl);

    // Validate size (max 20MB for Gemini)
    if (!validateImageSize(imageBase64, 20)) {
      const sizeMB = getImageSizeInMB(imageBase64);
      console.error(
        "Image too large for lighting enhancement:",
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
        {
          error:
            validation.error ?? "Invalid image format for lighting enhancement",
        },
        { status: 400 },
      );
    }

    // 6. Get account ID from session
    const accountId = BigInt(session.user.accountId);

    // 7. Calculate token cost
    const enhanceLightingCost = calculateGeminiTokens("enhance_lighting");
    const totalTokensNeeded = enhanceLightingCost.tokens;

    console.log("Gemini lighting enhancement token costs:", {
      enhanceLightingTokens: totalTokensNeeded,
      totalTokens: totalTokensNeeded,
    });

    // 8. Check if account has sufficient tokens
    const tokenCheck = await checkSufficientTokens(
      accountId,
      totalTokensNeeded,
    );

    if (!tokenCheck.sufficient) {
      console.error("Insufficient tokens for Gemini lighting enhancement:", {
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

    console.log("Starting Gemini lighting enhancement:", {
      propertyId: propertyId?.toString() ?? "null",
      imageSize: getImageSizeInMB(imageBase64).toFixed(2) + "MB",
      tokensToDeduct: totalTokensNeeded,
    });

    // 9. Deduct tokens BEFORE calling API
    try {
      await deductGeminiEnhanceLightingTokens(
        accountId,
        totalTokensNeeded,
        undefined, // propertyImageId
        propertyId, // propertyId from propertyData (may be undefined)
        session.user.id,
      );
      console.log(
        `Deducted ${totalTokensNeeded} tokens for lighting enhancement`,
      );
    } catch (tokenError) {
      console.error("Failed to deduct lighting enhancement tokens:", tokenError);
      const errorMessage =
        tokenError instanceof Error
          ? tokenError.message
          : "Failed to process token deduction for lighting enhancement";
      return Response.json(
        { error: errorMessage },
        { status: 500 },
      );
    }

    // 10. Call Gemini API for lighting enhancement (synchronous)
    const result = await geminiClient.enhanceLighting(imageBase64);

    if (!result.success) {
      console.error("Gemini lighting enhancement failed:", result.error);
      return Response.json(
        { error: result.error ?? "Lighting enhancement failed" },
        { status: 500 },
      );
    }

    if (!result.renovatedImageBase64) {
      console.error("No enhanced image returned from Gemini");
      return Response.json(
        { error: "No enhanced image generated" },
        { status: 500 },
      );
    }

    // 11. Return successful lighting enhancement result
    console.log("✅ Lighting enhancement complete");

    return Response.json({
      success: true,
      status: "COMPLETED",
      enhancedImageBase64: result.renovatedImageBase64,
      referenceNumber: data.referenceNumber,
      currentImageOrder: data.currentImageOrder,
      propertyId: propertyId?.toString() ?? null,
    });
  } catch (error) {
    console.error("Gemini lighting enhancement API error:", error);

    // Return specific error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes("fetch")) {
        return Response.json(
          { error: "Failed to download image. Please check the image URL." },
          { status: 400 },
        );
      }
      // Check for specific Gemini error messages that should be passed through
      if (
        error.message.includes("could not process the image") ||
        error.message.includes("unsupported") ||
        error.message.includes("corrupted") ||
        error.message.includes("too complex")
      ) {
        return Response.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes("safety concerns")) {
        return Response.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes("API") || error.message.includes("Gemini")) {
        return Response.json(
          {
            error:
              "Lighting enhancement service temporarily unavailable. Please try again.",
          },
          { status: 503 },
        );
      }
      if (error.message.includes("Missing required")) {
        return Response.json(
          { error: "Lighting enhancement service configuration error." },
          { status: 500 },
        );
      }
    }

    return Response.json(
      { error: "Failed to start lighting enhancement" },
      { status: 500 },
    );
  }
}
