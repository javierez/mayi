import { db } from "~/server/db";
import { couples, users } from "~/server/db/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";
import type {
  Circle,
  CircleWithMembers,
  CirclePreferences,
  CircleType,
  // Backwards compatibility aliases
  Couple,
  CoupleWithPartners,
  CouplePreferences
} from "~/types/memoria";
import { nanoid } from "nanoid";

/**
 * Map database row to Circle type
 */
function mapToCircle(row: typeof couples.$inferSelect): Circle {
  return {
    id: row.id,
    name: row.name,
    type: (row.type as CircleType) ?? "couple",
    maxMembers: row.maxMembers,
    description: row.description,
    anniversaryDate: row.anniversaryDate,
    inviteCode: row.inviteCode,
    inviteCodeExpiresAt: row.inviteCodeExpiresAt,
    timezone: row.timezone ?? "Europe/Madrid",
    coverImage: row.coverImage,
    emoji: row.emoji,
    preferences: (row.preferences as CirclePreferences) ?? {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    isActive: row.isActive ?? true,
  };
}

/**
 * Get a circle/couple by ID
 */
export async function getCoupleById(coupleId: bigint): Promise<Circle | null> {
  const result = await db
    .select()
    .from(couples)
    .where(and(eq(couples.id, coupleId), eq(couples.isActive, true)))
    .limit(1);

  if (result.length === 0) return null;
  return mapToCircle(result[0]!);
}

// Alias for semantic clarity
export const getCircleById = getCoupleById;

/**
 * Get a circle/couple with all members
 */
export async function getCoupleWithPartners(
  coupleId: bigint
): Promise<CircleWithMembers | null> {
  const circle = await getCoupleById(coupleId);
  if (!circle) return null;

  const members = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      image: users.image,
      birthDate: users.birthDate,
    })
    .from(users)
    .where(and(eq(users.coupleId, coupleId), eq(users.isActive, true)));

  return {
    ...circle,
    members,
    // Backwards compatibility alias
    partners: members,
  } as CircleWithMembers & { partners: typeof members };
}

// Alias for semantic clarity
export const getCircleWithMembers = getCoupleWithPartners;

/**
 * Create a new circle/couple
 */
export async function createCouple(data: {
  name?: string;
  type?: CircleType;
  maxMembers?: number | null;
  description?: string;
  anniversaryDate?: string;
  timezone?: string;
  emoji?: string;
}): Promise<Circle> {
  const inviteCode = nanoid(32);
  const inviteCodeExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const type = data.type ?? "couple";

  const result = await db
    .insert(couples)
    .values({
      name: data.name,
      type,
      maxMembers: data.maxMembers ?? (type === "couple" ? 2 : null),
      description: data.description,
      anniversaryDate: data.anniversaryDate,
      timezone: data.timezone ?? "Europe/Madrid",
      emoji: data.emoji,
      inviteCode,
      inviteCodeExpiresAt,
      preferences: {},
    })
    .returning();

  return mapToCircle(result[0]!);
}

// Alias for semantic clarity
export const createCircle = createCouple;

/**
 * Update circle/couple details
 */
export async function updateCouple(
  coupleId: bigint,
  data: {
    name?: string;
    type?: CircleType;
    maxMembers?: number | null;
    description?: string;
    anniversaryDate?: string;
    timezone?: string;
    coverImage?: string;
    emoji?: string;
    preferences?: CirclePreferences;
  }
): Promise<Circle | null> {
  const result = await db
    .update(couples)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(couples.id, coupleId))
    .returning();

  if (result.length === 0) return null;
  return mapToCircle(result[0]!);
}

// Alias for semantic clarity
export const updateCircle = updateCouple;

/**
 * Generate a new invite code for a couple
 */
export async function generateInviteCode(coupleId: bigint): Promise<string> {
  const inviteCode = nanoid(32);
  const inviteCodeExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db
    .update(couples)
    .set({
      inviteCode,
      inviteCodeExpiresAt,
      updatedAt: new Date(),
    })
    .where(eq(couples.id, coupleId));

  return inviteCode;
}

/**
 * Validate an invite code and return the circle if valid
 */
export async function validateInviteCode(
  code: string
): Promise<{ couple: Circle; partnersCount: number; circle: Circle; membersCount: number } | null> {
  const result = await db
    .select()
    .from(couples)
    .where(and(eq(couples.inviteCode, code), eq(couples.isActive, true)))
    .limit(1);

  if (result.length === 0) return null;

  const row = result[0]!;

  // Check if code is expired
  if (row.inviteCodeExpiresAt && row.inviteCodeExpiresAt < new Date()) {
    return null;
  }

  // Count current members
  const members = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.coupleId, row.id), eq(users.isActive, true)));

  // Check if circle has reached max members (if defined)
  const maxMembers = row.maxMembers;
  if (maxMembers !== null && members.length >= maxMembers) {
    return null;
  }

  const circle = mapToCircle(row);
  return {
    circle,
    membersCount: members.length,
    // Backwards compatibility aliases
    couple: circle,
    partnersCount: members.length,
  };
}

/**
 * Join a user to a circle/couple
 */
