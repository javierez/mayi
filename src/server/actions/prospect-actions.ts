"use server";

import { db } from "~/server/db";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { prospects, contacts } from "~/server/db/schema";
import { getCurrentUser, getCurrentUserAccountId } from "~/lib/dal";
import { createProspectHistory } from "~/server/queries/prospect-history";
import {
  DualProspectStatusUpdateSchema,
  CreateSearchProspectSchema,
  CreateListingProspectSchema,
  BulkDualProspectActionSchema,
} from "~/types/dual-prospects";
import { isValidDualProspectStatusTransition } from "~/types/operations";
import { getDualProspectWithAuth } from "~/server/queries/dual-prospects";
import type { ActionResult } from "~/types/operations";

// Update dual prospect status with workflow validation
export async function updateDualProspectStatus(
  input: unknown,
): Promise<ActionResult<{ prospectId: bigint; newStatus: string }>> {
  try {
    const currentUserId = await getCurrentUser();
    const accountId = await getCurrentUserAccountId();

    // Validate input with Zod schema
    const validated = DualProspectStatusUpdateSchema.parse({
      ...(typeof input === "object" && input !== null ? input : {}),
      accountId: accountId.toString(),
    });

    // Verify prospect belongs to user's account and get current state
    const currentProspect = await getDualProspectWithAuth(validated.prospectId);
    if (!currentProspect) {
      return {
        success: false,
        error: "Prospecto no encontrado o acceso denegado",
      };
    }

    // Validate status transition based on prospect type
    const validation = isValidDualProspectStatusTransition(
      validated.prospectType,
      validated.fromStatus,
      validated.toStatus,
    );

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error ?? "Transición de estado no válida",
      };
    }

    // Update prospect status in a transaction
    await db.transaction(async (tx) => {
      // Update prospect status
      await tx
        .update(prospects)
        .set({
          status: validated.toStatus,
          updatedAt: new Date(),
        })
        .where(eq(prospects.id, validated.prospectId));

      // Create audit trail entry
      if (currentUserId) {
        await createProspectHistory({
          prospectId: validated.prospectId,
          previousStatus: validated.fromStatus,
          newStatus: validated.toStatus,
          changedBy: currentUserId.id,
        });
      }
    });

    // Revalidate the kanban data
    revalidatePath("/operaciones/prospects");

    return {
      success: true,
      data: {
        prospectId: validated.prospectId,
        newStatus: validated.toStatus,
      },
      message: `Prospecto movido a "${validated.toStatus}"`,
    };
  } catch (error) {
    console.error("Error updating dual prospect status:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return {
      success: false,
      error: "Error al actualizar el estado del prospecto",
    };
  }
}

// Create a new search prospect
export async function createSearchProspect(
  input: unknown,
): Promise<ActionResult<{ prospectId: bigint }>> {
  try {
    const currentUserId = await getCurrentUser();
    const accountId = await getCurrentUserAccountId();

    // Validate input
    const validated = CreateSearchProspectSchema.parse(input);

    // Verify contact belongs to user's account
    const [contact] = await db
      .select({ contactId: contacts.contactId })
      .from(contacts)
      .where(
        and(
          eq(contacts.contactId, validated.contactId),
          eq(contacts.accountId, BigInt(accountId)),
          eq(contacts.isActive, true),
        ),
      );

    if (!contact) {
      return {
        success: false,
        error: "Contacto no encontrado o acceso denegado",
      };
    }

    // Create search prospect
    const createdProspectIds = await db
      .insert(prospects)
      .values({
        contactId: validated.contactId,
        status: validated.status,
        listingType: validated.listingType,
        prospectType: "search",
        propertyType: validated.propertyType,
        minPrice: validated.minPrice?.toString(),
        maxPrice: validated.maxPrice?.toString(),
        preferredAreas: validated.preferredAreas,
        minBedrooms: validated.minBedrooms,
        minBathrooms: validated.minBathrooms,
        minSquareMeters: validated.minSquareMeters,
        maxSquareMeters: validated.maxSquareMeters,
        moveInBy: validated.moveInBy,
        extras: validated.extras,
        urgencyLevel: validated.urgencyLevel,
        fundingReady: validated.fundingReady,
        notesInternal: validated.notesInternal,
      })
      .returning();

    const createdProspectId = createdProspectIds[0]?.id;

    if (!createdProspectId) {
      throw new Error("Error al crear el prospecto de búsqueda");
    }

    // Create initial history entry
    if (currentUserId) {
      await createProspectHistory({
        prospectId: createdProspectId,
        previousStatus: undefined,
        newStatus: validated.status,
        changedBy: currentUserId.id,
        changeReason: "Prospecto creado",
      });
    }

    // Revalidate data
    revalidatePath("/operaciones/prospects");

    return {
      success: true,
      data: { prospectId: createdProspectId },
      message: "Prospecto de búsqueda creado exitosamente",
    };
  } catch (error) {
    console.error("Error creating search prospect:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return {
      success: false,
      error: "Error al crear el prospecto de búsqueda",
    };
  }
}

