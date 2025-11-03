/* eslint-disable @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unused-vars */

import type { calendar_v3 } from "googleapis";
import { db } from "~/server/db";
import { appointments, contacts, userIntegrations } from "~/server/db/schema";
import { eq, and, or } from "drizzle-orm";
import {
  getCalendarClient,
  getUserIntegration,
  fromGoogleEvent,
  createGoogleEvent,
  updateGoogleEvent,
  deleteGoogleEvent,
  updateAppointmentGoogleMeta,
} from "~/lib/google-calendar";

interface SyncResult {
  success: boolean;
  syncedEvents?: number;
  error?: string;
}

interface CreateDefaultContactResult {
  contactId: bigint;
  created: boolean;
}

/**
 * Sync events from Google Calendar to local database
 */
export async function syncFromGoogle(userId: string): Promise<SyncResult> {
  try {
    const calendar = await getCalendarClient(userId);
    if (!calendar) {
      return { success: false, error: "No calendar client available" };
    }

    const integration = await getUserIntegration(userId);
    if (!integration) {
      return { success: false, error: "No integration found" };
    }

    // Check sync direction preference
    if (
      integration.syncDirection === "vesta_to_google" ||
      integration.syncDirection === "none"
    ) {
      console.log(
        `Skipping sync from Google - sync direction is ${integration.syncDirection}`,
      );
      return { success: true, syncedEvents: 0 };
    }

    // Prepare sync parameters
    const listParams: calendar_v3.Params$Resource$Events$List = {
      calendarId: integration.calendarId,
      maxResults: 100,
      singleEvents: true,
      showDeleted: true, // Include deleted events
    };

    // Use sync token for incremental sync if available
    if (integration.syncToken) {
      listParams.syncToken = integration.syncToken;
    } else {
      // Full sync - get events from 30 days ago to 90 days in the future
      const now = new Date();
      const pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const futureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      listParams.timeMin = pastDate.toISOString();
      listParams.timeMax = futureDate.toISOString();
    }

    try {
      const response = await calendar.events.list(listParams);
      const events = response.data.items || [];
      const newSyncToken = response.data.nextSyncToken;

      let syncedCount = 0;

      for (const event of events) {
        if (!event.id) continue;

        if (event.status === "cancelled") {
          // Handle deleted events
          await handleDeletedGoogleEvent(userId, event.id);
        } else {
          // Handle created/updated events
          const success = await handleGoogleEventUpdate(userId, event);
          if (success) syncedCount++;
        }
      }

      // Update sync token for next incremental sync
      if (newSyncToken) {
        await db
          .update(userIntegrations)
          .set({
            syncToken: newSyncToken,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(userIntegrations.userId, userId),
              eq(userIntegrations.provider, "google_calendar"),
            ),
          );
      }

      return { success: true, syncedEvents: syncedCount };
    } catch (apiError: any) {
      // Handle sync token invalidation
      if (apiError.code === 410 || apiError.message?.includes("Sync token")) {
        console.log(
          "Sync token invalid, performing full sync for user:",
          userId,
        );

        // Clear sync token and retry
        await db
          .update(userIntegrations)
          .set({
            syncToken: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(userIntegrations.userId, userId),
              eq(userIntegrations.provider, "google_calendar"),
            ),
          );

        // Retry without sync token
        return syncFromGoogle(userId);
      }
      throw apiError;
    }
  } catch (error) {
    console.error("Error syncing from Google Calendar:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Handle a Google Calendar event update (create or update local appointment)
 */
async function handleGoogleEventUpdate(
  userId: string,
  googleEvent: calendar_v3.Schema$Event,
): Promise<boolean> {
  try {
    if (
      !googleEvent.id ||
      !googleEvent.start?.dateTime ||
      !googleEvent.end?.dateTime
    ) {
      return false; // Skip all-day events or events without proper time
    }

    // Check if we already have this event
    const existingAppointment = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.userId, userId),
          eq(appointments.googleEventId, googleEvent.id),
        ),
      )
      .limit(1);

    if (existingAppointment.length > 0) {
      // Update existing appointment
      const appointment = existingAppointment[0]!;

      const appointmentData = fromGoogleEvent(googleEvent, userId);

      await db
        .update(appointments)
        .set({
          datetimeStart: appointmentData.datetimeStart,
          datetimeEnd: appointmentData.datetimeEnd,
          notes: appointmentData.notes,
          type: appointmentData.type,
          googleEtag: googleEvent.etag || null,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(appointments.appointmentId, appointment.appointmentId));

      return true;
    } else {
      // Create new appointment
      const appointmentData = fromGoogleEvent(googleEvent, userId);

      // We need a contact ID - create a default one if needed
      const defaultContact = await getOrCreateDefaultContact(
        userId,
        googleEvent,
      );

      const newAppointment = {
        userId: appointmentData.userId!,
        contactId: defaultContact.contactId,
        datetimeStart: appointmentData.datetimeStart!,
        datetimeEnd: appointmentData.datetimeEnd!,
        notes: appointmentData.notes,
        type: appointmentData.type,
        status: appointmentData.status || "Scheduled",
        googleEventId: googleEvent.id,
        googleEtag: googleEvent.etag || null,
        lastSyncedAt: new Date(),
        isActive: true,
      };

      await db.insert(appointments).values(newAppointment);
      return true;
    }
  } catch (error) {
    console.error("Error handling Google event update:", error);
    return false;
  }
}

/**
 * Handle a deleted Google Calendar event
 */
async function handleDeletedGoogleEvent(
  userId: string,
  googleEventId: string,
): Promise<void> {
  try {
    // Soft delete the appointment
    await db
      .update(appointments)
      .set({
        isActive: false,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(appointments.userId, userId),
          eq(appointments.googleEventId, googleEventId),
        ),
      );
  } catch (error) {
    console.error("Error handling deleted Google event:", error);
  }
}

/**
 * Get or create a default contact for Google Calendar events
 */
async function getOrCreateDefaultContact(
  userId: string,
  googleEvent: calendar_v3.Schema$Event,
): Promise<CreateDefaultContactResult> {
  try {
    // Try to extract contact name from event summary
    const summary = googleEvent.summary || "Google Calendar Event";
    const parts = summary.split(" - ");
    const contactName =
      parts.length > 1 ? parts[1]!.trim() : "Google Calendar Contact";

    // Check if we have a contact with this name
    const existingContact = await db
      .select()
      .from(contacts)
      .where(
        and(eq(contacts.firstName, contactName), eq(contacts.lastName, "")),
      )
      .limit(1);

    if (existingContact.length > 0) {
      return { contactId: existingContact[0]!.contactId, created: false };
    }

    // Create new contact
    const [newContact] = await db
      .insert(contacts)
      .values({
        accountId: BigInt(1), // Use default account ID - in production you'd get this from user
        firstName: contactName,
        lastName: "",
        email: null,
        phone: null,
        additionalInfo: { source: "google_calendar" },
        isActive: true,
      })
      .returning();

    return { contactId: newContact!.contactId, created: true };
  } catch (error) {
    console.error("Error creating default contact:", error);
    // Return a fallback contact ID - you might want to have a system default
    throw new Error("Failed to create contact for Google Calendar event");
  }
}

/**
 * Sync appointment to Google Calendar
 */
export async function syncToGoogle(
  userId: string,
  appointmentId: bigint,
  operation: "create" | "update" | "delete",
): Promise<boolean> {
  try {
    const integration = await getUserIntegration(userId);
    if (!integration) {
      console.log("No Google Calendar integration for user:", userId);
      return false; // User doesn't have Google Calendar connected
    }

    // Check sync direction preference
    if (
      integration.syncDirection === "google_to_vesta" ||
      integration.syncDirection === "none"
    ) {
      console.log(
        `Skipping sync to Google - sync direction is ${integration.syncDirection}`,
      );
      return false;
    }

    // Get appointment data
    const appointment = await db
      .select({
        appointmentId: appointments.appointmentId,
        userId: appointments.userId,
        contactId: appointments.contactId,
        datetimeStart: appointments.datetimeStart,
        datetimeEnd: appointments.datetimeEnd,
        notes: appointments.notes,
        type: appointments.type,
        status: appointments.status,
        googleEventId: appointments.googleEventId,
        googleEtag: appointments.googleEtag,
        contactName: contacts.firstName,
      })
      .from(appointments)
      .leftJoin(contacts, eq(appointments.contactId, contacts.contactId))
      .where(eq(appointments.appointmentId, appointmentId))
      .limit(1);

    if (!appointment.length) {
      console.error("Appointment not found:", appointmentId);
      return false;
    }

    const appointmentData = appointment[0]!;

    switch (operation) {
      case "create":
        const createResult = await createGoogleEvent(userId, appointmentData);
        if (createResult) {
          await updateAppointmentGoogleMeta(appointmentId, {
            googleEventId: createResult.eventId,
            googleEtag: createResult.etag,
            lastSyncedAt: new Date(),
          });
          return true;
        }
        break;

      case "update":
        if (appointmentData.googleEventId) {
          const updateResult = await updateGoogleEvent(
            userId,
            appointmentData.googleEventId,
            appointmentData,
            appointmentData.googleEtag || undefined,
          );
          if (updateResult) {
            await updateAppointmentGoogleMeta(appointmentId, {
              googleEtag: updateResult.etag,
              lastSyncedAt: new Date(),
            });
            return true;
          }
        }
        break;

      case "delete":
        if (appointmentData.googleEventId) {
          const deleteResult = await deleteGoogleEvent(
            userId,
            appointmentData.googleEventId,
          );
          if (deleteResult) {
            await updateAppointmentGoogleMeta(appointmentId, {
              googleEventId: null,
              googleEtag: null,
              lastSyncedAt: new Date(),
            });
            return true;
          }
        }
        break;
    }

    return false;
  } catch (error) {
    console.error("Error syncing to Google Calendar:", error);
    return false;
  }
}

/**
 * Perform initial sync after connecting Google Calendar
 */
export async function performInitialSync(userId: string): Promise<SyncResult> {
  console.log("Performing initial sync for user:", userId);
  return syncFromGoogle(userId);
}
