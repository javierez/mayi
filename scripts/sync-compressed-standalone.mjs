#!/usr/bin/env node

/**
 * Standalone script to sync compressed video URLs to database
 * Run with: node scripts/sync-compressed-standalone.mjs
 */

import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import postgres from "postgres";

const BUCKET = "mayi";
const REGION = "us-east-1";
const DATABASE_URL = process.env.POSTGRES_URL || "YOUR_DATABASE_URL_HERE";

async function main() {
  console.log("🔄 Syncing compressed video URLs to database...\n");

  // Get compressed videos from S3
  const s3 = new S3Client({ region: REGION });

  let allObjects = [];
  let continuationToken;

  do {
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: "memoria/",
      ContinuationToken: continuationToken,
    });
    const response = await s3.send(listCommand);
    allObjects = allObjects.concat(response.Contents || []);
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  const compressedVideos = allObjects
    .filter(obj => obj.Key?.includes("-compressed."))
    .map(obj => ({
      compressedKey: obj.Key,
      size: obj.Size,
    }));

  console.log(`Found ${compressedVideos.length} compressed videos in S3\n`);

  // Connect to database
  const sql = postgres(DATABASE_URL);

  // Get all video memories without compressed URL
  const videoMemories = await sql`
    SELECT id, s3_key, url, compressed_url
    FROM memories
    WHERE type = 'video' AND compressed_url IS NULL
  `;

  console.log(`Found ${videoMemories.length} videos without compressed URL\n`);

  let updated = 0;

  for (const row of videoMemories) {
    const s3Key = row.s3_key || "";

    // Find matching compressed video (handle different extensions)
    const baseKey = s3Key.replace(/\.[^.]+$/, "");
    const match = compressedVideos.find(cv =>
      cv.compressedKey.startsWith(baseKey + "-compressed.")
    );

    if (match) {
      const compressedUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${match.compressedKey}`;

      await sql`
        UPDATE memories
        SET compressed_url = ${compressedUrl},
            compressed_s3_key = ${match.compressedKey},
            compressed_file_size = ${match.size},
            updated_at = NOW()
        WHERE id = ${row.id}
      `;

      console.log(`✅ ${s3Key}`);
      console.log(`   → ${(match.size / 1024).toFixed(0)} KB`);
      updated++;
    }
  }

  await sql.end();

  console.log(`\n✅ Updated ${updated} video records in database`);
  console.log("\nVideos will now use compressed versions in the feed!");
}

main().catch(console.error);
