import type { PropertyImage } from "~/lib/data";

export interface FreepikEnhanceRequest {
  imageUrl: string;
  propertyId: bigint;
  referenceNumber: string;
  imageOrder: number;
}

export interface FreepikEnhanceResponse {
  taskId: string;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  generated?: string[]; // Enhanced image URLs
  error?: string;
}

export interface FreepikTaskStatus {
  id: string;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  progress?: number;
  result?: {
    generated: string[];
  };
  error?: string;
}

// Light preset optimized for cost (Precision v1 API parameters)
// Using MINIMUM values for testing and cost optimization
// Note: Cost is determined by image resolution, NOT these parameters
export const LIGHT_ENHANCEMENT_SETTINGS = {
  sharpen: 0, // Minimum sharpening (range: 0-100, default: 50)
  smartGrain: 0, // Minimum grain enhancement (range: 0-100, default: 7)
  ultraDetail: 0, // Minimum detail enhancement (range: 0-100, default: 30)
} as const;

// Comparison slider state
export interface ComparisonSliderState {
  isVisible: boolean;
  originalImage: string;
  enhancedImage: string;
  sliderPosition: number; // 0-100 percentage
}

// Enhancement status type for UI components
export type EnhancementStatus = "idle" | "processing" | "success" | "error";

// Enhanced image data structure
export interface EnhancedImageData {
  originalImageUrl: string;
  enhancedImageUrl: string;
  originalImageId: bigint;
  enhancedPropertyImage?: PropertyImage;
}

// Re-export PropertyImage type for convenience
export type { PropertyImage } from "~/lib/data";
