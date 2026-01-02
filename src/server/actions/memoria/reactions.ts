"use server";

import { revalidatePath } from "next/cache";
import { requireCoupleSession, getCurrentCoupleId } from "~/lib/dal-couples";
import {
  getReactionsForMemory,
  toggleReaction,
  getReactionCounts,
} from "~/server/queries/memoria/reactions";
import { verifyMemoryBelongsToCouple, getMemoryById } from "~/server/queries/memoria/memories";
import { getDayById } from "~/server/queries/memoria/days";
import type { ActionResult, Reaction, ReactionEmoji } from "~/types/memoria";

/**
 * Get all reactions for a memory
 */
export async function getReactionsAction(
  memoryId: string
): Promise<ActionResult<Reaction[]>> {
  try {
    const coupleId = await getCurrentCoupleId();

    // Verify memory belongs to couple
    const belongs = await verifyMemoryBelongsToCouple(
      BigInt(memoryId),
      coupleId
    );
    if (!belongs) {
      return { success: false, error: "Recuerdo no encontrado" };
    }

    const reactions = await getReactionsForMemory(BigInt(memoryId));
    return { success: true, data: reactions };
  } catch (error) {
    console.error("Error getting reactions:", error);
    return { success: false, error: "Error al cargar reacciones" };
  }
}

/**
 * Toggle a reaction on a memory
 */
export async function toggleReactionAction(
  memoryId: string,
  emoji: ReactionEmoji
): Promise<ActionResult<{ added: boolean; reaction?: Reaction }>> {
  try {
    const session = await requireCoupleSession();
    const coupleId = session.user.coupleId;

    // Verify memory belongs to couple
    const belongs = await verifyMemoryBelongsToCouple(
      BigInt(memoryId),
      coupleId
    );
    if (!belongs) {
      return { success: false, error: "Recuerdo no encontrado" };
    }

    const result = await toggleReaction(
      BigInt(memoryId),
      session.user.id,
      emoji
    );

    // Get day for revalidation
    const memory = await getMemoryById(BigInt(memoryId));
    if (memory) {
      const day = await getDayById(memory.dayId);
      if (day) {
        revalidatePath(`/dia/${day.date}`);
      }
    }
    revalidatePath(`/recuerdo/${memoryId}`);

    return { success: true, data: result };
  } catch (error) {
    console.error("Error toggling reaction:", error);
    return { success: false, error: "Error al reaccionar" };
  }
}

/**
 * Get reaction counts for a memory
 */
export async function getReactionCountsAction(
  memoryId: string
): Promise<ActionResult<Record<ReactionEmoji, number>>> {
  try {
    const coupleId = await getCurrentCoupleId();

    // Verify memory belongs to couple
    const belongs = await verifyMemoryBelongsToCouple(
      BigInt(memoryId),
      coupleId
    );
    if (!belongs) {
      return { success: false, error: "Recuerdo no encontrado" };
    }

    const counts = await getReactionCounts(BigInt(memoryId));
    return { success: true, data: counts };
  } catch (error) {
    console.error("Error getting reaction counts:", error);
    return { success: false, error: "Error al cargar reacciones" };
  }
}
