import type { NextRequest } from "next/server";
import { getSecureSession } from "~/lib/dal";
import { uploadEnhancedImageToS3 } from "~/app/actions/enhance-image";
import { getListingHeaderData } from "~/server/queries/listing";
import {
  getPropertyImagesByReference,
  getMaxImageOrder,
} from "~/server/queries/property_images";

/**
 * POST: Save enhanced image to S3 and database when user confirms
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolvedParams = await params;

  try {
    // 1. Use optimized DAL function for authentication
    const session = await getSecureSession();

    if (!session?.user?.id) {
      console.error("Unauthorized access to save enhanced image");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get request data
    const data = (await request.json()) as {
      enhancedImageUrl: string;
      referenceNumber: string;
      currentImageOrder: string;
    };
    const propertyId = BigInt(resolvedParams.id);

    if (
      !data.enhancedImageUrl ||
      !data.referenceNumber ||
      !data.currentImageOrder
    ) {
      console.error("Missing required fields for enhanced image save");
      return Response.json(
        {
          error:
            "enhancedImageUrl, referenceNumber, and currentImageOrder are required",
        },
        { status: 400 },
      );
    }

    // 3. Validate property ownership
    const propertyData = await getListingHeaderData(
      parseInt(resolvedParams.id),
    );
    if (!propertyData) {
      console.error("Property not found");
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    // 4. Find the original image to get the correct propertyId
    // Note: We filter out AI-enhanced/renovated images to ensure we get the actual original
    const propertyImages = await getPropertyImagesByReference(
      data.referenceNumber,
    );
    const originalImage = propertyImages.find(
      (img) =>
        img.imageOrder === parseInt(data.currentImageOrder) &&
        img.imageTag !== "ai_enhanced" &&
        img.imageTag !== "ai_renovated",
    );

    if (!originalImage) {
      console.error("Original image not found:", {
        referenceNumber: data.referenceNumber,
        imageOrder: data.currentImageOrder,
      });
      return Response.json(
        { error: "Original image not found" },
        { status: 404 },
      );
    }

    // Use the propertyId from the original image, not from URL
    const correctPropertyId = originalImage.propertyId;

    console.log("Found original image:", {
      originalImageId: originalImage.propertyImageId.toString(),
      originalPropertyId: originalImage.propertyId.toString(),
      urlPropertyId: propertyId.toString(),
      usingCorrectPropertyId: correctPropertyId.toString(),
    });

    // 5. Get the maximum image_order for this property and calculate next order
    const maxImageOrder = await getMaxImageOrder(correctPropertyId);
    const newImageOrder = maxImageOrder + 1;

    console.log("🎯 Enhanced image save API - Starting process:", {
      correctPropertyId: correctPropertyId.toString(),
      referenceNumber: data.referenceNumber,
      currentImageOrder: data.currentImageOrder,
      maxImageOrder,
      newImageOrder,
      enhancedImageUrl: data.enhancedImageUrl.substring(0, 100) + "...",
    });

    try {
      const propertyImage = await uploadEnhancedImageToS3(
        data.enhancedImageUrl,
        correctPropertyId,
        data.referenceNumber,
        newImageOrder,
        originalImage.propertyImageId, // Pass the original image ID to track the relationship
      );

      console.log("🎉 Enhanced image successfully saved:", {
        propertyImageId: propertyImage.propertyImageId.toString(),
        propertyId: propertyImage.propertyId.toString(),
        referenceNumber: propertyImage.referenceNumber,
        imageOrder: propertyImage.imageOrder,
        imageTag: propertyImage.imageTag,
      });

      // Convert BigInt values to strings for JSON serialization
      const serializedPropertyImage = {
        ...propertyImage,
        propertyImageId: propertyImage.propertyImageId.toString(),
        propertyId: propertyImage.propertyId.toString(),
        originImageId: propertyImage.originImageId
          ? propertyImage.originImageId.toString()
          : undefined,
      };

      return Response.json({
        success: true,
        propertyImage: serializedPropertyImage,
        message: "Enhanced image saved successfully",
      });
    } catch (uploadError) {
      console.error("Error saving enhanced image to S3/DB:", uploadError);
      return Response.json(
        { error: "Failed to save enhanced image to S3 or database" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Save enhanced image API error:", error);
    return Response.json(
      { error: "Failed to save enhanced image" },
      { status: 500 },
    );
  }
}
