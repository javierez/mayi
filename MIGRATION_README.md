# Vesta Migration to Supabase

Complete migration toolkit for converting Vesta from SingleStore to Supabase PostgreSQL.

---

## 🎯 Choose Your Path

### Option 1: Schema Only (RECOMMENDED - 30 minutes)
**Use if:** You have test data and want a fresh start with Supabase

👉 **Follow: [`QUICK_MIGRATION.md`](./QUICK_MIGRATION.md)**

### Option 2: Full Migration with Data (3-5 hours)
**Use if:** You have production data that must be migrated

👉 **Follow: [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md)**

---

## 📋 What You Need

### Requirements
- Supabase account (free or Pro)
- Node.js 18+ installed
- PostgreSQL client tools (optional but helpful)
- 30 minutes (schema only) or 3-5 hours (with data)

### Tools Provided
✅ Automated schema conversion script
✅ Data migration scripts (if needed)
✅ Testing suite
✅ Complete documentation

---

## 🚀 Quick Start (Schema Only)

Most users should follow this path:

```bash
# 1. Create Supabase project at https://supabase.com

# 2. Convert schema
npx tsx scripts/convert-schema-to-postgres.ts

# 3. Deploy to Supabase
export POSTGRES_URL_NON_POOLING="your-postgres-url"
drizzle-kit push --config=drizzle.config.postgres.ts
psql "$POSTGRES_URL_NON_POOLING" -f supabase/migrations/002_triggers.sql

# 4. Update app code (see QUICK_MIGRATION.md)

# 5. Test
pnpm dev
```

**Done! 🎉** Your app is now running on Supabase.

---

## 📁 Files Provided

### Documentation
- **`QUICK_MIGRATION.md`** - 30-minute schema-only migration (START HERE)
- **`MIGRATION_GUIDE.md`** - Full migration with data export/import
- **`MIGRATION_CHECKLIST.md`** - Detailed checklist for full migration
- **`MIGRATION_SUMMARY.md`** - Overview of the migration process

### Scripts
- **`scripts/convert-schema-to-postgres.ts`** - Automated schema conversion
- **`scripts/migrate-data.ts`** - Data export/import (if needed)
- **`scripts/test-migration.ts`** - Testing suite
- **`scripts/README.md`** - Scripts documentation

### Configuration
- **`drizzle.config.postgres.ts`** - Drizzle config for PostgreSQL

---

## 🤔 Which Option Should I Choose?

### Choose **Schema Only** if:
- ✅ You have test/development data
- ✅ You're starting fresh
- ✅ You don't need to preserve existing data
- ✅ You want the fastest migration

**→ Follow [`QUICK_MIGRATION.md`](./QUICK_MIGRATION.md)**

### Choose **Full Migration** if:
- ✅ You have production data
- ✅ You need to preserve all existing records
- ✅ You have users/properties/listings that must be migrated
- ✅ You can afford 3-5 hours for migration

**→ Follow [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md)**

---

## ⏱️ Time Estimates

| Task | Schema Only | With Data |
|------|-------------|-----------|
| **Reading docs** | 10 min | 30 min |
| **Supabase setup** | 5 min | 10 min |
| **Schema conversion** | 5 min | 15 min |
| **Data export** | - | 30-60 min |
| **Data import** | - | 60-120 min |
| **Verification** | 5 min | 15 min |
| **App updates** | 10 min | 10 min |
| **Testing** | 5 min | 30 min |
| **TOTAL** | **30-40 min** | **3-5 hours** |

---

## 🎯 What Gets Migrated

### Schema Only (Quick)
- ✅ All table structures (40+ tables)
- ✅ Column definitions with correct types
- ✅ Indexes and foreign keys
- ✅ Triggers for auto-updates
- ❌ No data (fresh start)

### Full Migration
- ✅ Everything from Schema Only
- ✅ All data from all tables
- ✅ Maintains relationships
- ✅ Preserves IDs and sequences

