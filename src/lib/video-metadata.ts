import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from "ffprobe-static";
import { Readable } from "stream";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

// Set ffprobe path
ffmpeg.setFfprobePath(ffprobeStatic.path);

export interface VideoMetadata {
  latitude?: number;
  longitude?: number;
  takenAt?: Date;
  duration?: number;
  width?: number;
  height?: number;
}

/**
 * Parse GPS location string from video metadata
 * Format examples:
 * - "+40.4475-003.6983/" (ISO 6709)
 * - "+40.4475-3.6983/"
 * - "40.4475 N, 3.6983 W"
 */
function parseGPSLocation(location: string): {
  latitude?: number;
  longitude?: number;
} {
  if (!location) return {};

  // Try ISO 6709 format: "+40.4475-003.6983/" or "+40.4475+003.6983/"
  const isoMatch = location.match(
    /([+-]?\d+\.?\d*)\s*([+-]\d+\.?\d*)/
  );
  if (isoMatch) {
    const lat = parseFloat(isoMatch[1]!);
    const lng = parseFloat(isoMatch[2]!);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  // Try format with N/S/E/W indicators
  const dmsMatch = location.match(
    /(\d+\.?\d*)\s*([NS])[,\s]+(\d+\.?\d*)\s*([EW])/i
  );
  if (dmsMatch) {
    let lat = parseFloat(dmsMatch[1]!);
    let lng = parseFloat(dmsMatch[3]!);
    if (dmsMatch[2]!.toUpperCase() === "S") lat = -lat;
    if (dmsMatch[4]!.toUpperCase() === "W") lng = -lng;
    if (!isNaN(lat) && !isNaN(lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  return {};
}

/**
 * Extract metadata from a video file using ffprobe
 */
export async function extractVideoMetadataFromPath(
  filePath: string
): Promise<VideoMetadata> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error("Error running ffprobe:", err);
        resolve({});
        return;
      }

      const result: VideoMetadata = {};

      // Get format metadata
      const format = metadata.format;

      // Duration
      if (format?.duration) {
        result.duration = Math.round(format.duration);
      }

      // GPS location from tags
      const tags = format?.tags as Record<string, string> | undefined;
      if (tags) {
        // Try different location tag names
        const locationStr =
          tags.location ??
          tags["com.apple.quicktime.location.ISO6709"] ??
          tags["location-eng"] ??
          tags.com_apple_quicktime_location_ISO6709;

        if (locationStr) {
          const gps = parseGPSLocation(locationStr);
          if (gps.latitude !== undefined) result.latitude = gps.latitude;
          if (gps.longitude !== undefined) result.longitude = gps.longitude;
        }

        // Creation time
        const creationTime =
          tags.creation_time ??
          tags["com.apple.quicktime.creationdate"] ??
          tags.date;

        if (creationTime) {
          const date = new Date(creationTime);
          if (!isNaN(date.getTime())) {
            result.takenAt = date;
          }
        }
      }

      // Get video stream for dimensions
      const videoStream = metadata.streams?.find(
        (s) => s.codec_type === "video"
      );
      if (videoStream) {
        if (videoStream.width) result.width = videoStream.width;
        if (videoStream.height) result.height = videoStream.height;
      }

      resolve(result);
    });
  });
}

/**
 * Extract metadata from a video buffer
 * Writes to a temp file, extracts, then cleans up
 */
export async function extractVideoMetadata(
  buffer: Buffer
): Promise<VideoMetadata> {
  const tempPath = join(tmpdir(), `video-${randomUUID()}.tmp`);

  try {
    // Write buffer to temp file
    await writeFile(tempPath, buffer);

    // Extract metadata
    const metadata = await extractVideoMetadataFromPath(tempPath);

    return metadata;
  } catch (error) {
    console.error("Error extracting video metadata:", error);
    return {};
  } finally {
    // Clean up temp file
    try {
      await unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Extract metadata from a video stream (for S3 downloads)
 */
export async function extractVideoMetadataFromStream(
  stream: Readable
): Promise<VideoMetadata> {
  const tempPath = join(tmpdir(), `video-${randomUUID()}.tmp`);
  const { createWriteStream } = await import("fs");

  return new Promise((resolve) => {
    const writeStream = createWriteStream(tempPath);

    stream.pipe(writeStream);

    writeStream.on("finish", async () => {
      try {
        const metadata = await extractVideoMetadataFromPath(tempPath);
        resolve(metadata);
      } catch (error) {
        console.error("Error extracting video metadata from stream:", error);
        resolve({});
      } finally {
        try {
          await unlink(tempPath);
        } catch {
          // Ignore cleanup errors
        }
      }
    });

    writeStream.on("error", (error) => {
      console.error("Error writing video stream to temp file:", error);
      resolve({});
    });
  });
}
