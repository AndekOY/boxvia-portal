-- DRAFT ONLY. Apply only to isolated BXC sandbox after review.
-- One INSERT into this table atomically repairs the PayPal order and link.
-- Trigger RAISE(ABORT) rolls back the entire INSERT and all side effects.
CREATE TABLE IF NOT EXISTS contract_paypal_repair_requests (
 checkout_session_id TEXT PRIMARY KEY,
 claim_id INTEGER NOT NULL,
 paypal_order_id TEXT NOT NULL UNIQUE,
 snapshot_sha256 TEXT NOT NULL CHECK(length(snapshot_sha256)=64),
 request_id TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS contract_paypal_repair_atomic_insert
AFTER INSERT ON contract_paypal_repair_requests
BEGIN
 SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM contract_checkout_sessions s
  JOIN contract_paypal_create_attempts a ON a.checkout_session_id=s.session_id
  JOIN contract_acceptance_archive ar ON ar.order_id=s.session_id
  JOIN claims c ON c.id=s.claim_id
  WHERE s.session_id=NEW.checkout_session_id AND s.claim_id=NEW.claim_id
    AND s.status='accepted' AND s.snapshot_sha256=NEW.snapshot_sha256
    AND ar.snapshot_sha256=NEW.snapshot_sha256
    AND a.claim_id=NEW.claim_id AND a.snapshot_sha256=NEW.snapshot_sha256
    AND a.request_id=NEW.request_id AND a.request_id='bxc-'||NEW.checkout_session_id
    AND a.status='reserved' AND a.paypal_order_id IS NULL
    AND c.payment_status='pending'
 ) THEN RAISE(ABORT,'BXC_REPAIR_INVALID_ACCEPTANCE_OR_ATTEMPT') END;
 SELECT CASE WHEN EXISTS (
  SELECT 1 FROM paypal_orders WHERE claim_id=NEW.claim_id OR paypal_order_id=NEW.paypal_order_id
 ) OR EXISTS (
  SELECT 1 FROM contract_paypal_order_links
  WHERE claim_id=NEW.claim_id OR paypal_order_id=NEW.paypal_order_id
 ) THEN RAISE(ABORT,'BXC_REPAIR_ORDER_CONFLICT') END;
 INSERT INTO paypal_orders (claim_id,paypal_order_id,amount,currency,status)
 VALUES (NEW.claim_id,NEW.paypal_order_id,'20.00','USD','CREATED');
 INSERT INTO contract_paypal_order_links (checkout_session_id,claim_id,paypal_order_id,snapshot_sha256)
 VALUES (NEW.checkout_session_id,NEW.claim_id,NEW.paypal_order_id,NEW.snapshot_sha256);
 UPDATE contract_paypal_create_attempts
 SET status='linked',paypal_order_id=NEW.paypal_order_id,updated_at=CURRENT_TIMESTAMP
 WHERE checkout_session_id=NEW.checkout_session_id AND claim_id=NEW.claim_id
 AND request_id=NEW.request_id AND snapshot_sha256=NEW.snapshot_sha256
 AND status='reserved' AND paypal_order_id IS NULL;
 SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM contract_paypal_create_attempts
  WHERE checkout_session_id=NEW.checkout_session_id AND claim_id=NEW.claim_id
  AND status='linked' AND paypal_order_id=NEW.paypal_order_id
 ) THEN RAISE(ABORT,'BXC_REPAIR_FINAL_STATE_INVALID') END;
END;
