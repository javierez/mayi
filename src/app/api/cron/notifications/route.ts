import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { appointments, tasks, users } from "~/server/db/schema";
import { eq, and, gte, lte, isNotNull } from "drizzle-orm";
import {
  notifyAppointmentReminder,
  notifyTaskDueSoon,
} from "~/server/services/notification-service";
import { sendTaskDigestEmail } from "~/server/services/task-digest-email-service";
import { reminderExistsForEntity } from "~/server/queries/notification";

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

    // Calculate time windows
    const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);
    const in1Day = new Date(now.getTime() + 24 * 60 * 1000);

    // Find appointments starting in 30 minutes (within 15 minute window)
    const appointments30Min = await db
      .select({
        appointmentId: appointments.appointmentId,
        userId: appointments.userId,
        contactId: appointments.contactId,
        assignedTo: appointments.assignedTo,
        title: appointments.title,
        datetimeStart: appointments.datetimeStart,
        datetimeEnd: appointments.datetimeEnd,
        status: appointments.status,
        accountId: users.accountId,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.userId, users.id))
      .where(
        and(
          eq(appointments.isActive, true),
          eq(appointments.status, "Scheduled"),
          gte(appointments.datetimeStart, now),
          lte(appointments.datetimeStart, in30Minutes),
        ),
      );

    for (const appointment of appointments30Min) {
      const accountId = appointment.accountId;
      if (!accountId || typeof accountId !== "bigint") continue;

      // Check if reminder already exists
      const exists = await reminderExistsForEntity(
        BigInt(accountId),
        "appointment",
        appointment.appointmentId,
        "appointment_reminder",
        "30_min",
      );

      if (!exists) {
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
            "30_min",
          );
          remindersCreated.push(1);
        } catch (error) {
          console.error(
            `Error creating 30min reminder for appointment ${appointment.appointmentId}:`,
            error,
          );
        }
      }
    }

    // Find appointments starting in 1 day (between 30min and 1day from now)
    const appointments1Day = await db
      .select({
        appointmentId: appointments.appointmentId,
        userId: appointments.userId,
        contactId: appointments.contactId,
        assignedTo: appointments.assignedTo,
        title: appointments.title,
        datetimeStart: appointments.datetimeStart,
        datetimeEnd: appointments.datetimeEnd,
        status: appointments.status,
        accountId: users.accountId,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.userId, users.id))
      .where(
        and(
          eq(appointments.isActive, true),
          eq(appointments.status, "Scheduled"),
          gte(appointments.datetimeStart, in30Minutes),
          lte(appointments.datetimeStart, in1Day),
        ),
      );

    for (const appointment of appointments1Day) {
      const accountId = appointment.accountId;
      if (!accountId || typeof accountId !== "bigint") continue;

      const exists = await reminderExistsForEntity(
        BigInt(accountId),
        "appointment",
        appointment.appointmentId,
        "appointment_reminder",
        "1_day",
      );

      if (!exists) {
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
            "1_day",
          );
          remindersCreated.push(1);
        } catch (error) {
          console.error(
            `Error creating 1day reminder for appointment ${appointment.appointmentId}:`,
            error,
          );
        }
      }
    }

    // ===== TASK REMINDERS =====

    // Calculate dates for task due soon
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const today = new Date(now);
    today.setHours(23, 59, 59, 999);

    // Find tasks due tomorrow or today (not completed)
    const tasksDueSoon = await db
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
          lte(tasks.dueDate, tomorrow),
        ),
      );

    for (const task of tasksDueSoon) {
      const accountId = task.accountId;
      if (!accountId || typeof accountId !== "bigint" || !task.dueDate) continue;

      // Determine if due today or tomorrow
      const dueDate = new Date(task.dueDate);
      const isToday =
        dueDate.toDateString() === now.toDateString();
      const timeframe = isToday ? "same_day" : "1_day";

      // Check if notification already exists
      const exists = await reminderExistsForEntity(
        BigInt(accountId),
        "task",
        task.taskId,
        "task_due_soon",
        timeframe,
      );

      if (!exists) {
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
            timeframe,
          );
          tasksNotified.push(1);
        } catch (error) {
          console.error(
            `Error creating due soon notification for task ${task.taskId}:`,
            error,
          );
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

    // Group tasks by user and urgency
    const tasksByUser = new Map<
      string,
      { accountId: bigint; critical: typeof overdueTasks; normal: typeof overdueTasks }
    >();

    for (const task of overdueTasks) {
      const accountId = task.accountId;
      if (!accountId || typeof accountId !== "bigint") continue;

      if (!tasksByUser.has(task.userId)) {
        tasksByUser.set(task.userId, {
          accountId: BigInt(accountId),
          critical: [],
          normal: [],
        });
      }

      const userTasks = tasksByUser.get(task.userId)!;
      const isCritical = task.urgency === 5;

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

