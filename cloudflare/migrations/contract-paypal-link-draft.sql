-- DRAFT ONLY. DO NOT APPLY without owner release approval.
-- Additive one-to-one mapping between verified checkout acceptance and PayPal order.
CREATE TABLE IF NOT EXISTS contract_paypal_order_links (
 checkout_session_id TEXT PRIMARY KEY,
 claim_id INTEGER NOT NULL,
 paypal_order_id TEXT NOT NULL UNIQUE,
 snapshot_sha256 TEXT NOT NULL CHECK(length(snapshot_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(checkout_session_id) REFERENCES contract_checkout_sessions(session_id),
 FOREIGN KEY(claim_id) REFERENCES claims(id),
 FOREIGN KEY(paypal_order_id) REFERENCES paypal_orders(paypal_order_id)
);
CREATE INDEX IF NOT EXISTS idx_contract_paypal_claim ON contract_paypal_order_links(claim_id);
CREATE TRIGGER IF NOT EXISTS contract_paypal_link_no_update BEFORE UPDATE ON contract_paypal_order_links
BEGIN SELECT RAISE(ABORT,'immutable PayPal checkout link'); END;
CREATE TRIGGER IF NOT EXISTS contract_paypal_link_no_delete BEFORE DELETE ON contract_paypal_order_links
BEGIN SELECT RAISE(ABORT,'immutable PayPal checkout link'); END;
-- The actual PayPal create/capture implementation must reject unlinked orders,
-- and handle uncertain provider create responses with operator reconciliation.
