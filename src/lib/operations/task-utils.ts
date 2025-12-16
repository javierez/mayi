import { type getMostUrgentTasksWithAuth } from "~/server/queries/task";
import {
  getDayStart,
  getDayEnd,
  isSameDay,
} from "~/lib/utils/date-helpers";

export type DetailedTask = Awaited<ReturnType<typeof getMostUrgentTasksWithAuth>>[0];

export function getInitials(
  firstName?: string,
  lastName?: string,
  name?: string,
) {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (name) {
    const parts = name.split(" ").filter((p) => p.length > 0);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    } else if (parts[0]) {
      return parts[0].charAt(0).toUpperCase();
    }
  }
  return "U";
}

export function getRemainingTime(dueDate?: Date | null, dueTime?: string | null) {
  if (!dueDate) return null;

  const now = new Date();
  
  // Combine dueDate and dueTime to get the actual deadline datetime
  // If dueTime is provided, use it; otherwise default to end of day
  let actualDueDateTime: Date;
  
  if (dueTime) {
    // Parse dueTime (format: "HH:MM" or "HH:MM:SS")
    const timeParts = dueTime.split(":").map(Number);
    const hours = timeParts[0] ?? 23;
    const minutes = timeParts[1] ?? 59;
    
    // Create datetime in local timezone using the date from dueDate and time from dueTime
    actualDueDateTime = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate(),
      hours,
      minutes,
      0,
      0
    );
  } else {
    // No dueTime provided, use end of day
    actualDueDateTime = getDayEnd(dueDate);
  }

  const today = getDayStart(now);
  const taskDate = getDayStart(dueDate);

  const diffMs = actualDueDateTime.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  // Log time difference calculation
  console.log("⏰ getRemainingTime calculation:", {
    dueDate: dueDate.toISOString(),
    dueTime: dueTime ?? "none",
    dueDateLocal: `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`,
    actualDueDateTime: actualDueDateTime.toISOString(),
    actualDueDateTimeLocal: actualDueDateTime.toLocaleString(),
    now: now.toISOString(),
    nowLocal: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    diffMs,
    diffDays,
    diffHours,
    diffMinutes,
    isOverdue: diffMs < 0,
    isToday: isSameDay(dueDate, now),
    taskDate: taskDate.toISOString(),
    taskDateLocal: taskDate.toLocaleDateString(),
    today: today.toISOString(),
    todayLocal: today.toLocaleDateString(),
  });

  if (diffMs < 0) {
    const overdueDays = Math.abs(diffDays);
    const overdueHours = Math.abs(diffHours);
    if (overdueDays > 0) {
      return `${overdueDays} día${overdueDays !== 1 ? "s" : ""} vencido`;
    } else if (overdueHours > 0) {
      return `${overdueHours} hora${overdueHours !== 1 ? "s" : ""} vencido`;
    } else {
      return "Vencido";
    }
  }

  if (isSameDay(dueDate, now)) {
    if (diffHours > 0) {
      return `${diffHours} hora${diffHours !== 1 ? "s" : ""} restantes`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minuto${diffMinutes !== 1 ? "s" : ""} restantes`;
    } else {
      return "Vence ahora";
    }
  } else {
    return `${diffDays} día${diffDays !== 1 ? "s" : ""} restantes`;
  }
}
