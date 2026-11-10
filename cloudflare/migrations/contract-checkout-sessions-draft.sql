-- Draft-only. DO NOT APPLY without release authorization.
-- Server-issued one-time session for a verified claim. No client-defined session IDs.
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
CREATE INDEX IF NOT EXISTS idx_contract_checkout_claim ON contract_checkout_sessions(claim_id);
-- A consuming session cannot be automatically reopened after uncertain archival.
-- Reconciliation must inspect the acceptance archive and record operator evidence.
