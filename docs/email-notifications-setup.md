# Email Notifications Setup Guide

This guide walks you through the complete setup process for email notifications in Vesta CRM.

## Prerequisites Checklist

- [ ] Resend account created
- [ ] Domain verified in Resend
- [ ] DNS records configured (SPF, DKIM)
- [ ] API key generated
- [ ] Environment variables configured
- [ ] Testing completed

## Step-by-Step Setup

### Step 1: Create Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account (or log in if you already have one)
3. Verify your email address

**Resend Free Tier:**
- 3,000 emails/month
- 100 emails/day
- Perfect for getting started

### Step 2: Add and Verify Your Domain

**Why verify a domain?**
- Prevents emails from being marked as spam
- Improves email deliverability
- Required for production use

**Steps:**

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Resend will provide DNS records to add

**Example DNS Records:**

You'll need to add these to your domain's DNS settings:

```
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all

Type: TXT
Name: _resend
Value: [unique-verification-code]

Type: CNAME
Name: resend._domainkey
Value: [dkim-value]._domainkey.resend.com
```

**Where to add DNS records:**
- Your domain registrar (GoDaddy, Namecheap, etc.)
- Your DNS provider (Cloudflare, Route 53, etc.)
- Your hosting provider's DNS panel

**Verification:**
- DNS changes can take 24-48 hours to propagate
- Resend will show verification status in dashboard
- Wait for "Verified" status before proceeding

### Step 3: Generate API Key

1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Give it a name (e.g., "Vesta CRM Production")
4. Select permissions (usually "Sending access" is enough)
5. Copy the API key (starts with `re_`)
6. **Important**: Save it immediately - you won't see it again!

**Security Best Practices:**
- Use different API keys for development and production
- Rotate keys periodically
- Never commit API keys to git

### Step 4: Configure Environment Variables

Add these to your `.env` file (or `.env.local`):

```bash
# Required: Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Required: Email address to send from
# Format: "Display Name <email@yourdomain.com>"
# Use the domain you verified in Resend
RESEND_FROM_EMAIL="Vesta CRM <noreply@yourdomain.com>"

# Required: Base URL for action links in emails
# This is used to generate full URLs for buttons in emails
NEXT_PUBLIC_APP_URL=https://yourdomain.com
# OR (if NEXT_PUBLIC_APP_URL is not set, this is used as fallback)
APP_URL=https://yourdomain.com
```

**Example Configuration:**

```bash
# Development
RESEND_API_KEY=re_abc123def456ghi789
RESEND_FROM_EMAIL="Vesta CRM <noreply@yourdomain.com>"
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production
RESEND_API_KEY=re_xyz789uvw456rst123
RESEND_FROM_EMAIL="Vesta CRM <noreply@yourdomain.com>"
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
```

### Step 5: Verify Configuration

**Check 1: Environment Variables**

Make sure all variables are set:
```bash
# Check if variables are loaded
echo $RESEND_API_KEY
echo $RESEND_FROM_EMAIL
echo $NEXT_PUBLIC_APP_URL
```

**Check 2: Code Configuration**

The code will:
- Use `RESEND_FROM_EMAIL` if set
- Fall back to `"Vesta CRM <noreply@vesta-crm.com>"` if not set
- Log warnings in development if `RESEND_API_KEY` is missing

### Step 6: Test Email Sending

**Option A: Test in Development**

In development mode, if `RESEND_API_KEY` is not set, emails are logged to console instead of being sent. This is safe for testing.

**Option B: Test with Real Email**

1. Create a test task that's overdue
2. Or create an appointment reminder
3. Check your email inbox
4. Check Resend dashboard → **Logs** to see delivery status

**Option C: Manual Test**

You can test the email service directly:

```typescript
// In a test file or API route
import { sendEmail } from "~/lib/email";

await sendEmail({
  to: "your-email@example.com",
  subject: "Test Email",
  html: "<h1>Test</h1><p>This is a test email.</p>",
  text: "Test\n\nThis is a test email.",
});
```

