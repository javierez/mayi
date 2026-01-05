import { db } from "~/server/db";
import { memories, users, reactions, comments, days } from "~/server/db/schema";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import type {
  Memory,
  MemoryWithUser,
  MemoryType,
  SongData,
  LocationData,
} from "~/types/memoria";

/**
 * Map a database row to a Memory type
 */
function mapRowToMemory(row: typeof memories.$inferSelect): Memory {
  const base = {
    id: row.id,
    dayId: row.dayId,
    userId: row.userId,
    caption: row.caption,
    isPrivate: row.isPrivate ?? false,
    position: row.position,
    takenAt: row.takenAt,
    deviceInfo: row.deviceInfo,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    isActive: row.isActive ?? true,
  };

  switch (row.type as MemoryType) {
    case "photo":
      return {
        ...base,
        type: "photo",
        url: row.url!,
        thumbnailUrl: row.thumbnailUrl,
        s3Key: row.s3Key,
        mimeType: row.mimeType,
        fileSize: row.fileSize,
        width: row.width,
        height: row.height,
        latitude: row.latitude ? parseFloat(row.latitude) : null,
        longitude: row.longitude ? parseFloat(row.longitude) : null,
      };
    case "video":
      return {
        ...base,
        type: "video",
        url: row.url!,
        compressedUrl: row.compressedUrl,
        thumbnailUrl: row.thumbnailUrl,
        s3Key: row.s3Key,
        compressedS3Key: row.compressedS3Key,
        mimeType: row.mimeType,
        fileSize: row.fileSize,
        compressedFileSize: row.compressedFileSize,
        width: row.width,
        height: row.height,
        duration: row.duration,
        latitude: row.latitude ? parseFloat(row.latitude) : null,
        longitude: row.longitude ? parseFloat(row.longitude) : null,
      };
    case "note":
      return {
        ...base,
        type: "note",
        content: row.content!,
      };
    case "voice":
      return {
        ...base,
        type: "voice",
        url: row.url!,
        s3Key: row.s3Key,
        mimeType: row.mimeType,
        fileSize: row.fileSize,
        duration: row.duration,
      };
    case "song":
      return {
        ...base,
        type: "song",
        songData: row.songData as SongData,
      };
    case "location":
      return {
        ...base,
        type: "location",
        locationData: row.locationData as LocationData,
      };
    case "quote":
      return {
        ...base,
        type: "quote",
        content: row.content!,
      };
    default:
      throw new Error(`Unknown memory type: ${row.type}`);
  }
}

/**
 * Get all memories for a day with user info and interaction counts
 */
export async function getMemoriesForDay(
  dayId: bigint,
  currentUserId: string
): Promise<MemoryWithUser[]> {
  const result = await db
    .select({
      memory: memories,
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        image: users.image,
      },
      reactionsCount: sql<number>`(
        SELECT count(*) FROM ${reactions}
        WHERE ${reactions.memoryId} = ${memories.id}
      )::int`.as("reactionsCount"),
      commentsCount: sql<number>`(
        SELECT count(*) FROM ${comments}
        WHERE ${comments.memoryId} = ${memories.id}
          AND ${comments.isDeleted} = false
      )::int`.as("commentsCount"),
      userReaction: sql<string | null>`(
        SELECT ${reactions.emoji} FROM ${reactions}
        WHERE ${reactions.memoryId} = ${memories.id}
          AND ${reactions.userId} = ${currentUserId}
        LIMIT 1
      )`.as("userReaction"),
    })
    .from(memories)
    .innerJoin(users, eq(users.id, memories.userId))
    .where(
      and(
        eq(memories.dayId, dayId),
        eq(memories.isActive, true),
        // Show all memories except private ones from other users
        sql`(${memories.isPrivate} = false OR ${memories.userId} = ${currentUserId})`
      )
    )
    .orderBy(asc(memories.position), asc(memories.createdAt));

  return result.map((row) => ({
    ...mapRowToMemory(row.memory),
    user: row.user,
    reactionsCount: row.reactionsCount,
    commentsCount: row.commentsCount,
    userReaction: row.userReaction,
  }));
}

