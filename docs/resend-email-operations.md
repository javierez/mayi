# Resend Email Operations Reference

This document lists all email operations available with Resend and their corresponding templates, to help identify where to perform tests.

## Email Operations Table

| # | Email Operation | Service/File | Template File | Notification Type | Category | Recipient |
|---|-----------------|--------------|---------------|-------------------|----------|-----------|
| **INTERNAL NOTIFICATIONS** |
| 1 | Task Assigned | `email-notification-service.ts` | `task-notification.tsx` | `task_assigned` | `tasks` | Internal User |
| 2 | Task Completed | `email-notification-service.ts` | `task-notification.tsx` | `task_completed` | `tasks` | Internal User |
| 3 | Task Reassigned | `email-notification-service.ts` | `task-notification.tsx` | `task_reassigned` | `tasks` | Internal User |
| 4 | Task Overdue | `email-notification-service.ts` | `task-notification.tsx` | `task_overdue` | `tasks` | Internal User |
| 5 | Task Due Soon | `email-notification-service.ts` | `task-reminder.tsx` | `task_due_soon` | `tasks` | Internal User |
| 6 | Appointment Scheduled | `email-notification-service.ts` | `appointment-notification.tsx` | `appointment_scheduled` | `appointments` | Internal User |
| 7 | Appointment Rescheduled | `email-notification-service.ts` | `appointment-notification.tsx` | `appointment_rescheduled` | `appointments` | Internal User |
| 8 | Appointment Cancelled | `email-notification-service.ts` | `appointment-notification.tsx` | `appointment_cancelled` | `appointments` | Internal User |
| 9 | Appointment Reminder | `email-notification-service.ts` | `appointment-reminder.tsx` | `appointment_reminder` | `appointments` | Internal User |
| **CUSTOMER EMAILS** |
| 10 | Customer Property - New Listing | `customer-email-service.ts` | `customer-property-notification.tsx` | `new_listing` | `properties` | Customer Contact |
| 11 | Customer Property - Price Change | `customer-email-service.ts` | `customer-property-notification.tsx` | `price_change` | `properties` | Customer Contact |
| 12 | Customer Property - Status Change | `customer-email-service.ts` | `customer-property-notification.tsx` | `status_change` | `properties` | Customer Contact |
| 13 | Customer Property - New Photos | `customer-email-service.ts` | `customer-property-notification.tsx` | `new_photos` | `properties` | Customer Contact |
| 14 | Customer Document - Ready | `customer-email-service.ts` | `customer-document-notification.tsx` | `document_ready` | `documents` | Customer Contact |
| 15 | Customer Document - Signature Required | `customer-email-service.ts` | `customer-document-notification.tsx` | `signature_required` | `documents` | Customer Contact |
| 16 | Customer Document - Expiring | `customer-email-service.ts` | `customer-document-notification.tsx` | `document_expiring` | `documents` | Customer Contact |
| 17 | Customer Deal - Offer Received | `customer-email-service.ts` | `customer-deal-notification.tsx` | `offer_received` | `deals` | Customer Contact |
| 18 | Customer Deal - Offer Accepted | `customer-email-service.ts` | `customer-deal-notification.tsx` | `offer_accepted` | `deals` | Customer Contact |
| 19 | Customer Deal - Deal Closed | `customer-email-service.ts` | `customer-deal-notification.tsx` | `deal_closed` | `deals` | Customer Contact |
| 20 | Customer Deal - Payment Received | `customer-email-service.ts` | `customer-deal-notification.tsx` | `payment_received` | `deals` | Customer Contact |
| 21 | Customer Appointment Reminder | `customer-email-service.ts` | `customer-appointment-reminder.tsx` | `appointment_reminder` (customer) | `appointments` | Customer Contact |
| **DIGEST & BRIEFING EMAILS** |
| 22 | Task Digest - Weekly | `task-digest-email-service.ts` | `task-digest-notification.tsx` | `task_overdue_digest_weekly` | `tasks` | Internal User |
| 23 | Task Digest - Daily | `task-digest-email-service.ts` | `task-digest-notification.tsx` | `task_overdue_digest_daily` | `tasks` | Internal User |
| 24 | Weekly Briefing | `briefing-email-service.ts` | `weekly-briefing.tsx` | N/A (briefing) | N/A | Internal User |
| 25 | Daily Briefing | `briefing-email-service.ts` | `daily-briefing.tsx` | N/A (briefing) | N/A | Internal User |
| **OTHER EMAILS** |
| 26 | Share Listing | `share-listing.ts` | Inline template | N/A | N/A | Customer Contact |
| 27 | Password Reset | `email.ts` | `generatePasswordResetEmail()` | N/A | N/A | User (⚠️ Note: Currently uses SMS, email may not be active) |

## Template Files Location

All email templates are located in: `src/templates/emails/`

