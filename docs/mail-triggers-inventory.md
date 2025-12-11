# Mail Triggers Inventory

This document lists all mail triggers that are established and based on the properties defined in `src/components/admin/account/mail-configuration.tsx`.

## Overview

All mail triggers are controlled by the `MailSettings` configuration, which is stored per account and can be configured through the admin UI at `/account-admin/notification-system`.

---

## INTERNAL NOTIFICATIONS (Internas)

### 📋 TASK NOTIFICATIONS

#### Task Events
These are immediate notifications triggered by task lifecycle events:

1. **Task Assigned** (`task_assigned`)
   - **Setting**: `settings.tasks.events.taskAssigned.emailEnabled`
   - **Triggered by**: When a task is assigned to a user
   - **Service**: `sendNotificationEmailIfNeeded()` via `notification-service.ts`
   - **File**: `src/server/services/email-config-helpers.ts:77-78`

2. **Task Completed** (`task_completed`)
   - **Setting**: `settings.tasks.events.taskCompleted.emailEnabled`
   - **Triggered by**: When a task is marked as completed
   - **Service**: `sendNotificationEmailIfNeeded()` via `notification-service.ts`
   - **File**: `src/server/services/email-config-helpers.ts:80-81`

3. **Task Reassigned** (`task_reassigned`)
   - **Setting**: `settings.tasks.events.taskReassigned.emailEnabled`
   - **Triggered by**: When a task is reassigned from one user to another
   - **Service**: `sendNotificationEmailIfNeeded()` via `notification-service.ts`
   - **File**: `src/server/services/email-config-helpers.ts:83-84`

#### Task Reminders (Due Soon)
These are scheduled reminders sent before a task's due date:

4. **Task Due in 1 Week** (`task_due_soon` with `timeframe: "1_week"`)
   - **Setting**: `settings.tasks[category].dueIn1Week.emailEnabled`
   - **Category**: Based on urgency (critical/urgent/other)
   - **Triggered by**: Cron job (`/api/cron/notifications`) when task is due in 1 week
   - **Service**: `sendNotificationEmailIfNeeded()` via `notifyTaskDueSoon()`
   - **File**: `src/server/services/email-config-helpers.ts:119-120`

5. **Task Due in 48 Hours** (`task_due_soon` with `timeframe: "48h"`)
   - **Setting**: `settings.tasks[category].dueIn48h.emailEnabled`
   - **Category**: Based on urgency (critical/urgent/other)
   - **Triggered by**: Cron job (`/api/cron/notifications`) when task is due in 48 hours
   - **Service**: `sendNotificationEmailIfNeeded()` via `notifyTaskDueSoon()`
   - **File**: `src/server/services/email-config-helpers.ts:122-123`

6. **Task Due in 24 Hours** (`task_due_soon` with `timeframe: "24h"`)
   - **Setting**: `settings.tasks[category].dueIn24h.emailEnabled`
   - **Category**: Based on urgency (critical/urgent/other)
   - **Triggered by**: Cron job (`/api/cron/notifications`) when task is due in 24 hours
   - **Service**: `sendNotificationEmailIfNeeded()` via `notifyTaskDueSoon()`
   - **File**: `src/server/services/email-config-helpers.ts:125-126`

7. **Task Due in 12 Hours** (`task_due_soon` with `timeframe: "12h"`)
   - **Setting**: `settings.tasks[category].dueIn12h.emailEnabled`
   - **Category**: Based on urgency (critical/urgent/other)
   - **Triggered by**: Cron job (`/api/cron/notifications`) when task is due in 12 hours
   - **Service**: `sendNotificationEmailIfNeeded()` via `notifyTaskDueSoon()`
   - **File**: `src/server/services/email-config-helpers.ts:128-129`

8. **Task Due in 2 Hours** (`task_due_soon` with `timeframe: "2h"`)
   - **Setting**: `settings.tasks[category].dueIn2h.emailEnabled`
   - **Category**: Based on urgency (critical/urgent/other)
   - **Triggered by**: Cron job (`/api/cron/notifications`) when task is due in 2 hours
   - **Service**: `sendNotificationEmailIfNeeded()` via `notifyTaskDueSoon()`
   - **File**: `src/server/services/email-config-helpers.ts:131-132`

9. **Task Due in 1 Hour** (`task_due_soon` with `timeframe: "1h"`)
   - **Setting**: `settings.tasks[category].dueIn1h.emailEnabled`
   - **Category**: Based on urgency (critical/urgent/other)
   - **Triggered by**: Cron job (`/api/cron/notifications`) when task is due in 1 hour
   - **Service**: `sendNotificationEmailIfNeeded()` via `notifyTaskDueSoon()`
   - **File**: `src/server/services/email-config-helpers.ts:134-135`