/**
 * Get a single memory by ID
 */
export async function getMemoryById(memoryId: bigint): Promise<Memory | null> {
  const result = await db
    .select()
    .from(memories)
    .where(and(eq(memories.id, memoryId), eq(memories.isActive, true)))
    .limit(1);

  if (result.length === 0) return null;
  return mapRowToMemory(result[0]!);
}

/**
 * Get a single memory with user info
 */
export async function getMemoryWithUser(
  memoryId: bigint,
  currentUserId: string
): Promise<MemoryWithUser | null> {
  const result = await db
    .select({
      memory: memories,
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        image: users.image,
      },
      reactionsCount: sql<number>`(
        SELECT count(*) FROM ${reactions}
        WHERE ${reactions.memoryId} = ${memories.id}
      )::int`.as("reactionsCount"),
      commentsCount: sql<number>`(
        SELECT count(*) FROM ${comments}
        WHERE ${comments.memoryId} = ${memories.id}
          AND ${comments.isDeleted} = false
      )::int`.as("commentsCount"),
      userReaction: sql<string | null>`(
        SELECT ${reactions.emoji} FROM ${reactions}
        WHERE ${reactions.memoryId} = ${memories.id}
          AND ${reactions.userId} = ${currentUserId}
        LIMIT 1
      )`.as("userReaction"),
    })
    .from(memories)
    .innerJoin(users, eq(users.id, memories.userId))
    .where(and(eq(memories.id, memoryId), eq(memories.isActive, true)))
    .limit(1);

  if (result.length === 0) return null;

  const row = result[0]!;
  return {
    ...mapRowToMemory(row.memory),
    user: row.user,
    reactionsCount: row.reactionsCount,
    commentsCount: row.commentsCount,
    userReaction: row.userReaction,
  };
}

/**
 * Create a photo memory
 */
export async function createPhotoMemory(data: {
  dayId: bigint;
  userId: string;
  url: string;
  thumbnailUrl?: string;
  s3Key?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  caption?: string;
  isPrivate?: boolean;
  takenAt?: Date;
  deviceInfo?: string;
  // GPS coordinates from EXIF
  latitude?: number;
  longitude?: number;
}): Promise<Memory> {
  // Get next position
  const positionResult = await db
    .select({ maxPosition: sql<number>`COALESCE(MAX(${memories.position}), -1)` })
    .from(memories)
    .where(and(eq(memories.dayId, data.dayId), eq(memories.isActive, true)));
  const nextPosition = (positionResult[0]?.maxPosition ?? -1) + 1;

  const result = await db
    .insert(memories)
    .values({
      dayId: data.dayId,
      userId: data.userId,
      type: "photo",
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
      s3Key: data.s3Key,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      width: data.width,
      height: data.height,
      caption: data.caption,
      isPrivate: data.isPrivate ?? false,
      position: nextPosition,
      takenAt: data.takenAt,
      deviceInfo: data.deviceInfo,
      latitude: data.latitude?.toString(),
      longitude: data.longitude?.toString(),
    })
    .returning();

  return mapRowToMemory(result[0]!);
}

/**
 * Create a video memory
 */
