import { type NextRequest, NextResponse } from "next/server";
import convert from "heic-convert";

/**
 * Server-side HEIC to JPEG conversion API
 * Uses heic-convert which has updated libheif support for iOS 17/18 HEIC files
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read the file as a buffer
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Convert HEIC to JPEG using heic-convert
    const outputBuffer = await convert({
      buffer: inputBuffer,
      format: "JPEG",
      quality: 0.9,
    });

    // Create a new filename with .jpg extension
    const newFileName = file.name
      .replace(/\.heic$/i, ".jpg")
      .replace(/\.heif$/i, ".jpg");

    // Return the converted image as a blob with metadata
    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${newFileName}"`,
        "X-Original-Filename": file.name,
        "X-New-Filename": newFileName,
      },
    });
  } catch (error) {
    console.error("HEIC conversion error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to convert HEIC: ${errorMessage}` },
      { status: 500 },
    );
  }
}
