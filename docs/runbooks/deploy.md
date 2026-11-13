# Runbook — Deploy

## Staging (automatic on `main`)
1. Merge PR into `main`. GitHub Actions → `.github/workflows/deploy-staging.yml`:
   - Build API + worker + web + admin images, tag with git SHA.
   - Push to Artifact Registry `${REGION}-docker.pkg.dev/${PROJECT}/annexevoice/*:${SHA}`.
   - SSH to staging VM via IAP TCP forwarding.
   - `docker compose -f /opt/annexevoice/docker-compose.prod.yml pull`.
   - Run Prisma migrations as a one-off container (`migrate deploy`).
   - `docker compose up -d`.
   - Hit `/health/ready` with 60 s timeout. Any non-200 triggers rollback.
2. If health checks fail: workflow executes rollback step (see `rollback.md`).

## Production (tagged, manual approval)
1. Create and push an annotated tag: `git tag -s vX.Y.Z -m "AnnexEvoice vX.Y.Z"` → `git push origin vX.Y.Z`.
2. GitHub Actions `.github/workflows/deploy-prod.yml` requires approval in the `production` environment.
3. Same steps as staging, against the production VM.
4. Post-deploy: smoke-test `/webhooks/whatsapp` with the Meta tester, create a draft invoice via the web UI, confirm Paystack webhook replay from the dashboard.

## Prereqs
- Service account `annexevoice-deploy@${PROJECT}.iam.gserviceaccount.com` with `roles/iap.tunnelResourceAccessor`, `roles/compute.instanceAdmin.v1` (scoped), `roles/artifactregistry.writer`.
- Workload Identity Federation configured — no JSON keys.
- VM has Ops Agent running and logs flowing to Cloud Logging.