**Note**: Task reminders are categorized by urgency:
- **Critical**: Urgency = 5
- **Urgent**: Urgency = 3, 4
- **Other**: Urgency = 1, 2

#### Task Overdue Notifications

10. **Critical Task Overdue - Immediate** (`task_overdue` with `urgency: 5`)
    - **Setting**: `settings.tasks.overdue.notifyWhenOverdue.emailEnabled`
    - **Triggered by**: Cron job (`/api/cron/notifications`) when a critical task (urgency 5) becomes overdue (within 15 minutes)
    - **Service**: `sendNotificationEmailIfNeeded()` via `notifyTaskOverdue()`
    - **File**: `src/server/services/email-config-helpers.ts:88-94`
    - **Note**: Bypasses quiet hours

11. **Task Overdue - Weekly Digest** (`task_overdue_digest_weekly`)
    - **Setting**: `settings.tasks.overdue.weeklyDigest.emailEnabled`
    - **Triggered by**: Cron job (`/api/cron/notifications`) on Mondays at 9:00 AM UTC for all overdue tasks with urgency < 5
    - **Service**: `sendTaskDigestEmail()` with `digestType: "weekly"`
    - **File**: `src/server/services/task-digest-email-service.ts:78-154`
    - **Note**: ⚠️ Currently does NOT check the setting before sending (should be fixed)

12. **Task Overdue - Daily Digest** (`task_overdue_digest_daily`)
    - **Setting**: `settings.tasks.overdue.dailyDigest.emailEnabled`
    - **Triggered by**: Cron job (`/api/cron/notifications`) daily at 9:00 AM UTC for all overdue tasks with urgency = 5
    - **Service**: `sendTaskDigestEmail()` with `digestType: "daily"`
    - **File**: `src/server/services/task-digest-email-service.ts:78-154`
    - **Note**: ⚠️ Currently does NOT check the setting before sending (should be fixed)

#### Task Briefing Emails

13. **Weekly Task Briefing** (`weeklyBriefing`)
    - **Setting**: `settings.tasks[category].weeklyBriefing.emailEnabled`
    - **Category**: Based on urgency (critical/urgent/other)
    - **Triggered by**: Cron job (`/api/cron/briefings`) on Mondays at 9:00 AM UTC
    - **Service**: `sendBriefingEmail()` with `briefingType: "weekly"`
    - **File**: `src/server/services/briefing-email-service.ts:168-273`
    - **Helper**: `isBriefingEnabled()` checks if any category has briefing enabled

14. **Daily Task Briefing** (`dailyBriefing`)
    - **Setting**: `settings.tasks[category].dailyBriefing.emailEnabled`
    - **Category**: Based on urgency (critical/urgent/other)
    - **Triggered by**: Cron job (`/api/cron/briefings`) daily at 9:00 AM UTC
    - **Service**: `sendBriefingEmail()` with `briefingType: "daily"`
    - **File**: `src/server/services/briefing-email-service.ts:168-273`
    - **Helper**: `isBriefingEnabled()` checks if any category has briefing enabled

---

### 📅 APPOINTMENT NOTIFICATIONS

#### Appointment Events
These are immediate notifications triggered by appointment lifecycle events:

15. **Appointment Scheduled** (`appointment_scheduled`)
    - **Setting**: `settings.appointments.events.appointmentScheduled.emailEnabled`
    - **Triggered by**: When an appointment is scheduled for a user
    - **Service**: `sendNotificationEmailIfNeeded()` via `notification-service.ts`
    - **File**: `src/server/services/email-config-helpers.ts:145-146`

16. **Appointment Rescheduled** (`appointment_rescheduled`)
    - **Setting**: `settings.appointments.events.appointmentRescheduled.emailEnabled`
    - **Triggered by**: When an appointment is rescheduled
    - **Service**: `sendNotificationEmailIfNeeded()` via `notification-service.ts`
    - **File**: `src/server/services/email-config-helpers.ts:148-149`

17. **Appointment Cancelled** (`appointment_cancelled`)
    - **Setting**: `settings.appointments.events.appointmentCancelled.emailEnabled`
    - **Triggered by**: When an appointment is cancelled
    - **Service**: `sendNotificationEmailIfNeeded()` via `notification-service.ts`
    - **File**: `src/server/services/email-config-helpers.ts:151-152`

