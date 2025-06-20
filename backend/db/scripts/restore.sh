#!/bin/bash
# restore.sh - Database restore script

if [ $# -ne 1 ]; then
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 backups/lol_decay_backup_20241220_143022.sql.gz"
    exit 1
fi

BACKUP_FILE=$1

# Load environment variables
source .env

echo "🔄 Restoring database from: $BACKUP_FILE"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "📂 Decompressing backup file..."
    TEMP_FILE="/tmp/restore_temp.sql"
    gunzip -c $BACKUP_FILE > $TEMP_FILE
    BACKUP_FILE=$TEMP_FILE
fi

# Confirm restore
read -p "⚠️  This will overwrite the existing database. Continue? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# Restore database
echo "🔄 Restoring database..."
docker exec -i lol_decay_mariadb mysql \
    -u root \
    -p$DB_ROOT_PASSWORD \
    $DB_NAME < $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully!"
    
    # Clean up temp file if created
    if [ "$TEMP_FILE" != "" ]; then
        rm -f $TEMP_FILE
    fi
else
    echo "❌ Restore failed!"
    exit 1
fi
