/**
 * Sync compressed video URLs to the database
 * Run with: npx tsx scripts/sync-compressed-videos.ts
 */

import { db } from "../src/server/db";
import { memories } from "../src/server/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const BUCKET = process.env.AWS_S3_MEMORIA_BUCKET || "mayi";
const REGION = process.env.AWS_REGION || "us-east-1";

async function main() {
  console.log("🔄 Syncing compressed video URLs to database...\n");

  const s3 = new S3Client({ region: REGION });

  // Get all compressed videos from S3
  const listCommand = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: "memoria/",
  });

  const s3Response = await s3.send(listCommand);
  const compressedVideos = (s3Response.Contents || [])
    .filter(obj => obj.Key?.includes("-compressed."))
    .map(obj => ({
      compressedKey: obj.Key!,
      originalKey: obj.Key!.replace("-compressed.mp4", ".MOV")
        .replace("-compressed.mp4", ".mov")
        .replace("-compressed.mp4", ".MP4")
        .replace("-compressed.mp4", ".mp4"),
      size: obj.Size,
    }));

  console.log(`Found ${compressedVideos.length} compressed videos in S3\n`);

  // Get all video memories without compressed URL
  const videoMemories = await db
    .select({
      id: memories.id,
      s3Key: memories.s3Key,
      url: memories.url,
    })
    .from(memories)
    .where(
      and(
        eq(memories.type, "video"),
        isNull(memories.compressedUrl)
      )
    );

  console.log(`Found ${videoMemories.length} videos without compressed URL\n`);

  let updated = 0;

  for (const memory of videoMemories) {
    // Find matching compressed video
    const s3Key = memory.s3Key || "";

    // Try different extensions
    const possibleCompressed = [
      s3Key.replace(/\.[^.]+$/, "-compressed.mp4"),
    ];

    const match = compressedVideos.find(cv =>
      possibleCompressed.some(pc => cv.compressedKey === pc) ||
      cv.compressedKey.includes(s3Key.replace(/\.[^.]+$/, "-compressed"))
    );

    if (match) {
      const compressedUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${match.compressedKey}`;

      await db
        .update(memories)
        .set({
          compressedUrl,
          compressedS3Key: match.compressedKey,
          compressedFileSize: match.size,
          updatedAt: new Date(),
        })
        .where(eq(memories.id, memory.id));

      console.log(`✅ Updated: ${s3Key}`);
      console.log(`   → ${match.compressedKey} (${(match.size! / 1024).toFixed(0)} KB)`);
      updated++;
    }
  }

  console.log(`\n✅ Updated ${updated} video records`);
}

main().catch(console.error);
