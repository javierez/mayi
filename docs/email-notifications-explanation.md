# Email Notifications Implementation - Process, Flow, and Logic

## Overview

This document explains the complete process, flow, and logic behind the email notifications implementation for the Vesta CRM notification system. Email notifications are sent for high-priority notifications (task_overdue, appointment_reminder) and any notification with priority "high" or "urgent".

## Architecture Overview

The email notification system is built as a non-blocking, asynchronous layer on top of the existing notification system. It follows a "fire-and-forget" pattern where email sending happens after notification creation, ensuring that notification creation is never blocked by email delivery failures.

```
┌─────────────────────────────────────────────────────────────┐
│                    Notification Creation                      │
│  (Existing notification-service.ts functions)                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              createNotificationInternal()                    │
│  Creates notification record in database                     │
│  Returns Notification object                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         sendNotificationEmailIfNeeded()                      │
│  (Called asynchronously, doesn't block)                     │
│  ├── Checks if email should be sent                          │
│  ├── Fetches user email                                      │
│  ├── Generates email content                                 │
│  └── Sends email via Resend API                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         updateNotificationDeliveryStatus()                   │
│  Updates database with delivery status                      │
│  ├── deliveryChannel: "email"                               │
│  ├── isDelivered: true/false                                │
│  ├── deliveredAt: timestamp (if successful)                 │
│  └── deliveryError: error message (if failed)              │
└─────────────────────────────────────────────────────────────┘
```

## Detailed Process Flow

### Step 1: Notification Creation

When a high-priority event occurs (e.g., task becomes overdue, appointment reminder), the notification service creates a notification:

**Example: Task Overdue**

```typescript
// In notifyTaskOverdue()
const notification = await createNotificationInternal({
  accountId,
  userId: task.userId,
  type: "task_overdue",
  title: "Tarea vencida: {taskTitle}",
  message: "Esta tarea está vencida...",
  priority: "high",  // ← High priority triggers email
  category: "tasks",
  // ... other fields
});
```

**Key Points:**
- Notification is created in database first
- `deliveryChannel` defaults to `"in_app"` initially
- `isDelivered` is set to `true` for in-app notifications
- Notification object is returned with `notificationId`

### Step 2: Email Sending Trigger

After notification creation, email sending is triggered asynchronously:

```typescript
// In notifyTaskOverdue() or notifyAppointmentReminder()
sendNotificationEmailIfNeeded(notification).catch((error) => {
  console.error("Failed to send email notification:", error);
  // Don't throw - notification was created successfully
});
```

**Key Design Decisions:**
- **Non-blocking**: Email sending doesn't await completion
- **Error handling**: Failures are logged but don't affect notification creation
- **Fire-and-forget**: Notification creation succeeds even if email fails

### Step 3: Email Decision Logic

The `sendNotificationEmailIfNeeded()` function determines if an email should be sent:

```typescript
async function shouldSendEmailNotification(
  notification: Notification,
  userEmail: string | null,
): Promise<boolean>
```

**Decision Criteria (all must pass):**

1. **User has email address**
   - Checks if `userEmail` is not null/empty
   - If no email, returns `false` immediately

2. **Email not already sent**
   - Checks `isDelivered === true && deliveryChannel === "email"`
   - Prevents duplicate emails

3. **Priority or Type Check**
   - **Priority-based**: `priority === "high" || priority === "urgent"`
   - **Type-based**: Always send for `"task_overdue"` or `"appointment_reminder"`

**Logic Flow:**
```
User has email? → NO → Return false
                ↓ YES
Email already sent? → YES → Return false
                ↓ NO
High/Urgent priority? → YES → Return true
                ↓ NO
Is task_overdue or appointment_reminder? → YES → Return true
                ↓ NO
Return false
```

### Step 4: Email Content Generation

If email should be sent, content is generated based on notification category:

**Template Routing:**
- **Tasks** → `generateTaskNotificationEmail()`
- **Appointments** → `generateAppointmentNotificationEmail()`
- **Other** → `generateNotificationEmailBase()` (fallback)

**Task Email Example:**
```typescript
// Input: Notification with task metadata
{
  title: "Tarea vencida: Revisar contrato",
  message: "Esta tarea está vencida...",
  metadata: {
    dueDate: "2024-01-15T10:00:00Z",
    dueTime: "14:30",
    urgency: 4
  }
}

// Output: Enhanced email content
{
  subject: "Tarea vencida: Revisar contrato",
  html: "<!DOCTYPE html>...",
  text: "Tarea vencida: Revisar contrato..."
}
```

**Content Enhancement:**
- Base message from notification
- Due date formatted in Spanish locale
- Urgency level (Baja, Media, Alta, Urgente)
- Category information
- Action button linking to task/appointment page