export async function createVideoMemory(data: {
  dayId: bigint;
  userId: string;
  url: string;
  thumbnailUrl?: string;
  s3Key?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
  caption?: string;
  isPrivate?: boolean;
  takenAt?: Date;
  // GPS coordinates from video metadata
  latitude?: number;
  longitude?: number;
}): Promise<Memory> {
  const positionResult = await db
    .select({ maxPosition: sql<number>`COALESCE(MAX(${memories.position}), -1)` })
    .from(memories)
    .where(and(eq(memories.dayId, data.dayId), eq(memories.isActive, true)));
  const nextPosition = (positionResult[0]?.maxPosition ?? -1) + 1;

  const result = await db
    .insert(memories)
    .values({
      dayId: data.dayId,
      userId: data.userId,
      type: "video",
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
      s3Key: data.s3Key,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      width: data.width,
      height: data.height,
      duration: data.duration,
      caption: data.caption,
      isPrivate: data.isPrivate ?? false,
      position: nextPosition,
      takenAt: data.takenAt,
      latitude: data.latitude?.toString(),
      longitude: data.longitude?.toString(),
    })
    .returning();

  return mapRowToMemory(result[0]!);
}

/**
 * Create a note memory
 */
export async function createNoteMemory(data: {
  dayId: bigint;
  userId: string;
  content: string;
  caption?: string;
  isPrivate?: boolean;
}): Promise<Memory> {
  const positionResult = await db
    .select({ maxPosition: sql<number>`COALESCE(MAX(${memories.position}), -1)` })
    .from(memories)
    .where(and(eq(memories.dayId, data.dayId), eq(memories.isActive, true)));
  const nextPosition = (positionResult[0]?.maxPosition ?? -1) + 1;

  const result = await db
    .insert(memories)
    .values({
      dayId: data.dayId,
      userId: data.userId,
      type: "note",
      content: data.content,
      caption: data.caption,
      isPrivate: data.isPrivate ?? false,
      position: nextPosition,
    })
    .returning();

  return mapRowToMemory(result[0]!);
}

/**
 * Create a song memory
 */
export async function createSongMemory(data: {
  dayId: bigint;
  userId: string;
  songData: SongData;
  caption?: string;
  isPrivate?: boolean;
}): Promise<Memory> {
  const positionResult = await db
    .select({ maxPosition: sql<number>`COALESCE(MAX(${memories.position}), -1)` })
    .from(memories)
    .where(and(eq(memories.dayId, data.dayId), eq(memories.isActive, true)));
  const nextPosition = (positionResult[0]?.maxPosition ?? -1) + 1;

  const result = await db
    .insert(memories)
    .values({
      dayId: data.dayId,
      userId: data.userId,
      type: "song",
      songData: data.songData,
      caption: data.caption,
      isPrivate: data.isPrivate ?? false,
      position: nextPosition,
    })
    .returning();

  return mapRowToMemory(result[0]!);
}

/**
 * Create a location memory
 */
export async function createLocationMemory(data: {
  dayId: bigint;
  userId: string;
  locationData: LocationData;
  caption?: string;
  isPrivate?: boolean;
}): Promise<Memory> {
  const positionResult = await db
    .select({ maxPosition: sql<number>`COALESCE(MAX(${memories.position}), -1)` })
    .from(memories)
    .where(and(eq(memories.dayId, data.dayId), eq(memories.isActive, true)));
  const nextPosition = (positionResult[0]?.maxPosition ?? -1) + 1;

  const result = await db
    .insert(memories)
    .values({
      dayId: data.dayId,
      userId: data.userId,
      type: "location",
      locationData: data.locationData,
      caption: data.caption,
      isPrivate: data.isPrivate ?? false,
      position: nextPosition,
    })
    .returning();

  return mapRowToMemory(result[0]!);
}

/**
 * Create a quote memory
 */
export async function createQuoteMemory(data: {
  dayId: bigint;
  userId: string;
  content: string; // The quote text
  caption?: string; // Attribution (who said it)
  isPrivate?: boolean;
}): Promise<Memory> {
  const positionResult = await db
    .select({ maxPosition: sql<number>`COALESCE(MAX(${memories.position}), -1)` })
    .from(memories)
    .where(and(eq(memories.dayId, data.dayId), eq(memories.isActive, true)));
  const nextPosition = (positionResult[0]?.maxPosition ?? -1) + 1;

  const result = await db
    .insert(memories)
    .values({
      dayId: data.dayId,
      userId: data.userId,
      type: "quote",
      content: data.content,
      caption: data.caption, // Used as attribution
      isPrivate: data.isPrivate ?? false,
      position: nextPosition,
    })
    .returning();

  return mapRowToMemory(result[0]!);
}

