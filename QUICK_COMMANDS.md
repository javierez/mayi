# Quick Command Reference

Copy-paste commands for migrating to Supabase (schema only - no data).

---

## 📋 Prerequisites

```bash
# Install PostgreSQL client (optional)
brew install postgresql@16  # macOS
# sudo apt-get install postgresql-client-16  # Linux

# Install Supabase CLI (optional)
npm install -g supabase
```

---

## 🚀 Migration Commands

### 1. Convert Schema (2 minutes)

```bash
npx tsx scripts/convert-schema-to-postgres.ts
```

### 2. Set Environment Variable (1 minute)

```bash
# Get this from Supabase Dashboard → Settings → Database
export POSTGRES_URL_NON_POOLING="postgres://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres"
```

### 3. Push Schema to Supabase (2 minutes)

```bash
drizzle-kit push --config=drizzle.config.postgres.ts
```

### 4. Apply Triggers (1 minute)

```bash
psql "$POSTGRES_URL_NON_POOLING" -f supabase/migrations/002_triggers.sql
```

### 5. Create Indexes (Optional - 2 minutes)

Copy and paste in **Supabase Dashboard → SQL Editor**:

```sql
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_account_status ON listings(account_id, status);
CREATE INDEX IF NOT EXISTS idx_properties_account ON properties(account_id);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON properties(neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(datetime_start);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_property_images_property ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_properties_title_trgm ON properties USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm ON contacts USING gin(first_name gin_trgm_ops);
ANALYZE;
```

### 6. Update .env File

```bash
# Add these lines to your .env
POSTGRES_URL=postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
POSTGRES_URL_NON_POOLING=postgres://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# Remove or comment out old SingleStore vars:
# SINGLESTORE_HOST=...
# SINGLESTORE_USER=...
# SINGLESTORE_PASS=...
# SINGLESTORE_DB=...
# SINGLESTORE_PORT=...
```

### 7. Install postgres Driver (if needed)

```bash
pnpm add postgres
```

### 8. Rename Schema Files (Clean up)

```bash
# Backup old schema
mv src/server/db/schema.ts src/server/db/schema.singlestore.backup.ts
mv drizzle.config.ts drizzle.config.singlestore.backup.ts

# Use new schema
mv src/server/db/schema.postgres.ts src/server/db/schema.ts
mv drizzle.config.postgres.ts drizzle.config.ts
```

### 9. Test Locally

```bash
pnpm typecheck
pnpm dev
```

### 10. Deploy

```bash
git add .
git commit -m "feat: migrate to Supabase PostgreSQL"
git push origin main
```

---

## ✅ Verification Commands

### Test Connection

```bash
psql "$POSTGRES_URL_NON_POOLING" -c "SELECT NOW();"
```

### List Tables

```bash
psql "$POSTGRES_URL_NON_POOLING" -c "\dt"
```

### Count Rows (after creating data)

```bash
psql "$POSTGRES_URL_NON_POOLING" -c "
SELECT 'accounts' as table_name, COUNT(*) FROM accounts
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'properties', COUNT(*) FROM properties
UNION ALL
SELECT 'listings', COUNT(*) FROM listings;
"
```

### Check Triggers

```bash
psql "$POSTGRES_URL_NON_POOLING" -c "
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
"
```

---

## 🔧 Troubleshooting Commands

### Reconnect and Retry

```bash
# If connection fails, try:
psql "$POSTGRES_URL_NON_POOLING" -c "SELECT version();"
```

### Re-push Schema

```bash
drizzle-kit push --config=drizzle.config.ts --force
```

### Re-apply Triggers

```bash
psql "$POSTGRES_URL_NON_POOLING" -f supabase/migrations/002_triggers.sql
```

### Check for Errors

```bash
# View Drizzle errors
drizzle-kit push --config=drizzle.config.ts --verbose

# Type check
pnpm typecheck
```

---

## 📦 Supabase SQL Editor Shortcuts

Copy-paste these in **Supabase Dashboard → SQL Editor**:

### Enable Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### View All Tables

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Table Sizes

```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Drop All Tables (CAREFUL!)

```sql
-- Only use if you need to start over
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;
```

---

## 🎯 Production Deployment

### Vercel

```bash
# Set environment variables in Vercel dashboard
vercel env add POSTGRES_URL
vercel env add POSTGRES_URL_NON_POOLING
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Deploy
vercel --prod
```

### Railway

```bash
# Set environment variables in Railway dashboard
# Then redeploy from GitHub
```

### Generic

```bash
# Update your hosting platform's environment variables with:
# - POSTGRES_URL
# - POSTGRES_URL_NON_POOLING
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY

# Then redeploy your application
```

---

## 🔄 Rollback Commands (if needed)

```bash
# Revert to old schema
mv src/server/db/schema.singlestore.backup.ts src/server/db/schema.ts
mv drizzle.config.singlestore.backup.ts drizzle.config.ts

# Revert .env
# (restore old SINGLESTORE_* vars)

# Restart app
pnpm dev
```

---

## 📝 One-Liner Full Migration

```bash
npx tsx scripts/convert-schema-to-postgres.ts && \
export POSTGRES_URL_NON_POOLING="your-url-here" && \
drizzle-kit push --config=drizzle.config.postgres.ts && \
psql "$POSTGRES_URL_NON_POOLING" -f supabase/migrations/002_triggers.sql && \
echo "✅ Migration complete!"
```

---

## 💡 Quick Tips

- Use `POSTGRES_URL` (pooler) for your app
- Use `POSTGRES_URL_NON_POOLING` (direct) for migrations
- Check Supabase Dashboard → Logs for errors
- Use Drizzle Studio: `pnpm db:studio`
- Test locally before production deploy

---

**Done! 🎉**

For detailed explanations, see [`QUICK_MIGRATION.md`](./QUICK_MIGRATION.md)
