/**
 * Freepik Image Upscale Pricing Calculator
 * Based on output image area in pixels
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface UpscaleOption {
  factor: number;
  outputWidth: number;
  outputHeight: number;
  outputPixels: number;
  price: number;
}

/**
 * Calculate the price for upscaling based on output pixel area
 * Pricing tiers based on Freepik's model
 * Maximum price is capped at €1.20
 */
function calculatePriceFromPixels(outputPixels: number): number {
  const megapixels = outputPixels / 1_000_000;

  let price: number;

  // Pricing tiers (approximate based on examples provided)
  if (megapixels <= 1.5) {
    // ~640x480 @ 2x = 1.22MP → €0.10
    price = 0.1;
  } else if (megapixels <= 4) {
    // ~1280x720 @ 2x = 3.68MP → €0.10
    // ~640x480 @ 4x = 4.91MP → €0.40
    price = 0.1 + (megapixels - 1.5) * 0.12;
  } else if (megapixels <= 10) {
    // ~1920x1080 @ 2x = 8.29MP → €0.20
    price = 0.4 + (megapixels - 4) * 0.05;
  } else if (megapixels <= 30) {
    // ~640x480 @ 8x = 19.66MP (but capped)
    price = 0.7 + (megapixels - 10) * 0.045;
  } else if (megapixels <= 100) {
    // ~5000x5000 @ 2x = 100MP → €1.20
    price = 1.0 + (megapixels - 30) * 0.003;
  } else {
    // Very large images
    price = 1.2;
  }

  // Cap at maximum price of €1.20
  return Math.min(price, 1.2);
}

/**
 * Calculate upscale options and pricing for an input image
 */
export function calculateUpscaleOptions(
  inputDimensions: ImageDimensions,
): UpscaleOption[] {
  const { width, height } = inputDimensions;
  const factors = [2, 4, 8, 16];

  return factors.map((factor) => {
    const outputWidth = width * factor;
    const outputHeight = height * factor;
    const outputPixels = outputWidth * outputHeight;
    const price = calculatePriceFromPixels(outputPixels);

    return {
      factor,
      outputWidth,
      outputHeight,
      outputPixels,
      price: Math.round(price * 100) / 100, // Round to 2 decimals
    };
  });
}

/**
 * Format dimensions as string
 */
export function formatDimensions(width: number, height: number): string {
  return `${width}×${height}`;
}

/**
 * Format price in euros
 */
export function formatPrice(price: number): string {
  return `€${price.toFixed(2)}`;
}

/**
 * Calculate megapixels
 */
export function calculateMegapixels(width: number, height: number): number {
  return Math.round((width * height) / 100000) / 10;
}

export type UpscaleRecommendation =
  | "highly-recommended"
  | "recommended"
  | "optional"
  | "not-recommended";

export interface UpscaleRecommendationResult {
  recommendation: UpscaleRecommendation;
  reason: string;
  suggestedFactor?: number;
}

/**
 * Determine if upscaling is recommended based on input image dimensions
 *
 * Recommendations:
 * - Highly recommended: Images < 800px on shortest side (likely low quality)
 * - Recommended: Images 800-1200px on shortest side (could benefit from upscaling)
 * - Optional: Images 1200-2000px on shortest side (already decent quality)
 * - Not recommended: Images > 2000px on shortest side (already high quality, waste of money)
 */
export function getUpscaleRecommendation(
  dimensions: ImageDimensions,
): UpscaleRecommendationResult {
  const { width, height } = dimensions;
  const shortestSide = Math.min(width, height);
  const megapixels = calculateMegapixels(width, height);

  // Very small images - highly recommended
  if (shortestSide < 800) {
    const suggestedFactor = shortestSide < 400 ? 4 : 2;
    return {
      recommendation: "highly-recommended",
      reason: `Imagen pequeña (${width}×${height}). La mejora con IA aumentará significativamente la calidad.`,
      suggestedFactor,
    };
  }

  // Medium-small images - recommended
  if (shortestSide < 1200) {
    return {
      recommendation: "recommended",
      reason: `Imagen de calidad media (${width}×${height}). La mejora con IA puede mejorar los detalles.`,
      suggestedFactor: 2,
    };
  }

  // Medium-large images - optional
  if (shortestSide < 2000) {
    return {
      recommendation: "optional",
      reason: `Imagen de buena calidad (${width}×${height}, ${megapixels}MP). La mejora es opcional.`,
      suggestedFactor: 2,
    };
  }

  // Large images - not recommended
  return {
    recommendation: "not-recommended",
    reason: `Imagen de alta calidad (${width}×${height}, ${megapixels}MP). No se recomienda mejorar para ahorrar costes.`,
  };
}
