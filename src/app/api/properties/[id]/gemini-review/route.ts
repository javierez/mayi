import type { NextRequest } from "next/server";
import { getSecureSession } from "~/lib/dal";
import { geminiClient } from "~/lib/gemini-client";
import {
  imageUrlToBase64,
  validateImageSize,
  getImageSizeInMB,
} from "~/lib/image-utils";
import { getListingHeaderData } from "~/server/queries/listing";
import type { RenovationType } from "~/types/gemini";
import {
  calculateGeminiTokens,
  GEMINI_TOKEN_COSTS,
} from "~/lib/image-token-pricing";
import {
  checkSufficientTokens,
  deductGeminiReviewTokens,
} from "~/server/services/token-service";

/**
 * POST: Review and improve renovated image with Gemini API
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
      console.error("Unauthorized access to review API");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get request data
    const data = (await request.json()) as {
      originalImageUrl: string;
      renovatedImageUrl: string;
      reviewText: string;
      referenceNumber: string;
      currentImageOrder: number;
      renovationType?: RenovationType;
    };
    const propertyId = BigInt(resolvedParams.id);

    if (
      !data.originalImageUrl ||
      !data.renovatedImageUrl ||
      !data.reviewText ||
      !data.referenceNumber ||
      data.currentImageOrder === undefined
    ) {
      console.error("Missing required fields for review");
      return Response.json(
        {
          error:
            "originalImageUrl, renovatedImageUrl, reviewText, referenceNumber, and currentImageOrder are required",
        },
        { status: 400 },
      );
    }

    // 3. Validate property ownership
    const propertyData = await getListingHeaderData(
      parseInt(resolvedParams.id),
    );
    if (!propertyData) {
      console.error("Property not found for review");
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    // 4. Download and validate images
    const [originalImageBase64, renovatedImageBase64] = await Promise.all([
      imageUrlToBase64(data.originalImageUrl),
      imageUrlToBase64(data.renovatedImageUrl),
    ]);

    // Validate size (max 20MB for Gemini)
    if (!validateImageSize(originalImageBase64, 20)) {
      const sizeMB = getImageSizeInMB(originalImageBase64);
      console.error("Original image too large for review:", `${sizeMB.toFixed(2)}MB`);
      return Response.json(
        {
          error: `Original image too large (${sizeMB.toFixed(2)}MB). Maximum size is 20MB`,
        },
        { status: 400 },
      );
    }

    if (!validateImageSize(renovatedImageBase64, 20)) {
      const sizeMB = getImageSizeInMB(renovatedImageBase64);
      console.error("Renovated image too large for review:", `${sizeMB.toFixed(2)}MB`);
      return Response.json(
        {
          error: `Renovated image too large (${sizeMB.toFixed(2)}MB). Maximum size is 20MB`,
        },
        { status: 400 },
      );
    }

    // 5. Additional Gemini-specific validation
    const originalValidation = geminiClient.validateImageInput(originalImageBase64);
    if (!originalValidation.valid) {
      console.error("Gemini original image validation failed:", originalValidation.error);
      return Response.json(
        { error: originalValidation.error ?? "Invalid original image format" },
        { status: 400 },
      );
    }

    const renovatedValidation = geminiClient.validateImageInput(renovatedImageBase64);
    if (!renovatedValidation.valid) {
      console.error("Gemini renovated image validation failed:", renovatedValidation.error);
      return Response.json(
        { error: renovatedValidation.error ?? "Invalid renovated image format" },
        { status: 400 },
      );
    }

    // 6. Get account ID from session
    const accountId = BigInt(session.user.accountId);

    // 7. Calculate token cost for review
    const reviewCost = calculateGeminiTokens("review");
    const totalTokensNeeded = reviewCost.tokens;

    console.log("Gemini review token costs:", {
      reviewTokens: totalTokensNeeded,
      totalTokens: totalTokensNeeded,
    });

    // 8. Check if account has sufficient tokens
    const tokenCheck = await checkSufficientTokens(accountId, totalTokensNeeded);

    if (!tokenCheck.sufficient) {
      console.error("Insufficient tokens for Gemini review:", {
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

    console.log("Starting Gemini review:", {
      propertyId: propertyId.toString(),
      originalImageSize: getImageSizeInMB(originalImageBase64).toFixed(2) + "MB",
      renovatedImageSize: getImageSizeInMB(renovatedImageBase64).toFixed(2) + "MB",
      reviewTextLength: data.reviewText.length,
      tokensToDeduct: totalTokensNeeded,
    });

    // 9. Deduct tokens for review BEFORE calling API
    try {
      await deductGeminiReviewTokens(
        accountId,
        GEMINI_TOKEN_COSTS.REVIEW,
        data.reviewText,
        undefined, // propertyImageId
        propertyId,
        session.user.id,
      );
      console.log(
        `Deducted ${GEMINI_TOKEN_COSTS.REVIEW} tokens for review`,
      );
    } catch (tokenError) {
      console.error("Failed to deduct review tokens:", tokenError);
      return Response.json(
        { error: "Failed to process token deduction for review" },
        { status: 500 },
      );
    }

    // 10. Call Gemini API for review
    const result = await geminiClient.reviewRenovationImage(
      originalImageBase64,
      renovatedImageBase64,
      data.reviewText,
    );

    if (!result.success) {
      console.error("Gemini review failed:", result.error);
      return Response.json(
        { error: result.error ?? "Review failed" },
        { status: 500 },
      );
    }

    if (!result.reviewedImageBase64) {
      console.error("No reviewed image returned from Gemini");
      return Response.json(
        { error: "No reviewed image generated" },
        { status: 500 },
      );
    }

    // 11. Return successful review result
    console.log("✅ Review complete");

    return Response.json({
      success: true,
      status: "COMPLETED",
      reviewedImageBase64: result.reviewedImageBase64,
      referenceNumber: data.referenceNumber,
      currentImageOrder: data.currentImageOrder,
      propertyId: propertyId.toString(),
      renovationType: data.renovationType,
    });
  } catch (error) {
    console.error("Gemini review API error:", error);

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
              "Review service temporarily unavailable. Please try again.",
          },
          { status: 503 },
        );
      }
      if (error.message.includes("Missing required")) {
        return Response.json(
          { error: "Review service configuration error." },
          { status: 500 },
        );
      }
    }

    return Response.json(
      { error: "Failed to start image review" },
      { status: 500 },
    );
  }
}



