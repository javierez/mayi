import { db } from "~/server/db";
import { memories, users, days } from "~/server/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import type { LocationData, LocationMemoryForMap, GeotaggedMemoryForMap } from "~/types/memoria";

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

/**
 * Get all geotagged memories for a couple (locations + photos/videos with GPS)
 * This combines:
 * - Location memories (with their locationData.lat/lng)
 * - Photo memories with latitude/longitude from EXIF
 * - Video memories with latitude/longitude from metadata
 */
export async function getAllGeotaggedMemories(
  coupleId: bigint,
  currentUserId: string
): Promise<GeotaggedMemoryForMap[]> {
  const result = await db
    .select({
      id: memories.id,
      dayId: memories.dayId,
      type: memories.type,
      locationData: memories.locationData,
      latitude: memories.latitude,
      longitude: memories.longitude,
      url: memories.url,
      thumbnailUrl: memories.thumbnailUrl,
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
        eq(memories.isActive, true),
        // Include: location memories OR photos/videos with GPS coordinates
        sql`(
          ${memories.type} = 'location'
          OR (
            ${memories.type} IN ('photo', 'video')
            AND ${memories.latitude} IS NOT NULL
            AND ${memories.longitude} IS NOT NULL
          )
        )`,
        // Privacy filter
        sql`(${memories.isPrivate} = false OR ${memories.userId} = ${currentUserId})`
      )
    )
    .orderBy(desc(days.date), desc(memories.createdAt));

  return result.map((row) => {
    const base = {
      id: row.id.toString(),
      dayId: row.dayId.toString(),
      date: row.date,
      dayTitle: row.dayTitle,
      caption: row.caption,
      user: {
        id: row.userId,
        firstName: row.userFirstName,
        image: row.userImage,
      },
      createdAt: row.createdAt.toISOString(),
    };

    if (row.type === "location") {
      const locationData = row.locationData as LocationData;
      return {
        ...base,
        type: "location" as const,
        latitude: locationData.lat,
        longitude: locationData.lng,
        locationData,
        url: null,
        thumbnailUrl: locationData.photoUrl ?? null,
      };
    } else {
      // Photo or video with GPS coordinates
      return {
        ...base,
        type: row.type as "photo" | "video",
        latitude: parseFloat(row.latitude!),
        longitude: parseFloat(row.longitude!),
        locationData: null,
        url: row.url,
        thumbnailUrl: row.thumbnailUrl,
      };
    }
  });
}
