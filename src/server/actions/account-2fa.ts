"use server";

import bcrypt from "bcryptjs";
import { db } from "~/server/db";
import { accountTwoFactorSettings, twoFactor, users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { generateSMSCode, sendSMSCode } from "~/server/services/twilio";

/**
 * Account-Level SMS-Based 2FA Server Actions
 *
 * SMS codes are sent to the account's phone number.
 * Codes expire after 5 minutes.
 */

interface TwoFactorSetupResult {
  success: boolean;
  error?: string;
  phoneNumber?: string;
}

interface TwoFactorVerifyResult {
  success: boolean;
  error?: string;
}

interface TwoFactorSendCodeResult {
  success: boolean;
  error?: string;
  expiresAt?: Date;
}

/**
 * Check if account has 2FA required (mandatory for all users)
 */
export async function isAccountTwoFactorRequired(
  accountId: bigint,
): Promise<boolean> {
  const [settings] = await db
    .select()
    .from(accountTwoFactorSettings)
    .where(eq(accountTwoFactorSettings.accountId, accountId))
    .limit(1);

  return settings?.isRequired ?? false;
}

/**
 * Check if user has completed 2FA setup
 */
export async function hasUserCompletedTwoFactorSetup(
  userId: string,
): Promise<boolean> {
  const [userTwoFactor] = await db
    .select()
    .from(twoFactor)
    .where(eq(twoFactor.userId, userId))
    .limit(1);

  return Boolean(userTwoFactor?.isEnabled);
}

/**
 * Setup 2FA for individual user
 * Just creates the record - SMS will be sent when user requests verification
 */
export async function setupUserTwoFactor(): Promise<TwoFactorSetupResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "No autenticado" };
    }

    const userId = session.user.id;
    const accountId = session.user.accountId;

    if (!accountId) {
      return { success: false, error: "Usuario no asociado a una cuenta" };
    }

    // Get user's phone number
    console.log("🔍 [2FA Setup] Querying user with ID:", userId);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    console.log("🔍 [2FA Setup] User data:", {
      userId,
      hasUser: !!user,
      phone: user?.phone,
      phoneType: typeof user?.phone,
      phoneValue: JSON.stringify(user?.phone),
      email: user?.email,
      name: user?.name,
    });

    if (!user?.phone) {
      return {
        success: false,
        error: "No tienes un número de teléfono configurado. Por favor, añade un teléfono en tu perfil de usuario.",
      };
    }

    // Check if user already has 2FA setup
    console.log("🔍 [2FA Setup] Checking if 2FA already exists for user:", userId);

    const [existing] = await db
      .select()
      .from(twoFactor)
      .where(eq(twoFactor.userId, userId))
      .limit(1);

    console.log("🔍 [2FA Setup] Existing 2FA:", {
      hasExisting: !!existing,
      existingId: existing?.id,
    });

    if (existing) {
      return {
        success: false,
        error: "2FA ya está configurado para este usuario",
      };
    }

    // Create 2FA record
    const newId = crypto.randomUUID();
    console.log("🔍 [2FA Setup] Creating new 2FA record:", {
      id: newId,
      userId,
      accountId: accountId.toString(),
    });

    await db.insert(twoFactor).values({
      id: newId,
      userId,
      accountId: BigInt(accountId),
      isEnabled: true,
    });

    console.log("✅ [2FA Setup] Successfully created 2FA record");

    return {
      success: true,
      phoneNumber: user.phone,
    };
  } catch (error) {
    console.error("❌ [2FA Setup] Error details:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return {
      success: false,
      error: `Error al configurar 2FA: ${errorMessage}`,
    };
  }
}

/**
 * Send SMS verification code to user's phone
 */
