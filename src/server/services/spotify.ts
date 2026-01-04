/**
 * Spotify API Service
 * Uses Client Credentials flow for server-side song search
 */

import { env } from "~/env";

interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
}

interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  duration_ms: number;
  popularity: number;
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
}

export interface SpotifyTrackResult {
  id: string;
  title: string;
  artist: string;
  albumName: string;
  albumArt: string | null;
  albumArtSmall: string | null;
  previewUrl: string | null;
  spotifyUrl: string;
  durationMs: number;
  popularity: number;
}

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get access token using Client Credentials flow
 */
async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = env.SPOTIFY_CLIENT_ID;
  const clientSecret = env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not configured");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`Failed to get Spotify token: ${response.status}`);
  }

  const data = (await response.json()) as SpotifyToken;

  // Cache the token with 5 minute buffer before expiry
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };

  return data.access_token;
}

/**
 * Search for tracks on Spotify
 */
export async function searchTracks(
  query: string,
  limit: number = 10
): Promise<SpotifyTrackResult[]> {
  if (!query.trim()) {
    return [];
  }

  const token = await getAccessToken();

  const searchParams = new URLSearchParams({
    q: query,
    type: "track",
    limit: limit.toString(),
    market: "ES", // Spain market for relevance
  });

  const response = await fetch(
    `https://api.spotify.com/v1/search?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Spotify search failed: ${response.status}`);
  }

  const data = (await response.json()) as SpotifySearchResponse;

  return data.tracks.items.map((track) => ({
    id: track.id,
    title: track.name,
    artist: track.artists.map((a) => a.name).join(", "),
    albumName: track.album.name,
    albumArt: track.album.images[0]?.url ?? null, // Largest image (usually 640x640)
    albumArtSmall: track.album.images[2]?.url ?? track.album.images[0]?.url ?? null, // Smallest (64x64)
    previewUrl: track.preview_url,
    spotifyUrl: track.external_urls.spotify,
    durationMs: track.duration_ms,
    popularity: track.popularity,
  }));
}

/**
 * Get a single track by ID
 */
export async function getTrack(trackId: string): Promise<SpotifyTrackResult | null> {
  const token = await getAccessToken();

  const response = await fetch(
    `https://api.spotify.com/v1/tracks/${trackId}?market=ES`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Spotify get track failed: ${response.status}`);
  }

  const track = (await response.json()) as SpotifyTrack;

  return {
    id: track.id,
    title: track.name,
    artist: track.artists.map((a) => a.name).join(", "),
    albumName: track.album.name,
    albumArt: track.album.images[0]?.url ?? null,
    albumArtSmall: track.album.images[2]?.url ?? track.album.images[0]?.url ?? null,
    previewUrl: track.preview_url,
    spotifyUrl: track.external_urls.spotify,
    durationMs: track.duration_ms,
    popularity: track.popularity,
  };
}

/**
 * Check if Spotify is configured
 */
export function isSpotifyConfigured(): boolean {
  return !!(env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET);
}
