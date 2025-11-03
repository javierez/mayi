"use server";

import { revalidatePath } from "next/cache";
import { uploadImageToS3 } from "~/lib/s3";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  getAccountSettings,
  updateAccountSettings,
  updateAccountLogo,
  updateAccountPortalSettings,
  updateAccountPaymentSettings,
  getUserSettings,
  updateUserSettings,
} from "~/server/queries/settings";
import { getAccountById } from "~/server/queries/accounts";
import { getCurrentUserAccountId } from "~/lib/dal";
import type {
  AccountInput,
  UserInput,
  AccountSettingsResponse,
  UserSettingsResponse,
  PortalInput,
  PaymentInput,
} from "~/types/settings";
import {
  accountSettingsSchema,
  userSettingsSchema,
  portalSettingsSchema,
  paymentSettingsSchema,
} from "~/types/settings";
import type {
  PortalConfigurationInput,
  PortalConfigurationResponse,
} from "~/types/portal-settings";
import { portalConfigurationSchema } from "~/types/portal-settings";
import { getDynamicBucketNameForAccount } from "~/lib/s3-bucket";

// Account Logo Upload
export async function uploadAccountLogo(
  formData: FormData,
): Promise<AccountSettingsResponse> {
  try {
    const file = formData.get("logo") as File;

    if (!file) {
      return {
        success: false,
        error: "Archivo requerido",
      };
    }

    // Get authenticated user's account ID (secure)
    const accountId = await getCurrentUserAccountId();

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        error: "El archivo debe ser una imagen",
      };
    }

    // Get account details to determine dynamic folder name
    const account = await getAccountById(accountId);
    if (!account) {
      return {
        success: false,
        error: "Cuenta no encontrada",
      };
    }

    // Generate dynamic bucket name based on account name
    const bucketName = await getDynamicBucketNameForAccount(accountId);

    // Upload to S3 in account-specific folder
    const { imageUrl } = await uploadImageToS3(
      file,
      bucketName,
      1, // Order doesn't matter for logos
    );

    // Update account with new logo URL
    const updatedAccount = await updateAccountLogo(BigInt(accountId), imageUrl);

    // Revalidate the settings page
    revalidatePath("/ajustes");

    return {
      success: true,
      data: updatedAccount,
    };
  } catch (error) {
    console.error("Error uploading account logo:", error);
    return {
      success: false,
      error: "Error al subir el logo",
    };
  }
}

// Account Settings Update
export async function updateAccountSettingsAction(
  accountId: bigint,
  data: AccountInput,
): Promise<AccountSettingsResponse> {
  try {
    // Validate input data
    const validatedData = accountSettingsSchema.parse(data);

    // Update account settings
    const updatedAccount = await updateAccountSettings(
      accountId,
      validatedData,
    );

    // Revalidate the settings page
    revalidatePath("/ajustes");

    return {
      success: true,
      data: updatedAccount,
    };
  } catch (error) {
    console.error("Error updating account settings:", error);
    return {
      success: false,
      error: "Error al actualizar la configuración de la cuenta",
    };
  }
}

// Portal Settings Update
export async function updatePortalSettingsAction(
  accountId: bigint,
  data: PortalInput,
): Promise<AccountSettingsResponse> {
  try {
    // Validate input data
    const validatedData = portalSettingsSchema.parse(data);

    // Update portal settings
    const updatedAccount = await updateAccountPortalSettings(
      accountId,
      validatedData,
    );

    // Revalidate the settings page
    revalidatePath("/ajustes");

    return {
      success: true,
      data: updatedAccount,
    };
  } catch (error) {
    console.error("Error updating portal settings:", error);
    return {
      success: false,
      error: "Error al actualizar la configuración de portales",
    };
  }
}

// Payment Settings Update
export async function updatePaymentSettingsAction(
  accountId: bigint,
  data: PaymentInput,
): Promise<AccountSettingsResponse> {
  try {
    // Validate input data
    const validatedData = paymentSettingsSchema.parse(data);

    // Update payment settings
    const updatedAccount = await updateAccountPaymentSettings(
      accountId,
      validatedData,
    );

    // Revalidate the settings page
    revalidatePath("/ajustes");

    return {
      success: true,
      data: updatedAccount,
    };
  } catch (error) {
    console.error("Error updating payment settings:", error);
    return {
      success: false,
      error: "Error al actualizar la configuración de pagos",
    };
  }
}

// User Settings Update
export async function updateUserSettingsAction(
  userId: string,
  data: UserInput,
): Promise<UserSettingsResponse> {
  try {
    // Validate input data
    const validatedData = userSettingsSchema.parse(data);

    // Update user settings
    const updatedUser = await updateUserSettings(userId, validatedData);

    // Revalidate the settings page
    revalidatePath("/ajustes");

    return {
      success: true,
      data: updatedUser,
    };
  } catch (error) {
    console.error("Error updating user settings:", error);
    return {
      success: false,
      error: "Error al actualizar la configuración del usuario",
    };
  }
}

// Fetch Account Settings
export async function getAccountSettingsAction(
  accountId: bigint,
): Promise<AccountSettingsResponse> {
  try {
    const accountSettings = await getAccountSettings(accountId);

    if (!accountSettings) {
      return {
        success: false,
        error: "Configuración de cuenta no encontrada",
      };
    }

    return {
      success: true,
      data: accountSettings,
    };
  } catch (error) {
    console.error("Error fetching account settings:", error);
    return {
      success: false,
      error: "Error al obtener la configuración de la cuenta",
    };
  }
}