#### Appointment Reminders
These are scheduled reminders sent before an appointment:

18-23. **Appointment Reminders by Type and Timeframe**
    - **Settings**: `settings.appointments[type].notify[timeframe].emailEnabled`
    - **Appointment Types**: visita, firma, reunion, llamada, cierre, viaje
    - **Timeframes**: 24h, 12h, 1h, 30min, travelTime
    - **Triggered by**: Cron job (`/api/cron/notifications`) every 15 minutes
    - **Service**: `sendNotificationEmailIfNeeded()` via `notifyAppointmentReminder()`
    - **File**: `src/server/services/email-config-helpers.ts:156-188`
    - **Mapping**:
      - `reminderType: "24h"` → `notify24h.emailEnabled`
      - `reminderType: "12h"` → `notify12h.emailEnabled`
      - `reminderType: "1h"` → `notify1h.emailEnabled`
      - `reminderType: "30min"` → `notify30min.emailEnabled`
      - `reminderType: "travel_time"` → `notifyTravelTime.emailEnabled`

#### Appointment Briefing Emails

24-29. **Weekly Appointment Briefing** (`weeklyBriefing`)
    - **Setting**: `settings.appointments[type].weeklyBriefing.emailEnabled`
    - **Appointment Types**: visita, firma, reunion, llamada, cierre, viaje
    - **Triggered by**: Cron job (`/api/cron/briefings`) on Mondays at 9:00 AM UTC
    - **Service**: `sendBriefingEmail()` with `briefingType: "weekly"`
    - **File**: `src/server/services/briefing-email-service.ts:168-273`
    - **Helper**: `isBriefingEnabled()` checks if any appointment type has briefing enabled

30-35. **Daily Appointment Briefing** (`dailyBriefing`)
    - **Setting**: `settings.appointments[type].dailyBriefing.emailEnabled`
    - **Appointment Types**: visita, firma, reunion, llamada, cierre, viaje
    - **Triggered by**: Cron job (`/api/cron/briefings`) daily at 9:00 AM UTC
    - **Service**: `sendBriefingEmail()` with `briefingType: "daily"`
    - **File**: `src/server/services/briefing-email-service.ts:168-273`
    - **Helper**: `isBriefingEnabled()` checks if any appointment type has briefing enabled

---

## CUSTOMER NOTIFICATIONS (Clientes)

### 🏠 PROPERTY NOTIFICATIONS

36. **New Listing** (`new_listing`)
    - **Setting**: `settings.customers.properties.newListing.emailEnabled`
    - **Triggered by**: When a new property is published that matches customer interests
    - **Service**: `sendCustomerPropertyNotification()`
    - **File**: `src/server/services/customer-email-service.ts:91-122`

37. **Price Change** (`price_change`)
    - **Setting**: `settings.customers.properties.priceChange.emailEnabled`
    - **Triggered by**: When the price of a property changes
    - **Service**: `sendCustomerPropertyNotification()`
    - **File**: `src/server/services/customer-email-service.ts:91-122`

38. **Status Change** (`status_change`)
    - **Setting**: `settings.customers.properties.statusChange.emailEnabled`
    - **Triggered by**: When a property's status changes (sold, rented, etc.)
    - **Service**: `sendCustomerPropertyNotification()`
    - **File**: `src/server/services/customer-email-service.ts:91-122`

39. **New Photos** (`new_photos`)
    - **Setting**: `settings.customers.properties.newPhotos.emailEnabled`
    - **Triggered by**: When new photos are added to a property
    - **Service**: `sendCustomerPropertyNotification()`
    - **File**: `src/server/services/customer-email-service.ts:91-122`

---

### 📄 DOCUMENT NOTIFICATIONS

40. **Document Ready** (`document_ready`)
    - **Setting**: `settings.customers.documents.documentReady.emailEnabled`
    - **Triggered by**: When a document is ready for customer review
    - **Service**: `sendCustomerDocumentNotification()`
    - **File**: `src/server/services/customer-email-service.ts:127-158`

41. **Signature Required** (`signature_required`)
    - **Setting**: `settings.customers.documents.signatureRequired.emailEnabled`
    - **Triggered by**: When a document requires customer signature
    - **Service**: `sendCustomerDocumentNotification()`
    - **File**: `src/server/services/customer-email-service.ts:127-158`

42. **Document Expiring** (`document_expiring`)
    - **Setting**: `settings.customers.documents.documentExpiring.emailEnabled`
    - **Triggered by**: When a document is approaching its expiration date
    - **Service**: `sendCustomerDocumentNotification()`
    - **File**: `src/server/services/customer-email-service.ts:127-158`

