#!/bin/bash

# Script to clean CSV files for PostgreSQL import
# Replaces string "NULL" with empty values

MIGRATION_DIR="/Users/javierperezgarcia/Downloads/migration files"
BACKUP_DIR="/Users/javierperezgarcia/Downloads/migration files/backup"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "🔧 Cleaning CSV files for PostgreSQL import..."
echo "📁 Source: $MIGRATION_DIR"
echo "💾 Backup: $BACKUP_DIR"
echo ""

# Counter for processed files
count=0

# Process each CSV file
for file in "$MIGRATION_DIR"/*.csv; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    echo "Processing: $filename"

    # Backup original file
    cp "$file" "$BACKUP_DIR/$filename"

    # Replace NULL with empty string (preserving commas)
    # This handles: NULL, -> ,
    # And: ,NULL -> ,
    # And: ,NULL, -> ,,
    sed -i '' 's/,NULL,/,,/g' "$file"
    sed -i '' 's/,NULL$/,/g' "$file"
    sed -i '' 's/^NULL,/,/g' "$file"

    # Also handle NULL at start of line after first field
    sed -i '' 's/,NULL\r/,\r/g' "$file"

    count=$((count + 1))
  fi
done

echo ""
echo "✅ Processed $count CSV files"
echo "📋 Original files backed up to: $BACKUP_DIR"
echo ""
echo "🎯 Files are now ready for PostgreSQL import!"
