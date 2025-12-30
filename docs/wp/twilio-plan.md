# WhatsApp Internal Notifications Implementation Plan

## Overview

Add WhatsApp as a new notification channel for **internal team communications** (task and appointment notifications to users), mirroring the existing email notification architecture.

## Scope

**In Scope (Internal):**
- Task notifications: assigned, completed, reassigned, due soon, overdue
- Appointment notifications: scheduled, rescheduled, cancelled, reminders

**Out of Scope (Future):**
- Customer/external notifications
- SMS implementation (separate effort)

---

## WhatsApp Message Types (Important!)

### 1. Business-Initiated Messages (Outside 24h Window)
- **Requires pre-approved templates** (Content Templates)
- Used when: Sending notification without prior user contact
- Must use `contentSid` parameter with approved template

### 2. Freeform Messages (Within 24h Customer Service Window)
- **No templates required** - can send any text/media
- Used when: **User has messaged us within last 24 hours**
- Simpler implementation with just `body` parameter
- Window resets with each user message

### Our Approach Options

#### Option A: Templates Only (Recommended for reliability)
- Always use Content Templates
- Works anytime, no user action required
- More setup (template approval) but guaranteed delivery
- Professional, consistent messages

#### Option B: Freeform with Session Activation (Simpler messages)
- Ask team members to message your WhatsApp number to "activate"
- Track last message time per user
- Use freeform within 24h window, fallback to templates
- Requires user action but simpler message content

#### Option C: Hybrid (Best of both)
- Use templates for first contact / expired sessions
- Use freeform when user has active 24h window
- Track `lastWhatsAppMessageAt` per user
- Most flexible but more complex

**For internal team notifications**, Option A (Templates) is recommended because:
- Reliability: Works regardless of user activity
- No user action required to receive notifications
- Professional appearance with consistent formatting

---

## WhatsApp Opt-In Requirement

> ⚠️ **Critical**: WhatsApp requires explicit user opt-in before sending messages.

**Legal opt-in**: Handled via employment contract (user confirmed)

**Technical implementation** (still needed):
1. Add `whatsappOptIn: boolean` field to user preferences (default: `true` for internal users)
2. Check opt-in before sending
3. Provide opt-out toggle in user settings
4. Log opt-in/opt-out for compliance

---

## Architecture

```
Notification Service
       ↓
       ├── sendNotificationEmailIfNeeded()     [existing]
       └── sendNotificationWhatsAppIfNeeded()  [NEW]
                    ↓
           WhatsApp Notification Service
                    ↓
           ├── Check user has opted in (whatsappOptIn)
           ├── Check settings (whatsappEnabled)
           ├── Check quiet hours
           ├── Get user phone number
           └── Route to template
                    ↓
           Twilio API (Content Templates)
           Format: whatsapp:+34XXXXXXXXX
```

---

## Files to Create

### 1. Core WhatsApp Sender
**`src/lib/whatsapp.ts`**
- Reuse existing Twilio client from `src/server/services/twilio.ts`
- `sendWhatsAppMessage(to, contentSid, contentVariables)` function
- `sendWhatsAppFreeform(to, body, mediaUrl?)` function (for 24h window)
- Phone number normalization for WhatsApp format (`whatsapp:+34...`)
- Development mode logging (like email service)
- Status callback support for delivery tracking

**API Format (from Twilio docs):**
```typescript
// Templated message (business-initiated)
await twilioClient.messages.create({
  from: "whatsapp:+14155238886",
  to: "whatsapp:+34612345678",
  contentSid: "HXxxxxxxxxxxxxxxxxx",
  contentVariables: JSON.stringify({ "1": "Task Title", "2": "Due Date" }),
});

// Freeform message (within 24h window)
await twilioClient.messages.create({
  from: "whatsapp:+14155238886",
  to: "whatsapp:+34612345678",
  body: "Your message here",
});
```

### 2. WhatsApp Notification Service
**`src/server/services/whatsapp-notification-service.ts`**
- `sendNotificationWhatsAppIfNeeded(notification, accountId)` - main entry point
- Check if user has opted in (`whatsappOptIn`)
- Check if user has phone number
- Check if WhatsApp enabled in settings (`whatsappEnabled`)
- Check quiet hours (reuse from email)
- Update delivery status in notifications table
- Handle status callback for delivery confirmation

### 3. WhatsApp Config Helpers
**`src/server/services/whatsapp-config-helpers.ts`**
- `shouldSendWhatsAppForNotification(notification, settings)` - check whatsappEnabled flag
- Reuse `isQuietHours()` from email helpers

### 4. WhatsApp Template Router
**`src/server/services/whatsapp-template-router.ts`**
- Map notification types to Twilio Content Template SIDs
- Extract template variables from notification metadata
- Configuration object for template SIDs

---

## Files to Modify

### 1. Environment Variables
**`src/env.js`**
```typescript
// Add to server schema:
TWILIO_WHATSAPP_NUMBER: z.string().optional(),  // WhatsApp Business number
```

### 2. Notification Settings Types
**`src/components/admin/account/mail-configuration/types.ts`**
```typescript
// Add to NotificationOption and CustomerNotificationOption:
whatsappEnabled: boolean;
```

