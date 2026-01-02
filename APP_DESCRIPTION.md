# MayI - Couples Memory Calendar

## Full Product Description

---

## 1. Vision & Purpose

**MayI** is a private, intimate digital space for couples to capture, organize, and relive their shared memories together. Unlike social media platforms where memories get lost in feeds, MayI centers everything around a calendar - making it effortless to travel back in time to any day in your relationship and experience it again through photos, videos, notes, and more.

The app is designed exclusively for two people - a couple. Every memory, every reaction, every comment exists in a private bubble shared only between partners.

---

## 2. Core User Experience

### 2.1 The Calendar as the Heart

The main interface is a calendar. Each day that contains memories is visually distinguished (highlighted, dotted, or showing a small preview thumbnail). Users can:

- Navigate through months and years
- See at a glance which days have content
- Quickly identify milestone days (anniversaries, special events)
- Click any day to dive into its memories

### 2.2 Day Detail Page

When a user clicks on a specific day, they enter an immersive experience:

**Header Section:**
- The date prominently displayed
- Optional custom title (e.g., "Our First Trip to Paris")
- Location badge showing where you were
- Weather and temperature (captured automatically or entered manually)
- Mood indicator (happy, romantic, adventurous, relaxed, etc.)

**Cover Memory:**
- A hero image/video that represents the day
- Selected by the couple or auto-selected from the best photo

**Memory Grid/Timeline:**
- All memories from that day displayed in a beautiful masonry or timeline layout
- Memories can be reordered via drag-and-drop
- Each memory shows:
  - The content (photo/video/note/etc.)
  - Caption if provided
  - Who added it (partner 1 or partner 2)
  - Reactions and comments count
  - Tags applied

**Interaction Layer:**
- Click any memory to view it full-screen
- Add reactions (emoji picker)
- Write comments
- Edit or delete your own memories

---

## 3. Memory Types - Detailed

### 3.1 Photos

**Capture & Upload:**
- Upload from device gallery
- Take photo directly from app
- Import from Google Photos / iCloud (future)

**Metadata Stored:**
- Original URL (S3)
- Thumbnail URL
- S3 storage key
- MIME type (image/jpeg, image/png, etc.)
- File size in bytes
- Width and height in pixels
- Original capture timestamp (from EXIF)
- Device info (camera/phone model)
- GPS coordinates (if available in EXIF)

**Features:**
- Auto-organize by date taken
- Caption/description
- Mark as private (only visible to uploader)
- Set as day's cover image
- Tag with custom labels

### 3.2 Videos

**Capture & Upload:**
- Upload from device
- Record directly (future)
- Support for common formats (MP4, MOV, etc.)

**Metadata Stored:**
- Video URL
- Thumbnail URL (auto-generated)
- Duration in seconds
- Width and height
- File size

**Features:**
- In-app playback
- Video thumbnails in grid view
- Same caption/private/tag features as photos

### 3.3 Notes

Text-based journal entries attached to a specific day.

**Content:**
- Rich text content
- No character limit

**Use Cases:**
- "Today we decided to adopt a dog"
- "Had the best conversation about our future"
- Daily reflections and thoughts

### 3.4 Voice Notes

Audio recordings to capture moments in their original form.

**Stored Data:**
- Audio file URL
- Duration in seconds
- File size
- MIME type (audio/mp3, audio/wav, etc.)

**Use Cases:**
- Recording your partner's laugh
- Capturing a live moment (concert, nature sounds)
- Voice messages to each other

### 3.5 Songs

Link songs that defined a day or moment.

**Stored Data (JSON):**
```json
{
  "title": "Perfect",
  "artist": "Ed Sheeran",
  "spotifyUrl": "https://open.spotify.com/track/...",
  "appleMusicUrl": "https://music.apple.com/...",
  "previewUrl": "https://..."
}
```

**Features:**
- Search and link from Spotify/Apple Music
- Preview playback (30 seconds)
- Deep link to open in music app

**Use Cases:**
- "Our song" that was playing during a moment
- The playlist from a road trip
- Song that reminds you of a date

### 3.6 Locations

Places that matter to your relationship.

