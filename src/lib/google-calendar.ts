/* eslint-disable @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */

import { google, type calendar_v3 } from "googleapis";
import { db } from "~/server/db";
import { userIntegrations, appointments } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

// Types for our integration
export interface GoogleCalendarIntegration {
  id: string;
  userId: string;
  provider: string;
  accessToken: string;
  refreshToken: string | null;
  expiryDate: Date | null;
  calendarId: string;
  syncToken: string | null;
  channelId: string | null;
  resourceId: string | null;
  channelExpiration: Date | null;
  syncDirection:
    | "bidirectional"
    | "vesta_to_google"
    | "google_to_vesta"
    | "none";
  isActive: boolean;
}

export interface GoogleEvent {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  reminders?: {
    useDefault: boolean;
    overrides: Array<{ method: string; minutes: number }>;
  };
}

export interface AppointmentData {
  appointmentId: bigint;
  userId: string;
  contactId: bigint | null;
  datetimeStart: Date;
  datetimeEnd: Date;
  notes: string | null;
  type: string | null;
  status: string;
  contactName?: string | null;
  propertyAddress?: string | null;
}

// OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI =
  process.env.NODE_ENV === "production"
    ? "https://v0-vesta-eight.vercel.app/api/google/calendar/callback"
    : "http://localhost:3000/api/google/calendar/callback";

// Calendar API scopes
// Using calendar.events which provides read/write access to calendar events
// Note: Google does not offer write-only scope - read access is unavoidable
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

/**
 * Get OAuth2 client instance
 */
export function getOAuth2Client() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI,
  );
}

/**
 * Generate OAuth consent URL
 */
export function generateAuthUrl(state: string): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state: state,
    prompt: "consent", // Force consent to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Get user's Google Calendar integration
 */
export async function getUserIntegration(
  userId: string,
): Promise<GoogleCalendarIntegration | null> {
  const integration = await db
    .select()
    .from(userIntegrations)
    .where(
      and(
        eq(userIntegrations.userId, userId),
        eq(userIntegrations.provider, "google_calendar"),
        eq(userIntegrations.isActive, true),
      ),
    )
    .limit(1);

  if (!integration.length) return null;

  const row = integration[0]!;
  return {
    id: row.integrationId.toString(),
    userId: row.userId,
    provider: row.provider,
    accessToken: row.accessToken,
    refreshToken: row.refreshToken,
    expiryDate: row.expiryDate,
    calendarId: row.calendarId ?? "primary",
    syncToken: row.syncToken,
    channelId: row.channelId,
    resourceId: row.resourceId,
    channelExpiration: row.channelExpiration,
    syncDirection:
      (row.syncDirection as
        | "bidirectional"
        | "vesta_to_google"
        | "google_to_vesta"
        | "none") ?? "vesta_to_google", // Default to recommended one-way sync
    isActive: row.isActive ?? true,
  };
}

/**
 * Store or update user integration
 */
export async function storeUserIntegration(
  userId: string,
  tokens: any,
  channelData?: { channelId: string; resourceId: string; expiration: Date },
): Promise<void> {
  const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

  const integrationData = {
    userId,
    provider: "google_calendar",
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || null,
    expiryDate,
    calendarId: "primary",
    syncToken: null,
    channelId: channelData?.channelId || null,
    resourceId: channelData?.resourceId || null,
    channelExpiration: channelData?.expiration || null,
    syncDirection: "vesta_to_google" as const, // Default to recommended one-way sync
    isActive: true,
  };

  // Check if integration already exists
  const existing = await getUserIntegration(userId);

  if (existing) {
    // Update existing integration
    await db
      .update(userIntegrations)
      .set({
        ...integrationData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userIntegrations.userId, userId),
          eq(userIntegrations.provider, "google_calendar"),
        ),
      );
  } else {
    // Create new integration
    await db.insert(userIntegrations).values(integrationData);
  }
}

