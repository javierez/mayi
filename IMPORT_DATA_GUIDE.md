# 📥 Import Migration Data to Supabase

## ✅ Status: CSV Files Cleaned & Ready

Your CSV files have been cleaned and are ready to import into Supabase PostgreSQL.

- **Source**: `/Users/javierperezgarcia/Downloads/migration files/`
- **Backups**: `/Users/javierperezgarcia/Downloads/migration files/backup/`
- **Files processed**: 13 CSV files (87 rows)
- **Issue fixed**: Replaced `"NULL"` strings with empty values

---

## 📊 What You're Importing

### Core Authentication Tables (Required)
- ✅ `accounts.csv` (1 row) - Inmobiliaria Acropolis
- ✅ `users.csv` (2 rows) - Javi + Amaya
- ✅ `sessions.csv` (59 rows) - Active sessions
- ✅ `account.csv` (2 rows) - BetterAuth OAuth accounts

### Authorization Tables (Required)
- ✅ `roles.csv` (5 rows) - Role definitions
- ✅ `account_roles.csv` (4 rows) - Role permissions per account
- ✅ `user_roles.csv` (2 rows) - User role assignments

### Optional Tables
- ✅ `verification_tokens.csv` (1 row)
- ✅ `website_config.csv` (2 rows)
- ✅ `testimonials.csv` (3 rows)
- ✅ `user_integrations.csv` (4 rows)
- ✅ `mappings.csv` (1 row)
- ✅ `cartel_configurations.csv` (1 row)

---

## 🚀 Import Methods

### Method 1: Supabase Dashboard (Easiest, Recommended)

**Step-by-step for each table:**

1. Go to https://jtohsosajhikznhblzck.supabase.co
2. Click **Table Editor** in left sidebar
3. Select table from dropdown
4. Click **Insert → Import data via spreadsheet**
5. Upload the CSV file
6. Verify column mapping (should auto-detect)
7. Click **Import**

**⚠️ IMPORTANT: Import in this order to avoid foreign key errors:**

```
1. accounts           ← No dependencies
2. users              ← Depends on: accounts
3. roles              ← No dependencies
4. account_roles      ← Depends on: accounts, roles
5. user_roles         ← Depends on: users, roles
6. account            ← Depends on: users (BetterAuth OAuth)
7. sessions           ← Depends on: users
8. verification_tokens
9. website_config
10. testimonials
11. user_integrations
12. mappings
13. cartel_configurations
```

---

### Method 2: Command Line (Faster for bulk import)

**Prerequisites:**
```bash
# Make sure psql is installed
which psql

# Set your database URL
export POSTGRES_URL_NON_POOLING='postgresql://postgres:Meaburroctr360_ves@db.jtohsosajhikznhblzck.supabase.co:5432/postgres'
```

**Run the import script:**
```bash
cd /Users/javierperezgarcia/Downloads/vesta
./scripts/import-to-supabase.sh
```

This will import all tables in the correct order automatically.

---

## 🔍 Verify Import Success

After importing, verify your data:

### Via Supabase Dashboard
1. Go to Table Editor
2. Click each table to see imported rows
3. Check row counts match:
   - accounts: 1 row
   - users: 2 rows
   - sessions: 59 rows
   - roles: 5 rows
   - account_roles: 4 rows
   - user_roles: 2 rows

### Via Command Line
```bash
# Check accounts
psql "$POSTGRES_URL_NON_POOLING" -c "SELECT account_id, name, email FROM accounts;"

# Check users
psql "$POSTGRES_URL_NON_POOLING" -c "SELECT id, name, email, account_id FROM users;"

# Check roles
psql "$POSTGRES_URL_NON_POOLING" -c "SELECT role_id, name FROM roles;"

# Check user roles
psql "$POSTGRES_URL_NON_POOLING" -c "SELECT ur.user_role_id, u.name as user_name, r.name as role_name FROM user_roles ur JOIN users u ON ur.user_id = u.id JOIN roles r ON ur.role_id = r.role_id;"

# Count all rows
psql "$POSTGRES_URL_NON_POOLING" -c "
SELECT 'accounts' as table_name, COUNT(*) FROM accounts
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL SELECT 'roles', COUNT(*) FROM roles
UNION ALL SELECT 'account_roles', COUNT(*) FROM account_roles
UNION ALL SELECT 'user_roles', COUNT(*) FROM user_roles;
"
```

---

## 🐛 Troubleshooting

### Error: "duplicate key value violates unique constraint"
**Solution**: Table already has data. Clear it first:
```sql
-- In Supabase SQL Editor
TRUNCATE accounts CASCADE;  -- This will clear all related tables
```

### Error: "foreign key constraint violated"
**Solution**: Import tables in the order specified above. Parent tables must be imported before child tables.

### Error: "column does not exist"
**Solution**: Check that column names in CSV match your PostgreSQL schema. The cleaning script preserved all original column names.

### Error: "invalid input syntax for type bigint"
**Solution**: Make sure you used the cleaned CSVs (after running `clean-migration-csvs.py`). Check for any remaining `"NULL"` strings.

---

## 🔄 Re-cleaning CSVs (if needed)

If you need to re-clean the CSVs:

```bash
# Restore originals from backup
cp "/Users/javierperezgarcia/Downloads/migration files/backup/"* "/Users/javierperezgarcia/Downloads/migration files/"

# Re-run cleaning script
python3 /Users/javierperezgarcia/Downloads/vesta/scripts/clean-migration-csvs.py
```

---

## ✅ Next Steps After Import

1. **Test Login**
   ```bash
   pnpm dev
   # Visit http://localhost:3000
   # Try logging in as: javierez1998@gmail.com
   ```

2. **Verify Roles & Permissions**
   - Check that users have correct roles
   - Test permission-based access

3. **Check Account Settings**
   - Verify portal settings (Fotocasa API key)
   - Check branding/logo URLs
   - Validate subscription status

4. **Create Test Data**
   - Add a test property
   - Create a test contact
   - Verify all CRUD operations work

---

## 📝 Import Checklist

- [ ] CSV files cleaned (ran `clean-migration-csvs.py`)
- [ ] Backups exist in `backup/` folder
- [ ] Database connection string set (`POSTGRES_URL_NON_POOLING`)
- [ ] Imported `accounts` table
- [ ] Imported `users` table
- [ ] Imported `roles` table
- [ ] Imported `account_roles` table
- [ ] Imported `user_roles` table
- [ ] Imported `account` table (BetterAuth OAuth)
- [ ] Imported `sessions` table
- [ ] Imported optional tables (if needed)
- [ ] Verified row counts match
- [ ] Tested user login
- [ ] Verified permissions work

---

## 🆘 Need Help?

If you encounter issues:

1. Check Supabase Dashboard → Logs for errors
2. Verify the CSV files have empty values (not "NULL")
3. Ensure import order was followed
4. Check that all foreign key references exist

**Common Fix**: Clear all tables and re-import in order:
```sql
-- In Supabase SQL Editor
TRUNCATE accounts, users, roles, account_roles, user_roles, account, sessions, verification_tokens, website_config, testimonials, user_integrations, mappings, cartel_configurations CASCADE;
```

Then re-run the import process.
