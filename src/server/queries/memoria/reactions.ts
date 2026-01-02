import { db } from "~/server/db";
import { reactions, users } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import type { Reaction, ReactionEmoji } from "~/types/memoria";

/**
 * Get all reactions for a memory
 */
export async function getReactionsForMemory(
  memoryId: bigint
): Promise<Reaction[]> {
  const result = await db
    .select({
      id: reactions.id,
      memoryId: reactions.memoryId,
      userId: reactions.userId,
      emoji: reactions.emoji,
      createdAt: reactions.createdAt,
      user: {
        id: users.id,
        firstName: users.firstName,
        image: users.image,
      },
    })
    .from(reactions)
    .innerJoin(users, eq(users.id, reactions.userId))
    .where(eq(reactions.memoryId, memoryId));

  return result.map((row) => ({
    id: row.id,
    memoryId: row.memoryId,
    userId: row.userId,
    emoji: row.emoji as ReactionEmoji,
    createdAt: row.createdAt,
    user: row.user,
  }));
}

/**
 * Get a user's reaction on a memory
 */
export async function getUserReaction(
  memoryId: bigint,
  userId: string
): Promise<Reaction | null> {
  const result = await db
    .select()
    .from(reactions)
    .where(and(eq(reactions.memoryId, memoryId), eq(reactions.userId, userId)))
    .limit(1);

  if (result.length === 0) return null;

  const row = result[0]!;
  return {
    id: row.id,
    memoryId: row.memoryId,
    userId: row.userId,
    emoji: row.emoji as ReactionEmoji,
    createdAt: row.createdAt,
  };
}

/**
 * Add or update a reaction
 */
export async function addReaction(
  memoryId: bigint,
  userId: string,
  emoji: ReactionEmoji
): Promise<Reaction> {
  // Check if user already has a reaction on this memory
  const existing = await getUserReaction(memoryId, userId);

  if (existing) {
    // Update existing reaction
    const result = await db
      .update(reactions)
      .set({ emoji })
      .where(eq(reactions.id, existing.id))
      .returning();

    const row = result[0]!;
    return {
      id: row.id,
      memoryId: row.memoryId,
      userId: row.userId,
      emoji: row.emoji as ReactionEmoji,
      createdAt: row.createdAt,
    };
  } else {
    // Create new reaction
    const result = await db
      .insert(reactions)
      .values({
        memoryId,
        userId,
        emoji,
      })
      .returning();

    const row = result[0]!;
    return {
      id: row.id,
      memoryId: row.memoryId,
      userId: row.userId,
      emoji: row.emoji as ReactionEmoji,
      createdAt: row.createdAt,
    };
  }
}

/**
 * Remove a reaction
 */
export async function removeReaction(
  memoryId: bigint,
  userId: string
): Promise<boolean> {
  await db
    .delete(reactions)
    .where(and(eq(reactions.memoryId, memoryId), eq(reactions.userId, userId)));

  return true;
}

/**
 * Toggle a reaction (add if not exists, update if different, remove if same)
 */
export async function toggleReaction(
  memoryId: bigint,
  userId: string,
  emoji: ReactionEmoji
): Promise<{ added: boolean; reaction?: Reaction }> {
  const existing = await getUserReaction(memoryId, userId);

  if (existing) {
    if (existing.emoji === emoji) {
      // Same emoji - remove reaction
      await removeReaction(memoryId, userId);
      return { added: false };
    } else {
      // Different emoji - update
      const reaction = await addReaction(memoryId, userId, emoji);
      return { added: true, reaction };
    }
  } else {
    // No existing reaction - add
    const reaction = await addReaction(memoryId, userId, emoji);
    return { added: true, reaction };
  }
}

/**
 * Get reaction counts grouped by emoji for a memory
 */
export async function getReactionCounts(
  memoryId: bigint
): Promise<Record<ReactionEmoji, number>> {
  const allReactions = await getReactionsForMemory(memoryId);

  const counts: Record<ReactionEmoji, number> = {
    "❤️": 0,
    "😂": 0,
    "😍": 0,
    "🥺": 0,
    "🔥": 0,
  };

  for (const reaction of allReactions) {
    if (counts[reaction.emoji] !== undefined) {
      counts[reaction.emoji]++;
    }
  }

  return counts;
}