export async function sendTwoFactorCode(
  userId?: string,
): Promise<TwoFactorSendCodeResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Use userId param if provided (for login flow), otherwise use session
    const targetUserId = userId ?? session?.user?.id;

    if (!targetUserId) {
      return { success: false, error: "Usuario no encontrado" };
    }

    // Get user's 2FA record
    const [userTwoFactor] = await db
      .select()
      .from(twoFactor)
      .where(eq(twoFactor.userId, targetUserId))
      .limit(1);

    if (!userTwoFactor) {
      return { success: false, error: "2FA no configurado" };
    }

    // Get user's phone number
    console.log("📞 [Send SMS] Querying user with ID:", targetUserId);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    console.log("📞 [Send SMS] User data:", {
      userId: targetUserId,
      hasUser: !!user,
      phone: user?.phone,
      phoneType: typeof user?.phone,
      phoneValue: JSON.stringify(user?.phone),
      phoneLength: user?.phone?.length,
    });

    if (!user?.phone) {
      return {
        success: false,
        error: "No hay número de teléfono configurado para tu usuario",
      };
    }

    // Generate and hash code
    const code = generateSMSCode();
    const hashedCode = await bcrypt.hash(code, 10);

    console.log("📞 [Send SMS] Generated code:", code);
    console.log("📞 [Send SMS] Phone to send to:", user.phone);

    // Calculate expiration (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save hashed code to database
    console.log("📞 [Send SMS] Saving code to database for user:", targetUserId);

    await db
      .update(twoFactor)
      .set({
        lastCode: hashedCode,
        lastCodeSentAt: new Date(),
        lastCodeExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(twoFactor.userId, targetUserId));

    console.log("📞 [Send SMS] Code saved to database");

    // Send SMS
    console.log("📞 [Send SMS] Calling Twilio with phone:", user.phone);
    const smsResult = await sendSMSCode(user.phone, code);

    if (!smsResult.success) {
      return {
        success: false,
        error: smsResult.error ?? "Error al enviar el código SMS",
      };
    }

    return {
      success: true,
      expiresAt,
    };
  } catch (error) {
    console.error("❌ [Send SMS] Error details:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return {
      success: false,
      error: `Error al enviar el código: ${errorMessage}`
    };
  }
}

/**
 * Verify 2FA code during setup (uses session)
 */
export async function verifyUserTwoFactorSetup(
  code: string,
): Promise<TwoFactorVerifyResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "No autenticado" };
    }

    const userId = session.user.id;

    // Get user's 2FA record
    const [userTwoFactor] = await db
      .select()
      .from(twoFactor)
      .where(eq(twoFactor.userId, userId))
      .limit(1);

    if (!userTwoFactor) {
      return { success: false, error: "2FA no configurado" };
    }

    if (!userTwoFactor.lastCode || !userTwoFactor.lastCodeExpiresAt) {
      return {
        success: false,
        error: "No hay código pendiente. Solicita un nuevo código.",
      };
    }

    // Check if code is expired
    if (new Date() > userTwoFactor.lastCodeExpiresAt) {
      return {
        success: false,
        error: "El código ha expirado. Solicita un nuevo código.",
      };
    }

    // Verify the code
    const isValid = await bcrypt.compare(code, userTwoFactor.lastCode);

    if (!isValid) {
      return { success: false, error: "Código inválido" };
    }

    // Clear the used code
    await db
      .update(twoFactor)
      .set({
        lastCode: null,
        lastCodeSentAt: null,
        lastCodeExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(twoFactor.userId, userId));

    return { success: true };
  } catch (error) {
    console.error("❌ [Verify Setup] Error details:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return {
      success: false,
      error: `Error al verificar el código: ${errorMessage}`
    };
  }
}

/**
 * Verify 2FA code during sign-in (requires userId parameter)
 */
export async function verifyTwoFactorCode(
  userId: string,
  code: string,
): Promise<TwoFactorVerifyResult> {
  try {
    // Get user's 2FA secret
    const [userTwoFactor] = await db
      .select()
      .from(twoFactor)
      .where(eq(twoFactor.userId, userId))
      .limit(1);

    if (!userTwoFactor) {
      return { success: false, error: "2FA no configurado" };
    }

    if (!userTwoFactor.lastCode || !userTwoFactor.lastCodeExpiresAt) {
      return {
        success: false,
        error: "No hay código pendiente. Solicita un nuevo código.",
      };
    }

    // Check if code is expired
    if (new Date() > userTwoFactor.lastCodeExpiresAt) {
      return {
        success: false,
        error: "El código ha expirado. Solicita un nuevo código.",
      };
    }

    // Verify the code
    const isValid = await bcrypt.compare(code, userTwoFactor.lastCode);

    if (!isValid) {
      return { success: false, error: "Código inválido" };
    }

    // Clear the used code
    await db
      .update(twoFactor)
      .set({
        lastCode: null,
        lastCodeSentAt: null,
        lastCodeExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(twoFactor.userId, userId));

    return { success: true };
  } catch (error) {
    console.error("Error verifying 2FA code:", error);
    return { success: false, error: "Error al verificar el código" };
  }
}

/**
 * Disable 2FA for individual user
 */
export async function disableUserTwoFactor(): Promise<TwoFactorVerifyResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "No autenticado" };
    }

    const userId = session.user.id;

    await db.delete(twoFactor).where(eq(twoFactor.userId, userId));

    return { success: true };
  } catch (error) {
    console.error("Error disabling user 2FA:", error);
    return {
      success: false,
      error: "Error al desactivar 2FA para el usuario",
    };
  }
}

