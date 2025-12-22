"use server";

import { db } from "~/server/db";
import { accounts, users } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  accountConfigurationSchema,
  type AccountConfigurationInput,
} from "~/types/account-settings";
import { getDynamicBucketNameForAccount } from "~/lib/s3-bucket";

// S3 client for signature upload
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

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
    accountType: string | null;
    defaultSigningAgentId: string | null;
    signatureUrl: string | null;
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
      accountType: account.accountType,
      defaultSigningAgentId: account.defaultSigningAgentId,
      signatureUrl: account.signatureUrl,
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
      accountType: validatedData.accountType ?? "company",
      defaultSigningAgentId: validatedData.defaultSigningAgentId ?? null,
      signatureUrl: validatedData.signatureUrl ?? null,
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

/**
 * Get agents for the current account (for agent selector dropdown)
 */
export async function getAgentsForAccountAction(accountId: bigint): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    firstName: string | null;
    lastName: string | null;
  }>;
  error?: string;
}> {
  try {
    const agents = await db
      .select({
        id: users.id,
        name: users.name,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(and(eq(users.accountId, accountId), eq(users.isActive, true)))
      .orderBy(users.name);

    return { success: true, data: agents };
  } catch (error) {
    console.error("❌ Error getting agents for account:", error);
    return {
      success: false,
      error: "Error al obtener los agentes de la cuenta",
    };
  }
}

/**
 * Update signature settings (accountType, defaultSigningAgentId)
 * This is separate from main account config to avoid full form validation
 */
export async function updateSignatureSettingsAction(
  accountId: bigint,
  settings: {
    accountType?: "company" | "person";
    defaultSigningAgentId?: string | null;
  },
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const updateData: Partial<typeof accounts.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (settings.accountType !== undefined) {
      updateData.accountType = settings.accountType;
    }
    if (settings.defaultSigningAgentId !== undefined) {
      updateData.defaultSigningAgentId = settings.defaultSigningAgentId ?? null;
    }

    await db
      .update(accounts)
      .set(updateData)
      .where(eq(accounts.accountId, accountId));

    return { success: true };
  } catch (error) {
    console.error("❌ Error updating signature settings:", error);
    return {
      success: false,
      error: "Error al actualizar la configuración de firma",
    };
  }
}

/**
 * Upload signature image to S3 for an account
 * Saves to: {bucket}/legal/signature.png
 */
export async function uploadAccountSignatureAction(
  accountId: bigint,
  signatureDataUrl: string,
): Promise<{
  success: boolean;
  signatureUrl?: string;
  error?: string;
}> {
  try {
    if (!signatureDataUrl.startsWith("data:image/")) {
      return {
        success: false,
        error: "Formato de firma inválido",
      };
    }

    // Get bucket name for this account
    const bucketName = await getDynamicBucketNameForAccount(accountId);

    // Convert data URL to buffer
    const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Determine content type
    const contentType = /^data:(image\/\w+);base64,/.exec(signatureDataUrl)?.[1] ?? "image/png";

    // Create the S3 key: legal/signature.png
    const signatureKey = "legal/signature.png";

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: signatureKey,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    // Build the public S3 URL
    const signatureUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${signatureKey}`;

    // Update the account with the signature URL
    await db
      .update(accounts)
      .set({
        signatureUrl,
        updatedAt: new Date(),
      })
      .where(eq(accounts.accountId, accountId));

    console.log(`✅ Signature uploaded for account ${accountId}: ${signatureUrl}`);

    return { success: true, signatureUrl };
  } catch (error) {
    console.error("❌ Error uploading account signature:", error);
    return {
      success: false,
      error: "Error al subir la firma",
    };
  }
}
