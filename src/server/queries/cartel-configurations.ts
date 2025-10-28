"use server";

import { db } from "../db";
import { cartelConfigurations } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUserAccountId } from "~/lib/dal";
import type {
  SavedCartelConfiguration,
  SaveConfigurationRequest,
  TemplateConfiguration,
  ExtendedTemplatePropertyData,
} from "~/types/template-data";

// Database row type from Drizzle
interface CartelConfigurationRow {
  id: bigint;
  userId: string | null;
  accountId: bigint;
  propertyId: bigint | null;
  name: string;
  templateConfig: unknown;
  propertyOverrides: unknown;
  selectedContacts: unknown;
  selectedImageIndices: unknown;
  isDefault: boolean | null;
  isGlobal: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

// Convert database row to SavedCartelConfiguration
function dbRowToConfiguration(
  row: CartelConfigurationRow,
): SavedCartelConfiguration {
  return {
    id: row.id.toString(),
    name: row.name,
    userId: row.userId ?? "",
    accountId: row.accountId.toString(),
    propertyId: row.propertyId?.toString(),
    templateConfig: row.templateConfig as TemplateConfiguration,
    propertyOverrides:
      row.propertyOverrides as Partial<ExtendedTemplatePropertyData>,
    selectedContacts: row.selectedContacts as {
      phone?: string;
      email?: string;
    },
    selectedImageIndices: row.selectedImageIndices as number[],
    isDefault: row.isDefault ?? false,
    isGlobal: row.isGlobal ?? true,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// Wrapper functions that automatically get accountId from current session
export async function saveCartelConfigurationWithAuth(
  request: SaveConfigurationRequest,
): Promise<{
  success: boolean;
  data?: SavedCartelConfiguration;
  error?: string;
}> {
  const accountId = await getCurrentUserAccountId();
  return saveCartelConfiguration(accountId, request);
}

export async function getCartelConfigurationsWithAuth(
  propertyId?: string,
): Promise<{
  success: boolean;
  data?: SavedCartelConfiguration[];
  error?: string;
}> {
  const accountId = await getCurrentUserAccountId();
  return getCartelConfigurations(accountId, propertyId);
}

export async function getCartelConfigurationWithAuth(
  configId: string,
): Promise<{
  success: boolean;
  data?: SavedCartelConfiguration;
  error?: string;
}> {
  const accountId = await getCurrentUserAccountId();
  return getCartelConfiguration(configId, accountId);
}

export async function updateCartelConfigurationWithAuth(
  configId: string,
  updates: Partial<SaveConfigurationRequest>,
): Promise<{
  success: boolean;
  data?: SavedCartelConfiguration;
  error?: string;
}> {
  const accountId = await getCurrentUserAccountId();
  return updateCartelConfiguration(configId, accountId, updates);
}

export async function deleteCartelConfigurationWithAuth(
  configId: string,
): Promise<{ success: boolean; error?: string }> {
  const accountId = await getCurrentUserAccountId();
  return deleteCartelConfiguration(configId, accountId);
}

export async function getDefaultCartelConfigurationWithAuth(): Promise<{
  success: boolean;
  data?: SavedCartelConfiguration;
  error?: string;
}> {
  const accountId = await getCurrentUserAccountId();
  return getDefaultCartelConfiguration(accountId);
}

export async function setDefaultCartelConfigurationWithAuth(
  configId: string,
): Promise<{ success: boolean; error?: string }> {
  const accountId = await getCurrentUserAccountId();
  return setDefaultCartelConfiguration(configId, accountId);
}

// Save a new cartel configuration
async function saveCartelConfiguration(
  accountId: number | bigint,
  request: SaveConfigurationRequest,
): Promise<{
  success: boolean;
  data?: SavedCartelConfiguration;
  error?: string;
}> {
  try {
    // If setting as default, unset any existing default for this account
    if (request.isDefault) {
      await db
        .update(cartelConfigurations)
        .set({ isDefault: false })
        .where(
          and(
            eq(cartelConfigurations.accountId, BigInt(accountId)),
            eq(cartelConfigurations.isDefault, true),
          ),
        );
    }

    // Insert new configuration without userId
    await db.insert(cartelConfigurations).values({
      userId: null,
      accountId: BigInt(accountId),
      propertyId: request.propertyId ? BigInt(request.propertyId) : null,
      name: request.name,
      templateConfig: request.templateConfig,
      propertyOverrides: request.propertyOverrides ?? {},
      selectedContacts: request.selectedContacts ?? {},
      selectedImageIndices: request.selectedImageIndices,
      isDefault: request.isDefault ?? false,
      isGlobal: request.isGlobal ?? true,
    });

    // Fetch the created configuration by name and accountId (most recent)
    const [savedConfig] = await db
      .select()
      .from(cartelConfigurations)
      .where(
        and(
          eq(cartelConfigurations.accountId, BigInt(accountId)),
          eq(cartelConfigurations.name, request.name),
        ),
      )
      .orderBy(desc(cartelConfigurations.createdAt))
      .limit(1);

    if (!savedConfig) {
      return { success: false, error: "Failed to save configuration" };
    }

    return {
      success: true,
      data: dbRowToConfiguration(savedConfig),
    };
  } catch (error) {
    console.error("Error saving cartel configuration:", error);
    return { success: false, error: "Failed to save configuration" };
  }
}

// Get all configurations for account
async function getCartelConfigurations(
  accountId: number | bigint,
  propertyId?: string,
): Promise<{
  success: boolean;
  data?: SavedCartelConfiguration[];
  error?: string;
}> {
  try {
    // Get configurations - include global configs and property-specific if propertyId provided
    if (propertyId) {
      // This will get both global configs (isGlobal=true) and configs specific to this property
      const configs = await db
        .select()
        .from(cartelConfigurations)
        .where(
          and(
            eq(cartelConfigurations.accountId, BigInt(accountId)),
            eq(cartelConfigurations.isGlobal, true),
          ),
        )
        .orderBy(
          desc(cartelConfigurations.isDefault),
          desc(cartelConfigurations.updatedAt),
        );

      const propertyConfigs = await db
        .select()
        .from(cartelConfigurations)
        .where(
          and(
            eq(cartelConfigurations.accountId, BigInt(accountId)),
            eq(cartelConfigurations.propertyId, BigInt(propertyId)),
          ),
        )
        .orderBy(
          desc(cartelConfigurations.isDefault),
          desc(cartelConfigurations.updatedAt),
        );

      const allConfigs = [...configs, ...propertyConfigs];

      return {
        success: true,
        data: allConfigs.map(dbRowToConfiguration),
      };
    } else {
      // Get only global configurations
      const configs = await db
        .select()
        .from(cartelConfigurations)
        .where(
          and(
            eq(cartelConfigurations.accountId, BigInt(accountId)),
            eq(cartelConfigurations.isGlobal, true),
          ),
        )
        .orderBy(
          desc(cartelConfigurations.isDefault),
          desc(cartelConfigurations.updatedAt),
        );

      return {
        success: true,
        data: configs.map(dbRowToConfiguration),
      };
    }
  } catch (error) {
    console.error("Error fetching cartel configurations:", error);
    return { success: false, error: "Failed to fetch configurations" };
  }
}

// Get a specific configuration by ID
async function getCartelConfiguration(
  configId: string,
  accountId: number | bigint,
): Promise<{
  success: boolean;
  data?: SavedCartelConfiguration;
  error?: string;
}> {
  try {
    const [config] = await db
      .select()
      .from(cartelConfigurations)
      .where(
        and(
          eq(cartelConfigurations.id, BigInt(configId)),
          eq(cartelConfigurations.accountId, BigInt(accountId)),
        ),
      );

    if (!config) {
      return { success: false, error: "Configuration not found" };
    }

    return {
      success: true,
      data: dbRowToConfiguration(config),
    };
  } catch (error) {
    console.error("Error fetching cartel configuration:", error);
    return { success: false, error: "Failed to fetch configuration" };
  }
}

// Update an existing configuration
async function updateCartelConfiguration(
  configId: string,
  accountId: number | bigint,
  updates: Partial<SaveConfigurationRequest>,
): Promise<{
  success: boolean;
  data?: SavedCartelConfiguration;
  error?: string;
}> {
  try {
    // Validate configuration exists and belongs to account
    const [existingConfig] = await db
      .select()
      .from(cartelConfigurations)
      .where(
        and(
          eq(cartelConfigurations.id, BigInt(configId)),
          eq(cartelConfigurations.accountId, BigInt(accountId)),
        ),
      );

    if (!existingConfig) {
      return { success: false, error: "Configuration not found" };
    }

    // If setting as default, unset any existing default for this account
    if (updates.isDefault) {
      await db
        .update(cartelConfigurations)
        .set({ isDefault: false })
        .where(
          and(
            eq(cartelConfigurations.accountId, BigInt(accountId)),
            eq(cartelConfigurations.isDefault, true),
          ),
        );
    }

    // Update the configuration
    const updateData: Partial<{
      name: string;
      templateConfig: unknown;
      propertyOverrides: unknown;
      selectedContacts: unknown;
      selectedImageIndices: unknown;
      isDefault: boolean;
      isGlobal: boolean;
      propertyId: bigint | null;
    }> = {};

    if (updates.name) updateData.name = updates.name;
    if (updates.templateConfig)
      updateData.templateConfig = updates.templateConfig;
    if (updates.propertyOverrides)
      updateData.propertyOverrides = updates.propertyOverrides;
    if (updates.selectedContacts)
      updateData.selectedContacts = updates.selectedContacts;
    if (updates.selectedImageIndices)
      updateData.selectedImageIndices = updates.selectedImageIndices;
    if (updates.isDefault !== undefined)
      updateData.isDefault = updates.isDefault;
    if (updates.isGlobal !== undefined) updateData.isGlobal = updates.isGlobal;
    if (updates.propertyId !== undefined) {
      updateData.propertyId = updates.propertyId
        ? BigInt(updates.propertyId)
        : null;
    }

    await db
      .update(cartelConfigurations)
      .set(updateData)
      .where(eq(cartelConfigurations.id, BigInt(configId)));

    // Fetch the updated configuration
    const [updatedConfig] = await db
      .select()
      .from(cartelConfigurations)
      .where(eq(cartelConfigurations.id, BigInt(configId)));

    if (!updatedConfig) {
      return { success: false, error: "Failed to update configuration" };
    }

    return {
      success: true,
      data: dbRowToConfiguration(updatedConfig),
    };
  } catch (error) {
    console.error("Error updating cartel configuration:", error);
    return { success: false, error: "Failed to update configuration" };
  }
}

// Delete a configuration
async function deleteCartelConfiguration(
  configId: string,
  accountId: number | bigint,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if configuration exists first
    const [existingConfig] = await db
      .select()
      .from(cartelConfigurations)
      .where(
        and(
          eq(cartelConfigurations.id, BigInt(configId)),
          eq(cartelConfigurations.accountId, BigInt(accountId)),
        ),
      );

    if (!existingConfig) {
      return { success: false, error: "Configuration not found" };
    }

    await db
      .delete(cartelConfigurations)
      .where(
        and(
          eq(cartelConfigurations.id, BigInt(configId)),
          eq(cartelConfigurations.accountId, BigInt(accountId)),
        ),
      );

    return { success: true };
  } catch (error) {
    console.error("Error deleting cartel configuration:", error);
    return { success: false, error: "Failed to delete configuration" };
  }
}

// Get default configuration for account
async function getDefaultCartelConfiguration(
  accountId: number | bigint,
): Promise<{
  success: boolean;
  data?: SavedCartelConfiguration;
  error?: string;
}> {
  try {
    const [defaultConfig] = await db
      .select()
      .from(cartelConfigurations)
      .where(
        and(
          eq(cartelConfigurations.accountId, BigInt(accountId)),
          eq(cartelConfigurations.isDefault, true),
        ),
      );

    if (!defaultConfig) {
      return { success: false, error: "No default configuration found" };
    }

    return {
      success: true,
      data: dbRowToConfiguration(defaultConfig),
    };
  } catch (error) {
    console.error("Error fetching default cartel configuration:", error);
    return { success: false, error: "Failed to fetch default configuration" };
  }
}

// Set a configuration as default
async function setDefaultCartelConfiguration(
  configId: string,
  accountId: number | bigint,
): Promise<{ success: boolean; error?: string }> {
  try {
    // First, unset all existing defaults for this account
    await db
      .update(cartelConfigurations)
      .set({ isDefault: false })
      .where(
        and(
          eq(cartelConfigurations.accountId, BigInt(accountId)),
          eq(cartelConfigurations.isDefault, true),
        ),
      );

    // Check if configuration exists first
    const [existingConfig] = await db
      .select()
      .from(cartelConfigurations)
      .where(
        and(
          eq(cartelConfigurations.id, BigInt(configId)),
          eq(cartelConfigurations.accountId, BigInt(accountId)),
        ),
      );

    if (!existingConfig) {
      return { success: false, error: "Configuration not found" };
    }

    // Then set the specified configuration as default
    await db
      .update(cartelConfigurations)
      .set({ isDefault: true })
      .where(
        and(
          eq(cartelConfigurations.id, BigInt(configId)),
          eq(cartelConfigurations.accountId, BigInt(accountId)),
        ),
      );

    return { success: true };
  } catch (error) {
    console.error("Error setting default cartel configuration:", error);
    return { success: false, error: "Failed to set default configuration" };
  }
}
