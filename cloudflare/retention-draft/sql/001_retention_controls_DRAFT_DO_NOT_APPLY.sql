-- BXC D1 RETENTION DRAFT v0.1 — NOT AUTHORIZED FOR PRODUCTION.
-- Additive control schema only. No DELETE, DROP or mutation of existing rows.
-- Before applying anywhere, validate D1 SQLite compatibility, migration order,
-- backups, legal retention schedule, referential integrity and release authorization.
-- Foreign key definitions in the current production schema have NOT been verified.
CREATE TABLE IF NOT EXISTS bxc_retention_control (
  claim_id INTEGER PRIMARY KEY,
  legal_hold INTEGER NOT NULL DEFAULT 1 CHECK (legal_hold IN (0,1)),
  dispute_open INTEGER NOT NULL DEFAULT 1 CHECK (dispute_open IN (0,1)),
  payment_reconciled INTEGER NOT NULL DEFAULT 0 CHECK (payment_reconciled IN (0,1)),
  delivery_confirmed_at TEXT,
  token_expires_at TEXT,
  review_after TEXT,
  decision_reference TEXT,
  reviewed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Conservative defaults mean that a missing or new row cannot authorize deletion.
-- No FK cascade: accounting and payment records must not be deleted by implication.
CREATE INDEX IF NOT EXISTS idx_bxc_retention_review ON bxc_retention_control(review_after);
CREATE TABLE IF NOT EXISTS bxc_retention_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_id INTEGER,
  event_type TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  actor_ref TEXT NOT NULL,
  event_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approval_ref TEXT
);
-- Restrict access to audit/control data. This schema is not a complete GDPR design.
