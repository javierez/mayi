import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { appointments, users } from "~/server/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getEmailSettingsForAccount } from "~/server/services/email-config-helpers";

/**
 * Test endpoint for debugging cron timezone logic.
 * 
 * ⚠️ DEVELOPMENT ONLY - Remove or protect in production!
 * 
 * Usage: GET /api/test-cron
 * Or: GET /api/test-cron?trigger=notifications (to actually run the cron)
 * Or: GET /api/test-cron?trigger=briefings
 * Or: GET /api/test-cron?appointments=true (to see upcoming appointments and their reminder status)
 */

// Helper: Get Spain time as UTC (same as notifications cron)
function getSpainTimeAsUTC(): Date {
  const now = new Date();
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
  
  const [datePart, timePart] = spainTimeStr.split(', ');
  const [day, month, year] = datePart!.split('/').map(Number);
  const [hour, minute, second] = timePart!.split(':').map(Number);
  
  return new Date(Date.UTC(year!, month! - 1, day!, hour!, minute!, second!));
}

// Helper: Get Spain time components (same as briefings cron)
function getSpainTimeComponents(): { dayOfWeek: number; hour: number; minute: number } {
  const now = new Date();
  
  const dayFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    weekday: 'short'
  });
  const dayStr = dayFormatter.format(now);
  const dayMap: Record<string, number> = {
    'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
  };
  
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const timeStr = timeFormatter.format(now);
  const [hourStr, minuteStr] = timeStr.split(':');
  
  return {
    dayOfWeek: dayMap[dayStr] ?? 0,
    hour: parseInt(hourStr!, 10),
    minute: parseInt(minuteStr!, 10)
  };
}