### Step 5: Email Delivery

Email is sent via Resend API:

```typescript
await sendEmail({
  to: userEmail,
  subject: notification.title,
  html: generatedHtml,
  text: generatedText,
});
```

**Email Configuration:**
- **From**: `"Vesta CRM <noreply@vesta-crm.com>"` (configurable)
- **To**: User's email from database
- **Subject**: Notification title
- **Content**: HTML and plain text versions

### Step 6: Delivery Status Update

After email sending (success or failure), delivery status is updated:

**Success Case:**
```typescript
await updateNotificationDeliveryStatus(
  notificationId,
  "email",        // deliveryChannel
  true,           // isDelivered
  null            // deliveryError
);
```

**Failure Case:**
```typescript
await updateNotificationDeliveryStatus(
  notificationId,
  "email",        // deliveryChannel
  false,          // isDelivered
  "Error message" // deliveryError
);
```

**Database Fields Updated:**
- `deliveryChannel`: Changed from `"in_app"` to `"email"`
- `isDelivered`: `true` if sent successfully, `false` if failed
- `deliveredAt`: Timestamp when email was sent (only if successful)
- `deliveryError`: Error message if sending failed (only if failed)
- `updatedAt`: Current timestamp

## Logic and Decision Points

### When Emails Are Sent

**Always Sent:**
- `task_overdue` notifications (priority: high)
- `appointment_reminder` notifications (priority: high)

**Sent Based on Priority:**
- Any notification with `priority === "high"`
- Any notification with `priority === "urgent"`

**Never Sent:**
- Normal/low priority notifications (unless type matches above)
- Notifications without user email
- Notifications already sent via email
- Notifications without a user ID

### Error Handling Strategy

**Three-Layer Error Handling:**

1. **Email Service Level**
   - Catches Resend API errors
   - Updates notification with error message
   - Returns success/failure status

2. **Notification Service Level**
   - Catches errors from `sendNotificationEmailIfNeeded()`
   - Logs errors but doesn't throw
   - Notification creation still succeeds

3. **Database Level**
   - Delivery errors stored in `deliveryError` field
   - Allows tracking of failed email attempts
   - Enables future retry mechanisms

**Error Scenarios:**

| Scenario | Behavior | Result |
|----------|----------|--------|
| User email missing | Skip email, log warning | Notification created |
| Resend API failure | Update `deliveryError`, log | Notification created |
| Template generation error | Update `deliveryError`, log | Notification created |
| Database update failure | Log error, continue | Email may have sent |

### Asynchronous Design Rationale

**Why Non-Blocking?**

1. **Performance**: Notification creation is fast (database insert)
2. **Reliability**: Email failures don't break notification system
3. **User Experience**: Users see notifications immediately
4. **Scalability**: Email sending doesn't block other operations

**Trade-offs:**
- ✅ Notification creation never fails due to email issues
- ✅ Fast response times for notification creation
- ✅ Email sending happens in background
- ⚠️ Email delivery is eventually consistent (not immediate)
- ⚠️ No retry mechanism (can be added later)

## Data Flow Example

### Complete Flow: Task Overdue Notification (Cron Job)

```
1. Cron Job Trigger (every 15 minutes)
   └── Detects overdue tasks in database

2. Notification Service (Called by Cron Job)
   └── notifyTaskOverdue(task, accountId)
       ├── Build notification metadata
       ├── Create notification in DB
       │   └── Returns: { notificationId: 123, ... }
       ├── Send push notification
       └── Trigger email sending (async)
           └── sendNotificationEmailIfNeeded(notification)

3. Email Service (Background)
   └── sendNotificationEmailIfNeeded()
       ├── Get user email from DB
       │   └── getUserById(userId) → { email: "user@example.com" }
       ├── Check if should send
       │   ├── User has email? ✓
       │   ├── Already sent? ✗
       │   └── High priority? ✓ → Send email
       ├── Generate email content
       │   └── generateTaskNotificationEmail()
       │       └── Returns: { subject, html, text }
       ├── Send via Resend
       │   └── sendEmail({ to, subject, html, text })
       │       └── Resend API call
       └── Update delivery status
           └── updateNotificationDeliveryStatus()
               └── DB: { deliveryChannel: "email", isDelivered: true }

4. User Receives
   ├── In-app notification (immediate)
   └── Email notification (~30 seconds later)
```

## Integration Points

### Modified Files

1. **`src/server/services/notification-service.ts`**
   - Added import: `sendNotificationEmailIfNeeded`
   - Modified: `notifyTaskOverdue()` - triggers email after notification creation
   - Modified: `notifyAppointmentReminder()` - triggers email after notification creation

### Cron Job Integration

