import { google, type gmail_v1 } from "googleapis";
import { db } from "~/server/db";
import { userIntegrations } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

// Types for Gmail integration
export interface GmailIntegration {
  id: string;
  userId: string;
  provider: string;
  accessToken: string;
  refreshToken: string | null;
  expiryDate: Date | null;
  isActive: boolean;
}

// OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// Gmail API scopes
const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
];

// Get the base URL for redirect URI
function getRedirectUri(origin?: string): string {
  if (origin) {
    return `${origin}/api/google/gmail/callback`;
  }

  if (process.env.NODE_ENV === "production") {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vesta-crm.com";
    return `${appUrl}/api/google/gmail/callback`;
  }

  return "http://localhost:3000/api/google/gmail/callback";
}

// Default redirect URI for server-side operations
const REDIRECT_URI = getRedirectUri();

/**
 * Get OAuth2 client instance for Gmail
 */
export function getOAuth2Client(origin?: string) {
  const redirectUri = origin ? getRedirectUri(origin) : REDIRECT_URI;
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

/**
 * Generate OAuth consent URL for Gmail
 */
export function generateGmailAuthUrl(state: string, origin?: string): string {
  const oauth2Client = getOAuth2Client(origin);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GMAIL_SCOPES,
    state: state,
    prompt: "consent", // Force consent to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string, origin?: string) {
  const oauth2Client = getOAuth2Client(origin);
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Get user's Gmail integration
 */
export async function getUserGmailIntegration(
  userId: string
): Promise<GmailIntegration | null> {
  const integration = await db
    .select()
    .from(userIntegrations)
    .where(
      and(
        eq(userIntegrations.userId, userId),
        eq(userIntegrations.provider, "gmail"),
        eq(userIntegrations.isActive, true)
      )
    )
    .limit(1);

  if (!integration.length) return null;

  const row = integration[0]!;
  return {
    id: row.integrationId.toString(),
    userId: row.userId,
    provider: row.provider,
    accessToken: row.accessToken,
    refreshToken: row.refreshToken,
    expiryDate: row.expiryDate,
    isActive: row.isActive ?? true,
  };
}

/**
 * Store or update Gmail integration
 */
export async function storeGmailIntegration(
  userId: string,
  tokens: {
    access_token?: string | null;
    refresh_token?: string | null;
    expiry_date?: number | null;
  }
): Promise<void> {
  const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

  const integrationData = {
    userId,
    provider: "gmail",
    accessToken: tokens.access_token ?? "",
    refreshToken: tokens.refresh_token ?? null,
    expiryDate,
    isActive: true,
  };

  // Check if integration already exists
  const existing = await getUserGmailIntegration(userId);

  if (existing) {
    // Update existing integration - preserve refresh token if not provided
    await db
      .update(userIntegrations)
      .set({
        accessToken: integrationData.accessToken,
        refreshToken: tokens.refresh_token ?? existing.refreshToken,
        expiryDate: integrationData.expiryDate,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userIntegrations.userId, userId),
          eq(userIntegrations.provider, "gmail")
        )
      );
  } else {
    // Create new integration
    await db.insert(userIntegrations).values(integrationData);
  }
}

/**
 * Disconnect user's Gmail integration
 */
export async function disconnectGmailIntegration(
  userId: string
): Promise<boolean> {
  try {
    await db
      .update(userIntegrations)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userIntegrations.userId, userId),
          eq(userIntegrations.provider, "gmail")
        )
      );

    return true;
  } catch (error) {
    console.error("Failed to disconnect Gmail integration:", error);
    return false;
  }
}

/**
 * Get authenticated Gmail API client
 */
export async function getGmailClient(
  userId: string
): Promise<gmail_v1.Gmail | null> {
  const integration = await getUserGmailIntegration(userId);
  if (!integration) return null;

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
    expiry_date: integration.expiryDate?.getTime(),
  });

  // Handle token refresh automatically
  oauth2Client.on("tokens", (tokens) => {
    if (tokens.access_token) {
      void storeGmailIntegration(userId, tokens);
    }
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

/**
 * Get user's email address from Gmail profile
 */
export async function getGmailUserEmail(userId: string): Promise<string | null> {
  const gmail = await getGmailClient(userId);
  if (!gmail) return null;

  try {
    const profile = await gmail.users.getProfile({ userId: "me" });
    return profile.data.emailAddress ?? null;
  } catch (error) {
    console.error("Failed to get Gmail user email:", error);
    return null;
  }
}
