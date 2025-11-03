#!/usr/bin/env python3

"""
Import cleaned CSV files to Supabase PostgreSQL
Handles proper column mapping and data conversion
"""

import os
import csv
import psycopg2
from pathlib import Path

MIGRATION_DIR = Path("/Users/javierperezgarcia/Downloads/migration files")
DB_URL = "postgresql://postgres:Meaburroctr360_ves@db.jtohsosajhikznhblzck.supabase.co:5432/postgres"

def import_accounts():
    """Import accounts table"""
    print("📋 Importing accounts...")

    with open(MIGRATION_DIR / "accounts.csv", 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    for row in rows:
        # Convert empty strings to None for proper NULL handling
        for key in row:
            if row[key] == '':
                row[key] = None

        cur.execute("""
            INSERT INTO accounts (
                account_id, name, short_name, legal_name, logo, address, phone, email, website,
                tax_id, collegiate_number, registry_details, legal_email, jurisdiction,
                privacy_email, dpo_email, portal_settings, payment_settings, preferences,
                terms, onboarding_data, plan, subscription_type, subscription_status,
                subscription_start_date, subscription_end_date, status, created_at,
                updated_at, is_active, account_type
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s::jsonb, %s::jsonb, %s::jsonb, %s::jsonb, %s::jsonb,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """, (
            row['account_id'], row['name'], row['short_name'], row['legal_name'],
            row['logo'], row['address'], row['phone'], row['email'], row['website'],
            row['tax_id'], row['collegiate_number'], row['registry_details'],
            row['legal_email'], row['jurisdiction'], row['privacy_email'], row['dpo_email'],
            row['portal_settings'], row['payment_settings'], row['preferences'],
            row['terms'], row['onboarding_data'],
            row['plan'], row['subscription_type'], row['subscription_status'],
            row['subscription_start_date'], row['subscription_end_date'],
            row['status'], row['created_at'], row['updated_at'],
            row['is_active'], row['account_type']
        ))

    conn.commit()
    cur.close()
    conn.close()
    print("   ✅ Imported 1 account")

def import_users():
    """Import users table"""
    print("📋 Importing users...")

    with open(MIGRATION_DIR / "users.csv", 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    for row in rows:
        for key in row:
            if row[key] == '':
                row[key] = None

        cur.execute("""
            INSERT INTO users (
                id, name, email, email_verified, email_verified_at, image,
                created_at, updated_at, password, account_id, first_name, last_name,
                phone, timezone, language, preferences, last_login, is_verified, is_active
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s, %s
            )
        """, (
            row['id'], row['name'], row['email'], row['email_verified'],
            row['email_verified_at'], row['image'], row['created_at'], row['updated_at'],
            row['password'], row['account_id'], row['first_name'], row['last_name'],
            row['phone'], row['timezone'], row['language'], row['preferences'],
            row['last_login'], row['is_verified'], row['is_active']
        ))

    conn.commit()
    cur.close()
    conn.close()
    print(f"   ✅ Imported {len(rows)} users")

def import_roles():
    """Import roles table"""
    print("📋 Importing roles...")

    with open(MIGRATION_DIR / "roles.csv", 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    for row in rows:
        for key in row:
            if row[key] == '':
                row[key] = None

        cur.execute("""
            INSERT INTO roles (
                role_id, name, description, permissions, created_at, updated_at, is_active
            ) VALUES (
                %s, %s, %s, %s::jsonb, %s, %s, %s
            )
        """, (
            row['role_id'], row['name'], row['description'], row['permissions'],
            row['created_at'], row['updated_at'], row['is_active']
        ))

    conn.commit()
    cur.close()
    conn.close()
    print(f"   ✅ Imported {len(rows)} roles")

def import_account_roles():
    """Import account_roles table"""
    print("📋 Importing account_roles...")

    with open(MIGRATION_DIR / "account_roles.csv", 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    for row in rows:
        for key in row:
            if row[key] == '':
                row[key] = None

        cur.execute("""
            INSERT INTO account_roles (
                account_role_id, role_id, account_id, permissions, is_system,
                created_at, updated_at, is_active
            ) VALUES (
                %s, %s, %s, %s::jsonb, %s, %s, %s, %s
            )
        """, (
            row['account_role_id'], row['role_id'], row['account_id'],
            row['permissions'], row['is_system'], row['created_at'],
            row['updated_at'], row['is_active']
        ))

    conn.commit()
    cur.close()
    conn.close()
    print(f"   ✅ Imported {len(rows)} account_roles")

def import_user_roles():
    """Import user_roles table"""
    print("📋 Importing user_roles...")

    with open(MIGRATION_DIR / "user_roles.csv", 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    for row in rows:
        for key in row:
            if row[key] == '':
                row[key] = None

        cur.execute("""
            INSERT INTO user_roles (
                user_role_id, user_id, role_id, created_at, updated_at, is_active
            ) VALUES (
                %s, %s, %s, %s, %s, %s
            )
        """, (
            row['user_role_id'], row['user_id'], row['role_id'],
            row['created_at'], row['updated_at'], row['is_active']
        ))

    conn.commit()
    cur.close()
    conn.close()
    print(f"   ✅ Imported {len(rows)} user_roles")

def import_account():
    """Import account (OAuth) table"""
    print("📋 Importing account (OAuth)...")

    with open(MIGRATION_DIR / "account.csv", 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    for row in rows:
        for key in row:
            if row[key] == '':
                row[key] = None

        cur.execute("""
            INSERT INTO account (
                id, account_id, provider_id, user_id, access_token, refresh_token,
                id_token, access_token_expires_at, refresh_token_expires_at,
                scope, password, created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """, (
            row['id'], row['account_id'], row['provider_id'], row['user_id'],
            row['access_token'], row['refresh_token'], row['id_token'],
            row['access_token_expires_at'], row['refresh_token_expires_at'],
            row['scope'], row['password'], row['created_at'], row['updated_at']
        ))

    conn.commit()
    cur.close()
    conn.close()
    print(f"   ✅ Imported {len(rows)} OAuth accounts")

def import_sessions():
    """Import sessions table"""
    print("📋 Importing sessions...")

    with open(MIGRATION_DIR / "sessions.csv", 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    count = 0
    for row in rows:
        for key in row:
            if row[key] == '':
                row[key] = None

        try:
            cur.execute("""
                INSERT INTO sessions (
                    id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s
                )
            """, (
                row['id'], row['expires_at'], row['token'], row['created_at'],
                row['updated_at'], row['ip_address'], row['user_agent'], row['user_id']
            ))
            count += 1
        except Exception as e:
            print(f"   ⚠️  Skipped session {row['id']}: {e}")

    conn.commit()
    cur.close()
    conn.close()
    print(f"   ✅ Imported {count} sessions")

def main():
    print("📥 Importing CSV files to Supabase PostgreSQL...")
    print(f"🔗 Database: db.jtohsosajhikznhblzck.supabase.co")
    print()

    try:
        # Import in correct order (respecting foreign keys)
        import_accounts()
        import_users()
        import_roles()
        import_account_roles()
        import_user_roles()
        import_account()
        import_sessions()

        print()
        print("🎉 Import complete!")
        print()
        print("🔍 Verify your data:")
        print("   Visit: https://jtohsosajhikznhblzck.supabase.co")
        print("   Go to: Table Editor")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
