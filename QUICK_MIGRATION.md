# Quick Migration: SingleStore → Supabase (Schema Only)

## 🎯 Goal

Convert your Vesta schema from SingleStore to Supabase PostgreSQL - **no data migration needed** (fresh start with empty tables).

---

## ⏱️ Timeline: 30 Minutes

- Schema conversion: 5 minutes
- Supabase setup: 10 minutes
- Schema deployment: 5 minutes
- Application update: 10 minutes

---

## 🚀 Step-by-Step Process

### Step 1: Create Supabase Project (5 minutes)

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Configure:
   - **Name:** `vesta-production`
   - **Database Password:** Generate strong password (save it!)
   - **Region:** `eu-west-1` (closest to Spain)
   - **Plan:** Free (start) or Pro (production)

4. **Save your connection strings:**

Go to **Project Settings → Database** and copy:

```bash
# Connection Pooler (use this for your app)
POSTGRES_URL=postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Direct Connection (for migrations)
POSTGRES_URL_NON_POOLING=postgres://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres

# Also save:
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

---

### Step 2: Convert Schema (2 minutes)

```bash
# Run the automated conversion script
npx tsx scripts/convert-schema-to-postgres.ts
```

**What it does:**
- Converts `singlestoreTable` → `pgTable`
- Changes imports to PostgreSQL
- Converts `json()` → `jsonb()`
- Removes `.onUpdateNow()` and creates triggers instead
- Outputs: `src/server/db/schema.postgres.ts`

---

### Step 3: Enable PostgreSQL Extensions (2 minutes)

In **Supabase Dashboard → SQL Editor**, run:

```sql
-- Essential extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For search

-- Verify
SELECT extname FROM pg_extension;
```

---

### Step 4: Deploy Schema to Supabase (3 minutes)

```bash
# Set your connection string
export POSTGRES_URL_NON_POOLING="your-direct-connection-url"

# Push schema to Supabase
drizzle-kit push --config=drizzle.config.postgres.ts
```

This creates all your tables in Supabase.

---

### Step 5: Apply Triggers (1 minute)

```bash
# Apply auto-update triggers for updated_at columns
psql "$POSTGRES_URL_NON_POOLING" -f supabase/migrations/002_triggers.sql
```

---

### Step 6: Fix Query Compatibility (1 minute)

**Only ONE line needs changing in your queries!**

Edit `src/server/queries/properties.ts` line 32:

```typescript
// BEFORE (SingleStore)
sql`YEAR(${properties.createdAt}) = ${currentYear}`,

