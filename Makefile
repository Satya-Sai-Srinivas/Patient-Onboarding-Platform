# ─────────────────────────────────────────────────────────────────────────────
#  Patient Onboarding — developer shortcuts
#
#  Usage: make <target>
#  Run `make help` to see all available targets.
# ─────────────────────────────────────────────────────────────────────────────

.DEFAULT_GOAL := help
SHELL         := /bin/bash
BACKEND_DIR   := backend
WEB_DIR       := apps/web
MOBILE_DIR    := apps/mobile

# ── Colours ───────────────────────────────────────────────────────────────────
CYAN  := \033[0;36m
RESET := \033[0m

.PHONY: help
help: ## Show this help message
	@echo ""
	@echo "  Patient Onboarding — available targets"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-22s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# ── Setup ─────────────────────────────────────────────────────────────────────

.PHONY: install
install: ## Install all dependencies (JS + Python)
	@echo "→ Installing JS workspaces (pnpm)..."
	pnpm install
	@echo "→ Creating Python virtual environment..."
	python3 -m venv $(BACKEND_DIR)/.venv
	@echo "→ Installing Python dependencies..."
	$(BACKEND_DIR)/.venv/bin/pip install --upgrade pip
	$(BACKEND_DIR)/.venv/bin/pip install -r $(BACKEND_DIR)/requirements.txt
	@echo "✓ All dependencies installed."

.PHONY: install-dev
install-dev: install ## Install dev/test dependencies too
	$(BACKEND_DIR)/.venv/bin/pip install -r $(BACKEND_DIR)/requirements-dev.txt
	@echo "✓ Dev dependencies installed."

# ── Development servers ───────────────────────────────────────────────────────

.PHONY: dev
dev: ## Start web + backend in parallel (requires tmux or runs sequentially)
	@echo "→ Starting backend (port 8000) and web dev server (port 5173)..."
	@trap 'kill 0' SIGINT; \
		$(MAKE) dev-backend & \
		$(MAKE) dev-web & \
		wait

.PHONY: dev-backend
dev-backend: ## Start FastAPI backend with hot-reload
	cd $(BACKEND_DIR) && \
		. .venv/bin/activate && \
		uvicorn main:app --reload --host 0.0.0.0 --port 8000

.PHONY: dev-web
dev-web: ## Start Vite dev server
	pnpm --filter patient-checkin dev

.PHONY: dev-mobile
dev-mobile: ## Start Expo dev server
	pnpm --filter patient-checkin-app start

# ── Build ─────────────────────────────────────────────────────────────────────

.PHONY: build
build: build-web ## Build all production assets

.PHONY: build-web
build-web: ## Build the Vite web app for production
	pnpm --filter patient-checkin build

# ── Linting ───────────────────────────────────────────────────────────────────

.PHONY: lint
lint: lint-backend lint-web ## Run all linters

.PHONY: lint-backend
lint-backend: ## Run Ruff on the Python backend
	cd $(BACKEND_DIR) && .venv/bin/ruff check .

.PHONY: lint-web
lint-web: ## Run ESLint on the web app
	pnpm --filter patient-checkin lint

# ── Formatting ────────────────────────────────────────────────────────────────

.PHONY: format
format: format-backend format-ts ## Format all source files

.PHONY: format-backend
format-backend: ## Auto-format Python with Ruff
	cd $(BACKEND_DIR) && .venv/bin/ruff format .

.PHONY: format-ts
format-ts: ## Auto-format TypeScript/JavaScript with Prettier
	pnpm exec prettier --write "apps/**/*.{ts,tsx,js,jsx,json}"

.PHONY: format-check
format-check: ## Check formatting without writing (CI-friendly)
	cd $(BACKEND_DIR) && .venv/bin/ruff format --check .
	pnpm exec prettier --check "apps/**/*.{ts,tsx,js,jsx,json}"

# ── Testing ───────────────────────────────────────────────────────────────────

.PHONY: test
test: ## Run backend test suite
	cd $(BACKEND_DIR) && \
		. .venv/bin/activate && \
		pytest tests/ -v

.PHONY: test-cov
test-cov: ## Run backend tests with coverage report
	cd $(BACKEND_DIR) && \
		. .venv/bin/activate && \
		pytest tests/ -v --cov=. --cov-report=term-missing --cov-report=html

# ── Docker ────────────────────────────────────────────────────────────────────

.PHONY: docker-up
docker-up: ## Start the full stack with Docker Compose
	docker compose up --build -d
	@echo "✓ Stack running:"
	@echo "   Backend  → http://localhost:8000"
	@echo "   API docs → http://localhost:8000/docs"
	@echo "   Web      → http://localhost:5173"

.PHONY: docker-down
docker-down: ## Stop and remove containers (keeps volumes)
	docker compose down

.PHONY: docker-clean
docker-clean: ## Stop containers AND remove volumes (full reset)
	docker compose down -v
	@echo "✓ Containers and volumes removed."

.PHONY: docker-logs
docker-logs: ## Tail logs from all Compose services
	docker compose logs -f

.PHONY: docker-logs-backend
docker-logs-backend: ## Tail backend logs only
	docker compose logs -f backend

# ── Database ──────────────────────────────────────────────────────────────────

.PHONY: seed
seed: ## Seed the database with sample data (if a seed script exists)
	@if [ -f $(BACKEND_DIR)/seed.py ]; then \
		cd $(BACKEND_DIR) && . .venv/bin/activate && python seed.py; \
	else \
		echo "No seed.py found in $(BACKEND_DIR)/. Skipping."; \
	fi

.PHONY: db-shell
db-shell: ## Open a psql shell inside the running db container
	docker compose exec db psql -U $${DB_USER:-postgres} -d $${DB_NAME:-patient_db}

# ── Utilities ─────────────────────────────────────────────────────────────────

.PHONY: clean
clean: ## Remove all build artefacts and caches
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	rm -rf $(BACKEND_DIR)/.pytest_cache $(BACKEND_DIR)/htmlcov $(BACKEND_DIR)/.coverage
	rm -rf $(BACKEND_DIR)/test.db $(BACKEND_DIR)/test_*.db
	rm -rf $(WEB_DIR)/dist
	@echo "✓ Cleaned."

.PHONY: health
health: ## Hit the /health endpoint of the running backend
	@curl -s http://localhost:8000/health | python3 -m json.tool
