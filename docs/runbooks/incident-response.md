# Runbook — Incident response

## Severity
- **SEV1**: data loss, security breach, invoices non-transmissible > 15 min, payments webhook flow broken.
- **SEV2**: elevated 5xx rate, queue depth > 1000, one provider hard-down with a working fallback.
- **SEV3**: single-tenant issue, UI bug, non-critical sync error.

## First 5 minutes (any SEV)
1. Acknowledge the page. Open `#incident-<timestamp>` channel.
2. Check: Cloud Logging dashboard, Sentry latest issues, `docker compose ps` on the VM.
3. State the hypothesis in channel: "API 5xx spike after 14:02 deploy — suspect migration".

## SEV1 containment
- If a bad deploy: rollback (see `rollback.md`).
- If a leaky query: rotate `JWT_ACCESS_SECRET` + `JWT_REFRESH_SECRET`; `audit_events` queried for scope of exposure; follow NDPA notification rules (72 h to the Nigeria Data Protection Commission if PII affected).
- If NRS APP is down for everyone: pause `einvoice-submit` via `bull-board` (keeps queue; retries resume on unpause).
- Communicate to affected SMEs: short, factual message via WhatsApp broadcast (template approved for this).

## Postmortem
Within 72 h of resolution, file `docs/postmortems/YYYY-MM-DD-<slug>.md`:
- Timeline (UTC).
- Impact (tenants, invoices, duration).
- Root cause (5-whys).
- What went well / badly.
- Action items with owners and dates.

## Contacts
- On-call: PagerDuty rotation `annexevoice-oncall`.
- APP vendor: per vendor onboarding doc.
- Meta WhatsApp support ticket URL in 1Password.
- Paystack technical support: dashboard chat.
- Nigeria Data Protection Commission: notification form URL in 1Password.
