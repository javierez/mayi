/**
 * Simple in-memory cache with TTL for performance optimization
 * Reduces redundant database calls for frequently accessed data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttlMs = 300000): void {
    // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }
}

export const cache = new SimpleCache();

/**
 * Cache key generators for consistent caching
 */
export const cacheKeys = {
  agents: (accountId: number) => `agents:${accountId}`,
  listings: (accountId: number, page: number, filters: string) =>
    `listings:${accountId}:${page}:${filters}`,
  listingDetails: (accountId: number, listingId: number) =>
    `listing:${accountId}:${listingId}`,
  userSession: (userId: string) => `session:${userId}`,
  // Calendar-specific cache keys
  calendarWeek: (accountId: number, weekKey: string) =>
    `calendar:${accountId}:week:${weekKey}`,
  calendarDateRange: (accountId: number, startDate: string, endDate: string) =>
    `calendar:${accountId}:range:${startDate}:${endDate}`,
  calendarToday: (accountId: number, dateKey: string) =>
    `calendar:${accountId}:today:${dateKey}`,
};

/**
 * Calendar-specific cache utilities
 */
export const calendarCache = {
  /**
   * Generate week key from date (YYYY-WNN format)
   */
  getWeekKey: (date: Date): string => {
    const monday = new Date(date);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    const weekNumber = getWeekNumber(monday);
    return `${monday.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
  },

  /**
   * Get date key for single-day caching (YYYY-MM-DD format)
   */
  getDateKey: (date: Date): string => {
    return date.toISOString().split("T")[0]!;
  },

  /**
   * Parse week key to get the Monday date
   */
  weekKeyToDate: (weekKey: string): Date => {
    const [year, week] = weekKey.split("-W");
    const yearNum = parseInt(year!, 10);
    const weekNum = parseInt(week!, 10);

    const jan4 = new Date(yearNum, 0, 4);
    const jan4WeekDay = jan4.getDay() || 7;
    const jan4Monday = new Date(jan4);
    jan4Monday.setDate(jan4.getDate() - jan4WeekDay + 1);

    const targetMonday = new Date(jan4Monday);
    targetMonday.setDate(jan4Monday.getDate() + (weekNum - 1) * 7);

    return targetMonday;
  },

  /**
   * Get week keys for a date range
   */
  getWeekKeysInRange: (startDate: Date, endDate: Date): string[] => {
    const keys: string[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      keys.push(calendarCache.getWeekKey(current));
      current.setDate(current.getDate() + 7);
    }

    return Array.from(new Set(keys)); // Remove duplicates
  },

  /**
   * Invalidate calendar cache for specific patterns
   */
  invalidateCalendar: (patterns: {
    accountId: number;
    weekKeys?: string[];
    dateRange?: { start: string; end: string };
    all?: boolean;
  }) => {
    if (patterns.all) {
      // Clear all calendar cache for account
      const keys = cache.getKeys();
      keys.forEach((key) => {
        if (key.startsWith(`calendar:${patterns.accountId}:`)) {
          cache.delete(key);
        }
      });
      return;
    }

    if (patterns.weekKeys) {
      patterns.weekKeys.forEach((weekKey) => {
        const key = cacheKeys.calendarWeek(patterns.accountId, weekKey);
        cache.delete(key);
      });
    }

    if (patterns.dateRange) {
      const key = cacheKeys.calendarDateRange(
        patterns.accountId,
        patterns.dateRange.start,
        patterns.dateRange.end,
      );
      cache.delete(key);
    }
  },
};

/**
 * Get ISO week number for a date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