### Step 7: Monitor Email Delivery

**Resend Dashboard:**
- Go to **Logs** to see all sent emails
- Check delivery status (sent, delivered, bounced, failed)
- View error messages if emails fail

**Application Logs:**
- Check console for email sending logs
- Look for: `✅ Email sent successfully` or `❌ Failed to send email`

**Database:**
- Check `notifications` table
- Look at `deliveryChannel`, `isDelivered`, `deliveryError` fields

## Troubleshooting

### Problem: Emails Not Sending

**Check 1: API Key**
- Is `RESEND_API_KEY` set correctly?
- Is the API key valid and active?
- Check Resend dashboard → API Keys

**Check 2: Domain Verification**
- Is your domain verified in Resend?
- Are DNS records correctly configured?
- Wait 24-48 hours for DNS propagation

**Check 3: From Email Address**
- Does the email domain match your verified domain?
- Format: `"Display Name <email@verified-domain.com>"`
- Check for typos in `RESEND_FROM_EMAIL`

**Check 4: Environment Variables**
- Are variables set in the correct environment?
- Did you restart the server after adding variables?
- Check `.env` file syntax (no spaces around `=`)

### Problem: Emails Going to Spam

**Solutions:**
1. Verify your domain (Step 2)
2. Configure SPF and DKIM records correctly
3. Use a professional "from" name
4. Avoid spam trigger words in subject lines
5. Warm up your domain (send gradually increasing volumes)

### Problem: "Email service not configured" Error

**Cause:** `RESEND_API_KEY` is missing or invalid

**Solution:**
1. Check `.env` file has `RESEND_API_KEY`
2. Verify the API key in Resend dashboard
3. Restart your development server
4. In production, check Vercel environment variables

### Problem: Emails Sent but Not Received

**Check:**
1. Resend dashboard → Logs (check delivery status)
2. Spam/junk folder
3. Email provider's filters
4. Check `deliveryError` in database

## Production Deployment

### Vercel Environment Variables

1. Go to Vercel project dashboard
2. Settings → Environment Variables
3. Add each variable:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `NEXT_PUBLIC_APP_URL` (or `APP_URL`)
4. Select environments (Production, Preview, Development)
5. Redeploy your application

### Security Checklist

- [ ] API key stored in environment variables (not in code)
- [ ] Different API keys for dev/staging/production
- [ ] Domain verified and DNS records configured
- [ ] Email address uses verified domain
- [ ] Environment variables not committed to git

## Quick Reference

### Required Environment Variables

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx          # Required
RESEND_FROM_EMAIL="Name <email@domain>"  # Required
NEXT_PUBLIC_APP_URL=https://yourdomain.com # Required
```

### Email Sending Rules

- **Always sent for:**
  - `task_overdue` notifications
  - `appointment_reminder` notifications
  
- **Sent for high/urgent priority:**
  - Any notification with `priority === "high"`
  - Any notification with `priority === "urgent"`

### Testing Checklist

- [ ] API key configured
- [ ] Domain verified in Resend
- [ ] DNS records added and verified
- [ ] Environment variables set
- [ ] Test email sent successfully
- [ ] Email received in inbox (not spam)
- [ ] Action buttons in emails work
- [ ] Cron job sends emails correctly

## Support Resources

- **Resend Documentation:** https://resend.com/docs
- **Resend Dashboard:** https://resend.com/emails
- **DNS Propagation Checker:** https://www.whatsmydns.net/
- **Email Deliverability Test:** https://www.mail-tester.com/

## Summary

**Minimum Setup (5 minutes):**
1. Create Resend account
2. Get API key
3. Add to `.env`: `RESEND_API_KEY` and `RESEND_FROM_EMAIL`
4. Test sending

**Full Production Setup (1-2 days):**
1. Verify domain in Resend
2. Configure DNS records
3. Wait for DNS propagation
4. Test email delivery
5. Deploy to production

The email notification system will work automatically once configured - no code changes needed!

