# Email Notifications Implementation Plan

## Overview

This document outlines how email notifications would be integrated into the existing notification system. The goal is to send email notifications for high-priority notifications and allow users to configure their email preferences.

## Architecture

### Current State
- ✅ Email service exists (`src/lib/email.ts` using Resend)
- ✅ Notification schema supports `deliveryChannel` field
- ✅ Database tracks `isDelivered`, `deliveredAt`, and `deliveryError`
- ✅ User emails stored in `users.email` field

### Proposed Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Notification Creation (Existing)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  notifyTaskAssigned() / notifyAppointmentScheduled() │   │
│  │  → createNotificationInternal()                      │   │
│  │  → Notification saved to DB (deliveryChannel: "in_app")│ │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Email Delivery Decision Layer                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  shouldSendEmailNotification()                       │   │
│  │  ├── Check user email preferences                    │   │
│  │  ├── Check notification priority                     │   │
│  │  └── Check if email already sent                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (if should send)
┌─────────────────────────────────────────────────────────────┐
│              Email Service Layer                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  sendNotificationEmail()                              │   │
│  │  ├── Fetch user email from DB                        │   │
│  │  ├── Generate email HTML/text from template          │   │
│  │  ├── Call sendEmail() (Resend)                       │   │
│  │  └── Update notification delivery status            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Strategy

### Option 1: Immediate Email Sending (Recommended for MVP)

**When**: Send email immediately after creating notification

**Pros**:
- Simple implementation
- No additional background jobs needed
- Immediate delivery

**Cons**:
- Slightly slower notification creation (adds email API call)
- If email fails, notification still created (acceptable)

**Implementation**:
1. After `createNotificationInternal()` succeeds
2. Check if email should be sent
3. If yes, send email asynchronously (don't block notification creation)
4. Update notification record with delivery status

### Option 2: Background Job Processing

**When**: Process email queue via cron job or background worker

**Pros**:
- Decouples notification creation from email sending
- Can retry failed emails
- Better for high-volume scenarios

**Cons**:
- More complex (requires queue/job system)
- Delayed delivery
- Additional infrastructure needed

**Recommendation**: Start with Option 1, migrate to Option 2 if needed.

## File Structure

```
src/
├── lib/
│   └── email.ts                    # ✅ Already exists (Resend)
├── server/
│   ├── services/
│   │   ├── notification-service.ts  # ✅ Already exists
│   │   └── email-notification-service.ts  # 🆕 NEW: Email sending logic
│   └── queries/
│       └── notification.ts          # ✅ Already exists (add email delivery update)
└── templates/
    └── emails/
        ├── notification-base.tsx    # 🆕 Base email template
        ├── task-notification.tsx    # 🆕 Task email templates
        └── appointment-notification.tsx  # 🆕 Appointment email templates
```

## Step-by-Step Implementation

### Step 1: Create Email Notification Service

**File**: `src/server/services/email-notification-service.ts`

**Responsibilities**:
- Determine if email should be sent
- Fetch user email address
- Generate email content from templates
- Send email via Resend
- Update notification delivery status

**Key Functions**:

```typescript
/**
 * Check if an email notification should be sent
 */
async function shouldSendEmailNotification(
  notification: Notification,
  userEmail: string | null,
): Promise<boolean> {
  // 1. User must have email
  if (!userEmail) return false;
  
  // 2. Check user preferences (if implemented)
  // const preferences = await getUserEmailPreferences(notification.userId);
  // if (!preferences.enabled) return false;
  
  // 3. Check notification priority (send for high/urgent, or based on type)
  const shouldSendByPriority = 
    notification.priority === "high" || 
    notification.priority === "urgent" ||
    notification.type === "task_overdue" ||
    notification.type === "appointment_reminder";
  
  // 4. Don't send if already sent
  if (notification.isDelivered && notification.deliveryChannel === "email") {
    return false;
  }
  
  return shouldSendByPriority;
}

/**
 * Send email notification
 */
async function sendNotificationEmail(
  notification: Notification,
  userEmail: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate email content
    const { subject, html, text } = generateNotificationEmail(notification);
    
    // Send email
    await sendEmail({
      to: userEmail,
      subject,
      html,
      text,
    });
    
    // Update notification delivery status
    await updateNotificationDeliveryStatus(
      notification.notificationId,
      "email",
      true,
      null, // no error
    );
    
    return { success: true };
  } catch (error) {
    // Update notification with error
    await updateNotificationDeliveryStatus(
      notification.notificationId,
      "email",
      false,
      error instanceof Error ? error.message : "Unknown error",
    );
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
```

### Step 2: Create Email Templates

**File**: `src/templates/emails/notification-base.tsx`

**Purpose**: Reusable base template with Vesta branding

```typescript
export function generateNotificationEmailBase(
  title: string,
  message: string,
  actionUrl: string | null,
  actionLabel: string | null,
): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title} - Vesta CRM</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1f2937; margin-bottom: 10px;">
            Vesta <span style="background: linear-gradient(to right, #f59e0b, #f43f5e); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">CRM</span>
          </h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">${title}</h2>
          
          <p style="margin-bottom: 20px;">
            ${message}
          </p>
          
          ${actionUrl && actionLabel ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionUrl}" 
                 style="background: linear-gradient(to right, #f59e0b, #f43f5e); 
                        color: white; 
                        padding: 12px 30px; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        font-weight: bold; 
                        display: inline-block;">
                ${actionLabel}
              </a>
            </div>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
          <p>Este email fue enviado por Vesta CRM</p>
          <p>© ${new Date().getFullYear()} Vesta CRM. Todos los derechos reservados.</p>
        </div>
      </body>
    </html>
  `;
  
  const text = `
${title} - Vesta CRM

${message}

${actionUrl ? `Accede aquí: ${actionUrl}` : ''}

Este email fue enviado por Vesta CRM
© ${new Date().getFullYear()} Vesta CRM. Todos los derechos reservados.
  `;
  
  return { html, text };
}
```

**File**: `src/templates/emails/task-notification.tsx`

**Purpose**: Task-specific email templates with task details

```typescript
import { generateNotificationEmailBase } from "./notification-base";
import type { Notification, TaskNotificationMetadata } from "~/types/notifications";