**Stored Data (JSON):**
```json
{
  "name": "Caffè Florian",
  "address": "Piazza San Marco, 57, Venice, Italy",
  "lat": 45.4341,
  "lng": 12.3388,
  "googlePlaceId": "ChIJ..."
}
```

**Features:**
- Search places via Google Places API
- Map preview
- Save with custom name
- Link to Google Maps for navigation

**Use Cases:**
- The restaurant where you had your first date
- The hotel where you stayed
- A scenic viewpoint you discovered

### 3.7 Quotes

Memorable things said that you want to remember forever.

**Content:**
- The quote text
- Optional attribution (who said it)

**Use Cases:**
- "You're my favorite person" - María, on our 2nd anniversary
- Funny things your partner said
- Meaningful conversations captured in a phrase

---

## 4. Social Interactions

### 4.1 Reactions

Quick emotional responses to memories using emojis.

**Available Reactions:**
- ❤️ Love
- 😂 Funny
- 😍 Beautiful
- 🥺 Emotional
- 🔥 Hot/Amazing

**Behavior:**
- One reaction per user per memory
- Tap again to change or remove
- Visible count on each memory
- Partner gets notified when you react

### 4.2 Comments

Threaded text discussions on memories.

**Features:**
- Write comments on any memory
- Reply to existing comments (threaded)
- Edit your own comments
- Delete your own comments (soft delete)
- Timestamps showing when written

**Notifications:**
- Partner notified when you comment
- Notified when partner replies to your comment

---

## 5. Milestones

Special recurring dates that matter to your relationship.

### 5.1 Creating a Milestone

**Required Fields:**
- Title (e.g., "Our Anniversary", "First Kiss")
- Original date (when it first happened)

**Optional Fields:**
- Description (the story behind it)
- Icon/emoji (💍 🎂 ✈️ 💕 🏠)
- Color (for calendar display)
- Recurrence: yearly, monthly, or one-time
- Reminder: how many days before to notify

### 5.2 Milestone Types

**Yearly Milestones:**
- Relationship anniversary
- Engagement anniversary
- Wedding anniversary
- Partner birthdays
- First kiss, first trip, etc.

**Monthly Milestones:**
- "Monthiversary" if desired
- Monthly date nights

**One-time Milestones:**
- Wedding day (future event)
- Planned trip
- Moving in together date

### 5.3 Milestone Reminders

- Push notification X days before
- In-app notification
- Special visual on calendar for upcoming milestones

---

## 6. Tags

Custom labels for organizing and filtering memories.

### 6.1 Tag Properties

- **Name**: The tag label (e.g., "Paris Trip", "Date Night")
- **Color**: Hex color for visual distinction
- **Icon**: Optional emoji

### 6.2 Tag Management

- Create unlimited tags per couple
- Edit tag name/color/icon
- Delete unused tags
- Tags are shared between both partners

### 6.3 Tag Usage

- Apply multiple tags to any memory
- Filter calendar/memories by tag
- Quick access to themed collections (all vacations, all date nights, etc.)

---

## 7. Notes (Standalone)

Long-form content not tied to a specific day.

### 7.1 Note Categories

| Category | Purpose |
|----------|---------|
| `love_letter` | Written expressions of love |
| `bucket_list` | Things you want to do together |
| `wishlist` | Gift ideas for each other |
| `journal` | Personal reflections |
| `recipe` | Recipes you love making together |
| `other` | Anything else |

### 7.2 Note Features

- **Title**: Optional heading
- **Content**: Full text body
- **Private**: Only visible to author (secret gift ideas, surprises)
- **Pinned**: Stays at top of notes list

---

## 8. Partner Onboarding

### 8.1 User Registration Flow

1. User signs up with email/password or Google
2. User creates their profile (name, birthday, etc.)
3. User either:
   - Creates a new couple (becomes "founder")
   - Joins existing couple via invite code

### 8.2 Creating a Couple

When first user creates the couple:

1. Enter couple name (optional, e.g., "Javi & María")
2. Set anniversary date (optional)
3. System generates unique invite code
4. Share code with partner via any channel

**Invite Code:**
- 32-character unique string
- Expires after 7 days (configurable)
- Can be regenerated if needed

### 8.3 Joining a Couple

Second partner:

1. Signs up for account
2. Enters invite code
3. Automatically linked to the couple
4. Both users now share the same `coupleId`

