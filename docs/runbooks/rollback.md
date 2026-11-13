# Runbook — Rollback

## Automatic (deploy health-check failed)
The deploy workflow stores the previous image SHA. On `/health/ready` failure:
1. `docker compose -f /opt/annexevoice/docker-compose.prod.yml` uses the previous SHA via `IMAGE_TAG`.
2. Re-run migrations are **not** re-applied — forward-only Prisma migrations must be backward-compatible with the previous app version (enforced by CI check against the last tagged commit).
3. Workflow fails loudly and pages on-call.

## Manual
1. SSH via IAP: `gcloud compute ssh annexevoice-prod --tunnel-through-iap --project=${PROJECT}`.
2. `cd /opt/annexevoice && IMAGE_TAG=<previous-sha> docker compose pull && docker compose up -d`.
3. Confirm `/health/ready` is 200 and queues drain (`redis-cli LLEN bull:einvoice-submit:wait`).
4. If the rollback also needs a DB migration undo: do **not** run `prisma migrate reset`. Instead apply a forward-fix migration (data-safe) and redeploy.

## Database rollback
Forward-only. If a destructive migration shipped: restore from the most recent GCS backup (see `restore.md`) in a separate instance and selectively copy data back under a maintenance window.
