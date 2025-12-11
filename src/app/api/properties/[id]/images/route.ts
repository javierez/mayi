import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getPropertyImages } from "~/server/queries/property_images";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const propertyId = BigInt(id);

    // Get all images (active and inactive) for the API
    const propertyImages = await getPropertyImages(propertyId, undefined);
    const defaultPlaceholder = "";

    // Process images to ensure they have valid URLs and match PropertyImage type
    const processedImages = propertyImages.map((img) => ({
      propertyImageId: img.propertyImageId.toString(),
      propertyId: img.propertyId.toString(),
      referenceNumber: img.referenceNumber,
      imageUrl: img.imageUrl ?? defaultPlaceholder,
      isActive: img.isActive ?? true,
      createdAt: img.createdAt,
      updatedAt: img.updatedAt,
      imageKey: img.imageKey,
      imageTag: img.imageTag ?? undefined,
      s3key: img.s3key,
      imageOrder: img.imageOrder,
    }));

    return NextResponse.json(processedImages);
  } catch (error) {
    console.error("Error fetching property images:", error);
    return NextResponse.json(
      { error: "Failed to fetch property images" },
      { status: 500 },
    );
  }
}
