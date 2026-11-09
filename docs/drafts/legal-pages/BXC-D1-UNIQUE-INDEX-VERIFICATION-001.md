# BXC-D1-UNIQUE-INDEX-VERIFICATION-001 | v0.1 | INTERNAL DRAFT
Date: 2026-11-09
Evidence: owner-provided D1 Studio CSV export (3), read-only PRAGMA index_list for notification_outbox and paypal_orders.
Five rows returned:
| table | index | is_unique | origin |
|---|---|---:|---|
| notification_outbox | idx_notification_outbox_status | 0 | c |
| notification_outbox | sqlite_autoindex_notification_outbox_1 | 1 | u |
| paypal_orders | idx_paypal_orders_claim | 0 | c |
| paypal_orders | sqlite_autoindex_paypal_orders_2 | 1 | u |
| paypal_orders | sqlite_autoindex_paypal_orders_1 | 1 | u |

Interpretation: three automatic indexes enforce table UNIQUE constraints (origin=u), while two indexes were created explicitly and are nonunique (origin=c). The exported metadata does NOT establish which columns compose the unique indexes. No unique index information for claims or claim_access was requested in this export. Do not infer specific unique keys.
Design requirement: preserve all uniqueness constraints during migrations; never delete payment/order or notification evidence merely to bypass a unique conflict. Read-only PRAGMA index_xinfo is needed to identify index columns.
STATUS: UNIQUENESS VERIFIED; COLUMN COMPOSITION OPEN; RELEASE HOLD.