### Template Files:
- `task-notification.tsx` - Task events (assigned, completed, reassigned, overdue)
- `task-reminder.tsx` - Task due soon reminders
- `appointment-notification.tsx` - Appointment events (scheduled, rescheduled, cancelled)
- `appointment-reminder.tsx` - Appointment reminders for internal users
- `customer-appointment-reminder.tsx` - Appointment reminders for customers
- `customer-property-notification.tsx` - Customer property notifications
- `customer-document-notification.tsx` - Customer document notifications
- `customer-deal-notification.tsx` - Customer deal notifications
- `task-digest-notification.tsx` - Task digest emails (weekly/daily)
- `weekly-briefing.tsx` - Weekly briefing emails
- `daily-briefing.tsx` - Daily briefing emails
- `notification-base.tsx` - Base template for notifications (fallback)

## Service Files

### Main Email Services:
- `src/lib/email.ts` - Core `sendEmail()` function (wraps Resend API)
- `src/server/services/email-notification-service.ts` - Internal notification emails
- `src/server/services/customer-email-service.ts` - Customer-facing emails
- `src/server/services/task-digest-email-service.ts` - Task digest emails
- `src/server/services/briefing-email-service.ts` - Briefing emails
- `src/server/services/email-template-router.ts` - Routes notifications to templates
- `src/server/queries/share-listing.ts` - Share listing email

## Testing Locations

### Where to Test Each Email Type:

1. **Internal Task Notifications (1-5)**
   - Trigger: Create/update/complete tasks in the app
   - Test via: Task management UI or API
   - Check: `src/server/services/notification-service.ts` for notification triggers

2. **Internal Appointment Notifications (6-9)**
   - Trigger: Create/update/cancel appointments in the app
   - Test via: Calendar UI or API
   - Check: `src/server/services/notification-service.ts` for notification triggers

3. **Customer Property Notifications (10-13)**
   - Trigger: Property changes (new listing, price change, status change, new photos)
   - Test via: Property management UI
   - Service: `src/server/services/customer-email-service.ts::sendCustomerPropertyNotification()`

4. **Customer Document Notifications (14-16)**
   - Trigger: Document events (ready, signature required, expiring)
   - Test via: Document management UI
   - Service: `src/server/services/customer-email-service.ts::sendCustomerDocumentNotification()`

5. **Customer Deal Notifications (17-20)**
   - Trigger: Deal events (offer received, accepted, closed, payment received)
   - Test via: Deal management UI
   - Service: `src/server/services/customer-email-service.ts::sendCustomerDealNotification()`

6. **Customer Appointment Reminders (21)**
   - Trigger: Cron job for appointment reminders
   - Test via: `src/app/api/cron/notifications/route.ts`
   - Service: `src/server/services/customer-email-service.ts::sendCustomerAppointmentReminder()`

7. **Task Digest Emails (22-23)**
   - Trigger: Cron job (Monday 9 AM UTC for weekly, daily 9 AM UTC for daily)
   - Test via: `src/app/api/cron/notifications/route.ts`
   - Service: `src/server/services/task-digest-email-service.ts::sendTaskDigestEmail()`

8. **Briefing Emails (24-25)**
   - Trigger: Cron job for weekly/daily briefings
   - Test via: `src/app/api/cron/notifications/route.ts`
   - Service: `src/server/services/briefing-email-service.ts::sendBriefingEmail()`

9. **Share Listing (26)**
   - Trigger: User shares a listing via email
   - Test via: Property detail page "Share" functionality
   - Service: `src/server/queries/share-listing.ts::shareListingViaEmailWithAuth()`

10. **Password Reset (27)**
    - ⚠️ **Note**: Currently uses SMS-based reset. Email template exists but may not be actively used.
    - Template: `src/lib/email.ts::generatePasswordResetEmail()`

## Email Configuration

All emails are sent through the `sendEmail()` function in `src/lib/email.ts`, which:
- Uses Resend API (`resend.emails.send()`)
- Requires `RESEND_API_KEY` environment variable
- Uses `RESEND_FROM_EMAIL` for sender address (defaults to `"Vesta CRM <noreply@mail.vesta-crm.com>"`)
- Supports custom `fromName` and `replyTo` for customer emails

## Email Settings

Email sending is controlled by `MailSettings` configuration:
- Internal notifications: Checked via `shouldSendEmailForNotification()` in `email-config-helpers.ts`
- Customer notifications: Checked via `isCustomerNotificationEnabled()` in `customer-email-service.ts`
- Quiet hours: Applied to internal notifications (can be bypassed for urgent notifications)
- Priority-based sending: High/urgent priority notifications always send emails

## Cron Jobs

Many emails are triggered by cron jobs:
- Location: `src/app/api/cron/notifications/route.ts`
- Scheduled: Via Vercel Cron or similar
- Handles: Overdue task notifications, appointment reminders, digest emails, briefing emails

