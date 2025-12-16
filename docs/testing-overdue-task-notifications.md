# Testing Overdue Task Notifications

This guide explains how to test the three types of overdue task notifications:
1. **Immediate notification** (when task just becomes overdue)
2. **Daily digest** (for critical/configured urgency levels)
3. **Weekly digest** (for non-critical/configured urgency levels)

## Prerequisites

1. **Set up mail settings** in the admin panel:
   - Go to `/admin/account/mail-configuration`
   - Under "Tareas Vencidas" section:
     - Enable "Resumen diario de tareas vencidas" (daily digest)
     - Enable "Resumen semanal de tareas vencidas" (weekly digest)
     - Enable "Notificar cuando una tarea critica se venza" (immediate notification)
     - Configure urgency levels for each (defaults: daily=[5], weekly=[1,2,3,4], immediate=[5])

2. **Set up environment**:
   ```bash
   # For development (logs emails to console)
   # Don't set RESEND_API_KEY
   
   # For real email testing
   RESEND_API_KEY=re_your_key_here
   RESEND_FROM_EMAIL="Vesta CRM <noreply@mail.vesta-crm.com>"
   CRON_SECRET=your_secret_here
   ```

## Test 1: Immediate Overdue Notification

**What it does**: Sends an email immediately when a task becomes overdue (within 15 minutes of due date).

### Setup Steps:

1. **Create a test task**:
   - Title: "Test Immediate Overdue"
   - Due date: **Set to 5-10 minutes ago** (recently overdue)
   - Due time: Optional
   - Urgency: **Must match your configured urgency levels** (default is 5 for immediate notifications)
   - Assign to yourself
   - Mark as **not completed**
   - Mark as **active**

2. **Verify settings**:
   - Go to mail configuration
   - Check that "Notificar cuando una tarea critica se venza" is enabled
   - Check that the urgency level of your task is in the configured urgency levels

3. **Trigger the cron job**:
   ```bash
   # Using test endpoint (development only)
   GET /api/test-cron?trigger=notifications
   
   # Or directly with curl
   curl -X GET http://localhost:3000/api/cron/notifications \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

4. **Expected result**:
   - Email sent immediately (if task became overdue within last 15 minutes)
   - Subject: "🚨 URGENTE: [Task Title]" (for urgency 5) or "⚠️ IMPORTANTE: [Task Title]" (for urgency 4)
   - Email shows task details in box format
   - Link to view the task

### Important Notes:
- **Time window**: Task must have become overdue within the **last 15 minutes**
- **Urgency filtering**: Only sends if task urgency matches configured urgency levels
- **Deduplication**: Won't send if notification already exists for this task

### Troubleshooting:
- **Not sending?** Check:
  - Task due date is within last 15 minutes (not older)
  - Task urgency matches configured urgency levels in settings
  - Immediate notification is enabled in mail settings
  - Task is not completed and is active
  - No existing notification for this task

## Test 2: Daily Digest

**What it does**: Sends a daily email at 9 AM UTC with all overdue tasks matching configured urgency levels (default: urgency 5).

### Setup Steps:

1. **Create test tasks**:
   - Create 2-3 tasks with:
     - Due date: **Any past date** (yesterday, last week, etc.)
     - Urgency: **Must match daily digest urgency levels** (default is 5)
     - Assign to yourself
     - Mark as **not completed**
     - Mark as **active**

2. **Verify settings**:
   - "Resumen diario de tareas vencidas" is enabled
   - Urgency levels include the urgency of your test tasks

3. **Timing requirements**:
   - **Must be 9 AM UTC or later** (or modify code temporarily - see below)
   - **Must not have sent today** (checks if digest was sent today)

4. **Trigger the cron job**:
   ```bash
   GET /api/test-cron?trigger=notifications
   # Or use curl with CRON_SECRET
   ```

5. **Expected result**:
   - One email with all matching overdue tasks
   - Subject: "🚨 X tarea(s) crítica(s) vencida(s)" (if urgency 5)
   - Each task shown in box format
   - Link to view all tasks

### Bypassing Time Check (Development Only):

Temporarily modify `src/server/services/task-digest-email-service.ts`:

```typescript
async function shouldSendDigest(
  userId: string,
  digestType: "weekly" | "daily",
): Promise<boolean> {
  // TEMPORARY: Skip time check for testing
  if (process.env.NODE_ENV === "development") {
    const now = new Date();
    const cutoffTime = digestType === "daily"
      ? new Date(now) // Today
      : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
    cutoffTime.setUTCHours(0, 0, 0, 0);
    
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, `task_overdue_digest_${digestType}`),
          gte(notifications.createdAt, cutoffTime),
        ),
      );
    
    return (result[0]?.count ?? 0) === 0;
  }
  
  // ... rest of original code
}
```

**⚠️ Remember to revert this before production!**

### Troubleshooting:
- **Not sending?** Check:
  - Current time is 9 AM UTC or later (or bypassed for testing)
  - Daily digest not already sent today (check `notifications` table)
  - Tasks match configured urgency levels
  - Daily digest is enabled in mail settings
  - Tasks are overdue, not completed, and active

## Test 3: Weekly Digest

**What it does**: Sends a weekly email on Mondays at 9 AM UTC with all overdue tasks matching configured urgency levels (default: urgency 1-4).

### Setup Steps:

1. **Create test tasks**:
   - Create 3-5 tasks with:
     - Due date: **Any past date** (last week, last month, etc.)
     - Urgency: **Must match weekly digest urgency levels** (default is 1, 2, 3, or 4 - NOT 5)
     - Assign to yourself
     - Mark as **not completed**
     - Mark as **active**

2. **Verify settings**:
   - "Resumen semanal de tareas vencidas" is enabled
   - Urgency levels include the urgency of your test tasks (default: [1,2,3,4])

3. **Timing requirements**:
   - **Must be Monday 9 AM UTC or later** (or modify code temporarily)
   - **Must not have sent in last 7 days** (checks if digest was sent in last week)

4. **Trigger the cron job**:
   ```bash
   GET /api/test-cron?trigger=notifications
   # Or use curl with CRON_SECRET
   ```

5. **Expected result**:
   - One email with all matching overdue tasks
   - Subject: "📋 X tarea(s) vencida(s)"
   - Tasks grouped and shown in box format
   - Link to view all tasks

### Bypassing Time Check (Development Only):

Use the same modification as daily digest, but change the condition:

```typescript
// In shouldSendDigest function, for weekly:
if (digestType === "weekly") {
  // TEMPORARY: Skip day check for testing
  if (process.env.NODE_ENV === "development") {
    // Check only if sent in last 7 days, ignore day of week
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    // ... rest of check
  }
}
```

### Troubleshooting:
- **Not sending?** Check:
  - Current day is Monday and time is 9 AM UTC or later (or bypassed)
  - Weekly digest not already sent in last 7 days
  - Tasks match configured urgency levels (default excludes urgency 5)
  - Weekly digest is enabled in mail settings
  - Tasks are overdue, not completed, and active

## Quick Testing Checklist

### For Immediate Notification:
- [ ] Task due date is 5-15 minutes ago (recently overdue)
- [ ] Task urgency matches configured urgency levels
- [ ] Immediate notification enabled in settings
- [ ] Task is not completed and is active
- [ ] Trigger cron job manually
- [ ] Check email inbox or console logs

### For Daily Digest:
- [ ] Create tasks with urgency matching daily digest levels (default: 5)
- [ ] Tasks are overdue (past due date)
- [ ] Daily digest enabled in settings
- [ ] Current time is 9 AM UTC+ (or bypass time check)
- [ ] No digest sent today yet
- [ ] Trigger cron job manually
- [ ] Check email inbox or console logs

### For Weekly Digest:
- [ ] Create tasks with urgency matching weekly digest levels (default: 1-4)
- [ ] Tasks are overdue (past due date)
- [ ] Weekly digest enabled in settings
- [ ] Current day is Monday and time is 9 AM UTC+ (or bypass time check)
- [ ] No digest sent in last 7 days
- [ ] Trigger cron job manually
- [ ] Check email inbox or console logs

## Testing with Different Urgency Levels

Since urgency filtering is now configurable, you can test with different combinations:

1. **Change urgency levels in settings**:
   - Go to mail configuration
   - Under each overdue notification type, click urgency level buttons
   - Select different urgency levels (1-5)

2. **Create tasks with matching urgency**:
   - Create tasks with urgency levels that match your configuration

3. **Test each notification type**:
   - Immediate: Tasks with urgency in `notifyWhenOverdue.urgencyLevels`
   - Daily: Tasks with urgency in `dailyDigest.urgencyLevels`
   - Weekly: Tasks with urgency in `weeklyDigest.urgencyLevels`

## Checking Results

### In Development Mode (No RESEND_API_KEY):
- Check console logs for email content
- Look for: `📧 Email (Development Mode):`

### With Real Email:
- Check your email inbox
- Check spam folder
- Check Resend dashboard → Logs

### In Database:
```sql
-- Check recent overdue notifications
SELECT 
  notification_id,
  type,
  title,
  delivery_channel,
  is_delivered,
  delivered_at,
  created_at
