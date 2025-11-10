"use server";

import bcrypt from "bcryptjs";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";

/**
 * Debug authentication - check if credentials match
 * This is for debugging only
 */
export async function debugCheckPassword(
  email: string,
  password: string,
): Promise<{
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}> {
  try {
    console.log("🔍 [Debug Auth] Checking credentials for:", email);

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      console.log("❌ [Debug Auth] User not found:", email);
      return {
        success: false,
        message: "User not found",
      };
    }

    console.log("✅ [Debug Auth] User found:", {
      id: user.id,
      email: user.email,
      hasPassword: !!user.password,
      passwordHashPrefix: user.password?.substring(0, 20) + "...",
    });

    if (!user.password) {
      console.log("❌ [Debug Auth] User has no password set");
      return {
        success: false,
        message: "User has no password",
      };
    }

    // Check password
    console.log("🔑 [Debug Auth] Comparing password...");
    const passwordMatches = await bcrypt.compare(password, user.password);

    console.log("🔑 [Debug Auth] Password match result:", passwordMatches);

    if (passwordMatches) {
      return {
        success: true,
        message: "Password matches!",
        details: {
          userId: user.id,
          email: user.email,
        },
      };
    } else {
      // Also try hashing the provided password to compare hashes
      const testHash = await bcrypt.hash(password, 10);
      console.log("🔑 [Debug Auth] Test hash of provided password:", testHash.substring(0, 20) + "...");
      console.log("🔑 [Debug Auth] Stored hash:", user.password.substring(0, 20) + "...");

      return {
        success: false,
        message: "Password does not match",
      };
    }
  } catch (error) {
    console.error("❌ [Debug Auth] Error:", error);
    return {
      success: false,
      message: "Error checking password",
      details: { error: String(error) },
    };
  }
}
