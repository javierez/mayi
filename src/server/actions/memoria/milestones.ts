"use server";

import { revalidatePath } from "next/cache";
import { requireCoupleSession, getCurrentCoupleId } from "~/lib/dal-couples";
import {
  getMilestones,
  getUpcomingMilestones,
  getMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  verifyMilestoneBelongsToCouple,
} from "~/server/queries/memoria/milestones";
import type { ActionResult, Milestone, MilestoneWithNextDate, RecurrenceType } from "~/types/memoria";

/**
 * Get all milestones for the couple
 */
export async function getMilestonesAction(): Promise<ActionResult<MilestoneWithNextDate[]>> {
  try {
    const coupleId = await getCurrentCoupleId();
    const milestones = await getMilestones(coupleId);
    return { success: true, data: milestones };
  } catch (error) {
    console.error("Error getting milestones:", error);
    return { success: false, error: "Error al cargar hitos" };
  }
}

/**
 * Get upcoming milestones
 */
export async function getUpcomingMilestonesAction(
  daysAhead = 30
): Promise<ActionResult<MilestoneWithNextDate[]>> {
  try {
    const coupleId = await getCurrentCoupleId();
    const milestones = await getUpcomingMilestones(coupleId, daysAhead);
    return { success: true, data: milestones };
  } catch (error) {
    console.error("Error getting upcoming milestones:", error);
    return { success: false, error: "Error al cargar hitos próximos" };
  }
}

/**
 * Get a single milestone
 */
export async function getMilestoneAction(
  milestoneId: string
): Promise<ActionResult<Milestone>> {
  try {
    const coupleId = await getCurrentCoupleId();

    // Verify milestone belongs to couple
    const belongs = await verifyMilestoneBelongsToCouple(
      BigInt(milestoneId),
      coupleId
    );
    if (!belongs) {
      return { success: false, error: "Hito no encontrado" };
    }

    const milestone = await getMilestoneById(BigInt(milestoneId));
    if (!milestone) {
      return { success: false, error: "Hito no encontrado" };
    }

    return { success: true, data: milestone };
  } catch (error) {
    console.error("Error getting milestone:", error);
    return { success: false, error: "Error al cargar el hito" };
  }
}

/**
 * Create a new milestone
 */
export async function createMilestoneAction(data: {
  title: string;
  description?: string;
  originalDate: string;
  icon?: string;
  recurrence?: RecurrenceType;
  reminderDaysBefore?: number;
  color?: string;
}): Promise<ActionResult<Milestone>> {
  try {
    const coupleId = await getCurrentCoupleId();

    const milestone = await createMilestone({
      coupleId,
      title: data.title,
      description: data.description,
      originalDate: data.originalDate,
      icon: data.icon,
      recurrence: data.recurrence,
      reminderDaysBefore: data.reminderDaysBefore,
      color: data.color,
    });

    revalidatePath("/hitos");
    revalidatePath("/calendario");
    return { success: true, data: milestone };
  } catch (error) {
    console.error("Error creating milestone:", error);
    return { success: false, error: "Error al crear el hito" };
  }
}

/**
 * Update a milestone
 */
export async function updateMilestoneAction(
  milestoneId: string,
  data: {
    title?: string;
    description?: string | null;
    originalDate?: string;
    icon?: string | null;
    recurrence?: RecurrenceType;
    reminderDaysBefore?: number;
    color?: string | null;
  }
): Promise<ActionResult<Milestone>> {
  try {
    const coupleId = await getCurrentCoupleId();

    // Verify milestone belongs to couple
    const belongs = await verifyMilestoneBelongsToCouple(
      BigInt(milestoneId),
      coupleId
    );
    if (!belongs) {
      return { success: false, error: "Hito no encontrado" };
    }

    const milestone = await updateMilestone(BigInt(milestoneId), data);
    if (!milestone) {
      return { success: false, error: "Hito no encontrado" };
    }

    revalidatePath("/hitos");
    revalidatePath("/calendario");
    return { success: true, data: milestone };
  } catch (error) {
    console.error("Error updating milestone:", error);
    return { success: false, error: "Error al actualizar el hito" };
  }
}

/**
 * Delete a milestone
 */
export async function deleteMilestoneAction(
  milestoneId: string
): Promise<ActionResult<void>> {
  try {
    const coupleId = await getCurrentCoupleId();

    // Verify milestone belongs to couple
    const belongs = await verifyMilestoneBelongsToCouple(
      BigInt(milestoneId),
      coupleId
    );
    if (!belongs) {
      return { success: false, error: "Hito no encontrado" };
    }

    await deleteMilestone(BigInt(milestoneId));

    revalidatePath("/hitos");
    revalidatePath("/calendario");
    return { success: true };
  } catch (error) {
    console.error("Error deleting milestone:", error);
    return { success: false, error: "Error al eliminar el hito" };
  }
}
