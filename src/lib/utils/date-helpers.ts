/**
 * Date Helper Utilities
 * 
 * Provides consistent date/time handling across the application,
 * ensuring all operations use local timezone to avoid UTC conversion issues.
 */

/**
 * Check if two dates are on the same day (using local timezone)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Get the start of a day in local timezone (00:00:00.000)
 */
export function getDayStart(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0
  );
}

/**
 * Get the end of a day in local timezone (23:59:59.999)
 */
export function getDayEnd(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  );
}

/**
 * Get date string in YYYY-MM-DD format using local timezone
 * (for consistent date comparisons without timezone conversion)
 */
export function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get time components from a date in local timezone
 */
export function getLocalTimeComponents(date: Date): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  return {
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
  };
}

/**
 * Get total minutes from midnight in local timezone
 */
export function getMinutesFromMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Check if a date is today (using local timezone)
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return isSameDay(date, today);
}

/**
 * Create a date from local date components (ensures no timezone conversion)
 */
export function createLocalDate(
  year: number,
  month: number, // 1-12 (not 0-indexed)
  day: number,
  hours: number = 0,
  minutes: number = 0,
  seconds: number = 0,
  milliseconds: number = 0
): Date {
  return new Date(year, month - 1, day, hours, minutes, seconds, milliseconds);
}

/**
 * Format date for display (uses local timezone automatically via Intl)
 */
export function formatDate(date: Date, locale: string = 'es-ES'): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format time for display using local time components directly
 * This avoids timezone conversion issues when dates are stored as local time
 */
export function formatTime(date: Date, locale: string = 'es-ES'): string {
  // Use local time components directly to avoid timezone conversion issues
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format short date for display (day + month, no year)
 */
export function formatShortDate(date: Date, locale: string = 'es-ES'): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

/**
 * Check if an appointment overlaps with a day
 * Uses local timezone for all comparisons
 */
export function appointmentOverlapsDay(
  appointmentStart: Date,
  appointmentEnd: Date,
  day: Date
): boolean {
  const dayStart = getDayStart(day);
  const dayEnd = getDayEnd(day);
  
  // Event overlaps if it starts before day ends AND ends after day starts
  return appointmentStart <= dayEnd && appointmentEnd >= dayStart;
}

