#!/usr/bin/env bash
# =============================================================
# Personal Hub — Script de setup do ambiente de desenvolvimento
# Uso: chmod +x scripts/setup.sh && ./scripts/setup.sh
# =============================================================
set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()    { echo -e "${BOLD}▶ $1${NC}"; }
ok()     { echo -e "${GREEN}✓ $1${NC}"; }
warn()   { echo -e "${YELLOW}⚠ $1${NC}"; }
error()  { echo -e "${RED}✗ $1${NC}"; exit 1; }

echo ""
echo -e "${BOLD}⚡ Personal Hub — Setup${NC}"
echo "================================"
echo ""

# 1. Verificar Node.js
log "Verificando Node.js..."
node_version=$(node --version 2>/dev/null || echo "")
if [[ -z "$node_version" ]]; then
  error "Node.js não encontrado. Instale em https://nodejs.org (v18+)"
fi
ok "Node.js $node_version"

# 2. Verificar npm
npm_version=$(npm --version 2>/dev/null || echo "")
ok "npm v$npm_version"

# 3. Instalar dependências
log "Instalando dependências..."
npm install
ok "Dependências instaladas"

# 4. Criar .env.local se não existir
log "Configurando variáveis de ambiente..."
if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
  warn "Arquivo .env.local criado — configure suas credenciais antes de continuar!"
  echo ""
  echo "  Edite .env.local com:"
  echo "    - DATABASE_URL    (Supabase/Neon PostgreSQL)"
  echo "    - JWT_SECRET      (mínimo 32 chars)"
  echo "    - OPENAI_API_KEY  (opcional para IA)"
  echo ""
else
  ok ".env.local já existe"
fi

# 5. Gerar Prisma Client
log "Gerando Prisma Client..."
npx prisma generate
ok "Prisma Client gerado"

# 6. Verificar DATABASE_URL
if grep -q 'USER:PASSWORD' .env.local 2>/dev/null; then
  warn "DATABASE_URL ainda não configurado. Configure antes de rodar migrate."
  echo ""
  echo "  Opções recomendadas (gratuitas):"
  echo "    • Supabase: https://supabase.com"
  echo "    • Neon:     https://neon.tech"
  echo "    • Railway:  https://railway.app"
  echo ""
else
  # 7. Rodar migrations
  log "Aplicando migrations do banco de dados..."
  npx prisma migrate dev --name init 2>/dev/null || npx prisma db push
  ok "Banco de dados configurado"

  # 8. Seed opcional
  read -p "Deseja popular o banco com dados de exemplo? (s/N): " seed_confirm
  if [[ "$seed_confirm" =~ ^[sS]$ ]]; then
    log "Rodando seed..."
    npm run db:seed
    ok "Dados de exemplo criados (login: joao@exemplo.com / senha123)"
  fi
fi

echo ""
echo -e "${GREEN}${BOLD}✨ Setup concluído!${NC}"
echo ""
echo "  Para iniciar o servidor de desenvolvimento:"
echo "    npm run dev"
echo ""
echo "  Acesse: http://localhost:3000"
echo ""
