import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { appointments, tasks, users, contacts, listings, properties } from "~/server/db/schema";
import { eq, and, gte, lte, isNotNull } from "drizzle-orm";
import { createNotificationInternal } from "~/server/queries/notification";
import {
  notifyAppointmentReminder,
  notifyTaskDueSoon,
  notifyTaskOverdue,
} from "~/server/services/notification-service";
import { sendTaskDigestEmail } from "~/server/services/task-digest-email-service";
import { sendCustomerAppointmentReminder } from "~/server/services/customer-email-service";
import { getListingCompactById } from "~/server/queries/listing";
import { reminderExistsForEntity, customerReminderExistsForEntity } from "~/server/queries/notification";
import { getEmailSettingsForAccount, getReminderTimeframe, shouldIncludeTaskByUrgency, isOverdueDigestEnabled } from "~/server/services/email-config-helpers";
import type { TaskReminderTimeframe } from "~/types/notifications";

/**
 * Get current time adjusted for Spain timezone (Europe/Madrid).
 * 
 * CRITICAL: Appointments are stored with local time values in UTC format
 * (e.g., 14:00 Spain time is stored as 14:00 UTC).
 * To compare correctly, we need "now" to also use Spain time values in UTC format.
 * 
 * This function converts the real UTC time to Spain local time,
 * then creates a Date with those values as UTC - matching how appointments are stored.
 */