---

### 💼 DEAL NOTIFICATIONS

43. **Offer Received** (`offer_received`)
    - **Setting**: `settings.customers.deals.offerReceived.emailEnabled`
    - **Triggered by**: When an offer is received on a deal
    - **Service**: `sendCustomerDealNotification()`
    - **File**: `src/server/services/customer-email-service.ts:163-194`

44. **Offer Accepted** (`offer_accepted`)
    - **Setting**: `settings.customers.deals.offerAccepted.emailEnabled`
    - **Triggered by**: When an offer is accepted
    - **Service**: `sendCustomerDealNotification()`
    - **File**: `src/server/services/customer-email-service.ts:163-194`

45. **Deal Closed** (`deal_closed`)
    - **Setting**: `settings.customers.deals.dealClosed.emailEnabled`
    - **Triggered by**: When a deal is closed
    - **Service**: `sendCustomerDealNotification()`
    - **File**: `src/server/services/customer-email-service.ts:163-194`

46. **Payment Received** (`payment_received`)
    - **Setting**: `settings.customers.deals.paymentReceived.emailEnabled`
    - **Triggered by**: When a payment is received related to a deal
    - **Service**: `sendCustomerDealNotification()`
    - **File**: `src/server/services/customer-email-service.ts:163-194`

---

### 📅 CUSTOMER APPOINTMENT REMINDERS

47-52. **Customer Appointment Reminders by Type and Timeframe**
    - **Settings**: `settings.customers.appointments[type].notify[timeframe].emailEnabled`
    - **Appointment Types**: visita, firma, reunion, llamada, cierre, viaje
    - **Timeframes**: 24h, 12h, 1h, 30min, travelTime
    - **Triggered by**: When an appointment reminder should be sent to the customer
    - **Service**: `sendCustomerAppointmentReminder()`
    - **File**: `src/server/services/customer-email-service.ts:199-231`
    - **Helper**: `isCustomerNotificationEnabled()` checks settings

---

## GLOBAL SETTINGS

### 🔕 QUIET HOURS

All email notifications (except critical overdue tasks) respect quiet hours:
- **Setting**: `settings.quietHours`
- **Function**: `isQuietHours()` in `src/server/services/email-config-helpers.ts:24-62`
- **Bypass**: Critical overdue tasks (urgency 5) bypass quiet hours via `shouldBypassQuietHours()`
- **Applied in**: `sendNotificationEmailIfNeeded()` checks quiet hours before sending

---

## IMPLEMENTATION NOTES

### Key Services

1. **Internal Notifications** (Tasks & Appointments):
   - Main service: `src/server/services/email-notification-service.ts`
   - Uses: `shouldSendEmailForNotification()` to check settings
   - Uses: `isQuietHours()` to respect quiet hours
   - Triggered automatically when notifications are created

2. **Customer Notifications**:
   - Main service: `src/server/services/customer-email-service.ts`
   - Uses: `isCustomerNotificationEnabled()` to check settings
   - Must be called explicitly from business logic

3. **Briefing Emails**:
   - Service: `src/server/services/briefing-email-service.ts`
   - Cron: `/api/cron/briefings`
   - Uses: `isBriefingEnabled()` to check settings

4. **Digest Emails**:
   - Service: `src/server/services/task-digest-email-service.ts`
   - Cron: `/api/cron/notifications`
   - ⚠️ **Issue**: Does NOT check settings before sending (should check `weeklyDigest.emailEnabled` and `dailyDigest.emailEnabled`)

### Cron Jobs

1. **`/api/cron/notifications`** (every 15 minutes):
   - Creates task reminders (`notifyTaskDueSoon`)
   - Creates overdue notifications (`notifyTaskOverdue`)
   - Creates appointment reminders (`notifyAppointmentReminder`)
   - Sends digest emails (`sendTaskDigestEmail`)

2. **`/api/cron/briefings`** (daily at 9:00 AM UTC):
   - Sends weekly briefings (Mondays)
   - Sends daily briefings (every day)

---

## SUMMARY

**Total Mail Triggers: 52+**

- **Internal Task Notifications**: 14 triggers
- **Internal Appointment Notifications**: 21 triggers
- **Customer Property Notifications**: 4 triggers
- **Customer Document Notifications**: 3 triggers
- **Customer Deal Notifications**: 4 triggers
- **Customer Appointment Reminders**: 6 triggers (by type)

All triggers are controlled by the `MailSettings` configuration and can be enabled/disabled per account through the admin UI.


