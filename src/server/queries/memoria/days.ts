import { db } from "~/server/db";
import { days, memories } from "~/server/db/schema";
import { eq, and, sql, gte, lte, desc } from "drizzle-orm";
import type { Day, DaySummary, MoodType } from "~/types/memoria";

/**
 * Get days with memory counts for a specific month
 */
export async function getDaysForMonth(
  coupleId: bigint,
  year: number,
  month: number
): Promise<DaySummary[]> {
  // Calculate date range for the month (0-indexed month)
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0]!;

  const result = await db
    .select({
      date: days.date,
      title: days.title,
      memoryCount: sql<number>`count(${memories.id})::int`.as("memoryCount"),
      thumbnailUrl: sql<string | null>`
        COALESCE(
          -- First try cover memory (thumbnail if video, url if photo)
          (SELECT CASE
             WHEN m1.type = 'video' THEN m1.thumbnail_url
             ELSE COALESCE(m1.thumbnail_url, m1.url)
           END
           FROM memories m1
           WHERE m1.id = ${days.coverMemoryId}
             AND m1.is_active = true),
          -- Then try first photo
          (SELECT COALESCE(m2.thumbnail_url, m2.url) FROM memories m2
           WHERE m2.day_id = ${days.id}
             AND m2.is_active = true
             AND m2.type = 'photo'
           ORDER BY m2.position ASC
           LIMIT 1),
          -- Finally try first video thumbnail (NOT the video url)
          (SELECT m3.thumbnail_url FROM memories m3
           WHERE m3.day_id = ${days.id}
             AND m3.is_active = true
             AND m3.type = 'video'
             AND m3.thumbnail_url IS NOT NULL
           ORDER BY m3.position ASC
           LIMIT 1)
        )
      `.as("thumbnailUrl"),
      videoUrl: sql<string | null>`
        -- Get first video URL for client-side thumbnail generation
        (SELECT m4.url FROM memories m4
         WHERE m4.day_id = ${days.id}
           AND m4.is_active = true
           AND m4.type = 'video'
         ORDER BY m4.position ASC
         LIMIT 1)
      `.as("videoUrl"),
    })
    .from(days)
    .leftJoin(
      memories,
      and(eq(memories.dayId, days.id), eq(memories.isActive, true))
    )
    .where(
      and(
        eq(days.coupleId, coupleId),
        eq(days.isActive, true),
        gte(days.date, startDate),
        lte(days.date, endDate)
      )
    )
    .groupBy(days.id, days.date, days.title);

  return result.map((row) => ({
    date: row.date,
    title: row.title,
    memoryCount: row.memoryCount,
    thumbnailUrl: row.thumbnailUrl,
    videoUrl: row.videoUrl,
    hasMilestone: false, // Will be enhanced when milestones are loaded
  }));
}

/**
 * Get a single day by ID
 */
export async function getDayById(dayId: bigint): Promise<Day | null> {
  const result = await db
    .select()
    .from(days)
    .where(and(eq(days.id, dayId), eq(days.isActive, true)))
    .limit(1);

  if (result.length === 0) return null;

  const day = result[0]!;
  return {
    id: day.id,
    coupleId: day.coupleId,
    date: day.date,
    title: day.title,
    description: day.description,
    location: day.location,
    latitude: day.latitude ? parseFloat(day.latitude) : null,
    longitude: day.longitude ? parseFloat(day.longitude) : null,
    weather: day.weather,
    temperature: day.temperature,
    coverMemoryId: day.coverMemoryId,
    mood: day.mood as MoodType | null,
    rating: day.rating,
    createdAt: day.createdAt,
    updatedAt: day.updatedAt,
    isActive: day.isActive ?? true,
  };
}

/**
 * Get a day by date, or create it if it doesn't exist
 */
