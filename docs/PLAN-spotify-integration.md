# Spotify Integration Plan: Songs in Memoria

## Summary
Integrate Spotify API to enhance the song memory experience across two main views:
1. **Calendario > Day Detail**: Display song cards with album art, 30-second preview, and Spotify link
2. **Para Ti Feed**: Ambient song playback on photos (full volume) and videos (20% volume)

---

## Current Implementation Status

### Completed
| Component | Status | Description |
|-----------|--------|-------------|
| `src/server/services/spotify.ts` | **Done** | Spotify API service with Client Credentials auth |
| `src/app/api/spotify/search/route.ts` | **Done** | API route for song search |
| `src/components/memoria/AddMemoryModal.tsx` | **Done** | Spotify search autocomplete when adding songs |
| `src/components/memoria/SpotifySongCard.tsx` | **Done** | Song card with album art and audio preview |
| `src/components/memoria/DayDetail.tsx` | **Done** | Uses SpotifySongCard for song memories |
| `src/env.js` | **Done** | SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET env vars |
| `next.config.js` | **Done** | Added i.scdn.co for Spotify album art images |

### Data Model
```typescript
// src/types/memoria.ts
interface SongData {
  title: string;
  artist: string;
  spotifyUrl?: string;      // Link to open in Spotify
  appleMusicUrl?: string;   // Alternative link
  youtubeUrl?: string;      // Alternative link
  previewUrl?: string;      // 30-second MP3 preview URL
  albumArt?: string;        // Album cover image URL (from i.scdn.co)
}
```

---

## Setup Instructions

### 1. Create Spotify Developer App
1. Go to https://developer.spotify.com/dashboard
2. Log in with Spotify account (free tier works)
3. Click "Create app"
4. Fill in:
   - **App name**: "MayI Memoria"
   - **Redirect URI**: `http://localhost:3000` (required but unused)
   - Check **Web API**
5. Save

### 2. Get Credentials
1. In app dashboard, click "Settings"
2. Copy **Client ID**
3. Click "View client secret" and copy

### 3. Configure Environment
```bash
# .env.local
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

### 4. Restart Dev Server
```bash
pnpm dev
```

---

## Architecture

### Authentication Flow (Client Credentials)
```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Browser   │      │  Next.js    │      │  Spotify    │
│  (Client)   │      │  (Server)   │      │    API      │
└─────────────┘      └─────────────┘      └─────────────┘
       │                    │                    │
       │ Search "Perfect"   │                    │
       │───────────────────>│                    │
       │                    │                    │
       │                    │ POST /api/token    │
       │                    │ (client_id+secret) │
       │                    │───────────────────>│
       │                    │                    │
       │                    │<───────────────────│
       │                    │   access_token     │
       │                    │                    │
       │                    │ GET /v1/search     │
       │                    │ (Bearer token)     │
       │                    │───────────────────>│
       │                    │                    │
       │                    │<───────────────────│
       │                    │   tracks[]         │
       │                    │                    │
       │<───────────────────│                    │
       │   SpotifyTrackResult[]                  │
       │                    │                    │
```

### Token Caching
- Tokens cached server-side for ~55 minutes (5 min buffer before expiry)
- Automatic refresh on expiration
- No user authentication required

---

## Day Detail Implementation

### Current Behavior
1. User clicks "Canción" button on day detail page
2. `AddMemoryModal` opens with Spotify search input
3. User types song name/artist
4. Debounced search (300ms) queries `/api/spotify/search`
5. Results show album art, title, artist, and preview indicator
6. User selects track → form auto-fills with:
   - `title`, `artist`, `spotifyUrl`, `previewUrl`, `albumArt`
7. Selected track card shows with play button for 30-sec preview
8. User saves → `SongData` stored in database

### Song Card Display (SpotifySongCard)
```
┌─────────────────────────────────────────────────┐
│  ┌──────────┐                                   │
│  │          │  Perfect                          │
│  │  [Album] │  Ed Sheeran                       │
│  │   Art    │  "Our wedding song"               │
│  │    ▶     │  ↗ Open in Spotify               │
│  └──────────┘                                   │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░  (progress)   │
│  Tap to listen to 30-second preview             │
└─────────────────────────────────────────────────┘
```

### Features
- **Album Art**: High-quality cover from Spotify CDN
- **Play Button**: Plays 30-second preview (HTML5 Audio)
- **Progress Bar**: Visual progress during playback
- **Spotify Link**: Opens track in Spotify app/web
- **Delete Menu**: Three-dot menu for deletion

---

## Para Ti Feed Implementation

### Concept
The "Para Ti" feed is a vertical scroll feed (similar to TikTok/Instagram Reels) showing memories. Songs should provide ambient audio:

| Memory Type | Song Behavior |
|-------------|---------------|
| **Photo** | Song plays at **100% volume** as background music |
| **Video** | Song plays at **20% volume** (video audio is primary) |
| **No Song** | Silent or ambient sound |

### Recommended Architecture

#### 1. Feed Item Data Structure
```typescript
interface FeedItem {
  id: string;
  type: "photo" | "video";
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;

