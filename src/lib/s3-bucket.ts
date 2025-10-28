import { getAccountById } from "~/server/queries/accounts";
import { getCurrentUserAccountId } from "~/lib/dal";

/**
 * Normalizes account name for S3 bucket/folder naming
 * Converts to lowercase and removes all non-alphanumeric characters
 */
export function normalizeAccountNameForS3(accountName: string): string {
  return accountName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") // Remove spaces, hyphens, quotes, slashes, etc.
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens (if any remain)
}

/**
 * Gets the dynamic S3 bucket name based on the current user's account
 * This replaces hardcoded process.env.AWS_S3_BUCKET usage
 */
export async function getDynamicBucketName(): Promise<string> {
  const accountId = await getCurrentUserAccountId();
  const account = await getAccountById(accountId);

  if (!account) {
    throw new Error("Account not found for current user");
  }

  return normalizeAccountNameForS3(account.name);
}

/**
 * Gets the dynamic S3 bucket name for a specific account ID
 * Useful when you already have the account ID
 */
export async function getDynamicBucketNameForAccount(
  accountId: number | bigint,
): Promise<string> {
  const account = await getAccountById(accountId);

  if (!account) {
    throw new Error(`Account not found: ${accountId}`);
  }

  return normalizeAccountNameForS3(account.name);
}
