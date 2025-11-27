/**
 * Image AI Operations Token Pricing System
 *
 * Unified token-based pricing for all image AI operations (Freepik, Google Gemini)
 * 1 token = €0.001 (1/10th of a cent)
 *
 * Pricing Strategy:
 * - Freepik: Dynamic pricing based on output image size (with buffer)
 * - Gemini: Fixed pricing per operation (with buffer)
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface TokenCost {
  tokens: number;
  estimatedCostEUR: number;
  operation: string;
}

/**
 * Token conversion rate
 * 1 token = €0.001
 */
export const TOKEN_TO_EUR = 0.001;
export const EUR_TO_TOKEN = 1000;

/**
 * Fixed token costs for Google Gemini operations
 * Updated for Gemini 3 Pro Image Preview pricing (2025-11-21)
 * Source: https://ai.google.dev/gemini-api/docs/pricing
 * Prices include 30-50% buffer over actual API costs
 *
 * Gemini 3 Pro Image Preview Pricing:
 * - Text input: $2.00/M tokens
 * - Text output: $12.00/M tokens
 * - Image input: $0.0011/image
 * - Image output (1K/2K): $0.134/image
 */
export const GEMINI_TOKEN_COSTS = {
  // Room detection: Text analysis with image input
  // Actual: ~€0.007 (image input + text output), charge 10 tokens (€0.01) = 43% buffer
  ROOM_DETECTION: 10,

  // Image renovation: Image generation with text prompt
  // Actual: ~€0.131 (image input + text input + image output), charge 170 tokens (€0.17) = 30% buffer
  RENOVATION: 170,

  // Renovation review: Image generation with 2 image inputs + feedback
  // Actual: ~€0.132 (2× image input + text input + image output), charge 170 tokens (€0.17) = 29% buffer
  REVIEW: 170,

  // Blur faces: Image generation for privacy protection
  // Actual: ~€0.131, charge 170 tokens (€0.17) = 30% buffer
  BLUR_FACES: 170,

  // Remove clutter: Image generation for decluttering
  // Actual: ~€0.131, charge 170 tokens (€0.17) = 30% buffer
  REMOVE_CLUTTER: 170,

  // Enhance lighting: Image generation for professional lighting enhancement
  // Actual: ~€0.131, charge 170 tokens (€0.17) = 30% buffer
  ENHANCE_LIGHTING: 170,

  // Render 3D: Image generation for 3D rendering from 2D images
  // Actual: ~€0.131, charge 150 tokens (€0.15) = 15% buffer
  RENDER_3D: 150,
} as const;

/**
 * Freepik token pricing tiers based on output megapixels
 * Based on existing Freepik pricing with 20-30% buffer included
 *
 * Original Freepik pricing ranges from €0.10 to €1.20
 * Token pricing: 100 tokens (€0.10) to 1200 tokens (€1.20)
 */
interface FreepikTokenTier {
  maxMegapixels: number;
  tokens: number;
  priceEUR: number;
}

const FREEPIK_TOKEN_TIERS: FreepikTokenTier[] = [
  { maxMegapixels: 1.5, tokens: 100, priceEUR: 0.1 }, // ~640x480 @ 2x
  { maxMegapixels: 4, tokens: 200, priceEUR: 0.2 }, // ~1280x720 @ 2x
  { maxMegapixels: 10, tokens: 400, priceEUR: 0.4 }, // ~1920x1080 @ 2x
  { maxMegapixels: 30, tokens: 700, priceEUR: 0.7 }, // ~2560x1440 @ 2x
  { maxMegapixels: 100, tokens: 1200, priceEUR: 1.2 }, // ~5000x5000 @ 2x
  { maxMegapixels: Infinity, tokens: 1200, priceEUR: 1.2 }, // Maximum cap
];

/**
 * Calculate token cost for Freepik image enhancement
 * Based on output image dimensions after upscaling
 */
export function calculateFreepikTokens(
  outputWidth: number,
  outputHeight: number,
): TokenCost {
  const outputPixels = outputWidth * outputHeight;
  const megapixels = outputPixels / 1_000_000;

  // Find the appropriate tier
  const tier =
    FREEPIK_TOKEN_TIERS.find((t) => megapixels <= t.maxMegapixels) ??
    FREEPIK_TOKEN_TIERS[FREEPIK_TOKEN_TIERS.length - 1]!;

  return {
    tokens: tier.tokens,
    estimatedCostEUR: tier.priceEUR,
    operation: `freepik_enhance_${outputWidth}x${outputHeight}`,
  };
}

/**
 * Calculate token cost for Freepik enhancement with upscale factor
 * Convenience function that calculates output dimensions
 */
export function calculateFreepikTokensWithFactor(
  inputWidth: number,
  inputHeight: number,
  upscaleFactor: number,
): TokenCost {
  const outputWidth = inputWidth * upscaleFactor;
  const outputHeight = inputHeight * upscaleFactor;

  return calculateFreepikTokens(outputWidth, outputHeight);
}

/**
 * Get all possible Freepik upscale options with token costs
 */
export interface UpscaleOption {
  factor: number;
  outputWidth: number;
  outputHeight: number;
  outputPixels: number;
  outputMegapixels: number;
  tokens: number;
  priceEUR: number;
}

