import { db } from "~/server/db";
import { couples, users } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import type { Couple, CoupleWithPartners, CouplePreferences } from "~/types/memoria";
import { nanoid } from "nanoid";

/**
 * Get a couple by ID
 */
export async function getCoupleById(coupleId: bigint): Promise<Couple | null> {
  const result = await db
    .select()
    .from(couples)
    .where(and(eq(couples.id, coupleId), eq(couples.isActive, true)))
    .limit(1);

  if (result.length === 0) return null;

  const couple = result[0]!;
  return {
    id: couple.id,
    name: couple.name,
    anniversaryDate: couple.anniversaryDate,
    inviteCode: couple.inviteCode,
    inviteCodeExpiresAt: couple.inviteCodeExpiresAt,
    timezone: couple.timezone ?? "Europe/Madrid",
    preferences: (couple.preferences as CouplePreferences) ?? {},
    createdAt: couple.createdAt,
    updatedAt: couple.updatedAt,
    isActive: couple.isActive ?? true,
  };
}

/**
 * Get a couple with both partners
 */
export async function getCoupleWithPartners(
  coupleId: bigint
): Promise<CoupleWithPartners | null> {
  const couple = await getCoupleById(coupleId);
  if (!couple) return null;

  const partners = await db
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
    ...couple,
    partners,
  };
}

/**
 * Create a new couple
 */
export async function createCouple(data: {
  name?: string;
  anniversaryDate?: string;
  timezone?: string;
}): Promise<Couple> {
  const inviteCode = nanoid(32);
  const inviteCodeExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const result = await db
    .insert(couples)
    .values({
      name: data.name,
      anniversaryDate: data.anniversaryDate,
      timezone: data.timezone ?? "Europe/Madrid",
      inviteCode,
      inviteCodeExpiresAt,
      preferences: {},
    })
    .returning();

  const couple = result[0]!;
  return {
    id: couple.id,
    name: couple.name,
    anniversaryDate: couple.anniversaryDate,
    inviteCode: couple.inviteCode,
    inviteCodeExpiresAt: couple.inviteCodeExpiresAt,
    timezone: couple.timezone ?? "Europe/Madrid",
    preferences: (couple.preferences as CouplePreferences) ?? {},
    createdAt: couple.createdAt,
    updatedAt: couple.updatedAt,
    isActive: couple.isActive ?? true,
  };
}

/**
 * Update couple details
 */
export async function updateCouple(
  coupleId: bigint,
  data: {
    name?: string;
    anniversaryDate?: string;
    timezone?: string;
    preferences?: CouplePreferences;
  }
): Promise<Couple | null> {
  const result = await db
    .update(couples)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(couples.id, coupleId))
    .returning();

  if (result.length === 0) return null;

  const couple = result[0]!;
  return {
    id: couple.id,
    name: couple.name,
    anniversaryDate: couple.anniversaryDate,
    inviteCode: couple.inviteCode,
    inviteCodeExpiresAt: couple.inviteCodeExpiresAt,
    timezone: couple.timezone ?? "Europe/Madrid",
    preferences: (couple.preferences as CouplePreferences) ?? {},
    createdAt: couple.createdAt,
    updatedAt: couple.updatedAt,
    isActive: couple.isActive ?? true,
  };
}

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
 * Validate an invite code and return the couple if valid
 */
export async function validateInviteCode(
  code: string
): Promise<{ couple: Couple; partnersCount: number } | null> {
  const result = await db
    .select()
    .from(couples)
    .where(and(eq(couples.inviteCode, code), eq(couples.isActive, true)))
    .limit(1);

  if (result.length === 0) return null;

  const couple = result[0]!;

  // Check if code is expired
  if (couple.inviteCodeExpiresAt && couple.inviteCodeExpiresAt < new Date()) {
    return null;
  }

  // Count current partners
  const partners = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.coupleId, couple.id), eq(users.isActive, true)));

  // A couple can only have 2 partners
  if (partners.length >= 2) {
    return null;
  }

  return {
    couple: {
      id: couple.id,
      name: couple.name,
      anniversaryDate: couple.anniversaryDate,
      inviteCode: couple.inviteCode,
      inviteCodeExpiresAt: couple.inviteCodeExpiresAt,
      timezone: couple.timezone ?? "Europe/Madrid",
      preferences: (couple.preferences as CouplePreferences) ?? {},
      createdAt: couple.createdAt,
      updatedAt: couple.updatedAt,
      isActive: couple.isActive ?? true,
    },
    partnersCount: partners.length,
  };
}

/**
 * Join a user to a couple
 */
export async function joinCouple(
  userId: string,
  coupleId: bigint
): Promise<boolean> {
  // Verify couple exists and has room
  const partners = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.coupleId, coupleId), eq(users.isActive, true)));

  if (partners.length >= 2) {
    throw new Error("Couple already has two partners");
  }

  // Update user's coupleId
  await db
    .update(users)
    .set({
      coupleId,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Clear invite code if couple now has 2 partners
  if (partners.length === 1) {
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

/**
 * Get the partner of a user in a couple
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
