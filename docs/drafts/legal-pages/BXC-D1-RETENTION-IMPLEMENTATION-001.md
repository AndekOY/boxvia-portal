# BXC-D1-RETENTION-IMPLEMENTATION-001 | v0.1 | INTERNAL DRAFT / RELEASE HOLD
Date: 2026-11-09
Scope: implementation design for Cloudflare Workers/D1, not a production migration.
Related: BXC-DATA-RETENTION-ERASURE-POLICY-001.md and BXC-RETENTION-AUDIT-001.md.

## A. Current verified baseline
D1 application tables: claims, claim_access, paypal_orders, notification_outbox. Current worker.js scheduled handler delivers notifications. Existing DELETE FROM claims is a failed-token-write rollback, not retention. No automatic cleanup was found. Current schema has no legal_hold, dispute_open, fulfillment/delivery date, retention decision log or token expiry fields. Current paypal.js authenticates access token hash without age check. The 30-day unpaid threshold remains an unapproved proposal.

## B. Draft module — deliberately disconnected
`cloudflare/retention-draft/planner.mjs` exports `planUnpaidRetention()`, a pure classification function. `planner.test.mjs` contains synthetic scenarios. Neither file is imported by `cloudflare/worker.js`; no Cron, API route, SQL execution or delete operation is added. The planner accepts **only minimized metadata**, never email, claim text, source URL or secrets. It returns IDs, reason codes and aggregate counts for local dry-run inspection.

The planner is intentionally fail-closed: no candidate if paid, an existing or unknown PayPal order, unresolved payment, pending/unknown notification, legal hold, dispute, unknown hold/dispute status or invalid date. Since the current production schema cannot provide verified `legal_hold=false`, `dispute_open=false` or `payment_reconciled=true`, **no live D1 record may be treated as deletable under this draft**. Do not fabricate these flags or default unknown values to false.

## C. Mandatory implementation sequence
1. Approve category-specific schedule, accounting preservation and legal holds through BXC/BCAF/BQS/COS.
2. Inventory actual FK/index definitions with read-only PRAGMA and verify PayPal refunds/chargebacks, delivery, DSAR, retention controls and backups.
3. Design reviewed migration for legal_hold/dispute status, fulfillment/delivery timestamps, retention review date, separate accounting evidence and token expiry. Include migration rollback and restoration plan.
4. Design authoritative reconciliation check against PayPal and transactional state; protect any record with an order attempt, capture, refund, chargeback or unresolved payment.
5. Provide read-only D1 candidate query with no PII returned, compare results with synthetic planner, review a sample under restricted access. Dry-run output should expose only counts and non-identifying reason codes to general logs.
6. Implement a separate gated deletion executor, **disabled by default**, with transaction boundaries, per-run caps, idempotency, parent/child ordering, legal hold recheck and audit evidence.
7. Separate customer working content from legally required payment/accounting records; no cascade delete of payment evidence.
8. Add server-side token expiry and revocation with user-facing link behavior and tests.
9. Validate retention of notification records, delivery evidence, external mailbox/Resend/PayPal records and D1 Time Travel restoration.
10. Synthetic tests, staging dry-run, negative tests, owner approval, legal/tax review, explicit COS RELEASE and separate production authorization.

## D. Suggested future read-only inventory queries (manual review only)
```sql
SELECT name, sql FROM sqlite_master
WHERE type IN ('table','index') AND name NOT LIKE 'sqlite_%'
ORDER BY type, name;
PRAGMA foreign_key_list('claims');
PRAGMA foreign_key_list('claim_access');
PRAGMA foreign_key_list('paypal_orders');
PRAGMA foreign_key_list('notification_outbox');
SELECT payment_status, COUNT(*) AS total FROM claims GROUP BY payment_status;
SELECT status, COUNT(*) AS total FROM paypal_orders GROUP BY status;
SELECT status, COUNT(*) AS total FROM notification_outbox GROUP BY status;
```
These queries are READ ONLY. Do not export customer rows to GitHub or share secrets. A group count does not prove safe deletion.

## E. Acceptance matrix
- Unpaid > threshold, fully reconciled and no holds: candidate in synthetic dry-run only.
- Unpaid recent: excluded.
- Paid, refunded, disputed, captured or unresolved order: excluded.
- Unknown legal hold, dispute, payment reconciliation or outbox status: excluded.
- Active notification: excluded.
- Invalid dates/IDs: excluded or rejected.
- Repeated planning: deterministic.
- Future executor: race with payment capture, legal hold set between plan and execution, concurrent Cron, failed transaction, backup restore, erasure request with accounting exception.
- No production modification from planning or tests.

## F. Status
DRAFT CODE, NO LIVE QUERIES, NO MIGRATION, NO EXECUTOR, NO DEPLOYMENT.
Release hold remains in force.
