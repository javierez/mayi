/**
 * Image utilities for HEIC conversion and image handling
 */

/**
 * Check if a file is a HEIC/HEIF image
 */
export function isHeicFile(file: File): boolean {
  const heicTypes = ["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"];
  const heicExtensions = [".heic", ".heif"];

  // Check MIME type
  if (heicTypes.includes(file.type.toLowerCase())) {
    return true;
  }

  // Check file extension (fallback for when MIME type isn't set correctly)
  const fileName = file.name.toLowerCase();
  return heicExtensions.some(ext => fileName.endsWith(ext));
}

/**
 * Convert a HEIC/HEIF file to JPEG using the server-side API
 * @param file - The HEIC file to convert
 * @returns A new File object with the converted JPEG image
 * @throws Error if conversion fails
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  // If not a HEIC file, return as-is
  if (!isHeicFile(file)) {
    return file;
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/convert-heic", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = (await response.json()) as { error?: string };
    throw new Error(errorData.error ?? "Server conversion failed");
  }

  const convertedBlob = await response.blob();
  const newFileName =
    response.headers.get("X-New-Filename") ??
    file.name.replace(/\.heic$/i, ".jpg").replace(/\.heif$/i, ".jpg");

  return new File([convertedBlob], newFileName, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}

/**
 * Convert multiple files, converting any HEIC files to JPEG
 * @param files - Array of files to process
 * @returns Array of processed files (HEIC converted to JPEG, others unchanged)
 */
export async function convertHeicFiles(files: File[]): Promise<File[]> {
  return Promise.all(files.map(file => convertHeicToJpeg(file)));
}

/**
 * Check if any files in the array are HEIC format
 */
export function hasHeicFiles(files: File[]): boolean {
  return files.some(file => isHeicFile(file));
}