// Fetch User Settings
export async function getUserSettingsAction(
  userId: string,
): Promise<UserSettingsResponse> {
  try {
    const userSettings = await getUserSettings(userId);

    if (!userSettings) {
      return {
        success: false,
        error: "Configuración de usuario no encontrada",
      };
    }

    return {
      success: true,
      data: userSettings,
    };
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return {
      success: false,
      error: "Error al obtener la configuración del usuario",
    };
  }
}

// Helper function to get account ID for current user (server action wrapper for DAL)
export async function getCurrentUserAccountIdAction(): Promise<number | null> {
  try {
    const accountId = await getCurrentUserAccountId();
    return accountId;
  } catch (error) {
    console.error("Error getting account ID for user:", error);
    return null;
  }
}

// Portal Configuration Actions (New portal settings structure)
export async function getPortalConfigurationAction(
  accountId: bigint,
): Promise<PortalConfigurationResponse> {
  try {
    const accountSettings = await getAccountSettings(accountId);

    if (!accountSettings) {
      return {
        success: false,
        error: "Configuración de cuenta no encontrada",
      };
    }

    // Extract portal configuration from portal_settings
    const portalSettings = accountSettings.portalSettings;

    const fotocasaSettings = portalSettings.fotocasa as
      | Record<string, unknown>
      | undefined;
    const idealistaSettings = portalSettings.idealista as
      | Record<string, unknown>
      | undefined;
    const generalSettings = portalSettings.general as
      | Record<string, unknown>
      | undefined;

    const portalConfiguration = {
      fotocasa: {
        enabled: (fotocasaSettings?.enabled as boolean) ?? false,
        apiKey: (fotocasaSettings?.apiKey as string | undefined) ?? "",
      },
      idealista: {
        enabled: (idealistaSettings?.enabled as boolean) ?? false,
        apiKey: (idealistaSettings?.apiKey as string | undefined) ?? "",
      },
      general: {
        watermarkEnabled:
          (generalSettings?.watermarkEnabled as boolean) ?? false,
        watermarkPosition: generalSettings?.watermarkPosition as
          | "top-left"
          | "top-right"
          | "bottom-left"
          | "bottom-right"
          | "center"
          | undefined,
      },
    };

    return {
      success: true,
      data: portalConfiguration,
    };
  } catch (error) {
    console.error("Error fetching portal configuration:", error);
    return {
      success: false,
      error: "Error al obtener la configuración de portales",
    };
  }
}

export async function updatePortalConfigurationAction(
  accountId: bigint,
  data: PortalConfigurationInput,
): Promise<PortalConfigurationResponse> {
  try {
    // Validate input data
    const validatedData = portalConfigurationSchema.parse(data);

    // Get current account settings to merge with new portal configuration
    const currentAccount = await getAccountSettings(accountId);
    if (!currentAccount) {
      return {
        success: false,
        error: "Cuenta no encontrada",
      };
    }

    // Merge existing portal settings with new configuration
    const currentPortalSettings = currentAccount.portalSettings ?? {};
    const updatedPortalSettings = {
      ...currentPortalSettings,
      fotocasa: validatedData.fotocasa ?? currentPortalSettings.fotocasa,
      idealista: validatedData.idealista ?? currentPortalSettings.idealista,
      general: validatedData.general ?? currentPortalSettings.general,
    };

    // Update portal settings
    await updateAccountPortalSettings(accountId, updatedPortalSettings);

    // Revalidate the settings pages
    revalidatePath("/account-admin/portales");
    revalidatePath("/ajustes");

    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    console.error("Error updating portal configuration:", error);
    return {
      success: false,
      error: "Error al actualizar la configuración de portales",
    };
  }
}

// Add this new function specifically for config files
export async function uploadAccountLogoForConfig(
  formData: FormData,
): Promise<AccountSettingsResponse> {
  try {
    const file = formData.get("logo") as File;

    if (!file) {
      return {
        success: false,
        error: "Archivo requerido",
      };
    }

    // Get authenticated user's account ID (secure)
    const accountId = await getCurrentUserAccountId();

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        error: "El archivo debe ser una imagen",
      };
    }

    // Get account details to determine dynamic folder name
    const account = await getAccountById(accountId);
    if (!account) {
      return {
        success: false,
        error: "Cuenta no encontrada",
      };
    }

    // Generate dynamic bucket name based on account name
    const bucketName = await getDynamicBucketNameForAccount(accountId);

    // Create a custom upload function for the config folder
    const fileExtension = file.name.split(".").pop();
    const logoKey = `${bucketName}/config/logo_${accountId}_${Date.now()}.${fileExtension}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3 directly with custom key
    const s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: logoKey,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    const imageUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${logoKey}`;

    // Update account with new logo URL
    const updatedAccount = await updateAccountLogo(BigInt(accountId), imageUrl);

    // Revalidate pages
    revalidatePath("/account-admin");
    revalidatePath("/ajustes");

    return {
      success: true,
      data: updatedAccount,
    };
  } catch (error) {
    console.error("Error uploading account logo:", error);
    return {
      success: false,
      error: "Error al subir el logo",
    };
  }
}

// Get account transparent logo
export async function getAccountTransparentLogoAction(): Promise<{
  success: boolean;
  logoUrl?: string | null;
  error?: string;
}> {
  try {
    const accountId = await getCurrentUserAccountId();
    const { getAccountTransparentLogo } = await import(
      "~/server/queries/accounts"
    );

    const logoUrl = await getAccountTransparentLogo(accountId);

    return {
      success: true,
      logoUrl,
    };
  } catch (error) {
    console.error("Error getting account transparent logo:", error);
    return {
      success: false,
      error: "Error al obtener el logo de la cuenta",
    };
  }
}
