import {
  bigint,
  varchar,
  timestamp,
  boolean,
  pgTable,
  jsonb,
  text,
  decimal,
  smallint,
  integer,
  bigserial,
  date,
} from "drizzle-orm/pg-core";

// ============================================================================
// CIRCLES (relationship container - couples, friends, groups, family)
// ============================================================================
export const couples = pgTable("couples", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  name: varchar("name", { length: 255 }), // "Javi & María" or "The Adventure Squad"
  type: varchar("type", { length: 20 }).default("couple").notNull(), // 'couple' | 'friends' | 'family' | 'group'
  maxMembers: smallint("max_members").default(2), // 2 for couples, null for unlimited
  description: text("description"), // Optional description for the circle
  anniversaryDate: date("anniversary_date"), // Start date (anniversary for couples, creation for others)
  inviteCode: varchar("invite_code", { length: 32 }), // Unique code to invite members
  inviteCodeExpiresAt: timestamp("invite_code_expires_at"),
  timezone: varchar("timezone", { length: 50 }).default("Europe/Madrid"),
  coverImage: varchar("cover_image", { length: 2048 }), // Circle cover/banner image
  emoji: varchar("emoji", { length: 10 }), // Circle emoji icon
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

// Alias for semantic clarity
export const circles = couples;

// ============================================================================
// USERS (adapted for couples - BetterAuth compatible)
// ============================================================================
export const users = pgTable("users", {
  // BetterAuth required fields
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: boolean("email_verified").default(false),
  emailVerifiedAt: timestamp("email_verified_at"),
  image: varchar("image", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  password: varchar("password", { length: 255 }),

  // Couple relationship
  coupleId: bigint("couple_id", { mode: "bigint" }), // FK → couples.id (nullable until paired)

  // Profile
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  birthDate: date("birth_date"), // For birthday milestones
  timezone: varchar("timezone", { length: 50 }).default("Europe/Madrid"),
  language: varchar("language", { length: 10 }).default("es"),
  preferences: jsonb("preferences").default({}),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true),
});

// ============================================================================
// AUTH TABLES (BetterAuth - kept as-is)
// ============================================================================
export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: varchar("user_id", { length: 36 }).notNull(),
});

