/**
 * Briefing Email Service
 *
 * Handles sending weekly and daily briefing emails for tasks and appointments.
 * Checks MailSettings configuration to determine what to include.
 */

import { sendEmail } from "~/lib/email";
import { getUserById } from "~/server/queries/users";
import { getEmailSettingsForAccount, isBriefingEnabled } from "./email-config-helpers";
import { generateWeeklyBriefingEmail } from "~/templates/emails/weekly-briefing";
import { generateDailyBriefingEmail } from "~/templates/emails/daily-briefing";
import type { Task } from "~/lib/data";
import type { Appointment } from "~/lib/data";
import { db } from "~/server/db";
import { tasks, appointments } from "~/server/db/schema";
import { eq, and, gte, lte, isNotNull } from "drizzle-orm";

/**
 * Get upcoming tasks for briefing
 */
async function getUpcomingTasksForBriefing(
  userId: string,
  briefingType: "weekly" | "daily",
): Promise<Task[]> {
  const now = new Date();
  let endDate: Date;

  if (briefingType === "weekly") {
    // Get tasks for next 7 days
    endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 7);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Get tasks for today and tomorrow
    endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(23, 59, 59, 999);
  }

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
      isActive: tasks.isActive,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.isActive, true),
        eq(tasks.completed, false),
        isNotNull(tasks.dueDate),
        gte(tasks.dueDate, now),
        lte(tasks.dueDate, endDate),
      ),
    );

  return upcomingTasks.map((task) => ({
    ...task,
    dueDate: task.dueDate ?? undefined,
    dueTime: task.dueTime ?? undefined,
    urgency: task.urgency ?? undefined,
    category: task.category ?? undefined,
    listingId: task.listingId ?? undefined,
    contactId: task.contactId ?? undefined,
  }));
}

/**
 * Get upcoming appointments for briefing
 */
async function getUpcomingAppointmentsForBriefing(
  userId: string,
  briefingType: "weekly" | "daily",
): Promise<Appointment[]> {
  const now = new Date();
  let endDate: Date;

  if (briefingType === "weekly") {
    // Get appointments for next 7 days
    endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 7);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Get appointments for today and tomorrow
    endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(23, 59, 59, 999);
  }

  const upcomingAppointments = await db
    .select({
      appointmentId: appointments.appointmentId,
      userId: appointments.userId,
      contactId: appointments.contactId,
      listingId: appointments.listingId,
      listingContactId: appointments.listingContactId,
      dealId: appointments.dealId,
      prospectId: appointments.prospectId,
      taskId: appointments.taskId,
      datetimeStart: appointments.datetimeStart,
      datetimeEnd: appointments.datetimeEnd,
      tripTimeMinutes: appointments.tripTimeMinutes,
      status: appointments.status,
      title: appointments.title,
      notes: appointments.notes,
      type: appointments.type,
      assignedTo: appointments.assignedTo,
      isActive: appointments.isActive,
      createdAt: appointments.createdAt,
      updatedAt: appointments.updatedAt,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.userId, userId),
        eq(appointments.isActive, true),
        eq(appointments.status, "Scheduled"),
        gte(appointments.datetimeStart, now),
        lte(appointments.datetimeStart, endDate),
      ),
    );

  return upcomingAppointments.map((apt) => ({
    ...apt,
    contactId: apt.contactId ?? null,
    listingId: apt.listingId ?? null,
    listingContactId: apt.listingContactId ?? null,
    dealId: apt.dealId ?? null,
    prospectId: apt.prospectId ?? null,
    taskId: apt.taskId ?? null,
    notes: apt.notes ?? null,
    type: apt.type ?? null,
    assignedTo: apt.assignedTo ?? null,
    tripTimeMinutes: apt.tripTimeMinutes ?? null,
  }));
}

/**
 * Check if briefing was already sent today/this week
 * Note: This is a simplified check. In production, you might want to track
 * briefing sends in a separate table or use notification records.
 */
async function wasBriefingSent(
  _userId: string,
  _briefingType: "weekly" | "daily",
): Promise<boolean> {
  // For now, we rely on cron job timing to prevent duplicate sends
  // In production, you could check a notifications table or a briefing_sends table
  return false;
}

/**
 * Send briefing email
 */
export async function sendBriefingEmail(
  userId: string,
  accountId: bigint,
  briefingType: "weekly" | "daily",
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user email
    const user = await getUserById(userId);
    if (!user?.email) {
      return { success: false, error: "User email not found" };
    }

    // Get settings
    const settings = await getEmailSettingsForAccount(accountId);

    // Check if briefing is enabled for tasks
    const tasksEnabled = isBriefingEnabled(settings, briefingType, "tasks");
    
    // Check if briefing is enabled for appointments
    // Check all appointment types
    let appointmentsEnabled = false;
    const appointmentTypes = ["visita", "firma", "reunion", "llamada", "cierre", "viaje"];
    for (const aptType of appointmentTypes) {
      if (isBriefingEnabled(settings, briefingType, "appointments", undefined, aptType)) {
        appointmentsEnabled = true;
        break;
      }
    }

    // If neither is enabled, don't send
    if (!tasksEnabled && !appointmentsEnabled) {
      return { success: false, error: "Briefing not enabled in settings" };
    }

    // Check if already sent
    const alreadySent = await wasBriefingSent(userId, briefingType);
    if (alreadySent) {
      return { success: false, error: "Briefing already sent" };
    }

    // Get data
    const tasks = tasksEnabled ? await getUpcomingTasksForBriefing(userId, briefingType) : [];
    const appointments = appointmentsEnabled ? await getUpcomingAppointmentsForBriefing(userId, briefingType) : [];

    // If no data and both enabled, don't send
    if (tasks.length === 0 && appointments.length === 0) {
      return { success: false, error: "No upcoming tasks or appointments" };
    }

    // Generate email
    let emailContent: { subject: string; html: string; text: string };
    
    // Format date range/date
    const now = new Date();
    let dateRange: string | undefined;
    let date: string | undefined;

    if (briefingType === "weekly") {
      const startDate = new Date(now);
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 7);
      
      const startStr = startDate.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
      const endStr = endDate.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
      dateRange = `Semana del ${startStr} al ${endStr}`;
    } else {
      date = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }

    if (briefingType === "weekly") {
      emailContent = generateWeeklyBriefingEmail({
        tasks,
        appointments,
        includeTasks: tasksEnabled,
        includeAppointments: appointmentsEnabled,
        dateRange,
      });
    } else {
      emailContent = generateDailyBriefingEmail({
        tasks,
        appointments,
        includeTasks: tasksEnabled,
        includeAppointments: appointmentsEnabled,
        date,
      });
    }

    // Send email
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    console.log(
      `✅ ${briefingType === "weekly" ? "Weekly" : "Daily"} briefing email sent to ${user.email}`,
    );

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Failed to send ${briefingType} briefing email:`, error);
    return { success: false, error: errorMessage };
  }
}

