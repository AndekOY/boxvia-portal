# BXC Fulfillment — isolated D1 staging plan

**INTERNAL DRAFT / RELEASE HOLD — DO NOT DEPLOY OR APPLY TO PRODUCTION.**

## Verified baseline
The draft retention staging schema reproduces four verified application tables and their FK/UNIQUE constraints. The earlier fulfillment `schema.sql` contains a **minimal synthetic claims stub** and MUST NOT be used as a migration. The new `001_additive_fulfillment_DRAFT.sql` is additive: it creates only `bxc_fulfillment`, `bxc_fulfillment_events` and an index, with foreign keys to the preexisting `claims` table.

## Separation controls
- Do not use production D1 name `boxvia-claims`, production database_id, production wrangler config or production credentials.
- Obtain owner approval before creating a **remote** staging D1. No remote staging resource is claimed to exist.
- Prefer local Wrangler D1 using an isolated configuration and synthetic seed; verify actual Wrangler commands on installed version.
- Never import the real production SQL backup into staging unless a separate approved data-protection procedure anonymizes it first. The backup contains personal information.
- The migration is a **draft** and has not been applied anywhere.
- Do not import fulfillment code into Worker, schedule jobs, or activate erasure.
- Verify `PRAGMA foreign_key_check`, all 4 base tables, uniqueness, and state transitions after a local-only application.
- `CREATE TABLE IF NOT EXISTS` does not prove matching schema if a table already exists. Check `sqlite_master` and `PRAGMA table_info` before trusting results.

## Proposed local-only workflow (manual, after config review)
1. Build a fresh isolated local D1 from `cloudflare/retention-draft/staging/schema.sql` and `seed.sql` using a **new local-only Wrangler config**.
2. Apply `001_additive_fulfillment_DRAFT.sql` to that isolated local D1 only.
3. Run `002_verify_READ_ONLY.sql`; expected 6 application/control tables plus the new fulfillment event table (7 total if counting bxc_retention_control).
4. Execute synthetic atomic transition tests. SQLite's `BEGIN/COMMIT` interface is not a substitute for testing the actual D1 Worker API transaction semantics. Validate D1-specific transaction support separately.
5. Document all results, then seek explicit authorization for a distinct remote staging environment.

## Design gates
Payment reconciliation and verified capture, legal hold/dispute, actor authorization, authentic delivery proof, atomic state + event write, concurrency, idempotency, retention clock and Polish legal review are unresolved. The additive schema alone enforces none of these end-to-end.

**Release hold remains.**
