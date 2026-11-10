-- BXC sandbox ONLY. Never apply to production database boxvia-claims.
-- Staging baseline reconstructed from SQL queries in the draft handlers.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS claims (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 customer_email TEXT NOT NULL,
 claim_text TEXT NOT NULL,
 source_url TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'new',
 payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending','paid')),
 notes TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS claim_access (
 claim_id INTEGER PRIMARY KEY,
 token_hash TEXT NOT NULL CHECK(length(token_hash)=64),
 FOREIGN KEY(claim_id) REFERENCES claims(id)
);
CREATE TABLE IF NOT EXISTS paypal_orders (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 claim_id INTEGER NOT NULL,
 paypal_order_id TEXT NOT NULL UNIQUE,
 amount TEXT NOT NULL,
 currency TEXT NOT NULL,
 status TEXT NOT NULL,
 capture_id TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(claim_id) REFERENCES claims(id)
);
CREATE INDEX IF NOT EXISTS idx_bxc_sandbox_paypal_claim ON paypal_orders(claim_id);
CREATE TABLE IF NOT EXISTS notification_outbox (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 claim_id INTEGER NOT NULL,
 event_type TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(claim_id,event_type),
 FOREIGN KEY(claim_id) REFERENCES claims(id)
);
CREATE TABLE IF NOT EXISTS contract_checkout_sessions (
 session_id TEXT PRIMARY KEY,
 claim_id INTEGER NOT NULL,
 customer_email TEXT NOT NULL,
 catalog_sha256 TEXT NOT NULL CHECK(length(catalog_sha256)=64),
 expires_at TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','consuming','accepted')),
 snapshot_sha256 TEXT CHECK(snapshot_sha256 IS NULL OR length(snapshot_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(claim_id) REFERENCES claims(id)
);
CREATE INDEX IF NOT EXISTS idx_bxc_sandbox_checkout_claim ON contract_checkout_sessions(claim_id);
CREATE TABLE IF NOT EXISTS contract_acceptance_archive (
 order_id TEXT PRIMARY KEY,
 snapshot_json TEXT NOT NULL,
 snapshot_sha256 TEXT NOT NULL CHECK(length(snapshot_sha256)=64),
 acceptance_evidence_json TEXT NOT NULL,
 acceptance_evidence_sha256 TEXT NOT NULL CHECK(length(acceptance_evidence_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS contract_acceptance_no_update BEFORE UPDATE ON contract_acceptance_archive
BEGIN SELECT RAISE(ABORT,'immutable acceptance archive'); END;
CREATE TRIGGER IF NOT EXISTS contract_acceptance_no_delete BEFORE DELETE ON contract_acceptance_archive
BEGIN SELECT RAISE(ABORT,'immutable acceptance archive'); END;
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
CREATE INDEX IF NOT EXISTS idx_bxc_sandbox_link_claim ON contract_paypal_order_links(claim_id);
CREATE TRIGGER IF NOT EXISTS contract_paypal_link_no_update BEFORE UPDATE ON contract_paypal_order_links
BEGIN SELECT RAISE(ABORT,'immutable PayPal checkout link'); END;
CREATE TRIGGER IF NOT EXISTS contract_paypal_link_no_delete BEFORE DELETE ON contract_paypal_order_links
BEGIN SELECT RAISE(ABORT,'immutable PayPal checkout link'); END;
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
