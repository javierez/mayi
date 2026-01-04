import { NextResponse } from "next/server";
import { searchTracks, isSpotifyConfigured } from "~/server/services/spotify";

export async function GET(request: Request) {
  try {
    // Check if Spotify is configured
    if (!isSpotifyConfigured()) {
      return NextResponse.json(
        { error: "Spotify not configured" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") ?? "8", 10);

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const tracks = await searchTracks(query, Math.min(limit, 20));

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Spotify search error:", error);
    return NextResponse.json(
      { error: "Failed to search Spotify" },
      { status: 500 }
    );
  }
}
