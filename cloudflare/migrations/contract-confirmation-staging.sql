-- STAGING ONLY. Additive migration, not applied to production.
-- Apply only after verified schema and approved retention policy.
CREATE TABLE IF NOT EXISTS contract_confirmations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL UNIQUE,
  product_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  snapshot_sha256 TEXT NOT NULL,
  terms_version TEXT NOT NULL,
  schedule_version TEXT NOT NULL,
  pdf_sha256 TEXT,
  private_object_key TEXT,
  generated_at TEXT,
  email_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (email_status IN ('pending','sending','provider_accepted','delivered','bounced','failed')),
  resend_message_id TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  email_accepted_at TEXT,
  email_delivered_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ((pdf_sha256 IS NULL AND private_object_key IS NULL) OR
         (pdf_sha256 IS NOT NULL AND private_object_key IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contract_confirmations_resend
  ON contract_confirmations(resend_message_id) WHERE resend_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contract_confirmations_pending
  ON contract_confirmations(email_status, updated_at);
-- Keep accepted snapshot and statutory document versions in a separate immutable
-- object or versioned store. No storage/retention assumption is made here.
