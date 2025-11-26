import type { NextRequest } from "next/server";
import { getSecureSession } from "~/lib/dal";
import { uploadBlurredFacesImageToS3 } from "~/app/actions/blur-faces-image";
import { getListingHeaderData } from "~/server/queries/listing";
import {
  getPropertyImagesByReference,
  getMaxImageOrder,
} from "~/server/queries/property_images";

/**
 * POST: Save blurred faces image to S3 and database when user confirms
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
      console.error("Unauthorized access to save blurred faces image");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get request data
    const data = (await request.json()) as {
      blurredImageBase64: string;
      referenceNumber: string;
      currentImageOrder: string;
    };
    const propertyId = BigInt(resolvedParams.id);

    if (
      !data.blurredImageBase64 ||
      !data.referenceNumber ||
      !data.currentImageOrder
    ) {
      console.error("Missing required fields for blurred faces image save");
      return Response.json(
        {
          error:
            "blurredImageBase64, referenceNumber, and currentImageOrder are required",
        },
        { status: 400 },
      );
    }

    console.log("Saving blurred faces image:", {
      propertyId: propertyId.toString(),
      referenceNumber: data.referenceNumber,
      currentImageOrder: data.currentImageOrder,
      imageDataLength: data.blurredImageBase64.length,
    });

    // 3. Validate property ownership
    const propertyData = await getListingHeaderData(
      parseInt(resolvedParams.id),
    );
    if (!propertyData) {
      console.error("Property not found");
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    // 4. Find the original image to get the correct propertyId
    // Note: We filter out AI-enhanced/renovated/blurred images to ensure we get the actual original
    const propertyImages = await getPropertyImagesByReference(
      data.referenceNumber,
    );
    const originalImage = propertyImages.find(
      (img) =>
        img.imageOrder === parseInt(data.currentImageOrder) &&
        img.imageTag !== "ai_enhanced" &&
        img.imageTag !== "ai_renovated" &&
        img.imageTag !== "ai_blur_faces",
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

    console.log("🎯 Blurred faces image save API - Starting process:", {
      correctPropertyId: correctPropertyId.toString(),
      referenceNumber: data.referenceNumber,
      currentImageOrder: data.currentImageOrder,
      maxImageOrder,
      newImageOrder,
      imageDataLength: data.blurredImageBase64.length,
    });

    try {
      console.log("📤 Calling uploadBlurredFacesImageToS3 with:", {
        base64Length: data.blurredImageBase64.length,
        correctPropertyId: correctPropertyId.toString(),
        referenceNumber: data.referenceNumber,
        newImageOrder,
        originImageId: originalImage.propertyImageId?.toString() ?? "undefined",
      });

      const propertyImage = await uploadBlurredFacesImageToS3(
        data.blurredImageBase64,
        correctPropertyId,
        data.referenceNumber,
        newImageOrder,
        originalImage.propertyImageId, // Pass the original image ID to track the relationship
      );

      console.log("🎉 Blurred faces image successfully saved:", {
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
        message: "Blurred faces image saved successfully",
      });
    } catch (uploadError) {
      console.error("❌ DETAILED ERROR saving blurred faces image to S3/DB:", {
        error: uploadError,
        message:
          uploadError instanceof Error ? uploadError.message : "Unknown error",
        stack:
          uploadError instanceof Error ? uploadError.stack : "No stack trace",
        data: {
          base64Length: data.blurredImageBase64?.length ?? 0,
          referenceNumber: data.referenceNumber,
          currentImageOrder: data.currentImageOrder,
          newImageOrder,
          correctPropertyId: correctPropertyId?.toString() ?? "undefined",
          originImageId:
            originalImage?.propertyImageId?.toString() ?? "undefined",
        },
      });
      return Response.json(
        { error: "Failed to save blurred faces image to S3 or database" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Save blurred faces image API error:", error);
    return Response.json(
      { error: "Failed to save blurred faces image" },
      { status: 500 },
    );
  }
}