---

## 9. Notifications

### 9.1 Notification Types

| Type | Trigger |
|------|---------|
| `new_memory` | Partner adds a memory |
| `comment` | Partner comments on your memory |
| `reaction` | Partner reacts to your memory |
| `milestone_reminder` | X days before a milestone |
| `partner_joined` | Partner accepts invite code |

### 9.2 Notification Delivery

**In-App:**
- Bell icon with unread count
- Notification dropdown/page
- Mark as read/dismiss
- Click to navigate to related content

**Push Notifications:**
- Browser push (desktop)
- Mobile push (when PWA installed)
- Configurable per notification type

### 9.3 Notification Data

Each notification contains:
- Type and title
- Message body
- Action URL (where to go when clicked)
- Related entity (memory, milestone, etc.)
- Read/dismissed status
- Timestamps

---

## 10. User Integrations

### 10.1 Google Photos Sync (Future)

- Connect Google Photos account
- Import photos automatically by date
- Sync new photos periodically
- Choose which albums to sync

### 10.2 iCloud Photos (Future)

- Connect Apple account
- Similar functionality to Google Photos

### 10.3 Calendar Sync (Future)

- Sync milestones to Google Calendar
- Optional: import events as milestones

---

## 11. Privacy & Security

### 11.1 Private Space

- All data is private to the couple
- No public profiles or sharing
- No social features beyond the two partners

### 11.2 Private Memories

- Individual memories can be marked as private
- Only visible to the creator
- Useful for planning surprises, secret gifts

### 11.3 Authentication

- Email/password with secure hashing
- Google OAuth
- Apple OAuth (future)
- Optional: Two-factor authentication

---

## 12. Database Schema Reference

### Tables Overview

```
couples           → Relationship container
users             → Individual accounts (linked via coupleId)
days              → Calendar days with memories
memories          → Content items (photos, videos, etc.)
reactions         → Emoji reactions on memories
comments          → Text comments on memories
milestones        → Special recurring dates
tags              → Custom labels
memoryTags        → Memory-tag junction
notes             → Standalone notes
notifications     → In-app notifications
pushSubscriptions → Push notification subscriptions
userIntegrations  → Third-party service connections
sessions          → Auth sessions
authAccounts      → OAuth providers
verificationTokens
passwordResetTokens
```

---

## 13. Technical Architecture

### 13.1 Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TailwindCSS |
| Database | PostgreSQL (Supabase) |
| ORM | Drizzle |
| Auth | BetterAuth |
| Storage | AWS S3 |
| Push | Web Push API (VAPID) |
| Hosting | Vercel |

### 13.2 Key Patterns

- Server Components for data fetching
- Server Actions for mutations
- Optimistic UI updates
- Responsive design (mobile-first)
- PWA-ready (installable)

---

## 14. Design Language

### 14.1 Color Palette

**Primary Gradient:**
```css
from-amber-400 to-rose-400
```
Warm, romantic colors that evoke love and warmth.

**Usage:**
- Primary buttons
- Active states
- Accent highlights
- Hover effects

### 14.2 Typography

- Clean, modern sans-serif
- Readable at all sizes
- Emotional hierarchy for special moments

### 14.3 Visual Style

- Soft shadows and rounded corners
- Generous whitespace
- Photography-forward layouts
- Subtle animations for delight

---

## 15. Future Considerations

### 15.1 Potential Features

- **Time Capsules**: Lock memories to open on a future date
- **Year in Review**: Automated yearly summary
- **Printed Books**: Export memories as physical photo books
- **Shared Playlists**: Collaborative Spotify playlist from all songs
- **Memory Map**: All locations on a world map
- **Relationship Stats**: Fun statistics (days together, memories count, etc.)
- **Widget**: iOS/Android home screen widget showing "this day X years ago"
- **Daily Prompts**: Suggestions to add memories

### 15.2 Scalability

- Designed for one couple per instance
- Could scale to multiple couples with proper isolation
- Media storage scales independently via S3

---

## 16. Success Metrics

- Daily active couples
- Memories added per week
- Reactions/comments per memory
- Milestone completion rate
- Retention (couples still active after 1 year)
- Push notification engagement

---

*This document serves as the complete product specification for MayI - the couples memory calendar app.*