export function generateTaskNotificationEmail(
  notification: Notification,
): { subject: string; html: string; text: string } {
  const metadata = notification.metadata as TaskNotificationMetadata;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vesta-crm.com";
  const actionUrl = notification.actionUrl 
    ? `${baseUrl}${notification.actionUrl}` 
    : null;
  
  // Build detailed message
  let detailedMessage = notification.message;
  
  if (metadata.dueDate) {
    const dueDate = new Date(metadata.dueDate);
    const formattedDate = dueDate.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    detailedMessage += `\n\n📅 Fecha de vencimiento: ${formattedDate}`;
    if (metadata.dueTime) {
      detailedMessage += ` a las ${metadata.dueTime}`;
    }
  }
  
  if (metadata.urgency) {
    const urgencyLabels = { 1: "Baja", 2: "Media", 3: "Alta", 4: "Urgente" };
    detailedMessage += `\n\n⚡ Urgencia: ${urgencyLabels[metadata.urgency as keyof typeof urgencyLabels] || "Normal"}`;
  }
  
  const { html, text } = generateNotificationEmailBase(
    notification.title,
    detailedMessage,
    actionUrl,
    "Ver tarea",
  );
  
  return {
    subject: notification.title,
    html,
    text,
  };
}
```

### Step 3: Integrate with Notification Service

**Modify**: `src/server/queries/notification.ts`

**Add function**:

```typescript
/**
 * Update notification delivery status
 */
export async function updateNotificationDeliveryStatus(
  notificationId: bigint,
  deliveryChannel: string,
  isDelivered: boolean,
  deliveryError: string | null,
): Promise<void> {
  await db
    .update(notifications)
    .set({
      deliveryChannel,
      isDelivered,
      deliveredAt: isDelivered ? new Date() : null,
      deliveryError,
      updatedAt: new Date(),
    })
    .where(eq(notifications.notificationId, notificationId));
}
```

**Modify**: `src/server/services/notification-service.ts`

**Add email sending after notification creation**:

```typescript
import { sendNotificationEmailIfNeeded } from "./email-notification-service";

// In notifyTaskAssigned(), after createNotificationInternal():
export async function notifyTaskAssigned(
  task: Task,
  assigneeId: string,
  assignerId: string | null,
  accountId: bigint,
): Promise<void> {
  try {
    // ... existing notification creation code ...
    
    const notification = await createNotificationInternal({
      // ... existing data ...
    });
    
    // 🆕 Send email notification if needed (async, don't await)
    sendNotificationEmailIfNeeded(notification).catch((error) => {
      console.error("Failed to send email notification:", error);
      // Don't throw - notification was created successfully
    });
    
  } catch (error) {
    console.error("Error creating task assigned notification:", error);
    throw error;
  }
}
```

### Step 4: Add User Email Query Helper

**File**: `src/server/queries/user.ts` (or create if doesn't exist)

```typescript
/**
 * Get user email by user ID
 */
