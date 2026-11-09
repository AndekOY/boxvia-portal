# BXC D1 Backup Gate — INTERNAL DRAFT / RELEASE HOLD

Date: 2026-11-09. Scope: production Cloudflare D1 instance used by BoxVia. No execution authorization.

## Verified evidence
- Owner-exported aggregate: claims=22; claim_access=21; notification_outbox=2; paypal_orders=20 (65 total).
- Status aggregate: claims paid=2, pending=20; paypal_orders COMPLETED=2, CREATED=18; non-NULL capture_id=2.
- Owner states all transactions were PayPal Sandbox tests and no real PayPal Live receipts. This statement does not independently prove every row's origin.
- No Cloudflare access is connected to this assistant. No backup has been created or verified by this workflow.

## Owner-operated backup procedure
1. Open Cloudflare Dashboard, choose the account, then Storage & databases > D1 > the exact database bound to BoxVia Worker. Verify its database name and ID against Worker bindings. Do not select a similarly named test database.
2. Open Backups or Time Travel (UI labels vary by Cloudflare plan/version). Inspect the available backup/restore/export controls and record the current database ID, UTC time and backup or restore-point identifier.
3. Create an on-demand backup if offered. If not offered, use a documented Cloudflare-supported D1 export workflow with explicit database ID and secure local destination; do not assume a Time Travel restore point is an independently downloadable backup.
4. Verify the backup is listed or that the exported SQL file is complete and readable. Prefer an isolated restore into a NEW, non-production database to prove restorability. Never restore over the production database as a test.
5. Record backup identifier, UTC time, size, method, operator and isolated restore verification. Keep the backup private; it can contain customer emails, claims and payment identifiers.
6. Pause writes, payments and notification scheduling for a separately approved maintenance window, then re-run preflight counts and statuses. If counts differ from the approved snapshot, STOP.

## Mandatory gates before cleanup
- Owner approval for the exact production D1 database ID and destructive SQL.
- PayPal Sandbox/Live reconciliation for two COMPLETED/capture records.
- Confirm retention duties for any payments, accounting, legal holds or disputes; consult Polish legal/tax adviser if necessary.
- Verified backup and isolated restore, no production restore test.
- D1-supported atomic cleanup strategy and safe child-before-parent ordering (FK ON DELETE NO ACTION).
- Rollback and post-check plan; stop writes during cleanup.
- No execution of the commented destructive SQL template until all gates pass.

## What the assistant has NOT done
No backup, export of customer data, D1 staging, D1 mutation, Worker deployment, PayPal action, or deletion.

## Next evidence requested
Screenshot of backup/Time Travel UI or backup identifier and method, database name/ID (nonsecret), UTC time, and result of isolated restore test if available. Do not send customer content or secrets.
