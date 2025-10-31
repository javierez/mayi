import { type getMostUrgentTasksWithAuth } from "~/server/queries/task";

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

export function getRemainingTime(dueDate?: Date | null) {
  if (!dueDate) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDate = new Date(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    dueDate.getDate(),
  );

  const fullDueDateTime = new Date(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    dueDate.getDate(),
    23,
    59,
  );

  const diffMs = fullDueDateTime.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

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

  if (taskDate.getTime() === today.getTime()) {
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
