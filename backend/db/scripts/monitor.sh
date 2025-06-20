#!/bin/bash
# monitor.sh - Database monitoring script

# Load environment variables
source .env

echo "📊 Database Status Monitor"
echo "========================="

# Container status
echo "🐳 Container Status:"
docker ps --filter name=lol_decay_mariadb --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""

# Database connection test
echo "🔌 Connection Test:"
if docker exec lol_decay_mariadb mysqladmin ping -h localhost --silent; then
    echo "✅ Database is responding"
else
    echo "❌ Database is not responding"
fi

echo ""

# Disk usage
echo "💾 Disk Usage:"
docker exec lol_decay_mariadb df -h /var/lib/mysql

echo ""

# Database size
echo "📏 Database Size:"
docker exec lol_decay_mariadb mysql \
    -u root \
    -p$DB_ROOT_PASSWORD \
    -e "
    SELECT 
        table_schema as 'Database',
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as 'Size (MB)'
    FROM information_schema.tables 
    WHERE table_schema = '$DB_NAME'
    GROUP BY table_schema;
    "

echo ""

# Process list
echo "🔄 Active Connections:"
docker exec lol_decay_mariadb mysql \
    -u root \
    -p$DB_ROOT_PASSWORD \
    -e "SHOW PROCESSLIST;"

echo ""

# Recent slow queries (if slow query log is enabled)
echo "🐌 Slow Query Log (last 10 lines):"
docker exec lol_decay_mariadb tail -n 10 /var/log/mysql/slow.log 2>/dev/null || echo "Slow query log not available"
