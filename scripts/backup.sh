#!/usr/bin/env bash
# =============================================================
# Personal Hub — Backup do banco de dados PostgreSQL
# Uso: ./scripts/backup.sh
# Requer: pg_dump instalado (brew install postgresql)
# =============================================================
set -euo pipefail

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/personal_hub_${TIMESTAMP}.sql.gz"

# Carrega .env.local
if [[ -f .env.local ]]; then
  export $(grep -v '^#' .env.local | xargs)
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL não configurado"
  exit 1
fi

# Cria diretório de backups
mkdir -p "$BACKUP_DIR"

echo "📦 Iniciando backup..."
echo "   Destino: $BACKUP_FILE"

# Executa pg_dump e comprime com gzip
pg_dump "$DATABASE_URL" \
  --no-acl \
  --no-owner \
  --format=plain \
  --file=/dev/stdout | gzip > "$BACKUP_FILE"

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "✅ Backup concluído: $BACKUP_FILE ($SIZE)"

# Limpa backups com mais de 30 dias
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete 2>/dev/null || true
echo "🧹 Backups antigos removidos"

# Upload opcional para S3/Supabase Storage
if [[ -n "${BACKUP_S3_BUCKET:-}" ]]; then
  aws s3 cp "$BACKUP_FILE" "s3://${BACKUP_S3_BUCKET}/backups/$(basename $BACKUP_FILE)"
  echo "☁️ Upload para S3 concluído"
fi
