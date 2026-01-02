import { db } from "~/server/db";
import { milestones } from "~/server/db/schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import type { Milestone, MilestoneWithNextDate, RecurrenceType } from "~/types/memoria";

/**
 * Calculate the next occurrence of a milestone
 */
function getNextMilestoneDate(
  originalDate: string,
  recurrence: RecurrenceType
): { nextDate: string; daysUntil: number; yearsAgo?: number } {
  const original = new Date(originalDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (recurrence === "once") {
    const diff = Math.ceil(
      (original.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      nextDate: originalDate,
      daysUntil: diff,
    };
  }

  // For yearly recurrence
  if (recurrence === "yearly") {
    const thisYear = today.getFullYear();
    let nextOccurrence = new Date(
      thisYear,
      original.getMonth(),
      original.getDate()
    );

    // If this year's occurrence has passed, use next year's
    if (nextOccurrence < today) {
      nextOccurrence = new Date(
        thisYear + 1,
        original.getMonth(),
        original.getDate()
      );
    }

    const yearsAgo = nextOccurrence.getFullYear() - original.getFullYear();
    const diff = Math.ceil(
      (nextOccurrence.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      nextDate: nextOccurrence.toISOString().split("T")[0]!,
      daysUntil: diff,
      yearsAgo,
    };
  }

  // For monthly recurrence
  if (recurrence === "monthly") {
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    let nextOccurrence = new Date(thisYear, thisMonth, original.getDate());

    // If this month's occurrence has passed, use next month's
    if (nextOccurrence < today) {
      nextOccurrence = new Date(thisYear, thisMonth + 1, original.getDate());
    }

    const diff = Math.ceil(
      (nextOccurrence.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      nextDate: nextOccurrence.toISOString().split("T")[0]!,
      daysUntil: diff,
    };
  }

  // Default fallback
  return {
    nextDate: originalDate,
    daysUntil: 0,
  };
}

/**
 * Map a database row to a Milestone type
 */
function mapRowToMilestone(row: typeof milestones.$inferSelect): Milestone {
  return {
    id: row.id,
    coupleId: row.coupleId,
    title: row.title,
    description: row.description,
    originalDate: row.originalDate,
    icon: row.icon,
    recurrence: (row.recurrence ?? "yearly") as RecurrenceType,
    reminderDaysBefore: row.reminderDaysBefore ?? 7,
    color: row.color,
    isPublic: row.isPublic ?? true,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    isActive: row.isActive ?? true,
  };
}

/**
 * Get all milestones for a couple
 */
export async function getMilestones(coupleId: bigint): Promise<MilestoneWithNextDate[]> {
  const result = await db
    .select()
    .from(milestones)
    .where(and(eq(milestones.coupleId, coupleId), eq(milestones.isActive, true)))
    .orderBy(asc(milestones.originalDate));

  return result.map((row) => {
    const milestone = mapRowToMilestone(row);
    const { nextDate, daysUntil, yearsAgo } = getNextMilestoneDate(
      milestone.originalDate,
      milestone.recurrence
    );
    return {
      ...milestone,
      nextDate,
      daysUntil,
      yearsAgo,
    };
  });
}

/**
 * Get upcoming milestones within a number of days
 */
export async function getUpcomingMilestones(
  coupleId: bigint,
  daysAhead = 30
): Promise<MilestoneWithNextDate[]> {
  const all = await getMilestones(coupleId);
  return all
    .filter((m) => m.daysUntil >= 0 && m.daysUntil <= daysAhead)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

/**
 * Get milestones for a specific date
 */
export async function getMilestonesForDate(
  coupleId: bigint,
  date: string
): Promise<MilestoneWithNextDate[]> {
  const all = await getMilestones(coupleId);
  return all.filter((m) => m.nextDate === date);
}

/**
 * Get milestones for a month (for calendar display)
 */
export async function getMilestonesForMonth(
  coupleId: bigint,
  year: number,
  month: number
): Promise<MilestoneWithNextDate[]> {
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0]!;

  const all = await getMilestones(coupleId);
  return all.filter((m) => m.nextDate >= startDate && m.nextDate <= endDate);
}

/**
 * Get a single milestone by ID
 */
export async function getMilestoneById(milestoneId: bigint): Promise<Milestone | null> {
  const result = await db
    .select()
    .from(milestones)
    .where(and(eq(milestones.id, milestoneId), eq(milestones.isActive, true)))
    .limit(1);

  if (result.length === 0) return null;
  return mapRowToMilestone(result[0]!);
}

/**
 * Create a new milestone
 */
export async function createMilestone(data: {
  coupleId: bigint;
  title: string;
  description?: string;
  originalDate: string;
  icon?: string;
  recurrence?: RecurrenceType;
  reminderDaysBefore?: number;
  color?: string;
}): Promise<Milestone> {
  const result = await db
    .insert(milestones)
    .values({
      coupleId: data.coupleId,
      title: data.title,
      description: data.description,
      originalDate: data.originalDate,
      icon: data.icon,
      recurrence: data.recurrence ?? "yearly",
      reminderDaysBefore: data.reminderDaysBefore ?? 7,
      color: data.color,
    })
    .returning();

  return mapRowToMilestone(result[0]!);
}

/**
 * Update a milestone
 */
export async function updateMilestone(
  milestoneId: bigint,
  data: {
    title?: string;
    description?: string | null;
    originalDate?: string;
    icon?: string | null;
    recurrence?: RecurrenceType;
    reminderDaysBefore?: number;
    color?: string | null;
  }
): Promise<Milestone | null> {
  const result = await db
    .update(milestones)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(milestones.id, milestoneId))
    .returning();

  if (result.length === 0) return null;
  return mapRowToMilestone(result[0]!);
}

/**
 * Delete a milestone (soft delete)
 */
export async function deleteMilestone(milestoneId: bigint): Promise<boolean> {
  await db
    .update(milestones)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(milestones.id, milestoneId));

  return true;
}

/**
 * Check if a milestone belongs to a couple
 */
export async function verifyMilestoneBelongsToCouple(
  milestoneId: bigint,
  coupleId: bigint
): Promise<boolean> {
  const result = await db
    .select({ id: milestones.id })
    .from(milestones)
    .where(
      and(
        eq(milestones.id, milestoneId),
        eq(milestones.coupleId, coupleId),
        eq(milestones.isActive, true)
      )
    )
    .limit(1);

  return result.length > 0;
}

/**
 * Get milestones that need reminders today
 */
export async function getMilestonesNeedingReminders(
  coupleId: bigint
): Promise<MilestoneWithNextDate[]> {
  const all = await getMilestones(coupleId);
  return all.filter((m) => m.daysUntil === m.reminderDaysBefore);
}
