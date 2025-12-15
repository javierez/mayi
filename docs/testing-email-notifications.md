# Testing Email Notifications

This guide provides multiple ways to test the email notification system.

## Quick Test Methods

### Method 1: Test in Development Mode (Easiest)

**Development mode logs emails instead of sending them:**

1. **Don't set `RESEND_API_KEY`** in your `.env` (or remove it temporarily)
2. **Trigger a notification** (create overdue task, etc.)
3. **Check your console** - you'll see the email content logged:

```
📧 Email (Development Mode):
To: user@example.com
Subject: Tarea vencida: Task Title
Text: [email text content]
HTML: [email HTML content]
──────────────────────────────
```

**Pros**: Fast, no API calls, see exact email content
**Cons**: Doesn't test actual email delivery

### Method 2: Test with Real Email (Recommended)

**Send actual emails using Resend:**

1. **Set up environment variables**:
   ```bash
   RESEND_API_KEY=re_your_key_here
   RESEND_FROM_EMAIL="Vesta CRM <noreply@mail.vesta-crm.com>"
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. **Restart your dev server**

3. **Test scenarios** (see below)

4. **Check your email inbox** (and spam folder)

5. **Check Resend dashboard** → Logs to see delivery status

## Testing Scenarios

### Test 1: Overdue Task Digest (Weekly)

**Steps:**
1. Create several tasks with:
   - Due date: Yesterday (or any past date)
   - Urgency: 1, 2, 3, or 4 (NOT 5)
   - Assign to yourself
   - Mark as not completed

2. **Wait for cron job** OR manually trigger it:
   ```bash
   # If running locally, the cron won't run automatically
   # You can manually call the endpoint:
   curl -X GET http://localhost:3000/api/cron/notifications \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

3. **Check timing**:
   - Must be Monday 9 AM UTC or later
   - OR modify the code temporarily to skip time check

4. **Expected result**:
   - One email with all overdue tasks (urgency < 5)
   - Each task has full details and individual link

### Test 2: Critical Task Digest (Daily)

**Steps:**
1. Create several tasks with:
   - Due date: Yesterday (or any past date)
   - Urgency: 5 (Critical)
   - Assign to yourself
   - Mark as not completed

2. **Wait for cron job** OR manually trigger it

3. **Check timing**:
   - Must be 9 AM UTC or later
   - OR modify the code temporarily to skip time check

4. **Expected result**:
   - One email with all critical overdue tasks
   - Subject: "🚨 X tareas críticas vencidas"

### Test 3: Appointment Reminder

**Steps:**
1. Create an appointment:
   - Start time: 30 minutes from now (for 30_min reminder)
   - OR: Tomorrow (for 1_day reminder)
   - Assign to yourself

2. **Wait for cron job** (runs every 15 minutes)

3. **Expected result**:
   - Email notification for appointment reminder
   - Includes appointment details and link

### Test 4: High Priority Notification

**Steps:**
1. Create a task with:
   - High priority (or urgent)
   - Assign to another user (or yourself)
   - Complete some action that triggers notification

2. **Expected result**:
   - Email sent immediately (if priority is high/urgent)

## Manual Testing Script

Create a test file to manually trigger emails:

**File: `test-email.ts`** (in project root, temporary)

```typescript
import { sendEmail } from "./src/lib/email";

async function testEmail() {
  try {
    await sendEmail({
      to: "your-email@example.com",
      subject: "Test Email from Vesta CRM",
      html: "<h1>Test</h1><p>This is a test email.</p>",
      text: "Test\n\nThis is a test email.",
    });
    console.log("✅ Email sent successfully!");
  } catch (error) {
    console.error("❌ Failed to send email:", error);
  }
}

testEmail();
```

**Run it:**
```bash
npx tsx test-email.ts
```

## Testing Digest Timing

### Option A: Wait for Right Time

- **Daily**: Wait until 9 AM UTC
- **Weekly**: Wait until Monday 9 AM UTC

### Option B: Temporarily Modify Code

**Temporarily skip time check for testing:**

In `src/server/services/task-digest-email-service.ts`, modify `shouldSendDigest()`:

