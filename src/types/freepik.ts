import type { PropertyImage } from "~/lib/data";

export interface FreepikEnhanceRequest {
  imageUrl: string;
  propertyId: bigint;
  referenceNumber: string;
  imageOrder: number;
}

export interface FreepikEnhanceResponse {
  taskId: string;
  status: "CREATED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  generated?: string[]; // Enhanced image URLs
  error?: string;
}

export interface FreepikTaskStatus {
  id: string;
  status: "CREATED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  progress?: number;
  result?: {
    generated: string[];
  };
  error?: string;
}

// Light preset optimized for cost
export const LIGHT_ENHANCEMENT_SETTINGS = {
  sharpen: 30, // Lower value for cost optimization
  smartGrain: 5, // Lower value for cost optimization
  ultraDetail: 20, // Lower value for cost optimization
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
