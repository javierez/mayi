#!/usr/bin/env python3

"""
Clean CSV files for PostgreSQL import
Replaces string "NULL" with empty values
"""

import os
import csv
import shutil
from pathlib import Path

MIGRATION_DIR = Path("/Users/javierperezgarcia/Downloads/migration files")
BACKUP_DIR = MIGRATION_DIR / "backup"

def clean_csv_file(file_path: Path) -> int:
    """Clean a single CSV file, replacing 'NULL' strings with empty values"""

    # Read the CSV
    rows = []
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            # Replace 'NULL' with empty string in each cell
            cleaned_row = ['' if cell == 'NULL' else cell for cell in row]
            rows.append(cleaned_row)

    # Write back to the same file
    with open(file_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(rows)

    return len(rows) - 1  # Return row count (minus header)

def main():
    print("🔧 Cleaning CSV files for PostgreSQL import...")
    print(f"📁 Source: {MIGRATION_DIR}")
    print(f"💾 Backup: {BACKUP_DIR}")
    print()

    # Create backup directory
    BACKUP_DIR.mkdir(exist_ok=True)

    # Process each CSV file
    csv_files = list(MIGRATION_DIR.glob("*.csv"))
    total_files = 0
    total_rows = 0

    for file_path in csv_files:
        filename = file_path.name
        print(f"Processing: {filename}...", end=" ")

        # Backup original file
        backup_path = BACKUP_DIR / filename
        shutil.copy2(file_path, backup_path)

        # Clean the file
        row_count = clean_csv_file(file_path)

        print(f"✅ ({row_count} rows)")
        total_files += 1
        total_rows += row_count

    print()
    print(f"✅ Processed {total_files} CSV files ({total_rows} total rows)")
    print(f"📋 Original files backed up to: {BACKUP_DIR}")
    print()
    print("🎯 Files are now ready for PostgreSQL import!")
    print()
    print("💡 To import in Supabase:")
    print("   1. Go to Table Editor")
    print("   2. Select a table")
    print("   3. Click 'Import data via spreadsheet'")
    print("   4. Upload the cleaned CSV")

if __name__ == "__main__":
    main()
