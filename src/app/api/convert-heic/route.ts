import { type NextRequest, NextResponse } from "next/server";
import convert from "heic-convert";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    const outputBuffer = await convert({
      buffer: inputBuffer,
      format: "JPEG",
      quality: 0.9,
    });

    const newFileName = file.name
      .replace(/\.heic$/i, ".jpg")
      .replace(/\.heif$/i, ".jpg");

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
    return NextResponse.json(
      { error: `Failed to convert HEIC: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    );
  }
}
