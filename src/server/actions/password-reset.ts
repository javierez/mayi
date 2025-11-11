"use server";

import bcrypt from "bcryptjs";
import { db } from "~/server/db";
import { users, passwordResetTokens, authAccounts } from "~/server/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { generateSMSCode, sendSMSCode } from "~/server/services/twilio";
import { headers } from "next/headers";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "crypto";

/**
 * SMS-Based Password Reset Server Actions
 *
 * Uses a separate password_reset_tokens table for clean separation of concerns
 * Codes expire after 5 minutes for security
 */

interface PasswordResetRequestResult {
  success: boolean;
  error?: string;
  expiresAt?: Date;
}

interface PasswordResetVerifyResult {
  success: boolean;
  error?: string;
}

/**
 * Request password reset - sends 6-digit code via SMS
 * @param phoneNumber - User's phone number
 */
export async function requestPasswordResetSMS(
  phoneNumber: string,
): Promise<PasswordResetRequestResult> {
  try {
    console.log("🔐 [Password Reset] Request for phone:", phoneNumber);

    if (!phoneNumber) {
      return { success: false, error: "El número de teléfono es requerido" };
    }

    console.log("🔍 [Password Reset] Looking up user by phone:", phoneNumber);

    // Search for user by phone number (should be stored without prefix)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.phone, phoneNumber))
      .limit(1);

    if (!user) {
      console.log("⚠️ [Password Reset] User not found for phone:", phoneNumber);
      return {
        success: false,
        error: "No encontramos una cuenta con este número de teléfono",
      };
    }

    console.log("✅ [Password Reset] User found:", user.id);

    // Generate 6-digit code
    const code = generateSMSCode();
    console.log("🔑 [Password Reset] Generated code for user:", user.id);

    // Hash the code before storing
    const hashedCode = await bcrypt.hash(code, 10);

    // Set expiration to 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Get request metadata for security audit
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip");
    const userAgent = headersList.get("user-agent");

    // Store hashed code in password_reset_tokens table (store the phone as-is from user record)
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      resetCode: hashedCode,
      phoneNumber: user.phone ?? phoneNumber,
      expiresAt,
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined,
    });

    // Send SMS - need to add prefix for international format
    // Assume Spanish number if no prefix
    const smsPhoneNumber = user.phone?.startsWith("+") ? user.phone : `+34${user.phone}`;
    const smsResult = await sendSMSCode(smsPhoneNumber, code);

    if (!smsResult.success) {
      console.error("❌ [Password Reset] Failed to send SMS:", smsResult.error);
      return {
        success: false,
        error: smsResult.error ?? "Error al enviar el SMS",
      };
    }

    console.log("✅ [Password Reset] SMS sent successfully to:", phoneNumber);

    return {
      success: true,
      expiresAt,
    };
  } catch (error) {
    console.error("❌ [Password Reset] Error:", error);
    return {
      success: false,
      error: "Error al procesar la solicitud de restablecimiento",
    };
  }
}

/**
 * Verify reset code and reset password
 * @param phoneNumber - User's phone number
 * @param code - 6-digit verification code
 * @param newPassword - New password to set
 */