FROM notifications
WHERE type IN ('task_overdue', 'task_overdue_digest_daily', 'task_overdue_digest_weekly')
ORDER BY created_at DESC
LIMIT 20;

-- Check if digest was sent recently
SELECT 
  type,
  COUNT(*) as count,
  MAX(created_at) as last_sent
FROM notifications
WHERE type LIKE 'task_overdue_digest%'
GROUP BY type;
```

## Common Issues

### "No tasks to send"
- **Cause**: No tasks match the criteria
- **Fix**: Verify tasks are overdue, match urgency levels, and are not completed

### "Digest already sent recently"
- **Cause**: Digest was already sent today (daily) or in last 7 days (weekly)
- **Fix**: Delete recent digest notifications from database, or wait

### "Digest not enabled"
- **Cause**: Email not enabled in mail settings
- **Fix**: Enable the digest in mail configuration UI

### "Wrong urgency levels"
- **Cause**: Tasks don't match configured urgency levels
- **Fix**: Update task urgency or change urgency levels in settings

## Manual Test Script

Create a simple script to test all three types:

```typescript
// test-overdue-notifications.ts
import { db } from "./src/server/db";
import { tasks, users } from "./src/server/db/schema";
import { eq, and, lte, isNotNull } from "drizzle-orm";

async function testOverdueNotifications() {
  // Get your user ID
  const userId = "your-user-id";
  
  // Create test tasks
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
  
  // 1. Task for immediate notification (recently overdue, urgency 5)
  // 2. Tasks for daily digest (overdue, urgency 5)
  // 3. Tasks for weekly digest (overdue, urgency 1-4)
  
  // Then trigger cron: GET /api/cron/notifications
}
```

## Summary

**Fastest way to test all three**:
1. Set up test tasks with appropriate urgency levels
2. Configure mail settings with urgency levels
3. Use test endpoint: `GET /api/test-cron?trigger=notifications`
4. Check console logs (dev mode) or email inbox (production mode)

**Remember**: 
- Immediate notifications require tasks that became overdue within last 15 minutes
- Daily/Weekly digests have timing restrictions (9 AM UTC, Monday for weekly)
- All notifications respect urgency level filtering from settings

