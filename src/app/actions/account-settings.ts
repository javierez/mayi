"use server";

import { db } from "~/server/db";
import { accounts, users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  accountConfigurationSchema,
  type AccountConfigurationInput,
} from "~/types/account-settings";

/**
 * Get current user's account ID from their user ID
 */
export async function getCurrentUserAccountId(
  userId: string,
): Promise<bigint | null> {
  try {
    const [user] = await db
      .select({ accountId: users.accountId })
      .from(users)
      .where(eq(users.id, userId));

    return user?.accountId ?? null;
  } catch (error) {
    console.error("Error getting user account ID:", error);
    return null;
  }
}

/**
 * Get account details for display
 */
export async function getAccountDetailsAction(accountId: bigint): Promise<{
  success: boolean;
  data?: {
    accountId: string;
    name: string;
    shortName: string | null;
    legalName: string | null;
    logo: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    taxId: string | null;
    collegiateNumber: string | null;
    registryDetails: string | null;
    legalEmail: string | null;
    jurisdiction: string | null;
    privacyEmail: string | null;
    dpoEmail: string | null;
    portalSettings: Record<string, unknown>;
    paymentSettings: Record<string, unknown>;
    preferences: Record<string, unknown>;
    terms: Record<string, unknown>;
    onboardingData: Record<string, unknown>;
    plan: string;
    subscriptionType: string | null;
    subscriptionStatus: string;
    subscriptionStartDate: Date | null;
    subscriptionEndDate: Date | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
  };
  error?: string;
}> {
  try {
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.accountId, accountId));

    if (!account) {
      return { success: false, error: "Cuenta no encontrada" };
    }

    // Parse JSON fields safely
    const portalSettings =
      typeof account.portalSettings === "string"
        ? (JSON.parse(account.portalSettings) as Record<string, unknown>)
        : ((account.portalSettings ?? {}) as Record<string, unknown>);

    const paymentSettings =
      typeof account.paymentSettings === "string"
        ? (JSON.parse(account.paymentSettings) as Record<string, unknown>)
        : ((account.paymentSettings ?? {}) as Record<string, unknown>);

    const preferences =
      typeof account.preferences === "string"
        ? (JSON.parse(account.preferences) as Record<string, unknown>)
        : ((account.preferences ?? {}) as Record<string, unknown>);

    const terms =
      typeof account.terms === "string"
        ? (JSON.parse(account.terms) as Record<string, unknown>)
        : ((account.terms ?? {}) as Record<string, unknown>);

    const onboardingData =
      typeof account.onboardingData === "string"
        ? (JSON.parse(account.onboardingData) as Record<string, unknown>)
        : ((account.onboardingData ?? {}) as Record<string, unknown>);

    const accountData = {
      accountId: account.accountId.toString(),
      name: account.name,
      shortName: account.shortName,
      legalName: account.legalName,
      logo: account.logo,
      address: account.address,
      phone: account.phone,
      email: account.email,
      website: account.website,
      taxId: account.taxId,
      collegiateNumber: account.collegiateNumber,
      registryDetails: account.registryDetails,
      legalEmail: account.legalEmail,
      jurisdiction: account.jurisdiction,
      privacyEmail: account.privacyEmail,
      dpoEmail: account.dpoEmail,
      portalSettings,
      paymentSettings,
      preferences,
      terms,
      onboardingData,
      plan: account.plan ?? "basic",
      subscriptionType: account.subscriptionType,
      subscriptionStatus: account.subscriptionStatus ?? "active",
      subscriptionStartDate: account.subscriptionStartDate,
      subscriptionEndDate: account.subscriptionEndDate,
      status: account.status ?? "active",
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      isActive: account.isActive ?? true,
    };

    return { success: true, data: accountData };
  } catch (error) {
    console.error("❌ Error getting account details:", error);
    return {
      success: false,
      error: "Error al obtener los detalles de la cuenta",
    };
  }
}

/**
 * Update account configuration
 */
export async function updateAccountConfigurationAction(
  accountId: bigint,
  data: AccountConfigurationInput,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Validate the data
    const validatedData = accountConfigurationSchema.parse(data);

    // Prepare the update data
    const updateData: Partial<typeof accounts.$inferInsert> = {
      name: validatedData.name,
      shortName: validatedData.shortName ?? null,
      legalName: validatedData.legalName ?? null,
      logo: validatedData.logo ?? null,
      address: validatedData.address ?? null,
      phone: validatedData.phone ?? null,
      email: validatedData.email ?? null,
      website: validatedData.website ?? null,
      taxId: validatedData.taxId ?? null,
      collegiateNumber: validatedData.collegiateNumber ?? null,
      registryDetails: validatedData.registryDetails ?? null,
      legalEmail: validatedData.legalEmail ?? null,
      jurisdiction: validatedData.jurisdiction ?? null,
      privacyEmail: validatedData.privacyEmail ?? null,
      dpoEmail: validatedData.dpoEmail ?? null,
      preferences: validatedData.preferences ?? {},
      terms: validatedData.terms ?? {},
      updatedAt: new Date(),
    };

    // Update the account
    await db
      .update(accounts)
      .set(updateData)
      .where(eq(accounts.accountId, accountId));

    return { success: true };
  } catch (error) {
    console.error("❌ Error updating account configuration:", error);

    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`,
      );
      return {
        success: false,
        error: `Errores de validación: ${fieldErrors.join(", ")}`,
      };
    }

    return {
      success: false,
      error: "Error al actualizar la configuración de la cuenta",
    };
  }
}