```typescript
async function shouldSendDigest(
  userId: string,
  digestType: "weekly" | "daily",
): Promise<boolean> {
  // TEMPORARY: Skip time check for testing
  // Remove this in production!
  if (process.env.NODE_ENV === "development") {
    // Check only if already sent, ignore time
    const now = new Date();
    const cutoffTime = digestType === "weekly" 
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(now);
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

**Remember to revert this before production!**

## Testing Checklist

### Setup
- [ ] `RESEND_API_KEY` set in `.env`
- [ ] `RESEND_FROM_EMAIL` set with verified domain
- [ ] `NEXT_PUBLIC_APP_URL` set
- [ ] Server restarted after env changes
- [ ] Domain verified in Resend dashboard

### Test Individual Emails
- [ ] Create overdue task → Check email sent
- [ ] Create appointment reminder → Check email sent
- [ ] Create high-priority notification → Check email sent

### Test Digest Emails
- [ ] Create multiple overdue tasks (urgency < 5) → Check weekly digest
- [ ] Create multiple critical tasks (urgency = 5) → Check daily digest
- [ ] Verify all tasks included in digest
- [ ] Verify individual task links work
- [ ] Verify "Ver todas las tareas" button works

### Verify Email Content
- [ ] Subject line correct
- [ ] All task details present
- [ ] Links work correctly
- [ ] Formatting looks good
- [ ] Spanish text correct

### Check Delivery
- [ ] Email arrives in inbox (not spam)
- [ ] Resend dashboard shows "Delivered"
- [ ] Database shows `isDelivered = true`
- [ ] No errors in console

## Debugging

### Email Not Sending

1. **Check console logs**:
   - Look for `✅ Email sent successfully`
   - Or `❌ Failed to send email`

2. **Check Resend dashboard**:
   - Go to resend.com/emails
   - Check Logs tab
   - See delivery status and errors

3. **Check environment variables**:
   ```bash
   # In your code, temporarily log:
   console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY ? "Set" : "Missing");
   console.log("RESEND_FROM_EMAIL:", process.env.RESEND_FROM_EMAIL);
   ```

4. **Check domain verification**:
   - Resend dashboard → Domains
   - Must show "Verified" status

### Digest Not Sending

1. **Check timing**:
   - Daily: Must be 9 AM UTC or later
   - Weekly: Must be Monday 9 AM UTC or later

2. **Check deduplication**:
   - May have already sent today/this week
   - Check `notifications` table for recent digest notifications

3. **Check tasks**:
   - Must be overdue (due date in past)
   - Must not be completed
   - Must be active

4. **Check console logs**:
   - Look for digest sending messages
   - Check for errors

### Email Goes to Spam

1. **Verify domain** in Resend
2. **Check SPF/DKIM records** are correct
3. **Use professional "from" name**
4. **Avoid spam trigger words**
5. **Test with mail-tester.com**

## Quick Test Commands

### Test Email Service Directly

```bash
# Create a simple test script
node -e "
const { sendEmail } = require('./src/lib/email.ts');
sendEmail({
  to: 'your-email@example.com',
  subject: 'Test',
  html: '<h1>Test</h1>',
  text: 'Test'
}).then(() => console.log('Sent')).catch(console.error);
"
```

### Trigger Cron Job Manually

```bash
# Get your CRON_SECRET from .env
curl -X GET http://localhost:3000/api/cron/notifications \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Check Database

```sql
-- Check recent notifications
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
LIMIT 10;

-- Check digest notifications
SELECT 
  notification_id,
  type,
  title,
  metadata,
  created_at
FROM notifications
WHERE type LIKE 'task_overdue_digest%'
ORDER BY created_at DESC;
```

## Production Testing

Before going to production:

1. **Test with real domain** (not test domain)
2. **Test with real user emails**
3. **Verify timing** (9 AM UTC)
4. **Test digest deduplication** (shouldn't send duplicates)
5. **Monitor Resend dashboard** for delivery rates
6. **Check spam rates** (should be low)

## Summary

**Fastest test**: Development mode (logs to console)
**Best test**: Real email with Resend API
**Most thorough**: Test all scenarios above

The system is ready to test! Start with development mode to see email content, then test with real emails to verify delivery.


