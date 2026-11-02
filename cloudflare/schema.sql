-- Reference schema matching the EXISTING production D1 claims table.
-- Do not execute CREATE TABLE against production to replace or migrate it.
-- Existing production fields verified by Worker and D1 console:
CREATE TABLE IF NOT EXISTS claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  customer_email TEXT NOT NULL,
  claim_text TEXT NOT NULL,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  report_url TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
-- Payment integration must use additive migrations, never recreate claims.
