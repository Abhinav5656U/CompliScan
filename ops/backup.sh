#!/bin/sh
set -eu
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_DIR:=./backups}"
mkdir -p "$BACKUP_DIR"
pg_dump "$DATABASE_URL" --format=custom --file="$BACKUP_DIR/meterolens-$(date -u +%Y%m%dT%H%M%SZ).dump"
find "$BACKUP_DIR" -type f -mtime +30 -delete
