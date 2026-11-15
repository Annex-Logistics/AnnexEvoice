# build-instructions — handoff to the next Claude Code session

This folder is a self-contained handoff. Read it, then start work.

## What's in here
- `SESSION.md` — the primary handoff. Read this first.
- `PHASES.md` — per-phase log, every commit explained, every lesson learned.
- `RESUME.md` — the exact shell commands to clone, bring Postgres/Redis up, migrate, seed, boot the stack, and run the smoke test.
- `GOTCHAS.md` — the traps we hit and how we fixed each one.
- `STACK.md` — the architecture and contracts at a glance (what every module owns, where RLS lives, how webhooks flow).
- `NEXT.md` — prioritized backlog with context, so the next session knows what to pick up.
- `COMMITS.md` — every commit on `main`, with one line of context.

## One-line summary
AnnexEvoice is a WhatsApp-first NRS-compliant e-invoicing platform for Nigerian SMEs. 15 phases A–O are complete: the full invoice lifecycle (WhatsApp → draft → issue → MOCK IRN transmission → Paystack webhook → reconcile → PAID), credit notes, per-tenant API keys, admin cross-tenant view, and PostgreSQL Row-Level Security are all working end-to-end on a local Postgres 16 + Redis 7 setup. 18/18 smoke checks and 16/16 unit tests are green.

## When you resume
1. Open `RESUME.md`. Those commands bring the whole stack back up.
2. Check `NEXT.md`. Pick the highest-priority item.
3. Follow the usual pattern we established: write code → `pnpm build` → test → commit → push.
