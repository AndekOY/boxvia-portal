# BXC-D1-STAGING-VALIDATION-PLAN-001 | v0.1 | INTERNAL DRAFT / RELEASE HOLD
Date: 2026-11-09
Purpose: validate a disconnected Cloudflare D1 staging copy with synthetic data only. This is a plan, NOT permission to create resources, connect production, run migrations, or delete records.

## A. Current source audit
- cloudflare/retention-draft/d1-retention.mjs is NOT imported by cloudflare/worker.js.
- executeErasure() throws RELEASE_HOLD unconditionally.
- dryRun() is a read-only COUNT query requiring bxc_retention_control, which does not exist in the verified production four-table schema.
- SQL now requires canonical UTC seconds timestamp strings for eligibility; other formats are excluded, not converted. Verify actual production format via aggregate non-PII metadata before any staging test.
- Three extra negative tests were added (18 total); execution of the updated test suite is NOT yet independently verified.

## B. Staging setup after explicit approval
1. Create a new, separately named D1 database; never bind it to the production Worker.
2. Reconstruct all four original table CREATE TABLE statements including UNIQUE and NO ACTION constraints from verified metadata; no customer row exports.
3. Apply draft control schema only to staging, then populate synthetic records with fixed clock values.
4. Confirm PRAGMA foreign_key_list, index_list, index_info, foreign_key_check, triggers, and SQLite version.
5. Run read-only dry-run via a staging-only adapter and compare candidate counts against the pure planner.
6. Validate format variants for created_at: canonical UTC, fractional UTC, timezone offset, SQLite space-separated, malformed, impossible date; only reviewed canonical values may match.
7. Test races with payment capture, outbox insert, legal hold, concurrent writer, expired approval, and missing control row.
8. Validate D1 transactional capabilities and error behavior using official supported APIs; do not port Python BEGIN IMMEDIATE assumptions directly.
9. Test backup/restore, audit evidence, log redaction, and rollback.
10. Obtain legal/tax retention approval, owner authorization, and explicit COS release before any production implementation.

## C. No-go conditions
- Any live payment record, unknown PayPal order, unresolved dispute or reconciliation.
- Unknown legal hold, notification state, or missing control metadata.
- SQL date normalization mismatch or schema drift.
- Unverified transaction atomicity, trigger, foreign key enforcement or restore.
- No approved retention schedule or accounting preservation mechanism.

## D. Decision
Continue with offline source review and local test execution. No staging resource creation or D1 binding change until owner authorizes it. No production change.
STATUS: STAGING PLAN READY; NO STAGING PROVISIONED; RELEASE HOLD.
