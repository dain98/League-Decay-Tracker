#!/bin/bash
# setup.sh - Initial setup script

echo "🚀 Setting up LoL Decay Tracker Database..."

# Create necessary directories
mkdir -p config
mkdir -p init-scripts
mkdir -p backups
mkdir -p logs

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=lol_decay_tracker
DB_USER=lol_user
DB_PASSWORD=$(openssl rand -base64 32)
DB_ROOT_PASSWORD=$(openssl rand -base64 32)

# phpMyAdmin (optional)
PHPMYADMIN_PORT=8080

# Application Configuration
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
APP_URL=http://localhost:3000

# Riot API Configuration
RIOT_API_KEY=your_riot_api_key_here
RIOT_API_BASE_URL=https://americas.api.riotgames.com

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Security
BCRYPT_ROUNDS=12

# Environment
NODE_ENV=development
EOF
    echo "✅ .env file created with secure random passwords"
    echo "⚠️  Please update the Riot API key and email settings in .env"
else
    echo "✅ .env file already exists"
fi

# Copy the schema file to init-scripts
cp lol_decay_schema.sql init-scripts/01-schema.sql 2>/dev/null || echo "⚠️  Place your schema SQL file in init-scripts/01-schema.sql"

echo "🐳 Starting Docker containers..."
docker-compose up -d

echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if database is ready
until docker exec lol_decay_mariadb mysqladmin ping -h localhost --silent; do
    echo "Waiting for database connection..."
    sleep 2
done

echo "✅ Database is ready!"
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Update .env with your Riot API key"
echo "   2. Access phpMyAdmin at http://localhost:8080"
echo "   3. Database connection: localhost:3306"
echo "   4. Username: lol_user"
echo "   5. Check logs: docker-compose logs -f mariadb"
echo ""
echo "🔧 Useful commands:"
echo "   - Start: docker-compose up -d"
echo "   - Stop: docker-compose down"
echo "   - Logs: docker-compose logs -f"
echo "   - Backup: ./backup.sh"
echo "   - Restore: ./restore.sh backup_file.sql"
