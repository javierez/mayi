# WhatsApp Notification Service - Implementation Guide

This document explains in detail the WhatsApp notification service we built for Vesta, parallel to the existing email notification system.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [How Twilio WhatsApp Works](#3-how-twilio-whatsapp-works)
4. [Files Created](#4-files-created)
5. [Files Modified](#5-files-modified)
6. [Flow: From Notification to WhatsApp Message](#6-flow-from-notification-to-whatsapp-message)
7. [Configuration & Settings](#7-configuration--settings)
8. [Template System](#8-template-system)
9. [Testing](#9-testing)
10. [Production Deployment](#10-production-deployment)

---

## 1. Overview

### What We Built

A WhatsApp notification service that:
- Runs **parallel** to the existing email notification system
- Sends WhatsApp messages for **internal team notifications** (tasks and appointments)
- Uses **Twilio's Content Templates** (pre-approved message formats)
- Respects the same **settings and quiet hours** as email
- Is **async and non-blocking** (doesn't slow down the main app)

### Why This Approach?

1. **WhatsApp Business API requires templates**: You can't just send any text - messages must use pre-approved templates
2. **Parallel to email**: We didn't replace email, we added WhatsApp as an additional channel
3. **Same settings infrastructure**: We reused the existing `smsEnabled` field in notification settings
4. **Twilio integration**: We already had Twilio for SMS 2FA, so we extended it for WhatsApp

---

## 2. Architecture

### High-Level Flow

```
User Action (create task, schedule appointment, etc.)
    │
    ▼
notification-service.ts
    │
    ├──► createNotificationInternal()  →  Saves to database
    │
    ├──► sendPushToUser()              →  Push notification (existing)
    │
    ├──► sendNotificationEmailIfNeeded()  →  Email (existing)
    │
    └──► sendNotificationWhatsAppIfNeeded()  →  WhatsApp (NEW)
              │
              ▼
         whatsapp-notification-service.ts
              │
              ├── Check if user has phone number
              ├── Check if WhatsApp enabled in settings (smsEnabled)
              ├── Check quiet hours
              │
              ▼
         whatsapp-template-router.ts
              │
              ├── Map notification type to template SID
              ├── Extract variables from notification metadata
              │
              ▼
         whatsapp-service.ts
              │
              ├── Format phone number (whatsapp:+34...)
              ├── Call Twilio API
              │
              ▼
         Twilio WhatsApp API
              │
              ▼
         User's WhatsApp
```

### Parallel Execution

Both email and WhatsApp are sent **asynchronously** without waiting:

```typescript
// In notification-service.ts
sendNotificationEmailIfNeeded(notification, accountId).catch((error) => {
  console.error("Failed to send email:", error);
});

sendNotificationWhatsAppIfNeeded(notification, accountId).catch((error) => {
  console.error("Failed to send WhatsApp:", error);
});
```

This means:
- The main function returns immediately
- Email and WhatsApp are sent in the background
- If one fails, the other still works
- The notification is created in the database regardless

---

## 3. How Twilio WhatsApp Works

### Message Types

| Type | When to Use | Template Required? |
|------|-------------|-------------------|
| **Business-Initiated** | Sending notifications anytime | YES |
| **Freeform** | Reply within 24h of user message | NO |

We use **Business-Initiated** messages because we're sending notifications proactively.

### Content Templates

Twilio requires pre-approved "Content Templates" for business-initiated messages:

1. You create a template in Twilio Console with placeholders: `{{1}}`, `{{2}}`, etc.
2. WhatsApp/Meta reviews and approves it (24-48h)
3. You get a Template SID (e.g., `HX1234567890abcdef...`)
4. When sending, you provide the SID and variable values

**Example Template:**
```
📋 *Nueva tarea asignada*

*{{1}}*

👤 Asignada por: {{2}}
📆 Fecha límite: {{3}}
```

**When sending:**
```typescript
await client.messages.create({
  from: "whatsapp:+14155238886",
  to: "whatsapp:+34636036116",
  contentSid: "HX1234567890abcdef",
  contentVariables: JSON.stringify({
    "1": "Llamar a María García",
    "2": "Juan Pérez",
    "3": "Viernes 3 de enero a las 14:00"
  })
});
```

### Sandbox vs Production

| Feature | Sandbox | Production |
|---------|---------|------------|
| Phone Number | `+14155238886` (shared) | Your own number |
| Recipients | Must join with keyword | Any WhatsApp user |
| Templates | Can test freeform | Must use approved templates |
| Cost | Free (trial credits) | Per message (~$0.01) |

---

## 4. Files Created

### 4.1 `src/types/whatsapp-templates.ts`

**Purpose:** Central registry of template SIDs and helper constants.

```typescript
// Template SIDs - Update these after Twilio approval
export const WHATSAPP_TEMPLATE_SIDS = {
  task_assigned: "HX_PLACEHOLDER_TASK_ASSIGNED",
  task_completed: "HX_PLACEHOLDER_TASK_COMPLETED",
  // ... etc
} as const;

// Helper labels for Spanish display
export const URGENCY_LABELS: Record<number, string> = {
  1: "Baja",
  2: "Media",
  3: "Alta",
  4: "Urgente",
  5: "Critica",
};
```

**Why:**
- Single source of truth for template SIDs
- Easy to update when templates are approved
- Spanish labels for message content

---

### 4.2 `src/server/services/whatsapp-service.ts`

**Purpose:** Low-level Twilio API wrapper.

**Key Functions:**

```typescript
// Normalize phone to WhatsApp format
export function normalizeToWhatsApp(phoneNumber: string): string {
  // "636036116" → "whatsapp:+34636036116"
}

// Send a templated message
export async function sendWhatsAppTemplate(
  phoneNumber: string,
  contentSid: string,
  contentVariables: Record<string, string>,
): Promise<{ success: boolean; messageSid?: string; error?: string }>

// Send freeform message (within 24h window only)
export async function sendWhatsAppFreeform(
  phoneNumber: string,
  body: string,
): Promise<{ success: boolean; messageSid?: string; error?: string }>

// Check if WhatsApp is configured
export function isWhatsAppConfigured(): boolean
```

**Why:**
- Encapsulates all Twilio-specific logic
- Handles phone number normalization for Spain (+34)
- Provides clear error messages for common Twilio errors

---

### 4.3 `src/server/services/whatsapp-config-helpers.ts`

**Purpose:** Determine if WhatsApp should be sent based on settings.

**Key Function:**

```typescript
export function shouldSendWhatsAppForNotification(
  notification: Notification,
  settings: MailSettings,
): boolean {
  // Checks the smsEnabled field for the specific notification type

  // For task_assigned:
  if (notificationType === "task_assigned") {
    return settings.tasks.events.taskAssigned.smsEnabled;
  }

  // Similar logic for all 9 notification types...
}
```

**Why:**
- Mirrors the email config helpers exactly
- Uses existing `smsEnabled` field (no database migration needed)
- Reuses quiet hours logic from email helpers

---

### 4.4 `src/server/services/whatsapp-template-router.ts`

**Purpose:** Map notifications to templates and extract variables.

**Key Function:**

```typescript
export function routeToWhatsAppTemplate(
  notification: Notification,
): TemplateRouteResult | null {

  if (notification.type === "task_assigned") {
    const meta = notification.metadata as TaskNotificationMetadata;

    return {
      templateSid: WHATSAPP_TEMPLATE_SIDS.task_assigned,
      variables: {
        "1": meta.taskTitle ?? notification.title,
        "2": meta.taskDescription ?? "-",
        "3": meta.assignerName ?? "Sistema",
        "4": formatDateTime(meta.dueDate, meta.dueTime),
        "5": formatUrgency(meta.urgency),
        // ... 12 variables total for task_assigned
      },
    };
  }

  // Similar for all 9 notification types...
}
```

**Why:**
- Separates template logic from notification logic
- Each notification type has specific variable extraction
- Handles missing data gracefully with fallbacks

---

### 4.5 `src/server/services/whatsapp-notification-service.ts`

**Purpose:** Main orchestrator - decides if and how to send WhatsApp.

**Key Function:**

```typescript
export async function sendNotificationWhatsAppIfNeeded(
  notification: Notification,
  accountId: bigint,
): Promise<{ success: boolean; error?: string }> {

  // 1. Get user's phone number
  const user = await getUserById(notification.userId);
  const userPhone = user?.phone ?? null;

  // 2. Get account settings
  const settings = await getEmailSettingsForAccount(accountId);

  // 3. Check if should send
  const { shouldSend, reason } = await shouldSendWhatsAppNotification(
    notification,
    userPhone,
    settings,
  );

  if (!shouldSend) {
    console.log(`[WhatsApp] Skipping: ${reason}`);
    return { success: false, error: reason };
  }

  // 4. Route to template
  const templateRoute = routeToWhatsAppTemplate(notification);

  // 5. Send via Twilio
  const result = await sendWhatsAppTemplate(
    userPhone!,
    templateRoute.templateSid,
    templateRoute.variables,
  );

  // 6. Update delivery status in database
  await updateNotificationDeliveryStatus(
    notification.notificationId,
    "sms",  // We use "sms" channel for WhatsApp
    result.success,
    result.error ?? null,
  );

  return result;
}
```

**Why:**
- Single entry point for WhatsApp notifications
- Follows same pattern as email notification service
- Handles all edge cases (no phone, disabled in settings, quiet hours)

---

## 5. Files Modified

### 5.1 `src/env.js`

**Added:**
```typescript
// In server schema
TWILIO_WHATSAPP_NUMBER: z.string().optional(),

// In runtimeEnv
TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER,
```

**Why:** Environment variable for WhatsApp sender number.

---

### 5.2 `src/server/services/notification-service.ts`

**Added import:**
```typescript
import { sendNotificationWhatsAppIfNeeded } from "~/server/services/whatsapp-notification-service";
```

**Added to each notification function:**
```typescript
// After the email call in each function:
sendNotificationWhatsAppIfNeeded(notification, accountId).catch((error) => {
  console.error("Failed to send WhatsApp notification:", error);
});
```

**Functions modified (9 total):**
- `notifyTaskAssigned()`
- `notifyTaskCompleted()`
- `notifyTaskReassigned()`
- `notifyTaskDueSoon()`
- `notifyTaskOverdue()`
- `notifyAppointmentScheduled()`
- `notifyAppointmentRescheduled()`
- `notifyAppointmentCancelled()`
- `notifyAppointmentReminder()`

---

## 6. Flow: From Notification to WhatsApp Message

Let's trace a complete example: **Task Assigned**

### Step 1: User Creates Task

In `src/server/queries/task.ts`, when a task is created:

```typescript
// After task is saved to database...
await notifyTaskAssigned(accountId, task, assignerUserId);
```

### Step 2: Notification Service Creates Notification

In `notifyTaskAssigned()`:

```typescript
// Build rich metadata
const metadata: TaskNotificationMetadata = {
  taskTitle: task.name,
  taskDescription: task.notes,
  dueDate: task.dueAt?.toISOString(),
  urgency: task.urgency,
  assignerName: assignerUser?.name,
  listing: { /* property data */ },
  contact: { /* contact data */ },
  // ... etc
};

// Create notification in database
const notification = await createNotificationInternal({
  userId: task.userId,
  type: "task_assigned",
  title: "Nueva tarea asignada",
  message: task.name,
  category: "tasks",
  metadata,
});

// Send push notification
sendPushAfterNotification(...);

// Send email (async)
sendNotificationEmailIfNeeded(notification, accountId).catch(...);

// Send WhatsApp (async) ← NEW
sendNotificationWhatsAppIfNeeded(notification, accountId).catch(...);
```

### Step 3: WhatsApp Service Checks Conditions

In `sendNotificationWhatsAppIfNeeded()`:

```typescript
// Get user phone
const user = await getUserById(notification.userId);
// user.phone = "636036116"

// Get settings
const settings = await getEmailSettingsForAccount(accountId);
// settings.tasks.events.taskAssigned.smsEnabled = true

// Check conditions:
// ✓ WhatsApp configured (TWILIO_WHATSAPP_NUMBER exists)
// ✓ User has phone number
// ✓ Not already delivered via SMS
// ✓ smsEnabled = true in settings
// ✓ Not quiet hours (or bypasses due to urgency)
```

### Step 4: Template Router Maps Variables

In `routeToWhatsAppTemplate()`:

```typescript
// Input: notification with metadata
// Output:
{
  templateSid: "HX1234567890abcdef",
  variables: {
    "1": "Llamar a María García para confirmar visita",
    "2": "Contactar antes del mediodía",
    "3": "Juan Pérez",
    "4": "Viernes 3 de enero de 2025 a las 14:00",
    "5": "Alta",
    "6": "Seguimiento",
    "7": "Calle Mayor 23, 2ºB, Madrid",
    "8": "V-2024-0156",
    "9": "María García López",
    "10": "Propietario",
    "11": "+34 612 345 678",
    "12": "https://vesta.app/tareas"
  }
}
```

### Step 5: Twilio API Sends Message

In `sendWhatsAppTemplate()`:

```typescript
const message = await twilioClient.messages.create({
  from: "whatsapp:+14155238886",
  to: "whatsapp:+34636036116",
  contentSid: "HX1234567890abcdef",
  contentVariables: JSON.stringify(variables),
});
// Returns: { sid: "SM...", status: "queued" }
```

### Step 6: Delivery Status Updated

```typescript
await updateNotificationDeliveryStatus(
  notification.notificationId,
  "sms",      // channel
  true,       // success
  null,       // no error
);
```

### Step 7: User Receives WhatsApp

The message arrives on the user's phone:

```
📋 *Nueva tarea asignada*

*Llamar a María García para confirmar visita*

Contactar antes del mediodía

👤 Asignada por: Juan Pérez
📆 Fecha límite: Viernes 3 de enero de 2025 a las 14:00
⚡ Urgencia: Alta
🏷️ Categoría: Seguimiento

🏠 *Propiedad*
Calle Mayor 23, 2ºB, Madrid
Ref: V-2024-0156

👤 *Contacto*
María García López (Propietario)
📱 +34 612 345 678

Ver en Vesta: https://vesta.app/tareas
```

---

## 7. Configuration & Settings

### Environment Variable

In `.env`:
```bash
# For sandbox (testing)
TWILIO_WHATSAPP_NUMBER=+14155238886

# For production (your registered number)
TWILIO_WHATSAPP_NUMBER=+34XXXXXXXXX
```

### Notification Settings

WhatsApp uses the existing `smsEnabled` field in `NotificationOption`:

```typescript
interface NotificationOption {
  id: string;
  label: string;
  description: string;
  emailEnabled: boolean;
  smsEnabled: boolean;      // ← This controls WhatsApp
  additionalUsers?: string[];
  urgencyLevels?: number[];
}
```

**In the admin UI:** The SMS toggle controls WhatsApp notifications.

### Settings Structure

```typescript
MailSettings {
  tasks: {
    critical: { dueIn1h: { smsEnabled: true }, ... },
    urgent: { ... },
    other: { ... },
    overdue: { notifyWhenOverdue: { smsEnabled: true }, ... },
    events: {
      taskAssigned: { smsEnabled: true },
      taskCompleted: { smsEnabled: false },
      taskReassigned: { smsEnabled: true },
    }
  },
  appointments: {
    visita: { notify24h: { smsEnabled: true }, ... },
    firma: { ... },
    // ... etc
    events: {
      appointmentScheduled: { smsEnabled: true },
      appointmentRescheduled: { smsEnabled: true },
      appointmentCancelled: { smsEnabled: true },
    }
  },
  quietHours: { ... }
}
```

---

## 8. Template System

### 9 Templates Defined

| Template | Variables | Use Case |
|----------|-----------|----------|
| `task_assigned` | 12 | New task assigned to user |
| `task_completed` | 7 | Task marked complete (notifies creator) |
| `task_reassigned` | 12 | Task moved to different user |
| `task_due_soon` | 11 | Reminder before due date |
| `task_overdue` | 11 | Task past due date |
| `apt_scheduled` | 14 | New appointment created |
| `apt_rescheduled` | 14 | Appointment time changed |
| `apt_cancelled` | 14 | Appointment cancelled |
| `apt_reminder` | 14 | Reminder before appointment |

### Template Variable Extraction

Each template has specific variable extraction logic:

```typescript
// task_assigned example
variables: {
  "1": meta.taskTitle,           // Task title
  "2": meta.taskDescription,     // Description
  "3": meta.assignerName,        // Who assigned it
  "4": formatDateTime(...),      // Due date/time
  "5": formatUrgency(...),       // "Alta", "Media", etc.
  "6": meta.category,            // Task category
  "7": buildPropertyAddress(...),// Property address
  "8": meta.listing?.referenceNumber,
  "9": contactName,              // Contact name
  "10": contactType,             // "Propietario", "Comprador"
  "11": contactPhone,            // Contact phone
  "12": vestaUrl,                // Link to Vesta
}
```

### Handling Missing Data

All variables have fallbacks:

```typescript
"1": meta.taskTitle ?? notification.title,  // Fallback to notification title
"2": meta.taskDescription ?? "-",           // Fallback to dash
"3": meta.assignerName ?? "Sistema",        // Fallback to "Sistema"
```

---

## 9. Testing

### Sandbox Testing

1. **Join the sandbox:**
   - Open WhatsApp
   - Send `join <keyword>` to `+14155238886`
   - The keyword is shown in Twilio Console

2. **Test freeform message:**
   ```javascript
   // We used this to verify connectivity
   await client.messages.create({
     from: "whatsapp:+14155238886",
     to: "whatsapp:+34636036116",
     body: "Test message from Vesta!",
   });
   ```

3. **Test templated message:**
   ```javascript
   await client.messages.create({
     from: "whatsapp:+14155238886",
     to: "whatsapp:+34636036116",
     contentSid: "HX...",
     contentVariables: JSON.stringify({ "1": "value1", ... }),
   });
   ```

### Sandbox Limitations

- Only phones that joined can receive messages
- Freeform only works within 24h of last user message
- Templates need approval for production

---

## 10. Production Deployment

### Checklist

1. **Templates approved:**
   - Submit templates in Twilio Content Template Builder
   - Wait for WhatsApp approval (24-48h)
   - Update SIDs in `src/types/whatsapp-templates.ts`

2. **Environment variable:**
   ```bash
   # Production .env
   TWILIO_WHATSAPP_NUMBER=+34XXXXXXXXX
   ```

3. **Register WhatsApp Business number:**
   - Go to Twilio Console → WhatsApp Senders
   - Complete Meta Business verification
   - Register your phone number

4. **Enable in settings:**
   - Admin → Notification Settings
   - Toggle SMS/WhatsApp for desired notifications

5. **User opt-in:**
   - Ensure users have phone numbers in their profiles
   - WhatsApp requires explicit opt-in (GDPR)

### Updating Template SIDs

After templates are approved:

```typescript
// src/types/whatsapp-templates.ts
export const WHATSAPP_TEMPLATE_SIDS = {
  task_assigned: "HX1234567890abcdef1234567890abcdef",  // Real SID
  task_completed: "HX...",
  // ... etc
} as const;
```

---

## Summary

We built a complete WhatsApp notification system that:

1. **Integrates seamlessly** with existing notification infrastructure
2. **Runs in parallel** with email (async, non-blocking)
3. **Uses Twilio Content Templates** for WhatsApp Business API compliance
4. **Respects existing settings** (smsEnabled field, quiet hours)
5. **Handles 9 notification types** (5 tasks + 4 appointments)
6. **Is production-ready** once templates are approved

The architecture follows the same patterns as the email system, making it easy to maintain and extend.

---

## 11. Next Steps

### Immediate Actions (Required for Production)

- [ ] **1. Wait for template approval** (24-48h)
  - Templates submitted to Twilio Content Template Builder
  - WhatsApp/Meta reviews and approves
  - Check status in Twilio Console

- [ ] **2. Update template SIDs**
  - Once approved, copy SIDs from Twilio Console
  - Update `src/types/whatsapp-templates.ts`:
    ```typescript
    export const WHATSAPP_TEMPLATE_SIDS = {
      task_assigned: "HXxxxxxxxxxxxxxxxxxxxxx",  // Real SID
      task_completed: "HXxxxxxxxxxxxxxxxxxxxxx",
      // ... etc
    }
    ```

- [ ] **3. Register WhatsApp Business number** (for production)
  - Go to Twilio Console → Messaging → WhatsApp Senders
  - Complete Meta Business Manager verification
  - Register your business phone number
  - Update `.env`: `TWILIO_WHATSAPP_NUMBER=+34XXXXXXXXX`

- [ ] **4. Enable WhatsApp in notification settings**
  - Go to Admin → Configuración de notificaciones
  - Toggle "SMS/WhatsApp" for desired notification types
  - Test with a real notification

- [ ] **5. Add user phone numbers**
  - Ensure team members have phone numbers in their profiles
  - Phone format: `636036116` (will be normalized to `+34636036116`)

### Optional Enhancements (Future)

- [ ] **UI: Rename "SMS" to "WhatsApp"**
  - Update labels in `src/components/admin/account/mail-configuration/`
  - More accurate representation of the channel

- [ ] **Delivery status tracking**
  - Implement Twilio webhooks for delivery receipts
  - Track: queued → sent → delivered → read
  - Show status in notification history

- [ ] **Customer-facing WhatsApp** (requires GDPR consent)
  - Extend to customer appointment reminders
  - Add opt-in toggle in contact preferences
  - Create customer-specific templates

- [ ] **Two-way messaging**
  - Receive WhatsApp replies via Twilio webhooks
  - Create inbox for WhatsApp conversations
  - Link replies to contacts/listings

- [ ] **Rate limiting & queuing**
  - Implement message queue for high volume
  - Respect Twilio rate limits
  - Retry failed messages with exponential backoff

### Files to Monitor

| File | What to Update |
|------|----------------|
| `src/types/whatsapp-templates.ts` | Template SIDs after approval |
| `.env` | `TWILIO_WHATSAPP_NUMBER` for production |
| Twilio Console | Template status, message logs |

---

## 12. Troubleshooting

### Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| "Template not approved" | Using placeholder SID | Wait for approval, update SID |
| "Recipient not opted in" | Phone hasn't joined sandbox | Send `join <keyword>` to sandbox number |
| "Invalid phone format" | Phone missing country code | Ensure phone is normalized (+34...) |
| "WhatsApp not configured" | Missing env var | Add `TWILIO_WHATSAPP_NUMBER` to `.env` |
| Message not received | smsEnabled = false | Enable in notification settings |

### Debug Logging

Check server logs for:
```
[WhatsApp] Sending notification 123 (task_assigned) to +34636036116
[WhatsApp] Message sent successfully: SM...
```

Or skip reasons:
```
[WhatsApp] Skipping notification 123 (task_assigned): WhatsApp disabled in settings
```
