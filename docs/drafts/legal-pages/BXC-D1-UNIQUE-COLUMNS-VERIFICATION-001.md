# BXC-D1-UNIQUE-COLUMNS-VERIFICATION-001 | v0.1 | INTERNAL DRAFT
Date: 2026-11-09
Evidence: owner-exported Cloudflare D1 Studio CSV (4), read-only pragma_index_info query. Four rows returned.
- notification_outbox.sqlite_autoindex_notification_outbox_1: seqno=0 claim_id; seqno=1 event_type. UNIQUE(claim_id,event_type).
- paypal_orders.sqlite_autoindex_paypal_orders_1: seqno=0 paypal_order_id. UNIQUE(paypal_order_id).
- paypal_orders.sqlite_autoindex_paypal_orders_2: seqno=0 capture_id. UNIQUE(capture_id).
Known schema: capture_id is nullable. SQLite UNIQUE permits multiple NULL values, so this index is not a NOT NULL constraint and does not prove capture completion.
Implications:
1. Preserve outbox idempotency keys; do not erase notification evidence to re-enqueue duplicate event types.
2. Preserve PayPal order/capture uniqueness and payment/accounting evidence.
3. No automatic deletion of paid claims; minimize personal content only after lawful retention/accounting separation.
4. Unpaid candidate requires fresh no-PayPal-order and no-pending-outbox checks, no hold/dispute, authoritative payment reconciliation, and transactional integrity. A UNIQUE constraint alone cannot establish eligibility.
5. Actual FK enforcement state and D1 transaction behavior remain unverified.
Status: INDEX COLUMN COMPOSITION VERIFIED; EXECUTOR UNIMPLEMENTED; RELEASE HOLD.
