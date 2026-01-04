"use server";

import { revalidatePath } from "next/cache";
import {
  getSessionWithoutCoupleCheck,
  requireCoupleSession,
  getCurrentCoupleId,
} from "~/lib/dal-couples";
import {
  createCouple,
  updateCouple,
  generateInviteCode,
  validateInviteCode,
  joinCouple,
  getCoupleWithPartners,
  getPartner,
} from "~/server/queries/memoria/couples";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import type { ActionResult, Couple, CoupleWithPartners, CouplePreferences } from "~/types/memoria";

/**
 * Create a new couple and link the current user to it
 */
export async function createCoupleAction(data: {
  name?: string;
  anniversaryDate?: string;
}): Promise<ActionResult<Couple>> {
  console.log("[createCoupleAction] Starting with data:", data);
  try {
    const session = await getSessionWithoutCoupleCheck();
    console.log("[createCoupleAction] Session:", session?.user?.id, session?.user?.coupleId);
    if (!session) {
      console.log("[createCoupleAction] No session");
      return { success: false, error: "No autenticado" };
    }

    // Check if user already belongs to a couple
    if (session.user.coupleId) {
      return { success: false, error: "Ya perteneces a una pareja" };
    }

    // Create the couple
    console.log("[createCoupleAction] Creating couple...");
    const couple = await createCouple({
      name: data.name,
      anniversaryDate: data.anniversaryDate,
    });
    console.log("[createCoupleAction] Couple created:", couple.id.toString());

    // Link user to the couple
    console.log("[createCoupleAction] Linking user to couple...");
    await db
      .update(users)
      .set({
        coupleId: couple.id,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));
    console.log("[createCoupleAction] User linked successfully");

    revalidatePath("/");
    revalidatePath("/memoria");
    console.log("[createCoupleAction] Success!");
    return { success: true, data: couple };
  } catch (error) {
    console.error("[createCoupleAction] Error:", error);
    return { success: false, error: "Error al crear la pareja" };
  }
}

/**
 * Update couple settings
 */
export async function updateCoupleAction(data: {
  name?: string;
  anniversaryDate?: string;
  timezone?: string;
  preferences?: CouplePreferences;
}): Promise<ActionResult<Couple>> {
  try {
    const coupleId = await getCurrentCoupleId();

    const couple = await updateCouple(coupleId, data);
    if (!couple) {
      return { success: false, error: "Pareja no encontrada" };
    }

    revalidatePath("/calendario");
    revalidatePath("/configuracion");
    return { success: true, data: couple };
  } catch (error) {
    console.error("Error updating couple:", error);
    return { success: false, error: "Error al actualizar la pareja" };
  }
}

/**
 * Generate a new invite code for the current couple
 */
export async function generateInviteCodeAction(): Promise<ActionResult<string>> {
  try {
    const coupleId = await getCurrentCoupleId();

    const inviteCode = await generateInviteCode(coupleId);

    revalidatePath("/configuracion");
    return { success: true, data: inviteCode };
  } catch (error) {
    console.error("Error generating invite code:", error);
    return { success: false, error: "Error al generar código de invitación" };
  }
}

/**
 * Validate an invite code (for preview before joining)
 */
export async function validateInviteCodeAction(
  code: string
): Promise<ActionResult<{ coupleName?: string; partnersCount: number }>> {
  try {
    const result = await validateInviteCode(code);

    if (!result) {
      return {
        success: false,
        error: "Código inválido o expirado",
      };
    }

    return {
      success: true,
      data: {
        coupleName: result.couple.name ?? undefined,
        partnersCount: result.partnersCount,
      },
    };
  } catch (error) {
    console.error("Error validating invite code:", error);
    return { success: false, error: "Error al validar el código" };
  }
}

/**
 * Join a couple using an invite code
 */
export async function joinCoupleAction(
  code: string
): Promise<ActionResult<Couple>> {
  try {
    const session = await getSessionWithoutCoupleCheck();
    if (!session) {
      return { success: false, error: "No autenticado" };
    }

    // Check if user already belongs to a couple
    if (session.user.coupleId) {
      return { success: false, error: "Ya perteneces a una pareja" };
    }

    // Validate the invite code
    const result = await validateInviteCode(code);
    if (!result) {
      return { success: false, error: "Código inválido o expirado" };
    }

    // Join the couple
    await joinCouple(session.user.id, result.couple.id);

    revalidatePath("/");
    return { success: true, data: result.couple };
  } catch (error) {
    console.error("Error joining couple:", error);
    return { success: false, error: "Error al unirse a la pareja" };
  }
}

/**
 * Get the current couple with partners info
 */
export async function getCoupleWithPartnersAction(): Promise<
  ActionResult<CoupleWithPartners>
> {
  try {
    const coupleId = await getCurrentCoupleId();

    const couple = await getCoupleWithPartners(coupleId);
    if (!couple) {
      return { success: false, error: "Pareja no encontrada" };
    }

    return { success: true, data: couple };
  } catch (error) {
    console.error("Error getting couple:", error);
    return { success: false, error: "Error al obtener información de la pareja" };
  }
}

/**
 * Get the current user's partner
 */
export async function getPartnerAction(): Promise<
  ActionResult<{ id: string; firstName: string; lastName: string | null; image: string | null } | null>
> {
  try {
    const session = await requireCoupleSession();
    const coupleId = session.user.coupleId;

    const partner = await getPartner(coupleId, session.user.id);
    return { success: true, data: partner };
  } catch (error) {
    console.error("Error getting partner:", error);
    return { success: false, error: "Error al obtener información del partner" };
  }
}

/**
 * Check if the current user is in a couple
 */
export async function checkCoupleStatusAction(): Promise<
  ActionResult<{ hasCouple: boolean; coupleId?: string }>
> {
  try {
    const session = await getSessionWithoutCoupleCheck();
    if (!session) {
      return { success: false, error: "No autenticado" };
    }

    return {
      success: true,
      data: {
        hasCouple: session.user.coupleId !== null,
        coupleId: session.user.coupleId?.toString(),
      },
    };
  } catch (error) {
    console.error("Error checking couple status:", error);
    return { success: false, error: "Error al verificar estado" };
  }
}
