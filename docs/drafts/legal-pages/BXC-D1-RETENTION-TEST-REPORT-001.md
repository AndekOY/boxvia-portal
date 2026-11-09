# BXC-D1-RETENTION-TEST-REPORT-001 | v0.1 | INTERNAL DRAFT
Date: 2026-11-09
## Local execution
Node built-in test runner: `node --test cloudflare/retention-draft/planner.test.mjs`.
Result: **15 tests, 15 passed, 0 failed**, run locally against an equivalent copy of the committed module and tests. No live Cloudflare, D1 or PayPal test was performed.
Covered: 30-day threshold; recent unpaid; paid; existing and unknown PayPal orders; unreconciled payment; active and unknown legal hold; dispute; pending notification; invalid date/id/time; inclusive threshold; no input mutation.
## Scope and gaps
This verifies only pure function classification. No SQL integration, concurrency, FK, backup/restore, refunds/chargebacks, legal hold approval, D1 migration, token expiry enforcement, provider retention or production deployment was tested.
## Draft migration files
- `001_retention_controls_DRAFT_DO_NOT_APPLY.sql`: additive control and audit tables with fail-closed defaults.
- `002_retention_inventory_READ_ONLY.sql`: schema and aggregate inventory.
- `003_unpaid_candidates_READ_ONLY_AFTER_APPROVAL.sql`: aggregate candidate query requiring staging controls.
None is wired to Worker, scheduled, or executed against production. These files are review artifacts, not migration approval.
## Release status
LOCAL CLASSIFICATION TEST PASS. D1 MIGRATION UNTESTED. NO DELETION EXECUTOR. OWNER/LEGAL/COS GATES OPEN. RELEASE HOLD.

## Additional local SQLite validation
Reconstructed the 30-column application schema in an in-memory SQLite database and executed an equivalent additive control schema and aggregate candidate query. Three synthetic checks passed: default controls exclude the record; explicitly reviewed safe flags allow an old unpaid record; inserting any PayPal order excludes that record. This was **not** a Cloudflare D1 execution and does not validate migrations against production constraints, indexes, triggers or foreign keys.
