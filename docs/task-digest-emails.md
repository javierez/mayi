# Task Digest Email System

## Overview

The task digest email system sends batched email notifications for overdue tasks instead of individual emails per task. This reduces email volume and improves user experience.

## Email Types

### Weekly Digest (Normal Tasks)
- **When**: Monday at 9:00 AM UTC
- **Who**: Users with overdue tasks (urgency < 5)
- **Content**: All overdue tasks with urgency 1-4
- **Frequency**: Once per week per user

### Daily Digest (Critical Tasks)
- **When**: Every day at 9:00 AM UTC
- **Who**: Users with critical overdue tasks (urgency = 5)
- **Content**: All overdue tasks with urgency = 5 (Critical)
- **Frequency**: Once per day per user

## How It Works

### Cron Job Flow

1. **Cron job runs** every 15 minutes
2. **Finds overdue tasks** (past due date, not completed)
3. **Groups tasks by user** and urgency level
4. **Checks timing**:
   - Daily digest: Only sends if it's 9 AM UTC or later
   - Weekly digest: Only sends if it's Monday 9 AM UTC or later
5. **Checks if already sent**:
   - Daily: Checks if sent today
   - Weekly: Checks if sent in last 7 days
6. **Sends digest email** with all tasks for that user

### Email Content

Each digest email includes:
- **Subject**: Number of tasks (e.g., "🚨 3 tareas críticas vencidas")
- **Task list**: Full details for each task:
  - Title
  - Description
  - Due date and time
  - Urgency level
  - Category
  - Individual link to each task
- **Action button**: Link to all tasks page

## Implementation Details

### Files Created

1. **`src/templates/emails/task-digest-notification.tsx`**
   - Email template for digest emails
   - Handles both weekly and daily formats
   - Includes full task details and individual links

2. **`src/server/services/task-digest-email-service.ts`**
   - Main service for sending digest emails
   - Handles timing logic
   - Tracks last sent timestamps

### Files Modified

1. **`src/app/api/cron/notifications/route.ts`**
   - Replaced individual task notifications with digest logic
   - Groups tasks by user and urgency
   - Calls digest email service

## Timing Logic

### Weekly Digest
- **Day**: Monday only
- **Time**: 9:00 AM UTC or later
- **Deduplication**: Checks if sent in last 7 days

### Daily Digest
- **Day**: Every day
- **Time**: 9:00 AM UTC or later
- **Deduplication**: Checks if sent today (since midnight UTC)

**Note**: Uses UTC timezone. If your users are in a different timezone, you may want to adjust the times or add timezone support.

## Database Tracking

The system creates notification records with:
- **Type**: `task_overdue_digest_weekly` or `task_overdue_digest_daily`
- **Metadata**: Includes task count and task IDs
- **Delivery**: Marked as delivered via email

This allows tracking and prevents duplicate sends.

## Example Email

### Weekly Digest Example

```
Subject: 📋 5 tareas vencidas

Tienes 5 tareas vencidas pendientes de completar.

[Task 1 details with link]
[Task 2 details with link]
[Task 3 details with link]
[Task 4 details with link]
[Task 5 details with link]

[Button: Ver todas las tareas]
```

### Daily Digest Example

```
Subject: 🚨 3 tareas críticas vencidas

Tienes 3 tareas críticas vencidas que requieren atención inmediata.

[Critical Task 1 details with link]
[Critical Task 2 details with link]
[Critical Task 3 details with link]

[Button: Ver todas las tareas]
```

## Benefits

1. **Reduced Email Volume**: One email instead of many
2. **Better Organization**: All overdue tasks in one place
3. **Priority Handling**: Critical tasks get daily attention
4. **User Experience**: Less email fatigue, better overview

## Testing

To test the digest system:

1. **Create test tasks**:
   - Some with urgency = 5 (critical)
   - Some with urgency < 5 (normal)
   - Set due dates in the past

2. **Wait for cron job** (runs every 15 minutes)

3. **Check timing**:
   - Daily digest: Will send if it's 9 AM UTC or later
   - Weekly digest: Will send if it's Monday 9 AM UTC or later

4. **Verify email**:
   - Check inbox for digest email
   - Verify all tasks are included
   - Check individual task links work

## Configuration

No configuration needed - the system works automatically once implemented.

**Future Enhancements**:
- User timezone support
- Customizable send times per user
- Email preferences (opt-in/opt-out)
- Different digest frequencies

## Troubleshooting

### Emails Not Sending

1. **Check timing**: Must be 9 AM UTC or later
2. **Check day**: Weekly digest only on Monday
3. **Check deduplication**: May have already sent today/this week
4. **Check logs**: Look for console messages
5. **Check Resend dashboard**: Verify email delivery

### Wrong Tasks Included

- Verify task urgency levels (1-5, where 5 = Critical)
- Check task due dates (must be in the past)
- Verify tasks are not completed
- Check tasks are active

## Summary

The digest email system provides a better user experience by:
- Batching related notifications
- Prioritizing critical tasks
- Reducing email volume
- Providing comprehensive task overviews

All implemented and ready to use!

