# Makefile for LoL Decay Tracker Database Management

.PHONY: help setup start stop restart logs backup restore clean status monitor

# Default target
help:
	@echo "🎮 LoL Decay Tracker Database Management"
	@echo "======================================="
	@echo ""
	@echo "Available commands:"
	@echo "  setup     - Initial setup (create dirs, .env, start containers)"
	@echo "  start     - Start the database containers"
	@echo "  stop      - Stop the database containers"
	@echo "  restart   - Restart the database containers"
	@echo "  logs      - Show database logs"
	@echo "  backup    - Create database backup"
	@echo "  restore   - Restore database from backup"
	@echo "  status    - Show container status"
	@echo "  monitor   - Show detailed database monitoring"
	@echo "  clean     - Stop containers and remove volumes (DANGEROUS)"
	@echo "  shell     - Open MySQL shell in container"
	@echo "  maintenance - Run database maintenance tasks"
	@echo ""
	@echo "Examples:"
	@echo "  make setup"
	@echo "  make backup"
	@echo "  make restore BACKUP=backups/backup_file.sql.gz"

# Initial setup
setup:
	@echo "🚀 Setting up LoL Decay Tracker Database..."
	@mkdir -p config init-scripts backups logs
	@if [ ! -f .env ]; then \
		echo "📝 Creating .env file..."; \
		echo "DB_HOST=localhost" > .env; \
		echo "DB_PORT=3306" >> .env; \
		echo "DB_NAME=lol_decay_tracker" >> .env; \
		echo "DB_USER=lol_user" >> .env; \
		echo "DB_PASSWORD=$$(openssl rand -base64 32)" >> .env; \
		echo "DB_ROOT_PASSWORD=$$(openssl rand -base64 32)" >> .env; \
		echo "PHPMYADMIN_PORT=8080" >> .env; \
		echo "JWT_SECRET=$$(openssl rand -base64 64)" >> .env; \
		echo "JWT_REFRESH_SECRET=$$(openssl rand -base64 64)" >> .env; \
		echo "✅ .env file created with secure passwords"; \
	fi
	@echo "🐳 Starting containers..."
	@docker-compose up -d
	@echo "⏳ Waiting for database to be ready..."
	@sleep 15
	@echo "✅ Setup complete!"
	@echo "📋 Access phpMyAdmin at http://localhost:8080"

# Start containers
start:
	@echo "🐳 Starting containers..."
	@docker-compose up -d

# Stop containers
stop:
	@echo "🛑 Stopping containers..."
	@docker-compose down

# Restart containers
restart:
	@echo "🔄 Restarting containers..."
	@docker-compose restart

# Show logs
logs:
	@echo "📋 Database logs (Ctrl+C to exit):"
	@docker-compose logs -f mariadb

# Create backup
backup:
	@echo "📦 Creating database backup..."
	@./scripts/backup.sh

# Restore from backup
restore:
ifndef BACKUP
	@echo "❌ Please specify backup file: make restore BACKUP=backups/backup_file.sql.gz"
	@exit 1
endif
	@echo "🔄 Restoring from $(BACKUP)..."
	@./scripts/restore.sh $(BACKUP)

# Show container status
status:
	@echo "📊 Container Status:"
	@docker-compose ps

# Detailed monitoring
monitor:
	@./scripts/monitor.sh

# Database maintenance
maintenance:
	@./scripts/maintenance.sh

# MySQL shell access
shell:
	@echo "🐚 Opening MySQL shell (type 'exit' to quit):"
	@docker exec -it lol_decay_mariadb mysql -u root -p

# Clean everything (DANGEROUS)
clean:
	@echo "⚠️  This will DESTROY all data!"
	@read -p "Are you sure? Type 'yes' to continue: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "🗑️  Removing containers and volumes..."; \
		docker-compose down -v; \
		docker volume rm $$(docker volume ls -q | grep lol) 2>/dev/null || true; \
		echo "✅ Cleanup complete"; \
	else \
		echo "❌ Cleanup cancelled"; \
	fi

# Initialize database with schema
init-db:
	@echo "🗄️  Initializing database with schema..."
	@if [ -f init-scripts/01-schema.sql ]; then \
		docker exec -i lol_decay_mariadb mysql -u root -p$$DB_ROOT_PASSWORD lol_decay_tracker < init-scripts/01-schema.sql; \
		echo "✅ Database schema initialized"; \
	else \
		echo "❌ Schema file not found at init-scripts/01-schema.sql"; \
	fi
