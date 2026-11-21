-- Sandbox only. Apply only after verifying the existing D1 schema and backup.
-- Immutable evidence of provider-verified PayPal captures. No historical backfill.
CREATE TABLE IF NOT EXISTS paypal_capture_evidence (
 capture_id TEXT PRIMARY KEY NOT NULL,
 paypal_order_id TEXT NOT NULL,
 order_id TEXT NOT NULL REFERENCES service_orders(id),
 payment_attempt_id TEXT NOT NULL UNIQUE REFERENCES payment_attempts(id),
 amount_minor INTEGER NOT NULL CHECK(amount_minor > 0),
 currency TEXT NOT NULL CHECK(currency = 'USD'),
 capture_digest TEXT NOT NULL CHECK(length(capture_digest) = 64),
 verified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(paypal_order_id),
 UNIQUE(order_id)
);
CREATE INDEX IF NOT EXISTS idx_paypal_capture_evidence_order ON paypal_capture_evidence(order_id);
CREATE TRIGGER IF NOT EXISTS paypal_capture_evidence_no_update
BEFORE UPDATE ON paypal_capture_evidence BEGIN SELECT RAISE(ABORT,'Immutable capture evidence'); END;
CREATE TRIGGER IF NOT EXISTS paypal_capture_evidence_no_delete
BEFORE DELETE ON paypal_capture_evidence BEGIN SELECT RAISE(ABORT,'Immutable capture evidence'); END;
