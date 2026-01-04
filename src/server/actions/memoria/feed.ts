"use server";

import { getFeedMemories, type FeedItem } from "~/server/queries/memoria/feed";

interface FetchMoreFeedResult {
  success: boolean;
  data?: FeedItem[];
  error?: string;
}

/**
 * Server action to fetch more feed items for infinite scroll
 * @param excludeIds - IDs of memories already shown (to avoid duplicates)
 * @param limit - Number of items to fetch
 */
export async function fetchMoreFeedAction(
  excludeIds: string[],
  limit = 10
): Promise<FetchMoreFeedResult> {
  try {
    const items = await getFeedMemories(limit, excludeIds);
    return { success: true, data: items };
  } catch (error) {
    console.error("Error fetching more feed items:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cargar más recuerdos",
    };
  }
}
