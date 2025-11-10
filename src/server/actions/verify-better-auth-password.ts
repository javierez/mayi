"use server";

import { verifyPassword } from "better-auth/crypto";
import { db } from "~/server/db";
import { users, authAccounts } from "~/server/db/schema";
import { eq } from "drizzle-orm";

/**
 * Debug Better Auth password verification
 * Uses Better Auth's actual crypto functions
 */
export async function verifyBetterAuthPassword(
  email: string,
  password: string,
): Promise<{
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}> {
  try {
    console.log("🔍 [Better Auth Verify] Checking credentials for:", email);

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      console.log("❌ [Better Auth Verify] User not found:", email);
      return {
        success: false,
        message: "User not found",
      };
    }

    console.log("✅ [Better Auth Verify] User found:", {
      id: user.id,
      email: user.email,
      hasPassword: !!user.password,
      passwordHashPrefix: user.password?.substring(0, 40) + "...",
      passwordLength: user.password?.length,
    });

    if (!user.password) {
      console.log("❌ [Better Auth Verify] User has no password set");
      return {
        success: false,
        message: "User has no password",
      };
    }

    // Check if credential account exists
    const allAccounts = await db
      .select()
      .from(authAccounts)
      .where(eq(authAccounts.userId, user.id));

    const credentialAccount = allAccounts.find(acc => acc.providerId === "credential");

    console.log("🔍 [Better Auth Verify] Account info:", {
      totalAccounts: allAccounts.length,
      accounts: allAccounts.map(acc => ({ providerId: acc.providerId, accountId: acc.accountId })),
      hasCredentialAccount: !!credentialAccount,
    });

    // Verify password using Better Auth's verifyPassword
    console.log("🔑 [Better Auth Verify] Verifying password with Better Auth crypto...");
    const passwordMatches = await verifyPassword({
      password,
      hash: user.password,
    });

    console.log("🔑 [Better Auth Verify] Password match result:", passwordMatches);

    if (passwordMatches) {
      return {
        success: true,
        message: "Password matches with Better Auth!",
        details: {
          userId: user.id,
          email: user.email,
          hasCredentialAccount: !!credentialAccount,
        },
      };
    } else {
      return {
        success: false,
        message: "Password does not match",
        details: {
          hashFormat: user.password.substring(0, 20) + "...",
          hashLength: user.password.length,
          hasCredentialAccount: !!credentialAccount,
        },
      };
    }
  } catch (error) {
    console.error("❌ [Better Auth Verify] Error:", error);
    return {
      success: false,
      message: "Error checking password",
      details: { error: String(error) },
    };
  }
}
