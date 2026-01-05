"use client";

/**
 * Video compression utilities
 *
 * NOTE: Client-side compression is disabled due to FFmpeg WASM CORS/security issues.
 * See /docs/VIDEO-COMPRESSION-LAMBDA.md for server-side implementation.
 *
 * Videos are uploaded without compression. This is acceptable for most use cases
 * as modern video players handle buffering well.
 */

/**
 * Check if video needs compression
 * Currently always returns false - compression is disabled
 */
export async function shouldCompressVideo(_file: File): Promise<boolean> {
  // Compression disabled - see /docs/VIDEO-COMPRESSION-LAMBDA.md
  return false;
}

/**
 * Compress video (no-op, returns original file)
 */
export async function compressVideo(
  file: File,
  _onProgress?: (progress: { stage: string; percent?: number }) => void
): Promise<File> {
  // Compression disabled - return original file
  return file;
}