**Important**: Email notifications work automatically with the cron job system!

The cron job (`src/app/api/cron/notifications/route.ts`) runs every 15 minutes and:
- Calls `notifyTaskOverdue()` for overdue tasks → **Emails are sent automatically**
- Calls `notifyAppointmentReminder()` for upcoming appointments → **Emails are sent automatically**

**Flow:**
```
Cron Job (every 15 min)
  ↓
Finds overdue tasks / upcoming appointments
  ↓
Calls notifyTaskOverdue() / notifyAppointmentReminder()
  ↓
Creates notification in database
  ↓
Triggers sendNotificationEmailIfNeeded() (async)
  ↓
Email is sent automatically
```

**Note**: `notifyTaskDueSoon()` (called by cron for tasks due today/tomorrow) has normal priority, so it does NOT trigger emails by default. Only high-priority notifications from the cron job send emails.

2. **`src/server/queries/notification.ts`**
   - Added: `updateNotificationDeliveryStatus()` function
   - Updates delivery tracking fields in database

### New Files

1. **`src/server/services/email-notification-service.ts`**
   - Main email sending logic
   - Decision making for when to send
   - Email content generation routing

2. **`src/templates/emails/notification-base.tsx`**
   - Base email template with Vesta branding
   - Reusable across all notification types

3. **`src/templates/emails/task-notification.tsx`**
   - Task-specific email template
   - Includes due dates, urgency, category

4. **`src/templates/emails/appointment-notification.tsx`**
   - Appointment-specific email template
   - Includes datetime, location, contact info

## Configuration Requirements

### Environment Variables

```bash
# Required for email sending
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Required for action URLs in emails
NEXT_PUBLIC_APP_URL=https://your-domain.com
# OR
APP_URL=https://your-domain.com

# Email address to send from (optional, has default fallback)
# Format: "Display Name <email@domain.com>"
RESEND_FROM_EMAIL="Vesta CRM <noreply@yourdomain.com>"
```

### Email From Address Configuration

The email "from" address is configurable via the `RESEND_FROM_EMAIL` environment variable:

**If `RESEND_FROM_EMAIL` is set:**
- Uses the configured email address

**If `RESEND_FROM_EMAIL` is not set:**
- Falls back to: `"Vesta CRM <noreply@vesta-crm.com>"`

**Important Requirements:**
1. The domain in the email address must be verified in Resend dashboard
2. DNS records (SPF, DKIM) must be properly configured for the domain
3. Without verified domain, emails may be rejected or marked as spam
4. Format: `"Display Name <email@domain.com>"` (quotes required if using spaces)

**Example Configuration:**
```bash
# In .env file
RESEND_FROM_EMAIL="Vesta CRM <noreply@yourdomain.com>"
```

## Monitoring and Debugging

### Success Indicators

- `deliveryChannel === "email"` in notification record
- `isDelivered === true`
- `deliveredAt` timestamp is set
- `deliveryError === null`

### Failure Indicators

- `deliveryChannel === "email"` in notification record
- `isDelivered === false`
- `deliveredAt === null`
- `deliveryError` contains error message

### Debugging Queries

```sql
-- Check email delivery status
SELECT 
  notification_id,
  type,
  title,
  delivery_channel,
  is_delivered,
  delivered_at,
  delivery_error
FROM notifications
WHERE delivery_channel = 'email'
ORDER BY created_at DESC
LIMIT 20;

-- Check failed emails
SELECT 
  notification_id,
  type,
  title,
  delivery_error,
  created_at
FROM notifications
WHERE delivery_channel = 'email' 
  AND is_delivered = false
ORDER BY created_at DESC;
```

## Future Enhancements

### Potential Improvements

1. **User Preferences**
   - Allow users to configure which notifications trigger emails
   - Per-type email settings
   - Email frequency controls (digest mode)

2. **Retry Mechanism**
   - Queue failed emails for retry
   - Exponential backoff
   - Maximum retry attempts

3. **Email Digest**
   - Daily/weekly summaries
   - Group related notifications
   - Reduce email volume

4. **Email Templates**
   - Rich HTML templates
   - Customizable per account
   - Multi-language support

5. **Delivery Tracking**
   - Open tracking
   - Click tracking
   - Bounce handling

## Summary

The email notification system is designed to be:

- **Non-intrusive**: Never blocks notification creation
- **Reliable**: Graceful error handling at every level
- **Efficient**: Asynchronous processing doesn't slow down core operations
- **Trackable**: Full delivery status in database
- **Extensible**: Easy to add more notification types or preferences

The implementation follows a "best effort" approach where email delivery is attempted but failures don't impact the core notification system. This ensures users always receive in-app notifications, with email as an additional channel for important updates.