// AFTER (PostgreSQL)
sql`EXTRACT(YEAR FROM ${properties.createdAt}) = ${currentYear}`,
```

**That's it!** All other 40+ query files work as-is without changes.

---

### Step 7: Create Performance Indexes (2 minutes)

In **Supabase Dashboard → SQL Editor**, run:

```sql
-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_account_status ON listings(account_id, status);
CREATE INDEX IF NOT EXISTS idx_properties_account ON properties(account_id);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON properties(neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(datetime_start);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_property_images_property ON property_images(property_id);

-- Search indexes
CREATE INDEX IF NOT EXISTS idx_properties_title_trgm ON properties USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm ON contacts USING gin(first_name gin_trgm_ops);

-- Optimize
ANALYZE;
```

---

### Step 8: Update Application Code (10 minutes)

#### 8.1: Create New DB Connection File

Create `src/server/db/index.ts` (or replace existing):

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "~/env";
import * as schema from "./schema.postgres";

// Disable prefetch for Supabase Transaction Pooler
export const client = postgres(env.POSTGRES_URL, {
  prepare: false,
  max: 10, // Connection pool size
});

export const db = drizzle(client, { schema });
```

#### 8.2: Update Environment Schema

Edit `src/env.js`:

```typescript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // PostgreSQL/Supabase (NEW)
    POSTGRES_URL: z.string().url(),
    POSTGRES_URL_NON_POOLING: z.string().url(),
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_ANON_KEY: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

    // Remove old SingleStore vars:
    // SINGLESTORE_USER: z.string(),
    // SINGLESTORE_PASS: z.string(),
    // SINGLESTORE_DB: z.string(),
    // SINGLESTORE_HOST: z.string(),
    // SINGLESTORE_PORT: z.string(),

    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // Keep all other existing vars (AWS, OAuth, etc.)
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
    AWS_REGION: z.string(),
    AWS_S3_BUCKET: z.string(),
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    BETTER_AUTH_URL: z.string().url().optional(),
    APP_URL: z.string().url().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_GEMINI_API_KEY: z.string(),
    RESEND_API_KEY: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string(),
  },
  runtimeEnv: {
    POSTGRES_URL: process.env.POSTGRES_URL,
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    APP_URL: process.env.APP_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
```

#### 8.3: Update Environment Variables

Update your `.env` file:

```bash
# PostgreSQL/Supabase (NEW)
POSTGRES_URL=postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
POSTGRES_URL_NON_POOLING=postgres://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# Remove old SingleStore vars:
# SINGLESTORE_USER=...
# SINGLESTORE_PASS=...
# etc.

# Keep everything else (AWS, OAuth, etc.)
NODE_ENV=development
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=eu-west-1
AWS_S3_BUCKET=vesta-properties
BETTER_AUTH_SECRET=your-secret
BETTER_AUTH_URL=http://localhost:3000
APP_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_GEMINI_API_KEY=your-api-key
RESEND_API_KEY=your-api-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key
```

#### 8.4: Update Package Scripts

Edit `package.json`:

```json
{
  "scripts": {
    "build": "next build",
    "check": "next lint && tsc --noEmit",
    "db:generate": "drizzle-kit generate --config=drizzle.config.postgres.ts",
    "db:push": "drizzle-kit push --config=drizzle.config.postgres.ts",
    "db:studio": "drizzle-kit studio --config=drizzle.config.postgres.ts",
    "dev": "next dev --turbo",
    "lint": "next lint",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  }
}
```

#### 8.5: Rename Schema File (Optional but Clean)

```bash
# Backup old schema
mv src/server/db/schema.ts src/server/db/schema.singlestore.ts.backup

# Use new schema
mv src/server/db/schema.postgres.ts src/server/db/schema.ts

# Update drizzle config
mv drizzle.config.ts drizzle.config.singlestore.ts.backup
mv drizzle.config.postgres.ts drizzle.config.ts
```

---

### Step 9: Test Everything (5 minutes)

```bash
# Install dependencies (if needed)
pnpm install postgres

# Type check
pnpm typecheck

# Start dev server
pnpm dev

# Open http://localhost:3000
```

**Test these features:**
- [ ] App loads without errors
- [ ] Can create an account/user
- [ ] Database connection works
- [ ] No console errors

---

### Step 10: Deploy to Production

Update your production environment variables (Vercel/Railway/etc):

```bash
POSTGRES_URL=postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
POSTGRES_URL_NON_POOLING=postgres://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# Remove old SingleStore vars
# Keep all other vars
```

Then deploy:

```bash
git add .
git commit -m "feat: migrate to Supabase PostgreSQL"
git push origin main
```

---

## ✅ Verification Checklist

After migration, verify:

- [ ] Application starts without errors
- [ ] Database connection successful
- [ ] Can create records (test account, property, etc.)
- [ ] Can read records
- [ ] Can update records
- [ ] Can delete records
- [ ] `updated_at` auto-updates on changes
- [ ] Search functionality works
- [ ] Image uploads work (S3)
- [ ] No console errors

---

## 🔧 Troubleshooting

### "Cannot connect to database"

**Check:**
1. Connection string is correct
2. Using `POSTGRES_URL` (with pooler) not direct connection
3. Supabase project is running
4. No firewall blocking connection

**Fix:**
```bash
# Test connection
psql "$POSTGRES_URL_NON_POOLING" -c "SELECT NOW();"
```

### "Table does not exist"

**Fix:**
```bash
# Re-push schema
drizzle-kit push --config=drizzle.config.ts
```

### "Type errors in queries"

**Fix:**
```bash
# Regenerate Drizzle types
drizzle-kit generate --config=drizzle.config.ts
pnpm typecheck
```

### "updated_at not updating"

**Fix:**
```bash
# Re-apply triggers
psql "$POSTGRES_URL_NON_POOLING" -f supabase/migrations/002_triggers.sql
```

---

## 🎯 What Changed

| Before (SingleStore) | After (PostgreSQL) |
|---------------------|-------------------|
| `singlestoreTable()` | `pgTable()` |
| `json()` | `jsonb()` |
| `.onUpdateNow()` | Trigger-based |
| mysql2 driver | postgres-js driver |
| SingleStore connection | Supabase connection |

---

## 📦 Dependencies

Make sure you have:

```json
{
  "dependencies": {
    "drizzle-orm": "^0.42.0",
    "postgres": "^3.4.3"  // Add if missing
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.0"
  }
}
```

Install if needed:
```bash
pnpm add postgres
```

---

## 🚀 You're Done!

Your Vesta platform is now running on Supabase PostgreSQL!

**Benefits:**
- ✅ Managed PostgreSQL (no server maintenance)
- ✅ Automatic backups
- ✅ Better PostgreSQL ecosystem support
- ✅ Excellent dashboard for management
- ✅ Real-time capabilities (if needed later)
- ✅ Row-Level Security (if needed later)

---

## 🔄 Optional: Add BetterAuth Migration Support

If you need to migrate existing BetterAuth sessions/users later:

```bash
# BetterAuth supports automatic migration
# Just update the connection string and it will work
```

---

## 🎉 Next Steps

1. Start creating fresh data in your Supabase database
2. Set up proper backups (Supabase Pro includes automatic backups)
3. Configure monitoring in Supabase Dashboard
4. Enjoy your new PostgreSQL setup!

---

## 💡 Pro Tips

1. **Use Supabase Dashboard** - Great SQL editor and table viewer
2. **Enable RLS later** - Row-Level Security for multi-tenant isolation
3. **Use Drizzle Studio** - `pnpm db:studio` for visual DB management
4. **Monitor queries** - Check slow queries in Supabase Dashboard → Logs
5. **Optimize later** - Add indexes as needed based on actual usage

---

**Questions?** Check the full `MIGRATION_GUIDE.md` for detailed explanations.
