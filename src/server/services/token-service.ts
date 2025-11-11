/**
 * Token Service
 *
 * Manages image AI token operations:
 * - Check balance
 * - Deduct tokens
 * - Add tokens
 * - Transaction logging
 */

import { db } from "~/server/db";
import { accounts, imageTokenTransactions } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";

export interface TokenOperationMetadata {
  // Freepik metadata
  imageWidth?: number;
  imageHeight?: number;
  upscaleFactor?: number;
  outputWidth?: number;
  outputHeight?: number;

  // Gemini metadata
  roomType?: string;
  style?: string;
  selectedElements?: string[];

  // General metadata
  reason?: string;
  autoGranted?: boolean;
  [key: string]: unknown;
}

export interface DeductTokensParams {
  accountId: bigint;
  tokens: number;
  operation:
    | "freepik_enhance"
    | "gemini_renovate"
    | "gemini_detect"
    | "gemini_review"
    | "gemini_blur_faces"
    | "gemini_remove_clutter"
    | "admin_debit";
  metadata?: TokenOperationMetadata;
  propertyImageId?: bigint;
  propertyId?: bigint;
  userId?: string;
}

export interface AddTokensParams {
  accountId: bigint;
  tokens: number;
  operation: "token_purchase" | "admin_credit";
  metadata?: TokenOperationMetadata;
  userId?: string;
  purchaseAmount?: string; // Decimal stored as string in database
  paymentMethod?: string;
  paymentReference?: string;
}

export interface TokenBalance {
  balance: number;
  tokensUsed: number;
}

export interface TokenCheckResult {
  sufficient: boolean;
  currentBalance: number;
  requiredTokens: number;
  deficit?: number;
}

/**
 * Get account's current token balance
 */
export async function getAccountBalance(
  accountId: bigint,
): Promise<TokenBalance> {
  const account = await db
    .select({
      balance: accounts.imageTokenBalance,
      tokensUsed: accounts.imageTokensUsed,
    })
    .from(accounts)
    .where(eq(accounts.accountId, accountId))
    .limit(1);

  if (!account[0]) {
    throw new Error(`Account ${accountId} not found`);
  }

  return {
    balance: account[0].balance ?? 0,
    tokensUsed: account[0].tokensUsed ?? 0,
  };
}

/**
 * Check if account has sufficient tokens
 */
export async function checkSufficientTokens(
  accountId: bigint,
  requiredTokens: number,
): Promise<TokenCheckResult> {
  const { balance } = await getAccountBalance(accountId);
  const sufficient = balance >= requiredTokens;

  return {
    sufficient,
    currentBalance: balance,
    requiredTokens,
    deficit: sufficient ? undefined : requiredTokens - balance,
  };
}

/**
 * Deduct tokens from account balance
 * Returns the new balance after deduction
 */
export async function deductTokens(
  params: DeductTokensParams,
): Promise<number> {
  const { accountId, tokens, operation, metadata, propertyImageId, propertyId, userId } = params;

  if (tokens <= 0) {
    throw new Error("Tokens to deduct must be positive");
  }

  // Get current balance
  const { balance: beforeBalance } = await getAccountBalance(accountId);

  // Check sufficient balance
  if (beforeBalance < tokens) {
    throw new Error(
      `Insufficient tokens. Required: ${tokens}, Available: ${beforeBalance}`,
    );
  }

  const afterBalance = beforeBalance - tokens;

  // Update account balance and usage in a single query
  await db
    .update(accounts)
    .set({
      imageTokenBalance: afterBalance,
      imageTokensUsed: sql`${accounts.imageTokensUsed} + ${tokens}`,
      updatedAt: new Date(),
    })
    .where(eq(accounts.accountId, accountId));

  // Log transaction
  await db.insert(imageTokenTransactions).values({
    accountId,
    operation,
    tokensChanged: -tokens, // Negative for deduction
    beforeBalance,
    afterBalance,
    metadata: metadata ?? {},
    propertyImageId,
    propertyId,
    userId,
  });

  // Revalidate token balance cache to update UI
  revalidateTag("token-balance");

  return afterBalance;
}

/**
 * Add tokens to account balance
 * Returns the new balance after addition
 */