function getSpainTimeAsUTC(): Date {
  const now = new Date();
  
  // Format current time in Spain timezone
  const spainTimeStr = now.toLocaleString('en-GB', { 
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Parse the Spain time string (format: "DD/MM/YYYY, HH:mm:ss")
  const [datePart, timePart] = spainTimeStr.split(', ');
  const [day, month, year] = datePart!.split('/').map(Number);
  const [hour, minute, second] = timePart!.split(':').map(Number);
  
  // Create a Date with Spain time values stored as UTC
  // This matches how appointments are stored (local time values in UTC format)
  return new Date(Date.UTC(year!, month! - 1, day!, hour!, minute!, second!));
}

/**
 * Cron job handler for scheduled notification reminders
 * Runs every 15 minutes via Vercel Cron
 * 
 * Creates notifications for:
 * - Appointments starting in 30min, 1hr, 1day
 * - Tasks due tomorrow or today
 * - Tasks that are overdue
 */
export async function GET(request: NextRequest) {
  try {
    // Verify CRON_SECRET for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 },
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use Spain timezone for comparisons since appointments are stored
    // with local time values in UTC format
    const now = getSpainTimeAsUTC();
    const remindersCreated: number[] = [];
    const tasksNotified: number[] = [];
    
    // Logging for debugging
    const logs: string[] = [];
    const structuredLogs: {
      header: { startTime: string; spainTime: string };
      appointments: Array<{
        id: number;
        title: string;
        type: string;
        startsAt: string;
        timeUntil: string;
        status: string;
        details: string[];
      }>;
      tasks: Array<{
        id: number;
        title: string;
        status: string;
        details: string[];
      }>;
      summary: { remindersCreated: number; customerRemindersCreated: number; tasksNotified: number; completed: string };
    } = {
      header: {
        startTime: now.toISOString(),
        spainTime: `${now.getUTCHours()}:${now.getUTCMinutes().toString().padStart(2, '0')}`,
      },
      appointments: [],
      tasks: [],
      summary: {
        remindersCreated: 0,
        customerRemindersCreated: 0,
        tasksNotified: 0,
        completed: "",
      },
    };
    
    const log = (msg: string) => {
      console.log(`[CRON] ${msg}`);
      logs.push(msg);
    };
    
    log(`🕐 Cron started at Spain time: ${now.toISOString()} (UTC hours: ${now.getUTCHours()}:${now.getUTCMinutes().toString().padStart(2, '0')})`);

    // ===== APPOINTMENT REMINDERS =====

    // Calculate time windows for different reminder timeframes
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000); // Extended for 24h window

    // Find appointments starting within next 25 hours (to catch 24h window)
    const upcomingAppointments = await db
      .select({
        appointmentId: appointments.appointmentId,
        userId: appointments.userId,
        contactId: appointments.contactId,
        listingId: appointments.listingId,
        assignedTo: appointments.assignedTo,
        title: appointments.title,
        datetimeStart: appointments.datetimeStart,
        datetimeEnd: appointments.datetimeEnd,
        status: appointments.status,
        type: appointments.type,
        tripTimeMinutes: appointments.tripTimeMinutes,
        accountId: users.accountId,
        // Agent info (for customer emails)
        agentName: users.name,
        agentPhone: users.phone,
        agentEmail: users.email,
        // Contact info (customer for customer emails)
        customerEmail: contacts.email,
        customerFirstName: contacts.firstName,
        customerLastName: contacts.lastName,
        // Property info
        propertyStreet: properties.street,
        propertyAddressDetails: properties.addressDetails,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.userId, users.id))
      .leftJoin(contacts, eq(appointments.contactId, contacts.contactId))
      .leftJoin(listings, eq(appointments.listingId, listings.listingId))
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(appointments.isActive, true),
          eq(appointments.status, "Scheduled"),
          gte(appointments.datetimeStart, now),
          lte(appointments.datetimeStart, in25Hours),
        ),
      );

    log(`📅 Found ${upcomingAppointments.length} upcoming appointments in next 25 hours`);

    // Process each appointment and check which reminder timeframe applies
    for (const appointment of upcomingAppointments) {
      const accountId = appointment.accountId;
      if (!accountId || typeof accountId !== "bigint") {
        const skipMsg = `⚠️ Skipping appointment ${appointment.appointmentId}: no accountId`;
        log(`  ${skipMsg}`);
        structuredLogs.appointments.push({
          id: Number(appointment.appointmentId),
          title: appointment.title,
          type: appointment.type ?? "visita",
          startsAt: new Date(appointment.datetimeStart).toISOString(),
          timeUntil: "N/A",
          status: "⚠️ Skipped (no accountId)",
          details: [skipMsg],
        });
        continue;
      }

      // Get settings for this account
      const settings = await getEmailSettingsForAccount(BigInt(accountId));
      
      const startTime = new Date(appointment.datetimeStart);
      const timeUntilStart = startTime.getTime() - now.getTime();
      const hoursUntilStart = timeUntilStart / (1000 * 60 * 60);
      const minutesUntilStart = timeUntilStart / (1000 * 60);

      // Normalize appointment type to lowercase to match settings keys
      // Database stores "Visita", "Firma" but settings use "visita", "firma"
      const appointmentTypeRaw = appointment.type ?? "visita";
      const appointmentType = appointmentTypeRaw.toLowerCase() as keyof typeof settings.appointments;
      const startsAtFormatted = `${startTime.getUTCHours()}:${startTime.getUTCMinutes().toString().padStart(2, '0')}`;
      const timeUntilFormatted = `${hoursUntilStart.toFixed(2)}h / ${Math.round(minutesUntilStart)}min`;
      
      // Create structured log entry for this appointment
      const appointmentLog: typeof structuredLogs.appointments[0] = {
        id: Number(appointment.appointmentId),
        title: appointment.title,
        type: appointmentTypeRaw, // Keep original case for display
        startsAt: startsAtFormatted,
        timeUntil: timeUntilFormatted,
        status: "",
        details: [],
      };

      log(`  📌 Appointment #${appointment.appointmentId} "${appointment.title}" (type: ${appointmentTypeRaw})`);
      log(`     Starts at: ${startsAtFormatted} (in ${timeUntilFormatted})`);

      // Determine which reminder timeframe applies (check in order of urgency)
      // Windows are designed to:
      // 1. Fire reminders at approximately the right time (with 15-min tolerance for cron)
      // 2. Avoid gaps where no reminder would fire
      // 3. Deduplication prevents multiple reminders for the same timeframe
      let reminderTimeframe: "30_min" | "1h" | "12h" | "1_day" | null = null;
      
      // 30min reminder: Fire when 15-45 minutes before (wider window, cron runs every 15 min)
      if (minutesUntilStart <= 45 && minutesUntilStart > 15) {
        reminderTimeframe = "30_min";
      } 
      // 1h reminder: Fire when 45min-1.5hr before (catches appointments 1-2 hours out)
      else if (hoursUntilStart <= 1.5 && hoursUntilStart > 0.75) {
        reminderTimeframe = "1h";
      } 
      // 12h reminder: Fire when 11-13 hours before (2-hour window centered on 12h)
      else if (hoursUntilStart <= 13 && hoursUntilStart > 11) {
        reminderTimeframe = "12h";
      } 
      // 24h reminder: Fire when 22-25 hours before (3-hour window to catch 24h mark)
      else if (hoursUntilStart <= 25 && hoursUntilStart > 22) {
        reminderTimeframe = "1_day";
      }

      if (!reminderTimeframe) {
        const gapMsg = `⏳ Not in any reminder window (gap: ${hoursUntilStart.toFixed(2)}h before)`;
        log(`     ${gapMsg}`);
        appointmentLog.status = "⏳ Not in reminder window";
        appointmentLog.details.push(gapMsg);
        structuredLogs.appointments.push(appointmentLog);
        continue;
      }
      
      log(`     🎯 In ${reminderTimeframe} window`);
      appointmentLog.details.push(`🎯 In ${reminderTimeframe} window`);

      // Check if notification already exists for this timeframe
      const exists = await reminderExistsForEntity(
        BigInt(accountId),
        "appointment",
        appointment.appointmentId,
        "appointment_reminder",
        reminderTimeframe,
      );

      if (exists) {
        const skipMsg = `⏭️ Skipping: ${reminderTimeframe} reminder already sent`;
        log(`     ${skipMsg}`);
        appointmentLog.status = "⏭️ Reminder already sent";
        appointmentLog.details.push(skipMsg);
        structuredLogs.appointments.push(appointmentLog);
        continue;
      }

      // Check if this reminder is enabled in settings
      const appointmentSettings = settings.appointments[appointmentType];
      
      if (!appointmentSettings || !("notify24h" in appointmentSettings)) {
        const noSettingsMsg = `⚠️ No settings found for appointment type: ${appointmentType}`;
        log(`     ${noSettingsMsg}`);
        appointmentLog.status = "⚠️ No settings found";
        appointmentLog.details.push(noSettingsMsg);
        structuredLogs.appointments.push(appointmentLog);
        continue;
      }

      let isEnabled = false;
      switch (reminderTimeframe) {
        case "1_day":
          isEnabled = appointmentSettings.notify24h.emailEnabled;
          break;
        case "12h":
          isEnabled = appointmentSettings.notify12h.emailEnabled;
          break;
        case "1h":
          isEnabled = appointmentSettings.notify1h.emailEnabled;
          break;
        case "30_min":
          isEnabled = appointmentSettings.notify30min.emailEnabled;
          break;
      }

      if (!isEnabled) {
        const disabledMsg = `❌ ${reminderTimeframe} reminder DISABLED in settings for ${appointmentType}`;
        log(`     ${disabledMsg}`);
        appointmentLog.status = "❌ Reminder disabled";
        appointmentLog.details.push(disabledMsg);
        structuredLogs.appointments.push(appointmentLog);
        continue;
      }

      log(`     ✅ ${reminderTimeframe} reminder ENABLED - creating notification...`);
      appointmentLog.details.push(`✅ ${reminderTimeframe} reminder ENABLED - creating notification...`);
      
      try {
        await notifyAppointmentReminder(
          {
            appointmentId: appointment.appointmentId,
            userId: appointment.userId,
            contactId: appointment.contactId,
            listingId: appointment.listingId ?? undefined,
            assignedTo: appointment.assignedTo ?? undefined,
            title: appointment.title,
            datetimeStart: appointment.datetimeStart,
            datetimeEnd: appointment.datetimeEnd,
            status: "Scheduled",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          BigInt(accountId),
          reminderTimeframe,
        );
        remindersCreated.push(1);
        const successMsg = `🎉 Successfully created ${reminderTimeframe} reminder!`;
        log(`     ${successMsg}`);
        appointmentLog.status = "🎉 Reminder created";
        appointmentLog.details.push(successMsg);
        structuredLogs.appointments.push(appointmentLog);
      } catch (error) {
        const errorMsg = `💥 Error creating reminder: ${error instanceof Error ? error.message : "Unknown"}`;
        log(`     ${errorMsg}`);
        appointmentLog.status = "💥 Error creating reminder";
        appointmentLog.details.push(errorMsg);
        structuredLogs.appointments.push(appointmentLog);
        console.error(
          `Error creating ${reminderTimeframe} reminder for appointment ${appointment.appointmentId}:`,
          error,
        );
      }

      // Handle travel time reminders (if trip time is set)
      if (appointment.tripTimeMinutes) {
        // Use the already normalized appointmentType from above
        const appointmentSettings = settings.appointments[appointmentType];
        
        if (appointmentSettings && "notifyTravelTime" in appointmentSettings && appointmentSettings.notifyTravelTime.emailEnabled) {
          const travelTimeMs = appointment.tripTimeMinutes * 60 * 1000;
          const travelTimeReminder = new Date(startTime.getTime() - travelTimeMs);
          const timeUntilTravelReminder = travelTimeReminder.getTime() - now.getTime();
          
          // Check if it's time to send travel reminder (within 15 minute window before travel time)
          if (timeUntilTravelReminder >= 0 && timeUntilTravelReminder <= 15 * 60 * 1000) {
            const existsTravel = await reminderExistsForEntity(
              BigInt(accountId),
              "appointment",
              appointment.appointmentId,
              "appointment_reminder",
              "travel_time",
            );

            if (!existsTravel) {
              try {
                await notifyAppointmentReminder(
                  {
                    appointmentId: appointment.appointmentId,
                    userId: appointment.userId,
                    contactId: appointment.contactId,
                    listingId: appointment.listingId ?? undefined,
                    assignedTo: appointment.assignedTo ?? undefined,
                    title: appointment.title,
                    datetimeStart: appointment.datetimeStart,
                    datetimeEnd: appointment.datetimeEnd,
                    status: "Scheduled",
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                  BigInt(accountId),
                  "travel_time",
                );
                remindersCreated.push(1);
              } catch (error) {
                console.error(
                  `Error creating travel time reminder for appointment ${appointment.appointmentId}:`,
                  error,
                );
              }
            }
          }
        }
      }
    }

    // ===== CUSTOMER APPOINTMENT REMINDERS =====
    // Send reminder emails directly to customers (contacts) for their upcoming appointments

    // Helper to add delay between API calls to avoid rate limiting (Resend: 2 req/sec)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const customerRemindersCreated: number[] = [];
    log(`\n📧 Processing customer appointment reminders...`);

    for (const appointment of upcomingAppointments) {
      const accountId = appointment.accountId;
      if (!accountId || typeof accountId !== "bigint") continue;

      // Skip if no contact or no customer email
      if (!appointment.contactId || !appointment.customerEmail) {
        continue;
      }

      const startTime = new Date(appointment.datetimeStart);
      const timeUntilStart = startTime.getTime() - now.getTime();
      const hoursUntilStart = timeUntilStart / (1000 * 60 * 60);
      const minutesUntilStart = timeUntilStart / (1000 * 60);

      // Determine customer reminder timeframe (same windows as internal reminders)
      let customerReminderTimeframe: "24h" | "12h" | "1h" | "30min" | "travel_time" | null = null;

      // 30min reminder
      if (minutesUntilStart <= 45 && minutesUntilStart > 15) {
        customerReminderTimeframe = "30min";
      }
      // 1h reminder
      else if (hoursUntilStart <= 1.5 && hoursUntilStart > 0.75) {
        customerReminderTimeframe = "1h";
      }
      // 12h reminder
      else if (hoursUntilStart <= 13 && hoursUntilStart > 11) {
        customerReminderTimeframe = "12h";
      }
      // 24h reminder
      else if (hoursUntilStart <= 25 && hoursUntilStart > 22) {
        customerReminderTimeframe = "24h";
      }

      if (!customerReminderTimeframe) {
        continue;
      }

      // Check if customer reminder already exists for this timeframe
      const customerReminderExists = await customerReminderExistsForEntity(
        BigInt(accountId),
        "appointment",
        appointment.appointmentId,
        customerReminderTimeframe,
      );

      if (customerReminderExists) {
        log(`  ⏭️ Customer reminder ${customerReminderTimeframe} already sent for appointment #${appointment.appointmentId}`);
        continue;
      }

      // Normalize appointment type for customer email
      const appointmentTypeRaw = appointment.type ?? "visita";
      const appointmentTypeNormalized = appointmentTypeRaw.toLowerCase() as "visita" | "firma" | "reunion" | "llamada" | "cierre" | "viaje";

      // Build property address from basic query data
      let propertyAddress: string | undefined = undefined;
      if (appointment.propertyStreet) {
        propertyAddress = appointment.propertyStreet;
        if (appointment.propertyAddressDetails) {
          propertyAddress += `, ${appointment.propertyAddressDetails}`;
        }
      }

      // Fetch listing data for property card (reusing getListingCompactById)
      let listingData: {
        listingId?: string;
        title?: string | null;
        street?: string | null;
        propertyType?: string | null;
        listingType?: string;
        price?: string;
        bedrooms?: number | null;
        bathrooms?: string | number | null;
        squareMeter?: number | null;
        builtSurfaceArea?: number | null;
        city?: string | null;
        province?: string | null;
        referenceNumber?: string | null;
        imageUrl?: string | null;
      } | undefined = undefined;

      if (appointment.listingId) {
        try {
          const listing = await getListingCompactById(
            appointment.listingId,
            Number(accountId),
          );
          if (listing) {
            listingData = {
              listingId: listing.listingId?.toString(),
              title: listing.title,
              street: listing.street,
              propertyType: listing.propertyType,
              listingType: listing.listingType,
              price: listing.price,
              bedrooms: listing.bedrooms,
              bathrooms: listing.bathrooms,
              squareMeter: listing.squareMeter,
              builtSurfaceArea: listing.builtSurfaceArea ? Number(listing.builtSurfaceArea) : null,
              city: listing.city,
              province: listing.province,
              referenceNumber: listing.referenceNumber,
              imageUrl: listing.imageUrl,
            };
            // Update property address from listing if not already set
            if (!propertyAddress && listing.street) {
              propertyAddress = listing.street;
            }
          }
        } catch (listingError) {
          console.error(`Error fetching listing data for customer reminder:`, listingError);
          // Continue without listing data - email will still be sent
        }
      }

      log(`  📤 Sending ${customerReminderTimeframe} customer reminder for appointment #${appointment.appointmentId} to ${appointment.customerEmail}`);

      try {
        // Add delay to avoid Resend rate limiting (2 req/sec limit)
        await delay(600);

        // Send the customer reminder email
        const result = await sendCustomerAppointmentReminder(
          appointment.customerEmail,
          BigInt(accountId),
          {
            appointmentTitle: appointment.title,
            appointmentType: appointmentTypeNormalized,
            datetimeStart: appointment.datetimeStart.toISOString(),
            datetimeEnd: appointment.datetimeEnd?.toISOString(),
            reminderTimeframe: customerReminderTimeframe,
            contactName: appointment.agentName,
            contactPhone: appointment.agentPhone ?? undefined,
            contactEmail: appointment.agentEmail,
            propertyAddress,
            travelTime: appointment.tripTimeMinutes ?? undefined,
            listing: listingData,
          },
        );

        if (result.success) {
          // Create a notification record to prevent duplicate sends
          await createNotificationInternal({
            accountId: BigInt(accountId),
            userId: null, // Customer notifications don't have a userId
            fromUserId: appointment.userId,
            type: "customer_appointment_reminder",
            title: `Recordatorio de cita enviado a ${appointment.customerFirstName ?? "cliente"}`,
            message: `Recordatorio ${customerReminderTimeframe} enviado a ${appointment.customerEmail}`,
            category: "appointments",
            entityType: "appointment",
            entityId: appointment.appointmentId,
            metadata: {
              reminderTimeframe: customerReminderTimeframe,
              customerEmail: appointment.customerEmail,
              appointmentType: appointmentTypeNormalized,
            },
            deliveryChannel: "email",
          });

          customerRemindersCreated.push(1);
          log(`  ✅ Customer reminder sent successfully`);
        } else {
          log(`  ❌ Customer reminder not sent: ${result.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        log(`  💥 Error sending customer reminder: ${errorMsg}`);
        console.error(`Error sending customer reminder for appointment ${appointment.appointmentId}:`, error);
      }
    }

    log(`📧 Customer reminders sent: ${customerRemindersCreated.length}`);

    // ===== TASK REMINDERS =====

    // Calculate time windows for different reminder timeframes
    const taskIn1Week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Find tasks due within next week (not completed)
    const upcomingTasks = await db
      .select({
        taskId: tasks.taskId,
        userId: tasks.userId,
        title: tasks.title,
        description: tasks.description,
        dueDate: tasks.dueDate,
        dueTime: tasks.dueTime,
        completed: tasks.completed,
        urgency: tasks.urgency,
        category: tasks.category,
        listingId: tasks.listingId,
        contactId: tasks.contactId,
        createdBy: tasks.createdBy,
        accountId: users.accountId,
      })
      .from(tasks)
      .innerJoin(users, eq(tasks.userId, users.id))
      .where(
        and(
          eq(tasks.isActive, true),
          eq(tasks.completed, false),
          isNotNull(tasks.dueDate),
          gte(tasks.dueDate, now),
          lte(tasks.dueDate, taskIn1Week),
        ),
      );

    // Process each task and check which reminder timeframe applies
    for (const task of upcomingTasks) {
      const accountId = task.accountId;
      if (!accountId || typeof accountId !== "bigint" || !task.dueDate) continue;

      // Get settings for this account
      const settings = await getEmailSettingsForAccount(BigInt(accountId));
      
      // Calculate reminder timeframe (combining dueDate and dueTime)
      const dueDate = new Date(task.dueDate);
      const timeframe = getReminderTimeframe(dueDate, now, task.dueTime ?? undefined);
      
      if (!timeframe) continue;

      // Map timeframe to notification timeframe string
      let notificationTimeframe: string;
      switch (timeframe) {
        case "1_week":
          notificationTimeframe = "1_week";
          break;
        case "48h":
          notificationTimeframe = "48h";
          break;
        case "24h":
          notificationTimeframe = "24h";
          break;
        case "12h":
          notificationTimeframe = "12h";
          break;
        case "2h":
          notificationTimeframe = "2h";
          break;
        case "1h":
          notificationTimeframe = "1h";
          break;
        default:
          continue;
      }

      // Check if notification already exists for this timeframe
      const exists = await reminderExistsForEntity(
        BigInt(accountId),
        "task",
        task.taskId,
        "task_due_soon",
        notificationTimeframe,
      );

      if (!exists) {
        // Check if this reminder is enabled in settings
        const urgency = task.urgency ?? 1;
        let category: "critical" | "urgent" | "other";
        if (urgency === 5) {
          category = "critical";
        } else if (urgency === 3 || urgency === 4) {
          category = "urgent";
        } else {
          category = "other";
        }

        const categorySettings = settings.tasks[category];
        let isEnabled = false;
        
        switch (timeframe) {
          case "1_week":
            isEnabled = categorySettings.dueIn1Week.emailEnabled;
            break;
          case "48h":
            isEnabled = categorySettings.dueIn48h.emailEnabled;
            break;
          case "24h":
            isEnabled = categorySettings.dueIn24h.emailEnabled;
            break;
          case "12h":
            isEnabled = categorySettings.dueIn12h.emailEnabled;
            break;
          case "2h":
            isEnabled = categorySettings.dueIn2h.emailEnabled;
            break;
          case "1h":
            isEnabled = categorySettings.dueIn1h.emailEnabled;
            break;
        }

        if (isEnabled) {
          try {
            await notifyTaskDueSoon(
              {
                taskId: task.taskId,
                userId: task.userId,
                title: task.title,
                description: task.description,
                dueDate: task.dueDate ?? undefined,
                dueTime: task.dueTime ?? undefined,
                completed: false,
                urgency: task.urgency ?? undefined,
                category: task.category ?? undefined,
                listingId: task.listingId ?? undefined,
                contactId: task.contactId ?? undefined,
                createdBy: task.createdBy ?? undefined,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              BigInt(accountId),
              notificationTimeframe as TaskReminderTimeframe,
            );
            tasksNotified.push(1);
          } catch (error) {
            console.error(
              `Error creating ${timeframe} reminder for task ${task.taskId}:`,
              error,
            );
          }
        }
      }
    }

    // Find overdue tasks (past due date, not completed)
    const overdueTasks = await db
      .select({
        taskId: tasks.taskId,
        userId: tasks.userId,
        title: tasks.title,
        description: tasks.description,
        dueDate: tasks.dueDate,
        dueTime: tasks.dueTime,
        completed: tasks.completed,
        urgency: tasks.urgency,
        category: tasks.category,
        listingId: tasks.listingId,
        contactId: tasks.contactId,
        createdBy: tasks.createdBy,
        accountId: users.accountId,
      })
      .from(tasks)
      .innerJoin(users, eq(tasks.userId, users.id))
      .where(
        and(
          eq(tasks.isActive, true),
          eq(tasks.completed, false),
          isNotNull(tasks.dueDate),
          lte(tasks.dueDate, now),
        ),
      );

    // Check for overdue tasks that need immediate notification
    // Send immediate notification for any overdue task that hasn't been notified yet
    for (const task of overdueTasks) {
      const accountId = task.accountId;
      if (!accountId || typeof accountId !== "bigint" || !task.dueDate) continue;

      const dueDate = new Date(task.dueDate);
      
      // Combine dueDate and dueTime to get actual deadline
      // If dueTime is set, use it; otherwise default to end of day (23:59)
      // Use UTC methods to match getSpainTimeAsUTC() representation
      let actualDeadline: Date;
      if (task.dueTime) {
        const timeParts = task.dueTime.split(":").map(Number);
        const hours = timeParts[0] ?? 23;
        const minutes = timeParts[1] ?? 59;
        actualDeadline = new Date(
          Date.UTC(
            dueDate.getUTCFullYear(),
            dueDate.getUTCMonth(),
            dueDate.getUTCDate(),
            hours,
            minutes,
            0,
            0
          )
        );
      } else {
        // No dueTime, use end of day
        actualDeadline = new Date(
          Date.UTC(
            dueDate.getUTCFullYear(),
            dueDate.getUTCMonth(),
            dueDate.getUTCDate(),
            23,
            59,
            59,
            999
          )
        );
      }
      
      // Check if task is overdue (deadline has passed)
      if (actualDeadline <= now) {
        // Check if immediate notification is enabled
        const settings = await getEmailSettingsForAccount(BigInt(accountId));
        if (settings.tasks.overdue.notifyWhenOverdue.emailEnabled) {
          // Check if task urgency matches configured urgency levels
          const urgencyLevels = settings.tasks.overdue.notifyWhenOverdue.urgencyLevels;
          if (shouldIncludeTaskByUrgency(task.urgency ?? undefined, urgencyLevels)) {
            // Check if notification already exists
            const exists = await reminderExistsForEntity(
              BigInt(accountId),
              "task",
              task.taskId,
              "task_overdue",
              "immediate",
            );

            if (!exists) {
              try {
                await notifyTaskOverdue(
                  {
                    taskId: task.taskId,
                    userId: task.userId,
                    title: task.title,
                    description: task.description,
                    dueDate: task.dueDate ?? undefined,
                    dueTime: task.dueTime ?? undefined,
                    completed: false,
                    urgency: task.urgency ?? undefined,
                    category: task.category ?? undefined,
                    listingId: task.listingId ?? undefined,
                    contactId: task.contactId ?? undefined,
                    createdBy: task.createdBy ?? undefined,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                  BigInt(accountId),
                );
                // Email is sent inside notifyTaskOverdue
                tasksNotified.push(1);
              } catch (error) {
                console.error(
                  `Error creating immediate overdue notification for task ${task.taskId}:`,
                  error,
                );
              }
            }
          }
        }
      }
    }

    // Group tasks by user and account for digest emails
    const tasksByUser = new Map<
      string,
      { accountId: bigint; tasks: typeof overdueTasks }
    >();

    for (const task of overdueTasks) {
      const accountId = task.accountId;
      if (!accountId || typeof accountId !== "bigint") continue;

      // Skip tasks that already received an immediate notification
      // Check if immediate notification exists for this task
      const settings = await getEmailSettingsForAccount(BigInt(accountId));
      if (settings.tasks.overdue.notifyWhenOverdue.emailEnabled) {
        const urgencyLevels = settings.tasks.overdue.notifyWhenOverdue.urgencyLevels;
        if (shouldIncludeTaskByUrgency(task.urgency ?? undefined, urgencyLevels)) {
          const immediateNotificationExists = await reminderExistsForEntity(
            BigInt(accountId),
            "task",
            task.taskId,
            "task_overdue",
            "immediate",
          );
          if (immediateNotificationExists) {
            continue; // Already handled as immediate notification, skip digest
          }
        }
      }

      if (!tasksByUser.has(task.userId)) {
        tasksByUser.set(task.userId, {
          accountId: BigInt(accountId),
          tasks: [],
        });
      }

      tasksByUser.get(task.userId)!.tasks.push(task);
    }

    // Send digest emails
    for (const [userId, { accountId, tasks: userTasks }] of tasksByUser) {
      // Get settings for this account
      const settings = await getEmailSettingsForAccount(accountId);

      // Process daily digest
      const dailyUrgencyLevels = isOverdueDigestEnabled(settings, "daily");
      if (dailyUrgencyLevels !== null) {
        // Filter tasks by urgency levels for daily digest
        const dailyTasks = userTasks.filter((task) => {
          // Calculate actual deadline including dueTime
          // Use UTC methods to match getSpainTimeAsUTC() representation
          const dueDate = new Date(task.dueDate!);
          let taskActualDeadline: Date;
          if (task.dueTime) {
            const timeParts = task.dueTime.split(":").map(Number);
            const hours = timeParts[0] ?? 23;
            const minutes = timeParts[1] ?? 59;
            taskActualDeadline = new Date(
              Date.UTC(
                dueDate.getUTCFullYear(),
                dueDate.getUTCMonth(),
                dueDate.getUTCDate(),
                hours,
                minutes,
                0,
                0
              )
            );
          } else {
            taskActualDeadline = new Date(
              Date.UTC(
                dueDate.getUTCFullYear(),
                dueDate.getUTCMonth(),
                dueDate.getUTCDate(),
                23,
                59,
                59,
                999
              )
            );
          }
          
          // Skip if task is not actually overdue yet (dueTime hasn't passed)
          if (taskActualDeadline > now) {
            return false;
          }
          
          // Tasks with immediate notifications are already excluded from tasksByUser
          // so we don't need to check for them here
          return shouldIncludeTaskByUrgency(task.urgency ?? undefined, dailyUrgencyLevels);
        });

        if (dailyTasks.length > 0) {
          try {
            const formattedTasks = dailyTasks.map((task) => ({
              taskId: task.taskId,
              userId: task.userId,
              title: task.title,
              description: task.description,
              dueDate: task.dueDate ?? undefined,
              dueTime: task.dueTime ?? undefined,
              completed: false,
              urgency: task.urgency ?? undefined,
              category: task.category ?? undefined,
              listingId: task.listingId ?? undefined,
              contactId: task.contactId ?? undefined,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            }));

            const result = await sendTaskDigestEmail(
              userId,
              formattedTasks,
              "daily",
              accountId,
              dailyUrgencyLevels,
            );

            if (result.success) {
              tasksNotified.push(dailyTasks.length);
              console.log(
                `✅ Daily digest sent to user ${userId}: ${dailyTasks.length} tasks`,
              );
            }
          } catch (error) {
            console.error(
              `Error sending daily digest for user ${userId}:`,
              error,
            );
          }
        }
      }

      // Process weekly digest
      const weeklyUrgencyLevels = isOverdueDigestEnabled(settings, "weekly");
      if (weeklyUrgencyLevels !== null) {
        // Filter tasks by urgency levels for weekly digest
        const weeklyTasks = userTasks.filter((task) => {
          // Calculate actual deadline including dueTime
          // Use UTC methods to match getSpainTimeAsUTC() representation
          const dueDate = new Date(task.dueDate!);
          let taskActualDeadline: Date;
          if (task.dueTime) {
            const timeParts = task.dueTime.split(":").map(Number);
            const hours = timeParts[0] ?? 23;
            const minutes = timeParts[1] ?? 59;
            taskActualDeadline = new Date(
              Date.UTC(
                dueDate.getUTCFullYear(),
                dueDate.getUTCMonth(),
                dueDate.getUTCDate(),
                hours,
                minutes,
                0,
                0
              )
            );
          } else {
            taskActualDeadline = new Date(
              Date.UTC(
                dueDate.getUTCFullYear(),
                dueDate.getUTCMonth(),
                dueDate.getUTCDate(),
                23,
                59,
                59,
                999
              )
            );
          }
          
          // Skip if task is not actually overdue yet (dueTime hasn't passed)
          if (taskActualDeadline > now) {
            return false;
          }
          
          // Tasks with immediate notifications are already excluded from tasksByUser
          // so we don't need to check for them here
          return shouldIncludeTaskByUrgency(task.urgency ?? undefined, weeklyUrgencyLevels);
        });

        if (weeklyTasks.length > 0) {
          try {
            const formattedTasks = weeklyTasks.map((task) => ({
              taskId: task.taskId,
              userId: task.userId,
              title: task.title,
              description: task.description,
              dueDate: task.dueDate ?? undefined,
              dueTime: task.dueTime ?? undefined,
              completed: false,
              urgency: task.urgency ?? undefined,
              category: task.category ?? undefined,
              listingId: task.listingId ?? undefined,
              contactId: task.contactId ?? undefined,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            }));

            const result = await sendTaskDigestEmail(
              userId,
              formattedTasks,
              "weekly",
              accountId,
              weeklyUrgencyLevels,
            );

            if (result.success) {
              tasksNotified.push(weeklyTasks.length);
              console.log(
                `✅ Weekly digest sent to user ${userId}: ${weeklyTasks.length} tasks`,
              );
            }
          } catch (error) {
            console.error(
              `Error sending weekly digest for user ${userId}:`,
              error,
            );
          }
        }
      }
    }

    const summaryMsg = `✅ Cron completed: ${remindersCreated.length} internal reminders, ${customerRemindersCreated.length} customer reminders, ${tasksNotified.length} task notifications`;
    log(summaryMsg);

    structuredLogs.summary = {
      remindersCreated: remindersCreated.length,
      customerRemindersCreated: customerRemindersCreated.length,
      tasksNotified: tasksNotified.length,
      completed: summaryMsg,
    };

    return NextResponse.json({
      success: true,
      remindersCreated: remindersCreated.length,
      customerRemindersCreated: customerRemindersCreated.length,
      tasksNotified: tasksNotified.length,
      timestamp: now.toISOString(),
      logs: logs, // Flat logs for console/Vercel logs
      structuredLogs: structuredLogs, // Structured logs for better readability
    });
  } catch (error) {
    console.error("Error in cron job:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

