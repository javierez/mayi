import sharp from "sharp";
import type {
  WatermarkConfig,
  WatermarkResult,
  WatermarkPosition,
  ImageDownloadResult,
} from "~/types/watermark";

/**
 * Download image buffer from S3 URL with proper error handling
 * Mirrors pattern from color-extraction.ts for image loading
 */
export async function downloadImageBuffer(
  imageUrl: string,
): Promise<ImageDownloadResult> {
  try {
    if (!imageUrl) {
      return {
        success: false,
        error: "No image URL provided",
      };
    }

    // Validate URL format
    if (!isValidImageUrl(imageUrl)) {
      return {
        success: false,
        error: "Invalid image URL format",
      };
    }

    console.log("Downloading image from URL:", imageUrl);

    const response = await fetch(imageUrl, {
      headers: {
        // Important for S3 CORS - mirrors pattern from color-extraction.ts
        "Access-Control-Allow-Origin": "*",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to download image: HTTP ${response.status} ${response.statusText}`,
      };
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.startsWith("image/")) {
      return {
        success: false,
        error: "URL does not point to a valid image",
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate buffer size (max 10MB for performance)
    const maxSize = 10 * 1024 * 1024;
    if (buffer.length > maxSize) {
      return {
        success: false,
        error: "Image file too large. Maximum size is 10MB.",
      };
    }

    console.log("Image downloaded successfully, size:", buffer.length);

    return {
      success: true,
      buffer,
      contentType,
    };
  } catch (error) {
    console.error("Error downloading image:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to download image",
    };
  }
}

/**
 * Add watermark to image using Sharp composite
 * Implements dynamic watermark sizing with configurable transparency
 * Follows error handling patterns from color-extraction.ts
 */
export async function addWatermark(
  imageBuffer: Buffer,
  watermarkUrl: string,
  position: WatermarkPosition = "southeast",
  sizePercentage = 40,
  opacity = 0.8,
): Promise<WatermarkResult> {
  try {
    if (!imageBuffer || imageBuffer.length === 0) {
      return {
        success: false,
        error: "No image buffer provided",
      };
    }

    if (!watermarkUrl) {
      return {
        success: false,
        error: "No watermark URL provided",
      };
    }

    console.log("Starting watermark application with position:", position);

    // Download watermark image
    const watermarkDownload = await downloadImageBuffer(watermarkUrl);
    if (!watermarkDownload.success || !watermarkDownload.buffer) {
      return {
        success: false,
        error: `Failed to download watermark: ${watermarkDownload.error}`,
      };
    }

    // Get source image dimensions for responsive watermark sizing
    const { width: imageWidth, height: imageHeight } =
      await sharp(imageBuffer).metadata();

    if (!imageWidth || !imageHeight) {
      return {
        success: false,
        error: "Could not determine source image dimensions",
      };
    }

    // Calculate watermark size (percentage of image width)
    const watermarkWidth = Math.floor(imageWidth * (sizePercentage / 100));

    // Resize watermark dynamically while maintaining aspect ratio and apply transparency
    const resizedWatermarkBuffer = await sharp(watermarkDownload.buffer)
      .resize(watermarkWidth, null, {
        withoutEnlargement: true, // Don't enlarge if watermark is smaller
        fit: "inside", // Maintain aspect ratio
      })
      .composite([
        {
          input: Buffer.from([255, 255, 255, Math.round(255 * opacity)]), // Configurable transparency
          raw: {
            width: 1,
            height: 1,
            channels: 4,
          },
          tile: true,
          blend: "dest-in",
        },
      ])
      .toBuffer();

    // Apply watermark using Sharp composite
    const watermarkedBuffer = await sharp(imageBuffer)
      .composite([
        {
          input: resizedWatermarkBuffer,
          gravity: position,
          blend: "over", // Standard overlay blend mode
        },
      ])
      .jpeg({ quality: 90 }) // Maintain high quality
      .toBuffer();

    console.log("Watermark applied successfully");

    return {
      success: true,
      imageBuffer: watermarkedBuffer,
      originalUrl: watermarkUrl,
    };
  } catch (error) {
    console.error("Error applying watermark:", error);

    // CRITICAL: Never throw - return error for graceful handling
    // This ensures Fotocasa upload never fails due to watermarking issues
    return {
      success: false,
      error: error instanceof Error ? error.message : "Watermarking failed",
    };
  }
}

/**
 * Convert watermarked image buffer to data URL for immediate use
 * Useful for on-demand processing without S3 storage
 */
export function bufferToDataUrl(
  buffer: Buffer,
  mimeType = "image/jpeg",
): string {
  const base64 = buffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Process multiple images with watermarking
 * Handles batch processing with error isolation
 */
export async function processImagesWithWatermark(
  images: Array<{ imageUrl: string; imageOrder?: number }>,
  watermarkConfig: WatermarkConfig,
): Promise<
  Array<{
    imageUrl: string;
    watermarked: boolean;
    error?: string;
    imageOrder?: number;
  }>
> {
  if (!watermarkConfig.enabled || !watermarkConfig.logoUrl) {
    // Return original images if watermarking is disabled
    return images.map((img) => ({ ...img, watermarked: false }));
  }

  console.log(`Processing ${images.length} images with watermarking`);

  const results = await Promise.all(
    images.map(async (image) => {
      try {
        // Download original image
        const imageDownload = await downloadImageBuffer(image.imageUrl);
        if (!imageDownload.success || !imageDownload.buffer) {
          console.warn(
            `Failed to download image ${image.imageUrl}:`,
            imageDownload.error,
          );
          return { ...image, watermarked: false, error: imageDownload.error };
        }

        // Apply watermark
        const watermarkResult = await addWatermark(
          imageDownload.buffer,
          watermarkConfig.logoUrl,
          watermarkConfig.position,
          watermarkConfig.size,
          watermarkConfig.opacity,
        );

        if (watermarkResult.success && watermarkResult.imageBuffer) {
          // Convert to data URL for immediate use
          const watermarkedUrl = bufferToDataUrl(watermarkResult.imageBuffer);
          return {
            imageUrl: watermarkedUrl,
            watermarked: true,
            imageOrder: image.imageOrder,
          };
        } else {
          console.warn(
            `Watermarking failed for ${image.imageUrl}:`,
            watermarkResult.error,
          );
          return { ...image, watermarked: false, error: watermarkResult.error };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.warn(`Error processing image ${image.imageUrl}:`, errorMessage);
        return { ...image, watermarked: false, error: errorMessage };
      }
    }),
  );

  const successCount = results.filter((r) => r.watermarked).length;
  console.log(
    `Watermarking completed: ${successCount}/${images.length} images processed successfully`,
  );

  return results;
}

/**
 * Validate image URL format
 * Supports S3 URLs and standard HTTP(S) image URLs
 */
function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    // Check if it's a valid HTTP/HTTPS URL
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return false;
    }

    // Check for image file extensions or S3 patterns
    const pathname = parsedUrl.pathname.toLowerCase();
    const hasImageExtension = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(pathname);
    const isS3Url =
      parsedUrl.hostname.includes("s3") ||
      parsedUrl.hostname.includes("amazonaws");

    return hasImageExtension || isS3Url;
  } catch {
    return false;
  }
}

/**
 * Get optimal watermark position based on image dimensions
 * Provides smart positioning for different aspect ratios
 */
export function getOptimalWatermarkPosition(
  imageWidth: number,
  imageHeight: number,
  preferredPosition?: string,
): WatermarkPosition {
  if (preferredPosition) {
    // Convert portal setting to Sharp gravity
    const positionMap: Record<string, WatermarkPosition> = {
      "top-left": "northwest",
      "top-right": "northeast",
      "bottom-left": "southwest",
      "bottom-right": "southeast",
      center: "center",
    };

    return positionMap[preferredPosition] ?? "center";
  }

  // Smart positioning based on aspect ratio
  const aspectRatio = imageWidth / imageHeight;

  if (aspectRatio > 1.5) {
    // Wide images - bottom right works well
    return "southeast";
  } else if (aspectRatio < 0.7) {
    // Tall images - bottom right or center
    return "southeast";
  } else {
    // Square-ish images - bottom right is standard
    return "southeast";
  }
}
