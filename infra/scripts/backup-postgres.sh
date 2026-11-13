#!/usr/bin/env bash
# Nightly Postgres backup for AnnexEvoice.
# Writes a pg_dump (custom format), encrypts with age, uploads to GCS, updates a `latest` pointer.
# Scheduled via cron on the VM at 02:00 Africa/Lagos.
set -euo pipefail

: "${BACKUPS_BUCKET:?BACKUPS_BUCKET is required}"
: "${AGE_RECIPIENT:?AGE_RECIPIENT public key is required}"
: "${POSTGRES_DB:=annexevoice}"
: "${POSTGRES_USER:=annexevoice}"

DATE=$(date -u '+%Y/%m/%d')
NAME="annexevoice-$(date -u '+%Y%m%dT%H%M%S').dump"
TMP=/tmp/$NAME
TMP_AGE=/tmp/${NAME}.age

echo "Dumping $POSTGRES_DB…"
docker exec $(docker ps -qf name=postgres) pg_dump --format=custom -U "$POSTGRES_USER" "$POSTGRES_DB" > "$TMP"

echo "Encrypting with age…"
age -r "$AGE_RECIPIENT" -o "$TMP_AGE" "$TMP"
rm "$TMP"

echo "Uploading to gs://$BACKUPS_BUCKET/postgres/$DATE/${NAME}.age"
gsutil cp "$TMP_AGE" "gs://$BACKUPS_BUCKET/postgres/$DATE/${NAME}.age"
gsutil cp "$TMP_AGE" "gs://$BACKUPS_BUCKET/postgres/latest.dump.age"

rm "$TMP_AGE"
echo "Backup complete."
