# 🚀 Migrate to Supabase - Start Here

## ⏱️ 30 Minutes Total

Simple migration guide for moving Vesta from SingleStore to Supabase PostgreSQL.

---

## 📁 What You Have

1. **`QUICK_MIGRATION.md`** ⭐ **Read this first** - Complete step-by-step guide
2. **`QUICK_COMMANDS.md`** - All commands for copy-paste
3. **`QUERY_COMPATIBILITY.md`** - Query changes explanation (spoiler: only 1 line!)
4. **`MIGRATION_README.md`** - Overview
5. **`scripts/convert-schema-to-postgres.ts`** - Automated conversion script
6. **`drizzle.config.postgres.ts`** - PostgreSQL configuration

---

## 🎯 Quick Overview

### What Changes:
- ✅ Schema converted (SingleStore → PostgreSQL)
- ✅ Connection updated (mysql2 → postgres)
- ✅ Environment variables (new Supabase URLs)
- ✅ **1 line in 1 query file** (YEAR → EXTRACT)

### What Stays the Same:
- ✅ All 40+ query files (except 1 line)
- ✅ All your application logic
- ✅ All your React components
- ✅ AWS S3 integration
- ✅ BetterAuth
- ✅ Everything else!

---

## 🚀 The Process

```bash
# 1. Create Supabase project (via dashboard)

# 2. Convert schema
npx tsx scripts/convert-schema-to-postgres.ts

# 3. Deploy schema to Supabase
export POSTGRES_URL_NON_POOLING="your-url"
drizzle-kit push --config=drizzle.config.postgres.ts
psql "$POSTGRES_URL_NON_POOLING" -f supabase/migrations/002_triggers.sql

# 4. Fix the ONE query line
# Edit src/server/queries/properties.ts line 32
# Change: YEAR(...) to EXTRACT(YEAR FROM ...)

# 5. Update app code & .env
# (see QUICK_MIGRATION.md)

# 6. Test
pnpm dev

# 7. Deploy!
```

---

## 📖 Where to Start

👉 **Open [`QUICK_MIGRATION.md`](./QUICK_MIGRATION.md)** and follow step-by-step.

---

## ❓ Quick FAQs

**Q: Do I need to migrate data?**
A: No! You said you have test data. Fresh start with empty tables.

**Q: Do I need to rewrite all my queries?**
A: No! Only 1 line in 1 file changes. Everything else works as-is.

**Q: How long does this take?**
A: 30 minutes total.

**Q: What if something breaks?**
A: Easy rollback - just change env vars back to SingleStore.

**Q: Can I test first?**
A: Yes! Create a staging Supabase project and test there first.

---

## 🎯 Files Breakdown

### Main Guide
- **QUICK_MIGRATION.md** - Full walkthrough with explanations

### Reference
- **QUICK_COMMANDS.md** - Just the commands, no explanations
- **QUERY_COMPATIBILITY.md** - Why queries work with minimal changes
- **MIGRATION_README.md** - Project overview

### Tools
- **scripts/convert-schema-to-postgres.ts** - Automated conversion
- **drizzle.config.postgres.ts** - PostgreSQL Drizzle config

---

## ✅ Success Criteria

You're done when:
- [ ] App starts without errors
- [ ] Can create records (account, property, etc.)
- [ ] Can read/update/delete records
- [ ] No console errors
- [ ] `updated_at` auto-updates

---

## 🆘 Need Help?

1. Check **QUICK_MIGRATION.md** troubleshooting section
2. Look at **QUERY_COMPATIBILITY.md** for query issues
3. Check Supabase Dashboard → Logs for errors

---

**Ready? Open [`QUICK_MIGRATION.md`](./QUICK_MIGRATION.md) and let's go! 🚀**
