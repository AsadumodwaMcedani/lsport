#!/bin/bash
# Rollback to a tagged release: ./scripts/rollback.sh v1.0-phase3
set -euo pipefail
cd "$(dirname "$0")/.."
TAG=${1:?Usage: rollback.sh <tag>}
git fetch --tags && git checkout "$TAG"
(cd server && npm ci --omit=dev)
(cd client && npm ci && npm run build)
pm2 reload ecosystem.config.cjs
echo "✅ Rolled back to $TAG. If a migration broke data, restore: gunzip < ~/backups/<dump>.sql.gz | mariadb -u\$DB_USER -p \$DB_NAME"
