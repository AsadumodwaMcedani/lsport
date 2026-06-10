#!/bin/bash
# Nightly backup. Cron (DirectAdmin): 0 2 * * * /home/USER/lsport/scripts/backup.sh
set -euo pipefail
cd "$(dirname "$0")/.."
source server/.env
DATE=$(date +%Y%m%d)
DIR=~/backups/$DATE
mkdir -p "$DIR"
mariadb-dump -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" | gzip > "$DIR/lbbs_prod_${DATE}.sql.gz"
tar -czf "$DIR/uploads_${DATE}.tar.gz" "$UPLOAD_PATH" 2>/dev/null || true
# Retention: 14 daily; keep Sunday dumps 8 weeks
find ~/backups -maxdepth 1 -type d -mtime +14 ! -newermt "8 weeks ago" -name "*[0-9]" | while read -r d; do
  DOW=$(date -d "$(basename "$d")" +%u 2>/dev/null || echo 0)
  [ "$DOW" != "7" ] && rm -rf "$d"
done
find ~/backups -maxdepth 1 -type d -mtime +56 -exec rm -rf {} +
# Offsite (configure rclone remote 'offsite' once: rclone config)
command -v rclone >/dev/null && rclone copy "$DIR" "offsite:lsport-backups/$DATE" || echo "rclone not configured — backups are LOCAL ONLY"
echo "$(date): backup $DATE done" >> ~/backups/backup.log
