// Watermark position type matching Sharp's gravity options
export type WatermarkPosition =
  | "north"
  | "northeast"
  | "east"
  | "southeast"
  | "south"
  | "southwest"
  | "west"
  | "northwest"
  | "center";

// Watermark configuration extracted from account settings
export interface WatermarkConfig {
  enabled: boolean;
  logoUrl: string;
  position: WatermarkPosition;
  opacity?: number;
  size?: number; // Percentage of image width (default: 30)
}

// Result type for watermarking operations
export interface WatermarkResult {
  success: boolean;
  imageUrl?: string;
  imageBuffer?: Buffer;
  originalUrl?: string;
  error?: string;
}

// Image download result type
export interface ImageDownloadResult {
  success: boolean;
  buffer?: Buffer;
  contentType?: string;
  error?: string;
}

// Account watermark settings type (extracted from portal settings)
export interface AccountWatermarkSettings {
  watermarkEnabled: boolean;
  logoTransparent?: string;
  watermarkPosition?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center";
}

// Mapping from portal settings to Sharp gravity
export const POSITION_MAPPING: Record<string, WatermarkPosition> = {
  "top-left": "northwest",
  "top-right": "northeast",
  "bottom-left": "southwest",
  "bottom-right": "southeast",
  center: "center",
};

// Manifest for tracking watermarked images in S3 (for caching)
export interface WatermarkManifest {
  watermarkConfigHash: string;
  createdAt: string;
  images: Array<{
    order: number;
    originalUrl: string;
  }>;
}
