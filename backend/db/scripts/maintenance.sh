#!/bin/bash
# maintenance.sh - Database maintenance script

# Load environment variables
source .env

echo "🔧 Running database maintenance..."

# Clean up expired tokens
echo "🧹 Cleaning expired tokens..."
docker exec lol_decay_mariadb mysql \
    -u root \
    -p$DB_ROOT_PASSWORD \
    -e "
    USE $DB_NAME;
    DELETE FROM refresh_tokens WHERE expires_at < NOW() OR is_revoked = TRUE;
    DELETE FROM email_verification_tokens WHERE expires_at < NOW() OR used_at IS NOT NULL;
    DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used_at IS NOT NULL;
    "

# Optimize tables
echo "⚡ Optimizing tables..."
docker exec lol_decay_mariadb mysql \
    -u root \
    -p$DB_ROOT_PASSWORD \
    -e "
    USE $DB_NAME;
    OPTIMIZE TABLE users, lol_accounts, lol_account_history, refresh_tokens;
    "

# Show database statistics
echo "📊 Database statistics:"
docker exec lol_decay_mariadb mysql \
    -u root \
    -p$DB_ROOT_PASSWORD \
    -e "
    USE $DB_NAME;
    SELECT 
        'Users' as table_name, COUNT(*) as count FROM users
    UNION ALL
    SELECT 
        'Active Accounts' as table_name, COUNT(*) as count FROM lol_accounts WHERE is_active = TRUE
    UNION ALL
    SELECT 
        'Accounts with Decay' as table_name, COUNT(*) as count FROM lol_accounts WHERE decay_days_left IS NOT NULL
    UNION ALL
    SELECT 
        'Active Refresh Tokens' as table_name, COUNT(*) as count FROM refresh_tokens WHERE expires_at > NOW() AND is_revoked = FALSE;
    "

echo "✅ Maintenance completed!"
