.PHONY: all build rebuild up down restart clean clean-all logs status

# Default: build frontend locally then start stack
all: build up

# Build the React frontend locally (faster than in Docker)
build:
	cd frontend && npm run build

# Start the Docker stack
up:
	docker compose up -d --build

# Full rebuild: stop, wipe ALL volumes (including MongoDB), rebuild frontend, restart
rebuild: clean-all build up

# Stop containers
down:
	docker compose down

# Restart running containers
restart:
	docker compose restart

# Remove only frontend/cache volumes, keep MongoDB data
clean:
	docker compose down
	docker volume rm hoster_frontend_build hoster_node_modules_cache 2>/dev/null || true

# Nuke everything: containers + ALL volumes (MongoDB included)
clean-all:
	docker compose down -v

# Tail logs (optional: make logs service=backend)
logs:
	docker compose logs -f $(service)

# Show container status
status:
	docker compose ps
