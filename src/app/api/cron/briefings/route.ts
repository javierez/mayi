import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { sendBriefingEmail } from "~/server/services/briefing-email-service";

/**
 * Get current time components in Spain timezone (Europe/Madrid).
 * Returns day of week (0=Sunday, 1=Monday) and hour (0-23) in Spain local time.
 */
function getSpainTimeComponents(): { dayOfWeek: number; hour: number } {
  const now = new Date();
  
  // Get day of week in Spain timezone
  const dayFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    weekday: 'short'
  });
  const dayStr = dayFormatter.format(now);
  const dayMap: Record<string, number> = {
    'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
  };
  
  // Get hour in Spain timezone
  const hourFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    hour12: false
  });
  const hourStr = hourFormatter.format(now);
  
  return {
    dayOfWeek: dayMap[dayStr] ?? 0,
    hour: parseInt(hourStr, 10)
  };
}

/**
 * Cron job handler for weekly and daily briefings
 * 
 * Weekly: Runs Monday at 9:00 AM Spain time (Europe/Madrid)
 * Daily: Runs every day at 9:00 AM Spain time (Europe/Madrid)
 * 
 * Note: Vercel cron runs at 7 AM UTC to ensure we catch 9 AM Spain time
 * (which is 7 AM UTC in summer / 8 AM UTC in winter).
 * The code checks Spain local time to determine when to send.
 * 
 * Sends briefing emails based on MailSettings configuration.
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
    // Use Spain timezone for determining when to send briefings
    const { dayOfWeek, hour } = getSpainTimeComponents();
    
    // Determine which briefings to send (based on Spain local time)
    const shouldSendWeekly = dayOfWeek === 1 && hour >= 9; // Monday 9 AM Spain or later
    const shouldSendDaily = hour >= 9; // 9 AM Spain or later any day

    if (!shouldSendWeekly && !shouldSendDaily) {
      return NextResponse.json({
        success: true,
        message: "Not time for briefings yet (Spain time)",
        weekly: false,
        daily: false,
        spainTime: { dayOfWeek, hour },
      });
    }

    // Get all active users
    const allUsers = await db
      .select({
        id: users.id,
        accountId: users.accountId,
      })
      .from(users)
      .where(eq(users.isActive, true));

    const weeklySent: number[] = [];
    const dailySent: number[] = [];
    const weeklyErrors: string[] = [];
    const dailyErrors: string[] = [];

    // Send briefings to each user
    for (const user of allUsers) {
      const accountId = user.accountId;
      if (!accountId || typeof accountId !== "bigint") continue;

      // Send weekly briefing if it's Monday
      if (shouldSendWeekly) {
        try {
          const result = await sendBriefingEmail(
            user.id,
            BigInt(accountId),
            "weekly",
          );
          if (result.success) {
            weeklySent.push(1);
          } else {
            weeklyErrors.push(`User ${user.id}: ${result.error}`);
          }
        } catch (error) {
          weeklyErrors.push(`User ${user.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }

      // Send daily briefing
      if (shouldSendDaily) {
        try {
          const result = await sendBriefingEmail(
            user.id,
            BigInt(accountId),
            "daily",
          );
          if (result.success) {
            dailySent.push(1);
          } else {
            dailyErrors.push(`User ${user.id}: ${result.error}`);
          }
        } catch (error) {
          dailyErrors.push(`User ${user.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      weekly: {
        sent: weeklySent.length,
        errors: weeklyErrors.length,
        errorDetails: weeklyErrors.slice(0, 10), // Limit error details
      },
      daily: {
        sent: dailySent.length,
        errors: dailyErrors.length,
        errorDetails: dailyErrors.slice(0, 10), // Limit error details
      },
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error in briefings cron job:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}


