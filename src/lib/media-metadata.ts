import exifr from "exifr";

export interface MediaMetadata {
  latitude?: number;
  longitude?: number;
  takenAt?: Date;
  deviceInfo?: string;
  width?: number;
  height?: number;
}

/**
 * Extract EXIF metadata from an image buffer
 * Supports JPEG, HEIC, TIFF, and other common formats
 */
export async function extractImageMetadata(
  buffer: Buffer | ArrayBuffer
): Promise<MediaMetadata> {
  try {
    const exif = await exifr.parse(buffer, {
      gps: true,
      // Pick specific tags for efficiency
      pick: [
        "GPSLatitude",
        "GPSLongitude",
        "DateTimeOriginal",
        "CreateDate",
        "Make",
        "Model",
        "ImageWidth",
        "ImageHeight",
        "ExifImageWidth",
        "ExifImageHeight",
      ],
    });

    if (!exif) return {};

    const metadata: MediaMetadata = {};

    // GPS coordinates (exifr auto-converts DMS to decimal)
    if (exif.latitude !== undefined && exif.longitude !== undefined) {
      metadata.latitude = exif.latitude;
      metadata.longitude = exif.longitude;
    }

    // Capture date (prefer DateTimeOriginal, fallback to CreateDate)
    const dateValue = exif.DateTimeOriginal ?? exif.CreateDate;
    if (dateValue) {
      metadata.takenAt =
        dateValue instanceof Date ? dateValue : new Date(dateValue);
    }

    // Device info (combine Make and Model)
    if (exif.Make || exif.Model) {
      const make = exif.Make?.trim() ?? "";
      const model = exif.Model?.trim() ?? "";
      // Avoid duplicating make in model (e.g., "Apple iPhone 14" when make is "Apple")
      if (model.toLowerCase().startsWith(make.toLowerCase())) {
        metadata.deviceInfo = model;
      } else {
        metadata.deviceInfo = [make, model].filter(Boolean).join(" ");
      }
    }

    // Dimensions (try different EXIF tags)
    const width = exif.ImageWidth ?? exif.ExifImageWidth;
    const height = exif.ImageHeight ?? exif.ExifImageHeight;
    if (width) metadata.width = width;
    if (height) metadata.height = height;

    return metadata;
  } catch (error) {
    console.error("Error extracting image metadata:", error);
    return {};
  }
}

/**
 * Extract metadata from a File object (browser/client-side)
 */
export async function extractImageMetadataFromFile(
  file: File
): Promise<MediaMetadata> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    return extractImageMetadata(arrayBuffer);
  } catch (error) {
    console.error("Error reading file for metadata extraction:", error);
    return {};
  }
}
