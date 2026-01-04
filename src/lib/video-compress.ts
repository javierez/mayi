"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// Singleton FFmpeg instance
let ffmpeg: FFmpeg | null = null;
let isLoading = false;
let loadPromise: Promise<void> | null = null;

// Target settings for compression
const TARGET_MAX_WIDTH = 720; // 720p max
const TARGET_BITRATE = "1M"; // 1 Mbps
const TARGET_AUDIO_BITRATE = "128k";

/**
 * Load FFmpeg WASM (cached singleton)
 */
async function loadFFmpeg(
  onProgress?: (message: string) => void
): Promise<FFmpeg> {
  if (ffmpeg && ffmpeg.loaded) {
    return ffmpeg;
  }

  if (isLoading && loadPromise) {
    await loadPromise;
    return ffmpeg!;
  }

  isLoading = true;
  onProgress?.("Cargando compresor de vídeo...");

  loadPromise = (async () => {
    ffmpeg = new FFmpeg();

    // Load FFmpeg core from CDN
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
  })();

  await loadPromise;
  isLoading = false;

  return ffmpeg!;
}

/**
 * Compress a video file for faster streaming
 * - Reduces resolution to max 720p
 * - Uses H.264 codec with CRF 28 (good quality/size balance)
 * - Targets ~1 Mbps bitrate
 */
export async function compressVideo(
  file: File,
  onProgress?: (progress: { stage: string; percent?: number }) => void
): Promise<File> {
  // Skip small videos (under 5MB)
  if (file.size < 5 * 1024 * 1024) {
    console.log("Video is small, skipping compression");
    return file;
  }

  try {
    const ff = await loadFFmpeg((msg) =>
      onProgress?.({ stage: msg, percent: 0 })
    );

    onProgress?.({ stage: "Preparando vídeo...", percent: 5 });

    // Get input file extension
    const inputExt = file.name.split(".").pop()?.toLowerCase() || "mp4";
    const inputName = `input.${inputExt}`;
    const outputName = "output.mp4";

    // Write input file to FFmpeg virtual filesystem
    const fileData = await fetchFile(file);
    await ff.writeFile(inputName, fileData);

    onProgress?.({ stage: "Comprimiendo vídeo...", percent: 10 });

    // Set up progress tracking
    ff.on("progress", ({ progress }) => {
      const percent = Math.round(10 + progress * 80); // 10-90%
      onProgress?.({ stage: "Comprimiendo vídeo...", percent });
    });

    // Compress video with FFmpeg
    // -vf scale: scale to max 720p width while maintaining aspect ratio
    // -c:v libx264: use H.264 codec (widely supported)
    // -crf 28: constant quality factor (23 is default, 28 is more compressed)
    // -preset fast: encoding speed/compression tradeoff
    // -c:a aac: AAC audio codec
    // -b:a 128k: audio bitrate
    // -movflags +faststart: optimize for streaming (metadata at start)
    await ff.exec([
      "-i",
      inputName,
      "-vf",
      `scale='min(${TARGET_MAX_WIDTH},iw)':-2`,
      "-c:v",
      "libx264",
      "-crf",
      "28",
      "-preset",
      "fast",
      "-c:a",
      "aac",
      "-b:a",
      TARGET_AUDIO_BITRATE,
      "-movflags",
      "+faststart",
      "-y",
      outputName,
    ]);

    onProgress?.({ stage: "Finalizando...", percent: 95 });

    // Read compressed output
    const outputData = await ff.readFile(outputName);

    // Clean up virtual filesystem
    await ff.deleteFile(inputName);
    await ff.deleteFile(outputName);

    // Create compressed file
    const compressedBlob = new Blob([outputData], { type: "video/mp4" });
    const compressedFile = new File(
      [compressedBlob],
      file.name.replace(/\.[^.]+$/, ".mp4"),
      { type: "video/mp4" }
    );

    onProgress?.({ stage: "Completado", percent: 100 });

    // Log compression stats
    const originalMB = (file.size / (1024 * 1024)).toFixed(2);
    const compressedMB = (compressedFile.size / (1024 * 1024)).toFixed(2);
    const savings = (
      ((file.size - compressedFile.size) / file.size) *
      100
    ).toFixed(1);
    console.log(
      `Video compressed: ${originalMB}MB → ${compressedMB}MB (${savings}% smaller)`
    );

    return compressedFile;
  } catch (error) {
    console.error("Video compression failed:", error);
    // Return original file if compression fails
    return file;
  }
}

/**
 * Check if video needs compression based on size/dimensions
 */
export async function shouldCompressVideo(file: File): Promise<boolean> {
  // Always compress videos larger than 10MB
  if (file.size > 10 * 1024 * 1024) {
    return true;
  }

  // Skip very small videos
  if (file.size < 3 * 1024 * 1024) {
    return false;
  }

  // Check video dimensions
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      // Compress if larger than 720p
      resolve(video.videoWidth > 720 || video.videoHeight > 720);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      // If we can't check, compress to be safe
      resolve(true);
    };

    video.src = URL.createObjectURL(file);
  });
}
