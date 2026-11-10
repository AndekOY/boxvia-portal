-- BXC Stage 12 / READ-ONLY D1 schema preflight.
-- Target: boxvia-bxc-sandbox ONLY. Do not run migrations yet.
-- This script does not write to any table.
SELECT type,name,tbl_name,sql
FROM sqlite_master
WHERE (type='table' AND name IN (
 'claims','contract_checkout_sessions','contract_acceptance_archive',
 'contract_paypal_create_attempts','contract_paypal_order_links',
 'paypal_orders','contract_paypal_repair_requests'))
 OR (type IN ('index','trigger') AND tbl_name IN (
 'claims','contract_checkout_sessions','contract_acceptance_archive',
 'contract_paypal_create_attempts','contract_paypal_order_links',
 'paypal_orders','contract_paypal_repair_requests'))
ORDER BY CASE type WHEN 'table' THEN 0 WHEN 'index' THEN 1 ELSE 2 END,tbl_name,name;

-- Run separately if Cloudflare console displays only one result set:
SELECT 'claims' AS table_name,COUNT(*) AS row_count FROM claims
UNION ALL SELECT 'contract_checkout_sessions',COUNT(*) FROM contract_checkout_sessions
UNION ALL SELECT 'contract_acceptance_archive',COUNT(*) FROM contract_acceptance_archive
UNION ALL SELECT 'contract_paypal_create_attempts',COUNT(*) FROM contract_paypal_create_attempts
UNION ALL SELECT 'contract_paypal_order_links',COUNT(*) FROM contract_paypal_order_links
UNION ALL SELECT 'paypal_orders',COUNT(*) FROM paypal_orders;

-- Validate there is no orphaned or contradictory existing payment link.
SELECT l.checkout_session_id,l.claim_id,l.paypal_order_id,
 CASE
  WHEN s.session_id IS NULL THEN 'MISSING_SESSION'
  WHEN s.claim_id<>l.claim_id THEN 'CLAIM_MISMATCH'
  WHEN s.status<>'accepted' THEN 'NOT_ACCEPTED'
  WHEN s.snapshot_sha256 IS NULL OR s.snapshot_sha256<>l.snapshot_sha256 THEN 'SNAPSHOT_MISMATCH'
  WHEN p.paypal_order_id IS NULL THEN 'MISSING_PAYPAL_ORDER'
  WHEN p.claim_id<>l.claim_id THEN 'PAYPAL_CLAIM_MISMATCH'
  ELSE 'STRUCTURALLY_CONSISTENT'
 END AS structural_check
FROM contract_paypal_order_links l
LEFT JOIN contract_checkout_sessions s ON s.session_id=l.checkout_session_id
LEFT JOIN paypal_orders p ON p.paypal_order_id=l.paypal_order_id;
-- Important: STRUCTURALLY_CONSISTENT does not authenticate acceptance evidence.
