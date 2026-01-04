import { type NextRequest, NextResponse } from "next/server";
import { extractVideoMetadata } from "~/lib/video-metadata";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

// Increase timeout for large video files
export const maxDuration = 60; // 60 seconds

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check if it's a video
    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "File must be a video" },
        { status: 400 }
      );
    }

    // Limit file size to 500MB for metadata extraction
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Video file too large for metadata extraction (max 500MB)" },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const metadata = await extractVideoMetadata(buffer);

    return NextResponse.json({
      success: true,
      data: {
        latitude: metadata.latitude,
        longitude: metadata.longitude,
        takenAt: metadata.takenAt?.toISOString(),
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
      },
    });
  } catch (error) {
    console.error("Video metadata extraction error:", error);
    return NextResponse.json(
      {
        error: `Failed to extract video metadata: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
