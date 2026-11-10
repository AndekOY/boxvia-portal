-- DRAFT ONLY. Apply only after D1 schema review and release approval.
CREATE TABLE IF NOT EXISTS contract_paypal_reconciliation_audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 incident_key TEXT NOT NULL,
 actor_id TEXT NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('inspection_started','closed_linked','review_required','error')),
 checkout_session_id TEXT NOT NULL,
 paypal_order_id TEXT NOT NULL,
 detail_code TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_paypal_recon_audit_session ON contract_paypal_reconciliation_audit(checkout_session_id,id);
