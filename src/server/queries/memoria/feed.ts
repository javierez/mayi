"use server";

import { db } from "~/server/db";
import { memories, users, days } from "~/server/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import type {
  MemoryWithUser,
  SongData,
  LocationData,
} from "~/types/memoria";

/**
 * Feed item for the "Para ti" TikTok-style view
 */
export interface FeedItem {
  memory: MemoryWithUser;
  dayNote?: string | null;
  pinnedQuote?: string | null;
  song?: {
    title: string;
    artist: string;
    previewUrl?: string;
    albumArt?: string;
  } | null;
  location?: string | null;
  date: string;
  dayTitle?: string | null;
}

/**
 * Get random photo/video memories with related day content for the feed
 */
export async function getFeedMemories(limit = 20): Promise<FeedItem[]> {
  // Get random photo/video memories
  const mediaMemories = await db
    .select({
      memory: memories,
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        image: users.image,
      },
      day: {
        id: days.id,
        date: days.date,
        title: days.title,
        location: days.location,
      },
    })
    .from(memories)
    .innerJoin(users, eq(users.id, memories.userId))
    .innerJoin(days, eq(days.id, memories.dayId))
    .where(
      and(
        eq(memories.isActive, true),
        eq(memories.isPrivate, false),
        inArray(memories.type, ["photo", "video"])
      )
    )
    .orderBy(sql`RANDOM()`)
    .limit(limit);

  if (mediaMemories.length === 0) {
    return [];
  }

  // Get dayIds to fetch related content
  const dayIds = [...new Set(mediaMemories.map((m) => m.day.id))];

  // Get notes, quotes, and songs for these days
  const relatedContent = await db
    .select({
      dayId: memories.dayId,
      type: memories.type,
      content: memories.content,
      caption: memories.caption,
      songData: memories.songData,
    })
    .from(memories)
    .where(
      and(
        inArray(memories.dayId, dayIds),
        eq(memories.isActive, true),
        eq(memories.isPrivate, false),
        inArray(memories.type, ["note", "quote", "song"])
      )
    );

  // Group related content by dayId
  const contentByDay = new Map<bigint, {
    notes: string[];
    quotes: string[];
    songs: SongData[];
  }>();

  for (const item of relatedContent) {
    if (!contentByDay.has(item.dayId)) {
      contentByDay.set(item.dayId, { notes: [], quotes: [], songs: [] });
    }
    const dayContent = contentByDay.get(item.dayId)!;

    if (item.type === "note" && item.content) {
      dayContent.notes.push(item.content);
    } else if (item.type === "quote" && item.content) {
      dayContent.quotes.push(item.content);
    } else if (item.type === "song" && item.songData) {
      dayContent.songs.push(item.songData as SongData);
    }
  }

  // Map to FeedItem format
  return mediaMemories.map((row) => {
    const dayContent = contentByDay.get(row.day.id);
    const song = dayContent?.songs[0];

    const memoryWithUser: MemoryWithUser = {
      id: row.memory.id,
      dayId: row.memory.dayId,
      userId: row.memory.userId,
      type: row.memory.type as "photo" | "video",
      url: row.memory.url!,
      thumbnailUrl: row.memory.thumbnailUrl,
      s3Key: row.memory.s3Key,
      mimeType: row.memory.mimeType,
      fileSize: row.memory.fileSize,
      width: row.memory.width,
      height: row.memory.height,
      duration: row.memory.duration,
      caption: row.memory.caption,
      isPrivate: row.memory.isPrivate ?? false,
      position: row.memory.position,
      takenAt: row.memory.takenAt,
      deviceInfo: row.memory.deviceInfo,
      createdAt: row.memory.createdAt,
      updatedAt: row.memory.updatedAt,
      isActive: row.memory.isActive ?? true,
      user: row.user,
      reactionsCount: 0,
      commentsCount: 0,
      userReaction: null,
    };

    return {
      memory: memoryWithUser,
      dayNote: dayContent?.notes[0] ?? null,
      pinnedQuote: dayContent?.quotes[0] ?? null,
      song: song
        ? {
            title: song.title,
            artist: song.artist,
            previewUrl: song.previewUrl,
            albumArt: song.albumArt,
          }
        : null,
      location: row.day.location ?? null,
      date: row.day.date,
      dayTitle: row.day.title ?? null,
    };
  });
}