export async function verifyResetCodeAndChangePassword(
  phoneNumber: string,
  code: string,
  newPassword: string,
): Promise<PasswordResetVerifyResult> {
  try {
    console.log("🔐 [Password Reset] Verifying code for phone:", phoneNumber);

    if (!phoneNumber || !code || !newPassword) {
      return { success: false, error: "Todos los campos son requeridos" };
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return { success: false, error: "El código debe tener 6 dígitos" };
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return {
        success: false,
        error: "La contraseña debe tener al menos 8 caracteres",
      };
    }
    if (!/(?=.*[a-z])/.test(newPassword)) {
      return {
        success: false,
        error: "La contraseña debe contener al menos una letra minúscula",
      };
    }
    if (!/(?=.*[A-Z])/.test(newPassword)) {
      return {
        success: false,
        error: "La contraseña debe contener al menos una letra mayúscula",
      };
    }
    if (!/(?=.*\d)/.test(newPassword)) {
      return {
        success: false,
        error: "La contraseña debe contener al menos un número",
      };
    }

    // Find user by phone (stored without prefix)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.phone, phoneNumber))
      .limit(1);

    if (!user) {
      console.log("❌ [Password Reset] User not found for phone:", phoneNumber);
      return {
        success: false,
        error: "No encontramos una cuenta con este número de teléfono",
      };
    }

    // Find valid reset token for this user
    const [token] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          eq(passwordResetTokens.phoneNumber, phoneNumber),
          gt(passwordResetTokens.expiresAt, new Date()), // Not expired
          isNull(passwordResetTokens.usedAt), // Not already used
        ),
      )
      .orderBy(passwordResetTokens.createdAt)
      .limit(1);

    if (!token) {
      console.log(
        "❌ [Password Reset] No valid reset token found for user:",
        user.id,
      );
      return {
        success: false,
        error: "Código inválido o expirado. Solicita uno nuevo.",
      };
    }

    // Verify code matches
    const codeMatches = await bcrypt.compare(code, token.resetCode);

    if (!codeMatches) {
      console.log("❌ [Password Reset] Code mismatch for user:", user.id);
      return { success: false, error: "Código incorrecto" };
    }

    console.log("✅ [Password Reset] Code verified for user:", user.id);
    console.log("🔑 [Password Reset] Old password hash:", user.password?.substring(0, 20) + "...");
    console.log("🔑 [Password Reset] New password length:", newPassword.length);

    // Hash password using Better Auth's hashPassword function
    // This ensures compatibility with Better Auth's authentication
    console.log("🔐 [Password Reset] Hashing password with Better Auth crypto...");
    const hashedPassword = await hashPassword(newPassword);
    console.log("🔑 [Password Reset] Password hashed with Better Auth:", hashedPassword.substring(0, 20) + "...");

    // Ensure user has a credential account for email/password login
    // Better Auth requires this for email/password authentication
    console.log("🔍 [Password Reset] Checking for credential account...");
    const [existingAccount] = await db
      .select()
      .from(authAccounts)
      .where(
        and(
          eq(authAccounts.userId, user.id),
          eq(authAccounts.providerId, "credential")
        )
      )
      .limit(1);

    if (!existingAccount) {
      console.log("⚠️ [Password Reset] No credential account found, creating one...");
      await db.insert(authAccounts).values({
        id: randomUUID(),
        userId: user.id,
        accountId: user.email, // Use email as accountId for credential provider
        providerId: "credential",
        accessToken: null,
        refreshToken: null,
        idToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        password: hashedPassword, // Store password in account table (Better Auth requirement!)
      });
      console.log("✅ [Password Reset] Credential account created with password");
    } else {
      console.log("✅ [Password Reset] Credential account already exists");

      // Update the credential account with new password and correct accountId
      console.log("🔑 [Password Reset] Updating credential account password...");
      await db
        .update(authAccounts)
        .set({
          accountId: user.email, // Ensure accountId is email (not user ID)
          password: hashedPassword, // Store password in account table (Better Auth requirement!)
        })
        .where(
          and(
            eq(authAccounts.userId, user.id),
            eq(authAccounts.providerId, "credential")
          )
        );

      console.log("✅ [Password Reset] Credential account updated with new password");
    }

    // Verify the password was stored correctly in the account table
    const [updatedAccount] = await db
      .select({ password: authAccounts.password })
      .from(authAccounts)
      .where(
        and(
          eq(authAccounts.userId, user.id),
          eq(authAccounts.providerId, "credential")
        )
      )
      .limit(1);

    console.log("🔍 [Password Reset] Verification - Account password hash:", updatedAccount?.password?.substring(0, 20) + "...");
    console.log("🔍 [Password Reset] Hash saved correctly in account table:", updatedAccount?.password === hashedPassword);

    // CRITICAL FIX: Also update users.password
    // Better Auth checks users.password during email/password authentication
    console.log("🔑 [Password Reset] Updating users.password for Better Auth compatibility...");
    await db
      .update(users)
      .set({
        password: hashedPassword,
      })
      .where(eq(users.id, user.id));

    console.log("✅ [Password Reset] Updated users.password for Better Auth email/password authentication");

    // Mark token as used (prevents reuse)
    await db
      .update(passwordResetTokens)
      .set({
        usedAt: new Date(),
      })
      .where(eq(passwordResetTokens.id, token.id));

    console.log(
      "✅ [Password Reset] Password updated successfully for user:",
      user.id,
      "email:",
      user.email,
    );

    return { success: true };
  } catch (error) {
    console.error("❌ [Password Reset] Error during verification:", error);
    return {
      success: false,
      error: "Error al verificar el código",
    };
  }
}

/**
 * Resend reset code - generates and sends a new code
 * @param phoneNumber - User's phone number
 */
export async function resendPasswordResetCode(
  phoneNumber: string,
): Promise<PasswordResetRequestResult> {
  // Same as initial request - will create a new token
  return requestPasswordResetSMS(phoneNumber);
}
