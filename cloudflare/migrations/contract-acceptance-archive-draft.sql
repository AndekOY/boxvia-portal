-- Draft-only additive migration. DO NOT APPLY without release approval.
-- Full canonical snapshot and evidence retained for reconstructability.
-- Access must be restricted to authorized server-side operations.
CREATE TABLE IF NOT EXISTS contract_acceptance_archive (
  order_id TEXT PRIMARY KEY,
  snapshot_json TEXT NOT NULL,
  snapshot_sha256 TEXT NOT NULL CHECK(length(snapshot_sha256) = 64),
  acceptance_evidence_json TEXT NOT NULL,
  acceptance_evidence_sha256 TEXT NOT NULL CHECK(length(acceptance_evidence_sha256) = 64),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Immutability enforced at the database layer, not merely in application logic.
CREATE TRIGGER IF NOT EXISTS contract_acceptance_no_update
BEFORE UPDATE ON contract_acceptance_archive
BEGIN SELECT RAISE(ABORT, 'immutable acceptance archive'); END;
CREATE TRIGGER IF NOT EXISTS contract_acceptance_no_delete
BEFORE DELETE ON contract_acceptance_archive
BEGIN SELECT RAISE(ABORT, 'immutable acceptance archive'); END;
-- Retention, lawful erasure and data-subject access need a separately approved policy.
