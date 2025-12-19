import { type getMostUrgentTasksWithAuth } from "~/server/queries/task";
import {
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

/**
 * Get current time in Spain timezone (Europe/Madrid).
 * This ensures consistent time calculations regardless of where the code runs
 * (browser in any timezone, or server in UTC).
 */
function getSpainNow(): Date {
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
  const dateParts = datePart?.split('/').map(Number) ?? [];
  const timeParts = timePart?.split(':').map(Number) ?? [];
  const day = dateParts[0] ?? 1;
  const month = dateParts[1] ?? 1;
  const year = dateParts[2] ?? 2000;
  const hour = timeParts[0] ?? 0;
  const minute = timeParts[1] ?? 0;
  const second = timeParts[2] ?? 0;

  // Create a Date with Spain time values
  return new Date(year, month - 1, day, hour, minute, second);
}

export function getRemainingTime(dueDate?: Date | null, dueTime?: string | null) {
  if (!dueDate) return null;

  // Use Spain timezone for consistent calculations
  const now = getSpainNow();
  
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

  const diffMs = actualDueDateTime.getTime() - now.getTime();
  // Use Math.trunc() instead of Math.floor() to round toward zero
  // This prevents -0.196 days from becoming -1 day (should be 0)
  const diffDays = Math.trunc(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.trunc(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.trunc(diffMs / (1000 * 60));

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
