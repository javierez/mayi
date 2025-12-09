# How to Check if Cron Jobs Are Running

This guide shows multiple ways to verify your cron jobs are executing correctly.

## Method 1: Vercel Dashboard (Production)

**Best way to check in production:**

1. Go to your **Vercel project dashboard**
2. Click on **Settings** tab
3. Click on **Cron Jobs** in the sidebar
4. You'll see:
   - List of configured cron jobs
   - Last execution time
   - Execution history
   - Success/failure status
   - Response times

**What to look for:**
- ✅ Green checkmark = Success
- ❌ Red X = Failed
- Clock icon = Scheduled
- Last run timestamp should be recent (within last 15 minutes)

## Method 2: Vercel Logs

**Check execution logs:**

1. Go to **Vercel dashboard** → Your project
2. Click on **Deployments** tab
3. Click on latest deployment
4. Click on **Functions** tab
5. Find `/api/cron/notifications`
6. Click to see logs

**Or use Vercel CLI:**
```bash
vercel logs --follow
# Filter for cron:
vercel logs --follow | grep "cron"
```

**What to look for:**
- Console.log messages from your cron job
- Success responses: `{ success: true, remindersCreated: X, tasksNotified: Y }`
- Error messages if something fails

## Method 3: Manual Test (Local or Production)

**Test the endpoint directly:**

```bash
# Get your CRON_SECRET from .env or Vercel
curl -X GET http://localhost:3000/api/cron/notifications \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected response:**
```json
{
  "success": true,
  "remindersCreated": 5,
  "tasksNotified": 3,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**If it works:**
- ✅ Cron endpoint is accessible
- ✅ Authentication works
- ✅ Cron job logic executes

**If it fails:**
- 401 = Wrong or missing CRON_SECRET
- 500 = Error in cron job code
- Check response body for error details

## Method 4: Check Database Results

**Verify cron job created notifications:**

```sql
-- Check recent notifications created by cron
SELECT 
  notification_id,
  type,
  title,
  created_at,
  delivery_channel,
  is_delivered
FROM notifications
WHERE type IN (
  'appointment_reminder',
  'task_due_soon',
  'task_overdue_digest_weekly',
  'task_overdue_digest_daily'
)
ORDER BY created_at DESC
LIMIT 20;

-- Check digest emails sent
SELECT 
  notification_id,
  type,
  title,
  metadata,
  created_at
FROM notifications
WHERE type LIKE 'task_overdue_digest%'
ORDER BY created_at DESC
LIMIT 10;
```

**What to look for:**
- Recent `created_at` timestamps (within last hour)
- `type` matching cron job notifications
- `delivery_channel = 'email'` for digest emails

## Method 5: Add Logging to Cron Job

**Add detailed logging to see what's happening:**

In `src/app/api/cron/notifications/route.ts`, add logging:

```typescript
export async function GET(request: NextRequest) {
  console.log("🕐 Cron job started at:", new Date().toISOString());
  
  try {
    // ... existing code ...
    
    console.log("📊 Cron job results:", {
      remindersCreated: remindersCreated.length,
      tasksNotified: tasksNotified.length,
      timestamp: now.toISOString(),
    });

    return NextResponse.json({
      success: true,
      remindersCreated: remindersCreated.length,
      tasksNotified: tasksNotified.length,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("❌ Cron job error:", error);
    // ... existing error handling ...
  }
}
```

**Then check logs:**
- Vercel dashboard → Logs
- Or `vercel logs --follow`

## Method 6: Check Email Delivery

**If cron job sends emails, check Resend:**

1. Go to **resend.com/emails**
2. Click on **Logs** tab
3. Filter by time (last hour)
4. Look for emails sent by cron job

**What to look for:**
- Recent email sends
- Delivery status (sent, delivered, failed)
- Email subjects matching digest emails

## Method 7: Monitor Response Times

**Check if cron job completes in time:**

Vercel cron jobs have a timeout. Check:
- Vercel dashboard → Cron Jobs → Execution time
- Should be under 60 seconds (your maxDuration)

**If timing out:**
- Optimize database queries
- Add pagination for large datasets
- Consider breaking into smaller jobs

## Quick Checklist

### Production (Vercel)
- [ ] Check Vercel dashboard → Cron Jobs
- [ ] Verify last execution time is recent
- [ ] Check execution status (success/failure)
- [ ] Review logs for errors
- [ ] Check database for new notifications
- [ ] Verify emails are being sent

### Local Development
- [ ] Test endpoint manually with curl
- [ ] Check console logs
- [ ] Verify CRON_SECRET is set
- [ ] Check database for results

## Common Issues

### Cron Job Not Running

**Check:**
1. `vercel.json` has cron configuration
2. Schedule is correct: `"*/15 * * * *"` (every 15 minutes)
3. Path matches: `/api/cron/notifications`
4. Project is deployed to Vercel
5. Vercel Pro plan (cron jobs require paid plan)

### Cron Job Returns 401

**Check:**
1. `CRON_SECRET` is set in Vercel environment variables
2. Secret matches exactly (no extra spaces)
3. Project redeployed after adding secret

### Cron Job Returns 500

**Check:**
1. Vercel logs for error details
2. Database connection is working
3. All required environment variables are set
4. Code doesn't have syntax errors

### No Notifications Created

**Check:**
1. Are there actually overdue tasks/appointments?
2. Are tasks completed? (completed tasks are skipped)
3. Are tasks active? (inactive tasks are skipped)
4. Check timing logic (digest emails only at specific times)

## Testing Locally

**Cron jobs don't run automatically in local development.** You need to:

1. **Manually trigger:**
   ```bash
   curl -X GET http://localhost:3000/api/cron/notifications \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

2. **Or create a test script:**
   ```typescript
   // test-cron.ts
   const response = await fetch('http://localhost:3000/api/cron/notifications', {
     headers: {
       'Authorization': `Bearer ${process.env.CRON_SECRET}`
     }
   });
   console.log(await response.json());
   ```

## Monitoring in Production

**Set up alerts:**
- Vercel can send email notifications for failed cron jobs
- Check Vercel dashboard → Settings → Notifications
- Enable alerts for cron job failures

**Regular checks:**
- Check Vercel dashboard weekly
- Review logs monthly
- Monitor email delivery rates
- Check database for notification patterns

## Summary

**Best way to check:**
1. **Vercel Dashboard** → Cron Jobs (see execution history)
2. **Vercel Logs** (see what happened)
3. **Database** (verify notifications created)
4. **Resend Dashboard** (verify emails sent)

**Quick test:**
```bash
curl -X GET https://your-domain.com/api/cron/notifications \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

If you get a JSON response with `success: true`, your cron job is working! 🎉

