#!/bin/bash

# Import cleaned CSV files to Supabase PostgreSQL
# Run this script after cleaning CSVs with clean-migration-csvs.py

MIGRATION_DIR="/Users/javierperezgarcia/Downloads/migration files"
DB_URL="${POSTGRES_URL_NON_POOLING}"

if [ -z "$DB_URL" ]; then
    echo "❌ Error: POSTGRES_URL_NON_POOLING not set"
    echo "💡 Run: export POSTGRES_URL_NON_POOLING='your-connection-string'"
    exit 1
fi

echo "📥 Importing CSV files to Supabase..."
echo ""

# Import order matters due to foreign key constraints
TABLES=(
    "accounts"
    "users"
    "roles"
    "account_roles"
    "user_roles"
    "account"
    "sessions"
    "verification_tokens"
    "website_config"
    "testimonials"
    "user_integrations"
    "mappings"
    "cartel_configurations"
)

for table in "${TABLES[@]}"; do
    csv_file="$MIGRATION_DIR/${table}.csv"

    if [ ! -f "$csv_file" ]; then
        echo "⚠️  Skipping $table (file not found)"
        continue
    fi

    echo "📋 Importing: $table..."

    # Use COPY command to import CSV
    psql "$DB_URL" -c "\COPY $table FROM '$csv_file' WITH (FORMAT csv, HEADER true, NULL '')"

    if [ $? -eq 0 ]; then
        echo "   ✅ Successfully imported $table"
    else
        echo "   ❌ Failed to import $table"
    fi

    echo ""
done

echo "🎉 Import complete!"
echo ""
echo "🔍 Verify your data:"
echo "   psql \"$DB_URL\" -c \"SELECT count(*) FROM accounts;\""
echo "   psql \"$DB_URL\" -c \"SELECT count(*) FROM users;\""
