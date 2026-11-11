-- BXC DRAFT ONLY — additive migration, NOT applied to production.
-- Apply to an isolated sandbox D1 after reviewing existing checkout and PayPal migrations.
-- Contract formation is recorded only after independently verified PayPal capture.
CREATE TABLE IF NOT EXISTS bxc_contract_formations (
  claim_id INTEGER NOT NULL UNIQUE,
  checkout_session_id TEXT NOT NULL UNIQUE,
  snapshot_sha256 TEXT NOT NULL,
  paypal_order_id TEXT NOT NULL UNIQUE,
  capture_id TEXT NOT NULL UNIQUE,
  amount TEXT NOT NULL CHECK(amount = '20.00'),
  currency TEXT NOT NULL CHECK(currency = 'USD'),
  formed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (claim_id, paypal_order_id),
  FOREIGN KEY (claim_id) REFERENCES claims(id)
);
CREATE INDEX IF NOT EXISTS idx_bxc_contract_formations_capture ON bxc_contract_formations(capture_id);
