import { db } from "~/server/db";
import { memories, users, days } from "~/server/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import type { LocationData, LocationMemoryForMap } from "~/types/memoria";

/**
 * Get all location memories for a couple (for map view)
 */
export async function getAllLocationMemories(
  coupleId: bigint,
  currentUserId: string
): Promise<LocationMemoryForMap[]> {
  const result = await db
    .select({
      id: memories.id,
      dayId: memories.dayId,
      locationData: memories.locationData,
      caption: memories.caption,
      createdAt: memories.createdAt,
      date: days.date,
      dayTitle: days.title,
      userId: users.id,
      userFirstName: users.firstName,
      userImage: users.image,
    })
    .from(memories)
    .innerJoin(days, eq(days.id, memories.dayId))
    .innerJoin(users, eq(users.id, memories.userId))
    .where(
      and(
        eq(days.coupleId, coupleId),
        eq(memories.type, "location"),
        eq(memories.isActive, true),
        // Privacy filter: show all non-private + own private
        sql`(${memories.isPrivate} = false OR ${memories.userId} = ${currentUserId})`
      )
    )
    .orderBy(desc(days.date), desc(memories.createdAt));

  // Get thumbnail from the same day (first photo/video)
  const locationsWithThumbnails = await Promise.all(
    result.map(async (row) => {
      // Try to get a thumbnail from same day
      const thumbnail = await db
        .select({
          url: memories.url,
          thumbnailUrl: memories.thumbnailUrl,
        })
        .from(memories)
        .where(
          and(
            eq(memories.dayId, row.dayId),
            eq(memories.isActive, true),
            sql`${memories.type} IN ('photo', 'video')`,
            sql`(${memories.isPrivate} = false OR ${memories.userId} = ${currentUserId})`
          )
        )
        .orderBy(memories.position)
        .limit(1);

      const locationData = row.locationData as LocationData;

      return {
        id: row.id.toString(),
        dayId: row.dayId.toString(),
        date: row.date,
        dayTitle: row.dayTitle,
        locationData,
        caption: row.caption,
        thumbnailUrl: thumbnail[0]?.thumbnailUrl ?? thumbnail[0]?.url ?? locationData.photoUrl ?? null,
        user: {
          id: row.userId,
          firstName: row.userFirstName,
          image: row.userImage,
        },
        createdAt: row.createdAt.toISOString(),
      };
    })
  );

  return locationsWithThumbnails;
}
