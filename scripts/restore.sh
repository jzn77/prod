#!/usr/bin/env bash
# =============================================================
# Personal Hub — Restauração de backup PostgreSQL
# Uso: ./scripts/restore.sh ./backups/personal_hub_20240610_120000.sql.gz
# =============================================================
set -euo pipefail

BACKUP_FILE="${1:-}"

if [[ -z "$BACKUP_FILE" ]]; then
  echo "Uso: $0 <arquivo_backup.sql.gz>"
  echo ""
  echo "Backups disponíveis:"
  ls -lh ./backups/*.sql.gz 2>/dev/null || echo "  Nenhum backup encontrado em ./backups/"
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "❌ Arquivo não encontrado: $BACKUP_FILE"
  exit 1
fi

if [[ -f .env.local ]]; then
  export $(grep -v '^#' .env.local | xargs)
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL não configurado"
  exit 1
fi

echo "⚠️  ATENÇÃO: Esta operação vai SOBRESCREVER o banco de dados atual!"
echo "   Arquivo: $BACKUP_FILE"
read -p "   Confirme digitando 'RESTAURAR': " confirm

if [[ "$confirm" != "RESTAURAR" ]]; then
  echo "Cancelado."
  exit 0
fi

echo "🔄 Restaurando backup..."
gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL" --quiet
echo "✅ Restauração concluída com sucesso"