export function getFreepikUpscaleOptions(
  inputWidth: number,
  inputHeight: number,
): UpscaleOption[] {
  const factors = [2, 4, 8, 16];

  return factors.map((factor) => {
    const outputWidth = inputWidth * factor;
    const outputHeight = inputHeight * factor;
    const outputPixels = outputWidth * outputHeight;
    const outputMegapixels = outputPixels / 1_000_000;

    const tokenCost = calculateFreepikTokens(outputWidth, outputHeight);

    return {
      factor,
      outputWidth,
      outputHeight,
      outputPixels,
      outputMegapixels: Math.round(outputMegapixels * 10) / 10,
      tokens: tokenCost.tokens,
      priceEUR: tokenCost.estimatedCostEUR,
    };
  });
}

/**
 * Calculate token cost for Google Gemini operations
 */
export function calculateGeminiTokens(
  operation: "room_detection" | "renovation" | "review" | "blur_faces" | "remove_clutter" | "enhance_lighting" | "render_3d",
): TokenCost {
  const tokenMap: Record<typeof operation, number> = {
    room_detection: GEMINI_TOKEN_COSTS.ROOM_DETECTION,
    renovation: GEMINI_TOKEN_COSTS.RENOVATION,
    review: GEMINI_TOKEN_COSTS.REVIEW,
    blur_faces: GEMINI_TOKEN_COSTS.BLUR_FACES,
    remove_clutter: GEMINI_TOKEN_COSTS.REMOVE_CLUTTER,
    enhance_lighting: GEMINI_TOKEN_COSTS.ENHANCE_LIGHTING,
    render_3d: GEMINI_TOKEN_COSTS.RENDER_3D,
  };
  const tokens = tokenMap[operation];

  return {
    tokens,
    estimatedCostEUR: tokens * TOKEN_TO_EUR,
    operation: `gemini_${operation}`,
  };
}

/**
 * Format tokens as a readable string
 */
export function formatTokens(tokens: number): string {
  return `${tokens.toLocaleString()} tokens`;
}

/**
 * Format price in euros
 */
export function formatPriceEUR(price: number): string {
  return `€${price.toFixed(2)}`;
}

/**
 * Convert EUR to tokens
 */
export function eurToTokens(eur: number): number {
  return Math.ceil(eur * EUR_TO_TOKEN);
}

/**
 * Convert tokens to EUR
 */
export function tokensToEur(tokens: number): number {
  return tokens * TOKEN_TO_EUR;
}

/**
 * Token package definitions for purchase
 */
export interface TokenPackage {
  id: string;
  tokens: number;
  priceEUR: number;
  pricePerToken: number;
  discount: number;
  popular?: boolean;
}

export const TOKEN_PACKAGES: TokenPackage[] = [
  {
    id: "starter",
    tokens: 1000,
    priceEUR: 10.0,
    pricePerToken: 0.01,
    discount: 0,
  },
  {
    id: "basic",
    tokens: 5000,
    priceEUR: 45.0,
    pricePerToken: 0.009,
    discount: 10,
  },
  {
    id: "pro",
    tokens: 10000,
    priceEUR: 80.0,
    pricePerToken: 0.008,
    discount: 20,
    popular: true,
  },
  {
    id: "enterprise",
    tokens: 50000,
    priceEUR: 350.0,
    pricePerToken: 0.007,
    discount: 30,
  },
];

/**
 * Get recommended token package based on operation count
 */
export function getRecommendedPackage(
  estimatedOperations: number,
  operationType: "freepik_enhance" | "gemini_renovate" | "mixed",
): TokenPackage {
  let estimatedTokens = 0;

  switch (operationType) {
    case "freepik_enhance":
      // Average Freepik cost: ~400 tokens
      estimatedTokens = estimatedOperations * 400;
      break;
    case "gemini_renovate":
      // Fixed Gemini cost: 150 tokens
      estimatedTokens = estimatedOperations * 150;
      break;
    case "mixed":
      // Mixed average: ~300 tokens
      estimatedTokens = estimatedOperations * 300;
      break;
  }

  // Find package that covers estimated tokens with some buffer
  const targetTokens = estimatedTokens * 1.2; // 20% buffer

  return (
    TOKEN_PACKAGES.find((pkg) => pkg.tokens >= targetTokens) ??
    TOKEN_PACKAGES[TOKEN_PACKAGES.length - 1]!
  );
}

/**
 * Check if account has sufficient tokens for operation
 */
export function hasSufficientTokens(
  currentBalance: number,
  requiredTokens: number,
): { sufficient: boolean; deficit?: number } {
  const sufficient = currentBalance >= requiredTokens;

  return {
    sufficient,
    deficit: sufficient ? undefined : requiredTokens - currentBalance,
  };
}

/**
 * Calculate tokens needed to purchase based on deficit
 */
export function calculateTokenDeficit(deficit: number): {
  deficit: number;
  recommendedPackage: TokenPackage;
  message: string;
} {
  const recommendedPackage =
    TOKEN_PACKAGES.find((pkg) => pkg.tokens >= deficit) ??
    TOKEN_PACKAGES[TOKEN_PACKAGES.length - 1]!;

  return {
    deficit,
    recommendedPackage,
    message: `Necesitas ${deficit} tokens más. Te recomendamos el paquete de ${recommendedPackage.tokens} tokens por ${formatPriceEUR(recommendedPackage.priceEUR)}.`,
  };
}
