#!/usr/bin/env bash
# =============================================================
# Personal Hub — Deploy manual para Vercel
# Uso: ./scripts/deploy.sh [--prod]
# =============================================================
set -euo pipefail

PROD_FLAG=""
if [[ "${1:-}" == "--prod" ]]; then
  PROD_FLAG="--prod"
  echo "🚀 Deploy para PRODUÇÃO"
else
  echo "🔧 Deploy para PREVIEW"
fi

# Verificações pré-deploy
echo ""
echo "▶ Verificando pré-requisitos..."

command -v node >/dev/null 2>&1 || { echo "❌ Node.js não encontrado"; exit 1; }
command -v npx  >/dev/null 2>&1 || { echo "❌ npx não encontrado"; exit 1; }

# Type check
echo "▶ Type check..."
npm run type-check

# Lint
echo "▶ Lint..."
npm run lint

# Build local (verifica se compila)
echo "▶ Build local..."
npm run build

# Migrations (apenas em produção)
if [[ -n "$PROD_FLAG" ]]; then
  echo "▶ Aplicando migrations..."
  if [[ -f .env.local ]]; then
    export $(grep -v '^#' .env.local | xargs)
  fi
  npx prisma migrate deploy
fi

# Deploy
echo "▶ Fazendo deploy..."
npx vercel $PROD_FLAG --yes

echo ""
echo "✅ Deploy concluído!"
