-- DRAFT ONLY. Do not apply without approval and schema review.
CREATE TABLE IF NOT EXISTS contract_paypal_create_attempts (
 checkout_session_id TEXT PRIMARY KEY,
 claim_id INTEGER NOT NULL,
 request_id TEXT NOT NULL UNIQUE,
 snapshot_sha256 TEXT NOT NULL CHECK(length(snapshot_sha256)=64),
 status TEXT NOT NULL DEFAULT 'reserved' CHECK(status IN ('reserved','linked','review_required')),
 paypal_order_id TEXT UNIQUE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(checkout_session_id) REFERENCES contract_checkout_sessions(session_id),
 FOREIGN KEY(claim_id) REFERENCES claims(id)
);
CREATE INDEX IF NOT EXISTS idx_contract_paypal_attempt_claim ON contract_paypal_create_attempts(claim_id);
-- Never delete or replace an uncertain attempt automatically.
