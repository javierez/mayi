import type { NextRequest } from "next/server";
import { getSecureSession } from "~/lib/dal";
import { uploadRender3dImageToS3 } from "~/app/actions/render-3d-image";
import { getListingHeaderData } from "~/server/queries/listing";
import {
  getPropertyImagesByReference,
  getMaxImageOrder,
} from "~/server/queries/property_images";

/**
 * POST: Save 3D rendered image to S3 and database when user confirms
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
      console.error("Unauthorized access to save 3D render image");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get request data
    const data = (await request.json()) as {
      render3dImageBase64: string;
      referenceNumber: string;
      currentImageOrder: string;
    };
    const propertyId = BigInt(resolvedParams.id);

    if (
      !data.render3dImageBase64 ||
      !data.referenceNumber ||
      !data.currentImageOrder
    ) {
      console.error("Missing required fields for 3D render image save");
      return Response.json(
        {
          error:
            "render3dImageBase64, referenceNumber, and currentImageOrder are required",
        },
        { status: 400 },
      );
    }

    console.log("Saving 3D render image:", {
      propertyId: propertyId.toString(),
      referenceNumber: data.referenceNumber,
      currentImageOrder: data.currentImageOrder,
      imageDataLength: data.render3dImageBase64.length,
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
    // Note: We filter out AI-enhanced/renovated/blurred/3d images to ensure we get the actual original
    const propertyImages = await getPropertyImagesByReference(
      data.referenceNumber,
    );
    const originalImage = propertyImages.find(
      (img) =>
        img.imageOrder === parseInt(data.currentImageOrder) &&
        img.imageTag !== "ai_enhanced" &&
        img.imageTag !== "ai_renovated" &&
        img.imageTag !== "ai_blur_faces" &&
        img.imageTag !== "ai_remove_clutter" &&
        img.imageTag !== "ai_enhance_lighting" &&
        img.imageTag !== "ai_render_3d",
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

    console.log("🎯 3D render image save API - Starting process:", {
      correctPropertyId: correctPropertyId.toString(),
      referenceNumber: data.referenceNumber,
      currentImageOrder: data.currentImageOrder,
      maxImageOrder,
      newImageOrder,
      imageDataLength: data.render3dImageBase64.length,
    });

    try {
      console.log("📤 Calling uploadRender3dImageToS3 with:", {
        base64Length: data.render3dImageBase64.length,
        correctPropertyId: correctPropertyId.toString(),
        referenceNumber: data.referenceNumber,
        newImageOrder,
        originImageId: originalImage.propertyImageId?.toString() ?? "undefined",
      });

      const propertyImage = await uploadRender3dImageToS3(
        data.render3dImageBase64,
        correctPropertyId,
        data.referenceNumber,
        newImageOrder,
        originalImage.propertyImageId, // Pass the original image ID to track the relationship
      );

      console.log("🎉 3D render image successfully saved:", {
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
        message: "3D render image saved successfully",
      });
    } catch (uploadError) {
      console.error("❌ DETAILED ERROR saving 3D render image to S3/DB:", {
        error: uploadError,
        message:
          uploadError instanceof Error ? uploadError.message : "Unknown error",
        stack:
          uploadError instanceof Error ? uploadError.stack : "No stack trace",
        data: {
          base64Length: data.render3dImageBase64?.length ?? 0,
          referenceNumber: data.referenceNumber,
          currentImageOrder: data.currentImageOrder,
          newImageOrder,
          correctPropertyId: correctPropertyId?.toString() ?? "undefined",
          originImageId:
            originalImage?.propertyImageId?.toString() ?? "undefined",
        },
      });
      return Response.json(
        { error: "Failed to save 3D render image to S3 or database" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Save 3D render image API error:", error);
    return Response.json(
      { error: "Failed to save 3D render image" },
      { status: 500 },
    );
  }
}
