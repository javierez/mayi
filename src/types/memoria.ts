/**
 * Types for MayI - Couples Memory Calendar App
 */

// =============================================================================
// MEMORY TYPES
// =============================================================================

export type MemoryType =
  | "photo"
  | "video"
  | "note"
  | "voice"
  | "song"
  | "location"
  | "quote";

export interface SongData {
  title: string;
  artist: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  youtubeUrl?: string;
  previewUrl?: string;
  albumArt?: string;
}

export interface LocationData {
  name: string;
  address?: string;
  lat: number;
  lng: number;
  googlePlaceId?: string;
}

export interface BaseMemory {
  id: bigint;
  dayId: bigint;
  userId: string;
  type: MemoryType;
  caption?: string | null;
  isPrivate: boolean;
  position: number;
  takenAt?: Date | null;
  deviceInfo?: string | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface PhotoMemory extends BaseMemory {
  type: "photo";
  url: string;
  thumbnailUrl?: string | null;
  s3Key?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface VideoMemory extends BaseMemory {
  type: "video";
  url: string;
  thumbnailUrl?: string | null;
  s3Key?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
}

export interface NoteMemory extends BaseMemory {
  type: "note";
  content: string;
}

export interface VoiceMemory extends BaseMemory {
  type: "voice";
  url: string;
  s3Key?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  duration?: number | null;
}

export interface SongMemory extends BaseMemory {
  type: "song";
  songData: SongData;
}

export interface LocationMemory extends BaseMemory {
  type: "location";
  locationData: LocationData;
}

export interface QuoteMemory extends BaseMemory {
  type: "quote";
  content: string; // The quote text
  caption?: string | null; // Attribution (who said it)
}

export type Memory =
  | PhotoMemory
  | VideoMemory
  | NoteMemory
  | VoiceMemory
  | SongMemory
  | LocationMemory
  | QuoteMemory;

export type MemoryWithUser = Memory & {
  user: {
    id: string;
    firstName: string;
    lastName?: string | null;
    image?: string | null;
  };
  reactionsCount: number;
  commentsCount: number;
  userReaction?: string | null;
};

// =============================================================================
// DAY TYPES
// =============================================================================

export type MoodType =
  | "happy"
  | "romantic"
  | "adventurous"
  | "relaxed"
  | "emotional"
  | "funny"
  | "special"
  | "cozy";

export interface Day {
  id: bigint;
  coupleId: bigint;
  date: string; // YYYY-MM-DD format
  title?: string | null;
  description?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  weather?: string | null;
  temperature?: number | null;
  coverMemoryId?: bigint | null;
  mood?: MoodType | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface DayWithMemories extends Day {
  memories: MemoryWithUser[];
  coverMemory?: PhotoMemory | VideoMemory | null;
  memoryCount: number;
}

export interface DaySummary {
  date: string;
  memoryCount: number;
  hasMilestone: boolean;
  thumbnailUrl?: string | null;
  title?: string | null;
}

// =============================================================================
// REACTION TYPES
// =============================================================================

export type ReactionEmoji = "❤️" | "😂" | "😍" | "🥺" | "🔥";

export interface Reaction {
  id: bigint;
  memoryId: bigint;
  userId: string;
  emoji: ReactionEmoji;
  createdAt: Date;
  user?: {
    id: string;
    firstName: string;
    image?: string | null;
  };
}

// =============================================================================
// COMMENT TYPES
// =============================================================================

export interface Comment {
  id: bigint;
  memoryId: bigint;
  userId: string;
  content: string;
  parentId?: bigint | null;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  user: {
    id: string;
    firstName: string;
    lastName?: string | null;
    image?: string | null;
  };
  replies?: Comment[];
}

// =============================================================================
// MILESTONE TYPES
// =============================================================================

export type RecurrenceType = "yearly" | "monthly" | "once";

export interface Milestone {
  id: bigint;
  coupleId: bigint;
  title: string;
  description?: string | null;
  originalDate: string; // YYYY-MM-DD format
  icon?: string | null;
  recurrence: RecurrenceType;
  reminderDaysBefore: number;
  color?: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface MilestoneWithNextDate extends Milestone {
  nextDate: string;
  daysUntil: number;
  yearsAgo?: number;
}

// =============================================================================
// TAG TYPES
// =============================================================================

export interface Tag {
  id: bigint;
  coupleId: bigint;
  name: string;
  color?: string | null;
  icon?: string | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface TagWithCount extends Tag {
  memoryCount: number;
}

// =============================================================================
// STANDALONE NOTE TYPES
// =============================================================================

export type NoteCategory =
  | "love_letter"
  | "bucket_list"
  | "wishlist"
  | "journal"
  | "recipe"
  | "other";

export interface StandaloneNote {
  id: bigint;
  coupleId: bigint;
  userId: string;
  title?: string | null;
  content: string;
  category?: NoteCategory | null;
  isPrivate: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface StandaloneNoteWithUser extends StandaloneNote {
  user: {
    id: string;
    firstName: string;
    lastName?: string | null;
    image?: string | null;
  };
}

// =============================================================================
// COUPLE TYPES
// =============================================================================

export interface Couple {
  id: bigint;
  name?: string | null;
  anniversaryDate?: string | null;
  inviteCode?: string | null;
  inviteCodeExpiresAt?: Date | null;
  timezone: string;
  preferences: CouplePreferences;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface CouplePreferences {
  notificationsEnabled?: boolean;
  pushNotificationsEnabled?: boolean;
  weekStartsOn?: 0 | 1; // 0 = Sunday, 1 = Monday
}

export interface CoupleWithPartners extends Couple {
  partners: {
    id: string;
    firstName: string;
    lastName?: string | null;
    image?: string | null;
    birthDate?: string | null;
  }[];
}

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

export type NotificationType =
  | "new_memory"
  | "comment"
  | "reaction"
  | "milestone_reminder"
  | "partner_joined";

export interface CoupleNotification {
  id: bigint;
  coupleId: bigint;
  userId?: string | null;
  fromUserId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
  entityType?: string | null;
  entityId?: bigint | null;
  isRead: boolean;
  readAt?: Date | null;
  isDismissed: boolean;
  scheduledFor?: Date | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface NotificationWithFrom extends CoupleNotification {
  fromUser?: {
    id: string;
    firstName: string;
    image?: string | null;
  } | null;
}

// =============================================================================
// CALENDAR TYPES
// =============================================================================

export interface CalendarMonth {
  year: number;
  month: number; // 0-11
  days: DaySummary[];
  milestones: MilestoneWithNextDate[];
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
