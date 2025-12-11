import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { appointments, tasks, users } from "~/server/db/schema";
import { eq, and, gte, lte, isNotNull } from "drizzle-orm";
import {
  notifyAppointmentReminder,
  notifyTaskDueSoon,
  notifyTaskOverdue,
} from "~/server/services/notification-service";
import { sendTaskDigestEmail } from "~/server/services/task-digest-email-service";
import { reminderExistsForEntity } from "~/server/queries/notification";
import { getEmailSettingsForAccount, getReminderTimeframe } from "~/server/services/email-config-helpers";
import type { TaskReminderTimeframe } from "~/types/notifications";

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

    const now = new Date();
    const remindersCreated: number[] = [];
    const tasksNotified: number[] = [];

    // ===== APPOINTMENT REMINDERS =====

    // Calculate time windows for different reminder timeframes
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find appointments starting within next 24 hours
    const upcomingAppointments = await db
      .select({
        appointmentId: appointments.appointmentId,
        userId: appointments.userId,
        contactId: appointments.contactId,
        assignedTo: appointments.assignedTo,
        title: appointments.title,
        datetimeStart: appointments.datetimeStart,
        datetimeEnd: appointments.datetimeEnd,
        status: appointments.status,
        type: appointments.type,
        tripTimeMinutes: appointments.tripTimeMinutes,
        accountId: users.accountId,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.userId, users.id))
      .where(
        and(
          eq(appointments.isActive, true),
          eq(appointments.status, "Scheduled"),
          gte(appointments.datetimeStart, now),
          lte(appointments.datetimeStart, in24Hours),
        ),
      );

    // Process each appointment and check which reminder timeframe applies
    for (const appointment of upcomingAppointments) {
      const accountId = appointment.accountId;
      if (!accountId || typeof accountId !== "bigint") continue;

      // Get settings for this account
      const settings = await getEmailSettingsForAccount(BigInt(accountId));
      
      const startTime = new Date(appointment.datetimeStart);
      const timeUntilStart = startTime.getTime() - now.getTime();
      const hoursUntilStart = timeUntilStart / (1000 * 60 * 60);
      const minutesUntilStart = timeUntilStart / (1000 * 60);

      // Determine which reminder timeframe applies (check in order of urgency)
      let reminderTimeframe: "30_min" | "1h" | "12h" | "1_day" | null = null;
      
      if (minutesUntilStart <= 30 && minutesUntilStart > 15) {
        reminderTimeframe = "30_min";
      } else if (hoursUntilStart <= 1 && hoursUntilStart > 0.5) {
        reminderTimeframe = "1h";
      } else if (hoursUntilStart <= 12 && hoursUntilStart > 11) {
        reminderTimeframe = "12h";
      } else if (hoursUntilStart <= 24 && hoursUntilStart > 23) {
        reminderTimeframe = "1_day";
      }

      if (reminderTimeframe) {
        // Check if notification already exists for this timeframe
        const exists = await reminderExistsForEntity(
          BigInt(accountId),
          "appointment",
          appointment.appointmentId,
          "appointment_reminder",
          reminderTimeframe,
        );

        if (!exists) {
          // Check if this reminder is enabled in settings
          const appointmentType = appointment.type ?? "visita";
          const appointmentSettings = settings.appointments[appointmentType as keyof typeof settings.appointments];
          
          if (appointmentSettings && "notify24h" in appointmentSettings) {
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

            if (isEnabled) {
              try {
                await notifyAppointmentReminder(
                  {
                    appointmentId: appointment.appointmentId,
                    userId: appointment.userId,
                    contactId: appointment.contactId,
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
              } catch (error) {
                console.error(
                  `Error creating ${reminderTimeframe} reminder for appointment ${appointment.appointmentId}:`,
                  error,
                );
              }
            }
          }
        }
      }

      // Handle travel time reminders (if trip time is set)
      if (appointment.tripTimeMinutes) {
        const appointmentType = appointment.type ?? "visita";
        const appointmentSettings = settings.appointments[appointmentType as keyof typeof settings.appointments];
        
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
      
      // Calculate reminder timeframe
      const dueDate = new Date(task.dueDate);
      const timeframe = getReminderTimeframe(dueDate, now);
      
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

    // Check for critical tasks that just became overdue (within last 15 minutes)
    const recentlyOverdue = new Date(now.getTime() - 15 * 60 * 1000);
    
    for (const task of overdueTasks) {
      const accountId = task.accountId;
      if (!accountId || typeof accountId !== "bigint" || !task.dueDate) continue;

      const dueDate = new Date(task.dueDate);
      const isCritical = task.urgency === 5;
      
      // Check if critical task just became overdue (within last 15 minutes)
      if (isCritical && dueDate >= recentlyOverdue && dueDate <= now) {
        // Check if immediate notification is enabled
        const settings = await getEmailSettingsForAccount(BigInt(accountId));
        if (settings.tasks.overdue.notifyWhenOverdue.emailEnabled) {
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

    // Group tasks by user and urgency for digest emails
    const tasksByUser = new Map<
      string,
      { accountId: bigint; critical: typeof overdueTasks; normal: typeof overdueTasks }
    >();

    for (const task of overdueTasks) {
      const accountId = task.accountId;
      if (!accountId || typeof accountId !== "bigint") continue;

      // Skip tasks that were just notified as immediate
      const dueDate = new Date(task.dueDate!);
      const isCritical = task.urgency === 5;
      if (isCritical && dueDate >= recentlyOverdue && dueDate <= now) {
        continue; // Already handled above
      }

      if (!tasksByUser.has(task.userId)) {
        tasksByUser.set(task.userId, {
          accountId: BigInt(accountId),
          critical: [],
          normal: [],
        });
      }

      const userTasks = tasksByUser.get(task.userId)!;

      if (isCritical) {
        userTasks.critical.push(task);
      } else {
        userTasks.normal.push(task);
      }
    }

    // Send digest emails
    for (const [userId, { accountId, critical, normal }] of tasksByUser) {
      // Send daily digest for critical tasks (urgency = 5)
      if (critical.length > 0) {
        try {
          const criticalTasks = critical.map((task) => ({
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
            criticalTasks,
            "daily",
            accountId,
          );

          if (result.success) {
            tasksNotified.push(critical.length);
            console.log(
              `✅ Daily digest sent to user ${userId}: ${critical.length} critical tasks`,
            );
          }
        } catch (error) {
          console.error(
            `Error sending daily digest for user ${userId}:`,
            error,
          );
        }
      }

      // Send weekly digest for normal tasks (urgency < 5)
      if (normal.length > 0) {
        try {
          const normalTasks = normal.map((task) => ({
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
            normalTasks,
            "weekly",
            accountId,
          );

          if (result.success) {
            tasksNotified.push(normal.length);
            console.log(
              `✅ Weekly digest sent to user ${userId}: ${normal.length} normal tasks`,
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

    return NextResponse.json({
      success: true,
      remindersCreated: remindersCreated.length,
      tasksNotified: tasksNotified.length,
      timestamp: now.toISOString(),
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

