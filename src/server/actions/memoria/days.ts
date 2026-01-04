"use server";

import { revalidatePath } from "next/cache";
import { requireCoupleSession, getCurrentCoupleId } from "~/lib/dal-couples";
import {
  getDaysForMonth,
  getDayById,
  getDayByDate,
  getOrCreateDay,
  updateDay,
  setCoverMemory,
  getRecentDays,
} from "~/server/queries/memoria/days";
import type { ActionResult, Day, DaySummary, MoodType, CalendarMonth } from "~/types/memoria";

/**
 * Get calendar data for a month (days with memories)
 */
export async function getCalendarMonthAction(
  year: number,
  month: number
): Promise<ActionResult<CalendarMonth>> {
  try {
    const coupleId = await getCurrentCoupleId();
    const days = await getDaysForMonth(coupleId, year, month);

    return {
      success: true,
      data: {
        year,
        month,
        days,
        milestones: [],
      },
    };
  } catch (error) {
    console.error("Error getting calendar month:", error);
    return { success: false, error: "Error al cargar el calendario" };
  }
}

/**
 * Get a single day by date
 */
export async function getDayByDateAction(
  date: string
): Promise<ActionResult<Day | null>> {
  try {
    const coupleId = await getCurrentCoupleId();
    const day = await getDayByDate(coupleId, date);
    return { success: true, data: day };
  } catch (error) {
    console.error("Error getting day:", error);
    return { success: false, error: "Error al cargar el día" };
  }
}

/**
 * Get or create a day (for when user wants to add memories)
 */
export async function getOrCreateDayAction(
  date: string
): Promise<ActionResult<Day>> {
  try {
    const coupleId = await getCurrentCoupleId();
    const day = await getOrCreateDay(coupleId, date);

    revalidatePath(`/dia/${date}`);
    return { success: true, data: day };
  } catch (error) {
    console.error("Error getting/creating day:", error);
    return { success: false, error: "Error al cargar el día" };
  }
}

/**
 * Update day metadata
 */
export async function updateDayAction(
  dayId: string,
  data: {
    title?: string | null;
    description?: string | null;
    location?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    weather?: string | null;
    temperature?: number | null;
    mood?: MoodType | null;
    rating?: number | null;
  }
): Promise<ActionResult<Day>> {
  try {
    await requireCoupleSession();

    const day = await updateDay(BigInt(dayId), data);
    if (!day) {
      return { success: false, error: "Día no encontrado" };
    }

    revalidatePath(`/dia/${day.date}`);
    revalidatePath("/calendario");
    return { success: true, data: day };
  } catch (error) {
    console.error("Error updating day:", error);
    return { success: false, error: "Error al actualizar el día" };
  }
}

/**
 * Set the cover memory for a day
 */
export async function setCoverMemoryAction(
  dayId: string,
  memoryId: string | null
): Promise<ActionResult<Day>> {
  try {
    await requireCoupleSession();

    const day = await setCoverMemory(
      BigInt(dayId),
      memoryId ? BigInt(memoryId) : null
    );
    if (!day) {
      return { success: false, error: "Día no encontrado" };
    }

    revalidatePath(`/dia/${day.date}`);
    revalidatePath(`/memoria/dia/${day.date}`);
    revalidatePath("/memoria");
    return { success: true, data: day };
  } catch (error) {
    console.error("Error setting cover memory:", error);
    return { success: false, error: "Error al establecer la portada" };
  }
}

/**
 * Get recent days with memories (for dashboard)
 */
export async function getRecentDaysAction(
  limit = 10
): Promise<ActionResult<DaySummary[]>> {
  try {
    const coupleId = await getCurrentCoupleId();
    const days = await getRecentDays(coupleId, limit);
    return { success: true, data: days };
  } catch (error) {
    console.error("Error getting recent days:", error);
    return { success: false, error: "Error al cargar días recientes" };
  }
}

/**
 * Update day rating (1-5 stars)
 */
export async function updateDayRatingAction(
  date: string,
  rating: number | null
): Promise<ActionResult<Day>> {
  try {
    const coupleId = await getCurrentCoupleId();

    // Get or create the day first
    const day = await getOrCreateDay(coupleId, date);

    // Update the rating
    const updatedDay = await updateDay(day.id, { rating });
    if (!updatedDay) {
      return { success: false, error: "Día no encontrado" };
    }

    revalidatePath(`/memoria/dia/${date}`);
    return { success: true, data: updatedDay };
  } catch (error) {
    console.error("Error updating day rating:", error);
    return { success: false, error: "Error al actualizar la valoración" };
  }
}
