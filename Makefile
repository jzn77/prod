# =============================================================
# Personal Hub — Makefile
# Atalhos para os comandos mais usados
# Uso: make <alvo>
# =============================================================

.PHONY: help setup dev build start lint type-check \
        db-migrate db-push db-seed db-studio db-reset \
        backup restore deploy deploy-prod test

# Cores
BOLD  = \033[1m
GREEN = \033[0;32m
NC    = \033[0m

help: ## Mostra esta ajuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	| awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BOLD)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# ─── Desenvolvimento ──────────────────────────────────────

setup: ## Configura o ambiente pela primeira vez
	@chmod +x scripts/setup.sh && ./scripts/setup.sh

dev: ## Inicia o servidor de desenvolvimento
	npm run dev

build: ## Gera build de produção
	npm run build

start: ## Inicia o servidor de produção
	npm run start

# ─── Qualidade de código ──────────────────────────────────

lint: ## Roda o linter
	npm run lint

lint-fix: ## Corrige problemas de lint automaticamente
	npm run lint:fix

type-check: ## Verifica tipos TypeScript
	npm run type-check

format: ## Formata o código com Prettier
	npm run format

# ─── Banco de dados ───────────────────────────────────────

db-generate: ## Gera o Prisma Client
	npx prisma generate

db-migrate: ## Aplica migrations em produção
	npx prisma migrate deploy

db-migrate-dev: ## Cria e aplica nova migration em dev
	npx prisma migrate dev

db-push: ## Sincroniza schema sem migrations
	npx prisma db push

db-seed: ## Popula o banco com dados de exemplo
	npm run db:seed

db-studio: ## Abre o Prisma Studio
	npx prisma studio

db-reset: ## CUIDADO: reseta o banco completamente
	npx prisma migrate reset --force

# ─── Deploy ───────────────────────────────────────────────

deploy: ## Deploy de preview no Vercel
	@chmod +x scripts/deploy.sh && ./scripts/deploy.sh

deploy-prod: ## Deploy de produção no Vercel
	@chmod +x scripts/deploy.sh && ./scripts/deploy.sh --prod

# ─── Backup & Restore ─────────────────────────────────────

backup: ## Faz backup do banco de dados
	@chmod +x scripts/backup.sh && ./scripts/backup.sh

restore: ## Restaura um backup (uso: make restore FILE=./backups/xxx.sql.gz)
	@chmod +x scripts/restore.sh && ./scripts/restore.sh $(FILE)

# ─── Utilitários ─────────────────────────────────────────

analyze: ## Analisa o bundle de produção
	ANALYZE=true npm run build

clean: ## Remove arquivos temporários
	rm -rf .next node_modules/.cache

install: ## Instala dependências
	npm install