// Helper: Determine which reminder window an appointment falls into
// Updated to match the new wider windows in the notifications cron
function getReminderWindow(minutesUntilStart: number, hoursUntilStart: number): {
  window: string | null;
  windowRange: string;
  enabled: boolean;
  reason: string;
} {
  // 30min reminder: Fire when 15-45 minutes before
  if (minutesUntilStart <= 45 && minutesUntilStart > 15) {
    return { window: "30_min", windowRange: "15-45 min before", enabled: true, reason: "Check settings for your account" };
  } 
  // 1h reminder: Fire when 45min-1.5hr before
  else if (hoursUntilStart <= 1.5 && hoursUntilStart > 0.75) {
    return { window: "1h", windowRange: "45min-1.5hr before", enabled: true, reason: "Check settings for your account" };
  } 
  // 12h reminder: Fire when 11-13 hours before
  else if (hoursUntilStart <= 13 && hoursUntilStart > 11) {
    return { window: "12h", windowRange: "11-13 hrs before", enabled: true, reason: "Check settings for your account (often disabled)" };
  } 
  // 24h reminder: Fire when 22-25 hours before
  else if (hoursUntilStart <= 25 && hoursUntilStart > 22) {
    return { window: "1_day", windowRange: "22-25 hrs before", enabled: true, reason: "Check settings for your account" };
  }
  
  // Not in any window - describe where they are
  if (minutesUntilStart <= 15) {
    return { window: null, windowRange: "< 15 min", enabled: false, reason: "Too close - all reminder windows passed" };
  } else if (hoursUntilStart <= 0.75) {
    return { window: null, windowRange: "< 45 min", enabled: false, reason: "Between 30min and 1h windows" };
  } else if (hoursUntilStart <= 11) {
    return { window: null, windowRange: "1.5hr-11hrs", enabled: false, reason: "Between 1h and 12h windows - NO REMINDER will fire" };
  } else if (hoursUntilStart <= 22) {
    return { window: null, windowRange: "13-22 hrs", enabled: false, reason: "Between 12h and 24h windows - NO REMINDER will fire" };
  } else {
    return { window: null, windowRange: "> 25 hrs", enabled: false, reason: "Too far away - not yet in any window" };
  }
}

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const trigger = searchParams.get('trigger');
  const showAppointments = searchParams.get('appointments') === 'true';

  const realUTC = new Date();
  const spainTimeAsUTC = getSpainTimeAsUTC();
  const spainComponents = getSpainTimeComponents();

  // Basic timezone debug info
  const debugInfo: Record<string, unknown> = {
    realUTC: {
      iso: realUTC.toISOString(),
      utcHour: realUTC.getUTCHours(),
      utcMinute: realUTC.getUTCMinutes(),
      utcDay: realUTC.getUTCDay(),
    },
    spainTimeAsUTC: {
      iso: spainTimeAsUTC.toISOString(),
      hour: spainTimeAsUTC.getUTCHours(),
      minute: spainTimeAsUTC.getUTCMinutes(),
      explanation: "This is how appointments store time - Spain local time values in UTC format"
    },
    spainComponents: {
      ...spainComponents,
      dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][spainComponents.dayOfWeek],
      explanation: "Used by briefings to check if it's 9 AM Spain time"
    },
    timezoneOffset: {
      hoursAhead: spainTimeAsUTC.getUTCHours() - realUTC.getUTCHours(),
      note: "Spain is 1 hour ahead in winter (CET), 2 hours in summer (CEST)"
    },
    cronLogic: {
      briefingsWouldSend: spainComponents.hour >= 9,
      briefingsWeeklyWouldSend: spainComponents.dayOfWeek === 1 && spainComponents.hour >= 9,
    },
    reminderWindows: {
      "24h": "Fires 22-25 hours before (check your account settings)",
      "12h": "Fires 11-13 hours before (often disabled by default)",
      "1h": "Fires 45min-1.5hr before (check your account settings)",
      "30_min": "Fires 15-45min before (check your account settings)",
      gap1: "⚠️ GAP: 13-22 hours - no reminder fires",
      gap2: "⚠️ GAP: 1.5hr-11hr - no reminder fires",
      note: "Settings are read from accounts.notificationSettings in database"
    }
  };

  // Show upcoming appointments if requested
  if (showAppointments) {
    try {
      const now = spainTimeAsUTC;
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const upcomingAppointments = await db
        .select({
          appointmentId: appointments.appointmentId,
          title: appointments.title,
          datetimeStart: appointments.datetimeStart,
          datetimeEnd: appointments.datetimeEnd,
          status: appointments.status,
          type: appointments.type,
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

      const appointmentDebug = await Promise.all(upcomingAppointments.map(async (apt) => {
        const startTime = new Date(apt.datetimeStart);
        const timeUntilStart = startTime.getTime() - now.getTime();
        const hoursUntilStart = timeUntilStart / (1000 * 60 * 60);
        const minutesUntilStart = timeUntilStart / (1000 * 60);
        
        const windowInfo = getReminderWindow(minutesUntilStart, hoursUntilStart);
        
        // Check actual settings
        let settingsEnabled = false;
        if (apt.accountId) {
          try {
            const settings = await getEmailSettingsForAccount(BigInt(apt.accountId));
            const appointmentType = apt.type ?? "visita";
            const appointmentSettings = settings.appointments[appointmentType as keyof typeof settings.appointments];
            if (appointmentSettings && "notify24h" in appointmentSettings) {
              switch (windowInfo.window) {
                case "1_day":
                  settingsEnabled = appointmentSettings.notify24h.emailEnabled;
                  break;
                case "12h":
                  settingsEnabled = appointmentSettings.notify12h.emailEnabled;
                  break;
                case "1h":
                  settingsEnabled = appointmentSettings.notify1h.emailEnabled;
                  break;
                case "30_min":
                  settingsEnabled = appointmentSettings.notify30min.emailEnabled;
                  break;
              }
            }
          } catch {
            settingsEnabled = false;
          }
        }

        return {
          id: apt.appointmentId.toString(),
          title: apt.title,
          type: apt.type,
          startsAt: startTime.toISOString(),
          startsAtDisplay: `${startTime.getUTCHours().toString().padStart(2, '0')}:${startTime.getUTCMinutes().toString().padStart(2, '0')}`,
          timeUntil: {
            hours: Math.floor(hoursUntilStart),
            minutes: Math.round(minutesUntilStart % 60),
            display: `${Math.floor(hoursUntilStart)}h ${Math.round(minutesUntilStart % 60)}m`
          },
          reminderStatus: {
            currentWindow: windowInfo.window,
            windowRange: windowInfo.windowRange,
            defaultEnabled: windowInfo.enabled,
            actuallyEnabled: settingsEnabled,
            reason: windowInfo.reason,
            willReceiveReminder: windowInfo.window !== null && settingsEnabled,
          }
        };
      }));

      debugInfo.upcomingAppointments = {
        count: appointmentDebug.length,
        note: "Showing appointments in next 24 hours",
        appointments: appointmentDebug
      };
    } catch (error) {
      debugInfo.appointmentsError = error instanceof Error ? error.message : "Unknown error";
    }
  }

  // If trigger param is provided, actually call the cron endpoint
  if (trigger === 'notifications' || trigger === 'briefings') {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({
        ...debugInfo,
        error: "CRON_SECRET not configured - cannot trigger cron"
      });
    }

    try {
      const baseUrl = request.nextUrl.origin;
      const response = await fetch(`${baseUrl}/api/cron/${trigger}`, {
        headers: {
          'Authorization': `Bearer ${cronSecret}`
        }
      });
      const result = await response.json();
      
      return NextResponse.json({
        ...debugInfo,
        cronTriggered: trigger,
        cronResult: result
      });
    } catch (error) {
      return NextResponse.json({
        ...debugInfo,
        cronTriggered: trigger,
        cronError: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  return NextResponse.json({
    ...debugInfo,
    usage: {
      debugOnly: "GET /api/test-cron",
      showAppointments: "GET /api/test-cron?appointments=true",
      triggerNotifications: "GET /api/test-cron?trigger=notifications",
      triggerBriefings: "GET /api/test-cron?trigger=briefings"
    }
  });
}

