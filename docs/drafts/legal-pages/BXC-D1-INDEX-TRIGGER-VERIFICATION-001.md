# BXC-D1-INDEX-TRIGGER-VERIFICATION-001 | v0.1 | INTERNAL DRAFT
Date: 2026-11-09
Evidence: owner-exported Cloudflare D1 Studio CSV, read-only sqlite_master query limited to indexes and triggers of claims, claim_access, paypal_orders, notification_outbox.
Result: six index rows; zero trigger rows.

## Verified indexes
- claims: idx_claims_status — CREATE INDEX idx_claims_status ON claims(status)
- notification_outbox: idx_notification_outbox_status — CREATE INDEX idx_notification_outbox_status ON notification_outbox(status, created_at)
- notification_outbox: sqlite_autoindex_notification_outbox_1 — SQL definition NULL/empty in export
- paypal_orders: idx_paypal_orders_claim — CREATE INDEX idx_paypal_orders_claim ON paypal_orders(claim_id)
- paypal_orders: sqlite_autoindex_paypal_orders_1 — SQL definition NULL/empty
- paypal_orders: sqlite_autoindex_paypal_orders_2 — SQL definition NULL/empty

No indexes on claim_access were returned by this query (the INTEGER PRIMARY KEY may use the rowid, subject to actual CREATE TABLE definition). No trigger rows were returned for these four tables. The CSV does not reveal the indexed columns of the three autoindexes, the table UNIQUE constraints, or whether other schema objects reference these tables.

## Design implications
- No index on claims(created_at) appears in this inventory. A proposed index should be benchmarked on staging before adding it, rather than assuming a production performance problem.
- Existing paypal_orders(claim_id) index supports checking payment order existence. No PayPal order, regardless of status, may be ignored when evaluating an unpaid claim for deletion.
- Do not infer that the absence of triggers makes deletion safe; three NO ACTION foreign keys were independently verified in BXC-D1-FK-VERIFICATION-001.
- Paid claims and payment evidence remain outside automatic deletion scope.
- Need PRAGMA index_list/index_info and original CREATE TABLE statements to verify UNIQUE definitions and enforcement; review foreign_keys setting and production D1 semantics separately.
- Do not run a DELETE against production.

STATUS: INDEX/TRIGGER INVENTORY VERIFIED; AUTO-INDEX DEFINITIONS OPEN; RELEASE HOLD.
