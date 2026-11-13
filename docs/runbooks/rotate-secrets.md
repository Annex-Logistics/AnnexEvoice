# Runbook — Rotate secrets

Rotate at least every 90 days or immediately on suspected compromise.

## General flow
1. Add the new secret version in **GCP Secret Manager**:
   `gcloud secrets versions add ${NAME} --data-file=-`.
2. Update the deploy workflow if the env var mapping changed.
3. Re-deploy (`docker compose pull && up -d`) so the new version is picked up at container start.
4. Disable the previous version after 24 h once no active sessions / webhook replays use the old value.

## Per-secret notes
- **`JWT_ACCESS_SECRET`**: rotate with a 1-hour overlap — the API accepts both old and new during that window (list of accepted keys in config).
- **`JWT_REFRESH_SECRET`**: same as access; force logout by bumping users' `token_version` if urgent.
- **`PII_ENCRYPTION_KEY`**: never rotate the active key without a dual-key re-encrypt pass. Script: `pnpm --filter api script:rotate-pii-key`.
- **`WHATSAPP_APP_SECRET` / `WHATSAPP_VERIFY_TOKEN`**: change in the Meta app dashboard first, then in Secret Manager, then redeploy.
- **`PAYSTACK_SECRET_KEY`** / **`FLUTTERWAVE_SECRET_KEY`**: rotate in provider dashboard; both old/new accepted for 1 h via `allowSecondarySecret` config.
- **`EINVOICE_APP_*`**: coordinate with the APP partner; some rotations require re-signing certificates.

## Audit
Every rotation is logged in `audit_events` with actor, time, and which secret (not the value).