export async function getOrCreateDay(
  coupleId: bigint,
  date: string
): Promise<Day> {
  // Try to find existing day
  const existing = await db
    .select()
    .from(days)
    .where(
      and(
        eq(days.coupleId, coupleId),
        eq(days.date, date),
        eq(days.isActive, true)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const day = existing[0]!;
    return {
      id: day.id,
      coupleId: day.coupleId,
      date: day.date,
      title: day.title,
      description: day.description,
      location: day.location,
      latitude: day.latitude ? parseFloat(day.latitude) : null,
      longitude: day.longitude ? parseFloat(day.longitude) : null,
      weather: day.weather,
      temperature: day.temperature,
      coverMemoryId: day.coverMemoryId,
      mood: day.mood as MoodType | null,
      rating: day.rating,
      createdAt: day.createdAt,
      updatedAt: day.updatedAt,
      isActive: day.isActive ?? true,
    };
  }

  // Create new day
  const result = await db
    .insert(days)
    .values({
      coupleId,
      date,
    })
    .returning();

  const day = result[0]!;
  return {
    id: day.id,
    coupleId: day.coupleId,
    date: day.date,
    title: day.title,
    description: day.description,
    location: day.location,
    latitude: day.latitude ? parseFloat(day.latitude) : null,
    longitude: day.longitude ? parseFloat(day.longitude) : null,
    weather: day.weather,
    temperature: day.temperature,
    coverMemoryId: day.coverMemoryId,
    mood: day.mood as MoodType | null,
    rating: day.rating,
    createdAt: day.createdAt,
    updatedAt: day.updatedAt,
    isActive: day.isActive ?? true,
  };
}

/**
 * Get a day by date (without creating)
 */
export async function getDayByDate(
  coupleId: bigint,
  date: string
): Promise<Day | null> {
  const result = await db
    .select()
    .from(days)
    .where(
      and(
        eq(days.coupleId, coupleId),
        eq(days.date, date),
        eq(days.isActive, true)
      )
    )
    .limit(1);

  if (result.length === 0) return null;

  const day = result[0]!;
  return {
    id: day.id,
    coupleId: day.coupleId,
    date: day.date,
    title: day.title,
    description: day.description,
    location: day.location,
    latitude: day.latitude ? parseFloat(day.latitude) : null,
    longitude: day.longitude ? parseFloat(day.longitude) : null,
    weather: day.weather,
    temperature: day.temperature,
    coverMemoryId: day.coverMemoryId,
    mood: day.mood as MoodType | null,
    rating: day.rating,
    createdAt: day.createdAt,
    updatedAt: day.updatedAt,
    isActive: day.isActive ?? true,
  };
}

/**
 * Update day metadata
 */
export async function updateDay(
  dayId: bigint,
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
): Promise<Day | null> {
  const result = await db
    .update(days)
    .set({
      ...data,
      latitude: data.latitude?.toString(),
      longitude: data.longitude?.toString(),
      updatedAt: new Date(),
    })
    .where(eq(days.id, dayId))
    .returning();

  if (result.length === 0) return null;

  const day = result[0]!;
  return {
    id: day.id,
    coupleId: day.coupleId,
    date: day.date,
    title: day.title,
    description: day.description,
    location: day.location,
    latitude: day.latitude ? parseFloat(day.latitude) : null,
    longitude: day.longitude ? parseFloat(day.longitude) : null,
    weather: day.weather,
    temperature: day.temperature,
    coverMemoryId: day.coverMemoryId,
    mood: day.mood as MoodType | null,
    rating: day.rating,
    createdAt: day.createdAt,
    updatedAt: day.updatedAt,
    isActive: day.isActive ?? true,
  };
}

/**
 * Set the cover memory for a day
 */
export async function setCoverMemory(
  dayId: bigint,
  memoryId: bigint | null
): Promise<Day | null> {
  const result = await db
    .update(days)
    .set({
      coverMemoryId: memoryId,
      updatedAt: new Date(),
    })
    .where(eq(days.id, dayId))
    .returning();

  if (result.length === 0) return null;

  const day = result[0]!;
  return {
    id: day.id,
    coupleId: day.coupleId,
    date: day.date,
    title: day.title,
    description: day.description,
    location: day.location,
    latitude: day.latitude ? parseFloat(day.latitude) : null,
    longitude: day.longitude ? parseFloat(day.longitude) : null,
    weather: day.weather,
    temperature: day.temperature,
    coverMemoryId: day.coverMemoryId,
    mood: day.mood as MoodType | null,
    rating: day.rating,
    createdAt: day.createdAt,
    updatedAt: day.updatedAt,
    isActive: day.isActive ?? true,
  };
}

/**
 * Get recent days with memories (for dashboard/home)
 */
export async function getRecentDays(
  coupleId: bigint,
  limit = 10
): Promise<DaySummary[]> {
  const result = await db
    .select({
      date: days.date,
      title: days.title,
      memoryCount: sql<number>`count(${memories.id})::int`.as("memoryCount"),
      thumbnailUrl: sql<string | null>`
        COALESCE(
          -- First try cover memory (thumbnail if video, url if photo)
          (SELECT CASE
             WHEN m1.type = 'video' THEN m1.thumbnail_url
             ELSE COALESCE(m1.thumbnail_url, m1.url)
           END
           FROM memories m1
           WHERE m1.id = ${days.coverMemoryId}
             AND m1.is_active = true),
          -- Then try first photo
          (SELECT COALESCE(m2.thumbnail_url, m2.url) FROM memories m2
           WHERE m2.day_id = ${days.id}
             AND m2.is_active = true
             AND m2.type = 'photo'
           ORDER BY m2.position ASC
           LIMIT 1),
          -- Finally try first video thumbnail (NOT the video url)
          (SELECT m3.thumbnail_url FROM memories m3
           WHERE m3.day_id = ${days.id}
             AND m3.is_active = true
             AND m3.type = 'video'
             AND m3.thumbnail_url IS NOT NULL
           ORDER BY m3.position ASC
           LIMIT 1)
        )
      `.as("thumbnailUrl"),
      videoUrl: sql<string | null>`
        -- Get first video URL for client-side thumbnail generation
        (SELECT m4.url FROM memories m4
         WHERE m4.day_id = ${days.id}
           AND m4.is_active = true
           AND m4.type = 'video'
         ORDER BY m4.position ASC
         LIMIT 1)
      `.as("videoUrl"),
    })
    .from(days)
    .leftJoin(
      memories,
      and(eq(memories.dayId, days.id), eq(memories.isActive, true))
    )
    .where(and(eq(days.coupleId, coupleId), eq(days.isActive, true)))
    .groupBy(days.id, days.date, days.title)
    .having(sql`count(${memories.id}) > 0`)
    .orderBy(desc(days.date))
    .limit(limit);

  return result.map((row) => ({
    date: row.date,
    title: row.title,
    memoryCount: row.memoryCount,
    thumbnailUrl: row.thumbnailUrl,
    videoUrl: row.videoUrl,
    hasMilestone: false,
  }));
}

/**
 * Delete a day (soft delete)
 */
export async function deleteDay(dayId: bigint): Promise<boolean> {
  await db
    .update(days)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(days.id, dayId));

  return true;
}