---

## 🔧 What Changes in Your Code

### Database Connection
```typescript
// BEFORE (SingleStore)
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

// AFTER (PostgreSQL)
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
```

### Environment Variables
```bash
# BEFORE
SINGLESTORE_HOST=...
SINGLESTORE_USER=...
SINGLESTORE_PASS=...
SINGLESTORE_DB=...

# AFTER
POSTGRES_URL=postgres://...
POSTGRES_URL_NON_POOLING=postgres://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Schema Types
```typescript
// BEFORE
import { singlestoreTable, json } from "drizzle-orm/singlestore-core";
export const users = singlestoreTable("users", {
  preferences: json("preferences"),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});

// AFTER
import { pgTable, jsonb } from "drizzle-orm/pg-core";
export const users = pgTable("users", {
  preferences: jsonb("preferences"),
  updatedAt: timestamp("updated_at"), // onUpdateNow via trigger
});
```

---

## ✅ Success Criteria

Your migration is successful when:

- [ ] Application starts without errors
- [ ] Database connection works
- [ ] Can perform CRUD operations
- [ ] No TypeScript errors
- [ ] Tests pass (if you have tests)
- [ ] `updated_at` auto-updates
- [ ] All features work as expected

---

## 🆘 Getting Help

### Check These First
1. Error messages in console
2. Supabase Dashboard → Logs
3. `QUICK_MIGRATION.md` troubleshooting section
4. `MIGRATION_GUIDE.md` for detailed explanations

### Resources
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)

### Common Issues

**"Cannot connect to database"**
- Check connection string format
- Use pooler URL for app, direct URL for migrations
- Verify Supabase project is active

**"Table does not exist"**
- Run `drizzle-kit push` again
- Check Supabase Dashboard → Table Editor

**"Type errors"**
- Run `pnpm typecheck`
- Regenerate types with `drizzle-kit generate`

---

## 🎓 Learning Path

1. **Start:** Read this file (you are here!)
2. **Quick path:** Follow [`QUICK_MIGRATION.md`](./QUICK_MIGRATION.md)
3. **Full path:** Follow [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md)
4. **Reference:** Use [`MIGRATION_CHECKLIST.md`](./MIGRATION_CHECKLIST.md)

---

## 📊 Migration Statistics

Vesta platform:
- **40+ tables** to migrate
- **500+ columns** across all tables
- **30+ foreign key relationships**
- **Auto-generated triggers** for timestamps
- **Custom indexes** for performance

---

## 💡 Why Supabase?

### Benefits
- ✅ **Managed PostgreSQL** - No server maintenance
- ✅ **Automatic backups** - Daily backups included
- ✅ **Great dashboard** - SQL editor, table viewer, logs
- ✅ **Real-time** - Built-in pub/sub (optional)
- ✅ **Auth** - Can replace BetterAuth if needed
- ✅ **Storage** - Can replace S3 if needed
- ✅ **Edge Functions** - Serverless compute
- ✅ **Free tier** - Generous limits for development

### Pricing
- **Free:** Perfect for development/staging
- **Pro ($25/mo):** Production-ready with backups
- **Team/Enterprise:** Advanced features

---

## 🚦 Ready to Migrate?

### Schema Only (30 minutes)
👉 **Go to [`QUICK_MIGRATION.md`](./QUICK_MIGRATION.md)**

### Full Migration (3-5 hours)
👉 **Go to [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md)**

---

## 📝 Post-Migration

After successful migration:

1. **Update documentation** - Document the new setup
2. **Train team** - Share Supabase dashboard access
3. **Set up monitoring** - Configure alerts in Supabase
4. **Configure backups** - Verify automatic backups work
5. **Optimize queries** - Add indexes as needed
6. **Celebrate!** 🎉

---

**Good luck with your migration!** 🚀

For questions or issues, check the troubleshooting sections in the guides.
