/**
 * Convert an image URL to base64 string
 * Required by Freepik API for image processing
 */
export async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`,
      );
    }

    // Convert to buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert to base64
    const base64 = buffer.toString("base64");

    // Get content type from response headers
    const contentType = response.headers.get("content-type") ?? "image/jpeg";

    // Return data URL format that Freepik expects
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error("Error converting image URL to base64:", error);
    throw new Error(
      `Failed to process image from URL: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Validate image size - Freepik has size limits
 * @param base64Image - Base64 encoded image string
 * @param maxSizeInMB - Maximum allowed size in MB (default: 10MB)
 * @returns true if valid, false if too large
 */
export function validateImageSize(
  base64Image: string,
  maxSizeInMB = 10,
): boolean {
  try {
    // Calculate the size of the base64 string
    // Base64 encoding increases size by ~33%, so we need to account for that
    const base64SizeInBytes = (base64Image.length * 3) / 4;
    const sizeInMB = base64SizeInBytes / (1024 * 1024);

    return sizeInMB <= maxSizeInMB;
  } catch (error) {
    console.error("Error validating image size:", error);
    return false;
  }
}

/**
 * Get the actual size of a base64 encoded image in MB
 */
export function getImageSizeInMB(base64Image: string): number {
  const base64SizeInBytes = (base64Image.length * 3) / 4;
  return base64SizeInBytes / (1024 * 1024);
}

/**
 * Download an image from URL and return it as a Buffer
 * Useful for S3 uploads after Freepik processing
 */