export const authAccounts = pgTable("account", {
  id: varchar("id", { length: 36 }).primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  id: varchar("id", { length: 36 }).primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  resetCode: varchar("reset_code", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// ============================================================================
// DAYS (calendar days with memories)
// ============================================================================
export const days = pgTable("days", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  coupleId: bigint("couple_id", { mode: "bigint" }).notNull(),
  date: date("date").notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  location: varchar("location", { length: 500 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  weather: varchar("weather", { length: 50 }),
  temperature: smallint("temperature"),
  coverMemoryId: bigint("cover_memory_id", { mode: "bigint" }),
  mood: varchar("mood", { length: 50 }),
  rating: smallint("rating"), // 1-5 stars rating for the day
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

// ============================================================================
// MEMORIES (photos, videos, notes, songs, locations, quotes)
// ============================================================================
export const memories = pgTable("memories", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  dayId: bigint("day_id", { mode: "bigint" }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),

  // Type
  type: varchar("type", { length: 20 }).notNull(), // 'photo' | 'video' | 'note' | 'voice' | 'song' | 'location' | 'quote'

  // Media (photo, video, voice)
  url: varchar("url", { length: 2048 }),
  thumbnailUrl: varchar("thumbnail_url", { length: 2048 }),
  s3Key: varchar("s3_key", { length: 2048 }),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: integer("file_size"),
  duration: integer("duration"), // seconds (video/audio)
  width: integer("width"),
  height: integer("height"),

  // Text (note, quote)
  content: text("content"),

  // Song
  songData: jsonb("song_data"), // { title, artist, spotifyUrl, appleMusicUrl, previewUrl }

  // Location
  locationData: jsonb("location_data"), // { name, address, lat, lng, googlePlaceId }

  // Common
  caption: varchar("caption", { length: 1000 }),
  isPrivate: boolean("is_private").default(false),
  position: integer("position").default(0).notNull(),
  takenAt: timestamp("taken_at"),
  deviceInfo: varchar("device_info", { length: 255 }),

  // GPS coordinates (extracted from EXIF/metadata)
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

// ============================================================================
// REACTIONS (emoji reactions on memories)
// ============================================================================
export const reactions = pgTable("reactions", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  memoryId: bigint("memory_id", { mode: "bigint" }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  emoji: varchar("emoji", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// COMMENTS (text comments on memories)
// ============================================================================
export const comments = pgTable("comments", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  memoryId: bigint("memory_id", { mode: "bigint" }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  content: text("content").notNull(),
  parentId: bigint("parent_id", { mode: "bigint" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isDeleted: boolean("is_deleted").default(false),
});

// ============================================================================
// MILESTONES (special recurring dates)
// ============================================================================
export const milestones = pgTable("milestones", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  coupleId: bigint("couple_id", { mode: "bigint" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  originalDate: date("original_date").notNull(),
  icon: varchar("icon", { length: 50 }),
  recurrence: varchar("recurrence", { length: 20 }).default("yearly"), // 'yearly' | 'monthly' | 'once'
  reminderDaysBefore: smallint("reminder_days_before").default(7),
  color: varchar("color", { length: 7 }),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

// ============================================================================
// TAGS (for organizing memories)
// ============================================================================
export const tags = pgTable("tags", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  coupleId: bigint("couple_id", { mode: "bigint" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }),
  icon: varchar("icon", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

// ============================================================================
// MEMORY_TAGS (junction table)
// ============================================================================
export const memoryTags = pgTable("memory_tags", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  memoryId: bigint("memory_id", { mode: "bigint" }).notNull(),
  tagId: bigint("tag_id", { mode: "bigint" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// USER INTEGRATIONS (Google Photos, iCloud, etc.)
// ============================================================================
export const userIntegrations = pgTable("user_integrations", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(), // "google_photos", "icloud"
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiryDate: timestamp("expiry_date"),
  syncToken: text("sync_token"),
  lastSyncAt: timestamp("last_sync_at"),
  settings: jsonb("settings").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// NOTIFICATIONS (in-app notifications)
// ============================================================================
export const notifications = pgTable("notifications", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  coupleId: bigint("couple_id", { mode: "bigint" }).notNull(),
  userId: varchar("user_id", { length: 36 }),
  fromUserId: varchar("from_user_id", { length: 36 }),
  type: varchar("type", { length: 50 }).notNull(), // 'new_memory', 'comment', 'reaction', 'milestone_reminder', 'partner_joined'
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  actionUrl: varchar("action_url", { length: 500 }),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: bigint("entity_id", { mode: "bigint" }),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  isDismissed: boolean("is_dismissed").default(false),
  scheduledFor: timestamp("scheduled_for"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

// ============================================================================
// PUSH SUBSCRIPTIONS (browser/mobile push)
// ============================================================================
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  coupleId: bigint("couple_id", { mode: "bigint" }).notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

// ============================================================================
// NOTES (standalone notes: love letters, bucket lists, etc.)
// ============================================================================
export const notes = pgTable("notes", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  coupleId: bigint("couple_id", { mode: "bigint" }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }), // 'love_letter', 'bucket_list', 'wishlist', 'journal', 'recipe', 'other'
  isPrivate: boolean("is_private").default(false),
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

// ============================================================================
// LEGACY STUBS (deprecated - kept for reference, DO NOT USE)
// These are placeholder exports to prevent build errors in old files.
// They point to dummy tables that should NOT be created in the database.
// ============================================================================

// Alias: accounts → couples (for backwards compatibility)
export const accounts = couples;

// Legacy CRM tables - all point to a dummy placeholder
const _legacyStub = pgTable("_legacy_stub_do_not_use", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
});

export const offices = _legacyStub;
export const roles = _legacyStub;
export const userRoles = _legacyStub;
export const accountRoles = _legacyStub;
export const accountTwoFactorSettings = _legacyStub;
export const twoFactor = _legacyStub;
export const locations = _legacyStub;
export const properties = _legacyStub;
export const propertyImages = _legacyStub;
export const listings = _legacyStub;
export const listingActivity = _legacyStub;
export const contacts = _legacyStub;
export const listingContacts = _legacyStub;
export const listingContactActivity = _legacyStub;
export const organizations = _legacyStub;
export const deals = _legacyStub;
export const dealParticipants = _legacyStub;
export const dealActivity = _legacyStub;
export const appointments = _legacyStub;
export const tasks = _legacyStub;
export const documents = _legacyStub;
export const prospects = _legacyStub;
export const prospectHistory = _legacyStub;
export const prospectListingMatches = _legacyStub;
export const testimonials = _legacyStub;
export const websiteProperties = _legacyStub;
export const userComments = _legacyStub;
export const listingContactComments = _legacyStub;
export const appointmentComments = _legacyStub;
export const taskComments = _legacyStub;
export const cartelConfigurations = _legacyStub;
export const feedback = _legacyStub;
export const contactActivity = _legacyStub;
export const emailThreadContexts = _legacyStub;
export const mappings = _legacyStub;
export const fotocasaLogs = _legacyStub;
export const propertyDescriptionExamples = _legacyStub;
export const imageTokenTransactions = _legacyStub;
export const whatsappConversations = _legacyStub;
export const whatsappMessages = _legacyStub;
