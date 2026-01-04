import { type NextRequest, NextResponse } from "next/server";
import { extractImageMetadata } from "~/lib/media-metadata";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const metadata = await extractImageMetadata(buffer);

    return NextResponse.json({
      success: true,
      data: {
        latitude: metadata.latitude,
        longitude: metadata.longitude,
        takenAt: metadata.takenAt?.toISOString(),
        deviceInfo: metadata.deviceInfo,
        width: metadata.width,
        height: metadata.height,
      },
    });
  } catch (error) {
    console.error("Metadata extraction error:", error);
    return NextResponse.json(
      {
        error: `Failed to extract metadata: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