### 3. Default Settings
**`src/components/admin/account/mail-configuration/constants.ts`**
- Add `whatsappEnabled: false` to all factory functions

### 4. Notification Types
**`src/types/notifications.ts`**
```typescript
// Add 'whatsapp' to DeliveryChannel:
export type DeliveryChannel = "in_app" | "email" | "push" | "sms" | "whatsapp";
```

### 5. Notification Service Integration
**`src/server/services/notification-service.ts`**
- Import `sendNotificationWhatsAppIfNeeded`
- Add WhatsApp call after each notification creation (parallel to email)

### 6. UI Components (Add WhatsApp Toggle)
- `notification-option-row.tsx` - Add WhatsApp switch
- `mail-configuration.tsx` - Add WhatsApp toggle handlers
- All section components that render notification options

---

## WhatsApp Template Configuration

User must provide Twilio Content Template SIDs for each notification type:

| Notification Type | Template Name (suggested) | Variables |
|------------------|---------------------------|-----------|
| `task_assigned` | `vesta_task_assigned_es` | task title, assigner, due date |
| `task_completed` | `vesta_task_completed_es` | task title, completer |
| `task_reassigned` | `vesta_task_reassigned_es` | task title, reassigner |
| `task_due_soon` | `vesta_task_due_soon_es` | task title, time remaining |
| `task_overdue` | `vesta_task_overdue_es` | task title, overdue duration |
| `appointment_scheduled` | `vesta_apt_scheduled_es` | title, datetime, scheduler |
| `appointment_rescheduled` | `vesta_apt_rescheduled_es` | title, new datetime, old datetime |
| `appointment_cancelled` | `vesta_apt_cancelled_es` | title, canceller |
| `appointment_reminder` | `vesta_apt_reminder_es` | title, datetime, time until |

---

## Implementation Order

### Phase 1: Foundation
1. Update `types.ts` - Add `whatsappEnabled` to interfaces
2. Update `constants.ts` - Add `whatsappEnabled: false` defaults
3. Update `env.js` - Add `TWILIO_WHATSAPP_NUMBER`
4. Update `notifications.ts` - Add 'whatsapp' to DeliveryChannel
5. Add `whatsappOptIn` to user preferences (database + types)

### Phase 2: Core Services
6. Create `src/lib/whatsapp.ts` - Core sending function
7. Create `whatsapp-config-helpers.ts` - Settings checks
8. Create `whatsapp-template-router.ts` - Template routing
9. Create `whatsapp-notification-service.ts` - Main orchestration

### Phase 3: Integration
10. Modify `notification-service.ts` - Add WhatsApp calls to all notification functions
11. Add status callback API route for delivery tracking (optional)

### Phase 4: UI
12. Update `notification-option-row.tsx` - Add WhatsApp toggle
13. Update section components with WhatsApp prop
14. Update `mail-configuration.tsx` - Add handlers
15. Add WhatsApp opt-in toggle in user profile settings

---

## Status Callbacks (Delivery Tracking)

Twilio can notify us when message status changes via webhook:

```typescript
// When sending, include statusCallback URL
await twilioClient.messages.create({
  from: "whatsapp:+14155238886",
  to: "whatsapp:+34612345678",
  contentSid: "HXxxxxxxxxxxxxxxxxx",
  contentVariables: JSON.stringify({ "1": "value" }),
  statusCallback: "https://your-domain.com/api/webhooks/whatsapp/status",
});
```

**Status values**: `queued` → `sent` → `delivered` / `read` / `failed`

**Optional**: Create `/api/webhooks/whatsapp/status/route.ts` to update notification delivery status in real-time.

---

## User Opt-In Implementation

### Database Schema Addition
```sql
-- Add to users table or user_preferences
whatsapp_opt_in BOOLEAN DEFAULT false
whatsapp_opt_in_at TIMESTAMP
```

### User Profile UI
Add toggle in user settings:
- "Recibir notificaciones por WhatsApp"
- Show phone number requirement
- Link to WhatsApp privacy policy

---

## Template SIDs Required

Template SIDs to configure in `whatsapp-template-router.ts`:

```typescript
const WHATSAPP_TEMPLATES = {
  task_assigned: "HX_______________________",
  task_completed: "HX_______________________",
  task_reassigned: "HX_______________________",
  task_due_soon: "HX_______________________",
  task_overdue: "HX_______________________",
  appointment_scheduled: "HX_______________________",
  appointment_rescheduled: "HX_______________________",
  appointment_cancelled: "HX_______________________",
  appointment_reminder: "HX_______________________",
};
```

---

## Technical Notes

1. **Phone Number Format**: WhatsApp requires `whatsapp:+34XXXXXXXXX` format
2. **User Phone Requirement**: Users need phone in profile for WhatsApp
3. **Quiet Hours**: Reuse existing quiet hours logic from email
4. **Delivery Tracking**: Use existing notifications table fields (`deliveryChannel`, `isDelivered`, `deliveryError`)
5. **No new dependencies**: Uses existing Twilio SDK

---

## Estimated Effort

- Phase 1 (Foundation): ~30 min
- Phase 2 (Core Services): ~2 hours
- Phase 3 (Integration): ~1 hour
- Phase 4 (UI): ~1.5 hours

**Total: ~5 hours**