// Create a new listing prospect
export async function createListingProspect(
  input: unknown,
): Promise<ActionResult<{ prospectId: bigint }>> {
  try {
    const currentUserId = await getCurrentUser();
    const accountId = await getCurrentUserAccountId();

    // Validate input
    const validated = CreateListingProspectSchema.parse(input);

    // Verify contact belongs to user's account
    const [contact] = await db
      .select({ contactId: contacts.contactId })
      .from(contacts)
      .where(
        and(
          eq(contacts.contactId, validated.contactId),
          eq(contacts.accountId, BigInt(accountId)),
          eq(contacts.isActive, true),
        ),
      );

    if (!contact) {
      return {
        success: false,
        error: "Contacto no encontrado o acceso denegado",
      };
    }

    // Create listing prospect
    const createdProspectIds = await db
      .insert(prospects)
      .values({
        contactId: validated.contactId,
        status: validated.status,
        listingType: validated.listingType,
        prospectType: "listing",
        urgencyLevel: validated.urgencyLevel,
        notesInternal: validated.notesInternal,
      })
      .returning();

    const createdProspectId = createdProspectIds[0]?.id;

    if (!createdProspectId) {
      throw new Error("Error al crear el prospecto de listado");
    }

    // Create initial history entry
    if (currentUserId) {
      await createProspectHistory({
        prospectId: createdProspectId,
        previousStatus: undefined,
        newStatus: validated.status,
        changedBy: currentUserId.id,
        changeReason: "Prospecto creado",
      });
    }

    // Revalidate data
    revalidatePath("/operaciones/prospects");

    return {
      success: true,
      data: { prospectId: createdProspectId },
      message: "Prospecto de listado creado exitosamente",
    };
  } catch (error) {
    console.error("Error creating listing prospect:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return {
      success: false,
      error: "Error al crear el prospecto de listado",
    };
  }
}

// Bulk update prospects (for bulk actions in kanban)
export async function bulkUpdateDualProspects(
  input: unknown,
): Promise<ActionResult<{ affectedCount: number }>> {
  try {
    const currentUserId = await getCurrentUser();
    const accountId = await getCurrentUserAccountId();

    // Validate input
    const validated = BulkDualProspectActionSchema.parse({
      ...(typeof input === "object" && input !== null ? input : {}),
      accountId: accountId.toString(),
    });

    let affectedCount = 0;

    switch (validated.action) {
      case "updateStatus": {
        if (!validated.targetValue) {
          return {
            success: false,
            error: "Estado de destino requerido para actualización masiva",
          };
        }

        // Verify all prospects belong to user's account
        const userProspects = await db
          .select({
            id: prospects.id,
            status: prospects.status,
            prospectType: prospects.prospectType,
          })
          .from(prospects)
          .innerJoin(contacts, eq(prospects.contactId, contacts.contactId))
          .where(
            and(
              eq(contacts.accountId, BigInt(accountId)),
              inArray(prospects.id, validated.prospectIds),
            ),
          );

        // Validate status transitions for each prospect
        for (const prospect of userProspects) {
          const validation = isValidDualProspectStatusTransition(
            prospect.prospectType as "search" | "listing",
            prospect.status,
            validated.targetValue,
          );

          if (!validation.valid) {
            return {
              success: false,
              error: `No se puede cambiar estado del prospecto ${prospect.id}: ${validation.error}`,
            };
          }
        }

        // Update all prospects in a transaction
        await db.transaction(async (tx) => {
          for (const prospectId of validated.prospectIds) {
            const currentProspect = userProspects.find(
              (p) => p.id === prospectId,
            );
            if (!currentProspect) continue;

            await tx
              .update(prospects)
              .set({
                status: validated.targetValue!,
                updatedAt: new Date(),
              })
              .where(eq(prospects.id, prospectId));

            // Create history entry
            if (currentUserId) {
              await createProspectHistory({
                prospectId,
                previousStatus: currentProspect.status,
                newStatus: validated.targetValue!,
                changedBy: currentUserId.id,
                changeReason: "Actualización masiva",
              });
            }

            affectedCount++;
          }
        });

        break;
      }

      case "assign": {
        // For future implementation - assign prospects to different agents
        return {
          success: false,
          error: "Asignación masiva no implementada aún",
        };
      }

      case "createTasks": {
        // For future implementation - create follow-up tasks
        return {
          success: false,
          error: "Creación masiva de tareas no implementada aún",
        };
      }

      case "export": {
        // For future implementation - export prospect data
        return {
          success: false,
          error: "Exportación no implementada aún",
        };
      }

      default:
        return {
          success: false,
          error: "Acción no reconocida",
        };
    }

    // Revalidate data
    revalidatePath("/operaciones/prospects");

    return {
      success: true,
      data: { affectedCount },
      message: `${affectedCount} prospectos actualizados exitosamente`,
    };
  } catch (error) {
    console.error("Error in bulk update dual prospects:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return {
      success: false,
      error: "Error en actualización masiva de prospectos",
    };
  }
}

