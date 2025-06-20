#!/bin/bash
# backup.sh - Database backup script

# Load environment variables
source .env

# Create backup filename with timestamp
BACKUP_FILE="backups/lol_decay_backup_$(date +%Y%m%d_%H%M%S).sql"

echo "📦 Creating database backup..."

# Create backup
docker exec lol_decay_mariadb mysqldump \
    -u root \
    -p$DB_ROOT_PASSWORD \
    --routines \
    --triggers \
    --single-transaction \
    --lock-tables=false \
    $DB_NAME > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully: $BACKUP_FILE"
    
    # Compress the backup
    gzip $BACKUP_FILE
    echo "🗜️  Backup compressed: $BACKUP_FILE.gz"
    
    # Keep only last 7 backups
    find backups/ -name "lol_decay_backup_*.sql.gz" -type f -mtime +7 -delete
    echo "🧹 Old backups cleaned up"
else
    echo "❌ Backup failed!"
    exit 1
fi
