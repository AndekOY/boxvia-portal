# BXC-D1-SQLITE-EXECUTOR-PROTOTYPE-TEST-001 | v0.1 | INTERNAL DRAFT
Date: 2026-11-09
Environment: isolated Python sqlite3 in-memory database, synthetic records only, foreign_keys=ON, BEGIN IMMEDIATE / COMMIT / ROLLBACK. Not Cloudflare D1; no production connection, deployment, migration or deletion.
Local deliverable: bxc_retention_sqlite_prototype_v01.zip (prototype.py, test_prototype.py), provided as a separate downloadable conversation artifact. These Python files have NOT been committed to this GitHub branch.

## Execution
Command: python -m unittest -v
Result: 15 tests, 15 passed, 0 failed.
Tested: approved old unpaid erasure and audit; PayPal order blocks; any outbox evidence blocks; paid blocks; legal hold blocks; dispute blocks; unreconciled blocks; expired/missing approval blocks; recent record blocks; forced failure rolls back token deletion and audit; second execution blocks; payment status change before recheck blocks; missing controls block; FK restricts parent delete.

## Model constraints
Synthetic schema models verified production relations (claim_access, paypal_orders, notification_outbox -> claims, NO ACTION) and unique keys (outbox claim_id/event_type, paypal_orders paypal_order_id/capture_id). The synthetic schema is deliberately reduced and does not reproduce all 30 production columns. No D1 transaction API compatibility or Cloudflare runtime execution was established.

## Risks / release gates
- Transaction callback used in one test is a simulation, not proof of a real concurrent payment capture.
- The synthetic audit table has no tamper-evidence guarantee; immutable external audit storage and data minimization require separate design.
- The prototype blocks any outbox record, including sent; stricter than prior draft, pending legal review of notification retention and idempotency.
- Need actual D1 staging semantics, concurrent writer tests, payment reconciliation authority, DSAR/legal holds, accounting retention, backups and restore.
- No automatic deletion of paid claims or payment evidence.
- Do not port Python SQL verbatim into Worker. Design for supported Cloudflare D1 transactional primitives and independent review.
STATUS: LOCAL SQLITE TEST PASS; D1 UNTESTED; PRODUCTION RELEASE HOLD.
