# CRON_SECRET Setup Guide

## What is CRON_SECRET?

`CRON_SECRET` is a security token that prevents unauthorized access to your cron job endpoint. When Vercel runs your cron job, it automatically includes this secret in the `Authorization` header.

## Step-by-Step Setup

### 1. Generate a Secure Secret

Generate a random secret string. You can use any of these methods:

**Option A: Using OpenSSL (Recommended)**
```bash
openssl rand -hex 32
```

**Option B: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option C: Using an online generator**
- Visit https://randomkeygen.com/
- Use a "CodeIgniter Encryption Keys" generator
- Copy a 64-character string

**Example output:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### 2. Add to Local Environment (Development)

Create or edit `.env.local` in your project root:

```bash
# Add this line
CRON_SECRET=your-generated-secret-here
```

**Important:** 
- Never commit `.env.local` to git (it should be in `.gitignore`)
- Replace `your-generated-secret-here` with the actual secret you generated

### 3. Add to Vercel (Production)

#### Via Vercel Dashboard:

1. Go to your Vercel project dashboard
2. Click on **Settings** tab
3. Click on **Environment Variables** in the sidebar
4. Click **Add New**
5. Enter:
   - **Key:** `CRON_SECRET`
   - **Value:** (paste your generated secret)
   - **Environment:** Select all (Production, Preview, Development)
6. Click **Save**

#### Via Vercel CLI:

```bash
vercel env add CRON_SECRET
# When prompted, paste your secret
# Select all environments (production, preview, development)
```

### 4. How It Works

**Vercel automatically handles the secret!** Here's what happens:

1. You set `CRON_SECRET` as an environment variable in Vercel
2. When Vercel triggers your cron job (every 15 minutes), it:
   - Reads `CRON_SECRET` from your environment variables
   - Makes a GET request to `/api/cron/notifications`
   - **Automatically includes** `Authorization: Bearer {your-CRON_SECRET}` in the request header
3. Your code receives the request and:
   - Reads `Authorization` header from the request
   - Compares it to `process.env.CRON_SECRET`
   - If it matches → cron job runs ✅
   - If it doesn't match → returns 401 Unauthorized ❌

**Key Point:** Vercel automatically injects the `CRON_SECRET` into the Authorization header - you don't need to configure this anywhere else. Just set the environment variable and Vercel handles the rest!

### 5. Testing Locally

To test the cron job locally, you can manually call it:

```bash
curl -X GET http://localhost:3000/api/cron/notifications \
  -H "Authorization: Bearer your-CRON_SECRET-here"
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

### 6. Security Best Practices

- ✅ Use a long, random secret (at least 32 characters)
- ✅ Never commit the secret to git
- ✅ Use different secrets for development and production (optional but recommended)
- ✅ Rotate the secret periodically if compromised
- ✅ Keep it secure - treat it like a password

### 7. Troubleshooting

**Problem: Cron job returns 401 Unauthorized**

- Check that `CRON_SECRET` is set in Vercel environment variables
- Verify the secret matches exactly (no extra spaces)
- Make sure you've deployed after adding the environment variable
- Check Vercel logs for the exact error message

**Problem: Cron job returns 500 "Cron secret not configured"**

- The `CRON_SECRET` environment variable is missing
- Add it to your `.env.local` (for local) or Vercel dashboard (for production)

**Problem: Cron job not running**

- Check `vercel.json` has the cron configuration
- Verify the schedule is correct: `"*/15 * * * *"` (every 15 minutes)
- Check Vercel dashboard → Settings → Cron Jobs to see execution logs

## Quick Reference

```bash
# Generate secret
openssl rand -hex 32

# Add to .env.local
echo "CRON_SECRET=your-secret-here" >> .env.local

# Test locally
curl -X GET http://localhost:3000/api/cron/notifications \
  -H "Authorization: Bearer your-secret-here"
```

## Notes

- **Vercel automatically includes the `Authorization: Bearer {CRON_SECRET}` header** when calling cron jobs - this is a built-in Vercel feature
- Vercel reads `CRON_SECRET` from your environment variables and automatically adds it to the request
- You don't need to configure headers in `vercel.json` - Vercel handles it automatically
- The secret is only used for verification, not for encryption
- If you change the secret, update it in both `.env.local` (for local testing) and Vercel dashboard (for production)
- The secret must be the same value in both places for verification to work