/**
 * Update a memory
 */
export async function updateMemory(
  memoryId: bigint,
  data: {
    caption?: string | null;
    isPrivate?: boolean;
    content?: string;
    songData?: SongData;
    locationData?: LocationData;
  }
): Promise<Memory | null> {
  const result = await db
    .update(memories)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(memories.id, memoryId))
    .returning();

  if (result.length === 0) return null;
  return mapRowToMemory(result[0]!);
}

/**
 * Delete a memory (soft delete)
 */
export async function deleteMemory(memoryId: bigint): Promise<boolean> {
  await db
    .update(memories)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(memories.id, memoryId));

  return true;
}

/**
 * Reorder memories in a day
 */
export async function reorderMemories(
  dayId: bigint,
  positions: { memoryId: bigint; position: number }[]
): Promise<boolean> {
  // Update each memory's position
  for (const { memoryId, position } of positions) {
    await db
      .update(memories)
      .set({ position, updatedAt: new Date() })
      .where(and(eq(memories.id, memoryId), eq(memories.dayId, dayId)));
  }

  return true;
}

/**
 * Get recent memories across all days (for home/dashboard)
 */
export async function getRecentMemories(
  coupleId: bigint,
  currentUserId: string,
  limit = 20
): Promise<MemoryWithUser[]> {
  const result = await db
    .select({
      memory: memories,
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        image: users.image,
      },
      reactionsCount: sql<number>`(
        SELECT count(*) FROM ${reactions}
        WHERE ${reactions.memoryId} = ${memories.id}
      )::int`.as("reactionsCount"),
      commentsCount: sql<number>`(
        SELECT count(*) FROM ${comments}
        WHERE ${comments.memoryId} = ${memories.id}
          AND ${comments.isDeleted} = false
      )::int`.as("commentsCount"),
      userReaction: sql<string | null>`(
        SELECT ${reactions.emoji} FROM ${reactions}
        WHERE ${reactions.memoryId} = ${memories.id}
          AND ${reactions.userId} = ${currentUserId}
        LIMIT 1
      )`.as("userReaction"),
    })
    .from(memories)
    .innerJoin(users, eq(users.id, memories.userId))
    .innerJoin(days, eq(days.id, memories.dayId))
    .where(
      and(
        eq(days.coupleId, coupleId),
        eq(memories.isActive, true),
        sql`(${memories.isPrivate} = false OR ${memories.userId} = ${currentUserId})`
      )
    )
    .orderBy(desc(memories.createdAt))
    .limit(limit);

  return result.map((row) => ({
    ...mapRowToMemory(row.memory),
    user: row.user,
    reactionsCount: row.reactionsCount,
    commentsCount: row.commentsCount,
    userReaction: row.userReaction,
  }));
}

/**
 * Check if a memory belongs to a specific couple
 */
export async function verifyMemoryBelongsToCouple(
  memoryId: bigint,
  coupleId: bigint
): Promise<boolean> {
  const result = await db
    .select({ id: memories.id })
    .from(memories)
    .innerJoin(days, eq(days.id, memories.dayId))
    .where(
      and(
        eq(memories.id, memoryId),
        eq(days.coupleId, coupleId),
        eq(memories.isActive, true)
      )
    )
    .limit(1);

  return result.length > 0;
}

/**
 * Check if a user can modify a memory (owner only)
 */
export async function canUserModifyMemory(
  memoryId: bigint,
  userId: string
): Promise<boolean> {
  const result = await db
    .select({ userId: memories.userId })
    .from(memories)
    .where(and(eq(memories.id, memoryId), eq(memories.isActive, true)))
    .limit(1);

  return result.length > 0 && result[0]!.userId === userId;
}
