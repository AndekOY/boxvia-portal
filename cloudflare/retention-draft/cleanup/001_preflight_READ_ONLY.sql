-- BXC INTERNAL DRAFT | READ ONLY | 2026-11-09
-- Execute against production ONLY as a read-only inventory.
-- Does not expose personal data, tokens or payment identifiers.
SELECT 'claims' AS table_name, COUNT(*) AS row_count FROM claims
UNION ALL SELECT 'claim_access', COUNT(*) FROM claim_access
UNION ALL SELECT 'notification_outbox', COUNT(*) FROM notification_outbox
UNION ALL SELECT 'paypal_orders', COUNT(*) FROM paypal_orders;
SELECT 'claim_status' AS category,status AS value,COUNT(*) AS row_count FROM claims GROUP BY status
UNION ALL SELECT 'claim_payment_status',payment_status,COUNT(*) FROM claims GROUP BY payment_status
UNION ALL SELECT 'paypal_order_status',status,COUNT(*) FROM paypal_orders GROUP BY status
UNION ALL SELECT 'outbox_status',status,COUNT(*) FROM notification_outbox GROUP BY status
ORDER BY category,value;
SELECT 'paypal_capture_nonnull' AS metric,COUNT(*) AS row_count FROM paypal_orders WHERE capture_id IS NOT NULL
UNION ALL SELECT 'claim_report_nonnull',COUNT(*) FROM claims WHERE report_url IS NOT NULL
UNION ALL SELECT 'orphan_access',COUNT(*) FROM claim_access a LEFT JOIN claims c ON c.id=a.claim_id WHERE c.id IS NULL
UNION ALL SELECT 'orphan_outbox',COUNT(*) FROM notification_outbox o LEFT JOIN claims c ON c.id=o.claim_id WHERE c.id IS NULL
UNION ALL SELECT 'orphan_paypal',COUNT(*) FROM paypal_orders p LEFT JOIN claims c ON c.id=p.claim_id WHERE c.id IS NULL;
PRAGMA foreign_key_check;
