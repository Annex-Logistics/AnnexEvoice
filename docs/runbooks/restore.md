# Runbook — Restore from backup

## Backups
- Nightly 02:00 Africa/Lagos: `pg_dump --format=custom` of `annexevoice`, gzipped, encrypted with age, pushed to `gs://${BACKUPS_BUCKET}/postgres/YYYY/MM/DD.dump.age`.
- Weekly VM disk snapshot (Terraform scheduler), 30-day retention.
- Redis AOF persisted on the VM; not backed up (can be rebuilt).

## Restore to a staging DB
1. Spin up a disposable VM or use local Docker:
   ```bash
   docker run -d --name restore-pg -e POSTGRES_PASSWORD=restore -p 5433:5432 postgres:17
   ```
2. Download the latest dump: `gsutil cp gs://${BACKUPS_BUCKET}/postgres/latest.dump.age /tmp/`.
3. Decrypt: `age -d -i ~/.config/age/restore.key /tmp/latest.dump.age > /tmp/latest.dump`.
4. Restore: `pg_restore -h localhost -p 5433 -U postgres -d postgres --clean --create /tmp/latest.dump`.
5. Validate: run `SELECT count(*) FROM invoices;`, `SELECT max(created_at) FROM audit_events;`.

## Restore to production (last-resort)
1. **Stop the API and worker** (`docker compose stop api worker`) to prevent writes.
2. Rename the live DB: `ALTER DATABASE annexevoice RENAME TO annexevoice_broken;`.
3. Restore the dump into `annexevoice`.
4. Spot-check row counts against the broken DB.
5. Restart services; monitor Sentry + queues.
6. Drop `annexevoice_broken` only after 7 days.

## Rehearsal cadence
Monthly, on the 1st: a GitHub Action spins up a disposable instance, restores last night's dump, runs an integration check, posts a report. If it fails, on-call is paged.
