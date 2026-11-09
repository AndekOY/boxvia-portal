-- DRAFT ONLY. Requires 001 migration on isolated staging and verified controls.
-- Returns only aggregate counts; no IDs or PII. No DELETE/UPDATE.
-- Conservative: no control row => not eligible; no PayPal order of ANY status.
-- A successful external reconciliation and absence of disputes must be independently established.
SELECT COUNT(*) AS synthetic_candidate_count
FROM claims AS c
JOIN bxc_retention_control AS r ON r.claim_id = c.id
WHERE c.payment_status = 'pending'
  AND c.created_at <= datetime('now', '-30 days')
  AND r.legal_hold = 0 AND r.dispute_open = 0 AND r.payment_reconciled = 1
  AND NOT EXISTS (SELECT 1 FROM paypal_orders AS p WHERE p.claim_id = c.id)
  AND NOT EXISTS (SELECT 1 FROM notification_outbox AS o WHERE o.claim_id = c.id);
-- Current production cannot be evaluated with this query before approved migration.
-- Do not interpret candidate counts as permission to delete.
