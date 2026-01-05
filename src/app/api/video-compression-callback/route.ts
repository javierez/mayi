import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { memories } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * API endpoint for AWS Lambda to call after video compression completes.
 * Lambda compresses videos uploaded to S3 and calls this endpoint to update
 * the database with the compressed video URL.
 *
 * The Lambda function should call this endpoint with:
 * - originalKey: The original S3 key of the uploaded video
 * - compressedKey: The S3 key of the compressed video
 * - compressedFileSize: The file size of the compressed video (optional)
 *
 * Security: Uses a shared secret (API_VIDEO_COMPRESSION_SECRET) to authenticate requests.
 */

interface CompressionCallbackPayload {
  originalKey: string;
  compressedKey: string;
  compressedFileSize?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Validate API secret
    const authHeader = request.headers.get("Authorization");
    const expectedSecret = process.env.API_VIDEO_COMPRESSION_SECRET;

    if (!expectedSecret) {
      console.error("API_VIDEO_COMPRESSION_SECRET not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = (await request.json()) as CompressionCallbackPayload;
    const { originalKey, compressedKey, compressedFileSize } = body;

    if (!originalKey || !compressedKey) {
      return NextResponse.json(
        { error: "Missing required fields: originalKey, compressedKey" },
        { status: 400 }
      );
    }

    console.log("Video compression callback:", {
      originalKey,
      compressedKey,
      compressedFileSize,
    });

    // Build the compressed URL from the key
    const bucket = process.env.AWS_S3_MEMORIA_BUCKET ?? process.env.AWS_S3_BUCKET ?? "mayi";
    const region = process.env.AWS_REGION ?? "eu-west-1";
    const compressedUrl = `https://${bucket}.s3.${region}.amazonaws.com/${compressedKey}`;

    // Find the memory record by original S3 key
    // The s3Key stored might be just the key or include the bucket prefix
    const result = await db
      .update(memories)
      .set({
        compressedUrl,
        compressedS3Key: compressedKey,
        compressedFileSize: compressedFileSize ?? null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(memories.s3Key, originalKey),
          eq(memories.type, "video")
        )
      )
      .returning({ id: memories.id });

    if (result.length === 0) {
      // Try with just the last part of the key (in case s3Key is stored differently)
      console.log("No direct match found, trying partial match...");

      // Fallback: search for memories where s3Key ends with the originalKey
      const allVideoMemories = await db
        .select({ id: memories.id, s3Key: memories.s3Key })
        .from(memories)
        .where(eq(memories.type, "video"));

      const matchingMemory = allVideoMemories.find(
        (m) => m.s3Key?.endsWith(originalKey) || originalKey.endsWith(m.s3Key ?? "")
      );

      if (matchingMemory) {
        await db
          .update(memories)
          .set({
            compressedUrl,
            compressedS3Key: compressedKey,
            compressedFileSize: compressedFileSize ?? null,
            updatedAt: new Date(),
          })
          .where(eq(memories.id, matchingMemory.id));

        console.log("Updated memory via partial match:", matchingMemory.id.toString());
        return NextResponse.json({
          success: true,
          memoryId: matchingMemory.id.toString(),
          compressedUrl,
        });
      }

      console.warn("No memory found for S3 key:", originalKey);
      return NextResponse.json(
        { error: "Memory not found for the given S3 key" },
        { status: 404 }
      );
    }

    console.log("Updated memory:", result[0]?.id.toString());

    return NextResponse.json({
      success: true,
      memoryId: result[0]?.id.toString(),
      compressedUrl,
    });
  } catch (error) {
    console.error("Error processing video compression callback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
