"use server";

import { db } from "~/server/db";
import { propertyDescriptionExamples } from "~/server/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getCurrentUserAccountId } from "~/lib/dal";

export interface PropertyDescriptionExample {
  id: bigint;
  accountId: bigint;
  propertyType: string;
  listingType: string | null;
  exampleText: string;
  title: string | null;
  metadata: Record<string, unknown> | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all property description examples for the current account
 */
export async function getPropertyDescriptionExamples(): Promise<PropertyDescriptionExample[]> {
  const accountId = await getCurrentUserAccountId();
  if (!accountId) {
    return [];
  }

  const examples = await db
    .select()
    .from(propertyDescriptionExamples)
    .where(eq(propertyDescriptionExamples.accountId, BigInt(accountId)))
    .orderBy(asc(propertyDescriptionExamples.sortOrder));

  return examples.map((ex) => ({
    id: ex.id,
    accountId: ex.accountId,
    propertyType: ex.propertyType,
    listingType: ex.listingType,
    exampleText: ex.exampleText,
    title: ex.title,
    metadata: ex.metadata as Record<string, unknown> | null,
    isActive: ex.isActive,
    sortOrder: ex.sortOrder,
    createdAt: ex.createdAt,
    updatedAt: ex.updatedAt,
  }));
}

/**
 * Create a new property description example
 */
export async function createPropertyDescriptionExample(data: {
  propertyType: string;
  listingType?: string | null;
  exampleText: string;
  title?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const accountId = await getCurrentUserAccountId();
    if (!accountId) {
      return { success: false, error: "No se encontró la cuenta" };
    }

    await db.insert(propertyDescriptionExamples).values({
      accountId: BigInt(accountId),
      propertyType: data.propertyType,
      listingType: data.listingType ?? null,
      exampleText: data.exampleText,
      title: data.title ?? null,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating property description example:", error);
    return { success: false, error: "Error al crear el ejemplo" };
  }
}

/**
 * Update a property description example
 */
export async function updatePropertyDescriptionExample(
  id: bigint,
  data: {
    propertyType?: string;
    listingType?: string | null;
    exampleText?: string;
    title?: string | null;
    metadata?: Record<string, unknown> | null;
    isActive?: boolean;
    sortOrder?: number;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const accountId = await getCurrentUserAccountId();
    if (!accountId) {
      return { success: false, error: "No se encontró la cuenta" };
    }

    await db
      .update(propertyDescriptionExamples)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(propertyDescriptionExamples.id, id),
          eq(propertyDescriptionExamples.accountId, BigInt(accountId)),
        ),
      );

    return { success: true };
  } catch (error) {
    console.error("Error updating property description example:", error);
    return { success: false, error: "Error al actualizar el ejemplo" };
  }
}

/**
 * Delete a property description example
 */
export async function deletePropertyDescriptionExample(
  id: bigint,
): Promise<{ success: boolean; error?: string }> {
  try {
    const accountId = await getCurrentUserAccountId();
    if (!accountId) {
      return { success: false, error: "No se encontró la cuenta" };
    }

    await db
      .delete(propertyDescriptionExamples)
      .where(
        and(
          eq(propertyDescriptionExamples.id, id),
          eq(propertyDescriptionExamples.accountId, BigInt(accountId)),
        ),
      );

    return { success: true };
  } catch (error) {
    console.error("Error deleting property description example:", error);
    return { success: false, error: "Error al eliminar el ejemplo" };
  }
}

/**
 * Toggle active status of a property description example
 */
export async function togglePropertyDescriptionExampleActive(
  id: bigint,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  return updatePropertyDescriptionExample(id, { isActive });
}