export async function getUserEmailById(userId: string): Promise<string | null> {
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  return user?.email ?? null;
}
```

## Email Sending Rules

### When to Send Emails

**Always send for**:
- `task_overdue` (high priority)
- `appointment_reminder` (high priority, time-sensitive)

**Send for high/urgent priority**:
- Any notification with `priority === "high"` or `priority === "urgent"`

**Optional (configurable)**:
- All task notifications
- All appointment notifications
- User preference-based

### Email Content Strategy

1. **Subject Line**: Use notification title (e.g., "Nueva tarea asignada: Revisar contrato")
2. **Body**: Include notification message + relevant metadata
3. **Call-to-Action**: Button linking to `actionUrl` (full URL with domain)
4. **Branding**: Consistent with existing email templates (password reset)

## User Preferences (Future Enhancement)

### Database Schema Addition

```sql
-- Add to users.preferences JSONB field
{
  "emailNotifications": {
    "enabled": true,
    "types": {
      "task_assigned": true,
      "task_overdue": true,
      "appointment_reminder": true,
      // ... other types
    },
    "priorityThreshold": "high" // Only send emails for high/urgent
  }
}
```

### Implementation

```typescript
async function getUserEmailPreferences(userId: string) {
  const user = await getUserById(userId);
  const preferences = (user?.preferences as Record<string, unknown>) ?? {};
  const emailPrefs = (preferences.emailNotifications as Record<string, unknown>) ?? {
    enabled: true,
    types: {},
    priorityThreshold: "high",
  };
  
  return {
    enabled: emailPrefs.enabled ?? true,
    types: emailPrefs.types ?? {},
    priorityThreshold: emailPrefs.priorityThreshold ?? "high",
  };
}
```

## Error Handling

### Email Sending Failures

1. **Log error** but don't fail notification creation
2. **Update notification** with `deliveryError` field
3. **Retry logic** (optional): Could add retry queue for failed emails

### Common Failure Scenarios

- **Invalid email address**: Skip sending, log warning
- **Resend API failure**: Update `deliveryError`, notification still created
- **User email not found**: Skip sending, log warning

## Testing Strategy

### Manual Testing

1. Create high-priority task → Check email sent
2. Create overdue task → Check email sent
3. Create appointment reminder → Check email sent
4. Create low-priority notification → Check email NOT sent
5. Invalid user email → Check graceful failure

### Email Template Testing

- Test all notification types
- Verify action URLs work
- Check mobile email rendering
- Verify Spanish text formatting

## Configuration

### Environment Variables

Already configured:
- `RESEND_API_KEY` (required for email sending)
- `NEXT_PUBLIC_APP_URL` (for action URLs in emails)

### Email From Address

Update in `src/lib/email.ts`:
```typescript
from: "Vesta CRM <noreply@vesta-crm.com>", // Update with verified domain
```

## Migration Path

### Phase 1: High-Priority Only (MVP)
- Send emails for `task_overdue` and `appointment_reminder` only
- Simple implementation, minimal risk

### Phase 2: Priority-Based
- Send emails for all high/urgent priority notifications
- Add user preference checks

### Phase 3: Full Customization
- User preferences UI
- Per-type email settings
- Email digest options (daily/weekly summaries)

## Performance Considerations

1. **Async Email Sending**: Don't block notification creation
2. **Rate Limiting**: Resend has rate limits (check their docs)
3. **Batching**: For cron job reminders, could batch emails
4. **Caching**: Cache user email addresses if frequently accessed

## Security Considerations

1. **Email Verification**: Only send to verified email addresses (if `emailVerified` field exists)
2. **Action URLs**: Include authentication tokens or use session-based auth
3. **Unsubscribe**: Add unsubscribe link to emails (future enhancement)

## Summary

**Implementation Checklist**:

- [ ] Create `email-notification-service.ts` with sending logic
- [ ] Create email templates (`notification-base.tsx`, task/appointment templates)
- [ ] Add `updateNotificationDeliveryStatus()` to notification queries
- [ ] Add `getUserEmailById()` helper
- [ ] Integrate email sending into notification service functions
- [ ] Test with high-priority notifications
- [ ] Update documentation

**Estimated Complexity**: Medium
**Estimated Time**: 4-6 hours for MVP (high-priority only)

This implementation maintains backward compatibility (in-app notifications still work) while adding email delivery as an additional channel for important notifications.

