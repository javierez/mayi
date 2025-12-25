"use server";

import { getCurrentUserAccountId } from "~/lib/dal";
import { getWebsiteConfigurationAction } from "~/app/actions/website-settings";

// Simplified: Only what's actually used in description generation
export interface AccountContext {
  agencyName?: string;
}

/**
 * Fetches account context for personalizing property descriptions
 * Simplified to only fetch agency name - the only thing we actually use
 */
export async function fetchAccountContext(): Promise<AccountContext | null> {
  try {
    const accountId = await getCurrentUserAccountId();
    if (!accountId) return null;

    const configResult = await getWebsiteConfigurationAction(BigInt(accountId));
    if (!configResult.success || !configResult.data) return null;

    const config = configResult.data;
    const agencyName =
      config.accountName ?? config.footerProps?.companyName ?? undefined;

    if (!agencyName) return null;

    return { agencyName };
  } catch (error) {
    console.error("Error fetching account context:", error);
    return null;
  }
}

/**
 * Formats account context for AI prompt
 * Simple: just the agency name with brief instructions
 */
export async function formatAccountContextForPrompt(
  context: AccountContext,
): Promise<string> {
  if (!context.agencyName) return "";

  return `AGENCIA: ${context.agencyName}
- Puedes mencionar el nombre de la agencia de forma natural si encaja
- No fuerces la mención si no fluye naturalmente
- NUNCA incluyas teléfonos ni emails (prohibido por los portales)`;
}