/**
 * Get authenticated Calendar API client
 */
export async function getCalendarClient(
  userId: string,
): Promise<calendar_v3.Calendar | null> {
  const integration = await getUserIntegration(userId);
  if (!integration) return null;

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
    expiry_date: integration.expiryDate?.getTime(),
  });

  // Handle token refresh automatically
  oauth2Client.on("tokens", (tokens) => {
    if (tokens.refresh_token) {
      void storeUserIntegration(userId, tokens);
    }
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

/**
 * Convert local appointment to Google Calendar event
 */
export function toGoogleEvent(
  appointment: AppointmentData,
  userTimezone = "Europe/Madrid",
): GoogleEvent {
  const contactName = appointment.contactName || "Contact";
  const appointmentType = appointment.type || "Cita";

  return {
    summary: `${appointmentType} - ${contactName}`,
    description: appointment.notes || "",
    start: {
      dateTime: appointment.datetimeStart.toISOString(),
      timeZone: userTimezone,
    },
    end: {
      dateTime: appointment.datetimeEnd.toISOString(),
      timeZone: userTimezone,
    },
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: 15 }],
    },
  };
}

/**
 * Convert Google Calendar event to local appointment data
 */
export function fromGoogleEvent(
  googleEvent: calendar_v3.Schema$Event,
  userId: string,
): Partial<AppointmentData> {
  const summary = googleEvent.summary || "";
  const appointmentType = extractTypeFromSummary(summary);

  return {
    userId,
    datetimeStart: new Date(
      googleEvent.start?.dateTime || googleEvent.start?.date || "",
    ),
    datetimeEnd: new Date(
      googleEvent.end?.dateTime || googleEvent.end?.date || "",
    ),
    notes: googleEvent.description || "",
    type: appointmentType,
    status: "Scheduled",
  };
}

/**
 * Extract appointment type from Google event summary
 */
function extractTypeFromSummary(summary: string): string {
  const typeMap: Record<string, string> = {
    Visita: "Visita",
    Reunión: "Reunión",
    Firma: "Firma",
    Cierre: "Cierre",
    Viaje: "Viaje",
  };

  for (const [key, value] of Object.entries(typeMap)) {
    if (summary.includes(key)) return value;
  }
  return "Reunión"; // Default fallback
}

/**
 * Create event in Google Calendar
 */