export async function joinCouple(
  userId: string,
  coupleId: bigint
): Promise<boolean> {
  // Get circle to check max members
  const circleResult = await db
    .select({ maxMembers: couples.maxMembers })
    .from(couples)
    .where(eq(couples.id, coupleId))
    .limit(1);

  if (circleResult.length === 0) {
    throw new Error("Circle not found");
  }

  const maxMembers = circleResult[0]!.maxMembers;

  // Verify circle has room
  const members = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.coupleId, coupleId), eq(users.isActive, true)));

  if (maxMembers !== null && members.length >= maxMembers) {
    throw new Error("Circle has reached maximum members");
  }

  // Update user's coupleId
  await db
    .update(users)
    .set({
      coupleId,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Clear invite code if circle has reached max members
  if (maxMembers !== null && members.length + 1 >= maxMembers) {
    await db
      .update(couples)
      .set({
        inviteCode: null,
        inviteCodeExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(couples.id, coupleId));
  }

  return true;
}

// Alias for semantic clarity
export const joinCircle = joinCouple;

/**
 * Get the partner of a user in a couple (or other members in a circle)
 */
export async function getPartner(
  coupleId: bigint,
  currentUserId: string
): Promise<{
  id: string;
  firstName: string;
  lastName: string | null;
  image: string | null;
} | null> {
  const result = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      image: users.image,
    })
    .from(users)
    .where(
      and(
        eq(users.coupleId, coupleId),
        eq(users.isActive, true)
      )
    );

  const partner = result.find((u) => u.id !== currentUserId);
  return partner ?? null;
}

// Alias for semantic clarity
export const getOtherMembers = getPartner;

// =============================================================================
// ADMIN FUNCTIONS
// =============================================================================

export interface CircleWithMemberCount extends Circle {
  memberCount: number;
}

/**
 * Get all circles for admin management
 */
export async function getAllCircles(options?: {
  type?: CircleType;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ circles: CircleWithMemberCount[]; total: number }> {
  const { type, includeInactive = false, limit = 50, offset = 0 } = options ?? {};

  // Build conditions
  const conditions = [];
  if (!includeInactive) {
    conditions.push(eq(couples.isActive, true));
  }
  if (type) {
    conditions.push(eq(couples.type, type));
  }

  // Get total count
  const countResult = await db
    .select({ count: count() })
    .from(couples)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  const total = countResult[0]?.count ?? 0;

  // Get circles with member count
  const circlesResult = await db
    .select({
      circle: couples,
      memberCount: sql<number>`(
        SELECT COUNT(*)::int FROM users
        WHERE users.couple_id = ${couples.id}
        AND users.is_active = true
      )`,
    })
    .from(couples)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(couples.createdAt))
    .limit(limit)
    .offset(offset);

  const circlesWithCount: CircleWithMemberCount[] = circlesResult.map((row) => ({
    ...mapToCircle(row.circle),
    memberCount: row.memberCount,
  }));

  return { circles: circlesWithCount, total };
}

/**
 * Get circle statistics for admin dashboard
 */
export async function getCircleStats(): Promise<{
  total: number;
  byType: Record<CircleType, number>;
  activeThisMonth: number;
}> {
  // Total circles
  const totalResult = await db
    .select({ count: count() })
    .from(couples)
    .where(eq(couples.isActive, true));

  // By type
  const byTypeResult = await db
    .select({
      type: couples.type,
      count: count(),
    })
    .from(couples)
    .where(eq(couples.isActive, true))
    .groupBy(couples.type);

  const byType: Record<CircleType, number> = {
    couple: 0,
    friends: 0,
    family: 0,
    group: 0,
  };
  for (const row of byTypeResult) {
    if (row.type && row.type in byType) {
      byType[row.type as CircleType] = row.count;
    }
  }

  // Active this month (created this month)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const activeResult = await db
    .select({ count: count() })
    .from(couples)
    .where(
      and(
        eq(couples.isActive, true),
        sql`${couples.createdAt} >= ${startOfMonth}`
      )
    );

  return {
    total: totalResult[0]?.count ?? 0,
    byType,
    activeThisMonth: activeResult[0]?.count ?? 0,
  };
}

/**
 * Deactivate a circle (soft delete)
 */
export async function deactivateCircle(circleId: bigint): Promise<boolean> {
  const result = await db
    .update(couples)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(couples.id, circleId))
    .returning({ id: couples.id });

  return result.length > 0;
}

/**
 * Reactivate a circle
 */
export async function reactivateCircle(circleId: bigint): Promise<boolean> {
  const result = await db
    .update(couples)
    .set({
      isActive: true,
      updatedAt: new Date(),
    })
    .where(eq(couples.id, circleId))
    .returning({ id: couples.id });

  return result.length > 0;
}

/**
 * Remove a member from a circle
 */
export async function removeMemberFromCircle(
  circleId: bigint,
  userId: string
): Promise<boolean> {
  const result = await db
    .update(users)
    .set({
      coupleId: null,
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, userId), eq(users.coupleId, circleId)))
    .returning({ id: users.id });

  return result.length > 0;
}