  // Song associated with this memory or its day
  song?: {
    title: string;
    artist: string;
    previewUrl: string | null;
    albumArt: string | null;
    spotifyUrl: string | null;
  };

  // For videos
  videoVolume?: number; // 0-1
}
```

#### 2. Audio Manager (Singleton)
Create a global audio manager to handle song playback across feed items:

```typescript
// src/lib/audio-manager.ts
class AudioManager {
  private audio: HTMLAudioElement | null = null;
  private currentItemId: string | null = null;

  play(itemId: string, previewUrl: string, volume: number) {
    // Stop current if different item
    if (this.currentItemId !== itemId) {
      this.stop();
    }

    if (!this.audio) {
      this.audio = new Audio(previewUrl);
      this.audio.loop = true; // Loop the 30-sec preview
    }

    this.audio.volume = volume;
    this.audio.play();
    this.currentItemId = itemId;
  }

  setVolume(volume: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.currentItemId = null;
  }
}

export const audioManager = new AudioManager();
```

#### 3. Feed Item Component
```typescript
// src/components/memoria/FeedItem.tsx
function FeedItem({ item, isVisible }: { item: FeedItem; isVisible: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isVisible) {
      audioManager.stop();
      return;
    }

    if (item.song?.previewUrl) {
      const volume = item.type === "photo" ? 1.0 : 0.2;
      audioManager.play(item.id, item.song.previewUrl, volume);
    }

    // For videos, also play the video
    if (item.type === "video" && videoRef.current) {
      videoRef.current.play();
      videoRef.current.volume = 0.8; // Video at 80%, song at 20%
    }

    return () => {
      if (item.type === "video" && videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [isVisible, item]);

  // ... render
}
```

#### 4. Visibility Detection
Use Intersection Observer to detect which item is currently in view:

```typescript
// In ParaTiFeed.tsx
const [visibleItemId, setVisibleItemId] = useState<string | null>(null);

// Intersection Observer for each feed item
const observerCallback = (entries: IntersectionObserverEntry[]) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
      setVisibleItemId(entry.target.dataset.itemId);
    }
  });
};
```

### UI Recommendations

#### Song Indicator on Feed Items
When a song is playing, show a subtle indicator:

```
┌─────────────────────────────────────┐
│                                     │
│         [PHOTO/VIDEO]               │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ ♪ Perfect - Ed Sheeran       │   │  <-- Song pill (bottom)
│  └──────────────────────────────┘   │
│                                     │
│  ❤️ 5    💬 2         @María        │  <-- Reactions bar
└─────────────────────────────────────┘
```

#### Song Pill Component
```typescript
function SongPill({ song }: { song: SongData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-16 left-4 right-4"
    >
      <div className="flex items-center gap-2 rounded-full bg-black/50 backdrop-blur-sm px-3 py-2">
        {song.albumArt && (
          <Image
            src={song.albumArt}
            alt=""
            width={24}
            height={24}
            className="rounded-sm"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white truncate">
            ♪ {song.title}
          </p>
          <p className="text-[10px] text-white/70 truncate">
            {song.artist}
          </p>
        </div>
        <button className="text-white/70 hover:text-white">
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
```

### Volume Mixing Strategy

| Scenario | Song Volume | Video Volume | Total |
|----------|-------------|--------------|-------|
| Photo + Song | 100% | N/A | Song only |
| Video + Song | 20% | 80% | Mixed |
| Video only | N/A | 100% | Video only |
| Photo only | N/A | N/A | Silent |

#### Implementation
```typescript
// When item becomes visible
if (item.type === "photo" && item.song?.previewUrl) {
  audioManager.play(item.id, item.song.previewUrl, 1.0);
}

if (item.type === "video") {
  videoRef.current.volume = item.song?.previewUrl ? 0.8 : 1.0;

  if (item.song?.previewUrl) {
    audioManager.play(item.id, item.song.previewUrl, 0.2);
  }
}
```

---

## Alternative: Spotify Embed Player

Instead of custom audio playback, use Spotify's official embed:

### Track Embed
```tsx
<iframe
  src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
  width="100%"
  height="152"
  frameBorder="0"
  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
  loading="lazy"
/>
```

### Pros
- Official Spotify branding
- Full playback for logged-in users
- No audio management complexity
- Always up-to-date player UI

### Cons
- Larger UI footprint (min 152px height)
- Less control over styling
- Can't programmatically control playback
- Not suitable for "Para Ti" ambient audio

### Recommendation
- **Day Detail**: Offer both custom card AND embed option
- **Para Ti Feed**: Use custom audio (embed too large for feed)

---

## Song Association Strategies

### Option A: Song per Memory (Current)
Each memory can have its own song.

```
Day: January 4, 2026
├── Photo 1 (no song)
├── Photo 2 → Song: "Perfect"
├── Video 1 → Song: "Thinking Out Loud"
└── Note (no song)
```

### Option B: Song per Day
A day has a "theme song" that plays for all memories.

```
Day: January 4, 2026 → Theme Song: "Perfect"
├── Photo 1 (plays "Perfect")
├── Photo 2 (plays "Perfect")
├── Video 1 (plays "Perfect" at 20%)
└── Note
```

### Option C: Hybrid (Recommended)
- Day can have a theme song
- Individual memories can override with their own song

```typescript
interface Day {
  // ... existing fields
  themeSong?: SongData;
}

// In feed, resolve song:
const effectiveSong = memory.songData ?? day.themeSong ?? null;
```

---

## API Endpoints

### Search Tracks
```
GET /api/spotify/search?q=perfect+ed+sheeran&limit=8

Response:
{
  "tracks": [
    {
      "id": "0tgVpDi06FyKpA1z0VMD4v",
      "title": "Perfect",
      "artist": "Ed Sheeran",
      "albumName": "÷ (Divide)",
      "albumArt": "https://i.scdn.co/image/ab67616d0000b273...",
      "albumArtSmall": "https://i.scdn.co/image/ab67616d00001e02...",
      "previewUrl": "https://p.scdn.co/mp3-preview/...",
      "spotifyUrl": "https://open.spotify.com/track/0tgVpDi06FyKpA1z0VMD4v",
      "durationMs": 263400,
      "popularity": 89
    }
  ]
}
```

### Get Track by ID (Future)
```
GET /api/spotify/track/0tgVpDi06FyKpA1z0VMD4v

Response: Same as single track above
```

---

## Limitations & Considerations

### Preview URL Availability
- ~10% of tracks have no preview URL (licensing restrictions)
- Varies by region (ES market used)
- Gracefully handle null `previewUrl`

### Preview Duration
- Always 30 seconds
- For "Para Ti", loop the preview for longer photos
- Consider crossfade on loop

### Rate Limits
- 30 requests/second (generous)
- Token cached, minimal API calls
- Search debounced to 300ms

### Commercial Use
- Free tier sufficient for development
- For production at scale, may need Extended Quota Mode
- Request via Spotify Developer Dashboard

### Offline/Error Handling
- Cache song metadata locally
- Show song info even if preview fails
- Graceful degradation to "Open in Spotify" link

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/server/services/spotify.ts` | Spotify API client with auth |
| `src/app/api/spotify/search/route.ts` | Search endpoint |
| `src/components/memoria/SpotifySongCard.tsx` | Song display card |
| `src/components/memoria/AddMemoryModal.tsx` | Song search in modal |
| `src/types/memoria.ts` | SongData type definition |
| `src/env.js` | Environment variables |
| `next.config.js` | Image domain allowlist |

---

## Future Enhancements

### Phase 2
- [ ] Get track by ID endpoint
- [ ] Spotify embed option in Day Detail
- [ ] Day theme song feature
- [ ] Song search history/favorites

### Phase 3
- [ ] Audio crossfade between feed items
- [ ] Volume controls in UI
- [ ] Mute toggle with persistence
- [ ] Background audio when app minimized (PWA)

### Phase 4
- [ ] Apple Music integration (alternative)
- [ ] YouTube Music integration (alternative)
- [ ] Local audio file upload (offline songs)