export async function downloadImageAsBuffer(imageUrl: string): Promise<Buffer> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to download image: ${response.status} ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Error downloading image as buffer:", error);
    throw new Error(
      `Failed to download image: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Generate a filename for enhanced images
 * Following the existing naming pattern but with "enhanced" prefix
 */
export function generateEnhancedImageFilename(
  referenceNumber: string,
  originalImageOrder: number,
  nanoid: string,
  fileExtension = "jpg",
): string {
  return `${referenceNumber}/images/enhanced_${originalImageOrder}_${nanoid}.${fileExtension}`;
}

/**
 * Extract file extension from URL or filename
 */
export function getFileExtensionFromUrl(url: string): string {
  try {
    const urlPath = new URL(url).pathname;
    const extension = urlPath.split(".").pop()?.toLowerCase();
    return extension ?? "jpg"; // Default to jpg if no extension found
  } catch {
    // If URL parsing fails, try to extract from string directly
    const parts = url.split(".");
    return parts.length > 1 ? parts[parts.length - 1]!.toLowerCase() : "jpg";
  }
}

/**
 * Check if a URL points to a valid image based on extension
 */
export function isValidImageUrl(url: string): boolean {
  const validExtensions = ["jpg", "jpeg", "png", "webp", "gif"];
  const extension = getFileExtensionFromUrl(url);
  return validExtensions.includes(extension);
}

/**
 * Estimate processing time based on image size (for UI progress indicators)
 * Returns estimated time in seconds
 */
export function estimateProcessingTime(imageSizeInMB: number): number {
  // Base time of 30 seconds + 10 seconds per MB
  // This is just an estimate for UI purposes
  const baseTime = 30;
  const additionalTime = imageSizeInMB * 10;
  return Math.min(baseTime + additionalTime, 180); // Cap at 3 minutes
}

/**
 * Convert base64 string to Buffer for Gemini image processing
 * Handles both data URL format and clean base64
 */
export function base64ToBuffer(base64String: string): Buffer {
  try {
    // Remove data URL prefix if present
    const cleanBase64 = base64String.replace(
      /^data:image\/[a-zA-Z]+;base64,/,
      "",
    );
    return Buffer.from(cleanBase64, "base64");
  } catch (error) {
    console.error("Error converting base64 to buffer:", error);
    throw new Error(
      `Failed to process base64 image data: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Generate a filename for renovated images
 * Following the existing naming pattern but with "renovated" prefix
 */
export function generateRenovatedImageFilename(
  referenceNumber: string,
  originalImageOrder: number,
  nanoid: string,
  fileExtension = "jpg",
): string {
  return `${referenceNumber}/images/renovated_${originalImageOrder}_${nanoid}.${fileExtension}`;
}

/**
 * Validate base64 image format for Gemini API
 * Gemini accepts various formats but has specific requirements
 */
export function validateGeminiImageFormat(base64Image: string): {
  valid: boolean;
  error?: string;
} {
  try {
    if (!base64Image || typeof base64Image !== "string") {
      return { valid: false, error: "Invalid image data format" };
    }

    // Remove data URL prefix if present for validation
    const cleanBase64 = base64Image.replace(
      /^data:image\/[a-zA-Z]+;base64,/,
      "",
    );

    // Check base64 format
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
      return { valid: false, error: "Invalid base64 format" };
    }

    // Check size limits (Gemini supports up to 20MB)
    if (!validateImageSize(base64Image, 20)) {
      const sizeMB = getImageSizeInMB(base64Image);
      return {
        valid: false,
        error: `Image too large (${sizeMB.toFixed(2)}MB). Maximum size is 20MB`,
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Failed to validate image format" };
  }
}

/**
 * Estimate Gemini processing time (typically much faster than Freepik)
 * Returns estimated time in seconds
 */
export function estimateGeminiProcessingTime(imageSizeInMB: number): number {
  // Gemini is much faster - base time of 3 seconds + 1 second per MB
  const baseTime = 3;
  const additionalTime = imageSizeInMB * 1;
  return Math.min(baseTime + additionalTime, 30); // Cap at 30 seconds
}

/**
 * Convert a data URL to just the base64 part (for Gemini API)
 * Gemini expects clean base64 without the data URL prefix
 */
export function extractBase64FromDataUrl(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
}

/**
 * Create a data URL from base64 and mime type
 * Useful for displaying Gemini-generated images
 */
export function createDataUrl(base64: string, mimeType = "image/jpeg"): string {
  const cleanBase64 = extractBase64FromDataUrl(base64); // In case it's already a data URL
  return `data:${mimeType};base64,${cleanBase64}`;
}

/**
 * Generate a thumbnail URL from the original image URL
 * Uses Next.js built-in image optimization when possible
 */
export function getThumbnailUrl(
  originalUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {},
): string {
  const { width = 150, height = 100, quality = 75 } = options;

  // For S3 URLs, we'll rely on Next.js Image component optimization
  // The actual optimization happens when the image is requested with specific dimensions
  if (originalUrl.includes("amazonaws.com") || originalUrl.includes("s3.")) {
    // Return original URL - Next.js Image component will handle the optimization
    return originalUrl;
  }

  // For external URLs that support query parameter resizing
  if (originalUrl.includes("cloudinary.com")) {
    return originalUrl.replace(
      "/upload/",
      `/upload/w_${width},h_${height},c_fill,q_${quality}/`,
    );
  }

  if (originalUrl.includes("imagekit.io")) {
    const separator = originalUrl.includes("?") ? "&" : "?";
    return `${originalUrl}${separator}tr=w-${width},h-${height},c-at_max,q-${quality}`;
  }

  // Fallback to original URL
  return originalUrl;
}

/**
 * Get optimal image sizes for different use cases
 */
export const ImageSizes = {
  THUMBNAIL: { width: 128, height: 96, quality: 75 },
  CARD: { width: 300, height: 200, quality: 80 },
  GALLERY_MAIN: { width: 800, height: 600, quality: 85 },
  FULLSCREEN: { width: 1920, height: 1080, quality: 90 },
} as const;

/**
 * Generate sizes attribute for responsive images
 */
export function getImageSizes(
  usage: "thumbnail" | "card" | "gallery" | "fullscreen",
): string {
  switch (usage) {
    case "thumbnail":
      return "128px";
    case "card":
      return "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw";
    case "gallery":
      return "(max-width: 768px) 100vw, 800px";
    case "fullscreen":
      return "100vw";
    default:
      return "100vw";
  }
}

/**
 * Accepted image types for file inputs, including HEIC/HEIF from iPhones
 */
export const ACCEPTED_IMAGE_TYPES = "image/*,.heic,.heif";

/**
 * Check if a file is a HEIC/HEIF image (common iPhone format)
 */
export function isHeicFile(file: File): boolean {
  const heicTypes = [
    "image/heic",
    "image/heif",
    "image/heic-sequence",
    "image/heif-sequence",
  ];
  const heicExtensions = [".heic", ".heif"];

  // Check MIME type
  if (heicTypes.includes(file.type.toLowerCase())) {
    return true;
  }

  // Check file extension (some browsers don't report correct MIME type for HEIC)
  const fileName = file.name.toLowerCase();
  return heicExtensions.some((ext) => fileName.endsWith(ext));
}

/**
 * Convert a HEIC file to JPEG (for browser compatibility)
 * Returns a new File object with the converted image
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }

  // Dynamic import to avoid SSR issues (heic2any uses browser APIs)
  const heic2any = (await import("heic2any")).default;

  try {
    const convertedBlob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });

    // heic2any can return a single blob or array of blobs
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

    if (!blob) {
      throw new Error("HEIC conversion returned empty result");
    }

    // Create a new filename with .jpg extension
    const newFileName = file.name
      .replace(/\.heic$/i, ".jpg")
      .replace(/\.heif$/i, ".jpg");

    // Create a new File object from the blob
    const convertedFile = new File([blob], newFileName, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });

    return convertedFile;
  } catch (error) {
    console.error("Error converting HEIC to JPEG:", error);
    throw new Error(`Failed to convert HEIC image: ${file.name}`);
  }
}

/**
 * Process a list of files, converting any HEIC files to JPEG
 * Returns a new array with converted files
 */
export async function processImageFiles(files: File[]): Promise<File[]> {
  const processedFiles: File[] = [];

  for (const file of files) {
    if (isHeicFile(file)) {
      try {
        const convertedFile = await convertHeicToJpeg(file);
        processedFiles.push(convertedFile);
      } catch (error) {
        console.error(`Failed to convert ${file.name}:`, error);
        // Skip files that fail to convert
      }
    } else {
      processedFiles.push(file);
    }
  }

  return processedFiles;
}
