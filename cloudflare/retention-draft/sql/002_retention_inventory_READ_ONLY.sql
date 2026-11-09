-- BXC D1 METADATA / AGGREGATE INVENTORY — READ ONLY, NOT A DELETE PLAN.
-- Run only after explicit authorization to inspect the intended database.
SELECT name, sql FROM sqlite_master WHERE type IN ('table','index')
 AND name NOT LIKE 'sqlite_%' ORDER BY type, name;
PRAGMA foreign_key_list('claims');
PRAGMA foreign_key_list('claim_access');
PRAGMA foreign_key_list('paypal_orders');
PRAGMA foreign_key_list('notification_outbox');
SELECT payment_status, COUNT(*) AS total FROM claims GROUP BY payment_status;
SELECT status, COUNT(*) AS total FROM paypal_orders GROUP BY status;
SELECT status, COUNT(*) AS total FROM notification_outbox GROUP BY status;
-- Grouped counts do not prove that any record can safely be deleted.