export async function addTokens(params: AddTokensParams): Promise<number> {
  const {
    accountId,
    tokens,
    operation,
    metadata,
    userId,
    purchaseAmount,
    paymentMethod,
    paymentReference,
  } = params;

  if (tokens <= 0) {
    throw new Error("Tokens to add must be positive");
  }

  // Get current balance
  const { balance: beforeBalance } = await getAccountBalance(accountId);
  const afterBalance = beforeBalance + tokens;

  // Update account balance
  await db
    .update(accounts)
    .set({
      imageTokenBalance: afterBalance,
      updatedAt: new Date(),
    })
    .where(eq(accounts.accountId, accountId));

  // Log transaction
  await db.insert(imageTokenTransactions).values({
    accountId,
    operation,
    tokensChanged: tokens, // Positive for addition
    beforeBalance,
    afterBalance,
    metadata: metadata ?? {},
    userId,
    purchaseAmount,
    paymentMethod,
    paymentReference,
  });

  // Revalidate token balance cache to update UI
  revalidateTag("token-balance");

  return afterBalance;
}

/**
 * Get transaction history for an account
 */
export async function getTransactionHistory(
  accountId: bigint,
  limit = 50,
  offset = 0,
) {
  return await db
    .select()
    .from(imageTokenTransactions)
    .where(eq(imageTokenTransactions.accountId, accountId))
    .orderBy(imageTokenTransactions.createdAt)
    .limit(limit)
    .offset(offset);
}

/**
 * Wrapper function for Freepik enhancement token deduction
 */
export async function deductFreepikTokens(
  accountId: bigint,
  tokens: number,
  imageWidth: number,
  imageHeight: number,
  upscaleFactor: number,
  propertyImageId?: bigint,
  propertyId?: bigint,
  userId?: string,
): Promise<number> {
  return await deductTokens({
    accountId,
    tokens,
    operation: "freepik_enhance",
    metadata: {
      imageWidth,
      imageHeight,
      upscaleFactor,
      outputWidth: imageWidth * upscaleFactor,
      outputHeight: imageHeight * upscaleFactor,
    },
    propertyImageId,
    propertyId,
    userId,
  });
}

/**
 * Wrapper function for Gemini renovation token deduction
 */
export async function deductGeminiRenovationTokens(
  accountId: bigint,
  tokens: number,
  roomType: string,
  style: string,
  selectedElements?: string[],
  propertyImageId?: bigint,
  propertyId?: bigint,
  userId?: string,
): Promise<number> {
  return await deductTokens({
    accountId,
    tokens,
    operation: "gemini_renovate",
    metadata: {
      roomType,
      style,
      selectedElements,
    },
    propertyImageId,
    propertyId,
    userId,
  });
}

/**
 * Wrapper function for Gemini room detection token deduction
 */
export async function deductGeminiDetectionTokens(
  accountId: bigint,
  tokens: number,
  propertyImageId?: bigint,
  propertyId?: bigint,
  userId?: string,
): Promise<number> {
  return await deductTokens({
    accountId,
    tokens,
    operation: "gemini_detect",
    metadata: {
      reason: "Room type detection",
    },
    propertyImageId,
    propertyId,
    userId,
  });
}

/**
 * Wrapper function for Gemini renovation review token deduction
 */
export async function deductGeminiReviewTokens(
  accountId: bigint,
  tokens: number,
  reviewText: string,
  propertyImageId?: bigint,
  propertyId?: bigint,
  userId?: string,
): Promise<number> {
  return await deductTokens({
    accountId,
    tokens,
    operation: "gemini_review",
    metadata: {
      reason: "Renovation review",
      reviewText: reviewText.substring(0, 200), // Store first 200 chars of review text
    },
    propertyImageId,
    propertyId,
    userId,
  });
}

/**
 * Wrapper function for Gemini blur faces token deduction
 */
export async function deductGeminiBlurFacesTokens(
  accountId: bigint,
  tokens: number,
  propertyImageId?: bigint,
  propertyId?: bigint,
  userId?: string,
): Promise<number> {
  return await deductTokens({
    accountId,
    tokens,
    operation: "gemini_blur_faces",
    metadata: {
      reason: "Blur faces for privacy protection",
    },
    propertyImageId,
    propertyId,
    userId,
  });
}

/**
 * Wrapper function for Gemini remove clutter token deduction
 */
export async function deductGeminiRemoveClutterTokens(
  accountId: bigint,
  tokens: number,
  propertyImageId?: bigint,
  propertyId?: bigint,
  userId?: string,
): Promise<number> {
  return await deductTokens({
    accountId,
    tokens,
    operation: "gemini_remove_clutter",
    metadata: {
      reason: "Remove clutter and non-furniture items",
    },
    propertyImageId,
    propertyId,
    userId,
  });
}
