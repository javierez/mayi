# 🍪 Vesta Cookie Configuration Guide

## Table of Contents
- [Overview](#overview)
- [Types of Cookies](#types-of-cookies)
- [Security Features](#security-features)
- [How Cookies Flow](#how-cookies-flow)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Overview

Cookies in Vesta are like **sticky notes your website leaves on a visitor's browser** to remember important information. They help provide a seamless user experience while maintaining security and privacy compliance.

### Cookie Summary Table

| Cookie Type | Name | Duration | Secure | HttpOnly | SameSite | Purpose |
|-------------|------|----------|--------|----------|----------|---------|
| **Auth** | `better-auth.session_token` | 7 days | Prod only | ✅ Yes | lax | Remember login |
| **Consent** | `vesta-cookie-consent` | 365 days | Prod only | ❌ No | lax | Remember preferences |
| **Analytics** | PostHog cookies | Varies | Prod only | Varies | lax | Track usage |

---

## Types of Cookies

### 1. 🔐 Authentication Cookies

**Purpose:** Remember who's logged in
**Cookie Name:** `better-auth.session_token` (or `__Secure-better-auth.session_token` in production)
**Duration:** 7 days
**Configuration File:** `src/lib/auth.ts`

**Simple Analogy:** Like a wristband at a theme park - it proves you paid to enter and lets you access features without logging in every time.

**Technical Details:**
```typescript
// src/lib/auth.ts
session: {
  expiresIn: 60 * 60 * 24 * 7, // 7 days
  cookieCache: {
    enabled: true,
    maxAge: 5 * 60, // 5 minutes cache
    strategy: "jwe", // Encrypted tokens
  },
}
```

**Security Settings:**
- ✅ **HttpOnly**: JavaScript cannot read this cookie (prevents XSS attacks)
- ✅ **Secure**: Only transmitted over HTTPS in production
- ✅ **SameSite: "lax"**: Prevents CSRF attacks while allowing normal navigation
- ✅ **Encrypted**: Uses JWE (JSON Web Encryption) for additional security

---

### 2. 📋 Consent Cookies

**Purpose:** Remember cookie consent preferences
**Cookie Name:** `vesta-cookie-consent`
**Duration:** 365 days (1 year)
**Configuration File:** `src/components/cookie-consent-banner.tsx`

**Simple Analogy:** Like checking a box that says "Don't show me this message again"

**Stored Data:**
```json
{
  "necessary": true,       // Always true (essential cookies)
  "analytics": true/false, // User's choice for analytics
  "marketing": true/false, // User's choice for marketing
  "timestamp": 1234567890  // When decision was made
}
```

**Security Settings:**
- ❌ **HttpOnly**: OFF (JavaScript needs to read preferences)
- ✅ **Secure**: Only in production
- ✅ **SameSite: "lax"**: Medium protection

**Reading Consent (Client-Side):**
```typescript
import { getCookie } from "~/lib/cookie-utils";

const consent = getCookie("vesta-cookie-consent");
if (consent) {
  const parsed = JSON.parse(consent);
  console.log(parsed.analytics); // true/false
}
```

**Reading Consent (Server-Side):**
```typescript
import { getCookieConsent } from "~/lib/server-cookie-utils";

const consent = await getCookieConsent();
if (consent?.analytics) {
  // Enable analytics
}
```

---

### 3. 📊 Analytics Cookies (PostHog)

**Purpose:** Track user behavior and improve user experience
**Cookie Names:** Various PostHog cookies
**Only Active If:** User accepts analytics in consent banner
**Configuration File:** `instrumentation-client.ts`

**Simple Analogy:** Like a store counting how many people walk through each aisle - helps understand what's popular.

**Configuration:**
```typescript
// instrumentation-client.ts
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "/ingest", // Proxied through Next.js
  ui_host: "https://us.posthog.com",
  capture_exceptions: true,
  debug: process.env.NODE_ENV === "development",
});
```

**Important:** The `/ingest` path is configured as a public path in middleware to allow analytics without authentication.

---

## Security Features

### 🛡️ Secure Flag

**What it does:** Ensures cookies are only sent over HTTPS connections

```typescript
Development (localhost):     secure: false ❌
Production (vesta-crm.com):  secure: true  ✅
```

**Why the difference?**
- **Development**: Uses `http://localhost` (no encryption)
- **Production**: Uses `https://` (encrypted connection)
- Secure cookies ONLY work with HTTPS

**Configuration:**
```typescript
// src/lib/auth.ts
advanced: {
  useSecureCookies: process.env.NODE_ENV === "production",
  defaultCookieAttributes: {
    secure: process.env.NODE_ENV === "production",
  },
}
```

---

### 🔒 HttpOnly Flag

**What it does:** Prevents JavaScript from reading the cookie

```
Authentication cookies: httpOnly: true  ✅
Consent cookies:       httpOnly: false ❌
```

**Why authentication is HttpOnly:**
- Prevents JavaScript-based attacks (XSS) from stealing session tokens
- Like keeping your house key in a lockbox instead of your pocket

**Why consent is NOT HttpOnly:**
- The cookie banner (JavaScript) needs to read user preferences
- Contains non-sensitive information

---

### 🚫 SameSite Attribute

**What it does:** Controls when cookies are sent with cross-site requests

```typescript
All Vesta cookies: sameSite: "lax" ✅
```

**Options Explained:**
- `"strict"` = Cookie never sent on cross-site requests (can break navigation) ⛔
- `"lax"` = Cookie sent on safe cross-site requests (balanced approach) ✅
- `"none"` = Cookie always sent (requires Secure flag, not recommended) ❌

**We use "lax" because:**
- Blocks CSRF attacks (malicious sites can't use your cookies)
- Allows normal navigation (clicking links from email, etc.)
- Best balance between security and usability

---

### 🌐 Domain Attribute (Optional)

**What it does:** Controls which domains/subdomains can access the cookie

**Default (not set):**
- Cookie only works on the exact domain where it was set
- Example: `app.vesta-crm.com` → cookie only works on `app.vesta-crm.com`

**With domain set:**
```typescript
domain: ".vesta-crm.com"
```
- Cookie works on all subdomains
- Example: Works on `app.vesta-crm.com`, `api.vesta-crm.com`, `www.vesta-crm.com`

**Configuration:**
```typescript
// src/lib/auth.ts
defaultCookieAttributes: {
  ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
}

// .env (optional)
COOKIE_DOMAIN=.vesta-crm.com
```

**When you need it:**
- Multiple subdomains that need to share authentication
- SSO (Single Sign-On) across subdomains
- API on different subdomain than main app

---

## How Cookies Flow

### 🔐 Login Flow

```
1. User enters email/password on /auth/signin
   ↓
2. Better Auth verifies credentials against database
   ↓
3. Session created in database
   ↓
4. Cookie created with security attributes:
   - Name: better-auth.session_token
   - HttpOnly: true ✅
   - Secure: true (prod) ✅
   - SameSite: lax ✅
   - Expires: 7 days
   ↓
5. Browser stores cookie automatically
   ↓
6. Every subsequent request includes cookie in headers
   ↓
7. Middleware (src/middleware.ts) checks for cookie
   ↓
8. If valid → Request proceeds to protected route
   If invalid → Redirect to homepage (/)
   ↓
9. DAL (Data Access Layer) validates full session from database
   ↓
10. User data available throughout application
```

**Code Example:**
```typescript
// src/middleware.ts
const sessionToken =
  request.cookies.get("__Secure-better-auth.session_token") ??
  request.cookies.get("better-auth.session_token");

if (!sessionToken?.value) {
  // No session - redirect to homepage
  return NextResponse.redirect(new URL("/", request.url));
}
```

---

### 📋 Cookie Consent Flow

```
1. User visits website for first time
   ↓
2. Check for existing vesta-cookie-consent cookie
   ↓
3. If NOT found:
   → Show cookie banner after 1 second delay
   ↓
4. User makes choice:
   - "Accept All" → all: true
   - "Reject All" → only necessary: true
   - "Configure" → custom choices
   ↓
5. Save preferences to cookie:
   - Duration: 365 days
   - Secure: production only
   - SameSite: lax
   ↓
6. Apply consent choices:
   - Enable/disable PostHog analytics
   - Store flags in localStorage for quick access
   ↓
7. Hide banner (won't show again for 1 year)
   ↓
8. Server-side code can check consent:
   - hasAnalyticsConsent() → boolean
   - hasMarketingConsent() → boolean
```

**Code Example:**
```typescript
// src/components/cookie-consent-banner.tsx
const saveConsent = (consentData: CookieConsent) => {
  const consentWithTimestamp = {
    ...consentData,
    timestamp: Date.now(),
  };

  setCookie("vesta-cookie-consent", JSON.stringify(consentWithTimestamp), 365, {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  applyConsent(consentWithTimestamp);
};
```

---

### 📊 Analytics Flow (PostHog)

```
1. PostHog initialized on page load (instrumentation-client.ts)
   ↓
2. Check if user gave analytics consent
   ↓
3. If consent given:
   → PostHog tracks events
   → Sends data to /ingest/* endpoints
   → Proxied to us.i.posthog.com
   ↓
4. Middleware allows /ingest/* (public path)
   → No authentication required
   ↓
5. PostHog stores its own cookies for:
   - Session tracking
   - User identification
   - Feature flags
   ↓
6. Data sent to PostHog cloud for analysis
```

**Important Configuration:**
```typescript
// next.config.js - Proxy PostHog requests
async rewrites() {
  return [
    {
      source: "/ingest/static/:path*",
      destination: "https://us-assets.i.posthog.com/static/:path*",
    },
    {
      source: "/ingest/:path*",
      destination: "https://us.i.posthog.com/:path*",
    },
  ];
}

// src/middleware.ts - Allow analytics requests
const publicPaths = [
  "/ingest", // PostHog analytics proxy
  // ... other public paths
];
```

---

## Configuration

### Environment Variables

**Required:**
```bash
# .env
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000  # or production URL
NODE_ENV=development  # or production
```

**Optional:**
```bash
# For subdomain cookie sharing
COOKIE_DOMAIN=.vesta-crm.com

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
```

---

### Cookie Utility Functions

**Client-Side (Browser):**
```typescript
// src/lib/cookie-utils.ts

// Set a cookie
setCookie("my-cookie", "value", 30, {
  secure: true,
  sameSite: "lax",
  path: "/",
  domain: ".example.com", // optional
});

// Get a cookie
const value = getCookie("my-cookie"); // returns string | null

// Delete a cookie
deleteCookie("my-cookie", "/", ".example.com");

// Check if cookies are enabled
if (areCookiesEnabled()) {
  console.log("Cookies work!");
}
```

**Server-Side (API/Server Components):**
```typescript
// src/lib/server-cookie-utils.ts

// Get consent preferences
const consent = await getCookieConsent();
console.log(consent?.analytics); // true/false

// Check specific consent
const hasAnalytics = await hasAnalyticsConsent(); // boolean
const hasMarketing = await hasMarketingConsent(); // boolean

// Using Next.js cookies() directly
import { cookies } from "next/headers";

const cookieStore = await cookies();
const sessionCookie = cookieStore.get("better-auth.session_token");
```

---

### Middleware Configuration

**Protected vs Public Paths:**
```typescript
// src/middleware.ts

const publicPaths = [
  "/",                    // Homepage
  "/auth/signin",         // Login page
  "/auth/signup",         // Registration
  "/api/auth",            // Auth API routes
  "/ingest",              // PostHog analytics (important!)
  // ... landing pages
];

// Everything else requires authentication
// Middleware checks for session cookie and redirects if missing
```

**Middleware Matcher:**
```typescript
export const config = {
  matcher: [
    // Match all paths except:
    // - /api/auth/* (auth endpoints)
    // - /_next/* (Next.js internals)
    // - Static files (*.png, *.jpg, etc.)
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
```

---

## Troubleshooting

### Problem 1: Can't Login in Development

**Symptoms:**
- Login form submits but nothing happens
- Redirect to homepage immediately after login
- No session cookie visible in browser

**Cause:** Secure cookies forced in development (HTTP environment)

**Solution:**
```typescript
// src/lib/auth.ts - Make sure this is set:
advanced: {
  useSecureCookies: process.env.NODE_ENV === "production", // ✅ Not just "true"
  defaultCookieAttributes: {
    secure: process.env.NODE_ENV === "production", // ✅ Not just "true"
  },
}
```

**Verify:** Check browser DevTools → Application → Cookies. You should see `better-auth.session_token` (without `__Secure-` prefix in dev).

---

### Problem 2: PostHog JSON Parse Error

**Symptoms:**
```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

**Cause:** PostHog requests to `/ingest/*` being blocked by authentication middleware

**Solution:**
```typescript
// src/middleware.ts - Ensure /ingest is in publicPaths:
const publicPaths = [
  "/",
  "/auth/signin",
  "/ingest", // ✅ Must be here!
  // ... other paths
];
```

**Verify:** Check server logs. You should NOT see:
```
🔄 Redirecting to homepage from: /ingest/e/ - No session token found
```

---

### Problem 3: Cookie Consent Banner Keeps Appearing

**Symptoms:**
- Banner shows every time you refresh the page
- Preferences not being saved

**Cause:** Cookie not being set properly, or browser blocking cookies

**Solution:**

1. **Check if cookies are enabled:**
```typescript
import { areCookiesEnabled } from "~/lib/cookie-utils";

if (!areCookiesEnabled()) {
  console.error("Cookies are disabled in browser!");
}
```

2. **Check browser DevTools:**
   - Open DevTools (F12)
   - Go to Application → Cookies
   - Look for `vesta-cookie-consent`
   - Check expiration date (should be ~1 year from now)

3. **Verify cookie is being set:**
```typescript
// After clicking "Accept All", check console:
console.log(document.cookie); // Should contain "vesta-cookie-consent"
```

4. **Clear old data:**
```typescript
// If migrating from old version:
localStorage.removeItem("vesta-cookie-consent"); // Remove old storage
```

---

### Problem 4: Session Expires Too Quickly

**Symptoms:**
- Logged out after a few minutes
- Have to login multiple times per day

**Current Configuration:**
```typescript
// src/lib/auth.ts
session: {
  expiresIn: 60 * 60 * 24 * 7, // 7 days
}
```

**To Extend Session:**
```typescript
// Change to 30 days:
session: {
  expiresIn: 60 * 60 * 24 * 30, // 30 days
}
```

**Note:** Longer sessions = more convenience but less security. 7 days is a good balance.

---

### Problem 5: Cookies Not Working Across Subdomains

**Symptoms:**
- Login on `app.vesta-crm.com` doesn't work on `api.vesta-crm.com`
- Have to login separately on each subdomain

**Solution:** Set domain attribute

```bash
# .env
COOKIE_DOMAIN=.vesta-crm.com  # Note the leading dot!
```

```typescript
// src/lib/auth.ts
defaultCookieAttributes: {
  domain: process.env.COOKIE_DOMAIN, // Will be .vesta-crm.com
}
```

**Important:**
- Must start with `.` (dot) for subdomain sharing
- Must be the parent domain (not a subdomain)
- Both subdomains must use HTTPS in production

---

### Debugging Tips

**View all cookies in browser:**
1. Open DevTools (F12)
2. Go to **Application** tab
3. Expand **Cookies** in left sidebar
4. Click on your domain
5. See all cookies with details

**View cookies in server logs:**
```typescript
// In any API route or server component:
import { cookies } from "next/headers";

const cookieStore = await cookies();
const allCookies = cookieStore.getAll();
console.log("All cookies:", allCookies);
```

**Test cookie settings:**
```typescript
// Create a test cookie:
document.cookie = "test=123; path=/; max-age=60";
console.log(document.cookie); // Should contain "test=123"

// Delete test cookie:
document.cookie = "test=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
```

**Check middleware logs:**
```bash
# Look for these messages in terminal:
✓ Compiled middleware in Xms          # Middleware updated
🔄 Redirecting to homepage from: /X   # Auth check failed
```

---

## Best Practices

### ✅ Do's

1. **Use environment-based security:**
   ```typescript
   secure: process.env.NODE_ENV === "production"
   ```

2. **Use HttpOnly for sensitive data:**
   ```typescript
   // Authentication tokens should be HttpOnly
   httpOnly: true
   ```

3. **Use SameSite for CSRF protection:**
   ```typescript
   sameSite: "lax" // Best balance
   ```

4. **Set appropriate expiration times:**
   ```typescript
   // Short for sensitive data, long for preferences
   expiresIn: 60 * 60 * 24 * 7 // 7 days for auth
   ```

5. **Respect user consent:**
   ```typescript
   // Always check consent before enabling analytics
   const consent = await getCookieConsent();
   if (consent?.analytics) {
     // Enable analytics
   }
   ```

### ❌ Don'ts

1. **Don't store sensitive data without HttpOnly:**
   ```typescript
   // BAD - sensitive data readable by JavaScript
   setCookie("user-ssn", "123-45-6789"); // ❌
   ```

2. **Don't use SameSite: "none" unless necessary:**
   ```typescript
   // BAD - no CSRF protection
   sameSite: "none" // ❌ (only for cross-site cookies)
   ```

3. **Don't force Secure in development:**
   ```typescript
   // BAD - breaks local development
   useSecureCookies: true // ❌

   // GOOD - environment-aware
   useSecureCookies: process.env.NODE_ENV === "production" // ✅
   ```

4. **Don't store large data in cookies:**
   ```typescript
   // BAD - cookies sent with every request
   setCookie("large-data", JSON.stringify(hugeObject)); // ❌

   // GOOD - use database or localStorage for large data
   localStorage.setItem("large-data", JSON.stringify(hugeObject)); // ✅
   ```

5. **Don't forget to validate cookies server-side:**
   ```typescript
   // BAD - trust cookie value directly
   const userId = getCookie("user-id"); // ❌

   // GOOD - validate session from database
   const session = await getSecureSession(); // ✅
   ```

---

## GDPR & Privacy Compliance

### Cookie Categories

**Necessary Cookies (Always Allowed):**
- `better-auth.session_token` - Authentication
- `better-auth.csrf_token` - Security
- Cannot be disabled (essential for site functionality)

**Analytics Cookies (User Choice):**
- PostHog tracking cookies
- Only active if user gives consent
- Can be disabled in cookie banner

**Marketing Cookies (User Choice):**
- Currently not used in Vesta
- Placeholder for future marketing integrations
- Can be enabled/disabled in cookie banner

### Consent Management

**User Rights:**
- ✅ View what cookies are used (/cookies page)
- ✅ Accept or reject non-essential cookies
- ✅ Change preferences at any time
- ✅ Banner reappears after 1 year (consent refresh)

**Implementation:**
```typescript
// Check consent before enabling features:
const consent = await getCookieConsent();

if (consent?.analytics) {
  // Enable analytics tracking
  posthog.opt_in_capturing();
}

if (consent?.marketing) {
  // Enable marketing features (when implemented)
}
```

---

## Performance Considerations

### Cookie Size Limits

**Browser Limits:**
- Per cookie: ~4KB (4096 bytes)
- Per domain: ~180 cookies
- Total: ~720KB per domain

**Best Practices:**
- Keep cookies small (under 1KB ideally)
- Use database for large data
- Clean up unused cookies

### Cookie Cache (Performance Optimization)

**Better Auth Cookie Cache:**
```typescript
cookieCache: {
  enabled: true,
  maxAge: 5 * 60, // 5 minutes
  strategy: "jwe", // Encrypted
}
```

**How it works:**
1. Session data encrypted and stored in cookie
2. Reduces database queries for session validation
3. Auto-refreshes every 5 minutes
4. Improves performance on high-traffic routes

**Trade-offs:**
- ✅ Faster (no DB query needed)
- ✅ Scales better (less DB load)
- ❌ Slight delay in role/permission changes (up to 5 min)

---

## Security Checklist

Before deploying to production, verify:

- [ ] `NODE_ENV=production` in environment
- [ ] `BETTER_AUTH_SECRET` is strong and unique
- [ ] `BETTER_AUTH_URL` matches production domain
- [ ] HTTPS enabled on production domain
- [ ] Cookie `secure` flag enabled in production
- [ ] Cookie `httpOnly` enabled for auth cookies
- [ ] Cookie `sameSite: "lax"` or stricter
- [ ] `/ingest` path is public (for analytics)
- [ ] Cookie consent banner displays correctly
- [ ] User can customize cookie preferences
- [ ] Session timeout appropriate for your use case

---

## Additional Resources

**Related Files:**
- `src/lib/auth.ts` - Authentication configuration
- `src/lib/cookie-utils.ts` - Client-side cookie utilities
- `src/lib/server-cookie-utils.ts` - Server-side cookie utilities
- `src/middleware.ts` - Request authentication
- `src/components/cookie-consent-banner.tsx` - GDPR consent UI
- `instrumentation-client.ts` - PostHog analytics setup
- `next.config.js` - PostHog proxy configuration

**External Documentation:**
- [Better Auth Docs](https://better-auth.com)
- [MDN Cookie Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [GDPR Cookie Compliance](https://gdpr.eu/cookies/)
- [PostHog Documentation](https://posthog.com/docs)

---

**Last Updated:** 2025-01-04
**Maintained By:** Vesta Development Team
