#!/bin/bash
# LS Port production deploy. Run on server from repo root.
set -euo pipefail
cd "$(dirname "$0")/.."
TS=$(date +%Y%m%d_%H%M%S)
echo "== Pre-deploy DB backup =="
mkdir -p ~/backups
source server/.env 2>/dev/null || true
mariadb-dump -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" | gzip > ~/backups/predeploy_${TS}.sql.gz

echo "== Pull main =="
git fetch origin && git checkout main && git pull origin main
NEW=$(git rev-parse --short HEAD)

echo "== Install & migrate =="
(cd server && npm ci --omit=dev && npx knex migrate:latest)
echo "== Build client =="
(cd client && npm ci && npm run build)

echo "== Reload PM2 =="
pm2 reload ecosystem.config.cjs --update-env

echo "== Health check =="
sleep 3
if curl -fsS http://127.0.0.1:3000/api/v1/health > /dev/null; then
  echo "✅ Deploy OK at commit $NEW ($TS)"
else
  echo "❌ HEALTH CHECK FAILED. Rollback: ./scripts/rollback.sh <previous-tag>; DB dump: ~/backups/predeploy_${TS}.sql.gz"
  exit 1
fi