// Update listing prospect valuation status
export async function updateListingProspectValuation(
  prospectId: string,
  valuationStatus: "pending" | "scheduled" | "completed",
): Promise<ActionResult<void>> {
  try {
    await getCurrentUserAccountId();

    // Verify prospect belongs to user's account and is a listing prospect
    const currentProspect = await getDualProspectWithAuth(BigInt(prospectId));
    if (!currentProspect) {
      return {
        success: false,
        error: "Prospecto no encontrado o acceso denegado",
      };
    }

    if (currentProspect.prospectType !== "listing") {
      return {
        success: false,
        error:
          "Solo se puede actualizar estado de valoración en prospectos de listado",
      };
    }

    // Update valuation status - store in notesInternal as a JSON field since valuationStatus column doesn't exist
    const prospectData = await db
      .select({ notesInternal: prospects.notesInternal })
      .from(prospects)
      .where(eq(prospects.id, BigInt(prospectId)))
      .limit(1);

    const currentNotes = prospectData[0]?.notesInternal;
    const notes =
      typeof currentNotes === "string"
        ? { text: currentNotes, valuationStatus }
        : {
            ...(typeof currentNotes === "object" && currentNotes !== null
              ? currentNotes
              : {}),
            valuationStatus,
          };

    await db
      .update(prospects)
      .set({
        notesInternal: JSON.stringify(notes),
        updatedAt: new Date(),
      })
      .where(eq(prospects.id, BigInt(prospectId)));

    // Revalidate data
    revalidatePath("/operaciones/prospects");

    const statusMessages = {
      pending: "pendiente",
      scheduled: "programada",
      completed: "completada",
    };

    return {
      success: true,
      message: `Estado de valoración actualizado a ${statusMessages[valuationStatus]}`,
    };
  } catch (error) {
    console.error("Error updating listing prospect valuation:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return {
      success: false,
      error: "Error al actualizar estado de valoración",
    };
  }
}

// Update listing prospect agreement status
export async function updateListingProspectAgreement(
  prospectId: string,
  listingAgreementStatus: "not_started" | "in_progress" | "signed",
): Promise<ActionResult<void>> {
  try {
    await getCurrentUserAccountId();

    // Verify prospect belongs to user's account and is a listing prospect
    const currentProspect = await getDualProspectWithAuth(BigInt(prospectId));
    if (!currentProspect) {
      return {
        success: false,
        error: "Prospecto no encontrado o acceso denegado",
      };
    }

    if (currentProspect.prospectType !== "listing") {
      return {
        success: false,
        error:
          "Solo se puede actualizar estado de hoja de encargo en prospectos de listado",
      };
    }

    // Update agreement status - store in notesInternal as a JSON field since listingAgreementStatus column doesn't exist
    const prospectData = await db
      .select({ notesInternal: prospects.notesInternal })
      .from(prospects)
      .where(eq(prospects.id, BigInt(prospectId)))
      .limit(1);

    const currentNotes = prospectData[0]?.notesInternal;
    const notes =
      typeof currentNotes === "string"
        ? { text: currentNotes, listingAgreementStatus }
        : {
            ...(typeof currentNotes === "object" && currentNotes !== null
              ? currentNotes
              : {}),
            listingAgreementStatus,
          };

    await db
      .update(prospects)
      .set({
        notesInternal: JSON.stringify(notes),
        updatedAt: new Date(),
      })
      .where(eq(prospects.id, BigInt(prospectId)));

    // Revalidate data
    revalidatePath("/operaciones/prospects");

    const statusMessages = {
      not_started: "no iniciado",
      in_progress: "en progreso",
      signed: "firmado",
    };

    return {
      success: true,
      message: `Estado de hoja de encargo actualizado a ${statusMessages[listingAgreementStatus]}`,
    };
  } catch (error) {
    console.error("Error updating listing prospect agreement:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return {
      success: false,
      error: "Error al actualizar estado de hoja de encargo",
    };
  }
}
