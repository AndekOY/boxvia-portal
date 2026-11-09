-- BXC INTERNAL DRAFT | DESTRUCTIVE TEMPLATE | RELEASE HOLD
-- THIS FILE IS NOT APPROVED FOR EXECUTION. DO NOT RUN IN D1.
-- User confirms 65 current rows are tests and none were paid.
-- This is NOT independently verified payment reconciliation.
--
-- Gates before any separately authorized execution:
-- 1. Immutable/restorable backup, restore test, snapshot identifier recorded.
-- 2. Read-only preflight and review of statuses, capture_id, report_url, orphans.
-- 3. PayPal dashboard reconciliation: no captures, refunds, disputes, unsettled orders.
-- 4. Confirm no accounting/legal retention obligations for these specific records.
-- 5. Stop writes and asynchronous notifications during operation.
-- 6. Approve exact database ID, row counts, time window and rollback plan.
-- 7. Confirm D1 transactional execution semantics for installed Wrangler version.
-- 8. Owner separately authorizes destructive operation.
--
-- Deliberately all statements below are COMMENTED OUT.
-- Delete children before parents: NO ACTION foreign keys (no cascade).
-- BEGIN TRANSACTION;
-- DELETE FROM claim_access;
-- DELETE FROM notification_outbox;
-- DELETE FROM paypal_orders;
-- DELETE FROM claims;
-- COMMIT;
--
-- WARNING: D1 may not support explicit BEGIN/COMMIT through execute as written.
-- Before release replace with verified D1-supported atomic operation/batch.
-- Do not run the above by simply removing comments.
--
-- Post-check (READ ONLY, run separately):
SELECT 'claims' AS table_name, COUNT(*) AS row_count FROM claims
UNION ALL SELECT 'claim_access', COUNT(*) FROM claim_access
UNION ALL SELECT 'notification_outbox', COUNT(*) FROM notification_outbox
UNION ALL SELECT 'paypal_orders', COUNT(*) FROM paypal_orders;
PRAGMA foreign_key_check;