export async function createGoogleEvent(
  userId: string,
  appointment: AppointmentData,
  userTimezone?: string,
): Promise<{ eventId: string; etag: string } | null> {
  const calendar = await getCalendarClient(userId);
  if (!calendar) return null;

  const integration = await getUserIntegration(userId);
  if (!integration) return null;

  try {
    const googleEvent = toGoogleEvent(appointment, userTimezone);

    const response = await calendar.events.insert({
      calendarId: integration.calendarId,
      requestBody: googleEvent,
    });

    if (response.data.id && response.data.etag) {
      return {
        eventId: response.data.id,
        etag: response.data.etag,
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to create Google Calendar event:", error);
    return null;
  }
}

/**
 * Update event in Google Calendar
 */
export async function updateGoogleEvent(
  userId: string,
  eventId: string,
  appointment: AppointmentData,
  etag?: string,
  userTimezone?: string,
): Promise<{ etag: string } | null> {
  const calendar = await getCalendarClient(userId);
  if (!calendar) return null;

  const integration = await getUserIntegration(userId);
  if (!integration) return null;

  try {
    const googleEvent = toGoogleEvent(appointment, userTimezone);

    const requestOptions: calendar_v3.Params$Resource$Events$Update = {
      calendarId: integration.calendarId,
      eventId: eventId,
      requestBody: googleEvent,
    };

    // Note: If-Match header handling would need to be done differently with googleapis
    // For now, we'll rely on etag in the response for conflict detection

    const response = await calendar.events.update(requestOptions);

    if (response.data.etag) {
      return { etag: response.data.etag };
    }
    return null;
  } catch (error) {
    console.error("Failed to update Google Calendar event:", error);
    return null;
  }
}

/**
 * Delete event from Google Calendar
 */
export async function deleteGoogleEvent(
  userId: string,
  eventId: string,
): Promise<boolean> {
  const calendar = await getCalendarClient(userId);
  if (!calendar) return false;

  const integration = await getUserIntegration(userId);
  if (!integration) return false;

  try {
    await calendar.events.delete({
      calendarId: integration.calendarId,
      eventId: eventId,
    });
    return true;
  } catch (error) {
    console.error("Failed to delete Google Calendar event:", error);
    return false;
  }
}

/**
 * Start watching for calendar changes (setup webhook)
 */
export async function startWatchChannel(userId: string): Promise<boolean> {
  const calendar = await getCalendarClient(userId);
  if (!calendar) return false;

  const integration = await getUserIntegration(userId);
  if (!integration) return false;

  try {
    // Skip webhook setup in development since Google requires HTTPS
    if (process.env.NODE_ENV !== "production") {
      console.log("Skipping webhook setup in development (requires HTTPS)");
      return true;
    }

    const channelId = `vesta-${userId}-${nanoid(8)}`;
    const webhookUrl =
      "https://v0-vesta-eight.vercel.app/api/google/calendar/webhook";

    const expiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const response = await calendar.events.watch({
      calendarId: integration.calendarId,
      requestBody: {
        id: channelId,
        type: "web_hook",
        address: webhookUrl,
        expiration: expiration.getTime().toString(),
      },
    });

    if (response.data.id && response.data.resourceId) {
      // Update integration with channel details
      await db
        .update(userIntegrations)
        .set({
          channelId: response.data.id,
          resourceId: response.data.resourceId,
          channelExpiration: expiration,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userIntegrations.userId, userId),
            eq(userIntegrations.provider, "google_calendar"),
          ),
        );

      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to start watch channel:", error);
    return false;
  }
}

/**
 * Stop watching for calendar changes
 */
export async function stopWatchChannel(userId: string): Promise<boolean> {
  const calendar = await getCalendarClient(userId);
  if (!calendar) return false;

  const integration = await getUserIntegration(userId);
  if (!integration?.channelId || !integration?.resourceId) return false;

  try {
    await calendar.channels.stop({
      requestBody: {
        id: integration.channelId,
        resourceId: integration.resourceId,
      },
    });

    // Clear channel details from integration
    await db
      .update(userIntegrations)
      .set({
        channelId: null,
        resourceId: null,
        channelExpiration: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userIntegrations.userId, userId),
          eq(userIntegrations.provider, "google_calendar"),
        ),
      );

    return true;
  } catch (error) {
    console.error("Failed to stop watch channel:", error);
    return false;
  }
}

/**
 * Disconnect user's Google Calendar integration
 */
export async function disconnectIntegration(userId: string): Promise<boolean> {
  try {
    // Stop watch channel if active
    await stopWatchChannel(userId);

    // Soft delete integration
    await db
      .update(userIntegrations)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userIntegrations.userId, userId),
          eq(userIntegrations.provider, "google_calendar"),
        ),
      );

    // Remove Google Calendar metadata from appointments but keep local data
    await db
      .update(appointments)
      .set({
        googleEventId: null,
        googleEtag: null,
        lastSyncedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(appointments.userId, userId));

    return true;
  } catch (error) {
    console.error("Failed to disconnect Google Calendar integration:", error);
    return false;
  }
}

/**
 * Update appointment Google metadata
 */
export async function updateAppointmentGoogleMeta(
  appointmentId: bigint,
  metadata: {
    googleEventId?: string | null;
    googleEtag?: string | null;
    lastSyncedAt?: Date;
  },
): Promise<void> {
  await db
    .update(appointments)
    .set({
      ...metadata,
      updatedAt: new Date(),
    })
    .where(eq(appointments.appointmentId, appointmentId));
}