/**
 * Toggle whether 2FA is required for all users in the account (Admin only)
 * When enabled, automatically sets up 2FA for all users in the account
 */
export async function toggleAccountTwoFactorRequired(
  isRequired: boolean,
): Promise<TwoFactorVerifyResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "No autenticado" };
    }

    const userId = session.user.id;
    const accountId = session.user.accountId;

    if (!accountId) {
      return { success: false, error: "Usuario no asociado a una cuenta" };
    }

    // Check if account settings exist
    const [existingSettings] = await db
      .select()
      .from(accountTwoFactorSettings)
      .where(eq(accountTwoFactorSettings.accountId, BigInt(accountId)))
      .limit(1);

    if (existingSettings) {
      // Update existing settings
      await db
        .update(accountTwoFactorSettings)
        .set({
          isRequired,
          enabledBy: userId,
          enabledAt: isRequired ? new Date() : existingSettings.enabledAt,
          updatedAt: new Date(),
        })
        .where(eq(accountTwoFactorSettings.accountId, BigInt(accountId)));
    } else {
      // Create new settings
      await db.insert(accountTwoFactorSettings).values({
        accountId: BigInt(accountId),
        isRequired,
        enabledBy: userId,
        enabledAt: isRequired ? new Date() : null,
      });
    }

    // Get all users in this account
    const accountUsers = await db
      .select()
      .from(users)
      .where(eq(users.accountId, BigInt(accountId)));

    if (isRequired) {
      // Enabling 2FA requirement - activate 2FA for all users
      console.log("🔐 [Account 2FA] Enabling 2FA for all users in account:", accountId);
      console.log(`🔐 [Account 2FA] Found ${accountUsers.length} users to enable 2FA for`);

      let enabledCount = 0;
      let skippedCount = 0;

      for (const user of accountUsers) {
        // Check if user already has 2FA
        const [existing] = await db
          .select()
          .from(twoFactor)
          .where(eq(twoFactor.userId, user.id))
          .limit(1);

        if (existing) {
          console.log(`⏭️  [Account 2FA] User ${user.email} already has 2FA, skipping`);
          skippedCount++;
          continue;
        }

        // Check if user has a phone number
        if (!user.phone) {
          console.log(`⚠️  [Account 2FA] User ${user.email} has no phone number, skipping`);
          skippedCount++;
          continue;
        }

        // Create 2FA record for user
        const newId = crypto.randomUUID();
        await db.insert(twoFactor).values({
          id: newId,
          userId: user.id,
          accountId: BigInt(accountId),
          isEnabled: true,
        });

        console.log(`✅ [Account 2FA] Enabled 2FA for user ${user.email}`);
        enabledCount++;
      }

      console.log(`🔐 [Account 2FA] Summary: ${enabledCount} enabled, ${skippedCount} skipped`);
    } else {
      // Disabling 2FA requirement - remove 2FA for all users in the account
      console.log("🔓 [Account 2FA] Disabling 2FA for all users in account:", accountId);
      console.log(`🔓 [Account 2FA] Found ${accountUsers.length} users to disable 2FA for`);

      let disabledCount = 0;

      for (const user of accountUsers) {
        // Check if user has 2FA before deleting
        const [existing] = await db
          .select()
          .from(twoFactor)
          .where(eq(twoFactor.userId, user.id))
          .limit(1);

        if (existing) {
          // Delete 2FA record
          await db
            .delete(twoFactor)
            .where(eq(twoFactor.userId, user.id));

          console.log(`✅ [Account 2FA] Disabled 2FA for user ${user.email}`);
          disabledCount++;
        }
      }

      console.log(`🔓 [Account 2FA] Summary: ${disabledCount} disabled`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error toggling account 2FA required:", error);
    return {
      success: false,
      error: "Error al actualizar configuración de 2FA",
    };
  }
}

/**
 * Get account 2FA settings
 */
export async function getAccountTwoFactorSettings() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.accountId) {
      return null;
    }

    const [settings] = await db
      .select()
      .from(accountTwoFactorSettings)
      .where(
        eq(accountTwoFactorSettings.accountId, BigInt(session.user.accountId)),
      )
      .limit(1);

    return settings ?? null;
  } catch (error) {
    console.error("Error getting account 2FA settings:", error);
    return null;
  }
}
